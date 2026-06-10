// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentQuestion = 0;
let answers = {};
let ragu = {};
let soal = [];
let token = "";
let nama = "";
let timer = null;
let isDone = false;
let timeLeft = 3600;
let isLoggedIn = false;
let calcMemory = 0;
let completionTimeSeconds = 0;
const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

// ==========================================
// SAVE & LOAD STATE
// ==========================================
function saveState() {
    localStorage.setItem("cbt_answers", JSON.stringify(answers));
    localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
    localStorage.setItem("cbt_current", currentQuestion);
    localStorage.setItem("cbt_time", timeLeft);
    localStorage.setItem("cbt_isLoggedIn", isLoggedIn);
    localStorage.setItem("cbt_nama", nama);
    localStorage.setItem("cbt_token", token);
    if (soal && soal.length) localStorage.setItem("cbt_soal", JSON.stringify(soal));
}
function loadSavedState() {
    const savedAnswers = localStorage.getItem("cbt_answers");
    const savedRagu = localStorage.getItem("cbt_ragu");
    const savedCurrent = localStorage.getItem("cbt_current");
    const savedTime = localStorage.getItem("cbt_time");
    const savedLoggedIn = localStorage.getItem("cbt_isLoggedIn");
    const savedNama = localStorage.getItem("cbt_nama");
    const savedToken = localStorage.getItem("cbt_token");
    const savedSoal = localStorage.getItem("cbt_soal");
    if (savedAnswers) answers = JSON.parse(savedAnswers);
    if (savedRagu) ragu = JSON.parse(savedRagu);
    if (savedCurrent) currentQuestion = parseInt(savedCurrent);
    if (savedTime) timeLeft = parseInt(savedTime);
    if (savedLoggedIn === "true") { isLoggedIn = true; nama = savedNama || ""; token = savedToken || ""; }
    if (savedSoal) soal = JSON.parse(savedSoal);
}
function clearSession() {
    localStorage.clear();
    answers = {}; ragu = {}; currentQuestion = 0; isDone = false; timeLeft = 3600; isLoggedIn = false; soal = []; nama = ""; token = "";
}

// ==========================================
// UI UPDATE
// ==========================================
function updateProgress() {
    if (!soal.length) return;
    let progress = ((currentQuestion + 1) / soal.length) * 100;
    let fillEl = document.getElementById("progressFill");
    if (fillEl) fillEl.style.width = progress + "%";
}
function updateStats() {
    if (!soal.length) return;
    const answered = Object.keys(answers).length;
    const raguCount = Object.keys(ragu).length;
    document.getElementById("answeredCount").innerText = answered;
    document.getElementById("answeredSummary").innerText = answered;
    document.getElementById("raguSummary").innerText = raguCount;
    document.getElementById("unansweredSummary").innerText = soal.length - answered;
}

// ==========================================
// RENDER QUESTION
// ==========================================
function renderQuestion() {
    if (!soal.length) return;
    const s = soal[currentQuestion];
    if (!s) return;
    document.getElementById("questionLabel").innerHTML = "Soal " + (currentQuestion + 1);
    document.getElementById("q").innerHTML = s.pertanyaan;
    let optHtml = "";
    for (let opt of ['A', 'B', 'C', 'D']) {
        optHtml += `<div class="opt ${answers[currentQuestion] == opt ? 'active' : ''}" onclick="pick('${opt}')">
            <div class="letter">${opt}</div><div>${s[opt.toLowerCase()]}</div></div>`;
    }
    document.getElementById("opt").innerHTML = optHtml;
    const raguBtn = document.getElementById("raguBtn");
    if (ragu[currentQuestion]) {
        raguBtn.classList.add("active");
        raguBtn.innerHTML = "🚩 Ditandai Ragu";
    } else {
        raguBtn.classList.remove("active");
        raguBtn.innerHTML = "🚩 Ragu";
    }
    updateProgress();
}
function pick(ans) {
    answers[currentQuestion] = ans;
    if (ragu[currentQuestion]) delete ragu[currentQuestion];
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}
function updateNavGrid() {
    if (!soal.length) return;
    let html = "";
    for (let i = 0; i < soal.length; i++) {
        let cls = [];
        if (answers[i]) cls.push("done");
        if (ragu[i]) cls.push("ragu");
        if (i === currentQuestion) cls.push("activeQ");
        html += `<button class="${cls.join(' ')}" onclick="goToQuestion(${i})">${i + 1}</button>`;
    }
    document.getElementById("nav").innerHTML = html;
}
function goToQuestion(idx) {
    currentQuestion = idx;
    renderQuestion();
    updateNavGrid();
    updateStats();
    updateProgress();
    saveState();
}
function nextQuestion() {
    if (currentQuestion < soal.length - 1) {
        currentQuestion++;
        renderQuestion();
        updateNavGrid();
        updateStats();
        updateProgress();
        saveState();
    } else {
        if (confirm("Anda sudah di soal terakhir. Apakah ingin mengumpulkan jawaban?")) showReviewModal();
    }
}
function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
        updateNavGrid();
        updateStats();
        updateProgress();
        saveState();
    }
}
function toggleRagu() {
    if (ragu[currentQuestion]) delete ragu[currentQuestion];
    else ragu[currentQuestion] = true;
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}

// ==========================================
// TIMER
// ==========================================
function startTimer() {
    if (localStorage.getItem("cbt_submitted") === "true") return;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (isDone) return;
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("⏰ Waktu habis! Jawaban akan dikumpulkan otomatis.");
            submit();
        } else {
            timeLeft--;
            saveState();
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            let timerEl = document.getElementById("timer");
            if (timerEl) timerEl.innerHTML = `${m}:${s < 10 ? '0' + s : s}`;
            if (timeLeft === 300) { alert("⏰ 5 menit lagi!"); }
            if (timeLeft === 60) { alert("⏰ 1 menit lagi!"); }
        }
    }, 1000);
}

// ==========================================
// REVIEW MODAL SEBELUM SUBMIT
// ==========================================
function showReviewModal() {
    if (!soal.length) return;
    const answered = Object.keys(answers).length;
    const raguCount = Object.keys(ragu).length;
    document.getElementById("reviewTotal").innerText = soal.length;
    document.getElementById("reviewAnswered").innerText = answered;
    document.getElementById("reviewRagu").innerText = raguCount;
    document.getElementById("reviewUnanswered").innerText = soal.length - answered;
    let listHtml = "";
    for (let i = 0; i < soal.length; i++) {
        let status = "", cls = "";
        if (answers[i]) { status = `✅ Terjawab: ${answers[i]}`; cls = "answered"; }
        else if (ragu[i]) { status = "🚩 Ditandai Ragu"; cls = "ragu"; }
        else { status = "❌ Belum dijawab"; cls = "unanswered"; }
        listHtml += `<div class="review-question-item ${cls}">
            <span><strong>Soal ${i+1}</strong></span>
            <span>${status}</span>
            <button class="secondary-btn" style="padding:5px 10px;" onclick="goToQuestionFromReview(${i})">Lanjutkan</button>
        </div>`;
    }
    document.getElementById("reviewQuestionList").innerHTML = listHtml;
    document.getElementById("reviewModal").style.display = "flex";
}
function goToQuestionFromReview(idx) { closeReviewModal(); goToQuestion(idx); }
function closeReviewModal() { document.getElementById("reviewModal").style.display = "none"; }
function confirmSubmit() { closeReviewModal(); submit(); }

// ==========================================
// SUBMIT & REVIEW JAWABAN SETELAH SUBMIT (seperti gambar)
// ==========================================
function formatTimeDisplay(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return `${mins} menit ${secs} detik`;
}
function submit() {
    if (isDone) return;
    let unanswered = soal.length - Object.keys(answers).length;
    if (!confirm(`Yakin kumpul? ${Object.keys(answers).length}/${soal.length} terjawab, ${unanswered} belum. Lanjutkan?`)) return;
    isDone = true;
    clearInterval(timer);
    completionTimeSeconds = 3600 - timeLeft;
    let score = 0;
    let results = [];
    for (let i = 0; i < soal.length; i++) {
        let isCorrect = (answers[i] == soal[i].kunci);
        if (isCorrect) score++;
        results.push({
            nomor: i+1,
            pertanyaan: soal[i].pertanyaan,
            jawabanUser: answers[i] || "(Tidak dijawab)",
            kunci: soal[i].kunci,
            benar: isCorrect,
            pembahasan: soal[i].pembahasan || "Tidak ada pembahasan",
            options: { A: soal[i].a, B: soal[i].b, C: soal[i].c, D: soal[i].d }
        });
    }
    localStorage.setItem("cbt_submitted", "true");
    localStorage.setItem("cbt_score", score);
    localStorage.setItem("cbt_results", JSON.stringify(results));
    localStorage.setItem("cbt_completion_time", completionTimeSeconds);
    fetch(API, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", nama, token, skor: score, jawaban: answers, total: soal.length, waktu: formatTimeDisplay(completionTimeSeconds) }) }).catch(e => console.log);
    showResult(score);
}
function showResult(score) {
    document.getElementById("app").style.display = "none";
    document.getElementById("result").style.display = "flex";
    document.getElementById("scoreNumber").innerHTML = score;
    let persen = Math.round((score / soal.length) * 100);
    let grade = persen >= 90 ? "🏆 Luar Biasa!" : persen >= 75 ? "✅ Sangat Baik" : persen >= 60 ? "📚 Cukup" : "📖 Perlu Belajar Lebih Lanjut";
    document.getElementById("skor").innerHTML = `<strong>${grade}</strong><br>${score} dari ${soal.length} benar (${persen}%)`;
    document.getElementById("resultNama").innerText = nama;
    document.getElementById("resultBenar").innerText = score;
    document.getElementById("resultSalah").innerText = soal.length - score;
    let waktuStr = formatTimeDisplay(completionTimeSeconds);
    document.getElementById("resultWaktu").innerText = waktuStr;
    loadLeaderboard();
}
function toggleAnswerReview() {
    let panel = document.getElementById("answerReviewPanel");
    if (panel.style.display === "none") {
        let results = JSON.parse(localStorage.getItem("cbt_results") || "[]");
        if (!results.length) { panel.innerHTML = "<p>Tidak ada data jawaban.</p>"; }
        else {
            let html = "";
            results.forEach(r => {
                let optionsHtml = "";
                for (let [opt, text] of Object.entries(r.options)) {
                    let isUser = (r.jawabanUser === opt);
                    let isCorrectAns = (r.kunci === opt);
                    let checkMark = (isUser && r.benar) ? " ✓" : (isUser && !r.benar) ? " ✗" : "";
                    let className = (isUser && r.benar) ? "correct" : "";
                    optionsHtml += `<div class="review-option ${className}">${opt}. ${text} ${checkMark}</div>`;
                }
                html += `
                    <div class="answer-review-item">
                        <div class="review-question-text">Soal ${r.nomor}. ${r.pertanyaan}</div>
                        <div class="review-options-list">${optionsHtml}</div>
                        <div class="review-pembahasan"><strong>Pembahasan:</strong> ${r.pembahasan}</div>
                    </div>
                `;
            });
            panel.innerHTML = html;
        }
        panel.style.display = "block";
    } else { panel.style.display = "none"; }
}
function loadLeaderboard() {
    const board = document.getElementById("board");
    if (!board) return;
    board.innerHTML = '<div class="leaderboard-loading">📊 Memuat leaderboard...</div>';
    fetch(API + "?action=leaderboard&token=" + token).then(r => r.json()).then(res => {
        if (res.leaderboard && res.leaderboard.length) {
            let data = res.leaderboard.map(item => ({ nama: item.nama, skor: item.skor, total: soal.length, waktu: item.waktu || "00:00" }));
            data.sort((a,b) => b.skor - a.skor);
            let html = `<div class="leaderboard-card"><div class="leaderboard-header"><div class="rank">#</div><div class="name">Peserta</div><div class="score">Skor</div><div class="time">Waktu</div></div><div class="leaderboard-list">`;
            data.forEach((item, idx) => {
                let rank = idx+1;
                let rankClass = rank===1?"rank-1":(rank===2?"rank-2":(rank===3?"rank-3":""));
                let medal = rank===1?"🥇":(rank===2?"🥈":(rank===3?"🥉":""));
                let myClass = (item.nama === nama) ? "my-rank" : "";
                let persen = Math.round((item.skor / item.total) * 100);
                html += `<div class="leaderboard-item ${myClass}"><div class="rank ${rankClass}">${medal || rank}</div><div class="name">${item.nama}</div><div class="score">${persen}%</div><div class="time">${item.waktu}</div></div>`;
            });
            html += `</div></div>`;
            board.innerHTML = html;
        } else { board.innerHTML = '<div class="leaderboard-empty">🏆 Belum ada data leaderboard.</div>'; }
    }).catch(() => { board.innerHTML = '<div class="leaderboard-empty">⚠️ Gagal memuat leaderboard.</div>'; });
}
function restartExam() {
    if (confirm("Ujian baru akan menghapus semua jawaban. Lanjutkan?")) { clearSession(); location.reload(); }
}

// ==========================================
// LOGIN & LOAD SOAL
// ==========================================
function login() {
    nama = document.getElementById("nama").value.trim();
    token = document.getElementById("token").value.trim();
    if (!nama || !token) { alert("Lengkapi data!"); return; }
    fetch(API + "?action=validateToken&token=" + token).then(r => r.json()).then(res => {
        if (!res.valid) { alert("Token tidak valid"); return; }
        isLoggedIn = true;
        saveState();
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        loadQuestions();
    }).catch(() => alert("Gagal validasi token"));
}
function loadQuestions() {
    if (soal.length) { startFromSaved(); return; }
    fetch(API + "?action=getSoal").then(r => r.json()).then(res => {
        if (!res.soal || !res.soal.length) { alert("Soal tidak ditemukan"); return; }
        soal = res.soal;
        document.getElementById("totalCount").innerText = soal.length;
        startFromSaved();
        saveState();
    }).catch(() => alert("Gagal load soal"));
}
function startFromSaved() {
    renderQuestion(); updateNavGrid(); updateStats(); startTimer();
}

// ==========================================
// DARK MODE
// ==========================================
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}
function loadDarkMode() { if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark-mode"); }

// ==========================================
// CALCULATOR
// ==========================================
function toggleCalculator() {
    let modal = document.getElementById("calculatorModal");
    if (modal.style.display === "flex") { modal.style.display = "none"; document.removeEventListener("keydown", handleKeyboard); }
    else { modal.style.display = "flex"; document.addEventListener("keydown", handleKeyboard); document.getElementById("calcDisplay").focus(); }
}
function handleKeyboard(e) {
    let d = document.getElementById("calcDisplay");
    if (!d) return;
    let key = e.key;
    if (key >= '0' && key <= '9') appendToDisplay(key);
    else if (key === '.') appendToDisplay('.');
    else if (key === '+' || key === '-' || key === '*' || key === '/') { let op = key === '*' ? '×' : (key === '/' ? '÷' : key); appendToDisplay(op); }
    else if (key === 'Enter' || key === '=') calculateResult();
    else if (key === 'Escape') toggleCalculator();
    else if (key === 'Backspace') deleteLastCalc();
    else if (key === 'c' || key === 'C') clearCalc();
}
function appendToDisplay(v) { let d = document.getElementById("calcDisplay"); if (d) { if (d.value === "Error") d.value = ""; d.value += v; } }
function clearCalc() { document.getElementById("calcDisplay").value = ""; }
function deleteLastCalc() { let d = document.getElementById("calcDisplay"); d.value = d.value.slice(0, -1); }
function calculateResult() {
    let d = document.getElementById("calcDisplay");
    try { let expr = d.value.replace(/×/g, '*').replace(/÷/g, '/'); let r = Function('"use strict"; return (' + expr + ')')(); d.value = r; }
    catch(e) { d.value = "Error"; }
}
function calcFunction(action) {
    let d = document.getElementById("calcDisplay");
    let val = parseFloat(d.value) || 0;
    switch(action) {
        case 'sin': d.value = Math.sin(val * Math.PI/180); break;
        case 'cos': d.value = Math.cos(val * Math.PI/180); break;
        case 'tan': d.value = Math.tan(val * Math.PI/180); break;
        case 'log': d.value = Math.log10(val); break;
        case 'ln': d.value = Math.log(val); break;
        case 'sqrt': d.value = Math.sqrt(val); break;
        case 'pow2': d.value = val*val; break;
        case 'pow3': d.value = val*val*val; break;
        case 'reciprocal': d.value = 1/val; break;
        case 'pi': d.value = Math.PI; break;
        case 'e': d.value = Math.E; break;
        case 'percent': d.value = val/100; break;
        case 'equal': calculateResult(); break;
        case 'clear': clearCalc(); break;
        case 'backspace': deleteLastCalc(); break;
        case 'mplus': calcMemory += val; break;
        case 'mminus': calcMemory -= val; break;
        case 'mr': d.value = calcMemory; break;
        case 'mc': calcMemory = 0; break;
    }
}
function initCalculatorButtons() {
    document.querySelectorAll('.calc-num').forEach(btn => btn.onclick = () => appendToDisplay(btn.getAttribute('data-num')));
    document.querySelectorAll('.calc-operator').forEach(btn => btn.onclick = () => appendToDisplay(btn.getAttribute('data-op')));
    document.querySelectorAll('.calc-func, .calc-mem, .calc-clear').forEach(btn => btn.onclick = () => calcFunction(btn.getAttribute('data-action')));
}

// ==========================================
// CEK SESSION (REFRESH STAY)
// ==========================================
function checkExistingSession() {
    loadSavedState();
    loadDarkMode();
    if (isLoggedIn) {
        const submitted = localStorage.getItem("cbt_submitted");
        if (submitted === "true") {
            const savedScore = localStorage.getItem("cbt_score");
            if (savedScore) {
                document.getElementById("login").style.display = "none";
                completionTimeSeconds = parseInt(localStorage.getItem("cbt_completion_time") || "0");
                if (soal.length) showResult(parseInt(savedScore));
                else fetch(API+"?action=getSoal").then(r=>r.json()).then(res=>{ soal = res.soal; showResult(parseInt(savedScore)); });
            }
        } else {
            document.getElementById("login").style.display = "none";
            document.getElementById("app").style.display = "block";
            if (soal.length) { document.getElementById("totalCount").innerText = soal.length; renderQuestion(); updateNavGrid(); updateStats(); startTimer(); }
            else loadQuestions();
        }
    }
}

// ==========================================
// INIT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initCalculatorButtons();
    checkExistingSession();
});

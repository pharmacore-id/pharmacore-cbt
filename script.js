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

// Kalkulator memory
let calcMemory = 0;
let lastAnswer = 0;

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

// ==========================================
// FUNGSI SAVE & LOAD STATE (PERSISTENSI)
// ==========================================
function saveState() {
    localStorage.setItem("cbt_answers", JSON.stringify(answers));
    localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
    localStorage.setItem("cbt_current", currentQuestion);
    localStorage.setItem("cbt_time", timeLeft);
    localStorage.setItem("cbt_isLoggedIn", isLoggedIn);
    localStorage.setItem("cbt_nama", nama);
    localStorage.setItem("cbt_token", token);
    if (soal && soal.length > 0) {
        localStorage.setItem("cbt_soal", JSON.stringify(soal));
    }
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
    if (savedCurrent && !isNaN(parseInt(savedCurrent))) {
        currentQuestion = parseInt(savedCurrent);
    }
    if (savedTime && !isNaN(parseInt(savedTime))) {
        timeLeft = parseInt(savedTime);
    }
    if (savedLoggedIn === "true") {
        isLoggedIn = true;
        nama = savedNama || "";
        token = savedToken || "";
    }
    if (savedSoal) {
        soal = JSON.parse(savedSoal);
    }
}

function clearSession() {
    localStorage.removeItem("cbt_answers");
    localStorage.removeItem("cbt_ragu");
    localStorage.removeItem("cbt_current");
    localStorage.removeItem("cbt_time");
    localStorage.removeItem("cbt_isLoggedIn");
    localStorage.removeItem("cbt_nama");
    localStorage.removeItem("cbt_token");
    localStorage.removeItem("cbt_soal");
    localStorage.removeItem("cbt_submitted");
    localStorage.removeItem("cbt_score");
}

// ==========================================
// FUNGSI UPDATE UI
// ==========================================
function updateProgress() {
    if (!soal || soal.length === 0) return;
    let progress = ((currentQuestion + 1) / soal.length) * 100;
    let fillEl = document.getElementById("progressFill");
    if (fillEl) fillEl.style.width = progress + "%";
}

function updateStats() {
    if (!soal || soal.length === 0) return;
    const answered = Object.keys(answers).length;
    const raguCount = Object.keys(ragu).length;
    const unanswered = soal.length - answered;
    
    const answeredCount = document.getElementById("answeredCount");
    const answeredSummary = document.getElementById("answeredSummary");
    const raguSummary = document.getElementById("raguSummary");
    const unansweredSummary = document.getElementById("unansweredSummary");
    
    if (answeredCount) answeredCount.innerText = answered;
    if (answeredSummary) answeredSummary.innerText = answered;
    if (raguSummary) raguSummary.innerText = raguCount;
    if (unansweredSummary) unansweredSummary.innerText = unanswered;
}

// ==========================================
// FUNGSI RENDER QUESTION
// ==========================================
function renderQuestion() {
    if (!soal || soal.length === 0) return;
    const s = soal[currentQuestion];
    if (!s) return;

    document.getElementById("questionLabel").innerHTML = "Soal " + (currentQuestion + 1);
    document.getElementById("q").innerHTML = s.pertanyaan;

    let optHtml = `
        <div class="opt ${answers[currentQuestion] == 'A' ? 'active' : ''}" onclick="pick('A')">
            <div class="letter">A</div>
            <div>${s.a || "Opsi A"}</div>
        </div>
        <div class="opt ${answers[currentQuestion] == 'B' ? 'active' : ''}" onclick="pick('B')">
            <div class="letter">B</div>
            <div>${s.b || "Opsi B"}</div>
        </div>
        <div class="opt ${answers[currentQuestion] == 'C' ? 'active' : ''}" onclick="pick('C')">
            <div class="letter">C</div>
            <div>${s.c || "Opsi C"}</div>
        </div>
        <div class="opt ${answers[currentQuestion] == 'D' ? 'active' : ''}" onclick="pick('D')">
            <div class="letter">D</div>
            <div>${s.d || "Opsi D"}</div>
        </div>
    `;
    document.getElementById("opt").innerHTML = optHtml;

    const raguBtn = document.getElementById("raguBtn");
    if (raguBtn) {
        if (ragu[currentQuestion]) {
            raguBtn.classList.add("active");
            raguBtn.innerHTML = "🚩 Ditandai Ragu";
        } else {
            raguBtn.classList.remove("active");
            raguBtn.innerHTML = "🚩 Ragu";
        }
    }
    
    updateProgress();
}

function pick(answer) {
    answers[currentQuestion] = answer;
    if (ragu[currentQuestion]) {
        delete ragu[currentQuestion];
    }
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}

function updateNavGrid() {
    if (!soal || soal.length === 0) return;
    let html = "";
    
    for (let i = 0; i < soal.length; i++) {
        let classes = [];
        if (answers[i]) classes.push("done");
        if (ragu[i]) classes.push("ragu");
        if (i === currentQuestion) classes.push("activeQ");
        
        html += `<button class="${classes.join(" ")}" onclick="goToQuestion(${i})">${i + 1}</button>`;
    }
    
    document.getElementById("nav").innerHTML = html;
}

function goToQuestion(index) {
    currentQuestion = index;
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
        if (confirm("Anda sudah di soal terakhir. Apakah ingin mengumpulkan jawaban?")) {
            showReviewModal();
        }
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
    if (ragu[currentQuestion]) {
        delete ragu[currentQuestion];
    } else {
        ragu[currentQuestion] = true;
    }
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}

// ==========================================
// FUNGSI TIMER
// ==========================================
function startTimer() {
    const submitted = localStorage.getItem("cbt_submitted");
    if (submitted === "true") return;
    
    if (timer) clearInterval(timer);

    timer = setInterval(function() {
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
            if (timerEl) {
                timerEl.innerHTML = m + ":" + (s < 10 ? '0' + s : s);
                
                if (timeLeft === 300) {
                    alert("⏰ Peringatan! Waktu tersisa 5 menit lagi.");
                    timerEl.style.color = "#f59e0b";
                }
                if (timeLeft === 60) {
                    alert("⏰ Peringatan! Waktu tersisa 1 menit!");
                    timerEl.style.color = "#ef4444";
                    timerEl.style.fontWeight = "bold";
                }
            }
        }
    }, 1000);
}

// ==========================================
// FUNGSI REVIEW MODAL
// ==========================================
function showReviewModal() {
    if (!soal || soal.length === 0) return;
    
    const answered = Object.keys(answers).length;
    const raguCount = Object.keys(ragu).length;
    const unanswered = soal.length - answered;
    
    document.getElementById("reviewTotal").innerText = soal.length;
    document.getElementById("reviewAnswered").innerText = answered;
    document.getElementById("reviewRagu").innerText = raguCount;
    document.getElementById("reviewUnanswered").innerText = unanswered;
    
    let listHtml = "";
    for (let i = 0; i < soal.length; i++) {
        let status = "";
        let statusClass = "";
        if (answers[i]) {
            status = "✅ Terjawab: " + answers[i];
            statusClass = "answered";
        } else if (ragu[i]) {
            status = "🚩 Ditandai Ragu";
            statusClass = "ragu";
        } else {
            status = "❌ Belum dijawab";
            statusClass = "unanswered";
        }
        
        listHtml += `
            <div class="review-question-item ${statusClass}">
                <span><strong>Soal ${i+1}</strong></span>
                <span>${status}</span>
                <button class="secondary-btn" style="padding: 5px 10px; margin:0;" onclick="goToQuestionFromReview(${i})">Lanjutkan</button>
            </div>
        `;
    }
    document.getElementById("reviewQuestionList").innerHTML = listHtml;
    
    document.getElementById("reviewModal").style.display = "flex";
}

function goToQuestionFromReview(index) {
    closeReviewModal();
    goToQuestion(index);
}

function closeReviewModal() {
    document.getElementById("reviewModal").style.display = "none";
}

function confirmSubmit() {
    closeReviewModal();
    submit();
}

// ==========================================
// FUNGSI LOGIN & LOAD
// ==========================================
function login() {
    nama = document.getElementById("nama").value.trim();
    token = document.getElementById("token").value.trim();

    if (!nama || !token) {
        alert("Lengkapi data terlebih dahulu");
        return;
    }

    fetch(API + "?action=validateToken&token=" + token)
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (!res.valid) {
                alert("Token tidak valid");
                return;
            }
            isLoggedIn = true;
            saveState();
            document.getElementById("login").style.display = "none";
            document.getElementById("app").style.display = "block";
            loadQuestions();
        })
        .catch(function(err) {
            console.error("LOGIN ERROR:", err);
            alert("Gagal validasi token");
        });
}

function loadQuestions() {
    // Cek apakah soal sudah tersimpan di localStorage
    if (soal && soal.length > 0) {
        renderQuestion();
        updateNavGrid();
        updateStats();
        updateProgress();
        startTimer();
        return;
    }
    
    fetch(API + "?action=getSoal")
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (!res || !res.soal || res.soal.length === 0) {
                alert("Soal tidak ditemukan");
                return;
            }
            soal = res.soal;
            document.getElementById("totalCount").innerText = soal.length;
            renderQuestion();
            updateNavGrid();
            updateStats();
            updateProgress();
            startTimer();
            saveState();
        })
        .catch(function(err) {
            console.error(err);
            alert("Gagal load soal");
        });
}

// ==========================================
// FUNGSI SUBMIT & RESULT
// ==========================================
function submit() {
    if (isDone) return;
    
    let unanswered = 0;
    for (let i = 0; i < soal.length; i++) {
        if (!answers[i]) unanswered++;
    }
    
    let confirmMsg = "Apakah Anda yakin ingin mengumpulkan jawaban?\n\n";
    confirmMsg += `📊 ${Object.keys(answers).length}/${soal.length} soal terjawab\n`;
    confirmMsg += `❌ ${unanswered} soal belum dijawab\n`;
    
    if (unanswered > 0) {
        confirmMsg += "\n⚠️ PERINGATAN: Soal yang tidak dijawab akan dianggap salah!\n";
    }
    
    if (!confirm(confirmMsg)) return;
    
    isDone = true;
    clearInterval(timer);

    let score = 0;
    for (let i = 0; i < soal.length; i++) {
        if (answers[i] == soal[i].kunci) {
            score++;
        }
    }

    localStorage.setItem("cbt_submitted", "true");
    localStorage.setItem("cbt_score", score);

    fetch(API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "submit",
            nama: nama,
            token: token,
            skor: score,
            jawaban: answers,
            total: soal.length
        })
    }).catch(function(err) { console.error("Submit error:", err); });

    showResult(score);
}

function showResult(score) {
    document.getElementById("app").style.display = "none";
    document.getElementById("result").style.display = "flex";
    document.getElementById("scoreNumber").innerHTML = score;

    let percentage = Math.round((score / soal.length) * 100);
    let grade = "";
    if (percentage >= 90) grade = "🏆 Luar Biasa! Pertahankan!";
    else if (percentage >= 75) grade = "✅ Sangat Baik, tingkatkan lagi!";
    else if (percentage >= 60) grade = "📚 Cukup, perlu belajar lebih giat";
    else grade = "📖 Perbanyak latihan soal ya!";
    
    let skorEl = document.getElementById("skor");
    if (skorEl) {
        skorEl.innerHTML = `Anda menjawab ${score} dari ${soal.length} soal dengan benar (${percentage}%)<br><strong>${grade}</strong>`;
    }
    
    loadLeaderboard();
}

function loadLeaderboard() {
    fetch(API + "?action=leaderboard&token=" + token)
        .then(function(r) { return r.json(); })
        .then(function(res) {
            let board = document.getElementById("board");
            if (!board) return;
            if (res.leaderboard && res.leaderboard.length > 0) {
                let html = "<ol style='text-align:left;margin-top:20px;'>";
                for (let i = 0; i < Math.min(10, res.leaderboard.length); i++) {
                    let item = res.leaderboard[i];
                    html += "<li style='margin:10px 0;padding:8px;background:#f8f6ff;border-radius:12px;'>";
                    html += "<strong>" + item.nama + "</strong> - Skor: " + item.skor + "/" + soal.length;
                    html += "</li>";
                }
                html += "</ol>";
                board.innerHTML = html;
            } else {
                board.innerHTML = "<p>Belum ada data leaderboard</p>";
            }
        })
        .catch(function(err) {
            console.error("Leaderboard error:", err);
            let board = document.getElementById("board");
            if (board) board.innerHTML = "<p>Gagal memuat leaderboard</p>";
        });
}

function restartExam() {
    if (confirm("Memulai ujian baru akan menghapus semua jawaban sebelumnya. Lanjutkan?")) {
        clearSession();
        answers = {};
        ragu = {};
        currentQuestion = 0;
        isDone = false;
        timeLeft = 3600;
        isLoggedIn = false;
        soal = [];

        document.getElementById("result").style.display = "none";
        document.getElementById("login").style.display = "flex";
        document.getElementById("app").style.display = "none";

        document.getElementById("nama").value = "";
        document.getElementById("token").value = "";
        
        let timerEl = document.getElementById("timer");
        if (timerEl) timerEl.innerHTML = "60:00";
    }
}

// ==========================================
// FUNGSI DARK MODE
// ==========================================
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    let isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDark);
}

function loadDarkMode() {
    let saved = localStorage.getItem("darkMode");
    if (saved === "true") {
        document.body.classList.add("dark-mode");
    }
}

// ==========================================
// FUNGSI CALCULATOR SCIENTIFIC + KEYBOARD
// ==========================================
function toggleCalculator() {
    let modal = document.getElementById("calculatorModal");
    if (modal.style.display === "flex") {
        modal.style.display = "none";
        document.removeEventListener("keydown", handleKeyboard);
    } else {
        modal.style.display = "flex";
        document.addEventListener("keydown", handleKeyboard);
        document.getElementById("calcDisplay").focus();
    }
}

function handleKeyboard(e) {
    let display = document.getElementById("calcDisplay");
    if (!display) return;
    
    const key = e.key;
    if (key >= '0' && key <= '9') {
        appendToDisplay(key);
    } else if (key === '.') {
        appendToDisplay('.');
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        let op = key;
        if (op === '*') op = '×';
        if (op === '/') op = '÷';
        appendToDisplay(op);
    } else if (key === 'Enter' || key === '=') {
        calculateResult();
    } else if (key === 'Escape') {
        toggleCalculator();
    } else if (key === 'Backspace') {
        deleteLastCalc();
    } else if (key === 'c' || key === 'C') {
        clearCalc();
    }
}

function appendToDisplay(value) {
    let display = document.getElementById("calcDisplay");
    if (display) {
        if (display.value === "Error") display.value = "";
        display.value += value;
    }
}

function clearCalc() {
    let display = document.getElementById("calcDisplay");
    if (display) display.value = "";
}

function deleteLastCalc() {
    let display = document.getElementById("calcDisplay");
    if (display) display.value = display.value.slice(0, -1);
}

function calculateResult() {
    let display = document.getElementById("calcDisplay");
    if (!display) return;
    try {
        let expr = display.value.replace(/×/g, '*').replace(/÷/g, '/');
        let result = Function('"use strict"; return (' + expr + ')')();
        display.value = result;
        lastAnswer = result;
    } catch (e) {
        display.value = "Error";
    }
}

function calcFunction(action) {
    let display = document.getElementById("calcDisplay");
    if (!display) return;
    let val = parseFloat(display.value);
    if (isNaN(val) && action !== 'pi' && action !== 'e') val = 0;
    
    switch(action) {
        case 'sin': display.value = Math.sin(val * Math.PI / 180); break;
        case 'cos': display.value = Math.cos(val * Math.PI / 180); break;
        case 'tan': display.value = Math.tan(val * Math.PI / 180); break;
        case 'log': display.value = Math.log10(val); break;
        case 'ln': display.value = Math.log(val); break;
        case 'sqrt': display.value = Math.sqrt(val); break;
        case 'pow2': display.value = Math.pow(val, 2); break;
        case 'pow3': display.value = Math.pow(val, 3); break;
        case 'reciprocal': display.value = 1 / val; break;
        case 'pi': display.value = Math.PI; break;
        case 'e': display.value = Math.E; break;
        case 'percent': display.value = val / 100; break;
        case 'equal': calculateResult(); break;
        case 'mplus': calcMemory += val; break;
        case 'mminus': calcMemory -= val; break;
        case 'mr': display.value = calcMemory; break;
        case 'mc': calcMemory = 0; break;
        case 'clear': clearCalc(); break;
        case 'backspace': deleteLastCalc(); break;
    }
}

function initCalculatorButtons() {
    document.querySelectorAll('.calc-num').forEach(btn => {
        btn.onclick = () => appendToDisplay(btn.getAttribute('data-num'));
    });
    document.querySelectorAll('.calc-operator').forEach(btn => {
        btn.onclick = () => appendToDisplay(btn.getAttribute('data-op'));
    });
    document.querySelectorAll('.calc-func, .calc-mem, .calc-clear').forEach(btn => {
        btn.onclick = () => calcFunction(btn.getAttribute('data-action'));
    });
}

// ==========================================
// CEK SESSION SEBELUMNYA (REFRESH STAY)
// ==========================================
function checkExistingSession() {
    loadSavedState();
    loadDarkMode();
    
    // Jika sudah login dan belum submit
    if (isLoggedIn) {
        const submitted = localStorage.getItem("cbt_submitted");
        if (submitted === "true") {
            const savedScore = localStorage.getItem("cbt_score");
            if (savedScore) {
                document.getElementById("login").style.display = "none";
                // Perlu soal untuk menampilkan result? Jika soal belum ada, load dulu
                if (soal && soal.length > 0) {
                    showResult(parseInt(savedScore));
                } else {
                    // Load soal dulu dari API
                    fetch(API + "?action=getSoal")
                        .then(r => r.json())
                        .then(res => {
                            if (res && res.soal) {
                                soal = res.soal;
                                showResult(parseInt(savedScore));
                            }
                        });
                }
            }
        } else {
            // Belum submit, lanjutkan ujian
            document.getElementById("login").style.display = "none";
            document.getElementById("app").style.display = "block";
            
            if (soal && soal.length > 0) {
                // Render dari state yang sudah ada
                document.getElementById("totalCount").innerText = soal.length;
                renderQuestion();
                updateNavGrid();
                updateStats();
                updateProgress();
                startTimer();
            } else {
                // Soal belum ada, ambil dari API
                loadQuestions();
            }
        }
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    initCalculatorButtons();
    checkExistingSession();
});

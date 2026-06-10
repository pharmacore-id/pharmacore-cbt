// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentQuestion = 0;
let answers = {};
let ragu = {};
let reviewFlag = {}; // Fitur: tandai untuk review
let soal = [];
let token = "";
let nama = "";
let timer = null;
let isDone = false;
let timeLeft = 3600;
let isRandomized = false;
let originalSoal = [];

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

// ==========================================
// FUNGSI SAVE & LOAD
// ==========================================
function saveState() {
    localStorage.setItem("cbt_answers", JSON.stringify(answers));
    localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
    localStorage.setItem("cbt_review", JSON.stringify(reviewFlag));
    localStorage.setItem("cbt_current", currentQuestion);
    localStorage.setItem("cbt_randomized", isRandomized);
}

function loadSavedState() {
    const savedAnswers = localStorage.getItem("cbt_answers");
    const savedRagu = localStorage.getItem("cbt_ragu");
    const savedReview = localStorage.getItem("cbt_review");
    const savedCurrent = localStorage.getItem("cbt_current");
    const savedRandomized = localStorage.getItem("cbt_randomized");
    
    if (savedAnswers) answers = JSON.parse(savedAnswers);
    if (savedRagu) ragu = JSON.parse(savedRagu);
    if (savedReview) reviewFlag = JSON.parse(savedReview);
    if (savedCurrent && !isNaN(parseInt(savedCurrent))) {
        currentQuestion = parseInt(savedCurrent);
    }
    if (savedRandomized === "true") isRandomized = true;
}

// ==========================================
// FUNGSI ACAK SOAL
// ==========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function toggleRandomize() {
    if (!soal || soal.length === 0) return;
    
    if (!isRandomized) {
        // Simpan soal asli
        originalSoal = [...soal];
        // Acak soal
        soal = shuffleArray([...soal]);
        isRandomized = true;
        // Reset jawaban karena urutan soal berubah
        answers = {};
        ragu = {};
        reviewFlag = {};
        currentQuestion = 0;
        alert("Soal telah diacak! Jawaban sebelumnya direset.");
    } else {
        // Kembalikan ke urutan asli
        if (originalSoal.length > 0) {
            soal = [...originalSoal];
            isRandomized = false;
            answers = {};
            ragu = {};
            reviewFlag = {};
            currentQuestion = 0;
            alert("Urutan soal kembali normal. Jawaban direset.");
        }
    }
    
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
    updateProgress();
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
    const a = document.getElementById("answeredCount");
    const b = document.getElementById("answeredSummary");
    const c = document.getElementById("unansweredSummary");
    if (a) a.innerText = answered;
    if (b) b.innerText = answered;
    if (c) c.innerText = soal.length - answered;
}

// ==========================================
// FUNGSI RENDER QUESTION
// ==========================================
function renderQuestion() {
    if (!soal || soal.length === 0) return;
    const s = soal[currentQuestion];
    if (!s) return;

    document.getElementById("questionLabel").innerHTML = "Soal " + (currentQuestion + 1);
    
    // Tambah indikator review flag
    let reviewIcon = reviewFlag[currentQuestion] ? ' <span style="color:#f59e0b;">⭐</span>' : '';
    document.getElementById("q").innerHTML = s.pertanyaan + reviewIcon;

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

    // Update tombol ragu
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
    
    // Update tombol review
    const reviewBtn = document.getElementById("reviewBtn");
    if (reviewBtn) {
        if (reviewFlag[currentQuestion]) {
            reviewBtn.classList.add("active");
            reviewBtn.innerHTML = "⭐ Batal Review";
        } else {
            reviewBtn.classList.remove("active");
            reviewBtn.innerHTML = "🏷️ Tandai Review";
        }
    }
    
    updateProgress();
}

function pick(answer) {
    answers[currentQuestion] = answer;
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}

// ==========================================
// FUNGSI FLAG REVIEW
// ==========================================
function toggleReview() {
    if (reviewFlag[currentQuestion]) {
        delete reviewFlag[currentQuestion];
    } else {
        reviewFlag[currentQuestion] = true;
    }
    saveState();
    renderQuestion();
    updateNavGrid();
}

// ==========================================
// FUNGSI NAVIGASI
// ==========================================
function updateNavGrid() {
    if (!soal || soal.length === 0) return;
    let html = "";
    for (let i = 0; i < soal.length; i++) {
        let classes = [];
        if (answers[i]) classes.push("done");
        if (ragu[i]) classes.push("ragu");
        if (reviewFlag[i]) classes.push("review");
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
        // Jika di soal terakhir, tawarkan submit
        if (confirm("Anda sudah di soal terakhir. Apakah ingin mengumpulkan jawaban?")) {
            submit();
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
}

// ==========================================
// FUNGSI REVIEW ALL (Sebelum Submit)
// ==========================================
function showReviewPanel() {
    if (!soal || soal.length === 0) return;
    
    let unanswered = [];
    let flagged = [];
    let answered_list = [];
    
    for (let i = 0; i < soal.length; i++) {
        if (!answers[i]) {
            unanswered.push(i + 1);
        }
        if (ragu[i]) {
            flagged.push(i + 1);
        }
        if (answers[i]) {
            answered_list.push(i + 1);
        }
    }
    
    let message = "📊 RINGKASAN JAWABAN:\n\n";
    message += `✅ Terjawab: ${answered_list.length}/${soal.length} soal\n`;
    message += `❌ Belum dijawab: ${unanswered.length} soal\n`;
    message += `🚩 Ditandai ragu: ${flagged.length} soal\n`;
    
    if (unanswered.length > 0) {
        message += `\n⚠️ Soal belum dijawab: ${unanswered.join(", ")}\n`;
    }
    if (flagged.length > 0) {
        message += `\n🏷️ Soal ditandai ragu: ${flagged.join(", ")}\n`;
    }
    
    message += "\nApakah Anda yakin ingin mengumpulkan jawaban?";
    
    if (confirm(message)) {
        submit();
    }
}

// ==========================================
// FUNGSI TIMER DENGAN PERINGATAN
// ==========================================
function startTimer() {
    const saved = localStorage.getItem("cbt_time");
    const submitted = localStorage.getItem("cbt_submitted");
    if (submitted === "true") return;
    
    timeLeft = saved ? parseInt(saved) : 3600;
    let warningShown5min = false;
    let warningShown1min = false;
    
    if (timer) clearInterval(timer);

    timer = setInterval(function() {
        if (isDone) return;
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("⏰ Waktu habis! Jawaban akan dikumpulkan otomatis.");
            submit();
        } else {
            timeLeft--;
            localStorage.setItem("cbt_time", timeLeft);
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            let timerEl = document.getElementById("timer");
            if (timerEl) {
                timerEl.innerHTML = m + ":" + (s < 10 ? '0' + s : s);
                
                // Peringatan 5 menit
                if (timeLeft === 300 && !warningShown5min) {
                    warningShown5min = true;
                    alert("⏰ Peringatan! Waktu tersisa 5 menit lagi.");
                    timerEl.style.color = "#f59e0b";
                }
                // Peringatan 1 menit
                if (timeLeft === 60 && !warningShown1min) {
                    warningShown1min = true;
                    alert("⏰ Peringatan! Waktu tersisa 1 menit!");
                    timerEl.style.color = "#ef4444";
                    timerEl.style.fontWeight = "bold";
                }
            }
        }
    }, 1000);
}

// ==========================================
// FUNGSI LOGIN & LOAD
// ==========================================
function login() {
    console.log("Login function called");
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
    fetch(API + "?action=getSoal")
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (!res || !res.soal || res.soal.length === 0) {
                alert("Soal tidak ditemukan");
                return;
            }
            soal = res.soal;
            originalSoal = [...soal];
            totalSoal = soal.length;
            document.getElementById("totalCount").innerText = totalSoal;
            loadSavedState();
            if (currentQuestion >= soal.length) currentQuestion = 0;
            renderQuestion();
            updateNavGrid();
            updateStats();
            updateProgress();
            startTimer();
        })
        .catch(function(err) {
            console.error(err);
            alert("Gagal load soal");
        });
}

// ==========================================
// FUNGSI SUBMIT DENGAN KONFIRMASI & PEMBAHASAN
// ==========================================
function submit() {
    if (isDone) return;
    
    // Hitung jumlah belum dijawab
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
    let results = [];
    
    for (let i = 0; i < soal.length; i++) {
        let isCorrect = (answers[i] == soal[i].kunci);
        if (isCorrect) {
            score++;
        }
        results.push({
            question: soal[i].pertanyaan,
            userAnswer: answers[i] || "(Tidak dijawab)",
            correctAnswer: soal[i].kunci,
            isCorrect: isCorrect,
            explanation: soal[i].pembahasan || "Tidak ada pembahasan"
        });
    }

    localStorage.setItem("cbt_submitted", "true");
    localStorage.setItem("cbt_score", score);
    localStorage.setItem("cbt_results", JSON.stringify(results));

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

// ==========================================
// FUNGSI PEMBAHASAN SOAL
// ==========================================
function showDiscussion() {
    let results = localStorage.getItem("cbt_results");
    if (!results) {
        alert("Tidak ada data pembahasan");
        return;
    }
    
    results = JSON.parse(results);
    let modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        overflow-y: auto;
        padding: 20px;
    `;
    
    let html = `
        <div style="max-width: 800px; margin: 20px auto; background: white; border-radius: 20px; padding: 30px;">
            <h2 style="color: #6d28d9;">📖 Pembahasan Soal</h2>
            <button onclick="this.parentElement.parentElement.remove()" style="float: right; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 10px; cursor: pointer;">Tutup</button>
            <div style="clear: both;"></div>
    `;
    
    for (let i = 0; i < results.length; i++) {
        let r = results[i];
        let statusColor = r.isCorrect ? "#10b981" : "#ef4444";
        let statusText = r.isCorrect ? "✅ BENAR" : "❌ SALAH";
        
        html += `
            <div style="border: 1px solid #e0e0e0; border-radius: 15px; padding: 15px; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: #6d28d9;">Soal ${i+1}</strong>
                    <span style="background: ${statusColor}; color: white; padding: 5px 10px; border-radius: 10px; font-size: 12px;">${statusText}</span>
                </div>
                <p style="margin: 10px 0;"><strong>Soal:</strong> ${r.question}</p>
                <p style="margin: 5px 0;"><strong>Jawaban Anda:</strong> ${r.userAnswer}</p>
                <p style="margin: 5px 0;"><strong>Kunci Jawaban:</strong> ${r.correctAnswer}</p>
                <p style="margin: 10px 0; background: #f3f4f6; padding: 10px; border-radius: 10px;">
                    <strong>📝 Pembahasan:</strong> ${r.explanation}
                </p>
            </div>
        `;
    }
    
    html += `</div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
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
    
    // Tambah tombol pembahasan di result
    let skorEl = document.getElementById("skor");
    if (skorEl) {
        skorEl.innerHTML = `Anda menjawab ${score} dari ${soal.length} soal dengan benar (${percentage}%)<br><strong>${grade}</strong>
        <br><br>
        <button onclick="showDiscussion()" style="background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; margin-top: 10px;">
            📖 Lihat Pembahasan Soal
        </button>`;
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
        localStorage.clear();
        answers = {};
        ragu = {};
        reviewFlag = {};
        currentQuestion = 0;
        isDone = false;
        timeLeft = 3600;
        isRandomized = false;
        soal = originalSoal.length > 0 ? [...originalSoal] : [];

        document.getElementById("result").style.display = "none";
        document.getElementById("login").style.display = "flex";
        document.getElementById("app").style.display = "none";

        document.getElementById("nama").value = "";
        document.getElementById("token").value = "";
    }
}

// ==========================================
// FUNGSI DARK MODE & CALCULATOR
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

function toggleCalculator() {
    let modal = document.getElementById("calculatorModal");
    if (modal.style.display === "flex") {
        modal.style.display = "none";
    } else {
        modal.style.display = "flex";
    }
}

function calc(value) {
    let display = document.getElementById("calcDisplay");
    if (display) {
        display.value += value;
    }
}

function calculateResult() {
    let display = document.getElementById("calcDisplay");
    if (!display) return;
    try {
        let expr = display.value.replace(/×/g, '*').replace(/÷/g, '/');
        let result = Function('"use strict"; return (' + expr + ')')();
        display.value = result;
    } catch (e) {
        display.value = "Error";
    }
}

function clearCalc() {
    let display = document.getElementById("calcDisplay");
    if (display) display.value = "";
}

loadDarkMode();

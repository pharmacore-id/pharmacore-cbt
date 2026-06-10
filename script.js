// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentQuestion = 0;
let answers = {};
let ragu = {};
let totalSoal = 50;
let soal = [];
let token = "";
let nama = "";
let timer = null;
let isDone = false;
let timeLeft = 3600;

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

// ==========================================
// FUNGSI SAVE & LOAD
// ==========================================
function saveState() {
    localStorage.setItem("cbt_answers", JSON.stringify(answers));
    localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
    localStorage.setItem("cbt_current", currentQuestion);
}

function loadSavedState() {
    const savedAnswers = localStorage.getItem("cbt_answers");
    const savedRagu = localStorage.getItem("cbt_ragu");
    const savedCurrent = localStorage.getItem("cbt_current");
    
    if (savedAnswers) answers = JSON.parse(savedAnswers);
    if (savedRagu) ragu = JSON.parse(savedRagu);
    if (savedCurrent && !isNaN(parseInt(savedCurrent))) {
        currentQuestion = parseInt(savedCurrent);
    }
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
// FUNGSI NAVIGASI
// ==========================================
function renderQuestion() {
    if (!soal || soal.length === 0) return;
    const s = soal[currentQuestion];
    if (!s) return;

    document.getElementById("questionLabel").innerHTML = `Soal ${currentQuestion + 1}`;
    document.getElementById("q").innerHTML = s.pertanyaan;

    let optHtml = `
        <div class="opt ${answers[currentQuestion] == 'A' ? 'active' : ''}" data-answer="A">
            <div class="letter">A</div>
            <div>${s.a || "Opsi A"}</div>
        </div>
        <div class="opt ${answers[currentQuestion] == 'B' ? 'active' : ''}" data-answer="B">
            <div class="letter">B</div>
            <div>${s.b || "Opsi B"}</div>
        </div>
        <div class="opt ${answers[currentQuestion] == 'C' ? 'active' : ''}" data-answer="C">
            <div class="letter">C</div>
            <div>${s.c || "Opsi C"}</div>
        </div>
        <div class="opt ${answers[currentQuestion] == 'D' ? 'active' : ''}" data-answer="D">
            <div class="letter">D</div>
            <div>${s.d || "Opsi D"}</div>
        </div>
    `;
    document.getElementById("opt").innerHTML = optHtml;

    // Add click listeners to options
    document.querySelectorAll('.opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const answer = opt.getAttribute('data-answer');
            pick(answer);
        });
    });

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
        html += `<button class="${classes.join(" ")}" data-index="${i}">${i + 1}</button>`;
    }
    document.getElementById("nav").innerHTML = html;
    
    // Add click listeners
    document.querySelectorAll('#nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            goToQuestion(index);
        });
    });
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
// FUNGSI TIMER
// ==========================================
function startTimer() {
    const saved = localStorage.getItem("cbt_time");
    const submitted = localStorage.getItem("cbt_submitted");
    if (submitted === "true") return;
    
    timeLeft = saved ? parseInt(saved) : 3600;
    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        if (isDone) return;
        if (timeLeft <= 0) {
            clearInterval(timer);
            submit();
        } else {
            timeLeft--;
            localStorage.setItem("cbt_time", timeLeft);
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            let timerEl = document.getElementById("timer");
            if (timerEl) {
                timerEl.innerHTML = `${m}:${s < 10 ? '0' + s : s}`;
            }
        }
    }, 1000);
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

    fetch(`${API}?action=validateToken&token=${token}`)
        .then(r => r.json())
        .then(res => {
            if (!res.valid) {
                alert("Token tidak valid");
                return;
            }
            document.getElementById("login").style.display = "none";
            document.getElementById("app").style.display = "block";
            loadQuestions();
        })
        .catch(err => {
            console.error("LOGIN ERROR:", err);
            alert("Gagal validasi token");
        });
}

function loadQuestions() {
    fetch(`${API}?action=getSoal`)
        .then(r => r.json())
        .then(res => {
            if (!res || !res.soal || res.soal.length === 0) {
                alert("Soal tidak ditemukan");
                return;
            }
            soal = res.soal;
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
        .catch(err => {
            console.error(err);
            alert("Gagal load soal");
        });
}

// ==========================================
// FUNGSI SUBMIT & RESULT
// ==========================================
function submit() {
    if (isDone) return;
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
    }).catch(err => console.error("Submit error:", err));

    showResult(score);
}

function showResult(score) {
    document.getElementById("app").style.display = "none";
    document.getElementById("result").style.display = "flex";
    document.getElementById("scoreNumber").innerHTML = score;

    let percentage = Math.round((score / soal.length) * 100);
    let grade = "";
    if (percentage >= 90) grade = "🏆 Luar Biasa!";
    else if (percentage >= 75) grade = "✅ Sangat Baik";
    else if (percentage >= 60) grade = "📚 Baik, perlu belajar lagi";
    else grade = "📖 Perlu belajar lebih giat";

    let skorEl = document.getElementById("skor");
    if (skorEl) {
        skorEl.innerHTML = `Anda menjawab ${score} dari ${soal.length} soal dengan benar (${percentage}%)<br><strong>${grade}</strong>`;
    }
    loadLeaderboard();
}

function loadLeaderboard() {
    fetch(`${API}?action=leaderboard&token=${token}`)
        .then(r => r.json())
        .then(res => {
            let board = document.getElementById("board");
            if (!board) return;
            if (res.leaderboard && res.leaderboard.length > 0) {
                let html = "<ol style='text-align:left;margin-top:20px;'>";
                res.leaderboard.slice(0, 10).forEach((item) => {
                    html += `<li style='margin:10px 0;padding:8px;background:#f8f6ff;border-radius:12px;'>
                        <strong>${item.nama}</strong> - Skor: ${item.skor}/${soal.length}
                    </li>`;
                });
                html += "</ol>";
                board.innerHTML = html;
            } else {
                board.innerHTML = "<p>Belum ada data leaderboard</p>";
            }
        })
        .catch(err => {
            console.error("Leaderboard error:", err);
            let board = document.getElementById("board");
            if (board) board.innerHTML = "<p>Gagal memuat leaderboard</p>";
        });
}

function restartExam() {
    localStorage.clear();
    answers = {};
    ragu = {};
    currentQuestion = 0;
    isDone = false;
    timeLeft = 3600;

    document.getElementById("result").style.display = "none";
    document.getElementById("login").style.display = "flex";
    document.getElementById("app").style.display = "none";

    document.getElementById("nama").value = "";
    document.getElementById("token").value = "";
}

// ==========================================
// FUNGSI DARK MODE
// ==========================================
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    let isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDark);
    let darkBtn = document.getElementById("darkModeBtn");
    if (darkBtn) {
        darkBtn.innerHTML = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    }
}

function loadDarkMode() {
    let saved = localStorage.getItem("darkMode");
    if (saved === "true") {
        document.body.classList.add("dark-mode");
        let darkBtn = document.getElementById("darkModeBtn");
        if (darkBtn) darkBtn.innerHTML = "☀️ Light Mode";
    }
}

// ==========================================
// FUNGSI CALCULATOR
// ==========================================
function toggleCalculator() {
    let modal = document.getElementById("calculatorModal");
    if (modal.style.display === "flex") {
        modal.style.display = "none";
    } else {
        modal.style.display = "flex";
    }
}

function initCalculator() {
    // Calculator buttons
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            let value = btn.getAttribute('data-value');
            let display = document.getElementById("calcDisplay");
            if (display && value) {
                display.value += value;
            }
        });
    });

    document.getElementById("calcEqual").addEventListener('click', () => {
        let display = document.getElementById("calcDisplay");
        if (!display) return;
        try {
            let expr = display.value.replace(/×/g, '*').replace(/÷/g, '/');
            let result = Function('"use strict"; return (' + expr + ')')();
            display.value = result;
        } catch (e) {
            display.value = "Error";
        }
    });

    document.getElementById("calcClear").addEventListener('click', () => {
        let display = document.getElementById("calcDisplay");
        if (display) display.value = "";
    });

    document.getElementById("closeCalcBtn").addEventListener('click', () => {
        document.getElementById("calculatorModal").style.display = "none";
    });
}

// ==========================================
// EVENT LISTENERS & INIT
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM Ready - Initializing...");
    
    // Load dark mode preference
    loadDarkMode();
    
    // Initialize calculator
    initCalculator();
    
    // Button event listeners
    document.getElementById("startBtn").addEventListener('click', login);
    document.getElementById("prevBtn").addEventListener('click', prevQuestion);
    document.getElementById("nextBtn").addEventListener('click', nextQuestion);
    document.getElementById("raguBtn").addEventListener('click', toggleRagu);
    document.getElementById("submitBtn").addEventListener('click', submit);
    document.getElementById("darkModeBtn").addEventListener('click', toggleDarkMode);
    document.getElementById("calcBtn").addEventListener('click', toggleCalculator);
    document.getElementById("restartBtn").addEventListener('click', restartExam);
    
    // Close calculator when clicking outside
    window.addEventListener("click", function(e) {
        let modal = document.getElementById("calculatorModal");
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});

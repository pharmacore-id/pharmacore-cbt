// ========== KONFIGURASI ==========
const API = "https://script.google.com/macros/s/AKfycby0kMo7ooyAlkH1xCBVajFGcgaUsSCCmZsXjHXGTbPnakAh5kQ4R87NNUxk_VSRIBXztw/exec";
const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

let currentQuestion = 0, answers = {}, ragu = {}, soal = [], token = "", nama = "";
let timer = null, isDone = false, timeLeft = 0, isLoggedIn = false, calcMemory = 0, completionTimeSeconds = 0;
let currentSheetSoal = "", currentDurasi = 3600;

// ========== SAVE/LOAD STATE ==========
function saveState() {
  localStorage.setItem("cbt_answers", JSON.stringify(answers));
  localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
  localStorage.setItem("cbt_current", currentQuestion);
  localStorage.setItem("cbt_time", timeLeft);
  localStorage.setItem("cbt_isLoggedIn", isLoggedIn);
  localStorage.setItem("cbt_nama", nama);
  localStorage.setItem("cbt_token", token);
  if (soal.length) localStorage.setItem("cbt_soal", JSON.stringify(soal));
  localStorage.setItem("cbt_sheetSoal", currentSheetSoal);
  localStorage.setItem("cbt_durasi", currentDurasi);
}

function loadSavedState() {
  const saved = localStorage.getItem("cbt_answers");
  if (saved) answers = JSON.parse(saved);
  const savedRagu = localStorage.getItem("cbt_ragu");
  if (savedRagu) ragu = JSON.parse(savedRagu);
  const savedCur = localStorage.getItem("cbt_current");
  if (savedCur) currentQuestion = parseInt(savedCur);
  const savedTime = localStorage.getItem("cbt_time");
  if (savedTime) timeLeft = parseInt(savedTime);
  const savedLogged = localStorage.getItem("cbt_isLoggedIn");
  if (savedLogged === "true") isLoggedIn = true;
  const savedNama = localStorage.getItem("cbt_nama");
  if (savedNama) nama = savedNama;
  const savedToken = localStorage.getItem("cbt_token");
  if (savedToken) token = savedToken;
  const savedSoal = localStorage.getItem("cbt_soal");
  if (savedSoal) soal = JSON.parse(savedSoal);
  const savedSheet = localStorage.getItem("cbt_sheetSoal");
  if (savedSheet) currentSheetSoal = savedSheet;
  const savedDurasi = localStorage.getItem("cbt_durasi");
  if (savedDurasi) currentDurasi = parseInt(savedDurasi);
}

function clearSession() {
  localStorage.clear();
  answers = {}; ragu = {}; currentQuestion = 0; isDone = false; isLoggedIn = false; soal = []; nama = ""; token = ""; currentSheetSoal = "";
  timeLeft = currentDurasi;
  if (timer) { clearInterval(timer); timer = null; }
}

// ========== UI HELPERS ==========
function updateProgress() {
  if (!soal.length) return;
  let progress = ((currentQuestion + 1) / soal.length) * 100;
  let fill = document.getElementById("progressFill");
  if (fill) fill.style.width = progress + "%";
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

function renderQuestion() {
  if (!soal.length || !soal[currentQuestion]) return;
  const s = soal[currentQuestion];
  document.getElementById("questionLabel").innerHTML = "Soal " + (currentQuestion + 1);
  document.getElementById("q").innerHTML = s.Pertanyaan || "Soal tidak tersedia";
  let optHtml = "";
  for (let opt of OPTIONS) {
    let optText = s[opt] || '';
    if (optText === '') optText = `Opsi ${opt}`;
    optHtml += `<div class="opt ${answers[currentQuestion] == opt ? 'active' : ''}" onclick="pick('${opt}')">
      <div class="letter">${opt}</div><div>${optText}</div></div>`;
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

// ========== TIMER ==========
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
      if (timeLeft === 300) alert("⏰ 5 menit lagi!");
      if (timeLeft === 60) alert("⏰ 1 menit lagi!");
    }
  }, 1000);
}

// ========== REVIEW MODAL SEBELUM SUBMIT ==========
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
      <span><strong>Soal ${i + 1}</strong></span>
      <span>${status}</span>
      <button class="secondary-btn" onclick="goToQuestionFromReview(${i})">Lanjutkan</button>
    </div>`;
  }
  document.getElementById("reviewQuestionList").innerHTML = listHtml;
  document.getElementById("reviewModal").style.display = "flex";
}

function goToQuestionFromReview(idx) { closeReviewModal(); goToQuestion(idx); }
function closeReviewModal() { document.getElementById("reviewModal").style.display = "none"; }
function confirmSubmit() { closeReviewModal(); submit(); }

// ========== SUBMIT ==========
function formatTimeDisplay(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${mins} menit ${secs} detik`;
}

function submit() {
  if (isDone) return;
  if (!soal || soal.length === 0) { alert("Soal belum dimuat."); return; }
  let unanswered = soal.length - Object.keys(answers).length;
  if (!confirm(`Yakin kumpul? ${Object.keys(answers).length}/${soal.length} terjawab, ${unanswered} belum.`)) return;
  isDone = true;
  clearInterval(timer);
  completionTimeSeconds = currentDurasi - timeLeft;
  let score = 0;
  let results = [];
  for (let i = 0; i < soal.length; i++) {
    let userAns = answers[i] ? String(answers[i]).trim() : "";
    let correctAns = soal[i].Kunci ? String(soal[i].Kunci).trim() : "";
    let isCorrect = (userAns === correctAns);
    if (isCorrect) score++;
    results.push({
      nomor: i+1,
      pertanyaan: soal[i].Pertanyaan,
      jawabanUser: userAns || "(Tidak dijawab)",
      kunci: correctAns,
      benar: isCorrect,
      pembahasan: soal[i].Pembahasan || "Tidak ada pembahasan"
    });
  }
  localStorage.setItem("cbt_submitted", "true");
  localStorage.setItem("cbt_score", score);
  localStorage.setItem("cbt_results", JSON.stringify(results));
  localStorage.setItem("cbt_completion_time", completionTimeSeconds);
  let waktuStr = formatTimeDisplay(completionTimeSeconds);
  fetch(API, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "submit", nama, token, skor: score, jawaban: answers, total: soal.length, waktu: waktuStr })
  }).catch(e => console.log);
  showResult(score);
  
  setTimeout(() => {
    if (confirm("✅ Ujian selesai!\n\nToken ini tidak dapat digunakan lagi.\n\nSimpan pembahasan (PDF) sekarang?")) {
      openDiscussionModal();
      setTimeout(() => window.print(), 500);
    }
  }, 500);
}

function showResult(score) {
  document.getElementById("app").style.display = "none";
  document.getElementById("result").style.display = "flex";
  let persen = Math.round((score / soal.length) * 100);
  document.getElementById("scoreNumber").innerHTML = persen + "%";
  let grade = persen >= 90 ? "🏆 Luar Biasa!" : persen >= 75 ? "✅ Sangat Baik" : persen >= 60 ? "📚 Cukup" : "📖 Perlu Belajar Lebih Lanjut";
  document.getElementById("skor").innerHTML = `<strong>${grade}</strong><br>${score} dari ${soal.length} benar (${persen}%)`;
  document.getElementById("resultNama").innerText = nama;
  document.getElementById("resultBenar").innerText = score;
  document.getElementById("resultSalah").innerText = soal.length - score;
  let waktuStr = formatTimeDisplay(completionTimeSeconds);
  document.getElementById("resultWaktu").innerText = waktuStr;
  loadLeaderboard();
}

function openDiscussionModal() {
  let results = JSON.parse(localStorage.getItem("cbt_results") || "[]");
  let soalData = JSON.parse(localStorage.getItem("cbt_soal") || "[]");
  if (!results.length) { alert("Tidak ada data."); return; }
  let html = `<div style="text-align:center; margin-bottom:20px;"><h2>📝 Hasil Ujian</h2><p>Skor: ${localStorage.getItem("cbt_score")}/${soalData.length}</p></div>`;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const s = soalData[i];
    const userAnswer = r.jawabanUser;
    const correctKey = r.kunci;
    html += `<div style="border:1px solid #ddd; border-radius:12px; padding:12px; margin-bottom:12px;">
      <h4>Soal ${r.nomor}. ${r.pertanyaan}</h4>`;
    for (let opt of OPTIONS) {
      let optText = s[opt] || '';
      let isUser = (userAnswer === opt);
      let isCorrectKey = (correctKey === opt);
      let bgColor = "#fff";
      let indicator = "";
      if (isUser && isCorrectKey) { bgColor = "#d1fae5"; indicator = " ✓ (jawaban Anda benar)"; }
      else if (isUser && !isCorrectKey) { bgColor = "#fee2e2"; indicator = " ✗ (jawaban Anda salah)"; }
      else if (!isUser && isCorrectKey) { bgColor = "#fef9c3"; indicator = " ★ (kunci jawaban)"; }
      html += `<div style="padding:6px 10px; margin:4px 0; border-radius:8px; background:${bgColor};">${opt}. ${optText} ${indicator}</div>`;
    }
    html += `<div style="margin-top:8px; padding:8px; background:#f3f4f6; border-radius:8px;"><strong>Pembahasan:</strong> ${r.pembahasan}</div></div>`;
  }
  document.getElementById("discussionContent").innerHTML = html;
  document.getElementById("discussionModal").style.display = "flex";
}
function closeDiscussionModal() { document.getElementById("discussionModal").style.display = "none"; }

// ========== LEADERBOARD ==========
function loadLeaderboard() {
  const board = document.getElementById("board");
  if (!board) return;
  board.innerHTML = '<div style="text-align:center; padding:20px;">Memuat leaderboard...</div>';
  fetch(API + "?action=leaderboard&token=" + token)
    .then(r => r.json())
    .then(res => {
      if (res.leaderboard && res.leaderboard.length) {
        let data = res.leaderboard.map(item => ({ nama: item.nama, skor: item.skor, total: soal.length, waktu: item.waktu || "00:00" }));
        data.sort((a,b) => b.skor - a.skor);
        let podiumHtml = `<div class="podium-container">`;
        for (let i = 0; i < Math.min(3, data.length); i++) {
          let persen = Math.round((data[i].skor / data[i].total) * 100);
          podiumHtml += `<div class="podium-item podium-${i+1}">
            <div class="podium-block"><div class="medal">${i===0?"🥇":i===1?"🥈":"🥉"}</div></div>
            <div class="podium-name">${data[i].nama}</div>
            <div class="podium-score">${persen}%</div>
            <div class="podium-time">${data[i].waktu}</div>
          </div>`;
        }
        podiumHtml += `</div>`;
        let listHtml = `<div class="leaderboard-list"><div class="leaderboard-header">
          <div class="rank">#</div><div class="name">Peserta</div><div class="score">Skor</div><div class="time">Waktu</div>
        </div>`;
        let userRank = null;
        for (let i = 0; i < data.length; i++) {
          let persen = Math.round((data[i].skor / data[i].total) * 100);
          let myClass = (data[i].nama === nama) ? "my-rank" : "";
          if (data[i].nama === nama) userRank = i+1;
          listHtml += `<div class="leaderboard-item ${myClass}">
            <div class="rank">${i+1}</div><div class="name">${data[i].nama}</div>
            <div class="score">${persen}%</div><div class="time">${data[i].waktu}</div>
          </div>`;
        }
        listHtml += `</div>`;
        let yourRankHtml = userRank ? `<div class="your-rank-card">🏆 Peringkat Anda: #${userRank}</div>` : `<div class="your-rank-card">📊 Anda belum memiliki data.</div>`;
        board.innerHTML = podiumHtml + listHtml + yourRankHtml;
      } else {
        board.innerHTML = '<div style="text-align:center; padding:20px;">🏆 Belum ada data leaderboard.</div>';
      }
    })
    .catch(() => board.innerHTML = '<div style="text-align:center; padding:20px;">⚠️ Gagal memuat leaderboard.</div>');
}

function restartExam() { if (confirm("Ujian baru?")) { clearSession(); location.reload(); } }
function goHome() { if (confirm("Kembali ke login?")) { clearSession(); location.reload(); } }

// ========== LOGIN ==========
function login() {
  nama = document.getElementById("nama").value.trim();
  token = document.getElementById("token").value.trim();
  if (!nama || !token) { alert("Lengkapi data!"); return; }
  fetch(API + "?action=validateToken&token=" + token)
    .then(r => r.json())
    .then(res => {
      if (!res.valid) { alert("Token tidak valid!"); return; }
      if (res.used) { alert("Token sudah digunakan! Token hanya sekali pakai."); return; }
      alert("⚠️ Token hanya bisa digunakan SEKALI. Simpan pembahasan setelah submit!");
      currentDurasi = res.durasi || 3600;
      currentSheetSoal = res.sheetSoal || "SOAL A";
      timeLeft = currentDurasi;
      isLoggedIn = true;
      saveState();
      document.getElementById("login").style.display = "none";
      document.getElementById("app").style.display = "block";
      loadQuestions();
    })
    .catch(() => alert("Gagal validasi token"));
}

function loadQuestions() {
  if (soal.length) { startFromSaved(); return; }
  fetch(API + "?action=getSoal&sheet=" + encodeURIComponent(currentSheetSoal))
    .then(r => r.json())
    .then(res => {
      if (!res.soal || !res.soal.length) { alert("Soal tidak ditemukan"); return; }
      soal = res.soal;
      document.getElementById("totalCount").innerText = soal.length;
      startFromSaved();
      saveState();
    })
    .catch(() => alert("Gagal load soal"));
}

function startFromSaved() {
  renderQuestion();
  updateNavGrid();
  updateStats();
  startTimer();
}

// ========== DARK MODE & CALCULATOR ==========
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}
function loadDarkMode() { if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark-mode"); }

function toggleCalculator() {
  let modal = document.getElementById("calculatorModal");
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}
function initCalculator() {
  document.querySelectorAll(".calc-grid button").forEach(btn => {
    btn.onclick = () => {
      let display = document.getElementById("calcDisplay");
      if (btn.hasAttribute("data-num")) display.value += btn.getAttribute("data-num");
      else if (btn.hasAttribute("data-op")) display.value += btn.getAttribute("data-op");
      else if (btn.getAttribute("data-action") === "equal") {
        try { display.value = Function('return (' + display.value.replace(/×/g,'*').replace(/÷/g,'/') + ')')(); } catch(e) { display.value = "Error"; }
      } else if (btn.getAttribute("data-action") === "clear") display.value = "";
      else if (btn.getAttribute("data-action") === "backspace") display.value = display.value.slice(0,-1);
      else if (btn.getAttribute("data-action") === "sin") display.value = Math.sin(parseFloat(display.value) * Math.PI/180);
      else if (btn.getAttribute("data-action") === "cos") display.value = Math.cos(parseFloat(display.value) * Math.PI/180);
      else if (btn.getAttribute("data-action") === "tan") display.value = Math.tan(parseFloat(display.value) * Math.PI/180);
      else if (btn.getAttribute("data-action") === "log") display.value = Math.log10(parseFloat(display.value));
      else if (btn.getAttribute("data-action") === "ln") display.value = Math.log(parseFloat(display.value));
      else if (btn.getAttribute("data-action") === "sqrt") display.value = Math.sqrt(parseFloat(display.value));
      else if (btn.getAttribute("data-action") === "pow2") display.value = Math.pow(parseFloat(display.value), 2);
      else if (btn.getAttribute("data-action") === "pow3") display.value = Math.pow(parseFloat(display.value), 3);
      else if (btn.getAttribute("data-action") === "reciprocal") display.value = 1 / parseFloat(display.value);
      else if (btn.getAttribute("data-action") === "pi") display.value = Math.PI;
      else if (btn.getAttribute("data-action") === "percent") display.value = parseFloat(display.value) / 100;
      else if (btn.getAttribute("data-action") === "mc") calcMemory = 0;
      else if (btn.getAttribute("data-action") === "mplus") calcMemory += parseFloat(display.value);
      else if (btn.getAttribute("data-action") === "mminus") calcMemory -= parseFloat(display.value);
      else if (btn.getAttribute("data-action") === "mr") display.value = calcMemory;
      else if (btn.getAttribute("data-action") === "ms") calcMemory = parseFloat(display.value);
    };
  });
}

function checkExistingSession() {
  loadSavedState();
  loadDarkMode();
  if (localStorage.getItem("cbt_submitted") === "true") {
    let savedScore = localStorage.getItem("cbt_score");
    if (savedScore) {
      document.getElementById("login").style.display = "none";
      showResult(parseInt(savedScore));
    }
  } else if (isLoggedIn) {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    if (soal.length) {
      document.getElementById("totalCount").innerText = soal.length;
      renderQuestion(); updateNavGrid(); updateStats(); startTimer();
    } else if (currentSheetSoal) loadQuestions();
  }
}

// ========== INIT EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", function() {
  initCalculator();
  document.getElementById("startBtn").onclick = login;
  document.getElementById("prevBtn").onclick = prevQuestion;
  document.getElementById("nextBtn").onclick = nextQuestion;
  document.getElementById("raguBtn").onclick = toggleRagu;
  document.getElementById("submitBtn").onclick = showReviewModal;
  document.getElementById("darkModeBtn").onclick = toggleDarkMode;
  document.getElementById("calcBtn").onclick = toggleCalculator;
  document.getElementById("closeReviewModal").onclick = closeReviewModal;
  document.getElementById("backToExamBtn").onclick = closeReviewModal;
  document.getElementById("confirmSubmitBtn").onclick = confirmSubmit;
  document.getElementById("closeDiscussionModal").onclick = closeDiscussionModal;
  document.getElementById("exportPDFBtn").onclick = () => window.print();
  document.getElementById("reviewResultBtn").onclick = openDiscussionModal;
  document.getElementById("restartExamBtn").onclick = restartExam;
  document.getElementById("closeCalcBtn").onclick = toggleCalculator;
  checkExistingSession();
});

// ========== KONFIGURASI ==========
const API = "https://script.google.com/macros/s/AKfycbzKqVY45csFN2NyQT0xs64CctdceoMUQ4mxH-1xuoukaSfa42TrsdN4SRydq-AId-ecBg/exec";
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
  const sAns = localStorage.getItem("cbt_answers");
  const sRag = localStorage.getItem("cbt_ragu");
  const sCur = localStorage.getItem("cbt_current");
  const sTime = localStorage.getItem("cbt_time");
  const sLogged = localStorage.getItem("cbt_isLoggedIn");
  const sNama = localStorage.getItem("cbt_nama");
  const sToken = localStorage.getItem("cbt_token");
  const sSoal = localStorage.getItem("cbt_soal");
  const sSheet = localStorage.getItem("cbt_sheetSoal");
  const sDurasi = localStorage.getItem("cbt_durasi");
  if (sAns) answers = JSON.parse(sAns);
  if (sRag) ragu = JSON.parse(sRag);
  if (sCur) currentQuestion = parseInt(sCur);
  if (sTime) timeLeft = parseInt(sTime);
  if (sLogged === "true") { isLoggedIn = true; nama = sNama || ""; token = sToken || ""; }
  if (sSoal) soal = JSON.parse(sSoal);
  if (sSheet) currentSheetSoal = sSheet;
  if (sDurasi) currentDurasi = parseInt(sDurasi);
}

function clearExamData() {
  localStorage.removeItem("cbt_answers");
  localStorage.removeItem("cbt_ragu");
  localStorage.removeItem("cbt_current");
  localStorage.removeItem("cbt_time");
  localStorage.removeItem("cbt_submitted");
  localStorage.removeItem("cbt_score");
  localStorage.removeItem("cbt_results");
  localStorage.removeItem("cbt_completion_time");
  localStorage.removeItem("cbt_soal");
  localStorage.removeItem("cbt_sheetSoal");
  localStorage.removeItem("cbt_durasi");
  answers = {};
  ragu = {};
  currentQuestion = 0;
  isDone = false;
  timeLeft = currentDurasi;
  completionTimeSeconds = 0;
  soal = [];
  currentSheetSoal = "";
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
  if (!soal.length) return;
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
      if (timeLeft === 300) showToast("⏰ Peringatan! Waktu tersisa 5 menit.", "warning");
      if (timeLeft === 60) showToast("⏰ Peringatan! Waktu tersisa 1 menit!", "danger");
    }
  }, 1000);
}

function showToast(message, type = "warning") {
  const toast = document.createElement("div");
  toast.className = `toast-warning ${type === "danger" ? "danger" : ""}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
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
      <button class="secondary-btn lanjutkan-link" onclick="goToQuestionFromReview(${i})">Lanjutkan</button>
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
  if (!confirm(`Yakin kumpul? ${Object.keys(answers).length}/${soal.length} terjawab, ${unanswered} belum. Lanjutkan?`)) return;
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
    let options = {};
    for (let opt of OPTIONS) options[opt] = soal[i][opt] || '';
    results.push({
      nomor: i + 1,
      pertanyaan: soal[i].Pertanyaan,
      jawabanUser: userAns || "(Tidak dijawab)",
      kunci: correctAns,
      benar: isCorrect,
      pembahasan: soal[i].Pembahasan || "Tidak ada pembahasan",
      options: options
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submit",
      nama, token,
      skor: score,
      jawaban: answers,
      total: soal.length,
      waktu: waktuStr,
      sheetSoal: currentSheetSoal
    })
  }).catch(e => console.log);

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
  let score = parseInt(localStorage.getItem("cbt_score") || "0");
  let totalSoal = soalData.length;
  if (!results.length) { alert("Tidak ada数据."); return; }
  let persen = Math.round((score / totalSoal) * 100);
  let html = `<div style="text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #ddd;">
      <h2 style="margin:0 0 8px 0;">📝 Hasil Ujian</h2>
      <div style="font-size:28px; font-weight:bold; color:#10b981; margin:8px 0;">${score} / ${totalSoal} (${persen}%)</div>
      <div style="display:flex; justify-content:center; gap:24px; flex-wrap:wrap; margin-top:12px;">
        <div><strong>👤 Nama:</strong> ${nama}</div>
        <div><strong>✅ Benar:</strong> ${score}</div>
        <div><strong>❌ Salah:</strong> ${totalSoal - score}</div>
      </div>
    </div>`;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const s = soalData[i];
    const userAnswer = r.jawabanUser;
    const correctKey = r.kunci;
    html += `<div class="discussion-question">
      <h4>Soal ${r.nomor}. ${r.pertanyaan}</h4>
      <div class="options-list">`;
    for (let opt of OPTIONS) {
      let optText = s[opt] || '';
      let isUser = (userAnswer === opt);
      let isCorrectKey = (correctKey === opt);
      let additionalClass = "";
      let indicator = "";
      if (isUser && isCorrectKey) {
        additionalClass = "user-correct";
        indicator = " ✓ (jawaban Anda benar)";
      } else if (isUser && !isCorrectKey) {
        additionalClass = "wrong-option";
        indicator = " ✗ (jawaban Anda salah)";
      } else if (!isUser && isCorrectKey) {
        additionalClass = "correct-option";
        indicator = " ★ (kunci jawaban)";
      }
      html += `<div class="option-item ${additionalClass}">
        <strong>${opt}.</strong> ${optText} ${indicator}
      </div>`;
    }
    html += `</div><div class="discussion-pembahasan"><strong>📘 Pembahasan:</strong> ${r.pembahasan}</div></div>`;
  }
  document.getElementById("discussionContent").innerHTML = html;
  document.getElementById("discussionModal").style.display = "flex";
}

function closeDiscussionModal() { document.getElementById("discussionModal").style.display = "none"; }
function exportDiscussionPDF() { window.print(); }

function loadLeaderboard() {
  const board = document.getElementById("board");
  if (!board) return;
  board.innerHTML = '<div style="text-align:center; padding:20px;">Memuat leaderboard...</div>';
  fetch(API + "?action=leaderboard&token=" + token)
    .then(r => r.json())
    .then(res => {
      if (res.leaderboard && res.leaderboard.length) {
        let data = res.leaderboard.map(item => ({ nama: item.nama, skor: item.skor, total: soal.length, waktu: item.waktu || "00:00" }));
        data.sort((a, b) => b.skor - a.skor);
        let podiumHtml = `<div class="podium-container">`;
        const medals = ["🥇", "🥈", "🥉"];
        const colors = ["podium-1", "podium-2", "podium-3"];
        for (let i = 0; i < Math.min(3, data.length); i++) {
          const item = data[i];
          const persen = Math.round((item.skor / item.total) * 100);
          podiumHtml += `
            <div class="podium-item ${colors[i]}">
              <div class="podium-block"><div class="medal">${medals[i]}</div></div>
              <div class="podium-rank">#${i+1}</div>
              <div class="podium-name">${item.nama}</div>
              <div class="podium-score">${persen}%</div>
              <div class="podium-time">${item.waktu}</div>
            </div>`;
        }
        podiumHtml += `</div>`;
        let listHtml = `<div class="leaderboard-list"><div class="leaderboard-header">
          <div class="rank">#</div><div class="name">Peserta</div><div class="score">Skor</div><div class="time">Waktu</div>
        </div>`;
        let userRankData = null;
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const rank = i + 1;
          const myClass = (item.nama === nama) ? "my-rank" : "";
          const persen = Math.round((item.skor / item.total) * 100);
          if (item.nama === nama) userRankData = { rank, persen, waktu: item.waktu };
          listHtml += `
            <div class="leaderboard-item ${myClass}">
              <div class="rank">${rank}</div>
              <div class="name">${item.nama}</div>
              <div class="score">${persen}%</div>
              <div class="time">${item.waktu}</div>
            </div>`;
        }
        listHtml += `</div>`;
        let yourRankHtml = userRankData ? `<div class="your-rank-card"><span>🏆</span> Peringkat Anda: #${userRankData.rank} &nbsp;|&nbsp; Skor: ${userRankData.persen}% &nbsp;|&nbsp; Waktu: ${userRankData.waktu}</div>` : `<div class="your-rank-card"><span>📊</span> Anda belum memiliki数据 di leaderboard.</div>`;
        board.innerHTML = podiumHtml + listHtml + yourRankHtml;
      } else {
        board.innerHTML = '<div style="text-align:center; padding:20px;">🏆 Belum ada data leaderboard untuk paket ini.</div>';
      }
    })
    .catch(() => board.innerHTML = '<div style="text-align:center; padding:20px;">⚠️ Gagal memuat leaderboard.</div>');
}

function restartExam() {
  if (confirm("Ujian baru akan menghapus semua jawaban. Lanjutkan?")) {
    clearSession();
    location.reload();
  }
}
function goHome() {
  if (confirm("Kembali ke halaman login? Anda dapat melanjutkan ujian nanti dengan token yang sama.")) {
    document.getElementById("app").style.display = "none";
    document.getElementById("login").style.display = "flex";
  }
}

// ========== LOGIN & LOAD SOAL ==========
function login() {
  console.log("Login function called");
  nama = document.getElementById("nama").value.trim();
  token = document.getElementById("token").value.trim();
  if (!nama || !token) { alert("Lengkapi data!"); return; }
  
  fetch(API + "?action=validateToken&token=" + token)
    .then(r => r.json())
    .then(res => {
      console.log("API Response:", res);
      if (!res.valid) { alert("Token tidak valid!"); return; }
      if (res.used) { alert("Token sudah digunakan."); return; }
      
      const savedToken = localStorage.getItem("cbt_token");
      if (savedToken && savedToken !== token) {
        clearExamData();
      }
      
      const warningDiv = document.getElementById("tokenWarning");
      if (warningDiv) warningDiv.style.display = "flex";
      
      currentDurasi = res.durasi || 3600;
      currentSheetSoal = res.sheetSoal || "SOAL A";
      timeLeft = currentDurasi;
      isLoggedIn = true;
      saveState();
      
      document.getElementById("login").style.display = "none";
      document.getElementById("app").style.display = "block";
      loadQuestions();
    })
    .catch(err => { console.error(err); alert("Gagal validasi token"); });
}

function loadQuestions() {
  if (soal.length) { startFromSaved(); return; }
  fetch(API + "?action=getSoal&sheet=" + encodeURIComponent(currentSheetSoal))
    .then(r => r.json())
    .then(res => {
      if (res.error) { alert("Error: " + res.error); return; }
      if (!res.soal || !res.soal.length) { alert("Soal tidak ditemukan di sheet " + currentSheetSoal); return; }
      soal = res.soal;
      document.getElementById("totalCount").innerText = soal.length;
      startFromSaved();
      saveState();
    })
    .catch(err => { console.error(err); alert("Gagal load soal"); });
}

function startFromSaved() {
  renderQuestion();
  updateNavGrid();
  updateStats();
  startTimer();
}

// ========== DARK MODE ==========
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}
function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark-mode");
}

// ========== FUNGSI KALKULATOR ==========
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
  let d = document.getElementById("calcDisplay");
  if (!d) return;
  let key = e.key;
  if (key >= '0' && key <= '9') appendToDisplay(key);
  else if (key === '.') appendToDisplay('.');
  else if (key === '+' || key === '-' || key === '*' || key === '/') {
    let op = key === '*' ? '×' : (key === '/' ? '÷' : key);
    appendToDisplay(op);
  } else if (key === 'Enter' || key === '=') calculateResult();
  else if (key === 'Escape') toggleCalculator();
  else if (key === 'Backspace') deleteLastCalc();
  else if (key === 'c' || key === 'C') clearCalc();
}

function appendToDisplay(v) {
  let d = document.getElementById("calcDisplay");
  if (d) {
    if (d.value === "Error") d.value = "";
    d.value += v;
  }
}

function clearCalc() {
  document.getElementById("calcDisplay").value = "";
}

function deleteLastCalc() {
  let d = document.getElementById("calcDisplay");
  if (d) d.value = d.value.slice(0, -1);
}

function calculateResult() {
  let d = document.getElementById("calcDisplay");
  try {
    let expr = d.value.replace(/×/g, '*').replace(/÷/g, '/');
    let result = Function('"use strict"; return (' + expr + ')')();
    d.value = result;
  } catch(e) {
    d.value = "Error";
  }
}

function calcFunction(action) {
  let d = document.getElementById("calcDisplay");
  let val = parseFloat(d.value) || 0;
  
  switch(action) {
    // Scientific functions
    case 'sin': d.value = Math.sin(val * Math.PI / 180); break;
    case 'cos': d.value = Math.cos(val * Math.PI / 180); break;
    case 'tan': d.value = Math.tan(val * Math.PI / 180); break;
    case 'log': d.value = Math.log10(val); break;
    case 'ln': d.value = Math.log(val); break;
    case 'sqrt': d.value = Math.sqrt(val); break;
    case 'pow2': d.value = val * val; break;
    case 'pow3': d.value = val * val * val; break;
    case 'reciprocal': d.value = 1 / val; break;
    case 'pi': d.value = Math.PI; break;
    case 'e': d.value = Math.E; break;
    case 'percent': d.value = val / 100; break;
    case 'equal': calculateResult(); break;
    case 'clear': clearCalc(); break;
    case 'backspace': deleteLastCalc(); break;
    
    // Memory functions
    case 'mplus': 
      calcMemory += val;
      break;
    case 'mminus': 
      calcMemory -= val;
      break;
    case 'mc': 
      calcMemory = 0;
      break;
    case 'mr': 
      // MR: menambahkan nilai memori ke tampilan (APPEND, bukan replace)
      d.value += calcMemory;
      break;
    case 'ms':
      // MS: menyimpan nilai yang sedang tampil ke memori
      calcMemory = val;
      break;
  }
}

function initCalculator() {
  // Tombol angka
  document.querySelectorAll('.calc-num').forEach(btn => {
    btn.onclick = () => appendToDisplay(btn.getAttribute('data-num'));
  });
  // Tombol operator
  document.querySelectorAll('.calc-operator').forEach(btn => {
    btn.onclick = () => appendToDisplay(btn.getAttribute('data-op'));
  });
  // Tombol fungsi, memori, dan clear
  document.querySelectorAll('.calc-func, .calc-mem, .calc-clear').forEach(btn => {
    btn.onclick = () => calcFunction(btn.getAttribute('data-action'));
  });
}

// ========== EXPORT GLOBAL FUNCTIONS ==========
window.login = login;
window.toggleDarkMode = toggleDarkMode;
window.goHome = goHome;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.toggleRagu = toggleRagu;
window.showReviewModal = showReviewModal;
window.closeReviewModal = closeReviewModal;
window.confirmSubmit = confirmSubmit;
window.openDiscussionModal = openDiscussionModal;
window.closeDiscussionModal = closeDiscussionModal;
window.exportDiscussionPDF = exportDiscussionPDF;
window.restartExam = restartExam;
window.toggleCalculator = toggleCalculator;

// ========== PERBAIKAN CLOSE MODAL DENGAN KLIK DI LUAR ==========
// Hapus event listener lama jika ada, lalu tambahkan yang baru
window.onclick = function(event) {
  const reviewModal = document.getElementById("reviewModal");
  const discussionModal = document.getElementById("discussionModal");
  const calculatorModal = document.getElementById("calculatorModal");
  
  if (event.target === reviewModal) {
    reviewModal.style.display = "none";
  }
  if (event.target === discussionModal) {
    discussionModal.style.display = "none";
  }
  if (event.target === calculatorModal) {
    calculatorModal.style.display = "none";
    document.removeEventListener("keydown", handleKeyboard);
  }
}

// ========== PERBAIKAN FUNGSI YANG MUNGKIN HILANG ==========
if (typeof formatTimeDisplay !== 'function') {
  function formatTimeDisplay(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return `${mins} menit ${secs} detik`;
  }
}

if (typeof goHome !== 'function') {
  function goHome() {
    if (confirm("Kembali ke halaman login? Anda dapat melanjutkan ujian nanti dengan token yang sama.")) {
      if (timer) clearInterval(timer);
      document.getElementById("app").style.display = "none";
      document.getElementById("login").style.display = "flex";
    }
  }
  window.goHome = goHome;
}

if (typeof restartExam !== 'function') {
  function restartExam() {
    if (confirm("Ujian baru akan menghapus semua jawaban. Lanjutkan?")) {
      clearSession();
      location.reload();
    }
  }
  window.restartExam = restartExam;
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", function() {
  initCalculator();
  checkExistingSession();
});

// ========== KONFIGURASI ==========
const API = "https://script.google.com/macros/s/AKfycbx9AH3tu0CCMItBJimHobEqBYezxRVZm_lwJ-9h8s1Bk0NHOu0igf_jUl1GSzY1Obyl/exec"; // GANTI DENGAN URL WEB APP ANDA
const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

let currentQuestion = 0, answers = {}, ragu = {}, soal = [], token = "", nama = "";
let timer = null, isDone = false, timeLeft = 0, isLoggedIn = false, calcMemory = 0, completionTimeSeconds = 0;
let currentSheetSoal = "", currentDurasi = 3600;

// ... (semua fungsi saveState, loadState, renderQuestion, dll sama seperti sebelumnya) ...

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
    body: JSON.stringify({ action: "submit", nama, token, skor: score, jawaban: answers, total: soal.length, waktu: waktuStr })
  }).catch(e => console.log);
  showResult(score);
}

// ========== SHOW RESULT (menampilkan persentase di lingkaran) ==========
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

// ... (fungsi openDiscussionModal, exportDiscussionPDF, loadLeaderboard, login, dll tetap sama) ...

// ========== KALKULATOR ==========
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
  if (d) { if (d.value === "Error") d.value = ""; d.value += v; }
}
function clearCalc() { document.getElementById("calcDisplay").value = ""; }
function deleteLastCalc() { let d = document.getElementById("calcDisplay"); d.value = d.value.slice(0, -1); }
function calculateResult() {
  let d = document.getElementById("calcDisplay");
  try {
    let expr = d.value.replace(/×/g, '*').replace(/÷/g, '/');
    let r = Function('"use strict"; return (' + expr + ')')();
    d.value = r;
  } catch(e) { d.value = "Error"; }
}
function calcFunction(action) {
  let d = document.getElementById("calcDisplay");
  let val = parseFloat(d.value) || 0;
  switch(action) {
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
    case 'mplus': calcMemory += val; break;
    case 'mminus': calcMemory -= val; break;
    case 'mr': d.value = calcMemory; break;
    case 'mc': calcMemory = 0; break;
    case 'ms': calcMemory = val; break;
  }
}
function initCalculator() {
  document.querySelectorAll('.calc-num').forEach(btn => btn.onclick = () => appendToDisplay(btn.getAttribute('data-num')));
  document.querySelectorAll('.calc-operator').forEach(btn => btn.onclick = () => appendToDisplay(btn.getAttribute('data-op')));
  document.querySelectorAll('.calc-func, .calc-mem, .calc-clear').forEach(btn => btn.onclick = () => calcFunction(btn.getAttribute('data-action')));
}

// ... (restartExam, goHome, login, loadQuestions, dark mode, dll tetap sama) ...

document.addEventListener("DOMContentLoaded", function() {
  initCalculator();
  checkExistingSession();
});

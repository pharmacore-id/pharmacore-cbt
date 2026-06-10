window.onerror = function(msg, url, line){
  console.error("JS ERROR:", msg, "line:", line);
};

let currentQuestion = 0;
let answers = {};
let ragu = {};
let totalSoal = 50;

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

let soal = [];
let token = "";
let nama = "";
let timer;
let isDone = false;
let timeLeft = 3600;

/* =========================
LOGIN
========================= */

function login(){

  nama = document.getElementById("nama").value.trim();
  token = document.getElementById("token").value.trim();

  if(!nama || !token){
    alert("Lengkapi data terlebih dahulu");
    return;
  }

  fetch(`${API}?action=validateToken&token=${token}`)
  .then(r => r.json())
  .then(res => {

    if(!res.valid){
      alert("Token tidak valid");
      return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    load();

  })
  .catch(err => {
    console.error("LOGIN ERROR:", err);
    alert("Gagal validasi token");
  });

}

/* =========================
LOAD SOAL
========================= */

function load(){

  fetch(`${API}?action=getSoal`)
  .then(r => r.json())
  .then(res => {

    if(!res || !res.soal || res.soal.length === 0){
      alert("Soal tidak ditemukan");
      return;
    }

    soal = res.soal;
    totalSoal = soal.length;

    document.getElementById("totalCount").innerText = totalSoal;

    loadSavedState();
    
    currentQuestion = 0;

    renderQuestion();
    nav();
    updateStats();
    updateProgress();
    startTimer();

  })
  .catch(err => {
    console.error(err);
    alert("Gagal load soal");
  });
}

/* =========================
SAVE & LOAD STATE
========================= */

function saveState(){
  localStorage.setItem("cbt_answers", JSON.stringify(answers));
  localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
  localStorage.setItem("cbt_current", currentQuestion);
}

function loadSavedState(){
  const savedAnswers = localStorage.getItem("cbt_answers");
  const savedRagu = localStorage.getItem("cbt_ragu");
  const savedCurrent = localStorage.getItem("cbt_current");
  
  if(savedAnswers) answers = JSON.parse(savedAnswers);
  if(savedRagu) ragu = JSON.parse(savedRagu);
  if(savedCurrent && !isNaN(parseInt(savedCurrent))){
    currentQuestion = parseInt(savedCurrent);
  }
}

/* =========================
RENDER QUESTION
========================= */

function renderQuestion(){

  if(!soal || soal.length === 0) return;
  
  const s = soal[currentQuestion];

  if(!s){
    console.error("Soal undefined di index:", currentQuestion);
    return;
  }

  document.getElementById("questionLabel").innerHTML =
    `Soal ${currentQuestion + 1}`;

  document.getElementById("q").innerHTML = s.pertanyaan;

  document.getElementById("opt").innerHTML = `
    <div class="opt ${answers[currentQuestion]=='A'?'active':''}" onclick="pick('A')">
      <div class="letter">A</div>
      <div>${s.a || "Opsi A"}</div>
    </div>
    <div class="opt ${answers[currentQuestion]=='B'?'active':''}" onclick="pick('B')">
      <div class="letter">B</div>
      <div>${s.b || "Opsi B"}</div>
    </div>
    <div class="opt ${answers[currentQuestion]=='C'?'active':''}" onclick="pick('C')">
      <div class="letter">C</div>
      <div>${s.c || "Opsi C"}</div>
    </div>
    <div class="opt ${answers[currentQuestion]=='D'?'active':''}" onclick="pick('D')">
      <div class="letter">D</div>
      <div>${s.d || "Opsi D"}</div>
    </div>
  `;

  const btn = document.querySelector(".ragu-btn");
  if(btn){
    if(ragu[currentQuestion]){
      btn.classList.add("active");
      btn.innerHTML = "🚩 Ditandai Ragu";
    } else {
      btn.classList.remove("active");
      btn.innerHTML = "🚩 Ragu";
    }
  }

  updateProgress();
}

/* =========================
PICK ANSWER
========================= */

function pick(v){
  answers[currentQuestion] = v;
  saveState();
  renderQuestion();
  nav();
  updateStats();
}

/* =========================
NAVIGATION
========================= */

function nav(){

  if(!soal || soal.length === 0){
    document.getElementById("nav").innerHTML = "<small style='color:red'>Soal belum dimuat</small>";
    return;
  }

  let h = "";

  for(let x=0; x<soal.length; x++){

    let cls = [];
    if(answers[x]) cls.push("done");
    if(ragu[x]) cls.push("ragu");
    if(x === currentQuestion) cls.push("activeQ");

    h += `<button class="${cls.join(" ")}" onclick="go(${x})">${x+1}</button>`;
  }

  document.getElementById("nav").innerHTML = h;
}

function go(x){
  currentQuestion = x;
  renderQuestion();
  nav();
  updateStats();
  updateProgress();
  saveState();
}

function nextQuestion(){
  if(currentQuestion < soal.length - 1){
    currentQuestion++;
    renderQuestion();
    nav();
    updateStats();
    updateProgress();
    saveState();
  }
}

function prevQuestion(){
  if(currentQuestion > 0){
    currentQuestion--;
    renderQuestion();
    nav();
    updateStats();
    updateProgress();
    saveState();
  }
}

/* =========================
PROGRESS
========================= */

function updateProgress(){
  if(!soal || soal.length === 0) return;
  let progress = ((currentQuestion + 1) / soal.length) * 100;
  document.getElementById("progressFill").style.width = progress + "%";
}

/* =========================
STATS
========================= */

function updateStats(){
  if(!soal || soal.length === 0) return;

  const answered = Object.keys(answers).length;
  const unanswered = soal.length - answered;

  const a = document.getElementById("answeredCount");
  const b = document.getElementById("answeredSummary");
  const c = document.getElementById("unansweredSummary");

  if(a) a.innerText = answered;
  if(b) b.innerText = answered;
  if(c) c.innerText = unanswered;
}

/* =========================
TIMER
========================= */

function startTimer(){

  const saved = localStorage.getItem("cbt_time");
  const submitted = localStorage.getItem("cbt_submitted");
  
  if(submitted === "true"){
    return;
  }
  
  timeLeft = saved ? parseInt(saved) : 3600;

  if(timer) clearInterval(timer);

  timer = setInterval(()=>{
    
    if(isDone) return;
    
    if(timeLeft <= 0){
      clearInterval(timer);
      submit();
    } else {
      timeLeft--;
      localStorage.setItem("cbt_time", timeLeft);
      
      let m = Math.floor(timeLeft/60);
      let s = timeLeft%60;
      
      const timerEl = document.getElementById("timer");
      if(timerEl){
        timerEl.innerHTML = `${m}:${s<10?'0'+s:s}`;
      }
    }
    
  },1000);
}

/* =========================
RAGU
========================= */

function toggleRagu(){
  
  if(ragu[currentQuestion]){
    delete ragu[currentQuestion];
  } else {
    ragu[currentQuestion] = true;
  }
  
  saveState();
  
  const btn = document.querySelector(".ragu-btn");
  if(btn){
    if(ragu[currentQuestion]){
      btn.classList.add("active");
      btn.innerHTML = "🚩 Ditandai Ragu";
    } else {
      btn.classList.remove("active");
      btn.innerHTML = "🚩 Ragu";
    }
  }
  
  nav();
}

/* =========================
SUBMIT
========================= */

function submit(){

  if(isDone) return;
  isDone = true;

  clearInterval(timer);

  let skor = 0;

  for(let x=0; x<soal.length; x++){
    if(answers[x] == soal[x].kunci){
      skor++;
    }
  }

  // Save to localStorage
  localStorage.setItem("cbt_submitted", "true");
  localStorage.setItem("cbt_score", skor);

  // Send to server (no-cors mode to avoid CORS)
  fetch(API, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "submit",
      nama: nama,
      token: token,
      skor: skor,
      jawaban: answers,
      total: soal.length
    })
  }).catch(err => console.error("Submit error:", err));

  showResult(skor);
}

/* =========================
RESULT
========================= */

function showResult(skor){

  document.getElementById("app").style.display = "none";
  document.getElementById("result").style.display = "flex";

  document.getElementById("scoreNumber").innerHTML = skor;
  
  const persen = Math.round((skor / soal.length) * 100);
  let grade = "";
  
  if(persen >= 90) grade = "🏆 Luar Biasa!";
  else if(persen >= 75) grade = "✅ Sangat Baik";
  else if(persen >= 60) grade = "📚 Baik, perlu belajar lagi";
  else grade = "📖 Perlu belajar lebih giat";
  
  const skorEl = document.getElementById("skor");
  if(skorEl){
    skorEl.innerHTML = `Anda menjawab ${skor} dari ${soal.length} soal dengan benar (${persen}%)<br><strong>${grade}</strong>`;
  }

  loadLeaderboard();
}

function loadLeaderboard(){
  fetch(`${API}?action=leaderboard&token=${token}`)
    .then(r => r.json())
    .then(res => {
      const board = document.getElementById("board");
      if(!board) return;
      
      if(res.leaderboard && res.leaderboard.length > 0){
        let html = "<ol style='text-align:left;margin-top:20px;'>";
        res.leaderboard.slice(0,10).forEach((item, idx) => {
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
      const board = document.getElementById("board");
      if(board) board.innerHTML = "<p>Gagal memuat leaderboard</p>";
    });
}

function restartExam(){
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

/* =========================
DARK MODE
========================= */

function toggleDarkMode(){
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark);
}

function loadDarkMode(){
  const saved = localStorage.getItem("darkMode");
  if(saved === "true"){
    document.body.classList.add("dark-mode");
  }
}

/* =========================
CALCULATOR
========================= */

function toggleCalculator(){
  const modal = document.getElementById("calculatorModal");
  if(!modal) return;
  
  if(modal.style.display === "flex"){
    modal.style.display = "none";
  } else {
    modal.style.display = "flex";
  }
}

function calc(value){
  const display = document.getElementById("calcDisplay");
  if(!display) return;
  display.value += value;
}

function calculateResult(){
  const display = document.getElementById("calcDisplay");
  if(!display) return;
  
  try {
    let expr = display.value.replace(/×/g, '*').replace(/÷/g, '/');
    const result = Function('"use strict"; return (' + expr + ')')();
    display.value = result;
  } catch(e) {
    display.value = "Error";
  }
}

function clearCalc(){
  const display = document.getElementById("calcDisplay");
  if(display) display.value = "";
}

/* =========================
INITIALIZATION
========================= */

document.addEventListener("DOMContentLoaded", function(){
  loadDarkMode();
  
  // Check if already submitted
  const submitted = localStorage.getItem("cbt_submitted");
  if(submitted === "true"){
    const savedScore = localStorage.getItem("cbt_score");
    if(savedScore && soal.length === 0){
      // Try to load soal first
      fetch(`${API}?action=getSoal`)
        .then(r => r.json())
        .then(res => {
          if(res && res.soal){
            soal = res.soal;
            totalSoal = soal.length;
            showResult(parseInt(savedScore));
          }
        });
    }
  }
  
  // Close calculator when clicking outside
  window.addEventListener("click", function(e){
    const modal = document.getElementById("calculatorModal");
    if(e.target === modal){
      modal.style.display = "none";
    }
  });
});

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

  });
}

/* =========================
STATE
========================= */

function saveState(){

  localStorage.setItem("cbt_state", JSON.stringify({
    loggedIn: true,
    currentQuestion,
    answers,
    ragu
  }));
}

/* =========================
RESTORE (FIXED FLOW ONLY)
========================= */

window.addEventListener("DOMContentLoaded", function(){

  const raw = localStorage.getItem("cbt_state");

  if(!raw) return;

  try{

    const state = JSON.parse(raw);

    if(!state.loggedIn) return;

    currentQuestion = state.currentQuestion || 0;
    answers = state.answers || {};
    ragu = state.ragu || {};

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    load(); // FIX: ini WAJIB supaya UI jalan lagi

  } catch(e){
    localStorage.removeItem("cbt_state");
  }
});

/* =========================
LOAD SOAL
========================= */

function load(){

  fetch(`${API}?action=getSoal`)
  .then(r => r.json())
  .then(res => {

    soal = res.soal || [];

    document.getElementById("totalCount").innerText = soal.length;

    // FIX: safety guard
    if(currentQuestion >= soal.length){
      currentQuestion = 0;
    }

    renderQuestion();
    nav();
    updateStats();

    start(); // FIX: hanya start setelah soal ready
  });
}

/* =========================
RENDER
========================= */

function renderQuestion(){

  if(!soal.length) return; // FIX: prevent crash

  let s = soal[currentQuestion];
  if(!s) return;

  document.getElementById("questionLabel").innerHTML =
    `Soal ${currentQuestion + 1}`;

  document.getElementById("q").innerHTML = s.pertanyaan;

  document.getElementById("opt").innerHTML = `

    <div class="opt ${answers[currentQuestion]=='A'?'active':''}"
         onclick="pick('A')">
      <div class="letter">A</div>
      <div>${s.a}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='B'?'active':''}"
         onclick="pick('B')">
      <div class="letter">B</div>
      <div>${s.b}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='C'?'active':''}"
         onclick="pick('C')">
      <div class="letter">C</div>
      <div>${s.c}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='D'?'active':''}"
         onclick="pick('D')">
      <div class="letter">D</div>
      <div>${s.d}</div>
    </div>

  `;

  const raguBtn = document.querySelector(".ragu-btn");

  if(raguBtn){

    if(ragu[currentQuestion]){
      raguBtn.classList.add("active");
      raguBtn.innerHTML = "🚩 Ditandai Ragu";
    } else {
      raguBtn.classList.remove("active");
      raguBtn.innerHTML = "🚩 Tandai Ragu";
    }
  }

  updateProgress();
}

/* =========================
PICK
========================= */

function pick(v){

  answers[currentQuestion] = v;

  saveState();

  renderQuestion();
  nav();
  updateStats();
}

/* =========================
NAV
========================= */

function nav(){

  if(!soal.length) return; // FIX

  let h = "";

  for(let x=0; x<soal.length; x++){

    let cls = [];

    if(answers[x]) cls.push("done");
    if(ragu[x]) cls.push("ragu");
    if(x === currentQuestion) cls.push("activeQ");

    h += `
      <button class="${cls.join(" ")}" onclick="go(${x})">
        ${x+1}
      </button>
    `;
  }

  document.getElementById("nav").innerHTML = h;
}

function go(x){

  currentQuestion = x;

  renderQuestion();
  nav();
  updateStats();
}

/* =========================
NEXT / PREV
========================= */

function nextQuestion(){

  if(currentQuestion < soal.length-1){
    currentQuestion++;
    renderQuestion();
    nav();
    updateStats();
  }
}

function prevQuestion(){

  if(currentQuestion > 0){
    currentQuestion--;
    renderQuestion();
    nav();
    updateStats();
  }
}

/* =========================
RAGU
========================= */

function toggleRagu(){

  ragu[currentQuestion] = !ragu[currentQuestion];

  saveState();

  renderQuestion();
  nav();
}

/* =========================
PROGRESS
========================= */

function updateProgress(){

  if(!soal.length) return; // FIX

  let progress = ((currentQuestion+1)/soal.length)*100;

  document.getElementById("progressFill").style.width = progress + "%";
}

/* =========================
STATS
========================= */

function updateStats(){

  let answered = Object.keys(answers).length;
  let unanswered = soal.length - answered;

  document.getElementById("answeredCount").innerText = answered;
  document.getElementById("answeredSummary").innerText = answered;
  document.getElementById("unansweredSummary").innerText = unanswered;
}

/* =========================
TIMER (FIXED DOUBLE SAFE)
========================= */

function start(){

  if(timer) clearInterval(timer); // FIX anti double timer

  let t = 3600;

  timer = setInterval(()=>{

    t--;

    let m = Math.floor(t/60);
    let s = t%60;

    document.getElementById("timer").innerHTML =
      `${m}:${s<10?'0'+s:s}`;

    if(t <= 0){
      submit();
    }

  },1000);
}

/* =========================
SUBMIT
========================= */

function submit(){

  if(isDone) return;

  isDone = true;

  clearInterval(timer);

  let skor = 0;

  soal.forEach((s,x)=>{

    if(answers[x] == s.kunci){
      skor++;
    }

  });

  fetch(API, {
    method:"POST",
    body: JSON.stringify({
      action:"submit",
      nama,
      token,
      skor,
      jawaban: answers
    })
  });

  showResult(skor);
}

/* =========================
RESULT
========================= */

function showResult(skor){

  document.getElementById("app").style.display="none";
  document.getElementById("result").style.display="flex";

  document.getElementById("scoreNumber").innerHTML = skor;
}

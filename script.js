/* =========================
STATE (SOURCE OF TRUTH)
========================= */

let soal = [];
let currentQuestion = 0;

let answers = {};
let ragu = {};

let nama = "";
let token = "";

let timer;
let isDone = false;

/* =========================
LOCAL STORAGE HELPERS
========================= */

function saveState(){

  localStorage.setItem("cbt_state", JSON.stringify({
    loggedIn: true,
    currentQuestion,
    answers,
    ragu,
    nama,
    token
  }));

}

/* =========================
LOAD STATE
========================= */

function loadState(){

  const data = localStorage.getItem("cbt_state");
  if(!data) return;

  try{

    const state = JSON.parse(data);

    if(state.loggedIn !== true) return;

    currentQuestion = state.currentQuestion || 0;
    answers = state.answers || {};
    ragu = state.ragu || {};
    nama = state.nama || "";
    token = state.token || "";

  } catch(e){
    localStorage.removeItem("cbt_state");
  }

}

/* =========================
LOGIN
========================= */

function login(){

  const n = document.getElementById("nama").value;
  if(!n) return alert("Isi nama dulu");

  nama = n;

  localStorage.setItem("cbt_state", JSON.stringify({
    loggedIn: true,
    currentQuestion: 0,
    answers: {},
    ragu: {},
    nama,
    token
  }));

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  load(); // 🔥 INI YANG WAJIB

  start();

}

/* =========================
LOAD SOAL
========================= */

function load(){

  fetch(`${API}?action=getSoal`)
  .then(r => r.json())
  .then(res => {

    soal = res.soal || [];

    currentQuestion = 0;

    document.getElementById("totalCount").innerText = soal.length;

    render();
    nav();
    updateStats();

  });

}

/* =========================
RENDER QUESTION
========================= */

function render(){

  let s = soal[currentQuestion];
  if(!s) return;

  document.getElementById("questionLabel").innerText =
  `Soal ${currentQuestion+1}`;

  document.getElementById("q").innerHTML = s.pertanyaan;

  document.getElementById("opt").innerHTML = `
    <div class="opt ${answers[currentQuestion]=='A'?'active':''}" onclick="pick('A')">
      <div class="letter">A</div><div>${s.a}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='B'?'active':''}" onclick="pick('B')">
      <div class="letter">B</div><div>${s.b}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='C'?'active':''}" onclick="pick('C')">
      <div class="letter">C</div><div>${s.c}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='D'?'active':''}" onclick="pick('D')">
      <div class="letter">D</div><div>${s.d}</div>
    </div>
  `;

  const btn = document.querySelector(".ragu-btn");

  if(btn){
    if(ragu[currentQuestion]){
      btn.classList.add("active");
      btn.innerText = "🚩 Ditandai Ragu";
    } else {
      btn.classList.remove("active");
      btn.innerText = "🚩 Tandai Ragu";
    }
  }

  updateProgress();

}

/* =========================
NAVIGATION
========================= */

function nextQuestion(){

  if(currentQuestion < soal.length - 1){
    currentQuestion++;
  }

  saveState();
  render();
  nav();
  updateStats();

}

function prevQuestion(){

  if(currentQuestion > 0){
    currentQuestion--;
  }

  saveState();
  render();
  nav();
  updateStats();

}

function go(x){

  currentQuestion = x;

  saveState();
  render();
  nav();
  updateStats();

}

/* =========================
ANSWER
========================= */

function pick(v){

  answers[currentQuestion] = v;

  saveState();
  render();
  nav();
  updateStats();

}

/* =========================
PROGRESS
========================= */

function updateProgress(){

  let p = ((currentQuestion+1)/soal.length)*100;

  document.getElementById("progressFill").style.width = p + "%";

}

/* =========================
NAV UI
========================= */

function nav(){

  let h = "";

  for(let i=0;i<soal.length;i++){

    let cls = [];

    if(answers[i]) cls.push("done");
    if(ragu[i]) cls.push("ragu");
    if(i === currentQuestion) cls.push("activeQ");

    h += `<button class="${cls.join(" ")}" onclick="go(${i})">${i+1}</button>`;

  }

  document.getElementById("nav").innerHTML = h;

}

/* =========================
STATS
========================= */

function updateStats(){

  let answered = 0;
  let flagged = 0;

  for(let i=0;i<soal.length;i++){

    if(answers[i]) answered++;
    if(ragu[i]) flagged++;

  }

  let unanswered = soal.length - answered;

  document.getElementById("answeredCount").innerText = answered;
  document.getElementById("answeredSummary").innerText = answered;
  document.getElementById("unansweredSummary").innerText = unanswered;

  const el = document.getElementById("raguSummary");
  if(el) el.innerText = flagged;

}

/* =========================
TIMER (ANTI RESET)
========================= */

function start(){

  let endTime = localStorage.getItem("cbt_endTime");

  if(!endTime){
    endTime = Date.now() + 3600*1000;
    localStorage.setItem("cbt_endTime", endTime);
  }

  timer = setInterval(()=>{

    let now = Date.now();
    let t = Math.max(0, Math.floor((endTime - now)/1000));

    let m = Math.floor(t/60);
    let s = t%60;

    document.getElementById("timer").innerText =
    `${m}:${s<10?'0'+s:s}`;

    if(t <= 300){
      document.getElementById("timer").style.color = "#ef4444";
    }

    if(t <= 0){
      clearInterval(timer);
      submit();
    }

  },1000);

}

/* =========================
SUBMIT
========================= */

function submitExam(){

  if(isDone) return;

  if(!confirm("Yakin ingin submit?")) return;

  isDone = true;

  clearInterval(timer);

  let skor = 0;

  soal.forEach((s,i)=>{
    if(answers[i] == s.kunci){
      skor++;
    }
  });

  fetch(API,{
    method:"POST",
    body:JSON.stringify({
      action:"submit",
      nama,
      token,
      skor,
      jawaban: answers
    })
  });

  localStorage.removeItem("cbt_state");
  localStorage.removeItem("cbt_endTime");

  showResult(skor);

}

/* =========================
INIT AUTO RESTORE
========================= */

window.addEventListener("DOMContentLoaded", () => {

  const state = localStorage.getItem("cbt_state");

  if(!state){
    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";
    return;
  }

  try{

    const parsed = JSON.parse(state);

    if(!parsed.loggedIn){
      localStorage.removeItem("cbt_state");
      return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    load();   // load soal
    start();  // timer

  } catch(e){
    localStorage.removeItem("cbt_state");
    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";
  }

});

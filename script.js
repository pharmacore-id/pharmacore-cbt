let currentQuestion = 0;
let answers = [];
let ragu = [];
let totalSoal = 50;

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

let soal = [];
let i = 0;

let jawab = {};
let ragu = {};

let token = "";
let nama = "";

let timer;
let isDone = false;

/* =========================
LOGIN
========================= */

function login(){

  nama = document
  .getElementById("nama")
  .value
  .trim();

  token = document
  .getElementById("token")
  .value
  .trim();

  if(!nama || !token){
    alert("Lengkapi data terlebih dahulu");
    return;
  }

  fetch(
    `${API}?action=validateToken&token=${token}`
  )
  .then(r=>r.json())
  .then(res=>{

    if(res.valid){

      document
      .getElementById("login")
      .style.display="none";

      document
      .getElementById("app")
      .style.display="block";

      load();

    }else{

      alert("Token tidak valid");

    }

  });
}

/* =========================
SAVE & LOAD STATE
========================= */

function saveState(){

  localStorage.setItem("cbt_state", JSON.stringify({
    loggedIn: true,
    currentQuestion,
    answers,
    ragu
  }));

}

function loadState(){

  const data = localStorage.getItem("cbt_state");
  return data ? JSON.parse(data) : null;

}

/* =========================
INIT / AUTO RESTORE
========================= */

window.onload = function(){

  const stateRaw = localStorage.getItem("cbt_state");

  if(!stateRaw){
    return; // tetap di login
  }

  const state = JSON.parse(stateRaw);

  if(state.loggedIn !== true){
    return; // tetap di login
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  currentQuestion = state.currentQuestion ?? 0;
  answers = state.answers ?? [];
  ragu = state.ragu ?? [];

  renderQuestion();
  updateSidebarSummary();

};

/* =========================
LOGIN
========================= */

function login(){

  const nama = document.getElementById("nama").value;
  if(!nama) return alert("Isi nama dulu");

  currentQuestion = 0;
  answers = [];
  ragu = [];

  localStorage.setItem("cbt_state", JSON.stringify({
    loggedIn: true,
    currentQuestion: 0,
    answers: [],
    ragu: []
  }));

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  renderQuestion();
  updateSidebarSummary();

}

function isLoggedIn(){

  const data = localStorage.getItem("cbt_state");

  if(!data) return false;

  try {
    return JSON.parse(data).loggedIn === true;
  } catch {
    return false;
  }

}

/* =========================
QUESTION NAVIGATION
========================= */

function nextQuestion(){

  if(currentQuestion < soal.length - 1){
    currentQuestion++;
  }

  saveState();
  renderQuestion();
  updateSidebarSummary();

}

function prevQuestion(){

  if(currentQuestion > 0){
    currentQuestion--;
  }

  saveState();
  renderQuestion();
  updateSidebarSummary();

}

/* =========================
ANSWER SYSTEM
========================= */

function saveAnswer(index, option){

  answers[index] = option;

  saveState();
  updateSidebarSummary();

}

/* =========================
RAGU SYSTEM
========================= */

function toggleRagu(){

  ragu[currentQuestion] = !ragu[currentQuestion];

  saveState();
  renderQuestion();
  updateSidebarSummary();

}

/* =========================
SIDEBAR SUMMARY
========================= */

function updateSidebarSummary(){

  let answered = 0;
  let unanswered = 0;
  let raguCount = 0;

  for(let i = 0; i < soal.length; i++){

    if(ragu[i]) raguCount++;

    if(answers[i] === undefined || answers[i] === null){
      unanswered++;
    } else {
      answered++;
    }

  }

  const elAnswered = document.getElementById("answeredSummary");
  const elUnanswered = document.getElementById("unansweredSummary");
  const elRagu = document.getElementById("raguSummary");

  if(elAnswered) elAnswered.innerText = answered;
  if(elUnanswered) elUnanswered.innerText = unanswered;
  if(elRagu) elRagu.innerText = raguCount;

}

/* =========================
LOAD SOAL (BACKEND OPTIONAL)
========================= */

function load(){

  fetch(`${API}?action=getSoal`)
  .then(r => r.json())
  .then(res => {

    soal = res.soal || [];

    document.getElementById("totalCount").innerText = soal.length;

    renderQuestion();
    updateSidebarSummary();

  });

}
/* =========================
RENDER
========================= */

function render(){

  let s = soal[i];

  if(!s) return;

  document.getElementById("questionLabel").innerHTML =
  `Soal ${i+1}`;

  document.getElementById("q").innerHTML =
  s.pertanyaan;

  document.getElementById("opt").innerHTML = `

    <div class="opt ${jawab[i]=='A'?'active':''}"
         onclick="pick('A')">

      <div class="letter">A</div>
      <div>${s.a}</div>

    </div>

    <div class="opt ${jawab[i]=='B'?'active':''}"
         onclick="pick('B')">

      <div class="letter">B</div>
      <div>${s.b}</div>

    </div>

    <div class="opt ${jawab[i]=='C'?'active':''}"
         onclick="pick('C')">

      <div class="letter">C</div>
      <div>${s.c}</div>

    </div>

    <div class="opt ${jawab[i]=='D'?'active':''}"
         onclick="pick('D')">

      <div class="letter">D</div>
      <div>${s.d}</div>

    </div>

  `;

  const raguBtn =
  document.querySelector(".ragu-btn");

  if(raguBtn){

    if(ragu[i]){

      raguBtn.classList.add("active");
      raguBtn.innerHTML =
      "🚩 Ditandai Ragu";

    }else{

      raguBtn.classList.remove("active");
      raguBtn.innerHTML =
      "🚩 Tandai Ragu";

    }
  }

  updateProgress();

}

/* =========================
PICK
========================= */

function pick(v){

  jawab[i] = v;

  render();

  nav();

  updateStats();

}

/* =========================
PROGRESS
========================= */

function updateProgress(){

  let progress =
  ((i+1)/soal.length)*100;

  document
  .getElementById("progressFill")
  .style.width =
  progress + "%";

}

/* =========================
STATISTICS
========================= */

function updateStats(){

  const answered =
  Object.keys(jawab).length;

  const flagged =
  Object.keys(ragu).length;

  const unanswered =
  soal.length - answered;

  document.getElementById(
    "answeredCount"
  ).innerHTML = answered;

  document.getElementById(
    "answeredSummary"
  ).innerHTML = answered;

  document.getElementById(
    "unansweredSummary"
  ).innerHTML = unanswered;

  const flagEl =
  document.getElementById("flagSummary");

  if(flagEl){
    flagEl.innerHTML = flagged;
  }
}

/* =========================
NAVIGATION
========================= */

function nav(){

  let h = "";

  for(let x=0; x<soal.length; x++){

    let cls = [];

    if(jawab[x]){
      cls.push("done");
    }

    if(ragu[x]){
      cls.push("ragu");
    }

    if(x === i){
      cls.push("activeQ");
    }

    h += `
      <button
        class="${cls.join(" ")}"
        onclick="go(${x})">
        ${x+1}
      </button>
    `;
  }

  document.getElementById("nav").innerHTML = h;
}

function go(x){

  i = x;

  render();

  nav();

}

function nextQuestion(){

  if(i < soal.length-1){

    i++;

    render();

    nav();

  }

}

function prevQuestion(){

  if(i > 0){

    i--;

    render();

    nav();

  }

}

/* =========================
TIMER
========================= */

function start(){

  let t = 3600;

  timer = setInterval(()=>{

    t--;

    let m =
    Math.floor(t/60);

    let s =
    t%60;

    document
    .getElementById("timer")
    .innerHTML =
    `${m}:${s<10?'0'+s:s}`;

    if(t <= 300){

      document
      .getElementById("timer")
      .style.color =
      "#ef4444";

    }

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

  let confirmSubmit =
  confirm(
    "Yakin ingin mengumpulkan jawaban?"
  );

  if(!confirmSubmit)
    return;

  isDone = true;

  clearInterval(timer);

  let skor = 0;

  soal.forEach((s,x)=>{

    if(jawab[x] == s.kunci){

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

      jawaban:jawab

    })

  })

  .then(()=>{

    showResult(skor);

  });

}

/* =========================
RESULT
========================= */

function showResult(skor){

  document
  .getElementById("app")
  .style.display="none";

  document
  .getElementById("result")
  .style.display="flex";

  document
  .getElementById("scoreNumber")
  .innerHTML =
  skor;

  document
  .getElementById("skor")
  .innerHTML =
  `Kamu menjawab benar ${skor} soal`;

  fetch(
    `${API}?action=leaderboard`
  )
  .then(r=>r.json())
  .then(res=>{

    let h = "";

    res.leaderboard
    .forEach((u,index)=>{

      h +=
      `
      <div style="
      display:flex;
      justify-content:space-between;
      padding:12px;
      border-bottom:1px solid #eee;
      ">

        <span>
          ${index+1}. ${u.nama}
        </span>

        <strong>
          ${u.skor}
        </strong>

      </div>
      `;

    });

    document
    .getElementById("board")
    .innerHTML = h;

  });

}

/* =========================
DARK MODE
========================= */

function toggleDarkMode(){

  document.body.classList.toggle(
    "dark-mode"
  );

}

/* =========================
CALCULATOR
========================= */

function toggleCalculator(){

  const modal =
  document.getElementById(
    "calculatorModal"
  );

  if(
    modal.style.display === "flex"
  ){

    modal.style.display = "none";

  }else{

    modal.style.display = "flex";

  }

}

function calc(v){

  document
  .getElementById("calcDisplay")
  .value += v;

}

function clearCalc(){

  document
  .getElementById("calcDisplay")
  .value = "";

}

function calculateResult(){

  try{

    let result =
    eval(
      document.getElementById(
        "calcDisplay"
      ).value
    );

    document
    .getElementById(
      "calcDisplay"
    ).value = result;

  }catch{

    alert("Perhitungan tidak valid");

  }

}

function updateSidebarSummary(){

  let answered = 0;
  let unanswered = 0;
  let raguCount = 0;

  for(let i = 0; i < totalSoal; i++){

    if(ragu[i]) raguCount++;

    if(answers[i] === undefined || answers[i] === null){
      unanswered++;
    } else {
      answered++;
    }

  }

  document.getElementById("answeredSummary").innerText = answered;
  document.getElementById("unansweredSummary").innerText = unanswered;
  document.getElementById("raguSummary").innerText = raguCount;

}


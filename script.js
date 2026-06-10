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

    load(); // ONLY LOAD HERE

  })
  .catch(err => {
    console.error("LOGIN ERROR:", err);
    alert("Gagal validasi token");
  });

}

/* =========================
LOAD SOAL (SAFE + NO FREEZE)
========================= */

function load(){

  fetch(`${API}?action=getSoal`)
  .then(r => r.json())
  .then(res => {

    console.log("API RESPONSE:", res);

    soal = res.soal || [];

    if(!Array.isArray(soal) || soal.length === 0){
      alert("Soal kosong / API error");
      return;
    }

    document.getElementById("totalCount").innerText = soal.length;

    currentQuestion = 0;

    renderQuestion();
    nav();
    updateStats();
    updateProgress();

    startTimer(); // FIXED POSITION

  })
  .catch(err => {

    console.error("LOAD ERROR:", err);
    alert("Gagal load soal dari server");

  });

}

/* =========================
RENDER QUESTION
========================= */

function renderQuestion(){

  let s = soal[currentQuestion];

  if(!s){
    document.getElementById("q").innerHTML =
      "<b style='color:red'>Soal tidak tersedia</b>";

    document.getElementById("opt").innerHTML = "";
    return;
  }

  document.getElementById("questionLabel").innerHTML =
    `Soal ${currentQuestion + 1}`;

  document.getElementById("q").innerHTML = s.pertanyaan;

  document.getElementById("opt").innerHTML = `

    <div class="opt ${answers[currentQuestion]=='A'?'active':''}" onclick="pick('A')">
      <div class="letter">A</div>
      <div>${s.a}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='B'?'active':''}" onclick="pick('B')">
      <div class="letter">B</div>
      <div>${s.b}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='C'?'active':''}" onclick="pick('C')">
      <div class="letter">C</div>
      <div>${s.c}</div>
    </div>

    <div class="opt ${answers[currentQuestion]=='D'?'active':''}" onclick="pick('D')">
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
      raguBtn.innerHTML = "🚩 Ragu";
    }
  }

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
    document.getElementById("nav").innerHTML =
      "<small style='color:red'>Soal belum dimuat</small>";
    return;
  }

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
  updateProgress();

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
TIMER (NO RESET BUG)
========================= */

function startTimer(){

  const saved = localStorage.getItem("cbt_time");
  timeLeft = saved ? parseInt(saved) : 3600;

  clearInterval(timer);

  timer = setInterval(()=>{

    timeLeft--;

    localStorage.setItem("cbt_time", timeLeft);

    let m = Math.floor(timeLeft/60);
    let s = timeLeft%60;

    document.getElementById("timer").innerHTML =
      `${m}:${s<10?'0'+s:s}`;

    if(timeLeft <= 0){
      submit();
    }

  },1000);

}

/* =========================
RAGU
========================= */

function toggleRagu(){

  ragu[currentQuestion] = !ragu[currentQuestion];

  if(!ragu[currentQuestion]){
    delete ragu[currentQuestion];
  }

  saveState();

  renderQuestion();
  nav();

}

/* =========================
SUBMIT (ANTI DOUBLE + SAFE)
========================= */

function submit(){

  if(isDone) return;
  isDone = true;

  clearInterval(timer);

  document.body.style.pointerEvents = "none";

  let skor = 0;

  soal.forEach((s,x)=>{

    if(answers[x] == s.kunci){
      skor++;
    }

  });

  fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "submit",
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

  document.getElementById("app").style.display = "none";
  document.getElementById("result").style.display = "flex";

  document.getElementById("scoreNumber").innerHTML = skor;

}

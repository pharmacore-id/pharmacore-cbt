const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

let soal = [];
let current = 0;

let answers = {};
let ragu = {};

let nama = "";
let timer;

/* =========================
LOGIN
========================= */

function login(){

  nama = document.getElementById("nama").value;
  if(!nama) return alert("Isi nama");

  saveState();

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  loadSoal();
}

/* =========================
LOAD
========================= */

async function loadSoal(){

  let res = await fetch(API + "?action=getSoal");
  let data = await res.json();

  soal = data.soal || [];

  loadState();

  init();
}

/* =========================
INIT
========================= */

function init(){

  render();
  nav();
  startTimer();
  updateStats();
}

/* =========================
SAVE / LOAD
========================= */

function saveState(){

  localStorage.setItem("cbt", JSON.stringify({
    current,
    answers,
    ragu,
    nama
  }));

}

function loadState(){

  let d = localStorage.getItem("cbt");
  if(!d) return;

  let s = JSON.parse(d);

  current = s.current || 0;
  answers = s.answers || {};
  ragu = s.ragu || {};
  nama = s.nama || "";
}

/* =========================
RENDER
========================= */

function render(){

  let s = soal[current];

  document.getElementById("questionLabel").innerText =
  "Soal " + (current+1);

  document.getElementById("q").innerHTML = s.pertanyaan;

  document.getElementById("opt").innerHTML = `
    <div class="opt" onclick="pick('A')">A. ${s.a}</div>
    <div class="opt" onclick="pick('B')">B. ${s.b}</div>
    <div class="opt" onclick="pick('C')">C. ${s.c}</div>
    <div class="opt" onclick="pick('D')">D. ${s.d}</div>
  `;
}

/* =========================
ANSWER
========================= */

function pick(v){
  answers[current] = v;
  saveState();
  render();
  nav();
  updateStats();
}

/* =========================
NAV
========================= */

function nav(){

  let h = "";

  for(let i=0;i<soal.length;i++){

    let c = "";

    if(i === current) c = "active";
    if(answers[i]) c = "done";
    if(ragu[i]) c = "ragu";
    if(i === current) c = "active";

    h += `<button class="${c}" onclick="go(${i})">${i+1}</button>`;
  }

  document.getElementById("nav").innerHTML = h;
}

function go(i){
  current = i;
  saveState();
  render();
  nav();
}

/* =========================
NEXT PREV
========================= */

function next(){
  if(current < soal.length-1){
    current++;
    saveState();
    render();
    nav();
  }
}

function prev(){
  if(current > 0){
    current--;
    saveState();
    render();
    nav();
  }
}

/* =========================
RAGU
========================= */

function toggleRagu(){
  ragu[current] = !ragu[current];
  saveState();
  render();
  nav();
}

/* =========================
TIMER
========================= */

function startTimer(){

  let t = 3600;

  setInterval(()=>{

    t--;

    let m = Math.floor(t/60);
    let s = t%60;

    document.getElementById("timer").innerText =
    m + ":" + (s<10?"0"+s:s);

  },1000);
}

/* =========================
DARK MODE
========================= */

function toggleDarkMode(){
  document.body.classList.toggle("dark");
}

/* =========================
CALCULATOR
========================= */

function calc(v){
  document.getElementById("calcDisplay").value += v;
}

function calculateResult(){

  let expr = document.getElementById("calcDisplay").value;

  expr = expr
    .replace(/sin\(/g,"Math.sin(")
    .replace(/cos\(/g,"Math.cos(")
    .replace(/tan\(/g,"Math.tan(")
    .replace(/sqrt\(/g,"Math.sqrt(");

  document.getElementById("calcDisplay").value = eval(expr);
}

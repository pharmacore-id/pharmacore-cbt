/* =========================
STATE
========================= */

let soal = [];
let current = 0;

let answers = {};
let ragu = {};

let nama = "";
let timer;

/* =========================
API
========================= */

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

/* =========================
LOGIN
========================= */

function login(){

  const n = document.getElementById("nama").value;
  if(!n) return alert("Isi nama dulu");

  nama = n;

  localStorage.setItem("cbt_state", JSON.stringify({
    loggedIn: true,
    nama
  }));

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  loadSoal();

}

/* =========================
LOAD SOAL (CRITICAL)
========================= */

async function loadSoal(){

  try{

    const res = await fetch(`${API}?action=getSoal`);
    const data = await res.json();

    soal = data.soal || data.data || [];

    if(!soal.length){
      document.getElementById("q").innerHTML = "Soal kosong";
      return;
    }

    current = 0;

    init();

  } catch(err){
    console.error(err);
    alert("Gagal load soal");
  }

}

/* =========================
INIT APP
========================= */

function init(){

  render();
  nav();
  startTimer();

}

/* =========================
RENDER SOAL
========================= */

function render(){

  const s = soal[current];

  if(!s) return;

  document.getElementById("questionLabel").innerText =
  `Soal ${current+1}`;

  document.getElementById("q").innerHTML =
  s.pertanyaan;

  document.getElementById("opt").innerHTML = `
    <div onclick="pick('A')">A. ${s.a}</div>
    <div onclick="pick('B')">B. ${s.b}</div>
    <div onclick="pick('C')">C. ${s.c}</div>
    <div onclick="pick('D')">D. ${s.d}</div>
  `;
}

/* =========================
ANSWER
========================= */

function pick(v){
  answers[current] = v;
  render();
  nav();
}

/* =========================
NAVIGATION
========================= */

function nextQuestion(){

  if(current < soal.length - 1){
    current++;
    render();
    nav();
  }

}

function prevQuestion(){

  if(current > 0){
    current--;
    render();
    nav();
  }

}

function nav(){

  console.log("Nav update:", current);

}

/* =========================
TIMER
========================= */

function startTimer(){

  let t = 3600;

  timer = setInterval(()=>{

    t--;

    let m = Math.floor(t/60);
    let s = t % 60;

    document.getElementById("timer").innerText =
    `${m}:${s < 10 ? "0"+s : s}`;

    if(t <= 0){
      clearInterval(timer);
      alert("Waktu habis");
    }

  },1000);

}

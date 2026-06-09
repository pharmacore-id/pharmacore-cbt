const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

let soal = [];
let i = 0;
let jawab = {};
let token = "";
let nama = "";
let timerInterval;
let isSubmitted = false;

/* ================= LOGIN ================= */
function login(){

  token = document.getElementById("token").value.trim();
  nama = document.getElementById("nama").value.trim();

  fetch(`${API}?action=validateToken&token=${token}`)
  .then(r => r.json())
  .then(res => {

    if(res.valid){

      document.getElementById("login").style.display = "none";
      document.getElementById("app").style.display = "block";

      load();

    } else {
      alert("Token salah");
    }

  })
  .catch(err => {
    console.error("LOGIN ERROR:", err);
    alert("Gagal konek ke server");
  });
}

/* ================= LOAD SOAL ================= */
function load(){

  fetch(`${API}?action=getSoal`)
  .then(r => r.json())
  .then(res => {

    soal = res.soal || [];
    i = 0;

    render();
    nav();
    start();

  })
  .catch(err => {
    console.error("LOAD SOAL ERROR:", err);
    alert("Gagal load soal");
  });
}

/* ================= RENDER ================= */
function render(){

  if(!soal[i]) return;

  let s = soal[i];

  document.getElementById("q").innerHTML =
    (i + 1) + ". " + s.pertanyaan;

  document.getElementById("opt").innerHTML = `
    <div class="opt ${jawab[i]=='A'?'active':''}" onclick="pilih('A')">A. ${s.a}</div>
    <div class="opt ${jawab[i]=='B'?'active':''}" onclick="pilih('B')">B. ${s.b}</div>
    <div class="opt ${jawab[i]=='C'?'active':''}" onclick="pilih('C')">C. ${s.c}</div>
    <div class="opt ${jawab[i]=='D'?'active':''}" onclick="pilih('D')">D. ${s.d}</div>
  `;
}

/* ================= PILIH ================= */
function pilih(v){
  jawab[i] = v;
  render();
  nav();
}

/* ================= NAV ================= */
function nav(){

  let h = "";

  for(let x = 0; x < soal.length; x++){

    let cls = "";
    if(jawab[x]) cls += "done ";
    if(x === i) cls += "active";

    h += `<button class="${cls}" onclick="go(${x})">${x + 1}</button>`;
  }

  document.getElementById("nav").innerHTML = h;
}

/* ================= GO ================= */
function go(x){
  i = x;
  render();
  nav();
}

/* ================= TIMER ================= */
function start(){

  let t = 3600;

  timerInterval = setInterval(() => {

    t--;

    let m = Math.floor(t / 60);
    let s = t % 60;

    document.getElementById("timer").innerHTML =
      `${m}:${s < 10 ? '0' + s : s}`;

    if(t <= 0){
      clearInterval(timerInterval);
      submit();
    }

  }, 1000);
}

/* ================= SUBMIT FIXED ================= */
function submit(){

  if(isSubmitted) return;
  isSubmitted = true;

  clearInterval(timerInterval);

  let skor = 0;

  soal.forEach((s, x) => {
    if(jawab[x] == s.kunci) skor++;
  });

  console.log("SUBMIT DATA:", {
    nama, token, skor, jawaban: jawab
  });

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "submit",
      nama,
      token,
      skor,
      jawaban: jawab
    })
  })
  .then(r => r.text())
  .then(res => {
    console.log("SUBMIT RESPONSE:", res);
    alert("Skor kamu: " + skor);
  })
  .catch(err => {
    console.error("SUBMIT ERROR:", err);
    alert("Gagal submit (cek console)");
  });
}

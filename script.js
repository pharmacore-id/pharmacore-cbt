const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

let soal = [];
let i = 0;
let jawab = {};
let ragu = {};
let token = "";
let nama = "";
let timer;
let isSubmit = false;

/* LOGIN */
function login(){
  token = document.getElementById("token").value.trim();
  nama = document.getElementById("nama").value.trim();

  fetch(`${API}?action=validateToken&token=${token}`)
  .then(r=>r.json())
  .then(res=>{
    if(res.valid){
      document.getElementById("login").style.display="none";
      document.getElementById("app").style.display="block";
      load();
    } else alert("Token salah");
  });
}

/* LOAD */
function load(){
  fetch(`${API}?action=getSoal`)
  .then(r=>r.json())
  .then(res=>{
    soal = res.soal || [];
    i=0;
    render();
    nav();
    start();
  });
}

/* RENDER */
function render(){
  let s = soal[i];
  if(!s) return;

  document.getElementById("q").innerHTML =
    (i+1)+". "+s.pertanyaan;

  document.getElementById("opt").innerHTML = `
    <div class="opt ${jawab[i]=='A'?'active':''}" onclick="pick('A')">A. ${s.a}</div>
    <div class="opt ${jawab[i]=='B'?'active':''}" onclick="pick('B')">B. ${s.b}</div>
    <div class="opt ${jawab[i]=='C'?'active':''}" onclick="pick('C')">C. ${s.c}</div>
    <div class="opt ${jawab[i]=='D'?'active':''}" onclick="pick('D')">D. ${s.d}</div>
  `;
}

/* PICK */
function pick(v){
  jawab[i]=v;
  render();
  nav();
}

/* NAV */
function nav(){
  let h="";
  let done=0;

  for(let x=0;x<soal.length;x++){
    let c="";

    if(jawab[x]){ c+="done "; done++; }
    if(ragu[x]) c+="ragu ";
    if(x===i) c+="activeQ";

    h+=`<button class="${c}" onclick="go(${x})">${x+1}</button>`;
  }

  document.getElementById("nav").innerHTML=h;

  document.getElementById("progress").innerHTML =
    `Progress: ${done}/${soal.length}`;
}

/* NAV GO */
function go(x){
  i=x;
  render();
  nav();
}

/* CONTROL */
function prev(){ if(i>0){i--;render();nav();} }
function next(){ if(i<soal.length-1){i++;render();nav();} }

function flag(){
  ragu[i]=!ragu[i];
  nav();
}

/* TIMER */
function start(){
  let t=3600;

  timer=setInterval(()=>{
    t--;

    let m=Math.floor(t/60);
    let s=t%60;

    document.getElementById("timer").innerHTML=
      `${m}:${s<10?'0'+s:s}`;

    if(t<=0) submit();

  },1000);
}

/* SUBMIT */
function submit(){
  if(isSubmit) return;
  isSubmit=true;

  clearInterval(timer);

  let skor=0;

  soal.forEach((s,x)=>{
    if(jawab[x]==s.kunci) skor++;
  });

  fetch(API,{
    method:"POST",
    body:JSON.stringify({
      action:"submit",
      nama,token,skor,jawaban:jawab
    })
  });

  alert("SELESAI!\nSkor: "+skor);
}

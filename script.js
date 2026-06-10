// ================== GLOBAL VARIABLES ==================
let currentQuestion = 0;
let answers = {};
let ragu = {};
let soal = [];
let token = "", nama = "";
let timer = null;
let isDone = false;
let timeLeft = 3600; // 60 menit
let isLoggedIn = false;
let calcMemory = 0;
let lastAnswer = 0;
let questionStartTime = Date.now();
let timeSpentPerQuestion = []; // simpan waktu per soal dalam detik
let totalExamTimeSeconds = 0;
let tabActive = true; // untuk pause saat tab tidak aktif

const API = "https://script.google.com/macros/s/AKfycbyo48NoxjaBHGHkRCxgkxOB3Cys2Wa3mBG7AvK_n3TidyCSQcjSf5vSbCJpkI0-QJhk/exec";

// ================== SAVE & LOAD STATE ==================
function saveState() {
    localStorage.setItem("cbt_answers", JSON.stringify(answers));
    localStorage.setItem("cbt_ragu", JSON.stringify(ragu));
    localStorage.setItem("cbt_current", currentQuestion);
    localStorage.setItem("cbt_time", timeLeft);
    localStorage.setItem("cbt_isLoggedIn", isLoggedIn);
    localStorage.setItem("cbt_nama", nama);
    localStorage.setItem("cbt_token", token);
    if (soal.length) localStorage.setItem("cbt_soal", JSON.stringify(soal));
    localStorage.setItem("cbt_timeSpent", JSON.stringify(timeSpentPerQuestion));
}
function loadSavedState() {
    let saved = localStorage.getItem("cbt_answers"); if(saved) answers = JSON.parse(saved);
    saved = localStorage.getItem("cbt_ragu"); if(saved) ragu = JSON.parse(saved);
    saved = localStorage.getItem("cbt_current"); if(saved) currentQuestion = parseInt(saved);
    saved = localStorage.getItem("cbt_time"); if(saved) timeLeft = parseInt(saved);
    saved = localStorage.getItem("cbt_isLoggedIn"); if(saved === "true") isLoggedIn = true;
    saved = localStorage.getItem("cbt_nama"); if(saved) nama = saved;
    saved = localStorage.getItem("cbt_token"); if(saved) token = saved;
    saved = localStorage.getItem("cbt_soal"); if(saved) soal = JSON.parse(saved);
    saved = localStorage.getItem("cbt_timeSpent"); if(saved) timeSpentPerQuestion = JSON.parse(saved);
}
function clearSession() {
    localStorage.clear();
    answers = {}; ragu = {}; currentQuestion = 0; isDone = false; timeLeft = 3600; isLoggedIn = false;
    soal = []; nama = ""; token = ""; timeSpentPerQuestion = [];
}

// ================== STATISTIK REAL-TIME ==================
function updateRealTimeStats() {
    let avg = 0;
    if (timeSpentPerQuestion.length > 0) {
        let sum = timeSpentPerQuestion.reduce((a,b)=>a+b,0);
        avg = Math.round(sum / timeSpentPerQuestion.length);
    }
    document.getElementById("avgTimeStat").innerText = avg;
    let totalMin = Math.floor(totalExamTimeSeconds / 60);
    document.getElementById("totalTimeStat").innerText = totalMin;
}
function recordQuestionTime() {
    let elapsed = (Date.now() - questionStartTime) / 1000;
    if (elapsed > 0 && elapsed < 300) { // batas aman
        if (timeSpentPerQuestion[currentQuestion]) {
            // update jika sudah ada
            timeSpentPerQuestion[currentQuestion] = elapsed;
        } else {
            timeSpentPerQuestion[currentQuestion] = elapsed;
        }
    }
    questionStartTime = Date.now();
    updateRealTimeStats();
    saveState();
}
// ================== TIMER CERDAS (pause saat tab inactive & suara) ==================
function playBeep() {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance("Perhatian, waktu tersisa sedikit.");
        utterance.lang = "id-ID";
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    } else {
        // fallback beep (opsional)
        console.log("Beep");
    }
}
function startTimer() {
    if (localStorage.getItem("cbt_submitted") === "true") return;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (!tabActive || isDone) return; // pause jika tab tidak aktif
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("⏰ Waktu habis! Jawaban akan dikumpulkan otomatis.");
            submit();
        } else {
            timeLeft--;
            saveState();
            let m = Math.floor(timeLeft/60), s = timeLeft%60;
            let timerEl = document.getElementById("timer");
            if(timerEl) timerEl.innerHTML = `${m}:${s<10?'0'+s:s}`;
            // suara peringatan 5 menit & 1 menit
            if (timeLeft === 300) { playBeep(); alert("⏰ Peringatan! Waktu tersisa 5 menit lagi."); }
            if (timeLeft === 60) { playBeep(); alert("⏰ Peringatan! Waktu tersisa 1 menit!"); }
        }
    }, 1000);
}
// Deteksi tab aktif/pasif
document.addEventListener("visibilitychange", () => {
    tabActive = !document.hidden;
    if (tabActive && !isDone && timer) {
        // sync waktu saat kembali
        let savedTime = localStorage.getItem("cbt_time");
        if(savedTime) timeLeft = parseInt(savedTime);
    }
});

// ================== RENDER & NAVIGASI ==================
function renderQuestion() {
    if(!soal.length) return;
    let s = soal[currentQuestion];
    document.getElementById("questionLabel").innerHTML = `Soal ${currentQuestion+1}`;
    document.getElementById("q").innerHTML = s.pertanyaan;
    let optHtml = "";
    for(let opt of ['A','B','C','D']) {
        optHtml += `<div class="opt ${answers[currentQuestion]==opt?'active':''}" onclick="pick('${opt}')">
            <div class="letter">${opt}</div><div>${s[opt.toLowerCase()]}</div></div>`;
    }
    document.getElementById("opt").innerHTML = optHtml;
    let raguBtn = document.getElementById("raguBtn");
    if(ragu[currentQuestion]) { raguBtn.classList.add("active"); raguBtn.innerHTML="🚩 Ditandai Ragu"; }
    else { raguBtn.classList.remove("active"); raguBtn.innerHTML="🚩 Ragu"; }
    updateProgress();
}
function pick(ans) {
    recordQuestionTime();
    answers[currentQuestion] = ans;
    if(ragu[currentQuestion]) delete ragu[currentQuestion];
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}
function updateNavGrid() {
    let html = "";
    for(let i=0;i<soal.length;i++) {
        let cls = [];
        if(answers[i]) cls.push("done");
        if(ragu[i]) cls.push("ragu");
        if(i===currentQuestion) cls.push("activeQ");
        html += `<button class="${cls.join(' ')}" onclick="goToQuestion(${i})">${i+1}</button>`;
    }
    document.getElementById("nav").innerHTML = html;
}
function goToQuestion(i) {
    recordQuestionTime();
    currentQuestion = i;
    renderQuestion();
    updateNavGrid();
    updateStats();
    updateProgress();
    saveState();
}
function nextQuestion() {
    if(currentQuestion < soal.length-1) {
        recordQuestionTime();
        currentQuestion++;
        renderQuestion(); updateNavGrid(); updateStats(); updateProgress(); saveState();
    } else { if(confirm("Soal terakhir. Kumpulkan?")) showReviewModal(); }
}
function prevQuestion() {
    if(currentQuestion>0) {
        recordQuestionTime();
        currentQuestion--;
        renderQuestion(); updateNavGrid(); updateStats(); updateProgress(); saveState();
    }
}
function toggleRagu() {
    if(ragu[currentQuestion]) delete ragu[currentQuestion];
    else ragu[currentQuestion] = true;
    saveState();
    renderQuestion();
    updateNavGrid();
    updateStats();
}
function updateStats() {
    let answered = Object.keys(answers).length;
    let raguCount = Object.keys(ragu).length;
    document.getElementById("answeredCount").innerText = answered;
    document.getElementById("answeredSummary").innerText = answered;
    document.getElementById("raguSummary").innerText = raguCount;
    document.getElementById("unansweredSummary").innerText = soal.length - answered;
}
function updateProgress() {
    let percent = ((currentQuestion+1)/soal.length)*100;
    document.getElementById("progressFill").style.width = percent+"%";
}

// ================== PENCARIAN SOAL ==================
function searchSoal() {
    let keyword = document.getElementById("searchSoal").value.toLowerCase().trim();
    if(!keyword) return;
    for(let i=0;i<soal.length;i++) {
        if(soal[i].pertanyaan.toLowerCase().includes(keyword)) {
            goToQuestion(i);
            document.getElementById("searchSoal").value = "";
            break;
        }
    }
}

// ================== REVIEW MODAL ==================
function showReviewModal() { /* sama seperti sebelumnya, isi ulang karena panjang tapi tetap fungsi */ 
    let answered=Object.keys(answers).length, raguCount=Object.keys(ragu).length;
    document.getElementById("reviewTotal").innerText=soal.length;
    document.getElementById("reviewAnswered").innerText=answered;
    document.getElementById("reviewRagu").innerText=raguCount;
    document.getElementById("reviewUnanswered").innerText=soal.length-answered;
    let listHtml="";
    for(let i=0;i<soal.length;i++){
        let status="",cls="";
        if(answers[i]){ status="✅ Terjawab: "+answers[i]; cls="answered"; }
        else if(ragu[i]){ status="🚩 Ditandai Ragu"; cls="ragu"; }
        else{ status="❌ Belum dijawab"; cls="unanswered"; }
        listHtml+=`<div class="review-question-item ${cls}"><span><strong>Soal ${i+1}</strong></span><span>${status}</span><button class="secondary-btn" style="padding:5px 10px;" onclick="goToQuestionFromReview(${i})">Lanjutkan</button></div>`;
    }
    document.getElementById("reviewQuestionList").innerHTML=listHtml;
    document.getElementById("reviewModal").style.display="flex";
}
function goToQuestionFromReview(i){ closeReviewModal(); goToQuestion(i); }
function closeReviewModal(){ document.getElementById("reviewModal").style.display="none"; }
function confirmSubmit(){ closeReviewModal(); submit(); }

// ================== SUBMIT & LAPORAN DETAIL ==================
function submit() {
    if(isDone) return;
    let unanswered=0; for(let i=0;i<soal.length;i++) if(!answers[i]) unanswered++;
    if(!confirm(`Kumpulkan? ${Object.keys(answers).length}/${soal.length} terjawab, ${unanswered} belum. Lanjutkan?`)) return;
    isDone=true; clearInterval(timer);
    let score=0;
    for(let i=0;i<soal.length;i++) if(answers[i]==soal[i].kunci) score++;
    localStorage.setItem("cbt_submitted","true");
    localStorage.setItem("cbt_score",score);
    // simpan jawaban untuk laporan
    let results = [];
    for(let i=0;i<soal.length;i++){
        results.push({
            nomor:i+1,
            pertanyaan:soal[i].pertanyaan,
            jawabanUser:answers[i]||"(Tidak dijawab)",
            kunci:soal[i].kunci,
            benar:answers[i]==soal[i].kunci,
            pembahasan:soal[i].pembahasan || "Tidak ada pembahasan"
        });
    }
    localStorage.setItem("cbt_results", JSON.stringify(results));
    fetch(API,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"submit",nama, token, skor:score, jawaban:answers, total:soal.length})}).catch(e=>console.log);
    showResult(score);
}
function showResult(score) {
    document.getElementById("app").style.display="none";
    document.getElementById("result").style.display="flex";
    document.getElementById("scoreNumber").innerHTML=score;
    let persen = Math.round((score/soal.length)*100);
    let grade = persen>=90?"🏆 Luar Biasa!":persen>=75?"✅ Sangat Baik":persen>=60?"📚 Cukup":"📖 Perbanyak latihan";
    document.getElementById("skor").innerHTML = `Anda menjawab ${score} dari ${soal.length} benar (${persen}%)<br><strong>${grade}</strong>`;
    loadLeaderboard();
}
function toggleDetailReport() {
    let div = document.getElementById("detailReport");
    if(div.style.display==="none"){
        let results = JSON.parse(localStorage.getItem("cbt_results")||"[]");
        let html = `<table style="width:100%; border-collapse:collapse;"><tr><th>No</th><th>Soal</th><th>Jawaban Anda</th><th>Kunci</th><th>Status</th><th>Pembahasan</th></tr>`;
        results.forEach(r=>{
            let status = r.benar ? "✅ Benar" : "❌ Salah";
            let color = r.benar ? "#10b981" : "#ef4444";
            html += `<tr style="border-bottom:1px solid #ddd;"><td>${r.nomor}</td><td>${r.pertanyaan.substring(0,80)}...</td><td>${r.jawabanUser}</td><td>${r.kunci}</td><td style="color:${color}">${status}</td><td>${r.pembahasan}</td></tr>`;
        });
        html += `</table>`;
        div.innerHTML = html;
        div.style.display = "block";
    } else div.style.display = "none";
}
function loadLeaderboard() { /* sama seperti sebelumnya */ }

// ================== LOGIN & LOAD ==================
function login() {
    nama = document.getElementById("nama").value.trim();
    token = document.getElementById("token").value.trim();
    if(!nama||!token) { alert("Lengkapi data"); return; }
    fetch(API+"?action=validateToken&token="+token).then(r=>r.json()).then(res=>{
        if(!res.valid){ alert("Token tidak valid"); return; }
        isLoggedIn=true;
        saveState();
        document.getElementById("login").style.display="none";
        document.getElementById("app").style.display="block";
        loadQuestions();
    }).catch(err=>{ alert("Gagal validasi token"); });
}
function loadQuestions() {
    if(soal.length){ startFromSaved(); return; }
    fetch(API+"?action=getSoal").then(r=>r.json()).then(res=>{
        if(!res.soal) { alert("Soal tidak ditemukan"); return; }
        soal=res.soal;
        document.getElementById("totalCount").innerText=soal.length;
        startFromSaved();
        saveState();
    }).catch(err=>alert("Gagal load soal"));
}
function startFromSaved() {
    if(!soal.length) return;
    renderQuestion(); updateNavGrid(); updateStats(); updateProgress(); startTimer();
    questionStartTime = Date.now(); // reset timer per soal
}

// ================== DARK MODE & CALCULATOR & DRAWER ==================
function toggleDarkMode() { document.body.classList.toggle("dark-mode"); localStorage.setItem("darkMode", document.body.classList.contains("dark-mode")); }
function loadDarkMode() { if(localStorage.getItem("darkMode")==="true") document.body.classList.add("dark-mode"); }
function toggleCalculator() { let m=document.getElementById("calculatorModal"); m.style.display=m.style.display==="flex"?"none":"flex"; }
function appendToDisplay(v){ let d=document.getElementById("calcDisplay"); if(d) d.value+=v; }
function clearCalc(){ document.getElementById("calcDisplay").value=""; }
function deleteLastCalc(){ let d=document.getElementById("calcDisplay"); d.value=d.value.slice(0,-1); }
function calculateResult(){ let d=document.getElementById("calcDisplay"); try{ let r=Function('"use strict";return ('+d.value.replace(/×/g,'*').replace(/÷/g,'/')+')')(); d.value=r; }catch(e){ d.value="Error"; } }
function calcFunction(action){ /* implementasi sama seperti sebelumnya, disingkat */ }
function initCalculator() { /* attach event listener */ }
// Drawer untuk mobile
function initDrawer() {
    let drawer = document.getElementById("sideDrawer");
    let openBtn = document.getElementById("menuToggleBtn");
    let closeBtn = document.getElementById("closeDrawerBtn");
    if(openBtn) openBtn.onclick = () => drawer.classList.add("open");
    if(closeBtn) closeBtn.onclick = () => drawer.classList.remove("open");
    window.onclick = (e) => { if(e.target === drawer) drawer.classList.remove("open"); };
}
// ================== RESTART ==================
function restartExam() { if(confirm("Mulai ujian baru? Semua jawaban akan hilang.")) { clearSession(); location.reload(); } }

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
    loadDarkMode();
    initCalculator();
    initDrawer();
    let saved = localStorage.getItem("cbt_isLoggedIn");
    if(saved === "true") {
        loadSavedState();
        if(soal.length) {
            document.getElementById("login").style.display="none";
            document.getElementById("app").style.display="block";
            startFromSaved();
        }
    }
});

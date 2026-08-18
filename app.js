
const canvas = document.getElementById("poseCanvas");
const ctx = canvas.getContext("2d");

const poseTemplates = [
  { name:"Standing Twist", type:"stand", energy:0.25 },
  { name:"Running Step", type:"run", energy:0.8 },
  { name:"Deep Crouch", type:"crouch", energy:0.65 },
  { name:"Long Reach", type:"reach", energy:0.55 },
  { name:"Jump Pose", type:"jump", energy:0.9 },
  { name:"Seated Lean", type:"sit", energy:0.35 },
  { name:"Fight Guard", type:"fight", energy:0.7 },
  { name:"Back Bend", type:"bend", energy:0.75 },
];

const cameraNames = ["正面", "背面", "真横", "斜め", "俯瞰", "アオリ", "斜め俯瞰", "斜めアオリ"];

let currentPose = 0;
let currentAngle = 0;
let currentScale = 1;
let currentSeed = Math.random();

let durationSeconds = 300;
let remainingSeconds = durationSeconds;
let timerId = null;
let running = false;
let calendarDate = new Date();
let calendarYear = new Date().getFullYear();

const poseName = document.getElementById("poseName");
const cameraBadge = document.getElementById("cameraBadge");
const timerDisplay = document.getElementById("timerDisplay");
const startPauseBtn = document.getElementById("startPauseBtn");
const pauseOverlay = document.getElementById("pauseOverlay");

const storageKey = "poseSketchTrainerLogV1";

function loadLog(){
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}
function saveLog(log){ localStorage.setItem(storageKey, JSON.stringify(log)); }
function keyFor(date){
  const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,"0"), d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function addDrawing(count=1, minutes=0){
  const log=loadLog();
  const k=keyFor(new Date());
  if(!log[k]) log[k]={count:0,minutes:0};
  log[k].count += count;
  log[k].minutes += minutes;
  saveLog(log);
  refreshToday();
  renderStats();
}
function refreshToday(){
  const log=loadLog();
  const x=log[keyFor(new Date())] || {count:0,minutes:0};
  document.getElementById("todayCount").textContent=x.count;
  document.getElementById("todayMinutes").textContent=Math.round(x.minutes);
}

function fmt(sec){
  const m=Math.floor(sec/60);
  const s=Math.floor(sec%60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function updateTimer(){ timerDisplay.textContent=fmt(remainingSeconds); }

function setTimer(seconds){
  durationSeconds=seconds;
  remainingSeconds=seconds;
  stopTimer();
  updateTimer();
}
function startTimer(){
  if(running) return;
  running=true;
  startPauseBtn.textContent="一時停止";
  pauseOverlay.classList.add("hidden");
  timerId=setInterval(()=>{
    remainingSeconds--;
    updateTimer();
    if(remainingSeconds<=0){
      clearInterval(timerId);
      timerId=null;
      running=false;
      startPauseBtn.textContent="開始";
      if(document.getElementById("countOnComplete").checked){
        addDrawing(1, durationSeconds/60);
      }
      if(document.getElementById("autoNext").checked){
        randomizePose();
        remainingSeconds=durationSeconds;
        updateTimer();
        startTimer();
      }
    }
  },1000);
}
function stopTimer(){
  if(timerId) clearInterval(timerId);
  timerId=null;
  running=false;
  startPauseBtn.textContent="開始";
}
function toggleTimer(){
  if(running){
    stopTimer();
    pauseOverlay.classList.remove("hidden");
  } else {
    startTimer();
  }
}

function rand(min,max){ return min+Math.random()*(max-min); }

function difficultyParams(){
  const d=document.getElementById("difficulty").value;
  if(d==="easy") return {rot:.2, tilt:.08, spread:.25};
  if(d==="hard") return {rot:.9, tilt:.35, spread:.8};
  return {rot:.55, tilt:.2, spread:.5};
}

function randomizePose(){
  currentPose=Math.floor(Math.random()*poseTemplates.length);
  currentAngle=Math.floor(Math.random()*cameraNames.length);
  currentScale=rand(.9,1.08);
  currentSeed=Math.random();
  poseName.textContent=poseTemplates[currentPose].name;
  cameraBadge.textContent=cameraNames[currentAngle];
  drawPose();
}

function limb(a,b,width=16){
  ctx.lineCap="round";
  ctx.lineWidth=width;
  ctx.beginPath();
  ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
  ctx.stroke();
}
function joint(p,r=10){
  ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
}
function drawPose(){
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.save();

  const mode=document.getElementById("renderMode").value;
  const dp=difficultyParams();
  const template=poseTemplates[currentPose];

  let baseX=W/2, baseY=H*0.56;
  const skew=(currentAngle-3.5)*0.035;
  const tilt=(currentAngle>=4? -1:1)*dp.tilt;
  const e=template.energy*dp.spread;

  ctx.translate(baseX,baseY);
  ctx.scale(currentScale, currentScale);
  ctx.rotate(skew*0.5);

  if(mode==="wire"){
    ctx.strokeStyle="#1f2937"; ctx.fillStyle="#1f2937";
  } else if(mode==="silhouette"){
    ctx.strokeStyle="#111827"; ctx.fillStyle="#111827";
  } else {
    ctx.strokeStyle="#6b7280"; ctx.fillStyle="#9ca3af";
  }

  const hip={x:0,y:35};
  const chest={x:10*Math.sin(currentSeed*8),y:-95};
  const neck={x:chest.x+3,y:-135};
  const head={x:neck.x+8*Math.sin(currentSeed*10),y:-178};

  const shoulderL={x:chest.x-55,y:-105};
  const shoulderR={x:chest.x+55,y:-105};

  let elbowL={x:-105-e*35,y:-40-e*50};
  let handL={x:-135-e*45,y:35-e*80};
  let elbowR={x:105+e*40,y:-55+e*20};
  let handR={x:145+e*70,y:-10-e*75};

  let kneeL={x:-45-e*25,y:145};
  let footL={x:-65-e*40,y:265-e*25};
  let kneeR={x:55+e*30,y:135-e*40};
  let footR={x:75+e*55,y:265-e*80};

  switch(template.type){
    case "crouch":
      chest.y=-50; hip.y=30;
      kneeL={x:-85,y:100}; footL={x:-120,y:190};
      kneeR={x:90,y:105}; footR={x:135,y:185};
      break;
    case "sit":
      chest.y=-80; hip.y=15;
      kneeL={x:-90,y:85}; footL={x:-135,y:180};
      kneeR={x:85,y:85}; footR={x:130,y:180};
      break;
    case "jump":
      hip.y=0; chest.y=-110;
      kneeL={x:-65,y:80}; footL={x:-115,y:145};
      kneeR={x:70,y:55}; footR={x:120,y:125};
      break;
    case "fight":
      elbowL={x:-90,y:-70}; handL={x:-25,y:-80};
      elbowR={x:85,y:-65}; handR={x:35,y:-55};
      kneeL={x:-65,y:145}; footL={x:-110,y:250};
      kneeR={x:80,y:125}; footR={x:130,y:225};
      break;
    case "reach":
      elbowR={x:95,y:-150}; handR={x:120,y:-245};
      break;
    case "bend":
      chest.x=55; chest.y=-65; neck.x=78; head.x=95;
      break;
    case "run":
      elbowL={x:-100,y:-90}; handL={x:-65,y:-20};
      elbowR={x:90,y:-35}; handR={x:55,y:-105};
      kneeL={x:-70,y:110}; footL={x:-125,y:190};
      kneeR={x:80,y:165}; footR={x:130,y:255};
      break;
  }

  // camera tilt approximation
  [hip,chest,neck,head,shoulderL,shoulderR,elbowL,elbowR,handL,handR,kneeL,kneeR,footL,footR].forEach(p=>{
    p.x += p.y * tilt * 0.08;
    p.y *= (1 - Math.abs(tilt)*0.08);
  });

  // floor
  ctx.save();
  ctx.strokeStyle="rgba(107,114,128,.22)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(-320,285);ctx.lineTo(320,285);ctx.stroke();
  ctx.restore();

  // torso
  if(mode==="silhouette"){
    ctx.lineWidth=34;
  } else {
    ctx.lineWidth=26;
  }
  limb(hip,chest,ctx.lineWidth);
  limb(chest,neck,18);
  limb(shoulderL,shoulderR,22);

  limb(shoulderL,elbowL,18); limb(elbowL,handL,14);
  limb(shoulderR,elbowR,18); limb(elbowR,handR,14);
  limb(hip,kneeL,24); limb(kneeL,footL,18);
  limb(hip,kneeR,24); limb(kneeR,footR,18);

  [hip,chest,shoulderL,shoulderR,elbowL,elbowR,handL,handR,kneeL,kneeR,footL,footR].forEach(p=>joint(p, mode==="wire"?7:10));

  ctx.beginPath();
  ctx.arc(head.x,head.y,34,0,Math.PI*2);
  ctx.fill();

  if(mode==="body"){
    ctx.save();
    ctx.globalAlpha=.18;
    ctx.fillStyle="#111827";
    ctx.beginPath();
    ctx.ellipse(chest.x+8,chest.y+8,50,72,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function monthData(year,month){
  const first=new Date(year,month,1);
  const last=new Date(year,month+1,0);
  return {first,last,days:last.getDate(),offset:(first.getDay()+6)%7};
}

function renderMonth(){
  const grid=document.getElementById("monthCalendar");
  grid.innerHTML="";
  const y=calendarDate.getFullYear(), m=calendarDate.getMonth();
  document.getElementById("calendarTitle").textContent=`${y}年 ${m+1}月`;
  const info=monthData(y,m);
  const log=loadLog();

  for(let i=0;i<info.offset;i++){
    const d=document.createElement("div");
    d.className="day-cell empty";
    grid.appendChild(d);
  }

  for(let day=1;day<=info.days;day++){
    const date=new Date(y,m,day);
    const k=keyFor(date);
    const item=log[k];
    const cell=document.createElement("div");
    cell.className="day-cell"+(item && item.count>0?" done":"");
    cell.innerHTML=`<span class="day-number">${day}</span>${item&&item.count>0?`<span class="day-count">${item.count}枚</span><span class="day-minutes">${Math.round(item.minutes||0)}分</span>`:""}`;
    grid.appendChild(cell);
  }
}

function renderYear(){
  const root=document.getElementById("yearGrid");
  root.innerHTML="";
  document.getElementById("yearTitle").textContent=`${calendarYear}年`;
  const log=loadLog();

  for(let m=0;m<12;m++){
    const wrap=document.createElement("div");
    wrap.className="year-month";
    const title=document.createElement("h4");
    title.textContent=`${m+1}月`;
    wrap.appendChild(title);

    const mini=document.createElement("div");
    mini.className="mini-grid";
    const info=monthData(calendarYear,m);
    for(let i=0;i<info.offset;i++){
      const x=document.createElement("div"); x.className="mini-day empty"; mini.appendChild(x);
    }
    for(let d=1;d<=info.days;d++){
      const date=new Date(calendarYear,m,d);
      const item=log[keyFor(date)];
      const x=document.createElement("div");
      x.className="mini-day"+(item&&item.count>0?" done":"");
      x.title=`${calendarYear}/${m+1}/${d}${item&&item.count>0?` - ${item.count}枚`:""}`;
      mini.appendChild(x);
    }
    wrap.appendChild(mini);
    root.appendChild(wrap);
  }
}

function streaks(){
  const log=loadLog();
  const dates=Object.keys(log).filter(k=>log[k]?.count>0).sort();
  if(!dates.length) return {current:0,best:0};

  const set=new Set(dates);
  let best=0, run=0, prev=null;
  for(const k of dates){
    const d=new Date(k+"T00:00:00");
    if(prev){
      const diff=Math.round((d-prev)/86400000);
      run=diff===1?run+1:1;
    } else run=1;
    best=Math.max(best,run);
    prev=d;
  }

  let cur=0;
  let d=new Date();
  if(!set.has(keyFor(d))){
    d.setDate(d.getDate()-1);
  }
  while(set.has(keyFor(d))){
    cur++;
    d.setDate(d.getDate()-1);
  }
  return {current:cur,best};
}

function renderSummary(){
  const log=loadLog();
  const now=new Date();
  let days=0,count=0;
  Object.entries(log).forEach(([k,v])=>{
    const d=new Date(k+"T00:00:00");
    if(d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && v.count>0){
      days++; count+=v.count;
    }
  });
  const s=streaks();
  document.getElementById("monthDays").textContent=`${days}日`;
  document.getElementById("monthCount").textContent=`${count}枚`;
  document.getElementById("streak").textContent=`${s.current}日`;
  document.getElementById("bestStreak").textContent=`${s.best}日`;
}
function renderStats(){ renderMonth(); renderYear(); renderSummary(); }

document.getElementById("randomBtn").onclick=randomizePose;
document.getElementById("nextBtn").onclick=randomizePose;
document.getElementById("prevBtn").onclick=randomizePose;
document.getElementById("difficulty").onchange=drawPose;
document.getElementById("renderMode").onchange=drawPose;

document.querySelectorAll(".preset").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".preset").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    setTimer(Number(btn.dataset.minutes)*60);
  };
});

startPauseBtn.onclick=toggleTimer;
document.getElementById("resetBtn").onclick=()=>{
  stopTimer(); remainingSeconds=durationSeconds; updateTimer(); pauseOverlay.classList.add("hidden");
};
document.getElementById("manualAddBtn").onclick=()=>addDrawing(1,0);

const dlg=document.getElementById("statsDialog");
document.getElementById("openStatsBtn").onclick=()=>{ renderStats(); dlg.showModal(); };
document.getElementById("closeStatsBtn").onclick=()=>dlg.close();

document.getElementById("monthTab").onclick=()=>{
  document.getElementById("monthView").classList.remove("hidden");
  document.getElementById("yearView").classList.add("hidden");
  document.getElementById("monthTab").classList.add("active");
  document.getElementById("yearTab").classList.remove("active");
};
document.getElementById("yearTab").onclick=()=>{
  document.getElementById("yearView").classList.remove("hidden");
  document.getElementById("monthView").classList.add("hidden");
  document.getElementById("yearTab").classList.add("active");
  document.getElementById("monthTab").classList.remove("active");
};

document.getElementById("prevMonth").onclick=()=>{ calendarDate.setMonth(calendarDate.getMonth()-1); renderMonth(); };
document.getElementById("nextMonth").onclick=()=>{ calendarDate.setMonth(calendarDate.getMonth()+1); renderMonth(); };
document.getElementById("prevYear").onclick=()=>{ calendarYear--; renderYear(); };
document.getElementById("nextYear").onclick=()=>{ calendarYear++; renderYear(); };

window.addEventListener("resize", drawPose);

refreshToday();
updateTimer();
randomizePose();


/* ===== Mobile UI sync ===== */
const mobileTimer = document.getElementById("mobileTimer");
const mobileToday = document.getElementById("mobileToday");
const mobileStartBtn = document.getElementById("mobileStartBtn");

const originalUpdateTimer = updateTimer;
updateTimer = function(){
  originalUpdateTimer();
  if (mobileTimer) mobileTimer.textContent = timerDisplay.textContent;
};

const originalRefreshToday = refreshToday;
refreshToday = function(){
  originalRefreshToday();
  if (mobileToday) mobileToday.textContent = `${document.getElementById("todayCount").textContent}枚`;
};

function syncMobileStart(){
  if (!mobileStartBtn) return;
  mobileStartBtn.textContent = running ? "一時停止" : "開始";
}

const originalStartTimer = startTimer;
startTimer = function(){
  originalStartTimer();
  syncMobileStart();
};

const originalStopTimer = stopTimer;
stopTimer = function(){
  originalStopTimer();
  syncMobileStart();
};

if (mobileStartBtn) {
  mobileStartBtn.onclick = () => {
    toggleTimer();
    syncMobileStart();
  };
}

startPauseBtn.addEventListener("click", syncMobileStart);
document.getElementById("resetBtn").addEventListener("click", syncMobileStart);

document.addEventListener("visibilitychange", () => {
  // Safariで画面復帰したとき表示を再同期
  updateTimer();
  refreshToday();
  syncMobileStart();
});

updateTimer();
refreshToday();
syncMobileStart();

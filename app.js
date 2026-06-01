document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("canvasBox");
  const paintCanvas = document.getElementById("paintCanvas");
  const lineCanvas = document.getElementById("lineCanvas");
  const sparkleLayer = document.getElementById("sparkleLayer");
  const pctx = paintCanvas.getContext("2d", { willReadFrequently: true });
  const lctx = lineCanvas.getContext("2d", { willReadFrequently: true });

  const palette = document.getElementById("palette");
  const sampleStrip = document.getElementById("sampleStrip");
  const imageInput = document.getElementById("imageInput");
  const lineBtn = document.getElementById("lineBtn");
  const saveBtn = document.getElementById("saveBtn");
  const completeBtn = document.getElementById("completeBtn");
  const completeBtn2 = document.getElementById("completeBtn2");
  const partySaveBtn = document.getElementById("partySaveBtn");
  const partyCloseBtn = document.getElementById("partyCloseBtn");
  const celebration = document.getElementById("celebration");
  const toast = document.getElementById("toast");
  const sizeRange = document.getElementById("sizeRange");
  const catChips = [...document.querySelectorAll(".catChip")];
  const stickerTray = document.getElementById("stickerTray");
  const stickerChoices = [...document.querySelectorAll(".stickerChoice")];

  const toolButtons = {
    brush: document.getElementById("brushBtn"),
    marker: document.getElementById("markerBtn"),
    crayon: document.getElementById("crayonBtn"),
    glitter: document.getElementById("glitterBtn"),
    eraser: document.getElementById("eraserBtn"),
    sticker: document.getElementById("stickerBtn")
  };
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const resetBtn = document.getElementById("resetBtn");

  let currentColor = "#ff3b30";
  let tool = "brush";
  let drawing = false;
  let last = { x: 0, y: 0 };
  let originalImage = null;
  let cleanPaint = null;
  let cleanLine = null;
  let undoStack = [];
  let redoStack = [];
  let currentSample = "cat_princess";
  let currentCategory = "animals";
  let lastSparkle = 0;
  let selectedSticker = "⭐";
  const AUTOSAVE_KEY = "vinhpaint_autosave_v1";
  const HISTORY_LIMIT = 50;

  const colors = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#8FF3D4", "#007aff", "#5856d6", "#af52de", "#FF6B9A", "#8e5a2a", "#111111", "#ffffff"];

  const samples = [
    { id:"cat_princess", category:"animals", emoji:"🐱", name:"Mèo Nơ Công Chúa", tag:"Cute animal" },
    { id:"puppy_balloon", category:"animals", emoji:"🐶", name:"Cún Bong Bóng", tag:"Playful" },
    { id:"bunny_garden", category:"animals", emoji:"🐰", name:"Thỏ Vườn Hoa", tag:"Kawaii" },
    { id:"lion_crown", category:"animals", emoji:"🦁", name:"Sư Tử Vương Miện", tag:"Safari" },
    { id:"bear_picnic", category:"animals", emoji:"🐻", name:"Gấu Picnic", tag:"Sweet" },
    { id:"dolphin_ocean", category:"ocean", emoji:"🐬", name:"Cá Heo Đại Dương", tag:"Ocean scene" },
    { id:"turtle_reef", category:"ocean", emoji:"🐢", name:"Rùa Biển San Hô", tag:"Ocean" },
    { id:"fish_castle", category:"ocean", emoji:"🐠", name:"Cá Nhỏ Lâu Đài", tag:"Underwater" },
    { id:"unicorn_star", category:"animals", emoji:"🦄", name:"Kỳ Lân Ngôi Sao", tag:"Fantasy" },
    { id:"butterfly_flower", category:"animals", emoji:"🦋", name:"Bướm Vườn Hoa", tag:"Cute world" },

    { id:"robotcat_1", category:"robotcat", emoji:"🤖", name:"Mèo Robot Túi Thần Kỳ", tag:"Original robot cat" },
    { id:"robotcat_2", category:"robotcat", emoji:"🔔", name:"Mèo Robot Chuông", tag:"Original robot cat" },
    { id:"robotcat_3", category:"robotcat", emoji:"🚀", name:"Mèo Robot Tên Lửa", tag:"Original robot cat" },
    { id:"robotcat_4", category:"robotcat", emoji:"🎒", name:"Bạn Nhỏ Ba Lô", tag:"Anime kid" },
    { id:"robotcat_5", category:"robotcat", emoji:"🌈", name:"Mèo Robot Cầu Vồng", tag:"Original robot cat" },
    { id:"robotcat_6", category:"robotcat", emoji:"⭐", name:"Mèo Robot Ngôi Sao", tag:"Original robot cat" },
    { id:"robotcat_7", category:"robotcat", emoji:"🛸", name:"Mèo Robot UFO", tag:"Original robot cat" },
    { id:"robotcat_8", category:"robotcat", emoji:"🎨", name:"Mèo Robot Họa Sĩ", tag:"Original robot cat" },
    { id:"robotcat_9", category:"robotcat", emoji:"🍩", name:"Mèo Robot Bánh Rán", tag:"Original robot cat" },
    { id:"robotcat_10", category:"robotcat", emoji:"🏖️", name:"Mèo Robot Biển", tag:"Original robot cat" }
  ];

  function msg(t){ toast.textContent = t; }

  function beep(type="tap"){
    try{
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const now = ctx.currentTime;
      const freq = type === "success" ? 660 : type === "sparkle" ? 880 : 440;
      o.type = type === "success" ? "triangle" : "sine";
      o.frequency.setValueAtTime(freq, now);
      if(type === "success") o.frequency.exponentialRampToValueAtTime(990, now + .18);
      g.gain.setValueAtTime(.0001, now);
      g.gain.exponentialRampToValueAtTime(.08, now + .015);
      g.gain.exponentialRampToValueAtTime(.0001, now + .22);
      o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + .24);
    }catch(e){}
  }

  function popSparkle(x,y,emoji="✨"){
    const now = performance.now();
    if(now - lastSparkle < 55) return;
    lastSparkle = now;
    const r = paintCanvas.getBoundingClientRect();
    const sp = document.createElement("span");
    sp.className = "sparkle";
    sp.textContent = emoji;
    sp.style.left = (x / paintCanvas.width * r.width) + "px";
    sp.style.top = (y / paintCanvas.height * r.height) + "px";
    sparkleLayer.appendChild(sp);
    setTimeout(()=>sp.remove(), 800);
  }

  function confetti(){
    const bits = ["🎉","✨","⭐","💖","🌈","🎨"];
    for(let i=0;i<42;i++){
      const b = document.createElement("span");
      b.className = "confetti";
      b.textContent = bits[i % bits.length];
      b.style.left = Math.random()*100 + "vw";
      b.style.animationDelay = Math.random()*0.45 + "s";
      b.style.fontSize = (16 + Math.random()*15) + "px";
      document.body.appendChild(b);
      setTimeout(()=>b.remove(), 2300);
    }
  }

  function celebrate(){
    celebration.classList.remove("hidden");
    confetti(); beep("success");
    msg("Hoàn thành rồi! Bé tô đẹp quá 🎉");
  }

  function setupPalette(){
    palette.innerHTML = "";
    colors.forEach((c,i)=>{
      const b=document.createElement("button");
      b.className="colorDot"+(i===0?" active":"");
      b.style.background=c;
      b.type="button";
      b.title=c;
      b.onclick=()=>{
        currentColor=c;
        if(tool === "eraser") tool="brush";
        updateToolButtons();
        document.querySelectorAll(".colorDot").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        beep("tap"); msg("Đã chọn màu mới");
      };
      palette.appendChild(b);
    });
  }

  function setupSamples(){
    sampleStrip.innerHTML = "";
    samples.filter(s => currentCategory === "all" || s.category === currentCategory).forEach(s=>{
      const b=document.createElement("button");
      b.className="sampleBtn"+(s.id===currentSample?" active":"");
      b.type="button";
      b.innerHTML = `<span class="thumb">${s.emoji}</span><span><span class="name">${s.name}</span><span class="tag">${s.tag}</span></span>`;
      b.onclick=()=>{
        currentSample=s.id;
        document.querySelectorAll(".sampleBtn").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        drawSample(s.id);
        beep("tap");
      };
      sampleStrip.appendChild(b);
    });
  }

  catChips.forEach(chip => chip.onclick = () => {
    currentCategory = chip.dataset.category;
    catChips.forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    const visible = samples.filter(s => currentCategory === "all" || s.category === currentCategory);
    if(!visible.find(s=>s.id===currentSample)) currentSample = visible[0].id;
    setupSamples();
    drawSample(currentSample);
    beep("tap");
  });

  function resize(){
    const oldPaint = paintCanvas.width ? paintCanvas.toDataURL("image/png") : null;
    const oldLine = lineCanvas.width ? lineCanvas.toDataURL("image/png") : null;
    const rect = box.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(320, Math.round(rect.width * dpr));
    const h = Math.max(320, Math.round(rect.height * dpr));
    paintCanvas.width = lineCanvas.width = w;
    paintCanvas.height = lineCanvas.height = h;
    clearPaint(); clearLine();
    if (oldPaint && oldLine) {
      const ip = new Image(); const il = new Image();
      ip.onload=()=>pctx.drawImage(ip,0,0,w,h);
      il.onload=()=>lctx.drawImage(il,0,0,w,h);
      ip.src=oldPaint; il.src=oldLine;
    } else if(!restoreAutosave(true)) drawSample(currentSample);
  }

  function clearPaint(){ pctx.fillStyle="white"; pctx.fillRect(0,0,paintCanvas.width,paintCanvas.height); }
  function clearLine(){ lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height); }

  const commonDefs = `<defs><style>.l{fill:none;stroke:#17110a;stroke-width:13;stroke-linecap:round;stroke-linejoin:round}.m{fill:none;stroke:#17110a;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}.s{fill:none;stroke:#17110a;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.f{fill:#17110a;stroke:none}.w{fill:white;stroke:#17110a;stroke-width:10;stroke-linecap:round;stroke-linejoin:round}</style></defs>`;
  function svgWrap(content){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700">${commonDefs}<rect width="1000" height="700" fill="white" opacity="0"/>${content}</svg>`; }
  function bubbles(){ return `<g class="m"><circle cx="120" cy="145" r="20"/><circle cx="830" cy="115" r="18"/><circle cx="760" cy="225" r="28"/><circle cx="205" cy="580" r="22"/><circle cx="905" cy="420" r="16"/></g>`; }
  function flowers(){ return `<g class="m"><path d="M115 610c40-90 65-125 95-90 25 30-10 60-35 74 50-10 95 10 55 45-35 32-70 7-96-18"/><circle cx="130" cy="600" r="17"/><circle cx="100" cy="594" r="17"/><circle cx="115" cy="570" r="17"/><circle cx="150" cy="573" r="17"/><path d="M760 610c50-100 90-110 100-35 45-25 82-15 63 35"/><circle cx="825" cy="595" r="18"/><circle cx="790" cy="585" r="18"/><circle cx="815" cy="555" r="18"/><circle cx="850" cy="570" r="18"/></g>`; }
  function stars(){ return `<g class="m"><path d="M115 90l15 32 35 5-25 25 6 35-31-16-31 16 6-35-25-25 35-5z"/><path d="M850 78l12 25 28 4-20 20 5 28-25-13-25 13 5-28-20-20 28-4z"/><path d="M175 590l13 27 30 4-22 21 6 30-27-14-27 14 6-30-22-21 30-4z"/></g>`; }

  function art(id){
    const robotBase = (extra="", bg="") => svgWrap(`${bg}<g><circle class="l" cx="500" cy="270" r="150"/><path class="l" d="M365 278c-45-105 0-195 83-172M635 278c45-105 0-195-83-172"/><circle class="l" cx="455" cy="235" r="35"/><circle class="l" cx="545" cy="235" r="35"/><circle class="f" cx="465" cy="242" r="10"/><circle class="f" cx="535" cy="242" r="10"/><ellipse class="w" cx="500" cy="298" rx="42" ry="28"/><path class="m" d="M500 322v38M500 360c-45 42-92 34-118 3M500 360c45 42 92 34 118 3"/><path class="m" d="M386 315H275M388 345H275M612 315h113M612 345h113"/><circle class="l" cx="500" cy="452" r="116"/><path class="m" d="M398 410c60 42 142 42 204 0"/><circle class="l" cx="500" cy="420" r="24"/><path class="l" d="M390 525c-52 55-125 46-155 5M610 525c52 55 125 46 155 5"/>${extra}</g>`);
    const map = {
      cat_princess: svgWrap(`${flowers()}<g><ellipse class="l" cx="500" cy="392" rx="185" ry="142"/><path class="l" d="M360 300l-80-145 160 72M640 300l80-145-160 72"/><path class="l" d="M385 160c30-70 95-75 140-8 42-70 110-55 126 18 90-26 135 60 80 122-50 55-135 29-145-41-55 35-128 14-145-48-68 44-120 11-56-43z"/><circle class="f" cx="430" cy="365" r="23"/><circle class="f" cx="570" cy="365" r="23"/><ellipse class="w" cx="500" cy="420" rx="35" ry="20"/><path class="m" d="M365 420H210M370 465H225M635 420h155M630 465h145"/><path class="l" d="M380 510c-60 42-115 118-83 160 52 38 132-28 155-95"/><path class="l" d="M620 510c60 42 115 118 83 160-52 38-132-28-155-95"/><path class="l" d="M375 520c90 65 165 65 250 0"/></g>`),
      puppy_balloon: svgWrap(`${stars()}<g><ellipse class="l" cx="500" cy="405" rx="200" ry="140"/><circle class="l" cx="500" cy="275" r="145"/><ellipse class="l" cx="345" cy="275" rx="65" ry="125" transform="rotate(-25 345 275)"/><ellipse class="l" cx="655" cy="275" rx="65" ry="125" transform="rotate(25 655 275)"/><circle class="f" cx="445" cy="250" r="18"/><circle class="f" cx="555" cy="250" r="18"/><ellipse class="w" cx="500" cy="312" rx="48" ry="32"/><path class="m" d="M500 334c-35 45-92 39-120 5M500 334c35 45 92 39 120 5"/><path class="l" d="M650 420c120-120 230-45 185 50-35 75-140 42-160-15"/><ellipse class="l" cx="245" cy="165" rx="58" ry="75"/><path class="m" d="M245 240c-15 75-55 118-40 185"/><ellipse class="l" cx="760" cy="145" rx="60" ry="78"/><path class="m" d="M760 224c-12 70-5 118 35 165"/></g>`),
      bunny_garden: svgWrap(`${flowers()}<g><ellipse class="l" cx="500" cy="410" rx="178" ry="145"/><circle class="l" cx="500" cy="275" r="132"/><ellipse class="l" cx="430" cy="115" rx="50" ry="145" transform="rotate(-10 430 115)"/><ellipse class="l" cx="570" cy="115" rx="50" ry="145" transform="rotate(10 570 115)"/><ellipse class="m" cx="430" cy="120" rx="24" ry="100" transform="rotate(-10 430 115)"/><ellipse class="m" cx="570" cy="120" rx="24" ry="100" transform="rotate(10 570 115)"/><circle class="f" cx="452" cy="265" r="17"/><circle class="f" cx="548" cy="265" r="17"/><ellipse class="w" cx="500" cy="320" rx="28" ry="20"/><path class="m" d="M500 338v30M500 368c-32 30-70 20-95-5M500 368c32 30 70 20 95-5"/><path class="l" d="M380 520c-70 55-105 125-55 150 65 32 120-45 142-98"/><path class="l" d="M620 520c70 55 105 125 55 150-65 32-120-45-142-98"/></g>`),
      lion_crown: svgWrap(`${stars()}<g><path class="l" d="M360 165l52 78 88-95 88 95 52-78 10 150H350z"/><circle class="l" cx="500" cy="380" r="185"/><path class="l" d="M500 170c95 28 190 90 225 190M500 170c-95 28-190 90-225 190M275 360c5 130 102 230 225 230s220-100 225-230"/><circle class="f" cx="430" cy="345" r="18"/><circle class="f" cx="570" cy="345" r="18"/><ellipse class="w" cx="500" cy="410" rx="36" ry="26"/><path class="m" d="M500 432c-30 38-85 34-115 0M500 432c30 38 85 34 115 0"/><path class="m" d="M385 410H260M390 455H285M615 410h125M610 455h105"/></g>`),
      bear_picnic: svgWrap(`<g class="m"><path d="M120 590h760"/><rect x="210" y="500" width="220" height="100" rx="25"/><path d="M220 548h200M320 505v92"/><circle cx="775" cy="505" r="48"/><path d="M748 470c-40-35-70-25-72 18"/></g><g><circle class="l" cx="500" cy="290" r="150"/><circle class="l" cx="375" cy="175" r="65"/><circle class="l" cx="625" cy="175" r="65"/><ellipse class="l" cx="500" cy="465" rx="180" ry="140"/><circle class="f" cx="445" cy="270" r="17"/><circle class="f" cx="555" cy="270" r="17"/><ellipse class="w" cx="500" cy="340" rx="58" ry="43"/><path class="m" d="M500 342c-30 30-70 25-92 0M500 342c30 30 70 25 92 0"/><path class="l" d="M375 430c-95 10-150 90-115 140M625 430c95 10 150 90 115 140"/></g>`),
      dolphin_ocean: svgWrap(`${bubbles()}<g><path class="l" d="M225 550c70-120 170-190 282-205 135-18 235 58 276 160-112-20-198-5-270 44-105 72-205 76-288 1z"/><path class="l" d="M615 345c50-80 130-95 200-45-64 10-100 45-114 105"/><path class="l" d="M515 550c-15 70-70 105-135 112 20-55 60-94 115-122"/><path class="l" d="M695 505c35 62 95 78 155 61-36-40-80-62-134-70"/><circle class="f" cx="360" cy="415" r="22"/><path class="m" d="M240 455c75 25 160 20 238-15"/><path class="m" d="M120 650c55-90 95-105 120-40 28-95 88-120 95-5 40-58 90-55 105 15M700 640c48-82 90-104 112-35 35-80 92-90 102 0"/></g>`),
      turtle_reef: svgWrap(`${bubbles()}<g><ellipse class="l" cx="500" cy="370" rx="230" ry="145"/><circle class="l" cx="735" cy="342" r="75"/><circle class="f" cx="760" cy="325" r="13"/><path class="l" d="M295 455c-88 44-140 18-178-40M555 495c-10 102-70 145-150 140M405 495c-80 65-155 56-212 0M650 460c70 65 145 60 210 0"/><path class="m" d="M350 285l290 165M640 285L350 455M500 230v285M285 370h430"/><path class="m" d="M120 650c50-115 90-120 125-35 25-85 75-90 88-10 42-60 90-65 112 5"/></g>`),
      fish_castle: svgWrap(`${bubbles()}<g><path class="m" d="M100 635h800"/><path class="l" d="M275 520V365h90V260h70v105h90V250h70v115h90v155z"/><path class="m" d="M320 520v-75c0-45 60-45 60 0v75M555 520v-78c0-45 65-45 65 0v78"/><ellipse class="l" cx="655" cy="285" rx="115" ry="75"/><path class="l" d="M755 285l120-85v170z"/><circle class="f" cx="605" cy="265" r="15"/><path class="m" d="M548 305c50 30 110 30 165 0"/><ellipse class="l" cx="245" cy="190" rx="78" ry="50"/><path class="l" d="M172 190l-78-55v110z"/><circle class="f" cx="272" cy="178" r="10"/></g>`),
      unicorn_star: svgWrap(`${stars()}<g><ellipse class="l" cx="500" cy="410" rx="170" ry="120"/><circle class="l" cx="500" cy="250" r="125"/><path class="l" d="M500 105l48-98 36 120"/><path class="m" d="M482 65h48M470 100h75"/><path class="l" d="M375 210c-70-90-150-45-135 38"/><path class="l" d="M625 210c70-90 150-45 135 38"/><circle class="f" cx="452" cy="252" r="15"/><circle class="f" cx="548" cy="252" r="15"/><ellipse class="w" cx="500" cy="310" rx="35" ry="24"/><path class="m" d="M460 340c32 30 80 32 120 0"/><path class="l" d="M365 500c-80 40-115 125-60 155M635 500c80 40 115 125 60 155"/><path class="m" d="M330 160c25-60 75-80 125-20M670 160c-25-60-75-80-125-20"/></g>`),
      butterfly_flower: svgWrap(`${flowers()}<g><ellipse class="l" cx="350" cy="300" rx="150" ry="210" transform="rotate(-18 350 300)"/><ellipse class="l" cx="650" cy="300" rx="150" ry="210" transform="rotate(18 650 300)"/><ellipse class="l" cx="385" cy="500" rx="120" ry="110" transform="rotate(20 385 500)"/><ellipse class="l" cx="615" cy="500" rx="120" ry="110" transform="rotate(-20 615 500)"/><ellipse class="l" cx="500" cy="385" rx="45" ry="220"/><circle class="l" cx="500" cy="165" r="58"/><circle class="f" cx="480" cy="155" r="9"/><circle class="f" cx="520" cy="155" r="9"/><path class="m" d="M465 190c26 24 48 25 70 0M485 110c-42-55-82-55-112-15M515 110c42-55 82-55 112-15"/><circle class="m" cx="350" cy="300" r="45"/><circle class="m" cx="650" cy="300" r="45"/><circle class="m" cx="385" cy="500" r="35"/><circle class="m" cx="615" cy="500" r="35"/></g>`),
      robotcat_1: robotBase(`<path class="l" d="M385 490h230"/><circle class="m" cx="500" cy="495" r="32"/>`, stars()),
      robotcat_2: robotBase(`<path class="l" d="M385 490h230"/><circle class="l" cx="500" cy="505" r="42"/><path class="m" d="M460 505h80M500 463v84"/>`, `<g class="m"><circle cx="160" cy="165" r="30"/><circle cx="840" cy="150" r="26"/></g>`),
      robotcat_3: robotBase(`<path class="l" d="M330 545c-65 30-95 75-80 120 65-8 112-37 140-90M670 545c65 30 95 75 80 120-65-8-112-37-140-90"/><path class="m" d="M390 600c-45 12-72 38-80 75M610 600c45 12 72 38 80 75"/>`, stars()),
      robotcat_4: svgWrap(`${stars()}<g><circle class="l" cx="500" cy="255" r="128"/><path class="l" d="M400 188c-32-95-118-72-115 5 5 82 90 95 115 20M600 188c32-95 118-72 115 5-5 82-90 95-115 20"/><circle class="f" cx="455" cy="242" r="14"/><circle class="f" cx="545" cy="242" r="14"/><ellipse class="w" cx="500" cy="310" rx="42" ry="30"/><path class="m" d="M500 335c-42 34-88 30-118 0M500 335c42 34 88 30 118 0"/><path class="l" d="M390 400h220c55 0 90 35 90 90v115H300V490c0-55 35-90 90-90z"/><path class="l" d="M300 490h-80c-30 0-50 23-50 55v70M700 490h80c30 0 50 23 50 55v70"/><rect class="m" x="420" y="455" width="160" height="130" rx="28"/></g>`),
      robotcat_5: robotBase(`<path class="m" d="M300 560c130-115 270-115 400 0"/><path class="m" d="M328 585c110-90 235-90 344 0"/>`, `<g class="m"><path d="M140 160c120-110 235-110 350 0"/><path d="M510 160c120-110 235-110 350 0"/></g>`),
      robotcat_6: robotBase(`<path class="l" d="M500 445l26 54 60 8-43 42 10 60-53-28-53 28 10-60-43-42 60-8z"/>`, stars()),
      robotcat_7: robotBase(`<ellipse class="l" cx="500" cy="620" rx="250" ry="55"/><circle class="m" cx="390" cy="618" r="18"/><circle class="m" cx="500" cy="628" r="22"/><circle class="m" cx="610" cy="618" r="18"/>`, `<g class="m"><path d="M150 150c70-50 125-50 180 0M680 130c70-50 125-50 180 0"/></g>`),
      robotcat_8: robotBase(`<path class="l" d="M675 485l115-115M790 370l38 38-115 115-55 17z"/><path class="m" d="M300 540h170M300 580h150"/>`, `<g class="m"><circle cx="140" cy="135" r="32"/><path d="M125 135h30M140 120v30"/></g>`),
      robotcat_9: robotBase(`<circle class="l" cx="500" cy="495" r="62"/><circle class="m" cx="500" cy="495" r="26"/><circle class="s" cx="472" cy="472" r="5"/><circle class="s" cx="528" cy="512" r="5"/><circle class="s" cx="530" cy="470" r="5"/>`, `<g class="m"><circle cx="180" cy="155" r="42"/><circle cx="180" cy="155" r="16"/><circle cx="825" cy="145" r="36"/><circle cx="825" cy="145" r="14"/></g>`),
      robotcat_10: robotBase(`<path class="m" d="M210 630c170-45 395-45 580 0"/><circle class="m" cx="810" cy="555" r="40"/><path class="m" d="M810 485v-55M810 680v-55M740 555h-55M935 555h-55"/>`, `<g class="m"><path d="M140 555c60-90 95-100 125-35 35-75 90-80 110-5"/><circle cx="820" cy="150" r="44"/><path d="M820 85v-45M820 260v-45M755 150h-45M930 150h-45"/></g>`)
    };
    return map[id] || map.cat_princess;
  }

  function drawSVGToLine(svgText){
    clearPaint(); clearLine();
    const img = new Image();
    const blob = new Blob([svgText], {type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height);
      const scale = Math.min(lineCanvas.width/1000, lineCanvas.height/700) * 0.98;
      const iw = 1000 * scale, ih = 700 * scale;
      const x = (lineCanvas.width - iw)/2;
      const y = (lineCanvas.height - ih)/2;
      lctx.drawImage(img, x, y, iw, ih);
      URL.revokeObjectURL(url);
      saveClean(); resetHistory(); autosave();
    };
    img.src = url;
  }

  function drawSample(id){
    drawSVGToLine(art(id));
    const s = samples.find(x=>x.id===id);
    msg("Đã chọn mẫu: " + (s ? s.name : id));
  }

  function capturePaint(){ return paintCanvas.toDataURL("image/png"); }
  function captureLine(){ return lineCanvas.toDataURL("image/png"); }
  function blankPaintURL(){
    const tmp = document.createElement("canvas");
    tmp.width = paintCanvas.width; tmp.height = paintCanvas.height;
    const t = tmp.getContext("2d");
    t.fillStyle = "#fff"; t.fillRect(0,0,tmp.width,tmp.height);
    return tmp.toDataURL("image/png");
  }
  function saveClean(){ cleanPaint = capturePaint(); cleanLine = captureLine(); }
  function resetHistory(){ undoStack = [capturePaint()]; redoStack = []; }
  function pushHistory(clearRedo = true){
    const snap = capturePaint();
    if(undoStack[undoStack.length - 1] !== snap) {
      undoStack.push(snap);
      if(undoStack.length > HISTORY_LIMIT) undoStack.shift();
    }
    if(clearRedo) redoStack = [];
  }
  function restorePaint(url, done){
    const img = new Image();
    img.onload=()=>{ clearPaint(); pctx.drawImage(img,0,0,paintCanvas.width,paintCanvas.height); if(done) done(); };
    img.src=url;
  }
  function restoreLine(url, done){
    const img = new Image();
    img.onload=()=>{ clearLine(); lctx.drawImage(img,0,0,lineCanvas.width,lineCanvas.height); if(done) done(); };
    img.src=url;
  }
  function autosave(){
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        paint: capturePaint(),
        line: captureLine(),
        sample: currentSample,
        category: currentCategory,
        savedAt: Date.now()
      }));
    } catch(e) {}
  }
  function clearAutosave(){
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch(e) {}
  }
  function restoreAutosave(showMessage = false){
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "null"); } catch(e) {}
    if(!saved || !saved.paint || !saved.line) return false;
    if(saved.sample) currentSample = saved.sample;
    if(saved.category) currentCategory = saved.category;
    catChips.forEach(c=>c.classList.toggle("active", c.dataset.category === currentCategory));
    setupSamples();
    restoreLine(saved.line, () => { cleanLine = captureLine(); });
    restorePaint(saved.paint, () => {
      cleanPaint = blankPaintURL();
      resetHistory();
      if(showMessage) msg("Đã khôi phục tranh trước đó ✨");
    });
    return true;
  }

  function getPos(e){
    const r = paintCanvas.getBoundingClientRect();
    return { x: (e.clientX-r.left)*(paintCanvas.width/r.width), y: (e.clientY-r.top)*(paintCanvas.height/r.height) };
  }

  function drawDot(p){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1);
    pctx.save(); pctx.lineCap = "round"; pctx.lineJoin = "round";
    if(tool === "eraser") { pctx.globalCompositeOperation = "source-over"; pctx.fillStyle="#fff"; pctx.beginPath(); pctx.arc(p.x,p.y,size/2,0,Math.PI*2); pctx.fill(); }
    else if(tool === "marker") {
      pctx.fillStyle=currentColor;
      pctx.globalAlpha=.7; pctx.beginPath(); pctx.arc(p.x,p.y,size*.28,0,Math.PI*2); pctx.fill();
      pctx.globalAlpha=.9; pctx.beginPath(); pctx.arc(p.x,p.y,size*.16,0,Math.PI*2); pctx.fill();
    }
    else if(tool === "crayon") {
      const w = Math.max(2, size*.45);
      pctx.fillStyle=currentColor;
      pctx.globalAlpha=.42;
      pctx.beginPath(); pctx.arc(p.x,p.y,w*.45,0,Math.PI*2); pctx.fill();
      pctx.globalAlpha=.26;
      for(let i=0;i<7;i++){
        const jitter = (Math.random()-.5) * w * 1.2;
        pctx.beginPath();
        pctx.arc(p.x+jitter,p.y+(Math.random()-.5)*w*1.2,Math.max(1,w*.12*Math.random()),0,Math.PI*2);
        pctx.fill();
      }
    }
    else if(tool === "glitter") { pctx.fillStyle=currentColor; pctx.beginPath(); pctx.arc(p.x,p.y,size*.33,0,Math.PI*2); pctx.fill(); pctx.fillStyle="#fff"; for(let i=0;i<3;i++){pctx.fillRect(p.x+(Math.random()-.5)*size,p.y+(Math.random()-.5)*size,Math.max(2,size*.07),Math.max(2,size*.07));} popSparkle(p.x,p.y,"✨"); }
    else { pctx.fillStyle=currentColor; pctx.beginPath(); pctx.arc(p.x,p.y,size/2,0,Math.PI*2); pctx.fill(); }
    pctx.restore();
  }

  function drawStroke(p){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1);
    pctx.save(); pctx.lineCap="round"; pctx.lineJoin="round";
    if(tool === "eraser") { pctx.strokeStyle="#ffffff"; pctx.globalAlpha=1; pctx.lineWidth=size*1.15; }
    else if(tool === "marker") {
      pctx.strokeStyle=currentColor;
      pctx.globalAlpha=.68; pctx.lineWidth=Math.max(2,size*.55);
      pctx.beginPath(); pctx.moveTo(last.x,last.y); pctx.lineTo(p.x,p.y); pctx.stroke();
      pctx.globalAlpha=.86; pctx.lineWidth=Math.max(1.5,size*.32);
      pctx.beginPath(); pctx.moveTo(last.x,last.y); pctx.lineTo(p.x,p.y); pctx.stroke();
      pctx.restore(); last=p; return;
    }
    else if(tool === "crayon") {
      const w = Math.max(2,size*.45);
      const dpr = window.devicePixelRatio || 1;
      const jitter = 2.5 * dpr;
      const dist = Math.hypot(p.x-last.x,p.y-last.y);
      pctx.strokeStyle=currentColor;
      pctx.globalAlpha=.58; pctx.lineWidth=w; pctx.beginPath(); pctx.moveTo(last.x,last.y); pctx.lineTo(p.x,p.y); pctx.stroke();
      for(let i=0;i<3;i++){
        pctx.globalAlpha=.22 + Math.random()*.16;
        pctx.lineWidth=Math.max(1,w*(.18 + Math.random()*.28));
        pctx.beginPath();
        pctx.moveTo(last.x+(Math.random()-.5)*jitter,last.y+(Math.random()-.5)*jitter);
        pctx.lineTo(p.x+(Math.random()-.5)*jitter,p.y+(Math.random()-.5)*jitter);
        pctx.stroke();
      }
      const grains = Math.min(8, Math.max(2, Math.ceil(dist / Math.max(6,w))));
      pctx.fillStyle=currentColor; pctx.globalAlpha=.2;
      for(let i=0;i<grains;i++){
        const t = Math.random();
        pctx.beginPath();
        pctx.arc(last.x+(p.x-last.x)*t+(Math.random()-.5)*jitter,last.y+(p.y-last.y)*t+(Math.random()-.5)*jitter,Math.max(1,w*.12*Math.random()),0,Math.PI*2);
        pctx.fill();
      }
      pctx.restore(); last=p; return;
    }
    else if(tool === "glitter") { pctx.strokeStyle=currentColor; pctx.globalAlpha=.85; pctx.lineWidth=size*.68; popSparkle(p.x,p.y,"✨"); }
    else { pctx.strokeStyle=currentColor; pctx.globalAlpha=.95; pctx.lineWidth=size; }
    pctx.beginPath(); pctx.moveTo(last.x,last.y); pctx.lineTo(p.x,p.y); pctx.stroke(); pctx.restore(); last=p;
  }

  function drawSticker(p){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1) * 1.45;
    pctx.save();
    pctx.font = `${Math.max(18, size)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    pctx.textAlign = "center";
    pctx.textBaseline = "middle";
    pctx.fillText(selectedSticker, p.x, p.y);
    pctx.restore();
    popSparkle(p.x,p.y,"✨");
  }

  function placeSticker(p){
    pushHistory();
    drawSticker(p);
    pushHistory();
    autosave();
    beep("sparkle");
    msg("Đã dán sticker");
  }

  function start(e){
    e.preventDefault();
    last=getPos(e);
    if(tool === "sticker") { placeSticker(last); return; }
    drawing=true;
    pushHistory();
    drawDot(last);
    beep("tap");
  }
  function move(e){ if(!drawing) return; e.preventDefault(); drawStroke(getPos(e)); }
  function end(e){
    if(!drawing) return;
    if(e) e.preventDefault();
    drawing=false;
    pushHistory();
    autosave();
  }

  paintCanvas.addEventListener("pointerdown", start, {passive:false});
  paintCanvas.addEventListener("pointermove", move, {passive:false});
  window.addEventListener("pointerup", end, {passive:false});
  window.addEventListener("pointercancel", end, {passive:false});

  function updateToolButtons(){ Object.entries(toolButtons).forEach(([k,b]) => b && b.classList.toggle("active", tool===k)); }
  Object.entries(toolButtons).forEach(([k,b]) => b.onclick = () => {
    tool=k; updateToolButtons(); beep("tap");
    msg(k === "marker" ? "Đã chọn bút lông" : k === "crayon" ? "Đã chọn sáp màu" : k === "glitter" ? "Đã chọn kim tuyến" : k === "eraser" ? "Đã chọn gôm" : k === "sticker" ? "Đã chọn sticker" : "Đã chọn cọ");
  });
  stickerChoices.forEach(b => b.onclick = () => {
    selectedSticker = b.dataset.sticker;
    stickerChoices.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    tool = "sticker";
    updateToolButtons();
    beep("tap");
    msg("Chạm vào tranh để dán sticker");
  });

  undoBtn.onclick=()=>{
    if(undoStack.length<2) return;
    redoStack.push(undoStack.pop());
    restorePaint(undoStack[undoStack.length-1], autosave);
    beep("tap");
  };
  redoBtn.onclick=()=>{
    if(!redoStack.length) return;
    const snap = redoStack.pop();
    undoStack.push(snap);
    restorePaint(snap, autosave);
    beep("tap");
  };
  resetBtn.onclick=()=>{
    if(!cleanPaint) return;
    pushHistory();
    restorePaint(cleanPaint, () => { pushHistory(); clearAutosave(); });
    beep("tap"); msg("Đã xóa màu, giữ lại nét vẽ");
  };

  function createLineArt(){
    if(!originalImage){ msg("Hãy upload ảnh trước"); return; }
    clearPaint(); clearLine();
    const w=lineCanvas.width,h=lineCanvas.height;
    const tmp=document.createElement("canvas"); tmp.width=w; tmp.height=h;
    const t=tmp.getContext("2d",{willReadFrequently:true});
    t.fillStyle="#fff"; t.fillRect(0,0,w,h);
    const scale=Math.min(w/originalImage.width,h/originalImage.height);
    const iw=originalImage.width*scale, ih=originalImage.height*scale;
    t.drawImage(originalImage,(w-iw)/2,(h-ih)/2,iw,ih);
    const srcImg=t.getImageData(0,0,w,h); const src=srcImg.data; const out=t.createImageData(w,h); const dst=out.data; const threshold=72;
    function gray(x,y){ const i=(y*w+x)*4; return src[i]*.299+src[i+1]*.587+src[i+2]*.114; }
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
      const gx=-gray(x-1,y-1)-2*gray(x-1,y)-gray(x-1,y+1)+gray(x+1,y-1)+2*gray(x+1,y)+gray(x+1,y+1);
      const gy=-gray(x-1,y-1)-2*gray(x,y-1)-gray(x+1,y-1)+gray(x-1,y+1)+2*gray(x,y+1)+gray(x+1,y+1);
      const edge=Math.sqrt(gx*gx+gy*gy); const v=edge>threshold?15:255; const i=(y*w+x)*4;
      dst[i]=dst[i+1]=dst[i+2]=v; dst[i+3]=v===255?0:255;
    }
    lctx.putImageData(out,0,0); saveClean(); resetHistory(); autosave(); msg("Đã tạo nét chì từ ảnh upload."); beep("sparkle");
  }

  imageInput.onchange=(e)=>{ const file=e.target.files && e.target.files[0]; if(!file) return; const img=new Image(); img.onload=()=>{originalImage=img;createLineArt();}; img.src=URL.createObjectURL(file); };
  lineBtn.onclick=createLineArt;

  function saveImage(){
    const out=document.createElement("canvas"); out.width=paintCanvas.width; out.height=paintCanvas.height;
    const o=out.getContext("2d"); o.fillStyle="#fff"; o.fillRect(0,0,out.width,out.height); o.drawImage(paintCanvas,0,0); o.drawImage(lineCanvas,0,0);
    const a=document.createElement("a"); a.download="vinh-paint-artwork.png"; a.href=out.toDataURL("image/png"); a.click(); msg("Đã lưu ảnh PNG"); beep("success");
  }
  saveBtn.onclick=saveImage; partySaveBtn.onclick=saveImage; completeBtn.onclick=celebrate; completeBtn2.onclick=celebrate; partyCloseBtn.onclick=()=>celebration.classList.add("hidden");

  window.addEventListener("resize",()=>{clearTimeout(window.__r); window.__r=setTimeout(resize,220);});

  setupPalette(); setupSamples(); resize(); updateToolButtons();
});

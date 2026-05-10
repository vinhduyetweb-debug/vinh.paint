document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("canvasBox");
  const paintCanvas = document.getElementById("paintCanvas");
  const lineCanvas = document.getElementById("lineCanvas");
  const pctx = paintCanvas.getContext("2d", { willReadFrequently: true });
  const lctx = lineCanvas.getContext("2d", { willReadFrequently: true });

  const palette = document.getElementById("palette");
  const sampleStrip = document.getElementById("sampleStrip");
  const imageInput = document.getElementById("imageInput");
  const lineBtn = document.getElementById("lineBtn");
  const saveBtn = document.getElementById("saveBtn");
  const brushBtn = document.getElementById("brushBtn");
  const markerBtn = document.getElementById("markerBtn");
  const crayonBtn = document.getElementById("crayonBtn");
  const glitterBtn = document.getElementById("glitterBtn");
  const eraserBtn = document.getElementById("eraserBtn");
  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const completeBtn = document.getElementById("completeBtn");
  const completeBtn2 = document.getElementById("completeBtn2");
  const sizeRange = document.getElementById("sizeRange");
  const toast = document.getElementById("toast");
  const sparkleLayer = document.getElementById("sparkleLayer");
  const celebration = document.getElementById("celebration");
  const partyCloseBtn = document.getElementById("partyCloseBtn");
  const partySaveBtn = document.getElementById("partySaveBtn");
  const slogan = document.getElementById("slogan");

  let currentColor = "#ff3b30";
  let tool = "brush";
  let drawing = false;
  let last = { x: 0, y: 0 };
  let originalImage = null;
  let cleanPaint = null;
  let cleanLine = null;
  let undoStack = [];
  let currentSample = "cat";
  let lastSparkle = 0;

  const slogans = [
    "Tô một chút, vui cả ngày ✨",
    "Biến mọi bức ảnh thành tranh tô màu.",
    "Sân chơi màu sắc cho họa sĩ nhí."
  ];
  let sloganIndex = 0;
  setInterval(() => {
    sloganIndex = (sloganIndex + 1) % slogans.length;
    slogan.textContent = slogans[sloganIndex];
  }, 3600);

  const colors = ["#ff3b30","#ff9500","#ffcc00","#34c759","#8FF3D4","#007aff","#5856d6","#af52de","#FF6B9A","#8e5a2a","#111111","#ffffff"];
  const samples = [
    ["cat","🐱 Mèo"],["dog","🐶 Chó"],["rabbit","🐰 Thỏ"],["fish","🐟 Cá"],["bird","🐦 Chim"],
    ["butterfly","🦋 Bướm"],["elephant","🐘 Voi"],["lion","🦁 Sư tử"],["turtle","🐢 Rùa"],["bear","🐻 Gấu"]
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
    if(now - lastSparkle < 70) return;
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
    for(let i=0;i<36;i++){
      const b = document.createElement("span");
      b.className = "confetti";
      b.textContent = bits[i % bits.length];
      b.style.left = Math.random()*100 + "vw";
      b.style.animationDelay = Math.random()*0.4 + "s";
      b.style.fontSize = (16 + Math.random()*14) + "px";
      document.body.appendChild(b);
      setTimeout(()=>b.remove(), 2200);
    }
  }

  function celebrate(){
    celebration.classList.remove("hidden");
    confetti(); beep("success");
    msg("Hoàn thành rồi! Bé tô đẹp quá 🎉");
  }

  function setupPalette(){
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
        beep("tap");
        msg("Đã chọn màu mới");
      };
      palette.appendChild(b);
    });
  }

  function setupSamples(){
    samples.forEach(([id,label])=>{
      const b=document.createElement("button");
      b.className="sampleBtn"+(id===currentSample?" active":"");
      b.textContent=label;
      b.type="button";
      b.onclick=()=>{
        currentSample=id;
        document.querySelectorAll(".sampleBtn").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        drawSample(id);
        beep("tap");
      };
      sampleStrip.appendChild(b);
    });
  }

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
    } else drawSample(currentSample);
  }

  function clearPaint(){ pctx.fillStyle="white"; pctx.fillRect(0,0,paintCanvas.width,paintCanvas.height); }
  function clearLine(){ lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height); }

  function lineSetup(){
    const s=Math.min(lineCanvas.width,lineCanvas.height);
    lctx.strokeStyle="#17110a";
    lctx.lineWidth=Math.max(6,s*0.0125);
    lctx.lineCap="round"; lctx.lineJoin="round";
  }
  function fineLine(){
    const s=Math.min(lineCanvas.width,lineCanvas.height);
    lctx.lineWidth=Math.max(3,s*0.006);
  }
  function mainLine(){ lineSetup(); }
  function arc(x,y,r,a=0,b=Math.PI*2){lctx.beginPath();lctx.arc(x,y,r,a,b);lctx.stroke();}
  function ellipse(x,y,rx,ry,rot=0){lctx.beginPath();lctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);lctx.stroke();}
  function line(...pts){lctx.beginPath();lctx.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)lctx.lineTo(pts[i],pts[i+1]);lctx.stroke();}
  function qline(x1,y1,cx,cy,x2,y2){lctx.beginPath();lctx.moveTo(x1,y1);lctx.quadraticCurveTo(cx,cy,x2,y2);lctx.stroke();}
  function smile(cx,cy,s){ arc(cx,cy,s*.04,0,Math.PI); line(cx,cy-s*.005,cx,cy+s*.025); }
  function eyes(cx,cy,s,dx=.055){ arc(cx-s*dx,cy,s*.015); arc(cx+s*dx,cy,s*.015); }

  function drawSample(id){
    clearPaint(); clearLine(); mainLine();
    const w=lineCanvas.width,h=lineCanvas.height,s=Math.min(w,h), cx=w*.5, cy=h*.50;

    if(id==="cat"){
      ellipse(cx,cy+s*.06,s*.21,s*.18); ellipse(cx,cy-s*.12,s*.16,s*.14);
      line(cx-s*.11,cy-s*.22,cx-s*.20,cy-s*.39,cx-s*.03,cy-s*.26);
      line(cx+s*.11,cy-s*.22,cx+s*.20,cy-s*.39,cx+s*.03,cy-s*.26);
      eyes(cx,cy-s*.14,s,.055); ellipse(cx,cy-s*.08,s*.025,s*.016); smile(cx,cy-s*.06,s);
      fineLine(); line(cx-s*.09,cy-s*.08,cx-s*.27,cy-s*.12); line(cx-s*.08,cy-s*.04,cx-s*.28,cy-s*.03); line(cx+s*.09,cy-s*.08,cx+s*.27,cy-s*.12); line(cx+s*.08,cy-s*.04,cx+s*.28,cy-s*.03);
      mainLine(); qline(cx+s*.17,cy+s*.11,cx+s*.33,cy+s*.02,cx+s*.25,cy-s*.12);
    } else if(id==="dog"){
      ellipse(cx,cy+s*.08,s*.23,s*.17); ellipse(cx,cy-s*.11,s*.17,s*.14);
      ellipse(cx-s*.17,cy-s*.12,s*.07,s*.17,-.35); ellipse(cx+s*.17,cy-s*.12,s*.07,s*.17,.35);
      eyes(cx,cy-s*.14,s,.055); ellipse(cx,cy-s*.085,s*.035,s*.022); arc(cx,cy-s*.045,s*.06,0,Math.PI);
      fineLine(); line(cx-s*.06,cy+s*.02,cx-s*.12,cy+s*.15); line(cx+s*.06,cy+s*.02,cx+s*.12,cy+s*.15); mainLine(); qline(cx+s*.18,cy+s*.03,cx+s*.33,cy-s*.08,cx+s*.27,cy-s*.20);
    } else if(id==="rabbit"){
      ellipse(cx,cy+s*.08,s*.21,s*.17); ellipse(cx,cy-s*.10,s*.15,s*.13);
      ellipse(cx-s*.075,cy-s*.35,s*.055,s*.22,-.1); ellipse(cx+s*.075,cy-s*.35,s*.055,s*.22,.1);
      fineLine(); ellipse(cx-s*.075,cy-s*.35,s*.027,s*.15,-.1); ellipse(cx+s*.075,cy-s*.35,s*.027,s*.15,.1); mainLine();
      eyes(cx,cy-s*.13,s,.052); ellipse(cx,cy-s*.07,s*.025,s*.018); smile(cx,cy-s*.045,s); arc(cx+s*.18,cy+s*.08,s*.055);
    } else if(id==="fish"){
      ellipse(cx-s*.05,cy,s*.24,s*.145); line(cx+s*.16,cy,cx+s*.36,cy-s*.14,cx+s*.35,cy+s*.14,cx+s*.16,cy);
      arc(cx-s*.16,cy-s*.035,s*.018); fineLine(); qline(cx-s*.01,cy-s*.13,cx+s*.05,cy-s*.28,cx+s*.13,cy-s*.09); qline(cx-s*.04,cy+s*.12,cx+s*.04,cy+s*.24,cx+s*.11,cy+s*.08); qline(cx-s*.22,cy-s*.01,cx-s*.15,cy+s*.05,cx-s*.21,cy+s*.08); mainLine();
    } else if(id==="bird"){
      ellipse(cx-s*.02,cy+s*.05,s*.20,s*.15); arc(cx+s*.13,cy-s*.11,s*.105); line(cx+s*.22,cy-s*.12,cx+s*.35,cy-s*.07,cx+s*.22,cy-s*.02);
      arc(cx+s*.16,cy-s*.14,s*.014); fineLine(); qline(cx-s*.12,cy+s*.03,cx-s*.02,cy-s*.09,cx+s*.08,cy+s*.03); mainLine(); line(cx-s*.05,cy+s*.18,cx-s*.09,cy+s*.30); line(cx+s*.03,cy+s*.18,cx+s*.07,cy+s*.30);
    } else if(id==="butterfly"){
      ellipse(cx-s*.13,cy-s*.08,s*.13,s*.18,-.2); ellipse(cx+s*.13,cy-s*.08,s*.13,s*.18,.2); ellipse(cx-s*.11,cy+s*.14,s*.105,s*.12,.25); ellipse(cx+s*.11,cy+s*.14,s*.105,s*.12,-.25);
      ellipse(cx,cy+s*.01,s*.035,s*.23); line(cx,cy-s*.20,cx-s*.10,cy-s*.32); line(cx,cy-s*.20,cx+s*.10,cy-s*.32);
      fineLine(); arc(cx-s*.13,cy-s*.08,s*.045); arc(cx+s*.13,cy-s*.08,s*.045); arc(cx-s*.11,cy+s*.14,s*.035); arc(cx+s*.11,cy+s*.14,s*.035); mainLine();
    } else if(id==="elephant"){
      ellipse(cx,cy+s*.06,s*.26,s*.18); ellipse(cx,cy-s*.09,s*.18,s*.14); ellipse(cx-s*.20,cy-s*.08,s*.10,s*.15,-.2); ellipse(cx+s*.20,cy-s*.08,s*.10,s*.15,.2);
      eyes(cx,cy-s*.12,s,.06); qline(cx,cy-s*.065,cx+s*.06,cy+s*.09,cx-s*.025,cy+s*.25); arc(cx-s*.025,cy+s*.25,s*.03,Math.PI*.15,Math.PI*1.35);
      fineLine(); line(cx-s*.12,cy+s*.18,cx-s*.13,cy+s*.30); line(cx+s*.12,cy+s*.18,cx+s*.13,cy+s*.30); mainLine();
    } else if(id==="lion"){
      for(let a=0;a<Math.PI*2;a+=Math.PI/10){ line(cx+Math.cos(a)*s*.19,cy+Math.sin(a)*s*.19,cx+Math.cos(a)*s*.285,cy+Math.sin(a)*s*.285); }
      arc(cx,cy,s*.22); arc(cx,cy,s*.15); eyes(cx,cy-s*.045,s,.052); ellipse(cx,cy+s*.015,s*.028,s*.02); arc(cx,cy+s*.05,s*.055,0,Math.PI);
      fineLine(); line(cx-s*.05,cy+s*.16,cx-s*.09,cy+s*.28); line(cx+s*.05,cy+s*.16,cx+s*.09,cy+s*.28); mainLine();
    } else if(id==="turtle"){
      ellipse(cx,cy,s*.25,s*.16); arc(cx+s*.27,cy-s*.02,s*.075); arc(cx+s*.30,cy-s*.045,s*.012);
      arc(cx-s*.21,cy+s*.10,s*.045); arc(cx-s*.04,cy+s*.13,s*.045); arc(cx+s*.12,cy+s*.12,s*.045);
      fineLine(); line(cx-s*.16,cy-s*.10,cx+s*.13,cy+s*.10); line(cx+s*.11,cy-s*.10,cx-s*.13,cy+s*.10); ellipse(cx,cy,s*.12,s*.08); mainLine();
    } else if(id==="bear"){
      ellipse(cx,cy+s*.08,s*.22,s*.17); arc(cx,cy-s*.11,s*.17); arc(cx-s*.13,cy-s*.25,s*.065); arc(cx+s*.13,cy-s*.25,s*.065);
      eyes(cx,cy-s*.14,s,.055); ellipse(cx,cy-s*.075,s*.06,s*.045); arc(cx,cy-s*.055,s*.035,0,Math.PI); fineLine(); arc(cx-s*.08,cy+s*.07,s*.035); arc(cx+s*.08,cy+s*.07,s*.035); mainLine();
    }
    saveClean(); undoStack = [paintCanvas.toDataURL("image/png")];
    msg("Đã chọn mẫu: " + samples.find(x=>x[0]===id)[1]);
  }

  function saveClean(){ cleanPaint = paintCanvas.toDataURL("image/png"); cleanLine = lineCanvas.toDataURL("image/png"); }
  function pushUndo(){ undoStack.push(paintCanvas.toDataURL("image/png")); if(undoStack.length > 36) undoStack.shift(); }
  function restorePaint(url){ const img = new Image(); img.onload=()=>{ clearPaint(); pctx.drawImage(img,0,0,paintCanvas.width,paintCanvas.height); }; img.src=url; }
  function getPos(e){ const r = paintCanvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*(paintCanvas.width/r.width), y:(e.clientY-r.top)*(paintCanvas.height/r.height)}; }

  function withComposite(fn){ pctx.save(); fn(); pctx.restore(); }
  function drawDot(p){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1);
    if(tool === "eraser") return withComposite(()=>{ pctx.globalCompositeOperation="source-over"; pctx.fillStyle="#fff"; pctx.beginPath(); pctx.arc(p.x,p.y,size/2,0,Math.PI*2); pctx.fill(); });
    if(tool === "marker") return markerStroke(p,p,true);
    if(tool === "crayon") return crayonStroke(p,p,true);
    if(tool === "glitter") return glitterStroke(p,p,true);
    withComposite(()=>{ pctx.globalAlpha=.92; pctx.fillStyle=currentColor; pctx.beginPath(); pctx.arc(p.x,p.y,size/2,0,Math.PI*2); pctx.fill(); });
  }
  function basicLine(a,b,color=currentColor,alpha=1,widthMul=1){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1) * widthMul;
    pctx.globalAlpha=alpha; pctx.lineCap="round"; pctx.lineJoin="round"; pctx.lineWidth=size; pctx.strokeStyle=color;
    pctx.beginPath(); pctx.moveTo(a.x,a.y); pctx.lineTo(b.x,b.y); pctx.stroke();
  }
  function markerStroke(a,b,dot=false){
    withComposite(()=>{
      basicLine(a,b,currentColor,.38,1.18);
      basicLine(a,b,currentColor,.42,.82);
      if(dot){pctx.fillStyle=currentColor;pctx.globalAlpha=.45;pctx.beginPath();pctx.arc(a.x,a.y,Number(sizeRange.value)*.55,0,Math.PI*2);pctx.fill();}
    });
  }
  function crayonStroke(a,b){
    const dpr = window.devicePixelRatio || 1; const size = Number(sizeRange.value)*dpr;
    withComposite(()=>{
      for(let i=0;i<7;i++){
        const ox=(Math.random()-.5)*size*.45, oy=(Math.random()-.5)*size*.45;
        basicLine({x:a.x+ox,y:a.y+oy},{x:b.x+ox,y:b.y+oy},currentColor,.18,.22+Math.random()*.18);
      }
    });
  }
  function glitterStroke(a,b){
    withComposite(()=>{ basicLine(a,b,currentColor,.68,.78); });
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1);
    for(let i=0;i<2;i++){
      const t=Math.random(); const x=a.x+(b.x-a.x)*t+(Math.random()-.5)*size; const y=a.y+(b.y-a.y)*t+(Math.random()-.5)*size;
      withComposite(()=>{ pctx.globalAlpha=.9; pctx.fillStyle=["#fff","#ffd700",currentColor][i%3]; pctx.beginPath(); pctx.arc(x,y,Math.max(2,size*.08),0,Math.PI*2); pctx.fill(); });
      popSparkle(x,y,"✨");
    }
  }
  function drawStroke(p){
    if(tool === "eraser") withComposite(()=>basicLine(last,p,"#ffffff",1,1));
    else if(tool === "marker") markerStroke(last,p);
    else if(tool === "crayon") crayonStroke(last,p);
    else if(tool === "glitter") glitterStroke(last,p);
    else withComposite(()=>basicLine(last,p,currentColor,.92,1));
    if(tool !== "eraser" && Math.random()>.86) popSparkle(p.x,p.y,"✨");
    last=p;
  }

  function start(e){ e.preventDefault(); drawing=true; last=getPos(e); pushUndo(); drawDot(last); beep("tap"); }
  function move(e){ if(!drawing) return; e.preventDefault(); drawStroke(getPos(e)); }
  function end(e){ if(!drawing) return; if(e) e.preventDefault(); drawing=false; }

  paintCanvas.addEventListener("pointerdown", start, {passive:false});
  paintCanvas.addEventListener("pointermove", move, {passive:false});
  window.addEventListener("pointerup", end, {passive:false});
  window.addEventListener("pointercancel", end, {passive:false});

  function setTool(t){ tool=t; updateToolButtons(); beep("tap"); msg(t==="marker"?"Đã chọn bút lông ✍️":t==="crayon"?"Đã chọn sáp màu 🖍️":t==="glitter"?"Đã chọn kim tuyến ✨":t==="eraser"?"Đã chọn gôm":"Đã chọn cọ"); }
  function updateToolButtons(){ document.querySelectorAll(".toolBtn[data-tool]").forEach(b=>b.classList.toggle("active", b.dataset.tool===tool)); }
  brushBtn.onclick=()=>setTool("brush"); markerBtn.onclick=()=>setTool("marker"); crayonBtn.onclick=()=>setTool("crayon"); glitterBtn.onclick=()=>setTool("glitter"); eraserBtn.onclick=()=>setTool("eraser");
  undoBtn.onclick=()=>{ if(undoStack.length<2) return; undoStack.pop(); restorePaint(undoStack[undoStack.length-1]); beep("tap"); };
  resetBtn.onclick=()=>{ if(cleanPaint) { restorePaint(cleanPaint); msg("Đã xóa màu, giữ lại nét tranh"); beep("tap"); } };

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
    const srcImg=t.getImageData(0,0,w,h); const src=srcImg.data; const out=t.createImageData(w,h); const dst=out.data; const threshold=68;
    function gray(x,y){ const i=(y*w+x)*4; return src[i]*.299+src[i+1]*.587+src[i+2]*.114; }
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
      const gx=-gray(x-1,y-1)-2*gray(x-1,y)-gray(x-1,y+1)+gray(x+1,y-1)+2*gray(x+1,y)+gray(x+1,y+1);
      const gy=-gray(x-1,y-1)-2*gray(x,y-1)-gray(x+1,y-1)+gray(x-1,y+1)+2*gray(x,y+1)+gray(x+1,y+1);
      const edge=Math.sqrt(gx*gx+gy*gy); const v=edge>threshold?18:255; const i=(y*w+x)*4;
      dst[i]=dst[i+1]=dst[i+2]=v; dst[i+3]=v===255?0:255;
    }
    lctx.putImageData(out,0,0); saveClean(); undoStack=[paintCanvas.toDataURL("image/png")]; msg("Đã biến ảnh thành tranh tô màu."); beep("sparkle");
  }

  imageInput.onchange=(e)=>{ const file=e.target.files && e.target.files[0]; if(!file) return; const img=new Image(); img.onload=()=>{originalImage=img;createLineArt();}; img.src=URL.createObjectURL(file); };
  lineBtn.onclick=createLineArt;

  function saveImage(){
    const out=document.createElement("canvas"); out.width=paintCanvas.width; out.height=paintCanvas.height;
    const o=out.getContext("2d"); o.fillStyle="#fff"; o.fillRect(0,0,out.width,out.height); o.drawImage(paintCanvas,0,0); o.drawImage(lineCanvas,0,0);
    o.save(); const fs=Math.max(22, out.width*.035); o.font=`900 ${fs}px system-ui`; o.fillStyle="rgba(91,55,0,.86)"; o.fillText("Bé Tô Màu ✨", fs, out.height-fs); o.restore();
    const a=document.createElement("a"); a.download="be-to-mau-hoa-si-nhi.png"; a.href=out.toDataURL("image/png"); a.click(); beep("success"); confetti(); msg("Đã lưu ảnh thành phẩm");
  }
  saveBtn.onclick=saveImage; partySaveBtn.onclick=saveImage; completeBtn.onclick=celebrate; completeBtn2.onclick=celebrate; partyCloseBtn.onclick=()=>celebration.classList.add("hidden"); celebration.addEventListener("click",e=>{if(e.target===celebration) celebration.classList.add("hidden");});

  window.addEventListener("resize",()=>{clearTimeout(window.__r); window.__r=setTimeout(resize,200);});
  setupPalette(); setupSamples(); resize(); updateToolButtons();
});

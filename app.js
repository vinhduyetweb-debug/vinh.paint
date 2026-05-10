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
  const eraserBtn = document.getElementById("eraserBtn");
  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sizeRange = document.getElementById("sizeRange");
  const toast = document.getElementById("toast");

  let currentColor = "#ff3b30";
  let tool = "brush";
  let drawing = false;
  let last = { x: 0, y: 0 };
  let originalImage = null;
  let cleanPaint = null;
  let cleanLine = null;
  let undoStack = [];
  let currentSample = "cat";

  const colors = ["#ff3b30","#ff9500","#ffcc00","#34c759","#00c7be","#007aff","#5856d6","#af52de","#ff2d55","#8e5a2a","#111111","#ffffff"];
  const samples = [
    ["cat","🐱 Mèo"],["dog","🐶 Chó"],["rabbit","🐰 Thỏ"],["fish","🐟 Cá"],["bird","🐦 Chim"],
    ["butterfly","🦋 Bướm"],["elephant","🐘 Voi"],["lion","🦁 Sư tử"],["turtle","🐢 Rùa"],["bear","🐻 Gấu"]
  ];

  function msg(t){ toast.textContent = t; }

  function setupPalette(){
    colors.forEach((c,i)=>{
      const b=document.createElement("button");
      b.className="colorDot"+(i===0?" active":"");
      b.style.background=c;
      b.type="button";
      b.onclick=()=>{
        currentColor=c;
        tool="brush";
        updateToolButtons();
        document.querySelectorAll(".colorDot").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
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

    clearPaint();
    clearLine();

    if (oldPaint && oldLine) {
      const ip = new Image();
      const il = new Image();
      ip.onload=()=>pctx.drawImage(ip,0,0,w,h);
      il.onload=()=>lctx.drawImage(il,0,0,w,h);
      ip.src=oldPaint;
      il.src=oldLine;
    } else {
      drawSample(currentSample);
    }
  }

  function clearPaint(){ pctx.fillStyle="white"; pctx.fillRect(0,0,paintCanvas.width,paintCanvas.height); }
  function clearLine(){ lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height); }

  function lineSetup(){
    const s=Math.min(lineCanvas.width,lineCanvas.height);
    lctx.strokeStyle="#111";
    lctx.lineWidth=Math.max(7,s*0.014);
    lctx.lineCap="round";
    lctx.lineJoin="round";
  }

  function drawSample(id){
    clearPaint(); clearLine(); lineSetup();
    const w=lineCanvas.width,h=lineCanvas.height,s=Math.min(w,h), cx=w*.5, cy=h*.48;
    const arc=(x,y,r,a,b)=>{lctx.beginPath();lctx.arc(x,y,r,a,b);lctx.stroke();};
    const ellipse=(x,y,rx,ry)=>{lctx.beginPath();lctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);lctx.stroke();};
    const line=(...pts)=>{lctx.beginPath();lctx.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)lctx.lineTo(pts[i],pts[i+1]);lctx.stroke();};

    if(id==="cat"){
      arc(cx,cy-s*.04,s*.18,0,Math.PI*2);
      line(cx-s*.12,cy-s*.16,cx-s*.22,cy-s*.34,cx-s*.03,cy-s*.21);
      line(cx+s*.12,cy-s*.16,cx+s*.22,cy-s*.34,cx+s*.03,cy-s*.21);
      arc(cx-s*.06,cy-s*.07,s*.018,0,Math.PI*2); arc(cx+s*.06,cy-s*.07,s*.018,0,Math.PI*2);
      arc(cx,cy+s*.02,s*.06,0,Math.PI); line(cx-s*.15,cy,cx-s*.32,cy-s*.04); line(cx+s*.15,cy,cx+s*.32,cy-s*.04);
    } else if(id==="dog"){
      ellipse(cx,cy,s*.20,s*.17); ellipse(cx-s*.18,cy-s*.03,s*.07,s*.14); ellipse(cx+s*.18,cy-s*.03,s*.07,s*.14);
      arc(cx-s*.07,cy-s*.04,s*.018,0,Math.PI*2); arc(cx+s*.07,cy-s*.04,s*.018,0,Math.PI*2);
      arc(cx,cy+s*.04,s*.07,0,Math.PI); ellipse(cx,cy+s*.01,s*.035,s*.025);
    } else if(id==="rabbit"){
      ellipse(cx,cy+s*.02,s*.18,s*.15); ellipse(cx-s*.08,cy-s*.25,s*.055,s*.20); ellipse(cx+s*.08,cy-s*.25,s*.055,s*.20);
      arc(cx-s*.06,cy-s*.04,s*.018,0,Math.PI*2); arc(cx+s*.06,cy-s*.04,s*.018,0,Math.PI*2);
      arc(cx,cy+s*.05,s*.055,0,Math.PI); line(cx,cy+s*.01,cx,cy+s*.05);
    } else if(id==="fish"){
      ellipse(cx-s*.03,cy,s*.22,s*.13); line(cx+s*.18,cy,cx+s*.35,cy-s*.13,cx+s*.35,cy+s*.13,cx+s*.18,cy);
      arc(cx-s*.12,cy-s*.03,s*.018,0,Math.PI*2); line(cx-s*.01,cy-s*.12,cx+s*.05,cy-s*.25,cx+s*.10,cy-s*.11);
    } else if(id==="bird"){
      ellipse(cx,cy,s*.17,s*.13); arc(cx+s*.13,cy-s*.12,s*.10,0,Math.PI*2);
      line(cx+s*.22,cy-s*.12,cx+s*.34,cy-s*.07,cx+s*.22,cy-s*.02);
      arc(cx+s*.16,cy-s*.14,s*.015,0,Math.PI*2); line(cx-s*.02,cy+s*.12,cx-s*.06,cy+s*.23); line(cx+s*.04,cy+s*.12,cx+s*.08,cy+s*.23);
    } else if(id==="butterfly"){
      ellipse(cx-s*.12,cy-s*.06,s*.12,s*.17); ellipse(cx+s*.12,cy-s*.06,s*.12,s*.17);
      ellipse(cx-s*.10,cy+s*.12,s*.10,s*.12); ellipse(cx+s*.10,cy+s*.12,s*.10,s*.12);
      ellipse(cx,cy,s*.035,s*.22); line(cx,cy-s*.19,cx-s*.09,cy-s*.30); line(cx,cy-s*.19,cx+s*.09,cy-s*.30);
    } else if(id==="elephant"){
      ellipse(cx,cy,s*.24,s*.17); arc(cx-s*.10,cy-s*.04,s*.018,0,Math.PI*2); arc(cx+s*.10,cy-s*.04,s*.018,0,Math.PI*2);
      lctx.beginPath(); lctx.moveTo(cx,cy); lctx.quadraticCurveTo(cx+s*.03,cy+s*.16,cx-s*.02,cy+s*.26); lctx.stroke();
      ellipse(cx-s*.23,cy-s*.01,s*.09,s*.13); ellipse(cx+s*.23,cy-s*.01,s*.09,s*.13);
    } else if(id==="lion"){
      arc(cx,cy,s*.21,0,Math.PI*2); arc(cx,cy,s*.14,0,Math.PI*2);
      arc(cx-s*.05,cy-s*.03,s*.015,0,Math.PI*2); arc(cx+s*.05,cy-s*.03,s*.015,0,Math.PI*2);
      arc(cx,cy+s*.04,s*.055,0,Math.PI); ellipse(cx,cy+s*.01,s*.025,s*.018);
      for(let a=0;a<Math.PI*2;a+=Math.PI/8){line(cx+Math.cos(a)*s*.21,cy+Math.sin(a)*s*.21,cx+Math.cos(a)*s*.28,cy+Math.sin(a)*s*.28);}
    } else if(id==="turtle"){
      ellipse(cx,cy,s*.23,s*.16); arc(cx+s*.25,cy-s*.02,s*.07,0,Math.PI*2);
      arc(cx+s*.28,cy-s*.04,s*.012,0,Math.PI*2);
      arc(cx-s*.17,cy+s*.13,s*.05,0,Math.PI*2); arc(cx+s*.03,cy+s*.14,s*.05,0,Math.PI*2);
      line(cx-s*.12,cy-s*.12,cx+s*.12,cy+s*.12); line(cx+s*.12,cy-s*.12,cx-s*.12,cy+s*.12);
    } else if(id==="bear"){
      arc(cx,cy,s*.18,0,Math.PI*2); arc(cx-s*.13,cy-s*.15,s*.07,0,Math.PI*2); arc(cx+s*.13,cy-s*.15,s*.07,0,Math.PI*2);
      arc(cx-s*.06,cy-s*.04,s*.016,0,Math.PI*2); arc(cx+s*.06,cy-s*.04,s*.016,0,Math.PI*2);
      ellipse(cx,cy+s*.04,s*.07,s*.055); arc(cx,cy+s*.06,s*.04,0,Math.PI);
    }

    saveClean();
    undoStack = [paintCanvas.toDataURL("image/png")];
    msg("Đã chọn mẫu: " + samples.find(x=>x[0]===id)[1]);
  }

  function saveClean(){
    cleanPaint = paintCanvas.toDataURL("image/png");
    cleanLine = lineCanvas.toDataURL("image/png");
  }

  function pushUndo(){
    undoStack.push(paintCanvas.toDataURL("image/png"));
    if(undoStack.length > 30) undoStack.shift();
  }

  function restorePaint(url){
    const img = new Image();
    img.onload=()=>{ clearPaint(); pctx.drawImage(img,0,0,paintCanvas.width,paintCanvas.height); };
    img.src=url;
  }

  function getPos(e){
    const r = paintCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (paintCanvas.width / r.width),
      y: (e.clientY - r.top) * (paintCanvas.height / r.height)
    };
  }

  function drawDot(p){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1);
    pctx.beginPath();
    pctx.arc(p.x,p.y,size/2,0,Math.PI*2);
    pctx.fillStyle = tool === "eraser" ? "#ffffff" : currentColor;
    pctx.fill();
  }

  function drawStroke(p){
    const size = Number(sizeRange.value) * (window.devicePixelRatio || 1);
    pctx.lineCap = "round";
    pctx.lineJoin = "round";
    pctx.lineWidth = size;
    pctx.strokeStyle = tool === "eraser" ? "#ffffff" : currentColor;
    pctx.beginPath();
    pctx.moveTo(last.x,last.y);
    pctx.lineTo(p.x,p.y);
    pctx.stroke();
    last=p;
  }

  function start(e){
    e.preventDefault();
    drawing=true;
    last=getPos(e);
    pushUndo();
    drawDot(last);
  }

  function move(e){
    if(!drawing) return;
    e.preventDefault();
    drawStroke(getPos(e));
  }

  function end(e){
    if(!drawing) return;
    if(e) e.preventDefault();
    drawing=false;
  }

  paintCanvas.addEventListener("pointerdown", start, {passive:false});
  paintCanvas.addEventListener("pointermove", move, {passive:false});
  window.addEventListener("pointerup", end, {passive:false});
  window.addEventListener("pointercancel", end, {passive:false});

  function updateToolButtons(){
    brushBtn.classList.toggle("active", tool==="brush");
    eraserBtn.classList.toggle("active", tool==="eraser");
  }

  brushBtn.onclick=()=>{tool="brush";updateToolButtons();};
  eraserBtn.onclick=()=>{tool="eraser";updateToolButtons();};

  undoBtn.onclick=()=>{
    if(undoStack.length<2) return;
    undoStack.pop();
    restorePaint(undoStack[undoStack.length-1]);
  };

  resetBtn.onclick=()=>{ if(cleanPaint) restorePaint(cleanPaint); };

  function createLineArt(){
    if(!originalImage){ msg("Hãy upload ảnh trước"); return; }
    clearPaint(); clearLine();

    const w=lineCanvas.width,h=lineCanvas.height;
    const tmp=document.createElement("canvas");
    tmp.width=w; tmp.height=h;
    const t=tmp.getContext("2d",{willReadFrequently:true});
    t.fillStyle="#fff"; t.fillRect(0,0,w,h);

    const scale=Math.min(w/originalImage.width,h/originalImage.height);
    const iw=originalImage.width*scale, ih=originalImage.height*scale;
    t.drawImage(originalImage,(w-iw)/2,(h-ih)/2,iw,ih);

    const srcImg=t.getImageData(0,0,w,h);
    const src=srcImg.data;
    const out=t.createImageData(w,h);
    const dst=out.data;
    const threshold=75;

    function gray(x,y){
      const i=(y*w+x)*4;
      return src[i]*.299+src[i+1]*.587+src[i+2]*.114;
    }

    for(let y=1;y<h-1;y++){
      for(let x=1;x<w-1;x++){
        const gx=-gray(x-1,y-1)-2*gray(x-1,y)-gray(x-1,y+1)+gray(x+1,y-1)+2*gray(x+1,y)+gray(x+1,y+1);
        const gy=-gray(x-1,y-1)-2*gray(x,y-1)-gray(x+1,y-1)+gray(x-1,y+1)+2*gray(x,y+1)+gray(x+1,y+1);
        const edge=Math.sqrt(gx*gx+gy*gy);
        const v=edge>threshold?15:255;
        const i=(y*w+x)*4;
        dst[i]=dst[i+1]=dst[i+2]=v;
        dst[i+3]=v===255?0:255;
      }
    }

    lctx.putImageData(out,0,0);
    saveClean();
    undoStack=[paintCanvas.toDataURL("image/png")];
    msg("Đã tạo nét chì.");
  }

  imageInput.onchange=(e)=>{
    const file=e.target.files && e.target.files[0];
    if(!file) return;
    const img=new Image();
    img.onload=()=>{originalImage=img;createLineArt();};
    img.src=URL.createObjectURL(file);
  };

  lineBtn.onclick=createLineArt;

  saveBtn.onclick=()=>{
    const out=document.createElement("canvas");
    out.width=paintCanvas.width;
    out.height=paintCanvas.height;
    const o=out.getContext("2d");
    o.fillStyle="#fff";
    o.fillRect(0,0,out.width,out.height);
    o.drawImage(paintCanvas,0,0);
    o.drawImage(lineCanvas,0,0);
    const a=document.createElement("a");
    a.download="be-to-mau.png";
    a.href=out.toDataURL("image/png");
    a.click();
  };

  window.addEventListener("resize",()=>{clearTimeout(window.__r); window.__r=setTimeout(resize,200);});

  setupPalette();
  setupSamples();
  resize();
  updateToolButtons();
});

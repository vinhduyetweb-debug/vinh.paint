document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("canvasBox");
  const paintCanvas = document.getElementById("paintCanvas");
  const lineCanvas = document.getElementById("lineCanvas");
  const pctx = paintCanvas.getContext("2d", { willReadFrequently: true });
  const lctx = lineCanvas.getContext("2d", { willReadFrequently: true });

  const palette = document.getElementById("palette");
  const imageInput = document.getElementById("imageInput");
  const sampleBtn = document.getElementById("sampleBtn");
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

  const colors = ["#ff3b30","#ff9500","#ffcc00","#34c759","#00c7be","#007aff","#5856d6","#af52de","#ff2d55","#8e5a2a","#111111","#ffffff"];

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
        msg("Đang dùng cọ màu");
      };
      palette.appendChild(b);
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

    pctx.fillStyle = "white";
    pctx.fillRect(0,0,w,h);

    if (oldPaint && oldLine) {
      const ip = new Image();
      const il = new Image();
      ip.onload=()=>pctx.drawImage(ip,0,0,w,h);
      il.onload=()=>lctx.drawImage(il,0,0,w,h);
      ip.src=oldPaint;
      il.src=oldLine;
    } else {
      drawSample();
    }
  }

  function clearPaint(){
    pctx.fillStyle="white";
    pctx.fillRect(0,0,paintCanvas.width,paintCanvas.height);
  }

  function clearLine(){
    lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height);
  }

  function drawSample(){
    clearPaint();
    clearLine();
    const w=lineCanvas.width,h=lineCanvas.height,s=Math.min(w,h);
    lctx.strokeStyle="#111";
    lctx.lineWidth=Math.max(7,s*0.014);
    lctx.lineCap="round";
    lctx.lineJoin="round";

    lctx.beginPath();
    lctx.arc(w*.5,h*.42,s*.18,0,Math.PI*2);
    lctx.stroke();

    lctx.beginPath();
    lctx.moveTo(w*.38,h*.34); lctx.lineTo(w*.30,h*.20); lctx.lineTo(w*.46,h*.29);
    lctx.moveTo(w*.62,h*.34); lctx.lineTo(w*.70,h*.20); lctx.lineTo(w*.54,h*.29);
    lctx.stroke();

    lctx.beginPath();
    lctx.arc(w*.43,h*.40,s*.018,0,Math.PI*2);
    lctx.arc(w*.57,h*.40,s*.018,0,Math.PI*2);
    lctx.stroke();

    lctx.beginPath();
    lctx.arc(w*.5,h*.49,s*.065,0,Math.PI);
    lctx.stroke();

    lctx.beginPath();
    lctx.moveTo(w*.35,h*.43); lctx.lineTo(w*.20,h*.38);
    lctx.moveTo(w*.35,h*.47); lctx.lineTo(w*.18,h*.47);
    lctx.moveTo(w*.65,h*.43); lctx.lineTo(w*.80,h*.38);
    lctx.moveTo(w*.65,h*.47); lctx.lineTo(w*.82,h*.47);
    lctx.stroke();

    saveClean();
    undoStack = [paintCanvas.toDataURL("image/png")];
    msg("Mẫu đã sẵn sàng. Kéo trên hình để tô.");
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
    img.onload=()=>{
      clearPaint();
      pctx.drawImage(img,0,0,paintCanvas.width,paintCanvas.height);
    };
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

  brushBtn.onclick=()=>{tool="brush";updateToolButtons();msg("Đang dùng cọ");};
  eraserBtn.onclick=()=>{tool="eraser";updateToolButtons();msg("Đang dùng gôm");};

  undoBtn.onclick=()=>{
    if(undoStack.length<2) return;
    undoStack.pop();
    restorePaint(undoStack[undoStack.length-1]);
  };

  resetBtn.onclick=()=>{
    if(cleanPaint) restorePaint(cleanPaint);
  };

  sampleBtn.onclick=drawSample;

  function createLineArt(){
    if(!originalImage){ msg("Hãy upload ảnh trước"); return; }
    clearPaint();
    clearLine();

    const w=lineCanvas.width,h=lineCanvas.height;
    const tmp=document.createElement("canvas");
    tmp.width=w; tmp.height=h;
    const t=tmp.getContext("2d",{willReadFrequently:true});
    t.fillStyle="#fff";
    t.fillRect(0,0,w,h);

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
    msg("Đã tạo nét chì. Kéo trên ảnh để tô.");
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

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }

  setupPalette();
  resize();
  updateToolButtons();
});

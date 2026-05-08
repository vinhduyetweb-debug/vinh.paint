const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const imageInput = document.getElementById("imageInput");
const palette = document.getElementById("palette");
const toastEl = document.getElementById("toast");

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const bucketBtn = document.getElementById("bucketBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");
const shareBtn = document.getElementById("shareBtn");
const lineBtn = document.getElementById("lineBtn");
const sampleBtn = document.getElementById("sampleBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const sizeRange = document.getElementById("sizeRange");
const edgeRange = document.getElementById("edgeRange");

let color = "#ff3b30";
let tool = "brush";
let isDrawing = false;
let last = { x: 0, y: 0 };
let baseImage = null;
let cleanLineState = null;
let undoStack = [];
let redoStack = [];

const colors = ["#ff3b30","#ff9500","#ffcc00","#34c759","#00c7be","#007aff","#5856d6","#af52de","#ff2d55","#8e5a2a","#000000","#ffffff","#f7b7d2","#b8e986","#7ed6ff","#f5e6ca"];

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove("show"), 1600);
}

function setupPalette() {
  colors.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "colorDot" + (i === 0 ? " active" : "");
    b.style.background = c;
    b.addEventListener("click", () => {
      color = c;
      setTool("brush");
      document.querySelectorAll(".colorDot").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    });
    palette.appendChild(b);
  });
}

function setTool(next) {
  tool = next;
  brushBtn.classList.toggle("active", tool === "brush");
  eraserBtn.classList.toggle("active", tool === "eraser");
  bucketBtn.classList.toggle("active", tool === "bucket");
}

function fitCanvas() {
  const current = canvas.width > 0 ? canvas.toDataURL("image/png") : null;
  const rect = canvas.parentElement.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, Math.floor(rect.width * ratio));
  canvas.height = Math.max(320, Math.floor(rect.height * ratio));

  if (current) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = current;
  } else {
    drawSample();
  }
}

function white() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSample() {
  white();
  const w = canvas.width, h = canvas.height, s = Math.min(w, h);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = Math.max(5, s * 0.012);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(w*.5, h*.42, s*.18, 0, Math.PI*2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w*.38,h*.34); ctx.lineTo(w*.30,h*.20); ctx.lineTo(w*.46,h*.29);
  ctx.moveTo(w*.62,h*.34); ctx.lineTo(w*.70,h*.20); ctx.lineTo(w*.54,h*.29);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w*.43,h*.40,s*.018,0,Math.PI*2);
  ctx.arc(w*.57,h*.40,s*.018,0,Math.PI*2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w*.5,h*.49,s*.065,0,Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w*.35,h*.43); ctx.lineTo(w*.20,h*.38);
  ctx.moveTo(w*.35,h*.47); ctx.lineTo(w*.18,h*.47);
  ctx.moveTo(w*.65,h*.43); ctx.lineTo(w*.80,h*.38);
  ctx.moveTo(w*.65,h*.47); ctx.lineTo(w*.82,h*.47);
  ctx.stroke();

  cleanLineState = canvas.toDataURL("image/png");
  undoStack = [cleanLineState];
  redoStack = [];
}

function pushUndo() {
  undoStack.push(canvas.toDataURL("image/png"));
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
}

function restore(src) {
  const img = new Image();
  img.onload = () => {
    white();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = src;
}

function getPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return {
    x: (p.clientX - rect.left) * (canvas.width / rect.width),
    y: (p.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function drawDot(p) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, (Number(sizeRange.value) * (window.devicePixelRatio || 1)) / 2, 0, Math.PI * 2);
  ctx.fillStyle = tool === "eraser" ? "#fff" : color;
  ctx.fill();
}

function drawStroke(p) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(sizeRange.value) * (window.devicePixelRatio || 1);
  ctx.strokeStyle = tool === "eraser" ? "#fff" : color;

  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
}

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16), 255];
}

function dist(data, i, c) {
  return Math.abs(data[i]-c[0]) + Math.abs(data[i+1]-c[1]) + Math.abs(data[i+2]-c[2]);
}

function bucketFill(x, y) {
  x = Math.floor(x); y = Math.floor(y);
  const w = canvas.width, h = canvas.height;
  if (x < 0 || y < 0 || x >= w || y >= h) return;

  const img = ctx.getImageData(0,0,w,h);
  const data = img.data;
  const start = (y*w+x)*4;
  const target = [data[start], data[start+1], data[start+2], 255];
  const fill = hexToRgb(color);
  const tolerance = 55;

  if (dist(data, start, fill) < 10) return;

  const stack = [[x,y]];
  const seen = new Uint8Array(w*h);

  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    const idx = cy*w + cx;
    if (seen[idx]) continue;
    seen[idx] = 1;

    const i = idx*4;
    const blackLine = data[i] < 80 && data[i+1] < 80 && data[i+2] < 80;
    if (blackLine) continue;
    if (dist(data, i, target) > tolerance) continue;

    data[i]=fill[0]; data[i+1]=fill[1]; data[i+2]=fill[2]; data[i+3]=255;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }

  ctx.putImageData(img,0,0);
}

function start(e) {
  e.preventDefault();
  const p = getPoint(e);

  if (tool === "bucket") {
    pushUndo();
    bucketFill(p.x, p.y);
    return;
  }

  isDrawing = true;
  last = p;
  pushUndo();
  drawDot(p);
}

function move(e) {
  if (!isDrawing) return;
  e.preventDefault();
  drawStroke(getPoint(e));
}

function end(e) {
  if (!isDrawing) return;
  e && e.preventDefault && e.preventDefault();
  isDrawing = false;
}

canvas.addEventListener("pointerdown", start, { passive:false });
canvas.addEventListener("pointermove", move, { passive:false });
window.addEventListener("pointerup", end, { passive:false });
window.addEventListener("pointercancel", end, { passive:false });

canvas.addEventListener("touchstart", start, { passive:false });
canvas.addEventListener("touchmove", move, { passive:false });
window.addEventListener("touchend", end, { passive:false });

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", move);
window.addEventListener("mouseup", end);

function makeLineArt() {
  if (!baseImage) {
    toast("Hãy upload ảnh trước.");
    return;
  }

  const w = canvas.width, h = canvas.height;
  const tmp = document.createElement("canvas");
  tmp.width = w; tmp.height = h;
  const t = tmp.getContext("2d", { willReadFrequently:true });

  t.fillStyle = "#fff";
  t.fillRect(0,0,w,h);

  const scale = Math.min(w/baseImage.width, h/baseImage.height);
  const iw = baseImage.width*scale, ih = baseImage.height*scale;
  t.drawImage(baseImage, (w-iw)/2, (h-ih)/2, iw, ih);

  const srcImg = t.getImageData(0,0,w,h);
  const src = srcImg.data;
  const out = t.createImageData(w,h);
  const dst = out.data;
  const th = Number(edgeRange.value);

  function gray(x,y) {
    const i = (y*w+x)*4;
    return src[i]*.299 + src[i+1]*.587 + src[i+2]*.114;
  }

  for (let y=1;y<h-1;y++) {
    for (let x=1;x<w-1;x++) {
      const gx = -gray(x-1,y-1)-2*gray(x-1,y)-gray(x-1,y+1)+gray(x+1,y-1)+2*gray(x+1,y)+gray(x+1,y+1);
      const gy = -gray(x-1,y-1)-2*gray(x,y-1)-gray(x+1,y-1)+gray(x-1,y+1)+2*gray(x,y+1)+gray(x+1,y+1);
      const edge = Math.sqrt(gx*gx + gy*gy);
      const v = edge > th ? 18 : 255;
      const i = (y*w+x)*4;
      dst[i]=dst[i+1]=dst[i+2]=v; dst[i+3]=255;
    }
  }

  ctx.putImageData(out,0,0);
  cleanLineState = canvas.toDataURL("image/png");
  undoStack = [cleanLineState];
  redoStack = [];
  toast("Đã tạo nét chì.");
}

imageInput.addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    baseImage = img;
    makeLineArt();
  };
  img.src = URL.createObjectURL(file);
});

brushBtn.onclick = () => setTool("brush");
eraserBtn.onclick = () => setTool("eraser");
bucketBtn.onclick = () => setTool("bucket");
sampleBtn.onclick = drawSample;
lineBtn.onclick = makeLineArt;

undoBtn.onclick = () => {
  if (undoStack.length <= 1) return;
  redoStack.push(canvas.toDataURL("image/png"));
  undoStack.pop();
  restore(undoStack[undoStack.length - 1]);
};

redoBtn.onclick = () => {
  if (!redoStack.length) return;
  const next = redoStack.pop();
  undoStack.push(next);
  restore(next);
};

resetBtn.onclick = () => {
  if (cleanLineState) restore(cleanLineState);
  else drawSample();
};

saveBtn.onclick = () => {
  const a = document.createElement("a");
  a.download = "be-to-mau-pro.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
};

shareBtn.onclick = async () => {
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], "be-to-mau-pro.png", { type:"image/png" });
    if (navigator.canShare && navigator.canShare({ files:[file] })) {
      await navigator.share({ files:[file], title:"Bé Tô Màu Pro" });
    } else {
      saveBtn.click();
    }
  } catch {
    saveBtn.click();
  }
};

edgeRange.onchange = makeLineArt;

fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
};

window.addEventListener("resize", () => {
  clearTimeout(window.__resizeTimer);
  window.__resizeTimer = setTimeout(fitCanvas, 200);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

setupPalette();
fitCanvas();
setTool("brush");
toast("Chạm vào tranh để tô màu.");

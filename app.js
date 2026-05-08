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
let drawing = false;
let last = { x: 0, y: 0 };
let baseImage = null;
let lineImage = null;
let undoStack = [];
let redoStack = [];

const colors = [
  "#ff3b30","#ff9500","#ffcc00","#34c759","#00c7be","#007aff",
  "#5856d6","#af52de","#ff2d55","#8e5a2a","#000000","#ffffff",
  "#f7b7d2","#b8e986","#7ed6ff","#f5e6ca"
];

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function resizeCanvas() {
  const old = canvas.toDataURL("image/png");
  const r = canvas.parentElement.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(300, Math.floor(r.width * ratio));
  canvas.height = Math.max(300, Math.floor(r.height * ratio));

  const img = new Image();
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.onerror = drawSample;
  img.src = old;
}

function whiteBackground() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSample() {
  whiteBackground();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 8 * (window.devicePixelRatio || 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const w = canvas.width, h = canvas.height, s = Math.min(w, h);

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

  lineImage = canvas.toDataURL("image/png");
  pushUndo();
  toast("Đã mở mẫu mèo.");
}

function pushUndo() {
  undoStack.push(canvas.toDataURL("image/png"));
  if (undoStack.length > 30) undoStack.shift();
  redoStack = [];
}

function restore(dataUrl) {
  const img = new Image();
  img.onload = () => {
    whiteBackground();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return {
    x: (p.clientX - r.left) * (canvas.width / r.width),
    y: (p.clientY - r.top) * (canvas.height / r.height)
  };
}

function setTool(next) {
  tool = next;
  brushBtn.classList.toggle("active", tool === "brush");
  eraserBtn.classList.toggle("active", tool === "eraser");
  bucketBtn.classList.toggle("active", tool === "bucket");
}

function drawLine(to) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(sizeRange.value) * (window.devicePixelRatio || 1);

  if (tool === "eraser") {
    ctx.strokeStyle = "#ffffff";
  } else {
    ctx.strokeStyle = color;
  }

  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  last = to;
}

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0,2),16),
    parseInt(v.slice(2,4),16),
    parseInt(v.slice(4,6),16),
    255
  ];
}

function colorDistance(data, i, target) {
  return Math.abs(data[i]-target[0]) + Math.abs(data[i+1]-target[1]) + Math.abs(data[i+2]-target[2]);
}

function floodFill(x, y) {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const w = canvas.width, h = canvas.height;
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return;

  const start = (y*w+x)*4;
  const target = [data[start], data[start+1], data[start+2], data[start+3]];
  const fill = hexToRgb(color);
  const tolerance = 42;

  if (colorDistance(data, start, fill) < 8) return;

  const stack = [[x,y]];
  const visited = new Uint8Array(w*h);
  let count = 0;
  const max = w*h;

  while (stack.length && count < max) {
    const [cx,cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    const idx = cy*w + cx;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const di = idx*4;
    const isBlackLine = data[di] < 70 && data[di+1] < 70 && data[di+2] < 70;
    if (isBlackLine) continue;
    if (colorDistance(data, di, target) > tolerance) continue;

    data[di] = fill[0]; data[di+1] = fill[1]; data[di+2] = fill[2]; data[di+3] = 255;
    count++;

    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }

  ctx.putImageData(img, 0, 0);
}

function makeLineArt() {
  if (!baseImage) {
    toast("Hãy upload ảnh trước.");
    return;
  }

  whiteBackground();

  const w = canvas.width, h = canvas.height;
  const temp = document.createElement("canvas");
  temp.width = w; temp.height = h;
  const t = temp.getContext("2d", { willReadFrequently: true });

  t.fillStyle = "#fff";
  t.fillRect(0, 0, w, h);

  const scale = Math.min(w / baseImage.width, h / baseImage.height);
  const iw = baseImage.width * scale;
  const ih = baseImage.height * scale;
  const ix = (w - iw) / 2;
  const iy = (h - ih) / 2;

  t.drawImage(baseImage, ix, iy, iw, ih);

  const srcImg = t.getImageData(0, 0, w, h);
  const src = srcImg.data;
  const out = t.createImageData(w, h);
  const dst = out.data;
  const threshold = Number(edgeRange.value);

  function gray(x, y) {
    const i = (y*w+x)*4;
    return src[i]*.299 + src[i+1]*.587 + src[i+2]*.114;
  }

  for (let y=1; y<h-1; y++) {
    for (let x=1; x<w-1; x++) {
      const gx = -gray(x-1,y-1)-2*gray(x-1,y)-gray(x-1,y+1)+gray(x+1,y-1)+2*gray(x+1,y)+gray(x+1,y+1);
      const gy = -gray(x-1,y-1)-2*gray(x,y-1)-gray(x+1,y-1)+gray(x-1,y+1)+2*gray(x,y+1)+gray(x+1,y+1);
      const edge = Math.sqrt(gx*gx + gy*gy);
      const v = edge > threshold ? 18 : 255;
      const i = (y*w+x)*4;
      dst[i]=dst[i+1]=dst[i+2]=v; dst[i+3]=255;
    }
  }

  ctx.putImageData(out, 0, 0);
  lineImage = canvas.toDataURL("image/png");
  pushUndo();
  toast("Đã tạo tranh nét chì.");
}

function setupPalette() {
  colors.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.className = "colorDot" + (i === 0 ? " active" : "");
    btn.style.background = c;
    btn.type = "button";
    btn.onclick = () => {
      color = c;
      document.querySelectorAll(".colorDot").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      setTool("brush");
    };
    palette.appendChild(btn);
  });
}

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  last = getPos(e);

  if (tool === "bucket") {
    pushUndo();
    floodFill(last.x, last.y);
    return;
  }

  drawing = true;
  pushUndo();
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  e.preventDefault();
  drawLine(getPos(e));
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointercancel", () => drawing = false);

canvas.addEventListener("touchstart", e => e.preventDefault(), { passive:false });
canvas.addEventListener("touchmove", e => e.preventDefault(), { passive:false });

brushBtn.onclick = () => setTool("brush");
eraserBtn.onclick = () => setTool("eraser");
bucketBtn.onclick = () => setTool("bucket");

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
  if (lineImage) restore(lineImage);
  else drawSample();
  pushUndo();
};

imageInput.onchange = e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    baseImage = img;
    makeLineArt();
  };
  img.src = URL.createObjectURL(file);
};

lineBtn.onclick = makeLineArt;
sampleBtn.onclick = drawSample;

saveBtn.onclick = () => {
  const a = document.createElement("a");
  a.download = "be-to-mau-pro.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
};

shareBtn.onclick = async () => {
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], "be-to-mau-pro.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Bé Tô Màu Pro" });
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
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(resizeCanvas, 150);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

setupPalette();
resizeCanvas();
drawSample();
setTool("brush");

const canvas=document.getElementById("paintCanvas");
const ctx=canvas.getContext("2d");
const imageInput=document.getElementById("imageInput");
const makeLineBtn=document.getElementById("makeLineBtn");
const saveBtn=document.getElementById("saveBtn");
const brushBtn=document.getElementById("brushBtn");
const eraserBtn=document.getElementById("eraserBtn");
const undoBtn=document.getElementById("undoBtn");
const resetBtn=document.getElementById("resetBtn");
const brushSize=document.getElementById("brushSize");
const edgePower=document.getElementById("edgePower");
const palette=document.getElementById("colorPalette");
const fullscreenBtn=document.getElementById("fullscreenBtn");

let color="#ff3b30",mode="brush",drawing=false,last=null,originalImage=null,history=[];
let lineLayer=document.createElement("canvas");
let colorLayer=document.createElement("canvas");
const colors=["#ff3b30","#ff9500","#ffcc00","#34c759","#00c7be","#007aff","#5856d6","#af52de","#ff2d55","#8e5a2a","#ffffff","#111111"];

function setupPalette(){colors.forEach((c,i)=>{const b=document.createElement("button");b.className="colorDot"+(i===0?" active":"");b.style.background=c;b.type="button";b.onclick=()=>{color=c;mode="brush";updateTools();document.querySelectorAll(".colorDot").forEach(x=>x.classList.remove("active"));b.classList.add("active")};palette.appendChild(b)})}
function resizeCanvas(){const r=canvas.parentElement.getBoundingClientRect();const ratio=window.devicePixelRatio||1;canvas.width=Math.floor(r.width*ratio);canvas.height=Math.floor(r.height*ratio);lineLayer.width=colorLayer.width=canvas.width;lineLayer.height=colorLayer.height=canvas.height;drawStarter()}
function drawStarter(){const lctx=lineLayer.getContext("2d"),cctx=colorLayer.getContext("2d");lctx.clearRect(0,0,lineLayer.width,lineLayer.height);cctx.clearRect(0,0,colorLayer.width,colorLayer.height);lctx.fillStyle="#fff";lctx.fillRect(0,0,lineLayer.width,lineLayer.height);lctx.strokeStyle="#222";lctx.lineWidth=8*(window.devicePixelRatio||1);lctx.lineCap="round";lctx.lineJoin="round";const w=lineLayer.width,h=lineLayer.height,s=Math.min(w,h);lctx.beginPath();lctx.arc(w*.5,h*.42,s*.18,0,Math.PI*2);lctx.stroke();lctx.beginPath();lctx.moveTo(w*.38,h*.34);lctx.lineTo(w*.30,h*.20);lctx.lineTo(w*.46,h*.29);lctx.moveTo(w*.62,h*.34);lctx.lineTo(w*.70,h*.20);lctx.lineTo(w*.54,h*.29);lctx.stroke();lctx.beginPath();lctx.arc(w*.43,h*.40,s*.018,0,Math.PI*2);lctx.arc(w*.57,h*.40,s*.018,0,Math.PI*2);lctx.stroke();lctx.beginPath();lctx.arc(w*.5,h*.49,s*.07,0,Math.PI);lctx.stroke();composite();history=[];saveHistory()}
function composite(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(colorLayer,0,0);ctx.drawImage(lineLayer,0,0)}
function saveHistory(){history.push(colorLayer.toDataURL("image/png"));if(history.length>20)history.shift()}
function loadImage(file){const img=new Image();img.onload=()=>{originalImage=img;makeLineArt()};img.src=URL.createObjectURL(file)}
function makeLineArt(){if(!originalImage)return;const w=canvas.width,h=canvas.height,temp=document.createElement("canvas");temp.width=w;temp.height=h;const tctx=temp.getContext("2d");tctx.fillStyle="#fff";tctx.fillRect(0,0,w,h);const scale=Math.min(w/originalImage.width,h/originalImage.height),iw=originalImage.width*scale,ih=originalImage.height*scale,ix=(w-iw)/2,iy=(h-ih)/2;tctx.drawImage(originalImage,ix,iy,iw,ih);const img=tctx.getImageData(0,0,w,h),src=img.data,out=tctx.createImageData(w,h),dst=out.data,power=Number(edgePower.value);function g(x,y){const i=(y*w+x)*4;return src[i]*.299+src[i+1]*.587+src[i+2]*.114}for(let y=1;y<h-1;y++){for(let x=1;x<w-1;x++){const gx=-g(x-1,y-1)-2*g(x-1,y)-g(x-1,y+1)+g(x+1,y-1)+2*g(x+1,y)+g(x+1,y+1);const gy=-g(x-1,y-1)-2*g(x,y-1)-g(x+1,y-1)+g(x-1,y+1)+2*g(x,y+1)+g(x+1,y+1);const edge=Math.sqrt(gx*gx+gy*gy);const v=edge>power?25:255;const i=(y*w+x)*4;dst[i]=dst[i+1]=dst[i+2]=v;dst[i+3]=255}}colorLayer.getContext("2d").clearRect(0,0,w,h);lineLayer.getContext("2d").putImageData(out,0,0);composite();history=[];saveHistory()}
function pos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
function drawTo(p){const c=colorLayer.getContext("2d");c.lineCap="round";c.lineJoin="round";c.lineWidth=Number(brushSize.value)*(window.devicePixelRatio||1);if(mode==="eraser"){c.globalCompositeOperation="destination-out";c.strokeStyle="rgba(0,0,0,1)"}else{c.globalCompositeOperation="source-over";c.strokeStyle=color}c.beginPath();c.moveTo(last.x,last.y);c.lineTo(p.x,p.y);c.stroke();c.globalCompositeOperation="source-over";last=p;composite()}
function updateTools(){brushBtn.classList.toggle("active",mode==="brush");eraserBtn.classList.toggle("active",mode==="eraser")}
canvas.onpointerdown=e=>{e.preventDefault();drawing=true;last=pos(e);canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!drawing)return;e.preventDefault();drawTo(pos(e))};
canvas.onpointerup=()=>{if(!drawing)return;drawing=false;saveHistory()};
canvas.onpointercancel=()=>drawing=false;
imageInput.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)loadImage(f)};
makeLineBtn.onclick=makeLineArt;
brushBtn.onclick=()=>{mode="brush";updateTools()};
eraserBtn.onclick=()=>{mode="eraser";updateTools()};
undoBtn.onclick=()=>{if(history.length<=1)return;history.pop();const img=new Image();img.onload=()=>{const c=colorLayer.getContext("2d");c.clearRect(0,0,colorLayer.width,colorLayer.height);c.drawImage(img,0,0,colorLayer.width,colorLayer.height);composite()};img.src=history[history.length-1]};
resetBtn.onclick=()=>{colorLayer.getContext("2d").clearRect(0,0,colorLayer.width,colorLayer.height);composite();history=[];saveHistory()};
saveBtn.onclick=()=>{const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="tranh-to-mau.png";a.click()};
edgePower.onchange=makeLineArt;
fullscreenBtn.onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
window.onresize=resizeCanvas;
if("serviceWorker"in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
setupPalette();resizeCanvas();updateTools();

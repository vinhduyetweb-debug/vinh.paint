
let coins = parseInt(localStorage.getItem('coins') || 0);
let xp = parseInt(localStorage.getItem('xp') || 0);

updateUI();

function paint(color){

const animal = document.getElementById('animal');

animal.style.color = color;
animal.style.transform = 'scale(1.15)';

showConfetti();
playSound();

coins += 5;
xp += 1;

localStorage.setItem('coins', coins);
localStorage.setItem('xp', xp);

updateUI();

setTimeout(()=>{
animal.style.transform = 'scale(1)';
},300);

}

function changeAnimal(emoji){

document.getElementById('animal').innerText = emoji;

}

function showConfetti(){

const confetti = document.getElementById('confetti');

confetti.classList.remove('hidden');

setTimeout(()=>{
confetti.classList.add('hidden');
},1000);

}

function playSound(){

const audio = new Audio(
'https://actions.google.com/sounds/v1/cartoon/pop.ogg'
);

audio.play();

}

function unlockPack(){

if(coins >= 100){

coins -= 100;

alert('🎉 Rainbow Pack Unlocked!');

}else{

alert('🔒 Need 100 coins');

}

localStorage.setItem('coins', coins);

updateUI();

}

function saveArtwork(){

coins += 20;

localStorage.setItem('coins', coins);

updateUI();

alert('💾 Artwork Saved! +20 coins');

}

function updateUI(){

document.getElementById('coins').innerText = coins;
document.getElementById('xp').innerText = xp;

}

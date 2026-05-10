
let coins = parseInt(localStorage.getItem('coins') || 0);

updateCoins();

function paint(color){

const character =
document.getElementById('character');

character.style.color = color;

character.style.transform = 'scale(1.15)';

setTimeout(()=>{
character.style.transform = 'scale(1)';
},300);

showConfetti();

coins += 5;

localStorage.setItem('coins', coins);

updateCoins();

playRewardSound();

}

function showConfetti(){

const confetti =
document.getElementById('confetti');

confetti.classList.remove('hidden');

setTimeout(()=>{
confetti.classList.add('hidden');
},1000);

}

function unlockReward(){

if(coins >= 100){

coins -= 100;

alert('🌈 Rainbow Pack Unlocked!');

}else{

alert('🔒 Need 100 coins');

}

localStorage.setItem('coins', coins);

updateCoins();

}

function updateCoins(){

document.getElementById('coins').innerText = coins;

}

function playRewardSound(){

const audio = new Audio(
'https://actions.google.com/sounds/v1/cartoon/pop.ogg'
);

audio.play();

}

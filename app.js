const finishBtn = document.getElementById('finishBtn');
const celebration = document.getElementById('celebration');

finishBtn.addEventListener('click', () => {
  celebration.classList.remove('hidden');

  // celebration sound
  const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg');
  audio.play();
});

function closePopup(){
  celebration.classList.add('hidden');
}

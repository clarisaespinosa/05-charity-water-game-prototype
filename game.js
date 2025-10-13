// --- DOM Elements ---
const startScreen = document.getElementById('start-screen');
const characterScreen = document.getElementById('character-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const gameArea = document.getElementById('game-area');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const progressFill = document.getElementById('progress-fill');
const endMessage = document.getElementById('end-message');

// --- Game State ---
let environment = '';
let character = '';
let score = 0;
let timeLeft = 90;
let timerInterval = null;
let trashItems = [];
let trashPicked = null;
let characterPos = { left: 180, top: 220 }; // Start near bottom center
let cleanedCount = 0;
const totalTrash = 8; // Number of trash pieces per level

// --- Trash Types and Bins ---
const trashTypes = [
  { emoji: '🧃', type: 'recycle' },
  { emoji: '🍎', type: 'compost' },
  { emoji: '🪣', type: 'waste' },
  { emoji: '🥤', type: 'recycle' },
  { emoji: '🍌', type: 'compost' },
  { emoji: '🧻', type: 'waste' },
  { emoji: '🥫', type: 'recycle' },
  { emoji: '🍂', type: 'compost' }
];

// --- Characters ---
const characters = {
  beaver: { emoji: '🦫', ability: 'ground' },
  frog: { emoji: '🐸', ability: 'net' },
  bird: { emoji: '🐦', ability: 'fly' },
  fish: { emoji: '🐟', ability: 'dive' }
};

// --- Environment Backgrounds ---
const envBackgrounds = {
  forest: '#c8e6c9',
  pond: '#b3e5fc',
  ocean: '#81d4fa'
};

// --- Start Screen: Environment Selection ---
document.querySelectorAll('.env-btn').forEach(btn => {
  btn.onclick = () => {
    environment = btn.dataset.env;
    startScreen.style.display = 'none';
    characterScreen.style.display = 'block';
  };
});

// --- Character Selection ---
document.querySelectorAll('.char-btn').forEach(btn => {
  btn.onclick = () => {
    character = btn.dataset.char;
    characterScreen.style.display = 'none';
    startGame();
  };
});

// --- Start Game ---
function startGame() {
  // Reset state
  score = 0;
  timeLeft = 90;
  cleanedCount = 0;
  trashPicked = null;
  characterPos = { left: 180, top: 220 };
  trashItems = [];
  gameArea.innerHTML = '';
  gameScreen.style.display = 'block';
  endScreen.style.display = 'none';
  // Set background
  gameArea.style.background = envBackgrounds[environment];

  // Add bins
  addBins();

  // Add trash
  for (let i = 0; i < totalTrash; i++) {
    addTrash(i);
  }

  // Add character
  addCharacter();

  // Update HUD
  updateScore();
  updateTimer();
  updateProgress();

  // Start timer
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

// --- Add Bins ---
function addBins() {
  // Remove old bins if any
  document.querySelectorAll('.bin').forEach(bin => bin.remove());
  // Add bins to game area
  const bins = [
    { id: 'recycle-bin', label: '♻️', type: 'recycle' },
    { id: 'compost-bin', label: '🌱', type: 'compost' },
    { id: 'waste-bin', label: '🗑️', type: 'waste' }
  ];
  bins.forEach((bin, i) => {
    const binDiv = document.createElement('div');
    binDiv.id = bin.id;
    binDiv.className = 'bin';
    binDiv.style.left = i === 2 ? '' : `${30 + i * 140}px`;
    binDiv.style.right = i === 2 ? '30px' : '';
    binDiv.innerText = bin.label;
    binDiv.dataset.type = bin.type;
    gameArea.appendChild(binDiv);
  });
}

// --- Add Trash ---
function addTrash(i) {
  const trash = trashTypes[i];
  const trashDiv = document.createElement('div');
  trashDiv.className = 'trash';
  trashDiv.innerText = trash.emoji;
  // Random position (not too close to bins)
  const left = Math.floor(Math.random() * 320) + 20;
  const top = Math.floor(Math.random() * 160) + 30;
  trashDiv.style.left = `${left}px`;
  trashDiv.style.top = `${top}px`;
  trashDiv.dataset.type = trash.type;
  trashDiv.dataset.index = i;
  // Click to pick up
  trashDiv.onclick = () => {
    // Only pick up if not already holding trash
    if (!trashPicked) {
      trashPicked = trashDiv;
      trashDiv.style.border = '2px solid #0288d1';
    }
  };
  gameArea.appendChild(trashDiv);
  trashItems.push(trashDiv);
}

// --- Add Character ---
function addCharacter() {
  // Remove old character if any
  const oldChar = document.querySelector('.character');
  if (oldChar) oldChar.remove();
  const charDiv = document.createElement('div');
  charDiv.className = 'character';
  charDiv.innerText = characters[character].emoji;
  charDiv.style.left = `${characterPos.left}px`;
  charDiv.style.top = `${characterPos.top}px`;
  gameArea.appendChild(charDiv);
}

// --- Move Character ---
function moveCharacter(dx, dy) {
  // Move character by dx, dy (pixels)
  characterPos.left = Math.max(0, Math.min(350, characterPos.left + dx));
  characterPos.top = Math.max(0, Math.min(250, characterPos.top + dy));
  addCharacter();
  // If holding trash, move it too
  if (trashPicked) {
    trashPicked.style.left = `${characterPos.left + 5}px`;
    trashPicked.style.top = `${characterPos.top + 5}px`;
  }
}

// --- Arrow Button Controls ---
document.getElementById('left-btn').onclick = () => moveCharacter(-30, 0);
document.getElementById('right-btn').onclick = () => moveCharacter(30, 0);
document.getElementById('up-btn').onclick = () => moveCharacter(0, -30);
document.getElementById('down-btn').onclick = () => moveCharacter(0, 30);

// --- Drag Trash to Bin ---
gameArea.addEventListener('click', function(e) {
  // If holding trash and clicked on a bin
  if (trashPicked && e.target.classList.contains('bin')) {
    const binType = e.target.dataset.type;
    const trashType = trashPicked.dataset.type;
    if (binType === trashType) {
      // Correct bin
      score += 10;
      cleanedCount++;
      // Remove trash from game area
      trashPicked.remove();
      trashPicked = null;
      updateScore();
      updateProgress();
      // Water gets clearer
      gameArea.style.background = lightenColor(envBackgrounds[environment], cleanedCount / totalTrash);
      // Check win
      if (cleanedCount === totalTrash) {
        endGame(true);
      }
    } else {
      // Wrong bin: lose 5 seconds
      timeLeft = Math.max(0, timeLeft - 5);
      updateTimer();
      // Visual feedback
      e.target.style.background = '#ef5350';
      setTimeout(() => {
        e.target.style.background = '';
      }, 500);
    }
  }
});

// --- Update Score ---
function updateScore() {
  scoreDisplay.innerText = `Score: ${score}`;
}

// --- Update Timer ---
function updateTimer() {
  timerDisplay.innerText = `Time: ${timeLeft}`;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    endGame(false);
  }
}

// --- Update Progress Bar ---
function updateProgress() {
  const percent = Math.floor((cleanedCount / totalTrash) * 100);
  progressFill.style.width = `${percent}%`;
}

// --- End Game ---
function endGame(won) {
  clearInterval(timerInterval);
  gameScreen.style.display = 'none';
  endScreen.style.display = 'block';
  if (won) {
    // Bonus points for time left
    score += timeLeft;
    endMessage.innerHTML = `🎉 You helped clean the water!<br>Animals cheer!<br><br>Score: ${score}<br><br>Real friends do this every day with charity: water.`;
    // Play sound (optional)
  } else {
    endMessage.innerHTML = `⏰ Time's up!<br>Your score: ${score}<br>Try again to clean all the water!`;
  }
}

// --- Retry Button ---
document.getElementById('retry-btn').onclick = () => {
  endScreen.style.display = 'none';
  startScreen.style.display = 'block';
};

// --- Utility: Lighten Color ---
function lightenColor(hex, percent) {
  // Simple color lighten for background feedback
  // hex: "#b3e5fc", percent: 0.5
  let num = parseInt(hex.replace('#',''),16),
      amt = Math.round(2.55 * percent * 60),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return `rgb(${Math.min(R,255)},${Math.min(G,255)},${Math.min(B,255)})`;
}

// --- Comments for Beginners ---
// - Use the arrow buttons to move your character.
// - Click on trash to pick it up, then click on the correct bin to sort it.
// - Each correct action gives you points and makes the water clearer!
// - Try to clean all the trash before time runs out!

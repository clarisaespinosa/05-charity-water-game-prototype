// --- Beginner-friendly Clean Water Game Logic ---

// Get references to screens and buttons
const startScreen = document.getElementById('start-screen');
const characterScreen = document.getElementById('character-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const progressFill = document.getElementById('progress-fill');
const retryBtn = document.getElementById('retry-btn');

// Store selected environment and character
let selectedEnv = '';
let selectedChar = '';
let score = 0;
let cleanedCount = 0;
let totalTrash = 8;
let timer = 90;
let timerInterval = null;
let round = 1; // Track the current round

// Character position
let charPos = { left: 180, top: 220 };
let characterDiv = null;

// Trash positions and elements
let trashDivs = [];

// Environment backgrounds for the game area (add .forest-bg, etc.)
const envClasses = {
  forest: 'forest-bg',
  pond: 'pond-bg',
  ocean: 'ocean-bg'
};

// Emoji for each character
const charEmojis = {
  beaver: '🦫',
  frog: '🐸',
  bird: '🐦',
  fish: '🐟'
};

// Trash types (emoji and type for possible future sorting)
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

// --- Environment Selection Buttons ---
document.querySelectorAll('.env-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEnv = btn.dataset.env;
    startScreen.style.display = 'none';
    characterScreen.style.display = 'block';
    // Set body background to a neutral color (game area will show real env)
    document.body.style.background = '#e0f7fa';
  };
});

// --- Character Selection Buttons ---
document.querySelectorAll('.char-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedChar = btn.dataset.char;
    characterScreen.style.display = 'none';
    startGame();
  };
});

// --- Start Game: Show animal and trash in environment ---
function startGame() {
  // Set round-specific timer and trash count
  if (round === 1) {
    timer = 90;
    totalTrash = 8;
  } else if (round === 2) {
    timer = 30;
    totalTrash = 14;
  } else if (round === 3) {
    timer = 15;
    totalTrash = 20;
  }

  score = score; // Keep cumulative score
  // Reset cleanedCount and trashDivs for each round
  cleanedCount = 0;
  trashDivs = [];
  charPos = { left: 180, top: 220 };
  updateScore();
  updateProgress();
  updateTimer();
  gameArea.innerHTML = '';
  gameScreen.style.display = 'block';
  endScreen.style.display = 'none';

  // Set the game area background class for real, colorful look
  gameArea.className = '';
  gameArea.classList.add(envClasses[selectedEnv]);

  // Show the selected character in the game area
  showSelectedCharacter();

  // Add trash to the game area
  addTrashItems();

  // Start the timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    updateTimer();
    if (timer <= 0) {
      clearInterval(timerInterval);
      // If not last round, go to next round, else end game
      if (round < 3) {
        round++;
        startGame();
      } else {
        endGame(false);
      }
    }
  }, 1000);
}

// --- Show Selected Character in Game Area ---
function showSelectedCharacter() {
  // Remove old character if any
  if (characterDiv) characterDiv.remove();
  characterDiv = document.createElement('div');
  characterDiv.className = 'character';
  characterDiv.style.left = `${charPos.left}px`;
  characterDiv.style.top = `${charPos.top}px`;
  characterDiv.innerText = charEmojis[selectedChar] || '';
  gameArea.appendChild(characterDiv);
}

// --- Add Trash Items to Game Area ---
function addTrashItems() {
  // Place trash in the "water" (bottom half of game area)
  // For pool, allow trash anywhere in the pool area
  let topMin = 100, topMax = 250;
  if (selectedEnv === "pond") { // "pond" is now "pool"
    topMin = 30;
    topMax = 250;
  }
  for (let i = 0; i < totalTrash; i++) {
    const trash = trashTypes[i % trashTypes.length];
    const trashDiv = document.createElement('div');
    trashDiv.className = 'trash';
    trashDiv.innerText = trash.emoji;
    // Random position in pool/water area
    let left = Math.floor(Math.random() * 340) + 20;
    let top = Math.floor(Math.random() * (topMax - topMin)) + topMin;
    trashDiv.style.left = `${left}px`;
    trashDiv.style.top = `${top}px`;
    trashDiv.dataset.left = left;
    trashDiv.dataset.top = top;
    gameArea.appendChild(trashDiv);
    trashDivs.push(trashDiv);
  }
}

// --- Move Character with Arrow Buttons ---
document.getElementById('left-btn').onclick = () => moveCharacter(-30, 0);
document.getElementById('right-btn').onclick = () => moveCharacter(30, 0);
document.getElementById('up-btn').onclick = () => moveCharacter(0, -30);
document.getElementById('down-btn').onclick = () => moveCharacter(0, 30);

// --- Move Character with Keyboard Arrow Keys ---
document.addEventListener('keydown', function(event) {
  // Only move if game screen is visible
  if (gameScreen.style.display === 'block') {
    if (event.key === 'ArrowLeft') {
      moveCharacter(-30, 0);
    } else if (event.key === 'ArrowRight') {
      moveCharacter(30, 0);
    } else if (event.key === 'ArrowUp') {
      moveCharacter(0, -30);
    } else if (event.key === 'ArrowDown') {
      moveCharacter(0, 30);
    }
  }
});

// --- Move Character and Check for Trash Pickup ---
function moveCharacter(dx, dy) {
  // Move character by dx, dy (pixels), keep inside game area
  charPos.left = Math.max(0, Math.min(350, charPos.left + dx));
  charPos.top = Math.max(0, Math.min(250, charPos.top + dy));
  showSelectedCharacter();
  checkTrashPickup();
}

// --- Check if Character Touches Trash ---
function checkTrashPickup() {
  for (let i = 0; i < trashDivs.length; i++) {
    const trashDiv = trashDivs[i];
    if (!trashDiv) continue;
    const trashLeft = parseInt(trashDiv.style.left);
    const trashTop = parseInt(trashDiv.style.top);
    // Simple collision: if character is close to trash
    if (
      Math.abs(charPos.left - trashLeft) < 30 &&
      Math.abs(charPos.top - trashTop) < 30
    ) {
      trashDiv.remove();
      trashDivs[i] = null;
      cleanedCount += 1;
      updateProgress();
      // If all trash is cleaned, go to next round or end game
      if (cleanedCount === totalTrash) {
        clearInterval(timerInterval);
        // Score: trash collected * time left (bonus for speed)
        score += cleanedCount * timer;
        updateScore();
        if (round < 3) {
          round++;
          setTimeout(startGame, 800); // Short pause before next round
        } else {
          endGame(true);
        }
      }
      break;
    }
  }
  // Update score live: each trash is worth 10 points
  score += 10;
  updateScore();
}

// --- Update Score Display ---
function updateScore() {
  scoreDisplay.innerText = `Score: ${score}`;
}

// --- Update Progress Bar ---
function updateProgress() {
  const percent = Math.floor((cleanedCount / totalTrash) * 100);
  progressFill.style.width = `${percent}%`;
}

// --- Update Timer Display ---
function updateTimer() {
  timerDisplay.innerText = `Time: ${timer}`;
}

// --- End Game: Show message and allow retry ---
function endGame(won) {
  gameScreen.style.display = 'none';
  endScreen.style.display = 'block';
  const endMessage = document.getElementById('end-message');
  if (won) {
    endMessage.innerHTML = `🎉 You helped clean the water in all rounds!<br>Final Score: ${score}<br><br>Real friends do this every day with charity: water.`;
  } else {
    endMessage.innerHTML = `⏰ Time's up!<br>Your score: ${score}<br>Try again to clean all the water!`;
  }
  round = 1; // Reset for next play
}

// --- Retry Button ---
retryBtn.onclick = () => {
  endScreen.style.display = 'none';
  startScreen.style.display = 'block';
  document.body.style.background = '#e0f7fa';
  round = 1;
  score = 0;
};

// --- Comments for Beginners ---
// 1. Click a location to start (Forest, Pond, or Ocean).
// 2. Then, pick your animal character.
// 3. The background changes to a real photo.
// 4. Use the arrow buttons to move your animal.
// 5. Move your animal to touch trash to pick it up and earn points!
// 6. When all trash is gone or time runs out, the game ends.

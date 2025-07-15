// Game configuration
const CARD_IMAGES = [
  'ClevelandBron1.png', 'ClevelandBron1.png',
  'HSbron.png', 'HSbron.png',
  'ClevelandBron2.png', 'ClevelandBron2.png',
  'LakerBron.png', 'LakerBron.png',
  'HeatBron.png', 'HeatBron.png',
  'GilasBron.png', 'GilasBron.png',
  'LebronQuiapo.png', 'LebronQuiapo.png',
  'LebronJeep.png', 'LebronJeep.png',
  'LeArner.png', 'LeArner.png',
  'LeSunshine.png', 'LeSunshine.png',
  'LeIGlive.png', 'LeIGlive.png',
  'LePodcast.png', 'LePodcast.png'
];

const CARD_BACK_IMAGE = 'LBJ LOGO.png';

// Game state
let gameState = {
  isPlaying: false,
  isPaused: false,
  difficulty: 12,
  timeLimit: 100,
  timeRemaining: 100,
  flips: 0,
  matchedCards: [],
  cardToCheck: null,
  timer: null,
  cards: [],
  isMuted: false
};

// Audio controller
const audio = {
  bgm: document.getElementById('bgm'),
  flip: document.getElementById('flip-sound'),
  match: document.getElementById('match-sound'),
  victory: document.getElementById('victory-sound'),
  gameOver: document.getElementById('game-over-sound'),
  
  play(sound) {
    if (!gameState.isMuted && this[sound]) {
      this[sound].currentTime = 0;
      this[sound].play().catch(() => {});
    }
  },
  
  stop(sound) {
    if (this[sound]) {
      this[sound].pause();
      this[sound].currentTime = 0;
    }
  }
};

// Best score management
const bestScore = {
  get() {
    const saved = localStorage.getItem('lebron-memory-best');
    return saved ? JSON.parse(saved) : {};
  },
  
  set(difficulty, flips) {
    const scores = this.get();
    const key = `diff-${difficulty}`;
    if (!scores[key] || flips < scores[key]) {
      scores[key] = flips;
      localStorage.setItem('lebron-memory-best', JSON.stringify(scores));
      return true; // New record
    }
    return false;
  },
  
  display() {
    const scores = this.get();
    const key = `diff-${gameState.difficulty}`;
    const best = scores[key];
    document.getElementById('best-score').textContent = 
      best ? `Best: ${best} flips` : 'Best: --';
  }
};

// Game functions
function createCards() {
  const container = document.querySelector('.game-container');
  const gameInfoContainer = container.querySelector('.game-info-container');
  
  // Clear existing cards
  container.querySelectorAll('.card').forEach(card => card.remove());
  
  // Calculate number of cards based on difficulty
  const numCards = 24 - gameState.difficulty;
  const cardImages = CARD_IMAGES.slice(0, numCards);
  
  cardImages.forEach((imageName, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-back card-face">
        <img class="card-back-img" src="Assets/Images/${CARD_BACK_IMAGE}" alt="Card back">
      </div>
      <div class="card-front card-face">
        <img class="card-value" src="Assets/Images/${imageName}" alt="LeBron card">
      </div>
    `;
    
    card.addEventListener('click', () => flipCard(card));
    container.appendChild(card);
  });
  
  gameState.cards = Array.from(container.querySelectorAll('.card'));
}

function shuffleCards() {
  const container = document.querySelector('.game-container');
  const cards = Array.from(container.querySelectorAll('.card'));
  
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    cards[i].style.order = j;
    cards[j].style.order = i;
  }
}

function startGame() {
  gameState.isPlaying = true;
  gameState.timeRemaining = gameState.timeLimit;
  gameState.flips = 0;
  gameState.matchedCards = [];
  gameState.cardToCheck = null;
  
  // Reset UI
  document.getElementById('time-remaining').textContent = gameState.timeRemaining;
  document.getElementById('flips').textContent = gameState.flips;
  
  // Reset cards
  gameState.cards.forEach(card => {
    card.classList.remove('visible', 'matched');
  });
  
  // Start timer
  gameState.timer = setInterval(() => {
    gameState.timeRemaining--;
    document.getElementById('time-remaining').textContent = gameState.timeRemaining;
    
    if (gameState.timeRemaining <= 0) {
      endGame(false);
    }
  }, 1000);
  
  shuffleCards();
  audio.play('bgm');
  bestScore.display();
}

function flipCard(card) {
  if (!gameState.isPlaying || 
      gameState.matchedCards.includes(card) || 
      card === gameState.cardToCheck ||
      card.classList.contains('visible')) {
    return;
  }
  
  audio.play('flip');
  gameState.flips++;
  document.getElementById('flips').textContent = gameState.flips;
  
  card.classList.add('visible');
  
  if (gameState.cardToCheck) {
    checkForMatch(card);
  } else {
    gameState.cardToCheck = card;
  }
}

function checkForMatch(card) {
  const isMatch = getCardImage(card) === getCardImage(gameState.cardToCheck);
  
  if (isMatch) {
    handleMatch(card, gameState.cardToCheck);
  } else {
    handleMismatch(card, gameState.cardToCheck);
  }
  
  gameState.cardToCheck = null;
}

function handleMatch(card1, card2) {
  gameState.matchedCards.push(card1, card2);
  card1.classList.add('matched');
  card2.classList.add('matched');
  
  audio.play('match');
  
  // Check for victory
  if (gameState.matchedCards.length === gameState.cards.length) {
    setTimeout(() => endGame(true), 500);
  }
}

function handleMismatch(card1, card2) {
  gameState.isPlaying = false;
  
  setTimeout(() => {
    card1.classList.remove('visible');
    card2.classList.remove('visible');
    gameState.isPlaying = true;
  }, 1000);
}

function getCardImage(card) {
  return card.querySelector('.card-value').src;
}

function endGame(victory) {
  gameState.isPlaying = false;
  clearInterval(gameState.timer);
  audio.stop('bgm');
  
  if (victory) {
    const isNewRecord = bestScore.set(gameState.difficulty, gameState.flips);
    showOverlay('victory-overlay');
    
    if (isNewRecord) {
      document.getElementById('new-record').classList.remove('hidden');
    }
    
    audio.play('victory');
  } else {
    showOverlay('game-over-overlay');
    audio.play('gameOver');
  }
  
  bestScore.display();
}

function showOverlay(overlayId) {
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.classList.add('hidden');
  });
  document.getElementById(overlayId).classList.remove('hidden');
}

function setDifficulty(difficulty, timeLimit) {
  gameState.difficulty = difficulty;
  gameState.timeLimit = timeLimit;
  localStorage.setItem('lebron-difficulty', difficulty);
  localStorage.setItem('lebron-time-limit', timeLimit);
  
  createCards();
  bestScore.display();
}

// Event listeners
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.remove('hidden');
});

document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target.classList.contains('settings-modal')) {
    document.getElementById('settings-modal').classList.add('hidden');
  }
});

document.getElementById('mute-btn').addEventListener('click', () => {
  gameState.isMuted = !gameState.isMuted;
  const btn = document.getElementById('mute-btn');
  btn.classList.toggle('muted');
  
  if (gameState.isMuted) {
    audio.stop('bgm');
  } else if (gameState.isPlaying) {
    audio.play('bgm');
  }
});

// Difficulty buttons
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const difficulty = parseInt(btn.dataset.difficulty);
    const timeLimit = parseInt(btn.dataset.time);
    setDifficulty(difficulty, timeLimit);
    document.getElementById('settings-modal').classList.add('hidden');
  });
});

// Overlay clicks
document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', () => {
    overlay.classList.add('hidden');
    document.getElementById('new-record').classList.add('hidden');
    startGame();
  });
});

// Initialize game
function init() {
  // Load saved settings
  const savedDifficulty = localStorage.getItem('lebron-difficulty');
  const savedTimeLimit = localStorage.getItem('lebron-time-limit');
  
  if (savedDifficulty && savedTimeLimit) {
    gameState.difficulty = parseInt(savedDifficulty);
    gameState.timeLimit = parseInt(savedTimeLimit);
  }
  
  createCards();
  bestScore.display();
}

// Start when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
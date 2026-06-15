// Game configuration - Using const for immutable data
const CONFIG = {
  CARD_IMAGES: [
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
    'LePodcast.png', 'LePodcast.png',
    'LeZapote.png', 'LeZapote.png',
    'LeMaid.png', 'LeMaid.png',
    'LeMeat.png', 'LeMeat.png',
    'LeFreaky.png', 'LeFreaky.png',
  ],
  CARD_BACK_IMAGE: 'LBJ LOGO.png',
  STORAGE_KEYS: {
    BEST_SCORES: 'lebron-memory-best',
    DIFFICULTY: 'lebron-difficulty',
    TIME_LIMIT: 'lebron-time-limit'
  },
  DELAYS: {
    CARD_FLIP_BACK: 750,
    VICTORY_DELAY: 500
  }
};

// Game state
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.isPlaying = false;
    this.isPaused = false;
    this.difficulty = 12;
    this.timeLimit = 100;
    this.timeRemaining = 100;
    this.flips = 0;
    this.matchedCards = [];
    this.cardToCheck = null;
    this.timer = null;
    this.cards = [];
    this.isMuted = false;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateUI();

      // Timer warning at 10 seconds
      const timeInfo = document.getElementById('time-info');
      if (this.timeRemaining <= 10 && this.timeRemaining > 0) {
        timeInfo?.classList.add('timer-warning');
        if (this.timeRemaining === 10) {
          gameController.audioController.play('timerWarn');
        }
      } else {
        timeInfo?.classList.remove('timer-warning');
      }
      
      if (this.timeRemaining <= 0) {
        timeInfo?.classList.remove('timer-warning');
        gameController.endGame(false);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateUI() {
    const timeElement = document.getElementById('time-remaining');
    const flipsElement = document.getElementById('flip-count');
    
    if (timeElement) timeElement.textContent = this.timeRemaining;
    if (flipsElement) flipsElement.textContent = this.flips;
  }

  updateProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar || !this.cards.length) return;
    const pct = (this.matchedCards.length / this.cards.length) * 100;
    bar.style.width = `${pct}%`;
  }

  incrementFlips() {
    this.flips++;
    this.updateUI();
  }

  addMatchedCards(card1, card2) {
    this.matchedCards.push(card1, card2);
    this.updateProgress();
  }

  isGameComplete() {
    return this.matchedCards.length === this.cards.length;
  }
}

// Audio controller
class AudioController {
  constructor() {
    this.sounds = {
      bgm: document.getElementById('bgm'),
      flip: document.getElementById('flip-sound'),
      match: document.getElementById('match-sound'),
      victory: document.getElementById('victory-sound'),
      gameOver: document.getElementById('game-over-sound'),
      timerWarn: document.getElementById('flip-sound') // reuse flip as urgent tick
    };
    this.volume = 1;
    this.slider = document.getElementById('volume-slider');
    this.initVolumeControl();
  }

  initVolumeControl() {
    // show/hide slider on mute button click
    const muteBtn = document.getElementById('sound-btn');
    muteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.slider.classList.toggle('hidden');
    });

    // hide slider if clicking outside
    document.addEventListener('click', (e) => {
      if (!this.slider.classList.contains('hidden') && !e.target.closest('.sound-control')) {
        this.slider.classList.add('hidden');
      }
    });

    // change volume for all sounds
    this.slider?.addEventListener('input', () => {
      this.setVolume(parseFloat(this.slider.value));
    });

    // initial volume
    this.setVolume(this.slider?.value || 1);
  }

  setVolume(value) {
    this.volume = value;
    Object.values(this.sounds).forEach(audio => {
      if (audio) audio.volume = value;
    });
  }

  async play(soundName) {
    const sound = this.sounds[soundName];
    if (!gameState.isMuted && sound) {
      try {
        sound.currentTime = 0;
        await sound.play();
      } catch (error) {
        console.warn(`Could not play sound: ${soundName}`, error);
      }
    }
  }

  stop(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

// Best score manager
class BestScoreManager {
  getScores() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.BEST_SCORES);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Could not retrieve best scores:', error);
      return {};
    }
  }

  setScore(difficulty, flips) {
    try {
      const scores = this.getScores();
      const key = `diff-${difficulty}`;
      const isNewRecord = !scores[key] || flips < scores[key];
      
      if (isNewRecord) {
        scores[key] = flips;
        localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_SCORES, JSON.stringify(scores));
      }
      
      return isNewRecord;
    } catch (error) {
      console.warn('Could not save best score:', error);
      return false;
    }
  }

  updateStartHint() {
    const scores = this.getScores();
    const key = `diff-${gameState.difficulty}`;
    const best = scores[key];
    const hint = document.getElementById('start-best-hint');
    if (hint) {
      hint.textContent = best ? `Your best on this difficulty: ${best} flips` : '';
    }
  }

  display() {
    const scores = this.getScores();
    const key = `diff-${gameState.difficulty}`;
    const best = scores[key];
    const bestScoreElement = document.getElementById('best-score');
    
    if (bestScoreElement) {
      bestScoreElement.textContent = best ? `Best: ${best} flips` : 'Best: --';
    }
  }

  displayAll() {
    const scores = this.getScores();
    const difficulties = [
      { label: 'LeEasy', value: 12 },
      { label: 'LeMedium', value: 8 },
      { label: 'LeHard', value: 4 },
      { label: 'LeExtreme', value: 0 }
    ];
    let html = '<div class="best-score-list-title">Best Flip Records</div><ul class="best-score-list">';
    difficulties.forEach(diff => {
      const key = `diff-${diff.value}`;
      const score = scores[key] ? `${scores[key]} flips` : '--';
      html += `<li>${diff.label}: <span>${score}</span></li>`;
    });
    html += '</ul>';

    let modal = document.getElementById('best-score-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'best-score-modal';
      modal.className = 'best-score-modal';
      modal.innerHTML = `<div class="best-score-modal-content">${html}<button id="close-best-score-modal">Close</button></div>`;
      document.body.appendChild(modal);
      document.getElementById('close-best-score-modal').onclick = () => {
        modal.classList.add('hidden');
      };
    } else {
      modal.querySelector('.best-score-modal-content').innerHTML = `${html}<button id="close-best-score-modal">Close</button>`;
      document.getElementById('close-best-score-modal').onclick = () => {
        modal.classList.add('hidden');
      };
    }
    modal.classList.remove('hidden');
  }
}

// Card manager for better separation of concerns
class CardManager {
  constructor() {
    this.container = document.querySelector('.card-container');
  }
 
  createCards() {
    // Clear existing cards
    this.container.querySelectorAll('.card').forEach(card => card.remove());

    let numCards, gridColumns;
    switch (gameState.difficulty) {
      case 12: numCards = 12; gridColumns = 4; break; // LeEasy:    4x3
      case 8:  numCards = 16; gridColumns = 4; break; // LeMedium:  4x4
      case 4:  numCards = 20; gridColumns = 5; break; // LeHard:    5x4
      case 0:  numCards = 24; gridColumns = 6; break; // LeExtreme: 6x4
      default: numCards = 12; gridColumns = 4;
    }

    // Expose column count as a CSS variable so card sizing is fully CSS-driven
    this.container.style.setProperty('--cols', gridColumns);
    this.container.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
    this.container.style.gridTemplateRows = '';

    const cardImages = CONFIG.CARD_IMAGES.slice(0, numCards);
    this.shuffleArray(cardImages);

    cardImages.forEach((imageName) => {
      const card = this.createCard(imageName);
      this.container.appendChild(card);
    });

    gameState.cards = Array.from(this.container.querySelectorAll('.card'));
  }

  // Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  createCard(imageName) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-back card-face">
        <img class="card-back-img" src="Assets/Images/${CONFIG.CARD_BACK_IMAGE}" alt="Card back">
      </div>
      <div class="card-front card-face">
        <img class="card-value" src="Assets/Images/${imageName}" alt="LeBron card">
      </div>
    `;
    
    card.addEventListener('click', () => gameController.flipCard(card));
    return card;
  }

  resetCards() {
    gameState.cards.forEach(card => {
      card.classList.remove('visible', 'matched');
    });
  }

  getCardImage(card) {
    const cardValue = card.querySelector('.card-value');
    return cardValue ? cardValue.src : null;
  }
}

// Main game controller
class GameController {
  constructor() {
    this.audioController = new AudioController();
    this.bestScoreManager = new BestScoreManager();
    this.cardManager = new CardManager();
    this.uiManager = new UIManager();
  }

  async startGame() {
    gameState.isPlaying = true;
    gameState.timeRemaining = gameState.timeLimit;
    gameState.flips = 0;
    gameState.matchedCards = [];
    gameState.cardToCheck = null;
    
    // Reset progress bar
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = '0%';

    // Remove any lingering timer warning
    document.getElementById('time-info')?.classList.remove('timer-warning');
    
    gameState.updateUI();
    this.cardManager.createCards();
    this.updateDifficultyBadge();
    gameState.startTimer();
    await this.audioController.play('bgm');
    this.bestScoreManager.display();
  }

  updateDifficultyBadge() {
    const labels = { 12: 'LeEasy', 8: 'LeMedium', 4: 'LeHard', 0: 'LeExtreme' };
    const badge = document.getElementById('difficulty-badge');
    if (badge) badge.textContent = labels[gameState.difficulty] || 'LeEasy';
  }

  flipCard(card) {
    if (!this.canFlipCard(card)) return;
    
    this.audioController.play('flip');
    gameState.incrementFlips();
    card.classList.add('visible');
    
    if (gameState.cardToCheck) {
      this.checkForMatch(card);
    } else {
      gameState.cardToCheck = card;
    }
  }

  canFlipCard(card) {
    return gameState.isPlaying && 
           !gameState.matchedCards.includes(card) && 
           card !== gameState.cardToCheck &&
           !card.classList.contains('visible');
  }

  checkForMatch(card) {
    const cardImage = this.cardManager.getCardImage(card);
    const checkCardImage = this.cardManager.getCardImage(gameState.cardToCheck);
    const isMatch = cardImage === checkCardImage;
    
    if (isMatch) {
      this.handleMatch(card, gameState.cardToCheck);
    } else {
      this.handleMismatch(card, gameState.cardToCheck);
    }
    
    gameState.cardToCheck = null;
  }

  async handleMatch(card1, card2) {
    gameState.addMatchedCards(card1, card2);
    card1.classList.add('matched');
    card2.classList.add('matched');
    
    await this.audioController.play('match');
    
    if (gameState.isGameComplete()) {
      setTimeout(() => this.endGame(true), CONFIG.DELAYS.VICTORY_DELAY);
    }
  }

  handleMismatch(card1, card2) {
    gameState.isPlaying = false;
    
    setTimeout(() => {
      card1.classList.remove('visible');
      card2.classList.remove('visible');
      gameState.isPlaying = true;
    }, CONFIG.DELAYS.CARD_FLIP_BACK);
  }

  async endGame(victory) {
    gameState.isPlaying = false;
    gameState.stopTimer();
    document.getElementById('time-info')?.classList.remove('timer-warning');
    this.audioController.stop('bgm');
    
    if (victory) {
      const isNewRecord = this.bestScoreManager.setScore(gameState.difficulty, gameState.flips);

      // Populate game summary
      const diffLabels = { 12: 'LeEasy', 8: 'LeMedium', 4: 'LeHard', 0: 'LeExtreme' };
      const sumFlips = document.getElementById('summary-flips');
      const sumTime  = document.getElementById('summary-time');
      const sumDiff  = document.getElementById('summary-difficulty');
      if (sumFlips) sumFlips.textContent = gameState.flips;
      if (sumTime)  sumTime.textContent  = `${gameState.timeRemaining}s`;
      if (sumDiff)  sumDiff.textContent  = diffLabels[gameState.difficulty] || '--';

      this.uiManager.showOverlay('victory-overlay');
      
      if (isNewRecord) {
        this.uiManager.showNewRecord();
      }

      // Confetti!
      this.launchConfetti();
      await this.audioController.play('victory');
    } else {
      this.uiManager.showOverlay('game-over-overlay');
      await this.audioController.play('gameOver');
    }
    
    this.bestScoreManager.display();
  }

  launchConfetti() {
    if (typeof confetti === 'undefined') return;
    const canvas = document.getElementById('confetti-canvas');
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
    const gold = '#FDBB30', navy = '#041E42', white = '#ffffff';

    myConfetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: [gold, navy, white] });
    setTimeout(() => myConfetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, colors: [gold, white] }), 400);
    setTimeout(() => myConfetti({ particleCount: 40, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: [gold, navy] }), 700);
    setTimeout(() => myConfetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: [gold, navy] }), 700);
  }

  setDifficulty(difficulty, timeLimit) {
    gameState.difficulty = difficulty;
    gameState.timeLimit = timeLimit;
    gameState.timeRemaining = timeLimit;
    gameState.flips = 0;
    gameState.matchedCards = [];
    
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DIFFICULTY, difficulty);
      localStorage.setItem(CONFIG.STORAGE_KEYS.TIME_LIMIT, timeLimit);
    } catch (error) {
      console.warn('Could not save difficulty settings:', error);
    }
    
    this.cardManager.createCards();
    this.cardManager.resetCards();
    this.bestScoreManager.display();
    this.bestScoreManager.updateStartHint();
    this.updateDifficultyBadge();
    gameState.updateUI();
  }

  loadSettings() {
    try {
      const savedDifficulty = localStorage.getItem(CONFIG.STORAGE_KEYS.DIFFICULTY);
      const savedTimeLimit = localStorage.getItem(CONFIG.STORAGE_KEYS.TIME_LIMIT);
      
      if (savedDifficulty && savedTimeLimit) {
        gameState.difficulty = parseInt(savedDifficulty);
        gameState.timeLimit = parseInt(savedTimeLimit);
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }
  }

  init() {
    this.loadSettings();
    this.cardManager.createCards();
    this.bestScoreManager.display();
    this.bestScoreManager.updateStartHint();
    this.updateDifficultyBadge();
    this.uiManager.init();
  }
}

// UI Manager for better organization
class UIManager {
  showOverlay(overlayId) {
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.classList.add('hidden');
      overlay.classList.remove('fading-in');
    });
    const el = document.getElementById(overlayId);
    if (el) {
      el.classList.remove('hidden');
      // Trigger reflow then animate
      void el.offsetWidth;
      el.classList.add('fading-in');
    }
  }

  hideOverlay(overlayId) {
    document.getElementById(overlayId)?.classList.add('hidden');
  }

  showNewRecord() {
    document.getElementById('new-record')?.classList.remove('hidden');
  }

  hideNewRecord() {
    document.getElementById('new-record')?.classList.add('hidden');
  }

  showSettings() {
    document.getElementById('settings-modal')?.classList.remove('hidden');
  }

  hideSettings() {
    document.getElementById('settings-modal')?.classList.add('hidden');
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettings();
    });

    // Difficulty badge also opens settings
    document.getElementById('difficulty-badge')?.addEventListener('click', () => {
      this.showSettings();
    });

    // Settings modal click outside to close
    document.getElementById('settings-modal')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('settings-modal')) {
        this.hideSettings();
      }
    });

    // Best Score button
    document.getElementById('best-score')?.addEventListener('click', () => {
      gameController.bestScoreManager.displayAll();
    });

    // Sound button
    document.getElementById('sound-btn')?.addEventListener('click', () => {
      gameController.audioController.toggleMute();
    });

    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const difficulty = parseInt(btn.dataset.difficulty);
        const timeLimit = parseInt(btn.dataset.time);
        gameController.setDifficulty(difficulty, timeLimit);
        this.hideSettings();
      });
    });

    // Dedicated New Game / Start buttons
    const startAction = (e) => {
      e.stopPropagation();
      this.hideOverlay('start-overlay');
      this.hideOverlay('victory-overlay');
      this.hideOverlay('game-over-overlay');
      this.hideNewRecord();
      gameController.startGame();
    };

    document.getElementById('start-btn')?.addEventListener('click', startAction);
    document.getElementById('victory-btn')?.addEventListener('click', startAction);
    document.getElementById('game-over-btn')?.addEventListener('click', startAction);

    // Click-anywhere fallback on overlays (for returning players)
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        // Don't trigger if they clicked the button (button handles it)
        if (e.target.classList.contains('new-game-btn')) return;
        this.hideOverlay(overlay.id);
        this.hideNewRecord();
        gameController.startGame();
      });
    });
  }
}

// Initialize game instances
const gameState = new GameState();
const gameController = new GameController();

// Initialize when DOM is ready
const initGame = () => {
  gameController.init();
};

// Use modern event listener approach
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
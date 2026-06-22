// Game configuration - Using const for immutable data
const CONFIG = {
  CARD_IMAGES: [
    'ClevelandBron1.png', 'ClevelandBron1.png',
    'HSbron.png',         'HSbron.png',
    'ClevelandBron2.png', 'ClevelandBron2.png',
    'LakerBron.png',      'LakerBron.png',
    'HeatBron.png',       'HeatBron.png',
    'GilasBron.png',      'GilasBron.png',
    'LebronQuiapo.png',   'LebronQuiapo.png',
    'LebronJeep.png',     'LebronJeep.png',
    'LeArner.png',        'LeArner.png',
    'LeSunshine.png',     'LeSunshine.png',
    'LeIGlive.png',       'LeIGlive.png',
    'LePodcast.png',      'LePodcast.png',
    'LeZapote.png',       'LeZapote.png',
    'LeMaid.png',         'LeMaid.png',
    'LeMeat.png',         'LeMeat.png',
    'LeFreaky.png',       'LeFreaky.png',
  ],
  CARD_BACK_IMAGE: 'LBJ LOGO.png',
  STORAGE_KEYS: {
    BEST_SCORES: 'lebron-memory-best',
    DIFFICULTY:  'lebron-difficulty',
    TIME_LIMIT:  'lebron-time-limit'
  },
  DELAYS: {
    CARD_FLIP_BACK: 750,
    VICTORY_DELAY:  500
  },
  DIFF_LABELS: { 12: 'LeEasy', 8: 'LeMedium', 4: 'LeHard', 0: 'LeExtreme' }
};

// Game state
class GameState {
  constructor() { this.reset(); }

  reset() {
    this.isPlaying     = false;
    this.isPaused      = false;
    this.difficulty    = 12;
    this.timeLimit     = 120;
    this.timeRemaining = 120;
    this.flips         = 0;
    this.matchedCards  = [];
    this.cardToCheck   = null;
    this.timer         = null;
    this.cards         = [];
    this.isMuted       = false;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateUI();

      // Timer warning at 10 seconds
      const timeInfo = document.getElementById('time-info');
      if (this.timeRemaining <= 10 && this.timeRemaining > 0) {
        timeInfo?.classList.add('timer-warning');
        if (this.timeRemaining === 10) gameController.audioController.play('timerWarn');
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
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  updateUI() {
    const t = document.getElementById('time-remaining');
    const f = document.getElementById('flip-count');
    if (t) t.textContent = this.timeRemaining;
    if (f) f.textContent = this.flips;
  }

  updateProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar || !this.cards.length) return;
    bar.style.width = `${(this.matchedCards.length / this.cards.length) * 100}%`;
  }

  incrementFlips() { this.flips++; this.updateUI(); }

  addMatchedCards(c1, c2) { this.matchedCards.push(c1, c2); this.updateProgress(); }

  isGameComplete() { return this.matchedCards.length === this.cards.length; }
}

// ─────────────────────────── AudioController ───────────────────────────
class AudioController {
  constructor() {
    this.sounds = {
      bgm:      document.getElementById('bgm'),
      flip:     document.getElementById('flip-sound'),
      match:    document.getElementById('match-sound'),
      victory:  document.getElementById('victory-sound'),
      gameOver: document.getElementById('game-over-sound'),
      timerWarn: document.getElementById('flip-sound')
    };
    this.volume  = 1;
    this.isMuted = false;
    this._initVolumeUI();
  }

  _initVolumeUI() {
    const slider  = document.getElementById('volume-slider');
    const iconBtn = document.getElementById('volume-icon-btn');
    const pctEl   = document.getElementById('volume-pct');

    if (!slider) return;

    // Slider input → update volume
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      this.isMuted = val === 0;
      this.volume  = val;
      this._applyVolume();
      this._updateIcon(iconBtn, pctEl, slider);
    });

    // Speaker icon → cycle: full → half → mute → full
    iconBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isMuted) {
        // Unmute: restore last non-zero volume (or 1 if none)
        const restore = this._lastVolume || 1;
        this.isMuted = false;
        this.volume  = restore;
        slider.value = restore;
      } else {
        // Mute
        if (this.volume > 0) this._lastVolume = this.volume;
        this.isMuted = true;
        this.volume  = 0;
        slider.value = 0;
      }
      this._applyVolume();
      this._updateIcon(iconBtn, pctEl, slider);
    });

    // Set initial state
    slider.value = this.volume;
    this._applyVolume();
    this._updateIcon(iconBtn, pctEl, slider);
  }

  _applyVolume() {
    const effective = this.isMuted ? 0 : this.volume;
    Object.values(this.sounds).forEach(a => { if (a) a.volume = effective; });
    gameState.isMuted = this.isMuted;
  }

  _updateIcon(btn, pctEl, slider) {
    if (!btn) return;
    const vol = this.isMuted ? 0 : this.volume;
    const pct = Math.round(vol * 100);

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (slider) slider.value = vol;

    // Update fill track colour via CSS custom property
    const fillPct = pct;
    slider.style.setProperty('--fill', `${fillPct}%`);

    // Icon emoji
    btn.classList.toggle('muted', this.isMuted || vol === 0);
    if (vol === 0 || this.isMuted)       btn.textContent = '🔇';
    else if (vol < 0.4)                  btn.textContent = '🔈';
    else if (vol < 0.75)                 btn.textContent = '🔉';
    else                                 btn.textContent = '🔊';
  }

  async play(name) {
    const s = this.sounds[name];
    if (s && !this.isMuted) {
      try { s.currentTime = 0; await s.play(); }
      catch (e) { console.warn(`Audio: ${name}`, e); }
    }
  }

  stop(name) {
    const s = this.sounds[name];
    if (s) { s.pause(); s.currentTime = 0; }
  }
}

// ─────────────────────────── BestScoreManager ───────────────────────────
class BestScoreManager {
  getScores() {
    try {
      const s = localStorage.getItem(CONFIG.STORAGE_KEYS.BEST_SCORES);
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  }

  setScore(difficulty, flips) {
    try {
      const scores = this.getScores();
      const key    = `diff-${difficulty}`;
      const isNew  = !scores[key] || flips < scores[key];
      if (isNew) {
        scores[key] = flips;
        localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_SCORES, JSON.stringify(scores));
      }
      return isNew;
    } catch { return false; }
  }

  updateStartHint() {
    const scores = this.getScores();
    const best   = scores[`diff-${gameState.difficulty}`];
    const el     = document.getElementById('start-best-hint');
    if (el) el.textContent = best ? `Your best: ${best} flips` : '';
  }

  display() {
    const best = this.getScores()[`diff-${gameState.difficulty}`];
    const el   = document.getElementById('best-score');
    if (el) el.textContent = best ? `Best: ${best} flips` : 'Best: --';
  }

  displayAll() {
    const scores = this.getScores();
    const diffs  = [
      { label: 'LeEasy',   value: 12 },
      { label: 'LeMedium', value: 8  },
      { label: 'LeHard',   value: 4  },
      { label: 'LeExtreme',value: 0  }
    ];
    let html = '<div class="best-score-list-title">Best Flip Records</div><ul class="best-score-list">';
    diffs.forEach(d => {
      const s = scores[`diff-${d.value}`];
      html += `<li>${d.label}: <span>${s ? s + ' flips' : '--'}</span></li>`;
    });
    html += '</ul>';

    const modal = document.getElementById('best-score-modal');
    if (!modal) return;
    modal.querySelector('.best-score-modal-content').innerHTML =
      `${html}<button id="close-best-score-modal"
        class="mt-2 px-6 py-2.5 bg-[#FDBB30] text-[#041E42] border-0
               rounded-lg text-[1em] cursor-pointer font-bold tracking-widest
               transition-transform duration-150 hover:scale-105 active:scale-95
               [font-family:NBACavaliers,serif]">Close</button>`;
    document.getElementById('close-best-score-modal').onclick = () => modal.classList.add('hidden');
    modal.classList.remove('hidden');
  }
}

// ─────────────────────────── CardManager ───────────────────────────
class CardManager {
  constructor() {
    this.container = document.querySelector('.card-container');
  }

  createCards() {
    this.container.querySelectorAll('.card').forEach(c => c.remove());

    let numCards, cols;
    switch (gameState.difficulty) {
      case 12: numCards = 12; cols = 4; break;
      case 8:  numCards = 16; cols = 4; break;
      case 4:  numCards = 20; cols = 5; break;
      case 0:  numCards = 24; cols = 6; break;
      default: numCards = 12; cols = 4;
    }

    this.container.style.setProperty('--cols', cols);
    this.container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.container.style.gridTemplateRows    = '';

    const images = CONFIG.CARD_IMAGES.slice(0, numCards);
    this._shuffle(images);
    images.forEach(img => this.container.appendChild(this._makeCard(img)));
    gameState.cards = Array.from(this.container.querySelectorAll('.card'));
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  _makeCard(imgName) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-back card-face">
        <img class="card-back-img" src="Assets/Images/${CONFIG.CARD_BACK_IMAGE}" alt="Card back">
      </div>
      <div class="card-front card-face">
        <img class="card-value" src="Assets/Images/${imgName}" alt="LeBron card">
      </div>`;
    card.addEventListener('click', () => gameController.flipCard(card));
    return card;
  }

  resetCards() {
    gameState.cards.forEach(c => c.classList.remove('visible', 'matched'));
  }

  getCardImage(card) {
    return card.querySelector('.card-value')?.src ?? null;
  }
}

// ─────────────────────────── GameController ───────────────────────────
class GameController {
  constructor() {
    this.audioController  = new AudioController();
    this.bestScoreManager = new BestScoreManager();
    this.cardManager      = new CardManager();
    this.uiManager        = new UIManager();
  }

  async startGame() {
    gameState.isPlaying     = true;
    gameState.timeRemaining = gameState.timeLimit;
    gameState.flips         = 0;
    gameState.matchedCards  = [];
    gameState.cardToCheck   = null;

    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = '0%';
    document.getElementById('time-info')?.classList.remove('timer-warning');

    gameState.updateUI();
    this.cardManager.createCards();
    this.syncDifficultyUI();
    gameState.startTimer();
    await this.audioController.play('bgm');
    this.bestScoreManager.display();
  }

  // Single source of truth for all difficulty-related UI updates
  syncDifficultyUI() {
    const label = CONFIG.DIFF_LABELS[gameState.difficulty] ?? 'LeEasy';

    // Overlay label
    const overlayLabel = document.getElementById('overlay-difficulty-label');
    if (overlayLabel) overlayLabel.textContent = label;

    // Start overlay pills
    document.querySelectorAll('.start-diff-pill').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.difficulty) === gameState.difficulty);
    });

    // Gear dropdown pills
    document.querySelectorAll('.diff-pill').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.difficulty) === gameState.difficulty);
    });

    // Best hint
    this.bestScoreManager.updateStartHint();
    this.bestScoreManager.display();
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
    const match = this.cardManager.getCardImage(card) === this.cardManager.getCardImage(gameState.cardToCheck);
    match ? this.handleMatch(card, gameState.cardToCheck)
          : this.handleMismatch(card, gameState.cardToCheck);
    gameState.cardToCheck = null;
  }

  async handleMatch(c1, c2) {
    gameState.addMatchedCards(c1, c2);
    c1.classList.add('matched');
    c2.classList.add('matched');
    await this.audioController.play('match');
    if (gameState.isGameComplete())
      setTimeout(() => this.endGame(true), CONFIG.DELAYS.VICTORY_DELAY);
  }

  handleMismatch(c1, c2) {
    gameState.isPlaying = false;
    setTimeout(() => {
      c1.classList.remove('visible');
      c2.classList.remove('visible');
      gameState.isPlaying = true;
    }, CONFIG.DELAYS.CARD_FLIP_BACK);
  }

  async endGame(victory) {
    gameState.isPlaying = false;
    gameState.stopTimer();
    document.getElementById('time-info')?.classList.remove('timer-warning');
    this.audioController.stop('bgm');

    if (victory) {
      const isNew = this.bestScoreManager.setScore(gameState.difficulty, gameState.flips);
      document.getElementById('summary-flips').textContent      = gameState.flips;
      document.getElementById('summary-time').textContent       = `${gameState.timeRemaining}s`;
      document.getElementById('summary-difficulty').textContent = CONFIG.DIFF_LABELS[gameState.difficulty] ?? '--';
      this.uiManager.showOverlay('victory-overlay');
      if (isNew) this.uiManager.showNewRecord();
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
    const fx     = confetti.create(canvas, { resize: true, useWorker: true });
    const g = '#FDBB30', n = '#041E42', w = '#ffffff';
    fx({ particleCount: 80, spread: 70,  origin: { y: 0.6 },              colors: [g, n, w] });
    setTimeout(() => fx({ particleCount: 60, spread: 100, origin: { y: 0.5 },              colors: [g, w] }),   400);
    setTimeout(() => fx({ particleCount: 40, angle: 60,   spread: 55, origin: { x: 0, y: 0.6 }, colors: [g, n] }), 700);
    setTimeout(() => fx({ particleCount: 40, angle: 120,  spread: 55, origin: { x: 1, y: 0.6 }, colors: [g, n] }), 700);
  }

  // Called by both dropdown pills and start-overlay pills
  setDifficulty(difficulty, timeLimit) {
    gameState.difficulty    = difficulty;
    gameState.timeLimit     = timeLimit;
    gameState.timeRemaining = timeLimit;
    gameState.flips         = 0;
    gameState.matchedCards  = [];

    // Reset progress bar
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = '0%';

    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DIFFICULTY,  difficulty);
      localStorage.setItem(CONFIG.STORAGE_KEYS.TIME_LIMIT,  timeLimit);
    } catch { /* ignore */ }

    this.cardManager.createCards();
    this.cardManager.resetCards();
    this.syncDifficultyUI();
    gameState.updateUI();
  }

  loadSettings() {
    try {
      const d = localStorage.getItem(CONFIG.STORAGE_KEYS.DIFFICULTY);
      const t = localStorage.getItem(CONFIG.STORAGE_KEYS.TIME_LIMIT);
      if (d && t) {
        gameState.difficulty = parseInt(d);
        gameState.timeLimit  = parseInt(t);
      }
    } catch { /* ignore */ }
  }

  init() {
    this.loadSettings();
    this.cardManager.createCards();
    this.syncDifficultyUI();
    this.uiManager.init();
  }
}

// ─────────────────────────── UIManager ───────────────────────────
class UIManager {
  showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(o => {
      o.classList.add('hidden');
      o.classList.remove('fading-in');
    });
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
      void el.offsetWidth;           // trigger reflow
      el.classList.add('fading-in');
    }
  }

  hideOverlay(id)   { document.getElementById(id)?.classList.add('hidden'); }
  showNewRecord()   { document.getElementById('new-record')?.classList.remove('hidden'); }
  hideNewRecord()   { document.getElementById('new-record')?.classList.add('hidden'); }
  showSettings()    { document.getElementById('settings-modal')?.classList.remove('hidden'); }
  hideSettings()    { document.getElementById('settings-modal')?.classList.add('hidden'); }

  // Gear dropdown
  openDropdown()  { document.getElementById('gear-dropdown')?.classList.remove('hidden'); }
  closeDropdown() { document.getElementById('gear-dropdown')?.classList.add('hidden'); }
  toggleDropdown() {
    const d = document.getElementById('gear-dropdown');
    d?.classList.contains('hidden') ? this.openDropdown() : this.closeDropdown();
  }

  init() { this._setupListeners(); }

  _setupListeners() {
    // ── Gear button toggles dropdown ──
    document.getElementById('gear-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown on outside click or Escape
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#gear-container'))
        this.closeDropdown();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.closeDropdown(); this.hideSettings(); }
    });

    // ── Dropdown difficulty pills ──
    document.querySelectorAll('.diff-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        gameController.setDifficulty(parseInt(btn.dataset.difficulty), parseInt(btn.dataset.time));
        // keep dropdown open so player sees the active pill update
      });
    });

    // ── Start overlay difficulty pills ──
    document.querySelectorAll('.start-diff-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        gameController.setDifficulty(parseInt(btn.dataset.difficulty), parseInt(btn.dataset.time));
      });
    });

    // ── Settings modal (full-screen picker) ──
    // No longer opened from gear — kept for any future entry point
    document.getElementById('settings-modal')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('settings-modal')) this.hideSettings();
    });
    document.getElementById('close-settings-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideSettings();
    });
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        gameController.setDifficulty(parseInt(btn.dataset.difficulty), parseInt(btn.dataset.time));
        this.hideSettings();
      });
    });

    // ── Best score ──
    document.getElementById('best-score')?.addEventListener('click', () => {
      gameController.bestScoreManager.displayAll();
    });

    // ── Overlay start / play-again buttons ──
    const startAction = (e) => {
      e.stopPropagation();
      ['start-overlay','victory-overlay','game-over-overlay'].forEach(id => this.hideOverlay(id));
      this.hideNewRecord();
      gameController.startGame();
    };
    document.getElementById('start-btn')?.addEventListener('click', startAction);
    document.getElementById('victory-btn')?.addEventListener('click', startAction);
    document.getElementById('game-over-btn')?.addEventListener('click', startAction);

    // Click-anywhere fallback on overlays
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target.classList.contains('new-game-btn') ||
            e.target.classList.contains('start-diff-pill')) return;
        this.hideOverlay(overlay.id);
        this.hideNewRecord();
        gameController.startGame();
      });
    });
  }
}

// ─────────────────────────── Bootstrap ───────────────────────────
const gameState      = new GameState();
const gameController = new GameController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => gameController.init());
} else {
  gameController.init();
}
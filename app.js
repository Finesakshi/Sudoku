/**
 * Pokemon Sudoku - Application State & UI Manager
 * Handles UI transitions, local storage, level completion, badges cabinet, and developer panel.
 */

// Application State
const state = {
  view: 'profile', // 'profile', 'hub', 'game'
  profile: {
    name: '',
    avatar: 'pikachu'
  },
  stats: {
    simple: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    master: 0
  },
  badges: [], // e.g. ['boulder', 'cascade']
  activeGame: null,
  selectedCell: null,
  notesMode: false,
  showBadgesModal: false,
  devConsoleOpen: false,
  activeHintDetail: null,
  timerInterval: null
};

// Available Avatars
const AVATARS = [
  { id: 'pikachu', name: 'Pikachu', color: '#ffde00', image: 'assets/pikachu.png' },
  { id: 'eevee', name: 'Eevee', color: '#b8a078', image: 'assets/eevee.png' },
  { id: 'charmander', name: 'Charmander', color: '#ff3f3f', image: 'assets/charmander.png' },
  { id: 'bulbasaur', name: 'Bulbasaur', color: '#4effa4', image: 'assets/bulbasaur.png' },
  { id: 'squirtle', name: 'Squirtle', color: '#4fa8ff', image: 'assets/squirtle.png' },
  { id: 'snorlax', name: 'Snorlax', color: '#2c3e50', image: 'assets/snorlax.png' }
];

// Badge Details
const BADGES = {
  boulder: { name: 'Boulder Badge', desc: 'Complete first Simple game', art: 'boulder' },
  cascade: { name: 'Cascade Badge', desc: 'Complete first Medium game', art: 'cascade' },
  thunder: { name: 'Thunder Badge', desc: 'Complete first Hard game', art: 'thunder' },
  soul: { name: 'Soul Badge', desc: 'Unlock Expert Level (5 Hard completed)', art: 'soul' },
  volcano: { name: 'Volcano Badge', desc: 'Complete first Expert game', art: 'volcano' },
  earth: { name: 'Earth Badge', desc: 'Unlock Master Level (10 Expert completed)', art: 'earth' },
  champion: { name: 'Champion Badge', desc: 'Complete first Master game', art: 'champion' },
  quickclaw: { name: 'Quick Claw Badge', desc: 'Complete a puzzle in under 5 minutes', art: 'quickclaw' },
  focusband: { name: 'Focus Band Badge', desc: 'Complete a puzzle with 0 mistakes', art: 'focusband' }
};

// Load saved data from localStorage on start
function loadUserData() {
  const saved = localStorage.getItem('pokemon_sudoku_trainer');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.profile = data.profile || { name: 'Trainer', avatar: 'pikachu' };
      state.stats = data.stats || { simple: 0, medium: 0, hard: 0, expert: 0, master: 0 };
      state.badges = data.badges || [];
      state.view = 'hub'; // Direct to hub if profile exists
    } catch (e) {
      console.error("Failed to parse saved trainer data", e);
    }
  }
}

// Save data to localStorage
function saveUserData() {
  const data = {
    profile: state.profile,
    stats: state.stats,
    badges: state.badges
  };
  localStorage.setItem('pokemon_sudoku_trainer', JSON.stringify(data));
}

// Get trainer rank based on completed levels
function getTrainerRank() {
  const badgeCount = state.badges.length;
  if (badgeCount === 0) return 'Novice Trainer';
  if (badgeCount < 3) return 'Rising Trainer';
  if (badgeCount < 5) return 'Gym Battler';
  if (badgeCount < 7) return 'Gym Leader';
  if (badgeCount < 9) return 'Elite Four';
  return 'Pokemon Master';
}

// Check level locks
function isLevelLocked(level) {
  if (level === 'simple' || level === 'medium' || level === 'hard') {
    return false;
  }
  if (level === 'expert') {
    return state.stats.hard < 5;
  }
  if (level === 'master') {
    return state.stats.expert < 10;
  }
  return true;
}

// Initialize active game state
function initNewGame(difficulty) {
  stopTimer();
  
  const { puzzle, solution } = SudokuEngine.generatePuzzle(difficulty);
  const currentBoard = [...puzzle];
  
  // Track pencil marks (notes)
  const notes = {};
  for (let i = 0; i < 81; i++) {
    notes[i] = [];
  }

  state.activeGame = {
    difficulty,
    initialBoard: puzzle,
    currentBoard: currentBoard,
    solution,
    notes,
    timer: 0,
    paused: false,
    errorsCount: 0,
    maxErrors: 3,
    hintsLeft: 3,
    history: [], // For Undo
    victory: false,
    gameOver: false,
    recentEarnedBadges: [] // To alert user on win screen
  };

  state.selectedCell = null;
  state.notesMode = false;
  state.view = 'game';
  
  startTimer();
  render();
}

// Timer Logic
function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.activeGame && !state.activeGame.paused && !state.activeGame.victory && !state.activeGame.gameOver) {
      state.activeGame.timer++;
      updateTimerUI();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerUI() {
  const timerEl = document.getElementById('game-timer-val');
  if (timerEl && state.activeGame) {
    timerEl.innerText = formatTime(state.activeGame.timer);
  }
}

function formatTime(secs) {
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}

// Award Badge
function awardBadge(badgeId) {
  if (!state.badges.includes(badgeId)) {
    state.badges.push(badgeId);
    if (state.activeGame) {
      state.activeGame.recentEarnedBadges.push(badgeId);
    }
    saveUserData();
  }
}

// Game Actions
function selectCell(index) {
  if (!state.activeGame || state.activeGame.victory || state.activeGame.gameOver || state.activeGame.paused) return;
  
  // If cell is pre-filled/given, we select it, but we can't edit it.
  state.selectedCell = index;
  renderBoard();
}

function inputNumber(num) {
  if (!state.activeGame || state.selectedCell === null || state.activeGame.victory || state.activeGame.gameOver || state.activeGame.paused) return;

  const idx = state.selectedCell;

  // Cannot modify initial puzzle cells
  if (state.activeGame.initialBoard[idx] !== 0) return;

  // Save state for undo
  state.activeGame.history.push({
    board: [...state.activeGame.currentBoard],
    notes: JSON.parse(JSON.stringify(state.activeGame.notes))
  });

  if (state.notesMode) {
    // Handle Pencil Mark Notes
    state.activeGame.currentBoard[idx] = 0; // Clear cell digit if adding notes
    const activeNotes = state.activeGame.notes[idx];
    const numIdx = activeNotes.indexOf(num);
    if (numIdx > -1) {
      activeNotes.splice(numIdx, 1); // Toggle off
    } else {
      activeNotes.push(num); // Toggle on
      activeNotes.sort();
    }
  } else {
    // Handle direct digit placing
    // If we type the same number, clear it
    if (state.activeGame.currentBoard[idx] === num) {
      state.activeGame.currentBoard[idx] = 0;
    } else {
      state.activeGame.currentBoard[idx] = num;
      // Clear notes for this cell
      state.activeGame.notes[idx] = [];

      // Check if it's incorrect (compared to the unique solution)
      const correctVal = state.activeGame.solution[idx];
      if (num !== correctVal) {
        state.activeGame.errorsCount++;
        // Play error animation/sound if any
        if (state.activeGame.errorsCount >= state.activeGame.maxErrors) {
          state.activeGame.gameOver = true;
          stopTimer();
        }
      } else {
        // Clear conflicting error highlights or recalculate validation
        checkWinCondition();
      }
    }
  }

  renderBoard();
  renderStrikes();
}

function eraseCell() {
  if (!state.activeGame || state.selectedCell === null || state.activeGame.victory || state.activeGame.gameOver || state.activeGame.paused) return;
  const idx = state.selectedCell;

  if (state.activeGame.initialBoard[idx] !== 0) return;

  // Save history
  state.activeGame.history.push({
    board: [...state.activeGame.currentBoard],
    notes: JSON.parse(JSON.stringify(state.activeGame.notes))
  });

  state.activeGame.currentBoard[idx] = 0;
  state.activeGame.notes[idx] = [];
  renderBoard();
}

function undoMove() {
  if (!state.activeGame || state.activeGame.history.length === 0 || state.activeGame.victory || state.activeGame.gameOver || state.activeGame.paused) return;

  const previousState = state.activeGame.history.pop();
  state.activeGame.currentBoard = previousState.board;
  state.activeGame.notes = previousState.notes;

  renderBoard();
}

function giveHint() {
  if (!state.activeGame || state.activeGame.victory || state.activeGame.gameOver || state.activeGame.paused) return;
  if (state.activeGame.hintsLeft <= 0) {
    showToast("No hints left for this battle!");
    return;
  }

  // Scan the board to find a logical hint based on current state & solution
  const hintObj = SudokuEngine.getLogicalHint(state.activeGame.currentBoard, state.activeGame.solution);

  if (hintObj) {
    state.activeGame.hintsLeft--;
    
    // Update Hints button visual
    const hintsCountEl = document.getElementById('hints-count');
    if (hintsCountEl) hintsCountEl.innerText = state.activeGame.hintsLeft;

    // Show hint modal
    state.activeHintDetail = hintObj;
    render();
  } else {
    showToast("No logical hints can be computed!");
  }
}

function toggleNotesMode() {
  state.notesMode = !state.notesMode;
  const notesBtn = document.getElementById('control-notes');
  if (notesBtn) {
    if (state.notesMode) {
      notesBtn.classList.add('active');
    } else {
      notesBtn.classList.remove('active');
    }
  }
}

function togglePauseGame() {
  if (!state.activeGame) return;
  state.activeGame.paused = !state.activeGame.paused;
  
  const boardContainer = document.getElementById('board-container');
  const pauseBtnIcon = document.querySelector('#control-pause .control-icon');
  const pauseBtnLbl = document.querySelector('#control-pause span');

  if (state.activeGame.paused) {
    boardContainer.classList.add('paused-blur');
    if (pauseBtnIcon) pauseBtnIcon.innerText = '▶';
    if (pauseBtnLbl) pauseBtnLbl.innerText = 'Resume';
    // Overlay board with Pause Screen
    showPauseOverlay(true);
  } else {
    boardContainer.classList.remove('paused-blur');
    if (pauseBtnIcon) pauseBtnIcon.innerText = '⏸';
    if (pauseBtnLbl) pauseBtnLbl.innerText = 'Pause';
    showPauseOverlay(false);
  }
}

function showPauseOverlay(show) {
  let overlay = document.getElementById('pause-board-overlay');
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pause-board-overlay';
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,0.85)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '5';
      overlay.style.borderRadius = '12px';
      
      overlay.innerHTML = `
        <div style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-yellow); margin-bottom: 12px;">Gym Match Paused</div>
        <button class="poke-btn" style="padding: 10px 20px; font-size: 14px;" onclick="togglePauseGame()">Resume Battle</button>
      `;
      
      const container = document.querySelector('.board-outer-wrapper');
      if (container) {
        container.appendChild(overlay);
      }
    }
  } else {
    if (overlay) overlay.remove();
  }
}

// Check if player has solved the puzzle correctly
function checkWinCondition() {
  const isComplete = state.activeGame.currentBoard.every((val, idx) => val === state.activeGame.solution[idx]);
  if (isComplete) {
    state.activeGame.victory = true;
    stopTimer();

    // Increment completed game stats
    const diff = state.activeGame.difficulty;
    state.stats[diff]++;
    
    // Check level achievements & unlock badges
    checkAndAwardBadges();

    // Save progression
    saveUserData();

    // Render Victory Screen
    setTimeout(() => {
      showVictoryModal();
    }, 500);
  }
}

// Badge Checker Logic
function checkAndAwardBadges() {
  // Boulder: First Simple Win
  if (state.stats.simple >= 1) awardBadge('boulder');
  // Cascade: First Medium Win
  if (state.stats.medium >= 1) awardBadge('cascade');
  // Thunder: First Hard Win
  if (state.stats.hard >= 1) awardBadge('thunder');
  
  // Expert Unlocked: 5 Hard wins
  if (state.stats.hard >= 5) {
    awardBadge('soul');
  }
  // Volcano: First Expert Win
  if (state.stats.expert >= 1) awardBadge('volcano');
  
  // Master Unlocked: 10 Expert wins
  if (state.stats.expert >= 10) {
    awardBadge('earth');
  }
  // Champion: First Master Win
  if (state.stats.master >= 1) awardBadge('champion');

  // Time speed-run: completed in under 5 minutes (300s)
  if (state.activeGame && state.activeGame.timer <= 300) {
    awardBadge('quickclaw');
  }

  // Flawless victory: 0 mistakes
  if (state.activeGame && state.activeGame.errorsCount === 0) {
    awardBadge('focusband');
  }
}

// Keyboard Navigation for Desktop
document.addEventListener('keydown', (e) => {
  if (state.view !== 'game' || !state.activeGame || state.activeGame.paused || state.activeGame.victory || state.activeGame.gameOver) return;

  const key = e.key;
  let idx = state.selectedCell;

  if (idx === null) {
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || (key >= '1' && key <= '9')) {
      state.selectedCell = 40; // Focus center cell
      renderBoard();
      return;
    }
  }

  const row = Math.floor(idx / 9);
  const col = idx % 9;

  if (key === 'ArrowUp' && row > 0) {
    state.selectedCell = (row - 1) * 9 + col;
  } else if (key === 'ArrowDown' && row < 8) {
    state.selectedCell = (row + 1) * 9 + col;
  } else if (key === 'ArrowLeft' && col > 0) {
    state.selectedCell = row * 9 + (col - 1);
  } else if (key === 'ArrowRight' && col < 8) {
    state.selectedCell = row * 9 + (col + 1);
  } else if (key >= '1' && key <= '9') {
    inputNumber(parseInt(key));
  } else if (key === 'Backspace' || key === 'Delete' || key === 'e') {
    eraseCell();
  } else if (key.toLowerCase() === 'n') {
    toggleNotesMode();
  } else if (key.toLowerCase() === 'u') {
    undoMove();
  } else if (key.toLowerCase() === 'h') {
    giveHint();
  } else {
    return; // Propagate other keys
  }

  e.preventDefault();
  renderBoard();
});

// View Navigation Triggers
function navigateTo(viewName) {
  stopTimer();
  state.view = viewName;
  state.activeGame = null;
  state.selectedCell = null;
  state.notesMode = false;
  render();
}

// UI RENDERING ENGINE

// Master render router
function render() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  appEl.innerHTML = '';

  // Render common header if we are not on the profile screen
  if (state.view !== 'profile') {
    appEl.appendChild(createHeaderElement());
  }

  let viewEl;
  switch (state.view) {
    case 'profile':
      viewEl = createProfileView();
      break;
    case 'hub':
      viewEl = createHubView();
      break;
    case 'game':
      viewEl = createGameView();
      break;
  }

  appEl.appendChild(viewEl);

  // Render Badges Cabinet Modal if active
  if (state.showBadgesModal) {
    appEl.appendChild(createBadgesCabinetModal());
  }

  // Render Logical Hint Modal if active
  if (state.activeHintDetail) {
    appEl.appendChild(createHintModal());
  }

  // Developer console (gear in corner + actual console panel)
  appEl.appendChild(createDevConsole());
}

// Header element builder
function createHeaderElement() {
  const header = document.createElement('header');
  header.className = 'app-header';

  const avatarObj = AVATARS.find(a => a.id === state.profile.avatar) || AVATARS[0];

  header.innerHTML = `
    <div class="logo-container" style="cursor: pointer;" onclick="navigateTo('hub')">
      <div class="logo-pokeball"></div>
      <h1>PokéSudoku</h1>
    </div>
    <div class="player-status-bar" onclick="showBadgesCabinet(true)">
      <img class="status-avatar" src="${avatarObj.image}" alt="${avatarObj.name}">
      <span class="status-name">${state.profile.name || 'Trainer'}</span>
      <div style="font-size: 16px; color: var(--primary-yellow); margin-left: 2px;">🏆</div>
    </div>
  `;
  return header;
}

// PROFILE SETUP SCREEN
function createProfileView() {
  const view = document.createElement('div');
  view.className = 'view profile-view';

  // Find currently selected avatar
  const avatarListHtml = AVATARS.map(avatar => `
    <div class="avatar-card ${state.profile.avatar === avatar.id ? 'selected' : ''}" data-id="${avatar.id}" onclick="selectAvatar('${avatar.id}')">
      <img src="${avatar.image}" alt="${avatar.name}">
      <span>${avatar.name}</span>
    </div>
  `).join('');

  view.innerHTML = `
    <div class="welcome-title">Pokémon Sudoku</div>
    <div class="welcome-subtitle">Train your brain, complete gym challenges, and earn elite badges! Ad-free forever.</div>
    
    <div class="card-panel">
      <div class="input-container">
        <label class="input-label" for="trainer-name-field">Trainer Nickname</label>
        <input class="nickname-input" type="text" id="trainer-name-field" placeholder="Enter name..." value="${state.profile.name}" maxlength="12">
      </div>

      <div class="avatar-selection-container">
        <label class="input-label">Choose Partner Pokémon</label>
        <div class="avatar-grid">
          ${avatarListHtml}
        </div>
      </div>

      <button class="poke-btn" onclick="saveProfileAndEnter()">
        <span>Enter the Gym</span>
        <div style="font-size: 20px;">⚡</div>
      </button>
    </div>
  `;

  return view;
}

window.selectAvatar = function(avatarId) {
  state.profile.avatar = avatarId;
  const cards = document.querySelectorAll('.avatar-card');
  cards.forEach(card => {
    if (card.dataset.id === avatarId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
};

window.saveProfileAndEnter = function() {
  const nameInput = document.getElementById('trainer-name-field');
  const name = nameInput ? nameInput.value.trim() : '';
  state.profile.name = name || 'Trainer';
  saveUserData();
  navigateTo('hub');
};

// GYM HUB SCREEN
function createHubView() {
  const view = document.createElement('div');
  view.className = 'view hub-view';

  const avatarObj = AVATARS.find(a => a.id === state.profile.avatar) || AVATARS[0];
  const rank = getTrainerRank();
  const totalCompleted = Object.values(state.stats).reduce((a, b) => a + b, 0);

  // Check locking limits and build HTML difficulty buttons
  const difficulties = [
    { id: 'simple', name: 'Simple', desc: '48 Clues. Perfect for beginners.', color: 'var(--grass-green)', req: '' },
    { id: 'medium', name: 'Medium', desc: '40 Clues. Standard gym test.', color: 'var(--water-blue)', req: '' },
    { id: 'hard', name: 'Hard', desc: '32 Clues. Advanced battle arena.', color: 'var(--primary-yellow)', req: '' },
    { id: 'expert', name: 'Expert', desc: '26 Clues. Unlocked after 5 Hard wins.', color: '#9b59b6', req: 'expert' },
    { id: 'master', name: 'Master', desc: '17 Clues (Mathematical Minimum). Unlocked after 10 Expert wins.', color: 'var(--primary-red)', req: 'master' }
  ];

  let levelsHtml = '';
  difficulties.forEach(diff => {
    const locked = isLevelLocked(diff.id);
    let lockProgressHtml = '';
    let statusIcon = '⭐';

    if (diff.id === 'expert') {
      const pct = Math.min(100, (state.stats.hard / 5) * 100);
      lockProgressHtml = `
        <div class="level-lock-progress">
          <div class="level-lock-bar" style="width: ${pct}%;"></div>
        </div>
        <div style="font-size: 10px; opacity: 0.7; margin-top: 4px;">Completed Hard: ${state.stats.hard}/5</div>
      `;
      if (locked) statusIcon = '🔒';
    } else if (diff.id === 'master') {
      const pct = Math.min(100, (state.stats.expert / 10) * 100);
      lockProgressHtml = `
        <div class="level-lock-progress">
          <div class="level-lock-bar" style="width: ${pct}%;"></div>
        </div>
        <div style="font-size: 10px; opacity: 0.7; margin-top: 4px;">Completed Expert: ${state.stats.expert}/10</div>
      `;
      if (locked) statusIcon = '🔒';
    }

    levelsHtml += `
      <div class="level-card ${locked ? 'locked' : ''}" onclick="${locked ? '' : `initNewGame('${diff.id}')`}">
        <div class="level-meta">
          <div class="level-name" style="color: ${locked ? '#aaa' : diff.color}">
            ${diff.name}
            ${state.stats[diff.id] > 0 ? `<span class="level-badge-indicator">${state.stats[diff.id]} Solved</span>` : ''}
          </div>
          <div class="level-desc">${diff.desc}</div>
          ${lockProgressHtml}
        </div>
        <div class="level-status-icon">${statusIcon}</div>
      </div>
    `;
  });

  view.innerHTML = `
    <div class="trainer-card">
      <img class="trainer-card-avatar" src="${avatarObj.image}" alt="${avatarObj.name}">
      <div class="trainer-info">
        <span class="trainer-name">${state.profile.name || 'Trainer'}</span>
        <span class="trainer-rank">🏅 ${rank}</span>
        <div class="trainer-stats">
          <div class="trainer-stat-item">
            <span class="trainer-stat-val">${totalCompleted}</span>
            <span class="trainer-stat-lbl">Gym Wins</span>
          </div>
          <div class="trainer-stat-item">
            <span class="trainer-stat-val">${state.badges.length}/9</span>
            <span class="trainer-stat-lbl">Badges</span>
          </div>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 10px;">
      <button class="poke-btn" style="flex-grow: 1; padding: 12px; font-size: 14px;" onclick="showBadgesCabinet(true)">
        🖼 View Badge Room
      </button>
      <button class="poke-btn" style="background: rgba(255,255,255,0.05); border-color: var(--panel-border); font-size: 14px; padding: 12px;" onclick="navigateTo('profile')">
        ⚙ Profile
      </button>
    </div>

    <div class="level-select-container">
      <div class="level-select-title">Select Gym Challenge</div>
      ${levelsHtml}
    </div>
  `;

  return view;
}

// PLAY ARENA VIEW
function createGameView() {
  const view = document.createElement('div');
  view.className = 'view arena-view';

  if (!state.activeGame) return view;

  view.innerHTML = `
    <div class="arena-header">
      <div class="arena-meta">
        <span class="arena-difficulty">${state.activeGame.difficulty} Gym</span>
        <div class="arena-timer">
          <span style="font-size: 16px;">⏱</span>
          <span id="game-timer-val">${formatTime(state.activeGame.timer)}</span>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
        <div id="game-strikes-container">
          <!-- Rendered in renderStrikes() -->
        </div>
        <div class="arena-actions">
          <button class="arena-btn" id="control-pause" onclick="togglePauseGame()" title="Pause Game">
            <span class="control-icon">⏸</span>
          </button>
          <button class="arena-btn" onclick="confirmAbandonGame()" title="Leave Game" style="background: rgba(255,63,63,0.15); color: var(--primary-red);">
            <span class="control-icon">🚪</span>
          </button>
        </div>
      </div>
    </div>

    <div class="board-outer-wrapper" style="position: relative; width: 100%;">
      <div class="board-container" id="board-container">
        <!-- Rendered in renderBoard() -->
      </div>
    </div>

    <div class="controls-panel">
      <button class="control-card" onclick="undoMove()">
        <span class="control-icon">↩</span>
        <span>Undo</span>
      </button>
      <button class="control-card ${state.notesMode ? 'active' : ''}" id="control-notes" onclick="toggleNotesMode()">
        <span class="control-icon">✏</span>
        <span>Notes</span>
      </button>
      <button class="control-card" onclick="eraseCell()">
        <span class="control-icon">🧹</span>
        <span>Erase</span>
      </button>
      <button class="control-card" onclick="giveHint()">
        <span class="control-icon">💡</span>
        <span>Hint (<span id="hints-count">${state.activeGame.hintsLeft}</span>)</span>
      </button>
    </div>

    <div class="numpad-container">
      ${Array.from({ length: 9 }, (_, i) => i + 1).map(num => `
        <button class="numpad-btn" onclick="inputNumber(${num})">${num}</button>
      `).join('')}
    </div>
  `;

  // Delayed rendering of children boards so they are present in DOM
  setTimeout(() => {
    renderBoard();
    renderStrikes();
  }, 0);

  return view;
}

window.confirmAbandonGame = function() {
  if (confirm("Are you sure you want to run away from this Gym Battle? Your progress will be lost.")) {
    navigateTo('hub');
  }
};

// RENDER BOARD CELLS
function renderBoard() {
  const container = document.getElementById('board-container');
  if (!container || !state.activeGame) return;

  container.innerHTML = '';

  const { initialBoard, currentBoard, solution, notes, errorsCount } = state.activeGame;
  const validityErrors = SudokuEngine.checkValidity(currentBoard);
  const selectedIdx = state.selectedCell;
  
  let selectedVal = null;
  let selectedRow = null;
  let selectedCol = null;
  let selectedBox = null;

  if (selectedIdx !== null) {
    selectedVal = currentBoard[selectedIdx];
    selectedRow = Math.floor(selectedIdx / 9);
    selectedCol = selectedIdx % 9;
    selectedBox = 3 * Math.floor(selectedRow / 3) + Math.floor(selectedCol / 3);
  }

  for (let i = 0; i < 81; i++) {
    const val = currentBoard[i];
    const initVal = initialBoard[i];
    const isGiven = initVal !== 0;
    
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = 3 * Math.floor(r / 3) + Math.floor(c / 3);

    const cell = document.createElement('div');
    cell.className = 'sudoku-cell';
    cell.dataset.index = i;

    // Outer border highlights for blocks
    if (c === 2 || c === 5) cell.classList.add('border-right-thick');
    if (r === 2 || r === 5) cell.classList.add('border-bottom-thick');

    if (isGiven) cell.classList.add('given');
    else if (val !== 0) cell.classList.add('user-filled');

    // Selection highlights
    if (selectedIdx === i) {
      cell.classList.add('selected');
    } else if (selectedIdx !== null) {
      // Highlight row, column, and box of selected cell
      if (r === selectedRow || c === selectedCol || b === selectedBox) {
        cell.classList.add('highlighted');
      }
      // Highlight other cells with the exact same value
      if (val !== 0 && val === selectedVal) {
        cell.classList.add('same-value');
      }
    }

    // Validation styling (Error highlighting)
    const isIncorrect = val !== 0 && !isGiven && val !== solution[i];
    const hasConflict = validityErrors[i];
    if (isIncorrect || hasConflict) {
      cell.classList.add('error');
    }

    // Cell Content: Value or Pencil Marks
    if (val !== 0) {
      cell.innerHTML = `<span class="cell-value">${val}</span>`;
    } else {
      // Notes mode
      const activeNotes = notes[i] || [];
      if (activeNotes.length > 0) {
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid';
        for (let n = 1; n <= 9; n++) {
          const noteItem = document.createElement('div');
          noteItem.className = 'note-item';
          if (activeNotes.includes(n)) {
            noteItem.innerText = n;
          }
          notesGrid.appendChild(noteItem);
        }
        cell.appendChild(notesGrid);
      }
    }

    cell.onclick = () => selectCell(i);
    container.appendChild(cell);
  }
}

// RENDER STRIKES / LIVES
function renderStrikes() {
  const container = document.getElementById('game-strikes-container');
  if (!container || !state.activeGame) return;

  const { errorsCount, maxErrors } = state.activeGame;

  // Let's create heart icons
  let heartsHtml = '';
  for (let i = 0; i < maxErrors; i++) {
    const lost = i < errorsCount;
    heartsHtml += `<span class="strike-heart ${lost ? 'lost' : ''}">${lost ? '🖤' : '❤️'}</span>`;
  }

  container.innerHTML = `
    <div class="strikes-container">
      <span>Mistakes:</span>
      ${heartsHtml}
    </div>
  `;

  // Trigger game over view if limit hit
  if (state.activeGame.gameOver) {
    showLossModal();
  }
}

// MODAL WINDOW BUILDERS

// Badges Cabinet Modal
function createBadgesCabinetModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = () => showBadgesCabinet(false);

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.onclick = (e) => e.stopPropagation(); // Avoid closing on clicking inside

  const totalBadges = Object.keys(BADGES).length;
  const unlockedCount = state.badges.length;

  let badgesHtml = '';
  Object.keys(BADGES).forEach(badgeId => {
    const details = BADGES[badgeId];
    const unlocked = state.badges.includes(badgeId);
    badgesHtml += `
      <div class="badge-slot ${unlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">
          <div class="badge-art ${details.art}"></div>
        </div>
        <span class="badge-name">${details.name}</span>
        <span class="badge-desc">${details.desc}</span>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="modal-pokeball-back"></div>
    <div class="modal-title">Gym Badge Case</div>
    <div style="font-size: 14px; opacity: 0.7; margin-top: -12px;">Earned: ${unlockedCount}/${totalBadges} Badges</div>
    
    <div class="badges-grid">
      ${badgesHtml}
    </div>
    
    <button class="poke-btn" style="padding: 10px 20px; font-size: 14px;" onclick="showBadgesCabinet(false)">Close Case</button>
  `;

  overlay.appendChild(card);
  return overlay;
}

window.showBadgesCabinet = function(show) {
  state.showBadgesModal = show;
  render();
};

// VICTORY SCREEN MODAL
function showVictoryModal() {
  const appEl = document.getElementById('app');
  if (!appEl || !state.activeGame) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const card = document.createElement('div');
  card.className = 'modal-card';

  // Badges Earned alerts
  let badgeAlertsHtml = '';
  if (state.activeGame.recentEarnedBadges.length > 0) {
    const list = state.activeGame.recentEarnedBadges.map(bId => BADGES[bId].name).join(', ');
    badgeAlertsHtml = `
      <div style="background: rgba(255,222,0,0.1); border: 1px solid var(--primary-yellow); padding: 12px; border-radius: 12px; margin-top: 10px;">
        <span style="color: var(--primary-yellow); font-weight: 700;">🎁 BADGE EARNED!</span>
        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">You received the ${list}!</div>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="modal-pokeball-back"></div>
    <div class="modal-title" style="color: var(--grass-green);">Gym Cleared!</div>
    <div style="font-size: 50px;">🏆⚡🎉</div>
    
    <div class="modal-desc">
      <strong>Excellent battle, Trainer!</strong><br>
      You solved the <strong>${state.activeGame.difficulty}</strong> puzzle.<br><br>
      ⏱ Time: <strong>${formatTime(state.activeGame.timer)}</strong><br>
      ❤️ Mistakes made: <strong>${state.activeGame.errorsCount}</strong>
    </div>

    ${badgeAlertsHtml}

    <button class="poke-btn" onclick="navigateTo('hub')">Back to Gym Hub</button>
  `;

  overlay.appendChild(card);
  appEl.appendChild(overlay);
}

// GAME OVER (LOSS) MODAL
function showLossModal() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  // Check if overlay already exists
  let overlay = document.getElementById('game-over-overlay');
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'game-over-overlay';
  overlay.className = 'modal-overlay';

  const card = document.createElement('div');
  card.className = 'modal-card fainted-modal';

  card.innerHTML = `
    <div class="modal-pokeball-back"></div>
    <div class="fainted-icon">☠️</div>
    <div class="modal-title" style="color: var(--primary-red); font-size: 26px;">Whited Out!</div>
    
    <div class="fainted-message">
      Trainer! Your Pokémon partner has fainted after making <strong>3 critical mistakes</strong>. You must retreat and restore their energy.
    </div>

    <div style="display: flex; gap: 12px; margin-top: 6px;">
      <button class="poke-btn" style="flex-grow: 1; padding: 10px 16px; font-size: 14px; background: linear-gradient(135deg, var(--primary-red) 0%, #b91c1c 100%); border-color: var(--primary-red);" onclick="restartLevel()">
        🏥 Heal & Retry
      </button>
      <button class="poke-btn" style="background: #f1f5f9; border-color: #cbd5e1; color: var(--text-dark); font-size: 14px; padding: 10px 16px; box-shadow: none;" onclick="navigateTo('hub')">
        🏃 Run Away
      </button>
    </div>
  `;

  overlay.appendChild(card);
  appEl.appendChild(overlay);
}

window.restartLevel = function() {
  const diff = state.activeGame ? state.activeGame.difficulty : 'simple';
  const over = document.getElementById('game-over-overlay');
  if (over) over.remove();
  initNewGame(diff);
};


// DEVELOPER CHEATS CONSOLE

function createDevConsole() {
  const wrapper = document.createElement('div');

  // Toggle button (gear)
  const toggle = document.createElement('div');
  toggle.className = 'dev-console-toggle';
  toggle.innerText = '⚙️';
  toggle.onclick = () => {
    state.devConsoleOpen = !state.devConsoleOpen;
    render();
  };
  wrapper.appendChild(toggle);

  if (state.devConsoleOpen) {
    const consolePanel = document.createElement('div');
    consolePanel.className = 'dev-console';
    consolePanel.innerHTML = `
      <div class="dev-console-title">
        <span>🔧 PROFESSOR OAK'S DEV CONSOLE (CHEATS)</span>
        <span style="cursor:pointer;" onclick="closeDevConsole()">[X]</span>
      </div>
      <div class="dev-console-row">
        <button class="dev-btn" onclick="cheatSolveGame()">Win Instantly</button>
        <button class="dev-btn" onclick="cheatSimulateWins('hard', 5)">Add 5 Hard Wins (Unlock Expert)</button>
        <button class="dev-btn" onclick="cheatSimulateWins('expert', 10)">Add 10 Expert Wins (Unlock Master)</button>
        <button class="dev-btn" onclick="cheatSimulateWins('simple', 1)">Add 1 Simple Win</button>
        <button class="dev-btn" onclick="cheatUnlockAllBadges()">Unlock All Badges</button>
        <button class="dev-btn" onclick="cheatResetAll()">Reset Progress</button>
      </div>
    `;
    wrapper.appendChild(consolePanel);
  }

  return wrapper;
}

window.closeDevConsole = function() {
  state.devConsoleOpen = false;
  render();
};

window.cheatSolveGame = function() {
  if (!state.activeGame) return alert("Start a game first!");
  
  // Fill everything except 1 blank space
  let emptyIdx = -1;
  for (let i = 0; i < 81; i++) {
    if (state.activeGame.initialBoard[i] === 0) {
      if (emptyIdx === -1) {
        emptyIdx = i; // Save one blank space to allow final entry win
      } else {
        state.activeGame.currentBoard[i] = state.activeGame.solution[i];
      }
    }
  }

  if (emptyIdx !== -1) {
    state.selectedCell = emptyIdx;
    alert("Cheat Applied! Enter the last digit at cell index " + emptyIdx + " (Correct digit: " + state.activeGame.solution[emptyIdx] + ") to win.");
  } else {
    // Already filled
    checkWinCondition();
  }
  state.devConsoleOpen = false;
  render();
};

window.cheatSimulateWins = function(level, count) {
  state.stats[level] += count;
  checkAndAwardBadges();
  saveUserData();
  alert(`Simulated ${count} wins for ${level}. Current wins for ${level}: ${state.stats[level]}`);
  state.devConsoleOpen = false;
  render();
};

window.cheatUnlockAllBadges = function() {
  Object.keys(BADGES).forEach(badgeId => {
    if (!state.badges.includes(badgeId)) state.badges.push(badgeId);
  });
  saveUserData();
  alert("All Badges unlocked!");
  state.devConsoleOpen = false;
  render();
};

window.cheatResetAll = function() {
  if (confirm("Reset everything? This will wipe your profile and statistics.")) {
    localStorage.removeItem('pokemon_sudoku_trainer');
    state.view = 'profile';
    state.profile = { name: '', avatar: 'pikachu' };
    state.stats = { simple: 0, medium: 0, hard: 0, expert: 0, master: 0 };
    state.badges = [];
    state.activeGame = null;
    state.devConsoleOpen = false;
    render();
  }
};


// STARTUP INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  render();
});

// If script is loaded late, execute manual initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  loadUserData();
  render();
}

// Toast notification helper
function showToast(message) {
  const existing = document.getElementById('app-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'rgba(15, 23, 42, 0.9)';
  toast.style.color = '#ffffff';
  toast.style.padding = '8px 16px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '700';
  toast.style.zIndex = '10000';
  toast.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  toast.style.pointerEvents = 'none';
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-5px)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 2200);
}

// Hint Modal Builder
function createHintModal() {
  if (!state.activeHintDetail) return null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = () => closeHintModal(false);

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.onclick = (e) => e.stopPropagation();

  const { index, value, message } = state.activeHintDetail;
  const r = Math.floor(index / 9) + 1;
  const c = (index % 9) + 1;

  card.innerHTML = `
    <div class="modal-pokeball-back"></div>
    <div style="font-size: 36px; animation: bounce 1s infinite alternate;">💡</div>
    <div class="modal-title">Gym Battle Hint</div>
    
    <div class="modal-desc" style="text-align: left; display: flex; flex-direction: column; gap: 8px; margin: 6px 0;">
      <div>
        <strong style="color: var(--primary-blue);">Target Cell:</strong> 
        Row ${r}, Column ${c}
      </div>
      <div>
        <strong style="color: var(--grass-green);">Correct Digit:</strong> 
        <span style="font-size: 15px; font-weight: 800; background: rgba(22, 163, 74, 0.1); padding: 2px 8px; border-radius: 6px;">${value}</span>
      </div>
      <div style="margin-top: 6px; font-size: 13px; line-height: 1.5; background: #f8fafc; border: 1px solid var(--panel-border); padding: 10px; border-radius: 10px; color: var(--text-medium);">
        <strong>How to solve it:</strong><br>
        ${message}
      </div>
    </div>

    <button class="poke-btn" style="padding: 10px 16px; font-size: 14px;" onclick="closeHintModal(true)">
      🎯 Highlight Cell & Close
    </button>
  `;

  overlay.appendChild(card);
  return overlay;
}

window.closeHintModal = function(highlightCell) {
  if (highlightCell && state.activeHintDetail) {
    state.selectedCell = state.activeHintDetail.index;
  }
  state.activeHintDetail = null;
  render();
};



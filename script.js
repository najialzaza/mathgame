// ============================================================
// GAME CONFIG
// ============================================================
const TOTAL_QUESTIONS = 8;
const MAX_LIVES = 3;

const EMOJIS_ADD = ['🍎','🍊','🍋','🍇','🍓','🌸','⭐','🦋','🐟','🎈','🌺','🏀','🎵','🍕'];
const EMOJIS_SUB = ['🍎','🍊','🍋','🍇','🍓','🌸','⭐','🦋','🐟','🎈'];

const CHARACTERS = ['🦊','🐰','🦁','🐻','🐧','🦄'];
const CORRECT_MSGS = [
  '🎉 رائع! أحسنت!',
  '⭐ ممتاز! أنت نجم!',
  '🌟 صح! زيزو فخور بك!',
  '🏆 برافو! إجابة صحيحة!',
  '💪 عظيم! استمر!',
  '🎊 أحسنت! إجابة ذكية!',
];
const WRONG_MSGS = [
  '😢 آسف! حاول مجدداً في السؤال القادم',
  '💙 لا بأس! الخطأ طريق التعلم',
  '🤔 تقريباً! ستتحسن أكثر',
  '😊 لا تحزن! الإجابة الصحيحة كانت',
];
const BUBBLE_MSGS_WAIT = [
  'فكّر جيداً وخذ وقتك! 🤔',
  'هيا، أنت قادر! 💪',
  'ثق بنفسك! 🌟',
  'خذ وقتك! لا تتسرع 😊',
];

// ============================================================
// STATE
// ============================================================
let score = 0;
let lives = MAX_LIVES;
let currentQuestion = 0;
let correctAnswers = 0;
let currentAnswer = 0;
let answered = false;
let difficulty = 1;
let characterEmoji = '🦊';
let questionHistory = [];
let bubbleInterval = null;

// ============================================================
// INIT
// ============================================================
function init() {
  characterEmoji = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  document.getElementById('character').textContent = characterEmoji;
  score = 0;
  lives = MAX_LIVES;
  currentQuestion = 0;
  correctAnswers = 0;
  questionHistory = [];
  updateStats();
  renderHearts();
  document.getElementById('resultsScreen').classList.remove('visible');
  document.getElementById('gameArea').style.display = '';
  document.getElementById('feedback').className = 'feedback hidden';
  document.getElementById('nextBtn').classList.remove('visible');
  startBubbleLoop();
  generateQuestion();
}

function setLevel(lvl) {
  //alert("أميرة صدعت :)");
  console.log("تم اختيار المستوى");
  playSound('soundClick'); // تشغيل صوت النقرة
  difficulty = lvl;
  document.querySelectorAll('.level-btn').forEach((b,i) => {
    b.classList.toggle('active', i === lvl - 1);
  });
  restartGame();
}

function restartGame() {
  playSound('soundClick'); // تشغيل صوت النقرة
  document.getElementById('confettiContainer').innerHTML = '';
  init();
}

// ============================================================
// QUESTION GENERATION
// ============================================================
function getRange() {
  if (difficulty === 1) return [1, 10];
  if (difficulty === 2) return [1, 20];
  return [1, 50];
}

function generateQuestion() {
  answered = false;
  document.getElementById('feedback').className = 'feedback hidden';
  document.getElementById('nextBtn').classList.remove('visible');

  const isAdd = Math.random() > 0.4;
  const [min, max] = getRange();

  let a, b, answer;
  if (isAdd) {
    a = randInt(min, Math.floor(max * 0.7));
    b = randInt(min, Math.floor(max * 0.7));
    answer = a + b;
  } else {
    a = randInt(min + 1, max);
    b = randInt(min, a);
    answer = a - b;
  }

  currentAnswer = answer;

  const badge = document.getElementById('operationBadge');
  if (isAdd) {
    badge.textContent = '➕ جمع';
    badge.className = 'operation-badge badge-add';
  } else {
    badge.textContent = '➖ طرح';
    badge.className = 'operation-badge badge-sub';
  }

  renderVisualObjects(a, b, isAdd);

  const op = isAdd ? '+' : '−';
  document.getElementById('questionDisplay').innerHTML =
    `<span>${a}</span> <span class="op">${op}</span> <span>${b}</span> <span class="op">=</span> <span class="blank">?</span>`;

  renderHint(a, b, isAdd);
  renderChoices(answer);
  updateProgress();
  setBubble(BUBBLE_MSGS_WAIT[Math.floor(Math.random() * BUBBLE_MSGS_WAIT.length)]);
}

function renderVisualObjects(a, b, isAdd) {
  const container = document.getElementById('visualObjects');
  container.innerHTML = '';
  const maxShow = difficulty === 3 ? 15 : 20;

  if (a + b > maxShow) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';

  const emoji = EMOJIS_ADD[Math.floor(Math.random() * EMOJIS_ADD.length)];

  for (let i = 0; i < a; i++) {
    const el = document.createElement('span');
    el.className = 'obj-item';
    el.textContent = emoji;
    el.style.animationDelay = (i * 0.05) + 's';
    container.appendChild(el);
  }

  if (!isAdd) {
    for (let i = 0; i < b; i++) {
      const el = document.createElement('span');
      el.className = 'obj-item crossed';
      el.textContent = emoji;
      el.style.animationDelay = ((a + i) * 0.05) + 's';
      container.appendChild(el);
    }
  } else {
    const emoji2 = EMOJIS_ADD[(EMOJIS_ADD.indexOf(emoji) + 3) % EMOJIS_ADD.length];
    for (let i = 0; i < b; i++) {
      const el = document.createElement('span');
      el.className = 'obj-item';
      el.textContent = emoji2;
      el.style.animationDelay = ((a + i) * 0.05) + 's';
      container.appendChild(el);
    }
  }
}

function renderHint(a, b, isAdd) {
  const el = document.getElementById('hintWrap');
  if (isAdd) {
    el.textContent = `💡 اجمع ${a} مع ${b} لتجد الناتج`;
  } else {
    el.textContent = `💡 اطرح ${b} من ${a} لتجد الناتج`;
  }
}

function renderChoices(answer) {
  const grid = document.getElementById('choicesGrid');
  grid.innerHTML = '';

  const choices = generateChoices(answer);
  choices.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = val;
    btn.onclick = () => checkAnswer(val, btn);
    grid.appendChild(btn);
  });
}

function generateChoices(answer) {
  const set = new Set([answer]);
  const [min, max] = getRange();

  while (set.size < 4) {
    let distractor;
    const r = Math.random();
    if (r < 0.4) distractor = answer + randInt(1, 4) * (Math.random() < 0.5 ? 1 : -1);
    else if (r < 0.7) distractor = answer + randInt(5, 10) * (Math.random() < 0.5 ? 1 : -1);
    else distractor = randInt(Math.max(0, answer - 15), answer + 15);

    if (distractor >= 0 && distractor !== answer && !set.has(distractor)) {
      set.add(distractor);
    }
  }
  return shuffle([...set]);
}

// ============================================================
// ANSWER CHECK
// ============================================================
function checkAnswer(val, btn) {
  if (answered) return;
  answered = true;

  const allBtns = document.querySelectorAll('.choice-btn');
  allBtns.forEach(b => b.disabled = true);

  const feedback = document.getElementById('feedback');
  const char = document.getElementById('character');

  if (val === currentAnswer) {
    playSound('soundCorrect'); // تشغيل صوت النجاح
    correctAnswers++;
    score += difficulty * 10 + (difficulty > 1 ? 5 : 0);
    btn.classList.add('correct');
    feedback.className = 'feedback correct';
    feedback.textContent = CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)];
    char.className = 'character celebrate';
    setTimeout(() => char.className = 'character', 700);
    spawnParticles(btn);
    updateStats();
    setBubble('صح! أحسنت! 🎉');
    if (currentQuestion + 1 >= TOTAL_QUESTIONS) launchConfetti();
  } else {
    playSound('soundWrong'); // تشغيل صوت الخطأ
    lives--;
    renderHearts();
    btn.classList.add('wrong');
    allBtns.forEach(b => {
      if (parseInt(b.textContent) === currentAnswer) b.classList.add('correct');
    });
    feedback.className = 'feedback wrong';
    feedback.textContent = WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)] +
      (WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)].includes('الإجابة') ? ` ${currentAnswer}` : '');
    char.className = 'character shake';
    setTimeout(() => char.className = 'character', 600);
    updateStats();
    setBubble('لا بأس! في المرة القادمة ستفعلها 💙');
  }

  currentQuestion++;

  if (currentQuestion >= TOTAL_QUESTIONS || lives <= 0) {
    setTimeout(showResults, 1600);
  } else {
    document.getElementById('nextBtn').classList.add('visible');
  }
}

function nextQuestion() {
  generateQuestion();
}

// ============================================================
// RESULTS
// ============================================================
function showResults() {
  document.getElementById('gameArea').style.display = 'none';
  const rs = document.getElementById('resultsScreen');
  rs.classList.add('visible');

  const pct = correctAnswers / TOTAL_QUESTIONS;
  let rating, title, msg;

  if (pct >= 0.9) { rating='🏆🌟🌟🌟'; title='بطل الأرقام!'; msg='أداء رائع جداً! أنت نجم حقيقي!'; }
  else if (pct >= 0.7) { rating='🥇🌟🌟'; title='ممتاز!'; msg='عمل رائع! أنت على الطريق الصحيح!'; }
  else if (pct >= 0.5) { rating='🥈🌟'; title='جيد جداً!'; msg='استمر في التدريب وستصبح أفضل!'; }
  else { rating='🥉'; title='حاول مجدداً!'; msg='لا تستسلم! التدريب يجعلك أفضل دائماً!'; }

  document.getElementById('resultRating').textContent = rating;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('resultMsg').textContent = msg;
  document.getElementById('correctCount').textContent = correctAnswers;
  document.getElementById('totalCount').textContent = TOTAL_QUESTIONS;

  if (pct >= 0.7) launchConfetti();
  stopBubbleLoop();
}

// ============================================================
// UI HELPERS
// ============================================================
function updateStats() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('levelDisplay').textContent = difficulty;
}

function renderHearts() {
  const el = document.getElementById('heartsDisplay');
  el.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const h = document.createElement('span');
    h.className = 'heart' + (i >= lives ? ' lost' : '');
    h.textContent = '❤️';
    el.appendChild(h);
  }
}

function updateProgress() {
  const pct = (currentQuestion / TOTAL_QUESTIONS) * 100;
  document.getElementById('progressBar').style.width = pct + '%';
}

function setBubble(msg) {
  document.getElementById('bubble').textContent = msg;
}

function startBubbleLoop() {
  stopBubbleLoop();
  bubbleInterval = setInterval(() => {
    if (!answered) setBubble(BUBBLE_MSGS_WAIT[Math.floor(Math.random() * BUBBLE_MSGS_WAIT.length)]);
  }, 5000);
}
function stopBubbleLoop() {
  if (bubbleInterval) clearInterval(bubbleInterval);
}

// ============================================================
// PARTICLES & CONFETTI
// ============================================================
function spawnParticles(btn) {
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const emojis = ['⭐','🌟','✨','🎉','💫','🎊'];

  for (let i = 0; i < 7; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = Math.random() * 2 * Math.PI;
    const dist = 60 + Math.random() * 80;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    p.style.setProperty('--dy', (Math.sin(angle) * dist - 40) + 'px');
    p.style.animationDelay = (Math.random() * 0.2) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#FFD93D','#6EC6F5','#FF6B6B','#95E1D3','#F38181','#A8E6CF','#FFECD2'];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-20px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animationDuration = (1.5 + Math.random() * 2.5) + 's';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    piece.style.width = (8 + Math.random() * 10) + 'px';
    piece.style.height = (8 + Math.random() * 10) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}

// ============================================================
// UTILS
// ============================================================
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================
// START
// ============================================================

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0; // لإعادة الصوت للبداية إذا ضغط المستخدم بسرعة
        sound.play();
    }
}
init();

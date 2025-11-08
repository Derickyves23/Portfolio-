// script.js - calculatrice améliorée avec interaction clavier
const display = document.getElementById('display');
const buttons = document.querySelectorAll('.buttons button');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

let resetNext = false;    
let lastResult = null;    
let memory = JSON.parse(localStorage.getItem('calc_memory') || '0'); 

// --- initialisation : charger historique et mémoire
loadHistory();
loadMemory();

// --- clics souris
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.getAttribute('data-action');
    const val = btn.getAttribute('data-value');

    if (action) {
      handleAction(action);
    } else if (val !== null) {
      handleValue(val);
    }
  });
});

// --- interaction clavier ---
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if (/^[0-9]$/.test(key)) {
    handleValue(key);
  } 
  else if (['+', '-', '*', '/','(',')','.'].includes(key)) {
    handleValue(key);
  } 
  else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    handleAction('equals');
  } 
  else if (key === 'Backspace') {
    e.preventDefault();
    handleAction('back');
  } 
  else if (key === 'Escape') {
    e.preventDefault();
    handleAction('clear');
  }
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem('calculs');
  while (historyList.firstChild) historyList.removeChild(historyList.firstChild);
});

// ---------- gestion des valeurs ----------
function handleValue(value) {
  if (resetNext) {
    if (/^[0-9.]$/.test(value)) {
      display.value = '';
      resetNext = false;
    } else {
      resetNext = false;
    }
  }
  display.value += value;
}

// ---------- gestion des actions ----------
function handleAction(action) {
  switch(action) {
    case 'clear':
      display.value = '';
      resetNext = false;
      break;
    case 'back':
      display.value = display.value.slice(0, -1);
      break;
    case 'equals':
      doEquals();
      break;
    case 'percent':
      applyPercent();
      break;
    case 'toggle-sign':
      toggleSign();
      break;
    case 'mplus':
      memoryAdd();
      break;
    case 'mminus':
      memorySub();
      break;
    case 'mr':
      memoryRecall();
      break;
    case 'mc':
      memoryClear();
      break;
  }
}

// ---------- opérations principales ----------
function doEquals() {
  const expr = display.value.trim();

  if ((expr === '' || resetNext) && lastResult !== null) {
    display.value = String(lastResult);
    resetNext = true;
    return;
  }

  let cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/');
  cleaned = cleaned.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

  if (!/^[0-9+\-*/().\s%]+$/.test(expr)) {
    display.value = 'Erreur';
    resetNext = true;
    return;
  }

  try {
    const result = eval(cleaned);
    const formatted = formatResult(result);
    display.value = formatted;
    lastResult = Number(result);
    resetNext = true;
    saveCalculation(expr, formatted);
    addToHistory(expr, formatted);
  } catch {
    display.value = 'Erreur';
    resetNext = true;
  }
}

function formatResult(r) {
  if (!isFinite(r)) return 'Erreur';
  if (Math.abs(Math.round(r) - r) < 1e-12) return String(Math.round(r));
  return String(Number(r.toPrecision(12))).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
}

// ---------- fonctionnalités avancées ----------
function applyPercent() {
  const expr = display.value;
  if (expr === '') return;
  const m = expr.match(/(.*?)(-?\d+(\.\d+)?)\s*$/);
  if (m) {
    const before = m[1] || '';
    const num = m[2];
    display.value = before + '(' + num + '/100)';
  }
}

function toggleSign() {
  const expr = display.value;
  const m = expr.match(/(.*?)(\(?-?\d+(\.\d+)?\)?)\s*$/);
  if (!m) return;
  const before = m[1] || '';
  let tok = m[2];
  tok = tok.replace(/^\(|\)$/g, '');
  if (tok.startsWith('-')) {
    tok = tok.slice(1);
  } else {
    tok = '-' + tok;
  }
  display.value = before + tok;
}

// ---------- mémoire ----------
function saveMemory(value) {
  memory = Number(value) || 0;
  localStorage.setItem('calc_memory', JSON.stringify(memory));
}
function loadMemory() {
  memory = Number(localStorage.getItem('calc_memory') || 0);
}
function memoryAdd() {
  const v = Number(display.value);
  if (!isNaN(v)) {
    memory = (Number(memory) || 0) + v;
    saveMemory(memory);
  }
}
function memorySub() {
  const v = Number(display.value);
  if (!isNaN(v)) {
    memory = (Number(memory) || 0) - v;
    saveMemory(memory);
  }
}
function memoryRecall() {
  display.value += String(memory);
  resetNext = false;
}
function memoryClear() {
  memory = 0;
  localStorage.setItem('calc_memory', JSON.stringify(memory));
}

// ---------- historique ----------
function saveCalculation(expression, result) {
  const history = JSON.parse(localStorage.getItem('calculs') || '[]');
  history.push({ expression, result, t: Date.now() });
  localStorage.setItem('calculs', JSON.stringify(history.slice(-100)));
}
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('calculs') || '[]');
  history.forEach(entry => {
    addToHistoryElement(entry.expression, entry.result);
  });
}
function addToHistory(expr, result) {
  addToHistoryElement(expr, result);
}
function addToHistoryElement(expr, result) {
  const li = document.createElement('li');
  li.textContent = `${expr} = ${result}`;
  historyList.appendChild(li);
}
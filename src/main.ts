import { parseJson } from './core/parse.js';
import { pretty, minify } from './core/stringify.js';
import { highlightJson } from './highlight/highlight.js';
import { buildTree } from './render/treeBuilder.js';
import { CollapseState } from './render/collapseState.js';
import { renderTree } from './render/treeView.js';

const inputEl = document.getElementById('input') as HTMLTextAreaElement;
const outputEl = document.getElementById('output') as HTMLPreElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;
const formatBtn = document.getElementById('formatBtn') as HTMLButtonElement;
const minifyBtn = document.getElementById('minifyBtn') as HTMLButtonElement;
const copyPrettyBtn = document.getElementById('copyPrettyBtn') as HTMLButtonElement | null;
const copyMinBtn = document.getElementById('copyMinBtn') as HTMLButtonElement | null;
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement | null;
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
const historySelect = document.getElementById('historySelect') as HTMLSelectElement | null;
const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
const loadFileBtn = document.getElementById('loadFileBtn') as HTMLButtonElement | null;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement | null;
const treeEl = document.getElementById('tree') as HTMLDivElement;
const tabButtons = Array.from(document.querySelectorAll('.vt-btn')) as HTMLButtonElement[];
const dragOverlay = document.getElementById('dragOverlay') as HTMLDivElement | null;

const collapse = new CollapseState();
let lastData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
const HISTORY_KEY = 'jb_history_v1';
const THEME_KEY = 'jb_theme';
const MAX_HISTORY = 5;
let worker: Worker | null = null;
let pendingParseId: string | null = null;
const WORKER_THRESHOLD = 1_000_000; // bytes aproximados (~1MB)

function updateStatus(text: string, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function formatCurrent() {
  const raw = inputEl.value;
  parseSmart(raw, (result) => {
    if (result.error) {
      updateStatus(`Error línea ${result.error.line}, col ${result.error.column}: ${result.error.message}`, true);
      outputEl.textContent = '';
      return;
    }
    if (result.data !== undefined) {
      lastData = result.data;
      const formatted = pretty(lastData, { indent: 2 });
      outputEl.innerHTML = highlightJson(formatted);
      renderCurrentTree();
      storeHistory(raw);
      updateStatus(`Válido | profundidad: ${result.metrics.depth} | tamaño: ${result.metrics.sizeBytes} bytes | parse: ${result.metrics.parseTimeMs.toFixed(1)}ms`);
    }
  });
}

function minifyCurrent() {
  const raw = inputEl.value;
  parseSmart(raw, (result) => {
    if (result.error) {
      updateStatus(`Error línea ${result.error.line}, col ${result.error.column}: ${result.error.message}`, true);
      outputEl.textContent = '';
      return;
    }
    if (result.data !== undefined) {
      lastData = result.data;
      const compact = minify(lastData);
      outputEl.innerHTML = highlightJson(compact);
      renderCurrentTree();
      storeHistory(raw);
      updateStatus(`Válido (min) | tamaño: ${compact.length} chars`);
    }
  });
}

formatBtn.addEventListener('click', formatCurrent);
minifyBtn.addEventListener('click', minifyCurrent);

// Validación automática con debounce
let timer: number | undefined;
inputEl.addEventListener('input', () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    if (!inputEl.value.trim()) {
  outputEl.textContent = '';
      updateStatus('');
      treeEl.innerHTML = '';
      return;
    }
    const result = parseJson(inputEl.value);
    if (result.error) {
      updateStatus(`Error línea ${result.error.line}, col ${result.error.column}`, true);
    } else {
      updateStatus('JSON potencialmente válido');
    }
  }, 350);
});

function renderCurrentTree() {
  if (lastData === undefined) return;
  try {
    const tree = buildTree(lastData);
  treeEl.innerHTML = renderTree(tree, { collapse });
  enhanceTreeAccessibility();
  } catch (e) {
    treeEl.textContent = 'Error al generar árbol';
  }
}

treeEl.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('tw-toggle')) {
    const path = target.getAttribute('data-path');
    if (path) {
      collapse.toggle(path);
      renderCurrentTree();
    }
  }
});

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.toggle('active', b === btn));
    const view = btn.dataset.view;
    if (view === 'text') {
      outputEl.hidden = false;
      treeEl.hidden = true;
    } else {
      outputEl.hidden = true;
      treeEl.hidden = false;
      renderCurrentTree();
    }
  });
});

// --- Sprint 4 features ---
function safe<T>(el: T | null): el is T { return !!el; }

function storeHistory(text: string) {
  if (!safe(localStorage)) return;
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!text.trim()) return;
    arr.unshift(text);
    const dedup = Array.from(new Set(arr)).slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(dedup));
    refreshHistoryOptions();
  } catch {/* ignore */}
}

function refreshHistoryOptions() {
  if (!historySelect) return;
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    historySelect.innerHTML = '<option value="">Historial</option>' + arr.map((_,i)=>`<option value="${i}">Item ${i+1}</option>`).join('');
  } catch {/* ignore */}
}

historySelect?.addEventListener('change', () => {
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const idx = Number(historySelect.value);
    if (!isNaN(idx) && arr[idx]) {
      inputEl.value = arr[idx];
      formatCurrent();
    }
  } catch {/* ignore */}
});

copyPrettyBtn?.addEventListener('click', () => {
  if (lastData === undefined) return;
  navigator.clipboard.writeText(pretty(lastData, { indent: 2 }));
  updateStatus('Copiado (pretty)');
});

copyMinBtn?.addEventListener('click', () => {
  if (lastData === undefined) return;
  navigator.clipboard.writeText(minify(lastData));
  updateStatus('Copiado (min)');
});

exportBtn?.addEventListener('click', () => {
  const content = inputEl.value;
  if (!content.trim()) return;
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

loadFileBtn?.addEventListener('click', () => fileInput?.click());
fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  file.text().then(t => { inputEl.value = t; formatCurrent(); });
});

['dragenter','dragover'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); dragOverlay?.classList.add('active'); }));
['dragleave','drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev==='drop') handleDrop(e as DragEvent); dragOverlay?.classList.remove('active'); }));
function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  if (!file.name.endsWith('.json')) { updateStatus('Archivo no es .json', true); return; }
  file.text().then(t => { inputEl.value = t; formatCurrent(); });
}

searchInput?.addEventListener('input', () => {
  if (lastData === undefined) return;
  const q = searchInput.value.trim();
  const formatted = pretty(lastData, { indent: 2 });
  if (!q) { outputEl.innerHTML = highlightJson(formatted); return; }
  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`);
  const regex = new RegExp(safeQ, 'gi');
  const marked = formatted.replace(regex, m => `__MARK__${m}__ENDMARK__`);
  let html = highlightJson(marked);
  html = html.replace(/__MARK__(.*?)__ENDMARK__/g, (_,p)=>`<mark class="highlight-match">${p}</mark>`);
  outputEl.innerHTML = html;
});

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {/* ignore */}
}
themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(current);
});
try {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) applyTheme(savedTheme);
} catch {/* ignore */}
refreshHistoryOptions();

// Worker parse logic
function ensureWorker() {
  if (!worker) {
    worker = new Worker(new URL('./workers/parser.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (ev: MessageEvent<any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = ev.data;
      if (!msg || msg.id !== pendingParseId) return;
      pendingParseId = null;
      if (msg.ok) {
        parseCallback && parseCallback({ data: msg.data, metrics: msg.metrics });
      } else {
        parseCallback && parseCallback({ metrics: msg.error.metrics ?? { parseTimeMs: 0, depth: 0, sizeBytes: 0 }, error: msg.error });
      }
      parseCallback = null;
      updateStatus('Parse completado');
    });
  }
}

interface SmartParseResult { data?: any; metrics: { parseTimeMs:number; depth:number; sizeBytes:number }; error?: { message:string; line:number; column:number; snippet?:string }; } // eslint-disable-line @typescript-eslint/no-explicit-any
let parseCallback: ((r: SmartParseResult) => void) | null = null;
function parseSmart(text: string, cb: (r: SmartParseResult) => void) {
  // Decidir si usar worker por tamaño (bytes ~ length utf-16 aproxima)
  if (new Blob([text]).size > WORKER_THRESHOLD) {
    ensureWorker();
    pendingParseId = crypto.randomUUID();
    parseCallback = cb;
    updateStatus('Parse (worker)…');
    worker!.postMessage({ id: pendingParseId, json: text });
  } else {
    const result = parseJson(text);
    cb(result as any); // compatible contrato
  }
}

// Accessibility / keyboard navigation for tree
function enhanceTreeAccessibility() {
  const rows = Array.from(treeEl.querySelectorAll('.tw-line')) as HTMLElement[];
  rows.forEach(r => r.setAttribute('role', 'treeitem'));
  let focusIndex = 0;
  if (!rows.length) return;
  rows.forEach(r => r.tabIndex = -1);
  rows[0].tabIndex = 0;
  treeEl.addEventListener('keydown', (e) => {
    if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter',' '].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowDown' && focusIndex < rows.length - 1) focusIndex++;
    else if (e.key === 'ArrowUp' && focusIndex > 0) focusIndex--;
    else if (e.key === 'ArrowRight') {
      const toggle = rows[focusIndex].querySelector('.tw-toggle') as HTMLElement | null;
      if (toggle && toggle.textContent === '▶') { toggle.click(); }
    } else if (e.key === 'ArrowLeft') {
      const toggle = rows[focusIndex].querySelector('.tw-toggle') as HTMLElement | null;
      if (toggle && toggle.textContent === '▼') { toggle.click(); }
    } else if (e.key === 'Enter' || e.key === ' ') {
      const toggle = rows[focusIndex].querySelector('.tw-toggle') as HTMLElement | null;
      if (toggle) toggle.click();
    }
    rows.forEach(r => r.tabIndex = -1);
    rows[focusIndex].tabIndex = 0;
    rows[focusIndex].focus();
  }, { once: true });
}

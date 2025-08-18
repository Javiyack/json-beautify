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
const treeEl = document.getElementById('tree') as HTMLDivElement;
const tabButtons = Array.from(document.querySelectorAll('.vt-btn')) as HTMLButtonElement[];

const collapse = new CollapseState();
let lastData: any; // eslint-disable-line @typescript-eslint/no-explicit-any

function updateStatus(text: string, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function formatCurrent() {
  const raw = inputEl.value;
  const result = parseJson(raw);
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
    updateStatus(`Válido | profundidad: ${result.metrics.depth} | tamaño: ${result.metrics.sizeBytes} bytes | parse: ${result.metrics.parseTimeMs.toFixed(1)}ms`);
  }
}

function minifyCurrent() {
  const raw = inputEl.value;
  const result = parseJson(raw);
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
    updateStatus(`Válido (min) | tamaño: ${compact.length} chars`);
  }
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

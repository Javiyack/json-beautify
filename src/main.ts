import { parseJson } from './core/parse.js';
import { pretty, minify } from './core/stringify.js';
import { highlightJson } from './highlight/highlight.js';

const inputEl = document.getElementById('input') as HTMLTextAreaElement;
const outputEl = document.getElementById('output') as HTMLPreElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;
const formatBtn = document.getElementById('formatBtn') as HTMLButtonElement;
const minifyBtn = document.getElementById('minifyBtn') as HTMLButtonElement;

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
    const formatted = pretty(result.data, { indent: 2 });
  outputEl.innerHTML = highlightJson(formatted);
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
    const compact = minify(result.data);
  outputEl.innerHTML = highlightJson(compact);
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

import { tokenize } from './tokenizer.js';
import { darkTheme } from './theme.js';

export function highlightJson(json: string): string {
  const tokens = tokenize(json);
  let html = '';
  for (const t of tokens) {
    if (t.type === 'whitespace') { html += t.value; continue; }
    const cls = darkTheme[t.type] || 'color-other';
    const escaped = escapeHtml(t.value);
    html += `<span class="${cls}">${escaped}</span>`;
  }
  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

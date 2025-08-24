import { calcDepth, byteSize } from './analyzer.js';
import type { ParseResult, ParseError } from './types.js';

export interface ParseOptions { tolerant?: boolean }

// Parse wrapper que captura línea y columna aproximadas al fallar
export function parseJson(input: string, options: ParseOptions = {}): ParseResult {
  const start = performance.now();
  let working = input;
  if (options.tolerant) {
    // Eliminar comentarios // y /* */ y comas finales simples a nivel básico
    working = working
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/,\s*([}\]])/g, '$1');
  }
  try {
    const data = JSON.parse(working);
    const metrics = {
      parseTimeMs: performance.now() - start,
      depth: calcDepth(data),
      sizeBytes: byteSize(input)
    };
    return { data, metrics };
  } catch (e) {
    const err = e as Error;
    const { line, column } = locateJsonError(working, err.message);
    const snippet = extractSnippet(working, line, column);
    const suggestion = deriveSuggestion(err.message, snippet);
    const metrics = {
      parseTimeMs: performance.now() - start,
      depth: 0,
      sizeBytes: byteSize(input)
    };
    const error: ParseError = { message: err.message, line, column, snippet, suggestion };
    return { metrics, error };
  }
}

// Intenta inferir línea y columna a partir del mensaje y re-parse incrementalmente si no se encuentra.
function locateJsonError(input: string, message: string): { line: number; column: number } {
  // Algunos navegadores incluyen 'at position N'
  const match = message.match(/position (\d+)/i);
  if (match) {
    const pos = Number(match[1]);
    return offsetToLineCol(input, pos);
  }
  // Fallback burdo: intentar truncar y parsear incrementalmente (binary search)
  let low = 0;
  let high = input.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const partial = input.slice(0, mid);
    try {
      JSON.parse(partial);
      low = mid + 1; // todavía válido, mover adelante
    } catch {
      high = mid - 1; // error antes
    }
  }
  return offsetToLineCol(input, low);
}

function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  const lines = text.slice(0, offset).split(/\n/);
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function extractSnippet(text: string, line: number, column: number, radius = 30): string {
  const lines = text.split(/\n/);
  const target = lines[line - 1] || '';
  const start = Math.max(0, column - 1 - radius);
  return target.slice(start, start + radius * 2);
}

function deriveSuggestion(message: string, snippet?: string): string | undefined {
  if (/unexpected token/i.test(message) && snippet) {
    if (/['\"]$/.test(snippet.trim())) return 'Revisa comillas sin cerrar.';
    if (/[:,]$/.test(snippet.trim())) return 'Puede haber un valor faltante tras coma o dos puntos.';
  }
  if (/position \d+/i.test(message)) return 'Verifica comas finales y comillas emparejadas.';
  if (/invalid character/i.test(message)) return 'Elimina caracteres no válidos o comentarios.';
  return undefined;
}

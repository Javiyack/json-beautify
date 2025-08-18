// Funciones para pretty / minify
export interface StringifyOptions {
  indent?: number | '\t';
}

export function pretty(obj: unknown, options: StringifyOptions = {}): string {
  const indent = options.indent === '\t' ? '\t' : typeof options.indent === 'number' ? options.indent : 2;
  return JSON.stringify(obj, null, indent);
}

export function minify(obj: unknown): string {
  return JSON.stringify(obj);
}

// Utilidades para analizar profundidad y conteos
export function calcDepth(value: unknown, maxDepth = 0): number {
  if (value === null || typeof value !== 'object') return maxDepth;
  const stack: Array<{ v: any; d: number }> = [{ v: value, d: 1 }]; // eslint-disable-line @typescript-eslint/no-explicit-any
  let depth = 0;
  while (stack.length) {
    const { v, d } = stack.pop()!;
    if (d > depth) depth = d;
    if (v && typeof v === 'object') {
      for (const k in v) {
        if (Object.prototype.hasOwnProperty.call(v, k)) {
          const child = (v as any)[k]; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (child && typeof child === 'object') stack.push({ v: child, d: d + 1 });
        }
      }
      if (Array.isArray(v)) {
        for (const child of v) {
          if (child && typeof child === 'object') stack.push({ v: child, d: d + 1 });
        }
      }
    }
  }
  return depth;
}

export function byteSize(str: string): number {
  // UTF-8 approximate size
  let size = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.charCodeAt(i);
    if (codePoint < 0x80) size += 1;
    else if (codePoint < 0x800) size += 2;
    else if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      // surrogate pair
      size += 4;
      i++; // skip low surrogate
    } else size += 3;
  }
  return size;
}

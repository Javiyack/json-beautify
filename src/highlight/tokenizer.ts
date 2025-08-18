export type TokenType = 'brace' | 'bracket' | 'colon' | 'comma' | 'key' | 'string' | 'number' | 'boolean' | 'null' | 'whitespace' | 'punctuation';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

// Tokenizador simple asume JSON válido (se llama tras parse o sobre pretty string)
export function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const push = (type: TokenType, start: number, end: number) => {
    tokens.push({ type, value: json.slice(start, end), start, end });
  };
  while (i < json.length) {
    const ch = json[i];
    const start = i;
    if (/\s/.test(ch)) {
      i++;
      while (i < json.length && /\s/.test(json[i])) i++;
      push('whitespace', start, i);
      continue;
    }
    switch (ch) {
      case '{': case '}': push('brace', start, ++i); continue;
      case '[': case ']': push('bracket', start, ++i); continue;
      case ':': push('colon', start, ++i); continue;
      case ',': push('comma', start, ++i); continue;
      case '"': {
        i++;
        let isEscaped = false;
        while (i < json.length) {
          const c = json[i++];
            if (isEscaped) { isEscaped = false; continue; }
            if (c === '\\') { isEscaped = true; continue; }
            if (c === '"') break;
        }
        push('string', start, i);
        continue;
      }
      default: {
        // number, boolean, null
        let j = i + 1;
        while (j < json.length && /[0-9eE+\-.a-zA-Z]/.test(json[j])) j++;
        const segment = json.slice(i, j);
        let type: TokenType = 'number';
        if (segment === 'true' || segment === 'false') type = 'boolean';
        else if (segment === 'null') type = 'null';
        else if (!/^[-+]?\d/.test(segment)) type = 'punctuation';
        push(type, start, j);
        i = j;
        continue;
      }
    }
  }
  // Derivar claves: una string seguida de ':' sin salto intermedio -> key
  for (let k = 0; k < tokens.length - 1; k++) {
    const t = tokens[k];
    if (t.type === 'string') {
      // buscar colon ignorando whitespace
      let n = k + 1;
      while (n < tokens.length && tokens[n].type === 'whitespace') n++;
      if (tokens[n] && tokens[n].type === 'colon') {
        t.type = 'key';
      }
    }
  }
  return tokens;
}

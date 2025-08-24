// Lightweight Scala syntax highlighter -> HTML spans with classes styled via CSS (Atom One Dark inspired)
// Not a full parser; aims to cover comments, strings (incl. triple), chars, annotations, keywords, types, numbers.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type Seg = { kind: 'code' | 'comment' | 'string' | 'char'; text: string };

const KEYWORDS = new Set([
  'abstract','case','catch','class','def','do','else','extends','false','final','finally','for','forSome','if','implicit','import','lazy','match','new','null','object','override','package','private','protected','return','sealed','super','this','throw','trait','try','true','type','val','var','while','with','yield'
]);
const TYPES = new Set([
  'Int','Long','Double','Float','Boolean','Char','String','Unit','Any','AnyRef','AnyVal','Nothing','Option','Some','None','Either','Left','Right','List','Seq','Map','Set','Vector'
]);

function highlightCodeSegment(seg: string): string {
  // order matters: annotations -> keywords -> types -> numbers
  let t = seg;
  // annotations @Something or @something
  t = t.replace(/(@[A-Za-z_][A-Za-z0-9_]*)/g, '<span class="sc-annotation">$1</span>');
  // keywords (word boundaries)
  t = t.replace(/\b([a-z_][a-z0-9_]*)\b/gi, (m) => KEYWORDS.has(m) ? `<span class="sc-keyword">${m}</span>` : m);
  // types (capitalized identifiers)
  t = t.replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, (m) => TYPES.has(m) ? `<span class="sc-type">${m}</span>` : m);
  // numbers (hex or decimal with optional fraction and exponent)
  t = t.replace(/\b0[xX][0-9a-fA-F]+\b|\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+)?\b/g, '<span class="sc-number">$&</span>');
  return t;
}

export function highlightScala(code: string): string {
  const src = escapeHtml(code);
  const segs: Seg[] = [];
  const tokenRe = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)'/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  // Extract protected tokens (comments/strings/chars)
  while ((m = tokenRe.exec(src))) {
    if (m.index > lastIndex) {
      segs.push({ kind: 'code', text: src.slice(lastIndex, m.index) });
    }
    const tok = m[0];
    if (tok.startsWith('/*') || tok.startsWith('//')) {
      segs.push({ kind: 'comment', text: tok });
    } else if (tok.startsWith("'")) {
      segs.push({ kind: 'char', text: tok });
    } else {
      segs.push({ kind: 'string', text: tok });
    }
    lastIndex = m.index + tok.length;
  }
  if (lastIndex < src.length) segs.push({ kind: 'code', text: src.slice(lastIndex) });

  const out = segs.map(s => {
    switch (s.kind) {
      case 'comment': return `<span class="sc-comment">${s.text}</span>`;
      case 'string': return `<span class="sc-string">${s.text}</span>`;
      case 'char': return `<span class="sc-string">${s.text}</span>`; // reuse string color
      default: return highlightCodeSegment(s.text);
    }
  }).join('');

  return `<code class="lang-scala">${out}</code>`;
}

export default highlightScala;

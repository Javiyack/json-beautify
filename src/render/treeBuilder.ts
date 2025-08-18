export type NodeKind = 'object' | 'array' | 'value';

export interface TreeNode {
  kind: NodeKind;
  key?: string; // clave en el padre
  path: string; // ruta tipo a.b[0]
  value?: unknown; // para value
  children?: TreeNode[]; // para object/array
  typeLabel: string; // hint para UI
  size?: number; // nº de hijos si object/array
}

export interface BuildOptions { maxNodes?: number }

// Construcción iterativa para evitar desbordes de stack en objetos profundos
export function buildTree(root: unknown, options: BuildOptions = {}): TreeNode {
  const max = options.maxNodes ?? 200_000;
  let produced = 0;
  const rootNode: TreeNode = describeNode(root, 'root');
  const stack: Array<{ value: unknown; node: TreeNode }> = [{ value: root, node: rootNode }];
  while (stack.length) {
    const { value, node } = stack.pop()!;
    if (produced++ > max) break;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        node.children = [];
        for (let i = value.length - 1; i >= 0; i--) {
          const childVal = value[i];
          const childNode = describeNode(childVal, `${node.path}[${i}]`, String(i));
          node.children.unshift(childNode);
          stack.push({ value: childVal, node: childNode });
        }
      } else {
        node.children = [];
        const entries = Object.entries(value as Record<string, unknown>);
        for (let i = entries.length - 1; i >= 0; i--) {
          const [k, v] = entries[i];
            const childNode = describeNode(v, `${node.path}.${k}`, k);
            node.children.unshift(childNode);
            stack.push({ value: v, node: childNode });
        }
      }
      node.size = node.children.length;
    }
  }
  return rootNode;
}

function describeNode(value: unknown, path: string, key?: string): TreeNode {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return { kind: 'array', key, path, typeLabel: `Array(${value.length})`, size: value.length };
    }
    const size = Object.keys(value as object).length;
    return { kind: 'object', key, path, typeLabel: `Object(${size})`, size };
  }
  const typeLabel = value === null ? 'null' : typeof value;
  return { kind: 'value', key, path, value, typeLabel };
}

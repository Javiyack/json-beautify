/// <reference lib="webworker" />
import { calcDepth, byteSize } from '../core/analyzer.js';

interface WorkerRequest { id: string; json: string; }
interface WorkerSuccess { id: string; ok: true; data: any; metrics: { parseTimeMs:number; depth:number; sizeBytes:number } } // eslint-disable-line @typescript-eslint/no-explicit-any
interface WorkerError { id: string; ok: false; error: { message: string; line: number; column: number; snippet?: string } }

self.addEventListener('message', (ev: MessageEvent<WorkerRequest>) => {
  const { id, json } = ev.data;
  const start = performance.now();
  try {
    const data = JSON.parse(json);
    const metrics = { parseTimeMs: performance.now() - start, depth: calcDepth(data), sizeBytes: byteSize(json) };
    const msg: WorkerSuccess = { id, ok: true, data, metrics };
    // @ts-ignore
    self.postMessage(msg);
  } catch (e) {
    const err = e as Error;
    const posMatch = err.message.match(/position (\d+)/i);
    let line = 1, column = 1;
    if (posMatch) {
      const pos = Number(posMatch[1]);
      const upTo = json.slice(0, pos).split(/\n/);
      line = upTo.length; column = upTo[upTo.length - 1].length + 1;
    }
    const snippet = json.split(/\n/)[line - 1]?.slice(column - 20, column + 20);
    const msg: WorkerError = { id, ok: false, error: { message: err.message, line, column, snippet } };
    // @ts-ignore
    self.postMessage(msg);
  }
});

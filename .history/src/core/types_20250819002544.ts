export interface ParseMetrics {
  parseTimeMs: number;
  depth: number;
  sizeBytes: number;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  snippet?: string;
}

export interface ParseResult {
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  metrics: ParseMetrics;
  error?: ParseError;
}

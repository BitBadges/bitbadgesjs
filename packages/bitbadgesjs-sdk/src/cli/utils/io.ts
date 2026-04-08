import * as fs from 'fs';

/**
 * Read JSON input from multiple sources:
 * - File path: `tx.json` or `@tx.json`
 * - Inline JSON string: `'{"messages":[...]}'`
 * - Stdin: `-`
 */
export function readJsonInput(input: string): any {
  let raw: string;

  if (input === '-') {
    raw = fs.readFileSync(0, 'utf-8');
  } else if (input.startsWith('{') || input.startsWith('[') || input.startsWith('"')) {
    // Inline JSON
    raw = input;
  } else {
    // File path (strip leading @ if present)
    const filePath = input.startsWith('@') ? input.slice(1) : input;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    raw = fs.readFileSync(filePath, 'utf-8');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse JSON input. Accepts: file path, @file.json, inline JSON string, or - for stdin.');
  }
}

/**
 * Output data as JSON (pretty-printed by default) or human-readable text.
 *
 * --condensed: no whitespace (for piping/scripts)
 * --human: human-readable tree format
 * default: pretty-printed JSON (2-space indent)
 */
export function output(data: any, options: { human?: boolean; condensed?: boolean }): void {
  if (options.human) {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(formatHuman(data));
    }
  } else if (options.condensed) {
    console.log(JSON.stringify(data));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

function formatHuman(obj: any, indent = 0): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '(empty)';
    return obj.map((item, i) => `${' '.repeat(indent)}[${i}] ${formatHuman(item, indent + 2)}`).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, val]) => {
        const valStr = typeof val === 'object' && val !== null ? '\n' + formatHuman(val, indent + 2) : ` ${formatHuman(val, indent + 2)}`;
        return `${' '.repeat(indent)}${key}:${valStr}`;
      })
      .join('\n');
  }

  return String(obj);
}

/**
 * Resolve the API URL from CLI flags and environment variables.
 *
 * Priority: --url > --local > --testnet > BITBADGES_API_URL env > default production URL.
 */
export function getApiUrl(options: { testnet?: boolean; local?: boolean; url?: string }): string {
  if (options.url) {
    return options.url;
  }
  if (options.local) {
    return 'http://localhost:3001';
  }
  if (options.testnet) {
    return 'https://api.testnet.bitbadges.io';
  }
  return process.env.BITBADGES_API_URL || 'https://api.bitbadges.io';
}

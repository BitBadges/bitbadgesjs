import * as fs from 'fs';

/**
 * Read JSON input from a file path, `@file.json` syntax, or stdin (`-`).
 */
export function readJsonInput(fileArg: string): any {
  let raw: string;

  if (fileArg === '-') {
    // Read from stdin
    raw = fs.readFileSync(0, 'utf-8');
  } else {
    // Strip leading @ if present
    const filePath = fileArg.startsWith('@') ? fileArg.slice(1) : fileArg;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    raw = fs.readFileSync(filePath, 'utf-8');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse JSON input');
  }
}

/**
 * Output data as JSON or human-readable text.
 */
export function output(data: any, options: { human?: boolean }): void {
  if (options.human) {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(formatHuman(data));
    }
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
 * Priority: --local > --testnet > BITBADGES_API_URL env > default production URL.
 */
export function getApiUrl(options: { testnet?: boolean; local?: boolean }): string {
  if (options.local) {
    return 'http://localhost:3001';
  }
  if (options.testnet) {
    return 'https://api.testnet.bitbadges.io';
  }
  return process.env.BITBADGES_API_URL || 'https://api.bitbadges.io';
}

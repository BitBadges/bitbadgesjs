/**
 * Shared `--message` / `--message-file` plumbing (ticket 0411).
 *
 * The "use the inline string, else slurp the file ('-' = stdin)"
 * resolution was re-implemented in `auth.ts` and `sign-with-browser.ts`
 * (`deploy.ts` forwards to the latter). `readStringOrFile` is that
 * shared core. `addMessageOptions` is the matching flag attacher —
 * idempotent and tagged into the CALLER's help group (descriptions are
 * caller-supplied since the wording differs per command: "message to
 * sign" vs "challenge message that was signed").
 */
import fs from 'fs';
import type { Command } from 'commander';
import { tagHelpGroups } from './help-groups.js';

/**
 * Resolve an inline string OR a file path ('-' → stdin). Returns
 * `undefined` when neither is provided (callers layer their own
 * positional / stdin-fallback / required-error on top, as before).
 */
export function readStringOrFile(inline?: string, filePath?: string): string | undefined {
  if (inline) return inline;
  if (filePath) {
    if (filePath === '-') return fs.readFileSync(0, 'utf-8');
    return fs.readFileSync(filePath, 'utf-8');
  }
  return undefined;
}

function addOptionIfMissing(cmd: Command, flags: string, description: string): Command {
  const longFlag = flags.match(/--[a-z][a-z0-9-]*/)?.[0];
  if (longFlag && (cmd as any)._findOption?.(longFlag)) return cmd;
  return cmd.option(flags, description);
}

/**
 * Attach `--message <text>` + `--message-file <path>` into the caller's
 * help group. Descriptions are caller-supplied (wording differs per
 * command); sensible defaults provided.
 */
export function addMessageOptions(
  cmd: Command,
  cfg: { group: string; messageDesc?: string; fileDesc?: string }
): Command {
  addOptionIfMissing(cmd, '--message <text>', cfg.messageDesc ?? 'The message (inline)');
  addOptionIfMissing(cmd, '--message-file <path>', cfg.fileDesc ?? 'Read the message from a file ("-" for stdin)');
  tagHelpGroups(cmd, { '--message': cfg.group, '--message-file': cfg.group });
  return cmd;
}

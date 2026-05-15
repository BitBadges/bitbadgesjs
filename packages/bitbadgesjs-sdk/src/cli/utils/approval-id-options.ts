/**
 * Shared `--approval-id` flag + resolution (ticket 0418).
 *
 * `opts.approvalId ?? crypto.randomBytes(16).toString('hex')` was
 * re-implemented ≥6× (nfts bid/list, auctions, prediction-markets
 * buy/sell, intents), and two subscriptions sites generated a bare
 * random id with no override flag at all (couldn't be pinned for
 * replay). This is the one shared RNG + resolver.
 *
 * Group label is a caller param — the flag keeps its per-command help
 * slot (pass nothing to stay ungrouped, matching the existing sites).
 */
import { Command } from 'commander';
import * as crypto from 'node:crypto';
import { tagHelpGroups } from './help-groups.js';

export function addApprovalIdOption(
  cmd: Command,
  cfg: { group?: string; description?: string } = {}
): Command {
  const desc = cfg.description ?? 'Override the auto-generated approval id (random 16-byte hex by default)';
  if (!(cmd as any)._findOption?.('--approval-id')) {
    cmd.option('--approval-id <id>', desc);
  }
  if (cfg.group) tagHelpGroups(cmd, { '--approval-id': cfg.group });
  return cmd;
}

/** `--approval-id` if the user pinned one, else a fresh 16-byte hex id. */
export function resolveApprovalId(opts: { approvalId?: string }): string {
  return opts.approvalId ?? crypto.randomBytes(16).toString('hex');
}

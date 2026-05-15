/**
 * Unify the expiry flag spelling (ticket 0413).
 *
 * The same concept shipped as `--expiration` (7 sites in build.ts,
 * pass-through to offline builders) and `--expiry` (3 sites:
 * nfts bid/list, prediction-markets trade — parsed in-CLI). The PARSE
 * is already shared (`utils/time.ts` parseTimeFlag); 0413 is the
 * naming consolidation:
 *
 *  - canonical flag: `--expiration <when>`
 *  - `--expiry <when>` stays as a HIDDEN deprecated alias for one
 *    release (still works; warns once via emitDeprecation).
 *
 * Group label is a caller param (the ticket constraint — flags keep
 * their per-command help slot; pass nothing to stay ungrouped, which
 * is what the `--expiry` sites are today).
 */
import { Command, Option } from 'commander';
import { tagHelpGroups } from './help-groups.js';
import { parseTimeFlag } from './time.js';
import { emitDeprecation } from './deprecation.js';

export function addExpiryOption(
  cmd: Command,
  cfg: { group?: string; description?: string } = {}
): Command {
  const desc = cfg.description ?? 'Expiry: ms-since-epoch (1748140800000) or duration (7d, 24h, monthly).';
  if (!(cmd as any)._findOption?.('--expiration')) {
    cmd.option('--expiration <when>', desc);
  }
  // Deprecated alias — hidden from --help, still functional one release.
  if (!(cmd as any)._findOption?.('--expiry')) {
    cmd.addOption(new Option('--expiry <when>', 'Deprecated alias for --expiration').hideHelp());
  }
  if (cfg.group) tagHelpGroups(cmd, { '--expiration': cfg.group });
  return cmd;
}

/**
 * Canonical expiry resolution → bigint ms timestamp. Prefers
 * `--expiration`; `--expiry` is the deprecated alias (warns once).
 * Falls back to `now + defaultMs` when neither is set. The parse is
 * the shared `parseTimeFlag` (ms-since-epoch OR duration shorthand).
 */
export function resolveExpiry(
  opts: { expiration?: string; expiry?: string },
  defaultMs: number
): bigint {
  if (opts.expiry && !opts.expiration) emitDeprecation('--expiry', '--expiration');
  const raw = opts.expiration ?? opts.expiry;
  return raw ? parseTimeFlag(raw, '--expiration') : BigInt(Date.now() + defaultMs);
}

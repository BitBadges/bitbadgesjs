/**
 * Shared list/pagination plumbing for indexer-backed `list`/browse
 * commands (ticket 0409).
 *
 * Three pieces, each independently useful:
 *
 *  - `appendQuery` — the query-string builder that was copy-pasted
 *    file-local in balances/intents/pairs/pools/swap (byte-identical).
 *    Now one implementation.
 *  - `addListOptions` — opt-in pagination flag attacher. Mirrors
 *    `addDeployOptions`: idempotent (won't clobber a command's
 *    pre-declared flag) and tags flags into the **caller's** help group
 *    (NOT a separate "list" group — the ticket's hard constraint), so a
 *    command's `--help` layout is unchanged.
 *  - `resolvePageQuery` — maps the parsed opts into the query object.
 *    The sort-direction param name is endpoint-specific (`sortOrder`
 *    vs `sortDirection`), so it is configurable per call rather than
 *    forced to one shape (which would silently change query behavior).
 */
import type { Command } from 'commander';
import { tagHelpGroups } from './help-groups.js';

/** Append non-empty params as a query string. Single source of truth. */
export function appendQuery(
  path: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  if (!qs) return path;
  return path + (path.includes('?') ? '&' : '?') + qs;
}

function addOptionIfMissing(cmd: Command, flags: string, description: string, def?: string): Command {
  const longFlag = flags.match(/--[a-z][a-z0-9-]*/)?.[0];
  if (longFlag && (cmd as any)._findOption?.(longFlag)) return cmd;
  return def !== undefined ? cmd.option(flags, description, def) : cmd.option(flags, description);
}

export interface ListOptionsConfig {
  /** Help-group label this command already uses — flags join it. Required. */
  group: string;
  limit?: boolean;
  /** Add `--oldest-first` (boolean reverse toggle). */
  oldestFirst?: boolean;
  /** Add `--sort-by`; pass the choices/description string. */
  sortBy?: string;
  /**
   * Add a sort-direction flag. The flag + emitted query key differ by
   * endpoint, so the caller declares which: `'sortOrder'` →
   * `--sort-order`, `'sortDirection'` → `--sort-direction`.
   */
  sortDir?: 'sortOrder' | 'sortDirection';
}

/** Attach the requested pagination flags into the caller's help group. */
export function addListOptions(cmd: Command, cfg: ListOptionsConfig): Command {
  addOptionIfMissing(cmd, '--bookmark <b>', 'Pagination cursor from a previous response');
  const tags: Record<string, string> = { '--bookmark': cfg.group };
  if (cfg.limit) {
    addOptionIfMissing(cmd, '--limit <n>', 'Page size (indexer-enforced max applies)');
    tags['--limit'] = cfg.group;
  }
  if (cfg.oldestFirst) {
    addOptionIfMissing(cmd, '--oldest-first', 'Reverse the default newest-first sort', undefined);
    tags['--oldest-first'] = cfg.group;
  }
  if (cfg.sortBy) {
    addOptionIfMissing(cmd, '--sort-by <field>', cfg.sortBy);
    tags['--sort-by'] = cfg.group;
  }
  if (cfg.sortDir === 'sortOrder') {
    addOptionIfMissing(cmd, '--sort-order <dir>', 'asc | desc', 'desc');
    tags['--sort-order'] = cfg.group;
  } else if (cfg.sortDir === 'sortDirection') {
    addOptionIfMissing(cmd, '--sort-direction <dir>', 'Sort direction (asc | desc)');
    tags['--sort-direction'] = cfg.group;
  }
  tagHelpGroups(cmd, tags);
  return cmd;
}

export interface PageOpts {
  bookmark?: string;
  limit?: string;
  oldestFirst?: boolean;
  sortBy?: string;
  sortOrder?: string;
  sortDirection?: string;
}

/**
 * Map parsed opts → indexer query params. Only sets keys that are
 * present, so spreading the result into `appendQuery(endpoint, {...})`
 * is behavior-identical to the old hand-rolled `if (opts.x) q.x = ...`.
 */
export function resolvePageQuery(
  opts: PageOpts
): Record<string, string | undefined> {
  const q: Record<string, string | undefined> = {};
  if (opts.bookmark) q.bookmark = opts.bookmark;
  if (opts.limit) q.limit = opts.limit;
  if (opts.oldestFirst) q.oldestFirst = 'true';
  if (opts.sortBy) q.sortBy = opts.sortBy;
  if (opts.sortOrder) q.sortOrder = opts.sortOrder;
  if (opts.sortDirection) q.sortDirection = opts.sortDirection;
  return q;
}

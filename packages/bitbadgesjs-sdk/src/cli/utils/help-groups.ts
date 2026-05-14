import type { Command } from 'commander';

/**
 * Group headings rendered in `bb --help` for shared flag categories.
 * Order here = display order in the Options section. Per-command flags
 * (no group) always render first, then these in the order below.
 */
export const HELP_GROUP_ORDER = ['Metadata', 'Output', 'Network', 'Builder', 'Deploy'] as const;

/**
 * Tag already-attached options on a Command with a help group heading.
 * Commander stores it on `option.helpGroupHeading`; our `GroupedHelp`
 * formatter splits the Options section by it.
 *
 * Map keys must be the option's *long* flag (e.g. `--testnet`). Missing
 * flags are silently ignored — so callers can pass a superset and let
 * the per-command `addOptionIfMissing` filter decide what's actually
 * on the command.
 */
export function tagHelpGroups(cmd: Command, mapping: Record<string, string>): Command {
  for (const [flag, group] of Object.entries(mapping)) {
    const opt = (cmd as any)._findOption?.(flag);
    if (opt && typeof opt.helpGroup === 'function') {
      opt.helpGroup(group);
    }
  }
  return cmd;
}

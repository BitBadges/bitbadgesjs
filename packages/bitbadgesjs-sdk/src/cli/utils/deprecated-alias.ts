/**
 * Helpers for registering v1 → v2 deprecated aliases.
 *
 * The CLI v2 redesign (#0399) renames + relocates a handful of top-level
 * commands. Every old form stays reachable for one release as a thin
 * alias that emits a single stderr banner and delegates to the new
 * canonical command via `parseAsync`. After the release the aliases
 * hard-fail with a hint to the new form.
 *
 * Two flavors:
 *
 *   makeDeprecatedAlias({ oldName, newPath, target })
 *       — old top-level verb maps to a new top-level verb (no subcommand).
 *         Example: `bb sign-with-browser ...` → `bb deploy --browser ...`.
 *
 *   makeDeprecatedSubcommandAlias({ oldName, newPath, parent, subPath })
 *       — old top-level verb maps to a subcommand on a different parent.
 *         Example: `bb address convert <a>` → `bb account convert <a>`.
 *
 * Both helpers preserve unknown options / extra arguments so the user's
 * exact argv flows through to the new home.
 */

import { Command } from 'commander';
import { emitDeprecation } from './deprecation.js';

export interface DeprecatedAliasSpec {
  /** Old command name as it appears at the CLI top level. */
  oldName: string;
  /** New canonical form for the banner (e.g. "bb account all"). */
  newPath: string;
  /** Short description shown in --help if the alias surfaces there. */
  description?: string;
  /**
   * Argument forwarding rule. The action receives the raw `args` array
   * (post the command name) and should return the argv to dispatch
   * against the new home — usually `args` verbatim, or with extra
   * prefix tokens (e.g. `['--browser', ...args]` for sign-with-browser).
   */
  forward: (args: string[]) => string[];
  /**
   * Target command to dispatch into. Either a Commander Command
   * instance, or a lazy resolver (lets index.ts pass forward refs
   * without a circular import).
   */
  target: Command | (() => Command);
}

export function makeDeprecatedAlias(spec: DeprecatedAliasSpec): Command {
  const cmd = new Command(spec.oldName)
    .description(spec.description ?? `Deprecated alias — use \`${spec.newPath}\` instead.`)
    .helpOption(false)
    .allowUnknownOption()
    .allowExcessArguments()
    .argument('[args...]', `Forwarded to ${spec.newPath}`)
    .action(async (args: string[]) => {
      const argList = Array.isArray(args) ? args : [];
      emitDeprecation(`bb ${spec.oldName}`, spec.newPath);
      const forwarded = spec.forward(argList);
      const target = typeof spec.target === 'function' ? spec.target() : spec.target;
      await target.parseAsync(forwarded, { from: 'user' });
    });
  return cmd;
}

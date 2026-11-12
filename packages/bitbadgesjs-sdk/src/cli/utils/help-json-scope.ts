import type { Command } from 'commander';

/**
 * Resolve the leading subcommand path of a `--help-json` invocation
 * (`bb api tokens --help-json` -> [api, tokens]) so the emitted JSON tree can
 * be scoped to that command instead of the whole CLI. Walking stops at the
 * first flag or the first token that is not a subcommand name or alias
 * (for example a positional argument). An empty result means "root".
 */
export function resolveHelpJsonScope(root: Command, argv: string[]): Command[] {
  const scope: Command[] = [];
  let current = root;
  for (const token of argv) {
    if (token.startsWith('-')) break;
    const next = current.commands.find((c) => c.name() === token || c.aliases().includes(token));
    if (!next) break;
    scope.push(next);
    current = next;
  }
  return scope;
}

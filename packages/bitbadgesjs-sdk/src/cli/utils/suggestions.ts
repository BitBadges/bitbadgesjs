/**
 * "Did you mean?" wiring for unknown commands and unknown flags.
 *
 * Commander 14 defaults `_showSuggestionAfterError` to `true` on every
 * Command, and the toggle DOES propagate down the tree via
 * `copyInheritedSettings`. So in practice suggestions fire out of the
 * box for both unknown subcommands and unknown options at any depth.
 *
 * `enableSuggestionsTreeWide` is a defensive helper: it walks the full
 * command tree and explicitly sets the toggle on every node. Today this
 * is a no-op (the flag is already true). Tomorrow, if a Commander upgrade
 * changes the default or a subtree gets the flag turned off by some
 * other plumbing (e.g. a future `addCommand` hijack), this guarantees
 * suggestions stay on.
 *
 * Call once at the bottom of CLI wiring AFTER all commands (including
 * deprecated aliases) are registered.
 */
import type { Command } from 'commander';

export function enableSuggestionsTreeWide(root: Command): void {
  root.showSuggestionAfterError(true);
  for (const sub of root.commands) {
    enableSuggestionsTreeWide(sub);
  }
}

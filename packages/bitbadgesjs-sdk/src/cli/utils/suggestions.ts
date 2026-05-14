/**
 * "Did you mean?" wiring for unknown commands and unknown flags.
 *
 * Commander ships a `showSuggestionAfterError(true)` toggle that enables
 * Levenshtein-based suggestions for BOTH unknown subcommands and unknown
 * options — but only on the Command instance it's called on. Settings do
 * NOT inherit down the subcommand tree, so a `bb collections crreate`
 * typo (where the unknown lives at depth 2) gets no suggestion unless
 * `collections` itself has the toggle on.
 *
 * `enableSuggestionsTreeWide` walks the full command tree and flips the
 * toggle on every Command, so the suggestion fires regardless of which
 * subcommand level the typo lands at. Call once at the bottom of CLI
 * wiring AFTER all commands (including aliases) are registered.
 */
import type { Command } from 'commander';

export function enableSuggestionsTreeWide(root: Command): void {
  root.showSuggestionAfterError(true);
  for (const sub of root.commands) {
    enableSuggestionsTreeWide(sub);
  }
}

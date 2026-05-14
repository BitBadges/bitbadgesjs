import { Command } from 'commander';
import { enableSuggestionsTreeWide } from './suggestions.js';

/**
 * `enableSuggestionsTreeWide` is a defensive helper — Commander 14 already
 * defaults `_showSuggestionAfterError = true` on every Command, but we
 * explicitly set it everywhere so a future Commander default change (or
 * a subtree that gets the flag flipped off elsewhere) doesn't silently
 * disable "did you mean?" suggestions.
 *
 * These tests assert the post-call state (true everywhere) and that the
 * walk doesn't skip nested levels.
 */
describe('enableSuggestionsTreeWide', () => {
  function getFlag(cmd: Command): boolean {
    return (cmd as any)._showSuggestionAfterError === true;
  }

  it('leaves suggestions enabled on the root command', () => {
    const root = new Command('root');
    enableSuggestionsTreeWide(root);
    expect(getFlag(root)).toBe(true);
  });

  it('keeps the flag set on every nested subcommand', () => {
    const root = new Command('root');
    const child = root.command('child');
    const grandchild = child.command('grandchild');
    enableSuggestionsTreeWide(root);
    expect(getFlag(root)).toBe(true);
    expect(getFlag(child)).toBe(true);
    expect(getFlag(grandchild)).toBe(true);
  });

  it('explicitly re-enables suggestions on a subtree that previously turned them off', () => {
    const root = new Command('root');
    const child = root.command('child');
    const grandchild = child.command('grandchild');
    // Simulate some other plumbing turning suggestions off on a subtree.
    child.showSuggestionAfterError(false);
    grandchild.showSuggestionAfterError(false);
    expect(getFlag(child)).toBe(false);
    expect(getFlag(grandchild)).toBe(false);

    enableSuggestionsTreeWide(root);

    expect(getFlag(root)).toBe(true);
    expect(getFlag(child)).toBe(true);
    expect(getFlag(grandchild)).toBe(true);
  });

  it('handles a deep / wide tree without skipping nodes', () => {
    const root = new Command('root');
    for (let i = 0; i < 5; i++) {
      const sub = root.command(`sub${i}`);
      // Turn off the flag on every sub so the walk has to flip it on.
      sub.showSuggestionAfterError(false);
      for (let j = 0; j < 3; j++) {
        const leaf = sub.command(`leaf${j}`);
        leaf.showSuggestionAfterError(false);
      }
    }
    enableSuggestionsTreeWide(root);
    for (const sub of root.commands) {
      expect(getFlag(sub)).toBe(true);
      for (const leaf of sub.commands) {
        expect(getFlag(leaf)).toBe(true);
      }
    }
  });
});

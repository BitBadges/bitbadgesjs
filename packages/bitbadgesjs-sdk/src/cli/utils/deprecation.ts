/**
 * Shared deprecation-banner helper for the CLI v2 redesign.
 *
 * Old command paths (e.g. `bb cli <cmd>`, `bb portfolio`, `bb sign-with-browser`)
 * stay reachable for one release as thin aliases that delegate to the new
 * flat-namespace home. Each alias emits a single line of stderr commentary
 * so users and agents discover the new form, then we hard-remove in a
 * follow-up PR.
 *
 * Conventions:
 *   - One line, ≤80 chars (terminal-friendly).
 *   - Stderr only — never pollutes stdout JSON envelopes.
 *   - Suppressible via `BB_QUIET=1` so CI / agent runs stay clean.
 */

export function emitDeprecation(oldForm: string, newForm: string): void {
  if (process.env.BB_QUIET === '1') return;
  // Spec: "<old> is deprecated; use '<new>'. Set BB_QUIET=1 to suppress."
  const line = `${oldForm} is deprecated; use '${newForm}'. Set BB_QUIET=1 to suppress.`;
  process.stderr.write(line + '\n');
}

/**
 * First-run banner: prints the policies link + a tab-completion install
 * tip to stderr the very first time the user runs any `bb` command, then
 * marks `firstRunAcknowledgedAt` in ~/.bitbadges/config.json so subsequent
 * invocations stay silent.
 *
 * Design notes:
 * - Stderr only — keeps stdout clean for pipes, agents, scripts.
 * - Best-effort: a failure to read or write the config file silently
 *   skips the banner. Never blocks command execution.
 * - Suppressed when `BB_QUIET=1` so users who don't want noise on
 *   first run can opt out (also useful for CI / test harnesses).
 * - Skipped on `--help-json` invocations so the machine-readable JSON
 *   tree stays uncontaminated.
 * - The policies footer on every `bb --help` provides ongoing visibility
 *   independent of this one-time banner — both layers coexist.
 */

import { loadConfig, saveConfig } from './config.js';

export function maybePrintFirstRunBanner(argv: readonly string[]): void {
  if (process.env.BB_QUIET === '1') return;
  if (argv.includes('--help-json')) return;
  try {
    const cfg = loadConfig();
    if (cfg.firstRunAcknowledgedAt) return;
    process.stderr.write(
      '\n' +
      'Welcome to the BitBadges CLI.\n' +
      'Terms, privacy, and acceptable-use policies: https://bitbadges.io/policies\n' +
      'By using `bb` you agree to the policies linked above.\n' +
      '\n' +
      'Tip — install tab completion for faster discovery:\n' +
      '  bb completion bash >> ~/.bashrc        # bash\n' +
      '  bb completion zsh  >> ~/.zshrc         # zsh\n' +
      '\n' +
      'This message is shown once. Suppress future banners by setting `BB_QUIET=1`.\n' +
      '\n'
    );
    saveConfig({ ...cfg, firstRunAcknowledgedAt: Date.now() });
  } catch {
    // Best-effort — fail silent on missing HOME, locked config file, etc.
  }
}

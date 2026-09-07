/**
 * Next-step hints for the envelope's `hint` slot.
 *
 * Builders emit a transaction and stop. Without a pointer, a first-time user
 * has JSON and no idea that reviewing + signing happens in the browser. The
 * hint names the exact next command, using the file we just wrote when there
 * is one and stdin otherwise.
 */

export interface NextStepContext {
  /** True when the command already broadcast (--browser / --burner). */
  deployRequested?: boolean;
  /** Path passed to --output-file, if any. */
  outputFile?: string;
  /** Suppress in quiet mode so scripted pipelines stay clean. */
  quiet?: boolean;
}

export function buildNextStepHint(ctx: NextStepContext): string | undefined {
  if (ctx.deployRequested || ctx.quiet) return undefined;
  const source = ctx.outputFile ? ctx.outputFile : '-';
  return `Next: bb preview ${source} --open — opens bitbadges.io to review and sign with your wallet. Audit first with: bb check ${source}`;
}

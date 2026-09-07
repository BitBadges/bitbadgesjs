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
  // Without --output-file the tx only exists on stdout, so naming `-` as a
  // standalone argument produced a command that hangs on empty stdin. Tell the
  // caller how to actually re-run it instead.
  return ctx.outputFile
    ? `Next: bb check ${ctx.outputFile} && bb preview ${ctx.outputFile} --open — audits it, then opens the browser to review and sign.`
    : 'Next: pipe it — `bb build … | bb preview - --open` — or re-run with --output-file tx.json and then `bb check tx.json && bb preview tx.json --open`.';
}

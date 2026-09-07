import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';
import { addOutputOptions, emit, emitError, commentary } from '../utils/envelope.js';

import { ensureTxWrapper } from '../utils/txInput.js';
export { ensureTxWrapper };

export const previewCommand = addOutputOptions(
  addNetworkOptions(
    new Command('preview')
      .description('Upload a tx to the indexer and print a shareable bitbadges.io preview URL. Input: JSON file, inline JSON, or - for stdin.')
      .argument('<input>', 'Tx JSON file path, inline JSON, or "-" for stdin')
      .option('--frontend-url <url>', 'Override the bitbadges.io frontend base for the printed preview URL', 'https://bitbadges.io')
      .option('--open', 'Open the review-and-sign URL in your default browser', false)
  )
).action(
  async (
    input: string,
    opts: {
      network?: 'mainnet' | 'local' | 'testnet';
      testnet?: boolean;
      local?: boolean;
      url?: string;
      frontendUrl?: string;
      open?: boolean;
      condensed?: boolean;
      outputFile?: string;
    }
  ) => {
    const { readJsonInput, getApiUrl } = await import('../utils/io.js');

    const raw = readJsonInput(input);
    const wrapped = ensureTxWrapper(raw);

    // Shape sanity check — match the level of detail `check` provides on
    // shape mismatches so agents don't have to guess what was wrong.
    if (!wrapped || typeof wrapped !== 'object' || !Array.isArray(wrapped.messages) || wrapped.messages.length === 0) {
      const got =
        wrapped == null
          ? String(wrapped)
          : Array.isArray(wrapped)
            ? `array (length ${wrapped.length})`
            : typeof wrapped === 'object'
              ? `object with keys [${Object.keys(wrapped).join(', ')}]`
              : typeof wrapped;
      emitError(
        new Error(
          `Preview input has an unexpected shape — expected \`{messages: [{typeUrl, value}, ...]}\` or a single Msg \`{typeUrl, value}\`. Got: ${got}.`
        ),
        { code: 'invalid_shape', exitCode: 2 }
      );
    }

    // Normalize msg type (Universal → Create/Update). The placeholder
    // sidecar lives inside `msg.value._meta` per the single-source-of-
    // truth contract — rides along inside the value automatically.
    const { normalizeToCreateOrUpdate } = await import('../utils/normalizeMsg.js');
    const cleanedMessages = (wrapped.messages || []).map((m: any) => normalizeToCreateOrUpdate(m));

    const payload = {
      transaction: {
        messages: cleanedMessages,
        ...(wrapped.memo ? { memo: wrapped.memo } : {}),
        ...(wrapped.fee ? { fee: wrapped.fee } : {})
      }
    };

    // Direct fetch — apiRequest() requires an API key, but the preview
    // endpoint is intentionally open.
    const apiUrl = getApiUrl(opts);
    const url = `${apiUrl}/api/v0/builder/preview`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      emitError(err, { code: 'preview_upload_failed', exitCode: 2 });
    }

    if (!response!.ok) {
      const text = await response!.text().catch(() => '');
      emitError(new Error(`Preview upload failed: HTTP ${response!.status} ${text}`), { code: 'preview_upload_failed', exitCode: 2 });
    }

    const result = (await response!.json()) as {
      success: boolean;
      code: string;
      expiresAt: number;
      expiresIn: string;
    };

    const frontendBase = opts.frontendUrl || 'https://bitbadges.io';
    const { buildReviewUrlFromCode } = await import('../../builder/handoff.js');
    // Review-and-sign: the frontend's local-builder page loads the same
    // `prv_` payload and continues straight into review + wallet signing.
    const reviewUrl = buildReviewUrlFromCode(frontendBase, result.code, payload.transaction);

    commentary(`Review + sign: ${reviewUrl}\nExpires in ${result.expiresIn}.`);
    if (opts.open) {
      try {
        const mod = await import('open');
        await ((mod as any).default ?? mod)(reviewUrl);
      } catch (err: any) {
        commentary(`(could not auto-launch browser: ${err?.message || err})`);
      }
    }
    // `url` is the long-standing envelope field; it and `reviewUrl` now name the
    // same single destination.
    emit({ code: result.code, url: reviewUrl, reviewUrl, expiresAt: result.expiresAt, expiresIn: result.expiresIn }, opts);
  }
);

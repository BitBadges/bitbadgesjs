import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';
import { addOutputOptions, emit, emitError, commentary } from '../utils/envelope.js';
import { resolveApiKey } from '../utils/api-client.js';

import { ensureTxWrapper } from '../utils/txInput.js';
export { ensureTxWrapper };

/**
 * Frontend base for the printed link, following the same network the tx was
 * uploaded to.
 *
 * This used to be a commander default of `https://bitbadges.io`, which is
 * always truthy — so the network flags never influenced it and
 * `bb preview --testnet` handed back a mainnet URL whose `prv_` code only
 * existed on testnet. A dead link with no error.
 */
export function resolveFrontendBaseForCli(opts: { network?: string; local?: boolean; testnet?: boolean; frontendUrl?: string }): string {
  if (opts.frontendUrl) return opts.frontendUrl;
  if (process.env.BITBADGES_FRONTEND_URL) return process.env.BITBADGES_FRONTEND_URL;
  if (opts.network === 'local' || opts.local) return 'http://localhost:3000';
  if (opts.network === 'testnet' || opts.testnet) return 'https://testnet.bitbadges.io';
  return 'https://bitbadges.io';
}

/**
 * API key for the preview upload, or undefined when none is configured.
 * Same resolution order as every other keyed command (flag, network env var,
 * BITBADGES_API_KEY, config), but never throws: a local indexer needs no key.
 */
export function resolveOptionalApiKey(opts: { apiKey?: string; network?: string; local?: boolean; testnet?: boolean }): string | undefined {
  const network = opts.network === 'local' || opts.local ? 'local' : opts.network === 'testnet' || opts.testnet ? 'testnet' : 'mainnet';
  try {
    return resolveApiKey(opts.apiKey, network) || undefined;
  } catch {
    return undefined;
  }
}

export const previewCommand = addOutputOptions(
  addNetworkOptions(
    new Command('preview')
      .description('Upload a tx to the indexer and print a shareable bitbadges.io preview URL. Input: JSON file, inline JSON, or - for stdin.')
      .argument('<input>', 'Tx JSON file path, inline JSON, or "-" for stdin')
      .option('--frontend-url <url>', 'Override the frontend base for the printed link (defaults follow --network)')
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

    // Direct fetch. The indexer gates /builder/preview behind an API key
    // (premiumOnlyHandler), so send the configured key when there is one.
    // A local indexer accepts the upload without a key.
    const apiUrl = getApiUrl(opts);
    const url = `${apiUrl}/api/v0/builder/preview`;
    const apiKey = resolveOptionalApiKey(opts);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      emitError(err, { code: 'preview_upload_failed', exitCode: 2 });
    }

    if (!response!.ok) {
      const text = await response!.text().catch(() => '');
      if (response!.status === 401 && !apiKey) {
        emitError(
          new Error(
            'Preview upload needs a BitBadges API key. Pass --api-key, run `bb settings set apiKey <key>`, or set BITBADGES_API_KEY. Without a key, paste the tx JSON at https://bitbadges.io/mint/local-builder instead.'
          ),
          { code: 'missing_api_key', exitCode: 2 }
        );
      }
      emitError(new Error(`Preview upload failed: HTTP ${response!.status} ${text}`), { code: 'preview_upload_failed', exitCode: 2 });
    }

    const result = (await response!.json()) as {
      success: boolean;
      code: string;
      expiresAt: number;
      expiresIn: string;
    };

    const frontendBase = resolveFrontendBaseForCli(opts);
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

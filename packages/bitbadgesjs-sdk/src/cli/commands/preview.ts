import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';

function ensureTxWrapper(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input.messages)) return input;
  if (typeof input.typeUrl === 'string' && input.value) return { messages: [input] };
  return input;
}

export const previewCommand = addNetworkOptions(
  new Command('preview')
    .description('Upload a tx to the indexer and print a shareable bitbadges.io preview URL. Input: JSON file, inline JSON, or - for stdin.')
    .argument('<input>', 'Tx JSON file path, inline JSON, or "-" for stdin')
    .option(
      '--frontend-url <url>',
      'Override the bitbadges.io frontend base for the printed preview URL',
      'https://bitbadges.io'
    )
    .option('--json', 'Output the structured upload result as JSON instead of just the URL')
).action(
  async (
    input: string,
    opts: { network?: 'mainnet' | 'local' | 'testnet'; testnet?: boolean; local?: boolean; url?: string; frontendUrl?: string; json?: boolean }
  ) => {
    const { readJsonInput, getApiUrl } = await import('../utils/io.js');

    const raw = readJsonInput(input);
    const wrapped = ensureTxWrapper(raw);

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
      process.stderr.write(`Preview upload failed: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(2);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      process.stderr.write(`Preview upload failed: HTTP ${response.status} ${text}\n`);
      process.exit(2);
    }

    const result = (await response.json()) as {
      success: boolean;
      code: string;
      expiresAt: number;
      expiresIn: string;
    };

    const frontendBase = opts.frontendUrl || 'https://bitbadges.io';
    const previewUrl = `${frontendBase.replace(/\/$/, '')}/builder/preview?code=${encodeURIComponent(result.code)}`;

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          {
            code: result.code,
            url: previewUrl,
            expiresAt: result.expiresAt,
            expiresIn: result.expiresIn
          },
          null,
          2
        ) + '\n'
      );
    } else {
      process.stdout.write(previewUrl + '\n');
      process.stderr.write(`Expires in ${result.expiresIn}.\n`);
    }
  }
);

import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';
import { addFormatOptions, resolveFormat, successEnvelope } from '../utils/envelope.js';

/**
 * Plain-English explanation of a transaction body or a collection.
 * Auto-detects which shape was passed: a tx with messages[] (or a single
 * Msg) goes through interpretTransaction(); a raw collection goes through
 * interpretCollection(). Numeric input is treated as a collection id and
 * fetched from the API.
 */
export const explainCommand = addFormatOptions(
  addNetworkOptions(
    new Command('explain')
      .description('Explain a transaction or collection in plain English. Input: JSON file, inline JSON, numeric collection ID, or - for stdin.')
      .argument('<input>', 'Tx / collection JSON file path, inline JSON, numeric collection id, or "-" for stdin')
      .option('--output-file <path>', 'Write output to file instead of stdout')
  )
).action(
  async (input: string, opts: { network?: 'mainnet' | 'local' | 'testnet'; testnet?: boolean; local?: boolean; url?: string; outputFile?: string; format?: string; json?: boolean }) => {
    const { readJsonInput, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
    let data: any;
    let fetchedCollection = false;

    // Numeric input: try to fetch a collection by id from the indexer.
    if (/^\d+$/.test(input)) {
      const baseUrl = getApiUrl(opts);
      const apiKey = getApiKeyForNetwork(opts) || '';
      try {
        const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
          headers: { 'x-api-key': apiKey }
        });
        if (!response.ok) {
          process.stderr.write(
            `Could not fetch collection ${input} from ${baseUrl} — HTTP ${response.status}.\n` +
              `Hint: the indexer's collection-by-id endpoint may not be wired on --network local.\n` +
              `Try passing the collection JSON directly (file or inline) instead of a numeric id.\n`
          );
          process.exit(2);
        }
        data = await response.json();
        fetchedCollection = true;
      } catch (err: any) {
        process.stderr.write(
          `Could not reach ${baseUrl}/api/v0/collection/${input}: ${err?.message || err}.\n` +
            `Check that the network is reachable, or pass the collection JSON directly.\n`
        );
        process.exit(2);
      }
    } else {
      try {
        data = readJsonInput(input);
      } catch (err: any) {
        process.stderr.write(
          `Failed to parse input JSON: ${err?.message || err}.\n` +
            `Accepts: file path, @file.json, inline JSON, numeric collection id, or - for stdin.\n`
        );
        process.exit(2);
      }
    }

    // Auto-detect shape:
    //   1. Single Msg  — `{ typeUrl, value: {...} }`                   → .value
    //   2. Tx wrapper  — `{ messages: [{ typeUrl, value }, ...] }`     → first collection msg's value
    //   3. Raw collection — no typeUrl, no messages, no value          → interpretCollection
    let text: string;
    let kind: 'collection' | 'tx' | 'msg';
    let messages: Array<{ typeUrl: string; summary: string }> = [];

    const { isCollectionMsg } = await import('../utils/normalizeMsg.js');
    const hasMessages = Array.isArray(data?.messages);
    const firstCollectionMsg = hasMessages ? data.messages.find((m: any) => isCollectionMsg(m)) : null;

    try {
      if (
        fetchedCollection ||
        (data && typeof data === 'object' && !data.typeUrl && !hasMessages && !data.value)
      ) {
        const { interpretCollection } = await import('../../api-indexer/interpret.js');
        text = interpretCollection(data);
        kind = 'collection';
      } else {
        const txBody = firstCollectionMsg?.value ?? data.value ?? data;
        const { interpretTransaction } = await import('../../core/interpret-transaction.js');
        text = interpretTransaction(txBody);
        // Populate the per-message array so JSON callers can branch on shape.
        // Each entry's `summary` is the same prose interpretation run against
        // that single message's value — agents that want a per-msg breakdown
        // get one without us baking a structured-findings extractor.
        if (hasMessages) {
          kind = 'tx';
          for (const m of data.messages) {
            const value = m?.value ?? m;
            const typeUrl = String(m?.typeUrl ?? '');
            let summary = '';
            try {
              summary = interpretTransaction(value);
            } catch {
              summary = '(could not interpret message)';
            }
            messages.push({ typeUrl, summary });
          }
        } else if (data?.typeUrl && data?.value) {
          kind = 'msg';
          messages.push({ typeUrl: String(data.typeUrl), summary: text });
        } else {
          kind = 'tx';
        }
      }
    } catch (err: any) {
      process.stderr.write(
        `Could not interpret input: ${err?.message || err}.\n` +
          `Hint: \`explain\` expects either a full transaction (with messages[]),\n` +
          `a single Msg ({typeUrl, value}), a complete on-chain collection document\n` +
          `(returned by query_collection), or a numeric collection id. Minimal ad-hoc\n` +
          `JSON like {collectionId:"1"} is not a valid input — it lacks the fields the\n` +
          `interpreter needs (collectionMetadata.uri, validTokenIds, etc).\n`
      );
      process.exit(2);
    }

    const format = resolveFormat({ format: opts.format, json: opts.json });
    const output = format === 'json'
      ? JSON.stringify(successEnvelope({ kind, messages, fullText: text }), null, 2) + '\n'
      : text + '\n';

    if (opts.outputFile) {
      const fsMod = await import('fs');
      fsMod.writeFileSync(opts.outputFile, output, 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
    } else {
      process.stdout.write(output);
    }
  }
);

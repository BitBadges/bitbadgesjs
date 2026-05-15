/**
 * `bitbadges-cli custom-2fa` — end-user surface for the Custom-2FA standard.
 * Mirrors the FE's `custom-2fa/Custom2FALayout` mint flow.
 *
 *   mint  — MsgTransferTokens that issues short-lived 2FA tokens
 *
 * Collection creation stays `bb build custom-2fa`. `mint` is the post-
 * creation action: it encodes the 5-minute token lifetime at mint time
 * (ownershipTimes), which the collection approval cannot do on its own.
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { addExpiryOption, resolveExpiry } from '../utils/expiry-options.js';
import { mintCustom2FA, CUSTOM_2FA_TOKEN_EXPIRATION_MS } from '../../core/builders/custom-2fa.js';

export const custom2faCommand = new Command('custom-2fa').description(
  'Custom-2FA standard — issue short-lived two-factor tokens. Create the collection with `bb build custom-2fa`, then `mint`.'
);

addDeployOptions(
  addExpiryOption(
    addOutputFlags(
      addNetworkFlags(
        custom2faCommand
          .command('mint')
          .description(
            'Emit MsgTransferTokens that mints short-lived 2FA tokens. The lifetime is encoded at mint time (default 5m) — without it the tokens never expire.'
          )
          .argument('<collection-id>', 'Custom-2FA collection ID')
          .requiredOption('--creator <address>', 'Manager address (bb1...) — only the manager may mint. Strict; run `bb account convert` for 0x')
          .requiredOption('--to <addresses>', 'Recipient bb1... address(es), comma-separated')
      )
    ),
    { description: '2FA token lifetime: duration (5m, 10m) or ms-since-epoch. Default 5m.' }
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; to: string; expiration?: string; expiry?: string }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const recipients = String(opts.to)
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
        .map((a) => requireBb1AddressStrict(a, '--to'));
      const endMs = resolveExpiry(opts, CUSTOM_2FA_TOKEN_EXPIRATION_MS);
      const expirationMs = Number(endMs - BigInt(Date.now()));
      if (expirationMs <= 0) {
        throw new Error('--expiration must be in the future (a duration like 5m, or a future ms-since-epoch).');
      }
      const msg = mintCustom2FA({
        creator,
        collectionId: String(collectionId),
        recipients,
        expirationMs
      });
      await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb custom-2fa mint 84 --creator bb1mgr...xyz --to bb1user...abc | bb deploy
  $ bb custom-2fa mint 84 --creator bb1mgr...xyz --to bb1a...,bb1b... --expiration 10m --browser
`);

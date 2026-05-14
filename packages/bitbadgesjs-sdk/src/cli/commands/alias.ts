import { Command } from 'commander';
import { addOutputOptions, emit } from '../utils/envelope.js';

export const aliasCommand = new Command('alias').description('Generate protocol-derived alias addresses.');

addOutputOptions(
  aliasCommand
    .command('for-ibc-backing <ibcDenom>')
    .description('Generate backing address for an IBC-backed smart token (uses BackedPathGenerationPrefix)')
).action(async (ibcDenom: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { generateAliasAddressForIBCBackedDenom } = await import('../../core/aliases.js');
  const address = generateAliasAddressForIBCBackedDenom(ibcDenom);
  emit({ address, kind: 'ibc-backing', source: ibcDenom }, opts);
});

addOutputOptions(
  aliasCommand
    .command('for-wrapper <denom>')
    .description('Generate wrapper path address for a cosmos coin wrapper (uses DenomGenerationPrefix)')
).action(async (denom: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { generateAliasAddressForDenom } = await import('../../core/aliases.js');
  const address = generateAliasAddressForDenom(denom);
  emit({ address, kind: 'wrapper', source: denom }, opts);
});

addOutputOptions(
  aliasCommand
    .command('for-mint-escrow <collectionId>')
    .description('Generate mint escrow address for a collection (where to send quest reward funds, etc.)')
).action(async (collectionId: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { getAliasDerivationKeysForCollection, generateAlias } = await import('../../core/aliases.js');
  const derivationKeys = getAliasDerivationKeysForCollection(collectionId);
  const address = generateAlias('badges', derivationKeys);
  emit({ address, kind: 'mint-escrow', source: collectionId }, opts);
});

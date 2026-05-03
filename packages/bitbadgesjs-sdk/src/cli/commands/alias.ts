import { Command } from 'commander';

export const aliasCommand = new Command('alias').description('Generate protocol-derived alias addresses.');

aliasCommand
  .command('for-ibc-backing <ibcDenom>')
  .description('Generate backing address for an IBC-backed smart token (uses BackedPathGenerationPrefix)')
  .action(async (ibcDenom: string) => {
    const { generateAliasAddressForIBCBackedDenom } = await import('../../core/aliases.js');
    console.log(generateAliasAddressForIBCBackedDenom(ibcDenom));
  });

aliasCommand
  .command('for-wrapper <denom>')
  .description('Generate wrapper path address for a cosmos coin wrapper (uses DenomGenerationPrefix)')
  .action(async (denom: string) => {
    const { generateAliasAddressForDenom } = await import('../../core/aliases.js');
    console.log(generateAliasAddressForDenom(denom));
  });

aliasCommand
  .command('for-mint-escrow <collectionId>')
  .description('Generate mint escrow address for a collection (where to send quest reward funds, etc.)')
  .action(async (collectionId: string) => {
    const { getAliasDerivationKeysForCollection, generateAlias } = await import('../../core/aliases.js');
    const derivationKeys = getAliasDerivationKeysForCollection(collectionId);
    const address = generateAlias('badges', derivationKeys);
    console.log(address);
  });

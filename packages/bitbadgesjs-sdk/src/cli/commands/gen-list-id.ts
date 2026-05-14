import { Command } from 'commander';
import { addOutputOptions, emit, emitError } from '../utils/envelope.js';

export const genListIdCommand = addOutputOptions(
  new Command('gen-list-id')
    .description('Generate a reserved address list ID from a set of addresses.')
    .argument('<addresses...>', 'One or more addresses to include in the list')
    .option('--blacklist', 'Treat as blacklist (default is whitelist)')
).action(async (addresses: string[], opts: { blacklist?: boolean; condensed?: boolean; outputFile?: string }) => {
  const { generateReservedListId } = await import('../../core/addressLists.js');
  const { isAddressValid } = await import('../../address-converter/converter.js');

  // Validate every input is a well-formed address. The underlying
  // generateReservedListId() falls back to the raw string for invalid
  // inputs — silently emitting nonsense like "alice:charlie" as a list ID
  // that the chain will reject. Fail loud here so agents catch typos at
  // the CLI boundary.
  const invalid = addresses.filter((a) => !isAddressValid(a));
  if (invalid.length > 0) {
    emitError(
      new Error(`invalid address(es): ${invalid.join(', ')}. Expected bb1... or 0x... format.`),
      { code: 'invalid_address', exitCode: 2 }
    );
  }

  const whitelist = !opts.blacklist;
  const listId = generateReservedListId({
    listId: '',
    addresses,
    whitelist,
    uri: '',
    customData: ''
  });
  emit({ listId, mode: whitelist ? 'whitelist' : 'blacklist', addresses }, opts);
});

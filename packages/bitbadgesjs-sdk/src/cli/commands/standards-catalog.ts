import { Command } from 'commander';
import { getStandardCatalog } from '../../builder/tools/registry.js';
import { addOutputOptions, emit, emitError, type EmitOptions } from '../utils/envelope.js';

export const standardsCatalogCommand = addOutputOptions(new Command('standards'))
  .description('Discover standard builders, lifecycle actions, and limitations. Works offline.')
  .argument('[id]', 'Standard identifier from the catalog')
  .action((id: string | undefined, opts: EmitOptions) => {
    try {
      emit(getStandardCatalog(id), opts);
    } catch (error) {
      emitError(error, { ...opts, code: 'invalid_input' });
    }
  });

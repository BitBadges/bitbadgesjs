import { Command } from 'commander';
import { getCapabilityCatalog } from '../../builder/tools/registry.js';
import { addOutputOptions, emit, emitError, type EmitOptions } from '../utils/envelope.js';

export const capabilitiesCommand = addOutputOptions(new Command('capabilities'))
  .description('List shared CLI/MCP operations, or read one installed input schema. Works offline.')
  .argument('[id]', 'Operation identifier from the catalog')
  .action((id: string | undefined, opts: EmitOptions) => {
    try {
      emit(getCapabilityCatalog(id), opts);
    } catch (error) {
      emitError(error, { ...opts, code: 'invalid_input' });
    }
  });

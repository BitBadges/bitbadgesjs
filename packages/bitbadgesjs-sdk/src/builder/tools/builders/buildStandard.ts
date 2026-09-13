import * as builders from '../../../core/builders/index.js';
import { listStandardBuilders } from '../../../core/builders/input-schemas.js';
import { normalizeToCreateOrUpdate } from '../../../cli/utils/normalizeMsg.js';

export const standardBuilderTools = Object.fromEntries(listStandardBuilders().map(({ id, builder, inputSchema, example }) => {
  const name = `build_${id.replace(/-/g, '_')}`;
  const run = builders[builder as keyof typeof builders];
  if (typeof run !== 'function') throw new Error(`Missing standard builder implementation: ${builder}`);
  return [name, {
    tool: {
      name,
      description: `Prepare a ${id} proposal using the same core builder as the CLI. Input schema is generated from its parameter type; runtime rules still apply. Display-unit number fields are numbers; IDs and ranges use the declared strings. This does not sign, broadcast, resolve metadata, or guarantee current chain-state validity. Set the signer before deployment and review the resulting proposal.`,
      inputSchema: { ...inputSchema, type: 'object' as const, examples: [example] }
    },
    run: (args: unknown) => JSON.parse(JSON.stringify(
      normalizeToCreateOrUpdate((run as (params: unknown) => unknown)(args)),
      (_key, value) => typeof value === 'bigint' ? value.toString() : value
    ))
  }];
}));

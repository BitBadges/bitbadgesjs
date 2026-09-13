import { Command } from 'commander';
import { addOutputOptions, emit, emitError, type EmitOptions } from '../utils/envelope.js';
import { getSigningRequestStatus, listSigningRequests } from '../utils/signing-requests.js';

export const requestsCommand = new Command('requests').description(
  'Inspect saved browser signing requests. Never signs, submits, or creates a replacement payment.'
);

addOutputOptions(requestsCommand.command('list').description('List locally saved request IDs.')).action((opts: EmitOptions) => {
  try {
    emit({ requestIds: listSigningRequests() }, opts);
  } catch (error) {
    emitError(error, { ...opts, code: 'request_unavailable' });
  }
});

for (const action of ['status', 'resume'] as const) {
  addOutputOptions(
    requestsCommand
      .command(action)
      .argument('<id>', 'Saved request ID')
      .description(
        action === 'status'
          ? 'Read the result and check whether the original listener is still active.'
          : 'Return the same signing URL only while the original listener is active. Keep the original CLI running.'
      )
  ).action(async (id: string, opts: EmitOptions) => {
    try {
      emit(await getSigningRequestStatus(id, action === 'resume'), opts);
    } catch (error) {
      emitError(error, { ...opts, code: 'request_unavailable' });
    }
  });
}

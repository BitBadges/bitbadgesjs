import { Command } from 'commander';
import { addOutputOptions, emit, emitError, type EmitOptions } from '../utils/envelope.js';
import { getSigningRequestStatus, listSigningRequests } from '../utils/signing-requests.js';
import { listenForBrowserReview } from '../utils/browser-review.js';

export const requestsCommand = new Command('requests').description(
  'Inspect saved browser signing requests. Never signs, submits, or creates a replacement payment.'
);
requestsCommand.command('_listen', { hidden: true }).action(async () => {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > 64 * 1024) throw new Error('Browser request exceeds 64 KiB.');
    chunks.push(Buffer.from(chunk));
  }
  await listenForBrowserReview(JSON.parse(Buffer.concat(chunks).toString('utf8')));
});

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
      .option('--verify', 'Independently verify submitted transaction against the configured chain and requested messages')
      .description(
        action === 'status'
          ? 'Read the result and check whether the original listener is still active.'
          : 'Return the same signing URL only while the original listener is active. Keep the original CLI running.'
      )
  ).action(async (id: string, opts: EmitOptions & { verify?: boolean }) => {
    try {
      emit(await getSigningRequestStatus(id, action === 'resume', opts.verify), opts);
    } catch (error) {
      emitError(error, { ...opts, code: 'request_unavailable' });
    }
  });
}

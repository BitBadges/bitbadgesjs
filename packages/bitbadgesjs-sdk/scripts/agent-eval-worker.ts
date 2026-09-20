import { runProviderWorker } from './golden-evals/provider-worker.js';
import { createOpenRouterProvider } from './golden-evals/openrouter.js';
import { callTool, listTools } from '../dist/esm/builder/tools/registry.js';

try {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (request.settings.provider !== 'openrouter') throw new Error('Evaluations require OpenRouter');
  const provider = await createOpenRouterProvider(process.env.OPENROUTER_API_KEY ?? '');
  const report = await runProviderWorker(request, provider, listTools(), callTool);
  process.stdout.write(JSON.stringify(report) + '\n');
} catch {
  process.stderr.write('Agent worker failed; check provider configuration, budgets and response contract.\n');
  process.exitCode = 2;
}

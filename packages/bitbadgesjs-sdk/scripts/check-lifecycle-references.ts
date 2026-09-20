import { getLifecycleCapabilities, getLifecycleTemplate } from '../src/builder/lifecycle-catalog.js';
import { runLifecycle } from '../src/builder/lifecycle.js';

// Manual integration check: intentionally not wired into CI or model evaluations.
const catalog = getLifecycleCapabilities();
const ids = [...new Set(catalog.standards.flatMap((standard) => standard.templates))];
for (const id of ids) {
  const reference = getLifecycleTemplate(id);
  const result = await runLifecycle(reference.input);
  if (result.status !== 'satisfied' || result.chainCommit !== reference.source.chainCommit || result.provenance.origin !== 'shipped-reference') {
    throw new Error(`${id}: reference did not pass against the pinned source revision (${result.status}, ${result.chainCommit}).`);
  }
  console.log(`${id}: ${result.status} (${result.steps.length} steps)`);
}
console.log(`${ids.length} experimental references passed; product correctness is not established.`);

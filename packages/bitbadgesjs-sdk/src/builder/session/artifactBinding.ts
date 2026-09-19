import { artifactIdentity } from '../../core/intent.js';
import { getTransaction } from './sessionState.js';
export type SessionBinding = { sessionId: string; revision: string; artifactId: string };
export function getSessionBinding(sessionId = '__default__'): SessionBinding {
  const artifactId = artifactIdentity({ messages: getTransaction(sessionId).messages });
  return { sessionId, revision: artifactId, artifactId };
}
export function assertSessionBinding(binding: SessionBinding): void {
  if (getSessionBinding(binding.sessionId).artifactId !== binding.artifactId || binding.revision !== binding.artifactId) throw new Error('Stale session evidence; recheck the current artifact.');
}

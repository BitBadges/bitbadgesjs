/**
 * Public entry for the BitBadges programmatic agent.
 *
 * Users import from `bitbadges/builder/agent`:
 *
 * ```ts
 * import { BitBadgesAgent } from 'bitbadges/builder/agent';
 *
 * const agent = new BitBadgesAgent({ anthropicKey: process.env.ANTHROPIC_API_KEY });
 * const result = await agent.build('mint 1000 fungible tokens');
 * ```
 *
 * Unstable low-level primitives live under `bitbadges/builder/internals`.
 */

export { BitBadgesAgent } from './BitBadgesAgent.js';
export { MemoryStore, FileStore, type KVStore, type KVStoreSetOptions, type FileStoreOptions } from './sessionStore.js';
export { substituteImages, collectImageReferences, type ImageMap } from './images.js';
export { MODELS, resolveModel, computeCostUsd } from './models.js';
export {
  BitBadgesAgentError,
  ValidationFailedError,
  QuotaExceededError,
  AnthropicAuthError,
  AbortedError,
  PeerDependencyError,
  SimulationError
} from './errors.js';

export type {
  // Options
  BitBadgesAgentOptions,
  BuildOptions,
  BuildMode,
  ValidationStrictness,
  ModelName,
  ModelInfo,
  // Results
  BuildResult,
  BuildTrace,
  StructuredError,
  Warning,
  // Hooks
  AgentHooks,
  TokenUsage,
  ToolCallEvent,
  // Custom tools / injectables
  CustomTool,
  ToolExecutionContext,
  CommunitySkillsFetcher,
  OnChainSnapshotFetcher,
  TransactionSimulator,
  PromptContext,
  PromptParts,
  ContextHelpers
} from './types.js';

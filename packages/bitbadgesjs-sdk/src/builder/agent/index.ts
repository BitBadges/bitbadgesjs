/**
 * Public entry for the BitBadges programmatic agent.
 *
 * Users import from `bitbadges/builder/agent`:
 *
 * ```ts
 * import { BitBadgesBuilderAgent } from 'bitbadges/builder/agent';
 *
 * const agent = new BitBadgesBuilderAgent({ anthropicKey: process.env.ANTHROPIC_API_KEY });
 * const result = await agent.build('mint 1000 fungible tokens');
 * ```
 *
 * Unstable low-level primitives live under `bitbadges/builder/internals`.
 */

export { BitBadgesBuilderAgent } from './BitBadgesBuilderAgent.js';
export { MemoryStore, FileStore, type KVStore, type KVStoreSetOptions, type FileStoreOptions } from './sessionStore.js';
export { substituteImages, collectImageReferences, type ImageMap } from './images.js';
export { MODELS, resolveModel, computeCostUsd } from './models.js';
// Exposed so third-party devs writing custom tools can type `agent.tools`
// (returned from `agent.tools` getter) and implement their own registries.
export type { AgentToolRegistry, AgentTool, AnthropicTool } from './toolAdapter.js';
export {
  createBitBadgesCommunitySkillsFetcher,
  type BitBadgesCommunitySkillsFetcherOptions
} from './communitySkills.js';
export { getAllSkillInstructions, type SkillInstruction } from '../resources/skillInstructions.js';
export {
  inferTokenTypeFromPrompt,
  getTokenTypeSkillIds,
  getTokenTypeSkills,
  extractStandards,
  inferFromStandards,
  buildInferenceSystemPrompt,
  buildInferenceUserPrompt,
  parseInferenceResponse,
  STANDARD_TO_TOKEN_TYPE,
  type TokenTypeInferenceInput,
  type TokenTypeInferenceResult
} from './tokenTypeInference.js';
export {
  BitBadgesBuilderAgentError,
  ValidationFailedError,
  QuotaExceededError,
  AnthropicAuthError,
  AbortedError,
  PeerDependencyError,
  SimulationError
} from './errors.js';

// Multi-provider abstraction — Anthropic by default, OpenAI optional.
// Adding a new provider = drop a file in src/builder/agent/providers/.
export { getProvider, AnthropicProvider, OpenAIProvider, SUPPORTED_PROVIDERS } from './providers/index.js';
export type { LLMProvider, ProviderName } from './providers/index.js';

export type {
  // Options
  BitBadgesBuilderAgentOptions,
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
  AgentLogEntry,
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

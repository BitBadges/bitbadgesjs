/**
 * Unstable low-level primitives for advanced consumers.
 *
 * WARNING: this subpath ships the agent's guts — prompt strings,
 * loop internals, validation gate, error patterns. It exists so
 * advanced users can wire their own agent on top of the BitBadges
 * tool registry (different LLM, different loop strategy, fine-tuned
 * prompts). It is explicitly NOT subject to semver — anything here
 * may be renamed or removed in a minor version.
 *
 * If you can do your job with `BitBadgesBuilderAgent` from
 * `bitbadges/builder/agent`, use that instead.
 */

// Prompt primitives
export {
  SECURITY_SECTION,
  DOMAIN_KNOWLEDGE,
  TOKEN_EFFICIENCY,
  WORKFLOW_NEW_BUILD,
  WORKFLOW_UPDATE,
  WORKFLOW_REFINEMENT,
  BUILDER_SYSTEM_PROMPT,
  BUILDER_SYSTEM_PROMPT_FOR_EXPORT,
  buildSystemPrompt,
  formatContextHelpers,
  assemblePromptParts,
  assembleExportPrompt,
  buildFixPrompt,
  findMatchingErrorPatterns,
  getSystemPromptHash
} from './prompt.js';

// Agent loop primitives
export { runAgentLoop, compressOldToolResults } from './loop.js';

// Validation gate primitives
export { runValidationGate } from './validation.js';
export type {
  ValidationGateParams,
  ValidationGateResult,
  ValidationLogEntry,
  ValidationLogType,
  HardErrorCounts,
  LegacyAuditShape,
  SimulationResult
} from './validation.js';

// Simulation error patterns
export {
  SIMULATION_ERROR_PATTERNS,
  parseSimulationError,
  isAdvisorySimulationError
} from './simulationErrorPatterns.js';

// Tool adapter
export { createAgentToolRegistry } from './toolAdapter.js';
export type { AgentToolRegistry, AgentTool, AnthropicTool, CreateRegistryOptions } from './toolAdapter.js';

// Sanitizer
export { containsInjection } from './sanitize.js';

// Anthropic client loader
export { loadAnthropicSdk, getAnthropicClient } from './anthropicClient.js';

// Provider abstraction (multi-LLM dispatcher: Anthropic / OpenAI / …)
export { getProvider, AnthropicProvider, OpenAIProvider, SUPPORTED_PROVIDERS } from './providers/index.js';
export type {
  LLMProvider,
  LLMProviderConfig,
  ProviderName,
  ProviderChatArgs,
  ProviderChatResponse,
  ProviderToolDefinition,
  ProviderMessage,
  ProviderUsage,
  ProviderToolCall,
  ProviderSystemBlock
} from './providers/index.js';

/**
 * Agent loop — Claude conversation loop with tool execution.
 *
 * Ported from bitbadges-indexer/src/routes/ai-builder/core/agentLoop.ts.
 * Changes for the SDK port:
 *  - Takes an opaque Anthropic client (dynamically loaded peer dep).
 *  - No TokenLedger / i18n coupling.
 *  - Hooks (`onToolCall`, `onTokenUsage`, `onStatusUpdate`) fire
 *    fire-and-forget so consumer callbacks can't hang a build.
 *  - `maxTokensPerBuild` is enforced via `QuotaExceededError`.
 */

import { AbortedError, AnthropicAuthError, BitBadgesBuilderAgentError, QuotaExceededError } from './errors.js';
import { computeCostUsd, type ModelInfo } from './models.js';
import type { AgentHooks, ToolCallEvent } from './types.js';
import type { AgentToolRegistry } from './toolAdapter.js';

export interface AgentLoopParams {
  client: any; // Anthropic client (peer dep).
  systemPrompt: string;
  userMessage: string;
  /**
   * Structured user-message content blocks with cache boundaries.
   * When provided, the loop uses this (not `userMessage`) to send
   * cache-marked content to Anthropic. Falls back to `userMessage`
   * as a single unmarked text block when absent.
   */
  userContent?: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;
  registry: AgentToolRegistry;
  sessionId: string;
  creatorAddress: string;
  model: ModelInfo;
  maxRounds: number;
  maxTokensPerBuild: number;
  anthropicTimeoutMs: number;
  existingMessages?: any[];
  abortSignal?: AbortSignal;
  hooks?: AgentHooks;
  debug?: boolean;
  /** Starting cumulative tokens (carries across fix-loop rounds). */
  startingTokens?: number;
  /** Starting cumulative USD cost. */
  startingCostUsd?: number;
  /** Starting cumulative cache-creation tokens (carries across fix-loop rounds). */
  startingCacheCreationTokens?: number;
  /** Starting cumulative cache-read tokens (carries across fix-loop rounds). */
  startingCacheReadTokens?: number;
}

export interface AgentLoopResult {
  messages: any[];
  toolCalls: ToolCallEvent[];
  finalText: string;
  rounds: number;
  totalTokens: number;
  totalCostUsd: number;
  /** Cumulative tokens written to Anthropic's prompt cache. */
  cacheCreationTokens: number;
  /** Cumulative tokens served from Anthropic's prompt cache. */
  cacheReadTokens: number;
}

const COMPRESSIBLE_TOOLS = new Set([
  'add_approval', 'set_permissions', 'set_invariants', 'set_is_archived',
  'set_standards', 'set_valid_token_ids', 'set_default_balances',
  'set_collection_metadata', 'set_token_metadata', 'set_approval_metadata',
  'set_mint_escrow_coins', 'get_transaction',
  'search_knowledge_base', 'fetch_docs', 'lookup_claim_plugins', 'query_collection',
  // Validation + simulation tool results are often chunky (issue arrays,
  // stack traces, gas dumps) and the summarizer already knows how to
  // condense them — only the most recent two results need to stay raw.
  'simulate_transaction', 'validate_transaction'
]);

function summarizeToolResult(toolName: string, content: string): string {
  if (content.length < 300) return content;
  try {
    const parsed = JSON.parse(content);
    if (['add_approval', 'set_permissions', 'set_invariants', 'set_standards', 'set_valid_token_ids',
         'set_default_balances', 'set_is_archived', 'set_collection_metadata', 'set_token_metadata',
         'set_approval_metadata', 'set_mint_escrow_coins'].includes(toolName)) {
      return JSON.stringify({ _summarized: true, success: parsed.success, approvalId: parsed.approvalId });
    }
    if (toolName === 'get_transaction') return JSON.stringify({ _summarized: true, _note: 'Transaction already returned' });
    if (toolName === 'search_knowledge_base') {
      return JSON.stringify({ _summarized: true, query: parsed.query, matchedSections: (parsed.results || []).map((r: any) => r.section) });
    }
    if (toolName === 'query_collection') return JSON.stringify({ _summarized: true, collectionId: parsed.collectionId, standards: parsed.standards });
    if (toolName === 'fetch_docs') return JSON.stringify({ _summarized: true, _note: 'Documentation already consumed' });
    if (toolName === 'simulate_transaction') return JSON.stringify({ _summarized: true, valid: parsed.valid, error: parsed.error || undefined });
    if (toolName === 'validate_transaction') {
      const errorCount = (parsed.issues || []).filter((i: any) => i.severity === 'error').length;
      const warnCount = (parsed.issues || []).filter((i: any) => i.severity === 'warning').length;
      return JSON.stringify({ _summarized: true, valid: parsed.valid, errors: errorCount, warnings: warnCount });
    }
  } catch {
    // non-JSON — fall through to truncate
  }
  return content.substring(0, 200) + '...[compressed]';
}

export function compressOldToolResults(messages: any[]) {
  const toolResultMsgIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user' && Array.isArray(msg.content) && msg.content.some((b: any) => b.type === 'tool_result')) {
      toolResultMsgIndices.push(i);
    }
  }
  const toCompress = toolResultMsgIndices.slice(0, -2);
  for (const idx of toCompress) {
    const msg = messages[idx];
    if (!Array.isArray(msg.content)) continue;
    messages[idx] = {
      role: 'user',
      content: msg.content.map((block: any) => {
        if (block.type !== 'tool_result' || typeof block.content !== 'string') return block;
        let toolName = 'unknown';
        if (idx > 0) {
          const prev = messages[idx - 1];
          if (prev.role === 'assistant' && Array.isArray(prev.content)) {
            const toolUse = prev.content.find((b: any) => b.type === 'tool_use' && b.id === block.tool_use_id);
            if (toolUse) toolName = toolUse.name;
          }
        }
        if (!COMPRESSIBLE_TOOLS.has(toolName)) return block;
        return { ...block, content: summarizeToolResult(toolName, block.content) };
      })
    };
  }
}

async function callClaudeWithRetry(
  client: any,
  params: any,
  timeoutMs: number,
  maxRetries: number,
  abortSignal?: AbortSignal
): Promise<any> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (abortSignal?.aborted) throw new AbortedError();
    try {
      return await client.messages.create({ ...params, stream: false }, { timeout: timeoutMs, signal: abortSignal });
    } catch (err: any) {
      if (abortSignal?.aborted || err?.name === 'AbortError' || err?.name === 'APIUserAbortError') {
        throw new AbortedError();
      }
      if (err?.status === 401 || err?.status === 403) {
        throw new AnthropicAuthError(err?.message);
      }
      lastError = err;
      const isRetryable =
        err?.status === 429 || err?.status === 529 || err?.status >= 500 ||
        err?.code === 'ETIMEDOUT' || err?.code === 'ECONNRESET';
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError!;
}

const STATUS_MAP: Record<string, string> = {
  set_standards: 'Building...', set_valid_token_ids: 'Building...', set_invariants: 'Building...',
  set_default_balances: 'Building...', set_permissions: 'Building...', set_manager: 'Building...',
  set_collection_metadata: 'Building...', set_token_metadata: 'Building...', set_approval_metadata: 'Building...',
  set_custom_data: 'Building...', set_is_archived: 'Building...', set_mint_escrow_coins: 'Building...',
  add_approval: 'Building...', remove_approval: 'Building...', add_alias_path: 'Building...',
  add_cosmos_wrapper_path: 'Building...', get_transaction: 'Assembling...',
  validate_transaction: 'Validating...', review_collection: 'Reviewing...', simulate_transaction: 'Simulating...',
  search_knowledge_base: 'Researching...', fetch_docs: 'Researching...',
  lookup_claim_plugins: 'Researching...', lookup_token_info: 'Researching...'
};

function fireHook(fn: ((...args: any[]) => any) | undefined, ...args: any[]) {
  if (!fn) return;
  try {
    const ret = fn(...args);
    if (ret && typeof (ret as any).catch === 'function') (ret as any).catch(() => {});
  } catch {
    // swallow — hooks must not break builds
  }
}

export async function runAgentLoop(params: AgentLoopParams): Promise<AgentLoopResult> {
  const {
    client, systemPrompt, userMessage, userContent, registry, maxRounds, maxTokensPerBuild, anthropicTimeoutMs,
    existingMessages, model, sessionId, creatorAddress, abortSignal, hooks, debug,
    startingTokens = 0, startingCostUsd = 0,
    startingCacheCreationTokens = 0, startingCacheReadTokens = 0
  } = params;

  // Prefer cache-aware content blocks when provided; fall back to a
  // single-block unmarked string for legacy callers / fix-round replays.
  const initialUserBlocks = userContent && userContent.length > 0
    ? userContent
    : [{ type: 'text' as const, text: userMessage }];

  const messages: any[] = existingMessages
    ? [...existingMessages, { role: 'user', content: initialUserBlocks }]
    : [{ role: 'user', content: initialUserBlocks }];
  const toolCalls: ToolCallEvent[] = [];
  let finalText = '';
  let totalTokens = startingTokens;
  let totalCostUsd = startingCostUsd;
  let cacheCreationTokens = startingCacheCreationTokens;
  let cacheReadTokens = startingCacheReadTokens;
  let rounds = 0;

  if (debug) {
    console.error('[bitbadges-builder-agent] SYSTEM PROMPT:\n' + systemPrompt);
    console.error('[bitbadges-builder-agent] USER MESSAGE:\n' + userMessage);
  }

  try {
    for (let round = 0; round < maxRounds; round++) {
      if (abortSignal?.aborted) throw new AbortedError(totalTokens);

      const response = await callClaudeWithRetry(
        client,
        {
          model: model.id,
          max_tokens: 8192,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          tools: registry.definitions.map((t, i) =>
            i === registry.definitions.length - 1 ? { ...t, cache_control: { type: 'ephemeral' } } : t
          ),
          messages
        },
        anthropicTimeoutMs,
        2,
        abortSignal
      );

      rounds++;
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      // Anthropic reports prompt-cache usage on the `usage` object.
      // Snake-case in the raw HTTP shape; kept as-is by the SDK client.
      const roundCacheCreation = response.usage?.cache_creation_input_tokens ?? 0;
      const roundCacheRead = response.usage?.cache_read_input_tokens ?? 0;
      const roundTokens = inputTokens + outputTokens;
      totalTokens += roundTokens;
      cacheCreationTokens += roundCacheCreation;
      cacheReadTokens += roundCacheRead;
      totalCostUsd += computeCostUsd(inputTokens, outputTokens, model, roundCacheCreation, roundCacheRead);

      // onTokenUsage is LOAD-BEARING (not fire-and-forget). Consumers use
      // it to enforce per-build quotas — e.g. the BitBadges indexer's
      // TokenLedger throws out of here when cumulative scaled usage
      // crosses the user's budget. Awaited + throws propagate. Other
      // hooks (onToolCall, onStatusUpdate, onCompletion) stay
      // fire-and-forget because they're observability-only.
      if (hooks?.onTokenUsage) {
        await hooks.onTokenUsage({
          inputTokens,
          outputTokens,
          cacheCreationTokens: roundCacheCreation,
          cacheReadTokens: roundCacheRead,
          round,
          cumulativeTokens: totalTokens,
          cumulativeCacheCreationTokens: cacheCreationTokens,
          cumulativeCacheReadTokens: cacheReadTokens,
          cumulativeCostUsd: totalCostUsd,
          model: model.id
        });
      }

      if (totalTokens > maxTokensPerBuild) {
        throw new QuotaExceededError(totalTokens, maxTokensPerBuild);
      }

      if (debug) {
        console.error(
          `[bitbadges-builder-agent] round ${round + 1}/${maxRounds} stop_reason=${response.stop_reason} ` +
          `tokens_in=${inputTokens} out=${outputTokens} cache_write=${roundCacheCreation} cache_read=${roundCacheRead}`
        );
      }

      fireHook(hooks?.onLog, {
        type: 'info',
        label: `Round ${round + 1}`,
        data: {
          stop_reason: response.stop_reason,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_creation_tokens: roundCacheCreation,
          cache_read_tokens: roundCacheRead
        }
      });

      const textParts = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text);
      const roundText = textParts.join('\n');
      if (roundText) {
        finalText = roundText;
        fireHook(hooks?.onLog, { type: 'ai_text', label: 'AI response', data: roundText });
      }

      const toolUses = response.content.filter((b: any) => b.type === 'tool_use');
      if (toolUses.length === 0) break;

      messages.push({ role: 'assistant', content: response.content });
      const toolResultContents: any[] = [];

      for (const toolUse of toolUses) {
        if (abortSignal?.aborted) throw new AbortedError(totalTokens);

        const status = STATUS_MAP[toolUse.name];
        if (status) fireHook(hooks?.onStatusUpdate, status);

        const startedAt = Date.now();
        let resultString: string;
        try {
          resultString = await registry.execute(toolUse.name, toolUse.input as any, { sessionId, callerAddress: creatorAddress });
        } catch (e: any) {
          resultString = JSON.stringify({ error: `Tool execution failed: ${e?.message || String(e)}` });
        }
        const durationMs = Date.now() - startedAt;

        // Parse result so consumers see structured data, not a string.
        let parsedOutput: unknown = resultString;
        try { parsedOutput = JSON.parse(resultString); } catch { /* raw string */ }

        const event: ToolCallEvent = {
          name: toolUse.name,
          input: toolUse.input,
          output: parsedOutput,
          durationMs,
          round
        };
        toolCalls.push(event);
        fireHook(hooks?.onToolCall, event);

        if (debug) {
          console.error(`[bitbadges-builder-agent] tool ${toolUse.name} (${durationMs}ms): ${resultString.slice(0, 400)}`);
        }

        toolResultContents.push({ type: 'tool_result', tool_use_id: toolUse.id, content: resultString });
      }

      if (abortSignal?.aborted) throw new AbortedError(totalTokens);

      messages.push({ role: 'user', content: toolResultContents });
      compressOldToolResults(messages);
    }
  } catch (err: any) {
    if (err instanceof BitBadgesBuilderAgentError) throw err;
    // Preserve original error shape but attach token usage so caller
    // can track partial cost. Guard the assignment — some errors (frozen
    // objects, primitives thrown as "errors") can't take new props and
    // would turn a real error into a cryptic TypeError.
    try {
      err.partialTokens = totalTokens;
    } catch {
      // best-effort — caller still gets the original error
    }
    throw err;
  }

  return { messages, toolCalls, finalText, rounds, totalTokens, totalCostUsd, cacheCreationTokens, cacheReadTokens };
}

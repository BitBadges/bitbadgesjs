/**
 * Tool adapter — bridges the SDK's protocol-agnostic tool registry
 * (src/builder/tools/registry.ts) into the Anthropic Tool shape that
 * the agent loop consumes.
 *
 * Design:
 *  - One generic adapter loop instead of 50 bespoke wrappers. Every
 *    tool already has a `tool` schema and `run` function — we just
 *    map `inputSchema` → Anthropic's `input_schema` and wrap the
 *    handler in a context-aware async.
 *  - `add`/`remove` customization is applied at registry construction
 *    time so the returned registry is a plain `Map` the loop can use.
 *  - Custom tools contributed by callers use the same shape.
 */

import { toolRegistry as builtinToolRegistry, type ToolEntry as BuiltinToolEntry } from '../tools/registry.js';
import type { CustomTool, ToolExecutionContext } from './types.js';

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface AgentTool {
  definition: AnthropicTool;
  execute: (args: any, ctx: ToolExecutionContext) => Promise<any>;
}

export interface AgentToolRegistry {
  /** Anthropic-shaped tool definitions, in stable order. */
  definitions: AnthropicTool[];
  /** Names of all registered tools. */
  names: string[];
  /** Execute a tool by name. Returns a string (JSON-serialized) capped at 100KB. */
  execute: (toolName: string, args: any, ctx: ToolExecutionContext) => Promise<string>;
  /** Does a tool by this name exist? */
  has: (toolName: string) => boolean;
}

function toAnthropicTool(name: string, entry: BuiltinToolEntry): AnthropicTool {
  return {
    name,
    description: entry.tool.description,
    input_schema: {
      type: 'object',
      properties: entry.tool.inputSchema.properties,
      required: entry.tool.inputSchema.required
    }
  };
}

export interface CreateRegistryOptions {
  /** Remove builtins by name. */
  remove?: string[];
  /** Custom tools to register. Override builtins if names collide. */
  add?: CustomTool[];
  /**
   * Default args merged into every tool invocation. Used by the agent
   * to inject the BitBadges API key / URL into query tools without the
   * LLM having to know about credentials. Explicit tool args take
   * precedence over defaults.
   */
  defaultArgs?: Record<string, unknown>;
}

export function createAgentToolRegistry(options?: CreateRegistryOptions): AgentToolRegistry {
  const remove = new Set(options?.remove ?? []);
  const customByName = new Map<string, CustomTool>();
  for (const c of options?.add ?? []) {
    customByName.set(c.definition.name, c);
  }
  const defaultArgs = options?.defaultArgs ?? {};

  const definitions: AnthropicTool[] = [];
  const executors = new Map<string, (args: any, ctx: ToolExecutionContext) => Promise<any>>();

  const mergeDefaults = (args: any): any => {
    if (!defaultArgs || Object.keys(defaultArgs).length === 0) return args;
    const incoming = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
    // Explicit args win over defaults, but `undefined` must NOT knock
    // out a set default — that's the classic `{ ...defaults, foo:
    // undefined }` footgun. Strip undefined keys from the incoming
    // object before merging.
    const definedIncoming: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (v !== undefined) definedIncoming[k] = v;
    }
    return { ...defaultArgs, ...definedIncoming };
  };

  // Inject the agent's ToolExecutionContext (sessionId + callerAddress)
  // into every tool call. Critical for session-mutating tools
  // (set_permissions, add_approval, set_standards, etc.) which
  // internally call `getOrCreateSession(input.sessionId, input.creatorAddress)`
  // — they read sessionId from ARGS, not ctx. Without this injection
  // the LLM's tool calls would hit the SDK's default session and the
  // agent's `handleGetTransaction({ sessionId })` would read an empty
  // template, producing a blank final tx even though every tool call
  // "succeeded".
  //
  // Ordering: args spread first (LLM input), ctx overrides sessionId
  // + creatorAddress (the LLM cannot override the agent's session
  // binding), defaultArgs fills in any remaining missing keys.
  const injectCtx = (args: any, ctx: ToolExecutionContext): any => {
    const withCtx = {
      ...((args && typeof args === 'object' && !Array.isArray(args)) ? args : {}),
      sessionId: ctx.sessionId,
      creatorAddress: ctx.callerAddress
    };
    return mergeDefaults(withCtx);
  };

  // Builtins first — in their natural registry order
  for (const [name, entry] of Object.entries(builtinToolRegistry)) {
    if (remove.has(name)) continue;
    if (customByName.has(name)) continue; // custom takes precedence
    definitions.push(toAnthropicTool(name, entry));
    executors.set(name, async (args: any, ctx: ToolExecutionContext) => entry.run(injectCtx(args, ctx)));
  }

  // Custom tools appended at the end
  for (const custom of customByName.values()) {
    definitions.push({
      name: custom.definition.name,
      description: custom.definition.description,
      input_schema: custom.definition.input_schema
    });
    executors.set(custom.definition.name, async (args, ctx) => custom.execute(injectCtx(args, ctx), ctx));
  }

  const names = definitions.map((d) => d.name);

  return {
    definitions,
    names,
    has: (toolName) => executors.has(toolName),
    async execute(toolName, args, ctx) {
      const fn = executors.get(toolName);
      if (!fn) return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      try {
        const result = await fn(args, ctx);
        const s = typeof result === 'string' ? result : JSON.stringify(result);
        if (s.length > 100_000) {
          // Return valid JSON so the LLM doesn't choke trying to parse a
          // slice + text-suffix combo. Preview is sized to comfortably
          // fit the whole wrapper under 100KB even after JSON escaping.
          return JSON.stringify({
            _truncated: true,
            originalBytes: s.length,
            preview: s.slice(0, 90_000)
          });
        }
        return s;
      } catch (err: any) {
        return JSON.stringify({ error: err?.message || 'Tool execution failed' });
      }
    }
  };
}

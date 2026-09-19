export type { StandardDescriptor, StandardOperation } from '../standards.js';
import { describeStandards } from '../standards.js';
/**
 * Central tool registry.
 *
 * Single source of truth for every builder tool. Used by:
 *  - src/server.ts (Model Context Protocol (MCP) stdio transport — wraps entries into ListTools/CallTool handlers)
 *  - external consumers (e.g. bitbadges-cli) that import this module and invoke
 *    tools as plain functions, bypassing the MCP stdio transport.
 *
 * Each entry has a `tool` schema (for discovery) and a `run` function that takes
 * raw args and returns a structured result. An optional `formatText` controls how
 * the result is serialized for the text content block returned over MCP; by default we JSON
 * stringify. The registry itself is protocol-agnostic — it never returns transport-shaped
 * content blocks directly.
 */

import {
  // Utilities
  lookupTokenInfoTool, handleLookupTokenInfo,
  validateTransactionTool, handleValidateTransaction,
  getCurrentTimestampTool, handleGetCurrentTimestamp,
  flagReviewItemTool, handleFlagReviewItem,
  // Components
  generateBackingAddressTool, handleGenerateBackingAddress,
  generateApprovalTool, handleGenerateApproval,
  generatePermissionsTool, handleGeneratePermissions,
  generateAliasPathTool, handleGenerateAliasPath,
  // Address utilities
  convertAddressTool, handleConvertAddress,
  validateAddressTool, handleValidateAddress,
  // Documentation
  fetchDocsTool, handleFetchDocs,
  // Query tools
  queryCollectionTool, handleQueryCollection,
  queryBalanceTool, handleQueryBalance,
  simulateTransactionTool, handleSimulateTransaction,
  verifyOwnershipTool, handleVerifyOwnership,
  searchTool, handleSearch,
  searchPluginsTool, handleSearchPlugins,
  // Knowledge base
  searchKnowledgeBaseTool, handleSearchKnowledgeBase,
  diagnoseErrorTool, handleDiagnoseError,
  // Collection analysis
  analyzeCollectionTool, handleAnalyzeCollection,
  buildTransferTool, handleBuildTransfer,
  // Dynamic store
  buildDynamicStoreTool, handleBuildDynamicStore,
  queryDynamicStoreTool, handleQueryDynamicStore,
  // Explain
  explainCollectionTool, handleExplainCollection,
  // Unified review
  reviewCollectionTool, handleReviewCollection,
  // Claim builder
  buildClaimTool, handleBuildClaim,
  // Session-based per-field tools (v2)
  setStandardsTool, handleSetStandards,
  setValidTokenIdsTool, handleSetValidTokenIds,
  setDefaultBalancesTool, handleSetDefaultBalances,
  setPermissionsTool, handleSetPermissions,
  setInvariantsTool, handleSetInvariants,
  setManagerTool, handleSetManager,
  setCollectionMetadataTool, handleSetCollectionMetadata,
  setTokenMetadataTool, handleSetTokenMetadata,
  setCustomDataTool, handleSetCustomData,
  setMintEscrowCoinsTool, handleSetMintEscrowCoins,
  addApprovalTool, handleAddApproval,
  addPresetApprovalTool, handleAddPresetApproval,
  removeApprovalTool, handleRemoveApproval,
  listPresetsTool, handleListPresets,
  setApprovalMetadataTool, handleSetApprovalMetadata,
  addAliasPathTool, handleAddAliasPath,
  removeAliasPathTool, handleRemoveAliasPath,
  addCosmosWrapperPathTool, handleAddCosmosWrapperPath,
  removeCosmosWrapperPathTool, handleRemoveCosmosWrapperPath,
  addTransferTool, handleAddTransfer,
  removeTransferTool, handleRemoveTransfer,
  getTransactionTool, handleGetTransaction,
  getReviewUrlTool, handleGetReviewUrl,
  resetSessionTool, handleResetSession,
  setIsArchivedTool, handleSetIsArchived,
  generateUniqueIdTool, handleGenerateUniqueId,
  generateWrapperAddressTool, handleGenerateWrapperAddress
} from './index.js';

import { getSkillInstructions, getAllSkillInstructions } from '../resources/index.js';
import { buildPaymentRequestV2Tool, handleBuildPaymentRequestV2 } from './builders/buildPaymentRequestV2.js';
import { createHash } from 'node:crypto';
import { standardBuilderTools } from './builders/buildStandard.js';
import { createStandardActionTools, executeInstalledCli } from './standardActions.js';
import { getSigningRequestStatus, listSigningRequests } from '../../cli/utils/signing-requests.js';
import { z } from 'zod';
import { artifactIdentity, parseIntent, verifyIntent, repairArtifact } from '../../core/intent.js';
import { getSessionBinding } from '../session/artifactBinding.js';
import { getTransaction, ensureStringNumbers } from '../session/sessionState.js';
import { toolFailure, type ToolFailure } from './errors.js';
import { runLifecycle, getLifecycleSchema, lifecycleDiagnostics } from '../lifecycle.js';

// Re-export session persistence helpers so external consumers (e.g.
// bitbadges-cli) can snapshot / restore session state across process
// invocations without importing a second subpath.
export { exportSession, importSession } from '../session/sessionState.js';

// Re-export the resource registry so consumers get tools + resources from one
// import. Resources are static documents (token registry, recipes, skill docs,
// error patterns, etc.) — the other half of the builder surface.
export {
  resourceRegistry,
  listResources,
  readResource,
  type ResourceInfo,
  type ResourceEntry,
  type ReadResourceResult
} from '../resources/registry.js';

/** Builder tool schema shape — kept loose to avoid coupling to a specific SDK version. */
export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolEntry {
  /** MCP-shaped schema for discovery (ListTools). */
  tool: ToolSchema;
  /** Invoke the tool. Receives raw args and returns a structured result. */
  run: (args: any) => Promise<any> | any;
  /**
   * Optional custom text serializer for MCP content blocks when used through the stdio transport.
   * Defaults to `JSON.stringify(result, null, 2)`.
   */
  formatText?: (result: any) => string;
}

/** Helper to build a simple sync/async pass-through entry. */
function entry(tool: any, run: (args: any) => any, formatText?: (result: any) => string): ToolEntry {
  return { tool, run, formatText };
}

// Inline schemas for tools that were previously defined ad-hoc in server.ts.
//
// The `get_skill_instructions` tool surface is derived from the live
// `SKILL_INSTRUCTIONS` array at module init — see backlog #0241. A previous
// hard-coded list drifted: it advertised two IDs that no longer existed and
// omitted six that did, leading agents to request nonexistent skills and miss
// curated ones (auto-mint, prediction-market, bounty, crowdfund, auction,
// product-catalog). Computing the list here means every future skill addition
// appears in the tool description automatically — no manual sync required.
const availableSkillIds = getAllSkillInstructions()
  .map((s) => s.id)
  .sort();
const skillIdList = availableSkillIds.join(', ');

const getSkillInstructionsTool: ToolSchema = {
  name: 'get_skill_instructions',
  description: `Get detailed instructions for a specific skill. Skills: ${skillIdList}. Decision matrices are in bitbadges://recipes/all.`,
  inputSchema: {
    type: 'object',
    properties: {
      skillId: {
        type: 'string',
        description: `Skill ID. One of: ${skillIdList}.`
      }
    },
    required: ['skillId']
  }
};

/**
 * The tool registry. Keys are builder tool names.
 */
export const toolRegistry: Record<string, ToolEntry> = {
  run_lifecycle: entry({ name: 'run_lifecycle', description: 'Execute an isolated local module lifecycle using an installed bitbadges-lifecycle runner. Never signs or broadcasts; requiredCoverage reports unverified external/IBC checks. Read lifecycle_schema first.', inputSchema: { type: 'object', properties: { scenario: { type: 'object' }, requiredCoverage: { type: 'array', items: { type: 'string' }, maxItems: 30 } }, required: ['scenario'] } },
    (args) => runLifecycle(z.object({ scenario: z.record(z.unknown()), requiredCoverage: z.array(z.string().max(100)).max(30).optional() }).strict().parse(args))),
  lifecycle_schema: entry({ name: 'lifecycle_schema', description: 'Read installed local runner scenario schema, including exact assertions and time controls. Offline; requires the optional runner executable.', inputSchema: { type: 'object', properties: {} } },
    (args) => { z.object({}).strict().parse(args); return getLifecycleSchema(); }),
  environment_diagnostics: entry({ name: 'environment_diagnostics', description: 'Inspect installed schema versions, local lifecycle runner, and configured service readiness without returning credentials or making network calls.', inputSchema: { type: 'object', properties: {} } },
    async (args) => { z.object({}).strict().parse(args); return { version: 1, catalogHash: getCapabilityCatalog().catalogHash, schemas: { intent: 1, lifecycle: 1, browserRequest: 2 }, offline: ['discovery', 'skills', 'build', 'static-review', 'intent-check'], runner: await lifecycleDiagnostics(), services: { simulation: process.env.BITBADGES_API_KEY ? 'configured-not-probed' : 'credentials-required', signing: 'wallet-and-browser-required', model: 'optional-not-probed' } }; }),
  verify_intent: entry({ name: 'verify_intent', description: 'Compare exact user requirements against an explicit artifact. Returns satisfied, violated or unverified per requirement. Static evidence never establishes lifecycle or external-service success.', inputSchema: { type: 'object', properties: { artifact: { type: 'object' }, intent: { type: 'object', description: 'Version1 requirements and unresolvedDecisions. See installed task bundles.' } }, required: ['artifact', 'intent'] } },
    (args) => { const input = z.object({ artifact: z.record(z.unknown()), intent: z.unknown() }).strict().parse(args); return verifyIntent(input.artifact, input.intent); }),
  validate_intent: entry({ name: 'validate_intent', description: 'Validate an intent sidecar, reject contradictory constraints, and list decisions requiring clarification.', inputSchema: { type: 'object', properties: { intent: { type: 'object' } }, required: ['intent'] } },
    (args) => { const { intent } = z.object({ intent: z.unknown() }).strict().parse(args); const parsed = parseIntent(intent); return { intent: parsed, intentId: artifactIdentity(parsed), clarificationRequired: parsed.unresolvedDecisions.length > 0 || parsed.requirements.some(r => r.value === null || r.kind === 'unsupported') }; }),
  verify_repairs: entry({ name: 'verify_repairs', description: 'Check at most three candidate repairs against unchanged original intent. Preserve every attempted evidence revision. Unsupported requirements stop repair; never signs or submits.', inputSchema: { type: 'object', properties: { intent: { type: 'object' }, original: { type: 'object' }, candidates: { type: 'array', maxItems: 3, items: { type: 'object' } } }, required: ['intent', 'original', 'candidates'] } },
    (args) => repairArtifact(z.object({ intent: z.record(z.unknown()), original: z.record(z.unknown()), candidates: z.array(z.record(z.unknown())).max(3) }).strict().parse(args))),
  ...standardBuilderTools,
  ...createStandardActionTools(executeInstalledCli, () => getCapabilityCatalog().catalogHash),
  list_signing_requests: {
    tool: { name: 'list_signing_requests', description: 'List saved local browser request IDs. Does not sign or submit.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } } as ToolSchema,
    run: (args: unknown) => { z.object({}).strict().parse(args); return { requestIds: listSigningRequests() }; }
  },
  signing_request_status: {
    tool: { name: 'signing_request_status', description: 'Inspect a saved browser request. With resume=true, returns the same URL only while its original listener is live. Never creates or submits another transaction; unknown outcomes require reconciliation.', inputSchema: { type: 'object', properties: { requestId: { type: 'string', pattern: '^[a-f0-9]{32}$' }, resume: { type: 'boolean' } }, required: ['requestId'], additionalProperties: false } } as ToolSchema,
    run: (args: unknown) => { const input = z.object({ requestId: z.string().regex(/^[a-f0-9]{32}$/), resume: z.boolean().optional() }).strict().parse(args); return getSigningRequestStatus(input.requestId, input.resume); }
  },
  get_standards: entry(
    {
      name: 'get_standards',
      description: 'Discover installed standard lifecycle support and limitations. Supply id for builders, actions, required inputs, and unsupported operations. Equivalent to bb dev standards [id]. Offline; does not evaluate live eligibility.',
      inputSchema: { type: 'object', additionalProperties: false, properties: { id: { type: 'string' } } }
    },
    (args) => getStandardCatalog(args.id)
  ),
  get_capabilities: entry(
    {
      name: 'get_capabilities',
      description: 'Discover installed CLI/MCP operations without fetching full schemas. Supply id for one operation schema. Equivalent to bb dev capabilities [id].',
      inputSchema: { type: 'object', additionalProperties: false, properties: { id: { type: 'string' } } }
    },
    (args) => getCapabilityCatalog(args.id)
  ),
  list_skills: entry(
    {
      name: 'list_skills',
      description: 'List installed canonical skill summaries. Equivalent to bb dev skills; read details with get_skill_instructions using skillId.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {} }
    },
    () => getAllSkillInstructions().map(({ instructions: _instructions, ...summary }) => summary)
  ),
  build_payment_request_v2: entry(buildPaymentRequestV2Tool, handleBuildPaymentRequestV2),
  // Utilities
  lookup_token_info: entry(lookupTokenInfoTool, handleLookupTokenInfo),
  validate_transaction: entry(validateTransactionTool, handleValidateTransaction),
  get_current_timestamp: entry(getCurrentTimestampTool, handleGetCurrentTimestamp),
  flag_review_item: entry(flagReviewItemTool, handleFlagReviewItem),

  // Components
  generate_backing_address: entry(generateBackingAddressTool, handleGenerateBackingAddress),
  generate_approval: entry(generateApprovalTool, handleGenerateApproval),
  generate_permissions: entry(generatePermissionsTool, handleGeneratePermissions),
  generate_alias_path: entry(generateAliasPathTool, handleGenerateAliasPath),

  // Skill instructions (inline)
  get_skill_instructions: entry(getSkillInstructionsTool, (args: { skillId: string }) => {
    const instruction = getSkillInstructions(args.skillId);
    if (instruction) return instruction;
    const allSkills = getAllSkillInstructions();
    return {
      error: `Skill "${args.skillId}" not found`,
      available: allSkills.map((s) => s.id)
    };
  }),

  // Address utilities
  convert_address: entry(convertAddressTool, handleConvertAddress),
  validate_address: entry(validateAddressTool, handleValidateAddress),

  // Documentation
  fetch_docs: entry(fetchDocsTool, async (args: any) => await handleFetchDocs(args)),

  // Knowledge base
  search_knowledge_base: entry(searchKnowledgeBaseTool, handleSearchKnowledgeBase),
  diagnose_error: entry(diagnoseErrorTool, handleDiagnoseError),

  // Query tools (require API key)
  query_collection: entry(queryCollectionTool, async (args: any) => await handleQueryCollection(args)),
  query_balance: entry(queryBalanceTool, async (args: any) => await handleQueryBalance(args)),
  simulate_transaction: entry(simulateTransactionTool, async (args: any) => await handleSimulateTransaction(args)),
  verify_ownership: entry(verifyOwnershipTool, async (args: any) => await handleVerifyOwnership(args)),
  search: entry(searchTool, async (args: any) => await handleSearch(args)),
  search_plugins: entry(searchPluginsTool, async (args: any) => await handleSearchPlugins(args)),

  // Collection analysis
  analyze_collection: entry(analyzeCollectionTool, async (args: any) => await handleAnalyzeCollection(args)),
  build_transfer: entry(buildTransferTool, async (args: any) => await handleBuildTransfer(args)),

  // Dynamic store
  build_dynamic_store: entry(buildDynamicStoreTool, handleBuildDynamicStore),
  query_dynamic_store: entry(queryDynamicStoreTool, async (args: any) => await handleQueryDynamicStore(args)),

  // Unified review (preferred)
  review_collection: entry(reviewCollectionTool, handleReviewCollection),

  // Explain / claim
  explain_collection: entry(
    explainCollectionTool,
    handleExplainCollection,
    (result: any) => (result?.success ? result.explanation : JSON.stringify(result, null, 2))
  ),
  build_claim: entry(buildClaimTool, handleBuildClaim),

  // Session-based per-field tools (v2)
  set_standards: entry(setStandardsTool, handleSetStandards),
  set_valid_token_ids: entry(setValidTokenIdsTool, handleSetValidTokenIds),
  set_default_balances: entry(setDefaultBalancesTool, handleSetDefaultBalances),
  set_permissions: entry(setPermissionsTool, handleSetPermissions),
  set_invariants: entry(setInvariantsTool, handleSetInvariants),
  set_manager: entry(setManagerTool, handleSetManager),
  set_collection_metadata: entry(setCollectionMetadataTool, handleSetCollectionMetadata),
  set_token_metadata: entry(setTokenMetadataTool, handleSetTokenMetadata),
  set_custom_data: entry(setCustomDataTool, handleSetCustomData),
  set_mint_escrow_coins: entry(setMintEscrowCoinsTool, handleSetMintEscrowCoins),
  add_approval: entry(addApprovalTool, handleAddApproval),
  add_preset_approval: entry(addPresetApprovalTool, handleAddPresetApproval),
  remove_approval: entry(removeApprovalTool, handleRemoveApproval),
  list_presets: entry(listPresetsTool, handleListPresets),
  set_approval_metadata: entry(setApprovalMetadataTool, handleSetApprovalMetadata),
  add_alias_path: entry(addAliasPathTool, handleAddAliasPath),
  remove_alias_path: entry(removeAliasPathTool, handleRemoveAliasPath),
  add_cosmos_wrapper_path: entry(addCosmosWrapperPathTool, handleAddCosmosWrapperPath),
  remove_cosmos_wrapper_path: entry(removeCosmosWrapperPathTool, handleRemoveCosmosWrapperPath),
  add_transfer: entry(addTransferTool, handleAddTransfer),
  remove_transfer: entry(removeTransferTool, handleRemoveTransfer),
  get_transaction: entry(getTransactionTool, handleGetTransaction),
  get_review_url: entry(getReviewUrlTool, async (args: any) => await handleGetReviewUrl(args)),
  reset_session: entry(resetSessionTool, handleResetSession),
  // NOTE: `generate_placeholder_art` removed from the LLM tool catalog.
  // The builder agent no longer calls it — get_transaction auto-fills
  // any blank `image` field with a deterministic SVG seeded by the
  // collection name. This removes ~1 round + all the base64 echoes the
  // LLM used to propagate across set_*_metadata calls. See
  // tools/session/getTransaction.ts for the fill logic, and the
  // `_artHints` sidecar escape hatch documented there.
  set_is_archived: entry(setIsArchivedTool, handleSetIsArchived),
  generate_unique_id: entry(generateUniqueIdTool, handleGenerateUniqueId),
  generate_wrapper_address: entry(generateWrapperAddressTool, handleGenerateWrapperAddress)
};

export function getStandardCatalog(id?: string) {
  return describeStandards(toolRegistry, id);
}

export function getCapabilityCatalog(id?: string) {
  if (id !== undefined && (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(toolRegistry, id))) {
    throw new Error(`Unknown capability: ${String(id)}. Run bb dev capabilities to list installed operations.`);
  }
  const entries = Object.entries(toolRegistry).sort(([left], [right]) => left.localeCompare(right));
  const catalogHash = createHash('sha256').update(JSON.stringify(entries.map(([, entry]) => entry.tool))).digest('hex');
  return {
    schemaVersion: 1,
    catalogHash,
    primaryInterface: 'cli',
    scope: 'Shared builders, supported standard actions, and local signing-request recovery. Other CLI commands and native Cosmos commands remain discoverable with bb --help-json and bb tx --help.',
    capabilities: entries.filter(([name]) => id === undefined || name === id).map(([name, entry]) => ({
      id: name,
      description: entry.tool.description,
      cli: ['bb', 'dev', 'tools', 'call', name],
      mcp: name,
      ...(id !== undefined ? { inputSchema: entry.tool.inputSchema } : {})
    }))
  };
}

/** List every registered tool schema in registry order. */
export function listTools(): ToolSchema[] {
  return Object.values(toolRegistry).map((e) => e.tool);
}

export interface CallToolResult {
  /** Text representation suitable for MCP text content blocks. */
  text: string;
  /** Structured result from the handler (null on error). */
  result: any;
  /** True if the call threw. */
  isError?: boolean;
  error?: ToolFailure;
}

/**
 * Pre-flight check against `tool.inputSchema` (JSON-Schema-shaped). Catches
 * the two LLM-agent footguns that handlers were silently tolerating:
 *
 *   1. **Missing required field** — handler reads `args.foo.toString()` and
 *      crashes with "Cannot read properties of undefined". An LLM agent
 *      gets a stack trace instead of "missing required field 'foo'".
 *
 *   2. **Wrong arg key** — agent passes `tokenIds` instead of
 *      `validTokenIds`. Without `additionalProperties: false`, the handler
 *      silently treats the field as missing and proceeds; state never
 *      gets set; the agent thinks the call succeeded.
 *
 * We check JSON Schema `required` always, and optionally `additionalProperties`
 * when the tool's schema declares it `false`. Tools that DON'T set
 * `additionalProperties: false` retain their existing tolerant behavior
 * (some legitimately accept arbitrary kwargs).
 */
function preflightArgs(tool: any, args: any): { ok: true } | { ok: false; error: string } {
  const schema = tool?.inputSchema;
  if (!schema || typeof schema !== 'object') return { ok: true };
  const argsObj = args && typeof args === 'object' && !Array.isArray(args) ? args : {};

  // Required fields
  if (Array.isArray(schema.required) && schema.required.length > 0) {
    const missing: string[] = [];
    for (const key of schema.required) {
      // A property marked `allowEmpty` accepts "" as a real value rather than
      // a gap. `image` is the case that matters: the system prompt tells the
      // model to send `image: ""` when the user uploaded no art, and
      // get_transaction fills blanks with generated art. Rejecting "" made the
      // documented happy path fail on the two most-called tools with an error
      // that contradicted the prompt. Everything else still rejects "".
      const allowEmpty = schema.properties?.[key]?.allowEmpty === true;
      const value = argsObj[key];
      if (value === undefined || value === null || (value === '' && !allowEmpty)) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      const expected = Array.isArray(schema.required) ? schema.required.join(', ') : '';
      return {
        ok: false,
        error: `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.${expected ? ` Expected: ${expected}` : ''}`
      };
    }
  }

  // Unknown fields (only when explicitly closed)
  if (schema.additionalProperties === false && schema.properties && typeof schema.properties === 'object') {
    const allowed = new Set(Object.keys(schema.properties));
    const unknown = Object.keys(argsObj).filter((k) => !allowed.has(k));
    if (unknown.length > 0) {
      const allowedList = [...allowed].join(', ');
      return {
        ok: false,
        error: `Unknown field${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Allowed: ${allowedList}.`
      };
    }
  }
  return { ok: true };
}

/**
 * Format a thrown error for tool consumers. Recognizes Zod issues and
 * renders them as `path: message` lines instead of a giant JSON dump.
 * Falls back to plain `error.message` for anything else.
 */
function formatToolError(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as any;
  // Zod errors have `issues: ZodIssue[]` with `path` + `message` per entry.
  if (Array.isArray(e.issues) && e.issues.length > 0 && e.issues[0]?.message) {
    const lines = e.issues.map((i: any) => {
      const path = Array.isArray(i.path) && i.path.length > 0 ? i.path.join('.') : '(root)';
      return `${path}: ${i.message}`;
    });
    return `Invalid input — ${e.issues.length} issue${e.issues.length > 1 ? 's' : ''}:\n  ${lines.join('\n  ')}`;
  }
  return e.message ? String(e.message) : String(err);
}

/**
 * Invoke a tool by name. Never throws — errors are captured into the result.
 */
export async function callTool(name: string, args: any): Promise<CallToolResult> {
  const tool = toolRegistry[name];
  if (!tool) {
    return { text: `Unknown tool: ${name}`, result: null, isError: true, error: toolFailure(null, 'unknown_tool') };
  }
  // Centralized pre-flight: catches missing-required and unknown-field
  // mistakes BEFORE the handler runs. Without this, handlers dereferencing
  // a missing field would crash with "Cannot read properties of undefined"
  // and agents would get a stack trace instead of a structured error.
  const pre = preflightArgs(tool.tool, args);
  if (!pre.ok) {
    return { text: `Error: ${pre.error}`, result: null, isError: true, error: { ...toolFailure(null, 'invalid_input'), issues: [{ path: '(root)', message: pre.error }] } };
  }
  try {
    let binding: ReturnType<typeof getSessionBinding> | undefined;
    const checking = name === 'validate_transaction' || name === 'simulate_transaction';
    if (checking) {
      if (args.transaction !== undefined && args.transactionJson !== undefined) throw new Error('Pass either transaction or transactionJson, never both.');
      if (args.transaction === undefined && args.transactionJson === undefined) {
        const snapshot = JSON.parse(JSON.stringify(ensureStringNumbers({ messages: getTransaction(args.sessionId, args.creatorAddress).messages })));
        binding = getSessionBinding(args.sessionId);
        args = { ...args, transaction: snapshot };
      }
    }
    let result = await tool.run(args);
    if (checking) {
      const artifact = args.transaction !== undefined ? args.transaction : JSON.parse(args.transactionJson);
      result = { ...result, evidenceBinding: { artifactId: artifactIdentity(artifact), ...(binding ? { sessionId: binding.sessionId, revision: binding.revision } : {}) } };
    } else if (tool.tool.inputSchema.properties?.sessionId && name !== 'reset_session') {
      result = { ...result, sessionBinding: getSessionBinding(args.sessionId) };
    }
    const text = tool.formatText ? tool.formatText(result) : JSON.stringify(result, null, 2);
    return { text, result, ...(result?.success === false || result?.ok === false || result?.valid === false ? { isError: true } : {}) };
  } catch (error) {
    return {
      text: `Error: ${formatToolError(error)}`,
      result: null,
      isError: true,
      error: toolFailure(error)
    };
  }
}

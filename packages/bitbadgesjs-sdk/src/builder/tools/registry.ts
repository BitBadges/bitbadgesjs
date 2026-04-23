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
  setIsArchivedTool, handleSetIsArchived,
  generateUniqueIdTool, handleGenerateUniqueId,
  generateWrapperAddressTool, handleGenerateWrapperAddress
} from './index.js';

import { getSkillInstructions, getAllSkillInstructions } from '../resources/index.js';

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
      if (argsObj[key] === undefined || argsObj[key] === null || argsObj[key] === '') {
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
    return { text: `Unknown tool: ${name}`, result: null, isError: true };
  }
  // Centralized pre-flight: catches missing-required and unknown-field
  // mistakes BEFORE the handler runs. Without this, handlers dereferencing
  // a missing field would crash with "Cannot read properties of undefined"
  // and agents would get a stack trace instead of a structured error.
  const pre = preflightArgs(tool.tool, args);
  if (!pre.ok) {
    return { text: `Error: ${pre.error}`, result: null, isError: true };
  }
  try {
    const result = await tool.run(args);
    const text = tool.formatText ? tool.formatText(result) : JSON.stringify(result, null, 2);
    return { text, result };
  } catch (error) {
    return {
      text: `Error: ${formatToolError(error)}`,
      result: null,
      isError: true
    };
  }
}

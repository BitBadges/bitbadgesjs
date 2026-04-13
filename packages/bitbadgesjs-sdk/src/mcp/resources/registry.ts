/**
 * Central resource registry.
 *
 * Mirrors the tool registry (src/tools/registry.ts). Single source of truth
 * for every MCP resource so the stdio server and library consumers
 * (bitbadges-cli, bitbadgeschaind) see the same surface.
 *
 * A resource is a static-ish document addressed by URI. Unlike tools, reads
 * are idempotent and take no args — each entry just holds the metadata block
 * and a `read()` function that returns the body as a string.
 */

import {
  tokenRegistryResourceInfo,
  getTokenRegistryContent,
  masterPromptResourceInfo,
  getMasterPromptContent,
  formatSkillInstructionsForDisplay,
  conceptsDocsResourceInfo,
  getConceptsDocsContent,
  examplesDocsResourceInfo,
  getExamplesDocsContent,
  recipesResourceInfo,
  getRecipesContent,
  learningsResourceInfo,
  getLearningsContent,
  errorPatternsResourceInfo,
  getErrorPatternsContent,
  frontendDocsResourceInfo,
  getFrontendDocsContent,
  workflowsResourceInfo,
  getWorkflowsContent,
  tokenSchemaResourceInfo,
  getTokenSchemaContent
} from './index.js';

export interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceEntry {
  info: ResourceInfo;
  read: () => string;
}

// Inline ResourceInfo for the skills resource — it was defined ad-hoc inside
// server.ts before. Keeping the same metadata the MCP server used to expose.
const skillsAllInfo: ResourceInfo = {
  uri: 'bitbadges://skills/all',
  name: 'Skill Instructions',
  description: 'Instructions for all builder skills',
  mimeType: 'text/markdown'
};

export const resourceRegistry: Record<string, ResourceEntry> = {
  [tokenRegistryResourceInfo.uri]: {
    info: tokenRegistryResourceInfo,
    read: () => JSON.stringify(getTokenRegistryContent(), null, 2)
  },
  [masterPromptResourceInfo.uri]: {
    info: masterPromptResourceInfo,
    read: () => getMasterPromptContent()
  },
  [skillsAllInfo.uri]: {
    info: skillsAllInfo,
    read: () => formatSkillInstructionsForDisplay()
  },
  [conceptsDocsResourceInfo.uri]: {
    info: conceptsDocsResourceInfo,
    read: () => getConceptsDocsContent()
  },
  [examplesDocsResourceInfo.uri]: {
    info: examplesDocsResourceInfo,
    read: () => getExamplesDocsContent()
  },
  [recipesResourceInfo.uri]: {
    info: recipesResourceInfo,
    read: () => getRecipesContent()
  },
  [learningsResourceInfo.uri]: {
    info: learningsResourceInfo,
    read: () => getLearningsContent()
  },
  [errorPatternsResourceInfo.uri]: {
    info: errorPatternsResourceInfo,
    read: () => getErrorPatternsContent()
  },
  [frontendDocsResourceInfo.uri]: {
    info: frontendDocsResourceInfo,
    read: () => getFrontendDocsContent()
  },
  [workflowsResourceInfo.uri]: {
    info: workflowsResourceInfo,
    read: () => getWorkflowsContent()
  },
  [tokenSchemaResourceInfo.uri]: {
    info: tokenSchemaResourceInfo,
    read: () => getTokenSchemaContent()
  }
};

/** List every registered resource metadata block in registry order. */
export function listResources(): ResourceInfo[] {
  return Object.values(resourceRegistry).map((e) => e.info);
}

export interface ReadResourceResult {
  uri: string;
  mimeType: string;
  text: string;
  isError?: boolean;
}

/**
 * Read a resource by URI. Never throws — unknown URIs return an error result.
 */
export function readResource(uri: string): ReadResourceResult {
  const entry = resourceRegistry[uri];
  if (!entry) {
    return {
      uri,
      mimeType: 'text/plain',
      text: `Unknown resource: ${uri}`,
      isError: true
    };
  }
  try {
    return {
      uri,
      mimeType: entry.info.mimeType,
      text: entry.read()
    };
  } catch (error) {
    return {
      uri,
      mimeType: 'text/plain',
      text: `Error reading resource: ${error instanceof Error ? error.message : String(error)}`,
      isError: true
    };
  }
}

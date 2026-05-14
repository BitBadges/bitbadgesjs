/**
 * `bitbadges-cli dev` — agent-facing surface for builder primitives,
 * resource fetches, docs lookup, skill text, and pubkey derivation.
 *
 * The v1 layout had these spread across six top-level commands
 * (`tools`, `tool`, `resources`, `docs`, `skills`, `gen-pub-key`).
 * v2 consolidates under `dev` so the human-facing top level stays
 * dominated by `build`, the 12 standards, `deploy`, `account`, etc.
 * — and the agent-flavored primitives live one verb away:
 *
 *   bb dev tools list             — list every builder tool with its schema
 *   bb dev tools call <name>      — invoke a single tool by name
 *   bb dev resources list         — list every static resource
 *   bb dev resources read <uri>   — fetch a resource body by URI
 *   bb dev docs [section]         — docs lookup
 *   bb dev skills [skillId]       — builder skill text
 *   bb dev gen-pub-key <addr>     — derive base64-compressed secp256k1 pubkey
 *
 * The singular `tool` (call-a-tool) is folded into `tools call`; the
 * plural `tools` (list-all) becomes `tools list`. Old top-level
 * commands stay reachable for one release as deprecated aliases (wired
 * in cli/index.ts).
 *
 * Implementation note: we attach the existing top-level Command
 * instances directly under `dev` rather than re-implementing the
 * actions. The `tools list` / `tools call` rename uses Commander's
 * `.name(...)` setter — Commander's `.commands[]` is the source of
 * truth for help-tree, so renaming in place is safe (no consumers
 * elsewhere read the name).
 */

import { Command } from 'commander';
import { toolsCommand } from './tools.js';
import { toolCommand } from './tool.js';
import { resourcesCommand } from './resources.js';
import { docsCommand } from './docs.js';
import { skillsCommand } from './skills.js';
import { genPubKeyCommand } from './gen-pub-key.js';

export const devCommand = new Command('dev').description(
  'Builder primitives, resources, docs, skills, pubkey derivation — agent-facing surface.'
);

// ── tools (list + call) ─────────────────────────────────────────────────────
//
// Collapse the singular `tool` and plural `tools` into one nested
// surface. `tools list` = the old plural; `tools call <name>` = the
// old singular. The plural becomes the parent so muscle memory ports
// over: `bb tools` (v1) → `bb dev tools list` (v2).

const toolsParent = new Command('tools').description(
  'List or invoke fine-grained builder tools.'
);

// Rename the existing top-level Commands so they fit under `tools`.
// Commander's `.name(...)` setter mutates the underlying `_name`; the
// parent's help tree reads from `.commands[].name()` so this rename
// propagates without re-wiring options/actions.
(toolsCommand as any).name('list');
(toolCommand as any).name('call');
toolsParent.addCommand(toolsCommand);
toolsParent.addCommand(toolCommand);

devCommand.addCommand(toolsParent);

// ── resources, docs, skills, gen-pub-key (mounted as-is) ────────────────────

devCommand.addCommand(resourcesCommand);
devCommand.addCommand(docsCommand);
devCommand.addCommand(skillsCommand);
devCommand.addCommand(genPubKeyCommand);

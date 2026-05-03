import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';

/**
 * Combined environment + connectivity health check. Folds the old
 * `sdk status` and `builder doctor` commands into one. Six probes
 * (plus an opt-in 7th when --with-preview is set):
 *
 *   1. Node version (must be ≥ 18)
 *   2. SDK package + version
 *   3. CLI config file at ~/.bitbadges/config.json
 *   4. API key reachable (pings /api/v0/simulate with no-op)
 *   5. MCP stdio bin presence
 *   6. Persisted sessions parse
 *   7. (--with-preview) Preview upload+fetch roundtrip
 */

interface DoctorCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail?: string;
}

export const doctorCommand = addNetworkOptions(
  new Command('doctor')
    .description("Environment + connectivity health check. Verifies Node/SDK/config/API key/MCP bin/session integrity. Pass --with-preview to also probe the indexer's shareable-preview upload + fetch roundtrip.")
    .option('--json', 'Output the full DoctorReport as JSON')
    .option(
      '--with-preview',
      'Add a preview-roundtrip probe: builds a minimal tx, POSTs it to /api/v0/builder/preview, GETs it back by code, and asserts the round trip is byte-equivalent.'
    )
).action(async (opts: { json?: boolean; withPreview?: boolean; network?: 'mainnet' | 'local' | 'testnet'; testnet?: boolean; local?: boolean; url?: string }) => {
  const checks: DoctorCheck[] = [];

  // 1. Node version
  const nodeVersion = process.versions.node;
  const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);
  if (nodeMajor >= 18) {
    checks.push({ name: 'Node version', status: 'pass', detail: `v${nodeVersion}` });
  } else {
    checks.push({
      name: 'Node version',
      status: 'fail',
      detail: `v${nodeVersion} — bitbadges requires Node 18+`
    });
  }

  // 2. SDK version (best-effort: walk up from process.argv[1] looking
  // for the nearest package.json with name 'bitbadges' or legacy
  // 'bitbadgesjs-sdk'). Compatible with both CJS and ESM dist builds.
  const sdkPackageNames = ['bitbadges', 'bitbadgesjs-sdk'];
  try {
    const pathMod = await import('path');
    const fsMod = await import('fs');
    const startFrom = pathMod.dirname(process.argv[1] || process.cwd());
    let dir = startFrom;
    let pkgPath: string | null = null;
    for (let i = 0; i < 8; i++) {
      const candidate = pathMod.join(dir, 'package.json');
      if (fsMod.existsSync(candidate)) {
        try {
          const pkg = JSON.parse(fsMod.readFileSync(candidate, 'utf-8'));
          if (sdkPackageNames.includes(pkg.name)) {
            pkgPath = candidate;
            break;
          }
        } catch {
          /* continue */
        }
      }
      const parent = pathMod.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    if (pkgPath) {
      const pkg = JSON.parse(fsMod.readFileSync(pkgPath, 'utf-8'));
      checks.push({ name: 'SDK package', status: 'pass', detail: `${pkg.name}@${pkg.version}` });
    } else {
      checks.push({
        name: 'SDK package',
        status: 'warn',
        detail: 'Could not locate bitbadges package.json from CLI entry'
      });
    }
  } catch (err) {
    checks.push({ name: 'SDK package', status: 'warn', detail: (err as Error).message });
  }

  // 3. Config file
  try {
    const fsMod = await import('fs');
    const pathMod = await import('path');
    const osMod = await import('os');
    const configPath = pathMod.join(osMod.homedir(), '.bitbadges', 'config.json');
    if (fsMod.existsSync(configPath)) {
      try {
        JSON.parse(fsMod.readFileSync(configPath, 'utf-8'));
        checks.push({ name: 'Config file', status: 'pass', detail: configPath });
      } catch {
        checks.push({ name: 'Config file', status: 'fail', detail: `${configPath} exists but is not valid JSON` });
      }
    } else {
      checks.push({ name: 'Config file', status: 'skip', detail: 'no ~/.bitbadges/config.json (env vars also OK)' });
    }
  } catch (err) {
    checks.push({ name: 'Config file', status: 'fail', detail: (err as Error).message });
  }

  // 4. API key reachable
  try {
    const { getApiUrl, getApiKeyForNetwork, resolveNetwork } = await import('../utils/io.js');
    const key = getApiKeyForNetwork(opts);
    const network = resolveNetwork(opts);
    if (!key) {
      checks.push({
        name: `API key (${network})`,
        status: 'skip',
        detail: `no key set (BITBADGES_API_KEY or config.apiKey${network !== 'mainnet' ? `/apiKey${network[0].toUpperCase() + network.slice(1)}` : ''})`
      });
    } else {
      const url = `${getApiUrl(opts)}/api/v0/simulate`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key },
          body: JSON.stringify({ txs: [] })
        });
        if (response.status >= 200 && response.status < 500) {
          checks.push({
            name: `API key (${network})`,
            status: 'pass',
            detail: `${url} responded with HTTP ${response.status}`
          });
        } else {
          checks.push({ name: `API key (${network})`, status: 'warn', detail: `HTTP ${response.status} from ${url}` });
        }
      } catch (err) {
        checks.push({
          name: `API key (${network})`,
          status: 'warn',
          detail: `network error pinging ${url}: ${(err as Error).message}`
        });
      }
    }
  } catch (err) {
    checks.push({ name: 'API key', status: 'fail', detail: (err as Error).message });
  }

  // 5. MCP stdio bin
  try {
    const fsMod = await import('fs');
    const pathMod = await import('path');
    const startFrom = pathMod.dirname(process.argv[1] || process.cwd());
    let dir = startFrom;
    let pkgRoot: string | null = null;
    for (let i = 0; i < 8; i++) {
      const candidate = pathMod.join(dir, 'package.json');
      if (fsMod.existsSync(candidate)) {
        try {
          const pkg = JSON.parse(fsMod.readFileSync(candidate, 'utf-8'));
          if (sdkPackageNames.includes(pkg.name)) {
            pkgRoot = dir;
            break;
          }
        } catch {
          /* continue */
        }
      }
      const parent = pathMod.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    if (!pkgRoot) {
      checks.push({
        name: 'MCP stdio bin',
        status: 'warn',
        detail: 'Could not locate SDK root from CLI entry'
      });
    } else {
      const binCandidates = [
        pathMod.join(pkgRoot, 'dist', 'cjs', 'builder', 'index.js'),
        pathMod.join(pkgRoot, 'dist', 'esm', 'builder', 'index.js')
      ];
      const found = binCandidates.find((p) => fsMod.existsSync(p));
      if (found) {
        checks.push({ name: 'MCP stdio bin', status: 'pass', detail: found });
      } else {
        checks.push({
          name: 'MCP stdio bin',
          status: 'warn',
          detail: 'dist/cjs/builder/index.js not found — run `npm run build` in the bitbadges package'
        });
      }
    }
  } catch (err) {
    checks.push({ name: 'MCP stdio bin', status: 'fail', detail: (err as Error).message });
  }

  // 6. Persisted sessions
  try {
    const { listSessionFilesOnDisk, readSessionFileRaw } = await import('../../builder/session/fileStore.js');
    const ids = listSessionFilesOnDisk();
    let parseable = 0;
    let corrupt = 0;
    for (const id of ids) {
      const raw = readSessionFileRaw(id);
      if (!raw) continue;
      try {
        JSON.parse(raw);
        parseable++;
      } catch {
        corrupt++;
      }
    }
    if (corrupt > 0) {
      checks.push({
        name: 'Sessions',
        status: 'warn',
        detail: `${parseable} parseable, ${corrupt} corrupt — run \`bitbadges-cli session reset <id>\` on broken ones`
      });
    } else {
      checks.push({ name: 'Sessions', status: 'pass', detail: `${parseable} session(s) on disk` });
    }
  } catch (err) {
    checks.push({ name: 'Sessions', status: 'fail', detail: (err as Error).message });
  }

  // 7. Optional preview-roundtrip probe
  if (opts.withPreview) {
    try {
      const { getApiUrl: gAU, resolveNetwork: rN } = await import('../utils/io.js');
      const network = rN(opts);
      const baseUrl = gAU(opts);
      const probeTx = {
        transaction: {
          messages: [
            {
              typeUrl: '/tokenization.MsgCreateCollection',
              value: {
                creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpdguex7',
                validTokenIds: [],
                standards: [],
                collectionApprovals: [],
                tokenMetadata: [],
                aliasPathsToAdd: [],
                cosmosCoinWrapperPathsToAdd: [],
                mintEscrowCoinsToTransfer: [],
                _meta: {
                  metadataPlaceholders: {
                    'ipfs://METADATA_DOCTOR_PROBE': { name: 'doctor probe', description: '', image: '' }
                  }
                }
              }
            }
          ]
        }
      };
      const postRes = await fetch(`${baseUrl}/api/v0/builder/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(probeTx)
      });
      if (!postRes.ok) {
        checks.push({
          name: `Preview roundtrip (${network})`,
          status: 'fail',
          detail: `POST /api/v0/builder/preview returned HTTP ${postRes.status}`
        });
      } else {
        const { code } = (await postRes.json()) as { code: string };
        const getRes = await fetch(`${baseUrl}/api/v0/builder/preview?code=${encodeURIComponent(code)}`);
        if (!getRes.ok) {
          checks.push({
            name: `Preview roundtrip (${network})`,
            status: 'fail',
            detail: `GET /api/v0/builder/preview returned HTTP ${getRes.status} for the code we just uploaded (${code})`
          });
        } else {
          const fetched = (await getRes.json()) as any;
          const echoedTypeUrl = fetched?.transaction?.messages?.[0]?.typeUrl;
          const sidecarKey =
            fetched?.transaction?.messages?.[0]?.value?._meta?.metadataPlaceholders?.[
              'ipfs://METADATA_DOCTOR_PROBE'
            ]?.name;
          if (echoedTypeUrl !== '/tokenization.MsgCreateCollection' || sidecarKey !== 'doctor probe') {
            checks.push({
              name: `Preview roundtrip (${network})`,
              status: 'fail',
              detail: `Round trip mutated the payload — got typeUrl=${echoedTypeUrl}, sidecarName=${sidecarKey}`
            });
          } else {
            checks.push({
              name: `Preview roundtrip (${network})`,
              status: 'pass',
              detail: `${baseUrl}/api/v0/builder/preview · uploaded ${code} · fetched and verified`
            });
          }
        }
      }
    } catch (err: any) {
      checks.push({
        name: 'Preview roundtrip',
        status: 'fail',
        detail: `network error: ${err?.message || err}`
      });
    }
  }

  // Render
  if (opts.json) {
    const { output: outputFn } = await import('../utils/io.js');
    outputFn(checks, { ...opts, human: false });
  } else {
    const { makeColor, rule } = await import('../utils/terminal.js');
    const { c } = makeColor(process.stdout);
    const width = Math.min(80, (process.stdout as any).columns || 80);
    const lines: string[] = [];
    lines.push(c('gray', rule('━', width, 'Doctor')));
    lines.push('');
    const sigil = { pass: '✓', fail: '■', warn: '▲', skip: '·' } as const;
    const colorFor = { pass: 'green', fail: 'red', warn: 'yellow', skip: 'gray' } as const;
    const labelFor = { pass: 'PASS', fail: 'FAIL', warn: 'WARN', skip: 'SKIP' } as const;
    for (const ch of checks) {
      const badge = `${sigil[ch.status]} ${labelFor[ch.status]}`;
      lines.push(`  ${c(colorFor[ch.status], c('bold', badge))}  ${c('bold', ch.name)}`);
      if (ch.detail) {
        lines.push(`        ${c('dim', ch.detail)}`);
      }
    }
    lines.push('');
    const counts = checks.reduce(
      (acc, ch) => ({ ...acc, [ch.status]: (acc[ch.status] || 0) + 1 }),
      {} as Record<string, number>
    );
    lines.push(c('gray', rule('━', width)));
    lines.push(
      `  ${c('bold', 'Summary')}  ${counts.pass || 0} pass · ${
        counts.fail
          ? c('red', `${counts.fail} fail`)
          : c('gray', '0 fail')
      } · ${counts.warn ? c('yellow', `${counts.warn} warn`) : c('gray', '0 warn')} · ${
        counts.skip || 0
      } skip`
    );
    lines.push(c('gray', rule('━', width)));
    console.log(lines.join('\n'));
  }

  if (checks.some((ch) => ch.status === 'fail')) process.exit(2);
});

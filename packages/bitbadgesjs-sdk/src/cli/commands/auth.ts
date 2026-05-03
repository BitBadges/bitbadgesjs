/**
 * `bitbadges-cli auth` — wallet-agnostic Blockin sign-in flow against
 * the indexer. Stores session cookies under ~/.bitbadges/auth.json,
 * keyed by network + address. Subsequent `api --with-session` calls
 * attach the cookie automatically.
 *
 * Wallet-agnostic: this command does NOT sign anything. The signature
 * comes from any external producer (chain binary `sign-arbitrary`,
 * MetaMask, Keplr, hardware wallet, custodial signer, ...).
 */

import * as fs from 'fs';
import { Command } from 'commander';
import { resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { bridgeSign, resolveFrontendUrl } from '../auth/browser-bridge.js';
import {
  AuthSession,
  Network,
  ParsedCookie,
  clearPendingChallenge,
  extractSetCookies,
  formatCookieHeader,
  formatCookieHeaderFromMany,
  getActiveSession,
  getAuthPath,
  getPendingChallenge,
  getSession,
  listAllSessions,
  pickSessionCookie,
  removeSession,
  setActive,
  setPendingChallenge,
  setSession,
} from '../utils/auth-store.js';

interface NetworkOptions {
  testnet?: boolean;
  local?: boolean;
  url?: string;
  apiKey?: string;
}

function resolveNetwork(opts: NetworkOptions): Network {
  if (opts.testnet) return 'testnet';
  if (opts.local) return 'local';
  return 'mainnet';
}

function detectChain(address: string): 'Cosmos' | 'ETH' {
  if (address.startsWith('0x')) return 'ETH';
  if (address.startsWith('bb1')) return 'Cosmos';
  throw new Error(`Cannot detect chain from address ${address}: must start with 'bb1' or '0x'`);
}

function readMessage(opts: { message?: string; messageFile?: string }): string | undefined {
  if (opts.message) return opts.message;
  if (opts.messageFile) {
    if (opts.messageFile === '-') return fs.readFileSync(0, 'utf-8');
    return fs.readFileSync(opts.messageFile, 'utf-8');
  }
  return undefined;
}

interface FetchResult {
  status: number;
  body: any;
  setCookies: ParsedCookie[];
}

async function rawPost(url: string, headers: Record<string, string>, body: any): Promise<FetchResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text, status: res.status };
  }
  return { status: res.status, body: parsed, setCookies: extractSetCookies(res.headers) };
}

interface ChallengeResponse {
  message: string;
  nonce: string;
  /** All Set-Cookie values from the response (session cookie + any LB sticky cookies). */
  cookies: ParsedCookie[];
}

async function fetchChallenge(
  baseUrl: string,
  apiKey: string,
  chain: 'Cosmos' | 'ETH',
  address: string,
): Promise<ChallengeResponse> {
  const r = await rawPost(`${baseUrl}/auth/getChallenge`, { 'x-api-key': apiKey }, { chain, address });
  if (r.status !== 200) {
    const msg = r.body?.errorMessage || r.body?.error || `HTTP ${r.status}`;
    throw new Error(`getChallenge failed: ${msg}`);
  }
  return { message: r.body.message, nonce: r.body.nonce, cookies: r.setCookies };
}

interface VerifyResult {
  /** The new session cookie minted by /auth/verify (post-regenerate). */
  sessionCookie: ParsedCookie;
  /** All Set-Cookie values from /auth/verify, in order — replay these on subsequent calls in the same flow. */
  allCookies: ParsedCookie[];
  requires2FA: boolean;
  twoFAMessage?: string;
}

async function postVerify(
  baseUrl: string,
  apiKey: string,
  cookieHeader: string,
  payload: { message: string; signature: string; publicKey?: string },
): Promise<VerifyResult> {
  const r = await rawPost(
    `${baseUrl}/auth/verify`,
    { 'x-api-key': apiKey, Cookie: cookieHeader },
    payload,
  );
  if (r.status !== 200) {
    const msg = r.body?.errorMessage || r.body?.error || `HTTP ${r.status}`;
    throw new Error(`verify failed: ${msg}`);
  }
  const sessionCookie = pickSessionCookie(r.setCookies);
  if (!sessionCookie) {
    throw new Error('verify succeeded but indexer returned no session cookie — cannot persist session.');
  }
  return {
    sessionCookie,
    allCookies: r.setCookies,
    requires2FA: !!r.body?.requires2FA,
    twoFAMessage: r.body?.message,
  };
}

async function complete2FA(
  baseUrl: string,
  apiKey: string,
  cookieHeader: string,
  address: string,
  code: string,
  isBackup: boolean,
): Promise<{ sessionCookie: ParsedCookie | null }> {
  const body: Record<string, string> = { address };
  if (isBackup) body.backupCode = code;
  else body.totpCode = code;

  const r = await rawPost(`${baseUrl}/2fa/offline/verify`, { 'x-api-key': apiKey, Cookie: cookieHeader }, body);
  if (r.status !== 200) {
    const msg = r.body?.error || r.body?.errorMessage || `HTTP ${r.status}`;
    throw new Error(`2FA verification failed: ${msg}`);
  }
  return { sessionCookie: pickSessionCookie(r.setCookies) };
}

function persistSession(args: {
  network: Network;
  address: string;
  nativeAddress: string;
  chain: 'Cosmos' | 'ETH';
  cookie: ParsedCookie;
  baseUrl: string;
  setActive: boolean;
}): AuthSession {
  const session: AuthSession = {
    address: args.address,
    nativeAddress: args.nativeAddress,
    chain: args.chain,
    cookieName: args.cookie.name,
    cookieValue: args.cookie.value,
    scopes: [{ scopeName: 'Full Access' }],
    createdAt: Date.now(),
    expiresAt: args.cookie.expiresAt,
    indexerUrl: args.baseUrl,
  };
  setSession(args.network, session);
  if (args.setActive) setActive(args.network, args.address);
  return session;
}

function addNetworkOptions<T extends Command>(cmd: T): T {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides --testnet/--local/config)')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)') as T;
}

export const authCommand = new Command('auth').description(
  'Authenticate against the BitBadges indexer (wallet-agnostic Blockin flow).',
);

// ── auth login ──────────────────────────────────────────────────────

addNetworkOptions(authCommand.command('login'))
  .description('One-shot Blockin login: fetches challenge, posts your signature, stores session cookie.')
  .requiredOption('--address <addr>', "Native address (bb1... for Cosmos, 0x... for ETH).")
  .option('--signature <sig>', 'Signature over the challenge message (hex or base64). Omit when using --browser.')
  .option('--public-key <b64>', 'Compressed pubkey, base64. REQUIRED for Cosmos signatures unless --browser is set.')
  .option('--message <text>', 'The exact challenge message that was signed (typically from `auth challenge`).')
  .option('--message-file <path>', 'Read challenge message from file (use `-` for stdin).')
  .option('--browser', 'Open the BitBadges /sign page in the default browser and use the connected wallet to sign. Mutually exclusive with --signature.')
  .option('--frontend-url <url>', 'Override the frontend base URL used by --browser (defaults to bitbadges.io / testnet.bitbadges.io / localhost:3000 by network).')
  .option('--no-open', 'With --browser: print the sign URL to stderr instead of auto-launching the browser.')
  .option('--timeout <seconds>', 'With --browser: how long to wait for the wallet signature before giving up (default 300, max 1800).')
  .option('--2fa <code>', '6-digit TOTP code (if account has 2FA enabled).')
  .option('--2fa-backup <code>', 'Backup recovery code (alternative to --2fa).')
  .action(async (opts) => {
    const network = resolveNetwork(opts);
    const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
    const apiKey = resolveApiKey(opts.apiKey, network);
    const chain = detectChain(opts.address);

    if (opts.browser && opts.signature) {
      throw new Error('--browser and --signature are mutually exclusive. Pick one path.');
    }
    if (!opts.browser && !opts.signature) {
      throw new Error('Either --signature <sig> or --browser is required.');
    }
    if (!opts.browser && chain === 'Cosmos' && !opts.publicKey) {
      throw new Error('--public-key is required for Cosmos signatures (CosmosDriver verifier needs it). Get it from `sign-arbitrary` output, or use --browser.');
    }

    let message = readMessage({ message: opts.message, messageFile: opts.messageFile });

    // The /auth/verify nonce check is bound to the cookie the indexer set
    // when it issued the challenge. Two paths to obtain that cookie:
    //   1. A prior `auth challenge` saved a pending entry → reuse it (the
    //      headless agentic flow: challenge → external sign → verify).
    //   2. No pending → fetch a fresh challenge inline. Only safe when
    //      the caller has not yet signed (i.e. `--message` not passed).
    let cookies: ParsedCookie[];
    const pending = getPendingChallenge(network, opts.address);
    if (pending && (!message || pending.message.trim() === message.trim())) {
      message = pending.message;
      cookies = pending.cookies;
    } else {
      if (message && pending) {
        process.stderr.write(
          `Provided --message does not match the saved pending challenge for ${opts.address}; fetching a fresh challenge.\n`,
        );
      }
      const fresh = await fetchChallenge(baseUrl, apiKey, chain, opts.address);
      if (!message) {
        message = fresh.message;
        process.stderr.write(
          `Auto-fetched challenge inline (no pending found). For headless flows, run \`auth challenge\` first.\n`,
        );
      } else if (fresh.message.trim() !== message.trim()) {
        throw new Error(
          'Provided --message does not match the indexer\'s current challenge. Re-fetch via `auth challenge`, sign, then `auth verify`.',
        );
      }
      if (fresh.cookies.length === 0) {
        throw new Error('getChallenge returned no Set-Cookie headers; cannot complete /auth/verify.');
      }
      cookies = fresh.cookies;
    }

    let signatureToVerify: string = opts.signature ?? '';
    let publicKeyToVerify: string | undefined = opts.publicKey;

    if (opts.browser) {
      if (!message) {
        throw new Error('Internal error: missing challenge message before browser bridge.');
      }
      const frontendUrl = resolveFrontendUrl(network, opts.frontendUrl);
      const requestedTimeoutSec = opts.timeout ? Math.min(1800, Math.max(60, Number(opts.timeout))) : 300;
      process.stderr.write(`\nOpening browser to ${frontendUrl}/sign for wallet signature...\n`);
      const result = await bridgeSign({
        mode: 'login',
        payload: { message, expectedAddress: opts.address, chain: chain === 'ETH' ? 'evm' : 'cosmos' },
        baseUrl,
        frontendUrl,
        apiKey,
        timeoutMs: requestedTimeoutSec * 1000,
        noOpen: opts.open === false,
      });
      if (result.error) {
        throw new Error(`Browser sign cancelled or rejected: ${result.error}`);
      }
      if (!result.signature) {
        throw new Error('Browser bridge returned no signature.');
      }
      signatureToVerify = result.signature;
      publicKeyToVerify = result.publicKey ?? publicKeyToVerify;
      if (chain === 'Cosmos' && !publicKeyToVerify) {
        throw new Error('Browser bridge did not return a publicKey for the Cosmos signature; cannot complete /auth/verify.');
      }
    }

    let verify;
    try {
      verify = await postVerify(baseUrl, apiKey, formatCookieHeaderFromMany(cookies), {
        message,
        signature: signatureToVerify,
        publicKey: publicKeyToVerify,
      });
    } catch (err: any) {
      // Targeted hint:" — the most common failure mode here is an
      // expired challenge or a signature that doesn't match the
      // message. Both root-cause to "challenge state drifted from
      // signature" and the fix is identical: re-run challenge → sign
      // → verify in tight succession.
      process.stderr.write(`${err?.message ?? err}\n`);
      process.stderr.write(
        'Hint: re-fetch with `bitbadges-cli auth challenge --address ' +
          opts.address +
          '`, sign the new message, then retry `auth login`.\n'
      );
      process.exit(1);
    }

    let finalCookie = verify.sessionCookie;
    let allCookies = verify.allCookies;
    const totp = (opts as any)['2fa'] as string | undefined;
    const backup = (opts as any)['2faBackup'] as string | undefined;
    if (verify.requires2FA) {
      if (!totp && !backup) {
        process.stderr.write(
          `\nAccount has 2FA enabled. Re-run with --2fa <totp-code> or --2fa-backup <code>.\n`,
        );
        process.exit(2);
      }
      const stepUp = await complete2FA(
        baseUrl,
        apiKey,
        formatCookieHeaderFromMany(allCookies),
        opts.address,
        (totp || backup)!,
        !!backup,
      );
      if (stepUp.sessionCookie) finalCookie = stepUp.sessionCookie;
    }

    const session = persistSession({
      network,
      address: opts.address,
      nativeAddress: opts.address,
      chain,
      cookie: finalCookie,
      baseUrl,
      setActive: true,
    });
    clearPendingChallenge(network, opts.address);

    process.stdout.write(
      `Logged in as ${opts.address} on ${network}. Expires ${new Date(session.expiresAt).toISOString()}.\n`,
    );
  });

// ── auth challenge ──────────────────────────────────────────────────

addNetworkOptions(authCommand.command('challenge'))
  .description('Fetch a Blockin challenge for an address. Print the message your signer must sign.')
  .requiredOption('--address <addr>', "Native address (bb1... or 0x...).")
  .option('--json', 'Output {message, nonce} as JSON.', false)
  .option('--no-save-pending', 'Do not persist the challenge cookie locally (advanced).')
  .action(async (opts) => {
    const network = resolveNetwork(opts);
    const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
    const apiKey = resolveApiKey(opts.apiKey, network);
    const chain = detectChain(opts.address);
    const challenge = await fetchChallenge(baseUrl, apiKey, chain, opts.address);

    if (opts.savePending !== false) {
      // Persist the nonce cookie so a follow-up `auth login` / `auth verify`
      // can replay it. Without this, /auth/verify hits "No sign-in request
      // found" because each getChallenge mints a new session-bound nonce.
      setPendingChallenge(network, opts.address, challenge.message, challenge.cookies, baseUrl);
    }

    if (opts.json) {
      process.stdout.write(JSON.stringify({ message: challenge.message, nonce: challenge.nonce }) + '\n');
    } else {
      process.stdout.write(challenge.message + '\n');
    }
  });

// ── auth verify ─────────────────────────────────────────────────────
// Two-step counterpart to `login` for flows where signing happens
// elsewhere. Re-fetches the challenge to get a fresh nonce cookie,
// asserts the message the signer used matches, then posts verify.

addNetworkOptions(authCommand.command('verify'))
  .description('Complete two-step login: post a precomputed signature for a challenge.')
  .requiredOption('--address <addr>', "Native address (bb1... or 0x...).")
  .requiredOption('--signature <sig>', 'Signature over the challenge message.')
  .option('--public-key <b64>', 'Compressed pubkey, base64. REQUIRED for Cosmos addresses.')
  .option('--message <text>', 'The exact challenge message that was signed.')
  .option('--message-file <path>', 'Read challenge message from file (use `-` for stdin).')
  .option('--2fa <code>', '6-digit TOTP code (if 2FA enabled).')
  .option('--2fa-backup <code>', 'Backup recovery code (alternative to --2fa).')
  .action(async (opts) => {
    // Same flow as `login` — kept as a separate subcommand purely for
    // discoverability / muscle memory parity with the two-step flow.
    await authCommand.commands.find((c) => c.name() === 'login')!.parseAsync(
      ['login', ...rebuildArgs(opts, ['address', 'signature', 'publicKey', 'message', 'messageFile', '2fa', '2faBackup', 'testnet', 'local', 'url', 'apiKey'])],
      { from: 'user' },
    );
  });

function rebuildArgs(opts: Record<string, any>, keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const v = opts[k];
    if (v === undefined || v === null || v === false) continue;
    const flag = '--' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    if (v === true) {
      out.push(flag);
    } else {
      out.push(flag, String(v));
    }
  }
  return out;
}

// ── auth status ─────────────────────────────────────────────────────

addNetworkOptions(authCommand.command('status'))
  .description('Show stored sessions and (with --check) revalidate them against the indexer.')
  .option('--all', 'Show sessions across every network, not just the resolved one.', false)
  .option('--check', 'Hit /api/v0/auth/status to revalidate the cookie server-side.', false)
  .action(async (opts) => {
    const sessions = opts.all ? listAllSessions() : (() => {
      const network = resolveNetwork(opts);
      const active = getActiveSession(network);
      return active ? [{ network, session: active }] : [];
    })();

    if (sessions.length === 0) {
      process.stdout.write('No stored sessions. Run `bitbadges-cli auth login`.\n');
      return;
    }

    for (const { network, session } of sessions) {
      const expiry = new Date(session.expiresAt).toISOString();
      const status = Date.now() > session.expiresAt ? 'EXPIRED' : 'valid';
      let serverCheck = '';
      if (opts.check) {
        try {
          const r = await rawPost(
            `${session.indexerUrl}/auth/status`,
            { Cookie: formatCookieHeader(session) },
            {},
          );
          serverCheck = r.body?.signedIn ? ' [server: signed-in]' : ' [server: NOT signed in]';
        } catch (err: any) {
          serverCheck = ` [server check failed: ${err.message}]`;
        }
      }
      process.stdout.write(
        `${network.padEnd(8)}  ${session.address}  ${session.chain}  expires=${expiry} (${status})${serverCheck}\n`,
      );
    }
  });

// ── auth logout ─────────────────────────────────────────────────────

addNetworkOptions(authCommand.command('logout'))
  .description('Sign out and remove the local session record.')
  .option('--address <addr>', 'Address to log out (defaults to active for resolved network).')
  .option('--all', 'Log out every stored session across all networks.', false)
  .action(async (opts) => {
    const targets = opts.all ? listAllSessions() : (() => {
      const network = resolveNetwork(opts);
      const session = opts.address ? getSession(network, opts.address) : getActiveSession(network);
      return session ? [{ network, session }] : [];
    })();

    if (targets.length === 0) {
      process.stdout.write('No matching session to log out.\n');
      return;
    }

    for (const { network, session } of targets) {
      try {
        await rawPost(
          `${session.indexerUrl}/auth/logout`,
          { Cookie: formatCookieHeader(session), 'x-api-key': resolveApiKey(undefined, network) },
          { signOutBlockin: true, signOutEmail: true },
        );
      } catch (err: any) {
        process.stderr.write(`(server logout failed for ${session.address} on ${network}: ${err.message}; removing local record anyway)\n`);
      }
      removeSession(network, session.address);
      process.stdout.write(`Logged out ${session.address} on ${network}.\n`);
    }
  });

// ── auth use ────────────────────────────────────────────────────────

addNetworkOptions(authCommand.command('use'))
  .description('Set the active address for a network (used by `api --with-session`).')
  .argument('<address>', 'Address to mark active.')
  .action(async (address: string, opts) => {
    const network = resolveNetwork(opts);
    setActive(network, address);
    process.stdout.write(`Active on ${network} is now ${address}.\n`);
  });

// ── auth whoami ─────────────────────────────────────────────────────

addNetworkOptions(authCommand.command('whoami'))
  .description('Print the active address for the resolved network.')
  .action(async (opts) => {
    const network = resolveNetwork(opts);
    const session = getActiveSession(network);
    if (!session) {
      process.stdout.write(`No active session on ${network}. Run \`bitbadges-cli auth login\`.\n`);
      process.exit(1);
    }
    process.stdout.write(
      `${session.address} on ${network}  (chain=${session.chain}, expires=${new Date(session.expiresAt).toISOString()})\n`,
    );
  });

// ── auth path ───────────────────────────────────────────────────────

authCommand
  .command('path')
  .description('Print the path of the local auth store (~/.bitbadges/auth.json).')
  .action(() => {
    process.stdout.write(getAuthPath() + '\n');
  });

/**
 * Tests for the deploy command's wait-for-indexer flag.
 *
 * The deploy command's full broadcast path requires a live chain + signer;
 * those live in the integration spec. This unit spec targets the new
 * post-broadcast polling helper:
 *   - `extractEntityFromEvents`: recognizes the chain's collectionId /
 *     store_id event attributes, returns null for unrecognized txs.
 *   - `waitForIndexer`: polls the indexer with back-off, succeeds on a
 *     200, times out gracefully on persistent 404s.
 *   - `deployCommand` surface: `--wait-for-indexer` flag is wired through
 *     so flag drift surfaces in CI.
 */

import {
  extractEntityFromEvents,
  waitForIndexer
} from '../utils/wait-for-indexer.js';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { deployCommand, execKeyringCommand, executeKeyringMultiSteps, KeyringBindError } from './deploy.js';
import { buildKeyringMultiCommand } from '../utils/keyring-command.js';

describe('extractEntityFromEvents', () => {
  it('pulls collectionId from a tx_response events array', () => {
    const events = [
      {
        type: 'message',
        attributes: [
          { key: 'sender', value: 'bb1abc' }
        ]
      },
      {
        type: 'indexer',
        attributes: [
          { key: 'collectionId', value: '42' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toEqual({ entity: 'collection', id: '42' });
  });

  it('pulls collection_id (snake_case variant) and strips quotes', () => {
    const events = [
      {
        type: 'create_collection',
        attributes: [
          { key: '"collection_id"', value: '"99"' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toEqual({ entity: 'collection', id: '99' });
  });

  it('pulls store_id and maps to dynamic-store', () => {
    const events = [
      {
        type: 'tokenization',
        attributes: [
          { key: 'store_id', value: '7' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toEqual({ entity: 'dynamic-store', id: '7' });
  });

  it('returns null when no recognizable id is present', () => {
    const events = [
      {
        type: 'message',
        attributes: [
          { key: 'sender', value: 'bb1abc' },
          { key: 'msg_type', value: 'set_incoming_approval' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toBeNull();
  });

  it('treats id "0" as "no entity emitted"', () => {
    const events = [
      { type: 'indexer', attributes: [{ key: 'collectionId', value: '0' }] }
    ];
    expect(extractEntityFromEvents(events)).toBeNull();
  });

  it('returns null on a missing/non-array events payload', () => {
    expect(extractEntityFromEvents(undefined)).toBeNull();
    expect(extractEntityFromEvents(null as any)).toBeNull();
    expect(extractEntityFromEvents('events' as any)).toBeNull();
  });
});

describe('waitForIndexer', () => {
  it('returns ok after a 404 → 404 → 200 sequence', async () => {
    const responses = [
      new Response('not found', { status: 404 }),
      new Response('not found', { status: 404 }),
      new Response(JSON.stringify({ collection: { id: '42', name: 'Test' } }), { status: 200 })
    ];
    let callIdx = 0;
    const sentUrls: string[] = [];
    const fetchImpl = (async (input: any) => {
      sentUrls.push(String(input));
      return responses[callIdx++];
    }) as unknown as typeof fetch;

    let nowVal = 0;
    const sleepImpl = async (ms: number) => {
      nowVal += ms;
    };
    const nowImpl = () => nowVal;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: 'k',
        timeoutMs: 30_000,
        fetchImpl,
        sleepImpl,
        nowImpl
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entity).toBe('collection');
      expect(result.id).toBe('42');
      expect(result.attempts).toBe(3);
      expect(result.body).toEqual({ collection: { id: '42', name: 'Test' } });
    }
    expect(sentUrls[0]).toBe('http://test.local/collection/42');
    expect(callIdx).toBe(3);
  });

  it('hits each URL with the correct path for a dynamic-store target', async () => {
    let url = '';
    const fetchImpl = (async (input: any) => {
      url = String(input);
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;

    await waitForIndexer(
      { entity: 'dynamic-store', id: 'store-7' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 5_000,
        fetchImpl,
        sleepImpl: async () => undefined,
        nowImpl: () => 0
      }
    );
    expect(url).toBe('http://test.local/onChainDynamicStore/store-7');
  });

  it('times out gracefully (returns ok=false) when indexer never recovers', async () => {
    const fetchImpl = (async () =>
      new Response('not found', { status: 404 })) as unknown as typeof fetch;

    let nowVal = 0;
    const sleepImpl = async (ms: number) => {
      nowVal += ms;
    };
    const nowImpl = () => nowVal;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 5_000,
        fetchImpl,
        sleepImpl,
        nowImpl
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.lastStatus).toBe(404);
      expect(result.elapsedMs).toBeGreaterThanOrEqual(5_000);
      // 500ms × 3 + 2_000ms × N should fit roughly into 5s; at minimum
      // we want more than 3 attempts to prove back-off was exercised.
      expect(result.attempts).toBeGreaterThan(3);
    }
  });

  it('survives a transient network blip mid-poll (fetch throws once, then succeeds)', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) throw new Error('ECONNRESET');
      return new Response('{"ok":true}', { status: 200 });
    }) as unknown as typeof fetch;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 10_000,
        fetchImpl,
        sleepImpl: async () => undefined,
        nowImpl: () => 0
      }
    );
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it('respects timeout-ms exactly: a 100ms budget exits fast with no sleep overrun', async () => {
    const fetchImpl = (async () =>
      new Response('nope', { status: 404 })) as unknown as typeof fetch;

    let nowVal = 0;
    const slept: number[] = [];
    const sleepImpl = async (ms: number) => {
      slept.push(ms);
      nowVal += ms;
    };
    const nowImpl = () => nowVal;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 100,
        fetchImpl,
        sleepImpl,
        nowImpl
      }
    );
    expect(result.ok).toBe(false);
    // First sleep is min(500, 100) = 100 → second attempt → exit. No
    // sleep should ever exceed the remaining budget.
    for (const s of slept) expect(s).toBeLessThanOrEqual(100);
  });
});

describe('deployCommand surface', () => {
  it('exposes --wait-for-indexer with an optional value', () => {
    const opt = (deployCommand as any).options.find(
      (o: any) => o.long === '--wait-for-indexer'
    );
    expect(opt).toBeDefined();
    // Commander encodes "optional" args as `[name]` in flags; we just
    // assert the flag string carries brackets so future code doesn't
    // accidentally swap it to `<required>`.
    expect(String(opt.flags)).toMatch(/\[/);
  });
});


describe('keyring multi-tx collection binding', () => {
  it('refuses print-only mode when a create is followed by collectionId "0"', () => {
    const tmpFile = path.join(os.tmpdir(), `bb-deploy-print-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        messages: [
          { typeUrl: '/tokenization.MsgUniversalUpdateCollection', value: { creator: 'bb1alice', collectionId: '0' } },
          { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1alice', collectionId: '0', transfers: [] } }
        ]
      })
    );
    try {
      const cliTs = path.resolve(__dirname, '../index.ts');
      const res = spawnSync(
        'bun',
        [cliTs, 'deploy', '--with-keyring', '--from', 'alice', '--msg-file', tmpFile, '--local'],
        { encoding: 'utf-8', timeout: 15_000 }
      );
      expect(res.status).toBe(2);
      expect(res.stderr).toContain('collectionId "0"');
      expect(res.stderr).toContain('--exec');
      expect(res.stdout).toBe('');
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('binds created collectionId from tx1 events into follow-up msg file before step 2 runs', async () => {
    const built = buildKeyringMultiCommand({
      messages: [
        { typeUrl: '/tokenization.MsgUniversalUpdateCollection', value: { creator: 'bb1alice', collectionId: '0' } },
        { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1alice', collectionId: '0', transfers: [] } }
      ],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    const seenTransferIds: string[] = [];
    const sleeps: number[] = [];
    try {
      let stepIdx = 0;
      const results = await executeKeyringMultiSteps(built.steps, {
        quiet: true,
        sleepImpl: async (ms) => {
          sleeps.push(ms);
        },
        runStep: async () => {
          if (stepIdx++ === 0) {
            return {
              hash: 'TX_CREATE_1',
              result: {
                code: 0,
                height: 10,
                events: [
                  {
                    type: 'message',
                    attributes: [
                      { key: 'msg_type', value: 'universal_update_collection' },
                      { key: 'collectionId', value: '77' }
                    ]
                  }
                ]
              }
            };
          }
          const transferJson = JSON.parse(fs.readFileSync(built.steps[1].msgFilePaths[0], 'utf-8'));
          seenTransferIds.push(transferJson.collectionId);
          return { hash: 'TX_TRANSFER_2', result: { code: 0, height: 11, events: [] } };
        }
      });

      expect(seenTransferIds).toEqual(['77']);
      expect(sleeps).toEqual([6000]);
      expect(results.map((r) => r.txHash)).toEqual(['TX_CREATE_1', 'TX_TRANSFER_2']);
    } finally {
      for (const f of built.msgFilePaths) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }
  });

  it('fails closed when create tx events lack a non-zero collectionId', async () => {
    const built = buildKeyringMultiCommand({
      messages: [
        { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1alice' } },
        { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1alice', collectionId: '0', transfers: [] } }
      ],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    let calls = 0;
    try {
      await expect(
        executeKeyringMultiSteps(built.steps, {
          quiet: true,
          sleepImpl: async () => undefined,
          runStep: async () => {
            calls++;
            return { hash: 'TX_CREATE_NO_ID', result: { code: 0, height: 10, events: [] } };
          }
        })
      ).rejects.toThrow(KeyringBindError);
      expect(calls).toBe(1);
    } finally {
      for (const f of built.msgFilePaths) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }
  });

  it('fails closed when follow-up message uses a positional verb whose collectionId cannot be rewritten', async () => {
    const built = buildKeyringMultiCommand({
      messages: [
        { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1alice' } },
        { typeUrl: '/tokenization.MsgDeleteOutgoingApproval', value: { creator: 'bb1alice', collectionId: '0', approvalId: 'a1' } }
      ],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    let calls = 0;
    try {
      await expect(
        executeKeyringMultiSteps(built.steps, {
          quiet: true,
          sleepImpl: async () => undefined,
          runStep: async () => {
            calls++;
            return {
              hash: 'TX_CREATE_1',
              result: {
                code: 0,
                height: 10,
                events: [{ type: 'message', attributes: [{ key: 'collectionId', value: '55' }] }]
              }
            };
          }
        })
      ).rejects.toThrow(KeyringBindError);
      expect(calls).toBe(1);
    } finally {
      for (const f of built.msgFilePaths) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }
  });

  it('stops immediately before step 2 when step 1 fails on-chain', async () => {
    const built = buildKeyringMultiCommand({
      messages: [
        { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1alice' } },
        { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1alice', collectionId: '0', transfers: [] } }
      ],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    let calls = 0;
    try {
      const results = await executeKeyringMultiSteps(built.steps, {
        quiet: true,
        sleepImpl: async () => undefined,
        runStep: async () => {
          calls++;
          return { hash: 'TX_FAIL_1', result: { code: 4, height: 0, rawLog: 'unauthorized', events: [] } };
        }
      });
      expect(calls).toBe(1);
      expect(results).toEqual([
        { txHash: 'TX_FAIL_1', result: { code: 4, height: 0, rawLog: 'unauthorized', events: [] } }
      ]);
    } finally {
      for (const f of built.msgFilePaths) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }
  });

  it('scopes each create collectionId to the following messages before the next create', async () => {
    const built = buildKeyringMultiCommand({
      messages: [
        { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1alice' } },
        { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1alice', collectionId: '0', transfers: [] } },
        { typeUrl: '/tokenization.MsgUniversalUpdateCollection', value: { creator: 'bb1alice', collectionId: '0' } },
        { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1alice', collectionId: '0', transfers: [] } }
      ],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    const seenIds: string[] = [];
    try {
      let stepIdx = 0;
      await executeKeyringMultiSteps(built.steps, {
        quiet: true,
        sleepImpl: async () => undefined,
        runStep: async () => {
          const cur = stepIdx++;
          if (cur === 0) {
            return {
              hash: 'TX1',
              result: { code: 0, height: 1, events: [{ type: 'message', attributes: [{ key: 'collectionId', value: '10' }] }] }
            };
          }
          if (cur === 1) {
            seenIds.push(JSON.parse(fs.readFileSync(built.steps[1].msgFilePaths[0], 'utf-8')).collectionId);
            return { hash: 'TX2', result: { code: 0, height: 2, events: [] } };
          }
          if (cur === 2) {
            return {
              hash: 'TX3',
              result: { code: 0, height: 3, events: [{ type: 'message', attributes: [{ key: 'collectionId', value: '11' }] }] }
            };
          }
          seenIds.push(JSON.parse(fs.readFileSync(built.steps[3].msgFilePaths[0], 'utf-8')).collectionId);
          return { hash: 'TX4', result: { code: 0, height: 4, events: [] } };
        }
      });
      expect(seenIds).toEqual(['10', '11']);
    } finally {
      for (const f of built.msgFilePaths) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      if (built.tmpDir) fs.rmSync(built.tmpDir, { recursive: true, force: true });
    }
  });

  it('execKeyringCommand invokes the binary directly without shell evaluation', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-exec-test-'));
    const marker = path.join(dir, 'should-not-exist');
    try {
      const literalArg = `$(touch ${marker}); echo extra`;
      const res = execKeyringCommand(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', literalArg]);
      expect(res.status).toBe(0);
      expect(JSON.parse(res.stdout)).toEqual([literalArg]);
      expect(fs.existsSync(marker)).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('deploy --with-keyring --local forwards --chain-id, --keyring-dir, and --home (BB-315)', () => {
    const tmpFile = path.join(os.tmpdir(), `bb-deploy-keyring-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        typeUrl: '/tokenization.MsgCreateCollection',
        value: { creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv', validTokenIds: [] }
      })
    );
    try {
      const cliTs = path.resolve(__dirname, '../index.ts');
      const res = spawnSync(
        'bun',
        [
          cliTs,
          'deploy',
          '--with-keyring',
          '--from',
          'alice',
          '--local',
          '--chain-id',
          'bitbadges-local-42',
          '--keyring-dir',
          '/tmp/my-keyring',
          '--home',
          '/tmp/my-home',
          '--msg-file',
          tmpFile
        ],
        { encoding: 'utf-8', timeout: 15_000, env: { ...process.env, BB_QUIET: '1' } }
      );
      expect(res.status).toBe(0);
      const env = JSON.parse(res.stdout);
      expect(env.ok).toBe(true);
      expect(env.data.commandLine).toContain('--chain-id bitbadges-local-42');
      expect(env.data.commandLine).toContain('--keyring-dir /tmp/my-keyring');
      expect(env.data.commandLine).toContain('--home /tmp/my-home');
      if (Array.isArray(env.data.msgFilePaths) && env.data.msgFilePaths[0] && fs.existsSync(env.data.msgFilePaths[0])) {
        fs.rmSync(path.dirname(env.data.msgFilePaths[0]), { recursive: true, force: true });
      }
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

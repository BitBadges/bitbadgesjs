import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  buildKeyringCommand,
  buildKeyringMultiCommand,
  KEYRING_SUPPORTED_TYPE_URLS,
  KEYRING_POSITIONAL_TYPE_URLS,
  parseKeyringBroadcastStdout,
  shellQuote
} from './keyring-command.js';

function tmpPath(): string {
  return path.join(os.tmpdir(), `bb-msg-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
}

describe('buildKeyringCommand', () => {
  const baseMsg = {
    typeUrl: '/tokenization.MsgCreateCollection',
    value: {
      creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      manager: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      validTokenIds: []
    }
  };

  it('emits the create-collection subcommand for MsgCreateCollection', () => {
    const out = tmpPath();
    const result = buildKeyringCommand({
      msg: baseMsg,
      from: 'alice',
      network: 'mainnet',
      binary: 'bitbadgeschaind',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: out
    });
    expect(result.subcommand).toBe('create-collection');
    expect(result.msgFilePath).toBe(out);
    expect(result.commandLine).toContain('bitbadgeschaind tx tokenization create-collection');
    expect(result.commandLine).toContain('--from alice');
    expect(result.commandLine).toContain('--chain-id bitbadges-1');
    expect(result.commandLine).toContain('--node https://rpc.bitbadges.io:443');
    expect(result.commandLine).toContain('--keyring-backend os');
    expect(result.commandLine).toContain('--gas auto --gas-adjustment 1.3');
    expect(result.commandLine).toContain('--yes');
    expect(result.commandLine.match(/--gas-prices 10ubadge/g)?.length).toBe(result.commandLine.match(/--gas /g)?.length);
  });

  it('writes the message value (NOT the {typeUrl,value} wrapper) to disk', () => {
    const out = tmpPath();
    buildKeyringCommand({
      msg: baseMsg,
      from: 'alice',
      network: 'mainnet',
      binary: 'bitbadgeschaind',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: out
    });
    const written = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(written).toEqual(baseMsg.value);
    expect((written as any).typeUrl).toBeUndefined();
    fs.unlinkSync(out);
  });

  it('strips builder sidecar keys like _meta before writing the msg file (chain rejects unknown fields)', () => {
    const out = tmpPath();
    const msg = {
      typeUrl: '/tokenization.MsgCreateCollection',
      value: { ...baseMsg.value, _meta: { metadataPlaceholders: { 'ipfs://METADATA_COLLECTION': { name: 'x' } } } }
    };
    buildKeyringCommand({
      msg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: out
    });
    const written = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(written._meta).toBeUndefined();
    expect(written).toEqual(baseMsg.value);
    expect((msg.value as any)._meta).toBeDefined();
    fs.unlinkSync(out);
  });

  it('backfills manager on create-collection when missing', () => {
    const out = tmpPath();
    const msg = { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1qqq...' } };
    buildKeyringCommand({
      msg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3',
      manager: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      msgFilePath: out
    });
    const written = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(written.manager).toBe('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv');
    fs.unlinkSync(out);
  });

  it('preserves an existing manager value (does NOT overwrite)', () => {
    const out = tmpPath();
    const msg = {
      typeUrl: '/tokenization.MsgCreateCollection',
      value: { creator: 'bb1aaa', manager: 'bb1existing' }
    };
    buildKeyringCommand({
      msg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3',
      manager: 'bb1overwrite',
      msgFilePath: out
    });
    const written = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(written.manager).toBe('bb1existing');
    fs.unlinkSync(out);
  });

  it('only backfills manager on create-collection — leaves other typeUrls untouched', () => {
    const out = tmpPath();
    const msg = { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1abc' } };
    buildKeyringCommand({
      msg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3',
      manager: 'bb1notapplicable',
      msgFilePath: out
    });
    const written = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(written.manager).toBeUndefined();
    fs.unlinkSync(out);
  });

  it('uses testnet RPC + chain-id when network=testnet', () => {
    const result = buildKeyringCommand({
      msg: baseMsg,
      from: 'alice',
      network: 'testnet',
      binary: 'bitbadgeschaind',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: tmpPath()
    });
    expect(result.commandLine).toContain('--chain-id bitbadges-2');
    expect(result.commandLine).toContain('--node https://rpc-testnet.bitbadges.io:443');
  });

  it('uses local RPC when network=local', () => {
    const result = buildKeyringCommand({
      msg: baseMsg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: tmpPath()
    });
    expect(result.commandLine).toContain('--chain-id bitbadges-1');
    expect(result.commandLine).toContain('--node http://localhost:26657');
  });

  it('honors --binary override (e.g. "bb")', () => {
    const result = buildKeyringCommand({
      msg: baseMsg,
      from: 'alice',
      network: 'mainnet',
      binary: 'bb',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: tmpPath()
    });
    expect(result.commandLine.startsWith('bb tx tokenization create-collection')).toBe(true);
  });

  it('throws on an unsupported typeUrl with a helpful error', () => {
    expect(() =>
      buildKeyringCommand({
        msg: { typeUrl: '/tokenization.MsgTotallyUnknownVerb', value: {} },
        from: 'alice',
        network: 'mainnet',
        binary: 'bitbadgeschaind',
        keyringBackend: 'os',
        gas: 'auto',
        gasAdjustment: '1.3'
      })
    ).toThrow(/does not support typeUrl/);
  });

  it('exports a stable list of supported typeUrls', () => {
    expect(KEYRING_SUPPORTED_TYPE_URLS).toContain('/tokenization.MsgCreateCollection');
    expect(KEYRING_SUPPORTED_TYPE_URLS).toContain('/tokenization.MsgTransferTokens');
    expect(KEYRING_SUPPORTED_TYPE_URLS.length).toBeGreaterThanOrEqual(14);
  });
});

describe('dynamic-store positional builders', () => {
  // The chain-binary's dynamic-store verbs take positional args, not a
  // JSON blob — these builders are exercised end-to-end by the
  // dynamic-stores.spec.ts integration suite, but we lock the command-
  // line shape here so a refactor doesn't silently drop them.
  const exec = (typeUrl: string, value: any) =>
    buildKeyringCommand({
      msg: { typeUrl, value },
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3',
      msgFilePath: tmpPath()
    }).commandLine;

  it('MsgCreateDynamicStore → create-dynamic-store <default-value>', () => {
    const cmd = exec('/tokenization.MsgCreateDynamicStore', { creator: 'bb1abc', defaultValue: true });
    expect(cmd).toContain('bitbadgeschaind tx tokenization create-dynamic-store true');
  });

  it('MsgUpdateDynamicStore → update-dynamic-store <id> <default> <enabled>', () => {
    const cmd = exec('/tokenization.MsgUpdateDynamicStore', {
      creator: 'bb1abc', storeId: '42', defaultValue: true, globalEnabled: false
    });
    expect(cmd).toContain('update-dynamic-store 42 true false');
  });

  it('MsgDeleteDynamicStore → delete-dynamic-store <id>', () => {
    const cmd = exec('/tokenization.MsgDeleteDynamicStore', { creator: 'bb1abc', storeId: '7' });
    expect(cmd).toContain('delete-dynamic-store 7');
  });

  it('MsgSetDynamicStoreValue → set-dynamic-store-value <id> <addr> <value>', () => {
    const cmd = exec('/tokenization.MsgSetDynamicStoreValue', {
      creator: 'bb1abc', storeId: '7', address: 'bb1charlie', value: true
    });
    expect(cmd).toContain('set-dynamic-store-value 7 bb1charlie true');
  });

  it('MsgUpdateDynamicStore defaults globalEnabled to true when omitted', () => {
    const cmd = exec('/tokenization.MsgUpdateDynamicStore', {
      creator: 'bb1abc', storeId: '5'
    });
    // default-value defaults to false, globalEnabled defaults to true
    expect(cmd).toContain('update-dynamic-store 5 false true');
  });

  it('all four dynamic-store typeUrls are listed in KEYRING_POSITIONAL_TYPE_URLS', () => {
    expect(KEYRING_POSITIONAL_TYPE_URLS).toEqual(
      expect.arrayContaining([
        '/tokenization.MsgCreateDynamicStore',
        '/tokenization.MsgUpdateDynamicStore',
        '/tokenization.MsgDeleteDynamicStore',
        '/tokenization.MsgSetDynamicStoreValue'
      ])
    );
  });
});

describe('buildKeyringMultiCommand', () => {
  const transferMsg = {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: 'bb1qqq',
      collectionId: '7',
      transfers: [{ prioritizedApprovals: [{ approvalId: 'accept' }] }]
    }
  };

  const voteMsg = {
    typeUrl: '/tokenization.MsgCastVote',
    value: {
      creator: 'bb1qqq',
      collection_id: '7',
      approval_level: 'collection',
      approver_address: '',
      approval_id: 'accept',
      proposal_id: 'prop-abc',
      yes_weight: '100'
    }
  };

  it('emits a 2-block command chained with && for a bounty accept (vote + transfer)', () => {
    const result = buildKeyringMultiCommand({
      messages: [voteMsg, transferMsg],
      from: 'alice',
      network: 'mainnet',
      binary: 'bitbadgeschaind',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    // Vote block uses positional args
    expect(result.commandLine).toContain('bitbadgeschaind tx tokenization cast-vote 7 collection');
    expect(result.commandLine).toContain("'' accept prop-abc 100");
    expect(result.commandLine).toContain('--yes && sleep 6 && \\');
    // Transfer block uses [tx-json-or-file]
    expect(result.commandLine).toMatch(
      /bitbadgeschaind tx tokenization transfer-tokens \/[^ \n]+\.json/
    );
    // Exactly one tmp file written (for the JSON-arg transfer; the vote uses positional args)
    expect(result.msgFilePaths).toHaveLength(1);
    // Last block must NOT have trailing &&
    expect(result.commandLine.trim().endsWith('--yes')).toBe(true);
  });

  it('writes only the inner value of JSON-arg msgs (not the typeUrl wrapper)', () => {
    const result = buildKeyringMultiCommand({
      messages: [voteMsg, transferMsg],
      from: 'alice',
      network: 'mainnet',
      binary: 'bitbadgeschaind',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    const written = JSON.parse(fs.readFileSync(result.msgFilePaths[0], 'utf-8'));
    expect(written).toEqual(transferMsg.value);
    fs.unlinkSync(result.msgFilePaths[0]);
  });

  it('throws on a typeUrl that has neither JSON-arg nor positional support', () => {
    expect(() =>
      buildKeyringMultiCommand({
        messages: [{ typeUrl: '/tokenization.MsgUnknown', value: {} }],
        from: 'alice',
        network: 'mainnet',
        binary: 'bitbadgeschaind',
        keyringBackend: 'os',
        gas: 'auto',
        gasAdjustment: '1.3'
      })
    ).toThrow(/has no chain-binary subcommand mapping/);
  });

  it('exports KEYRING_POSITIONAL_TYPE_URLS including MsgCastVote', () => {
    expect(KEYRING_POSITIONAL_TYPE_URLS).toContain('/tokenization.MsgCastVote');
  });

  it('honors network/binary/backend overrides per block', () => {
    const result = buildKeyringMultiCommand({
      messages: [voteMsg, transferMsg],
      from: 'alice',
      network: 'local',
      binary: 'bb',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    expect(result.commandLine).toContain('bb tx tokenization cast-vote');
    expect(result.commandLine).toContain('--node http://localhost:26657');
    expect(result.commandLine).toContain('--keyring-backend test');
    expect(result.commandLine).toContain('--chain-id bitbadges-1');
  });

  it('exposes per-step command lines without the sleep chain', () => {
    const result = buildKeyringMultiCommand({
      messages: [voteMsg, transferMsg],
      from: 'alice',
      network: 'mainnet',
      binary: 'bitbadgeschaind',
      keyringBackend: 'os',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].commandLine).toContain('cast-vote');
    expect(result.steps[0].commandLine).not.toContain('sleep 6');
    expect(result.steps[1].commandLine).toMatch(/transfer-tokens \/[^ \n]+\.json/);
    expect(result.steps[1].commandLine.trim().endsWith('--yes')).toBe(true);
    // The printable combined script still chains with a sleep for copy/paste.
    expect(result.commandLine).toContain('--yes && sleep 6 && \\');
    for (const f of result.msgFilePaths) fs.unlinkSync(f);
  });
});

describe('buildKeyringMultiCommand sidecar stripping', () => {
  it('strips _meta from every JSON-arg msg file', () => {
    const res = buildKeyringMultiCommand({
      messages: [
        {
          typeUrl: '/tokenization.MsgCreateCollection',
          value: { creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv', _meta: { metadataPlaceholders: {} } }
        },
        { typeUrl: '/tokenization.MsgTransferTokens', value: { creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv', collectionId: '0', transfers: [] } }
      ],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    } as any);
    for (const p of res.msgFilePaths) {
      const written = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(written._meta).toBeUndefined();
      fs.unlinkSync(p);
    }
  });
});

describe('parseKeyringBroadcastStdout', () => {
  it('captures a CheckTx rejection (binary exits 0, code 4) with its multi-line raw_log', () => {
    const stdout = [
      'code: 4',
      'codespace: sdk',
      'data: ""',
      'events: []',
      'gas_used: "0"',
      'height: "0"',
      "raw_log: 'signature verification failed; please verify account number (0) and chain-id",
      "  (bitbadges-local-7): (unable to verify single signer signature): unauthorized'",
      'timestamp: ""',
      'tx: null',
      'txhash: 654B5970585C35832FEAD964972A1ABDBBA3990BC18B1EE921E23D7B337A0118',
      ''
    ].join('\n');
    expect(parseKeyringBroadcastStdout(stdout)).toEqual([
      {
        txHash: '654B5970585C35832FEAD964972A1ABDBBA3990BC18B1EE921E23D7B337A0118',
        checkTxCode: 4,
        rawLog:
          'signature verification failed; please verify account number (0) and chain-id (bitbadges-local-7): (unable to verify single signer signature): unauthorized'
      }
    ]);
  });

  it('returns one entry per broadcast for sequential multi-msg output', () => {
    const stdout = ['gas estimate: 1', 'code: 0', "raw_log: ''", 'txhash: AA11', 'code: 13', 'raw_log: insufficient fee', 'txhash: BB22'].join('\n');
    expect(parseKeyringBroadcastStdout(stdout)).toEqual([
      { txHash: 'AA11', checkTxCode: 0, rawLog: '' },
      { txHash: 'BB22', checkTxCode: 13, rawLog: 'insufficient fee' }
    ]);
  });
});

describe('keyring command quoting, argv, and private temp files', () => {
  const sampleMsg = {
    typeUrl: '/tokenization.MsgCreateCollection',
    value: { creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv' }
  };

  it('shell-quotes all interpolated tokens in commandLine while preserving raw argv', () => {
    const result = buildKeyringCommand({
      msg: sampleMsg,
      from: "alice; touch /tmp/test'd",
      network: 'local',
      binary: '/opt/my chain/bitbadgeschaind',
      keyringBackend: 'file $(id)',
      gas: 'auto`uname`',
      gasAdjustment: '1.3|cat',
      chainId: 'chain id;ls',
      nodeUrl: 'http://localhost:26657/$(whoami)'
    });
    try {
      expect(result.binary).toBe('/opt/my chain/bitbadgeschaind');
      expect(result.args).toContain("alice; touch /tmp/test'd");
      expect(result.args).toContain('file $(id)');
      expect(result.args).toContain('chain id;ls');
      expect(result.args).toContain('http://localhost:26657/$(whoami)');

      expect(result.commandLine).toContain("'/opt/my chain/bitbadgeschaind'");
      expect(result.commandLine).toContain(`--from ${shellQuote("alice; touch /tmp/test'd")}`);
      expect(result.commandLine).toContain("--chain-id 'chain id;ls'");
      expect(result.commandLine).toContain("--node 'http://localhost:26657/$(whoami)'");
      expect(result.commandLine).toContain("--keyring-backend 'file $(id)'");
      expect(result.commandLine).toContain("--gas 'auto`uname`' --gas-adjustment '1.3|cat'");
    } finally {
      if (result.tmpDir) fs.rmSync(result.tmpDir, { recursive: true, force: true });
    }
  });

  it('creates a 0700 temp directory and 0600 msg files using exclusive creation', () => {
    const result = buildKeyringCommand({
      msg: sampleMsg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    try {
      expect(result.tmpDir).toBeDefined();
      expect(path.dirname(result.msgFilePath)).toBe(result.tmpDir);
      expect(fs.statSync(result.tmpDir!).mode & 0o777).toBe(0o700);
      expect(fs.statSync(result.msgFilePath).mode & 0o777).toBe(0o600);
    } finally {
      if (result.tmpDir) fs.rmSync(result.tmpDir, { recursive: true, force: true });
    }
  });

  it('refuses to overwrite an existing msgFilePath', () => {
    const out = tmpPath();
    fs.writeFileSync(out, 'existing');
    try {
      expect(() =>
        buildKeyringCommand({
          msg: sampleMsg,
          from: 'alice',
          network: 'local',
          binary: 'bitbadgeschaind',
          keyringBackend: 'test',
          gas: 'auto',
          gasAdjustment: '1.3',
          msgFilePath: out
        })
      ).toThrow(/EEXIST/);
    } finally {
      fs.unlinkSync(out);
    }
  });

  it('provides raw unquoted args per step for multi-msg commands and quotes special chars in commandLine', () => {
    const result = buildKeyringMultiCommand({
      messages: [
        {
          typeUrl: '/tokenization.MsgCastVote',
          value: {
            collection_id: '7',
            approval_level: 'collection',
            approver_address: '',
            approval_id: 'id with spaces; $(echo nope)',
            proposal_id: 'prop-1',
            yes_weight: '100'
          }
        },
        sampleMsg
      ],
      from: 'alice; id',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    try {
      expect(result.tmpDir).toBeDefined();
      expect(fs.statSync(result.tmpDir!).mode & 0o777).toBe(0o700);
      expect(result.steps[0].args).toContain('id with spaces; $(echo nope)');
      expect(result.steps[0].args).toContain('alice; id');
      expect(result.steps[0].commandLine).toContain("'id with spaces; $(echo nope)'");
      expect(result.steps[0].commandLine).toContain("--from 'alice; id'");
    } finally {
      if (result.tmpDir) fs.rmSync(result.tmpDir, { recursive: true, force: true });
    }
  });

  it('passes --chain-id, --keyring-dir, and --home through in both args and commandLine (BB-315)', () => {
    const single = buildKeyringCommand({
      msg: sampleMsg,
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      keyringDir: '/tmp/custom keyring',
      home: '/tmp/bb-home',
      chainId: 'bitbadges-local-9',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    try {
      expect(single.args).toContain('--chain-id');
      expect(single.args).toContain('bitbadges-local-9');
      expect(single.args).toContain('--keyring-dir');
      expect(single.args).toContain('/tmp/custom keyring');
      expect(single.args).toContain('--home');
      expect(single.args).toContain('/tmp/bb-home');
      expect(single.commandLine).toContain('--chain-id bitbadges-local-9');
      expect(single.commandLine).toContain("--keyring-dir '/tmp/custom keyring'");
      expect(single.commandLine).toContain('--home /tmp/bb-home');
    } finally {
      if (single.tmpDir) fs.rmSync(single.tmpDir, { recursive: true, force: true });
    }

    const multi = buildKeyringMultiCommand({
      messages: [sampleMsg, sampleMsg],
      from: 'alice',
      network: 'local',
      binary: 'bitbadgeschaind',
      keyringBackend: 'test',
      keyringDir: '/tmp/keys',
      home: '/tmp/home',
      chainId: 'bitbadges-local-9',
      gas: 'auto',
      gasAdjustment: '1.3'
    });
    try {
      for (const step of multi.steps) {
        expect(step.args).toContain('bitbadges-local-9');
        expect(step.args).toContain('--keyring-dir');
        expect(step.args).toContain('/tmp/keys');
        expect(step.args).toContain('--home');
        expect(step.args).toContain('/tmp/home');
      }
      expect(multi.commandLine).toContain('--chain-id bitbadges-local-9');
      expect(multi.commandLine).toContain('--keyring-dir /tmp/keys');
      expect(multi.commandLine).toContain('--home /tmp/home');
    } finally {
      if (multi.tmpDir) fs.rmSync(multi.tmpDir, { recursive: true, force: true });
    }
  });
});

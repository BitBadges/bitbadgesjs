import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  buildKeyringCommand,
  buildKeyringMultiCommand,
  KEYRING_SUPPORTED_TYPE_URLS,
  KEYRING_POSITIONAL_TYPE_URLS
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
});

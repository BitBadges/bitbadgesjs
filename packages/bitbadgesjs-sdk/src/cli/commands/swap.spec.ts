/**
 * Command-tree shape tests for swap.ts (top-level read paths).
 *
 * Pool + asset-pair surfaces have their own specs (swap-pools.spec.ts +
 * the live integration). This spec covers the rest of the swap surface
 * (assets / chains / balances / estimate / track / status / activities)
 * so the documented agent contract stays stable.
 */

import { swapCommand, classifyBitBadgesOnlySwap } from './swap.js';

describe('swapCommand shape', () => {
  it('exposes the documented top-level subcommands', () => {
    const names = swapCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'activities',
      'asset-pairs',
      'assets',
      'balances',
      'chains',
      'estimate',
      'execute',
      'pools',
      'status',
      'track',
    ]);
  });

  it('execute takes [estimate] + reuses deploy signing flags', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'execute')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['estimate']);
    const longs = (c.options as any[]).map((o) => o.long);
    // deploy signing flags come from the shared addDeployOptions helper —
    // no second/EVM keyring is added here.
    expect(longs).toEqual(
      expect.arrayContaining(['--browser', '--burner', '--sign-only', '--force', '--track']),
    );
  });

  it('estimate gains --execute / --force / --track + deploy flags', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'estimate')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining(['--execute', '--force', '--track', '--browser', '--burner']),
    );
  });

  it('assets exposes --include-svm + --include-cw20', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'assets')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--include-svm', '--include-cw20']));
  });

  it('chains exposes --include-svm + --only-testnets', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'chains')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--include-svm', '--only-testnets']));
  });

  it('balances takes <chains-to-addresses-json>', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'balances')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['chains-to-addresses-json']);
  });

  it('estimate takes <from> <to> <amount> + supports --addresses', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'estimate')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['from', 'to', 'amount']);
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining([
        '--source-chain',
        '--dest-chain',
        '--addresses',
        '--slippage',
        '--local-only',
      ]),
    );
  });

  it('track + status take <tx-hash> + --chain-id', () => {
    for (const verb of ['track', 'status']) {
      const c = swapCommand.commands.find((cmd) => cmd.name() === verb)!;
      expect((c as any)._args.map((a: any) => a.name())).toEqual(['tx-hash']);
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toContain('--chain-id');
    }
  });

  it('activities supports --bookmark', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'activities')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toContain('--bookmark');
  });

  it('every read subcommand supports network selection + output flags', () => {
    const expected = ['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed'];
    // pools + asset-pairs are command groups with their own subcommand
    // surfaces — drilled into by their own spec files.
    const flatSubs = ['assets', 'chains', 'balances', 'estimate', 'track', 'status', 'activities'];
    for (const verb of flatSubs) {
      const c = swapCommand.commands.find((cmd) => cmd.name() === verb)!;
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(expected));
    }
  });
});

describe('classifyBitBadgesOnlySwap — the three routing branches', () => {
  const bbMsg = (overrides: Record<string, unknown> = {}) =>
    JSON.stringify({
      sender: 'bb1abc',
      routes: [{ poolId: '1', tokenOutDenom: 'uusdc' }],
      tokenIn: { denom: 'ubadge', amount: '1000000' },
      tokenOutMinAmount: '980000',
      affiliates: [],
      ...overrides,
    });

  const bitbadgesOnly = {
    success: true,
    estimate: {
      tokenOutAmount: '990000',
      tokenInAmount: '1000000',
      doesSwap: true,
      autoRedirectedToWETH: false,
      rerouted: false,
      assetPath: [
        { denom: 'ubadge', chainId: 'bitbadges-1', how: 'genesis' },
        { denom: 'uusdc', chainId: 'bitbadges-1', how: 'swap' },
      ],
      skipGoMsgs: [
        {
          multi_chain_msg: {
            chain_id: 'bitbadges-1',
            path: ['bitbadges-1'],
            msg_type_url: '/gamm.v1beta1.MsgSwapExactAmountIn',
            msg: bbMsg(),
          },
        },
      ],
    },
  };

  // Branch 1 — BitBadges-only single native gamm swap → executable.
  it('classifies a single BitBadges-native swap as executable with the TxModal alias typeUrl', () => {
    const r = classifyBitBadgesOnlySwap(bitbadgesOnly);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // Must be the /sign-page registry alias, NOT the proto type URL.
      expect(r.built.typeUrl).toBe('gamm/SwapExactAmountIn');
      expect(r.built.value.sender).toBe('bb1abc');
      expect(r.chainId).toBe('bitbadges-1');
      expect(r.tokenInSeed).toBe('1000000ubadge');
    }
  });

  it('accepts a bare estimate object (no { success, estimate } wrapper)', () => {
    const r = classifyBitBadgesOnlySwap(bitbadgesOnly.estimate);
    expect(r.ok).toBe(true);
  });

  // Branch 2 — Skip:Go-rerouted / EVM / cross-chain → not executable.
  it('refuses an EVM-tx route', () => {
    const r = classifyBitBadgesOnlySwap({
      estimate: { ...bitbadgesOnly.estimate, skipGoMsgs: [{ evm_tx: { chain_id: '1', to: '0x', data: '0x', value: '0' } }] },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/EVM/i);
  });

  it('refuses a Skip:Go-rerouted route even if it ends native', () => {
    const r = classifyBitBadgesOnlySwap({ estimate: { ...bitbadgesOnly.estimate, rerouted: true } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/rerouted/i);
  });

  it('refuses a WithIBCTransfer swap (IBC leg lands on another chain)', () => {
    const r = classifyBitBadgesOnlySwap({
      estimate: {
        ...bitbadgesOnly.estimate,
        skipGoMsgs: [
          {
            multi_chain_msg: {
              chain_id: 'bitbadges-1',
              path: ['bitbadges-1', 'osmosis-1'],
              msg_type_url: '/gamm.v1beta1.MsgSwapExactAmountInWithIBCTransfer',
              msg: bbMsg(),
            },
          },
        ],
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/IBC/i);
  });

  it('refuses when the asset path leaves the BitBadges chain', () => {
    const r = classifyBitBadgesOnlySwap({
      estimate: {
        ...bitbadgesOnly.estimate,
        assetPath: [
          { denom: 'ubadge', chainId: 'bitbadges-1', how: 'genesis' },
          { denom: 'uusdc', chainId: 'noble-1', how: 'transfer' },
        ],
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/asset path/i);
  });

  it('refuses an auto-WETH-redirected route', () => {
    const r = classifyBitBadgesOnlySwap({ estimate: { ...bitbadgesOnly.estimate, autoRedirectedToWETH: true } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/WETH/i);
  });

  // Branch 3 — multi-hop sequence → not executable.
  it('refuses a multi-message (multi-hop) route', () => {
    const r = classifyBitBadgesOnlySwap({
      estimate: {
        ...bitbadgesOnly.estimate,
        skipGoMsgs: [
          bitbadgesOnly.estimate.skipGoMsgs[0],
          bitbadgesOnly.estimate.skipGoMsgs[0],
        ],
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/message\(s\); BitBadges-only is exactly 1/);
  });

  it('refuses a failed estimate', () => {
    const r = classifyBitBadgesOnlySwap({ success: false, estimate: bitbadgesOnly.estimate });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/did not succeed/i);
  });
});

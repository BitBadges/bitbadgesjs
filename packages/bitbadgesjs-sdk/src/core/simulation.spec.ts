import { parseSimulationEvents, calculateNetChanges, type SimulationEvent, type TxMessageInfo } from './simulation.js';
import { BalanceArray } from './balances.js';
import { UintRangeArray } from './uintRanges.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

describe('parseSimulationEvents', () => {
  describe('coin transfer events', () => {
    it('should parse a simple transfer event', () => {
      const events: SimulationEvent[] = [
        {
          type: 'transfer',
          attributes: [
            { key: 'sender', value: 'bb1abc' },
            { key: 'recipient', value: 'bb1def' },
            { key: 'amount', value: '100ubadge' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(1);
      expect(result.coinTransferEvents[0]).toEqual({
        from: 'bb1abc',
        to: 'bb1def',
        amount: 100n,
        denom: 'ubadge',
        isProtocolFee: false
      });
    });

    it('should parse multiple amounts in a single transfer event', () => {
      const events: SimulationEvent[] = [
        {
          type: 'transfer',
          attributes: [
            { key: 'sender', value: 'bb1abc' },
            { key: 'recipient', value: 'bb1def' },
            { key: 'amount', value: '100ubadge,50ibc/ABC123' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(2);
      expect(result.coinTransferEvents[0]).toEqual({
        from: 'bb1abc',
        to: 'bb1def',
        amount: 100n,
        denom: 'ubadge',
        isProtocolFee: false
      });
      expect(result.coinTransferEvents[1]).toEqual({
        from: 'bb1abc',
        to: 'bb1def',
        amount: 50n,
        denom: 'ibc/ABC123',
        isProtocolFee: false
      });
    });

    it('should handle EVM address denom (0x prefix edge case)', () => {
      const events: SimulationEvent[] = [
        {
          type: 'transfer',
          attributes: [
            { key: 'sender', value: 'bb1abc' },
            { key: 'recipient', value: 'bb1def' },
            { key: 'amount', value: '2500x1234abcd' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(1);
      // "2500x1234abcd" → first non-numeric is 'x' at index 4, char before is '0', so denomStartIdx backs up to 3
      // amount = "250", denom = "0x1234abcd"
      expect(result.coinTransferEvents[0].amount).toBe(250n);
      expect(result.coinTransferEvents[0].denom).toBe('0x1234abcd');
    });

    it('should parse delegate events', () => {
      const events: SimulationEvent[] = [
        {
          type: 'delegate',
          attributes: [
            { key: 'delegator', value: 'bb1abc' },
            { key: 'validator', value: 'bbvaloper1xyz' },
            { key: 'amount', value: '5000ubadge' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(1);
      expect(result.coinTransferEvents[0].from).toBe('bb1abc');
      expect(result.coinTransferEvents[0].to).toBe('bbvaloper1xyz');
      expect(result.coinTransferEvents[0].amount).toBe(5000n);
    });
  });

  describe('burn and mint events', () => {
    it('should parse a burn event', () => {
      const events: SimulationEvent[] = [
        {
          type: 'burn',
          attributes: [
            { key: 'burner', value: 'bb1abc' },
            { key: 'amount', value: '200ubadge' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(1);
      expect(result.coinTransferEvents[0]).toEqual({
        from: 'bb1abc',
        to: 'Burn',
        amount: 200n,
        denom: 'ubadge',
        isProtocolFee: false
      });
    });

    it('should parse a coinbase (mint) event', () => {
      const events: SimulationEvent[] = [
        {
          type: 'coinbase',
          attributes: [
            { key: 'minter', value: 'bb1abc' },
            { key: 'amount', value: '300ubadge' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(1);
      expect(result.coinTransferEvents[0]).toEqual({
        from: 'Mint',
        to: 'bb1abc',
        amount: 300n,
        denom: 'ubadge',
        isProtocolFee: false
      });
    });
  });

  describe('badge transfer events', () => {
    it('should parse usedApprovalDetails events for badge transfers', () => {
      const balances = [
        {
          amount: '10',
          tokenIds: [{ start: '1', end: '5' }],
          ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
        }
      ];

      const events: SimulationEvent[] = [
        {
          type: 'usedApprovalDetails',
          attributes: [
            { key: 'from', value: 'bb1abc' },
            { key: 'to', value: 'bb1def' },
            { key: 'collectionId', value: '5' },
            { key: 'balances', value: JSON.stringify(balances) },
            { key: 'coinTransfers', value: 'null' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.badgeTransferEvents).toHaveLength(1);
      expect(result.badgeTransferEvents[0].from).toBe('bb1abc');
      expect(result.badgeTransferEvents[0].to).toBe('bb1def');
      expect(result.badgeTransferEvents[0].collectionId).toBe('5');
      expect(result.badgeTransferEvents[0].balances).toBeInstanceOf(BalanceArray);
    });
  });

  describe('protocol fee detection', () => {
    it('should detect protocol fees from usedApprovalDetails coinTransfers', () => {
      const coinTransfers = [
        { From: 'bb1abc', To: 'community_pool', Amount: '50', Denom: 'ubadge', IsProtocolFee: true }
      ];

      const events: SimulationEvent[] = [
        {
          type: 'usedApprovalDetails',
          attributes: [
            { key: 'from', value: 'bb1abc' },
            { key: 'to', value: 'bb1def' },
            { key: 'collectionId', value: '1' },
            { key: 'balances', value: '[]' },
            { key: 'coinTransfers', value: JSON.stringify(coinTransfers) }
          ]
        },
        {
          type: 'transfer',
          attributes: [
            { key: 'sender', value: 'bb1abc' },
            { key: 'recipient', value: 'community_pool' },
            { key: 'amount', value: '50ubadge' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      const feeEvent = result.coinTransferEvents.find((e) => e.isProtocolFee);
      expect(feeEvent).toBeDefined();
      expect(feeEvent!.isProtocolFee).toBe(true);
      expect(feeEvent!.amount).toBe(50n);
    });
  });

  describe('IBC transfer events', () => {
    it('should parse MsgTransfer from txsInfo', () => {
      const txsInfo: TxMessageInfo[] = [
        {
          type: 'MsgTransfer',
          msg: {
            sender: 'bb1abc',
            receiver: 'cosmos1xyz',
            token: { amount: '1000', denom: 'ubadge' },
            sourcePort: 'transfer',
            sourceChannel: 'channel-0'
          }
        }
      ];

      const result = parseSimulationEvents([], txsInfo);
      expect(result.ibcTransferEvents).toHaveLength(1);
      expect(result.ibcTransferEvents[0]).toEqual({
        from: 'bb1abc',
        to: 'IBC Transfer',
        amount: 1000n,
        denom: 'ubadge',
        sourcePort: 'transfer',
        sourceChannel: 'channel-0',
        receiver: 'cosmos1xyz'
      });
    });

    it('should handle snake_case field names in MsgTransfer', () => {
      const txsInfo: TxMessageInfo[] = [
        {
          type: 'MsgTransfer',
          msg: {
            sender: 'bb1abc',
            receiver: 'cosmos1xyz',
            token: { amount: '500', denom: 'ubadge' },
            source_port: 'transfer',
            source_channel: 'channel-1'
          }
        }
      ];

      const result = parseSimulationEvents([], txsInfo);
      expect(result.ibcTransferEvents[0].sourcePort).toBe('transfer');
      expect(result.ibcTransferEvents[0].sourceChannel).toBe('channel-1');
    });
  });

  describe('ignores irrelevant event types', () => {
    it('should skip events with unknown types', () => {
      const events: SimulationEvent[] = [
        {
          type: 'message',
          attributes: [
            { key: 'action', value: '/cosmos.bank.v1beta1.MsgSend' }
          ]
        },
        {
          type: 'coin_spent',
          attributes: [
            { key: 'spender', value: 'bb1abc' },
            { key: 'amount', value: '100ubadge' }
          ]
        }
      ];

      const result = parseSimulationEvents(events, []);
      expect(result.coinTransferEvents).toHaveLength(0);
      expect(result.badgeTransferEvents).toHaveLength(0);
    });
  });
});

describe('calculateNetChanges', () => {
  describe('coin changes', () => {
    it('should calculate net changes for a simple two-party transfer', () => {
      const parsed = parseSimulationEvents(
        [
          {
            type: 'transfer',
            attributes: [
              { key: 'sender', value: 'bb1alice' },
              { key: 'recipient', value: 'bb1bob' },
              { key: 'amount', value: '500ubadge' }
            ]
          }
        ],
        []
      );

      const netChanges = calculateNetChanges(parsed);
      expect(netChanges.coinChanges['bb1alice']['ubadge']).toBe(-500n);
      expect(netChanges.coinChanges['bb1bob']['ubadge']).toBe(500n);
    });

    it('should include fee deduction for the signer', () => {
      const parsed = parseSimulationEvents(
        [
          {
            type: 'transfer',
            attributes: [
              { key: 'sender', value: 'bb1alice' },
              { key: 'recipient', value: 'bb1bob' },
              { key: 'amount', value: '500ubadge' }
            ]
          }
        ],
        []
      );

      const netChanges = calculateNetChanges(
        parsed,
        { amount: '100', denom: 'ubadge' },
        'bb1alice'
      );

      // Alice: -500 (transfer) -100 (fee) = -600
      expect(netChanges.coinChanges['bb1alice']['ubadge']).toBe(-600n);
      expect(netChanges.coinChanges['bb1bob']['ubadge']).toBe(500n);
      expect(netChanges.coinChanges['Network Fee']['ubadge']).toBe(100n);
    });

    it('should aggregate multiple transfers for the same address', () => {
      const parsed = parseSimulationEvents(
        [
          {
            type: 'transfer',
            attributes: [
              { key: 'sender', value: 'bb1alice' },
              { key: 'recipient', value: 'bb1bob' },
              { key: 'amount', value: '200ubadge' }
            ]
          },
          {
            type: 'transfer',
            attributes: [
              { key: 'sender', value: 'bb1bob' },
              { key: 'recipient', value: 'bb1carol' },
              { key: 'amount', value: '50ubadge' }
            ]
          }
        ],
        []
      );

      const netChanges = calculateNetChanges(parsed);
      expect(netChanges.coinChanges['bb1alice']['ubadge']).toBe(-200n);
      expect(netChanges.coinChanges['bb1bob']['ubadge']).toBe(150n); // +200 - 50
      expect(netChanges.coinChanges['bb1carol']['ubadge']).toBe(50n);
    });

    it('should route protocol fees to Protocol Fee address', () => {
      const coinTransfers = [
        { From: 'bb1alice', To: 'community_pool', Amount: '10', Denom: 'ubadge', IsProtocolFee: true }
      ];

      const parsed = parseSimulationEvents(
        [
          {
            type: 'usedApprovalDetails',
            attributes: [
              { key: 'from', value: 'bb1alice' },
              { key: 'to', value: 'bb1bob' },
              { key: 'collectionId', value: '1' },
              { key: 'balances', value: '[]' },
              { key: 'coinTransfers', value: JSON.stringify(coinTransfers) }
            ]
          },
          {
            type: 'transfer',
            attributes: [
              { key: 'sender', value: 'bb1alice' },
              { key: 'recipient', value: 'community_pool' },
              { key: 'amount', value: '10ubadge' }
            ]
          }
        ],
        []
      );

      const netChanges = calculateNetChanges(parsed);
      expect(netChanges.coinChanges['bb1alice']['ubadge']).toBe(-10n);
      expect(netChanges.coinChanges['Protocol Fee']['ubadge']).toBe(10n);
    });
  });

  describe('badge changes', () => {
    it('should aggregate badge transfers per address per collection', () => {
      const balances = [
        {
          amount: '5',
          tokenIds: [{ start: '1', end: '3' }],
          ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
        }
      ];

      const parsed = parseSimulationEvents(
        [
          {
            type: 'usedApprovalDetails',
            attributes: [
              { key: 'from', value: 'bb1alice' },
              { key: 'to', value: 'bb1bob' },
              { key: 'collectionId', value: '10' },
              { key: 'balances', value: JSON.stringify(balances) },
              { key: 'coinTransfers', value: 'null' }
            ]
          }
        ],
        []
      );

      const netChanges = calculateNetChanges(parsed);

      // Alice should have negative balances for collection 10
      expect(netChanges.badgeChanges['bb1alice']).toBeDefined();
      expect(netChanges.badgeChanges['bb1alice']['10']).toBeInstanceOf(BalanceArray);

      // Bob should have positive balances for collection 10
      expect(netChanges.badgeChanges['bb1bob']).toBeDefined();
      expect(netChanges.badgeChanges['bb1bob']['10']).toBeInstanceOf(BalanceArray);
    });
  });

  describe('IBC transfers', () => {
    it('should include IBC transfers in coin changes', () => {
      const parsed = parseSimulationEvents([], [
        {
          type: 'MsgTransfer',
          msg: {
            sender: 'bb1alice',
            receiver: 'cosmos1xyz',
            token: { amount: '1000', denom: 'ubadge' },
            sourcePort: 'transfer',
            sourceChannel: 'channel-0'
          }
        }
      ]);

      const netChanges = calculateNetChanges(parsed);
      expect(netChanges.coinChanges['bb1alice']['ubadge']).toBe(-1000n);
      expect(netChanges.coinChanges['IBC Transfer']['ubadge']).toBe(1000n);
    });
  });
});

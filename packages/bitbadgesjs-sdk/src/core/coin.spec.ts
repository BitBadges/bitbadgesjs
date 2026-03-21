/**
 * Tests for coin.ts
 *
 * Covers: CosmosCoin constructor, getNumberFieldNames, convert, fromProto
 */

import { CosmosCoin } from './coin.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

describe('CosmosCoin', () => {
  describe('constructor', () => {
    it('should construct with bigint amount', () => {
      const coin = new CosmosCoin({ amount: 1000000n, denom: 'ubadge' });
      expect(coin.amount).toBe(1000000n);
      expect(coin.denom).toBe('ubadge');
    });

    it('should construct with string amount', () => {
      const coin = new CosmosCoin<string>({ amount: '500', denom: 'uatom' });
      expect(coin.amount).toBe('500');
      expect(coin.denom).toBe('uatom');
    });

    it('should construct with number amount', () => {
      const coin = new CosmosCoin<number>({ amount: 42, denom: 'ustake' });
      expect(coin.amount).toBe(42);
      expect(coin.denom).toBe('ustake');
    });

    it('should construct with zero amount', () => {
      const coin = new CosmosCoin({ amount: 0n, denom: 'ubadge' });
      expect(coin.amount).toBe(0n);
    });
  });

  describe('getNumberFieldNames', () => {
    it('should return ["amount"]', () => {
      const coin = new CosmosCoin({ amount: 1n, denom: 'ubadge' });
      expect(coin.getNumberFieldNames()).toEqual(['amount']);
    });
  });

  describe('convert', () => {
    it('should convert bigint to string', () => {
      const coin = new CosmosCoin({ amount: 1000000n, denom: 'ubadge' });
      const stringCoin = coin.convert(String);
      expect(stringCoin.amount).toBe('1000000');
      expect(stringCoin.denom).toBe('ubadge');
    });

    it('should convert bigint to number', () => {
      const coin = new CosmosCoin({ amount: 42n, denom: 'ubadge' });
      const numCoin = coin.convert(Number);
      expect(numCoin.amount).toBe(42);
      expect(numCoin.denom).toBe('ubadge');
    });

    it('should convert string to bigint', () => {
      const coin = new CosmosCoin<string>({ amount: '999', denom: 'ubadge' });
      const bigintCoin = coin.convert(BigInt);
      expect(bigintCoin.amount).toBe(999n);
      expect(bigintCoin.denom).toBe('ubadge');
    });
  });

  describe('fromProto', () => {
    it('should create CosmosCoin from proto data with BigInt converter', () => {
      const proto = { amount: '5000000', denom: 'ubadge' };
      const coin = CosmosCoin.fromProto(proto, BigInt);
      expect(coin.amount).toBe(5000000n);
      expect(coin.denom).toBe('ubadge');
    });

    it('should create CosmosCoin from proto data with Number converter', () => {
      const proto = { amount: '123', denom: 'uatom' };
      const coin = CosmosCoin.fromProto(proto, Number);
      expect(coin.amount).toBe(123);
      expect(coin.denom).toBe('uatom');
    });

    it('should handle zero amount from proto', () => {
      const proto = { amount: '0', denom: 'ubadge' };
      const coin = CosmosCoin.fromProto(proto, BigInt);
      expect(coin.amount).toBe(0n);
    });

    it('should handle large amounts from proto', () => {
      const proto = { amount: '18446744073709551615', denom: 'ubadge' };
      const coin = CosmosCoin.fromProto(proto, BigInt);
      expect(coin.amount).toBe(18446744073709551615n);
    });
  });
});

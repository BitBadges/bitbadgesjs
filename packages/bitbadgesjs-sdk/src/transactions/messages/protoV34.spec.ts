/**
 * BB-40 — generated protos regenerated against the chain's v34 dependency
 * set (cosmos-sdk 0.54.x, ibc-go v11, cosmos/evm 0.7.x).
 *
 * Pins the two deltas the regen exists for:
 *  - `TxBody.unordered` (field 4) and `TxBody.timeout_timestamp` (field 5)
 *    exist and default to unset, so ordinary txs encode byte-identically to
 *    pre-regen SDKs (keeps BB-43's future unordered-tx work honest).
 *  - The ibc-go v11 transfer surface: DenomTrace *queries* are gone; the
 *    deprecated DenomTrace *type* stays exported from the barrel.
 */
import { Timestamp } from '@bufbuild/protobuf';
import { TxBody } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import * as transferV1 from '@/proto/ibc/applications/transfer/v1/index.js';

describe('BB-40 — v34 proto surface', () => {
  describe('TxBody unordered-tx fields (cosmos-sdk 0.53+)', () => {
    it('exist and default to unset', () => {
      const body = new TxBody();
      expect(body.unordered).toBe(false);
      expect(body.timeoutTimestamp).toBeUndefined();
    });

    it('a default TxBody serializes to zero bytes — no wire-format drift for ordinary txs', () => {
      expect(new TxBody().toBinary().length).toBe(0);
    });

    it('round-trips when set', () => {
      const body = new TxBody({
        unordered: true,
        timeoutTimestamp: Timestamp.fromDate(new Date('2026-08-30T00:00:00Z'))
      });
      const decoded = TxBody.fromBinary(body.toBinary());
      expect(decoded.unordered).toBe(true);
      expect(decoded.timeoutTimestamp?.toDate().toISOString()).toBe('2026-08-30T00:00:00.000Z');
    });
  });

  describe('ibc-go v11 transfer surface', () => {
    it('no longer exposes the DenomTrace queries the chain stopped serving', () => {
      expect((transferV1 as any).QueryDenomTraceRequest).toBeUndefined();
      expect((transferV1 as any).QueryDenomTracesRequest).toBeUndefined();
    });

    it('still exports the deprecated DenomTrace type and the new Denoms query surface', () => {
      expect(transferV1.DenomTrace).toBeDefined();
      expect(transferV1.QueryDenomsRequest).toBeDefined();
      expect(transferV1.QueryDenomRequest).toBeDefined();
      // Round-trip sanity on the kept type.
      const trace = new transferV1.DenomTrace({ path: 'transfer/channel-2', baseDenom: 'uusdc' });
      expect(transferV1.DenomTrace.fromBinary(trace.toBinary()).baseDenom).toBe('uusdc');
    });
  });
});

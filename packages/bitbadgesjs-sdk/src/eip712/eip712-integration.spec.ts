/**
 * Integration tests that drive the full pipeline for the actual proto
 * `Msg*` types BitBadges users sign on-chain:
 *
 *   1. Construct a proto message instance (real wrapper class).
 *   2. Run it through `convertProtoMessagesToAmino` (the same path
 *      `createTransactionPayload` uses to produce `legacyAmino.signBytes`).
 *   3. Build an Amino StdSignDoc with `makeSignDoc`.
 *   4. Wrap into EIP-712 typed-data.
 *   5. Hash with our canonical hasher and round-trip through ecRecover.
 *
 * The point isn't field-by-field assertions — those live in
 * `eip712.spec.ts`. The point is: every Msg type a user signs must make
 * it through this pipeline without errors, with the expected type-name
 * landing in the `Tx` schema, and produce a stable 32-byte digest.
 */

import { ethers } from 'ethers';
import { MsgSend } from '../proto/cosmos/bank/v1beta1/tx_pb.js';
import { MsgDelegate } from '../proto/cosmos/staking/v1beta1/tx_pb.js';
import { MsgTransfer } from '../proto/ibc/applications/transfer/v1/tx_pb.js';
import { MsgTransferTokens } from '../proto/tokenization/tx_pb.js';
import { MsgCreateManagerSplitter } from '../proto/managersplitter/tx_pb.js';
import { MsgSwapExactAmountIn } from '../proto/gamm/v1beta1/tx_pb.js';
import { convertProtoMessagesToAmino } from '../transactions/messages/transaction.js';
import { createProtoMsg } from '../transactions/messages/utils.js';
import { makeSignDoc } from '../transactions/messages/signDoc.js';
import { hashTypedData } from './hash.js';
import { wrapTxToTypedData } from './wrap.js';

const EIP155_CHAIN_ID = 50025;
const COSMOS_CHAIN_ID = 'bitbadges_50025-1';
const FEE = { amount: [{ amount: '1000', denom: 'ubadge' }], gas: '200000' };

function buildAndAssert(protoMsgs: any[], expectedTxFieldType: RegExp) {
  const aminoMsgs = convertProtoMessagesToAmino(protoMsgs.map((m) => createProtoMsg(m)));
  const signDoc = makeSignDoc(aminoMsgs, FEE, COSMOS_CHAIN_ID, '', 0, 0);
  // makeSignDoc returns a JS object — wrapTxToTypedData operates on
  // the same shape regardless of whether it came from JSON.parse or
  // a fresh literal.
  const typed = wrapTxToTypedData(signDoc as unknown as Record<string, unknown>, EIP155_CHAIN_ID);

  // The msg0 entry on Tx should reference a TypeMsg... typedef.
  const msg0Field = typed.types.Tx.find((t) => t.name === 'msg0');
  expect(msg0Field).toBeDefined();
  expect(msg0Field!.type).toMatch(expectedTxFieldType);

  // Hash + sign-recover round-trip.
  const digest = hashTypedData(typed);
  expect(digest.length).toBe(32);

  const wallet = ethers.Wallet.createRandom();
  const sig = wallet.signingKey.sign(digest).serialized;
  const recovered = ethers.recoverAddress(digest, sig);
  expect(recovered.toLowerCase()).toBe(wallet.address.toLowerCase());

  return typed;
}

describe('eip712 integration — real proto Msg pipeline', () => {
  it('cosmos.bank MsgSend', () => {
    const msg = new MsgSend({
      fromAddress: 'bb1from',
      toAddress: 'bb1to',
      amount: [{ amount: '100', denom: 'ubadge' }]
    });
    buildAndAssert([msg], /^TypeMsgSend\d+$/);
  });

  it('cosmos.staking MsgDelegate', () => {
    const msg = new MsgDelegate({
      delegatorAddress: 'bb1delegator',
      validatorAddress: 'bbvaloper1validator',
      amount: { amount: '1000', denom: 'ubadge' }
    });
    buildAndAssert([msg], /^TypeMsgDelegate\d+$/);
  });

  it('ibc MsgTransfer', () => {
    const msg = new MsgTransfer({
      sourcePort: 'transfer',
      sourceChannel: 'channel-0',
      token: { amount: '100', denom: 'ubadge' },
      sender: 'bb1sender',
      receiver: 'osmo1receiver',
      timeoutTimestamp: 1700000000000000000n,
      memo: ''
    });
    buildAndAssert([msg], /^TypeMsgTransfer\d+$/);
  });

  // Note: BitBadges-specific modules (tokenization, managersplitter, gamm,
  // poolmanager) register Amino names without the `Msg` prefix
  // (e.g., `tokenization/TransferTokens`, not `tokenization/MsgTransferTokens`),
  // following the same convention as Osmosis. The `Type` typedef in the
  // EIP-712 schema reflects whatever the Amino name's last `/` segment is.
  it('tokenization MsgTransferTokens', () => {
    const msg = new MsgTransferTokens({
      creator: 'bb1creator',
      collectionId: '1',
      transfers: []
    });
    buildAndAssert([msg], /^TypeTransferTokens\d+$/);
  });

  it('managersplitter MsgCreateManagerSplitter', () => {
    const msg = new MsgCreateManagerSplitter({
      admin: 'bb1admin'
    });
    buildAndAssert([msg], /^TypeCreateManagerSplitter\d+$/);
  });

  it('gamm MsgSwapExactAmountIn', () => {
    const msg = new MsgSwapExactAmountIn({
      sender: 'bb1sender',
      routes: [],
      tokenIn: { amount: '100', denom: 'ubadge' },
      tokenOutMinAmount: '90'
    });
    buildAndAssert([msg], /^TypeSwapExactAmountIn\d+$/);
  });

  it('multi-message tx — MsgSend + MsgDelegate', () => {
    const m1 = new MsgSend({
      fromAddress: 'bb1from',
      toAddress: 'bb1to',
      amount: [{ amount: '50', denom: 'ubadge' }]
    });
    const m2 = new MsgDelegate({
      delegatorAddress: 'bb1delegator',
      validatorAddress: 'bbvaloper1validator',
      amount: { amount: '1000', denom: 'ubadge' }
    });
    const aminoMsgs = convertProtoMessagesToAmino([createProtoMsg(m1), createProtoMsg(m2)]);
    const signDoc = makeSignDoc(aminoMsgs, FEE, COSMOS_CHAIN_ID, '', 0, 0);
    const typed = wrapTxToTypedData(signDoc as unknown as Record<string, unknown>, EIP155_CHAIN_ID);

    expect(typed.types.Tx.find((t) => t.name === 'msg0')!.type).toMatch(/^TypeMsgSend\d+$/);
    expect(typed.types.Tx.find((t) => t.name === 'msg1')!.type).toMatch(/^TypeMsgDelegate\d+$/);

    const digest = hashTypedData(typed);
    expect(digest.length).toBe(32);
  });
});

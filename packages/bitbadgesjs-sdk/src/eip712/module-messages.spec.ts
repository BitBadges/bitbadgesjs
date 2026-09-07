import { readFileSync, writeFileSync } from 'fs';
import type { AnyMessage } from '@bufbuild/protobuf';
import { join } from 'path';
import { Wallet, getBytes } from 'ethers';
import * as gamm from '../proto/gamm/v1beta1/tx_pb.js';
import { MsgCreateBalancerPool } from '../proto/gamm/poolmodels/balancer/tx_pb.js';
import { MsgSendWithAliasRouting, MsgUpdateParams } from '../proto/sendmanager/v1/tx_pb.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { createProtoMsg } from '../transactions/messages/utils.js';
import { createTransactionPayload } from '../transactions/messages/base.js';
import { convertProtoMessagesToAmino } from '../transactions/messages/transaction.js';
import { makeSignDoc } from '../transactions/messages/signDoc.js';
import { buildEIP712TypedData } from './build.js';
import { buildEip712TxRaw } from './broadcast.js';
import { hashTypedData } from './hash.js';
import { verifyEip712Tx } from './verify.js';
import { TxBody } from '../proto/cosmos/tx/v1beta1/tx_pb.js';

const wallet = new Wallet('0x' + '1'.padStart(64, '0'));
const sender = convertToBitBadgesAddress(wallet.address);
const coin = { denom: 'ubadge', amount: '100' };
const pool = { sender, poolId: 1n };
const swap = { sender, routes: [{ poolId: 1n, tokenOutDenom: 'other' }], tokenIn: coin, tokenOutMinAmount: '1' };
const messages: AnyMessage[] = [
  new gamm.MsgJoinPool({ ...pool, shareOutAmount: '1', tokenInMaxs: [coin] }),
  new gamm.MsgExitPool({ ...pool, shareInAmount: '1', tokenOutMins: [coin] }),
  new gamm.MsgSwapExactAmountIn(swap),
  new gamm.MsgSwapExactAmountOut({ sender, routes: [{ poolId: 1n, tokenInDenom: 'other' }], tokenOut: coin, tokenInMaxAmount: '1000' }),
  new gamm.MsgJoinSwapExternAmountIn({ ...pool, tokenIn: coin, shareOutMinAmount: '1' }),
  new gamm.MsgJoinSwapShareAmountOut({ ...pool, tokenInDenom: 'ubadge', shareOutAmount: '1', tokenInMaxAmount: '1000' }),
  new gamm.MsgExitSwapExternAmountOut({ ...pool, tokenOut: coin, shareInMaxAmount: '1000' }),
  new gamm.MsgExitSwapShareAmountIn({ ...pool, tokenOutDenom: 'ubadge', shareInAmount: '1', tokenOutMinAmount: '1' }),
  new gamm.MsgSwapExactAmountInWithIBCTransfer({
    ...swap,
    ibcTransferInfo: { sourceChannel: 'channel-0', receiver: sender, timeoutTimestamp: 1900000000000000000n }
  }),
  new MsgCreateBalancerPool({
    sender,
    poolParams: { swapFee: '3000000000000000', exitFee: '0' },
    poolAssets: [
      { token: coin, weight: '1' },
      { token: { denom: 'other', amount: '100' }, weight: '1' }
    ]
  }),
  new MsgSendWithAliasRouting({ fromAddress: sender, toAddress: sender, amount: [coin] }),
  new MsgUpdateParams({ authority: sender, params: {} })
];
const fee = { amount: '3000000', denom: 'ubadge', gas: 300000 };
it.each(messages.map((message) => ({ name: message.getType().typeName, message })))(
  '$name exposes typed data through the frontend payload factory',
  ({ message }) => {
    const payload = createTransactionPayload(
      {
        chainIdOverride: 'bitbadges-1',
        eip155ChainIdOverride: 50024,
        sender: {
          address: sender,
          sequence: 0n,
          accountNumber: 1n,
          publicKey: Buffer.from(getBytes(wallet.signingKey.compressedPublicKey)).toString('base64')
        },
        evmAddress: wallet.address,
        fee: { ...fee, gas: String(fee.gas) },
        memo: 'module sign-in intent'
      },
      message
    );
    expect(payload.eip712).toBeDefined();
    expect(hashTypedData(payload.eip712!)).toEqual(
      hashTypedData(
        buildEIP712TypedData({
          messages: [createProtoMsg(message)],
          cosmosChainId: 'bitbadges-1',
          eip155ChainId: 50024,
          accountNumber: 1n,
          sequence: 0n,
          memo: 'module sign-in intent',
          fee
        })
      )
    );
  }
);
const fixtures = messages.map((msg) => {
  const encoded = [createProtoMsg(msg)];
  const args = {
    messages: encoded,
    cosmosChainId: 'bitbadges-1',
    eip155ChainId: 50024,
    accountNumber: 1n,
    sequence: 0n,
    memo: 'module sign-in intent',
    fee
  };
  const typed = buildEIP712TypedData(args);
  const digest = hashTypedData(typed);
  const tx = buildEip712TxRaw({
    ...args,
    compressedPubKey: getBytes(wallet.signingKey.compressedPublicKey),
    signatureHex: wallet.signingKey.sign(digest).serialized
  });
  return {
    name: msg.getType().typeName,
    tx,
    signDoc: makeSignDoc(
      convertProtoMessagesToAmino(encoded),
      { amount: [{ denom: fee.denom, amount: fee.amount }], gas: String(fee.gas) },
      args.cosmosChainId,
      args.memo,
      1,
      0
    ),
    hash: Buffer.from(digest).toString('hex')
  };
});
it.each(fixtures)('$name signs and verifies with the transaction sign-in verifier', async ({ tx }) => {
  const options = { cosmosChainId: 'bitbadges-1', eip155ChainId: 50024, getAccountNumber: async () => 1n };
  expect(await verifyEip712Tx(tx.toBinary(), options)).toEqual({ signer: sender, memo: 'module sign-in intent' });
  const body = TxBody.fromBinary(tx.bodyBytes);
  body.memo = 'tampered';
  const tampered = tx.clone();
  tampered.bodyBytes = body.toBinary();
  await expect(verifyEip712Tx(tampered.toBinary(), options)).rejects.toThrow();
});
it('matches the cross-repo chain hash fixtures', () => {
  const expected = fixtures.map(({ name, signDoc, hash, tx }) => ({
    name,
    signDoc,
    hash,
    signer: sender,
    txBytes: Buffer.from(tx.toBinary()).toString('base64')
  }));
  const path = join(__dirname, 'module-messages.fixture.json');
  if (process.env.UPDATE_EIP712_MODULE_FIXTURES === '1') writeFileSync(path, JSON.stringify(expected, null, 2) + '\n');
  expect(expected).toEqual(JSON.parse(readFileSync(path, 'utf8')));
});

import { Wallet, getBytes } from 'ethers';
import { Any } from '@bufbuild/protobuf';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { MsgSend } from '../proto/cosmos/bank/v1beta1/tx_pb.js';
import { AuthInfo, TxBody } from '../proto/cosmos/tx/v1beta1/tx_pb.js';
import { buildEIP712TypedData } from './build.js';
import { buildEip712TxRaw } from './broadcast.js';
import { hashTypedData } from './hash.js';
import { createProtoMsg } from '../transactions/messages/utils.js';
import { verifyEip712Tx } from './verify.js';

const wallet = new Wallet('0x' + '1'.padStart(64, '0'));
const signer = convertToBitBadgesAddress(wallet.address);
const accountNumber = 11715262360359940575n;
function fixture() {
  const messages = [createProtoMsg(new MsgSend({ fromAddress: signer, toAddress: signer, amount: [{ denom: 'ubadge', amount: '1' }] }))];
  const args = {
    messages,
    cosmosChainId: 'bitbadges-1',
    eip155ChainId: 50024,
    accountNumber,
    sequence: 4n,
    memo: 'session-bound intent',
    fee: { amount: '3000000', denom: 'ubadge', gas: 300000 }
  };
  const typed = buildEIP712TypedData(args);
  return buildEip712TxRaw({
    ...args,
    compressedPubKey: getBytes(wallet.signingKey.compressedPublicKey),
    signatureHex: wallet.signingKey.sign(hashTypedData(typed)).serialized
  });
}
const options = () => ({ cosmosChainId: 'bitbadges-1', eip155ChainId: 50024, getAccountNumber: jest.fn(async () => accountNumber) });
it('verifies a signed EIP-712 envelope using the trusted account number', async () => {
  const opts = options();
  expect(await verifyEip712Tx(fixture().toBinary(), opts)).toEqual({ signer, memo: 'session-bound intent' });
  expect(opts.getAccountNumber).toHaveBeenCalledWith(signer);
});
it.each(['memo', 'amount', 'sequence', 'fee', 'publicKey', 'signature', 'extension', 'timeout', 'payer', 'unknown'])(
  'rejects tampered or unsupported %s',
  async (field) => {
    const tx = fixture();
    const body = TxBody.fromBinary(tx.bodyBytes);
    const auth = AuthInfo.fromBinary(tx.authInfoBytes);
    if (field === 'memo') body.memo = 'other session';
    if (field === 'amount') {
      const msg = MsgSend.fromBinary(body.messages[0].value);
      msg.amount[0].amount = '2';
      body.messages[0].value = msg.toBinary();
    }
    if (field === 'sequence') auth.signerInfos[0].sequence++;
    if (field === 'fee') auth.fee!.amount[0].amount = '1';
    if (field === 'publicKey')
      auth.signerInfos[0].publicKey!.value = new Uint8Array([
        10,
        33,
        ...getBytes(new Wallet('0x' + '2'.padStart(64, '0')).signingKey.compressedPublicKey)
      ]);
    if (field === 'signature') tx.signatures[0][0] ^= 1;
    if (field === 'extension') body.extensionOptions = [new Any({ typeUrl: '/unknown' })];
    if (field === 'timeout') body.timeoutHeight = 9n;
    if (field === 'payer') auth.fee!.payer = signer;
    tx.bodyBytes = body.toBinary();
    tx.authInfoBytes = auth.toBinary();
    const bytes = field === 'unknown' ? new Uint8Array([...tx.toBinary(), 160, 6, 1]) : tx.toBinary();
    await expect(verifyEip712Tx(bytes, options())).rejects.toThrow();
  }
);
it.each(['cosmos', 'evm', 'account'])('rejects wrong trusted %s context', async (field) => {
  const opts = options();
  if (field === 'cosmos') opts.cosmosChainId = 'bitbadges-2';
  if (field === 'evm') opts.eip155ChainId = 50025;
  if (field === 'account') opts.getAccountNumber.mockResolvedValue(accountNumber + 1n);
  await expect(verifyEip712Tx(fixture().toBinary(), opts)).rejects.toThrow();
});

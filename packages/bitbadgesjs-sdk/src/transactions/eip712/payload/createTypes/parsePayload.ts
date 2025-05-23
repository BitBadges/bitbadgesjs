import type { EIP712Type } from '../eip712Types.js';
import { newType } from '../eip712Types.js';
import { payloadMsgFieldForIndex } from '../flattenPayload.js';
import { getSampleMsg } from '../samples/getSampleMsg.js';
import type { FlattenPayloadResponse, JSONObject } from '../types.js';
import addMsgTypes from './parseMessage.js';

export const createBaseTypes = () => ({
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'salt', type: 'bytes32' }
  ],
  Tx: [
    { name: 'account_number', type: 'string' },
    { name: 'chain_id', type: 'string' },
    { name: 'fee', type: 'Fee' },
    { name: 'memo', type: 'string' },
    { name: 'sequence', type: 'string' }
  ],
  Fee: [
    { name: 'amount', type: 'Coin[]' },
    { name: 'gas', type: 'string' }
  ],
  Coin: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' }
  ]
});

const addMsgTypedef = (types: JSONObject, newType: EIP712Type) => {
  types.Tx.push(newType);
};

const eip712Types = (flattenedPayload: FlattenPayloadResponse) => {
  const { numMessages, payload } = flattenedPayload;
  const types = createBaseTypes();

  const processMessage = (msg: any) => {
    // Handle arrays of messages
    // This is for cosmos-sdk/MsgExec - authz
    if (Array.isArray(msg.value.msgs)) {
      msg.value.msgs.forEach((innerMsg: any) => {
        processMessage(innerMsg);
      });
    }

    const msgType = msg.type;
    const sampleMsg = getSampleMsg(msgType, msg);
    const typedef = addMsgTypes(types, sampleMsg);

    const txType = newType(msgType, typedef);
    addMsgTypedef(types, txType);
  };

  // Process top-level messages
  for (let i = 0; i < numMessages; i++) {
    const key = payloadMsgFieldForIndex(i);
    const msg = payload[key];
    processMessage(msg);
  }

  return types as JSONObject;
};

export default eip712Types;

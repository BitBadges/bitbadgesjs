import { EVMChainIDMainnet, EVMChainIDTestnet, MAINNET_CHAIN_DETAILS, TESTNET_CHAIN_DETAILS } from '../common/constants.js';
import { convertProtoMessagesToAmino, createStdFee } from '../transactions/messages/transaction.js';
import { makeSignDoc } from '../transactions/messages/signDoc.js';
import { createProtoMsg } from '../transactions/messages/utils.js';
import type { MessageGenerated } from '../transactions/messages/utils.js';
import { wrapTxToTypedData } from './wrap.js';
import type { EIP712TypedData } from './types.js';

/**
 * High-level helper that mirrors the inputs `createTransactionWithMultipleMessages`
 * takes and returns the EIP-712 typed-data ready for an EVM wallet.
 *
 * Same Amino encoding pipeline that powers `legacyAmino.signBytes` — so any
 * Msg type with an Amino converter registered works automatically. Adding
 * a new Msg type to the Amino registry adds it to this builder for free.
 */
export interface BuildEIP712Args {
  /** Proto messages (raw bufbuild Message instances or pre-wrapped MessageGenerated). */
  messages: any[];
  /** Cosmos chain-id string, e.g. "bitbadges-1" or "bitbadges-2". */
  cosmosChainId: string;
  /** EIP-155 numeric chain id (50024 mainnet, 50025 testnet, 90123 local). */
  eip155ChainId: number;
  fee: { amount: string; denom: string; gas: number };
  memo?: string;
  sequence: number;
  accountNumber: number;
}

export function buildEIP712TypedData(args: BuildEIP712Args): EIP712TypedData {
  const generated: MessageGenerated[] = args.messages.map((m) =>
    // Already a wrapped { message, path } envelope?
    m && typeof m === 'object' && 'path' in m && 'message' in m ? (m as MessageGenerated) : createProtoMsg(m)
  );
  const aminoMsgs = convertProtoMessagesToAmino(generated);
  const stdFee = createStdFee(args.fee.amount, args.fee.denom, args.fee.gas);
  const signDoc = makeSignDoc(aminoMsgs, stdFee, args.cosmosChainId, args.memo ?? '', args.accountNumber, args.sequence);
  return wrapTxToTypedData(signDoc as unknown as Record<string, unknown>, args.eip155ChainId);
}

/**
 * Maps a Cosmos chain numeric id (1 = mainnet, 2 = testnet) to the
 * corresponding EIP-155 numeric chain id used by the EVM module.
 *
 * Throws on unknown ids — callers using a chainIdOverride / local devnet
 * must pass the EIP-155 chain id explicitly.
 */
export function eip155ChainIdFromCosmosChainId(cosmosChainNumeric: number): number {
  if (cosmosChainNumeric === MAINNET_CHAIN_DETAILS.chainId) return Number(EVMChainIDMainnet);
  if (cosmosChainNumeric === TESTNET_CHAIN_DETAILS.chainId) return Number(EVMChainIDTestnet);
  throw new Error(
    `eip712: unknown cosmos chain numeric id ${cosmosChainNumeric}; pass eip155ChainId explicitly for custom chains (e.g. 90123 for local devnet)`
  );
}

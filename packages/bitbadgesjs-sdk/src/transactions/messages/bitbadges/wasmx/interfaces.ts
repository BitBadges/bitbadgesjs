/**
 * @category Interfaces
 */
export interface iMsgInstantiateContractCompat {
  /** The sender of the transaction. */
  sender: string;
  /** The code ID of the contract to instantiate. */
  codeId: string;
  /** The human-readable label of the contract. */
  label: string;
  /** The amount of funds to send to the contract on instantiation. */
  funds: string;
}

/**
 * @category Interfaces
 */
export interface iMsgStoreCodeCompat {
  /** The sender of the transaction. */
  sender: string;
  /** The contract byte code in hexadecimal format. See BitBadges CosmWASM tutorial for more details. */
  hexWasmByteCode: string;
}

/**
 * @category Interfaces
 */
export interface iMsgExecuteContractCompat {
  /** The sender of the transaction. */
  sender: string;
  /** The contract address to execute. */
  contract: string;
  /** The message to pass to the contract. Must be a valid JSON string. */
  msg: string;
  /** The funds to send to the contract. Must be a valid JSON string. */
  funds: string;
}

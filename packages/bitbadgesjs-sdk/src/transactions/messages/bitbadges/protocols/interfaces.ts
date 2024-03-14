import type { NumberType } from '@/common/string-numbers';

/**
 * @category Interfaces
 */
export interface iProtocol {
  /** The name of the protocol. */
  name: string;
  /** The URI of the protocol. */
  uri: string;
  /** The custom data of the protocol. */
  customData: string;
  /** The cosmos address of the user who created the protocol. */
  createdBy: string;
  /** Whether the protocol is frozen or not. */
  isFrozen: boolean;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateProtocol {
  /** The creator of the protocol. */
  creator: string;
  /** The name of the protocol. */
  name: string;
  /** The URI for the protocol. */
  uri: string;
  /** Custom data for the protocol. */
  customData: string;
  /** Whether the protocol is frozen. */
  isFrozen: boolean;
}

/**
 * @category Interfaces
 */
export interface iMsgUnsetCollectionForProtocol {
  /** The creator of the protocol. */
  creator: string;
  /** The name of the protocol. */
  name: string;
}

/**
 * @category Interfaces
 */
export interface iMsgSetCollectionForProtocol<T extends NumberType> {
  /** The creator of the protocol. */
  creator: string;
  /** The name of the protocol. */
  name: string;
  /** The collection id for the protocol. */
  collectionId: T;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteProtocol {
  /** The creator of the protocol. */
  creator: string;
  /** The name of the protocol. */
  name: string;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateProtocol {
  /** The creator of the protocol. */
  creator: string;
  /** The name of the protocol. */
  name: string;
  /** The URI for the protocol. */
  uri: string;
  /** Custom data for the protocol. */
  customData: string;
  /** Whether the protocol is frozen. */
  isFrozen: boolean;
}

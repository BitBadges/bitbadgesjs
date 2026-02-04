import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iManagerSplitterPermissions } from '@/interfaces/types/managersplitter.js';
import type { iMsgUniversalUpdateCollection } from '../tokenization/interfaces.js';

/**
 * @category Interfaces
 */
export interface iMsgCreateManagerSplitter {
  /** The admin address creating the entity. */
  admin: BitBadgesAddress;
  /** Permissions mapping each CollectionPermission field to execution criteria. */
  permissions: iManagerSplitterPermissions;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateManagerSplitter {
  /** The admin address updating the entity. */
  admin: BitBadgesAddress;
  /** Address of the manager splitter to update. */
  address: BitBadgesAddress;
  /** New permissions to set. */
  permissions: iManagerSplitterPermissions;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteManagerSplitter {
  /** The admin address deleting the entity. */
  admin: BitBadgesAddress;
  /** Address of the manager splitter to delete. */
  address: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iMsgExecuteUniversalUpdateCollection<T extends NumberType> {
  /** Address executing the message (must be approved or admin). */
  executor: BitBadgesAddress;
  /** Address of the manager splitter to execute through. */
  managerSplitterAddress: BitBadgesAddress;
  /** The UniversalUpdateCollection message to execute. */
  universalUpdateCollectionMsg: iMsgUniversalUpdateCollection<T>;
}

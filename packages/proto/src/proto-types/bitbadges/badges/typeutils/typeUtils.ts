import { NumberType } from "../string-numbers";
import { UserIncomingApproval, UserOutgoingApproval, convertUserIncomingApproval, convertUserOutgoingApproval } from "./approvals";
import { UserPermissions, convertUserPermissions } from "./permissions";

export function deepCopy<T>(obj: T): T {
  return deepCopyWithBigInts(obj);
}

function deepCopyWithBigInts<T>(obj: T): T {
  if (Array.isArray(obj)) {
    // Create a deep copy of an array
    return obj.map((item) => deepCopyWithBigInts(item)) as unknown as T;
  }

  if (typeof obj !== 'object' || obj === null) {
    // <T> case: return primitive values as-is
    return obj;
  }

  // Create a deep copy of an object
  const copiedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copiedObj[key] = deepCopyWithBigInts(obj[key]);
    }
  }
  return copiedObj;
}

/**
 * UserBalance represents the balance of a user and all their approved transfers / permissions.
 *
 * @typedef {Object} UserBalance
 * @property {Balance[]} balances - The balances of the user.
 * @property {UserOutgoingApproval[]} outgoingApprovals - The approved outgoing transfers of the user.
 * @property {UserIncomingApproval[]} incomingApprovals - The approved incoming transfers of the user.
 * @property {UserPermissions} userPermissions - The permissions of the user to update their incoming / outgoing approvals.
 */
export interface UserBalance<T extends NumberType> {
  balances: Balance<T>[];
  outgoingApprovals: UserOutgoingApproval<T>[];
  incomingApprovals: UserIncomingApproval<T>[];
  userPermissions: UserPermissions<T>;
}

export function convertUserBalance<T extends NumberType, U extends NumberType>(balance: UserBalance<T>, convertFunction: (item: T) => U): UserBalance<U> {
  return deepCopy({
    ...balance,
    balances: balance.balances.map((b) => convertBalance(b, convertFunction)),
    outgoingApprovals: balance.outgoingApprovals.map((t) => convertUserOutgoingApproval(t, convertFunction)),
    incomingApprovals: balance.incomingApprovals.map((t) => convertUserIncomingApproval(t, convertFunction)),
    userPermissions: convertUserPermissions(balance.userPermissions, convertFunction)
  })
}

/**
 * UintRanges are used to represent a range of numbers from some start ID to some end ID, inclusive.
 *
 * This is typically used to represent a range of badge IDs or time ranges.
 *
 * @typedef {Object} UintRange
 * @property {NumberType} start - The start of the range.
 * @property {NumberType} end - The end of the range.
 */
export interface UintRange<T extends NumberType> {
  start: T;
  end: T;
}

export function convertUintRange<T extends NumberType, U extends NumberType>(range: UintRange<T>, convertFunction: (item: T) => U): UintRange<U> {
  return deepCopy({
    ...range,
    start: convertFunction(range.start),
    end: convertFunction(range.end)
  })
}


/**
 * BadgeMetadata is used to represent the metadata for a range of badge IDs. The metadata can be hosted via a URI (via uri) or stored on-chain (via customData).
 *
 * We take first-match only for the badge IDs. If a badge ID is in multiple BadgeMetadata, we take the first time
 * it is found in a linear search.
 *
 * @typedef {Object} BadgeMetadata
 * @property {string} uri - The URI where to fetch the badge metadata from.
 * @property {UintRange[]} badgeIds - The badge IDs corresponding to the URI.
 * @property {string} customData - Arbitrary custom data that can be stored on-chain
 */
export interface BadgeMetadata<T extends NumberType> {
  uri: string
  customData: string
  badgeIds: UintRange<T>[]
}

export function convertBadgeMetadata<T extends NumberType, U extends NumberType>(uri: BadgeMetadata<T>, convertFunction: (item: T) => U): BadgeMetadata<U> {
  return deepCopy({
    ...uri,
    badgeIds: uri.badgeIds.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * CollectionMetadata represents the metadata of the collection
 *
 * @typedef {Object} CollectionMetadata
 * @property {string} uri - The URI where to fetch the collection metadata from.
 * @property {string} customData - Arbitrary custom data that can be stored on-chain
 */
export interface CollectionMetadata {
  uri: string
  customData: string
}

// export function convertCollectionMetadata<T extends NumberType, U extends NumberType>(uri: CollectionMetadata<T>, convertFunction: (item: T) => U): CollectionMetadata<U> {
//   return deepCopy({
//     ...uri,
//   })
// }

/**
 * OffChainBalancesMetadata represents the metadata of the off-chain balances
 *
 * @typedef {Object} OffChainBalancesMetadata
 * @property {string} uri - The URI where to fetch the off-chain balances metadata from.
 * @property {string} customData - Arbitrary custom data that can be stored on-chain
 */
export interface OffChainBalancesMetadata {
  uri: string
  customData: string
}

// export function convertOffChainBalancesMetadata<T extends NumberType, U extends NumberType>(uri: OffChainBalancesMetadata, convertFunction: (item: T) => U): OffChainBalancesMetadata<U> {
//   return deepCopy({
//     ...uri,
//   })
// }

/**
 * MustOwnBadges are used to represent a challenge for an approved transfer where a user
 * must own min-max (amountRange) of the badges (badgeIds) from a specific collection (collectionId)
 * to be able to transfer the badges.
 *
 * @typedef {Object} MustOwnBadges
 * @property {NumberType} collectionId - The collection ID of the badges to own.
 * @property {UintRange} amountRange - The min/max acceptable amount of badges that must be owned (can be any values, including 0-0).
 * @property {UintRange[]} ownershipTimes - The range of the times that the badges must be owned.
 * @property {UintRange[]} badgeIds - The range of the badge IDs that must be owned.
 * @property {boolean} overrideWithCurrentTime - Whether or not to override the ownershipTimes with the current time.
 *
 * @property {boolean} mustOwnAll - Whether or not the user must own all the sepcified badges. If false, we will accept if they own at least one.
 */
export interface MustOwnBadges<T extends NumberType> {
  collectionId: T;

  amountRange: UintRange<T>;
  ownershipTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];

  overrideWithCurrentTime: boolean;

  mustOwnAll: boolean;
}

export function convertMustOwnBadges<T extends NumberType, U extends NumberType>(mustOwn: MustOwnBadges<T>, convertFunction: (item: T) => U): MustOwnBadges<U> {
  return deepCopy({
    ...mustOwn,
    collectionId: convertFunction(mustOwn.collectionId),
    amountRange: convertUintRange(mustOwn.amountRange, convertFunction),
    ownershipTimes: mustOwn.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: mustOwn.badgeIds.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * InheritedBalance represents a balance that is inherited from a parent collection.
 * Only used for collections with inherited balance type.
 *
 * Note that the number of badgeIDs specified in the parentBadgeIds must equal one or match the number of badgeIDs specified in the badgeIds.
 * If the number of badgeIDs specified in the parentBadgeIds equals one, then all badgeIds will inherit the balance from the single parent badge ID.
 * If the number of badgeIDs specified in the parentBadgeIds matches the number of badgeIDs specified in the badgeIds, then each badgeId will inherit the balance from the corresponding parent badge ID.
 *
 * @typedef {Object} InheritedBalance
 * @property {NumberType} parentCollectionId - The parent collection ID of the inherited balance.
 * @property {UintRange[]} parentBadgeIds - The parent badge IDs of the inherited balance.
 * @property {UintRange[]} badgeIds - The badge IDs of the inherited balance.
 *
 */
export interface InheritedBalance<T extends NumberType> {
  badgeIds: UintRange<T>[];
  parentCollectionId: T;
  parentBadgeIds: UintRange<T>[];
}

export function convertInheritedBalance<T extends NumberType, U extends NumberType>(inheritedBalance: InheritedBalance<T>, convertFunction: (item: T) => U): InheritedBalance<U> {
  return deepCopy({
    ...inheritedBalance,
    badgeIds: inheritedBalance.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    parentCollectionId: convertFunction(inheritedBalance.parentCollectionId),
    parentBadgeIds: inheritedBalance.parentBadgeIds.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * Balance is used to represent a balance of a badge.
 *
 * @typedef {Object} Balance
 * @property {NumberType} amount - The amount or balance of the owned badge.
 * @property {UintRange[]} badgeIds - The badge IDs corresponding to the balance.
 * @property {UintRange[]} ownershipTimes - The times that the badge is owned from.
 */
export interface Balance<T extends NumberType> {
  amount: T;
  badgeIds: UintRange<T>[]
  ownershipTimes: UintRange<T>[]
}

export function convertBalance<T extends NumberType, U extends NumberType>(balance: Balance<T>, convertFunction: (item: T) => U): Balance<U> {
  return deepCopy({
    ...balance,
    amount: convertFunction(balance.amount),
    badgeIds: balance.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: balance.ownershipTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * AddressMappings represent a list of addresses, identified by a unique ID.
 *
 * AddressMappings can be used by any collection, so the ID must be globally unique and not used before.
 *
 * Note that some IDs such as ("Mint", "Manager", etc) are reserved.
 *
 * @typedef {Object} AddressMapping
 * @property {string} mappingId - The ID of the address mapping.
 * @property {string[]} addresses - The addresses of the address mapping.
 * @property {boolean} includeAddresses - Whether or not to include ONLY the addresses or include all EXCEPT the addresses.
 * @property {string} uri - The URI where to fetch the address mapping metadata from.
 * @property {string} customData - Arbitrary custom data that can be stored on-chain.
 */
export interface AddressMapping {
  mappingId: string;

  addresses: string[];
  includeAddresses: boolean;

  uri: string;
  customData: string;

  createdBy?: string;
}

// export function convertAddressMapping<T extends NumberType, U extends NumberType>(addressMapping: AddressMapping<T>, convertFunction: (item: T) => U): AddressMapping<U> {
//   return deepCopy({
//     ...addressMapping,
//     mappingId: addressMapping.mappingId,
//     addresses: addressMapping.addresses,
//     includeAddresses: addressMapping.includeAddresses,
//     uri: addressMapping.uri,
//     customData: addressMapping.customData
//   })
// }


/**
 * Transfer is used to represent a transfer of badges.
 *
 * @typedef {Object} Transfer
 * @property {string} from - The address to transfer from.
 * @property {string[]} toAddresses - The addresses to transfer to.
 * @property {Balance[]} balances - The balances to transfer.
 * @property {ApprovalIdentifierDetails} precalculateBalancesFromApproval - If specified, we will precalculate from this approval and override the balances. This can only be used when the specified approval has predeterminedBalances set.
 * @property {MerkleProof[]} merkleProofs - The merkle proofs that satisfy the mkerkle challenges in the approvals. If the transfer deducts from multiple approvals, we check all the merkle proofs and assert at least one is valid for every challenge.
 * @property {string} memo - Arbitrary memo for the transfer.
 * @property {ApprovalIdentifierDetails[]} prioritizedApprovals - The prioritized approvals to use for the transfer. If specified, we will check these first.
 * @property {boolean} onlyCheckPrioritizedApprovals - Whether or not to only check the prioritized approvals. If false, we will check all approvals with any prioritized first.
 */
export interface Transfer<T extends NumberType> {
  from: string
  toAddresses: string[]
  balances: Balance<T>[]
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails
  merkleProofs?: MerkleProof[]
  memo?: string
  prioritizedApprovals?: ApprovalIdentifierDetails[],
  onlyCheckPrioritizedApprovals?: boolean
}

export function convertTransfer<T extends NumberType, U extends NumberType>(transfer: Transfer<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): Transfer<U> {
  return deepCopy({
    ...transfer,
    balances: transfer.balances.map((b) => convertBalance(b, convertFunction)),
    precalculateBalancesFromApproval: transfer.precalculateBalancesFromApproval ?? populateOptionalFields ? {
      approvalId: '',
      approvalLevel: '',
      approverAddress: ''
    } : undefined,
    merkleProofs: transfer.merkleProofs ?? populateOptionalFields ? [] : undefined,
    prioritizedApprovals: transfer.prioritizedApprovals ?? populateOptionalFields ? [] : undefined,
    memo: transfer.memo ?? populateOptionalFields ? '' : undefined,
    onlyCheckPrioritizedApprovals: transfer.onlyCheckPrioritizedApprovals ?? populateOptionalFields ? false : undefined,
  })
}

export interface ApprovalIdentifierDetails {
  approvalId: string
  approvalLevel: string
  approverAddress: string
}

/**
 * AmountTrackerIdDetails is used to represent an exact approval.
 *
 * @typedef {Object} AmountTrackerIdDetails
 * @property {string} amountTrackerId - The approval ID of the approval.
 * @property {string} approvalLevel - The approval level of the approval "collection", "incoming", or "outgoing".
 * @property {string} address - The address of the approval to check.
 * @property {string} addressToCheck - The address to check for the approval.
 */
export interface AmountTrackerIdDetails<T extends NumberType> {
  collectionId: T
  approvalLevel: "collection" | "incoming" | "outgoing" | ""
  approverAddress: string
  amountTrackerId: string
  trackerType: "overall" | "to" | "from" | "initiatedBy" | ""
  approvedAddress: string
}

export function convertAmountTrackerIdDetails<T extends NumberType, U extends NumberType>(approvalIdDetails: AmountTrackerIdDetails<T>, convertFunction: (item: T) => U): AmountTrackerIdDetails<U> {
  return deepCopy({
    ...approvalIdDetails,
    collectionId: convertFunction(approvalIdDetails.collectionId),
  })
}

// export function convertApprovalIdDetails<T extends NumberType, U extends NumberType>(approvalIdDetails: ApprovalIdDetails<T>, convertFunction: (item: T) => U): ApprovalIdDetails<U> {
//   return deepCopy({
//     ...approvalIdDetails,
//   })
// }

/**
 * MerkleChallenge is used to represent a merkle challenge for an approval.
 *
 * @typedef {Object} MerkleChallenge
 * @property {string} root - The root of the merkle tree.
 * @property {NumberType} expectedProofLength - The expected proof length of the merkle proof.
 * @property {boolean} useCreatorAddressAsLeaf - Whether or not to override any leaf value and use the creator address as the leaf. Used for whitelist trees.
 * @property {boolean} maxOneUsePerLeaf - Whether or not to enforce only one use per leaf. Used to prevent replay attacks.
 * @property {boolean} useLeafIndexForTransferOrder - Whether or not to use the leaf index for the transfer order for the predeterminedBalances.
 *                                                    If so, the leaf index 0 will be the leftmost leaf of the valid proof layer (i.e. the one that corresponds to expectedProofLength).
 */
export interface MerkleChallenge<T extends NumberType> {
  root: string
  expectedProofLength: T;
  useCreatorAddressAsLeaf: boolean
  maxOneUsePerLeaf: boolean
  uri: string
  customData: string
}

export function convertMerkleChallenge<T extends NumberType, U extends NumberType>(merkleChallenge: MerkleChallenge<T>, convertFunction: (item: T) => U): MerkleChallenge<U> {
  return deepCopy({
    ...merkleChallenge,
    expectedProofLength: convertFunction(merkleChallenge.expectedProofLength),
  })
}

export interface MerklePathItem {
  aunt: string
  onRight: boolean
}

export interface MerkleProof {
  aunts: MerklePathItem[]
  leaf: string
}

export interface TimelineItem<T extends NumberType> {
  timelineTimes: UintRange<T>[];
}


/**
 * ManagerTimeline represents the value of the manager over time
 *
 * @typedef {Object} ManagerTimeline
 * @property {string} manager - The manager of the collection.
 * @property {UintRange[]} timelineTimes - The times of the manager.
 */
export interface ManagerTimeline<T extends NumberType> extends TimelineItem<T> {
  manager: string
}

export function convertManagerTimeline<T extends NumberType, U extends NumberType>(managerTimeline: ManagerTimeline<T>, convertFunction: (item: T) => U): ManagerTimeline<U> {
  return deepCopy({
    ...managerTimeline,
    manager: managerTimeline.manager,
    timelineTimes: managerTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * CollectionMetadataTimeline represents the value of the collection metadata over time
 *
 * @typedef {Object} CollectionMetadataTimeline
 * @property {CollectionMetadata} collectionMetadata - The collection metadata.
 * @property {UintRange[]} timelineTimes - The times of the collection metadata.
 */
export interface CollectionMetadataTimeline<T extends NumberType> extends TimelineItem<T> {
  collectionMetadata: CollectionMetadata
  timelineTimes: UintRange<T>[]
}

export function convertCollectionMetadataTimeline<T extends NumberType, U extends NumberType>(collectionMetadataTimeline: CollectionMetadataTimeline<T>, convertFunction: (item: T) => U): CollectionMetadataTimeline<U> {
  return deepCopy({
    ...collectionMetadataTimeline,
    collectionMetadata: collectionMetadataTimeline.collectionMetadata,
    timelineTimes: collectionMetadataTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * BadgeMetadataTimeline represents the value of the badge metadata over time
 *
 * @typedef {Object} BadgeMetadataTimeline
 * @property {BadgeMetadata} badgeMetadata - The badge metadata.
 * @property {UintRange[]} timelineTimes - The times of the badge metadata.
 */
export interface BadgeMetadataTimeline<T extends NumberType> extends TimelineItem<T> {
  badgeMetadata: BadgeMetadata<T>[]
  timelineTimes: UintRange<T>[]
}
export function convertBadgeMetadataTimeline<T extends NumberType, U extends NumberType>(badgeMetadataTimeline: BadgeMetadataTimeline<T>, convertFunction: (item: T) => U): BadgeMetadataTimeline<U> {
  return deepCopy({
    ...badgeMetadataTimeline,
    badgeMetadata: badgeMetadataTimeline.badgeMetadata.map((b) => convertBadgeMetadata(b, convertFunction)),
    timelineTimes: badgeMetadataTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * OffChainBalancesMetadataTimeline represents the value of the off-chain balances metadata over time
 *
 * @typedef {Object} OffChainBalancesMetadataTimeline
 * @property {OffChainBalancesMetadata} offChainBalancesMetadata - The off-chain balances metadata.
 * @property {UintRange[]} timelineTimes - The times of the off-chain balances metadata.
 *
 */
export interface OffChainBalancesMetadataTimeline<T extends NumberType> extends TimelineItem<T> {
  offChainBalancesMetadata: OffChainBalancesMetadata
  timelineTimes: UintRange<T>[]
}
export function convertOffChainBalancesMetadataTimeline<T extends NumberType, U extends NumberType>(offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<T>, convertFunction: (item: T) => U): OffChainBalancesMetadataTimeline<U> {
  return deepCopy({
    ...offChainBalancesMetadataTimeline,
    // offChainBalancesMetadata: convertOffChainBalancesMetadata(offChainBalancesMetadataTimeline.offChainBalancesMetadata, convertFunction),
    timelineTimes: offChainBalancesMetadataTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}


/**
 * CustomDataTimeline represents the value of some arbitrary custom data over time
 *
 * @typedef {Object} CustomDataTimeline
 * @property {string} customData - Arbitrary custom data.
 * @property {UintRange[]} timelineTimes - The times of the custom data.
 */
export interface CustomDataTimeline<T extends NumberType> extends TimelineItem<T> {
  customData: string
  timelineTimes: UintRange<T>[]
}
export function convertCustomDataTimeline<T extends NumberType, U extends NumberType>(customDataTimeline: CustomDataTimeline<T>, convertFunction: (item: T) => U): CustomDataTimeline<U> {
  return deepCopy({
    ...customDataTimeline,
    customData: customDataTimeline.customData,
    timelineTimes: customDataTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * InheritedBalancesTimeline represents the value of the inherited balances over time. Only used for inherited balance collections.
 *
 * @typedef {Object} InheritedBalancesTimeline
 * @property {InheritedBalance[]} inheritedBalances - The inherited balances.
 *
 * @property {UintRange[]} timelineTimes - The times of the inherited balances.
 */
export interface InheritedBalancesTimeline<T extends NumberType> extends TimelineItem<T> {
  inheritedBalances: InheritedBalance<T>[]
  timelineTimes: UintRange<T>[]
}
export function convertInheritedBalancesTimeline<T extends NumberType, U extends NumberType>(inheritedBalancesTimeline: InheritedBalancesTimeline<T>, convertFunction: (item: T) => U): InheritedBalancesTimeline<U> {
  return deepCopy({
    ...inheritedBalancesTimeline,
    inheritedBalances: inheritedBalancesTimeline.inheritedBalances.map((b) => convertInheritedBalance(b, convertFunction)),
    timelineTimes: inheritedBalancesTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * StandardsTimeline represents the value of the standards over time
 *
 * @typedef {Object} StandardsTimeline
 * @property {string[]} standards - The standards.
 * @property {UintRange[]} timelineTimes - The times of the standards.
 *
 */
export interface StandardsTimeline<T extends NumberType> extends TimelineItem<T> {
  standards: string[]
  timelineTimes: UintRange<T>[]
}
export function convertStandardsTimeline<T extends NumberType, U extends NumberType>(standardsTimeline: StandardsTimeline<T>, convertFunction: (item: T) => U): StandardsTimeline<U> {
  return deepCopy({
    ...standardsTimeline,
    standards: standardsTimeline.standards,
    timelineTimes: standardsTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * ContractAddressTimeline represents the value of the contract address over time
 *
 * @typedef {Object} ContractAddressTimeline
 * @property {string} contractAddress - The contract address.
 * @property {UintRange[]} timelineTimes - The times of the contract address.
 */
export interface ContractAddressTimeline<T extends NumberType> extends TimelineItem<T> {
  contractAddress: string
  timelineTimes: UintRange<T>[]
}

export function convertContractAddressTimeline<T extends NumberType, U extends NumberType>(contractAddressTimeline: ContractAddressTimeline<T>, convertFunction: (item: T) => U): ContractAddressTimeline<U> {
  return deepCopy({
    ...contractAddressTimeline,
    contractAddress: contractAddressTimeline.contractAddress,
    timelineTimes: contractAddressTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * IsArchivedTimeline represents the value of isArchived over time
 *
 * @typedef {Object} IsArchivedTimeline
 * @property {boolean} isArchived - The isArchived.
 * @property {UintRange[]} timelineTimes - The times of the isArchived.
 */
export interface IsArchivedTimeline<T extends NumberType> extends TimelineItem<T> {
  isArchived: boolean
  timelineTimes: UintRange<T>[]
}

export function convertIsArchivedTimeline<T extends NumberType, U extends NumberType>(isArchivedTimeline: IsArchivedTimeline<T>, convertFunction: (item: T) => U): IsArchivedTimeline<U> {
  return deepCopy({
    ...isArchivedTimeline,
    isArchived: isArchivedTimeline.isArchived,
    timelineTimes: isArchivedTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

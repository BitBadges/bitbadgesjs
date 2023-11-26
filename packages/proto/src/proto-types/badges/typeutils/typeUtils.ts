import { NumberType } from "../string-numbers";
import { UserIncomingApproval, UserOutgoingApproval, convertUserIncomingApproval, convertUserOutgoingApproval } from "./approvals";
import { UserPermissions, convertUserPermissions } from "./permissions";

/**
 * Deep copy an object, preserving bigints.
 */
export function deepCopy<T>(obj: T): T {
  return deepCopyWithBigInts(obj);
}

function deepCopyWithBigInts<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    // Base case: return primitive values as-is
    return obj;
  }

  if (typeof obj === 'bigint') {
    return BigInt(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    // Create a deep copy of an array
    return obj.map((item) => deepCopyWithBigInts(item)) as unknown as T;
  }

  const copiedObj: Record<string, any> = {};

  // Deep copy each property of the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copiedObj[key] = deepCopyWithBigInts(obj[key]);
    }
  }

  return copiedObj as unknown as T;
}


/**
 * UserBalance represents the balance of a user and all their approved transfers / permissions.
 *
 * @typedef {Object} UserBalance
 * @property {Balance[]} balances - The balances of the user.
 * @property {UserOutgoingApproval[]} outgoingApprovals - The approved outgoing transfers of the user.
 * @property {UserIncomingApproval[]} incomingApprovals - The approved incoming transfers of the user.
 * @property {UserPermissions} userPermissions - The permissions of the user to update their incoming / outgoing approvals.
 * @property {boolean} autoApproveSelfInitiatedOutgoingTransfers - Whether or not to auto approve self-initiated outgoing transfers (i.e. from == initiator).
 * @property {boolean} autoApproveSelfInitiatedIncomingTransfers - Whether or not to auto approve self-initiated incoming transfers (i.e. to == initiator).
 */
export interface UserBalance<T extends NumberType> {
  balances: Balance<T>[];
  outgoingApprovals: UserOutgoingApproval<T>[];
  incomingApprovals: UserIncomingApproval<T>[];
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
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
 * BadgeMetadata is used to represent the metadata for a range of badge IDs.
 * The metadata can be hosted via a URI (via uri) or stored on-chain (via customData).
 *
 * We take first-match only for the badge IDs.
 * If a badge ID is in multiple BadgeMetadata, we take the first match in a linear search.
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

/**
 * MustOwnBadges are used to represent a challenge for an approved transfer where a user
 * must own min-max (amountRange) of the badges (badgeIds) from a specific collection (collectionId)
 * to be able to transfer the badges and be approved.
 *
 * @typedef {Object} MustOwnBadges
 * @property {NumberType} collectionId - The collection ID of the badges to own.
 * @property {UintRange} amountRange - The min/max acceptable amount of badges that must be owned (can be any values, including 0-0).
 * @property {UintRange[]} ownershipTimes - The range of the times that the badges must be owned.
 * @property {UintRange[]} badgeIds - The range of the badge IDs that must be owned.
 * @property {boolean} overrideWithCurrentTime - Whether or not to override the ownershipTimes with the current time.
 * @property {boolean} mustOwnAll - Whether or not the user must own all the sepcified badges. If false, we will accept if they own at least one for >= 1 millisecond.
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
 * Balance is used to represent a balance of a badge.
 * A user owns x(amount) of the badge IDs (badgeIds) from a specific collection (collectionId) for a range of times (ownershipTimes).
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
 * Some mapping IDs are reserved and auto generated by the blockchain.
 * Otherwise, the mapping can be created on-chain via MsgCreateAddressMappings.
 *
 * For the BitBadges indexer / API, we also allow users to create off-chain mappings hosted in a centralized manner.
 *
 * On-chain mappings are stored on the blockchain, are permanent, non editable, non deletable, and can be used for defining permissions and approvals.
 * Off-chain mappings are stored off-chain, are mutable, and can be edited / deleted at any time by the creator.
 *
 * @typedef {Object} AddressMapping
 * @property {string} mappingId - The ID of the address mapping.
 * @property {string[]} addresses - The addresses of the address mapping.
 * @property {boolean} includeAddresses - Whether or not to include ONLY the addresses or include all EXCEPT the addresses.
 * @property {string} uri - The URI where to fetch the address mapping metadata from.
 * @property {string} customData - Arbitrary custom data that can be stored on-chain.
 * @property {string} createdBy - The address that created the address mapping.
 */
export interface AddressMapping {
  mappingId: string;

  addresses: string[];
  includeAddresses: boolean;

  uri: string;
  customData: string;

  createdBy?: string;
}

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
    precalculateBalancesFromApproval: transfer.precalculateBalancesFromApproval ?? (populateOptionalFields ? {
      approvalId: '',
      approvalLevel: '',
      approverAddress: ''
    } : undefined),
    merkleProofs: transfer.merkleProofs ?? (populateOptionalFields ? [] : undefined),
    prioritizedApprovals: transfer.prioritizedApprovals ?? (populateOptionalFields ? [] : undefined),
    memo: transfer.memo ?? (populateOptionalFields ? '' : undefined),
    onlyCheckPrioritizedApprovals: transfer.onlyCheckPrioritizedApprovals ?? (populateOptionalFields ? false : undefined),
  })
}

/**
 * ApprovalIdentifierDetails is used to represent an exact approval.
 *
 * @typedef {Object} ApprovalIdentifierDetails
 * @property {string} approvalId - The approval ID of the approval.
 * @property {string} approvalLevel - The approval level of the approval "collection", "incoming", or "outgoing".
 * @property {string} approverAddress - The address of the approval to check. If approvalLevel is "collection", this is blank "".
 */
export interface ApprovalIdentifierDetails {
  approvalId: string
  approvalLevel: string
  approverAddress: string
}

/**
 * AmountTrackerIdDetails is used to represent an exact approval tracker ID.
 *
 * @typedef {Object} AmountTrackerIdDetails
 * @property {NumberType} collectionId - The collection ID for the approval.
 * @property {string} amountTrackerId - The approval ID of the approval.
 * @property {string} approvalLevel - The approval level of the approval "collection", "incoming", or "outgoing".
 * @property {string} approverAddress - The address of the approval to check.
 * @property {string} trackerType - The type of tracker to check "overall", "to", "from", or "initiatedBy".
 * @property {string} approvedAddress - The address to check for the approval.
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

/**
 * MerkleChallenge is used to represent a merkle challenge for an approval.
 *
 * @typedef {Object} MerkleChallenge
 * @property {string} root - The root of the merkle tree.
 * @property {NumberType} expectedProofLength - The expected proof length of the merkle proof.
 * @property {boolean} useCreatorAddressAsLeaf - Whether or not to override any leaf value and use the creator address as the leaf. Used for whitelist trees.
 * @property {NumberType} maxUsesPerLeaf - Whether or not to enforce max uses per leaf. Used to prevent replay attacks.
 * @property {string} uri - The URI where to fetch the merkle challenge metadata from.
 * @property {string} customData - Arbitrary custom data that can be stored on-chain.
 */
export interface MerkleChallenge<T extends NumberType> {
  root: string
  expectedProofLength: T;
  useCreatorAddressAsLeaf: boolean
  maxUsesPerLeaf: T
  uri: string
  customData: string
}

export function convertMerkleChallenge<T extends NumberType, U extends NumberType>(merkleChallenge: MerkleChallenge<T>, convertFunction: (item: T) => U): MerkleChallenge<U> {
  return deepCopy({
    ...merkleChallenge,
    maxUsesPerLeaf: convertFunction(merkleChallenge.maxUsesPerLeaf),
    expectedProofLength: convertFunction(merkleChallenge.expectedProofLength),
  })
}

/**
 * MerklePathItem is used to represent a merkle path item.
 *
 * @typedef {Object} MerklePathItem
 * @property {string} aunt - The aunt of the merkle path item.
 * @property {boolean} onRight - Indicates whether the aunt node is on the right side of the path.
 */
export interface MerklePathItem {
  aunt: string
  onRight: boolean
}

/**
 * MerkleProof is used to represent a merkle proof.
 * The merkle proof is used to prove that a leaf is in a merkle tree.
 *
 * @typedef {Object} MerkleProof
 * @property {MerklePathItem[]} aunts - The aunts of the merkle proof.
 * @property {string} leaf - The leaf of the merkle proof. If useCreatorAddressAsLeaf is true, this will be populated with the creator Cosmos address.
 */
export interface MerkleProof {
  aunts: MerklePathItem[]
  leaf: string
}

/**
 * TimelineItem is a generic type to represent timelines which have values corresponding to specific times.
 *
 * @typedef {Object} TimelineItem
 * @property {UintRange[]} timelineTimes - The times of the timeline item. Times in a timeline cannot overlap.
 */
export interface TimelineItem<T extends NumberType> {
  timelineTimes: UintRange<T>[];
}


/**
 * ManagerTimeline represents the value of the manager over time
 *
 * @typedef {Object} ManagerTimeline
 * @property {string} manager - The manager of the collection.
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
 */
export interface CollectionMetadataTimeline<T extends NumberType> extends TimelineItem<T> {
  collectionMetadata: CollectionMetadata
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
 */
export interface BadgeMetadataTimeline<T extends NumberType> extends TimelineItem<T> {
  badgeMetadata: BadgeMetadata<T>[]
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
 */
export interface OffChainBalancesMetadataTimeline<T extends NumberType> extends TimelineItem<T> {
  offChainBalancesMetadata: OffChainBalancesMetadata
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
 */
export interface CustomDataTimeline<T extends NumberType> extends TimelineItem<T> {
  customData: string
}
export function convertCustomDataTimeline<T extends NumberType, U extends NumberType>(customDataTimeline: CustomDataTimeline<T>, convertFunction: (item: T) => U): CustomDataTimeline<U> {
  return deepCopy({
    ...customDataTimeline,
    customData: customDataTimeline.customData,
    timelineTimes: customDataTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * StandardsTimeline represents the value of the standards over time
 *
 * @typedef {Object} StandardsTimeline
 * @property {string[]} standards - The standards.
 *
 */
export interface StandardsTimeline<T extends NumberType> extends TimelineItem<T> {
  standards: string[]
}
export function convertStandardsTimeline<T extends NumberType, U extends NumberType>(standardsTimeline: StandardsTimeline<T>, convertFunction: (item: T) => U): StandardsTimeline<U> {
  return deepCopy({
    ...standardsTimeline,
    standards: standardsTimeline.standards,
    timelineTimes: standardsTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * IsArchivedTimeline represents the value of isArchived over time
 *
 * @typedef {Object} IsArchivedTimeline
 * @property {boolean} isArchived - The isArchived.
 */
export interface IsArchivedTimeline<T extends NumberType> extends TimelineItem<T> {
  isArchived: boolean
}

export function convertIsArchivedTimeline<T extends NumberType, U extends NumberType>(isArchivedTimeline: IsArchivedTimeline<T>, convertFunction: (item: T) => U): IsArchivedTimeline<U> {
  return deepCopy({
    ...isArchivedTimeline,
    isArchived: isArchivedTimeline.isArchived,
    timelineTimes: isArchivedTimeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

export const VALUE_OPTIONS_TYPES = [
  { name: 'invertDefault', type: 'bool' },
  { name: 'allValues', type: 'bool' },
  { name: 'noValues', type: 'bool' },
];

export const UINT_RANGE_TYPES = [
  { name: 'start', type: 'string' },
  { name: 'end', type: 'string' },
];

export const BALANCE_TYPES = [
  { name: 'amount', type: 'string' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
];

export const PROOF_ITEM_TYPES = [
  { name: 'aunt', type: 'string' },
  { name: 'onRight', type: 'bool' },
];

export const PROOF_TYPES = [
  { name: 'aunts', type: 'MerklePathItem[]' },
  { name: 'leaf', type: 'string' },
];

export const USER_APPROVED_OUTGOING_TRANSFER_TIMELINE_TYPES = [
  { name: 'approvedOutgoingTransfers', type: 'UserApprovedOutgoingTransfer[]' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const USER_APPROVED_INCOMING_TRANSFER_TIMELINE_TYPES = [
  { name: 'approvedIncomingTransfers', type: 'UserApprovedIncomingTransfer[]' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const USER_PERMISSIONS_TYPES = [
  { name: 'canUpdateApprovedOutgoingTransfers', type: 'UserApprovedOutgoingTransferPermission[]' },
  { name: 'canUpdateApprovedIncomingTransfers', type: 'UserApprovedIncomingTransferPermission[]' },
];

export const USER_APPROVED_OUTGOING_TRANSFER_TYPES = [
  { name: 'toMappingId', type: 'string' },
  { name: 'initiatedByMappingId', type: 'string' },
  { name: 'transferTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'allowedCombinations', type: 'IsUserOutgoingTransferAllowed[]' },
  { name: 'approvalDetails', type: 'OutgoingApprovalDetails[]' },
];

export const USER_APPROVED_INCOMING_TRANSFER_TYPES = [
  { name: 'fromMappingId', type: 'string' },
  { name: 'initiatedByMappingId', type: 'string' },
  { name: 'transferTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'allowedCombinations', type: 'IsUserIncomingTransferAllowed[]' },
  { name: 'approvalDetails', type: 'IncomingApprovalDetails[]' },
];

export const USER_APPROVED_OUTGOING_TRANSFER_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'UserApprovedOutgoingTransferDefaultValues' },
  { name: 'combinations', type: 'UserApprovedOutgoingTransferCombination[]' },
];

export const USER_APPROVED_INCOMING_TRANSFER_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'UserApprovedIncomingTransferDefaultValues' },
  { name: 'combinations', type: 'UserApprovedIncomingTransferCombination[]' },
];

export const USER_APPROVED_OUTGOING_TRANSFER_DEFAULT_VALUES_TYPES = [
  { name: 'timelineTimes', type: 'UintRange[]' },
  { name: 'toMappingId', type: 'string' },
  { name: 'initiatedByMappingId', type: 'string' },
  { name: 'transferTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const USER_APPROVED_OUTGOING_TRANSFER_COMBINATION_TYPES = [
  { name: 'timelineTimesOptions', type: 'ValueOptions' },
  { name: 'toMappingOptions', type: 'ValueOptions' },
  { name: 'initiatedByMappingOptions', type: 'ValueOptions' },
  { name: 'transferTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];

export const USER_APPROVED_INCOMING_TRANSFER_DEFAULT_VALUES_TYPES = [
  { name: 'timelineTimes', type: 'UintRange[]' },
  { name: 'fromMappingId', type: 'string' },
  { name: 'initiatedByMappingId', type: 'string' },
  { name: 'transferTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const USER_APPROVED_INCOMING_TRANSFER_COMBINATION_TYPES = [
  { name: 'timelineTimesOptions', type: 'ValueOptions' },
  { name: 'fromMappingOptions', type: 'ValueOptions' },
  { name: 'initiatedByMappingOptions', type: 'ValueOptions' },
  { name: 'transferTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];


export const IS_USER_OUTGOING_TRANSFER_ALLOWED_TYPES = [
  { name: 'toMappingOptions', type: 'ValueOptions' },
  { name: 'initiatedByMappingOptions', type: 'ValueOptions' },
  { name: 'transferTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'isApproved', type: 'bool' },
];

export const OUTGOING_APPROVAL_DETAILS_TYPES = [
  { name: 'approvalTrackerId', type: 'string' },
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
  { name: 'mustOwnBadges', type: 'MustOwnBadges[]' },
  { name: 'merkleChallenges', type: 'MerkleChallenge[]' },
  { name: 'predeterminedBalances', type: 'PredeterminedBalances' },
  { name: 'approvalAmounts', type: 'ApprovalAmounts' },
  { name: 'maxNumTransfers', type: 'MaxNumTransfers' },
  { name: 'requireToEqualsInitiatedBy', type: 'bool' },
  { name: 'requireToDoesNotEqualInitiatedBy', type: 'bool' },
];

export const IS_USER_INCOMING_TRANSFER_ALLOWED_TYPES = [
  { name: 'fromMappingOptions', type: 'ValueOptions' },
  { name: 'initiatedByMappingOptions', type: 'ValueOptions' },
  { name: 'transferTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'isApproved', type: 'bool' },
];

export const INCOMING_APPROVAL_DETAILS_TYPES = [
  { name: 'approvalTrackerId', type: 'string' },
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
  { name: 'mustOwnBadges', type: 'MustOwnBadges[]' },
  { name: 'merkleChallenges', type: 'MerkleChallenge[]' },
  { name: 'predeterminedBalances', type: 'PredeterminedBalances' },
  { name: 'approvalAmounts', type: 'ApprovalAmounts' },
  { name: 'maxNumTransfers', type: 'MaxNumTransfers' },
  { name: 'requireFromEqualsInitiatedBy', type: 'bool' },
  { name: 'requireFromDoesNotEqualInitiatedBy', type: 'bool' },
];

export const MUST_OWN_BADGES_TYPES = [
  { name: 'collectionId', type: 'string' },
  { name: 'amountRange', type: 'UintRange' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'overrideWithCurrentTime', type: 'bool' },
  { name: 'mustOwnAll', type: 'bool' },
];


export const MERKLE_CHALLENGE_TYPES = [
  { name: 'root', type: 'string' },
  { name: 'expectedProofLength', type: 'string' },
  { name: 'useCreatorAddressAsLeaf', type: 'bool' },
  { name: 'maxOneUsePerLeaf', type: 'bool' },
  { name: 'useLeafIndexForTransferOrder', type: 'bool' },
  { name: 'challengeId', type: 'string' },
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
];

export const PREDETERMINED_BALANCES_TYPES = [
  { name: 'manualBalances', type: 'ManualBalances[]' },
  { name: 'incrementedBalances', type: 'IncrementedBalances' },
  { name: 'orderCalculationMethod', type: 'PredeterminedOrderCalculationMethod' },
  { name: "precalculationId", type: "string" },
];

export const APPROVAL_AMOUNTS_TYPES = [
  { name: 'overallApprovalAmount', type: 'string' },
  { name: 'perToAddressApprovalAmount', type: 'string' },
  { name: 'perFromAddressApprovalAmount', type: 'string' },
  { name: 'perInitiatedByAddressApprovalAmount', type: 'string' },
];

export const MAX_NUM_TRANSFERS_TYPES = [
  { name: 'overallMaxNumTransfers', type: 'string' },
  { name: 'perToAddressMaxNumTransfers', type: 'string' },
  { name: 'perFromAddressMaxNumTransfers', type: 'string' },
  { name: 'perInitiatedByAddressMaxNumTransfers', type: 'string' },
];

export const MANUAL_BALANCES_TYPES = [
  { name: 'balances', type: 'Balance[]' },
];

export const INCREMENTED_BALANCES_TYPES = [
  { name: 'startBalances', type: 'Balance[]' },
  { name: 'incrementBadgeIdsBy', type: 'string' },
  { name: 'incrementOwnershipTimesBy', type: 'string' },
];

export const PREDETERMINED_ORDER_CALCULATION_METHOD_TYPES = [
  { name: 'useOverallNumTransfers', type: 'bool' },
  { name: 'usePerToAddressNumTransfers', type: 'bool' },
  { name: 'usePerFromAddressNumTransfers', type: 'bool' },
  { name: 'usePerInitiatedByAddressNumTransfers', type: 'bool' },
  { name: 'useMerkleChallengeLeafIndex', type: 'bool' },
];

export const COLLECTIONS_PERMISSIONS_TYPES = [
  { name: 'canDeleteCollection', type: 'ActionPermission[]' },
  { name: 'canArchiveCollection', type: 'TimedUpdatePermission[]' },
  { name: 'canUpdateContractAddress', type: 'TimedUpdatePermission[]' },
  { name: 'canUpdateOffChainBalancesMetadata', type: 'TimedUpdatePermission[]' },
  { name: 'canUpdateStandards', type: 'TimedUpdatePermission[]' },
  { name: 'canUpdateCustomData', type: 'TimedUpdatePermission[]' },
  { name: 'canUpdateManager', type: 'TimedUpdatePermission[]' },
  { name: 'canUpdateCollectionMetadata', type: 'TimedUpdatePermission[]' },
  { name: 'canCreateMoreBadges', type: 'BalancesActionPermission[]' },
  { name: 'canUpdateBadgeMetadata', type: 'TimedUpdateWithBadgeIdsPermission[]' },
  { name: 'canUpdateCollectionApprovedTransfers', type: 'CollectionApprovedTransferPermission[]' },
];

export const MANAGER_TIMELINE_TYPES = [
  { name: 'manager', type: 'string' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const COLLECTION_METADATA_TIMELINE_TYPES = [
  { name: 'collectionMetadata', type: 'CollectionMetadata' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const BADGE_METADATA_TIMELINE_TYPES = [
  { name: 'badgeMetadata', type: 'BadgeMetadata[]' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const OFF_CHAIN_BALANCES_METADATA_TIMELINE_TYPES = [
  { name: 'offChainBalancesMetadata', type: 'OffChainBalancesMetadata' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const CUSTOM_DATA_TIMELINE_TYPES = [
  { name: 'customData', type: 'string' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

// export const INHERITED_BALANCES_TIMELINE_TYPES = [
//   { name: 'inheritedBalances', type: 'InheritedBalance[]' },
//   { name: 'timelineTimes', type: 'UintRange[]' },
// ];

export const COLLECTION_APPROVED_TRANSFER_TIMELINE_TYPES = [
  { name: 'collectionApprovedTransfers', type: 'CollectionApprovedTransfer[]' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const STANDARDS_TIMELINE_TYPES = [
  { name: 'standards', type: 'string[]' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const CONTRACT_ADDRESS_TIMELINE_TYPES = [
  { name: 'contractAddress', type: 'string' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const IS_ARCHIVED_TIMELINE_TYPES = [
  { name: 'isArchived', type: 'bool' },
  { name: 'timelineTimes', type: 'UintRange[]' },
];

export const COLLECTION_APPROVED_TRANSFER_TYPES = [
  { name: 'fromMappingId', type: 'string' },
  { name: 'toMappingId', type: 'string' },
  { name: 'initiatedByMappingId', type: 'string' },
  { name: 'transferTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'allowedCombinations', type: 'IsCollectionTransferAllowed[]' },
  { name: 'approvalDetails', type: 'ApprovalDetails[]' },
];

// export const INHERITED_BALANCE_TYPES = [
//   { name: 'collectionId', type: 'string' },
//   { name: 'parentCollectionId', type: 'string' },
//   { name: 'parentBadgeIds', type: 'UintRange[]' },
// ];

export const BADGE_METADATA_TYPES = [
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
  { name: 'badgeIds', type: 'UintRange[]' },
];

export const COLLECTION_METADATA_TYPES = [
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
];

export const OFF_CHAIN_BALANCES_METADATA_TYPES = [
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
];

export const IS_COLLECTION_TRANSFER_ALLOWED_TYPES = [
  { name: 'fromMappingOptions', type: 'ValueOptions' },
  { name: 'toMappingOptions', type: 'ValueOptions' },
  { name: 'initiatedByMappingOptions', type: 'ValueOptions' },
  { name: 'transferTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'isApproved', type: 'bool' },
];

export const ACTION_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'ActionDefaultValues' },
  { name: 'combinations', type: 'ActionCombination[]' },
];

export const TIMED_UPDATE_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'TimedUpdateDefaultValues' },
  { name: 'combinations', type: 'TimedUpdateCombination[]' },
];

export const BALANCES_ACTION_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'BalancesActionDefaultValues' },
  { name: 'combinations', type: 'BalancesActionCombination[]' },
];

export const TIMED_UPDATE_WITH_BADGE_IDS_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'TimedUpdateWithBadgeIdsDefaultValues' },
  { name: 'combinations', type: 'TimedUpdateWithBadgeIdsCombination[]' },
];

export const COLLECTION_APPROVED_TRANSFER_PERMISSION_TYPES = [
  { name: 'defaultValues', type: 'CollectionApprovedTransferDefaultValues' },
  { name: 'combinations', type: 'CollectionApprovedTransferCombination[]' },
];


export const COLLECTION_APPROVED_TRANSFER_COMBINATION_TYPES = [
  { name: 'timelineTimesOptions', type: 'ValueOptions' },
  { name: 'fromMappingOptions', type: 'ValueOptions' },
  { name: 'toMappingOptions', type: 'ValueOptions' },
  { name: 'initiatedByMappingOptions', type: 'ValueOptions' },
  { name: 'transferTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];

export const COLLECTION_APPROVED_TRANSFER_DEFAULT_VALUES_TYPES = [
  { name: 'timelineTimes', type: 'UintRange[]' },
  { name: 'fromMappingId', type: 'string' },
  { name: 'toMappingId', type: 'string' },
  { name: 'initiatedByMappingId', type: 'string' },
  { name: 'transferTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const BALANCES_ACTION_COMBINATION_TYPES = [
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'ownershipTimesOptions', type: 'ValueOptions' },
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];

export const BALANCES_ACTION_DEFAULT_VALUES_TYPES = [
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'ownershipTimes', type: 'UintRange[]' },
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const ACTION_COMBINATION_TYPES = [
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];

export const ACTION_DEFAULT_VALUES_TYPES = [
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const TIMED_UPDATE_COMBINATION_TYPES = [
  { name: 'timelineTimesOptions', type: 'ValueOptions' },
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];

export const TIMED_UPDATE_DEFAULT_VALUES_TYPES = [
  { name: 'timelineTimes', type: 'UintRange[]' },
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const TIMED_UPDATE_WITH_BADGE_IDS_COMBINATION_TYPES = [
  { name: 'timelineTimesOptions', type: 'ValueOptions' },
  { name: 'badgeIdsOptions', type: 'ValueOptions' },
  { name: 'permittedTimesOptions', type: 'ValueOptions' },
  { name: 'forbiddenTimesOptions', type: 'ValueOptions' },
];

export const TIMED_UPDATE_WITH_BADGE_IDS_DEFAULT_VALUES_TYPES = [
  { name: 'timelineTimes', type: 'UintRange[]' },
  { name: 'badgeIds', type: 'UintRange[]' },
  { name: 'permittedTimes', type: 'UintRange[]' },
  { name: 'forbiddenTimes', type: 'UintRange[]' },
];

export const APPROVAL_DETAILS_TYPES = [
  { name: 'approvalTrackerId', type: 'string' },
  { name: 'uri', type: 'string' },
  { name: 'customData', type: 'string' },
  { name: 'mustOwnBadges', type: 'MustOwnBadges[]' },
  { name: 'merkleChallenges', type: 'MerkleChallenge[]' },
  { name: 'predeterminedBalances', type: 'PredeterminedBalances' },
  { name: 'approvalAmounts', type: 'ApprovalAmounts' },
  { name: 'maxNumTransfers', type: 'MaxNumTransfers' },
  { name: 'requireToEqualsInitiatedBy', type: 'bool' },
  { name: 'requireToDoesNotEqualInitiatedBy', type: 'bool' },
  { name: 'requireFromEqualsInitiatedBy', type: 'bool' },
  { name: 'requireFromDoesNotEqualInitiatedBy', type: 'bool' },
  { name: 'overridesFromApprovedOutgoingTransfers', type: 'bool' },
  { name: 'overridesToApprovedIncomingTransfers', type: 'bool' },
];

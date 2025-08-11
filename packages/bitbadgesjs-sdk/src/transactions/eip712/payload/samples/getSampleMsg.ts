/**
 * This file is used to generate sample Msgs for type generation.
 *
 * This is needed because the type generation doesn't natively support optional types.
 * Our solution is to always generate Msgs with all optional types populated with a default empty value (e.g. "", [], 0, etc.)
 * For primitive types and primitive type arrays, we don't need to add bc protobuf automatically adds a default value, but for objects we do.
 * For all Number type values (cosmos.Uint), we use strings and bigints (not numbers), so we need to add a default value of "0"
 * because the chain parses and sets numbers as a "0" string.
 *
 * emitDefaultValues option must be set to handle the primitive types.
 *
 * For Msgs without optional fields, we don't need to do anything.
 */
import { deepCopyPrimitives } from '@/common/base.js';
import { CosmosCoin } from '@/core/coin.js';
import {
  ActionPermission,
  AddressList,
  ApprovalAmounts,
  ApprovalCriteria,
  ApprovalIdentifierDetails,
  AutoDeletionOptions,
  TokenIdsActionPermission,
  TokenMetadata,
  TokenMetadataTimeline,
  Balance,
  CoinTransfer,
  CollectionApproval,
  CollectionApprovalPermission,
  CollectionInvariants,
  CollectionMetadata,
  CollectionMetadataTimeline,
  CollectionPermissions,
  CosmosCoinWrapperPathAddObject,
  CustomDataTimeline,
  IncomingApprovalCriteria,
  IncrementedBalances,
  IsArchivedTimeline,
  ManagerTimeline,
  ManualBalances,
  MaxNumTransfers,
  MerkleChallenge,
  MerklePathItem,
  MerkleProof,
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgDeleteCollection,
  MsgTransferTokens,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals,
  MustOwnTokens,
  OffChainBalancesMetadata,
  OffChainBalancesMetadataTimeline,
  OutgoingApprovalCriteria,
  PrecalculationOptions,
  PredeterminedBalances,
  PredeterminedOrderCalculationMethod,
  RecurringOwnershipTimes,
  ResetTimeIntervals,
  StandardsTimeline,
  TimedUpdatePermission,
  TimedUpdateWithTokenIdsPermission,
  Transfer,
  UintRange,
  UserBalanceStore,
  UserIncomingApproval,
  UserIncomingApprovalPermission,
  UserOutgoingApproval,
  UserOutgoingApprovalPermission,
  UserPermissions,
  UserRoyalties,
  DenomUnit,
  DynamicStoreChallenge,
  ETHSignatureChallenge,
  ETHSignatureProof,
  UserLevelRestrictions
} from '@/proto/badges/index.js';
import { MapPermissions, MapUpdateCriteria, MsgCreateMap, MsgDeleteMap, MsgSetValue, MsgUpdateMap, ValueOptions } from '@/proto/maps/tx_pb.js';
import { MsgCreateProtocol, MsgDeleteProtocol, MsgSetCollectionForProtocol, MsgUpdateProtocol } from '@/proto/protocols/tx_pb.js';
import {
  MsgCreateDynamicStore,
  MsgDeleteDynamicStore,
  MsgDeleteIncomingApproval,
  MsgDeleteOutgoingApproval,
  MsgDecrementStoreValue,
  MsgIncrementStoreValue,
  MsgPurgeApprovals,
  MsgSetTokenMetadata,
  MsgSetCollectionApprovals,
  MsgSetCollectionMetadata,
  MsgSetCustomData,
  MsgSetDynamicStoreValue,
  MsgSetIncomingApproval,
  MsgSetIsArchived,
  MsgSetManager,
  MsgSetOutgoingApproval,
  MsgSetStandards,
  MsgSetValidTokenIds,
  MsgUpdateDynamicStore
} from '@/proto/badges/tx_pb.js';

const approvalCriteria = new OutgoingApprovalCriteria({
  coinTransfers: [
    new CoinTransfer({
      to: '',
      coins: [
        {
          denom: '',
          amount: '0'
        }
      ],
      overrideFromWithApproverAddress: false,
      overrideToWithInitiator: false
    })
  ],

  merkleChallenges: [
    new MerkleChallenge({
      expectedProofLength: '0',
      maxUsesPerLeaf: '0'
    })
  ],
  mustOwnTokens: [
    new MustOwnTokens({
      tokenIds: [new UintRange()],
      amountRange: new UintRange(),
      ownershipTimes: [new UintRange()]
    })
  ],
  ethSignatureChallenges: [
    new ETHSignatureChallenge({
      signer: '',
      challengeTrackerId: '',
      uri: '',
      customData: ''
    })
  ],
  predeterminedBalances: new PredeterminedBalances({
    manualBalances: [
      new ManualBalances({
        balances: [
          new Balance({
            ownershipTimes: [new UintRange()],
            tokenIds: [new UintRange()]
          })
        ]
      })
    ],
    orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
    incrementedBalances: new IncrementedBalances({
      startBalances: [
        new Balance({
          ownershipTimes: [new UintRange()],
          tokenIds: [new UintRange()]
        })
      ],
      incrementOwnershipTimesBy: '0',
      incrementTokenIdsBy: '0',
      durationFromTimestamp: '0',
      recurringOwnershipTimes: new RecurringOwnershipTimes({
        startTime: '0',
        intervalLength: '0',
        chargePeriodLength: '0'
      })
    })
  }),
  approvalAmounts: new ApprovalAmounts({
    overallApprovalAmount: '0',
    perFromAddressApprovalAmount: '0',
    perInitiatedByAddressApprovalAmount: '0',
    perToAddressApprovalAmount: '0',
    resetTimeIntervals: new ResetTimeIntervals({
      startTime: '0',
      intervalLength: '0'
    })
  }),
  maxNumTransfers: new MaxNumTransfers({
    overallMaxNumTransfers: '0',
    perFromAddressMaxNumTransfers: '0',
    perInitiatedByAddressMaxNumTransfers: '0',
    perToAddressMaxNumTransfers: '0',
    resetTimeIntervals: new ResetTimeIntervals({
      startTime: '0',
      intervalLength: '0'
    })
  }),
  autoDeletionOptions: new AutoDeletionOptions({
    afterOneUse: false,
    afterOverallMaxNumTransfers: false,
    allowCounterpartyPurge: false,
    allowPurgeIfExpired: false
  }),
  dynamicStoreChallenges: [
    new DynamicStoreChallenge({
      storeId: '0'
    })
  ]
}).toJson({ emitDefaultValues: true }) as object;

const approvalCriteriaForPopulatingUndefined = new ApprovalCriteria({
  predeterminedBalances: new PredeterminedBalances({
    orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
    incrementedBalances: new IncrementedBalances({
      startBalances: [],
      incrementTokenIdsBy: '0',
      incrementOwnershipTimesBy: '0',
      durationFromTimestamp: '0',
      recurringOwnershipTimes: new RecurringOwnershipTimes({
        startTime: '0',
        intervalLength: '0',
        chargePeriodLength: '0'
      })
    })
  }),
  approvalAmounts: new ApprovalAmounts({
    overallApprovalAmount: '0',
    perFromAddressApprovalAmount: '0',
    perInitiatedByAddressApprovalAmount: '0',
    perToAddressApprovalAmount: '0',
    resetTimeIntervals: new ResetTimeIntervals({
      startTime: '0',
      intervalLength: '0'
    })
  }),
  maxNumTransfers: new MaxNumTransfers({
    overallMaxNumTransfers: '0',
    perFromAddressMaxNumTransfers: '0',
    perInitiatedByAddressMaxNumTransfers: '0',
    perToAddressMaxNumTransfers: '0',
    resetTimeIntervals: new ResetTimeIntervals({
      startTime: '0',
      intervalLength: '0'
    })
  }),
  autoDeletionOptions: new AutoDeletionOptions({
    afterOneUse: false,
    afterOverallMaxNumTransfers: false,
    allowCounterpartyPurge: false,
    allowPurgeIfExpired: false
  })
}).toJson({ emitDefaultValues: true }) as object;

function populateMerkleChallenges(merkleChallenges?: MerkleChallenge[]) {
  return (
    merkleChallenges?.map((merkleChallenge) => {
      merkleChallenge.expectedProofLength = merkleChallenge.expectedProofLength || '0';
      merkleChallenge.maxUsesPerLeaf = merkleChallenge.maxUsesPerLeaf || '0';
      return merkleChallenge;
    }) || []
  );
}

function populateMustOwnTokens(mustOwnTokens?: MustOwnTokens[]) {
  return (
    mustOwnTokens?.map((mustOwnToken) => {
      mustOwnToken.tokenIds = mustOwnToken.tokenIds || [new UintRange()];
      mustOwnToken.amountRange = mustOwnToken.amountRange || new UintRange();
      mustOwnToken.ownershipTimes = mustOwnToken.ownershipTimes || [new UintRange()];
      return mustOwnToken;
    }) || []
  );
}

function populatePredeterminedBalances(predeterminedBalances?: PredeterminedBalances) {
  if (!predeterminedBalances) {
    return new PredeterminedBalances({
      orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
      incrementedBalances: new IncrementedBalances({
        startBalances: [],
        incrementTokenIdsBy: '0',
        incrementOwnershipTimesBy: '0',
        durationFromTimestamp: '0',
        allowOverrideTimestamp: false,
        recurringOwnershipTimes: new RecurringOwnershipTimes({
          startTime: '0',
          intervalLength: '0',
          chargePeriodLength: '0'
        })
      })
    });
  }

  if (!predeterminedBalances.orderCalculationMethod) {
    predeterminedBalances.orderCalculationMethod = new PredeterminedOrderCalculationMethod();
  }

  if (!predeterminedBalances.incrementedBalances) {
    predeterminedBalances.incrementedBalances = new IncrementedBalances({
      startBalances: [],
      incrementTokenIdsBy: '0',
      incrementOwnershipTimesBy: '0',
      durationFromTimestamp: '0',
      allowOverrideTimestamp: false,
      recurringOwnershipTimes: new RecurringOwnershipTimes({
        startTime: '0',
        intervalLength: '0',
        chargePeriodLength: '0'
      })
    });
  }

  if (!predeterminedBalances.incrementedBalances.recurringOwnershipTimes) {
    predeterminedBalances.incrementedBalances.recurringOwnershipTimes = new RecurringOwnershipTimes({
      startTime: '0',
      intervalLength: '0',
      chargePeriodLength: '0'
    });
  }

  return predeterminedBalances;
}

function populateApprovalAmounts(approvalAmounts?: ApprovalAmounts) {
  if (!approvalAmounts) {
    return new ApprovalAmounts({
      overallApprovalAmount: '0',
      perFromAddressApprovalAmount: '0',
      perInitiatedByAddressApprovalAmount: '0',
      perToAddressApprovalAmount: '0',
      amountTrackerId: '',
      resetTimeIntervals: new ResetTimeIntervals({
        startTime: '0',
        intervalLength: '0'
      })
    });
  }

  if (!approvalAmounts.resetTimeIntervals) {
    approvalAmounts.resetTimeIntervals = new ResetTimeIntervals({
      startTime: '0',
      intervalLength: '0'
    });
  }

  return approvalAmounts;
}

function populateUserLevelRestrictions(userLevelRestrictions?: UserLevelRestrictions) {
  if (!userLevelRestrictions) {
    return new UserLevelRestrictions({
      allowAllDenoms: false,
      allowedDenoms: []
    });
  }

  return userLevelRestrictions;
}

function populateUserRoyalties(userRoyalties?: UserRoyalties) {
  if (!userRoyalties) {
    return new UserRoyalties({
      percentage: '0',
      payoutAddress: ''
    });
  }

  if (!userRoyalties.percentage) {
    userRoyalties.percentage = '0';
  }

  if (!userRoyalties.payoutAddress) {
    userRoyalties.payoutAddress = '';
  }

  return userRoyalties;
}

function populateAutoDeletionOptions(autoDeletionOptions?: AutoDeletionOptions) {
  if (!autoDeletionOptions) {
    return new AutoDeletionOptions({
      afterOneUse: false,
      afterOverallMaxNumTransfers: false,
      allowCounterpartyPurge: false,
      allowPurgeIfExpired: false
    });
  }

  return autoDeletionOptions;
}

function populateMaxNumTransfers(maxNumTransfers?: MaxNumTransfers) {
  if (!maxNumTransfers) {
    return new MaxNumTransfers({
      overallMaxNumTransfers: '0',
      perFromAddressMaxNumTransfers: '0',
      perInitiatedByAddressMaxNumTransfers: '0',
      perToAddressMaxNumTransfers: '0',
      resetTimeIntervals: new ResetTimeIntervals({
        startTime: '0',
        intervalLength: '0'
      })
    });
  }

  if (!maxNumTransfers.resetTimeIntervals) {
    maxNumTransfers.resetTimeIntervals = new ResetTimeIntervals({
      startTime: '0',
      intervalLength: '0'
    });
  }

  return maxNumTransfers;
}

function populateDynamicStoreChallenges(dynamicStoreChallenges?: DynamicStoreChallenge[]) {
  return dynamicStoreChallenges || [];
}

function populateETHSignatureChallenges(ethSignatureChallenges?: ETHSignatureChallenge[]) {
  return ethSignatureChallenges || [];
}

export function populateUndefinedForMsgTransferTokens(msg: MsgTransferTokens) {
  for (const transfer of msg.transfers) {
    if (!transfer.precalculateBalancesFromApproval) {
      transfer.precalculateBalancesFromApproval = new ApprovalIdentifierDetails({
        version: '0'
      });
    }
    if (!transfer.ethSignatureProofs) {
      transfer.ethSignatureProofs = [
        new ETHSignatureProof({
          nonce: '',
          signature: ''
        })
      ];
    }
  }

  return msg;
}

export function populateUndefinedForMsgUpdateUserApprovals(msg: MsgUpdateUserApprovals) {
  for (const approval of msg.outgoingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(approval.approvalCriteria.merkleChallenges);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
    approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(approval.approvalCriteria.autoDeletionOptions);
    approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(approval.approvalCriteria.mustOwnTokens);
    approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(approval.approvalCriteria.dynamicStoreChallenges);
    approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(approval.approvalCriteria.ethSignatureChallenges);
  }
  for (const approval of msg.incomingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(approval.approvalCriteria.merkleChallenges);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
    approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(approval.approvalCriteria.autoDeletionOptions);
    approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(approval.approvalCriteria.mustOwnTokens);
    approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(approval.approvalCriteria.dynamicStoreChallenges);
    approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(approval.approvalCriteria.ethSignatureChallenges);
  }
  return msg;
}

export function populateUndefinedForMsgUpdateCollection(msg: MsgUpdateCollection) {
  const universalMsg = populateUndefinedForMsgUniversalUpdateCollection(
    new MsgUniversalUpdateCollection({
      ...deepCopyPrimitives(msg)
    })
  );

  return new MsgUpdateCollection({
    ...deepCopyPrimitives(msg),
    ...universalMsg
  });
}

export function populateUndefinedForMsgCreateCollection(msg: MsgCreateCollection) {
  const universalMsg = populateUndefinedForMsgUniversalUpdateCollection(
    new MsgUniversalUpdateCollection({
      ...deepCopyPrimitives(msg)
    })
  );

  return new MsgCreateCollection({
    ...deepCopyPrimitives(msg),
    ...universalMsg
  });
}

export function populateUndefinedForMsgCreateAddressLists(msg: MsgCreateAddressLists) {
  return new MsgCreateAddressLists({
    ...deepCopyPrimitives(msg)
  });
}

export function populateUndefinedForMsgDeleteCollection(msg: MsgDeleteCollection) {
  return new MsgDeleteCollection({
    ...deepCopyPrimitives(msg)
  });
}

export function populateUndefinedForMsgCreateDynamicStore(msg: MsgCreateDynamicStore) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateDynamicStore(msg: MsgUpdateDynamicStore) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgDeleteDynamicStore(msg: MsgDeleteDynamicStore) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgSetDynamicStoreValue(msg: MsgSetDynamicStoreValue) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgIncrementStoreValue(msg: MsgIncrementStoreValue) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgDecrementStoreValue(msg: MsgDecrementStoreValue) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgUniversalUpdateCollection(msg: MsgUniversalUpdateCollection) {
  if (!msg.defaultBalances) {
    msg.defaultBalances = new UserBalanceStore();
  }

  if (!msg.defaultBalances.userPermissions) {
    msg.defaultBalances.userPermissions = new UserPermissions();
  }

  if (!msg.collectionPermissions) {
    msg.collectionPermissions = new CollectionPermissions();
  }

  if (!msg.defaultBalances.balances) {
    msg.defaultBalances.balances = [
      new Balance({
        ownershipTimes: [new UintRange()],
        tokenIds: [new UintRange()]
      })
    ];
  }

  for (const approval of msg.defaultBalances.outgoingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
      approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(approval.approvalCriteria.merkleChallenges);
      approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
      approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
      approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
      approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(approval.approvalCriteria.autoDeletionOptions);
      approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(approval.approvalCriteria.mustOwnTokens);
      approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(approval.approvalCriteria.dynamicStoreChallenges);
      approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(approval.approvalCriteria.ethSignatureChallenges);
    }
  }

  for (const approval of msg.defaultBalances.incomingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(approval.approvalCriteria.merkleChallenges);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
    approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(approval.approvalCriteria.autoDeletionOptions);
    approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(approval.approvalCriteria.mustOwnTokens);
    approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(approval.approvalCriteria.dynamicStoreChallenges);
    approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(approval.approvalCriteria.ethSignatureChallenges);
  }

  for (const approval of msg.collectionApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new ApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(approval.approvalCriteria.merkleChallenges);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
    approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(approval.approvalCriteria.autoDeletionOptions);
    approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(approval.approvalCriteria.mustOwnTokens);
    approval.approvalCriteria.userRoyalties = populateUserRoyalties(approval.approvalCriteria.userRoyalties);
    approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(approval.approvalCriteria.dynamicStoreChallenges);
    approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(approval.approvalCriteria.ethSignatureChallenges);
    approval.approvalCriteria.userLevelRestrictions = populateUserLevelRestrictions(approval.approvalCriteria.userLevelRestrictions);
  }

  for (const metadata of msg.collectionMetadataTimeline) {
    if (!metadata.collectionMetadata) {
      metadata.collectionMetadata = new CollectionMetadata();
    }
  }

  for (const metadata of msg.offChainBalancesMetadataTimeline) {
    if (!metadata.offChainBalancesMetadata) {
      metadata.offChainBalancesMetadata = new OffChainBalancesMetadata();
    }
  }

  if (!msg.invariants) {
    msg.invariants = new CollectionInvariants();
  }

  return msg;
}

export function populateUndefinedForMsgDeleteIncomingApproval(msg: MsgDeleteIncomingApproval) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgDeleteOutgoingApproval(msg: MsgDeleteOutgoingApproval) {
  // Simple message with only primitive types, no population needed
  return msg;
}

function populateApprovalsToPurge(approvalsToPurge?: ApprovalIdentifierDetails[]) {
  return (
    approvalsToPurge?.map((approval) => {
      if (!approval.approvalId) {
        approval.approvalId = '';
      }
      if (!approval.approvalLevel) {
        approval.approvalLevel = '';
      }
      if (!approval.approverAddress) {
        approval.approverAddress = '';
      }
      if (!approval.version) {
        approval.version = '0';
      }
      return approval;
    }) || []
  );
}

export function populateUndefinedForMsgPurgeApprovals(msg: MsgPurgeApprovals) {
  msg.approvalsToPurge = populateApprovalsToPurge(msg.approvalsToPurge);
  return msg;
}

export function populateUndefinedForMsgSetIncomingApproval(msg: MsgSetIncomingApproval) {
  if (!msg.approval) {
    throw new Error('Approval is undefined');
  }

  if (!msg.approval.approvalCriteria) {
    msg.approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
  }
  msg.approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(msg.approval.approvalCriteria.merkleChallenges);
  msg.approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(msg.approval.approvalCriteria.predeterminedBalances);
  msg.approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(msg.approval.approvalCriteria.approvalAmounts);
  msg.approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(msg.approval.approvalCriteria.maxNumTransfers);
  msg.approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(msg.approval.approvalCriteria.autoDeletionOptions);
  msg.approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(msg.approval.approvalCriteria.mustOwnTokens);
  msg.approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(msg.approval.approvalCriteria.dynamicStoreChallenges);
  msg.approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(msg.approval.approvalCriteria.ethSignatureChallenges);

  return msg;
}

export function populateUndefinedForMsgSetOutgoingApproval(msg: MsgSetOutgoingApproval) {
  if (!msg.approval) {
    throw new Error('Approval is undefined');
  }

  if (!msg.approval.approvalCriteria) {
    msg.approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
  }
  msg.approval.approvalCriteria.merkleChallenges = populateMerkleChallenges(msg.approval.approvalCriteria.merkleChallenges);
  msg.approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(msg.approval.approvalCriteria.predeterminedBalances);
  msg.approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(msg.approval.approvalCriteria.approvalAmounts);
  msg.approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(msg.approval.approvalCriteria.maxNumTransfers);
  msg.approval.approvalCriteria.autoDeletionOptions = populateAutoDeletionOptions(msg.approval.approvalCriteria.autoDeletionOptions);
  msg.approval.approvalCriteria.mustOwnTokens = populateMustOwnTokens(msg.approval.approvalCriteria.mustOwnTokens);
  msg.approval.approvalCriteria.dynamicStoreChallenges = populateDynamicStoreChallenges(msg.approval.approvalCriteria.dynamicStoreChallenges);
  msg.approval.approvalCriteria.ethSignatureChallenges = populateETHSignatureChallenges(msg.approval.approvalCriteria.ethSignatureChallenges);

  return msg;
}

export function populateUndefinedForMsgSetValidTokenIds(msg: MsgSetValidTokenIds) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetValidTokenIds(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetManager(msg: MsgSetManager) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetManager(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetCollectionMetadata(msg: MsgSetCollectionMetadata) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetCollectionMetadata(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetTokenMetadata(msg: MsgSetTokenMetadata) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetTokenMetadata(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetCustomData(msg: MsgSetCustomData) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetCustomData(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetStandards(msg: MsgSetStandards) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetStandards(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetCollectionApprovals(msg: MsgSetCollectionApprovals) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetCollectionApprovals(extractSubsetFields(populated, msg));
}

export function populateUndefinedForMsgSetIsArchived(msg: MsgSetIsArchived) {
  // Merge with universal params and populate
  const mergedMsg = deepCopyPrimitives({
    ...universalParams,
    ...msg
  });
  const populated = populateUndefinedForMsgUniversalUpdateCollection(mergedMsg as any);
  return new MsgSetIsArchived(extractSubsetFields(populated, msg));
}

const universalParams = {
  defaultBalances: new UserBalanceStore({
    balances: [
      new Balance({
        ownershipTimes: [new UintRange()],
        tokenIds: [new UintRange()]
      })
    ],
    outgoingApprovals: [
      new UserOutgoingApproval({
        transferTimes: [new UintRange()],
        tokenIds: [new UintRange()],
        ownershipTimes: [new UintRange()],
        approvalCriteria: new OutgoingApprovalCriteria({
          ...approvalCriteria
        }),
        version: '0'
      })
    ],
    incomingApprovals: [
      new UserIncomingApproval({
        transferTimes: [new UintRange()],
        tokenIds: [new UintRange()],
        ownershipTimes: [new UintRange()],
        approvalCriteria: new IncomingApprovalCriteria({
          ...approvalCriteria
        }),
        version: '0'
      })
    ],
    userPermissions: new UserPermissions({
      canUpdateOutgoingApprovals: [
        new UserOutgoingApprovalPermission({
          transferTimes: [new UintRange()],
          tokenIds: [new UintRange()],
          ownershipTimes: [new UintRange()],
          permanentlyPermittedTimes: [new UintRange()],
          permanentlyForbiddenTimes: [new UintRange()]
        })
      ],
      canUpdateIncomingApprovals: [
        new UserIncomingApprovalPermission({
          transferTimes: [new UintRange()],
          tokenIds: [new UintRange()],
          ownershipTimes: [new UintRange()],
          permanentlyPermittedTimes: [new UintRange()],
          permanentlyForbiddenTimes: [new UintRange()]
        })
      ],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [
        new ActionPermission({
          permanentlyPermittedTimes: [new UintRange()],
          permanentlyForbiddenTimes: [new UintRange()]
        })
      ],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [
        new ActionPermission({
          permanentlyPermittedTimes: [new UintRange()],
          permanentlyForbiddenTimes: [new UintRange()]
        })
      ],
      canUpdateAutoApproveAllIncomingTransfers: [
        new ActionPermission({
          permanentlyPermittedTimes: [new UintRange()],
          permanentlyForbiddenTimes: [new UintRange()]
        })
      ]
    })
  }),
  badgesToCreate: [
    new Balance({
      ownershipTimes: [new UintRange()],
      tokenIds: [new UintRange()]
    })
  ],

  managerTimeline: [
    new ManagerTimeline({
      timelineTimes: [new UintRange()]
    })
  ],
  collectionMetadataTimeline: [
    new CollectionMetadataTimeline({
      timelineTimes: [new UintRange()],
      collectionMetadata: new CollectionMetadata()
    })
  ],
  tokenMetadataTimeline: [
    new TokenMetadataTimeline({
      timelineTimes: [new UintRange()],
      tokenMetadata: [
        new TokenMetadata({
          tokenIds: [new UintRange()]
        })
      ]
    })
  ],
  offChainBalancesMetadataTimeline: [
    new OffChainBalancesMetadataTimeline({
      timelineTimes: [new UintRange()],
      offChainBalancesMetadata: new OffChainBalancesMetadata()
    })
  ],
  customDataTimeline: [
    new CustomDataTimeline({
      timelineTimes: [new UintRange()]
    })
  ],
  standardsTimeline: [
    new StandardsTimeline({
      timelineTimes: [new UintRange()]
    })
  ],
  isArchivedTimeline: [
    new IsArchivedTimeline({
      timelineTimes: [new UintRange()]
    })
  ],

  collectionApprovals: [
    new CollectionApproval({
      transferTimes: [new UintRange()],
      tokenIds: [new UintRange()],
      ownershipTimes: [new UintRange()],
      approvalCriteria: new ApprovalCriteria({
        ...approvalCriteria
      }),
      version: '0'
    })
  ],
  collectionPermissions: new CollectionPermissions({
    canDeleteCollection: [
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ],
    canArchiveCollection: [
      new TimedUpdatePermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateOffChainBalancesMetadata: [
      new TimedUpdatePermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateStandards: [
      new TimedUpdatePermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateCustomData: [
      new TimedUpdatePermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateManager: [
      new TimedUpdatePermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateCollectionMetadata: [
      new TimedUpdatePermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateValidTokenIds: [
      new TokenIdsActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        tokenIds: [new UintRange()]
      })
    ],
    canUpdateTokenMetadata: [
      new TimedUpdateWithTokenIdsPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        tokenIds: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateCollectionApprovals: [
      new CollectionApprovalPermission({
        transferTimes: [new UintRange()],
        tokenIds: [new UintRange()],
        ownershipTimes: [new UintRange()],
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ]
  }),
  mintEscrowCoinsToTransfer: [
    new CosmosCoin({
      amount: '0',
      denom: 'ubadge'
    })
  ],
  cosmosCoinWrapperPathsToAdd: [
    new CosmosCoinWrapperPathAddObject({
      denom: 'ibc:1234567890',
      balances: [
        new Balance({
          amount: '0',
          tokenIds: [new UintRange()],
          ownershipTimes: [new UintRange()]
        })
      ],
      symbol: '',
      denomUnits: [
        new DenomUnit({
          decimals: '0',
          symbol: '',
          isDefaultDisplay: false
        })
      ]
    })
  ]
};

export function getSampleMsg(msgType: string, currMsg: any) {
  switch (msgType) {
    case 'badges/GlobalArchive':
      return { type: msgType, value: { creator: '', archive: true } };
    case 'protocols/CreateProtocol':
      return { type: msgType, value: new MsgCreateProtocol().toJson({ emitDefaultValues: true }) };
    case 'protocols/DeleteProtocol':
      return { type: msgType, value: new MsgDeleteProtocol().toJson({ emitDefaultValues: true }) };
    case 'protocols/SetCollectionForProtocol':
      return { type: msgType, value: new MsgSetCollectionForProtocol().toJson({ emitDefaultValues: true }) };
    case 'protocols/UpdateProtocol':
      return { type: msgType, value: new MsgUpdateProtocol().toJson({ emitDefaultValues: true }) };
    case 'maps/CreateMap':
      return {
        type: msgType,
        value: new MsgCreateMap({
          valueOptions: new ValueOptions(),
          updateCriteria: new MapUpdateCriteria(),
          permissions: new MapPermissions()
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/DeleteMap':
      return { type: msgType, value: new MsgDeleteMap().toJson({ emitDefaultValues: true }) };
    case 'badges/SetValue':
      return { type: msgType, value: new MsgSetValue().toJson({ emitDefaultValues: true }) };
    case 'badges/UpdateMap':
      return {
        type: msgType,
        value: new MsgUpdateMap({
          permissions: new MapPermissions()
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/DeleteCollection':
      return { type: msgType, value: new MsgDeleteCollection().toJson({ emitDefaultValues: true }) };
    case 'badges/DeleteIncomingApproval':
      return {
        type: msgType,
        value: new MsgDeleteIncomingApproval({
          creator: '',
          collectionId: '0',
          approvalId: ''
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/DeleteOutgoingApproval':
      return {
        type: msgType,
        value: new MsgDeleteOutgoingApproval({
          creator: '',
          collectionId: '0',
          approvalId: ''
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/CreateAddressLists':
      return {
        type: msgType,
        value: new MsgCreateAddressLists({
          addressLists: [new AddressList()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/CreateDynamicStore':
      return {
        type: msgType,
        value: new MsgCreateDynamicStore({
          creator: ''
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/DeleteDynamicStore':
      return {
        type: msgType,
        value: new MsgDeleteDynamicStore({
          creator: '',
          storeId: '0'
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetDynamicStoreValue':
      return {
        type: msgType,
        value: new MsgSetDynamicStoreValue({
          creator: '',
          storeId: '0',
          address: '',
          value: '0'
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/IncrementStoreValue':
      return {
        type: msgType,
        value: new MsgIncrementStoreValue({
          creator: '',
          storeId: '0',
          address: '',
          amount: '0'
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/DecrementStoreValue':
      return {
        type: msgType,
        value: new MsgDecrementStoreValue({
          creator: '',
          storeId: '0',
          address: '',
          amount: '0'
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetIncomingApproval':
      return {
        type: msgType,
        value: populateUndefinedForMsgSetIncomingApproval(
          new MsgSetIncomingApproval({
            creator: '',
            collectionId: '0',
            approval: new UserIncomingApproval({
              transferTimes: [new UintRange()],
              tokenIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              approvalCriteria: new IncomingApprovalCriteria({
                ...approvalCriteria
              }),
              version: '0'
            })
          })
        ).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetOutgoingApproval':
      return {
        type: msgType,
        value: populateUndefinedForMsgSetOutgoingApproval(
          new MsgSetOutgoingApproval({
            creator: '',
            collectionId: '0',
            approval: new UserOutgoingApproval({
              transferTimes: [new UintRange()],
              tokenIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              approvalCriteria: new OutgoingApprovalCriteria({
                ...approvalCriteria
              }),
              version: '0'
            })
          })
        ).toJson({ emitDefaultValues: true })
      };
    case 'badges/PurgeApprovals':
      return {
        type: msgType,
        value: populateUndefinedForMsgPurgeApprovals(
          new MsgPurgeApprovals({
            creator: '',
            collectionId: '0',
            purgeExpired: false,
            approverAddress: '',
            purgeCounterpartyApprovals: false,
            approvalsToPurge: [
              new ApprovalIdentifierDetails({
                approvalId: '',
                approvalLevel: '',
                approverAddress: '',
                version: '0'
              })
            ]
          })
        ).toJson({ emitDefaultValues: true })
      };
    case 'badges/UpdateDynamicStore':
      return {
        type: msgType,
        value: new MsgUpdateDynamicStore({
          creator: '',
          storeId: '0'
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/TransferTokens':
      return {
        type: msgType,
        value: new MsgTransferTokens({
          transfers: [
            new Transfer({
              balances: [
                new Balance({
                  ownershipTimes: [new UintRange()],
                  tokenIds: [new UintRange()]
                })
              ],
              precalculateBalancesFromApproval: new ApprovalIdentifierDetails({
                version: '0'
              }),
              prioritizedApprovals: [
                new ApprovalIdentifierDetails({
                  version: '0'
                })
              ],
              merkleProofs: [
                new MerkleProof({
                  aunts: [new MerklePathItem()]
                })
              ],
              ethSignatureProofs: [
                new ETHSignatureProof({
                  nonce: '',
                  signature: ''
                })
              ],
              precalculationOptions: new PrecalculationOptions({
                overrideTimestamp: '0',
                tokenIdsOverride: [new UintRange()]
              }),
              numAttempts: '0'
            })
          ]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/UpdateUserApprovals':
      return {
        type: msgType,
        value: new MsgUpdateUserApprovals({
          outgoingApprovals: [
            new UserOutgoingApproval({
              transferTimes: [new UintRange()],
              tokenIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              approvalCriteria: new OutgoingApprovalCriteria({
                ...approvalCriteria
              }),
              version: '0'
            })
          ],
          incomingApprovals: [
            new UserIncomingApproval({
              transferTimes: [new UintRange()],
              tokenIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              approvalCriteria: new IncomingApprovalCriteria({
                ...approvalCriteria
              }),
              version: '0'
            })
          ],
          userPermissions: new UserPermissions({
            canUpdateOutgoingApprovals: [
              new UserOutgoingApprovalPermission({
                transferTimes: [new UintRange()],
                tokenIds: [new UintRange()],
                ownershipTimes: [new UintRange()],
                permanentlyPermittedTimes: [new UintRange()],
                permanentlyForbiddenTimes: [new UintRange()]
              })
            ],
            canUpdateIncomingApprovals: [
              new UserIncomingApprovalPermission({
                transferTimes: [new UintRange()],
                tokenIds: [new UintRange()],
                ownershipTimes: [new UintRange()],
                permanentlyPermittedTimes: [new UintRange()],
                permanentlyForbiddenTimes: [new UintRange()]
              })
            ],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [
              new ActionPermission({
                permanentlyPermittedTimes: [new UintRange()],
                permanentlyForbiddenTimes: [new UintRange()]
              })
            ],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [
              new ActionPermission({
                permanentlyPermittedTimes: [new UintRange()],
                permanentlyForbiddenTimes: [new UintRange()]
              })
            ],
            canUpdateAutoApproveAllIncomingTransfers: [
              new ActionPermission({
                permanentlyPermittedTimes: [new UintRange()],
                permanentlyForbiddenTimes: [new UintRange()]
              })
            ]
          })
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/CreateCollection':
      return {
        type: msgType,
        value: new MsgCreateCollection({
          ...deepCopyPrimitives(universalParams)
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/UpdateCollection':
      return {
        type: msgType,
        value: new MsgUpdateCollection({
          ...deepCopyPrimitives(universalParams)
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/UniversalUpdateCollection':
      return {
        type: msgType,
        value: new MsgUniversalUpdateCollection({
          ...deepCopyPrimitives(universalParams)
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetValidTokenIds':
      return {
        type: msgType,
        value: new MsgSetValidTokenIds({
          creator: '',
          collectionId: '0',
          validTokenIds: [new UintRange()],
          canUpdateValidTokenIds: [new TokenIdsActionPermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetManager':
      return {
        type: msgType,
        value: new MsgSetManager({
          creator: '',
          collectionId: '0',
          managerTimeline: [new ManagerTimeline()],
          canUpdateManager: [new TimedUpdatePermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetCollectionMetadata':
      return {
        type: msgType,
        value: new MsgSetCollectionMetadata({
          creator: '',
          collectionId: '0',
          collectionMetadataTimeline: [new CollectionMetadataTimeline()],
          canUpdateCollectionMetadata: [new TimedUpdatePermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetTokenMetadata':
      return {
        type: msgType,
        value: new MsgSetTokenMetadata({
          creator: '',
          collectionId: '0',
          tokenMetadataTimeline: [new TokenMetadataTimeline()],
          canUpdateTokenMetadata: [new TimedUpdateWithTokenIdsPermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetCustomData':
      return {
        type: msgType,
        value: new MsgSetCustomData({
          creator: '',
          collectionId: '0',
          customDataTimeline: [new CustomDataTimeline()],
          canUpdateCustomData: [new TimedUpdatePermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetStandards':
      return {
        type: msgType,
        value: new MsgSetStandards({
          creator: '',
          collectionId: '0',
          standardsTimeline: [new StandardsTimeline()],
          canUpdateStandards: [new TimedUpdatePermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetCollectionApprovals':
      return {
        type: msgType,
        value: new MsgSetCollectionApprovals({
          creator: '',
          collectionId: '0',
          collectionApprovals: [new CollectionApproval()],
          canUpdateCollectionApprovals: [new CollectionApprovalPermission()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/SetIsArchived':
      return {
        type: msgType,
        value: new MsgSetIsArchived({
          creator: '',
          collectionId: '0',
          isArchivedTimeline: [new IsArchivedTimeline()],
          canArchiveCollection: [new TimedUpdatePermission()]
        }).toJson({ emitDefaultValues: true })
      };
    default:
      return currMsg;
  }
}

// Helper to extract only the fields from the original msg (subset)
function extractSubsetFields<T extends object>(populated: any, original: T): T {
  const result: any = {};
  for (const key of Object.keys(original)) {
    result[key] = populated[key];
  }
  return result as T;
}

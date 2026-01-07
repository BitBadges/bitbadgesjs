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
  AddressChecks,
  AliasPathAddObject,
  AltTimeChecks,
  ApprovalAmounts,
  ApprovalCriteria,
  ApprovalIdentifierDetails,
  AutoDeletionOptions,
  Balance,
  CoinTransfer,
  CollectionApproval,
  CollectionApprovalPermission,
  CollectionMetadata,
  CollectionPermissions,
  ConversionWithoutDenom,
  CosmosCoinWrapperPathAddObject,
  DenomUnit,
  DynamicStoreChallenge,
  ETHSignatureChallenge,
  ETHSignatureProof,
  IncomingApprovalCriteria,
  IncrementedBalances,
  ManualBalances,
  MaxNumTransfers,
  MerkleChallenge,
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgDeleteCollection,
  MsgTransferTokens,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals,
  MustOwnTokens,
  OutgoingApprovalCriteria,
  PathMetadata,
  PrecalculateBalancesFromApprovalDetails,
  PredeterminedBalances,
  PredeterminedOrderCalculationMethod,
  RecurringOwnershipTimes,
  ResetTimeIntervals,
  TokenIdsActionPermission,
  TokenMetadata,
  UintRange,
  UserBalanceStore,
  UserIncomingApproval,
  UserIncomingApprovalPermission,
  UserOutgoingApproval,
  UserOutgoingApprovalPermission,
  UserPermissions,
  UserRoyalties,
  Voter,
  VotingChallenge
} from '@/proto/badges/index.js';

import {
  InvariantsAddObject,
  MsgCastVote,
  MsgCreateDynamicStore,
  MsgDeleteDynamicStore,
  MsgDeleteIncomingApproval,
  MsgDeleteOutgoingApproval,
  MsgPurgeApprovals,
  MsgSetCollectionApprovals,
  MsgSetCollectionMetadata,
  MsgSetCustomData,
  MsgSetDynamicStoreValue,
  MsgSetIncomingApproval,
  MsgSetIsArchived,
  MsgSetManager,
  MsgSetOutgoingApproval,
  MsgSetStandards,
  MsgSetTokenMetadata,
  MsgSetValidTokenIds,
  MsgUpdateDynamicStore
} from '@/proto/badges/tx_pb.js';
import {
  MsgCreateGroup,
  MsgCreateGroupPolicy,
  MsgCreateGroupWithPolicy,
  MsgExec as MsgGroupExec,
  MsgSubmitProposal as MsgGroupSubmitProposal,
  MsgVote as MsgGroupVote,
  MsgLeaveGroup,
  MsgUpdateGroupAdmin,
  MsgUpdateGroupMembers,
  MsgUpdateGroupMetadata,
  MsgUpdateGroupPolicyAdmin,
  MsgUpdateGroupPolicyDecisionPolicy,
  MsgUpdateGroupPolicyMetadata,
  MsgWithdrawProposal
} from '@/proto/cosmos/group/v1/index.js';
import { MsgCreateBalancerPool } from '@/proto/gamm/poolmodels/balancer/tx_pb.js';
import {
  MsgExitPool,
  MsgExitSwapExternAmountOut,
  MsgExitSwapShareAmountIn,
  MsgJoinPool,
  MsgJoinSwapExternAmountIn,
  MsgJoinSwapShareAmountOut,
  MsgSwapExactAmountIn,
  MsgSwapExactAmountInWithIBCTransfer,
  MsgSwapExactAmountOut
} from '@/proto/gamm/v1beta1/tx_pb.js';
import {
  MsgCreateManagerSplitter,
  MsgDeleteManagerSplitter,
  MsgExecuteUniversalUpdateCollection,
  MsgUpdateManagerSplitter
} from '@/proto/managersplitter/tx_pb.js';

const approvalCriteria = new ApprovalCriteria({
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
  ],
  recipientChecks: new AddressChecks({
    mustBeWasmContract: false,
    mustNotBeWasmContract: false,
    mustBeLiquidityPool: false,
    mustNotBeLiquidityPool: false
  }),
  initiatorChecks: new AddressChecks({
    mustBeWasmContract: false,
    mustNotBeWasmContract: false,
    mustBeLiquidityPool: false,
    mustNotBeLiquidityPool: false
  }),
  senderChecks: new AddressChecks({
    mustBeWasmContract: false,
    mustNotBeWasmContract: false,
    mustBeLiquidityPool: false,
    mustNotBeLiquidityPool: false
  }),
  altTimeChecks: new AltTimeChecks({
    offlineHours: [new UintRange()],
    offlineDays: [new UintRange()]
  }),
  mustPrioritize: false,
  votingChallenges: [
    new VotingChallenge({
      proposalId: '',
      quorumThreshold: '0',
      voters: [
        new Voter({
          address: '',
          weight: '0'
        })
      ],
      uri: '',
      customData: ''
    })
  ]
}).toJson({ emitDefaultValues: true }) as object;

const approvalCriteriaForPopulatingUndefined = new OutgoingApprovalCriteria({
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
  }),
  altTimeChecks: new AltTimeChecks({
    offlineHours: [],
    offlineDays: []
  }),
  mustPrioritize: false
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
      mustOwnToken.ownershipCheckParty = mustOwnToken.ownershipCheckParty || '';
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

function populateVotingChallenges(votingChallenges?: VotingChallenge[]): VotingChallenge[] {
  return votingChallenges || [];
}

function populateAddressChecks(addressChecks?: AddressChecks): AddressChecks {
  if (!addressChecks) {
    return new AddressChecks({
      mustBeWasmContract: false,
      mustNotBeWasmContract: false,
      mustBeLiquidityPool: false,
      mustNotBeLiquidityPool: false
    });
  }
  return addressChecks;
}

function populateAltTimeChecks(altTimeChecks?: AltTimeChecks): AltTimeChecks {
  if (!altTimeChecks) {
    return new AltTimeChecks({
      offlineHours: [],
      offlineDays: []
    });
  }
  return altTimeChecks;
}

export function populateUndefinedForMsgTransferTokens(msg: MsgTransferTokens) {
  for (const transfer of msg.transfers) {
    if (!transfer.precalculateBalancesFromApproval) {
      transfer.precalculateBalancesFromApproval = new PrecalculateBalancesFromApprovalDetails({
        approvalId: '',
        approvalLevel: '',
        approverAddress: '',
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
    const criteria = approval.approvalCriteria!;
    criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
    criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
    criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
    criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
    criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
    criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
    criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
    criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
    criteria.votingChallenges = populateVotingChallenges(criteria.votingChallenges);
    criteria.recipientChecks = populateAddressChecks(criteria.recipientChecks);
    criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
    criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);
  }
  for (const approval of msg.incomingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    const criteria = approval.approvalCriteria!;
    criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
    criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
    criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
    criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
    criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
    criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
    criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
    criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
    criteria.votingChallenges = populateVotingChallenges(criteria.votingChallenges);
    criteria.senderChecks = populateAddressChecks(criteria.senderChecks);
    criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
    criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);
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

export function populateUndefinedForMsgCastVote(msg: MsgCastVote) {
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

export function populateUndefinedForMsgUniversalUpdateCollection(msg: MsgUniversalUpdateCollection) {
  if (!msg.defaultBalances) {
    msg.defaultBalances = new UserBalanceStore();
  }

  const defaultBalances = msg.defaultBalances!;
  if (!defaultBalances.userPermissions) {
    defaultBalances.userPermissions = new UserPermissions();
  }

  if (!msg.collectionPermissions) {
    msg.collectionPermissions = new CollectionPermissions();
  }

  if (!defaultBalances.balances) {
    defaultBalances.balances = [
      new Balance({
        ownershipTimes: [new UintRange()],
        tokenIds: [new UintRange()]
      })
    ];
  }

  for (const approval of defaultBalances.outgoingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    const criteria = approval.approvalCriteria!;
    criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
    criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
    criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
    criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
    criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
    criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
    criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
    criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
    criteria.votingChallenges = populateVotingChallenges(criteria.votingChallenges);
    criteria.recipientChecks = populateAddressChecks(criteria.recipientChecks);
    criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
    criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);
  }

  for (const approval of defaultBalances.incomingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    const criteria = approval.approvalCriteria!;
    criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
    criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
    criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
    criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
    criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
    criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
    criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
    criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
    criteria.votingChallenges = populateVotingChallenges(criteria.votingChallenges);
    criteria.senderChecks = populateAddressChecks(criteria.senderChecks);
    criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
    criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);
  }

  for (const approval of msg.collectionApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new ApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    const criteria = approval.approvalCriteria!;
    criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
    criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
    criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
    criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
    criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
    criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
    criteria.userRoyalties = populateUserRoyalties(criteria.userRoyalties);
    criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
    criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
    criteria.votingChallenges = populateVotingChallenges(criteria.votingChallenges);
    criteria.senderChecks = populateAddressChecks(criteria.senderChecks);
    criteria.recipientChecks = populateAddressChecks(criteria.recipientChecks);
    criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
    criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);
  }

  // Since we removed timelines, collectionMetadata is now a direct value
  if (!msg.collectionMetadata) {
    msg.collectionMetadata = new CollectionMetadata();
  }

  if (!msg.invariants) {
    msg.invariants = new InvariantsAddObject({
      noCustomOwnershipTimes: false,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: false
    });
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
  const criteria = msg.approval.approvalCriteria!;
  criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
  criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
  criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
  criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
  criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
  criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
  criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
  criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
  criteria.senderChecks = populateAddressChecks(criteria.senderChecks);
  criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
  criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);

  return msg;
}

export function populateUndefinedForMsgSetOutgoingApproval(msg: MsgSetOutgoingApproval) {
  if (!msg.approval) {
    throw new Error('Approval is undefined');
  }

  if (!msg.approval.approvalCriteria) {
    msg.approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
  }
  const criteria = msg.approval.approvalCriteria!;
  criteria.merkleChallenges = populateMerkleChallenges(criteria.merkleChallenges);
  criteria.predeterminedBalances = populatePredeterminedBalances(criteria.predeterminedBalances);
  criteria.approvalAmounts = populateApprovalAmounts(criteria.approvalAmounts);
  criteria.maxNumTransfers = populateMaxNumTransfers(criteria.maxNumTransfers);
  criteria.autoDeletionOptions = populateAutoDeletionOptions(criteria.autoDeletionOptions);
  criteria.mustOwnTokens = populateMustOwnTokens(criteria.mustOwnTokens);
  criteria.dynamicStoreChallenges = populateDynamicStoreChallenges(criteria.dynamicStoreChallenges);
  criteria.ethSignatureChallenges = populateETHSignatureChallenges(criteria.ethSignatureChallenges);
  criteria.recipientChecks = populateAddressChecks(criteria.recipientChecks);
  criteria.initiatorChecks = populateAddressChecks(criteria.initiatorChecks);
  criteria.altTimeChecks = populateAltTimeChecks(criteria.altTimeChecks);

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

// GAMM Message Population Functions
export function populateUndefinedForMsgJoinPool(msg: MsgJoinPool) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgExitPool(msg: MsgExitPool) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgSwapExactAmountIn(msg: MsgSwapExactAmountIn) {
  if (!msg.tokenIn) {
    throw new Error('MsgSwapExactAmountIn.tokenIn is required but was undefined');
  }
  return msg;
}

export function populateUndefinedForMsgSwapExactAmountInWithIBCTransfer(msg: MsgSwapExactAmountInWithIBCTransfer) {
  if (!msg.tokenIn) {
    throw new Error('MsgSwapExactAmountInWithIBCTransfer.tokenIn is required but was undefined');
  }
  if (!msg.ibcTransferInfo) {
    throw new Error('MsgSwapExactAmountInWithIBCTransfer.ibcTransferInfo is required but was undefined');
  }
  return msg;
}

export function populateUndefinedForMsgSwapExactAmountOut(msg: MsgSwapExactAmountOut) {
  if (!msg.tokenOut) {
    throw new Error('MsgSwapExactAmountOut.tokenOut is required but was undefined');
  }
  return msg;
}

export function populateUndefinedForMsgJoinSwapExternAmountIn(msg: MsgJoinSwapExternAmountIn) {
  if (!msg.tokenIn) {
    throw new Error('MsgJoinSwapExternAmountIn.tokenIn is required but was undefined');
  }
  return msg;
}

export function populateUndefinedForMsgJoinSwapShareAmountOut(msg: MsgJoinSwapShareAmountOut) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgCreateManagerSplitter(msg: MsgCreateManagerSplitter) {
  // Simple message with only primitive types and optional permissions, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateManagerSplitter(msg: MsgUpdateManagerSplitter) {
  // Simple message with only primitive types and optional permissions, no population needed
  return msg;
}

export function populateUndefinedForMsgDeleteManagerSplitter(msg: MsgDeleteManagerSplitter) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgExecuteUniversalUpdateCollection(msg: MsgExecuteUniversalUpdateCollection) {
  // The nested universalUpdateCollectionMsg will be handled by its own populate function
  return msg;
}

export function populateUndefinedForMsgExitSwapShareAmountIn(msg: MsgExitSwapShareAmountIn) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgExitSwapExternAmountOut(msg: MsgExitSwapExternAmountOut) {
  if (!msg.tokenOut) {
    throw new Error('MsgExitSwapExternAmountOut.tokenOut is required but was undefined');
  }
  return msg;
}

export function populateUndefinedForMsgCreateBalancerPool(msg: MsgCreateBalancerPool) {
  if (!msg.poolParams) {
    throw new Error('MsgCreateBalancerPool.poolParams is required but was undefined');
  }
  return msg;
}

// Group Message Population Functions
export function populateUndefinedForMsgCreateGroup(msg: MsgCreateGroup) {
  // Simple message with only primitive types and MemberRequest array, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateGroupMembers(msg: MsgUpdateGroupMembers) {
  // Simple message with only primitive types and MemberRequest array, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateGroupAdmin(msg: MsgUpdateGroupAdmin) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateGroupMetadata(msg: MsgUpdateGroupMetadata) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgCreateGroupPolicy(msg: MsgCreateGroupPolicy) {
  // Simple message with only primitive types and Any decision_policy, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateGroupPolicyAdmin(msg: MsgUpdateGroupPolicyAdmin) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgCreateGroupWithPolicy(msg: MsgCreateGroupWithPolicy) {
  // Simple message with only primitive types, MemberRequest array, and Any decision_policy, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateGroupPolicyDecisionPolicy(msg: MsgUpdateGroupPolicyDecisionPolicy) {
  // Simple message with only primitive types and Any decision_policy, no population needed
  return msg;
}

export function populateUndefinedForMsgUpdateGroupPolicyMetadata(msg: MsgUpdateGroupPolicyMetadata) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgGroupSubmitProposal(msg: MsgGroupSubmitProposal) {
  // Simple message with only primitive types and Any messages array, no population needed
  return msg;
}

export function populateUndefinedForMsgWithdrawProposal(msg: MsgWithdrawProposal) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgGroupVote(msg: MsgGroupVote) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgGroupExec(msg: MsgGroupExec) {
  // Simple message with only primitive types, no population needed
  return msg;
}

export function populateUndefinedForMsgLeaveGroup(msg: MsgLeaveGroup) {
  // Simple message with only primitive types, no population needed
  return msg;
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
  tokensToCreate: [
    new Balance({
      ownershipTimes: [new UintRange()],
      tokenIds: [new UintRange()]
    })
  ],

  manager: '',
  collectionMetadata: new CollectionMetadata(),
  tokenMetadata: [
    new TokenMetadata({
      tokenIds: [new UintRange()]
    })
  ],
  customData: '',
  standards: [],
  isArchived: false,

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
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ],
    canUpdateStandards: [
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ],
    canUpdateCustomData: [
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ],
    canUpdateManager: [
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ],
    canUpdateCollectionMetadata: [
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
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
      new TokenIdsActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        tokenIds: [new UintRange()]
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
    ],
    canAddMoreAliasPaths: [
      new ActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ],
    canAddMoreCosmosCoinWrapperPaths: [
      new ActionPermission({
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
      conversion: new ConversionWithoutDenom({
        sideA: {
          amount: '0'
        },
        sideB: [
          new Balance({
            amount: '0',
            tokenIds: [new UintRange()],
            ownershipTimes: [new UintRange()]
          })
        ]
      }),
      symbol: '',
      denomUnits: [
        new DenomUnit({
          decimals: '0',
          symbol: '',
          isDefaultDisplay: false,
          metadata: new PathMetadata({
            uri: '',
            customData: ''
          })
        })
      ],
      allowOverrideWithAnyValidToken: false,
      metadata: new PathMetadata({
        uri: '',
        customData: ''
      })
    })
  ],
  aliasPathsToAdd: [
    new AliasPathAddObject({
      denom: 'ibc:alias123',
      conversion: new ConversionWithoutDenom({
        sideA: {
          amount: '0'
        },
        sideB: [
          new Balance({
            amount: '0',
            tokenIds: [new UintRange()],
            ownershipTimes: [new UintRange()]
          })
        ]
      }),
      symbol: '',
      denomUnits: [
        new DenomUnit({
          decimals: '0',
          symbol: '',
          isDefaultDisplay: false,
          metadata: new PathMetadata({
            uri: '',
            customData: ''
          })
        })
      ],
      metadata: new PathMetadata({
        uri: '',
        customData: ''
      })
    })
  ]
};

// Helper to extract only the fields from the original msg (subset)
function extractSubsetFields<T extends object>(populated: any, original: T): T {
  const result: any = {};
  for (const key of Object.keys(original)) {
    result[key] = populated[key];
  }
  return result as T;
}

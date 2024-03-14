/**
 * This file is used to generate sample Msgs for EIP712 type generation.
 *
 * This is needed because the EIP712 type generation doesn't natively support optional types.
 * Our solution is to always generate Msgs with all optional types populated with a default empty value (e.g. "", [], 0, etc.)
 * For primitive types and primitive type arrays, we don't need to add bc protobuf automatically adds a default value, but for objects we do.
 * For all Number type values (cosmos.Uint), we use strings and bigints (not numbers), so we need to add a default value of "0"
 * because the chain parses and sets numbers as a "0" string.
 *
 * emitDefaultValues option must be set to handle the primitive types.
 *
 * For Msgs without optional fields, we don't need to do anything.
 */
import {
  OutgoingApprovalCriteria,
  MustOwnBadges,
  UintRange,
  MerkleChallenge,
  PredeterminedBalances,
  ManualBalances,
  Balance,
  PredeterminedOrderCalculationMethod,
  IncrementedBalances,
  ApprovalAmounts,
  MaxNumTransfers,
  MsgTransferBadges,
  ApprovalIdentifierDetails,
  MsgUpdateUserApprovals,
  IncomingApprovalCriteria,
  MsgUpdateCollection,
  MsgUniversalUpdateCollection,
  MsgCreateCollection,
  UserBalanceStore,
  UserPermissions,
  CollectionPermissions,
  ApprovalCriteria,
  CollectionMetadata,
  OffChainBalancesMetadata,
  UserOutgoingApproval,
  UserIncomingApproval,
  UserOutgoingApprovalPermission,
  UserIncomingApprovalPermission,
  ActionPermission,
  ManagerTimeline,
  CollectionMetadataTimeline,
  BadgeMetadataTimeline,
  BadgeMetadata,
  OffChainBalancesMetadataTimeline,
  CustomDataTimeline,
  StandardsTimeline,
  IsArchivedTimeline,
  CollectionApproval,
  TimedUpdatePermission,
  BalancesActionPermission,
  TimedUpdateWithBadgeIdsPermission,
  CollectionApprovalPermission,
  MsgDeleteCollection,
  MsgCreateAddressLists,
  AddressList,
  Transfer,
  MerkleProof,
  MerklePathItem
} from '@/proto/badges';
import { MsgCreateProtocol, MsgDeleteProtocol, MsgSetCollectionForProtocol, MsgUpdateProtocol } from '@/proto/protocols/tx_pb';
import { deepCopyPrimitives } from '@/common/base';

const approvalCriteria = new OutgoingApprovalCriteria({
  mustOwnBadges: [
    new MustOwnBadges({
      amountRange: new UintRange(),
      badgeIds: [new UintRange()],
      ownershipTimes: [new UintRange()]
    })
  ],
  merkleChallenge: new MerkleChallenge({
    expectedProofLength: '0',
    maxUsesPerLeaf: '0'
  }),
  predeterminedBalances: new PredeterminedBalances({
    manualBalances: [
      new ManualBalances({
        balances: [
          new Balance({
            ownershipTimes: [new UintRange()],
            badgeIds: [new UintRange()]
          })
        ]
      })
    ],
    orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
    incrementedBalances: new IncrementedBalances({
      startBalances: [
        new Balance({
          ownershipTimes: [new UintRange()],
          badgeIds: [new UintRange()]
        })
      ],
      incrementOwnershipTimesBy: '0',
      incrementBadgeIdsBy: '0'
    })
  }),
  approvalAmounts: new ApprovalAmounts({
    overallApprovalAmount: '0',
    perFromAddressApprovalAmount: '0',
    perInitiatedByAddressApprovalAmount: '0',
    perToAddressApprovalAmount: '0'
  }),
  maxNumTransfers: new MaxNumTransfers({
    overallMaxNumTransfers: '0',
    perFromAddressMaxNumTransfers: '0',
    perInitiatedByAddressMaxNumTransfers: '0',
    perToAddressMaxNumTransfers: '0'
  })
}).toJson({ emitDefaultValues: true }) as object;

const approvalCriteriaForPopulatingUndefined = new OutgoingApprovalCriteria({
  merkleChallenge: new MerkleChallenge({
    expectedProofLength: '0',
    maxUsesPerLeaf: '0'
  }),
  predeterminedBalances: new PredeterminedBalances({
    orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
    incrementedBalances: new IncrementedBalances({
      incrementBadgeIdsBy: '0',
      incrementOwnershipTimesBy: '0'
    })
  }),
  approvalAmounts: new ApprovalAmounts({
    overallApprovalAmount: '0',
    perFromAddressApprovalAmount: '0',
    perInitiatedByAddressApprovalAmount: '0',
    perToAddressApprovalAmount: '0'
  }),
  maxNumTransfers: new MaxNumTransfers({
    overallMaxNumTransfers: '0',
    perFromAddressMaxNumTransfers: '0',
    perInitiatedByAddressMaxNumTransfers: '0',
    perToAddressMaxNumTransfers: '0'
  })
}).toJson({ emitDefaultValues: true }) as object;

function populateMerkleChallenge(merkleChallenge?: MerkleChallenge) {
  if (!merkleChallenge) {
    return new MerkleChallenge({
      expectedProofLength: '0',
      maxUsesPerLeaf: '0'
    });
  }

  return merkleChallenge;
}

function populatePredeterminedBalances(predeterminedBalances?: PredeterminedBalances) {
  if (!predeterminedBalances) {
    return new PredeterminedBalances({
      orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
      incrementedBalances: new IncrementedBalances({
        incrementBadgeIdsBy: '0',
        incrementOwnershipTimesBy: '0'
      })
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
      perToAddressApprovalAmount: '0'
    });
  }

  return approvalAmounts;
}

function populateMaxNumTransfers(maxNumTransfers?: MaxNumTransfers) {
  if (!maxNumTransfers) {
    return new MaxNumTransfers({
      overallMaxNumTransfers: '0',
      perFromAddressMaxNumTransfers: '0',
      perInitiatedByAddressMaxNumTransfers: '0',
      perToAddressMaxNumTransfers: '0'
    });
  }

  return maxNumTransfers;
}

export function populateUndefinedForMsgTransferBadges(msg: MsgTransferBadges) {
  for (const transfer of msg.transfers) {
    if (!transfer.precalculateBalancesFromApproval) {
      transfer.precalculateBalancesFromApproval = new ApprovalIdentifierDetails();
    }
  }

  return msg;
}

export function populateUndefinedForMsgUpdateUserApprovals(msg: MsgUpdateUserApprovals) {
  for (const approval of msg.outgoingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.mustOwnBadges = populateMustOwnBadges(approval.approvalCriteria.mustOwnBadges);
    approval.approvalCriteria.merkleChallenge = populateMerkleChallenge(approval.approvalCriteria.merkleChallenge);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
  }
  for (const approval of msg.incomingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.mustOwnBadges = populateMustOwnBadges(approval.approvalCriteria.mustOwnBadges);
    approval.approvalCriteria.merkleChallenge = populateMerkleChallenge(approval.approvalCriteria.merkleChallenge);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
  }
  return msg;
}

function populateMustOwnBadges(mustOwnBadges: MustOwnBadges[]) {
  for (const mustOwn of mustOwnBadges) {
    if (!mustOwn.amountRange) {
      mustOwn.amountRange = new UintRange();
    }
  }

  return mustOwnBadges;
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
        badgeIds: [new UintRange()]
      })
    ];
  }

  for (const approval of msg.defaultBalances.outgoingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new OutgoingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
      approval.approvalCriteria.mustOwnBadges = populateMustOwnBadges(approval.approvalCriteria.mustOwnBadges);
      approval.approvalCriteria.merkleChallenge = populateMerkleChallenge(approval.approvalCriteria.merkleChallenge);
      approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
      approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
      approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
    }
  }
  for (const approval of msg.defaultBalances.incomingApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new IncomingApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.mustOwnBadges = populateMustOwnBadges(approval.approvalCriteria.mustOwnBadges);
    approval.approvalCriteria.merkleChallenge = populateMerkleChallenge(approval.approvalCriteria.merkleChallenge);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
  }
  for (const approval of msg.collectionApprovals) {
    if (!approval.approvalCriteria) {
      approval.approvalCriteria = new ApprovalCriteria({ ...approvalCriteriaForPopulatingUndefined });
    }
    approval.approvalCriteria.mustOwnBadges = populateMustOwnBadges(approval.approvalCriteria.mustOwnBadges);
    approval.approvalCriteria.merkleChallenge = populateMerkleChallenge(approval.approvalCriteria.merkleChallenge);
    approval.approvalCriteria.predeterminedBalances = populatePredeterminedBalances(approval.approvalCriteria.predeterminedBalances);
    approval.approvalCriteria.approvalAmounts = populateApprovalAmounts(approval.approvalCriteria.approvalAmounts);
    approval.approvalCriteria.maxNumTransfers = populateMaxNumTransfers(approval.approvalCriteria.maxNumTransfers);
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

  return msg;
}

const universalParams = {
  defaultBalances: new UserBalanceStore({
    balances: [
      new Balance({
        ownershipTimes: [new UintRange()],
        badgeIds: [new UintRange()]
      })
    ],
    outgoingApprovals: [
      new UserOutgoingApproval({
        transferTimes: [new UintRange()],
        badgeIds: [new UintRange()],
        ownershipTimes: [new UintRange()],
        approvalCriteria: new OutgoingApprovalCriteria({
          ...approvalCriteria
        })
      })
    ],
    incomingApprovals: [
      new UserIncomingApproval({
        transferTimes: [new UintRange()],
        badgeIds: [new UintRange()],
        ownershipTimes: [new UintRange()],
        approvalCriteria: new IncomingApprovalCriteria({
          ...approvalCriteria
        })
      })
    ],
    userPermissions: new UserPermissions({
      canUpdateOutgoingApprovals: [
        new UserOutgoingApprovalPermission({
          transferTimes: [new UintRange()],
          badgeIds: [new UintRange()],
          ownershipTimes: [new UintRange()],
          permanentlyPermittedTimes: [new UintRange()],
          permanentlyForbiddenTimes: [new UintRange()]
        })
      ],
      canUpdateIncomingApprovals: [
        new UserIncomingApprovalPermission({
          transferTimes: [new UintRange()],
          badgeIds: [new UintRange()],
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
      ]
    })
  }),
  badgesToCreate: [
    new Balance({
      ownershipTimes: [new UintRange()],
      badgeIds: [new UintRange()]
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
  badgeMetadataTimeline: [
    new BadgeMetadataTimeline({
      timelineTimes: [new UintRange()],
      badgeMetadata: [
        new BadgeMetadata({
          badgeIds: [new UintRange()]
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
      badgeIds: [new UintRange()],
      ownershipTimes: [new UintRange()],
      approvalCriteria: new ApprovalCriteria({
        ...approvalCriteria
      })
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
    canCreateMoreBadges: [
      new BalancesActionPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        badgeIds: [new UintRange()],
        ownershipTimes: [new UintRange()]
      })
    ],
    canUpdateBadgeMetadata: [
      new TimedUpdateWithBadgeIdsPermission({
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()],
        badgeIds: [new UintRange()],
        timelineTimes: [new UintRange()]
      })
    ],
    canUpdateCollectionApprovals: [
      new CollectionApprovalPermission({
        transferTimes: [new UintRange()],
        badgeIds: [new UintRange()],
        ownershipTimes: [new UintRange()],
        permanentlyPermittedTimes: [new UintRange()],
        permanentlyForbiddenTimes: [new UintRange()]
      })
    ]
  })
};

export function getSampleMsg(msgType: string, currMsg: any) {
  switch (msgType) {
    case 'protocols/CreateProtocol':
      return { type: msgType, value: new MsgCreateProtocol().toJson({ emitDefaultValues: true }) };
    case 'protocols/DeleteProtocol':
      return { type: msgType, value: new MsgDeleteProtocol().toJson({ emitDefaultValues: true }) };
    case 'protocols/SetCollectionForProtocol':
      return { type: msgType, value: new MsgSetCollectionForProtocol().toJson({ emitDefaultValues: true }) };
    case 'protocols/UpdateProtocol':
      return { type: msgType, value: new MsgUpdateProtocol().toJson({ emitDefaultValues: true }) };

    case 'badges/DeleteCollection':
      return { type: msgType, value: new MsgDeleteCollection().toJson({ emitDefaultValues: true }) };
    case 'badges/CreateAddressLists':
      return {
        type: msgType,
        value: new MsgCreateAddressLists({
          addressLists: [new AddressList()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/TransferBadges':
      return {
        type: msgType,
        value: new MsgTransferBadges({
          transfers: [
            new Transfer({
              balances: [
                new Balance({
                  ownershipTimes: [new UintRange()],
                  badgeIds: [new UintRange()]
                })
              ],
              precalculateBalancesFromApproval: new ApprovalIdentifierDetails(),
              prioritizedApprovals: [new ApprovalIdentifierDetails()],
              merkleProofs: [
                new MerkleProof({
                  aunts: [new MerklePathItem()]
                })
              ]
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
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              approvalCriteria: new OutgoingApprovalCriteria({
                ...approvalCriteria
              })
            })
          ],
          incomingApprovals: [
            new UserIncomingApproval({
              transferTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              approvalCriteria: new IncomingApprovalCriteria({
                ...approvalCriteria
              })
            })
          ],
          userPermissions: new UserPermissions({
            canUpdateOutgoingApprovals: [
              new UserOutgoingApprovalPermission({
                transferTimes: [new UintRange()],
                badgeIds: [new UintRange()],
                ownershipTimes: [new UintRange()],
                permanentlyPermittedTimes: [new UintRange()],
                permanentlyForbiddenTimes: [new UintRange()]
              })
            ],
            canUpdateIncomingApprovals: [
              new UserIncomingApprovalPermission({
                transferTimes: [new UintRange()],
                badgeIds: [new UintRange()],
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
    default:
      return currMsg;
  }
}

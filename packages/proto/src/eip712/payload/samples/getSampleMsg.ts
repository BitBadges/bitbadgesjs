import { AddressMapping } from "../../../proto/badges/address_mappings_pb";
import { MsgCreateAddressMappings, MsgDeleteCollection, MsgTransferBadges, MsgUpdateUserApprovals } from "../../../proto/badges/tx_pb";
import { ApprovalAmounts, ApprovalCriteria, ApprovalIdentifierDetails, CollectionApproval, IncomingApprovalCriteria, IncrementedBalances, ManualBalances, MaxNumTransfers, MerkleChallenge, MerklePathItem, MerkleProof, OutgoingApprovalCriteria, PredeterminedBalances, PredeterminedOrderCalculationMethod, Transfer, UserIncomingApproval, UserOutgoingApproval } from "../../../proto/badges/transfers_pb";
import { Balance, MustOwnBadges, UintRange } from "../../../proto/badges/balances_pb";
import { MsgUpdateCollection } from "../../../proto/badges/tx_pb";
import { ActionPermission, BalancesActionPermission, CollectionApprovalPermission, CollectionPermissions, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UserIncomingApprovalPermission, UserOutgoingApprovalPermission, UserPermissions } from "../../../proto/badges/permissions_pb";
import { BadgeMetadataTimeline, CollectionMetadataTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline, StandardsTimeline } from "../../../proto/badges/timelines_pb";
import { BadgeMetadata, CollectionMetadata, OffChainBalancesMetadata } from "../../../proto/badges/metadata_pb";

//Here, we generate sample JSON Msgs for EIP712 type generation
//These populate ALL optional / empty types with a sample value (e.g. "", [], 0, etc.)
//For primitive types, we don't need to add bc protobuf automatically adds a default value

//Note array types default to string[] so we don't need to include them
//Other primitive arrays (e.g. boolean[]), we will need to include
const approvalCritera = new OutgoingApprovalCriteria({
  mustOwnBadges: [new MustOwnBadges({
    amountRange: new UintRange(),
    badgeIds: [new UintRange()],
    ownershipTimes: [new UintRange()],
  })],
  merkleChallenge: new MerkleChallenge(),
  predeterminedBalances: new PredeterminedBalances({
    manualBalances: [new ManualBalances({
      balances: [new Balance({
        ownershipTimes: [new UintRange()],
        badgeIds: [new UintRange()]
      })]
    })],
    orderCalculationMethod: new PredeterminedOrderCalculationMethod(),
    incrementedBalances: new IncrementedBalances({
      startBalances: [new Balance({
        ownershipTimes: [new UintRange()],
        badgeIds: [new UintRange()]
      })],
    }),
  }),
  approvalAmounts: new ApprovalAmounts(),
  maxNumTransfers: new MaxNumTransfers(),
}).toJson({ emitDefaultValues: true }) as object;

export function getSampleMsg(msgType: string, currMsg: any) {
  switch (msgType) {
    case 'badges/DeleteCollection':
      return { type: msgType, value: new MsgDeleteCollection().toJson({ emitDefaultValues: true }) };
    case 'badges/CreateAddressMappings':
      return {
        type: msgType, value: new MsgCreateAddressMappings({
          addressMappings: [new AddressMapping()]
        }).toJson({ emitDefaultValues: true })
      };
    case 'badges/TransferBadges':
      return {
        type: msgType, value: new MsgTransferBadges({
          transfers: [new Transfer(
            {
              balances: [new Balance({
                ownershipTimes: [new UintRange()],
                badgeIds: [new UintRange()]
              })],
              precalculateBalancesFromApproval: new ApprovalIdentifierDetails(),
              prioritizedApprovals: [new ApprovalIdentifierDetails()],
              merkleProofs: [new MerkleProof(
                {
                  aunts: [new MerklePathItem()]
                }
              )]
            }
          )]
        }).toJson({ emitDefaultValues: true })
      };
    case "badges/UpdateUserApprovals":
      return {
        type: msgType, value: new MsgUpdateUserApprovals({
          outgoingApprovals: [new UserOutgoingApproval({
            transferTimes: [new UintRange()],
            badgeIds: [new UintRange()],
            ownershipTimes: [new UintRange()],
            approvalCriteria: new OutgoingApprovalCriteria({
              ...approvalCritera,
            }),
          })],
          incomingApprovals: [new UserIncomingApproval({
            transferTimes: [new UintRange()],
            badgeIds: [new UintRange()],
            ownershipTimes: [new UintRange()],
            approvalCriteria: new IncomingApprovalCriteria({
              ...approvalCritera,
            }),
          })],
          userPermissions: new UserPermissions({
            canUpdateOutgoingApprovals: [new UserOutgoingApprovalPermission({
              transferTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canUpdateIncomingApprovals: [new UserIncomingApprovalPermission({
              transferTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [new ActionPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [new ActionPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
          }),
        }).toJson({ emitDefaultValues: true })
      };
    case "badges/UpdateCollection":
      return {
        type: msgType, value: new MsgUpdateCollection({
          defaultOutgoingApprovals: [new UserOutgoingApproval({
            transferTimes: [new UintRange()],
            badgeIds: [new UintRange()],
            ownershipTimes: [new UintRange()],
            approvalCriteria: new OutgoingApprovalCriteria({
              ...approvalCritera,
            }),
          })],
          defaultIncomingApprovals: [new UserIncomingApproval({
            transferTimes: [new UintRange()],
            badgeIds: [new UintRange()],
            ownershipTimes: [new UintRange()],
            approvalCriteria: new IncomingApprovalCriteria({
              ...approvalCritera,
            }),
          })],
          defaultUserPermissions: new UserPermissions({
            canUpdateOutgoingApprovals: [new UserOutgoingApprovalPermission({
              transferTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canUpdateIncomingApprovals: [new UserIncomingApprovalPermission({
              transferTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [new ActionPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [new ActionPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
          }),
          badgesToCreate: [new Balance({
            ownershipTimes: [new UintRange()],
            badgeIds: [new UintRange()]
          })],


          managerTimeline: [new ManagerTimeline({
            timelineTimes: [new UintRange()],
          })],
          collectionMetadataTimeline: [new CollectionMetadataTimeline({
            timelineTimes: [new UintRange()],
            collectionMetadata: new CollectionMetadata(),
          })],
          badgeMetadataTimeline: [new BadgeMetadataTimeline({
            timelineTimes: [new UintRange()],
            badgeMetadata: [new BadgeMetadata({
              badgeIds: [new UintRange()],
            })]
          })],
          offChainBalancesMetadataTimeline: [new OffChainBalancesMetadataTimeline({
            timelineTimes: [new UintRange()],
            offChainBalancesMetadata: new OffChainBalancesMetadata(),
          })],
          customDataTimeline: [new CustomDataTimeline({
            timelineTimes: [new UintRange()],
          })],
          standardsTimeline: [new StandardsTimeline({
            timelineTimes: [new UintRange()],
          })],
          isArchivedTimeline: [new IsArchivedTimeline({
            timelineTimes: [new UintRange()],
          })],


          collectionApprovals: [new CollectionApproval({
            transferTimes: [new UintRange()],
            badgeIds: [new UintRange()],
            ownershipTimes: [new UintRange()],
            approvalCriteria: new ApprovalCriteria({
              ...approvalCritera,
            }),
          })],
          collectionPermissions: new CollectionPermissions({
            canDeleteCollection: [new ActionPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
            canArchiveCollection: [new TimedUpdatePermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canUpdateOffChainBalancesMetadata: [new TimedUpdatePermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canUpdateStandards: [new TimedUpdatePermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canUpdateCustomData: [new TimedUpdatePermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canUpdateManager: [new TimedUpdatePermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canUpdateCollectionMetadata: [new TimedUpdatePermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canCreateMoreBadges: [new BalancesActionPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
            })],
            canUpdateBadgeMetadata: [new TimedUpdateWithBadgeIdsPermission({
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              timelineTimes: [new UintRange()],
            })],
            canUpdateCollectionApprovals: [new CollectionApprovalPermission({
              transferTimes: [new UintRange()],
              badgeIds: [new UintRange()],
              ownershipTimes: [new UintRange()],
              permittedTimes: [new UintRange()],
              forbiddenTimes: [new UintRange()],
            })],
          }),
        }).toJson({ emitDefaultValues: true })
      };
    default:
      return currMsg
  }
}

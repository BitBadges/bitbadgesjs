import { NumberType, UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline, UserPermissions, getWrappedIncomingTransfersTimeline, getWrappedOutgoingTransfersTimeline, getWrappedUserPermissions } from "../../../../"
import { APPROVAL_AMOUNTS_TYPES, BALANCE_TYPES, INCOMING_APPROVAL_DETAILS_TYPES, INCREMENTED_BALANCES_TYPES, IS_USER_INCOMING_TRANSFER_ALLOWED_TYPES, IS_USER_OUTGOING_TRANSFER_ALLOWED_TYPES, MANUAL_BALANCES_TYPES, MAX_NUM_TRANSFERS_TYPES, MERKLE_CHALLENGE_TYPES, MUST_OWN_BADGES_TYPES, OUTGOING_APPROVAL_DETAILS_TYPES, PREDETERMINED_BALANCES_TYPES, PREDETERMINED_ORDER_CALCULATION_METHOD_TYPES, UINT_RANGE_TYPES, USER_APPROVED_INCOMING_TRANSFER_COMBINATION_TYPES, USER_APPROVED_INCOMING_TRANSFER_DEFAULT_VALUES_TYPES, USER_APPROVED_INCOMING_TRANSFER_PERMISSION_TYPES, USER_APPROVED_INCOMING_TRANSFER_TIMELINE_TYPES, USER_APPROVED_INCOMING_TRANSFER_TYPES, USER_APPROVED_OUTGOING_TRANSFER_COMBINATION_TYPES, USER_APPROVED_OUTGOING_TRANSFER_DEFAULT_VALUES_TYPES, USER_APPROVED_OUTGOING_TRANSFER_PERMISSION_TYPES, USER_APPROVED_OUTGOING_TRANSFER_TIMELINE_TYPES, USER_APPROVED_OUTGOING_TRANSFER_TYPES, USER_PERMISSIONS_TYPES, VALUE_OPTIONS_TYPES } from "./eip712HelperTypes"

const MsgUpdateUserApprovedTransfersValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: "updateApprovedOutgoingTransfersTimeline", type: "bool" },
  { name: "approvedOutgoingTransfersTimeline", type: "UserApprovedOutgoingTransferTimeline[]" },
  { name: "updateApprovedIncomingTransfersTimeline", type: "bool" },
  { name: "approvedIncomingTransfersTimeline", type: "UserApprovedIncomingTransferTimeline[]" },
  { name: "updateUserPermissions", type: "bool" },
  { name: "userPermissions", type: "UserPermissions" },
]

export const MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES = {
  MsgValue: MsgUpdateUserApprovedTransfersValueType,
  "UserApprovedOutgoingTransferTimeline": USER_APPROVED_OUTGOING_TRANSFER_TIMELINE_TYPES,
  "UserApprovedIncomingTransferTimeline": USER_APPROVED_INCOMING_TRANSFER_TIMELINE_TYPES,
  "UserPermissions": USER_PERMISSIONS_TYPES,
  "UserApprovedOutgoingTransfer": USER_APPROVED_OUTGOING_TRANSFER_TYPES,
  "UserApprovedIncomingTransfer": USER_APPROVED_INCOMING_TRANSFER_TYPES,
  "UserApprovedOutgoingTransferPermission": USER_APPROVED_OUTGOING_TRANSFER_PERMISSION_TYPES,
  "UserApprovedIncomingTransferPermission": USER_APPROVED_INCOMING_TRANSFER_PERMISSION_TYPES,
  "UserApprovedOutgoingTransferDefaultValues": USER_APPROVED_OUTGOING_TRANSFER_DEFAULT_VALUES_TYPES,
  "UserApprovedOutgoingTransferCombination": USER_APPROVED_OUTGOING_TRANSFER_COMBINATION_TYPES,
  "UserApprovedIncomingTransferDefaultValues": USER_APPROVED_INCOMING_TRANSFER_DEFAULT_VALUES_TYPES,
  "UserApprovedIncomingTransferCombination": USER_APPROVED_INCOMING_TRANSFER_COMBINATION_TYPES,
  "Balance": BALANCE_TYPES,
  "UintRange": UINT_RANGE_TYPES,
  "ValueOptions": VALUE_OPTIONS_TYPES,
  "IsUserOutgoingTransferAllowed": IS_USER_OUTGOING_TRANSFER_ALLOWED_TYPES,
  "OutgoingApprovalDetails": OUTGOING_APPROVAL_DETAILS_TYPES,
  "IsUserIncomingTransferAllowed": IS_USER_INCOMING_TRANSFER_ALLOWED_TYPES,
  "IncomingApprovalDetails": INCOMING_APPROVAL_DETAILS_TYPES,
  "MustOwnBadges": MUST_OWN_BADGES_TYPES,
  "MerkleChallenge": MERKLE_CHALLENGE_TYPES,
  "PredeterminedBalances": PREDETERMINED_BALANCES_TYPES,
  "ApprovalAmounts": APPROVAL_AMOUNTS_TYPES,
  "MaxNumTransfers": MAX_NUM_TRANSFERS_TYPES,
  "ManualBalances": MANUAL_BALANCES_TYPES,
  "IncrementedBalances": INCREMENTED_BALANCES_TYPES,
  "PredeterminedOrderCalculationMethod": PREDETERMINED_ORDER_CALCULATION_METHOD_TYPES,
};


export function createEIP712MsgUpdateUserApprovedTransfers<T extends NumberType>(
  creator: string,
  collectionId: T,
  updateApprovedOutgoingTransfersTimeline: boolean,
  approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline<T>[],
  updateApprovedIncomingTransfersTimeline: boolean,
  approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline<T>[],
  updateUserPermissions: boolean,
  userPermissions: UserPermissions<T>,
) {
  return {
    type: 'badges/UpdateUserApprovedTransfers',
    value: {
      creator,
      collectionId: collectionId.toString(),
      updateApprovedOutgoingTransfersTimeline,
      approvedOutgoingTransfersTimeline: getWrappedOutgoingTransfersTimeline(approvedOutgoingTransfersTimeline).map((s) => s.toObject()),
      updateApprovedIncomingTransfersTimeline,
      approvedIncomingTransfersTimeline: getWrappedIncomingTransfersTimeline(approvedIncomingTransfersTimeline).map((s) => s.toObject()),
      updateUserPermissions,
      userPermissions: getWrappedUserPermissions(userPermissions).toObject(),
    },
  }
}

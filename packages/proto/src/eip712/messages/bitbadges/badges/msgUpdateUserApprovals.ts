import { NumberType, Stringify, UserIncomingApproval, UserOutgoingApproval, UserPermissions, convertUserIncomingApproval, convertUserOutgoingApproval, convertUserPermissions } from "../../../..";
import { ACTION_PERMISSION_TYPES, APPROVAL_AMOUNTS_TYPES, BALANCE_TYPES, INCOMING_APPROVAL_DETAILS_TYPES, INCREMENTED_BALANCES_TYPES, MANUAL_BALANCES_TYPES, MAX_NUM_TRANSFERS_TYPES, MERKLE_CHALLENGE_TYPES, MUST_OWN_BADGES_TYPES, OUTGOING_APPROVAL_DETAILS_TYPES, PREDETERMINED_BALANCES_TYPES, PREDETERMINED_ORDER_CALCULATION_METHOD_TYPES, UINT_RANGE_TYPES, USER_APPROVED_INCOMING_TRANSFER_PERMISSION_TYPES, USER_APPROVED_INCOMING_TRANSFER_TYPES, USER_APPROVED_OUTGOING_TRANSFER_PERMISSION_TYPES, USER_APPROVED_OUTGOING_TRANSFER_TYPES, USER_PERMISSIONS_TYPES } from "./eip712HelperTypes";

const MsgUpdateUserApprovalsValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: "updateOutgoingApprovals", type: "bool" },
  { name: "outgoingApprovals", type: "UserOutgoingApproval[]" },
  { name: "updateIncomingApprovals", type: "bool" },
  { name: "incomingApprovals", type: "UserIncomingApproval[]" },
  { name: "updateAutoApproveSelfInitiatedOutgoingTransfers", type: "bool" },
  { name: "autoApproveSelfInitiatedOutgoingTransfers", type: "bool" },
  { name: "updateAutoApproveSelfInitiatedIncomingTransfers", type: "bool" },
  { name: "autoApproveSelfInitiatedIncomingTransfers", type: "bool" },
  { name: "updateUserPermissions", type: "bool" },
  { name: "userPermissions", type: "UserPermissions" },
]

export const MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES = {
  MsgValue: MsgUpdateUserApprovalsValueType,
  "UserPermissions": USER_PERMISSIONS_TYPES,
  "UserOutgoingApproval": USER_APPROVED_OUTGOING_TRANSFER_TYPES,
  "UserIncomingApproval": USER_APPROVED_INCOMING_TRANSFER_TYPES,
  "UserOutgoingApprovalPermission": USER_APPROVED_OUTGOING_TRANSFER_PERMISSION_TYPES,
  "UserIncomingApprovalPermission": USER_APPROVED_INCOMING_TRANSFER_PERMISSION_TYPES,
  "ActionPermission": ACTION_PERMISSION_TYPES,
  "Balance": BALANCE_TYPES,
  "UintRange": UINT_RANGE_TYPES,
  "OutgoingApprovalCriteria": OUTGOING_APPROVAL_DETAILS_TYPES,
  "IncomingApprovalCriteria": INCOMING_APPROVAL_DETAILS_TYPES,
  "MustOwnBadges": MUST_OWN_BADGES_TYPES,
  "MerkleChallenge": MERKLE_CHALLENGE_TYPES,
  "PredeterminedBalances": PREDETERMINED_BALANCES_TYPES,
  "ApprovalAmounts": APPROVAL_AMOUNTS_TYPES,
  "MaxNumTransfers": MAX_NUM_TRANSFERS_TYPES,
  "ManualBalances": MANUAL_BALANCES_TYPES,
  "IncrementedBalances": INCREMENTED_BALANCES_TYPES,
  "PredeterminedOrderCalculationMethod": PREDETERMINED_ORDER_CALCULATION_METHOD_TYPES,

};


export function createEIP712MsgUpdateUserApprovals<T extends NumberType>(
  creator: string,
  collectionId: T,
  updateOutgoingApprovals: boolean,
  outgoingApprovals: UserOutgoingApproval<T>[],
  updateIncomingApprovals: boolean,
  incomingApprovals: UserIncomingApproval<T>[],
  updateAutoApproveSelfInitiatedOutgoingTransfers: boolean,
  autoApproveSelfInitiatedOutgoingTransfers: boolean,
  updateAutoApproveSelfInitiatedIncomingTransfers: boolean,
  autoApproveSelfInitiatedIncomingTransfers: boolean,
  updateUserPermissions: boolean,
  userPermissions: UserPermissions<T>,
) {
  return {
    type: 'badges/UpdateUserApprovals',
    value: {
      creator,
      collectionId: collectionId.toString(),
      updateOutgoingApprovals,
      outgoingApprovals: outgoingApprovals.map((x) => convertUserOutgoingApproval(x, Stringify, true)),
      updateIncomingApprovals,
      incomingApprovals: incomingApprovals.map((x) => convertUserIncomingApproval(x, Stringify, true)),
      updateAutoApproveSelfInitiatedOutgoingTransfers,
      autoApproveSelfInitiatedOutgoingTransfers,
      updateAutoApproveSelfInitiatedIncomingTransfers,
      autoApproveSelfInitiatedIncomingTransfers,
      updateUserPermissions,
      userPermissions: convertUserPermissions(userPermissions, Stringify, true)
    },
  }
}

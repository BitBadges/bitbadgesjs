import type { iUserBalanceStore, iUserBalanceStoreWithDetails } from '@/interfaces/types/userBalances.js';
import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import * as protobadges from '@/proto/badges/transfers_pb.js';
import { UserBalanceStore as ProtoUserBalanceStore } from '@/proto/badges/user_balance_store_pb.js';
import { UserIncomingApproval as ProtoUserIncomingApproval, UserOutgoingApproval as ProtoUserOutgoingApproval } from '@/proto/badges/approvals_pb.js';
import { UserIncomingApproval, UserIncomingApprovalWithDetails, UserOutgoingApproval, UserOutgoingApprovalWithDetails } from './approvals.js';
import { UserPermissions, UserPermissionsWithDetails } from './permissions.js';
import type { NumberType } from '../common/string-numbers.js';
import { Stringify } from '../common/string-numbers.js';
import { BalanceArray, Balance } from './balances.js';

/**
 * @category Balances
 */
export class UserBalanceStore extends BaseNumberTypeClass<UserBalanceStore> implements iUserBalanceStore {
  balances: BalanceArray;
  incomingApprovals: UserIncomingApproval[];
  outgoingApprovals: UserOutgoingApproval[];
  userPermissions: UserPermissions;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveAllIncomingTransfers: boolean;

  constructor(data: iUserBalanceStore) {
    super();
    this.balances = BalanceArray.From(data.balances);
    this.incomingApprovals = data.incomingApprovals.map((x) => new UserIncomingApproval(x));
    this.outgoingApprovals = data.outgoingApprovals.map((x) => new UserOutgoingApproval(x));
    this.userPermissions = new UserPermissions(data.userPermissions);
    this.autoApproveSelfInitiatedOutgoingTransfers = data.autoApproveSelfInitiatedOutgoingTransfers;
    this.autoApproveSelfInitiatedIncomingTransfers = data.autoApproveSelfInitiatedIncomingTransfers;
    this.autoApproveAllIncomingTransfers = data.autoApproveAllIncomingTransfers;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserBalanceStore {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserBalanceStore;
  }

  toProto() {
    return new ProtoUserBalanceStore(this.convert(Stringify));
  }

  static fromProto(item: ProtoUserBalanceStore, convertFunction: (item: string | number) => T): UserBalanceStore {
    return new UserBalanceStore({
      balances: item.balances.map((x) => Balance.fromProto(x, convertFunction)),
      incomingApprovals: item.incomingApprovals.map((x: ProtoUserIncomingApproval) => UserIncomingApproval.fromProto(x, convertFunction)),
      outgoingApprovals: item.outgoingApprovals.map((x: ProtoUserOutgoingApproval) => UserOutgoingApproval.fromProto(x, convertFunction)),
      userPermissions: item.userPermissions
        ? UserPermissions.fromProto(item.userPermissions, convertFunction)
        : new UserPermissions({
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: [],
            canUpdateAutoApproveAllIncomingTransfers: []
          }),
      autoApproveSelfInitiatedOutgoingTransfers: item.autoApproveSelfInitiatedOutgoingTransfers,
      autoApproveSelfInitiatedIncomingTransfers: item.autoApproveSelfInitiatedIncomingTransfers,
      autoApproveAllIncomingTransfers: item.autoApproveAllIncomingTransfers
    });
  }

  toBech32Addresses(prefix: string): UserBalanceStore {
    return new UserBalanceStore({
      ...this,
      incomingApprovals: this.incomingApprovals.map((x) => x.toBech32Addresses(prefix)),
      outgoingApprovals: this.outgoingApprovals.map((x) => x.toBech32Addresses(prefix)),
      userPermissions: this.userPermissions.toBech32Addresses(prefix)
    });
  }
}

/**
 * @category Balances
 */
export class UserBalanceStoreWithDetails extends UserBalanceStore implements iUserBalanceStoreWithDetails, CustomType<UserBalanceStoreWithDetails> {
  outgoingApprovals: UserOutgoingApprovalWithDetails[];
  incomingApprovals: UserIncomingApprovalWithDetails[];
  userPermissions: UserPermissionsWithDetails;

  constructor(data: iUserBalanceStoreWithDetails) {
    super(data);
    this.outgoingApprovals = data.outgoingApprovals.map((x) => new UserOutgoingApprovalWithDetails(x));
    this.incomingApprovals = data.incomingApprovals.map((x) => new UserIncomingApprovalWithDetails(x));
    this.userPermissions = new UserPermissionsWithDetails(data.userPermissions);
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserBalanceStoreWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserBalanceStoreWithDetails;
  }

  clone(): UserBalanceStoreWithDetails {
    return super.clone() as UserBalanceStoreWithDetails;
  }
}

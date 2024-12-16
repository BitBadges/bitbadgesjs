import type { iUserBalanceStore, iUserBalanceStoreWithDetails } from '@/interfaces/badges/userBalances.js';
import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import * as badges from '@/proto/badges/transfers_pb.js';
import { UserIncomingApproval, UserIncomingApprovalWithDetails, UserOutgoingApproval, UserOutgoingApprovalWithDetails } from './approvals.js';
import { UserPermissions, UserPermissionsWithDetails } from './permissions.js';
import type { NumberType } from '../common/string-numbers.js';
import { Stringify } from '../common/string-numbers.js';
import { BalanceArray, Balance } from './balances.js';

/**
 * @category Balances
 */
export class UserBalanceStore<T extends NumberType> extends BaseNumberTypeClass<UserBalanceStore<T>> implements iUserBalanceStore<T> {
  balances: BalanceArray<T>;
  incomingApprovals: UserIncomingApproval<T>[];
  outgoingApprovals: UserOutgoingApproval<T>[];
  userPermissions: UserPermissions<T>;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;

  constructor(data: iUserBalanceStore<T>) {
    super();
    this.balances = BalanceArray.From(data.balances);
    this.incomingApprovals = data.incomingApprovals.map((x) => new UserIncomingApproval(x));
    this.outgoingApprovals = data.outgoingApprovals.map((x) => new UserOutgoingApproval(x));
    this.userPermissions = new UserPermissions(data.userPermissions);
    this.autoApproveSelfInitiatedOutgoingTransfers = data.autoApproveSelfInitiatedOutgoingTransfers;
    this.autoApproveSelfInitiatedIncomingTransfers = data.autoApproveSelfInitiatedIncomingTransfers;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserBalanceStore<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserBalanceStore<U>;
  }

  toProto() {
    return new badges.UserBalanceStore(this.convert(Stringify));
  }

  static fromProto<T extends NumberType>(item: badges.UserBalanceStore, convertFunction: (item: NumberType) => T): UserBalanceStore<T> {
    return new UserBalanceStore({
      balances: item.balances.map((x) => Balance.fromProto(x, convertFunction)),
      incomingApprovals: item.incomingApprovals.map((x) => UserIncomingApproval.fromProto(x, convertFunction)),
      outgoingApprovals: item.outgoingApprovals.map((x) => UserOutgoingApproval.fromProto(x, convertFunction)),
      userPermissions: item.userPermissions
        ? UserPermissions.fromProto(item.userPermissions, convertFunction)
        : new UserPermissions({
            canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
            canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
            canUpdateIncomingApprovals: [],
            canUpdateOutgoingApprovals: []
          }),
      autoApproveSelfInitiatedOutgoingTransfers: item.autoApproveSelfInitiatedOutgoingTransfers,
      autoApproveSelfInitiatedIncomingTransfers: item.autoApproveSelfInitiatedIncomingTransfers
    });
  }
}

/**
 * @category Balances
 */
export class UserBalanceStoreWithDetails<T extends NumberType>
  extends UserBalanceStore<T>
  implements iUserBalanceStoreWithDetails<T>, CustomType<UserBalanceStoreWithDetails<T>>
{
  outgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: UserIncomingApprovalWithDetails<T>[];
  userPermissions: UserPermissionsWithDetails<T>;

  constructor(data: iUserBalanceStoreWithDetails<T>) {
    super(data);
    this.outgoingApprovals = data.outgoingApprovals.map((x) => new UserOutgoingApprovalWithDetails(x));
    this.incomingApprovals = data.incomingApprovals.map((x) => new UserIncomingApprovalWithDetails(x));
    this.userPermissions = new UserPermissionsWithDetails(data.userPermissions);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserBalanceStoreWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserBalanceStoreWithDetails<U>;
  }

  clone(): UserBalanceStoreWithDetails<T> {
    return super.clone() as UserBalanceStoreWithDetails<T>;
  }
}

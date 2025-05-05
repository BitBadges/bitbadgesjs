import type { iUserOutgoingApprovalWithDetails } from '@/core/approvals.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iUserIncomingApproval, iUserOutgoingApproval, iUserIncomingApprovalWithDetails } from './approvals.js';
import type { iUserPermissions, iUserPermissionsWithDetails } from './permissions.js';
import type { iBalance } from './core.js';

/**
 * This stores everythign about a user's balances for a specific collection ID.
 * This includes their balances, incoming approvals, outgoing approvals, and permissions.
 *
 * @category Interfaces
 */
export interface iUserBalanceStore<T extends NumberType> {
  /** The user's balances. */
  balances: iBalance<T>[];
  /** The user's incoming approvals. */
  incomingApprovals: iUserIncomingApproval<T>[];
  /** The user's outgoing approvals. */
  outgoingApprovals: iUserOutgoingApproval<T>[];
  /** The user's permissions. */
  userPermissions: iUserPermissions<T>;
  /** Whether the user's self-initiated outgoing transfers are auto-approved. If not, they must be explicitly approved using the outgoing approvals. */
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  /** Whether the user's self-initiated incoming transfers are auto-approved. If not, they must be explicitly approved using the incoming approvals. */
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  /** Whether the user's all incoming transfers are auto-approved. If not, they must be explicitly approved using the incoming approvals. */
  autoApproveAllIncomingTransfers: boolean;
}

/**
 * @inheritDoc iUserBalanceStore
 * @category Interfaces
 */
export interface iUserBalanceStoreWithDetails<T extends NumberType> extends iUserBalanceStore<T> {
  outgoingApprovals: iUserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: iUserIncomingApprovalWithDetails<T>[];
  userPermissions: iUserPermissionsWithDetails<T>;
  balances: iBalance<T>[];
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveAllIncomingTransfers: boolean;
}

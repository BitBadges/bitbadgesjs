import { inspectSpendableCredit } from './spendable-credits.js';
import { isAddressValid } from '../address-converter/converter.js';
import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { inspectSmartTokenCollection } from './smart-tokens.js';
import { doesCollectionFollowCreditTokenProtocol, extractCreditTokenTiers } from './credit-tokens.js';
import { BURN_ADDRESS } from './builders/shared.js';

export type InspectableStandard = 'smart-token' | 'credit-token' | 'address-list' | 'spendable-credit';
export type StandardInspection = {
  recognized: boolean;
  configurationSupported: boolean;
  actions: Record<string, { approvalIds: string[]; requiresSelection: boolean }>;
  issues: string[];
  warnings: string[];
  eligibility: 'not-checked';
  authority: { manager: string; approvalUpdates: 'not-evaluated'; overrideApprovalIds: string[] };
};
const max = '18446744073709551615';
const range = (values: any, end: string) =>
  Array.isArray(values) && values.length === 1 && String(values[0]?.start) === '1' && String(values[0]?.end) === end;
const active = (value: any): boolean => {
  if (value === undefined || value === null || value === false || value === '' || value === '0' || value === 0 || value === 0n) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(active);
  return true;
};

/** A bounded consumer profile check. It does not certify collection-wide safety or prove execution eligibility. */
export function inspectStandardCollection(collection: Readonly<iCollectionDoc<bigint>>, family: InspectableStandard): StandardInspection {
  if (family === 'smart-token') return inspectSmartTokenCollection(collection);
  if (family === 'spendable-credit') {
    const recognized = !!collection.standards?.includes('Spendable Credit');
    const issues: string[] = [];
    const actions: StandardInspection['actions'] = {};
    try {
      const config = inspectSpendableCredit(collection);
      const approvalIds = config.purchaseOptions.map((option) => option.approvalId);
      actions.quote = { approvalIds, requiresSelection: approvalIds.length > 1 };
      actions.purchase = { ...actions.quote };
      actions.consume = { approvalIds: [config.consume.approvalId], requiresSelection: false };
    } catch (error) {
      issues.push(error instanceof Error ? error.message : 'Unsupported spendable credit configuration');
    }
    return {
      recognized,
      configurationSupported: issues.length === 0,
      actions,
      issues,
      warnings: [
        'Live balance, expiry, account approvals and fees require separate review. Service requires authenticated durable receipt acceptance; a balance alone does not authorize delivery.'
      ],
      eligibility: 'not-checked',
      authority: {
        manager: String(collection.manager ?? ''),
        approvalUpdates: 'not-evaluated',
        overrideApprovalIds: (collection.collectionApprovals ?? [])
          .filter((a) => a.approvalCriteria?.overridesFromOutgoingApprovals || a.approvalCriteria?.overridesToIncomingApprovals)
          .map((a) => a.approvalId)
      }
    };
  }

  const recognized =
    family === 'credit-token' ? doesCollectionFollowCreditTokenProtocol(collection) : !!collection.standards?.includes('Address List');
  const issues: string[] = recognized ? [] : [`Missing recognized ${family} standard`];
  const warnings = ['Manager permissions, account approvals, fees and live tracker capacity require separate review before execution'];
  const actions: StandardInspection['actions'] = {};
  const approvals = collection.collectionApprovals ?? [];
  if (collection.isArchived) issues.push('Collection is archived');
  const identities = approvals.map((a) => a.approvalId);
  if (new Set(identities).size !== identities.length) issues.push('Duplicate approval identities are unsupported');
  if (!range(collection.validTokenIds, '1')) issues.push('The supported profile uses only token 1');
  if (family === 'credit-token') {
    const candidates: string[] = [];
    for (const approval of approvals) {
      if (!approval.approvalId?.startsWith('credit-')) {
        warnings.push(`Additional approval ${approval.approvalId} is outside the credit purchase profile; non-transferability is not certified`);
        continue;
      }
      try {
        const tier = extractCreditTokenTiers([approval])[0];
        const criteria = approval.approvalCriteria;
        if (
          !tier ||
          tier.paymentAmount <= 0n ||
          tier.mintAmount <= 0n ||
          !tier.paymentDenom ||
          !isAddressValid(tier.recipient) ||
          !range(approval.tokenIds, '1') ||
          !range(approval.ownershipTimes, max) ||
          !approval.toListId ||
          !approval.initiatedByListId ||
          active(criteria?.merkleChallenges) ||
          active(criteria?.ethSignatureChallenges) ||
          active(criteria?.userApprovalSettings)
        ) {
          issues.push(`Approval ${approval.approvalId} has unsupported purchase terms`);
          continue;
        }
        candidates.push(tier.approvalId);
      } catch {
        issues.push(`Approval ${approval.approvalId} has malformed purchase terms`);
      }
    }
    if (!candidates.length) issues.push('No supported credit purchase approvals');
    actions.quote = { approvalIds: candidates, requiresSelection: candidates.length > 1 };
    actions.purchase = { ...actions.quote };
    warnings.push('Credits purchased on chain do not prove remaining service usage; consumption is tracked separately');
  } else {
    const add = approvals.filter((a) => a.approvalId === 'manager-add');
    const remove = approvals.filter((a) => a.approvalId === 'manager-remove');
    if (approvals.length !== 2 || add.length !== 1 || remove.length !== 1)
      issues.push('Expected exactly one manager-add and one manager-remove approval');
    const manager = add[0]?.initiatedByListId;
    if (!manager || !isAddressValid(manager) || manager !== remove[0]?.initiatedByListId) {
      issues.push('Add and remove must use the same explicit manager authority');
    }
    if (collection.manager && collection.manager !== manager) issues.push('Current collection manager differs from membership approval authority');
    for (const approval of approvals) {
      const criteria = approval.approvalCriteria;
      const isAdd = approval.approvalId === 'manager-add';
      const expectedFrom = isAdd ? 'Mint' : '!Mint';
      const expectedTo = isAdd ? 'All' : BURN_ADDRESS;
      const unexpected = Object.entries(criteria ?? {}).some(
        ([key, value]) => !['overridesFromOutgoingApprovals', 'overridesToIncomingApprovals', 'mustPrioritize'].includes(key) && active(value)
      );
      if (
        approval.fromListId !== expectedFrom ||
        approval.toListId !== expectedTo ||
        !range(approval.tokenIds, '1') ||
        !range(approval.ownershipTimes, max) ||
        !range(approval.transferTimes, max) ||
        !criteria?.overridesFromOutgoingApprovals ||
        criteria.overridesToIncomingApprovals ||
        unexpected
      )
        issues.push(`Approval ${approval.approvalId} has custom membership semantics`);
    }
    actions.add = { approvalIds: add.map((a) => a.approvalId), requiresSelection: false };
    actions.remove = { approvalIds: remove.map((a) => a.approvalId), requiresSelection: false };
    if (!collection.invariants?.noCustomOwnershipTimes) issues.push('Membership requires noCustomOwnershipTimes');
    warnings.push('The manager can issue and revoke membership; this inspection does not establish current membership balances');
  }
  if (issues.length)
    for (const action of Object.values(actions)) {
      action.approvalIds = [];
      action.requiresSelection = false;
    }
  return {
    recognized,
    configurationSupported: issues.length === 0,
    actions,
    issues,
    warnings,
    eligibility: 'not-checked',
    authority: {
      manager: String(collection.manager ?? ''),
      approvalUpdates: 'not-evaluated',
      overrideApprovalIds: approvals
        .filter((a) => a.approvalCriteria?.overridesFromOutgoingApprovals || a.approvalCriteria?.overridesToIncomingApprovals)
        .map((a) => a.approvalId)
    }
  };
}

/**
 * Transaction validation utilities for BitBadges.
 *
 * Pure validation logic extracted from the builder validate_transaction tool.
 * No Zod schemas, no tool definitions, no response formatting.
 *
 * @module
 */

import { AddressList } from './addressLists.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * All required collectionPermissions fields.
 * The frontend SDK constructor calls .map() on every field, so missing fields crash.
 */
const REQUIRED_COLLECTION_PERMISSION_FIELDS = [
  'canDeleteCollection',
  'canArchiveCollection',
  'canUpdateStandards',
  'canUpdateCustomData',
  'canUpdateManager',
  'canUpdateCollectionMetadata',
  'canUpdateValidTokenIds',
  'canUpdateTokenMetadata',
  'canUpdateCollectionApprovals',
  'canAddMoreAliasPaths',
  'canAddMoreCosmosCoinWrapperPaths'
];

/**
 * All required defaultBalances fields.
 * The frontend SDK constructor calls .map() on array fields, so missing fields crash.
 */
const REQUIRED_DEFAULT_BALANCES_FIELDS = ['balances', 'outgoingApprovals', 'incomingApprovals'];

/**
 * All required collectionApproval fields per entry.
 */
const REQUIRED_APPROVAL_FIELDS = ['fromListId', 'toListId', 'initiatedByListId', 'approvalId', 'tokenIds', 'transferTimes', 'ownershipTimes', 'version'];

// ---------------------------------------------------------------------------
// Helper validators
// ---------------------------------------------------------------------------

/**
 * Check if a value is a valid list ID using the SDK's reserved list parser.
 * Handles all composite formats: bb1..., !bb1..., Mint:bb1..., !Mint:bb1...,
 * All, !Mint, AllWithout..., !(addr:addr), etc.
 */
export function isValidListId(id: string): boolean {
  try {
    AddressList.getReservedAddressList(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively check for non-string numbers in an object.
 * Skips claimConfig subtrees — claim plugin params legitimately use JS numbers.
 */
export function checkNumbersAreStrings(obj: unknown, path: string, issues: ValidationIssue[]): void {
  if (obj === null || obj === undefined) {
    return;
  }

  if (typeof obj === 'number') {
    issues.push({
      severity: 'error',
      message: `Number value found where string expected. Use "${obj}" instead of ${obj}`,
      path
    });
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      checkNumbersAreStrings(item, `${path}[${index}]`, issues);
    });
    return;
  }

  if (typeof obj === 'object') {
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      // Skip claimConfig subtrees — plugin params (maxUses, numCodes, maxUsesPerAddress) are legitimately JS numbers
      if (key === 'claimConfig') return;
      checkNumbersAreStrings(value, `${path}.${key}`, issues);
    });
  }
}

/**
 * Check UintRange format — must have string `start` and `end` fields.
 */
export function checkUintRangeFormat(obj: unknown, path: string, issues: ValidationIssue[]): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  const range = obj as Record<string, unknown>;

  // Check if it looks like a UintRange (has start or end)
  if ('start' in range || 'end' in range) {
    if (!('start' in range)) {
      issues.push({
        severity: 'error',
        message: 'UintRange missing "start" field',
        path
      });
    } else if (typeof range.start !== 'string') {
      issues.push({
        severity: 'error',
        message: `UintRange "start" must be a string, got ${typeof range.start}`,
        path: `${path}.start`
      });
    }

    if (!('end' in range)) {
      issues.push({
        severity: 'error',
        message: 'UintRange missing "end" field',
        path
      });
    } else if (typeof range.end !== 'string') {
      issues.push({
        severity: 'error',
        message: `UintRange "end" must be a string, got ${typeof range.end}`,
        path: `${path}.end`
      });
    }
  }
}

/**
 * Recursively find and validate UintRanges throughout a transaction object.
 */
export function findAndValidateUintRanges(obj: unknown, path: string, issues: ValidationIssue[]): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findAndValidateUintRanges(item, `${path}[${index}]`, issues);
    });
    return;
  }

  const record = obj as Record<string, unknown>;

  // Check if this looks like a UintRange
  checkUintRangeFormat(obj, path, issues);

  // Recurse into nested objects (skip claimConfig — not protobuf, different schema)
  Object.entries(record).forEach(([key, value]) => {
    if (key === 'claimConfig') return;
    findAndValidateUintRanges(value, `${path}.${key}`, issues);
  });
}

/**
 * Validate orderCalculationMethod has exactly one true value.
 */
export function validateOrderCalculationMethod(orderCalc: Record<string, unknown>, path: string, issues: ValidationIssue[]): void {
  const methods = [
    'useOverallNumTransfers',
    'usePerToAddressNumTransfers',
    'usePerFromAddressNumTransfers',
    'usePerInitiatedByAddressNumTransfers',
    'useMerkleChallengeLeafIndex'
  ];

  const trueCount = methods.filter((m) => orderCalc[m] === true).length;

  if (trueCount > 1) {
    issues.push({
      severity: 'error',
      message: 'orderCalculationMethod MUST have exactly ONE method set to true, found ' + trueCount,
      path
    });
  } else if (trueCount === 0) {
    // Only warn if any incrementedBalances.startBalances are defined
    issues.push({
      severity: 'warning',
      message: 'orderCalculationMethod should have exactly ONE method set to true (default: useOverallNumTransfers)',
      path
    });
  }
}

/**
 * Validate subscription-specific requirements on an approval.
 */
export function validateSubscriptionApproval(approval: Record<string, unknown>, path: string, issues: ValidationIssue[]): void {
  const criteria = approval.approvalCriteria as Record<string, unknown> | undefined;
  if (!criteria) return;

  // Check coinTransfers override flags
  if (Array.isArray(criteria.coinTransfers)) {
    (criteria.coinTransfers as unknown[]).forEach((ct, ctIndex) => {
      if (!ct || typeof ct !== 'object') return;
      const coinTransfer = ct as Record<string, unknown>;

      if (coinTransfer.overrideFromWithApproverAddress === true) {
        issues.push({
          severity: 'warning',
          message: 'Subscription coinTransfers should have overrideFromWithApproverAddress: false',
          path: `${path}.approvalCriteria.coinTransfers[${ctIndex}].overrideFromWithApproverAddress`
        });
      }
      if (coinTransfer.overrideToWithInitiator === true) {
        issues.push({
          severity: 'warning',
          message: 'Subscription coinTransfers should have overrideToWithInitiator: false',
          path: `${path}.approvalCriteria.coinTransfers[${ctIndex}].overrideToWithInitiator`
        });
      }
    });
  }

  // Check predeterminedBalances.incrementedBalances requirements
  const predeterminedBalances = criteria.predeterminedBalances as Record<string, unknown> | undefined;
  if (predeterminedBalances) {
    const incrementedBalances = predeterminedBalances.incrementedBalances as Record<string, unknown> | undefined;
    if (incrementedBalances) {
      // Check durationFromTimestamp is non-zero
      if (incrementedBalances.durationFromTimestamp === '0' || incrementedBalances.durationFromTimestamp === 0) {
        issues.push({
          severity: 'warning',
          message: 'Subscription durationFromTimestamp should be non-zero (subscription duration in ms)',
          path: `${path}.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp`
        });
      }

      // Check allowOverrideTimestamp is true
      if (incrementedBalances.allowOverrideTimestamp !== true) {
        issues.push({
          severity: 'warning',
          message: 'Subscription allowOverrideTimestamp should be true',
          path: `${path}.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp`
        });
      }
    }

    // Check orderCalculationMethod
    const orderCalc = predeterminedBalances.orderCalculationMethod as Record<string, unknown> | undefined;
    if (orderCalc) {
      validateOrderCalculationMethod(orderCalc, `${path}.approvalCriteria.predeterminedBalances.orderCalculationMethod`, issues);
    }
  }
}

/**
 * Validate approvals array — list IDs, Mint rules, backing address rules, required fields.
 */
export function validateApprovals(approvals: unknown[], path: string, issues: ValidationIssue[], standards?: string[]): void {
  const isSubscription = Array.isArray(standards) && standards.includes('Subscriptions');

  approvals.forEach((approval, index) => {
    if (!approval || typeof approval !== 'object') {
      return;
    }

    const a = approval as Record<string, unknown>;
    const approvalPath = `${path}[${index}]`;

    // Check list IDs
    (['fromListId', 'toListId', 'initiatedByListId'] as const).forEach((field) => {
      if (field in a && typeof a[field] === 'string') {
        if (!isValidListId(a[field] as string)) {
          issues.push({
            severity: 'error',
            message: `Invalid list ID: "${a[field]}". Use only reserved IDs (All, Mint, !Mint, Total) or bb1... addresses`,
            path: `${approvalPath}.${field}`
          });
        }
      }
    });

    // "Mint" must only appear in fromListId — it is the minting source, not a destination or initiator.
    if (typeof a.toListId === 'string' && (a.toListId === 'Mint' || (a.toListId as string).includes('Mint'))) {
      issues.push({
        severity: 'error',
        message: `toListId cannot be "Mint". "Mint" is only valid as a fromListId (minting source). To burn tokens, use fromListId: "!Mint" and toListId: "bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv" (the zero/burn address, 41 chars).`,
        path: `${approvalPath}.toListId`
      });
    }
    if (typeof a.initiatedByListId === 'string' && (a.initiatedByListId === 'Mint' || (a.initiatedByListId as string).includes('Mint'))) {
      issues.push({
        severity: 'error',
        message: `initiatedByListId cannot be "Mint". "Mint" is only valid as a fromListId (minting source).`,
        path: `${approvalPath}.initiatedByListId`
      });
    }

    // Check Mint approval override
    if (a.fromListId === 'Mint') {
      const criteria = a.approvalCriteria as Record<string, unknown> | undefined;
      if (criteria && criteria.overridesFromOutgoingApprovals !== true) {
        issues.push({
          severity: 'error',
          message: 'Mint approvals MUST have overridesFromOutgoingApprovals: true',
          path: `${approvalPath}.approvalCriteria.overridesFromOutgoingApprovals`
        });
      }

      // Subscription-specific validations
      if (isSubscription) {
        validateSubscriptionApproval(a, approvalPath, issues);
      }
    }

    // Check backing address approvals should NOT have overridesFromOutgoingApprovals: true
    if (typeof a.fromListId === 'string' && (a.fromListId as string).startsWith('bb1') && !(a.fromListId as string).includes('Mint')) {
      const criteria = a.approvalCriteria as Record<string, unknown> | undefined;
      if (criteria && criteria.overridesFromOutgoingApprovals === true && criteria.allowBackedMinting === true) {
        issues.push({
          severity: 'warning',
          message: 'Backing address approvals should NOT have overridesFromOutgoingApprovals: true',
          path: `${approvalPath}.approvalCriteria.overridesFromOutgoingApprovals`
        });
      }
    }

    // Check approvalId exists
    if (!a.approvalId || typeof a.approvalId !== 'string') {
      issues.push({
        severity: 'error',
        message: 'Approval missing required "approvalId" field',
        path: approvalPath
      });
    }
  });
}

/**
 * Validate tokenMetadata entries have tokenIds.
 */
export function validateTokenMetadata(metadata: unknown[], path: string, issues: ValidationIssue[]): void {
  metadata.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const m = entry as Record<string, unknown>;
    const entryPath = `${path}[${index}]`;

    if (!('tokenIds' in m) || !Array.isArray(m.tokenIds) || m.tokenIds.length === 0) {
      issues.push({
        severity: 'error',
        message: 'tokenMetadata entry MUST include tokenIds field with UintRange array',
        path: entryPath
      });
    }
  });
}

/**
 * Validate collection permissions — required fields, TokenIdsActionPermission types, list IDs.
 */
export function validatePermissions(permissions: unknown, path: string, issues: ValidationIssue[]): void {
  if (!permissions || typeof permissions !== 'object') {
    return;
  }

  const p = permissions as Record<string, unknown>;

  // Check all required permission fields exist as arrays
  for (const field of REQUIRED_COLLECTION_PERMISSION_FIELDS) {
    if (!(field in p)) {
      issues.push({
        severity: 'error',
        message: `collectionPermissions missing required field "${field}". Must be an array (use [] for neutral). The SDK constructor will crash without it.`,
        path: `${path}.${field}`
      });
    } else if (!Array.isArray(p[field])) {
      issues.push({
        severity: 'error',
        message: `collectionPermissions.${field} must be an array, got ${typeof p[field]}`,
        path: `${path}.${field}`
      });
    }
  }

  // Check TokenIdsActionPermission types have tokenIds
  ['canUpdateValidTokenIds', 'canUpdateTokenMetadata'].forEach((field) => {
    if (field in p && Array.isArray(p[field])) {
      (p[field] as unknown[]).forEach((perm, index) => {
        if (!perm || typeof perm !== 'object') return;
        const permObj = perm as Record<string, unknown>;

        // Only check if both time arrays are not empty (otherwise it's meant to be empty array)
        const hasTimes =
          (Array.isArray(permObj.permanentlyPermittedTimes) && permObj.permanentlyPermittedTimes.length > 0) ||
          (Array.isArray(permObj.permanentlyForbiddenTimes) && permObj.permanentlyForbiddenTimes.length > 0);

        if (hasTimes && !('tokenIds' in permObj)) {
          issues.push({
            severity: 'error',
            message: `${field} permission MUST include tokenIds field`,
            path: `${path}.${field}[${index}]`
          });
        }
      });
    }
  });

  // Check canUpdateCollectionApprovals entries have valid address list IDs
  if ('canUpdateCollectionApprovals' in p && Array.isArray(p.canUpdateCollectionApprovals)) {
    (p.canUpdateCollectionApprovals as unknown[]).forEach((perm, index) => {
      if (!perm || typeof perm !== 'object') return;
      const permObj = perm as Record<string, unknown>;

      // Only check if the permission has time arrays set (not an empty placeholder)
      const hasTimes =
        (Array.isArray(permObj.permanentlyPermittedTimes) && permObj.permanentlyPermittedTimes.length > 0) ||
        (Array.isArray(permObj.permanentlyForbiddenTimes) && permObj.permanentlyForbiddenTimes.length > 0);

      if (hasTimes) {
        (['fromListId', 'toListId', 'initiatedByListId'] as const).forEach((field) => {
          const val = permObj[field];
          if (!val || typeof val !== 'string') {
            issues.push({
              severity: 'error',
              message: `canUpdateCollectionApprovals[${index}] MUST include ${field} (e.g. "All", "Mint", "AllWithMint")`,
              path: `${path}.canUpdateCollectionApprovals[${index}].${field}`
            });
          } else if (!isValidListId(val)) {
            issues.push({
              severity: 'error',
              message: `canUpdateCollectionApprovals[${index}].${field} has invalid list ID: "${val}". Use reserved IDs (All, Mint, AllWithMint, AllWithout:addr, None) or bb1... addresses`,
              path: `${path}.canUpdateCollectionApprovals[${index}].${field}`
            });
          }
        });
      }
    });
  }

  // Check for empty permission arrays that should be [] instead of [{...}]
  Object.entries(p).forEach(([field, value]) => {
    if (Array.isArray(value) && value.length === 1) {
      const perm = value[0] as Record<string, unknown>;
      if (
        perm &&
        Array.isArray(perm.permanentlyPermittedTimes) &&
        perm.permanentlyPermittedTimes.length === 0 &&
        Array.isArray(perm.permanentlyForbiddenTimes) &&
        perm.permanentlyForbiddenTimes.length === 0
      ) {
        issues.push({
          severity: 'warning',
          message: `Permission "${field}" has both time arrays empty - should be [] instead of full object`,
          path: `${path}.${field}`
        });
      }
    }
  });
}

/**
 * Validate approval criteria constraints: merkle challenge limits, plugin requirements, caps.
 */
export function validateApprovalCriteria(approvals: unknown[], path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(approvals)) return;
  approvals.forEach((approval, index) => {
    if (!approval || typeof approval !== 'object') return;
    const a = approval as Record<string, unknown>;
    const criteria = a.approvalCriteria as Record<string, unknown> | undefined;
    if (!criteria) return;
    const approvalPath = `${path}[${index}]`;

    // merkleChallenges max 1 per approval
    if (Array.isArray(criteria.merkleChallenges) && (criteria.merkleChallenges as unknown[]).length > 1) {
      issues.push({
        severity: 'error',
        message: `Each approval supports at most 1 merkleChallenge. Found ${(criteria.merkleChallenges as unknown[]).length}.`,
        path: `${approvalPath}.approvalCriteria.merkleChallenges`
      });
    }

    // Validate claimConfig plugins inside merkleChallenges
    if (Array.isArray(criteria.merkleChallenges)) {
      (criteria.merkleChallenges as unknown[]).forEach((mc, mcIdx) => {
        if (!mc || typeof mc !== 'object') return;
        const challenge = mc as Record<string, unknown>;
        const claimConfig = challenge.claimConfig as Record<string, unknown> | undefined;
        if (!claimConfig) return;
        const plugins = claimConfig.plugins;
        if (!Array.isArray(plugins)) return;

        // numUses plugin required for claims
        const hasNumUses = (plugins as any[]).some((p: any) => p?.pluginId === 'numUses');
        if (!hasNumUses) {
          issues.push({
            severity: 'error',
            message: 'Claims require a numUses plugin. Add { pluginId: "numUses", publicParams: { maxUses: N } }.',
            path: `${approvalPath}.approvalCriteria.merkleChallenges[${mcIdx}].claimConfig.plugins`
          });
        }

        // maxUses/numCodes cap at 50,000
        (plugins as any[]).forEach((p: any) => {
          if (p?.pluginId === 'numUses' && p?.publicParams?.maxUses > 50000) {
            issues.push({
              severity: 'error',
              message: `numUses maxUses (${p.publicParams.maxUses}) exceeds 50,000 limit.`,
              path: `${approvalPath}.approvalCriteria.merkleChallenges[${mcIdx}].claimConfig.plugins[numUses].maxUses`
            });
          }
          if (p?.pluginId === 'codes' && p?.publicParams?.numCodes > 50000) {
            issues.push({
              severity: 'error',
              message: `codes numCodes (${p.publicParams.numCodes}) exceeds 50,000 limit.`,
              path: `${approvalPath}.approvalCriteria.merkleChallenges[${mcIdx}].claimConfig.plugins[codes].numCodes`
            });
          }
        });
      });
    }

    // Sync check: off-chain numUses must match on-chain maxNumTransfers
    if (Array.isArray(criteria.merkleChallenges) && (criteria.merkleChallenges as unknown[]).length > 0) {
      // Find numUses maxUses from the first claimConfig
      const firstMc = (criteria.merkleChallenges as any[])[0];
      const claimPlugins = firstMc?.claimConfig?.plugins;
      if (Array.isArray(claimPlugins)) {
        const numUsesP = (claimPlugins as any[]).find((p: any) => p?.pluginId === 'numUses');
        const offChainMaxUses = numUsesP?.publicParams?.maxUses;
        if (offChainMaxUses != null && offChainMaxUses > 0) {
          const mnt = criteria.maxNumTransfers as Record<string, unknown> | undefined;
          const onChainOverall = mnt?.overallMaxNumTransfers;
          if (!onChainOverall || onChainOverall === '0') {
            issues.push({
              severity: 'warning',
              message: `Claim has numUses maxUses=${offChainMaxUses} but on-chain overallMaxNumTransfers is unset or "0". Users may claim off-chain but fail on-chain. Set overallMaxNumTransfers to "${offChainMaxUses}" to sync limits.`,
              path: `${approvalPath}.approvalCriteria.maxNumTransfers.overallMaxNumTransfers`
            });
          } else if (onChainOverall !== String(offChainMaxUses) && Number(onChainOverall) < offChainMaxUses) {
            issues.push({
              severity: 'warning',
              message: `Off-chain numUses maxUses (${offChainMaxUses}) exceeds on-chain overallMaxNumTransfers (${onChainOverall}). Users may claim off-chain but fail on-chain. Set overallMaxNumTransfers to "${offChainMaxUses}".`,
              path: `${approvalPath}.approvalCriteria.maxNumTransfers.overallMaxNumTransfers`
            });
          }
        }
      }
    }

    // --- approvalAmounts / maxNumTransfers: complete object required ---
    // Proto defines these as fixed-shape messages. Missing sibling fields on a partially-
    // populated object are a shape-error — the SDK constructor will produce undefined values
    // that crash toProto(). Throw clearly so the AI fixes the shape rather than silently
    // coercing. Also enforce that any non-zero limit must have an amountTrackerId so
    // independent approvals don't share a tracker and cross-contaminate.
    const AA_FIELDS = [
      'overallApprovalAmount',
      'perToAddressApprovalAmount',
      'perFromAddressApprovalAmount',
      'perInitiatedByAddressApprovalAmount'
    ];
    const MNT_FIELDS = [
      'overallMaxNumTransfers',
      'perToAddressMaxNumTransfers',
      'perFromAddressMaxNumTransfers',
      'perInitiatedByAddressMaxNumTransfers'
    ];
    const checkCompleteLimit = (
      obj: Record<string, any> | undefined,
      fields: string[],
      label: string,
      subPath: string
    ) => {
      if (!obj) return;
      const missing = fields.filter((f) => !(f in obj));
      if (missing.length > 0 && missing.length < fields.length) {
        issues.push({
          severity: 'error',
          message: `${label} is missing sibling fields [${missing.join(', ')}]. The proto expects a complete object with all ${fields.length} amount fields (use "0" for unbounded). Partial objects produce undefined values and crash the SDK constructor.`,
          path: `${approvalPath}.approvalCriteria.${subPath}`
        });
      }
      // resetTimeIntervals must exist as an object if the parent is set
      if (!obj.resetTimeIntervals || typeof obj.resetTimeIntervals !== 'object') {
        issues.push({
          severity: 'error',
          message: `${label}.resetTimeIntervals is required. Use { startTime: "0", intervalLength: "0" } for no reset interval.`,
          path: `${approvalPath}.approvalCriteria.${subPath}.resetTimeIntervals`
        });
      }
      // amountTrackerId must be set when any non-zero limit is configured (prevents cross-contamination)
      const hasLimit = fields.some((f) => obj[f] && String(obj[f]) !== '0');
      if (hasLimit && (!obj.amountTrackerId || String(obj.amountTrackerId).trim() === '')) {
        issues.push({
          severity: 'error',
          message: `${label} has a non-zero limit but amountTrackerId is empty. Set amountTrackerId to a unique string (typically the approvalId) so this tracker does not collide with other approvals.`,
          path: `${approvalPath}.approvalCriteria.${subPath}.amountTrackerId`
        });
      }
    };
    checkCompleteLimit(criteria.approvalAmounts as Record<string, any> | undefined, AA_FIELDS, 'approvalAmounts', 'approvalAmounts');
    checkCompleteLimit(criteria.maxNumTransfers as Record<string, any> | undefined, MNT_FIELDS, 'maxNumTransfers', 'maxNumTransfers');

    // predeterminedBalances + approvalAmounts — unusual combination warning
    const predet = criteria.predeterminedBalances as Record<string, any> | undefined;
    const amounts = criteria.approvalAmounts as Record<string, any> | undefined;
    if (predet && amounts) {
      const hasPredet =
        (Array.isArray(predet.incrementedBalances?.startBalances) && predet.incrementedBalances.startBalances.length > 0) ||
        (Array.isArray(predet.manualBalances) && predet.manualBalances.length > 0);
      const hasAmounts = ['overallApprovalAmount', 'perToAddressApprovalAmount', 'perFromAddressApprovalAmount', 'perInitiatedByAddressApprovalAmount'].some(
        (k) => amounts[k] && String(amounts[k]) !== '0'
      );
      if (hasPredet && hasAmounts) {
        issues.push({
          severity: 'warning',
          message: `Approval has both predeterminedBalances and approvalAmounts set. This is unusual — predeterminedBalances already constrains exact transfer amounts, making approvalAmounts redundant. Verify this is intentional.`,
          path: `${approvalPath}.approvalCriteria`
        });
      }
    }

    // durationFromTimestamp + recurringOwnershipTimes — precedence warning
    const incBalances = predet?.incrementedBalances as Record<string, any> | undefined;
    if (incBalances) {
      const hasDuration = incBalances.durationFromTimestamp && String(incBalances.durationFromTimestamp) !== '0';
      const recTimes = incBalances.recurringOwnershipTimes as Record<string, any> | undefined;
      const hasRecurring =
        recTimes &&
        ((recTimes.startTime && String(recTimes.startTime) !== '0') ||
          (recTimes.intervalLength && String(recTimes.intervalLength) !== '0') ||
          (recTimes.chargePeriodLength && String(recTimes.chargePeriodLength) !== '0'));
      if (hasDuration && hasRecurring) {
        issues.push({
          severity: 'warning',
          message: `Approval has both durationFromTimestamp and recurringOwnershipTimes set. Only recurringOwnershipTimes will take effect (it takes precedence). Remove durationFromTimestamp to avoid confusion.`,
          path: `${approvalPath}.approvalCriteria.predeterminedBalances.incrementedBalances`
        });
      }
    }
  });

  // Duplicate approvalId detection (across all approvals)
  const allIds = (approvals as any[]).map((a: any) => a?.approvalId).filter(Boolean);
  const seenIds = new Set<string>();
  const dupeIds = new Set<string>();
  for (const id of allIds) {
    if (seenIds.has(id)) dupeIds.add(id);
    seenIds.add(id);
  }
  if (dupeIds.size > 0) {
    issues.push({
      severity: 'error',
      message: `Duplicate approval IDs found: ${[...dupeIds].join(', ')}. Each approval must have a unique ID.`,
      path
    });
  }
}

/**
 * Constructor sanity check for MsgUniversalUpdateCollection.
 * Mirrors what the SDK's `new MsgUniversalUpdateCollection()` and the frontend constructors expect.
 * Every field that the SDK/frontend calls .map() or accesses as a property must exist with the right type.
 * This prevents "Cannot read properties of undefined (reading 'map')" crashes.
 */
export function validateMsgConstructorFields(value: Record<string, unknown>, basePath: string, issues: ValidationIssue[]): void {
  // --- Top-level required arrays ---
  const requiredArrayFields = [
    'validTokenIds',
    'standards',
    'collectionApprovals',
    'tokenMetadata',
    'aliasPathsToAdd',
    'cosmosCoinWrapperPathsToAdd',
    'mintEscrowCoinsToTransfer'
  ];

  for (const field of requiredArrayFields) {
    // If the field is present at all, it must be an array (even if not being updated).
    // The SDK constructor will crash if it finds a non-array value.
    if (field in value && !Array.isArray(value[field])) {
      issues.push({
        severity: 'error',
        message: `"${field}" must be an array. The SDK constructor will crash without it.`,
        path: `${basePath}.${field}`
      });
    }
  }

  // --- collectionPermissions: all 11 fields must be arrays ---
  if (value.updateCollectionPermissions === true) {
    if (!value.collectionPermissions || typeof value.collectionPermissions !== 'object') {
      issues.push({
        severity: 'error',
        message: 'collectionPermissions must be an object when updateCollectionPermissions is true. The SDK constructor will crash without it.',
        path: `${basePath}.collectionPermissions`
      });
    }
    // Detailed field checks are handled by validatePermissions()
  }

  // --- collectionMetadata: must be an object (not an array) with uri + customData ---
  // Proto CollectionMetadata has only { uri, customData } — it is NOT a repeated field.
  // Claude occasionally hallucinates an array (confusing it with tokenMetadata[]); reject loudly.
  if (Array.isArray(value.collectionMetadata)) {
    issues.push({
      severity: 'error',
      message:
        'collectionMetadata must be an object { uri, customData }, not an array. You may be confusing it with tokenMetadata (which IS an array of { uri, customData, tokenIds }).',
      path: `${basePath}.collectionMetadata`
    });
  } else if (value.updateCollectionMetadata === true) {
    if (!value.collectionMetadata || typeof value.collectionMetadata !== 'object') {
      issues.push({
        severity: 'error',
        message: 'collectionMetadata must be an object when updateCollectionMetadata is true.',
        path: `${basePath}.collectionMetadata`
      });
    } else {
      const cm = value.collectionMetadata as Record<string, unknown>;
      if ('image' in cm || 'name' in cm || 'description' in cm) {
        issues.push({
          severity: 'error',
          message:
            'collectionMetadata only has { uri, customData } fields per the proto spec. Fields like "image", "name", and "description" belong inside the off-chain JSON referenced by uri (or in metadataPlaceholders), not directly on collectionMetadata.',
          path: `${basePath}.collectionMetadata`
        });
      }
    }
  }

  // --- aliasPathsToAdd / cosmosCoinWrapperPathsToAdd: PathMetadata has { uri, customData } ONLY ---
  // The proto PathMetadata message has no image/name/description. Claude hallucinates these at the
  // wrong nesting level (they belong inside the off-chain JSON at `uri`). Throw clearly.
  const checkPathMetadata = (paths: unknown, parentField: string) => {
    if (!Array.isArray(paths)) return;
    (paths as unknown[]).forEach((p, i) => {
      if (!p || typeof p !== 'object') return;
      const path = p as Record<string, unknown>;
      const md = path.metadata as Record<string, unknown> | undefined;
      if (md && typeof md === 'object') {
        for (const bad of ['image', 'name', 'description']) {
          if (bad in md) {
            issues.push({
              severity: 'error',
              message: `${parentField}[${i}].metadata.${bad} is not a valid field. PathMetadata only has { uri, customData } — put "${bad}" inside the off-chain JSON referenced by metadata.uri.`,
              path: `${basePath}.${parentField}[${i}].metadata.${bad}`
            });
          }
        }
      }
      if (Array.isArray(path.denomUnits)) {
        (path.denomUnits as unknown[]).forEach((du, duIdx) => {
          if (!du || typeof du !== 'object') return;
          const duMd = (du as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
          if (duMd && typeof duMd === 'object') {
            for (const bad of ['image', 'name', 'description']) {
              if (bad in duMd) {
                issues.push({
                  severity: 'error',
                  message: `${parentField}[${i}].denomUnits[${duIdx}].metadata.${bad} is not a valid field. PathMetadata only has { uri, customData }.`,
                  path: `${basePath}.${parentField}[${i}].denomUnits[${duIdx}].metadata.${bad}`
                });
              }
            }
          }
        });
      }
    });
  };
  checkPathMetadata(value.aliasPathsToAdd, 'aliasPathsToAdd');
  checkPathMetadata(value.cosmosCoinWrapperPathsToAdd, 'cosmosCoinWrapperPathsToAdd');

  // --- defaultBalances: full structure check ---
  if (value.defaultBalances && typeof value.defaultBalances === 'object') {
    const db = value.defaultBalances as Record<string, unknown>;

    // Required array fields on defaultBalances
    for (const field of REQUIRED_DEFAULT_BALANCES_FIELDS) {
      if (!(field in db)) {
        issues.push({
          severity: 'error',
          message: `defaultBalances.${field} must be an array (use [] for default). The SDK constructor will crash without it.`,
          path: `${basePath}.defaultBalances.${field}`
        });
      } else if (!Array.isArray(db[field])) {
        issues.push({
          severity: 'error',
          message: `defaultBalances.${field} must be an array, got ${typeof db[field]}.`,
          path: `${basePath}.defaultBalances.${field}`
        });
      }
    }

    // userPermissions must exist with all sub-fields
    if (!db.userPermissions || typeof db.userPermissions !== 'object') {
      issues.push({
        severity: 'error',
        message: 'defaultBalances.userPermissions must be an object with all required array fields. The SDK constructor will crash without it.',
        path: `${basePath}.defaultBalances.userPermissions`
      });
    } else {
      const up = db.userPermissions as Record<string, unknown>;
      const requiredUserPermFields = [
        'canUpdateOutgoingApprovals',
        'canUpdateIncomingApprovals',
        'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
        'canUpdateAutoApproveSelfInitiatedIncomingTransfers',
        'canUpdateAutoApproveAllIncomingTransfers'
      ];
      for (const field of requiredUserPermFields) {
        if (!(field in up) || !Array.isArray(up[field])) {
          issues.push({
            severity: 'error',
            message: `userPermissions.${field} must be an array (use [] for default). The SDK constructor will crash without it.`,
            path: `${basePath}.defaultBalances.userPermissions.${field}`
          });
        }
      }
    }

    // Validate defaultBalances approval address list IDs
    (['incomingApprovals', 'outgoingApprovals'] as const).forEach((field) => {
      if (Array.isArray(db[field])) {
        (db[field] as unknown[]).forEach((approval, index) => {
          if (!approval || typeof approval !== 'object') return;
          const a = approval as Record<string, unknown>;
          (['fromListId', 'toListId', 'initiatedByListId'] as const).forEach((listField) => {
            if (listField in a && typeof a[listField] === 'string') {
              if (!isValidListId(a[listField] as string)) {
                issues.push({
                  severity: 'error',
                  message: `Invalid list ID in defaultBalances.${field}[${index}].${listField}: "${a[listField]}"`,
                  path: `${basePath}.defaultBalances.${field}[${index}].${listField}`
                });
              }
            }
          });
          // "Mint" must only appear in fromListId
          if (typeof a.toListId === 'string' && (a.toListId === 'Mint' || (a.toListId as string).includes('Mint'))) {
            issues.push({
              severity: 'error',
              message: `defaultBalances.${field}[${index}].toListId cannot be "Mint". To burn tokens, use: bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv`,
              path: `${basePath}.defaultBalances.${field}[${index}].toListId`
            });
          }
          if (typeof a.initiatedByListId === 'string' && (a.initiatedByListId === 'Mint' || (a.initiatedByListId as string).includes('Mint'))) {
            issues.push({
              severity: 'error',
              message: `defaultBalances.${field}[${index}].initiatedByListId cannot be "Mint". To burn tokens, use: bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv`,
              path: `${basePath}.defaultBalances.${field}[${index}].initiatedByListId`
            });
          }
        });
      }
    });
  }

  // --- collectionApprovals: each entry must have required fields ---
  if (Array.isArray(value.collectionApprovals)) {
    (value.collectionApprovals as unknown[]).forEach((approval, index) => {
      if (!approval || typeof approval !== 'object') return;
      const a = approval as Record<string, unknown>;
      const approvalPath = `${basePath}.collectionApprovals[${index}]`;

      for (const field of REQUIRED_APPROVAL_FIELDS) {
        if (!(field in a)) {
          issues.push({
            severity: 'error',
            message: `collectionApprovals[${index}] missing required field "${field}".`,
            path: `${approvalPath}.${field}`
          });
        }
      }

      // tokenIds, transferTimes, ownershipTimes must be arrays
      for (const field of ['tokenIds', 'transferTimes', 'ownershipTimes']) {
        if (field in a && !Array.isArray(a[field])) {
          issues.push({
            severity: 'error',
            message: `collectionApprovals[${index}].${field} must be an array.`,
            path: `${approvalPath}.${field}`
          });
        }
      }
    });
  }

  // --- tokenMetadata entries: each must have tokenIds ---
  if (Array.isArray(value.tokenMetadata)) {
    (value.tokenMetadata as unknown[]).forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      const m = entry as Record<string, unknown>;
      if (!('tokenIds' in m) || !Array.isArray(m.tokenIds) || m.tokenIds.length === 0) {
        issues.push({
          severity: 'error',
          message: `tokenMetadata[${index}] MUST include tokenIds field with UintRange array.`,
          path: `${basePath}.tokenMetadata[${index}].tokenIds`
        });
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Validate a BitBadges transaction object against critical rules.
 *
 * Checks for common errors like numbers not being strings, missing required fields,
 * invalid list IDs, and SDK constructor compatibility.
 *
 * @param txBody - The parsed transaction object (must have a `messages` array).
 * @returns A `ValidationResult` with `valid` (true if no errors) and `issues`.
 */
export function validateTransaction(txBody: any): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!txBody || typeof txBody !== 'object') {
    return {
      valid: false,
      issues: [{ severity: 'error', message: 'Transaction must be a JSON object' }]
    };
  }

  const transaction = txBody as Record<string, unknown>;

  // Check for messages array
  if (!Array.isArray(transaction.messages)) {
    issues.push({
      severity: 'error',
      message: 'Transaction must have a "messages" array',
      path: 'messages'
    });
    return { valid: false, issues };
  }

  // Check all numbers are strings
  checkNumbersAreStrings(txBody, '', issues);

  // Check UintRange formats
  findAndValidateUintRanges(txBody, '', issues);

  // Validate each message
  (transaction.messages as unknown[]).forEach((msg, msgIndex) => {
    if (!msg || typeof msg !== 'object') return;

    const message = msg as Record<string, unknown>;
    const msgPath = `messages[${msgIndex}]`;

    // Check typeUrl
    if (!message.typeUrl || typeof message.typeUrl !== 'string') {
      issues.push({
        severity: 'error',
        message: 'Message missing "typeUrl" field',
        path: msgPath
      });
    }

    // Check value
    if (!message.value || typeof message.value !== 'object') {
      issues.push({
        severity: 'error',
        message: 'Message missing "value" object',
        path: msgPath
      });
      return;
    }

    const value = message.value as Record<string, unknown>;

    // Validate MsgUniversalUpdateCollection
    if (message.typeUrl === '/tokenization.MsgUniversalUpdateCollection') {
      // --- Constructor sanity check: ensure all fields the SDK constructor expects exist ---
      validateMsgConstructorFields(value, `${msgPath}.value`, issues);

      // --- mintEscrowCoinsToTransfer max 1 ---
      if (Array.isArray(value.mintEscrowCoinsToTransfer) && (value.mintEscrowCoinsToTransfer as unknown[]).length > 1) {
        issues.push({
          severity: 'error',
          message: 'mintEscrowCoinsToTransfer supports at most 1 coin entry.',
          path: `${msgPath}.value.mintEscrowCoinsToTransfer`
        });
      }

      // --- Specific validation rules ---

      // Check creator
      if (!value.creator || typeof value.creator !== 'string') {
        issues.push({
          severity: 'error',
          message: 'MsgUniversalUpdateCollection missing "creator" field',
          path: `${msgPath}.value.creator`
        });
      } else if (!(value.creator as string).startsWith('bb1')) {
        issues.push({
          severity: 'warning',
          message: 'Creator address should start with "bb1"',
          path: `${msgPath}.value.creator`
        });
      }

      // Check collectionId
      if (!('collectionId' in value)) {
        issues.push({
          severity: 'error',
          message: 'MsgUniversalUpdateCollection missing "collectionId" field',
          path: `${msgPath}.value.collectionId`
        });
      }

      // Validate collectionApprovals
      if (Array.isArray(value.collectionApprovals)) {
        const standards = Array.isArray(value.standards) ? (value.standards as string[]) : undefined;
        validateApprovals(value.collectionApprovals, `${msgPath}.value.collectionApprovals`, issues, standards);
        validateApprovalCriteria(value.collectionApprovals as unknown[], `${msgPath}.value.collectionApprovals`, issues);
      }

      // Validate approval criteria in defaultBalances
      if (value.defaultBalances && typeof value.defaultBalances === 'object') {
        const db = value.defaultBalances as Record<string, unknown>;
        if (Array.isArray(db.incomingApprovals)) {
          validateApprovalCriteria(db.incomingApprovals as unknown[], `${msgPath}.value.defaultBalances.incomingApprovals`, issues);
        }
        if (Array.isArray(db.outgoingApprovals)) {
          validateApprovalCriteria(db.outgoingApprovals as unknown[], `${msgPath}.value.defaultBalances.outgoingApprovals`, issues);
        }
      }

      // Validate subscription-specific: validTokenIds must be exactly 1 token
      if (Array.isArray(value.standards) && (value.standards as string[]).includes('Subscriptions')) {
        if (Array.isArray(value.validTokenIds)) {
          const tokenIds = value.validTokenIds as unknown[];
          if (tokenIds.length !== 1) {
            issues.push({
              severity: 'warning',
              message: 'Subscription collections should have exactly 1 validTokenIds range',
              path: `${msgPath}.value.validTokenIds`
            });
          } else {
            const range = tokenIds[0] as Record<string, unknown>;
            if (range && (range.start !== '1' || range.end !== '1')) {
              issues.push({
                severity: 'warning',
                message: 'Subscription collections should have validTokenIds: [{ "start": "1", "end": "1" }]',
                path: `${msgPath}.value.validTokenIds`
              });
            }
          }
        }
      }

      // Validate collectionPermissions
      if (value.collectionPermissions) {
        validatePermissions(value.collectionPermissions, `${msgPath}.value.collectionPermissions`, issues);
      }

      // Validate defaultBalances for mint collections
      if (value.collectionId === '0') {
        const hasMintApproval =
          Array.isArray(value.collectionApprovals) &&
          (value.collectionApprovals as Array<Record<string, unknown>>).some((a) => a.fromListId === 'Mint');
        if (hasMintApproval) {
          const defaultBal = value.defaultBalances as Record<string, unknown> | undefined;
          if (!defaultBal) {
            issues.push({
              severity: 'error',
              message:
                'Collection has mint approvals but no defaultBalances. Recipients will not be able to receive tokens. Add defaultBalances with autoApproveAllIncomingTransfers: true.',
              path: `${msgPath}.value.defaultBalances`
            });
          } else if (!defaultBal.autoApproveAllIncomingTransfers) {
            issues.push({
              severity: 'error',
              message: 'defaultBalances.autoApproveAllIncomingTransfers is not true. Recipients will not be able to receive minted tokens.',
              path: `${msgPath}.value.defaultBalances.autoApproveAllIncomingTransfers`
            });
          }
        }
      }
    }

    // Validate MsgTransferTokens
    if (message.typeUrl === '/tokenization.MsgTransferTokens') {
      // Check creator
      if (!value.creator || typeof value.creator !== 'string') {
        issues.push({
          severity: 'error',
          message: 'MsgTransferTokens missing "creator" field',
          path: `${msgPath}.value.creator`
        });
      }

      // Check transfers array
      if (!Array.isArray(value.transfers)) {
        issues.push({
          severity: 'error',
          message: 'MsgTransferTokens missing "transfers" array',
          path: `${msgPath}.value.transfers`
        });
      } else {
        // Validate each transfer
        (value.transfers as unknown[]).forEach((transfer, tIndex) => {
          if (!transfer || typeof transfer !== 'object') return;
          const t = transfer as Record<string, unknown>;
          const transferPath = `${msgPath}.value.transfers[${tIndex}]`;

          // Check prioritizedApprovals is specified
          if (!('prioritizedApprovals' in t)) {
            issues.push({
              severity: 'warning',
              message: 'prioritizedApprovals should always be explicitly specified (use [] if none needed)',
              path: `${transferPath}.prioritizedApprovals`
            });
          }
        });
      }
    }
  });

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues
  };
}

/**
 * Known chain / LCD simulate error phrases → structured fix guidance.
 *
 * Ported from the indexer's validation gate. Pure string + regex
 * data — no side effects, no dependencies beyond the standard library.
 */

export const SIMULATION_ERROR_PATTERNS: Array<{ pattern: RegExp; guidance: string; advisory?: boolean }> = [
  {
    pattern: /\bjsonToTxBytes:/i,
    guidance:
      'Encode-time error from jsonToTxBytes (pre-simulation). This is an advisory — not a chain validation failure. If this persists, the transaction shape is likely fine for broadcast but missing a field the local encoder requires.',
    advisory: true
  },
  {
    pattern: /\bapproval\b.*\bnot found\b|\bno matching\b.*\bapproval\b/i,
    guidance:
      'The transaction references an approval that does not exist on the collection. Check that approvalId matches, and that fromListId/toListId are correct. For mint approvals, fromListId must be "Mint".'
  },
  {
    pattern: /\binsufficient\b.*\bbalance\b|\bbalance\b.*\binsufficient\b/i,
    guidance:
      'The sender does not have enough tokens. For new collections (collectionId "0"), tokens must first be minted via a mint approval before they can be transferred.'
  },
  {
    pattern: /\bunauthorized\b|\bnot authorized\b|\bpermission denied\b/i,
    guidance:
      'The creator address is not authorized for this operation. Check that initiatedByListId includes the creator address, and that overridesFromOutgoingApprovals is true for mint approvals.'
  },
  {
    pattern: /\btoken id\b.*\bnot\b.*\bvalid\b|\btoken id\b.*\bout of range\b|\bnot in\b.*\bvalidTokenIds\b/i,
    guidance:
      'The token IDs referenced are not in the validTokenIds range. Ensure validTokenIds covers all token IDs used in approvals, balances, and transfers.'
  },
  {
    pattern: /\bownership time\b.*\bnot\b.*\bvalid\b|\bownership time\b.*\boverlap\b/i,
    guidance:
      'Ownership time ranges are invalid or overlap. Ensure ownershipTimes ranges do not conflict. For FOREVER use [{"start":"1","end":"18446744073709551615"}].'
  },
  {
    pattern: /\bduplicate\b.*\bapproval id\b/i,
    guidance: 'Multiple approvals share the same approvalId. Each approval must have a unique approvalId string.'
  },
  {
    pattern: /\bpredetermined balances?\b|\bincremented balances?\b/i,
    guidance:
      'Issue with predeterminedBalances/incrementedBalances. Check that startBalances, incrementTokenIdsBy, incrementOwnershipTimesBy are valid. Only ONE of durationFromTimestamp, incrementOwnershipTimesBy, or recurringOwnershipTimes can be non-zero.'
  },
  {
    pattern: /\bmanager\b.*\bmismatch\b|\binvalid\b.*\bmanager\b/i,
    guidance: 'The manager address does not match expectations. Ensure the manager field is set to the creator address.'
  },
  {
    pattern: /\bcosmos coin wrapper\b|\bibc denom\b/i,
    guidance:
      'Issue with IBC/cosmos coin configuration. Verify the IBC denom is correct and the backing address was generated via generate_backing_address tool.'
  }
];

export function parseSimulationError(error: string): string {
  for (const { pattern, guidance } of SIMULATION_ERROR_PATTERNS) {
    if (pattern.test(error)) return `${error}\n\nFix guidance: ${guidance}`;
  }
  return error;
}

export function isAdvisorySimulationError(error: string): boolean {
  for (const entry of SIMULATION_ERROR_PATTERNS) {
    if (entry.advisory && entry.pattern.test(error)) return true;
  }
  return false;
}

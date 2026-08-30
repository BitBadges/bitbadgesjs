/**
 * Tests for interpret-shared.ts — pure utility functions and section builders
 * shared by interpretCollection() and interpretTransaction().
 *
 * These helpers sit on the hot path of the collection/transaction interpretation
 * surface (CLI `bb explain`, MCP `explain_collection`, dashboard review). They
 * must never throw on malformed input, because they consume raw JSON straight
 * from the chain or from in-flight transaction bodies.
 */

import {
  timestampToDate,
  durationToHuman,
  denomToHuman,
  amountToHuman,
  big,
  isFullRange,
  permState,
  listIdHuman,
  rangeStr,
  timeRangeStr,
  countTokenIds,
  detectType,
  buildTypeExplanation,
  buildStandardExplanations,
  pluginDisplayName,
  aOrAn,
  buildApprovalParagraph,
  buildPermissionsSection,
  buildDefaultBalancesSection,
  buildBackingAndPathsSection,
  buildInvariantsSection,
  buildKeyReferenceSection,
  PLUGIN_DISPLAY_NAMES,
  PERM_DESCRIPTIONS,
  PERM_KEYS
} from './interpret-shared.js';
import { GO_MAX_UINT_64 } from '../common/math.js';

const MAX_U64 = GO_MAX_UINT_64;

// ---------------------------------------------------------------------------
// Human-readable conversion helpers
// ---------------------------------------------------------------------------

describe('timestampToDate', () => {
  it('returns "the beginning of time" for zero or negative input', () => {
    expect(timestampToDate(0n)).toBe('the beginning of time');
    expect(timestampToDate(-1n)).toBe('the beginning of time');
    expect(timestampToDate(-999999999999n)).toBe('the beginning of time');
  });

  it('returns "the end of time" for MAX_UINT64 or above', () => {
    expect(timestampToDate(MAX_U64)).toBe('the end of time');
    expect(timestampToDate(MAX_U64 + 1n)).toBe('the end of time');
  });

  it('formats a midnight UTC timestamp without the time component', () => {
    // 2025-01-01T00:00:00.000Z
    const ts = BigInt(Date.UTC(2025, 0, 1, 0, 0, 0, 0));
    expect(timestampToDate(ts)).toBe('January 1, 2025');
  });

  it('formats a non-midnight timestamp with HH:MM UTC', () => {
    const ts = BigInt(Date.UTC(2025, 5, 15, 14, 30, 0, 0));
    expect(timestampToDate(ts)).toBe('June 15, 2025 at 14:30 UTC');
  });

  it('zero-pads single-digit hours and minutes', () => {
    const ts = BigInt(Date.UTC(2026, 11, 31, 3, 5, 0, 0));
    expect(timestampToDate(ts)).toBe('December 31, 2026 at 03:05 UTC');
  });
});

describe('durationToHuman', () => {
  it('returns "instant" for zero or negative durations', () => {
    expect(durationToHuman(0n)).toBe('instant');
    expect(durationToHuman(-1n)).toBe('instant');
  });

  it('returns "forever" for MAX_UINT64 or above', () => {
    expect(durationToHuman(MAX_U64)).toBe('forever');
    expect(durationToHuman(MAX_U64 + 10n)).toBe('forever');
  });

  it('formats whole-year durations (including 1-year singular)', () => {
    // 365.25 days in ms
    const oneYear = BigInt(Math.floor(365.25 * 24 * 60 * 60 * 1000));
    expect(durationToHuman(oneYear)).toBe('1 year');
    expect(durationToHuman(oneYear * 3n)).toBe('3 years');
  });

  it('labels 7 days as weekly and 30/31 days as monthly', () => {
    expect(durationToHuman(BigInt(7 * 24 * 60 * 60 * 1000))).toBe('7 days (weekly)');
    expect(durationToHuman(BigInt(30 * 24 * 60 * 60 * 1000))).toBe('30 days (monthly)');
    expect(durationToHuman(BigInt(31 * 24 * 60 * 60 * 1000))).toBe('31 days (monthly)');
  });

  it('formats day durations that are not 7/30/31 as plain days', () => {
    expect(durationToHuman(BigInt(14 * 24 * 60 * 60 * 1000))).toBe('14 days');
  });

  it('formats whole-hour and whole-minute durations (including 1-unit singular)', () => {
    expect(durationToHuman(BigInt(60 * 60 * 1000))).toBe('1 hour');
    expect(durationToHuman(BigInt(2 * 60 * 60 * 1000))).toBe('2 hours');
    expect(durationToHuman(BigInt(60 * 1000))).toBe('1 minute');
    expect(durationToHuman(BigInt(5 * 60 * 1000))).toBe('5 minutes');
  });

  it('falls back to seconds for sub-minute durations', () => {
    expect(durationToHuman(1000n)).toBe('1 second');
    expect(durationToHuman(30_000n)).toBe('30 seconds');
    // 500ms -> 0.5 seconds, plural because != 1
    expect(durationToHuman(500n)).toBe('0.5 seconds');
  });
});

describe('denomToHuman', () => {
  it('maps registered denoms through the CoinsRegistry', () => {
    expect(denomToHuman('ubadge')).toBe('BADGE');
  });

  it('recognises USDC/ATOM/OSMO by substring for unknown denoms', () => {
    expect(denomToHuman('ibc/some-random-usdc-denom')).toBe('USDC');
    expect(denomToHuman('weird-atom-variant')).toBe('ATOM');
    expect(denomToHuman('xxxOSMOxxx')).toBe('OSMO');
  });

  it('returns the raw denom for wholly unknown inputs', () => {
    expect(denomToHuman('zzz-unknown')).toBe('zzz-unknown');
  });
});

describe('amountToHuman', () => {
  it('formats whole amounts for registered decimal denoms', () => {
    // ubadge = 9 decimals → 5_000_000_000 base = "5 BADGE"
    expect(amountToHuman(5_000_000_000n, 'ubadge')).toBe('5 BADGE');
  });

  it('formats fractional amounts by stripping trailing zeros', () => {
    // 5.5 BADGE = 5_500_000_000 ubadge
    expect(amountToHuman(5_500_000_000n, 'ubadge')).toBe('5.5 BADGE');
  });

  it('adds thousands separators to whole amounts for registered denoms', () => {
    // 12_345 BADGE = 12_345 * 10^9 ubadge
    expect(amountToHuman(12_345n * 10n ** 9n, 'ubadge')).toBe('12,345 BADGE');
  });

  it('falls back to locale-formatted raw amount for unknown denoms', () => {
    expect(amountToHuman(1_000_000n, 'mystery-denom')).toBe('1,000,000 mystery-denom');
  });
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe('big', () => {
  it('returns 0n for null, undefined, or empty string', () => {
    expect(big(null)).toBe(0n);
    expect(big(undefined)).toBe(0n);
    expect(big('')).toBe(0n);
  });

  it('converts numeric and string values to bigint', () => {
    expect(big(42)).toBe(42n);
    expect(big('123')).toBe(123n);
    expect(big(0)).toBe(0n);
  });

  it('returns 0n for values that cannot be converted (does not throw)', () => {
    expect(big('not a number')).toBe(0n);
    expect(big({})).toBe(0n);
    expect(big([1, 2, 3])).toBe(0n);
  });

  it('unwraps a valueOf() method when present', () => {
    const wrapper = { valueOf: () => 99 };
    expect(big(wrapper)).toBe(99n);
  });
});

describe('isFullRange', () => {
  it('returns false for undefined or empty ranges', () => {
    expect(isFullRange(undefined)).toBe(false);
    expect(isFullRange([])).toBe(false);
  });

  it('returns true when any entry covers 1 → MAX_UINT64', () => {
    expect(isFullRange([{ start: 1n, end: MAX_U64 }])).toBe(true);
    expect(isFullRange([
      { start: 1n, end: 10n },
      { start: 1n, end: MAX_U64 }
    ])).toBe(true);
  });

  it('returns false when no entry covers 1 → MAX_UINT64', () => {
    expect(isFullRange([{ start: 1n, end: 10n }])).toBe(false);
    // MAX_UINT64 but starts at 2n, not 1n
    expect(isFullRange([{ start: 2n, end: MAX_U64 }])).toBe(false);
  });

  it('accepts string/number-valued bounds via big() coercion', () => {
    expect(isFullRange([{ start: '1', end: MAX_U64.toString() }])).toBe(true);
    expect(isFullRange([{ start: 1, end: '10' }])).toBe(false);
  });
});

describe('permState', () => {
  it('returns "undecided" for undefined or empty entries', () => {
    expect(permState(undefined)).toBe('undecided');
    expect(permState([])).toBe('undecided');
  });

  it('returns "locked" when any entry has a full permanentlyForbiddenTimes range', () => {
    expect(permState([{ permanentlyForbiddenTimes: [{ start: 1n, end: MAX_U64 }] }])).toBe('locked');
  });

  it('returns "open" when any entry has a full permanentlyPermittedTimes range (and no forbidden)', () => {
    expect(permState([{ permanentlyPermittedTimes: [{ start: 1n, end: MAX_U64 }] }])).toBe('open');
  });

  it('prefers "locked" over "open" when both full ranges are present on different entries', () => {
    expect(permState([
      { permanentlyPermittedTimes: [{ start: 1n, end: MAX_U64 }] },
      { permanentlyForbiddenTimes: [{ start: 1n, end: MAX_U64 }] }
    ])).toBe('locked');
  });

  it('returns "undecided" when neither bucket covers the full range', () => {
    expect(permState([
      { permanentlyPermittedTimes: [{ start: 1n, end: 100n }], permanentlyForbiddenTimes: [{ start: 1n, end: 100n }] }
    ])).toBe('undecided');
  });
});

describe('listIdHuman', () => {
  it('returns "unspecified" for empty input', () => {
    expect(listIdHuman('')).toBe('unspecified');
  });

  it('maps reserved list IDs to friendly language', () => {
    expect(listIdHuman('All')).toBe('anyone');
    expect(listIdHuman('Mint')).toMatch(/^the Mint address/);
    expect(listIdHuman('!Mint')).toMatch(/^any existing token holder/);
    expect(listIdHuman('Total')).toMatch(/^the aggregate tracker/);
  });

  it('describes !Mint:<addr> exclusions', () => {
    expect(listIdHuman('!Mint:bb1abc')).toBe('any existing holder except the specific address bb1abc');
  });

  it('describes !<addr> exclusions', () => {
    expect(listIdHuman('!bb1abc')).toBe('anyone except the specific address bb1abc');
  });

  it('joins colon-separated compound list IDs', () => {
    expect(listIdHuman('bb1a:bb1b')).toBe('the following addresses: bb1a and bb1b');
  });

  it('recognises bare bb1/0x addresses as single-address lists', () => {
    expect(listIdHuman('bb1abcdef')).toBe('the specific address bb1abcdef');
    expect(listIdHuman('0xdeadbeef')).toBe('the specific address 0xdeadbeef');
  });

  it('falls through to the raw id when nothing else matches', () => {
    expect(listIdHuman('custom-list-id')).toBe('custom-list-id');
  });
});

describe('rangeStr', () => {
  it('returns "none" for undefined, non-array, or empty input', () => {
    expect(rangeStr(undefined)).toBe('none');
    expect(rangeStr([])).toBe('none');
    // non-array masquerading as any[]
    expect(rangeStr('not-an-array' as unknown as any[])).toBe('none');
  });

  it('renders a full range as the literal "all"', () => {
    expect(rangeStr([{ start: 1n, end: MAX_U64 }])).toBe('all');
  });

  it('renders a single-id range as #N', () => {
    expect(rangeStr([{ start: 5n, end: 5n }])).toBe('#5');
  });

  it('renders a multi-id range as #start-#end', () => {
    expect(rangeStr([{ start: 3n, end: 7n }])).toBe('#3-#7');
  });

  it('comma-joins multiple ranges', () => {
    expect(rangeStr([
      { start: 1n, end: 1n },
      { start: 5n, end: 9n }
    ])).toBe('#1, #5-#9');
  });
});

describe('timeRangeStr', () => {
  it('returns "none" for undefined or empty input', () => {
    expect(timeRangeStr(undefined)).toBe('none');
    expect(timeRangeStr([])).toBe('none');
  });

  it('renders a full range as the literal "all time"', () => {
    expect(timeRangeStr([{ start: 1n, end: MAX_U64 }])).toBe('all time');
  });

  it('renders a finite range via timestampToDate on both ends', () => {
    const start = BigInt(Date.UTC(2025, 0, 1));
    const end = BigInt(Date.UTC(2025, 11, 31));
    expect(timeRangeStr([{ start, end }])).toBe('January 1, 2025 through December 31, 2025');
  });
});

describe('countTokenIds', () => {
  it('returns "0" for undefined, non-array, or empty input', () => {
    expect(countTokenIds(undefined)).toBe('0');
    expect(countTokenIds([])).toBe('0');
  });

  it('counts inclusive range sizes correctly', () => {
    expect(countTokenIds([{ start: 1n, end: 1n }])).toBe('1');
    expect(countTokenIds([{ start: 1n, end: 10n }])).toBe('10');
    expect(countTokenIds([
      { start: 1n, end: 5n },
      { start: 10n, end: 14n }
    ])).toBe('10');
  });

  it('returns "unlimited" when the total touches or exceeds MAX_UINT64', () => {
    expect(countTokenIds([{ start: 1n, end: MAX_U64 }])).toBe('unlimited');
  });

  it('flags very-large totals (> 1e6) with parenthetical note', () => {
    expect(countTokenIds([{ start: 1n, end: 2_000_000n }])).toBe('2,000,000 (very large range)');
  });

  it('formats small-to-medium totals with thousands separators', () => {
    expect(countTokenIds([{ start: 1n, end: 1000n }])).toBe('1,000');
  });
});

// ---------------------------------------------------------------------------
// Type detection & explanations
// ---------------------------------------------------------------------------

describe('detectType', () => {
  it('falls back to "Token Collection" for unknown inputs', () => {
    expect(detectType([], false)).toBe('Token Collection');
    expect(detectType(['Something Obscure'], false)).toBe('Token Collection');
  });

  it('detects subscription tokens by case-insensitive substring', () => {
    expect(detectType(['SubscriptionStandard'], false)).toBe('Subscription Token');
  });

  it('detects AI-agent stablecoins before generic smart-token match', () => {
    expect(detectType(['AI Agent Stablecoin v1'], false)).toBe('AI Agent Stablecoin');
  });

  it('detects smart tokens via either substring or backing path', () => {
    expect(detectType(['Smart Token Extension'], false)).toBe('Smart Token (IBC-backed)');
    expect(detectType([], true)).toBe('Smart Token (IBC-backed)');
  });

  it('detects Address List exactly (case-sensitive match)', () => {
    expect(detectType(['Address List'], false)).toBe('Address List');
  });

  it('detects credit / membership / liquidity-pool tokens', () => {
    expect(detectType(['Credit Token'], false)).toBe('Credit Token');
    expect(detectType(['Membership Pass'], false)).toBe('Membership Token');
    expect(detectType(['Liquidity Pool Token'], false)).toBe('Liquidity Pool');
  });

  it('falls back to NFT / Fungible for the common standards', () => {
    expect(detectType(['NFTs'], false)).toBe('NFT Collection');
    expect(detectType(['Fungible Tokens'], false)).toBe('Fungible Token');
  });

  it('tolerates a null/undefined standards argument', () => {
    expect(detectType(undefined as unknown as string[], false)).toBe('Token Collection');
    expect(detectType(null as unknown as string[], true)).toBe('Smart Token (IBC-backed)');
  });
});

describe('buildTypeExplanation', () => {
  it('describes NFT supply variants (1 / 0 / N)', () => {
    expect(buildTypeExplanation('NFT Collection', 1n)).toMatch(/one-of-a-kind/);
    expect(buildTypeExplanation('NFT Collection', 0n)).toMatch(/no supply cap/);
    expect(buildTypeExplanation('NFT Collection', 100n)).toMatch(/Up to 100 copies/);
  });

  it('describes smart tokens with the backing denom (or fallback)', () => {
    expect(buildTypeExplanation('Smart Token (IBC-backed)', 0n, 'ATOM')).toMatch(/backed 1:1 by ATOM/);
    expect(buildTypeExplanation('Smart Token (IBC-backed)', 0n)).toMatch(/backed 1:1 by an IBC asset/);
  });

  it('describes fungible-token supply variants', () => {
    expect(buildTypeExplanation('Fungible Token', 0n)).toMatch(/no supply cap/);
    expect(buildTypeExplanation('Fungible Token', 1000n)).toMatch(/1,000 tokens/);
  });

  it('returns dedicated copy for Subscription / AI Agent Stablecoin / Address List / Credit / Membership / Liquidity Pool', () => {
    expect(buildTypeExplanation('Subscription Token', 0n)).toMatch(/subscription token/i);
    expect(buildTypeExplanation('AI Agent Stablecoin', 0n)).toMatch(/AI agent-managed stablecoin/);
    expect(buildTypeExplanation('Address List', 0n)).toMatch(/membership roster/);
    expect(buildTypeExplanation('Credit Token', 0n)).toMatch(/credit token/);
    expect(buildTypeExplanation('Membership Token', 0n)).toMatch(/membership token/i);
    expect(buildTypeExplanation('Liquidity Pool', 0n)).toMatch(/liquidity pool/);
  });

  it('returns the generic fallback for unrecognised types', () => {
    expect(buildTypeExplanation('Unknown', 0n)).toBe('This is a token collection on BitBadges.');
  });
});

describe('buildStandardExplanations', () => {
  it('returns a separate entry for each standard', () => {
    const out = buildStandardExplanations(['NFTs', 'Fungible Tokens']);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatch(/distinct asset/);
    expect(out[1]).toMatch(/identical and interchangeable/);
  });

  it('matches soulbound / non-transferable via lowercase substring', () => {
    expect(buildStandardExplanations(['Soulbound v1'])[0]).toMatch(/cannot be transferred/);
    expect(buildStandardExplanations(['non-transferable'])[0]).toMatch(/cannot be transferred/);
  });

  it('matches tradable / marketplace and the bare "NFTMarketplace" standard', () => {
    expect(buildStandardExplanations(['NFTMarketplace'])[0]).toMatch(/secondary market/);
    expect(buildStandardExplanations(['tradable-something'])[0]).toMatch(/secondary market/);
  });

  it('matches subscription / smart token / ai agent substrings', () => {
    expect(buildStandardExplanations(['Subscription v2'])[0]).toMatch(/time-limited access/);
    // Source uses lowercase substring "smart token" (with a space), not "smarttoken"
    expect(buildStandardExplanations(['Smart Token v3'])[0]).toMatch(/IBC-backed/);
    expect(buildStandardExplanations(['AI Agent'])[0]).toMatch(/automated AI agent/);
  });

  it('echoes an unknown standard as a quoted passthrough', () => {
    expect(buildStandardExplanations(['Quirky'])[0]).toBe('"Quirky"');
  });
});

describe('pluginDisplayName', () => {
  it('returns the registered display name for known plugins', () => {
    expect(pluginDisplayName('numUses')).toBe(PLUGIN_DISPLAY_NAMES['numUses']);
    expect(pluginDisplayName('discord')).toMatch(/^Discord Verification/);
  });

  it('returns the raw id for unknown plugins', () => {
    expect(pluginDisplayName('my-custom-plugin')).toBe('my-custom-plugin');
  });
});

describe('aOrAn', () => {
  it('returns "an" before vowel-initial words', () => {
    expect(aOrAn('apple')).toBe('an');
    expect(aOrAn('orange')).toBe('an');
  });

  it('returns "a" before consonant-initial words', () => {
    expect(aOrAn('banana')).toBe('a');
    expect(aOrAn('collection')).toBe('a');
  });

  it('treats the NFT acronym as vowel-sound ("an")', () => {
    expect(aOrAn('NFT')).toBe('an');
    expect(aOrAn('NFT Collection')).toBe('an');
  });

  it('ignores leading whitespace when picking the first letter', () => {
    expect(aOrAn('  apple')).toBe('an');
    expect(aOrAn('  banana')).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// Section builders — structural smoke tests
// ---------------------------------------------------------------------------

describe('buildApprovalParagraph', () => {
  it('renders a Mint Approval header when isForMint=true', () => {
    const md = buildApprovalParagraph({ approvalId: 'mint-1', fromListId: 'Mint', toListId: 'All', initiatedByListId: 'All' }, true);
    expect(md).toContain('### Mint Approval: "mint-1"');
    expect(md).toMatch(/how new tokens are created/);
  });

  it('renders a Transfer Approval header when isForMint=false', () => {
    const md = buildApprovalParagraph({ approvalId: 'xfer-1', fromListId: 'All', toListId: 'All', initiatedByListId: 'All' }, false);
    expect(md).toContain('### Transfer Approval: "xfer-1"');
  });

  it('includes creator-provided name and description when present', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a1',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      details: { name: 'VIP Pass', description: 'Allowed only for holders.', image: 'ipfs://x' }
    }, false);
    expect(md).toContain('**"VIP Pass"**');
    expect(md).toContain('Creator-provided approval description');
    expect(md).toContain('Approval image: ipfs://x');
  });

  it('adds the three-tier warning only on unrestricted All/All transfers without from override', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All'
    }, false);
    expect(md).toMatch(/there are two additional layers/);
  });

  it('omits the three-tier warning when overridesFromOutgoingApprovals=true', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: { overridesFromOutgoingApprovals: true }
    }, false);
    expect(md).not.toMatch(/there are two additional layers/);
  });

  it('returns a short paragraph with no approvalCriteria (graceful fast-path)', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'bb1a',
      toListId: 'bb1b',
      initiatedByListId: 'bb1a'
    }, false);
    // No "**Cost**:" marker should be added when criteria is absent.
    expect(md).not.toContain('**Cost**:');
  });

  it('describes "Free" cost and coin-transfer cost variations', () => {
    const freeMd = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: {}
    }, false);
    expect(freeMd).toContain('**Cost**: Free (no payment required).');

    const paidMd = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: {
        coinTransfers: [{ coins: [{ amount: '1000000000', denom: 'ubadge' }] }]
      }
    }, false);
    expect(paidMd).toContain('**Cost**: 1 BADGE per transfer.');
    expect(paidMd).toContain('deducted from the transfer initiator');
  });

  it('describes scaling cost when allowAmountScaling=true', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: {
        coinTransfers: [{ coins: [{ amount: '1000000000', denom: 'ubadge' }] }],
        predeterminedBalances: { incrementedBalances: { allowAmountScaling: true } }
      }
    }, false);
    expect(md).toContain('per 1x base amount');
    expect(md).toMatch(/scales proportionally/);
  });

  it('describes the forceful-transfer warning when conditions align', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: { overridesFromOutgoingApprovals: true }
    }, false);
    expect(md).toContain('**Warning**');
    expect(md).toMatch(/forceful transfers or seizure/);
  });

  it('describes approval amount and maxNumTransfers limit parts + reset interval', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: {
        approvalAmounts: {
          overallApprovalAmount: '100',
          perInitiatedByAddressApprovalAmount: '5',
          resetTimeIntervals: { intervalLength: (24n * 60n * 60n * 1000n).toString() }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: '50'
        }
      }
    }, false);
    expect(md).toContain('a total cap of 100 tokens across all users');
    expect(md).toContain('a per-user limit of 5 tokens');
    expect(md).toContain('a total of 50 transfer transactions overall');
    expect(md).toMatch(/reset every 1 hour|reset every .*24 hours|reset every 1 day/);
  });

  it('describes merkleChallenges with and without linked claims', () => {
    const mdBare = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: { merkleChallenges: [{}] }
    }, false);
    expect(mdBare).toContain('**Verification Challenges**');

    const mdLinked = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: {
        merkleChallenges: [{
          challengeInfoDetails: {
            claim: {
              claimId: 'c1',
              metadata: { name: 'Whitelist Claim', description: 'For VIPs' },
              categories: ['whitelist'],
              plugins: [{ pluginId: 'discord' }, { pluginId: 'numUses', publicParams: { maxUsesPerAddress: 1 } }],
              rewards: [{}, {}]
            }
          }
        }]
      }
    }, false);
    expect(mdLinked).toContain('#### Linked Claim: "c1"');
    expect(mdLinked).toContain('**"Whitelist Claim"**');
    expect(mdLinked).toContain('**Categories**: whitelist');
    expect(mdLinked).toMatch(/Discord Verification/);
    expect(mdLinked).toContain('maxUsesPerAddress: 1');
    expect(mdLinked).toContain('**Rewards**: 2 rewards');
  });

  it('describes autoDeletion variants', () => {
    const mdOnce = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: { autoDeletionOptions: { afterOneUse: true } }
    }, false);
    expect(mdOnce).toMatch(/single-use approval/);

    const mdExhaust = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: { autoDeletionOptions: {} }
    }, false);
    expect(mdExhaust).toMatch(/limits have been fully reached/);
  });

  it('describes royalties as a basis-points percentage when configured', () => {
    const md = buildApprovalParagraph({
      approvalId: 'a',
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalCriteria: {
        userApprovalSettings: {
          userRoyalties: { percentage: '250', payoutAddress: 'bb1royalty' }
        }
      }
    }, false);
    expect(md).toContain('**Royalties**: A royalty of **2.50%**');
    expect(md).toContain('`bb1royalty`');
  });
});

describe('buildPermissionsSection', () => {
  it('notes a missing manager with the warning banner', () => {
    const md = buildPermissionsSection({}, null);
    expect(md).toContain('> **No Manager Set**');
    expect(md).toContain('Current manager: `not set`');
  });

  it('includes every permission label from PERM_DESCRIPTIONS', () => {
    const md = buildPermissionsSection({}, 'bb1manager');
    for (const { label } of Object.values(PERM_DESCRIPTIONS)) {
      expect(md).toContain(`**${label}**`);
    }
  });

  it('surfaces the fully-immutable trust summary when every permission is locked', () => {
    const lockedEntry = [{ permanentlyForbiddenTimes: [{ start: 1n, end: MAX_U64 }] }];
    const perms: Record<string, unknown> = {};
    for (const key of PERM_KEYS) perms[key] = lockedEntry;
    const md = buildPermissionsSection(perms, 'bb1manager');
    expect(md).toContain(`**${PERM_KEYS.length} of ${PERM_KEYS.length}** permissions permanently locked`);
    expect(md).toMatch(/fully immutable/);
  });

  it('flags mutable transfer rules with the "Important" callout', () => {
    const md = buildPermissionsSection({}, 'bb1manager');
    expect(md).toMatch(/> \*\*Important\*\*: Transfer rules are/);
  });
});

describe('buildDefaultBalancesSection', () => {
  it('returns a no-config stub when defaults is missing', () => {
    expect(buildDefaultBalancesSection(undefined)).toContain('No default balance configuration');
  });

  it('describes zero-balance starting state when no default balances are configured', () => {
    const md = buildDefaultBalancesSection({});
    expect(md).toMatch(/Users start with zero balance/);
  });

  it('enumerates starting balances and auto-approve yes/no variants', () => {
    const md = buildDefaultBalancesSection({
      balances: [{ amount: '5', tokenIds: [{ start: 1n, end: 10n }] }],
      autoApproveSelfInitiatedOutgoingTransfers: true,
      autoApproveSelfInitiatedIncomingTransfers: false,
      autoApproveAllIncomingTransfers: true
    });
    expect(md).toContain('**5 tokens** for token IDs #1-#10');
    expect(md).toMatch(/Auto-approve self-initiated outgoing transfers\*\*: Yes/);
    expect(md).toMatch(/Auto-approve self-initiated incoming transfers\*\*: No/);
    expect(md).toMatch(/Auto-approve all incoming transfers\*\*: Yes/);
  });
});

describe('buildBackingAndPathsSection', () => {
  it('returns the native-collection stub when nothing is configured', () => {
    expect(buildBackingAndPathsSection(undefined, [], [])).toMatch(/native BitBadges collection with no IBC backing/);
  });

  it('describes IBC backing with known denom and 1:1 rate', () => {
    const md = buildBackingAndPathsSection(
      { cosmosCoinBackedPath: { address: 'bb1vault', conversion: { sideA: { denom: 'ubadge', amount: '1' }, sideB: [{ amount: '1' }] } } },
      [],
      []
    );
    expect(md).toContain('**IBC-backed**');
    expect(md).toContain('**1:1**');
    expect(md).toContain('**BADGE**');
    expect(md).toContain('`bb1vault`');
  });

  it('describes non-1:1 rate when sideA and sideB differ', () => {
    const md = buildBackingAndPathsSection(
      { cosmosCoinBackedPath: { address: 'bb1vault', conversion: { sideA: { denom: 'ubadge', amount: '100' }, sideB: [{ amount: '1' }] } } },
      [],
      []
    );
    expect(md).toMatch(/100 BADGE per 1 collection token/);
  });

  it('renders alias and wrapper path sections when provided', () => {
    const md = buildBackingAndPathsSection(undefined, [
      { symbol: 'ALIAS', denom: 'alias-denom' }
    ], [
      { symbol: 'WRAP', denom: 'wrap-denom' }
    ]);
    expect(md).toContain('### Alias Paths');
    expect(md).toContain('`alias-denom`');
    expect(md).toContain('### Cosmos Coin Wrapper Paths');
    expect(md).toContain('`wrap-denom`');
  });
});

describe('buildInvariantsSection', () => {
  it('returns a no-invariants stub when the invariants bag is absent', () => {
    expect(buildInvariantsSection(undefined)).toMatch(/No invariants are set/);
  });

  it('describes max supply when maxSupplyPerId > 0', () => {
    expect(buildInvariantsSection({ maxSupplyPerId: '1000' })).toMatch(/hard cap of \*\*1,000 tokens\*\*/);
  });

  it('describes "no max supply" branch when maxSupplyPerId is 0 or missing', () => {
    expect(buildInvariantsSection({})).toMatch(/No maximum supply limit is set/);
    expect(buildInvariantsSection({ maxSupplyPerId: '0' })).toMatch(/No maximum supply limit is set/);
  });

  it('describes noForcefulPostMintTransfers yes/no branches', () => {
    expect(buildInvariantsSection({ noForcefulPostMintTransfers: true })).toMatch(/Your tokens are yours, period/);
    expect(buildInvariantsSection({ noForcefulPostMintTransfers: false })).toMatch(/guarantee is NOT active/);
  });

  it('describes noCustomOwnershipTimes yes/no branches', () => {
    expect(buildInvariantsSection({ noCustomOwnershipTimes: true })).toMatch(/ownership is permanent/);
    expect(buildInvariantsSection({ noCustomOwnershipTimes: false })).toMatch(/Time-Limited Ownership Allowed/);
  });

  it('only mentions disablePoolCreation when explicitly true', () => {
    expect(buildInvariantsSection({ disablePoolCreation: true })).toMatch(/Trading Pools Disabled/);
    expect(buildInvariantsSection({ disablePoolCreation: false })).not.toMatch(/Trading Pools Disabled/);
  });

  it('describes permanent IBC backing and EVM invariants when present', () => {
    const md = buildInvariantsSection({
      cosmosCoinBackedPath: { address: 'bb1vault', conversion: { sideA: { denom: 'ubadge' } } },
      evmQueryChallenges: [{}, {}]
    });
    expect(md).toMatch(/\*\*IBC Backing\*\*/);
    expect(md).toMatch(/2 smart contract verifications are/);
  });
});

describe('buildKeyReferenceSection', () => {
  it('returns placeholders when the tx body is empty', () => {
    const md = buildKeyReferenceSection({});
    expect(md).toContain('**Manager**: `not set`');
    expect(md).toContain('**Creator**: `unknown`');
    expect(md).toContain('(new, not yet deployed)');
  });

  it('classifies approvals by mint vs transfer vs IBC deposit/withdrawal', () => {
    const md = buildKeyReferenceSection({
      manager: 'bb1m',
      creator: 'bb1c',
      collectionId: '42',
      collectionApprovals: [
        { approvalId: 'a1', fromListId: 'Mint', toListId: 'All' }, // plain mint
        { approvalId: 'a2', fromListId: 'Mint', toListId: 'All', approvalCriteria: { allowBackedMinting: true } }, // IBC deposit
        { approvalId: 'a3', fromListId: 'All', toListId: 'All', approvalCriteria: { allowBackedMinting: true } }, // IBC withdrawal
        { approvalId: 'a4', fromListId: 'All', toListId: 'All' } // transfer
      ]
    });
    expect(md).toContain('`a1` — mint (token creation) approval for anyone');
    expect(md).toContain('`a2` — IBC deposit/mint approval for anyone');
    expect(md).toContain('`a3` — IBC withdrawal approval for anyone');
    expect(md).toContain('`a4` — transfer approval for anyone');
  });

  it('deduplicates and formats all denominations seen across approvals and backing', () => {
    const md = buildKeyReferenceSection({
      collectionApprovals: [
        { approvalId: 'a1', fromListId: 'All', toListId: 'All', approvalCriteria: { coinTransfers: [{ coins: [{ denom: 'ubadge', amount: '1' }, { denom: 'ubadge', amount: '2' }] }] } }
      ],
      invariants: { cosmosCoinBackedPath: { address: 'bb1', conversion: { sideA: { denom: 'unknown-denom' } } } }
    });
    expect(md).toContain('**Denominations used**');
    expect(md).toContain('`ubadge` = **BADGE** (9 decimals)');
    expect(md).toContain('`unknown-denom` = unknown-denom');
  });
});

// ---------------------------------------------------------------------------
// Constants contract
// ---------------------------------------------------------------------------

describe('PERM_KEYS and PERM_DESCRIPTIONS', () => {
  it('PERM_KEYS covers every key of PERM_DESCRIPTIONS', () => {
    expect(PERM_KEYS.sort()).toEqual(Object.keys(PERM_DESCRIPTIONS).sort());
  });

  it('every permission description has all three state copies', () => {
    for (const [key, info] of Object.entries(PERM_DESCRIPTIONS)) {
      expect(info.label).toBeTruthy();
      expect(info.lockedDesc).toBeTruthy();
      expect(info.openDesc).toBeTruthy();
      expect(info.undecidedDesc).toBeTruthy();
      // Sanity: no placeholder leftovers
      expect(info.lockedDesc).not.toMatch(/TODO|FIXME/i);
      expect(key).toBeTruthy();
    }
  });
});

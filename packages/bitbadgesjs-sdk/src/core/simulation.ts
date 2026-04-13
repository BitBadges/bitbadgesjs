import { BigIntify } from '@/common/string-numbers.js';
import { BalanceArray } from './balances.js';
import type { iBalance } from '@/interfaces/types/core.js';
import type { NumberType } from '@/common/string-numbers.js';

/**
 * A single event from Cosmos SDK simulation.
 *
 * @category Simulation
 */
export interface SimulationEvent {
  type: string;
  attributes: { key: string; value: string }[];
}

/**
 * A coin (native token) transfer event parsed from simulation.
 *
 * @category Simulation
 */
export interface CoinTransferEvent {
  from: string;
  to: string;
  amount: bigint;
  denom: string;
  isProtocolFee: boolean;
}

/**
 * A badge transfer event parsed from simulation.
 *
 * @category Simulation
 */
export interface BadgeTransferEvent {
  from: string;
  to: string;
  balances: BalanceArray<bigint>;
  collectionId: string;
}

/**
 * An IBC transfer event parsed from transaction messages.
 *
 * @category Simulation
 */
export interface IbcTransferEvent {
  from: string;
  to: string;
  amount: bigint;
  denom: string;
  sourcePort: string;
  sourceChannel: string;
  receiver: string;
}

/**
 * All parsed events from a simulation.
 *
 * @category Simulation
 */
export interface ParsedSimulationEvents {
  coinTransferEvents: CoinTransferEvent[];
  badgeTransferEvents: BadgeTransferEvent[];
  ibcTransferEvents: IbcTransferEvent[];
}

/**
 * Info about a transaction message, used for IBC transfer detection.
 *
 * @category Simulation
 */
export interface TxMessageInfo {
  type: string;
  msg: Record<string, unknown>;
}

/**
 * Net balance changes per address from a simulation.
 * - coinChanges: address -> denom -> amount (positive = received, negative = sent)
 * - badgeChanges: address -> collectionId -> balances
 *
 * @category Simulation
 */
export interface NetBalanceChanges {
  coinChanges: Record<string, Record<string, bigint>>;
  badgeChanges: Record<string, Record<string, BalanceArray<bigint>>>;
}

/**
 * Splits a Cosmos SDK amount+denom string (e.g. "100ubadge") into numeric amount and denom.
 * Handles the edge case of EVM addresses starting with "0x" embedded in denom strings.
 *
 * @internal
 */
function splitAmountDenom(amountStr: string): { amount: bigint; denom: string } {
  let denomStartIdx = -1;
  for (let i = 0; i < amountStr.length; i++) {
    if (isNaN(Number(amountStr[i]))) {
      denomStartIdx = i;
      break;
    }
  }

  if (denomStartIdx < 0) {
    // Entire string is numeric — no denom
    return { amount: BigIntify(amountStr), denom: '' };
  }

  // Special handling for EVM contract addresses starting with "0x"
  if (denomStartIdx > 0 && amountStr[denomStartIdx]?.toLowerCase() === 'x') {
    const charBeforeX = amountStr[denomStartIdx - 1];
    if (charBeforeX === '0') {
      denomStartIdx = denomStartIdx - 1;
    }
  }

  const denom = amountStr.slice(denomStartIdx);
  const numStr = amountStr.slice(0, denomStartIdx);

  return { amount: BigIntify(numStr), denom };
}

/**
 * Parses raw Cosmos SDK simulation events into structured transfer events.
 *
 * Extracts:
 * - Coin transfers from `transfer`, `delegate`, `redelegate` events
 * - Badge transfers from `usedApprovalDetails` events
 * - Mint/burn synthetic transfers from `burn`/`coinbase` events
 * - Protocol fee detection from `usedApprovalDetails` coinTransfers attribute
 * - IBC transfers from transaction message info (MsgTransfer)
 *
 * @param events - Raw events from Cosmos SDK simulation response
 * @param txsInfo - Transaction message info array (used for IBC transfer detection)
 * @returns Parsed simulation events grouped by type
 *
 * @category Simulation
 */
export function parseSimulationEvents(
  events: SimulationEvent[],
  txsInfo: TxMessageInfo[]
): ParsedSimulationEvents {
  const coinTransferEvents: CoinTransferEvent[] = [];

  // Track protocol fee events from usedApprovalDetails for matching against transfer events
  const protocolFeeEvents: Array<{
    from: string;
    to: string;
    amount: bigint;
    denom: string;
    isProtocolFee: boolean;
    fullAmountString: string;
  }> = [];

  // First pass: extract protocol fee info from usedApprovalDetails
  for (const event of events) {
    if (event.type === 'usedApprovalDetails') {
      const coinTransfersStr = event.attributes.find((attr) => attr.key === 'coinTransfers')?.value;
      const coinTransfers = JSON.parse(coinTransfersStr && coinTransfersStr !== 'null' ? coinTransfersStr : '[]') as Array<{
        From: string;
        To: string;
        Amount: string;
        Denom: string;
        IsProtocolFee: boolean;
      }>;

      protocolFeeEvents.push(
        ...coinTransfers.map((x) => ({
          from: x.From,
          to: x.To,
          amount: BigIntify(x.Amount),
          denom: x.Denom,
          isProtocolFee: x.IsProtocolFee,
          fullAmountString: `${x.Amount.toString().trim()}${x.Denom}`
        }))
      );
    }
  }

  // Map event types to their sender/recipient attribute keys
  const typeToFields: Record<string, [string, string]> = {
    transfer: ['sender', 'recipient'],
    delegate: ['delegator', 'validator'],
    redelegate: ['validator', 'delegator']
  };

  // Process transfer / delegate / redelegate events
  for (const event of events) {
    const fields = typeToFields[event.type];
    if (!fields) continue;

    const amounts = event.attributes.find((attr) => attr.key === 'amount')?.value;
    const sender = event.attributes.find((attr) => attr.key === fields[0])?.value;
    const recipient = event.attributes.find((attr) => attr.key === fields[1])?.value;

    const allAmounts = amounts?.split(',');
    for (const rawAmount of allAmounts ?? []) {
      if (rawAmount && sender && recipient) {
        const isProtocolFee = protocolFeeEvents.find(
          (x) =>
            x.fullAmountString === rawAmount &&
            x.isProtocolFee &&
            x.from === sender &&
            (x.to === recipient || x.to === 'community_pool')
        );

        const { amount, denom } = splitAmountDenom(rawAmount);

        coinTransferEvents.push({
          from: sender,
          to: recipient,
          amount,
          denom,
          isProtocolFee: !!isProtocolFee
        });
      }
    }
  }

  // Process IBC transfers from message info (MsgTransfer) and simulation events (ibc_transfer).
  // We detect these first so we can suppress the corresponding IBC voucher burns below.
  const ibcTransferEvents: IbcTransferEvent[] = [];
  for (const tx of txsInfo) {
    if (tx.type === 'MsgTransfer') {
      const msg = tx.msg as Record<string, any>;
      if (msg.token && msg.sender && msg.receiver) {
        ibcTransferEvents.push({
          from: msg.sender as string,
          to: 'IBC Transfer',
          amount: BigIntify(msg.token.amount),
          denom: msg.token.denom as string,
          sourcePort: (msg.sourcePort || msg.source_port || '') as string,
          sourceChannel: (msg.sourceChannel || msg.source_channel || '') as string,
          receiver: msg.receiver as string
        });
      }
    }
  }

  // Also detect IBC transfers from simulation events (covers composite msgs like SwapExactAmountInWithIBCTransfer)
  if (ibcTransferEvents.length === 0) {
    const sendPacketEvents = events.filter((e) => e.type === 'send_packet');
    for (const event of events) {
      if (event.type !== 'ibc_transfer') continue;

      const sender = event.attributes.find((attr) => attr.key === 'sender')?.value;
      const receiver = event.attributes.find((attr) => attr.key === 'receiver')?.value;
      const denom = event.attributes.find((attr) => attr.key === 'denom')?.value;
      const amountStr = event.attributes.find((attr) => attr.key === 'amount')?.value;

      if (sender && receiver && denom && amountStr) {
        const msgIndex = event.attributes.find((attr) => attr.key === 'msg_index')?.value;
        const matchingPacket = sendPacketEvents.find(
          (p) => p.attributes.find((a) => a.key === 'msg_index')?.value === msgIndex
        );

        ibcTransferEvents.push({
          from: sender,
          to: 'IBC Transfer',
          amount: BigIntify(amountStr),
          denom,
          sourcePort: matchingPacket?.attributes.find((a) => a.key === 'packet_src_port')?.value ?? '',
          sourceChannel: matchingPacket?.attributes.find((a) => a.key === 'packet_src_channel')?.value ?? '',
          receiver
        });
      }
    }
  }

  // Build a set of IBC burn keys to suppress (IBC voucher burns use ibc/ hash denoms
  // while ibc_transfer events use path form, so we match on amount only + ibc/ prefix)
  const ibcBurnAmounts = new Set<string>();
  for (const ibc of ibcTransferEvents) {
    if (ibc.amount > 0n) {
      ibcBurnAmounts.add(ibc.amount.toString());
    }
  }

  // Process burn / coinbase (mint) events, suppressing IBC voucher burns
  for (const event of events) {
    if (event.type === 'burn' || event.type === 'coinbase') {
      const burner = event.attributes.find((attr) => attr.key === 'burner')?.value;
      const minter = event.attributes.find((attr) => attr.key === 'minter')?.value;
      const rawAmount = event.attributes.find((attr) => attr.key === 'amount')?.value;

      const actor = burner || minter;
      const destination = event.type === 'burn' ? 'Burn' : 'Mint';

      if (actor && rawAmount) {
        const { amount, denom } = splitAmountDenom(rawAmount);

        // Skip burns that are IBC voucher burns (already captured as IBC transfers)
        if (event.type === 'burn' && denom.startsWith('ibc/') && ibcBurnAmounts.has(amount.toString())) {
          ibcBurnAmounts.delete(amount.toString());
          continue;
        }

        coinTransferEvents.push({
          from: event.type === 'burn' ? actor : destination,
          to: event.type === 'burn' ? destination : actor,
          amount,
          denom,
          isProtocolFee: false
        });
      }
    }
  }

  // Process badge transfer events from usedApprovalDetails
  const badgeTransferEvents: BadgeTransferEvent[] = [];
  for (const event of events) {
    if (event.type === 'usedApprovalDetails') {
      const from = event.attributes.find((attr) => attr.key === 'from')?.value;
      const to = event.attributes.find((attr) => attr.key === 'to')?.value;
      const collectionId = event.attributes.find((attr) => attr.key === 'collectionId')?.value;
      const balancesStr = event.attributes.find((attr) => attr.key === 'balances')?.value;
      const balancesObj = JSON.parse(balancesStr && balancesStr !== 'null' ? balancesStr : '[]') as iBalance<bigint>[];

      badgeTransferEvents.push({
        from: from ?? '',
        to: to ?? '',
        balances: BalanceArray.From(balancesObj).convert(BigIntify),
        collectionId: collectionId ?? ''
      });
    }
  }

  return { coinTransferEvents, badgeTransferEvents, ibcTransferEvents };
}

/**
 * Calculates net balance changes per address from parsed simulation events.
 *
 * Aggregates all coin and badge transfers to produce a net view:
 * - Coins sent appear as negative amounts, coins received as positive
 * - Badge balances are subtracted from senders and added to receivers
 * - Optionally includes the transaction fee as a deduction from the signer
 *
 * Special addresses "Mint", "Burn", "Network Fee", and "Protocol Fee" are preserved as-is.
 *
 * @param parsed - Parsed simulation events from `parseSimulationEvents`
 * @param fee - Optional transaction fee to include as a deduction
 * @param signerAddress - The signer's address (fee is deducted from this address)
 * @returns Net balance changes per address
 *
 * @category Simulation
 */
export function calculateNetChanges(
  parsed: ParsedSimulationEvents,
  fee?: { amount: string; denom: string },
  signerAddress?: string
): NetBalanceChanges {
  const coinChanges: Map<string, Map<string, bigint>> = new Map();
  const badgeChanges: Map<string, Map<string, BalanceArray<bigint>>> = new Map();

  // Helper to ensure nested map entries exist (avoids prototype pollution with dynamic keys)
  const ensureCoinEntry = (addr: string, denom: string) => {
    if (!coinChanges.has(addr)) coinChanges.set(addr, new Map());
    const addrMap = coinChanges.get(addr)!;
    if (!addrMap.has(denom)) addrMap.set(denom, 0n);
  };

  // Add fee deduction if provided
  if (fee && signerAddress) {
    const feeAmount = BigIntify(fee.amount);
    const feeDenom = fee.denom || 'ubadge';

    ensureCoinEntry(signerAddress, feeDenom);
    coinChanges.get(signerAddress)!.set(feeDenom, coinChanges.get(signerAddress)!.get(feeDenom)! - feeAmount);

    ensureCoinEntry('Network Fee', feeDenom);
    coinChanges.get('Network Fee')!.set(feeDenom, coinChanges.get('Network Fee')!.get(feeDenom)! + feeAmount);
  }

  // Known fee collector addresses. We only filter transfers TO these when
  // the caller explicitly passed `fee` + `signerAddress` above — in that
  // case the fee is already represented as "Network Fee" and we'd
  // double-count by also aggregating the raw fee-collector transfer.
  // When no fee arg is provided (the standalone/auto simulate path), the
  // chain event IS the only signal we have, so include it like any other
  // transfer — otherwise `coinChanges` ends up empty and the UI prints
  // "No net balance changes detected." while the Transfers section below
  // shows the fee transfer. That contradiction was bug #2.
  const FEE_COLLECTOR_ADDRESSES = new Set([
    'bb17xpfvakm2amg962yls6f84z3kell8c5lnytnhv',
    'cosmos17xpfvakm2amg962yls6f84z3kell8c5lserqta'
  ]);
  const shouldFilterFeeCollector = Boolean(fee && signerAddress);

  // Aggregate coin transfers (skip fee collector only when fee was
  // explicitly accounted for above).
  for (const event of parsed.coinTransferEvents) {
    if (shouldFilterFeeCollector && FEE_COLLECTOR_ADDRESSES.has(event.to)) continue;

    const amount = event.amount;
    const denom = event.denom;

    const from = event.from;
    const to = event.isProtocolFee ? 'Protocol Fee' : event.to;

    // Deduct from sender
    ensureCoinEntry(from, denom);
    coinChanges.get(from)!.set(denom, coinChanges.get(from)!.get(denom)! - amount);

    // Add to recipient
    ensureCoinEntry(to, denom);
    coinChanges.get(to)!.set(denom, coinChanges.get(to)!.get(denom)! + amount);
  }

  // Aggregate IBC transfers as coin deductions
  for (const event of parsed.ibcTransferEvents) {
    const denom = event.denom;

    ensureCoinEntry(event.from, denom);
    coinChanges.get(event.from)!.set(denom, coinChanges.get(event.from)!.get(denom)! - event.amount);

    ensureCoinEntry('IBC Transfer', denom);
    coinChanges.get('IBC Transfer')!.set(denom, coinChanges.get('IBC Transfer')!.get(denom)! + event.amount);
  }

  // Aggregate badge transfers
  for (const event of parsed.badgeTransferEvents) {
    const from = event.from;
    const to = event.to;
    const collectionId = event.collectionId;
    const balances = BalanceArray.From(event.balances);

    // Deduct from sender
    if (!badgeChanges.has(from)) badgeChanges.set(from, new Map());
    const fromMap = badgeChanges.get(from)!;
    if (!fromMap.has(collectionId)) fromMap.set(collectionId, new BalanceArray<bigint>());
    fromMap.set(collectionId, fromMap.get(collectionId)!.subtractBalances(balances, true));

    // Add to recipient
    if (!badgeChanges.has(to)) badgeChanges.set(to, new Map());
    const toMap = badgeChanges.get(to)!;
    if (!toMap.has(collectionId)) toMap.set(collectionId, new BalanceArray<bigint>());
    toMap.set(collectionId, toMap.get(collectionId)!.addBalances(balances));
  }

  // Convert Maps to plain Records for the return type
  const coinResult: Record<string, Record<string, bigint>> = {};
  for (const [addr, denomMap] of coinChanges) {
    coinResult[addr] = Object.create(null);
    for (const [denom, amount] of denomMap) {
      coinResult[addr][denom] = amount;
    }
  }

  const badgeResult: Record<string, Record<string, BalanceArray<bigint>>> = {};
  for (const [addr, collMap] of badgeChanges) {
    badgeResult[addr] = Object.create(null);
    for (const [collId, bal] of collMap) {
      badgeResult[addr][collId] = bal;
    }
  }

  return { coinChanges: coinResult, badgeChanges: badgeResult };
}

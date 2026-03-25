import { BigIntify } from '../common/string-numbers.js';
import { BalanceArray } from './balances.js';
import type { iBalance } from '../interfaces/types/core.js';
import type { NumberType } from '../common/string-numbers.js';

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
    return { amount: BigIntify(amountStr), denom: '' };
  }

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

  const protocolFeeEvents: Array<{
    from: string;
    to: string;
    amount: bigint;
    denom: string;
    isProtocolFee: boolean;
    fullAmountString: string;
  }> = [];

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

  const typeToFields: Record<string, [string, string]> = {
    transfer: ['sender', 'recipient'],
    delegate: ['delegator', 'validator'],
    redelegate: ['validator', 'delegator']
  };

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

  for (const event of events) {
    if (event.type === 'burn' || event.type === 'coinbase') {
      const burner = event.attributes.find((attr) => attr.key === 'burner')?.value;
      const minter = event.attributes.find((attr) => attr.key === 'minter')?.value;
      const rawAmount = event.attributes.find((attr) => attr.key === 'amount')?.value;

      const actor = burner || minter;
      const destination = event.type === 'burn' ? 'Burn' : 'Mint';

      if (actor && rawAmount) {
        const { amount, denom } = splitAmountDenom(rawAmount);

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

  return { coinTransferEvents, badgeTransferEvents, ibcTransferEvents };
}

/**
 * Calculates net balance changes per address from parsed simulation events.
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
  const coinChanges: Record<string, Record<string, bigint>> = {};
  const badgeChanges: Record<string, Record<string, BalanceArray<bigint>>> = {};

  const ensureCoinEntry = (addr: string, denom: string) => {
    if (!coinChanges[addr]) coinChanges[addr] = {};
    if (coinChanges[addr][denom] === undefined) coinChanges[addr][denom] = 0n;
  };

  if (fee && signerAddress) {
    const feeAmount = BigIntify(fee.amount);
    const feeDenom = fee.denom || 'ubadge';

    ensureCoinEntry(signerAddress, feeDenom);
    coinChanges[signerAddress][feeDenom] -= feeAmount;

    ensureCoinEntry('Network Fee', feeDenom);
    coinChanges['Network Fee'][feeDenom] += feeAmount;
  }

  for (const event of parsed.coinTransferEvents) {
    const amount = event.amount;
    const denom = event.denom;

    const from = event.from;
    const to = event.isProtocolFee ? 'Protocol Fee' : event.to;

    ensureCoinEntry(from, denom);
    coinChanges[from][denom] -= amount;

    ensureCoinEntry(to, denom);
    coinChanges[to][denom] += amount;
  }

  for (const event of parsed.ibcTransferEvents) {
    const denom = event.denom;

    ensureCoinEntry(event.from, denom);
    coinChanges[event.from][denom] -= event.amount;

    ensureCoinEntry('IBC Transfer', denom);
    coinChanges['IBC Transfer'][denom] += event.amount;
  }

  for (const event of parsed.badgeTransferEvents) {
    const from = event.from;
    const to = event.to;
    const collectionId = event.collectionId;
    const balances = BalanceArray.From(event.balances);

    if (!badgeChanges[from]) badgeChanges[from] = {};
    if (!badgeChanges[from][collectionId]) badgeChanges[from][collectionId] = new BalanceArray<bigint>();
    badgeChanges[from][collectionId] = badgeChanges[from][collectionId].subtractBalances(balances, true);

    if (!badgeChanges[to]) badgeChanges[to] = {};
    if (!badgeChanges[to][collectionId]) badgeChanges[to][collectionId] = new BalanceArray<bigint>();
    badgeChanges[to][collectionId] = badgeChanges[to][collectionId].addBalances(balances);
  }

  return { coinChanges, badgeChanges };
}

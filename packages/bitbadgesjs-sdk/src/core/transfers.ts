import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import {
  BaseNumberTypeClass,
  convertClassPropertiesAndMaintainNumberTypes,
  ConvertOptions,
  getConverterFunction
} from '@/common/base.js';
import type { iBalance, iTransfer } from '@/interfaces/badges/core.js';
import * as badges from '@/proto/badges/transfers_pb.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { convertToBitBadgesAddress, getConvertFunctionFromPrefix } from '../address-converter/converter.js';
import { GO_MAX_UINT_64, safeAddKeepLeft, safeMultiplyKeepLeft } from '../common/math.js';
import type { NumberType } from '../common/string-numbers.js';
import { BigIntify, Stringify } from '../common/string-numbers.js';
import { Balance, BalanceArray, cleanBalances } from './balances.js';
import { ApprovalIdentifierDetails, MerkleProof } from './misc.js';
import { UintRangeArray } from './uintRanges.js';

/**
 * Transfer is used to represent a transfer of badges. This is compatible with the MsgTransferBadges message.
 *
 * @category Approvals / Transferability
 */
export class Transfer<T extends NumberType> extends BaseNumberTypeClass<Transfer<T>> implements iTransfer<T> {
  from: BitBadgesAddress;
  toAddresses: BitBadgesAddress[];
  balances: BalanceArray<T>;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails<T>;
  merkleProofs?: MerkleProof[];
  memo?: string;
  prioritizedApprovals?: ApprovalIdentifierDetails<T>[];
  onlyCheckPrioritizedCollectionApprovals?: boolean | undefined;
  onlyCheckPrioritizedIncomingApprovals?: boolean | undefined;
  onlyCheckPrioritizedOutgoingApprovals?: boolean | undefined;

  constructor(transfer: iTransfer<T>) {
    super();
    this.from = transfer.from;
    this.toAddresses = transfer.toAddresses;
    this.balances = BalanceArray.From(transfer.balances);
    this.precalculateBalancesFromApproval = transfer.precalculateBalancesFromApproval
      ? new ApprovalIdentifierDetails(transfer.precalculateBalancesFromApproval)
      : undefined;
    this.merkleProofs = transfer.merkleProofs ? transfer.merkleProofs.map((b) => new MerkleProof(b)) : undefined;
    this.memo = transfer.memo;
    this.prioritizedApprovals = transfer.prioritizedApprovals
      ? transfer.prioritizedApprovals.map((b) => new ApprovalIdentifierDetails(b))
      : undefined;
    this.onlyCheckPrioritizedCollectionApprovals = transfer.onlyCheckPrioritizedCollectionApprovals;

    this.onlyCheckPrioritizedIncomingApprovals = transfer.onlyCheckPrioritizedIncomingApprovals;
    this.onlyCheckPrioritizedOutgoingApprovals = transfer.onlyCheckPrioritizedOutgoingApprovals;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): Transfer<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Transfer<U>;
  }

  toProto(): badges.Transfer {
    return new badges.Transfer(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): Transfer<U> {
    return Transfer.fromProto(badges.Transfer.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): Transfer<U> {
    return Transfer.fromProto(badges.Transfer.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.Transfer, convertFunction: (item: NumberType) => U): Transfer<U> {
    return new Transfer<U>({
      from: item.from,
      toAddresses: item.toAddresses,
      balances: item.balances.map((b) => Balance.fromProto(b, convertFunction)),
      precalculateBalancesFromApproval: item.precalculateBalancesFromApproval
        ? ApprovalIdentifierDetails.fromProto(item.precalculateBalancesFromApproval, convertFunction)
        : undefined,
      merkleProofs: item.merkleProofs ? item.merkleProofs.map((b) => MerkleProof.fromProto(b)) : undefined,
      memo: item.memo ? item.memo : undefined,
      prioritizedApprovals: item.prioritizedApprovals
        ? item.prioritizedApprovals.map((b) => ApprovalIdentifierDetails.fromProto(b, convertFunction))
        : undefined,

      onlyCheckPrioritizedCollectionApprovals: item.onlyCheckPrioritizedCollectionApprovals,
      onlyCheckPrioritizedIncomingApprovals: item.onlyCheckPrioritizedIncomingApprovals,
      onlyCheckPrioritizedOutgoingApprovals: item.onlyCheckPrioritizedOutgoingApprovals
    });
  }

  toBech32Addresses(prefix: string): Transfer<T> {
    return new Transfer({
      ...this,
      from: getConvertFunctionFromPrefix(prefix)(this.from),
      toAddresses: this.toAddresses.map((x) => getConvertFunctionFromPrefix(prefix)(x)),
      precalculateBalancesFromApproval: this.precalculateBalancesFromApproval?.toBech32Addresses(prefix),
      prioritizedApprovals: this.prioritizedApprovals?.map((x) => x.toBech32Addresses(prefix))
    });
  }
}

/**
 * @category Interfaces
 */
export interface iOffChainBalancesMap<T extends NumberType> {
  [bitbadgesAddressOrListId: string]: iBalance<T>[];
}

/**
 * @category Balances
 *
 * @typedef {Object} OffChainBalancesMap
 *
 * OffChainBalancesMap is a map of BitBadges addresses or listIDs to an array of balances. This is the expected format
 * for collections with off-chain balances. Host this on your server in JSON format.
 */
export interface OffChainBalancesMap<T extends NumberType> {
  [bitbadgesAddressOrListId: string]: BalanceArray<T>;
}

/**
 * @category Balances
 */
export function convertOffChainBalancesMap<T extends NumberType, U extends NumberType>(
  item: iOffChainBalancesMap<T>,
  convertFunction: (item: NumberType) => U
): OffChainBalancesMap<U> {
  const newMap: OffChainBalancesMap<U> = {};
  for (const [key, value] of Object.entries(item)) {
    newMap[key] = BalanceArray.From(value).convert(convertFunction);
  }

  return newMap;
}

/**
 * @category Interfaces
 */
export interface iTransferWithIncrements<T extends NumberType> extends iTransfer<T> {
  /** The number of addresses to send the badges to. This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. you know number of codes)). */
  toAddressesLength?: T;

  /** The number to increment the badgeIDs by for each transfer. */
  incrementBadgeIdsBy?: T;

  /** The number to increment the ownershipTimes by for each transfer. */
  incrementOwnershipTimesBy?: T;

  /** The number of unix milliseconds to approve starting from now. */
  approvalDurationFromNow?: T;
}

/**
 * TransferWithIncrements is a type that is used to better handle batch transfers, potentially with incremented badgeIDs.
 *
 * @remarks
 * For example, if you have 100 addresses and want to send 1 badge to each address,
 * you would set toAddressesLength to 100 and incrementIdsBy to 1. This would send badgeIDs 1 to the first address,
 * 2 to the second, and so on.
 *
 * @see
 * This type is compatible with the getBalancesAfterTransfers function and the getTransfersFromTransfersWithIncrements function.
 *
 * @category Approvals / Transferability
 */
export class TransferWithIncrements<T extends NumberType>
  extends BaseNumberTypeClass<TransferWithIncrements<T>>
  implements iTransferWithIncrements<T>
{
  toAddressesLength?: T;
  incrementBadgeIdsBy?: T;
  incrementOwnershipTimesBy?: T;
  approvalDurationFromNow?: T;
  from: BitBadgesAddress;
  toAddresses: BitBadgesAddress[];
  balances: BalanceArray<T>;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails<T>;
  merkleProofs?: MerkleProof[];
  memo?: string;
  prioritizedApprovals?: ApprovalIdentifierDetails<T>[];
  onlyCheckPrioritizedCollectionApprovals?: boolean | undefined;
  onlyCheckPrioritizedIncomingApprovals?: boolean | undefined;
  onlyCheckPrioritizedOutgoingApprovals?: boolean | undefined;

  constructor(data: iTransferWithIncrements<T>) {
    super();
    this.toAddressesLength = data.toAddressesLength;
    this.incrementBadgeIdsBy = data.incrementBadgeIdsBy;
    this.incrementOwnershipTimesBy = data.incrementOwnershipTimesBy;
    this.approvalDurationFromNow = data.approvalDurationFromNow;
    this.from = data.from;
    this.toAddresses = data.toAddresses;
    this.balances = BalanceArray.From(data.balances);
    this.precalculateBalancesFromApproval = data.precalculateBalancesFromApproval
      ? new ApprovalIdentifierDetails(data.precalculateBalancesFromApproval)
      : undefined;
    this.merkleProofs = data.merkleProofs ? data.merkleProofs.map((b) => new MerkleProof(b)) : undefined;
    this.memo = data.memo;
    this.prioritizedApprovals = data.prioritizedApprovals ? data.prioritizedApprovals.map((b) => new ApprovalIdentifierDetails(b)) : undefined;
    this.onlyCheckPrioritizedCollectionApprovals = data.onlyCheckPrioritizedCollectionApprovals;
    this.onlyCheckPrioritizedCollectionApprovals = data.onlyCheckPrioritizedCollectionApprovals;
    this.onlyCheckPrioritizedCollectionApprovals = data.onlyCheckPrioritizedCollectionApprovals;
  }

  getNumberFieldNames(): string[] {
    return ['toAddressesLength', 'incrementBadgeIdsBy', 'incrementOwnershipTimesBy', 'approvalDurationFromNow'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TransferWithIncrements<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TransferWithIncrements<U>;
  }
}

/**
 * Given some transfers (potentially incremented), return the balance map to store as a JSON for a collection with off-chain balances.
 *
 * @category Balances
 */
export const createBalanceMapForOffChainBalances = <T extends NumberType>(transfersWithIncrements: iTransferWithIncrements<T>[]) => {
  const balanceMap: OffChainBalancesMap<T> = {};

  if (transfersWithIncrements.some((x) => x.approvalDurationFromNow)) {
    throw new Error('approvalDurationFromNow is not supported in createBalanceMapForOffChainBalances');
  }

  const transfers = getTransfersFromTransfersWithIncrements(transfersWithIncrements, 0n as T);
  //Calculate new balances of the toAddresses
  for (let idx = 0; idx < transfers.length; idx++) {
    const transfer = transfers[idx];
    for (let j = 0; j < transfer.toAddresses.length; j++) {
      const address = transfer.toAddresses[j];
      const bitbadgesAddress = convertToBitBadgesAddress(address);

      //currBalance is used as a Balance[] type to be compatible with addBalancesForUintRanges
      const currBalances = balanceMap[bitbadgesAddress] ? balanceMap[bitbadgesAddress] : BalanceArray.From<T>([]);
      currBalances.addBalances(transfer.balances);
      balanceMap[bitbadgesAddress] = BalanceArray.From(currBalances);
    }
  }

  return balanceMap;
};

/**
 * Gets the badge IDs to be transferred for a given transfer with increments.
 * @example
 * For a transfer with balances: [{ badgeIds: [{ start: 1n, end: 1n }], amount: 1n }], incrementIdsBy: 1n, toAddressesLength: 1000
 * We return { badgeIds: [{ start: 1n, end: 1000n }] because we increment the badgeIds by 1 each time.
 *
 * @category Balances
 */
export const getAllBadgeIdsToBeTransferred = <T extends NumberType>(transfers: iTransferWithIncrements<T>[]) => {
  //NOTE: We do not support approvalDurationFromNow in this function since we just return the badgeIds

  const allBadgeIds: UintRangeArray<T> = UintRangeArray.From([]);
  const transfersConverted = transfers.map((transfer) => new TransferWithIncrements(transfer));

  for (const transfer of transfersConverted) {
    for (const balance of transfer.balances) {
      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = balance.badgeIds.clone();
      const ownershipTimes = balance.ownershipTimes.clone();

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnershipTimesBy) {
        allBadgeIds.push(...badgeIds.clone());
      } else {
        for (let i = 0; i < numRecipients; i++) {
          allBadgeIds.push(...badgeIds.clone());
          allBadgeIds.sortAndMerge();

          for (const badgeId of badgeIds) {
            badgeId.start = safeAddKeepLeft(badgeId.start, transfer.incrementBadgeIdsBy || 0n);
            badgeId.end = safeAddKeepLeft(badgeId.end, transfer.incrementBadgeIdsBy || 0n);
          }

          for (const ownershipTime of ownershipTimes) {
            ownershipTime.start = safeAddKeepLeft(ownershipTime.start, transfer.incrementOwnershipTimesBy || 0n);
            ownershipTime.end = safeAddKeepLeft(ownershipTime.end, transfer.incrementOwnershipTimesBy || 0n);
          }
        }
      }
    }
  }

  return allBadgeIds;
};

/**
 * Gets the balances to be transferred for a given transfer with increments.
 * @example
 * For a transfer with balances: [{ badgeIds: [{ start: 1n, end: 1n }], amount: 1n }], incrementIdsBy: 1n, toAddressesLength: 1000
 * We return [{ badgeIds: [{ start: 1n, end: 1000n }], amount: 1n }] because we transfer x1 badge to 1000 addresses
 * and increment the badgeIds by 1 each time.
 *
 *
 * This is really inefficient and should be optimized for large N.
 *
 * @category Balances
 */
export const getAllBalancesToBeTransferred = <T extends NumberType>(transfers: iTransferWithIncrements<T>[], blockTime: T) => {
  const allBalances = BalanceArray.From([
    {
      amount: GO_MAX_UINT_64,
      badgeIds: UintRangeArray.FullRanges(),
      ownershipTimes: UintRangeArray.FullRanges()
    }
  ]);
  const allBalancesCopy = allBalances.clone();

  const transfersConverted = transfers.map((transfer) => new TransferWithIncrements(transfer).convert(BigIntify));
  const remainingBalances = getBalancesAfterTransfers(allBalances, transfersConverted, BigIntify(blockTime), true);

  allBalancesCopy.subtractBalances(remainingBalances, true);
  return allBalancesCopy;
};

/**
 * Converts a TransferWithIncrements<bigint>[] to a Transfer<bigint>[].
 *
 * Note that if there are N increments, this will create N transfers.
 *
 * @param {TransferWithIncrements<bigint>[]} transfersWithIncrements - The list of transfers with increments.
 *
 * @category Balances
 */
export const getTransfersFromTransfersWithIncrements = <T extends NumberType>(
  transfersWithIncrements: iTransferWithIncrements<T>[],
  blockTime: T
) => {
  const transfers: Transfer<T>[] = [];

  const transfersConverted = transfersWithIncrements.map((transfer) => new TransferWithIncrements(transfer));
  for (const transferExtended of transfersConverted) {
    const { toAddressesLength, incrementBadgeIdsBy, incrementOwnershipTimesBy, approvalDurationFromNow, ...transfer } = transferExtended;
    const length = toAddressesLength ? Number(toAddressesLength) : transfer.toAddresses.length;

    //If badges are incremented, we create N unique transfers (one to each address).
    //Else, we can create one transfer with N addresses
    if (incrementBadgeIdsBy || incrementOwnershipTimesBy || approvalDurationFromNow) {
      const currBalances = transfer.balances.clone();
      for (let i = 0; i < length; i++) {
        transfers.push(
          new Transfer({
            ...transfer,
            toAddresses: [transfer.toAddresses[i]],
            balances: currBalances.clone()
          })
        );

        for (const balance of currBalances) {
          for (const badgeId of balance.badgeIds) {
            badgeId.start = safeAddKeepLeft(badgeId.start, incrementBadgeIdsBy || 0n);
            badgeId.end = safeAddKeepLeft(badgeId.end, incrementBadgeIdsBy || 0n);
          }

          if (approvalDurationFromNow) {
            balance.ownershipTimes = UintRangeArray.From([{ start: blockTime, end: safeAddKeepLeft(blockTime, approvalDurationFromNow || 0n) }]);
          } else {
            for (const ownershipTime of balance.ownershipTimes) {
              ownershipTime.start = safeAddKeepLeft(ownershipTime.start, incrementOwnershipTimesBy || 0n);
              ownershipTime.end = safeAddKeepLeft(ownershipTime.end, incrementOwnershipTimesBy || 0n);
            }
          }
        }
      }
    } else {
      transfers.push(new Transfer(transfer));
    }
  }

  return transfers;
};

/**
 * Returns the post balance after a transfer of x(amountToTransfer * numRecipients) from startBadgeId to endBadgeId
 *
 * @param {Balance<bigint>[]} balance - The balance to subtract from.
 * @param {bigint} startBadgeId - The start badge ID to subtract from.
 * @param {bigint} endBadgeId - The end badge ID to subtract from.
 * @param {bigint} amountToTransfer - The amount to subtract.
 * @param {bigint} numRecipients - The number of recipients to subtract from.
 *
 * @category Balances
 */
export const getBalanceAfterTransfer = <T extends NumberType>(
  balance: iBalance<T>[],
  startBadgeId: T,
  endBadgeId: T,
  ownershipTimeStart: T,
  ownershipTimeEnd: T,
  amountToTransfer: T,
  numRecipients: T,
  allowUnderflow?: boolean
) => {
  const convertFunction = getConverterFunction(startBadgeId);
  const balanceCopy = BalanceArray.From(balance.map((balance) => new Balance(balance))).clone();
  balanceCopy.subtractBalances(
    [
      {
        amount: convertFunction(BigInt(amountToTransfer) * BigInt(numRecipients)),
        badgeIds: [{ start: startBadgeId, end: endBadgeId }],
        ownershipTimes: [{ start: ownershipTimeStart, end: ownershipTimeEnd }]
      }
    ],
    !!allowUnderflow
  );

  return cleanBalances(balanceCopy);
};

/**
 * Returns the balance after a set of TransferWithIncrements<bigint>[].
 *
 * @param {Balance<bigint>[]} startBalance - The balance to subtract from.
 * @param {TransferWithIncrements<bigint>[]} transfers - The transfers that are being sent.
 *
 * @category Balances
 */
export const getBalancesAfterTransfers = <T extends NumberType>(
  startBalance: iBalance<T>[],
  transfersArr: iTransferWithIncrements<T>[],
  blockTime: T,
  allowUnderflow?: boolean
) => {
  let endBalances = BalanceArray.From(startBalance.map((balance) => new Balance(balance))).clone();
  const transfers = transfersArr.map((transfer) => new TransferWithIncrements(transfer));
  for (const transfer of transfers) {
    for (const balance of transfer.balances) {
      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = balance.badgeIds.clone();
      let ownershipTimes = balance.ownershipTimes.clone();

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnershipTimesBy && !transfer.approvalDurationFromNow) {
        for (const badgeId of badgeIds) {
          for (const ownershipTime of ownershipTimes) {
            endBalances = getBalanceAfterTransfer(
              endBalances,
              badgeId.start,
              badgeId.end,
              ownershipTime.start,
              ownershipTime.end,
              balance.amount,
              numRecipients as T,
              allowUnderflow
            );
          }
        }
      } else {
        const fastIncrementBadges = !transfer.incrementBadgeIdsBy || badgeIds.every((x) => x.size() === transfer.incrementBadgeIdsBy);
        const fastIncrementOwnershipTimes =
          !transfer.incrementOwnershipTimesBy ||
          BigInt(transfer.approvalDurationFromNow || 0n) > 0n ||
          ownershipTimes.every((x) => x.size() === transfer.incrementOwnershipTimesBy);

        //If we are incrementing with no gaps (e.g. end IDs will be 1-1000 or start with x1 and increment x1 10000 times)
        if (fastIncrementBadges && fastIncrementOwnershipTimes) {
          for (const badgeId of badgeIds) {
            badgeId.end = safeAddKeepLeft(badgeId.end, safeMultiplyKeepLeft(transfer.incrementBadgeIdsBy || 0n, numRecipients - 1n));
          }

          if (transfer.approvalDurationFromNow) {
            ownershipTimes = UintRangeArray.From([{ start: blockTime, end: safeAddKeepLeft(blockTime, transfer.approvalDurationFromNow || 0n) }]);
          } else {
            for (const ownershipTime of ownershipTimes) {
              ownershipTime.end = safeAddKeepLeft(
                ownershipTime.end,
                safeMultiplyKeepLeft(transfer.incrementOwnershipTimesBy || 0n, numRecipients - 1n)
              );
            }
          }

          for (const badgeId of badgeIds) {
            for (const ownershipTime of ownershipTimes) {
              endBalances = getBalanceAfterTransfer(
                endBalances,
                badgeId.start,
                badgeId.end,
                ownershipTime.start,
                ownershipTime.end,
                balance.amount,
                1n as T,
                allowUnderflow
              );
            }
          }
        } else {
          //If incrementIdsBy is set, then we need to increment the badgeIds after each transfer
          //TODO: This is not efficient, we should be able to LeetCode optimize this somehow. Imagine a claim with 100000000 possible claims.
          for (let i = 0; i < numRecipients; i++) {
            for (const badgeId of badgeIds) {
              for (const ownershipTime of ownershipTimes) {
                endBalances = getBalanceAfterTransfer(
                  endBalances,
                  badgeId.start,
                  badgeId.end,
                  ownershipTime.start,
                  ownershipTime.end,
                  balance.amount,
                  1n as T,
                  allowUnderflow
                );
              }
            }

            if (transfer.incrementBadgeIdsBy) {
              for (const badgeId of badgeIds) {
                badgeId.start = safeAddKeepLeft(badgeId.start, transfer.incrementBadgeIdsBy || 0n);
                badgeId.end = safeAddKeepLeft(badgeId.end, transfer.incrementBadgeIdsBy || 0n);
              }
            }

            if (transfer.incrementOwnershipTimesBy) {
              for (const ownershipTime of ownershipTimes) {
                ownershipTime.start = safeAddKeepLeft(ownershipTime.start, transfer.incrementOwnershipTimesBy || 0n);
                ownershipTime.end = safeAddKeepLeft(ownershipTime.end, transfer.incrementOwnershipTimesBy || 0n);
              }
            } else if (transfer.approvalDurationFromNow) {
              ownershipTimes = UintRangeArray.From([{ start: blockTime, end: safeAddKeepLeft(blockTime, transfer.approvalDurationFromNow || 0n) }]);
            }
          }
        }
      }
    }
  }

  return cleanBalances(endBalances.filterZeroBalances());
};

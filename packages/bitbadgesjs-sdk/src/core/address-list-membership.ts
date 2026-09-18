import type { iCollectionDoc } from '../api-indexer/docs-types/interfaces.js';
import type { iBalance } from '../interfaces/types/core.js';
import { convertToBitBadgesAddress, isAddressValid } from '../address-converter/converter.js';
import { BalanceArray, getBalanceForIdAndTime } from './balances.js';
import { inspectStandardCollection } from './standard-inspection.js';
import { BURN_ADDRESS } from './builders/shared.js';
import { GO_MAX_UINT_64 } from '../common/math.js';
import { MsgTransferTokens } from '../transactions/messages/bitbadges/tokenization/msgTransferTokens.js';
const full = [{ start: 1n, end: GO_MAX_UINT_64 }];
const membership = (amount: bigint) => ({ amount, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: full });
export function getAddressListMembershipAmount(currentBalances: readonly iBalance<bigint>[]) {
  const balances = BalanceArray.From([...currentBalances]).convert(BigInt);
  const amount = getBalanceForIdAndTime(1n, 1n, balances);
  if (amount < 0n || amount > GO_MAX_UINT_64 || !balances.equalBalances(amount > 0n ? [membership(amount)] : []))
    throw new Error('This address has custom membership balances. Manage it in the token view.');
  return amount;
}
/** Caller must supply a fresh balance read; revalidate before signing after user review. */
export function buildAddressListMembershipMsg({
  collection,
  creator,
  address,
  action,
  currentBalances
}: {
  collection: Readonly<iCollectionDoc<bigint>>;
  creator: string;
  address: string;
  action: 'add' | 'remove';
  currentBalances: readonly iBalance<bigint>[];
}) {
  const inspection = inspectStandardCollection(collection, 'address-list');
  if (!inspection.configurationSupported) throw new Error('This collection has custom membership rules. Manage it in the token view.');
  const manager = convertToBitBadgesAddress(creator);
  const member = convertToBitBadgesAddress(address);
  if (!isAddressValid(creator) || !isAddressValid(address) || member === BURN_ADDRESS) throw new Error('Select a valid member wallet.');
  if (manager !== collection.manager) throw new Error('Only the Manager can manage membership.');
  if (action !== 'add' && action !== 'remove') throw new Error('Choose add or remove.');
  if (BigInt(collection.collectionId) <= 0n) throw new Error('Select an existing collection.');
  const amount = getAddressListMembershipAmount(currentBalances);
  if (action === 'add' && amount > 0n) throw new Error('This address is already a member.');
  if (action === 'remove' && amount === 0n) throw new Error('This address is not a member.');
  const approval = collection.collectionApprovals.find((a) => a.approvalId === inspection.actions[action].approvalIds[0])!;
  return new MsgTransferTokens<bigint>({
    creator: manager,
    collectionId: String(collection.collectionId),
    transfers: [
      {
        from: action === 'add' ? 'Mint' : member,
        toAddresses: [action === 'add' ? member : BURN_ADDRESS],
        balances: [membership(action === 'add' ? 1n : amount)],
        prioritizedApprovals: [
          { approvalId: approval.approvalId, approvalLevel: 'collection', approverAddress: '', version: BigInt(approval.version ?? 0) }
        ],
        onlyCheckPrioritizedCollectionApprovals: true
      }
    ]
  });
}

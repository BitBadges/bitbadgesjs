import { buildAddressList } from './builders/address-list.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { buildAddressListMembershipMsg } from './address-list-membership.js';
const manager = convertToBitBadgesAddress('0x' + '1'.repeat(40));
const member = convertToBitBadgesAddress('0x' + '2'.repeat(40));
const full = [{ start: 1n, end: 18446744073709551615n }];
const collection = { ...buildAddressList({ creator: manager, manager, uri: 'ipfs://list' }).value, collectionId: '1', manager } as any;
const balances = (amount: bigint) => [{ amount, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: full }];
it('adds only a missing member with the live approval version', () => {
  collection.collectionApprovals[0].version = '7';
  const msg = buildAddressListMembershipMsg({ collection, creator: manager, address: member, action: 'add', currentBalances: [] });
  expect(msg.transfers[0].balances[0].amount).toBe(1n);
  expect(msg.transfers[0].prioritizedApprovals![0].version).toBe(7n);
});
it('rejects repeated add rather than issuing duplicate membership', () => {
  expect(() =>
    buildAddressListMembershipMsg({ collection, creator: manager, address: member, action: 'add', currentBalances: balances(1n) })
  ).toThrow('already');
});
it('removes all canonical membership units, including legacy duplicates', () => {
  const msg = buildAddressListMembershipMsg({ collection, creator: manager, address: member, action: 'remove', currentBalances: balances(3n) });
  expect(msg.transfers[0].from).toBe(member);
  expect(msg.transfers[0].balances[0].amount).toBe(3n);
});
it('rejects empty removal, nonmanager, and custom ownership ranges', () => {
  expect(() => buildAddressListMembershipMsg({ collection, creator: manager, address: member, action: 'remove', currentBalances: [] })).toThrow(
    'not a member'
  );
  expect(() => buildAddressListMembershipMsg({ collection, creator: member, address: member, action: 'add', currentBalances: [] })).toThrow(
    'Manager'
  );
  expect(() =>
    buildAddressListMembershipMsg({
      collection,
      creator: manager,
      address: member,
      action: 'remove',
      currentBalances: [{ ...balances(1n)[0], ownershipTimes: [{ start: 1n, end: 100n }] }]
    })
  ).toThrow('custom');
});

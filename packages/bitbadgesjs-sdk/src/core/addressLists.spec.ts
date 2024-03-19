import { ethers } from 'ethers';
import { AddressList, convertToCosmosAddress } from '..';

export const genTestAddress = () => {
  const ethAddress = ethers.Wallet.createRandom().address;
  return convertToCosmosAddress(ethAddress);
};
const addressList = new AddressList({
  listId: '1',
  addresses: [genTestAddress()],
  whitelist: false,
  createdBy: '1',
  customData: '',
  uri: ''
});

describe('AddressList', () => {
  it('should create an instance', () => {
    expect(
      new AddressList({
        listId: '1',
        addresses: [],
        whitelist: true,
        createdBy: '1',
        customData: '',
        uri: ''
      })
    ).toBeTruthy();
  });

  it('should check address', () => {
    const addressList = new AddressList({
      listId: '1',
      addresses: [genTestAddress()],
      whitelist: true,
      createdBy: '1',
      customData: '',
      uri: ''
    });

    expect(addressList.checkAddress(genTestAddress())).toBeFalsy();

    expect(addressList.checkAddress(addressList.addresses[0])).toBeTruthy();
  });

  it('should check address - blacklist', () => {
    expect(addressList.checkAddress(genTestAddress())).toBeTruthy();

    expect(addressList.checkAddress(addressList.addresses[0])).toBeFalsy();
  });

  it('should invert', () => {
    const inverted = addressList.invert();
    expect(inverted.whitelist).toBeTruthy();
  });

  it('should remove', () => {
    const removed = addressList.remove(addressList.addresses[0]);
    expect(removed.addresses).toEqual([]);
    expect(addressList.isEmpty()).toBeTruthy();
  });

  it('should get overlaps', () => {
    const addressListTwo = new AddressList({
      listId: '1',
      addresses: [genTestAddress()],
      whitelist: true,
      createdBy: '1',
      customData: '',
      uri: ''
    });

    const overlaps = addressList.getOverlaps(addressListTwo);
    expect(overlaps.addresses).toEqual([]);

    const overlappingList = new AddressList({
      listId: '1',
      addresses: [addressList.addresses[0]],
      whitelist: true,
      createdBy: '1',
      customData: '',
      uri: ''
    });

    const overlapsTwo = addressList.getOverlaps(overlappingList);
    expect(overlapsTwo.addresses).toEqual([addressList.addresses[0]]);
  });

  it('should get overlap details', () => {
    const addressListTwo = new AddressList({
      listId: '1',
      addresses: [genTestAddress()],
      whitelist: true,
      createdBy: '1',
      customData: '',
      uri: ''
    });

    const [remaining, overlaps, removed] = addressList.getOverlapDetails(addressListTwo);
    expect(overlaps.addresses).toEqual([]);
    expect(remaining.addresses).toEqual(addressList.addresses);
    expect(removed.addresses).toEqual(addressListTwo.addresses);

    const overlappingList = new AddressList({
      listId: '1',
      addresses: [addressList.addresses[0]],
      whitelist: true,
      createdBy: '1',
      customData: '',
      uri: ''
    });

    const [remainingTwo, removedTwo, overlapsTwo] = addressList.getOverlapDetails(overlappingList);
    expect(overlapsTwo.addresses).toEqual([addressList.addresses[0]]);
    expect(remainingTwo.addresses).toEqual([]);
    expect(removedTwo.addresses).toEqual(addressList.addresses);
  });

  it('should get reserved list', () => {
    const reserved = AddressList.Reserved('Mint');
    expect(reserved.listId).toEqual('Mint');
    expect(reserved.addresses).toEqual(['Mint']);

    const reservedTracker = AddressList.getReservedTrackerList('!Mint');
    expect(reservedTracker.listId).toEqual('!Mint');
    expect(reservedTracker.addresses).toEqual(['Mint']);
    expect(reservedTracker.whitelist).toBeFalsy();

    const address = genTestAddress();
    const reservedOne = AddressList.Reserved(address);
    expect(AddressList.generateReservedListId(reservedOne)).toEqual(reservedOne.listId);
    expect(AddressList.generateReservedListId(reservedOne.toInverted())).toEqual('!(' + reservedOne.listId + ')');
  });
});

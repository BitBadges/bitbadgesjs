import { bech32 } from 'bech32';
import { AddressList, convertListIdToBech32 } from './addressLists.js';

export const genTestAddress = () => {
  // Generate a random 20-byte buffer (standard Cosmos address length)
  const randomBytes = Buffer.allocUnsafe(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  // Encode as bech32 with 'bb' prefix
  const words = bech32.toWords(randomBytes);
  return bech32.encode('bb', words);
};

describe('AddressList', () => {
  const addressList = new AddressList({
    listId: '1',
    addresses: [genTestAddress()],
    whitelist: false,
    createdBy: '1',
    customData: '',
    uri: ''
  });

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

// ============================================================
// Reserved list ID patterns
// ============================================================

describe('AddressList reserved patterns', () => {
  it('should handle All', () => {
    const list = AddressList.Reserved('All');
    expect(list.whitelist).toBe(false);
    expect(list.addresses).toEqual([]);
  });

  it('should handle AllWithMint', () => {
    const list = AddressList.Reserved('AllWithMint');
    expect(list.whitelist).toBe(false);
    expect(list.addresses).toEqual([]);
    expect(list.listId).toBe('AllWithMint');
  });

  it('should handle None', () => {
    const list = AddressList.Reserved('None');
    expect(list.whitelist).toBe(true);
    expect(list.addresses).toEqual([]);
  });

  it('should handle AllWithout pattern', () => {
    const addr = genTestAddress();
    const list = AddressList.Reserved('AllWithout' + addr);
    expect(list.whitelist).toBe(false);
    expect(list.addresses).toContain(addr);
  });

  it('should handle AllWithout with multiple addresses', () => {
    const addr1 = genTestAddress();
    const addr2 = genTestAddress();
    const list = AddressList.Reserved(`AllWithout${addr1}:${addr2}`);
    expect(list.whitelist).toBe(false);
    expect(list.addresses).toContain(addr1);
    expect(list.addresses).toContain(addr2);
  });

  it('should handle inverted with ! prefix', () => {
    const list = AddressList.Reserved('!Mint');
    expect(list.whitelist).toBe(false); // inverted from true
    expect(list.addresses).toEqual(['Mint']);
    expect(list.listId).toBe('!Mint');
  });

  it('should handle inverted with !(...) syntax', () => {
    const addr = genTestAddress();
    const list = AddressList.Reserved(`!(${addr})`);
    expect(list.whitelist).toBe(false); // inverted from whitelist true
    expect(list.addresses).toContain(addr);
    expect(list.listId).toBe(`!(${addr})`);
  });

  it('should handle colon-separated addresses', () => {
    const addr1 = genTestAddress();
    const addr2 = genTestAddress();
    const list = AddressList.Reserved(`${addr1}:${addr2}`);
    expect(list.whitelist).toBe(true);
    expect(list.addresses).toContain(addr1);
    expect(list.addresses).toContain(addr2);
  });

  it('should throw for invalid address list ID', () => {
    expect(() => AddressList.Reserved('invalidNotAnAddress')).toThrow('Invalid address list ID');
  });

  it('should handle Mint in colon-separated list', () => {
    const addr = genTestAddress();
    const list = AddressList.Reserved(`Mint:${addr}`);
    expect(list.whitelist).toBe(true);
    expect(list.addresses).toContain('Mint');
    expect(list.addresses).toContain(addr);
  });
});

// ============================================================
// generateReservedListId
// ============================================================

describe('generateReservedListId', () => {
  it('should generate None for empty whitelist', () => {
    const id = AddressList.generateReservedListId({ listId: '', addresses: [], whitelist: true, uri: '', customData: '' });
    expect(id).toBe('None');
  });

  it('should generate All for empty blacklist', () => {
    const id = AddressList.generateReservedListId({ listId: '', addresses: [], whitelist: false, uri: '', customData: '' });
    expect(id).toBe('All');
  });

  it('should generate address for single whitelist', () => {
    const addr = genTestAddress();
    const id = AddressList.generateReservedListId({ listId: '', addresses: [addr], whitelist: true, uri: '', customData: '' });
    expect(id).toContain('bb1');
  });

  it('should generate !(addresses) for blacklist with addresses', () => {
    const addr = genTestAddress();
    const id = AddressList.generateReservedListId({ listId: '', addresses: [addr], whitelist: false, uri: '', customData: '' });
    expect(id.startsWith('!(')).toBe(true);
    expect(id.endsWith(')')).toBe(true);
  });
});

// ============================================================
// computeUnion — all 4 cases
// ============================================================

describe('AddressList.computeUnion', () => {
  const addr1 = genTestAddress();
  const addr2 = genTestAddress();
  const addr3 = genTestAddress();

  const makeList = (addresses: string[], whitelist: boolean) =>
    new AddressList({ listId: '', addresses, whitelist, uri: '', customData: '', createdBy: '' });

  it('case 1: whitelist union whitelist', () => {
    const result = AddressList.computeUnion(makeList([addr1], true), makeList([addr2], true));
    expect(result.whitelist).toBe(true);
    expect(result.addresses).toContain(addr1);
    expect(result.addresses).toContain(addr2);
  });

  it('case 1: whitelist union whitelist with overlapping addresses', () => {
    const result = AddressList.computeUnion(makeList([addr1, addr2], true), makeList([addr2, addr3], true));
    expect(result.whitelist).toBe(true);
    expect(result.addresses).toHaveLength(3);
  });

  it('case 2: whitelist union blacklist', () => {
    // Blacklist [addr1, addr2] means "all except addr1, addr2"
    // Union with whitelist [addr1] means "all except addr2" = blacklist [addr2]
    const result = AddressList.computeUnion(makeList([addr1], true), makeList([addr1, addr2], false));
    expect(result.whitelist).toBe(false);
    expect(result.addresses).toEqual([addr2]);
  });

  it('case 3: blacklist union whitelist', () => {
    const result = AddressList.computeUnion(makeList([addr1, addr2], false), makeList([addr1], true));
    expect(result.whitelist).toBe(false);
    expect(result.addresses).toEqual([addr2]);
  });

  it('case 4: blacklist union blacklist', () => {
    // All except [addr1, addr2] union All except [addr2, addr3] = All except [addr2] (intersection)
    const result = AddressList.computeUnion(makeList([addr1, addr2], false), makeList([addr2, addr3], false));
    expect(result.whitelist).toBe(false);
    expect(result.addresses).toEqual([addr2]);
  });
});

describe('AddressList.toUnion', () => {
  it('should return new list without mutating original', () => {
    const addr1 = genTestAddress();
    const addr2 = genTestAddress();
    const list1 = new AddressList({ listId: '1', addresses: [addr1], whitelist: true, uri: '', customData: '', createdBy: '' });
    const list2 = new AddressList({ listId: '2', addresses: [addr2], whitelist: true, uri: '', customData: '', createdBy: '' });
    const result = list1.toUnion(list2);
    expect(result.addresses).toHaveLength(2);
    expect(list1.addresses).toHaveLength(1); // original unchanged
  });
});

// ============================================================
// toInverted / isEmpty / toRemoved
// ============================================================

describe('AddressList misc methods', () => {
  it('toInverted returns new list', () => {
    const list = new AddressList({ listId: '1', addresses: ['a'], whitelist: true, uri: '', customData: '', createdBy: '' });
    const inverted = list.toInverted();
    expect(inverted.whitelist).toBe(false);
    expect(list.whitelist).toBe(true); // original unchanged
  });

  it('toRemoved returns new list', () => {
    const addr = genTestAddress();
    const list = new AddressList({ listId: '1', addresses: [addr], whitelist: true, uri: '', customData: '', createdBy: '' });
    const removed = list.toRemoved(addr);
    expect(removed.addresses).toEqual([]);
    expect(list.addresses).toHaveLength(1); // original unchanged
  });

  it('isEmpty returns true for empty whitelist', () => {
    const list = new AddressList({ listId: '1', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' });
    expect(list.isEmpty()).toBe(true);
  });

  it('isEmpty returns false for non-empty whitelist', () => {
    const list = new AddressList({ listId: '1', addresses: ['a'], whitelist: true, uri: '', customData: '', createdBy: '' });
    expect(list.isEmpty()).toBe(false);
  });

  it('isEmpty returns false for empty blacklist (all addresses)', () => {
    const list = new AddressList({ listId: '1', addresses: [], whitelist: false, uri: '', customData: '', createdBy: '' });
    expect(list.isEmpty()).toBe(false);
  });
});

// ============================================================
// getRemainingAndRemoved — all 4 cases
// ============================================================

describe('AddressList.getOverlapDetails static — all cases', () => {
  const addr1 = genTestAddress();
  const addr2 = genTestAddress();

  const makeList = (addresses: string[], whitelist: boolean) =>
    new AddressList({ listId: '', addresses, whitelist, uri: '', customData: '', createdBy: '' });

  it('case 1: whitelist vs whitelist', () => {
    const [remaining, overlaps] = AddressList.getOverlapDetails(makeList([addr1, addr2], true), makeList([addr2], true));
    expect(overlaps.whitelist).toBe(true);
    expect(overlaps.addresses).toContain(addr2);
    expect(remaining.whitelist).toBe(true);
    expect(remaining.addresses).toContain(addr1);
  });

  it('case 2: whitelist vs blacklist', () => {
    // first = whitelist [addr1], second = blacklist [addr2] (all except addr2)
    const [remaining, overlaps] = AddressList.getOverlapDetails(makeList([addr1], true), makeList([addr2], false));
    // overlaps should contain addr1 (addr1 is in both: it's in first whitelist, and it's not in the blacklist exclusions)
    expect(overlaps.addresses).toContain(addr1);
  });

  it('case 3: blacklist vs whitelist', () => {
    const [remaining, overlaps] = AddressList.getOverlapDetails(makeList([addr1], false), makeList([addr2], true));
    expect(overlaps).toBeDefined();
  });

  it('case 4: blacklist vs blacklist', () => {
    const [remaining, overlaps] = AddressList.getOverlapDetails(makeList([addr1], false), makeList([addr2], false));
    expect(overlaps.whitelist).toBe(false);
  });
});

// ============================================================
// Proto round-trip
// ============================================================

describe('AddressList proto', () => {
  it('should round-trip through proto', () => {
    const addr = genTestAddress();
    const list = new AddressList({ listId: 'test-list', addresses: [addr], whitelist: true, uri: 'https://example.com', customData: 'data', createdBy: '' });
    const proto = list.toProto();
    const restored = AddressList.fromProto(proto);
    expect(restored.listId).toBe('test-list');
    expect(restored.addresses).toContain(addr);
    expect(restored.whitelist).toBe(true);
    expect(restored.uri).toBe('https://example.com');
  });
});

// ============================================================
// convertListIdToBech32
// ============================================================

describe('convertListIdToBech32', () => {
  it('should return unchanged for non-address IDs', () => {
    expect(convertListIdToBech32('All', 'bb')).toBe('All');
    expect(convertListIdToBech32('Mint', 'bb')).toBe('Mint');
    expect(convertListIdToBech32('None', 'bb')).toBe('None');
  });

  it('should convert valid address', () => {
    const addr = genTestAddress();
    const result = convertListIdToBech32(addr, 'bb');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle ! prefix', () => {
    const addr = genTestAddress();
    const result = convertListIdToBech32(`!${addr}`, 'bb');
    expect(result.startsWith('!')).toBe(true);
  });

  it('should handle !(...) syntax', () => {
    const addr = genTestAddress();
    const result = convertListIdToBech32(`!(${addr})`, 'bb');
    expect(result.startsWith('!(')).toBe(true);
    expect(result.endsWith(')')).toBe(true);
  });

  it('should handle AllWithout prefix', () => {
    const addr = genTestAddress();
    const result = convertListIdToBech32(`AllWithout${addr}`, 'bb');
    expect(result.startsWith('AllWithout')).toBe(true);
  });

  it('should return unchanged for non-valid addresses', () => {
    const result = convertListIdToBech32('notanaddress', 'bb');
    expect(result).toBe('notanaddress');
  });
});

import { encodeType, hashStruct } from './hash.js';

it('collects references through nested fixed and dynamic arrays', () => {
  expect(encodeType('Root', { Root: [{ name: 'items', type: 'Item[][2][]' }], Item: [{ name: 'value', type: 'string' }] })).toBe(
    'Root(Item[][2][] items)Item(string value)'
  );
});

it.each(['Item[]x', 'Item[2x]', 'Item[', 'Item]', 'Item' + '[]'.repeat(10000) + 'x'])('rejects malformed array suffixes', (type) => {
  expect(() => encodeType('Root', { Root: [{ name: 'items', type }] })).toThrow('Invalid array type');
});

it('hashes empty nested arrays', () => {
  expect(hashStruct('Root', { items: [] }, { Root: [{ name: 'items', type: 'string[][2][]' }] })).toHaveLength(32);
});

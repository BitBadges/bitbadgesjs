import { makeSignDoc, serializeSignDoc, sortedJsonStringify } from './signDoc.js';

describe('signDoc canonical key sorting', () => {
  it('sorts object keys by UTF-16 / ASCII codepoint order rather than locale collation', () => {
    // In ASCII / UTF-8 byte order: 'A' (65) < 'Z' (90) < '_' (95) < 'a' (97) < 'z' (122).
    // localeCompare orders '_' before 'a' and interleaves uppercase/lowercase ('a' < 'A' or 'A' < 'a' depending on locale).
    const input = {
      b: 1,
      A: 2,
      _x: 3,
      a: 4,
      Z: 5,
      a_b: 6,
      aB: 7
    };
    expect(sortedJsonStringify(input)).toBe('{"A":2,"Z":5,"_x":3,"a":4,"aB":7,"a_b":6,"b":1}');
  });

  it('produces deterministic UTF-8 SignDoc bytes with codepoint-sorted nested keys', () => {
    const doc = makeSignDoc(
      [{ type: 'example/Msg', value: { zField: '1', _field: '2', AField: '3', aField: '4' } }],
      { amount: [{ denom: 'ubadge', amount: '100' }], gas: '200000' },
      'bitbadges-1',
      '',
      '1',
      '0'
    );
    const serialized = new TextDecoder().decode(serializeSignDoc(doc));
    expect(serialized).toContain('"value":{"AField":"3","_field":"2","aField":"4","zField":"1"}');
  });
});

const ROOT_PREFIX = '_';
const TYPE_PREFIX = 'Type';

/**
 * Mirrors `cosmos/evm/ethereum/eip712/types.go::sanitizeTypedef`.
 *
 * `_.foo_bar.baz` becomes `TypeFooBarBaz`. Geth's typed-data validator
 * rejects names containing `.` or `_`, so the canonical Go reference
 * normalises them by title-casing each segment and prefixing the root
 * placeholder (`_`) with `Type`.
 */
export function sanitizeTypedef(str: string): string {
  let out = '';
  const parts = str.split('.');
  for (const part of parts) {
    if (part === ROOT_PREFIX) {
      out += TYPE_PREFIX;
      continue;
    }
    const subparts = part.split('_');
    for (const sub of subparts) {
      out += titleCase(sub);
    }
  }
  return out;
}

/**
 * Mirrors Go's `cases.Title(language.English, cases.NoLower).String`.
 * Capitalises only the first character; leaves the rest of the string
 * unchanged so existing capitalisation in identifiers is preserved.
 */
function titleCase(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function typeDefForPrefix(prefix: string, rootType: string): string {
  if (prefix === ROOT_PREFIX) return rootType;
  return sanitizeTypedef(prefix);
}

export function prefixForSubField(prefix: string, fieldName: string): string {
  return `${prefix}.${fieldName}`;
}

export function typeDefWithIndex(typeDef: string, index: number): string {
  return `${typeDef}${index}`;
}

export const SANITIZE_ROOT_PREFIX = ROOT_PREFIX;

import { convertToBitBadgesAddress } from '../../address-converter/converter.js';
import { paymentRequestV2TermsSchema, type PaymentObligation, type PaymentRequestV2Params } from '../../core/payment-requests-v2.js';

export const PAYMENT_REQUEST_EXAMPLES = [
  { id: 'specific', description: 'One named payer pays once.' },
  { id: 'anyone', description: 'First eligible public payer pays once; recipients are excluded.' },
  { id: 'one', description: 'One of two eligible payers settles a shared obligation.' },
  { id: 'all', description: 'Each named payer owes an independent share.' },
  { id: 'threshold', description: 'Two distinct payers from a three-person roster.' },
  { id: 'installments', description: 'One payer owes two independently timed payments.' },
  { id: 'partial', description: 'One payer settles a target in integer payout quanta.' },
  { id: 'target', description: 'Public contributors share an integer-quantum target.' },
  { id: 'link', description: 'Reusable fixed payments with no finite completion target.' }
] as const;

export function paymentRequestExample(name: string, now = Date.now()): PaymentRequestV2Params {
  if (!PAYMENT_REQUEST_EXAMPLES.some((example) => example.id === name))
    throw new Error(`Unknown payment example ${name}. Choose: ${PAYMENT_REQUEST_EXAMPLES.map((e) => e.id).join(', ')}`);
  const alice = convertToBitBadgesAddress('0x1111111111111111111111111111111111111111');
  const bob = convertToBitBadgesAddress('0x2222222222222222222222222222222222222222');
  const recipient = convertToBitBadgesAddress('0x3333333333333333333333333333333333333333');
  const charlie = convertToBitBadgesAddress('0x4444444444444444444444444444444444444444');
  const month = 30n * 24n * 60n * 60n * 1000n;
  const end = BigInt(now) + month;
  const first: PaymentObligation = {
    id: 'payment-1',
    payer: { kind: 'addresses', addresses: [alice] },
    payouts: [{ recipient, denom: 'ubadge', amount: '1000000' }],
    startTime: '1',
    endTime: end.toString()
  };
  const obligations = [first];
  switch (name) {
    case 'anyone':
      first.payer = { kind: 'anyone' };
      break;
    case 'one':
      first.payer = { kind: 'addresses', addresses: [alice, bob] };
      break;
    case 'all':
      obligations.push({
        ...first,
        id: 'payment-2',
        payer: { kind: 'addresses', addresses: [bob] },
        payouts: [{ recipient, denom: 'ubadge', amount: '2000000' }]
      });
      break;
    case 'threshold':
      first.payer = { kind: 'addresses', addresses: [alice, bob, charlie] };
      first.requiredPayments = '2';
      first.distinctPayers = true;
      break;
    case 'installments':
      obligations.push({ ...first, id: 'payment-2', startTime: (end + 1n).toString(), endTime: (end + month).toString() });
      break;
    case 'partial':
      first.partial = { targetUnits: '10' };
      break;
    case 'target':
      first.payer = { kind: 'anyone' };
      first.partial = { targetUnits: '10' };
      break;
    case 'link':
      first.payer = { kind: 'anyone' };
      first.endTime = ((1n << 64n) - 1n).toString();
      break;
  }
  return {
    ...paymentRequestV2TermsSchema.parse({ version: 2, kind: name === 'link' ? 'payment-link' : 'invoice', obligations }),
    name: `Example: ${name}`,
    image: 'https://example.com/payment.png',
    description: 'Editable payment example. Replace demo addresses, amounts, dates and metadata before creating a collection.'
  };
}

export function withPaymentMetadata(
  input: unknown,
  flags: { uri?: string; name?: string; image?: string; description?: string }
): PaymentRequestV2Params {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Payment parameters must be a JSON object');
  const inline = ['name', 'image', 'description'] as const;
  const hasInline = inline.some((key) => flags[key] !== undefined);
  if (flags.uri !== undefined && hasInline) throw new Error('Choose either --uri or inline metadata flags (--name, --image, --description)');
  const params = { ...input } as PaymentRequestV2Params;
  if (flags.uri !== undefined) {
    params.uri = flags.uri;
    for (const key of inline) delete params[key];
  } else if (hasInline) {
    delete params.uri;
    for (const key of inline) if (flags[key] !== undefined) params[key] = flags[key];
  }
  return params;
}

import { buildPaymentRequestV2, type PaymentRequestV2Params } from '../../../core/payment-requests-v2.js';

export const buildPaymentRequestV2Tool = {
  name: 'build_payment_request_v2',
  description:
    'Build frozen invoice obligations or reusable payment links using native approvals. Supports eligible payer lists, all-of shares, distinct K-of-N, installments, partial targets and atomic recipient splits. Returns an unsigned collection message; never signs or publishes. Subscriptions use the existing Subscriptions standard. Cancellation, escrow, refunds and alternative-currency choices are not supported by this direct-payment standard.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    required: ['version', 'kind', 'obligations'],
    properties: {
      version: { type: 'integer', const: 2 },
      kind: { type: 'string', enum: ['invoice', 'payment-link'] },
      uri: { type: 'string' },
      name: { type: 'string' },
      image: { type: 'string' },
      description: { type: 'string' },
      obligations: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'payer', 'payouts', 'startTime', 'endTime'],
          properties: {
            id: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,64}$' },
            payer: {
              oneOf: [
                { type: 'object', additionalProperties: false, required: ['kind'], properties: { kind: { const: 'anyone' } } },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['kind', 'addresses'],
                  properties: {
                    kind: { const: 'addresses' },
                    addresses: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } }
                  }
                }
              ]
            },
            payouts: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['recipient', 'denom', 'amount'],
                properties: {
                  recipient: { type: 'string' },
                  denom: { type: 'string' },
                  amount: {
                    type: 'string',
                    pattern: '^[1-9][0-9]*$',
                    description: 'Base-unit amount per exact payment, or per partial-payment quantum. All split payouts scale together.'
                  }
                }
              }
            },
            startTime: { type: 'string', description: 'Inclusive Unix millisecond timestamp' },
            endTime: { type: 'string', description: 'Inclusive hard cutoff Unix millisecond timestamp' },
            dueAt: { type: 'string', description: 'Informational due date, within the payment window' },
            requiredPayments: { type: 'string', description: 'Finite invoice payment count; default 1; omit for links and partials' },
            distinctPayers: { type: 'boolean', description: 'At most one payment per eligible payer' },
            partial: {
              type: 'object',
              additionalProperties: false,
              required: ['targetUnits'],
              properties: { targetUnits: { type: 'string', description: 'Cumulative target in integer payout quanta' } }
            }
          }
        }
      }
    }
  }
};

export const handleBuildPaymentRequestV2 = (args: PaymentRequestV2Params) => buildPaymentRequestV2(args);

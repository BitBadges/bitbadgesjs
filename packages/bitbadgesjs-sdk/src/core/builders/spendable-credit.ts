import { isAddressValid } from '../../address-converter/converter.js';
import { parseBuilderInput } from './input-schemas.js';
import {
  BURN_ADDRESS,
  MAX_UINT64,
  FOREVER,
  resolveCoin,
  buildMsg,
  frozenPermissions,
  defaultBalances,
  scalingBalances,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata
} from './shared.js';

export interface SpendableCreditPurchaseOption {
  pricePerPack: string;
  creditsPerPack: string;
  purchaseType: 'fixed' | 'scaled';
  maxPacks?: string;
}

export interface SpendableCreditParams {
  paymentDenom: string;
  provider: string;
  serviceId: string;
  /** Positive integer payment base units per pack. */
  pricePerPack?: string;
  /** Positive whole service units per pack. */
  creditsPerPack?: string;
  purchaseOptions?: SpendableCreditPurchaseOption[];
  /** Inclusive Unix milliseconds; omitted means no expiry. */
  expiresAt?: string;
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
}

export function buildSpendableCredit(params: SpendableCreditParams): any {
  params = parseBuilderInput('spendable-credit', params);
  if (params.purchaseOptions && (params.pricePerPack !== undefined || params.creditsPerPack !== undefined))
    throw new Error('Use purchaseOptions or legacy pack fields, not both.');
  const options: SpendableCreditPurchaseOption[] = params.purchaseOptions ?? [
    {
      pricePerPack: params.pricePerPack ?? '',
      creditsPerPack: params.creditsPerPack ?? '',
      purchaseType: 'scaled'
    }
  ];
  if (!options.length || options.length > 20) throw new Error('Provide between 1 and 20 purchase options.');
  const positive = (value: string, field: string) => {
    if (!/^[1-9][0-9]*$/.test(value) || BigInt(value) > BigInt(MAX_UINT64)) throw new Error(`${field} must be a positive uint64 integer.`);
  };
  positive(params.expiresAt ?? MAX_UINT64, 'expiresAt');
  const normalized = options.map((option) => {
    positive(option.pricePerPack, 'pricePerPack');
    positive(option.creditsPerPack, 'creditsPerPack');
    const ceiling =
      BigInt(MAX_UINT64) /
      (BigInt(option.pricePerPack) > BigInt(option.creditsPerPack) ? BigInt(option.pricePerPack) : BigInt(option.creditsPerPack));
    const maxPacks = option.maxPacks ?? (option.purchaseType === 'fixed' ? '1' : String(ceiling));
    positive(maxPacks, 'maxPacks');
    if (BigInt(maxPacks) > ceiling || (option.purchaseType === 'fixed' && maxPacks !== '1')) throw new Error('Invalid maximum packs.');
    return { ...option, maxPacks };
  });
  if (!params.provider.startsWith('bb1') || !isAddressValid(params.provider)) throw new Error('Provider must be a valid BitBadges address.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(params.serviceId))
    throw new Error('Service ID must contain 1–64 letters, digits, dots, underscores, or hyphens.');
  const coin = resolveCoin(params.paymentDenom);
  const metadata = metadataFromFlat(params);
  if (!metadata) throw new MetadataMissingError('spendable-credit collectionMetadata', ['name', 'image', 'description']);
  const scope = {
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: params.expiresAt ?? MAX_UINT64 }],
    ownershipTimes: FOREVER,
    tokenIds: [{ start: '1', end: '1' }],
    version: '0'
  };
  return buildMsg({
    standards: ['Spendable Credit'],
    customData: JSON.stringify({ spendableCredit: { version: 1, provider: params.provider, serviceId: params.serviceId } }),
    collectionMetadata: metadata,
    tokenMetadata: [tokenMetadataEntry(scope.tokenIds, metadata, 'spendable credit')],
    validTokenIds: scope.tokenIds,
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants: { noCustomOwnershipTimes: true, noForcefulPostMintTransfers: true, disablePoolCreation: true },
    collectionApprovals: [
      ...normalized.map((option, index) => ({
        ...scope,
        approvalId: index === 0 ? 'spendable-purchase' : `spendable-purchase-${index + 1}`,
        fromListId: 'Mint',
        toListId: 'All',
        ...approvalMetadata('Purchase credits', 'Purchase whole service credits. Terms are immutable; purchases are nonrefundable.'),
        approvalCriteria: {
          predeterminedBalances: {
            ...scalingBalances(option.creditsPerPack, option.maxPacks),
            incrementedBalances: {
              ...scalingBalances(option.creditsPerPack, option.maxPacks).incrementedBalances,
              allowAmountScaling: option.purchaseType === 'scaled',
              maxScalingMultiplier: option.purchaseType === 'scaled' ? option.maxPacks : '0'
            }
          },
          coinTransfers: [
            {
              to: params.provider,
              coins: [{ denom: coin.denom, amount: option.pricePerPack }],
              overrideFromWithApproverAddress: false,
              overrideToWithInitiator: false
            }
          ],
          overridesFromOutgoingApprovals: true,
          mustPrioritize: true
        }
      })),
      {
        ...scope,
        approvalId: 'spendable-consume',
        fromListId: '!Mint',
        toListId: BURN_ADDRESS,
        ...approvalMetadata(
          'Consume credits',
          'Holder-authorized consumption is irreversible. The provider verifies the confirmed receipt before service delivery.'
        ),
        approvalCriteria: { requireFromEqualsInitiatedBy: true, mustPrioritize: true }
      }
    ]
  });
}

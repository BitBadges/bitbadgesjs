/**
 * `CosmosCoinUtils` — coin amount math with no precision loss.
 *
 * Wraps a `(denom, amount: bigint, coinDetails?)` triple and provides:
 * - exact raw ↔ display conversion (preserves all decimal digits)
 * - same-denom add/subtract/compare
 * - factor multiply/divide with configurable rounding
 * - slippage % calc + min-amount-after-slippage
 * - USD valuation when given a quote price
 *
 * Ported from the bitbadges-frontend so the CLI and any future SDK
 * consumer can do the same math without re-implementing it.
 */

import type { CoinDetails } from '../common/constants.js';

export enum RoundingMode {
  ROUND_DOWN = 'ROUND_DOWN',
  ROUND_UP = 'ROUND_UP',
  ROUND_HALF_UP = 'ROUND_HALF_UP',
  ROUND_HALF_DOWN = 'ROUND_HALF_DOWN',
  ROUND_HALF_EVEN = 'ROUND_HALF_EVEN'
}

export class CosmosCoinUtils {
  public readonly denom: string;
  public readonly amount: bigint;
  public readonly coinDetails?: CoinDetails;

  constructor(params: { denom: string; amount: bigint; coinDetails?: CoinDetails }) {
    this.denom = params.denom;
    this.amount = params.amount;
    this.coinDetails = params.coinDetails;
  }

  get decimals(): number {
    return this.coinDetails ? Number(this.coinDetails.decimals) : 0;
  }

  get symbol(): string {
    return this.coinDetails?.symbol || this.denom;
  }

  /** Display amount as a number. May lose precision for large values — prefer `getDisplayAmountString` for exactness. */
  getDisplayAmount(): number {
    if (this.decimals === 0) return Number(this.amount);
    return Number(this.amount) / Math.pow(10, this.decimals);
  }

  /** Display amount as a precise string. */
  getDisplayAmountString(precision?: number, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): string {
    const actualPrecision = precision ?? this.decimals;
    if (this.decimals === 0) return this.amount.toString();

    const divisor = BigInt(10 ** this.decimals);
    const quotient = this.amount / divisor;
    const remainder = this.amount % divisor;

    if (remainder === 0n) return quotient.toString();

    const remainderStr = remainder.toString().padStart(this.decimals, '0');
    const decimalPart = remainderStr.slice(0, actualPrecision);

    if (actualPrecision < this.decimals) {
      const nextDigit = parseInt(remainderStr[actualPrecision] || '0');
      let roundedDecimal = decimalPart;
      if (nextDigit >= 5 && roundingMode === RoundingMode.ROUND_UP) {
        const decimalNum = parseInt(decimalPart) + 1;
        roundedDecimal = decimalNum.toString().padStart(actualPrecision, '0');
      }
      return `${quotient}.${roundedDecimal}`;
    }
    return `${quotient}.${decimalPart}`;
  }

  /** Display amount with optional symbol. Default 2 dp, symbol on. */
  getDisplayString(precision: number = 2, showSymbol: boolean = true, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): string {
    const formatted = this.getDisplayAmountString(precision, roundingMode);
    return showSymbol ? `${formatted} ${this.symbol}` : formatted;
  }

  getRawAmountString(): string {
    return this.amount.toString();
  }

  /** USD value as a number. May lose precision for very large amounts. */
  getUsdValue(usdPrice: number | null | undefined, precision: number = 2, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): number | null {
    if (!usdPrice) return null;
    const displayAmount = parseFloat(this.getDisplayAmountString(this.decimals, RoundingMode.ROUND_DOWN));
    const usdValue = displayAmount * usdPrice;
    return roundNumber(usdValue, precision, roundingMode);
  }

  /** USD value as a formatted string (e.g. "$1.23"). Returns null when usdPrice is missing. */
  getUsdValueString(usdPrice: number | null | undefined, precision: number = 2, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): string | null {
    const rounded = this.getUsdValue(usdPrice, precision, roundingMode);
    if (rounded === null) return null;
    return `$${rounded.toFixed(precision)}`;
  }

  withAmount(newAmount: bigint): CosmosCoinUtils {
    return new CosmosCoinUtils({ denom: this.denom, amount: newAmount, coinDetails: this.coinDetails });
  }

  withDenom(newDenom: string, newCoinDetails?: CoinDetails): CosmosCoinUtils {
    return new CosmosCoinUtils({ denom: newDenom, amount: this.amount, coinDetails: newCoinDetails });
  }

  add(other: CosmosCoinUtils): CosmosCoinUtils {
    this.assertSameDenom(other, 'add');
    return this.withAmount(this.amount + other.amount);
  }

  subtract(other: CosmosCoinUtils): CosmosCoinUtils {
    this.assertSameDenom(other, 'subtract');
    return this.withAmount(this.amount - other.amount);
  }

  multiply(factor: number, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): CosmosCoinUtils {
    const { factorBigInt, precisionMultiplier } = decomposeFactor(factor);
    const product = this.amount * factorBigInt;
    return this.withAmount(roundDivision(product, precisionMultiplier, roundingMode));
  }

  divide(divisor: number, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): CosmosCoinUtils {
    const { factorBigInt, precisionMultiplier } = decomposeFactor(divisor);
    const numerator = this.amount * precisionMultiplier;
    return this.withAmount(roundDivision(numerator, factorBigInt, roundingMode));
  }

  isZero(): boolean {
    return this.amount === 0n;
  }

  isGreaterThan(other: CosmosCoinUtils): boolean {
    this.assertSameDenom(other, 'compare');
    return this.amount > other.amount;
  }

  isLessThan(other: CosmosCoinUtils): boolean {
    this.assertSameDenom(other, 'compare');
    return this.amount < other.amount;
  }

  /** Parse a display amount (e.g. "1.5") into raw bigint with `decimals` precision. */
  static fromDisplayAmount(
    displayAmount: number | string,
    denom: string,
    decimals?: number,
    coinDetails?: CoinDetails,
    roundingMode: RoundingMode = RoundingMode.ROUND_DOWN
  ): CosmosCoinUtils {
    const actualDecimals = decimals ?? (coinDetails ? Number(coinDetails.decimals) : 0);
    const displayStr = displayAmount.toString();
    const negative = displayStr.startsWith('-');
    const unsigned = negative ? displayStr.slice(1) : displayStr;
    const [integerPart, decimalPart = ''] = unsigned.split('.');

    const paddedDecimal = decimalPart.padEnd(actualDecimals, '0').slice(0, actualDecimals);
    const fullAmountStr = (integerPart || '0') + paddedDecimal;
    let rawAmount = BigInt(fullAmountStr);

    if (decimalPart.length > actualDecimals) {
      const nextDigit = parseInt(decimalPart[actualDecimals] || '0');
      if (nextDigit >= 5 && roundingMode === RoundingMode.ROUND_UP) {
        rawAmount = rawAmount + 1n;
      }
    }

    return new CosmosCoinUtils({ denom, amount: negative ? -rawAmount : rawAmount, coinDetails });
  }

  static fromRawAmount(rawAmountString: string, denom: string, coinDetails?: CoinDetails): CosmosCoinUtils {
    return new CosmosCoinUtils({ denom, amount: BigInt(rawAmountString), coinDetails });
  }

  static fromCoin(coin: { denom: string; amount: string | bigint }, coinDetails?: CoinDetails): CosmosCoinUtils {
    return new CosmosCoinUtils({
      denom: coin.denom,
      amount: typeof coin.amount === 'string' ? BigInt(coin.amount) : coin.amount,
      coinDetails
    });
  }

  toCoin(): { denom: string; amount: string } {
    return { denom: this.denom, amount: this.getRawAmountString() };
  }

  toString(): string {
    return this.getDisplayString();
  }

  /**
   * Slippage % between expected and actual (positive = received less than expected).
   * Returns 0 when expected is 0.
   */
  static calculateSlippage(expectedAmount: bigint, actualAmount: bigint, precision: number = 6): number {
    if (expectedAmount === 0n) return 0;
    const PRECISION_MULTIPLIER = BigInt(10 ** precision);
    const diff = expectedAmount - actualAmount;
    return Number((diff * 100n * PRECISION_MULTIPLIER) / expectedAmount) / Number(PRECISION_MULTIPLIER);
  }

  /** Minimum acceptable amount given an expected amount and slippage tolerance (e.g. 0.005 = 0.5%). */
  static calculateMinAmount(expectedAmount: bigint, slippageTolerance: number, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): bigint {
    if (expectedAmount === 0n) return 0n;
    const { factorBigInt, precisionMultiplier } = decomposeFactor(slippageTolerance);
    const oneMinusSlippage = precisionMultiplier - factorBigInt;
    return roundDivision(expectedAmount * oneMinusSlippage, precisionMultiplier, roundingMode);
  }

  calculateSlippage(expectedAmount: bigint, precision: number = 6): number {
    return CosmosCoinUtils.calculateSlippage(expectedAmount, this.amount, precision);
  }

  calculateMinAmount(slippageTolerance: number, roundingMode: RoundingMode = RoundingMode.ROUND_DOWN): CosmosCoinUtils {
    return this.withAmount(CosmosCoinUtils.calculateMinAmount(this.amount, slippageTolerance, roundingMode));
  }

  private assertSameDenom(other: CosmosCoinUtils, op: string): void {
    if (other.denom !== this.denom) {
      throw new Error(`Cannot ${op} coins with different denoms: ${this.denom} and ${other.denom}`);
    }
  }
}

export function createCosmosCoin(denom: string, amount: bigint, coinDetails?: CoinDetails): CosmosCoinUtils {
  return new CosmosCoinUtils({ denom, amount, coinDetails });
}

export function createCosmosCoinFromDisplay(
  denom: string,
  displayAmount: number | string,
  decimals: number,
  coinDetails?: CoinDetails,
  roundingMode: RoundingMode = RoundingMode.ROUND_DOWN
): CosmosCoinUtils {
  return CosmosCoinUtils.fromDisplayAmount(displayAmount, denom, decimals, coinDetails, roundingMode);
}

/** Format a number with `maxDecimals` precision, trimming trailing zeros (keeps at least `minDecimals`). */
export function cosmosDecToString(value: number, maxDecimals: number = 3, minDecimals: number = 0): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  if (value === 0) return minDecimals > 0 ? '0.' + '0'.repeat(minDecimals) : '0';

  const str = value.toFixed(maxDecimals);
  const [integerPart, decimalPart] = str.split('.');
  if (!decimalPart) return integerPart;

  let trimmedDecimal = decimalPart.replace(/0+$/, '');
  if (trimmedDecimal.length < minDecimals) trimmedDecimal = trimmedDecimal.padEnd(minDecimals, '0');
  if (trimmedDecimal === '') return integerPart;
  return `${integerPart}.${trimmedDecimal}`;
}

/** Format a percentage value (e.g. 0.005 → "0.5%"). */
export function cosmosPercentToString(value: number, maxDecimals: number = 3): string {
  return `${cosmosDecToString(value * 100, maxDecimals, 0)}%`;
}

// ───────────────────────── internal helpers ─────────────────────────

function decomposeFactor(value: number): { factorBigInt: bigint; precisionMultiplier: bigint } {
  const str = value.toString();
  const decimalPlaces = str.includes('.') ? str.split('.')[1].length : 0;
  return {
    factorBigInt: BigInt(str.replace('.', '')),
    precisionMultiplier: BigInt(10 ** decimalPlaces)
  };
}

function roundDivision(numerator: bigint, denominator: bigint, roundingMode: RoundingMode): bigint {
  const result = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder === 0n) return result;

  switch (roundingMode) {
    case RoundingMode.ROUND_UP:
      return result + 1n;
    case RoundingMode.ROUND_HALF_UP:
      return remainder * 2n >= denominator ? result + 1n : result;
    case RoundingMode.ROUND_HALF_DOWN:
      return remainder * 2n > denominator ? result + 1n : result;
    case RoundingMode.ROUND_HALF_EVEN:
      if (remainder * 2n > denominator) return result + 1n;
      if (remainder * 2n === denominator && result % 2n === 1n) return result + 1n;
      return result;
    default:
      return result; // ROUND_DOWN
  }
}

function roundNumber(value: number, precision: number, roundingMode: RoundingMode): number {
  const multiplier = Math.pow(10, precision);
  switch (roundingMode) {
    case RoundingMode.ROUND_UP:
      return Math.ceil(value * multiplier) / multiplier;
    case RoundingMode.ROUND_HALF_UP:
    case RoundingMode.ROUND_HALF_EVEN:
      return Math.round(value * multiplier) / multiplier;
    case RoundingMode.ROUND_HALF_DOWN:
      return Math.trunc(value * multiplier + 0.5) / multiplier;
    default:
      return Math.floor(value * multiplier) / multiplier;
  }
}

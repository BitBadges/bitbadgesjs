import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BigIntify } from '@/common/string-numbers.js';
import { UNIXMilliTimestamp } from '../docs-types/interfaces.js';

/**
 * @category Interfaces
 */
export interface iMetadata<T extends NumberType> {
  /** The name of this item. */
  name: string;
  /** The description of this item. Supports markdown. */
  description: string;
  /** The image for this item. */
  image: string;
  /** The banner image for this item. */
  bannerImage?: string;
  /** The category for this item (e.g. "Education", "Attendance"). */
  category?: string;
  /** The external URL for this item. */
  externalUrl?: string;
  /** The tags for this item */
  tags?: string[];

  /** The socials for this item */
  socials?: {
    [key: string]: string;
  };

  /** The attributes for this item */
  attributes?: {
    type: string;
    name: string;
    value: string | number | boolean;
  }[];

  /** Header links for this item displayed right under the title */
  additionalInfo?: {
    name: string;
    image: string;
    description: string;
    url?: string;
  }[];

  /** The block the metadata was fetched at. */
  fetchedAtBlock?: T;
  /** The time the metadata was fetched. */
  fetchedAt?: UNIXMilliTimestamp<T>;
  /** Whether the metadata is currently being updated. */
  _isUpdating?: boolean;
}

/**
 * @category Interfaces
 */
export type iMetadataWithoutInternals<T extends NumberType> = Omit<iMetadata<T>, '_isUpdating' | 'fetchedAt' | 'fetchedAtBlock'>;

/**
 * @inheritDoc iMetadata
 * @category Collections
 */
export class Metadata<T extends NumberType> extends BaseNumberTypeClass<Metadata<T>> implements iMetadata<T> {
  fetchedAt?: UNIXMilliTimestamp<T>;
  fetchedAtBlock?: T;
  _isUpdating?: boolean;
  name: string;
  description: string;
  image: string;
  bannerImage?: string;
  category?: string;
  externalUrl?: string;
  tags?: string[];

  socials?: {
    [key: string]: string;
  };

  attributes?: {
    type: string;
    name: string;
    value: string | number | boolean;
  }[];

  additionalInfo?: {
    name: string;
    image: string;
    description: string;
    url?: string;
  }[];

  constructor(data: iMetadata<T>) {
    super();
    this.fetchedAt = data.fetchedAt;
    this.fetchedAtBlock = data.fetchedAtBlock;
    this._isUpdating = data._isUpdating;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this.bannerImage = data.bannerImage;
    this.category = data.category;
    this.externalUrl = data.externalUrl;
    this.tags = data.tags;
    this.socials = data.socials;
    this.attributes = data.attributes;
    this.additionalInfo = data.additionalInfo;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): Metadata<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Metadata<U>;
  }

  /**
   * Returns a new Metadata object with default placeholder values. By default, it returns as <bigint> type, but you can convert it with `.convert` method.
   * ```ts
   * import { Numberify } from 'bitbadgesjs-sdk'
   * const metadata = Metadata.DefaultPlaceholderMetadata().convert(Numberify)
   * ```
   */
  static DefaultPlaceholderMetadata = () =>
    new Metadata({
      name: 'Untitled',
      description: 'No description provided.',
      image: 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E'
    }).convert(BigIntify);

  /**
   * Returns a new Metadata object with default placeholder values. By default, it returns as <bigint> type, but you can convert it with `.convert` method.
   * ```ts
   * import { Numberify } from 'bitbadgesjs-sdk'
   * const metadata = Metadata.ErrorMetadata().convert(Numberify)
   * ```
   */
  static ErrorMetadata = () =>
    new Metadata({
      name: 'Error',
      image:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAb1BMVEX/////AAD/+vr/YWH/VFT/8/P/bW3/Rkb/XFz/2tr/ZGT/Z2f/Vlb/9/f/WFj/Xl7/4uL/cXH/Ly//tbX/UFD/5+f/JCT/urr/jo7/h4f/gYH/xcX/TEz/sLD/dnb/o6P/lpb/FRX/QED/qqr/nJw/P8M9AAAEa0lEQVR4nMVbbXvbIAw0TdzGeWncNHHbteuWbv//Ny5gQ/0CnADp2X2N7EO6M0EGV9UU7VMliveX+O9Np3Z3kvxKPUf5T0qpe7kR3PijI7h0OkCtRPmVeg/93qoBa1F+pQI+aDobIOMDxx9QwehvIeCDEb93BJduHKC2ovweFS5qBmYfvM/vP3Ni080D1JZThQX/rAYT/QV84OGfjKBd5q+xE+UfqbDQ34LJBwF+NwKP/hYrDhWC/IMKXv0tGHwQ4TcjCOhvUeyDKL9WYRsPKPUB4Fdf1d0GhBxLVED850NV1SsQVOADxP9Y66h6D8KyfYD4P+oh8AENNI//Bdz2y5X27hGEbiTyX4+klfAByn9Tj6NrVIN7bv51PbsA+SBRBbr+DqgGSU6E+XskhT5IWKmm6e9GgOZEsg8Q/97Lf3sakQ+OPPwe/S3QnLjn4D9Hrj0w+ADxHwP174F9gEaA+B+j/AQfgM4V8T8cQAJVtQa3iK5QnksuHlDiA5T/Cud/Q30Etwn6oMx/oxp8gBsFOldU/w9S/gZncCuvlD/BRbHnf1GDDB+g/Gn6W6T7APIT9Xc1SPQB4j8n5W+ARjDxAaf+rgZIhdEbDFj/rNaCvlJF/Nv0+vc1QE/jjsa/z+Sv8ErV+OAPCPrIpq9w53oTF/mv7CUH9MEn4t/l19/ggP6dATblr1iQD6Io0d8C+iACnhe+0AdBlOrvRoBW6wEcmfirTB/kzP8hwDcYHvBu/KT7gEt/N4LEGqStf0hI8gGn/g4JNWDf8DGg+0Bq6xN2rgPkNn9h52ogtO3Zg/DfKLbxa3C4R/zJLxQT8es/DwDyC0vwF/OLmpCQv4bYY0jkF5uIyPxCU/FvOr+ID0j+G9WAW4WE+vdg9kFi/hpse+8aSfpbMPogI38NNh8k62/B5IPM/DVYfJClvwWDDwry1yg+g4H4n3YgoNAHiH+H32AU+eAV3Nxsp6KVKmmnyw/kv375hc9g5PKj+n8OcVJnMBD/9/ITdq5ZPiDpbyFwBgPxz47/sp/BQP77nMVz+wDxL48/857BQPX3NR+wc01QAfEHkkFv88hOTNXfgusMRi4/x967Bqp/rOngOIPxhpKIX160966RX/8epWcwSvlLfYD0p/yplJzBQPoTP//I2nun5P+Dxp/tg3L9LfLOYGTOv/4aZJzB+AEuSfz8J2nvnZI/VX9Xg4S9dwn+1BUK4qf7b1QD4t67BrP+FmQfoPknvf5DDZAPhs6VX38Lmg9Q/jn6uxoQOtfE9X8q0D/TE/rAIb/+PUDn2rXgE4+3Qn7gg1OjQ5qrWP4ah/Bq/dr0IcHPfJg+/wz64GIjWn8NOPLXCPhA62/h/dSoXH8Lrw9OzTjE4wOu/M0Ilp1r10xD2nlAyfzjwcIHl3nEzAec+RtMa9At+Gc+4NPfYuKDU+MLGfmAn3/ig7n+Fs4HzPoP+O5Y2lBIK5e/QT8nXj36WxgfiPH3PvDr70ZwFeQ3nWtIfzeCV0H+mw+2c/3/AXHcOnlC34CsAAAAAElFTkSuQmCC',
      description: 'Error'
    }).convert(BigIntify);
}

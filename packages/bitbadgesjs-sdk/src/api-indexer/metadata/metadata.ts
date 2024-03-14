import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { BigIntify } from '@/common/string-numbers';

/**
 * @category Interfaces
 */
export interface iMetadata<T extends NumberType> {
  /** The name of the badge or badge collection. */
  name: string;
  /** The description of the badge or badge collection. */
  description: string;
  /** The image of the badge or badge collection. */
  image: string;
  /** The video of the badge or badge collection. If a standard video is used, this should be a link to the video. We will use image as the poster image. If a youtube video is used, we embed it as an iframe. */
  video?: string;
  /** The creator of the badge or badge collection. */
  creator?: string;
  /** The color of the badge or badge collection. */
  color?: string;
  /** The category of the badge or badge collection (e.g. "Education", "Attendance"). */
  category?: string;
  /** The external URL of the badge or badge collection. */
  externalUrl?: string;
  /** The tags of the badge or badge collection */
  tags?: string[];

  /** The socials of the badge or badge collection */
  socials?: {
    [key: string]: string;
  };

  /** The off-chain transferability info of the badge or badge collection */
  offChainTransferabilityInfo?: {
    host: string;
    assignMethod: string;
  };

  /** The attributes of the badge or badge collection */
  attributes?: {
    type?: 'date' | 'url';
    name: string;
    value: string | number | boolean;
  }[];

  /** The block the metadata was fetched at. */
  fetchedAtBlock?: T;
  /** The time the metadata was fetched. */
  fetchedAt?: T;
  /** Whether the metadata is currently being updated. */
  _isUpdating?: boolean;
}

/**
 * @category Collections
 */
export class Metadata<T extends NumberType> extends BaseNumberTypeClass<Metadata<T>> implements iMetadata<T> {
  fetchedAt?: T;
  fetchedAtBlock?: T;
  _isUpdating?: boolean;
  name: string;
  description: string;
  image: string;
  video?: string;
  creator?: string;
  color?: string;
  category?: string;
  externalUrl?: string;
  tags?: string[];

  socials?: {
    [key: string]: string;
  };

  attributes?: {
    type?: 'date' | 'url';
    name: string;
    value: string | number | boolean;
  }[];

  offChainTransferabilityInfo?: {
    host: string;
    assignMethod: string;
  };

  constructor(data: iMetadata<T>) {
    super();
    this.fetchedAt = data.fetchedAt;
    this.fetchedAtBlock = data.fetchedAtBlock;
    this._isUpdating = data._isUpdating;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this.video = data.video;
    this.creator = data.creator;
    this.color = data.color;
    this.category = data.category;
    this.externalUrl = data.externalUrl;
    this.tags = data.tags;
    this.socials = data.socials;
    this.offChainTransferabilityInfo = data.offChainTransferabilityInfo;
    this.attributes = data.attributes;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): Metadata<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as Metadata<U>;
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
      name: 'Placeholder',
      description:
        'Placeholder metadata may be used for a few reasons, such as when the metadata is not yet available / fetched, the badge is not yet created, or if the metadata violates the terms of service.',
      image: 'ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o'
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

import type { CustomType } from '@/common/base';
import { CustomTypeClass } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';

import axios from 'axios';

/**
 * Fields for the MongoDB database document
 *
 * @category Indexer
 */
export interface Doc {
  /** A unique stringified document ID */
  _docId: string;

  /** A uniuqe document ID (Mongo DB ObjectID) */
  _id?: string;
}

/**
 * If an error occurs, the response will be an ErrorResponse.
 *
 * 400 - Bad Request (e.g. invalid request body)
 * 401 - Unauthorized (e.g. invalid session cookie; must sign in with Blockin)
 * 500 - Internal Server Error
 *
 * @category API Requests / Responses
 */
export interface ErrorResponse {
  /**
   * Serialized error object for debugging purposes. Technical users can use this to debug issues.
   */
  error?: any;
  /**
   * UX-friendly error message that can be displayed to the user. Always present if error.
   */
  errorMessage: string;
  /**
   * Authentication error. Present if the user is not authenticated.
   */
  unauthorized?: boolean;
}

/**
 * @category Interfaces
 */
export interface iBitBadgesApi<T extends NumberType> {
  apiUrl?: string;
  apiKey?: string;
  convertFunction: (num: NumberType) => T;
}

/**
 * Base class for the BitBadges API. It provides a base axios instance and methods for handling API errors.
 *
 * @category API
 */
export class BaseBitBadgesApi<T extends NumberType> {
  axios = axios.create({
    withCredentials: true,
    headers: {
      'Content-type': 'application/json',
      'x-api-key': process.env.BITBADGES_API_KEY
    }
  });
  BACKEND_URL = process.env.BITBADGES_API_URL || 'https://api.bitbadges.io';
  ConvertFunction: (num: NumberType) => T;
  apiKey = process.env.BITBADGES_API_KEY;

  constructor(apiDetails: iBitBadgesApi<T>) {
    this.BACKEND_URL = apiDetails.apiUrl || this.BACKEND_URL;
    this.ConvertFunction = apiDetails.convertFunction;
    this.apiKey = apiDetails.apiKey || this.apiKey;
    this.axios = axios.create({
      withCredentials: true,
      headers: {
        'Content-type': 'application/json',
        'x-api-key': this.apiKey
      }
    });
  }

  async handleApiError(error: any): Promise<void> {
    console.error(error);

    if (error && error.response && error.response.data) {
      const data: ErrorResponse = error.response.data;
      return Promise.reject(data);
    } else {
      return Promise.reject(error);
    }
  }

  assertPositiveInteger(num: NumberType) {
    try {
      BigInt(num);
    } catch (e) {
      throw new Error(`Number is not a valid integer: ${num}`);
    }

    if (BigInt(num) <= 0) {
      throw new Error(`Number is not a positive integer: ${num}`);
    }
  }
}

/**
 * Empty response class for the BitBadges API.
 *
 * @category API Requests / Responses
 */
export class EmptyResponseClass extends CustomTypeClass<EmptyResponseClass> implements CustomType<EmptyResponseClass> {
  constructor(data?: any) {
    super();
  }
}

/**
 * Type for pagination information.
 * @typedef {Object} PaginationInfo
 * @property {string} bookmark - The bookmark to be used to fetch the next X documents. Initially, bookmark should be '' (empty string) to fetch the first X documents. Each time the next X documents are fetched, the bookmark should be updated to the bookmark returned by the previous fetch.
 * @property {boolean} hasMore - Indicates whether there are more documents to be fetched. Once hasMore is false, all documents have been fetched.
 *
 * @category Indexer
 */
export interface PaginationInfo {
  bookmark: string;
  hasMore: boolean;
}

import type { CustomType } from '@/common/base.js';
import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { CollectionId } from '@/interfaces/types/core.js';

import axios from 'axios';

/**
 * @category Indexer
 */
export interface Doc {
  /** A unique stringified document ID */
  _docId: string;

  /** A unique document ID (Mongo DB ObjectID) */
  _id?: string;
}

/**
 * If an error occurs, the response will be an ErrorResponse.
 *
 * 400 - Bad Request (e.g. invalid request body)
 * 401 - Unauthorized
 * 500 - Internal Server Error
 *
 * @category API Requests / Responses
 */
export interface ErrorResponse {
  /**
   * Serialized error object for debugging purposes. Technical users can use this to debug issues.
   */
  error?: string;
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
  appendedHeaders?: Record<string, string>;
}

const SENSITIVE_HEADERS = ['x-api-key', 'authorization', 'cookie', 'set-cookie', 'proxy-authorization'];

function redactHeaderBag(headers: any) {
  if (!headers || typeof headers !== 'object') return;
  for (const key of Object.keys(headers)) {
    const value = headers[key];
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      headers[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && ['common', 'get', 'post', 'put', 'patch', 'delete', 'head'].includes(key)) {
      redactHeaderBag(value);
    }
  }
}

/**
 * Redacts credentials from an axios-style error in place so it is safe to rethrow or log.
 */
export function redactErrorHeaders(error: any): void {
  if (!error || typeof error !== 'object') return;
  for (const holder of [error, error.response]) {
    if (!holder || typeof holder !== 'object') continue;
    if (holder.config) redactHeaderBag(holder.config.headers);
    if ('request' in holder) {
      try {
        holder.request = undefined;
      } catch {
        // ignore non-writable
      }
    }
  }
  if (error.response) redactHeaderBag(error.response.headers);
}

function urlPath(url: unknown, baseURL?: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  try {
    return new URL(url, typeof baseURL === 'string' ? baseURL : 'http://localhost').pathname;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

/**
 * Returns a minimal, credential-free summary of a failed API call.
 */
export function summarizeApiError(error: any): { status?: number; method?: string; path?: string; message: string } {
  const config = error?.config ?? error?.response?.config;
  const data = error?.response?.data;
  const message =
    (data && typeof data.errorMessage === 'string' && data.errorMessage) || (typeof error?.message === 'string' ? error.message : String(error));
  return {
    status: error?.response?.status,
    method: typeof config?.method === 'string' ? config.method.toUpperCase() : undefined,
    path: urlPath(config?.url, config?.baseURL),
    message
  };
}

/**
 * Base class for the BitBadges API. It provides a base axios instance and methods for handling API errors.
 *
 * @category API
 */
export class BaseBitBadgesApi<T extends NumberType> {
  axios: ReturnType<typeof axios.create>;
  BACKEND_URL: string;
  ConvertFunction: (num: NumberType) => T;
  apiKey: string | undefined;
  accessToken = '';
  appendedHeaders: Record<string, string> = {};

  constructor(apiDetails: iBitBadgesApi<T>) {
    // Use optional chaining to avoid ReferenceError in browsers without process shim
    const envApiKey = typeof process !== 'undefined' ? process.env?.BITBADGES_API_KEY : undefined;
    const envApiUrl = typeof process !== 'undefined' ? process.env?.BITBADGES_API_URL : undefined;

    this.BACKEND_URL = apiDetails.apiUrl || envApiUrl || 'https://api.bitbadges.io';
    this.ConvertFunction = apiDetails.convertFunction;
    this.apiKey = apiDetails.apiKey || envApiKey;
    this.appendedHeaders = apiDetails.appendedHeaders || {};
    this.axios = axios.create({
      withCredentials: true,
      headers: {
        'Content-type': 'application/json',
        'x-api-key': this.apiKey,
        ...apiDetails.appendedHeaders
      }
    });
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  unsetAccessToken() {
    this.accessToken = '';
    delete this.axios.defaults.headers.common['Authorization'];
  }

  async handleApiError(error: any): Promise<void> {
    redactErrorHeaders(error);
    console.error(summarizeApiError(error));

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

  assertPositiveCollectionId(collectionId: CollectionId) {
    const num = Number(collectionId.split('-')[0]);
    this.assertPositiveInteger(num);
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
 *
 * @category Indexer
 */
export interface PaginationInfo {
  /** The bookmark for the next page of results. Obtained from previous response. */
  bookmark: string;
  /** Whether there are more results to fetch. */
  hasMore: boolean;
}

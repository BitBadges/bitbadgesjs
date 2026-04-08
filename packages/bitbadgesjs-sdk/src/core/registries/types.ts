/**
 * Translation function type for registry validation messages.
 * When used in a browser with i18next, pass `t` from i18next.
 * In SDK / Node.js contexts the default identity function returns the key as-is (English).
 */
export type TFunction = (key: string, opts?: any) => string;
export const defaultT: TFunction = (key: string) => key;

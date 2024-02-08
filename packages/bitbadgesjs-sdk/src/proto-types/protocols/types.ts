/**
 * Protocol type
 *
 * @typedef {Object} Protocol
 *
 * @property {string} name - The name of the protocol.
 * @property {string} uri - The URI of the protocol.
 * @property {string} customData - The custom data of the protocol.
 * @property {string} createdBy - The cosmos address of the user who created the protocol.
 * @property {boolean} isFrozen - Whether the protocol is frozen or not.
 */
export interface Protocol {
  name: string;
  uri: string;
  customData: string;
  createdBy: string;
  isFrozen: boolean;
}

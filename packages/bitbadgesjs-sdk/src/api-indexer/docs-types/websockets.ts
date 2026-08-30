import type { NumberType } from '@/common/string-numbers.js';
import type { iNotificationDoc } from './interfaces.js';

/**
 * Messages pushed from the indexer websocket to a signed-in client on their
 * per-user notification channel. The channel is bound to the authenticated
 * session on the websocket upgrade — clients never specify which address's
 * notifications to receive, so these messages are always for the connected user.
 *
 * @category Websockets
 */
export type NotificationWsServerMessage<T extends NumberType> =
  | {
      type: 'notification';
      /** A newly created in-app notification for the connected user. */
      notification: iNotificationDoc<T>;
    }
  | {
      type: 'unread_count';
      /** The connected user's current unread count. */
      count: number;
    };

/**
 * Control messages a client may send on the notification websocket.
 * Subscription is implicit (derived from the authenticated session), so the
 * only client message is a heartbeat keepalive.
 *
 * @category Websockets
 */
export type NotificationWsClientMessage = { type: 'heartbeat' };

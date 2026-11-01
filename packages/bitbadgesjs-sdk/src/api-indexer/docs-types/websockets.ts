/** Authenticated inbox invalidation. Refetch the durable inbox and unread count; no private event data is pushed. */
export type NotificationWsServerMessage = { type: 'notifications_changed' };

/** Subscription identity comes from the signed session, never the message body. */
export type NotificationWsClientMessage = { type: 'heartbeat' };

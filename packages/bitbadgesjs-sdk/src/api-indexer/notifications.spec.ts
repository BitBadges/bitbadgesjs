import { BitBadgesAdminAPI } from './BitBadgesApi.js';
import { NotificationDoc } from './docs-types/docs.js';

describe('authenticated notification API', () => {
  const api = new BitBadgesAdminAPI<bigint>({ apiKey: 'test', convertFunction: BigInt });
  afterEach(() => jest.restoreAllMocks());

  it('keeps pagination opaque and converts timestamp without changing coin base units', async () => {
    const get = jest.spyOn(api.axios, 'get').mockResolvedValue({
      data: {
        notifications: [
          {
            _docId: 'event',
            bitbadgesAddress: 'wallet',
            type: 'bank_send',
            read: false,
            createdAt: '123',
            title: 'Coins received',
            payload: { bankSend: { fromAddress: 'sender', toAddress: 'wallet', amount: [{ amount: '900719925474099312345', denom: 'uusdc' }] } }
          }
        ],
        pagination: { bookmark: 'opaque-cursor', hasMore: true }
      }
    });
    const response = await api.getNotifications({ types: ['bank_send'], unreadOnly: true, bookmark: 'previous' });
    expect(get).toHaveBeenCalledWith(expect.stringContaining('/api/v0/notifications'), {
      params: { types: ['bank_send'], unreadOnly: true, bookmark: 'previous' }
    });
    expect(response.notifications[0]).toBeInstanceOf(NotificationDoc);
    expect(response.notifications[0].createdAt).toBe(123n);
    expect(response.notifications[0].payload?.bankSend?.amount[0].amount).toBe('900719925474099312345');
    expect(response.pagination.bookmark).toBe('opaque-cursor');
  });

  it('sends explicit read=false and preference booleans unchanged', async () => {
    const post = jest.spyOn(api.axios, 'post').mockResolvedValue({ data: { updated: 1, success: true } });
    await api.markNotificationsRead({ notificationIds: ['event'], read: false });
    expect(post).toHaveBeenLastCalledWith(expect.stringContaining('/notifications/read'), { notificationIds: ['event'], read: false });
    await api.updateNotificationPreferences({ preferences: { inAppEnabled: false, ignoreIfInitiator: true } });
    expect(post).toHaveBeenLastCalledWith(expect.stringContaining('/notifications/preferences'), {
      preferences: { inAppEnabled: false, ignoreIfInitiator: true }
    });
  });
});

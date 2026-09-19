import { sessionFilePath } from './fileStore.js';

describe('sessionFilePath', () => {
  it('keeps session files within the configured directory', () => {
    expect(sessionFilePath('session-1', '/tmp/bitbadges-sessions')).toBe('/tmp/bitbadges-sessions/session-1.json');
    expect(() => sessionFilePath('../outside', '/tmp/bitbadges-sessions')).toThrow('Invalid session ID');
    expect(() => sessionFilePath('/absolute', '/tmp/bitbadges-sessions')).toThrow('Invalid session ID');
  });
});

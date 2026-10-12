import { toolFailureHint } from './tool.js';

describe('toolFailureHint', () => {
  it('points at the tool list only when the tool name or input is the problem', () => {
    for (const message of ['Unknown tool "bild_token"', 'Invalid input: expected string, received number', 'Required field "network" is missing'])
      expect(toolFailureHint(message)).toContain('bb dev tools list');
  });

  it('does not send someone to check a tool name when the tool ran and failed', () => {
    for (const message of ['A collection this size needs an API key to open the browser review.', 'insufficient funds for fees', 'Simulation failed: account sequence mismatch']) {
      const hint = toolFailureHint(message);
      expect(hint).not.toContain('tool name');
      expect(hint).not.toContain('tools list');
    }
  });

  it('warns that a signing or submission may have gone out before trying again', () => {
    expect(toolFailureHint('Browser request could not start.')).toMatch(/bb dev requests status/);
  });
});

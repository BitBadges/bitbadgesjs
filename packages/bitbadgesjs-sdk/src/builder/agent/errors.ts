/**
 * Typed error classes for BitBadgesAgent.
 *
 * Consumers can dispatch on `instanceof` to handle categories
 * distinctly:
 *
 * ```ts
 * try { await agent.build(prompt) } catch (e) {
 *   if (e instanceof QuotaExceededError) retryLater();
 *   else if (e instanceof ValidationFailedError) showErrors(e.errors);
 *   else throw e;
 * }
 * ```
 */

export class BitBadgesAgentError extends Error {
  readonly code: string;
  readonly statusCode: number;
  constructor(message: string, code = 'BITBADGES_AGENT_ERROR', statusCode = 500) {
    super(message);
    this.name = 'BitBadgesAgentError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, BitBadgesAgentError.prototype);
  }
}

export class ValidationFailedError extends BitBadgesAgentError {
  readonly errors: readonly { code: string; message: string; path?: string; fixHint?: string }[];
  readonly transaction: any;
  readonly advisoryNotes: readonly string[];
  constructor(
    errors: { code: string; message: string; path?: string; fixHint?: string }[],
    transaction: any,
    advisoryNotes: string[] = []
  ) {
    super(
      `Validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}: ${errors.map((e) => e.message).join('; ')}`,
      'VALIDATION_FAILED',
      400
    );
    this.name = 'ValidationFailedError';
    this.errors = errors;
    this.transaction = transaction;
    this.advisoryNotes = advisoryNotes;
    Object.setPrototypeOf(this, ValidationFailedError.prototype);
  }
}

export class QuotaExceededError extends BitBadgesAgentError {
  readonly tokensUsed: number;
  readonly tokenCap: number;
  constructor(tokensUsed: number, tokenCap: number) {
    super(`Token budget exceeded: used ${tokensUsed} of ${tokenCap}`, 'QUOTA_EXCEEDED', 402);
    this.name = 'QuotaExceededError';
    this.tokensUsed = tokensUsed;
    this.tokenCap = tokenCap;
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

export class AnthropicAuthError extends BitBadgesAgentError {
  constructor(detail?: string) {
    super(
      `Anthropic authentication failed. Check that ANTHROPIC_API_KEY is set and valid.${detail ? ` (${detail})` : ''}`,
      'ANTHROPIC_AUTH_ERROR',
      503
    );
    this.name = 'AnthropicAuthError';
    Object.setPrototypeOf(this, AnthropicAuthError.prototype);
  }
}

export class AbortedError extends BitBadgesAgentError {
  readonly partialTokens: number;
  constructor(partialTokens = 0) {
    super('Build was aborted by the caller', 'ABORTED', 499);
    this.name = 'AbortedError';
    this.partialTokens = partialTokens;
    Object.setPrototypeOf(this, AbortedError.prototype);
  }
}

export class PeerDependencyError extends BitBadgesAgentError {
  constructor(detail: string) {
    super(detail, 'PEER_DEPENDENCY_ERROR', 500);
    this.name = 'PeerDependencyError';
    Object.setPrototypeOf(this, PeerDependencyError.prototype);
  }
}

export class SimulationError extends BitBadgesAgentError {
  readonly detail?: string;
  constructor(detail?: string) {
    super(`Simulation failed: ${detail ?? 'unknown error'}`, 'SIMULATION_ERROR', 400);
    this.name = 'SimulationError';
    this.detail = detail;
    Object.setPrototypeOf(this, SimulationError.prototype);
  }
}

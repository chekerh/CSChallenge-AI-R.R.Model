import { describe, it, expect } from 'vitest';
import { formatAiServiceUnavailableMessage } from './formatAiServiceError';

describe('formatAiServiceUnavailableMessage', () => {
  it('returns French guidance for 503', () => {
    expect(formatAiServiceUnavailableMessage('anything', 503)).toContain(
      'OPENAI_API_KEY'
    );
  });

  it('detects AI not configured from message', () => {
    expect(
      formatAiServiceUnavailableMessage('AI service not configured', 500)
    ).toContain('OPENAI_API_KEY');
  });

  it('passes through other errors', () => {
    expect(formatAiServiceUnavailableMessage('Bad token', 401)).toBe(
      'Bad token'
    );
  });
});

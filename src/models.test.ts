import { describe, it, expect } from 'vitest';
import { AI_MODELS, DEFAULT_AI_MODEL, type AIModelInfo } from './models.ts';

describe('AI Models', () => {
  describe('AI_MODELS', () => {
    it('should contain expected models', () => {
      expect(AI_MODELS).toHaveProperty('claude-3.5-haiku');
      expect(AI_MODELS).toHaveProperty('gpt-4o-mini');
      expect(AI_MODELS).toHaveProperty('gemini-1.5-flash');
    });

    it('should have correct provider for each model', () => {
      expect(AI_MODELS['claude-3.5-haiku']?.provider).toBe('anthropic');
      expect(AI_MODELS['gpt-4o-mini']?.provider).toBe('openai');
      expect(AI_MODELS['gemini-1.5-flash']?.provider).toBe('google');
    });

    it('should have correct structure for all models', () => {
      Object.entries(AI_MODELS).forEach(([, model]) => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('model');
        expect(['anthropic', 'openai', 'google']).toContain(model.provider);
      });
    });
  });

  describe('DEFAULT_AI_MODEL', () => {
    it('should be a valid model key', () => {
      expect(AI_MODELS).toHaveProperty(DEFAULT_AI_MODEL);
    });

    it('should be claude-4.5-sonnet', () => {
      expect(DEFAULT_AI_MODEL).toBe('claude-4.5-sonnet');
    });
  });

  describe('AIModelInfo interface', () => {
    it('should match expected structure', () => {
      const model = AI_MODELS['claude-3.5-haiku'];
      expect(model?.name).toBe('Claude 3.5 Haiku');
      expect(model?.provider).toBe('anthropic');
      expect(model?.model).toBe('claude-3-5-haiku-20241022');
    });
  });
});

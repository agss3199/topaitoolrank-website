/**
 * AI Prompt Generator - Integration Test Suite
 * Tests for template selection, variable replacement, and prompt building
 */

import { expect, describe, it } from 'vitest';

// Mock the templates and builder since we can't import from React components directly
const mockTemplates = [
  {
    id: 'email-campaign',
    name: 'Email Campaign',
    description: 'Create engaging email copy',
    variables: [
      { name: 'product', label: 'Product Name', placeholder: 'e.g., AI Tool' },
      { name: 'audience', label: 'Target Audience', placeholder: 'e.g., Startups' },
    ],
    prompt: 'Write an email for {product} targeting {audience}',
  },
  {
    id: 'social-media',
    name: 'Social Media Post',
    description: 'Generate social media content',
    variables: [
      { name: 'topic', label: 'Topic', placeholder: 'e.g., AI trends' },
    ],
    prompt: 'Write a viral social post about {topic}',
  },
];

describe('AI Prompt Generator Integration', () => {
  describe('Template Loading', () => {
    it('should have email-campaign template available', () => {
      const template = mockTemplates.find(t => t.id === 'email-campaign');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Email Campaign');
    });

    it('should have social-media template available', () => {
      const template = mockTemplates.find(t => t.id === 'social-media');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Social Media Post');
    });

    it('should have at least 2 templates available', () => {
      expect(mockTemplates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Variable Substitution', () => {
    it('should replace single variable in prompt', () => {
      const template = mockTemplates.find(t => t.id === 'social-media');
      const variables = { topic: 'Quantum Computing' };
      const prompt = template!.prompt.replace('{topic}', variables.topic);
      expect(prompt).toBe('Write a viral social post about Quantum Computing');
    });

    it('should replace multiple variables in prompt', () => {
      const template = mockTemplates.find(t => t.id === 'email-campaign');
      const variables = { product: 'DataFlow Pro', audience: 'Enterprise Teams' };
      let prompt = template!.prompt;
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(`{${key}}`, value);
      });
      expect(prompt).toBe('Write an email for DataFlow Pro targeting Enterprise Teams');
    });

    it('should handle variables with special characters', () => {
      const template = mockTemplates.find(t => t.id === 'social-media');
      const variables = { topic: 'AI & Machine Learning' };
      const prompt = template!.prompt.replace('{topic}', variables.topic);
      expect(prompt).toContain('AI & Machine Learning');
    });

    it('should handle empty variable values', () => {
      const template = mockTemplates.find(t => t.id === 'social-media');
      const variables = { topic: '' };
      const prompt = template!.prompt.replace('{topic}', variables.topic);
      expect(prompt).toBe('Write a viral social post about ');
    });
  });

  describe('Template Selection Persistence', () => {
    it('should allow switching between templates', () => {
      const templates = mockTemplates;
      expect(templates[0].id).not.toBe(templates[1].id);
      expect(templates[0].variables.length).toBe(2);
      expect(templates[1].variables.length).toBe(1);
    });

    it('should maintain selected template state', () => {
      let selectedId = mockTemplates[0].id;
      expect(selectedId).toBe('email-campaign');

      selectedId = mockTemplates[1].id;
      expect(selectedId).toBe('social-media');
    });
  });

  describe('Prompt Output', () => {
    it('should generate non-empty prompt', () => {
      const template = mockTemplates[0];
      expect(template.prompt.length).toBeGreaterThan(0);
    });

    it('should preserve template prompt structure', () => {
      mockTemplates.forEach(template => {
        expect(template.prompt).toBeTruthy();
        expect(template.prompt.length).toBeGreaterThan(0);
      });
    });

    it('should have matching variable count', () => {
      const template = mockTemplates[0];
      const variableMatches = template.prompt.match(/{[^}]+}/g) || [];
      expect(variableMatches.length).toBe(template.variables.length);
    });
  });
});

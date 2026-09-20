import { describe, it, expect } from 'vitest';
import { createContactSchema, sendMessageSchema, createCampaignSchema } from '../src/middleware/validation.js';

describe('Validation Schemas', () => {
  describe('createContactSchema', () => {
    it('should accept valid contact', async () => {
      const validContact = {
        phone_number: '1234567890',
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      await expect(createContactSchema.validateAsync(validContact)).resolves.toBeTruthy();
    });

    it('should reject invalid phone number', async () => {
      const invalidContact = {
        phone_number: 'abc123',
        name: 'John Doe',
      };

      await expect(createContactSchema.validateAsync(invalidContact)).rejects.toThrow();
    });

    it('should reject invalid email', async () => {
      const invalidContact = {
        phone_number: '1234567890',
        email: 'not-an-email',
      };

      await expect(createContactSchema.validateAsync(invalidContact)).rejects.toThrow();
    });
  });

  describe('sendMessageSchema', () => {
    it('should accept valid message', async () => {
      const validMessage = {
        phone_number: '1234567890',
        message_text: 'Hello World',
      };

      await expect(sendMessageSchema.validateAsync(validMessage)).resolves.toBeTruthy();
    });

    it('should reject empty message', async () => {
      const invalidMessage = {
        phone_number: '1234567890',
        message_text: '',
      };

      await expect(sendMessageSchema.validateAsync(invalidMessage)).rejects.toThrow();
    });

    it('should reject message over 4096 chars', async () => {
      const invalidMessage = {
        phone_number: '1234567890',
        message_text: 'x'.repeat(4097),
      };

      await expect(sendMessageSchema.validateAsync(invalidMessage)).rejects.toThrow();
    });
  });

  describe('createCampaignSchema', () => {
    it('should accept valid campaign', async () => {
      const validCampaign = {
        name: 'Test Campaign',
        template_id: 1,
      };

      await expect(createCampaignSchema.validateAsync(validCampaign)).resolves.toBeTruthy();
    });

    it('should reject campaign without name', async () => {
      const invalidCampaign = {
        template_id: 1,
      };

      await expect(createCampaignSchema.validateAsync(invalidCampaign)).rejects.toThrow();
    });
  });
});

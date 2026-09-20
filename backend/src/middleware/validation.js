import Joi from 'joi';

// Campaign Schemas
export const createCampaignSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  template_id: Joi.number().integer().optional(),
  contact_ids: Joi.array().items(Joi.number()).optional(),
  scheduled_at: Joi.date().iso().optional(),
}).unknown(true);

export const updateCampaignSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  status: Joi.string().valid('draft', 'running', 'completed', 'failed').optional(),
}).unknown(true);

// Contact Schemas
export const createContactSchema = Joi.object({
  phone_number: Joi.string().regex(/^\d{7,15}$/).required().messages({
    'string.pattern.base': 'Phone number must be 7-15 digits',
  }),
  name: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().optional(),
  tags: Joi.object().optional(),
}).unknown(true);

export const bulkImportContactsSchema = Joi.object({
  contacts: Joi.array().items(
    Joi.object({
      phone_number: Joi.string().regex(/^\d{7,15}$/).required(),
      name: Joi.string().max(255).optional(),
      email: Joi.string().email().optional(),
      tags: Joi.object().optional(),
    })
  ).min(1).required(),
}).unknown(true);

// Message Schemas
export const sendMessageSchema = Joi.object({
  phone_number: Joi.string().regex(/^\d{7,15}$/).required(),
  message_text: Joi.string().min(1).max(4096).required(),
}).unknown(true);

// Hermes Schemas
export const triggerCampaignSchema = Joi.object({
  campaign_name: Joi.string().min(1).max(255).required(),
  template_id: Joi.number().integer().optional(),
  contacts: Joi.array().items(
    Joi.object({
      phone: Joi.string().regex(/^\d{7,15}$/).required(),
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      tags: Joi.object().optional(),
    })
  ).min(1).required(),
  scheduled_at: Joi.date().iso().optional(),
}).unknown(true);

export const validateRequest = (schema) => {
  return async (request, reply) => {
    try {
      await schema.validateAsync(request.body);
    } catch (err) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: err.details.map(d => ({ field: d.path.join('.'), message: d.message })),
      });
    }
  };
};

// TESTING: Joi validation schemas (temporary - remove if not working well)
const Joi = require('joi');

// User registration/login validation
const authSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).optional().allow('').messages({
    'string.pattern.base': 'Invalid phone number format'
  }),
  pin: Joi.string().pattern(/^\d{4}$|^\d{6}$/).required().messages({
    'string.pattern.base': 'PIN must be exactly 4 or 6 digits',
    'any.required': 'PIN is required'
  }),
  role: Joi.string().valid('patient', 'doctor').optional()
});

// Emotion entry validation
const emotionSchema = Joi.object({
  userId: Joi.string().required(),
  emotions: Joi.alternatives().try(
    // Array format (manual survey)
    Joi.array().items(Joi.string()).min(1),
    // Object format (Affectiva)
    Joi.object({
      sadness: Joi.number().min(0).max(100).required(),
      anger: Joi.number().min(0).max(100).required(),
      fear: Joi.number().min(0).max(100).required(),
      engagement: Joi.number().min(0).max(100).required()
    })
  ).required(),
  intensity: Joi.number().min(1).max(10).optional(),
  notes: Joi.string().max(500).optional().allow(''),
  source: Joi.string().optional()
});

// Mood entry validation
const moodSchema = Joi.object({
  userId: Joi.string().required(),
  moodScore: Joi.number().min(1).max(5).required(),
  source: Joi.string().optional()
});

// Validate function with detailed error messages
function validate(schema, data) {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return { valid: false, errors, value: null };
  }
  
  return { valid: true, errors: [], value };
}

module.exports = {
  authSchema,
  emotionSchema,
  moodSchema,
  validate
};

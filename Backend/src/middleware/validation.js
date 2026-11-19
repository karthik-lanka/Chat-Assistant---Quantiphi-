import { param, body, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return formatted error response
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Validates that param `id` is a valid MongoDB ObjectId
 */
export const validateConversationId = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid conversation ID format'),
  handleValidationErrors,
];

/**
 * Validates that body `title` is a non-empty string with max 100 characters
 */
export const validateTitle = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
  handleValidationErrors,
];

/**
 * Validates optional body `title` for conversation creation (default 'New Conversation')
 */
export const validateCreateConversation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
  handleValidationErrors,
];

/**
 * Validates chat message request body:
 * `content`: required non-empty string
 * `tone`: optional string in ['professional', 'casual', 'concise']
 */
export const validateChatMessage = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'concise'])
    .withMessage("Tone must be one of 'professional', 'casual', or 'concise'"),
  handleValidationErrors,
];

/**
 * Validates regenerate response request body:
 * `tone`: optional string in ['professional', 'casual', 'concise']
 */
export const validateRegenerate = [
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'concise'])
    .withMessage("Tone must be one of 'professional', 'casual', or 'concise'"),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateConversationId,
  validateTitle,
  validateCreateConversation,
  validateChatMessage,
  validateRegenerate,
};

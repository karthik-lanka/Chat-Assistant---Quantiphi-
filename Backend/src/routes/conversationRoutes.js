import express from 'express';
import {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController.js';
import {
  sendMessage,
  regenerateResponse,
} from '../controllers/chatController.js';
import {
  validateConversationId,
  validateTitle,
  validateCreateConversation,
  validateChatMessage,
  validateRegenerate,
} from '../middleware/validation.js';

const router = express.Router();

// Conversation CRUD routes
router.get('/', getConversations);
router.post('/', validateCreateConversation, createConversation);
router.get('/:id', validateConversationId, getConversationById);
router.patch('/:id', validateConversationId, validateTitle, updateConversation);
router.delete('/:id', validateConversationId, deleteConversation);

// Chat & Streaming routes
router.post('/:id/chat', validateConversationId, validateChatMessage, sendMessage);
router.post('/:id/regenerate', validateConversationId, validateRegenerate, regenerateResponse);

export default router;

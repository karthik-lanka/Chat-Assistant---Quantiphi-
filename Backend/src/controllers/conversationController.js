import { Conversation } from '../models/Conversation.js';

/**
 * GET /api/conversations
 * Returns a list of conversations sorted by updatedAt desc with summary metadata.
 */
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({}, 'title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = conversations.map((conv) => {
      const messages = conv.messages || [];
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

      return {
        _id: conv._id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: messages.length,
        lastMessage: lastMsg
          ? {
              role: lastMsg.role,
              content:
                lastMsg.content.length > 100
                  ? `${lastMsg.content.slice(0, 100)}...`
                  : lastMsg.content,
              timestamp: lastMsg.timestamp,
            }
          : null,
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/conversations/:id
 * Returns full conversation document including all messages.
 */
export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations
 * Creates a new conversation.
 */
export const createConversation = async (req, res, next) => {
  try {
    const title = req.body.title ? String(req.body.title).trim() : 'New Conversation';
    const conversation = await Conversation.create({
      title: title || 'New Conversation',
      messages: [],
    });
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/conversations/:id
 * Renames a conversation title.
 */
export const updateConversation = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/conversations/:id
 * Deletes a conversation by ID.
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      message: 'Conversation deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
};

import { Conversation } from '../models/Conversation.js';
import { buildSystemInstruction, buildConversationContents } from '../services/promptService.js';
import { generateStreamingResponse } from '../services/geminiService.js';

/**
 * Sets Server-Sent Events (SSE) streaming headers on response
 * @param {import('express').Response} res
 */
const setSSEHeaders = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
};

/**
 * POST /api/conversations/:id/chat
 * Streams an assistant response to a user prompt using Server-Sent Events (SSE).
 */
export const sendMessage = async (req, res, next) => {
  const { content, tone = 'professional' } = req.body;
  const conversationId = req.params.id;

  let conversation;
  try {
    conversation = await Conversation.findById(conversationId);
  } catch (err) {
    return next(err);
  }

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Add user message
  const userMessage = {
    role: 'user',
    content: String(content).trim(),
    tone: tone || 'professional',
    timestamp: new Date(),
  };

  conversation.messages.push(userMessage);

  // Auto-generate title from first message if single message
  if (conversation.messages.length === 1) {
    const rawTitle = userMessage.content;
    const truncated = rawTitle.slice(0, 40).trim();
    conversation.title = truncated + (rawTitle.length > 40 ? '...' : '');
  }

  try {
    await conversation.save();
  } catch (err) {
    return next(err);
  }

  // Set SSE response headers
  setSSEHeaders(res);

  const abortController = new AbortController();
  let isClientConnected = true;

  req.on('close', () => {
    isClientConnected = false;
    abortController.abort();
  });

  try {
    const systemInstruction = buildSystemInstruction(tone);
    // Messages excluding the newly added user message, then passing prompt
    const historyBeforeCurrent = conversation.messages.slice(0, -1);
    const contents = buildConversationContents(historyBeforeCurrent, userMessage.content);

    const fullResponseText = await generateStreamingResponse({
      contents,
      systemInstruction,
      signal: abortController.signal,
      onChunk: (chunkText) => {
        if (isClientConnected && !res.writableEnded) {
          res.write(`event: token\ndata: ${JSON.stringify({ token: chunkText })}\n\n`);
        }
      },
    });

    // If client disconnected during generation, do not persist partial assistant message
    if (!isClientConnected || abortController.signal.aborted) {
      return;
    }

    // Save assistant message to conversation
    const assistantMessage = {
      role: 'assistant',
      content: fullResponseText,
      tone: tone || 'professional',
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    await conversation.save();

    const savedAssistantMsg = conversation.messages[conversation.messages.length - 1];

    if (!res.writableEnded) {
      res.write(
        `event: done\ndata: ${JSON.stringify({
          message: savedAssistantMsg,
          conversationId: conversation._id,
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    if (abortController.signal.aborted || !isClientConnected) {
      return;
    }

    if (res.headersSent && !res.writableEnded) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: error.message || 'Error generating response',
        })}\n\n`
      );
      res.end();
    } else {
      next(error);
    }
  }
};

/**
 * POST /api/conversations/:id/regenerate
 * Re-runs the last assistant response with optional tone update.
 */
export const regenerateResponse = async (req, res, next) => {
  const conversationId = req.params.id;
  const requestedTone = req.body?.tone;

  let conversation;
  try {
    conversation = await Conversation.findById(conversationId);
  } catch (err) {
    return next(err);
  }

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (!conversation.messages || conversation.messages.length === 0) {
    return res.status(400).json({ error: 'No messages to regenerate' });
  }

  // Remove trailing assistant message if present
  const lastIndex = conversation.messages.length - 1;
  if (conversation.messages[lastIndex].role === 'assistant') {
    conversation.messages.splice(lastIndex, 1);
  }

  // Locate the last user message
  const userMessages = conversation.messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) {
    return res.status(400).json({ error: 'No user message to respond to' });
  }

  const lastUserMessage = userMessages[userMessages.length - 1];
  const activeTone = requestedTone || lastUserMessage.tone || 'professional';

  // Save the conversation with the removed assistant message before streaming
  try {
    await conversation.save();
  } catch (err) {
    return next(err);
  }

  setSSEHeaders(res);

  const abortController = new AbortController();
  let isClientConnected = true;

  req.on('close', () => {
    isClientConnected = false;
    abortController.abort();
  });

  try {
    const systemInstruction = buildSystemInstruction(activeTone);
    // Build context up to the active messages
    const contents = buildConversationContents(conversation.messages);

    const fullResponseText = await generateStreamingResponse({
      contents,
      systemInstruction,
      signal: abortController.signal,
      onChunk: (chunkText) => {
        if (isClientConnected && !res.writableEnded) {
          res.write(`event: token\ndata: ${JSON.stringify({ token: chunkText })}\n\n`);
        }
      },
    });

    if (!isClientConnected || abortController.signal.aborted) {
      return;
    }

    const assistantMessage = {
      role: 'assistant',
      content: fullResponseText,
      tone: activeTone,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    await conversation.save();

    const savedAssistantMsg = conversation.messages[conversation.messages.length - 1];

    if (!res.writableEnded) {
      res.write(
        `event: done\ndata: ${JSON.stringify({
          message: savedAssistantMsg,
          conversationId: conversation._id,
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    if (abortController.signal.aborted || !isClientConnected) {
      return;
    }

    if (res.headersSent && !res.writableEnded) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: error.message || 'Error generating replacement response',
        })}\n\n`
      );
      res.end();
    } else {
      next(error);
    }
  }
};

export default {
  sendMessage,
  regenerateResponse,
};

export const TONE_INSTRUCTIONS = {
  professional:
    'You are Quantiphi AI, an intelligent, professional, clear, respectful, and well-structured assistant. Provide thorough explanations, organized formatting with headers, bullet points, and code blocks where helpful.',
  casual:
    'You are Quantiphi AI, a friendly, natural, approachable, conversational, and enthusiastic assistant. Use casual language, conversational analogies, and emojis sparingly where appropriate.',
  concise:
    'You are Quantiphi AI, a direct, concise, and to-the-point assistant. Deliver brief, punchy answers that get straight to the facts without unnecessary filler while preserving accuracy and essential details.',
};

/**
 * Returns system instruction text tailored to the selected tone
 * @param {'professional' | 'casual' | 'concise'} [tone='professional']
 * @returns {string}
 */
export const buildSystemInstruction = (tone = 'professional') => {
  return TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;
};

/**
 * Transforms previous messages into the @google/genai format
 * limits context to last 20 messages to prevent exceeding token limits
 * @param {Array<{ role: string, content: string }>} [messages=[]]
 * @param {string|null} [currentPrompt=null]
 * @returns {Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>}
 */
export const buildConversationContents = (messages = [], currentPrompt = null) => {
  const recentMessages = messages.slice(-20);
  const contents = recentMessages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content || '' }],
  }));

  if (currentPrompt !== null && currentPrompt !== undefined && String(currentPrompt).trim().length > 0) {
    contents.push({
      role: 'user',
      parts: [{ text: String(currentPrompt) }],
    });
  }

  return contents;
};

export default {
  TONE_INSTRUCTIONS,
  buildSystemInstruction,
  buildConversationContents,
};

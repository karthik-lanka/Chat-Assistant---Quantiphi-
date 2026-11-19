import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';

let aiClient = null;

/**
 * Returns or initializes the GoogleGenAI instance
 * @returns {GoogleGenAI}
 */
export const getGeminiClient = () => {
  if (!aiClient) {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.');
    }
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return aiClient;
};

/**
 * Sanitizes and provides descriptive error messages for Gemini API errors
 * @param {Error} error
 * @returns {Error}
 */
const sanitizeGeminiError = (error) => {
  const message = error.message || '';
  
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.toLowerCase().includes('quota')) {
    return new Error('Gemini API rate limit or quota exceeded. Please wait a moment and try again.');
  }

  if (message.includes('404') || message.toLowerCase().includes('model not found')) {
    return new Error(`Gemini model '${GEMINI_MODEL}' was not found or is currently unavailable.`);
  }

  if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('api key')) {
    return new Error('Authentication failed with the Gemini API. Please check your API key configuration.');
  }

  if (message.includes('SAFETY') || message.toLowerCase().includes('safety')) {
    return new Error('Response generation was blocked due to safety guidelines.');
  }

  return new Error(message || 'An error occurred while communicating with Gemini AI.');
};

/**
 * Generates a streaming response using @google/genai
 * @param {Object} options
 * @param {Array<Object>} options.contents - Formatted message history and current prompt
 * @param {string} options.systemInstruction - System instruction string
 * @param {Function} options.onChunk - Callback invoked with each text chunk
 * @param {AbortSignal} [options.signal] - Optional abort signal for cancellation
 * @returns {Promise<string>} The full concatenated response text
 */
export const generateStreamingResponse = async ({ contents, systemInstruction, onChunk, signal }) => {
  const ai = getGeminiClient();

  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        abortSignal: signal,
      },
    });

    let fullText = '';

    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        throw new Error('Generation aborted by client');
      }

      const text = chunk.text || '';
      if (text) {
        fullText += text;
        if (typeof onChunk === 'function') {
          onChunk(text);
        }
      }
    }

    return fullText;
  } catch (error) {
    if (signal?.aborted || error.message?.includes('aborted')) {
      throw new Error('Generation aborted by client');
    }
    throw sanitizeGeminiError(error);
  }
};

export default {
  getGeminiClient,
  generateStreamingResponse,
};

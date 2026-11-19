/**
 * Real API service for Quantiphi AI Chat Assistant.
 * Connects to backend endpoints at /api/conversations.
 */

const API_BASE = '/api';

/**
 * Helper to process fetch responses, extracting JSON or throwing detailed errors.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch (_) {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch (_) {}
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * GET /api/conversations
 * Fetches all conversations.
 * @returns {Promise<Array>} List of conversation summaries
 */
export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/conversations`);
  const data = await handleResponse(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.conversations)) return data.conversations;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * GET /api/conversations/:id
 * Fetches single conversation by ID with full messages.
 * @param {string} id
 * @returns {Promise<Object>} Conversation object
 */
export async function fetchConversation(id) {
  const res = await fetch(`${API_BASE}/conversations/${id}`);
  const data = await handleResponse(res);
  return data?.conversation || data;
}

/**
 * POST /api/conversations
 * Creates a new conversation.
 * @param {string} [title] - Optional title
 * @returns {Promise<Object>} Created conversation object
 */
export async function createConversation(title) {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(title ? { title } : {}),
  });
  const data = await handleResponse(res);
  return data?.conversation || data;
}

/**
 * PATCH /api/conversations/:id
 * Renames a conversation.
 * @param {string} id
 * @param {string} title
 * @returns {Promise<Object>} Updated conversation object
 */
export async function renameConversation(id, title) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const data = await handleResponse(res);
  return data?.conversation || data;
}

/**
 * DELETE /api/conversations/:id
 * Deletes a conversation.
 * @param {string} id
 * @returns {Promise<Object>} Result object
 */
export async function deleteConversation(id) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

/**
 * Helper to parse Server-Sent Events (SSE) stream from response body.
 * Reads line by line using getReader() and TextDecoder.
 * Dispatches onToken, onDone, onError.
 */
async function parseSSEStream(response, { onToken, onDone, onError }) {
  if (!response.body) {
    throw new Error('ReadableStream not supported by response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullAccumulatedText = '';
  let doneDispatched = false;
  let donePayload = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // retain trailing uncompleted line

      let currentEvent = 'message';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = 'message';
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
          continue;
        }

        if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();

          if (rawData === '[DONE]') {
            if (!doneDispatched) {
              doneDispatched = true;
              onDone?.(donePayload || { content: fullAccumulatedText });
            }
            continue;
          }

          try {
            const parsed = JSON.parse(rawData);

            // Check for error payload
            if (currentEvent === 'error' || parsed.type === 'error' || parsed.error) {
              const errMsg = parsed.error || parsed.message || 'Stream error';
              onError?.(new Error(errMsg));
              return;
            }

            // Check for done payload
            if (currentEvent === 'done' || parsed.type === 'done') {
              donePayload = parsed;
              doneDispatched = true;
              onDone?.(parsed);
              continue;
            }

            // Check for token / text chunk
            const token =
              parsed.token !== undefined
                ? parsed.token
                : parsed.type === 'token' && parsed.content !== undefined
                ? parsed.content
                : parsed.chunk !== undefined
                ? parsed.chunk
                : parsed.text !== undefined
                ? parsed.text
                : parsed.delta !== undefined
                ? parsed.delta
                : null;

            if (token !== null && token !== undefined) {
              fullAccumulatedText += token;
              onToken?.(token);
            } else if (parsed.content && !parsed.type) {
              fullAccumulatedText += parsed.content;
              onToken?.(parsed.content);
            }
          } catch (_) {
            // Non-JSON data payload
            if (currentEvent === 'error') {
              onError?.(new Error(rawData));
              return;
            }
            fullAccumulatedText += rawData;
            onToken?.(rawData);
          }
        }
      }
    }

    // Flush any remaining characters in buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        const rawData = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.type === 'done' || currentEvent === 'done') {
            donePayload = parsed;
          } else {
            const token = parsed.token ?? parsed.content ?? parsed.chunk ?? parsed.text;
            if (token) {
              fullAccumulatedText += token;
              onToken?.(token);
            }
          }
        } catch (_) {}
      }
    }

    if (!doneDispatched) {
      onDone?.(donePayload || { content: fullAccumulatedText });
    }
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      // Aborted cleanly by user
      return;
    }
    onError?.(err);
  } finally {
    try {
      reader.releaseLock();
    } catch (_) {}
  }
}

/**
 * POST /api/conversations/:id/chat
 * Streams AI response via Server-Sent Events.
 * @param {string} id - Conversation ID
 * @param {string} content - User message text
 * @param {string} tone - 'professional' | 'casual' | 'concise'
 * @param {Object} callbacks
 * @param {Function} callbacks.onToken - Called for each chunk
 * @param {Function} callbacks.onDone - Called on completion with final message
 * @param {Function} callbacks.onError - Called on error
 * @param {AbortSignal} [callbacks.signal] - Abort signal
 */
export async function streamChatMessage(id, content, tone, { onToken, onDone, onError, signal }) {
  try {
    const res = await fetch(`${API_BASE}/conversations/${id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tone }),
      signal,
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        errorMessage = errJson.error || errJson.message || errorMessage;
      } catch (_) {}
      throw new Error(errorMessage);
    }

    await parseSSEStream(res, { onToken, onDone, onError });
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return;
    }
    onError?.(err);
  }
}

/**
 * POST /api/conversations/:id/regenerate
 * Streams regenerated AI response via SSE.
 * @param {string} id - Conversation ID
 * @param {string} tone - 'professional' | 'casual' | 'concise'
 * @param {Object} callbacks
 * @param {Function} callbacks.onToken
 * @param {Function} callbacks.onDone
 * @param {Function} callbacks.onError
 * @param {AbortSignal} [callbacks.signal]
 */
export async function streamRegenerate(id, tone, { onToken, onDone, onError, signal }) {
  try {
    const res = await fetch(`${API_BASE}/conversations/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone }),
      signal,
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        errorMessage = errJson.error || errJson.message || errorMessage;
      } catch (_) {}
      throw new Error(errorMessage);
    }

    await parseSSEStream(res, { onToken, onDone, onError });
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return;
    }
    onError?.(err);
  }
}

const api = {
  fetchConversations,
  fetchConversation,
  createConversation,
  renameConversation,
  deleteConversation,
  streamChatMessage,
  streamRegenerate,
};

export default api;

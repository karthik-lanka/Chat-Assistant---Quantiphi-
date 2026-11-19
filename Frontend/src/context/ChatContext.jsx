import { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as api from '../services/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationIdState] = useState(
    () => localStorage.getItem('chat_active_conversation_id') || null
  );
  const [activeConversation, setActiveConversation] = useState(null);
  const [tone, setToneState] = useState(
    () => localStorage.getItem('chat_tone') || 'professional'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Set tone and persist in localStorage
  const setTone = useCallback((newTone) => {
    setToneState(newTone);
    try {
      localStorage.setItem('chat_tone', newTone);
    } catch (_) {}
  }, []);

  // Set activeConversationId and persist in localStorage
  const setActiveConversationId = useCallback((id) => {
    setActiveConversationIdState(id);
    try {
      if (id) {
        localStorage.setItem('chat_active_conversation_id', id);
      } else {
        localStorage.removeItem('chat_active_conversation_id');
      }
    } catch (_) {}
  }, []);

  // Helper to refresh conversation list without resetting active conversation
  const refreshConversationsList = useCallback(async () => {
    try {
      const list = await api.fetchConversations();
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to refresh conversation list:', err);
      return [];
    }
  }, []);

  // Loads all conversations and restores/selects the active conversation
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await api.fetchConversations();
      setConversations(list);

      const savedId = localStorage.getItem('chat_active_conversation_id');
      const matched = list.find((c) => (c._id || c.id) === savedId);

      if (savedId && matched) {
        const fullConv = await api.fetchConversation(savedId);
        setActiveConversation(fullConv);
        setActiveConversationId(savedId);
      } else if (list.length > 0) {
        const firstId = list[0]._id || list[0].id;
        const fullConv = await api.fetchConversation(firstId);
        setActiveConversation(fullConv);
        setActiveConversationId(firstId);
      } else {
        setActiveConversation(null);
        setActiveConversationId(null);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [setActiveConversationId]);

  // Loads a single conversation by ID
  const loadConversation = useCallback(
    async (id) => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const conv = await api.fetchConversation(id);
        setActiveConversation(conv);
        setActiveConversationId(id);
      } catch (err) {
        setError(err?.message || 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    },
    [setActiveConversationId]
  );

  // Creates a new conversation
  const createConversation = useCallback(
    async (optionalTitle) => {
      try {
        setError(null);
        const newConv = await api.createConversation(optionalTitle);
        const convId = newConv._id || newConv.id;

        setConversations((prev) => [
          {
            _id: convId,
            id: convId,
            title: newConv.title || optionalTitle || 'New Conversation',
            createdAt: newConv.createdAt || new Date().toISOString(),
            updatedAt: newConv.updatedAt || new Date().toISOString(),
            messages: newConv.messages || [],
            messageCount: newConv.messages ? newConv.messages.length : 0,
          },
          ...prev.filter((c) => (c._id || c.id) !== convId),
        ]);

        setActiveConversation(newConv);
        setActiveConversationId(convId);
        return newConv;
      } catch (err) {
        setError(err?.message || 'Failed to create conversation');
        return null;
      }
    },
    [setActiveConversationId]
  );

  // Renames a conversation
  const renameConversation = useCallback(async (id, title) => {
    try {
      setError(null);
      const updated = await api.renameConversation(id, title);
      const updatedTitle = updated?.title || title;

      setConversations((prev) =>
        prev.map((c) =>
          (c._id || c.id) === id ? { ...c, title: updatedTitle } : c
        )
      );

      setActiveConversation((prev) => {
        if (prev && (prev._id || prev.id) === id) {
          return { ...prev, title: updatedTitle };
        }
        return prev;
      });
    } catch (err) {
      setError(err?.message || 'Failed to rename conversation');
    }
  }, []);

  // Deletes a conversation
  const deleteConversation = useCallback(
    async (id) => {
      try {
        setError(null);
        await api.deleteConversation(id);

        setConversations((prev) => {
          const idx = prev.findIndex((c) => (c._id || c.id) === id);
          const remaining = prev.filter((c) => (c._id || c.id) !== id);

          const isActive =
            (activeConversation?._id || activeConversation?.id) === id ||
            activeConversationId === id;

          if (isActive) {
            if (remaining.length > 0) {
              const nextConv = remaining[idx] || remaining[idx - 1] || remaining[0];
              const nextId = nextConv._id || nextConv.id;
              loadConversation(nextId);
            } else {
              setActiveConversation(null);
              setActiveConversationId(null);
            }
          }

          return remaining;
        });
      } catch (err) {
        setError(err?.message || 'Failed to delete conversation');
      }
    },
    [activeConversation, activeConversationId, loadConversation, setActiveConversationId]
  );

  // Sends a chat message with SSE streaming
  const sendMessage = useCallback(
    async (content) => {
      if (isStreaming || !content?.trim()) return;

      try {
        setError(null);

        // If no active conversation, create one first
        let currentConv = activeConversation;
        let convId = currentConv?._id || currentConv?.id || activeConversationId;

        if (!convId || !currentConv) {
          currentConv = await api.createConversation();
          convId = currentConv._id || currentConv.id;
          setActiveConversation(currentConv);
          setActiveConversationId(convId);
          setConversations((prev) => [
            {
              _id: convId,
              id: convId,
              title: currentConv.title || 'New Conversation',
              createdAt: currentConv.createdAt || new Date().toISOString(),
              updatedAt: currentConv.updatedAt || new Date().toISOString(),
              messages: [],
            },
            ...prev.filter((c) => (c._id || c.id) !== convId),
          ]);
        }

        // Optimistically append user message
        const userMsg = {
          _id: 'user-' + Date.now(),
          role: 'user',
          content: content.trim(),
          timestamp: new Date().toISOString(),
          tone,
        };

        setActiveConversation((prev) => {
          const prevMsgs = prev?.messages || [];
          return {
            ...prev,
            messages: [...prevMsgs, userMsg],
          };
        });

        // Initialize streaming state
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsStreaming(true);
        setStreamingText('');

        let accumulated = '';

        await api.streamChatMessage(convId, content.trim(), tone, {
          signal: controller.signal,
          onToken: (token) => {
            accumulated += token;
            setStreamingText((prev) => prev + token);
          },
          onDone: (payload) => {
            setIsStreaming(false);
            setStreamingText('');
            abortControllerRef.current = null;

            const assistantMsg = payload?.message || {
              _id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: payload?.content || accumulated,
              timestamp: new Date().toISOString(),
              tone,
            };

            setActiveConversation((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), assistantMsg],
              };
            });

            refreshConversationsList();
          },
          onError: (err) => {
            setIsStreaming(false);
            setStreamingText('');
            abortControllerRef.current = null;
            setError(err?.message || 'Failed to get AI response');
          },
        });
      } catch (err) {
        setIsStreaming(false);
        setStreamingText('');
        abortControllerRef.current = null;
        setError(err?.message || 'Failed to send message');
      }
    },
    [
      activeConversation,
      activeConversationId,
      isStreaming,
      tone,
      setActiveConversationId,
      refreshConversationsList,
    ]
  );

  // Regenerates the last assistant response
  const regenerateResponse = useCallback(
    async (messageToRegenerate) => {
      if (isStreaming) return;
      const convId =
        activeConversation?._id || activeConversation?.id || activeConversationId;
      if (!convId) return;

      try {
        setError(null);

        // Remove trailing assistant message from state
        setActiveConversation((prev) => {
          if (!prev) return prev;
          const msgs = [...(prev.messages || [])];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
            msgs.pop();
          }
          return {
            ...prev,
            messages: msgs,
          };
        });

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsStreaming(true);
        setStreamingText('');

        let accumulated = '';

        await api.streamRegenerate(convId, tone, {
          signal: controller.signal,
          onToken: (token) => {
            accumulated += token;
            setStreamingText((prev) => prev + token);
          },
          onDone: (payload) => {
            setIsStreaming(false);
            setStreamingText('');
            abortControllerRef.current = null;

            const assistantMsg = payload?.message || {
              _id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: payload?.content || accumulated,
              timestamp: new Date().toISOString(),
              tone,
            };

            setActiveConversation((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), assistantMsg],
              };
            });

            refreshConversationsList();
          },
          onError: (err) => {
            setIsStreaming(false);
            setStreamingText('');
            abortControllerRef.current = null;
            setError(err?.message || 'Failed to regenerate response');
          },
        });
      } catch (err) {
        setIsStreaming(false);
        setStreamingText('');
        abortControllerRef.current = null;
        setError(err?.message || 'Failed to regenerate response');
      }
    },
    [
      activeConversation,
      activeConversationId,
      isStreaming,
      tone,
      refreshConversationsList,
    ]
  );

  // Stops streaming cleanly via AbortController
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    setStreamingText((currentStreaming) => {
      if (currentStreaming?.trim()) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              ...(prev.messages || []),
              {
                _id: 'stream-' + Date.now(),
                role: 'assistant',
                content: currentStreaming.trim() + ' [interrupted]',
                timestamp: new Date().toISOString(),
                tone,
              },
            ],
          };
        });
      }
      return '';
    });
  }, [tone]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    conversations,
    activeConversationId,
    activeConversation,
    tone,
    isLoading,
    isStreaming,
    streamingText,
    error,
    setTone,
    loadConversations,
    loadConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    regenerateResponse,
    stopStreaming,
    clearError,
    setActiveConversationId,
    setActiveConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}

export default ChatContext;

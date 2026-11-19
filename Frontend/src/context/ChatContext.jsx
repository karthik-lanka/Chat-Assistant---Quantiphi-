import { createContext, useContext, useState, useCallback, useRef } from 'react';
import mockApi from '../services/mockApi';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [tone, setTone] = useState('professional');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const cancelStreamRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await mockApi.getConversations();
      setConversations(data);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await mockApi.getConversation(id);
      setActiveConversation(data);
      setActiveConversationId(id);
    } catch (err) {
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async () => {
    try {
      setError(null);
      const newConv = await mockApi.createConversation();
      setConversations((prev) => [
        { _id: newConv._id, title: newConv.title, createdAt: newConv.createdAt, updatedAt: newConv.updatedAt, messageCount: 0, lastMessage: '' },
        ...prev,
      ]);
      setActiveConversation(newConv);
      setActiveConversationId(newConv._id);
      return newConv;
    } catch (err) {
      setError('Failed to create conversation');
      return null;
    }
  }, []);

  const renameConversation = useCallback(async (id, title) => {
    try {
      setError(null);
      await mockApi.renameConversation(id, title);
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title } : c))
      );
      if (activeConversationId === id) {
        setActiveConversation((prev) => (prev ? { ...prev, title } : prev));
      }
    } catch (err) {
      setError('Failed to rename conversation');
    }
  }, [activeConversationId]);

  const deleteConversation = useCallback(async (id) => {
    try {
      setError(null);
      await mockApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConversationId === id) {
        setActiveConversation(null);
        setActiveConversationId(null);
      }
    } catch (err) {
      setError('Failed to delete conversation');
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(async (content) => {
    if (!activeConversationId || isStreaming) return;

    try {
      setError(null);
      const { userMessage } = await mockApi.sendMessage(activeConversationId, content, tone);

      setActiveConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Update conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversationId
            ? { ...c, title: prev.find((p) => p._id === activeConversationId)?.messageCount === 0 ? content.substring(0, 50) : c.title, messageCount: c.messageCount + 1, lastMessage: content.substring(0, 100) }
            : c
        )
      );

      // Start streaming
      setIsStreaming(true);
      setStreamingText('');

      cancelStreamRef.current = mockApi.simulateStream(
        activeConversationId,
        tone,
        (token) => {
          setStreamingText((prev) => prev + token);
        },
        (fullText) => {
          setIsStreaming(false);
          setStreamingText('');
          setActiveConversation((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                _id: 'stream-' + Date.now(),
                role: 'assistant',
                content: fullText,
                timestamp: new Date().toISOString(),
              },
            ],
          }));
        },
        (err) => {
          setIsStreaming(false);
          setStreamingText('');
          setError('Failed to get AI response');
        }
      );
    } catch (err) {
      setError('Failed to send message');
    }
  }, [activeConversationId, tone, isStreaming]);

  const stopStreaming = useCallback(() => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      setIsStreaming(false);
      if (streamingText) {
        setActiveConversation((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              _id: 'stream-' + Date.now(),
              role: 'assistant',
              content: streamingText + ' [interrupted]',
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      }
      setStreamingText('');
    }
  }, [streamingText]);

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

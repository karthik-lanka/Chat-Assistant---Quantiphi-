import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import MessageInput from './MessageInput';
import ErrorBanner from './ErrorBanner';

export default function ChatWindow() {
  const {
    activeConversation,
    isStreaming,
    streamingText,
    isLoading,
    sendMessage,
    regenerateResponse,
  } = useChat();
  const messagesEndRef = useRef(null);

  const messages = activeConversation?.messages || [];

  // Smooth auto-scrolling to bottom on messages and streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingText, isStreaming]);

  const handleSend = (content) => {
    sendMessage(content);
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <>
      <ErrorBanner />
      <div className="messages-container">
        {isLoading && !activeConversation && !messages.length ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <WelcomeScreen onSendPrompt={handleSend} />
        ) : (
          <div className="messages-list">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg._id || `msg-${idx}`}
                message={msg}
                isLastAssistant={idx === lastAssistantIndex && !isStreaming}
                onRegenerate={regenerateResponse}
              />
            ))}
            {isStreaming && <TypingIndicator streamingText={streamingText} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <MessageInput onSend={handleSend} />
    </>
  );
}

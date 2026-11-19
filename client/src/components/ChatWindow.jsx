import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import MessageInput from './MessageInput';
import ErrorBanner from './ErrorBanner';

export default function ChatWindow({ onSendPrompt }) {
  const {
    activeConversation,
    isStreaming,
    streamingText,
    isLoading,
    sendMessage,
    createConversation,
  } = useChat();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingText, isStreaming]);

  const handleSend = async (content) => {
    if (!activeConversation) {
      const conv = await createConversation();
      if (conv) {
        // Need to wait a tick for state to update
        setTimeout(() => sendMessage(content), 100);
      }
      return;
    }
    sendMessage(content);
  };

  if (!activeConversation) {
    return (
      <div
        className="main-content"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <ErrorBanner />
        <WelcomeScreen onSendPrompt={handleSend} />
        <MessageInput onSend={handleSend} />
      </div>
    );
  }

  if (isLoading && !activeConversation.messages?.length) {
    return (
      <div className="main-content">
        <div className="loading-screen">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  const messages = activeConversation.messages || [];

  return (
    <>
      <ErrorBanner />
      <div className="messages-container">
        <div className="messages-list">
          {messages.length === 0 && !isStreaming ? (
            <WelcomeScreen onSendPrompt={handleSend} />
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} onRegenerate={null} />
              ))}
              {isStreaming && <TypingIndicator streamingText={streamingText} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
      <MessageInput onSend={handleSend} />
    </>
  );
}

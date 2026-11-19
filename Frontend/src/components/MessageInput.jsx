import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Square } from 'lucide-react';

export default function MessageInput({ onSend }) {
  const [input, setInput] = useState('');
  const { isStreaming, stopStreaming } = useChat();
  const textareaRef = useRef(null);

  // Auto-expand textarea up to 150px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 150)}px`;
    }
  }, [input]);

  // Focus textarea when streaming completes
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={
              isStreaming
                ? 'AI is generating a response...'
                : 'Type your message... (Shift+Enter for newline)'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              className="send-btn"
              onClick={stopStreaming}
              title="Stop generation"
              style={{ background: 'var(--error)' }}
              type="button"
            >
              <Square size={16} fill="white" />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={!input.trim()}
              title="Send message (Enter)"
              type="button"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="input-hint">
          Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for a new line
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Square } from 'lucide-react';

export default function MessageInput({ onSend }) {
  const [input, setInput] = useState('');
  const { isStreaming, stopStreaming } = useChat();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
            placeholder="Type your message..."
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
              title="Stop generating"
              style={{ background: 'var(--error)' }}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={!input.trim()}
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

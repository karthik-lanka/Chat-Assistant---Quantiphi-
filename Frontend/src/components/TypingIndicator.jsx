import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';

export default function TypingIndicator({ streamingText }) {
  return (
    <div className="typing-indicator">
      <div className="message-avatar assistant">
        <Bot size={16} />
      </div>
      <div className="message-content">
        <div className="message-role">AI Assistant</div>
        {streamingText ? (
          <div className="message-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {streamingText}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="typing-dots">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
      </div>
    </div>
  );
}

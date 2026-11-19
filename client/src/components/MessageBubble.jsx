import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, RefreshCw, Copy } from 'lucide-react';

export default function MessageBubble({ message, onRegenerate }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className="message">
      <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="message-content">
        <div className="message-role">{isUser ? 'You' : 'AI Assistant'}</div>
        <div className="message-text">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="message-timestamp">{time}</div>
        <div className="message-actions">
          <button className="message-action-btn" onClick={handleCopy} title="Copy">
            <Copy size={12} /> Copy
          </button>
          {!isUser && onRegenerate && (
            <button
              className="message-action-btn"
              onClick={() => onRegenerate(message)}
              title="Regenerate"
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

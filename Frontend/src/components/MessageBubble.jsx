import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, RefreshCw, Copy, Check } from 'lucide-react';

export default function MessageBubble({ message, onRegenerate, isLastAssistant }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="message-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div className="message-role">{isUser ? 'You' : 'AI Assistant'}</div>
          {message.tone && !isUser && (
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                background: 'var(--bg-tertiary)',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {message.tone}
            </span>
          )}
        </div>
        <div className="message-text">
          {isUser ? (
            <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="message-timestamp">{time}</div>
        <div className="message-actions">
          <button
            className="message-action-btn"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <>
                <Check size={12} color="var(--success)" />
                <span style={{ color: 'var(--success)' }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
          {!isUser && isLastAssistant && onRegenerate && (
            <button
              className="message-action-btn"
              onClick={() => onRegenerate(message)}
              title="Regenerate this response"
            >
              <RefreshCw size={12} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

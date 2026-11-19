import { useChat } from '../context/ChatContext';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner() {
  const { error, clearError } = useChat();

  if (!error) return null;

  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{error}</span>
      <button
        onClick={clearError}
        title="Dismiss error"
        aria-label="Dismiss error"
        type="button"
      >
        <X size={15} />
      </button>
    </div>
  );
}

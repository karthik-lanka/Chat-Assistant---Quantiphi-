import { useChat } from '../context/ChatContext';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner() {
  const { error, clearError } = useChat();

  if (!error) return null;

  return (
    <div className="error-banner">
      <AlertCircle size={16} />
      <span>{error}</span>
      <button onClick={clearError}>
        <X size={14} />
      </button>
    </div>
  );
}

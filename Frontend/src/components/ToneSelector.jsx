import { useChat } from '../context/ChatContext';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'concise', label: 'Concise' },
];

export default function ToneSelector() {
  const { tone, setTone } = useChat();

  return (
    <div className="tone-selector">
      {TONES.map((t) => (
        <button
          key={t.value}
          className={`tone-option ${tone === t.value ? 'active' : ''}`}
          onClick={() => setTone(t.value)}
          title={`${t.label} tone`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

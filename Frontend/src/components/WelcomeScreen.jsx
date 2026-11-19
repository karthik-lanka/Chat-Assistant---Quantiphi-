import { useChat } from '../context/ChatContext';
import { Sparkles } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    title: 'Explain a concept',
    text: 'What is the difference between REST and GraphQL?',
  },
  {
    title: 'Write code',
    text: 'Create a React custom hook for form validation',
  },
  {
    title: 'Debug help',
    text: 'Why might a useEffect run twice in development?',
  },
  {
    title: 'Architecture advice',
    text: 'How should I structure a full-stack Node.js project?',
  },
];

export default function WelcomeScreen({ onSendPrompt }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-logo">
        <Sparkles size={28} color="var(--primary)" />
      </div>
      <h1 className="welcome-title">Quantiphi AI Chat Assistant</h1>
      <p className="welcome-subtitle">
        Start a conversation with AI. Ask questions, get explanations, write code, and more.
      </p>
      <div className="suggested-prompts">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            className="suggested-prompt"
            onClick={() => onSendPrompt(prompt.text)}
          >
            <div className="suggested-prompt-title">{prompt.title}</div>
            <div className="suggested-prompt-text">{prompt.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

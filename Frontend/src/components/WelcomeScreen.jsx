import { Sparkles, Code2, HelpCircle, LayoutGrid, Lightbulb } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    icon: Lightbulb,
    title: 'Explain a concept',
    text: 'What is the difference between REST and GraphQL APIs?',
  },
  {
    icon: Code2,
    title: 'Write code',
    text: 'Create a reusable React hook for local storage with state synchronization',
  },
  {
    icon: HelpCircle,
    title: 'Debug help',
    text: 'Why does useEffect run twice in React 18+ development mode?',
  },
  {
    icon: LayoutGrid,
    title: 'Architecture advice',
    text: 'How should I structure a full-stack Node.js and React application for scalability?',
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
        Powered by Google Gemini. Ask technical questions, get code examples, architectural reviews, or brainstorm ideas.
      </p>
      <div className="suggested-prompts">
        {SUGGESTED_PROMPTS.map((prompt, i) => {
          const Icon = prompt.icon;
          return (
            <button
              key={i}
              className="suggested-prompt"
              onClick={() => onSendPrompt(prompt.text)}
              type="button"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon size={14} color="var(--primary)" />
                <div className="suggested-prompt-title">{prompt.title}</div>
              </div>
              <div className="suggested-prompt-text">{prompt.text}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

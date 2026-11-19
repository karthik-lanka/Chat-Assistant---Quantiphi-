import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Menu, Download, ChevronDown } from 'lucide-react';
import ToneSelector from './ToneSelector';

export default function ChatHeader({ onMenuToggle }) {
  const { activeConversation } = useChat();
  const [showExport, setShowExport] = useState(false);

  const handleExport = (format) => {
    if (!activeConversation) return;
    setShowExport(false);

    const { title, messages } = activeConversation;
    let content = '';

    if (format === 'markdown') {
      content = `# ${title}\n\n`;
      messages.forEach((msg) => {
        const time = new Date(msg.timestamp).toLocaleString();
        content += `### ${msg.role === 'user' ? 'You' : 'AI Assistant'} — ${time}\n\n${msg.content}\n\n---\n\n`;
      });
    } else {
      content = `${title}\n${'='.repeat(title.length)}\n\n`;
      messages.forEach((msg) => {
        const time = new Date(msg.timestamp).toLocaleString();
        content += `[${msg.role === 'user' ? 'You' : 'AI Assistant'}] ${time}\n\n${msg.content}\n\n---\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <h2 className="chat-header-title">
          {activeConversation?.title || 'Quantiphi AI Chat'}
        </h2>
      </div>
      <div className="chat-header-right">
        <ToneSelector />
        {activeConversation?.messages?.length > 0 && (
          <div className="export-dropdown">
            <button className="header-action-btn" onClick={() => setShowExport(!showExport)}>
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>
            {showExport && (
              <div className="export-menu">
                <button className="export-menu-item" onClick={() => handleExport('markdown')}>
                  Export as Markdown
                </button>
                <button className="export-menu-item" onClick={() => handleExport('text')}>
                  Export as Plain Text
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

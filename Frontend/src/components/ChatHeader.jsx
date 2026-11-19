import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Menu, Download, ChevronDown, FileText, FileCode } from 'lucide-react';
import ToneSelector from './ToneSelector';

export default function ChatHeader({ onMenuToggle }) {
  const { activeConversation, tone } = useChat();
  const [showExport, setShowExport] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowExport(false);
      }
    };
    if (showExport) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExport]);

  const handleExport = (format) => {
    if (!activeConversation) return;
    setShowExport(false);

    const { title, messages = [], createdAt, updatedAt } = activeConversation;
    const safeTitle = (title || 'Conversation')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim()
      .slice(0, 50);

    let content = '';

    if (format === 'markdown') {
      content = `# ${title || 'Conversation'}\n\n`;
      content += `> **Created:** ${createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}  \n`;
      content += `> **Tone:** ${tone}  \n`;
      content += `> **Messages:** ${messages.length}\n\n---\n\n`;

      messages.forEach((msg) => {
        const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 AI Assistant';
        const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        const toneStr = msg.tone ? ` [${msg.tone}]` : '';
        content += `### ${roleLabel}${toneStr} — ${timeStr}\n\n`;
        content += `${msg.content}\n\n---\n\n`;
      });
    } else {
      const divider = '='.repeat(50);
      const subDivider = '-'.repeat(50);
      content = `${title || 'Conversation'}\n${divider}\n`;
      content += `Created: ${createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}\n`;
      content += `Tone: ${tone}\n`;
      content += `Messages: ${messages.length}\n${divider}\n\n`;

      messages.forEach((msg) => {
        const roleLabel = msg.role === 'user' ? 'USER' : 'AI ASSISTANT';
        const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        content += `[${roleLabel}] ${timeStr}\n${subDivider}\n`;
        content += `${msg.content}\n\n`;
      });
    }

    const mimeType = format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasMessages = activeConversation?.messages?.length > 0;

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          title="Toggle Sidebar"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <h2 className="chat-header-title">
          {activeConversation?.title || 'Quantiphi AI Chat'}
        </h2>
      </div>

      <div className="chat-header-right">
        <ToneSelector />

        {hasMessages && (
          <div className="export-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="header-action-btn"
              onClick={() => setShowExport((prev) => !prev)}
              title="Export Conversation"
            >
              <Download size={14} />
              <span>Export</span>
              <ChevronDown size={12} />
            </button>

            {showExport && (
              <div className="export-menu">
                <button
                  className="export-menu-item"
                  onClick={() => handleExport('markdown')}
                >
                  <FileCode size={14} style={{ marginRight: 6 }} />
                  Export as Markdown (.md)
                </button>
                <button
                  className="export-menu-item"
                  onClick={() => handleExport('text')}
                >
                  <FileText size={14} style={{ marginRight: 6 }} />
                  Export as Plain Text (.txt)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

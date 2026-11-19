import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Plus, MessageSquare, Pencil, Trash2, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const {
    conversations,
    activeConversationId,
    loadConversations,
    loadConversation,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useChat();

  const [renameId, setRenameId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = async () => {
    await createConversation();
    onClose?.();
  };

  const handleSelect = (id) => {
    loadConversation(id);
    onClose?.();
  };

  const handleRenameStart = (e, conv) => {
    e.stopPropagation();
    setRenameId(conv._id);
    setRenameTitle(conv.title);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (renameTitle.trim()) {
      await renameConversation(renameId, renameTitle.trim());
    }
    setRenameId(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>Quantiphi AI</span>
            <button className="conversation-action-btn" onClick={onClose} style={{ opacity: 1, display: isOpen ? 'flex' : 'none' }}>
              <X size={18} />
            </button>
          </div>
          <button className="new-chat-btn" onClick={handleNewChat}>
            <Plus size={18} />
            New Chat
          </button>
        </div>
        <div className="sidebar-conversations">
          {conversations.length === 0 ? (
            <div className="sidebar-empty">
              <MessageSquare size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>No conversations yet</p>
              <p style={{ marginTop: 4 }}>Start a new chat!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className={`conversation-item ${activeConversationId === conv._id ? 'active' : ''}`}
                onClick={() => handleSelect(conv._id)}
              >
                {renameId === conv._id ? (
                  <form onSubmit={handleRenameSubmit} style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      className="modal-input"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onBlur={handleRenameSubmit}
                      autoFocus
                      style={{ padding: '4px 8px', fontSize: 13 }}
                    />
                  </form>
                ) : (
                  <>
                    <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                    <span className="conversation-item-title">{conv.title}</span>
                    <div className="conversation-item-actions">
                      <button className="conversation-action-btn" onClick={(e) => handleRenameStart(e, conv)} title="Rename">
                        <Pencil size={13} />
                      </button>
                      <button className="conversation-action-btn" onClick={(e) => handleDelete(e, conv._id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

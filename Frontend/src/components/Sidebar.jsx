import { useEffect, useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Plus, MessageSquare, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (renameId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameId]);

  const handleNewChat = async () => {
    await createConversation();
    onClose?.();
  };

  const handleSelect = (id) => {
    if (renameId) return;
    loadConversation(id);
    onClose?.();
  };

  const handleRenameStart = (e, conv) => {
    e.stopPropagation();
    setRenameId(conv._id || conv.id);
    setRenameTitle(conv.title || '');
  };

  const handleRenameSubmit = async (e) => {
    e?.preventDefault?.();
    const targetId = renameId;
    const newTitle = renameTitle.trim();
    setRenameId(null);

    if (newTitle && targetId) {
      await renameConversation(targetId, newTitle);
    }
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setRenameId(null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(e);
    }
  };

  const handleDeletePrompt = (e, conv) => {
    e.stopPropagation();
    setDeleteTarget(conv);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget._id || deleteTarget.id;
      setDeleteTarget(null);
      await deleteConversation(id);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
                Quantiphi AI
              </span>
              <span
                style={{
                  fontSize: 10,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 10,
                }}
              >
                Assistant
              </span>
            </div>
            <button
              className="conversation-action-btn"
              onClick={onClose}
              style={{ opacity: 1, display: isOpen ? 'flex' : 'none' }}
              title="Close menu"
            >
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
              <p style={{ marginTop: 4 }}>Click "New Chat" to begin!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const id = conv._id || conv.id;
              const isActive = activeConversationId === id;
              const isRenaming = renameId === id;

              return (
                <div
                  key={id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(id)}
                >
                  {isRenaming ? (
                    <form
                      onSubmit={handleRenameSubmit}
                      style={{ flex: 1, display: 'flex' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={renameInputRef}
                        className="modal-input"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameSubmit}
                        style={{
                          padding: '4px 8px',
                          fontSize: 13,
                          height: 28,
                          width: '100%',
                        }}
                      />
                    </form>
                  ) : (
                    <>
                      <MessageSquare
                        size={14}
                        style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}
                      />
                      <span className="conversation-item-title" title={conv.title}>
                        {conv.title}
                      </span>
                      <div className="conversation-item-actions">
                        <button
                          className="conversation-action-btn"
                          onClick={(e) => handleRenameStart(e, conv)}
                          title="Rename (Enter to save, Esc to cancel)"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="conversation-action-btn"
                          onClick={(e) => handleDeletePrompt(e, conv)}
                          title="Delete conversation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
                color: 'var(--error)',
              }}
            >
              <AlertTriangle size={20} />
              <h3 className="modal-title" style={{ margin: 0 }}>
                Delete Conversation?
              </h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                "{deleteTarget.title}"
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                style={{ background: 'var(--error)' }}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

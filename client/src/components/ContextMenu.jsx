import { useEffect } from 'react';

export default function ContextMenu({ contextMenu, currentUserId, onDeleteForMe, onDeleteForEveryone, onClose }) {
  useEffect(() => {
    window.addEventListener('click', onClose);
    return () => window.removeEventListener('click', onClose);
  }, [onClose]);

  if (!contextMenu) return null;

  return (
    <div
      style={{ ...styles.menu, top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.item} onClick={() => onDeleteForMe(contextMenu.message)}>
        🗑️ Delete for Me
      </div>
      {contextMenu.message.sender_id === currentUserId && (
        <div style={{ ...styles.item, color: '#e53e3e', borderBottom: 'none' }}
          onClick={() => onDeleteForEveryone(contextMenu.message)}>
          🚫 Delete for Everyone
        </div>
      )}
    </div>
  );
}

const styles = {
  menu: { position: 'fixed', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', minWidth: '200px', border: '1px solid #eee' },
  item: { padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid #f0f0f0', userSelect: 'none' }
};
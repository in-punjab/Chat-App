import { useCallback, useRef } from 'react';

export default function MessageInput({ newMessage, setNewMessage, onSend, socket, selectedUser }) {
  const typingTimeoutRef = useRef(null);

  const handleTyping = useCallback((e) => {
    setNewMessage(e.target.value);
    if (!selectedUser) return;
    socket().emit('typing_start', { receiver_id: selectedUser.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket().emit('typing_stop', { receiver_id: selectedUser.id });
    }, 1500);
  }, [selectedUser]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={styles.area}>
      <input
        style={styles.input}
        value={newMessage}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
      />
      <button onClick={onSend} style={styles.btn}>Send</button>
    </div>
  );
}

const styles = {
  area: { padding: '1rem', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' },
  input: { flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '24px', outline: 'none', fontSize: '0.95rem' },
  btn: { padding: '0.75rem 1.5rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }
};
import { useEffect, useRef } from 'react';

export default function MessageList({ messages, isTyping, currentUserId, onRightClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div style={styles.messages}>
      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUserId;
        return (
          <div
            key={msg.id}
            onContextMenu={(e) => onRightClick(e, msg)}
            style={{
              ...styles.bubble,
              alignSelf: isMine ? 'flex-end' : 'flex-start',
              background: isMine ? '#dcf8c6' : 'white',
              cursor: 'context-menu'
            }}
          >
            <span>{msg.content}</span>
            <div style={styles.meta}>
              <span style={styles.time}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isMine && (
                <span style={{ fontSize: '0.7rem', color: msg.is_read ? '#34B7F1' : '#aaa' }}>
                  {msg.is_read ? ' ✓✓' : ' ✓'}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div style={{ ...styles.bubble, alignSelf: 'flex-start', background: 'white' }}>
          <div style={styles.dots}>
            <span style={styles.dot} /><span style={styles.dot} /><span style={styles.dot} />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

const styles = {
  messages: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  bubble: { maxWidth: '65%', padding: '0.5rem 0.75rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  meta: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px' },
  time: { fontSize: '0.65rem', color: '#888' },
  dots: { display: 'flex', gap: '4px', padding: '4px 2px', alignItems: 'center' },
  dot: { width: '8px', height: '8px', background: '#aaa', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.2s infinite' }
};
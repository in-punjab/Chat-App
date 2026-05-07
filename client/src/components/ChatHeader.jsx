export default function ChatHeader({ selectedUser, isOnline }) {
  return (
    <div style={styles.header}>
      <div style={styles.avatar}>{selectedUser.username[0].toUpperCase()}</div>
      <div>
        <div style={styles.name}>{selectedUser.username}</div>
        <div style={{ fontSize: '0.75rem', color: isOnline ? '#25D366' : '#aaa' }}>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { padding: '1rem', background: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  name: { fontWeight: '500', fontSize: '0.95rem' }
};
import { useState } from 'react';

const avatarStyle = { width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 };

export default function Sidebar({ users, selectedUser, onSelectUser, onlineUsers, unreadCounts, currentUser, onLogout }) {
  const [search, setSearch] = useState('');

  const isOnline = (id) => onlineUsers.includes(id);

  // Filter users by search query
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.name}>{currentUser?.username}</span>
        <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Search Box */}
      <div style={styles.searchBox}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="🔍 Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={styles.clearBtn}>✕</button>
        )}
      </div>

      {/* User List */}
      <div style={styles.list}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u)}
              style={{
                ...styles.item,
                background: selectedUser?.id === u.id ? '#dcf8c6' : 'white'
              }}
            >
              <div style={avatarStyle}>{u.username[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                {/* Highlight matching text */}
                <div style={styles.username}>
                  {highlightMatch(u.username, search)}
                </div>
                <div style={{ fontSize: '0.75rem', color: isOnline(u.id) ? '#25D366' : '#aaa' }}>
                  {isOnline(u.id) ? '● Online' : '○ Offline'}
                </div>
              </div>
              {unreadCounts[u.id] > 0 && (
                <div style={styles.badge}>{unreadCounts[u.id]}</div>
              )}
            </div>
          ))
        ) : (
          <div style={styles.noResults}>
            No users found for "<strong>{search}</strong>"
          </div>
        )}
      </div>
    </div>
  );
}

// Highlights matching part of username in green
function highlightMatch(username, search) {
  if (!search) return username;

  const index = username.toLowerCase().indexOf(search.toLowerCase());
  if (index === -1) return username;

  return (
    <>
      {username.slice(0, index)}
      <span style={{ background: '#dcf8c6', borderRadius: '3px', padding: '0 2px' }}>
        {username.slice(index, index + search.length)}
      </span>
      {username.slice(index + search.length)}
    </>
  );
}

const styles = {
  sidebar: { width: '300px', background: 'white', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' },
  header: { padding: '1rem', background: '#25D366', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: 'white', fontWeight: 'bold', fontSize: '1rem' },
  logoutBtn: { background: 'transparent', border: '1px solid white', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer' },
  searchBox: { padding: '0.75rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  searchInput: { flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '20px', outline: 'none', fontSize: '0.9rem', background: '#f0f2f5' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.9rem', padding: '0.25rem' },
  list: { overflowY: 'auto', flex: 1 },
  item: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
  username: { fontWeight: '500', fontSize: '0.95rem' },
  badge: { background: '#25D366', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' },
  noResults: { padding: '1.5rem 1rem', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }
};
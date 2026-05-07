import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import useMessages from '../hooks/useMessages';
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ContextMenu from '../components/ContextMenu';
import API from '../api/axios';

export default function Chat() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [contextMenu, setContextMenu] = useState(null);

  const { socket, onlineUsers, isTyping, setIsTyping, selectedUserRef } = useSocket(token);

  const { messages, deleteForMe, deleteForEveryone } = useMessages(
    selectedUser, socket, selectedUserRef, setIsTyping, setUnreadCounts
  );

  // Keep ref in sync
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Fetch users
  useEffect(() => { API.get('/users').then(({ data }) => setUsers(data)); }, []);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;
    socket().emit('typing_stop', { receiver_id: selectedUser.id });
    socket().emit('send_message', { receiver_id: selectedUser.id, content: newMessage.trim() });
    setNewMessage('');
  };

  const handleRightClick = (e, message) => {
    e.preventDefault();
    const menuWidth = 200;
    const menuHeight = 100;
    const x = e.clientX + menuWidth > window.innerWidth ? e.clientX - menuWidth : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? e.clientY - menuHeight : e.clientY;
    setContextMenu({ x, y, message });
  };

  const isOnline = (id) => onlineUsers.includes(id);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f2f5' }}>
      <Sidebar
        users={users}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onlineUsers={onlineUsers}
        unreadCounts={unreadCounts}
        currentUser={user}
        onLogout={() => { logout(); navigate('/login'); }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <ChatHeader selectedUser={selectedUser} isOnline={isOnline(selectedUser.id)} />
            <MessageList
              messages={messages}
              isTyping={isTyping}
              currentUserId={user?.id}
              onRightClick={handleRightClick}
            />
            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={sendMessage}
              socket={socket}
              selectedUser={selectedUser}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
            <h3>👈 Select a user to start chatting</h3>
          </div>
        )}
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        currentUserId={user?.id}
        onDeleteForMe={(msg) => { deleteForMe(msg.id); setContextMenu(null); }}
        onDeleteForEveryone={(msg) => { deleteForEveryone(msg.id, selectedUser.id, socket); setContextMenu(null); }}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
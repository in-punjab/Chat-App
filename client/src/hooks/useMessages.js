import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function useMessages(selectedUser, socket, selectedUserRef, setIsTyping, setUnreadCounts) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket()) return;

    socket().on('receive_message', (message) => {
      if (selectedUserRef.current?.id === message.sender_id) {
        setMessages((prev) => [...prev, message]);
        socket().emit('mark_read', { sender_id: message.sender_id });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.sender_id]: (prev[message.sender_id] || 0) + 1
        }));
      }
    });

    socket().on('message_sent', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket().on('messages_read', ({ by }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiver_id === by ? { ...msg, is_read: true } : msg
        )
      );
    });

    socket().on('message_deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });
  }, [socket()]);

  useEffect(() => {
    if (!selectedUser) return;
    API.get(`/messages/${selectedUser.id}`).then(({ data }) => {
      setMessages(data);
      setIsTyping(false);
      setUnreadCounts((prev) => ({ ...prev, [selectedUser.id]: 0 }));
      socket().emit('mark_read', { sender_id: selectedUser.id });
    });
  }, [selectedUser]);

  const deleteForMe = async (messageId) => {
    await API.delete(`/messages/${messageId}/me`);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const deleteForEveryone = async (messageId, receiverId, socket) => {
    await API.delete(`/messages/${messageId}/everyone`);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    socket().emit('delete_for_everyone', { messageId, receiver_id: receiverId });
  };

  return { messages, deleteForMe, deleteForEveryone };
}
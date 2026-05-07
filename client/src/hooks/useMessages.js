import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function useMessages(selectedUser, socket, selectedUserRef, setIsTyping, setUnreadCounts) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const currentSocket = socket();
    if (!currentSocket) return;

    // Remove old listeners before adding new ones
    currentSocket.off('receive_message');
    currentSocket.off('message_sent');
    currentSocket.off('messages_read');
    currentSocket.off('message_deleted');

    currentSocket.on('receive_message', (message) => {
      if (selectedUserRef.current?.id === message.sender_id) {
        setMessages((prev) => [...prev, message]);
        currentSocket.emit('mark_read', { sender_id: message.sender_id });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.sender_id]: (prev[message.sender_id] || 0) + 1
        }));
      }
    });

    currentSocket.on('message_sent', (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    currentSocket.on('messages_read', ({ by }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiver_id === by ? { ...msg, is_read: true } : msg
        )
      );
    });

    currentSocket.on('message_deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    // Cleanup on unmount
    return () => {
      currentSocket.off('receive_message');
      currentSocket.off('message_sent');
      currentSocket.off('messages_read');
      currentSocket.off('message_deleted');
    };
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
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function useSocket(token) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const selectedUserRef = useRef(null);

  useEffect(() => {
    socket = io('http://localhost:5000', { auth: { token } });
    socket.on('online_users', setOnlineUsers);

    socket.on('user_typing', ({ sender_id }) => {
      if (selectedUserRef.current?.id === sender_id) setIsTyping(true);
    });

    socket.on('user_stopped_typing', ({ sender_id }) => {
      if (selectedUserRef.current?.id === sender_id) setIsTyping(false);
    });

    return () => socket.disconnect();
  }, [token]);

  return { socket: () => socket, onlineUsers, isTyping, setIsTyping, selectedUserRef };
}
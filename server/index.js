require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./supabase');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'https://chat-app-sandy-sigma-56.vercel.app'
];

// REST API cors
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Socket.IO cors
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => res.json({ status: 'Server running' }));

// Track online users
const onlineUsers = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  onlineUsers[userId] = socket.id;

  console.log(`User connected: ${socket.user.username}`);
  io.emit('online_users', Object.keys(onlineUsers));

  socket.on('send_message', async ({ receiver_id, content }) => {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{ sender_id: userId, receiver_id, content, is_read: false }])
        .select()
        .single();

      if (error) throw error;

      const receiverSocketId = onlineUsers[receiver_id];
      if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', message);

      socket.emit('message_sent', message);
    } catch (err) {
      socket.emit('error', err.message);
    }
  });

  socket.on('typing_start', ({ receiver_id }) => {
    const receiverSocketId = onlineUsers[receiver_id];
    if (receiverSocketId) io.to(receiverSocketId).emit('user_typing', { sender_id: userId });
  });

  socket.on('typing_stop', ({ receiver_id }) => {
    const receiverSocketId = onlineUsers[receiver_id];
    if (receiverSocketId) io.to(receiverSocketId).emit('user_stopped_typing', { sender_id: userId });
  });

  socket.on('mark_read', async ({ sender_id }) => {
    try {
      const { data: updatedMessages, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', sender_id)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;

      const senderSocketId = onlineUsers[sender_id];
      if (senderSocketId && updatedMessages.length > 0) {
        io.to(senderSocketId).emit('messages_read', { by: userId });
      }
    } catch (err) {
      socket.emit('error', err.message);
    }
  });

  socket.on('delete_for_everyone', ({ messageId, receiver_id }) => {
    const receiverSocketId = onlineUsers[receiver_id];
    if (receiverSocketId) io.to(receiverSocketId).emit('message_deleted', { messageId });
  });

  socket.on('disconnect', () => {
    delete onlineUsers[userId];
    io.emit('online_users', Object.keys(onlineUsers));
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
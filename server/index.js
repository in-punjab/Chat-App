console.log('Step 1: Starting...');
require('dotenv').config();
console.log('Step 2: dotenv loaded');
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'exists' : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'exists' : 'MISSING');

const express = require('express');
console.log('Step 3: express loaded');

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
console.log('Step 4: all imports loaded');

const supabase = require('./supabase');
console.log('Step 5: supabase loaded');

const authRoutes = require('./routes/auth');
console.log('Step 6: auth routes loaded');

const userRoutes = require('./routes/users');
console.log('Step 7: user routes loaded');

const messageRoutes = require('./routes/messages');
console.log('Step 8: message routes loaded');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

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

  // Notify other user when message deleted for everyone
  socket.on('delete_for_everyone', ({ messageId, receiver_id }) => {
    const receiverSocketId = onlineUsers[receiver_id];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message_deleted', { messageId });
    }
  });

  socket.on('disconnect', () => {
    delete onlineUsers[userId];
    io.emit('online_users', Object.keys(onlineUsers));
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

console.log('Step 9: about to start server...');

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err.message);
});
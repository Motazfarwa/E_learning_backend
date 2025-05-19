// app.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const { trainModel } = require('./Models/ToxicityModel');
const userrouter = require('./routes/users');

// Setup passport
require('./middelware/passport')(passport);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Get port from environment and set it to the app
const port = process.env.PORT || 4000;
app.set('port', port);

// Set the io instance to app.locals for global access
app.locals.io = io;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Routes
const Authrouter = require('./routes/auth.route');
app.use('/api', Authrouter);

const courseRoutes = require('./routes/courseRoutes');
const meetingsRouter = require('./routes/meeting');
app.use('/api', courseRoutes);
app.use('/api/meetings', meetingsRouter);

app.use('/ajouter/users', userrouter);
app.use('/api/users', require('./routes/users'));
app.use('/api/toxicity', require('./Models/Toxicity'));

const googleMeetRoute = require('./routes/googleMeet.route');
app.use('/api', googleMeetRoute);

const Paymentroute = require('./routes/paymentroute');
app.use('/api', Paymentroute);

// Nouvelle route pour le chat
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Serve static files from "Uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://eya:eya@cluster0.96xwi.mongodb.net/")
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connection error:', err));

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return next(new Error('Authentification requise'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_cle_secrete');
    socket.user = decoded; // Contient userId et role
    next();
  } catch (error) {
    next(new Error('Token invalide'));
  }
});

// Socket.IO Logic
const Message = require('./Models/Message');

io.on('connection', (socket) => {
  const { userId, role } = socket.user;
  console.log(`Utilisateur connecté: ${userId} (${role})`);

  // Rejoindre une salle de chat
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    console.log(`${userId} (${role}) a rejoint la salle ${roomId}`);
  });

  // Gestion des messages
  socket.on('sendMessage', async ({ roomId, content }) => {
    try {
      const message = new Message({
        roomId,
        senderId: userId,
        senderRole: role,
        content
      });
      await message.save();

      io.to(roomId).emit('message', {
        senderId: userId,
        senderRole: role,
        content,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Erreur sauvegarde message:', error);
    }
  });

  // Gestion des réunions existantes
  socket.on('join-meeting', ({ meetingCode, peerId }) => {
    socket.join(meetingCode);
    socket.to(meetingCode).emit('user-connected', peerId);

    if (!meetings[meetingCode]) meetings[meetingCode] = [];
    meetings[meetingCode].push(peerId);
  });

  socket.on('send-message', ({ meetingCode, message }) => {
    socket.to(meetingCode).emit('receive-message', {
      sender: 'Stranger',
      message,
    });
  });

  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${userId} (${role})`);
  });
});

// Start the server
async function startServer() {
  await trainModel(); // Ensure model is ready before handling requests

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();

// Export the app directly
module.exports = app;
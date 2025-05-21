// app.js
const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
<<<<<<< HEAD
const { trainModel } = require('./Models/ToxicityModel');

const app = express();
const server = http.createServer(app);
=======
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
>>>>>>> d3745ec8127e09b81e14262e3eb918764f4f9b2e

// ✅ Enable CORS at the top before any routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

<<<<<<< HEAD
// ✅ Socket.io setup
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
=======
// Get port from environment and set it to the app
const port = process.env.PORT || 4000;
app.set('port', port);

// Set the io instance to app.locals for global access
>>>>>>> d3745ec8127e09b81e14262e3eb918764f4f9b2e
app.locals.io = io;

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://eya:eya@cluster0.96xwi.mongodb.net/')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
require('./middelware/passport')(passport);

<<<<<<< HEAD
// ✅ Models
const Message = require('./models/Message');

// ✅ REST endpoint to fetch messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ✅ Real-time messaging with Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 User connected');

  socket.on('sendMessage', async ({ sender, content, role }) => {
    const message = new Message({ sender, content, role });
    await message.save();
    io.emit('newMessage', message); // Broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});


const userrouter = require('./routes/users');
const Authrouter = require('./routes/auth.route');
const courseRoutes = require('./routes/courseRoutes');
const meetingsRouter = require('./routes/meeting');
const googleMeetRoute = require('./routes/googleMeet.route');
const Paymentroute = require('./routes/paymentroute');

app.use('/api', Authrouter);
app.use('/api', courseRoutes);
app.use('/api/meetings', meetingsRouter);
app.use('/ajouter/users', userrouter);
app.use('/api/users', require('./routes/users'));
app.use('/api', googleMeetRoute);
app.use('/api', Paymentroute);
app.use('/api/toxicity', require('./Models/Toxicity'));

// ✅ Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Chatbot proxy route
app.post('/api/chat', async (req, res) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.json(data);
});

// ✅ Start server after training model
const port = process.env.PORT || 4000;
app.set('port', port);

=======
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
>>>>>>> d3745ec8127e09b81e14262e3eb918764f4f9b2e
async function startServer() {
  await trainModel(); // Train the model before starting the server
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

startServer();

<<<<<<< HEAD
module.exports = app;
=======
// Export the app directly
module.exports = app;
>>>>>>> d3745ec8127e09b81e14262e3eb918764f4f9b2e

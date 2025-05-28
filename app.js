const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');   
const { trainModel } = require('./Models/ToxicityModel');
const app = express();
const server = http.createServer(app);

// ✅ Enable CORS at the top before any routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Socket.io setup
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
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

  socket.on('sendMessage', async ({ sender, content }) => {
    const message = new Message({ sender, content });
    await message.save();
    io.emit('newMessage', message); // Broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// ✅ Routes

const userrouter = require('./routes/users');
const Authrouter = require('./routes/auth.route');
const courseRoutes = require('./routes/courseRoutes');
const meetingsRouter = require('./routes/meeting');
const googleMeetRoute = require('./routes/googleMeet.route');
const Paymentroute = require('./routes/paymentroute');

const Recommendationroute = require('./routes/recommendation.route');

const recommendationRoutes = require('./routes/recommendation.routes');


app.use('/api', Authrouter);
app.use('/api', courseRoutes);
app.use('/api/meetings', meetingsRouter);
app.use('/ajouter/users', userrouter);
app.use('/ajouter/', Recommendationroute);
app.use('/api/users', require('./routes/users'));


app.use('/api', recommendationRoutes);

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

async function startServer() {
  await trainModel(); // Train the model before starting the server
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

startServer();

module.exports = app;



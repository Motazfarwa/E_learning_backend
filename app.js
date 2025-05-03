const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const socketIO = require('socket.io');
const userrouter = require('./routes/users');

const { trainModel } = require('./Models/ToxicityModel');

// Setup passport
require('./middelware/passport')(passport);

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
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
const port = process.env.PORT || 4000;  // Default to 4000 if no PORT is set in the environment
app.set('port', port);


// Set the io instance to app.locals for global access
app.locals.io = io;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Routes (imported correctly)
const Authrouter = require('./routes/auth.route');
app.use('/api', Authrouter);

const courseRoutes = require('./routes/courseRoutes');
const meetingsRouter = require('./routes/meeting');
// Use course routes
app.use('/api', courseRoutes);
app.use('/api/meetings', meetingsRouter);

app.use('/ajouter/users', userrouter);




app.use("/uploads", express.static("uploads"));
app.use('/api/users', require('./routes/users'));
app.use('/api/toxicity', require('./Models/Toxicity'));



const googleMeetRoute = require('./routes/googleMeet.route');
app.use('/api', googleMeetRoute);


const Paymentroute= require('./routes/paymentroute');
app.use('/api', Paymentroute);
// Serve static files from "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://eya:eya@cluster0.96xwi.mongodb.net/")
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connection error:', err));

  

const meetings = {};

io.on('connection', socket => {
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
    console.log('A user disconnected');
  });
});

// Start the server
// Start the server
async function startServer() {
  await trainModel(); // Ensure model is ready before handling requests

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer(); // Call the async function



// Export the app directly
module.exports = app;  // This should export the app directly

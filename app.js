require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');

require('./middelware/passport')(passport); // Import passport middleware
const userRouter = require('./routes/auth.route'); // Import routes

const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

const server = http.createServer(app);
const io = socketIo(server);

// Set the io instance to app.locals for global access
app.locals.io = io;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Define routes
app.use('/api', userRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://eya:<db_password>@cluster0.96xwi.mongodb.net/")
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connection error:', err));

// Export app and server
module.exports = { app };

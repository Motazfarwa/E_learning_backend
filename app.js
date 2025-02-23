const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');

// Setup passport
require('./middelware/passport')(passport);

const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Get port from environment and set it to the app
const port = process.env.PORT || 4000;  // Default to 4000 if no PORT is set in the environment
app.set('port', port);

// Create the HTTP server using the app
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

// Routes (imported correctly)
const Authrouter = require('./routes/auth.route');
app.use('/api', Authrouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://eya:eya@cluster0.96xwi.mongodb.net/")
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connection error:', err));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export the app directly
module.exports = app;  // This should export the app directly

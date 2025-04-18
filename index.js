const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { createMeetLink } = require('./googleMeet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3001' } // port React
});

app.use(cors());
app.use(express.json());

app.post('/api/create-meeting', async (req, res) => {
  const { startTime, endTime, emails } = req.body;
  const meetLink = await createMeetLink(startTime, endTime, emails);
  res.json({ meetLink });
});

io.on('connection', socket => {
  console.log('✅ Utilisateur connecté');

  socket.on('end-meeting', () => {
    io.emit('meeting-ended');
  });
});

server.listen(3000, () => {
  console.log('✅ Backend lancé sur http://localhost:3000');
});

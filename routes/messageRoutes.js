const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const mongoose = require('mongoose');
// Send a message in a chat room
router.post('/send-message', async (req, res) => {
  try {
    const { roomId, senderId, message } = req.body;

    const newMessage = new Message({
      room: roomId,
      sender: senderId,
      message
    });

    const saved = await newMessage.save();
    const populated = await Message.populate(saved, {
      path: 'sender room',
      select: 'email role name'
    });

    res.json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a room
// routes/messageRoutes.js
router.get('/room-messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Add validation for MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: 'Invalid room ID format' });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');

    res.json(messages);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Create a new chat room
router.post('/create-room', async (req, res) => {
  try {
    const { participants, isGroup, name } = req.body;

    const existing = await ChatRoom.findOne({ 
      isGroup: false, 
      participants: { $all: participants, $size: participants.length }
    });

    if (!isGroup && existing) {
      return res.json({ success: true, room: existing });
    }

    const room = new ChatRoom({ participants, isGroup, name });
    const savedRoom = await room.save();

    res.json({ success: true, room: savedRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/chat/room-messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .sort({ createdAt: 1 }); // oldest first
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});
module.exports = router;

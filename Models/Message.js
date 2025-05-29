const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: String,
  sender: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;


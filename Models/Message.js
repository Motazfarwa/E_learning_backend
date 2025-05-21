<<<<<<< HEAD
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: String,
  sender: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
=======
// models/Message.js
const mongoose = require('mongoose');

// Define the schema
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['APPRENANT', 'INSTRUCTEUR'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Export the model, reusing it if already compiled
module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
>>>>>>> d3745ec8127e09b81e14262e3eb918764f4f9b2e

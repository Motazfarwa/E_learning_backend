const express = require('express');
const router = express.Router();
const Meeting = require('../Models/Meeting');
const { generateGoogleMeetLink } = require('../utils/meethelper');
const mongoose = require('mongoose');
const { sendMeetingEmail } = require('../emailService');
const nodemailer = require('nodemailer');

// Create a transporter for sending emails using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',  // You can use any email service you prefer
  auth: {
    user: 'your-email@gmail.com',  // replace with your email
    pass: 'your-email-password',   // replace with your email password (or app-specific password)
  },
});

// Create meeting
router.post('/', async (req, res) => {
  const { expert, startTime, duration, endTime, meetingUrl, meetingId } = req.body;

  try {
    const newMeeting = new Meeting({
      expert,
      startTime,
      duration: duration || 30,
      endTime,
      meetingUrl: meetingUrl || generateGoogleMeetLink(),
      meetingId: meetingId || new mongoose.Types.ObjectId().toString(),
    });

    await newMeeting.save();

    // ✅ Send a proper JSON response
    res.status(201).json(newMeeting);

  } catch (error) {
    console.error('Error saving meeting:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// In your status update endpoint
router.put('/:id/status', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    meeting.status = req.body.status;

    // Optional: override learner from request body
    if (req.body.learner) {
      meeting.learner = req.body.learner;
    }

    await meeting.save();

    if (req.body.status === 'accepted') {
      const emailSent = await sendMeetingEmail(meeting);
      if (!emailSent) {
        return res.status(500).json({ message: 'Meeting accepted but failed to send emails' });
      }
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get meeting details
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)

      .populate('expert')
      .populate('learner');
    
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all meetings
router.get('/', async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('expert')
      .populate('learner');
      
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
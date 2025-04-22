const express = require('express');
const router = express.Router();
const Meeting = require('../Models/Meeting');
const { generateGoogleMeetLink } = require('../utils/meethelper');
const mongoose = require('mongoose');
// Create meeting

// Modify POST route
router.post('/', async (req, res) => {
  // Check if all required fields are in the request body
  const { expert, learner, startTime, duration, endTime, meetingUrl, meetingId } = req.body;

  if (!expert || !learner || !startTime || !endTime || !meetingUrl) {
    return res.status(400).json({ message: 'All fields are required (expert, learner, startTime, endTime, meetingUrl).' });
  }

  try {
    // Create a new meeting
    const newMeeting = new Meeting({
      expert,
      learner,
      startTime,
      duration: duration || 30,  // Default to 30 minutes if not provided
      endTime,
      meetingUrl: meetingUrl || generateGoogleMeetLink(),  // Use fallback if not provided
      meetingId: meetingId || new mongoose.Types.ObjectId().toString(), // Fallback unique ID
    });

    // Save the new meeting to the database
    await newMeeting.save();
    res.status(201).json(newMeeting); // Return the created meeting as response

  } catch (error) {
    console.error('Error saving meeting:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

module.exports = router;
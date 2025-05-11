const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendMeetingEmail = async (meeting) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: [meeting.expert, meeting.learner], // Sends to both
      subject: `Meeting ${meeting.status} - ${meeting.meetingId}`,
      text: `
        Meeting Details:
        - Learner: ${meeting.learner}
        - Expert: ${meeting.expert}
        - Time: ${new Date(meeting.startTime).toLocaleString()} to ${new Date(meeting.endTime).toLocaleString()}
        - Status: ${meeting.status}
        - Meeting URL: http://localhost:3000/meetings/${meeting._id}
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};


module.exports = { sendMeetingEmail };
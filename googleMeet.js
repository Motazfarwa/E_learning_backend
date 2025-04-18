const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function createMeetLink(startTime, endTime, emails) {
  const event = {
    summary: 'Visio avec un expert',
    description: 'Appel visio de 15 minutes avec Google Meet',
    start: { dateTime: startTime, timeZone: 'Europe/Paris' },
    end: { dateTime: endTime, timeZone: 'Europe/Paris' },
    attendees: emails.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(2),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  });

  return response.data.hangoutLink;
}

module.exports = { createMeetLink };

const cron = require('node-cron');
const Meeting = require('../Models/Meeting');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    await Meeting.updateMany(
      { endTime: { $lte: now }, status: 'scheduled' },
      { $set: { status: 'completed' } }
    );
    console.log(`Closed meetings at ${now}`);
  } catch (error) {
    console.error('Error closing meetings:', error);
  }
});
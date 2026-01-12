const twilio = require('twilio');
const EmergencyContact = require('../models/EmergencyContact');
const NotificationLog = require('../models/NotificationLog');
const User = require('../models/User');

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

async function fetchEmergencyContact(userId) {
  return EmergencyContact.findOne({ userId }).sort({ createdAt: -1 }).lean();
}

async function logNotification({ userId, phone, status, errorMessage }) {
  try {
    await NotificationLog.create({
      userId,
      type: 'EMERGENCY_SMS',
      phone,
      status,
      errorMessage
    });
  } catch (err) {
    console.error('Notification log failed:', err.message);
  }
}

async function sendEmergencySMS({ userId }) {
  const contact = await fetchEmergencyContact(userId);
  if (!contact?.phone) {
    await logNotification({ userId, phone: contact?.phone, status: 'FAILED', errorMessage: 'Emergency contact missing' });
    return { ok: false, error: 'Emergency contact missing' };
  }

  const client = getTwilioClient();
  if (!client) {
    await logNotification({ userId, phone: contact.phone, status: 'FAILED', errorMessage: 'Twilio not configured' });
    return { ok: false, error: 'Twilio not configured' };
  }

  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    await logNotification({ userId, phone: contact.phone, status: 'FAILED', errorMessage: 'TWILIO_PHONE_NUMBER missing' });
    return { ok: false, error: 'TWILIO_PHONE_NUMBER missing' };
  }

  const user = await User.findById(userId).select('name');
  const userName = user?.name || 'the user';
  const body = `This is an automated message from SehatSphere.
We noticed signs of emotional distress.
Please check in with the user.`;

  try {
    const res = await client.messages.create({
      to: contact.phone,
      from,
      body
    });
    await logNotification({ userId, phone: contact.phone, status: 'SENT' });
    return { ok: true, sid: res.sid };
  } catch (err) {
    await logNotification({ userId, phone: contact.phone, status: 'FAILED', errorMessage: err.message || 'SMS send failed' });
    return { ok: false, error: err.message || 'SMS send failed' };
  }
}

module.exports = {
  sendEmergencySMS,
  fetchEmergencyContact
};

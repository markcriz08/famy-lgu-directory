const express = require('express');
const router = express.Router();
const axios = require('axios');

// Clean API Key & Device ID (removes accidental spaces or quote wrapping)
const rawApiKey = process.env.TEXTBEE_API_KEY || 'txb_9hoUuIyHpOoRQ2hBr3MhBM3hdrXJx2cE';
const rawDeviceId = process.env.TEXTBEE_DEVICE_ID || '6ac193beb5c1ad28b676bc44';

const TEXTBEE_API_KEY = rawApiKey.trim();
const TEXTBEE_DEVICE_ID = rawDeviceId.trim();

// Helper to format PH numbers to international format (+63...)
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+63' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

router.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Phone number and message content are required.' 
    });
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);

    // Pass apiKey both in query parameter and x-api-key header
    const response = await axios.post(
      `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms?apiKey=${encodeURIComponent(TEXTBEE_API_KEY)}`,
      {
        recipients: [formattedPhone],
        message: `[FAMY MDRRMO ALERT] ${message}`
      },
      {
        headers: {
          'x-api-key': TEXTBEE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data || error.message;
    console.error('TextBee Gateway Error:', errorMsg);
    
    res.status(500).json({
      success: false,
      error: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg
    });
  }
});

module.exports = router;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./lib/supabase');

const authRouter = require('./api/auth');
const adminRouter = require('./api/admin');
const smsRouter = require('./api/sms');
const contactsRouter = require('./api/contacts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/sms', smsRouter);
app.use('/api/contacts', contactsRouter);

// POST /api/text-blast - Targeted Group Text Blast
app.post('/api/text-blast', async (req, res) => {
  const { categories, message } = req.body;

  if (!categories || !categories.length || !message) {
    return res.status(400).json({ success: false, error: 'Categories and message are required.' });
  }

  try {
    let query = supabase.from('contacts').select('contact, category');

    if (!categories.includes('ALL')) {
      query = query.in('category', categories);
    }

    const { data: contacts, error } = await query;
    if (error) throw error;

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ success: false, error: 'No contacts found for selected category/groups.' });
    }

    const recipients = [...new Set(
      contacts
        .map(c => c.contact ? c.contact.trim() : null)
        .filter(Boolean)
    )];

    if (recipients.length === 0) {
      return res.status(404).json({ success: false, error: 'No valid phone numbers found for selected group(s).' });
    }

    const response = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: 'POST',
        headers: {
          'x-api-key': process.env.TEXTBEE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients, 
          message: '[FAMY MDRRMO ALERT] ${message}' 
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data.message || 'TextBee API Gateway error.', details: data });
    }

    return res.json({ success: true, count: recipients.length, data });
  } catch (err) {
    console.error('Text Blast Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend for all remaining routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`❄️  FAMY LGU Emergency Portal running on http://localhost:${PORT}`);
});
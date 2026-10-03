require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/sms', smsRouter);
app.use('/api/contacts', contactsRouter);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`❄️  FAMY LGU Emergency Portal running on http://localhost:${PORT}`);
});
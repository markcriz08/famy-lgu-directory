const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'famy_secret_key_2026';

// Register Admin (Pending)
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('admins')
      .insert([{ full_name, email, password_hash, role: 'admin', status: 'pending' }])
      .select();

    if (error) throw error;
    res.json({ success: true, message: 'Registration requested. Pending Super Admin approval.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(400).json({ success: false, error: 'Invalid email or password.' });
    }

    if (admin.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Account pending approval or rejected.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, full_name: admin.full_name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin.id, full_name: admin.full_name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'famy_secret_key_2026';

function verifySuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Access denied.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Super Admin privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
}

// Get pending admins
router.get('/pending', verifySuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, full_name, email, role, status, created_at')
      .eq('status', 'pending');

    if (error) throw error;
    res.json({ success: true, pendingAdmins: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve or reject admin
router.post('/review', verifySuperAdmin, async (req, res) => {
  const { adminId, action } = req.body; // action: 'approve' or 'reject'
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  try {
    const { data, error } = await supabase
      .from('admins')
      .update({ status: newStatus })
      .eq('id', adminId)
      .select();

    if (error) throw error;
    res.json({ success: true, message: `Admin request ${newStatus}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
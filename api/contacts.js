const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'famy_secret_key_2026';

// Middleware to verify logged-in Admin or Super Admin
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Access denied. Please log in.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token.' });
  }
}

// GET All Contacts (Public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('is_ice', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ success: true, contacts: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Add Contact (Admin Only)
router.post('/', verifyAdmin, async (req, res) => {
  const { name, contact, other_contact, address, organization_department, category, designation, fb_link, is_ice } = req.body;

  if (!name || !contact || !category) {
    return res.status(400).json({ success: false, error: 'Name, primary contact number, and category are required.' });
  }

  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        name,
        contact,
        other_contact,
        address,
        organization_department,
        category,
        designation,
        fb_link,
        is_ice: !!is_ice
      }])
      .select();

    if (error) throw error;
    res.json({ success: true, contact: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT Update Contact (Admin Only)
router.put('/:id', verifyAdmin, async (req, res) => {
  const { name, contact, other_contact, address, organization_department, category, designation, fb_link, is_ice } = req.body;

  try {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        name,
        contact,
        other_contact,
        address,
        organization_department,
        category,
        designation,
        fb_link,
        is_ice
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json({ success: true, contact: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Contact (Admin Only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Contact deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Resign Personnel: Transfers MDRRMO Personnel to ACDV (Volunteers)
router.post('/:id/resign', verifyAdmin, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ success: false, error: 'Contact not found.' });

    const updatedDesignation = existing.designation ? `${existing.designation} (Resigned / Volunteer)` : 'ACDV Volunteer';

    const { data, error } = await supabase
      .from('contacts')
      .update({
        category: 'ACDV',
        designation: updatedDesignation
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json({ success: true, message: 'Personnel status updated to ACDV (Volunteer).', contact: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
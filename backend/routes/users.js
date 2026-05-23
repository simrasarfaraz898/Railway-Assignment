const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, requireAdmin } = require('../middleware/auth');

// @GET /api/users - Admin only
router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/users/search?email=
router.get('/search', protect, async (req, res) => {
  try {
    const { email, name } = req.query;
    let query = {};
    if (email) query.email = { $regex: email, $options: 'i' };
    if (name) query.name = { $regex: name, $options: 'i' };

    const users = await User.find(query).select('name email avatar role').limit(10);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/users/:id/role - Admin only
router.put('/:id/role', protect, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

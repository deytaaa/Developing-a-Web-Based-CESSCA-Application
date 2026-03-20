const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

// GET /api/activity-logs (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const offset = (page - 1) * limit;

    // Get total count
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM activity_logs`
    );

    // Get paginated logs
    const [logs] = await pool.query(
      `SELECT l.*, u.email, u.role
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.user_id
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ logs, page, limit, total: count });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

// POST /api/activity-logs
router.post('/', auth, async (req, res) => {
  try {
    const { action, entity_type, entity_id, description } = req.body;
    const ip_address = req.ip;
    const user_agent = req.headers['user-agent'] || '';
    const user_id = req.user?.user_id || null;
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [user_id, action, entity_type, entity_id, description, ip_address, user_agent]
    );
    res.status(201).json({ message: 'Activity log recorded' });
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({ message: 'Failed to record activity log' });
  }
});

module.exports = router;

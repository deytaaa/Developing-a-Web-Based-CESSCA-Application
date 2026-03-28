const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get About page content (public)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT content, updated_at FROM about_content ORDER BY id DESC LIMIT 1');
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'About content not found' });
        }
        res.json({ success: true, content: rows[0].content, updated_at: rows[0].updated_at });
    } catch (error) {
        console.error('Get about content error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch about content' });
    }
});

// Update About page content (admin/cessca_staff only)
router.put('/', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }
        await pool.query('UPDATE about_content SET content = ?, updated_at = NOW() WHERE id = 1', [JSON.stringify(content)]);
        res.json({ success: true, message: 'About content updated successfully' });
    } catch (error) {
        console.error('Update about content error:', error);
        res.status(500).json({ success: false, message: 'Failed to update about content' });
    }
});

module.exports = router;

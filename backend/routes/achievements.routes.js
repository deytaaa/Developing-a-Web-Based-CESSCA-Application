const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// ─── GET all achievements (authenticated users) ───────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const { category, award_level, year, featured } = req.query;

        let query = `
            SELECT sa.*, u.email as created_by_email,
                   up.first_name as created_by_first_name,
                   up.last_name  as created_by_last_name
            FROM school_achievements sa
            JOIN users u  ON sa.created_by = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND sa.category = ?';
            params.push(category);
        }
        if (award_level) {
            query += ' AND sa.award_level = ?';
            params.push(award_level);
        }
        if (year) {
            query += ' AND YEAR(sa.achievement_date) = ?';
            params.push(year);
        }
        if (featured === 'true') {
            query += ' AND sa.is_featured = TRUE';
        }

        query += ' ORDER BY sa.achievement_date DESC';

        const [achievements] = await pool.query(query, params);

        res.json({ success: true, count: achievements.length, achievements });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch achievements', error: error.message });
    }
});

// ─── GET featured achievements ────────────────────────────────────────────────
router.get('/featured', auth, async (req, res) => {
    try {
        const [achievements] = await pool.query(
            `SELECT sa.*, up.first_name as created_by_first_name, up.last_name as created_by_last_name
             FROM school_achievements sa
             JOIN users u ON sa.created_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE sa.is_featured = TRUE
             ORDER BY sa.achievement_date DESC
             LIMIT 6`
        );
        res.json({ success: true, achievements });
    } catch (error) {
        console.error('Get featured achievements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured achievements', error: error.message });
    }
});

// ─── GET single achievement ───────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT sa.*, u.email as created_by_email,
                    up.first_name as created_by_first_name,
                    up.last_name  as created_by_last_name
             FROM school_achievements sa
             JOIN users u  ON sa.created_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE sa.achievement_id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Achievement not found' });
        }
        res.json({ success: true, achievement: rows[0] });
    } catch (error) {
        console.error('Get achievement error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch achievement', error: error.message });
    }
});

// ─── CREATE achievement (admin / cessca_staff) ────────────────────────────────
router.post(
    '/',
    auth,
    roleCheck('admin', 'cessca_staff'),
    upload.single('image'),
    [
        body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
        body('achievement_date').isDate().withMessage('Valid achievement date is required'),
        body('category').isIn(['academic', 'sports', 'cultural', 'community', 'other']),
        body('award_level').isIn(['international', 'national', 'regional', 'local', 'institutional']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { title, description, achievement_date, category, award_level, recipient, is_featured } = req.body;
            const image_url = req.file ? `/uploads/${req.file.filename}` : null;

            const [result] = await pool.query(
                `INSERT INTO school_achievements
                    (title, description, achievement_date, category, award_level, recipient, image_url, is_featured, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, description || null, achievement_date, category, award_level,
                 recipient || null, image_url, is_featured === 'true' || is_featured === true ? 1 : 0,
                 req.user.userId]
            );

            const [rows] = await pool.query(
                'SELECT * FROM school_achievements WHERE achievement_id = ?',
                [result.insertId]
            );

            res.status(201).json({ success: true, message: 'Achievement created successfully', achievement: rows[0] });
        } catch (error) {
            console.error('Create achievement error:', error);
            res.status(500).json({ success: false, message: 'Failed to create achievement', error: error.message });
        }
    }
);

// ─── UPDATE achievement (admin / cessca_staff) ────────────────────────────────
router.put(
    '/:id',
    auth,
    roleCheck('admin', 'cessca_staff'),
    upload.single('image'),
    [
        body('title').optional().trim().notEmpty().isLength({ max: 200 }),
        body('achievement_date').optional().isDate(),
        body('category').optional().isIn(['academic', 'sports', 'cultural', 'community', 'other']),
        body('award_level').optional().isIn(['international', 'national', 'regional', 'local', 'institutional']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const [existing] = await pool.query(
                'SELECT * FROM school_achievements WHERE achievement_id = ?',
                [req.params.id]
            );
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Achievement not found' });
            }

            const { title, description, achievement_date, category, award_level, recipient, is_featured } = req.body;
            const image_url = req.file ? `/uploads/${req.file.filename}` : existing[0].image_url;

            await pool.query(
                `UPDATE school_achievements SET
                    title            = COALESCE(?, title),
                    description      = COALESCE(?, description),
                    achievement_date = COALESCE(?, achievement_date),
                    category         = COALESCE(?, category),
                    award_level      = COALESCE(?, award_level),
                    recipient        = COALESCE(?, recipient),
                    image_url        = ?,
                    is_featured      = COALESCE(?, is_featured)
                 WHERE achievement_id = ?`,
                [
                    title || null,
                    description !== undefined ? description : null,
                    achievement_date || null,
                    category || null,
                    award_level || null,
                    recipient !== undefined ? recipient : null,
                    image_url,
                    is_featured !== undefined ? (is_featured === 'true' || is_featured === true ? 1 : 0) : null,
                    req.params.id,
                ]
            );

            const [rows] = await pool.query('SELECT * FROM school_achievements WHERE achievement_id = ?', [req.params.id]);
            res.json({ success: true, message: 'Achievement updated successfully', achievement: rows[0] });
        } catch (error) {
            console.error('Update achievement error:', error);
            res.status(500).json({ success: false, message: 'Failed to update achievement', error: error.message });
        }
    }
);

// ─── DELETE achievement (admin only) ─────────────────────────────────────────
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const [existing] = await pool.query(
            'SELECT achievement_id FROM school_achievements WHERE achievement_id = ?',
            [req.params.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Achievement not found' });
        }

        await pool.query('DELETE FROM school_achievements WHERE achievement_id = ?', [req.params.id]);

        res.json({ success: true, message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('Delete achievement error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete achievement', error: error.message });
    }
});

module.exports = router;

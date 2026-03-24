const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const bcrypt = require('bcryptjs');

// Get all users (Admin and CESSCA Staff)
router.get('/users', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        const { role, status } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM users u
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            baseQuery += ' AND u.role = ?';
            params.push(role);
        }
        if (status) {
            baseQuery += ' AND u.status = ?';
            params.push(status);
        }

        // Get total count
        const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count ${baseQuery}`, params);

        // Get paginated users
        const [users] = await pool.query(
            `SELECT u.user_id, u.email, u.role, u.status, u.created_at, u.last_login,
                    up.first_name, up.middle_name, up.last_name, up.student_id, 
                    up.course, up.contact_number, up.profile_picture
             ${baseQuery}
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            count: users.length,
            total: count,
            page,
            limit,
            users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch users',
            error: error.message 
        });
    }
});

// Get pending users (Admin/CESSCA)
router.get('/users/pending', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.user_id, u.email, u.role, u.created_at,
                    up.first_name, up.middle_name, up.last_name, up.student_id, up.course
             FROM users u
             LEFT JOIN user_profiles up ON u.user_id = up.user_id
             WHERE u.status = 'pending'
             ORDER BY u.created_at DESC`
        );

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch pending users',
            error: error.message 
        });
    }
});

// Approve/Reject user registration
router.put('/users/:id/approve', auth, roleCheck('admin', 'cessca_staff'), [
    body('status').isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const { status } = req.body;

        await pool.query(
            'UPDATE users SET status = ? WHERE user_id = ?',
            [status, req.params.id]
        );

        // Log activity
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'approve_user', 'user', ?, 'User registration approved')`,
            [req.user.userId, req.params.id]
        );

        res.json({
            success: true,
            message: `User ${status === 'active' ? 'approved' : 'rejected'} successfully`
        });

    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve user',
            error: error.message 
        });
    }
});

// Create user directly (Admin only)
router.post('/users/create', auth, roleCheck('admin'), [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student', 'officer', 'alumni', 'cessca_staff', 'admin']),
    body('first_name').notEmpty(),
    body('last_name').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { 
            email, 
            password, 
            role, 
            first_name, 
            middle_name, 
            last_name, 
            student_id,
            course,
            contact_number
        } = req.body;

        // Check if email already exists
        const [existingUser] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account
        const [userResult] = await pool.query(
            'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, 'active']
        );

        const userId = userResult.insertId;

        // Create user profile
        await pool.query(
            `INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, student_id, course, contact_number)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, first_name, middle_name || null, last_name, student_id || null, course || null, contact_number || null]
        );

        // Log activity
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'create_user', 'user', ?, ?)`,
            [req.user.userId, userId, `Created ${role} account for ${first_name} ${last_name}`]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                user_id: userId,
                email,
                role,
                first_name,
                last_name
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create user',
            error: error.message 
        });
    }
});

// Update user role (Admin only)
router.put('/users/:id/role', auth, roleCheck('admin'), [
    body('role').isIn(['student', 'officer', 'alumni', 'cessca_staff', 'admin'])
], async (req, res) => {
    try {
        const { role } = req.body;

        await pool.query(
            'UPDATE users SET role = ? WHERE user_id = ?',
            [role, req.params.id]
        );

        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'change_role', 'user', ?, ?)`,
            [req.user.userId, req.params.id, `Changed user role to ${role}`]
        );

        res.json({
            success: true,
            message: 'User role updated successfully'
        });

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user role',
            error: error.message 
        });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);
        // Prevent self-deletion
        if (targetUserId === req.user.userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete your own account' 
            });
        }

        // Check if target user is admin
        const [targetRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [targetUserId]);
        if (targetRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const targetRole = targetRows[0].role;

        if (targetRole === 'admin') {
            // Count number of admins
            const [[{ count: adminCount }]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last remaining admin account'
                });
            }
        }

        await pool.query('DELETE FROM users WHERE user_id = ?', [targetUserId]);

        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'delete_user', 'user', ?, 'User deleted')`,
            [req.user.userId, targetUserId]
        );

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user',
            error: error.message 
        });
    }
});

// Get all announcements
router.get('/announcements', auth, async (req, res) => {
    try {
        const { status, type } = req.query;
        
        let query = `
            SELECT a.*, u.email as published_by_email,
                   up.first_name as published_by_first_name, up.last_name as published_by_last_name,
                   o.org_name as target_org_name
            FROM announcements a
            JOIN users u ON a.published_by = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            LEFT JOIN organizations o ON a.target_org_id = o.org_id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role !== 'admin' && req.user.role !== 'cessca_staff') {
            query += ' AND a.status = "published"';
        }

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        if (type) {
            query += ' AND a.announcement_type = ?';
            params.push(type);
        }

        query += ' ORDER BY a.published_at DESC';

        const [announcements] = await pool.query(query, params);

        res.json({
            success: true,
            count: announcements.length,
            announcements
        });

    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch announcements',
            error: error.message 
        });
    }
});

// Create announcement (Admin/CESSCA)
router.post('/announcements', auth, roleCheck('admin', 'cessca_staff'), [
    body('title').notEmpty().trim(),
    body('content').notEmpty().trim(),
    body('announcementType').isIn(['general', 'organization', 'sports', 'academic', 'disciplinary', 'urgent']),
    body('targetAudience').isIn(['all', 'students', 'officers', 'alumni', 'specific_org'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            title, content, announcementType, targetAudience, targetOrgId, priority, expiresAt
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO announcements 
             (title, content, announcement_type, target_audience, target_org_id, 
              priority, status, published_by, published_at, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, 'published', ?, NOW(), ?)`,
            [title, content, announcementType, targetAudience, targetOrgId || null,
             priority || 'normal', req.user.userId, expiresAt || null]
        );

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcementId: result.insertId
        });

    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create announcement',
            error: error.message 
        });
    }
});

// Update announcement
router.put('/announcements/:id', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        const { title, content, announcementType, targetAudience, targetOrgId, priority, status, expiresAt } = req.body;

        await pool.query(
            `UPDATE announcements 
             SET title = ?, content = ?, announcement_type = ?, target_audience = ?,
                 target_org_id = ?, priority = ?, status = ?, expires_at = ?
             WHERE announcement_id = ?`,
            [title, content, announcementType, targetAudience, targetOrgId || null,
             priority, status, expiresAt || null, req.params.id]
        );

        res.json({
            success: true,
            message: 'Announcement updated successfully'
        });

    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update announcement',
            error: error.message 
        });
    }
});

// Delete announcement
router.delete('/announcements/:id', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        await pool.query('DELETE FROM announcements WHERE announcement_id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });

    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete announcement',
            error: error.message 
        });
    }
});

// Get activity logs
router.get('/logs', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { limit = 100, entityType, userId } = req.query;
        
        let query = `
            SELECT al.*, u.email, up.first_name, up.last_name
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE 1=1
        `;
        const params = [];

        if (entityType) {
            query += ' AND al.entity_type = ?';
            params.push(entityType);
        }
        if (userId) {
            query += ' AND al.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY al.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [logs] = await pool.query(query, params);

        res.json({
            success: true,
            count: logs.length,
            logs
        });

    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch logs',
            error: error.message 
        });
    }
});

// Get system settings
router.get('/settings', auth, roleCheck('admin'), async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');

        res.json({
            success: true,
            count: settings.length,
            settings
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch settings',
            error: error.message 
        });
    }
});

// Update system setting
router.put('/settings/:key', auth, roleCheck('admin'), [
    body('value').notEmpty()
], async (req, res) => {
    try {
        const { value } = req.body;

        await pool.query(
            `UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?`,
            [value, req.user.userId, req.params.key]
        );

        res.json({
            success: true,
            message: 'Setting updated successfully'
        });

    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update setting',
            error: error.message 
        });
    }
});

// Get pending organization memberships (Admin/CESSCA)
router.get('/members/pending', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        const [pendingMembers] = await pool.query(
            `SELECT om.*, o.org_name, o.org_acronym, u.email, 
                    up.first_name, up.last_name, up.student_id, up.profile_picture
             FROM organization_members om
             JOIN organizations o ON om.org_id = o.org_id
             JOIN users u ON om.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE om.membership_status = 'pending'
             ORDER BY om.joined_date DESC`
        );

        res.json({
            success: true,
            count: pendingMembers.length,
            members: pendingMembers
        });

    } catch (error) {
        console.error('Get pending members error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch pending members',
            error: error.message 
        });
    }
});

// Approve organization membership (Admin/CESSCA)
router.put('/members/:memberId/approve', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        await pool.query(
            `UPDATE organization_members 
             SET membership_status = 'active', approved_by = ?, approved_at = NOW()
             WHERE member_id = ?`,
            [req.user.userId, req.params.memberId]
        );

        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'approve_membership', 'organization_member', ?, 'Organization membership approved')`,
            [req.user.userId, req.params.memberId]
        );

        res.json({
            success: true,
            message: 'Membership approved successfully'
        });

    } catch (error) {
        console.error('Approve membership error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve membership',
            error: error.message 
        });
    }
});

// Reject organization membership (Admin/CESSCA)
router.put('/members/:memberId/reject', auth, roleCheck('admin', 'cessca_staff'), async (req, res) => {
    try {
        // Delete the membership request completely
        const result = await pool.query(
            `DELETE FROM organization_members WHERE member_id = ?`,
            [req.params.memberId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }

        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'reject_membership', 'organization_member', ?, 'Organization membership rejected')`,
            [req.user.userId, req.params.memberId]
        );

        res.json({
            success: true,
            message: 'Membership rejected successfully'
        });

    } catch (error) {
        console.error('Reject membership error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reject membership',
            error: error.message 
        });
    }
});

module.exports = router;

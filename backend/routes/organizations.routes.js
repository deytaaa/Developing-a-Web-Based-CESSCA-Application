const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all organizations
router.get('/', async (req, res) => {
    try {
        const { status, type } = req.query;
        
        let query = `
            SELECT o.*, COUNT(DISTINCT om.member_id) as member_count,
                   COUNT(DISTINCT oo.officer_id) as officer_count
            FROM organizations o
            LEFT JOIN organization_members om ON o.org_id = om.org_id AND om.membership_status = 'active'
            LEFT JOIN organization_officers oo ON o.org_id = oo.org_id AND oo.status = 'active'
        `;
        const params = [];

        if (status || type) {
            query += ' WHERE 1=1';
            if (status) {
                query += ' AND o.status = ?';
                params.push(status);
            }
            if (type) {
                query += ' AND o.org_type = ?';
                params.push(type);
            }
        }

        query += ' GROUP BY o.org_id ORDER BY o.org_name';

        const [organizations] = await pool.query(query, params);

        res.json({
            success: true,
            count: organizations.length,
            organizations
        });

    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch organizations',
            error: error.message 
        });
    }
});

// Get organizations where current user is an officer
router.get('/my/officer-organizations', auth, roleCheck('officer'), async (req, res) => {
    try {
        const [organizations] = await pool.query(
            `SELECT o.*, oo.position, oo.term_start, oo.term_end,
                    COUNT(DISTINCT om.member_id) as member_count,
                    COUNT(DISTINCT oa.activity_id) as activity_count
             FROM organizations o
             INNER JOIN organization_officers oo ON o.org_id = oo.org_id
             LEFT JOIN organization_members om ON o.org_id = om.org_id AND om.membership_status = 'active'
             LEFT JOIN organization_activities oa ON o.org_id = oa.org_id
             WHERE oo.user_id = ? AND oo.status = 'active' AND o.status = 'active'
             GROUP BY o.org_id, oo.officer_id
             ORDER BY o.org_name`,
            [req.user.userId]
        );

        res.json({
            success: true,
            count: organizations.length,
            organizations
        });

    } catch (error) {
        console.error('Get officer organizations error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch officer organizations',
            error: error.message 
        });
    }
});

// Get organization by ID
router.get('/:id', async (req, res) => {
    try {
        const [organizations] = await pool.query(
            `SELECT o.*, COUNT(DISTINCT om.member_id) as member_count,
                    COUNT(DISTINCT oo.officer_id) as officer_count,
                    COUNT(DISTINCT oa.activity_id) as activity_count
             FROM organizations o
             LEFT JOIN organization_members om ON o.org_id = om.org_id AND om.membership_status = 'active'
             LEFT JOIN organization_officers oo ON o.org_id = oo.org_id AND oo.status = 'active'
             LEFT JOIN organization_activities oa ON o.org_id = oa.org_id
             WHERE o.org_id = ?
             GROUP BY o.org_id`,
            [req.params.id]
        );

        if (organizations.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Organization not found' 
            });
        }

        res.json({
            success: true,
            organization: organizations[0]
        });

    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch organization',
            error: error.message 
        });
    }
});

// Create organization (CESSCA/Admin only)
router.post('/', auth, roleCheck('cessca_staff', 'admin'), [
    body('org_name').notEmpty().trim(),
    body('org_acronym').notEmpty().trim(),
    body('org_type').isIn(['academic', 'cultural', 'sports', 'social', 'special_interest'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { org_name, org_acronym, org_type, description, mission, vision, founded_date, status } = req.body;

        const [result] = await pool.query(
            `INSERT INTO organizations (org_name, org_acronym, org_type, description, mission, vision, founded_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [org_name, org_acronym, org_type, description, mission, vision, founded_date, status || 'active']
        );

        res.status(201).json({
            success: true,
            message: 'Organization created successfully',
            orgId: result.insertId
        });

    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create organization',
            error: error.message 
        });
    }
});

// Update organization (CESSCA/Admin only)
router.put('/:id', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const { org_name, org_acronym, org_type, description, mission, vision, status } = req.body;

        // Check if organization exists
        const [existing] = await pool.query('SELECT org_id FROM organizations WHERE org_id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        await pool.query(
            `UPDATE organizations 
             SET org_name = ?, org_acronym = ?, org_type = ?, description = ?, 
                 mission = ?, vision = ?, status = ?, updated_at = NOW()
             WHERE org_id = ?`,
            [org_name, org_acronym, org_type, description, mission, vision, status, req.params.id]
        );

        res.json({
            success: true,
            message: 'Organization updated successfully'
        });

    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update organization',
            error: error.message 
        });
    }
});

// Delete organization (Admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        // Check if organization exists
        const [existing] = await pool.query('SELECT org_id FROM organizations WHERE org_id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        await pool.query('DELETE FROM organizations WHERE org_id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Organization deleted successfully'
        });

    } catch (error) {
        console.error('Delete organization error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete organization',
            error: error.message 
        });
    }
});

// Get organization members
router.get('/:id/members', auth, async (req, res) => {
    try {
        const [members] = await pool.query(
            `SELECT om.*, u.email, up.first_name, up.last_name, up.student_id, up.course, up.profile_picture
             FROM organization_members om
             JOIN users u ON om.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE om.org_id = ?
             ORDER BY om.joined_date DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            count: members.length,
            members
        });

    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch members',
            error: error.message 
        });
    }
});

// Join organization (Student)
router.post('/:id/join', auth, roleCheck('student', 'officer'), async (req, res) => {
    try {
        // Check if already a member
        const [existing] = await pool.query(
            'SELECT member_id FROM organization_members WHERE org_id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already a member or pending approval' 
            });
        }

        await pool.query(
            'INSERT INTO organization_members (org_id, user_id, membership_status, joined_date) VALUES (?, ?, ?, CURDATE())',
            [req.params.id, req.user.userId, 'pending']
        );

        res.status(201).json({
            success: true,
            message: 'Membership request submitted'
        });

    } catch (error) {
        console.error('Join organization error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to join organization',
            error: error.message 
        });
    }
});

// Approve membership request (Officers of org + CESSCA/Admin)
router.put('/:id/members/:memberId/approve', auth, async (req, res) => {
    try {
        // Check if user has permission (CESSCA/Admin OR officer of this org)
        const isCessca = ['cessca_staff', 'admin'].includes(req.user.role);
        
        if (!isCessca) {
            // Check if user is an officer of this organization
            const [officerCheck] = await pool.query(
                'SELECT officer_id FROM organization_officers WHERE org_id = ? AND user_id = ? AND status = "active"',
                [req.params.id, req.user.userId]
            );

            if (officerCheck.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only officers of this organization or CESSCA staff can approve members' 
                });
            }
        }

        // Check if member exists and is pending
        const [member] = await pool.query(
            'SELECT member_id, membership_status FROM organization_members WHERE member_id = ? AND org_id = ?',
            [req.params.memberId, req.params.id]
        );

        if (member.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }

        if (member[0].membership_status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Member is not pending approval' 
            });
        }

        // Approve member
        await pool.query(
            'UPDATE organization_members SET membership_status = "active", joined_date = CURDATE() WHERE member_id = ?',
            [req.params.memberId]
        );

        res.json({
            success: true,
            message: 'Member approved successfully'
        });

    } catch (error) {
        console.error('Approve member error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve member',
            error: error.message 
        });
    }
});

// Reject membership request (Officers of org + CESSCA/Admin)
router.put('/:id/members/:memberId/reject', auth, async (req, res) => {
    try {
        // Check if user has permission (CESSCA/Admin OR officer of this org)
        const isCessca = ['cessca_staff', 'admin'].includes(req.user.role);
        
        if (!isCessca) {
            // Check if user is an officer of this organization
            const [officerCheck] = await pool.query(
                'SELECT officer_id FROM organization_officers WHERE org_id = ? AND user_id = ? AND status = "active"',
                [req.params.id, req.user.userId]
            );

            if (officerCheck.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only officers of this organization or CESSCA staff can reject members' 
                });
            }
        }

        // Check if member exists
        const [member] = await pool.query(
            'SELECT member_id, membership_status FROM organization_members WHERE member_id = ? AND org_id = ?',
            [req.params.memberId, req.params.id]
        );

        if (member.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }

        // Delete the membership request
        await pool.query(
            'DELETE FROM organization_members WHERE member_id = ?',
            [req.params.memberId]
        );

        res.json({
            success: true,
            message: 'Membership request rejected'
        });

    } catch (error) {
        console.error('Reject member error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reject member',
            error: error.message 
        });
    }
});

// Remove member (Officers of org + CESSCA/Admin)
router.delete('/:id/members/:memberId', auth, async (req, res) => {
    try {
        // Check if user has permission (CESSCA/Admin OR officer of this org)
        const isCessca = ['cessca_staff', 'admin'].includes(req.user.role);
        
        if (!isCessca) {
            // Check if user is an officer of this organization
            const [officerCheck] = await pool.query(
                'SELECT officer_id FROM organization_officers WHERE org_id = ? AND user_id = ? AND status = "active"',
                [req.params.id, req.user.userId]
            );

            if (officerCheck.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only officers of this organization or CESSCA staff can remove members' 
                });
            }
        }

        // Check if member exists
        const [member] = await pool.query(
            'SELECT member_id FROM organization_members WHERE member_id = ? AND org_id = ?',
            [req.params.memberId, req.params.id]
        );

        if (member.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }

        // Remove member
        await pool.query(
            'DELETE FROM organization_members WHERE member_id = ?',
            [req.params.memberId]
        );

        res.json({
            success: true,
            message: 'Member removed successfully'
        });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove member',
            error: error.message 
        });
    }
});

// Get organization officers
router.get('/:id/officers', async (req, res) => {
    try {
        const [officers] = await pool.query(
            `SELECT oo.*, u.email, up.first_name, up.last_name, up.student_id, up.profile_picture
             FROM organization_officers oo
             JOIN users u ON oo.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE oo.org_id = ? AND oo.status = 'active'
             ORDER BY oo.appointed_at DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            count: officers.length,
            officers
        });

    } catch (error) {
        console.error('Get officers error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch officers',
            error: error.message 
        });
    }
});

// Get organization activities
router.get('/:id/activities', async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT oa.*, u.email as submitted_by_email, 
                   up.first_name as submitted_by_first_name, up.last_name as submitted_by_last_name
            FROM organization_activities oa
            JOIN users u ON oa.submitted_by = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            WHERE oa.org_id = ?
        `;
        const params = [req.params.id];

        if (status) {
            query += ' AND oa.status = ?';
            params.push(status);
        }

        query += ' ORDER BY oa.start_date DESC';

        const [activities] = await pool.query(query, params);

        res.json({
            success: true,
            count: activities.length,
            activities
        });

    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch activities',
            error: error.message 
        });
    }
});

// Submit activity proposal (Officer)
router.post('/:id/activities', auth, roleCheck('officer', 'cessca_staff', 'admin'), [
    body('activityTitle').notEmpty().trim(),
    body('activityType').isIn(['seminar', 'workshop', 'competition', 'social', 'fundraising', 'community_service', 'other']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Check if officer role - verify they are actually an officer of THIS organization
        if (req.user.role === 'officer') {
            const [officerCheck] = await pool.query(
                `SELECT officer_id FROM organization_officers 
                 WHERE org_id = ? AND user_id = ? AND status = 'active'`,
                [req.params.id, req.user.userId]
            );

            if (officerCheck.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not an officer of this organization' 
                });
            }
        }

        const { activityTitle, description, activityType, venue, startDate, endDate, targetParticipants, budget } = req.body;

        const [result] = await pool.query(
            `INSERT INTO organization_activities 
             (org_id, activity_title, description, activity_type, venue, start_date, end_date, target_participants, budget, submitted_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, activityTitle, description, activityType, venue, startDate, endDate, targetParticipants, budget, req.user.userId]
        );

        res.status(201).json({
            success: true,
            message: 'Activity proposal submitted successfully',
            activityId: result.insertId
        });

    } catch (error) {
        console.error('Submit activity error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit activity',
            error: error.message 
        });
    }
});

// Approve/Reject activity (CESSCA/Admin only)
router.put('/activities/:activityId/review', auth, roleCheck('cessca_staff', 'admin'), [
    body('status').isIn(['approved', 'rejected']),
    body('remarks').optional().trim()
], async (req, res) => {
    try {
        const { status, remarks } = req.body;

        await pool.query(
            `UPDATE organization_activities 
             SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_remarks = ?
             WHERE activity_id = ?`,
            [status, req.user.userId, remarks, req.params.activityId]
        );

        res.json({
            success: true,
            message: `Activity ${status} successfully`
        });

    } catch (error) {
        console.error('Review activity error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to review activity',
            error: error.message 
        });
    }
});

// Add officer to organization (CESSCA/Admin only)
router.post('/:id/officers', auth, roleCheck('cessca_staff', 'admin'), [
    body('userId').isInt(),
    body('position').notEmpty().trim(),
    body('termStart').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { userId, position, termStart, termEnd } = req.body;

        // Check if user exists and has officer role
        const [users] = await pool.query(
            'SELECT user_id, role FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (users[0].role !== 'officer') {
            return res.status(400).json({ 
                success: false, 
                message: 'User must have officer role to be appointed as an officer' 
            });
        }

        // Check if already an officer
        const [existing] = await pool.query(
            'SELECT officer_id FROM organization_officers WHERE org_id = ? AND user_id = ? AND status = "active"',
            [req.params.id, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User is already an active officer of this organization' 
            });
        }

        // Auto-create membership if user isn't already a member
        const [membership] = await pool.query(
            'SELECT member_id FROM organization_members WHERE org_id = ? AND user_id = ?',
            [req.params.id, userId]
        );

        if (membership.length === 0) {
            // User is not a member yet, create active membership automatically
            await pool.query(
                `INSERT INTO organization_members 
                 (org_id, user_id, membership_status, joined_date)
                 VALUES (?, ?, 'active', NOW())`,
                [req.params.id, userId]
            );
        } else if (membership.length > 0) {
            // User is already a member, ensure status is active
            await pool.query(
                `UPDATE organization_members 
                 SET membership_status = 'active', joined_date = COALESCE(joined_date, NOW())
                 WHERE org_id = ? AND user_id = ?`,
                [req.params.id, userId]
            );
        }

        const [result] = await pool.query(
            `INSERT INTO organization_officers 
             (org_id, user_id, position, term_start, term_end, status)
             VALUES (?, ?, ?, ?, ?, 'active')`,
            [req.params.id, userId, position, termStart, termEnd || null]
        );

        res.status(201).json({
            success: true,
            message: 'Officer added successfully',
            officerId: result.insertId
        });

    } catch (error) {
        console.error('Add officer error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add officer',
            error: error.message 
        });
    }
});

// Remove officer from organization (CESSCA/Admin only)
router.delete('/:id/officers/:officerId', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        await pool.query(
            'UPDATE organization_officers SET status = "ended", term_end = NOW() WHERE officer_id = ? AND org_id = ?',
            [req.params.officerId, req.params.id]
        );

        res.json({
            success: true,
            message: 'Officer removed successfully'
        });

    } catch (error) {
        console.error('Remove officer error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove officer',
            error: error.message 
        });
    }
});

// Get potential officers (users with officer role not yet assigned to this org)
router.get('/:id/potential-officers', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.user_id, u.email, up.first_name, up.last_name, up.student_id
             FROM users u
             JOIN user_profiles up ON u.user_id = up.user_id
             LEFT JOIN organization_officers oo ON u.user_id = oo.user_id 
                AND oo.org_id = ? AND oo.status = 'active'
             WHERE u.role = 'officer' AND u.status = 'active' AND oo.officer_id IS NULL
             ORDER BY up.last_name, up.first_name`,
            [req.params.id]
        );

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Get potential officers error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch potential officers',
            error: error.message 
        });
    }
});

module.exports = router;

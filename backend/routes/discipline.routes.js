const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Submit complaint or consultation request
router.post('/cases', auth, roleCheck('student', 'officer'), [
    body('caseType').isIn(['complaint', 'consultation', 'violation', 'counseling']),
    body('subject').notEmpty().trim(),
    body('description').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            caseType, subject, description, respondentId, isAnonymous,
            incidentDate, incidentLocation, severity
        } = req.body;

        // Generate case number
        const caseNumber = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [result] = await pool.query(
            `INSERT INTO discipline_cases 
             (case_number, case_type, complainant_id, respondent_id, is_anonymous, subject, 
              description, incident_date, incident_location, severity, status, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'medium')`,
            [caseNumber, caseType, isAnonymous ? null : req.user.userId, respondentId,
             isAnonymous || false, subject, description, incidentDate, incidentLocation, severity || 'moderate']
        );

        res.status(201).json({
            success: true,
            message: 'Case submitted successfully',
            caseId: result.insertId,
            caseNumber
        });

    } catch (error) {
        console.error('Submit case error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit case',
            error: error.message 
        });
    }
});

// Get cases (filtered by role)
router.get('/cases', auth, roleCheck('student', 'officer', 'cessca_staff', 'admin'), async (req, res) => {
    try {
        const { status, caseType, priority, date, page = 1, limit = 10 } = req.query;
        let query = `
            SELECT dc.*, 
                   c.email as complainant_email, cup.first_name as complainant_first_name, 
                   cup.last_name as complainant_last_name,
                   r.email as respondent_email, rup.first_name as respondent_first_name,
                   rup.last_name as respondent_last_name,
                   a.email as assigned_email, aup.first_name as assigned_first_name,
                   aup.last_name as assigned_last_name
            FROM discipline_cases dc
            LEFT JOIN users c ON dc.complainant_id = c.user_id
            LEFT JOIN user_profiles cup ON c.user_id = cup.user_id
            LEFT JOIN users r ON dc.respondent_id = r.user_id
            LEFT JOIN user_profiles rup ON r.user_id = rup.user_id
            LEFT JOIN users a ON dc.assigned_to = a.user_id
            LEFT JOIN user_profiles aup ON a.user_id = aup.user_id
            WHERE 1=1
        `;
        const params = [];

        // Role-based filtering
        if (req.user.role === 'student' || req.user.role === 'officer') {
            query += ' AND (dc.complainant_id = ? OR dc.respondent_id = ?)';
            params.push(req.user.userId, req.user.userId);
        } else if (req.user.role === 'cessca_staff') {
            query += ' AND (dc.assigned_to = ? OR dc.assigned_to IS NULL)';
            params.push(req.user.userId);
        }
        // Admin can see all

        if (status) {
            query += ' AND dc.status = ?';
            params.push(status);
        }
        if (caseType) {
            query += ' AND dc.case_type = ?';
            params.push(caseType);
        }
        if (priority) {
            query += ' AND dc.priority = ?';
            params.push(priority);
        }
        if (date) {
            query += ' AND DATE(dc.created_at) = ?';
            params.push(date);
        }

        query += ' ORDER BY dc.created_at DESC';

        // Pagination
        const lim = parseInt(limit, 10) || 10;
        const offset = ((parseInt(page, 10) || 1) - 1) * lim;
        query += ' LIMIT ? OFFSET ?';
        params.push(lim, offset);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM discipline_cases dc WHERE 1=1';
        let countParams = [];
        if (req.user.role === 'student' || req.user.role === 'officer') {
            countQuery += ' AND (dc.complainant_id = ? OR dc.respondent_id = ?)';
            countParams.push(req.user.userId, req.user.userId);
        } else if (req.user.role === 'cessca_staff') {
            countQuery += ' AND (dc.assigned_to = ? OR dc.assigned_to IS NULL)';
            countParams.push(req.user.userId);
        }
        if (status) {
            countQuery += ' AND dc.status = ?';
            countParams.push(status);
        }
        if (caseType) {
            countQuery += ' AND dc.case_type = ?';
            countParams.push(caseType);
        }
        if (priority) {
            countQuery += ' AND dc.priority = ?';
            countParams.push(priority);
        }
        if (date) {
            countQuery += ' AND DATE(dc.created_at) = ?';
            countParams.push(date);
        }

        const [[{ total }]] = await pool.query(countQuery, countParams);
        const [cases] = await pool.query(query, params);

        // Hide sensitive info for students
        if (req.user.role === 'student' || req.user.role === 'officer') {
            cases.forEach(c => {
                if (c.is_anonymous && c.complainant_id !== req.user.userId) {
                    delete c.complainant_email;
                    delete c.complainant_first_name;
                    delete c.complainant_last_name;
                }
            });
        }

        res.json({
            success: true,
            count: total,
            cases
        });

    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch cases',
            error: error.message 
        });
    }
});

// Get case by ID
router.get('/cases/:id', auth, roleCheck('student', 'officer', 'cessca_staff', 'admin'), async (req, res) => {
    try {
        const [cases] = await pool.query(
            `SELECT dc.*, 
                    c.email as complainant_email, cup.first_name as complainant_first_name, 
                    cup.last_name as complainant_last_name,
                    r.email as respondent_email, rup.first_name as respondent_first_name,
                    rup.last_name as respondent_last_name,
                    a.email as assigned_email, aup.first_name as assigned_first_name,
                    aup.last_name as assigned_last_name
             FROM discipline_cases dc
             LEFT JOIN users c ON dc.complainant_id = c.user_id
             LEFT JOIN user_profiles cup ON c.user_id = cup.user_id
             LEFT JOIN users r ON dc.respondent_id = r.user_id
             LEFT JOIN user_profiles rup ON r.user_id = rup.user_id
             LEFT JOIN users a ON dc.assigned_to = a.user_id
             LEFT JOIN user_profiles aup ON a.user_id = aup.user_id
             WHERE dc.case_id = ?`,
            [req.params.id]
        );

        if (cases.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Case not found' 
            });
        }

        const caseData = cases[0];

        // Check access permissions
        if (req.user.role === 'student' || req.user.role === 'officer') {
            if (caseData.complainant_id !== req.user.userId && 
                caseData.respondent_id !== req.user.userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        // Get case updates
        const [updates] = await pool.query(
            `SELECT cu.*, u.email, up.first_name, up.last_name
             FROM case_updates cu
             JOIN users u ON cu.updated_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE cu.case_id = ?
             ORDER BY cu.created_at ASC`,
            [req.params.id]
        );

        res.json({
            success: true,
            case: {
                ...caseData,
                updates
            }
        });

    } catch (error) {
        console.error('Get case error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch case',
            error: error.message 
        });
    }
});

// Update case status (CESSCA/Admin only)
router.put('/cases/:id/status', auth, roleCheck('cessca_staff', 'admin'), [
    body('status').isIn(['pending', 'ongoing', 'resolved', 'closed', 'escalated']),
    body('updateContent').notEmpty().trim()
], async (req, res) => {
    try {
        const { status, updateContent } = req.body;

        // Get current status
        const [cases] = await pool.query(
            'SELECT status FROM discipline_cases WHERE case_id = ?',
            [req.params.id]
        );

        if (cases.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Case not found' 
            });
        }

        const previousStatus = cases[0].status;

        // Update case
        await pool.query(
            `UPDATE discipline_cases 
             SET status = ?, resolved_at = ?
             WHERE case_id = ?`,
            [status, (status === 'resolved' || status === 'closed') ? new Date() : null, req.params.id]
        );

        // Add update record
        await pool.query(
            `INSERT INTO case_updates 
             (case_id, updated_by, update_type, update_content, previous_status, new_status)
             VALUES (?, ?, 'status_change', ?, ?, ?)`,
            [req.params.id, req.user.userId, updateContent, previousStatus, status]
        );

        res.json({
            success: true,
            message: 'Case status updated successfully'
        });

    } catch (error) {
        console.error('Update case status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update case status',
            error: error.message 
        });
    }
});

// Assign case (CESSCA/Admin only)
router.put('/cases/:id/assign', auth, roleCheck('cessca_staff', 'admin'), [
    body('assignedTo').isInt()
], async (req, res) => {
    try {
        const { assignedTo } = req.body;

        await pool.query(
            'UPDATE discipline_cases SET assigned_to = ?, assigned_at = NOW() WHERE case_id = ?',
            [assignedTo, req.params.id]
        );

        await pool.query(
            `INSERT INTO case_updates 
             (case_id, updated_by, update_type, update_content)
             VALUES (?, ?, 'action', 'Case assigned to counselor')`,
            [req.params.id, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Case assigned successfully'
        });

    } catch (error) {
        console.error('Assign case error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to assign case',
            error: error.message 
        });
    }
});

// Delete own pending case (Student/Officer only)
router.delete('/cases/:id', auth, roleCheck('student', 'officer'), async (req, res) => {
    try {
        const [cases] = await pool.query(
            'SELECT case_id, complainant_id, is_anonymous, status FROM discipline_cases WHERE case_id = ?',
            [req.params.id]
        );

        if (cases.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Case not found'
            });
        }

        const caseData = cases[0];

        if (caseData.complainant_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: caseData.is_anonymous
                    ? 'Anonymous cases cannot be deleted by user ownership check'
                    : 'You can only delete your own submitted case'
            });
        }

        if (caseData.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending cases can be deleted'
            });
        }

        await pool.query('DELETE FROM discipline_cases WHERE case_id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Case deleted successfully'
        });
    } catch (error) {
        console.error('Delete case error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete case',
            error: error.message
        });
    }
});

// Add case update/note
router.post('/cases/:id/updates', auth, roleCheck('student', 'officer', 'cessca_staff', 'admin'), [
    body('updateType').isIn(['note', 'action', 'status_change', 'resolution']),
    body('updateContent').notEmpty().trim()
], async (req, res) => {
    try {
        const { updateType, updateContent } = req.body;

        // Check permissions
        const [cases] = await pool.query(
            'SELECT assigned_to, complainant_id, respondent_id FROM discipline_cases WHERE case_id = ?',
            [req.params.id]
        );

        if (cases.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Case not found' 
            });
        }

        const caseData = cases[0];
        const isAuthorized = req.user.role === 'admin' || 
                            req.user.role === 'cessca_staff' ||
                            caseData.complainant_id === req.user.userId ||
                            caseData.respondent_id === req.user.userId;

        if (!isAuthorized) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied' 
            });
        }

        await pool.query(
            `INSERT INTO case_updates (case_id, updated_by, update_type, update_content)
             VALUES (?, ?, ?, ?)`,
            [req.params.id, req.user.userId, updateType, updateContent]
        );

        res.status(201).json({
            success: true,
            message: 'Update added successfully'
        });

    } catch (error) {
        console.error('Add case update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add update',
            error: error.message 
        });
    }
});

// Schedule consultation
router.post('/consultations', auth, roleCheck('cessca_staff', 'admin'), [
    body('caseId').isInt(),
    body('studentId').isInt(),
    body('scheduledDate').isISO8601(),
    body('location').notEmpty().trim()
], async (req, res) => {
    try {
        const { caseId, studentId, scheduledDate, durationMinutes, location, notes } = req.body;

        const [result] = await pool.query(
            `INSERT INTO consultation_schedules 
             (case_id, student_id, counselor_id, scheduled_date, duration_minutes, location, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [caseId, studentId, req.user.userId, scheduledDate, durationMinutes || 60, location, notes]
        );

        res.status(201).json({
            success: true,
            message: 'Consultation scheduled successfully',
            scheduleId: result.insertId
        });

    } catch (error) {
        console.error('Schedule consultation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to schedule consultation',
            error: error.message 
        });
    }
});

// Get consultation schedules
router.get('/consultations', auth, roleCheck('student', 'officer', 'cessca_staff', 'admin'), async (req, res) => {
    try {
        let query = `
            SELECT cs.*, 
                   dc.case_number, dc.subject,
                   s.email as student_email, sup.first_name as student_first_name, 
                   sup.last_name as student_last_name,
                   c.email as counselor_email, cup.first_name as counselor_first_name,
                   cup.last_name as counselor_last_name
            FROM consultation_schedules cs
            JOIN discipline_cases dc ON cs.case_id = dc.case_id
            JOIN users s ON cs.student_id = s.user_id
            JOIN user_profiles sup ON s.user_id = sup.user_id
            JOIN users c ON cs.counselor_id = c.user_id
            JOIN user_profiles cup ON c.user_id = cup.user_id
            WHERE 1=1
        `;
        const params = [];

        // Role-based filtering
        if (req.user.role === 'student') {
            query += ' AND cs.student_id = ?';
            params.push(req.user.userId);
        } else if (req.user.role === 'cessca_staff') {
            query += ' AND cs.counselor_id = ?';
            params.push(req.user.userId);
        }

        query += ' ORDER BY cs.scheduled_date DESC';

        const [schedules] = await pool.query(query, params);

        res.json({
            success: true,
            count: schedules.length,
            schedules
        });

    } catch (error) {
        console.error('Get consultations error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch consultations',
            error: error.message 
        });
    }
});

module.exports = router;

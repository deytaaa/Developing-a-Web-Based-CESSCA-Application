const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/help-desk';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ticket-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX, TXT allowed.'));
    }
});

// Generate unique ticket number
function generateTicketNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
}

// STUDENT ENDPOINTS

// Get user's tickets
router.get('/my-tickets', auth, async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT t.*, 
                   CONCAT(up_assigned.first_name, ' ', up_assigned.last_name) as assigned_name,
                   (SELECT COUNT(*) FROM help_desk_responses WHERE ticket_id = t.ticket_id) as response_count,
                   (SELECT COUNT(*) FROM help_desk_responses WHERE ticket_id = t.ticket_id AND is_staff_response = true) as staff_response_count
            FROM help_desk_tickets t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.user_id
            LEFT JOIN user_profiles up_assigned ON u_assigned.user_id = up_assigned.user_id
            WHERE t.user_id = ?
        `;
        const params = [req.user.userId];

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (category) {
            query += ' AND t.category = ?';
            params.push(category);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [tickets] = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM help_desk_tickets WHERE user_id = ?';
        const countParams = [req.user.userId];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
    }
});

// Submit new ticket (students only)
router.post('/', auth, roleCheck('student'), async (req, res) => {
    try {
        const { subject, category, priority = 'normal', description } = req.body;

        if (!subject || !category || !description) {
            return res.status(400).json({ success: false, message: 'Subject, category, and description are required' });
        }

        const ticketNumber = generateTicketNumber();

        const [result] = await pool.query(
            `INSERT INTO help_desk_tickets (ticket_number, user_id, subject, category, priority, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ticketNumber, req.user.userId, subject, category, priority, description]
        );

        res.status(201).json({
            success: true,
            message: 'Ticket submitted successfully',
            ticketId: result.insertId,
            ticketNumber
        });
    } catch (error) {
        console.error('Error submitting ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to submit ticket', error: error.message });
    }
});

// Upload attachment to ticket
router.post('/:id/attachments', auth, upload.single('file'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { responseId } = req.body;

        // Verify ownership or staff
        const [ticket] = await pool.query('SELECT user_id FROM help_desk_tickets WHERE ticket_id = ?', [ticketId]);
        if (ticket.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        if (ticket[0].user_id !== req.user.userId && !['cessca_staff', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = `/uploads/help-desk/${req.file.filename}`;
        await pool.query(
            `INSERT INTO help_desk_attachments (ticket_id, response_id, file_name, file_path, file_type, file_size, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ticketId, responseId || null, req.file.originalname, filePath, req.file.mimetype, req.file.size, req.user.userId]
        );

        res.status(201).json({
            success: true,
            message: 'Attachment uploaded successfully',
            file: {
                name: req.file.originalname,
                path: filePath,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Error uploading attachment:', error);
        res.status(500).json({ success: false, message: 'Failed to upload attachment', error: error.message });
    }
});

// STAFF ENDPOINTS - Statistics (must be before /:id route)

// Get dashboard statistics (staff only)
router.get('/statistics/dashboard', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_tickets,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN status = 'waiting_response' THEN 1 ELSE 0 END) as waiting_response_count,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
                SUM(CASE WHEN assigned_to IS NULL AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as unassigned_count,
                SUM(CASE WHEN priority = 'urgent' AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as urgent_count,
                AVG(CASE WHEN satisfaction_rating IS NOT NULL THEN satisfaction_rating ELSE NULL END) as avg_rating
            FROM help_desk_tickets
        `);

        const [categoryDistribution] = await pool.query(`
            SELECT category, COUNT(*) as count
            FROM help_desk_tickets
            WHERE status NOT IN ('resolved', 'closed')
            GROUP BY category
        `);

        const [recentTickets] = await pool.query(`
            SELECT t.ticket_id, t.ticket_number, t.subject, t.status, t.priority, t.category, t.created_at,
                   up.first_name, up.last_name, up.student_id
            FROM help_desk_tickets t
            JOIN users u ON t.user_id = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            WHERE t.status NOT IN ('resolved', 'closed')
            ORDER BY t.priority DESC, t.created_at DESC
            LIMIT 10
        `);

        const [myAssignedCount] = await pool.query(`
            SELECT COUNT(*) as count
            FROM help_desk_tickets
            WHERE assigned_to = ? AND status NOT IN ('resolved', 'closed')
        `, [req.user.userId]);

        res.json({
            success: true,
            statistics: {...stats[0], my_assigned_count: myAssignedCount[0].count},
            categoryDistribution,
            recentTickets
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
});

// Get ticket details
router.get('/:id', auth, async (req, res) => {
    try {
        const ticketId = req.params.id;

        const [tickets] = await pool.query(
            `SELECT t.*, 
                    CONCAT(up_requester.first_name, ' ', up_requester.last_name) as student_name,
                    up_requester.student_id,
                    up_requester.course,
                    u_requester.email as requester_email,
                    CONCAT(up_assigned.first_name, ' ', up_assigned.last_name) as assigned_name
             FROM help_desk_tickets t
             JOIN users u_requester ON t.user_id = u_requester.user_id
             JOIN user_profiles up_requester ON u_requester.user_id = up_requester.user_id
             LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.user_id
             LEFT JOIN user_profiles up_assigned ON u_assigned.user_id = up_assigned.user_id
             WHERE t.ticket_id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Check authorization
        if (ticket.user_id !== req.user.userId && !['cessca_staff', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Get responses (exclude internal notes for students)
        let responseQuery = `
            SELECT r.*, 
                   CONCAT(up.first_name, ' ', up.last_name) as responder_name, 
                   u.role
            FROM help_desk_responses r
            JOIN users u ON r.user_id = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            WHERE r.ticket_id = ?
        `;
        
        if (!['cessca_staff', 'admin'].includes(req.user.role)) {
            responseQuery += ' AND r.is_internal_note = false';
        }
        
        responseQuery += ' ORDER BY r.created_at ASC';
        
        const [responses] = await pool.query(responseQuery, [ticketId]);

        // Get attachments
        const [attachments] = await pool.query(
            `SELECT a.*, up.first_name, up.last_name
             FROM help_desk_attachments a
             JOIN users u ON a.uploaded_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE a.ticket_id = ?`,
            [ticketId]
        );

        res.json({
            success: true,
            ticket,
            responses,
            attachments
        });
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch ticket details', error: error.message });
    }
});

// Add response to ticket
router.post('/:id/responses', auth, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Verify access
        const [ticket] = await pool.query('SELECT user_id, status FROM help_desk_tickets WHERE ticket_id = ?', [ticketId]);
        if (ticket.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket[0].user_id !== req.user.userId && !['cessca_staff', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const isStaffResponse = ['cessca_staff', 'admin'].includes(req.user.role);

        const [result] = await pool.query(
            `INSERT INTO help_desk_responses (ticket_id, user_id, message, is_staff_response)
             VALUES (?, ?, ?, ?)`,
            [ticketId, req.user.userId, message, isStaffResponse]
        );

        // Update ticket status and first_response_at if this is the first staff response
        if (isStaffResponse && ticket[0].status === 'open') {
            await pool.query(
                `UPDATE help_desk_tickets 
                 SET status = 'in_progress', 
                     first_response_at = COALESCE(first_response_at, NOW()),
                     updated_at = NOW()
                 WHERE ticket_id = ?`,
                [ticketId]
            );
        } else {
            await pool.query(
                'UPDATE help_desk_tickets SET updated_at = NOW() WHERE ticket_id = ?',
                [ticketId]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Response added successfully',
            responseId: result.insertId
        });
    } catch (error) {
        console.error('Error adding response:', error);
        res.status(500).json({ success: false, message: 'Failed to add response', error: error.message });
    }
});

// Close ticket (student only)
router.put('/:id/close', auth, async (req, res) => {
    try {
        const ticketId = req.params.id;

        const [tickets] = await pool.query(
            'SELECT user_id, status FROM help_desk_tickets WHERE ticket_id = ?',
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check ownership
        if (tickets[0].user_id !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await pool.query(
            'UPDATE help_desk_tickets SET status = ?, closed_at = NOW(), updated_at = NOW() WHERE ticket_id = ?',
            ['closed', ticketId]
        );

        res.json({ success: true, message: 'Ticket closed successfully' });
    } catch (error) {
        console.error('Error closing ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to close ticket', error: error.message });
    }
});

// Rate ticket (student only)
router.post('/:id/rate', auth, roleCheck('student'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const [tickets] = await pool.query(
            'SELECT user_id, status FROM help_desk_tickets WHERE ticket_id = ?',
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check ownership
        if (tickets[0].user_id !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Can only rate resolved or closed tickets
        if (!['resolved', 'closed'].includes(tickets[0].status)) {
            return res.status(400).json({ success: false, message: 'Can only rate resolved or closed tickets' });
        }

        await pool.query(
            'UPDATE help_desk_tickets SET satisfaction_rating = ?, satisfaction_feedback = ?, updated_at = NOW() WHERE ticket_id = ?',
            [rating, feedback || null, ticketId]
        );

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Error rating ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to submit rating', error: error.message });
    }
});

// STAFF ENDPOINTS

// Get all tickets (staff only)
router.get('/', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const { status, category, priority, assigned, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT t.*, 
                   CONCAT(up_requester.first_name, ' ', up_requester.last_name) as student_name,
                   up_requester.student_id,
                   CONCAT(up_assigned.first_name, ' ', up_assigned.last_name) as assigned_name,
                   (SELECT COUNT(*) FROM help_desk_responses WHERE ticket_id = t.ticket_id) as response_count
            FROM help_desk_tickets t
            JOIN users u_requester ON t.user_id = u_requester.user_id
            JOIN user_profiles up_requester ON u_requester.user_id = up_requester.user_id
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.user_id
            LEFT JOIN user_profiles up_assigned ON u_assigned.user_id = up_assigned.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (category) {
            query += ' AND t.category = ?';
            params.push(category);
        }

        if (priority) {
            query += ' AND t.priority = ?';
            params.push(priority);
        }

        if (assigned === 'me') {
            query += ' AND t.assigned_to = ?';
            params.push(req.user.userId);
        } else if (assigned === 'unassigned') {
            query += ' AND t.assigned_to IS NULL';
        }

        if (search) {
            query += ' AND (t.ticket_number LIKE ? OR t.subject LIKE ? OR up_requester.first_name LIKE ? OR up_requester.last_name LIKE ? OR up_requester.student_id LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY t.priority DESC, t.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [tickets] = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM help_desk_tickets t WHERE 1=1';
        const countParams = [];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        if (priority) {
            countQuery += ' AND priority = ?';
            countParams.push(priority);
        }
        if (assigned === 'me') {
            countQuery += ' AND assigned_to = ?';
            countParams.push(req.user.userId);
        } else if (assigned === 'unassigned') {
            countQuery += ' AND assigned_to IS NULL';
        }
        
        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
    }
});

// Assign ticket (staff only)
router.put('/:id/assign', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { assignedTo } = req.body;

        await pool.query(
            'UPDATE help_desk_tickets SET assigned_to = ?, updated_at = NOW() WHERE ticket_id = ?',
            [assignedTo || null, ticketId]
        );

        res.json({ success: true, message: 'Ticket assigned successfully' });
    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to assign ticket', error: error.message });
    }
});

// Update ticket status (staff only)
router.put('/:id/status', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;

        const updates = { status };

        if (status === 'resolved') {
            updates.resolved_at = new Date();
        }

        if (status === 'closed') {
            updates.closed_at = new Date();
        }

        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), ticketId];

        await pool.query(
            `UPDATE help_desk_tickets SET ${setClause}, updated_at = NOW() WHERE ticket_id = ?`,
            values
        );

        res.json({ success: true, message: 'Ticket status updated successfully' });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ success: false, message: 'Failed to update ticket status', error: error.message });
    }
});

// Add internal note (staff only)
router.post('/:id/internal-note', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        await pool.query(
            `INSERT INTO help_desk_responses (ticket_id, user_id, message, is_staff_response, is_internal_note)
             VALUES (?, ?, ?, true, true)`,
            [ticketId, req.user.userId, message]
        );

        await pool.query('UPDATE help_desk_tickets SET updated_at = NOW() WHERE ticket_id = ?', [ticketId]);

        res.status(201).json({ success: true, message: 'Internal note added successfully' });
    } catch (error) {
        console.error('Error adding internal note:', error);
        res.status(500).json({ success: false, message: 'Failed to add internal note', error: error.message });
    }
});

// Get available staff for assignment
router.get('/staff/available', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const [staff] = await pool.query(`
            SELECT u.user_id, 
                   CONCAT(up.first_name, ' ', up.last_name) as full_name,
                   up.first_name, 
                   up.last_name,
                   (SELECT COUNT(*) FROM help_desk_tickets WHERE assigned_to = u.user_id AND status NOT IN ('resolved', 'closed')) as assigned_tickets_count
            FROM users u
            JOIN user_profiles up ON u.user_id = up.user_id
            WHERE u.role IN ('cessca_staff', 'admin') AND u.status = 'active'
            ORDER BY assigned_tickets_count ASC, up.first_name ASC
        `);

        res.json({ success: true, staff });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff', error: error.message });
    }
});

module.exports = router;

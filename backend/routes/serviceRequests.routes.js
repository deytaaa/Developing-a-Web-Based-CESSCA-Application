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
        const uploadDir = 'uploads/service-requests';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'request-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX allowed.'));
    }
});

// Helper function to log actions
async function logAction(requestId, action, performedBy, previousStatus, newStatus, remarks) {
    try {
        await pool.query(
            `INSERT INTO service_request_logs (request_id, action, performed_by, previous_status, new_status, remarks)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [requestId, action, performedBy, previousStatus, newStatus, remarks]
        );
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

// STUDENT ENDPOINTS

// Get user's service requests
router.get('/my-requests', auth, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT sr.*, 
                   CONCAT(up_student.first_name, ' ', up_student.last_name) as student_name,
                   CONCAT(up_processor.first_name, ' ', up_processor.last_name) as processed_by_name,
                   (SELECT COUNT(*) FROM service_request_attachments WHERE request_id = sr.request_id) as attachment_count
            FROM service_requests sr
            LEFT JOIN users u_student ON sr.user_id = u_student.user_id
            LEFT JOIN user_profiles up_student ON u_student.user_id = up_student.user_id
            LEFT JOIN users u_processor ON sr.processed_by = u_processor.user_id
            LEFT JOIN user_profiles up_processor ON u_processor.user_id = up_processor.user_id
            WHERE sr.user_id = ?
        `;
        const params = [req.user.userId];

        if (status) {
            query += ' AND sr.status = ?';
            params.push(status);
        }

        if (type) {
            query += ' AND sr.request_type = ?';
            params.push(type);
        }

        query += ' ORDER BY sr.requested_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [requests] = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM service_requests WHERE user_id = ?';
        const countParams = [req.user.userId];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (type) {
            countQuery += ' AND request_type = ?';
            countParams.push(type);
        }
        const [countResult] = await pool.query(countQuery, countParams);

        // Get statistics
        const [statsResult] = await pool.query(
            `SELECT 
                COUNT(*) as total_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
            FROM service_requests 
            WHERE user_id = ?`,
            [req.user.userId]
        );

        res.json({
            success: true,
            requests,
            statistics: statsResult[0],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
    }
});

// Submit new service request (students only)
router.post('/', auth, roleCheck('student'), async (req, res) => {
    try {
        const {
            request_type,
            request_description,
            purpose,
            priority = 'normal'
        } = req.body;

        console.log('New request submission:', { request_type, purpose, userId: req.user.userId });

        if (!request_type || !purpose) {
            return res.status(400).json({ success: false, message: 'Request type and purpose are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO service_requests (user_id, request_type, request_description, purpose, priority)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, request_type, request_description, purpose, priority]
        );

        console.log('Request created with ID:', result.insertId);

        // Log the action
        await logAction(result.insertId, 'Request Submitted', req.user.userId, null, 'pending', 'New request submitted by student');

        const response = {
            success: true,
            message: 'Service request submitted successfully',
            request: {
                request_id: result.insertId
            }
        };
        
        console.log('Sending response:', response);
        res.status(201).json(response);
    } catch (error) {
        console.error('Error submitting service request:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request', error: error.message });
    }
});

// Upload attachment to request
router.post('/:id/attachments', auth, upload.single('file'), async (req, res) => {
    try {
        const requestId = req.params.id;
        
        console.log('Upload request received for request ID:', requestId);
        console.log('File:', req.file);

        // Verify ownership
        const [request] = await pool.query('SELECT user_id FROM service_requests WHERE request_id = ?', [requestId]);
        if (request.length === 0) {
            console.log('Request not found:', requestId);
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (request[0].user_id !== req.user.userId && !['cessca_staff', 'admin'].includes(req.user.role)) {
            console.log('Not authorized:', req.user.userId, 'vs', request[0].user_id);
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = `/uploads/service-requests/${req.file.filename}`;
        console.log('Inserting attachment:', { requestId, fileName: req.file.originalname, filePath });
        
        await pool.query(
            `INSERT INTO service_request_attachments (request_id, file_name, file_path, file_type, file_size)
             VALUES (?, ?, ?, ?, ?)`,
            [requestId, req.file.originalname, filePath, req.file.mimetype, req.file.size]
        );

        console.log('Attachment saved successfully');
        
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
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN priority = 'urgent' AND status IN ('pending', 'processing') THEN 1 ELSE 0 END) as urgent_count
            FROM service_requests
            WHERE status != 'cancelled'
        `);

        const [typeDistribution] = await pool.query(`
            SELECT request_type, COUNT(*) as count
            FROM service_requests
            WHERE status != 'cancelled'
            GROUP BY request_type
        `);

        const [recentRequests] = await pool.query(`
            SELECT sr.request_id, sr.request_type, sr.status, sr.priority, sr.requested_date,
                   up.first_name, up.last_name, up.student_id
            FROM service_requests sr
            JOIN users u ON sr.user_id = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            WHERE sr.status IN ('pending', 'processing')
            ORDER BY sr.priority DESC, sr.requested_date DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            statistics: stats[0],
            typeDistribution,
            recentRequests
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
});

// Get all service requests (staff only)
router.get('/', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const { status, type, priority, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT sr.*, 
                   CONCAT(up_requester.first_name, ' ', up_requester.last_name) as student_name,
                   up_requester.student_id,
                   CONCAT(up_processor.first_name, ' ', up_processor.last_name) as processed_by_name
            FROM service_requests sr
            JOIN users u_requester ON sr.user_id = u_requester.user_id
            JOIN user_profiles up_requester ON u_requester.user_id = up_requester.user_id
            LEFT JOIN users u_processor ON sr.processed_by = u_processor.user_id
            LEFT JOIN user_profiles up_processor ON u_processor.user_id = up_processor.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND sr.status = ?';
            params.push(status);
        }

        if (type) {
            query += ' AND sr.request_type = ?';
            params.push(type);
        }

        if (priority) {
            query += ' AND sr.priority = ?';
            params.push(priority);
        }

        if (search) {
            query += ' AND (up_requester.first_name LIKE ? OR up_requester.last_name LIKE ? OR up_requester.student_id LIKE ? OR sr.purpose LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY sr.priority DESC, sr.requested_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        console.log('Staff query:', query);
        console.log('Staff params:', params);

        const [requests] = await pool.query(query, params);

        console.log('Staff requests found:', requests.length);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM service_requests sr WHERE 1=1';
        const countParams = [];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (type) {
            countQuery += ' AND request_type = ?';
            countParams.push(type);
        }
        if (priority) {
            countQuery += ' AND priority = ?';
            countParams.push(priority);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
    }
});

// Get request details
router.get('/:id', auth, async (req, res) => {
    try {
        const requestId = req.params.id;

        const [requests] = await pool.query(
            `SELECT sr.*, 
                    CONCAT(up_requester.first_name, ' ', up_requester.last_name) as student_name,
                    up_requester.student_id,
                    up_requester.course,
                    CONCAT(up_processor.first_name, ' ', up_processor.last_name) as processed_by_name
             FROM service_requests sr
             JOIN users u_requester ON sr.user_id = u_requester.user_id
             JOIN user_profiles up_requester ON u_requester.user_id = up_requester.user_id
             LEFT JOIN users u_processor ON sr.processed_by = u_processor.user_id
             LEFT JOIN user_profiles up_processor ON u_processor.user_id = up_processor.user_id
             WHERE sr.request_id = ?`,
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const request = requests[0];

        // Check authorization
        if (request.user_id !== req.user.userId && !['cessca_staff', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Get attachments
        const [attachments] = await pool.query(
            'SELECT * FROM service_request_attachments WHERE request_id = ?',
            [requestId]
        );

        // Get logs
        const [logs] = await pool.query(
            `SELECT srl.*, up.first_name, up.last_name
             FROM service_request_logs srl
             JOIN users u ON srl.performed_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE srl.request_id = ?
             ORDER BY srl.created_at DESC`,
            [requestId]
        );

        res.json({
            success: true,
            request,
            attachments,
            logs
        });
    } catch (error) {
        console.error('Error fetching request details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch request details', error: error.message });
    }
});

// Cancel request (student only, if status is pending)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const requestId = req.params.id;

        const [requests] = await pool.query(
            'SELECT user_id, status FROM service_requests WHERE request_id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const request = requests[0];

        // Check ownership
        if (request.user_id !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Can only cancel if pending
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Can only cancel pending requests' });
        }

        await pool.query(
            'UPDATE service_requests SET status = ?, updated_at = NOW() WHERE request_id = ?',
            ['cancelled', requestId]
        );

        await logAction(requestId, 'Request Cancelled', req.user.userId, request.status, 'cancelled', 'Request cancelled by student');

        res.json({ success: true, message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel request', error: error.message });
    }
});

// Update request status (staff only)
router.put('/:id/status', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status, notes, estimated_completion, pickup_location, rejection_reason } = req.body;

        const [requests] = await pool.query('SELECT status FROM service_requests WHERE request_id = ?', [requestId]);
        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const previousStatus = requests[0].status;
        const updateData = { status };

        if (status === 'processing') {
            updateData.processed_by = req.user.userId;
            updateData.processed_date = new Date();
        }

        if (status === 'approved' && estimated_completion) {
            updateData.estimated_completion = estimated_completion;
        }

        if (status === 'completed') {
            updateData.completion_date = new Date();
            if (pickup_location) updateData.pickup_location = pickup_location;
        }

        if (status === 'rejected' && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        }

        if (notes) {
            updateData.notes = notes;
        }

        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), requestId];

        await pool.query(
            `UPDATE service_requests SET ${setClause}, updated_at = NOW() WHERE request_id = ?`,
            values
        );

        await logAction(requestId, 'Status Updated', req.user.userId, previousStatus, status, notes || `Status changed from ${previousStatus} to ${status}`);

        res.json({ success: true, message: 'Request status updated successfully' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ success: false, message: 'Failed to update request status', error: error.message });
    }
});

// Delete attachment (staff only)
router.delete('/:id/attachments/:attachmentId', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const { attachmentId } = req.params;

        const [attachments] = await pool.query(
            'SELECT file_path FROM service_request_attachments WHERE attachment_id = ?',
            [attachmentId]
        );

        if (attachments.length === 0) {
            return res.status(404).json({ success: false, message: 'Attachment not found' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', attachments[0].file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await pool.query('DELETE FROM service_request_attachments WHERE attachment_id = ?', [attachmentId]);

        res.json({ success: true, message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete attachment', error: error.message });
    }
});

module.exports = router;

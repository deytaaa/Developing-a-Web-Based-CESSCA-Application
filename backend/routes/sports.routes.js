const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Get all sports events
router.get('/events', async (req, res) => {
    try {
        const { status, eventType, year } = req.query;
        
        let query = `
            SELECT se.*, u.email as created_by_email,
                   up.first_name as created_by_first_name, up.last_name as created_by_last_name,
                   COUNT(DISTINCT ep.participant_id) as participant_count
            FROM sports_events se
            JOIN users u ON se.created_by = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            LEFT JOIN event_participants ep ON se.event_id = ep.event_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND se.status = ?';
            params.push(status);
        }
        if (eventType) {
            query += ' AND se.event_type = ?';
            params.push(eventType);
        }
        if (year) {
            query += ' AND YEAR(se.event_date) = ?';
            params.push(year);
        }

        query += ' GROUP BY se.event_id ORDER BY se.event_date DESC';

        const [events] = await pool.query(query, params);

        res.json({
            success: true,
            count: events.length,
            events
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch events',
            error: error.message 
        });
    }
});

// Get event by ID
router.get('/events/:id', async (req, res) => {
    try {
        const [events] = await pool.query(
            `SELECT se.*, u.email as created_by_email,
                    up.first_name as created_by_first_name, up.last_name as created_by_last_name
             FROM sports_events se
             JOIN users u ON se.created_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE se.event_id = ?`,
            [req.params.id]
        );

        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        // Get participants
        const [participants] = await pool.query(
            `SELECT ep.*, u.email, up.first_name, up.last_name, up.student_id,
                    up.course, up.profile_picture
             FROM event_participants ep
             JOIN users u ON ep.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE ep.event_id = ?`,
            [req.params.id]
        );

        // Get results
        const [results] = await pool.query(
            `SELECT cr.*, ep.user_id, u.email, up.first_name, up.last_name
             FROM competition_results cr
             JOIN event_participants ep ON cr.participant_id = ep.participant_id
             JOIN users u ON ep.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE cr.event_id = ?
             ORDER BY cr.rank_position ASC`,
            [req.params.id]
        );

        res.json({
            success: true,
            event: {
                ...events[0],
                participants,
                results
            }
        });

    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch event',
            error: error.message 
        });
    }
});

// Create event (CESSCA/Admin only)
router.post('/events', auth, roleCheck('cessca_staff', 'admin'), [
    body('eventName').notEmpty().trim(),
    body('eventType').isIn(['sports', 'cultural', 'arts', 'competition', 'exhibition', 'workshop']),
    body('eventDate').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            eventName, eventType, description, venue, eventDate,
            startTime, endTime, organizer, targetParticipants
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO sports_events 
             (event_name, event_type, description, venue, event_date, start_time, 
              end_time, organizer, target_participants, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventName, eventType, description, venue, eventDate, startTime,
             endTime, organizer, targetParticipants, req.user.userId]
        );

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            eventId: result.insertId
        });

    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create event',
            error: error.message 
        });
    }
});

// Update event
router.put('/events/:id', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const {
            eventName, eventType, description, venue, eventDate,
            startTime, endTime, status, organizer, targetParticipants
        } = req.body;

        await pool.query(
            `UPDATE sports_events 
             SET event_name = ?, event_type = ?, description = ?, venue = ?,
                 event_date = ?, start_time = ?, end_time = ?, status = ?,
                 organizer = ?, target_participants = ?
             WHERE event_id = ?`,
            [eventName, eventType, description, venue, eventDate, startTime,
             endTime, status, organizer, targetParticipants, req.params.id]
        );

        res.json({
            success: true,
            message: 'Event updated successfully'
        });

    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update event',
            error: error.message 
        });
    }
});

// Register for event
router.post('/events/:id/register', auth, roleCheck('student', 'officer'), async (req, res) => {
    try {
        const { teamName, participationType } = req.body;

        // Check if already registered
        const [existing] = await pool.query(
            'SELECT participant_id FROM event_participants WHERE event_id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already registered for this event' 
            });
        }

        const [result] = await pool.query(
            `INSERT INTO event_participants (event_id, user_id, team_name, participation_type)
             VALUES (?, ?, ?, ?)`,
            [req.params.id, req.user.userId, teamName, participationType || 'individual']
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            participantId: result.insertId
        });

    } catch (error) {
        console.error('Register event error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to register for event',
            error: error.message 
        });
    }
});

// Add competition results (CESSCA/Admin only)
router.post('/events/:id/results', auth, roleCheck('cessca_staff', 'admin'), [
    body('participantId').isInt(),
    body('rankPosition').isInt({ min: 1 })
], async (req, res) => {
    try {
        const { participantId, rankPosition, award, score, remarks } = req.body;

        const [result] = await pool.query(
            `INSERT INTO competition_results 
             (event_id, participant_id, rank_position, award, score, remarks, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, participantId, rankPosition, award, score, remarks, req.user.userId]
        );

        res.status(201).json({
            success: true,
            message: 'Result recorded successfully',
            resultId: result.insertId
        });

    } catch (error) {
        console.error('Add result error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to record result',
            error: error.message 
        });
    }
});

// Get gallery
router.get('/gallery', async (req, res) => {
    try {
        const { category, year, featured } = req.query;
        
        // Get albums with cover photo (first photo of each album)
        let query = `
            SELECT sg.album_id, 
                   MAX(sg.title) as title, 
                   MAX(sg.description) as description, 
                   MAX(sg.category) as category, 
                   MAX(sg.year) as year, 
                   MAX(sg.featured) as featured,
                   MAX(sg.uploaded_at) as uploaded_at, 
                   MAX(sg.uploaded_by) as uploaded_by,
                   MAX(u.email) as uploaded_by_email,
                   MAX(up.first_name) as uploaded_by_first_name, 
                   MAX(up.last_name) as uploaded_by_last_name,
                   MAX(se.event_name) as event_name,
                   (SELECT image_url FROM sports_gallery 
                    WHERE album_id = sg.album_id 
                    ORDER BY photo_order ASC LIMIT 1) as cover_image,
                   COUNT(*) as photo_count
            FROM sports_gallery sg
            JOIN users u ON sg.uploaded_by = u.user_id
            JOIN user_profiles up ON u.user_id = up.user_id
            LEFT JOIN sports_events se ON sg.event_id = se.event_id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND sg.category = ?';
            params.push(category);
        }
        if (year) {
            query += ' AND sg.year = ?';
            params.push(year);
        }
        if (featured) {
            query += ' AND sg.featured = ?';
            params.push(featured === 'true' ? 1 : 0);
        }

        query += ' GROUP BY sg.album_id ORDER BY MAX(sg.uploaded_at) DESC';

        const [gallery] = await pool.query(query, params);

        res.json({
            success: true,
            count: gallery.length,
            gallery
        });

    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch gallery',
            error: error.message 
        });
    }
});

// Get all photos in an album
router.get('/gallery/album/:albumId', async (req, res) => {
    try {
        const [photos] = await pool.query(
            `SELECT sg.*, u.email as uploaded_by_email,
                    up.first_name as uploaded_by_first_name, 
                    up.last_name as uploaded_by_last_name,
                    se.event_name
             FROM sports_gallery sg
             JOIN users u ON sg.uploaded_by = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             LEFT JOIN sports_events se ON sg.event_id = se.event_id
             WHERE sg.album_id = ?
             ORDER BY sg.photo_order ASC, sg.gallery_id ASC`,
            [req.params.albumId]
        );

        res.json({
            success: true,
            count: photos.length,
            photos
        });
    } catch (error) {
        console.error('Get album photos error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch album photos',
            error: error.message 
        });
    }
});

// Upload to gallery (CESSCA/Admin only)
router.post('/gallery', auth, roleCheck('cessca_staff', 'admin'), 
    upload.single('image'), [
    body('title').notEmpty().trim(),
    body('category').isIn(['sports', 'cultural', 'arts', 'activities', 'achievements', 'other']),
    body('year').isInt({ min: 2000, max: 2100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Image file is required' 
            });
        }

        const { title, description, category, year, eventId, albumId, photoOrder } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        const [result] = await pool.query(
            `INSERT INTO sports_gallery 
             (album_id, event_id, title, description, category, image_url, year, uploaded_by, photo_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [albumId || null, eventId || null, title, description, category, imageUrl, year, req.user.userId, photoOrder || 1]
        );

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            galleryId: result.insertId,
            album_id: albumId,
            imageUrl
        });

    } catch (error) {
        console.error('Upload gallery error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to upload image',
            error: error.message 
        });
    }
});

// Toggle featured status
router.put('/gallery/:id/featured', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const { featured } = req.body;

        await pool.query(
            'UPDATE sports_gallery SET featured = ? WHERE gallery_id = ?',
            [featured ? 1 : 0, req.params.id]
        );

        res.json({
            success: true,
            message: 'Featured status updated'
        });

    } catch (error) {
        console.error('Update featured error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update featured status',
            error: error.message 
        });
    }
});

// Delete gallery photo
router.delete('/gallery/:id', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        // Get image info to delete file
        const [photos] = await pool.query(
            'SELECT image_url FROM sports_gallery WHERE gallery_id = ?',
            [req.params.id]
        );

        if (photos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        const imageUrl = photos[0].image_url;

        // Delete from database
        await pool.query(
            'DELETE FROM sports_gallery WHERE gallery_id = ?',
            [req.params.id]
        );

        // Delete physical file if it exists
        if (imageUrl) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', imageUrl);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({
            success: true,
            message: 'Photo deleted successfully'
        });

    } catch (error) {
        console.error('Delete gallery error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete photo',
            error: error.message 
        });
    }
});

module.exports = router;

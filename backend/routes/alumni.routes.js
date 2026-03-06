const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all alumni profiles
router.get('/', auth, roleCheck('alumni', 'cessca_staff', 'admin'), async (req, res) => {
    try {
        const { graduationYear, employmentStatus, program } = req.query;
        
        let query = `
            SELECT ap.*, u.email, u.user_id, up.first_name, up.middle_name, up.last_name, up.profile_picture,
                   u.status as account_status
            FROM users u
            JOIN user_profiles up ON u.user_id = up.user_id
            LEFT JOIN alumni_profiles ap ON u.user_id = ap.user_id
            WHERE u.role = 'alumni' AND u.status = 'active'
        `;
        const params = [];

        if (graduationYear) {
            query += ' AND ap.graduation_year = ?';
            params.push(graduationYear);
        }
        if (employmentStatus) {
            query += ' AND ap.current_employment_status = ?';
            params.push(employmentStatus);
        }
        if (program) {
            query += ' AND ap.degree_program LIKE ?';
            params.push(`%${program}%`);
        }

        query += ' ORDER BY ap.graduation_year DESC, up.last_name ASC';

        const [alumni] = await pool.query(query, params);

        res.json({
            success: true,
            count: alumni.length,
            alumni
        });

    } catch (error) {
        console.error('Get alumni error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch alumni',
            error: error.message 
        });
    }
});

// Get current user's alumni profile (MUST come before /:id route)
router.get('/profile', auth, roleCheck('alumni'), async (req, res) => {
    try {
        const [alumni] = await pool.query(
            `SELECT ap.*, u.email, up.first_name, up.middle_name, up.last_name, 
                    up.contact_number, up.profile_picture, up.date_of_birth, up.gender, up.address
             FROM users u
             JOIN user_profiles up ON u.user_id = up.user_id
             LEFT JOIN alumni_profiles ap ON u.user_id = ap.user_id
             WHERE u.user_id = ?`,
            [req.user.userId]
        );

        if (alumni.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User profile not found' 
            });
        }

        res.json({
            success: true,
            alumni: alumni[0]
        });

    } catch (error) {
        console.error('Get alumni profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch alumni profile',
            error: error.message 
        });
    }
});

// Create/Update alumni profile (MUST come before /:id route)
router.post('/profile', auth, roleCheck('alumni'), [
    body('graduationYear').isInt({ min: 1990, max: 2030 }),
    body('degreeProgram').notEmpty().trim(),
    body('currentEmploymentStatus').isIn(['employed', 'self-employed', 'unemployed', 'studying'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            graduationYear, degreeProgram, currentEmploymentStatus, companyName,
            jobPosition, industry, employmentStartDate, currentAddress, permanentAddress,
            contactEmail, contactNumber, linkedinProfile
        } = req.body;

        // Convert empty strings to null for optional fields
        const sanitizedData = {
            graduationYear,
            degreeProgram,
            currentEmploymentStatus,
            companyName: companyName || null,
            jobPosition: jobPosition || null,
            industry: industry || null,
            employmentStartDate: employmentStartDate || null,
            currentAddress: currentAddress || null,
            permanentAddress: permanentAddress || null,
            contactEmail: contactEmail || null,
            contactNumber: contactNumber || null,
            linkedinProfile: linkedinProfile || null
        };

        // Check if profile exists
        const [existing] = await pool.query(
            'SELECT alumni_id FROM alumni_profiles WHERE user_id = ?',
            [req.user.userId]
        );

        let result;
        if (existing.length > 0) {
            // Update existing profile
            await pool.query(
                `UPDATE alumni_profiles 
                 SET graduation_year = ?, degree_program = ?, current_employment_status = ?,
                     company_name = ?, job_position = ?, industry = ?, employment_start_date = ?,
                     current_address = ?, permanent_address = ?, contact_email = ?, 
                     contact_number = ?, linkedin_profile = ?
                 WHERE user_id = ?`,
                [sanitizedData.graduationYear, sanitizedData.degreeProgram, sanitizedData.currentEmploymentStatus, 
                 sanitizedData.companyName, sanitizedData.jobPosition, sanitizedData.industry, 
                 sanitizedData.employmentStartDate, sanitizedData.currentAddress, sanitizedData.permanentAddress, 
                 sanitizedData.contactEmail, sanitizedData.contactNumber, sanitizedData.linkedinProfile, 
                 req.user.userId]
            );
            result = { alumniId: existing[0].alumni_id };
        } else {
            // Create new profile
            const [insertResult] = await pool.query(
                `INSERT INTO alumni_profiles 
                 (user_id, graduation_year, degree_program, current_employment_status, company_name,
                  job_position, industry, employment_start_date, current_address, permanent_address,
                  contact_email, contact_number, linkedin_profile)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [req.user.userId, sanitizedData.graduationYear, sanitizedData.degreeProgram, 
                 sanitizedData.currentEmploymentStatus, sanitizedData.companyName, sanitizedData.jobPosition, 
                 sanitizedData.industry, sanitizedData.employmentStartDate, sanitizedData.currentAddress, 
                 sanitizedData.permanentAddress, sanitizedData.contactEmail, sanitizedData.contactNumber, 
                 sanitizedData.linkedinProfile]
            );
            result = { alumniId: insertResult.insertId };
        }

        res.json({
            success: true,
            message: 'Alumni profile saved successfully',
            ...result
        });

    } catch (error) {
        console.error('Save alumni profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save alumni profile',
            error: error.message 
        });
    }
});

// Get alumni profile by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const [alumni] = await pool.query(
            `SELECT ap.*, u.email, up.first_name, up.middle_name, up.last_name, 
                    up.contact_number, up.profile_picture, up.date_of_birth, up.gender, up.address
             FROM alumni_profiles ap
             JOIN users u ON ap.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE ap.alumni_id = ?`,
            [req.params.id]
        );

        if (alumni.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Alumni profile not found' 
            });
        }

        // Get achievements
        const [achievements] = await pool.query(
            'SELECT * FROM alumni_achievements WHERE alumni_id = ? ORDER BY achievement_date DESC',
            [req.params.id]
        );

        // Get additional education
        const [education] = await pool.query(
            'SELECT * FROM alumni_education WHERE alumni_id = ? ORDER BY start_date DESC',
            [req.params.id]
        );

        res.json({
            success: true,
            ...alumni[0],
            achievements,
            additionalEducation: education
        });

    } catch (error) {
        console.error('Get alumni profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch alumni profile',
            error: error.message 
        });
    }
});

// Get achievements for an alumni
router.get('/:id/achievements', auth, async (req, res) => {
    try {
        const [achievements] = await pool.query(
            'SELECT * FROM alumni_achievements WHERE alumni_id = ? ORDER BY achievement_date DESC',
            [req.params.id]
        );

        res.json(achievements);

    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch achievements',
            error: error.message 
        });
    }
});

// Add achievement
router.post('/:id/achievements', auth, roleCheck('alumni'), [
    body('achievementType').isIn(['academic', 'professional', 'award', 'publication', 'certification', 'other']),
    body('title').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { achievementType, title, description, institution, achievementDate } = req.body;

        // Verify ownership or admin
        if (req.user.role !== 'admin' && req.user.role !== 'cessca_staff') {
            const [alumni] = await pool.query(
                'SELECT user_id FROM alumni_profiles WHERE alumni_id = ?',
                [req.params.id]
            );
            if (alumni.length === 0 || alumni[0].user_id !== req.user.userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO alumni_achievements 
             (alumni_id, achievement_type, title, description, institution, achievement_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, achievementType, title, description, institution, achievementDate]
        );

        res.status(201).json({
            success: true,
            message: 'Achievement added successfully',
            achievementId: result.insertId
        });

    } catch (error) {
        console.error('Add achievement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add achievement',
            error: error.message 
        });
    }
});

// Add additional education
router.post('/:id/education', auth, roleCheck('alumni'), [
    body('degreeLevel').isIn(['masteral', 'doctoral', 'certificate', 'diploma']),
    body('degreeProgram').notEmpty().trim(),
    body('institution').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { degreeLevel, degreeProgram, institution, startDate, completionDate, status } = req.body;

        const [result] = await pool.query(
            `INSERT INTO alumni_education 
             (alumni_id, degree_level, degree_program, institution, start_date, completion_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, degreeLevel, degreeProgram, institution, startDate, completionDate, status]
        );

        res.status(201).json({
            success: true,
            message: 'Education record added successfully',
            educationId: result.insertId
        });

    } catch (error) {
        console.error('Add education error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add education record',
            error: error.message 
        });
    }
});

// Get alumni statistics
router.get('/stats/summary', auth, roleCheck('alumni', 'cessca_staff', 'admin'), async (req, res) => {
    try {
        // Employment statistics
        const [employmentStats] = await pool.query(
            `SELECT current_employment_status, COUNT(*) as count
             FROM alumni_profiles
             GROUP BY current_employment_status`
        );

        // Graduation year distribution
        const [yearStats] = await pool.query(
            `SELECT graduation_year, COUNT(*) as count
             FROM alumni_profiles
             GROUP BY graduation_year
             ORDER BY graduation_year DESC
             LIMIT 10`
        );

        // Top industries
        const [industryStats] = await pool.query(
            `SELECT industry, COUNT(*) as count
             FROM alumni_profiles
             WHERE industry IS NOT NULL
             GROUP BY industry
             ORDER BY count DESC
             LIMIT 10`
        );

        // Total counts
        const [totals] = await pool.query(
            `SELECT 
                COUNT(*) as total_alumni,
                COUNT(CASE WHEN current_employment_status IN ('employed', 'self-employed') THEN 1 END) as employed_count
             FROM alumni_profiles`
        );

        res.json({
            success: true,
            statistics: {
                totals: totals[0],
                employmentStats,
                yearStats,
                industryStats
            }
        });

    } catch (error) {
        console.error('Get alumni statistics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics',
            error: error.message 
        });
    }
});

module.exports = router;

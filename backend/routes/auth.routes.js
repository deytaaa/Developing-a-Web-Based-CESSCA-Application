const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is not active. Please contact administrator.' 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Get user profile
        const [profiles] = await pool.query(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                userId: user.user_id,
                email: user.email,
                role: user.role,
                profile: profiles[0] || null
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed',
            error: error.message 
        });
    }
});

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student', 'officer', 'alumni']),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password, role, firstName, middleName, lastName, studentId, course } = req.body;

        // Check if user exists
        const [existing] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [userResult] = await pool.query(
            'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, 'pending']
        );

        const userId = userResult.insertId;

        // Insert user profile
        await pool.query(
            'INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, student_id, course) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, firstName, middleName || null, lastName, studentId || null, course || null]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful. Awaiting admin approval.',
            userId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed',
            error: error.message 
        });
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT user_id, email, role, status, created_at, last_login FROM users WHERE user_id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const [profiles] = await pool.query(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [req.user.userId]
        );

        res.json({
            success: true,
            user: {
                userId: users[0].user_id,
                email: users[0].email,
                role: users[0].role,
                status: users[0].status,
                profile: profiles[0] || null
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch profile',
            error: error.message 
        });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { 
            firstName, middleName, lastName, contactNumber, 
            address, dateOfBirth, gender, course, yearLevel 
        } = req.body;

        await pool.query(
            `UPDATE user_profiles 
             SET first_name = ?, middle_name = ?, last_name = ?, 
                 contact_number = ?, address = ?, date_of_birth = ?, 
                 gender = ?, course = ?, year_level = ?
             WHERE user_id = ?`,
            [firstName, middleName, lastName, contactNumber, address, 
             dateOfBirth, gender, course, yearLevel, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile',
            error: error.message 
        });
    }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Delete old profile picture if exists
        const [currentProfile] = await pool.query(
            'SELECT profile_picture FROM user_profiles WHERE user_id = ?',
            [req.user.userId]
        );

        if (currentProfile[0]?.profile_picture) {
            const oldPath = path.join(__dirname, '..', currentProfile[0].profile_picture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Update profile with new picture path
        const picturePath = `/uploads/${req.file.filename}`;
        await pool.query(
            'UPDATE user_profiles SET profile_picture = ? WHERE user_id = ?',
            [picturePath, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            profilePicture: picturePath
        });

    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture',
            error: error.message
        });
    }
});

// Delete profile picture
router.delete('/profile/picture', auth, async (req, res) => {
    try {
        const [currentProfile] = await pool.query(
            'SELECT profile_picture FROM user_profiles WHERE user_id = ?',
            [req.user.userId]
        );

        if (currentProfile[0]?.profile_picture) {
            const oldPath = path.join(__dirname, '..', currentProfile[0].profile_picture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await pool.query(
            'UPDATE user_profiles SET profile_picture = NULL WHERE user_id = ?',
            [req.user.userId]
        );

        res.json({
            success: true,
            message: 'Profile picture deleted successfully'
        });

    } catch (error) {
        console.error('Profile picture delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete profile picture',
            error: error.message
        });
    }
});

// Change password
router.post('/change-password', auth, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user
        const [users] = await pool.query(
            'SELECT password FROM users WHERE user_id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPassword, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change password',
            error: error.message 
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Upload image for About page (admin/cessca_staff only)
router.post('/upload', auth, roleCheck('admin', 'cessca_staff'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Return the relative URL to the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

module.exports = router;

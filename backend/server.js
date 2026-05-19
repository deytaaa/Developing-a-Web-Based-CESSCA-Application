const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const organizationRoutes = require('./routes/organizations.routes');
const sportsRoutes = require('./routes/sports.routes');
const adminRoutes = require('./routes/admin.routes');
const achievementsRoutes = require('./routes/achievements.routes');
const aboutRoutes = require('./routes/about.routes');
const aboutUploadRoutes = require('./routes/aboutUpload.routes');
const activityLogRoutes = require('./routes/activitylog.routes');

const app = express();
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const uploadsPath = path.join(__dirname, 'uploads');
const hasFrontendBuild = fs.existsSync(frontendDistPath);
let databaseReady = false;


// Dynamic CORS configuration to allow only one origin at a time
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Security middleware - Configure helmet to not interfere with CORS
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || (isProduction ? 100 : 1000)
});
app.use('/api/', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    return limiter(req, res, next);
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: databaseReady ? 'OK' : 'DEGRADED', 
        message: 'CESSCA API is running',
        database: databaseReady ? 'connected' : 'not_connected',
        timestamp: new Date().toISOString() 
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
// Alumni and Discipline modules removed per project request
app.use('/api/sports', sportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/about', aboutUploadRoutes);

app.use('/api/activity-logs', activityLogRoutes);

if (hasFrontendBuild) {
    app.use(express.static(frontendDistPath));

    app.get(/^\/(?!api\/|uploads\/).*/, (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return next();
        }

        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        });

        databaseReady = await testConnection();
        if (!databaseReady) {
            console.warn('⚠️ Starting without a database connection. Check Render environment variables and MySQL host.');
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

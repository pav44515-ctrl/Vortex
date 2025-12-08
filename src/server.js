// Load environment variables
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const uploadRoutes = require('./routes/upload');
const securityMiddleware = require('./middleware/security-middleware');
const { createHTTPSServer, redirectToHTTPS } = require('./config/ssl-config');
const { apiLimiter } = require('./config/rate-limit-config');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// ===================================
// MIDDLEWARE
// ===================================

// Security middleware (Helmet, CORS)
securityMiddleware(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));


// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-please-set-env-variable',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' // CSRF protection
    }
}));


// General API rate limiting
app.use('/api/', apiLimiter);

// ===================================
// ROUTES
// ===================================

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve editor.html for /editor route (optional, but good for direct access)
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/editor.html'));
});


// ===================================
// START SERVERS (HTTP + HTTPS)
// ===================================

// Start HTTP server
const httpServer = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🎬 Vortex SERVER RUNNING (HTTP)    ║
║                                        ║
║   🌐 http://localhost:${PORT}            ║
║                                        ║
║   ✨ Features:                         ║
║   • User Authentication               ║
║   • Project Management                ║
║   • SQLite Database                   ║
║   • Security Middleware               ║
║   • Rate Limiting                     ║
║                                        ║
║   Press Ctrl+C to stop                ║
╚════════════════════════════════════════╝
    `);
});

// Start HTTPS server (if SSL certificates available)
const httpsServer = createHTTPSServer(app);
if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║   🔒 Vortex SERVER RUNNING (HTTPS)   ║
║                                        ║
║   🌐 https://localhost:${HTTPS_PORT}          ║
║                                        ║
║   ✅ SSL/TLS Encryption Active        ║
║   🛡️  Security Headers Enabled        ║
║   ⚡ Rate Limiting Active             ║
║                                        ║
╚════════════════════════════════════════╝
    `);
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});

const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = 3000;

// ===================================
// MIDDLEWARE
// ===================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
    secret: 'ai-video-studio-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ===================================
// ROUTES
// ===================================

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve editor.html for /editor route (optional, but good for direct access)
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/editor.html'));
});

// ===================================
// START SERVER
// ===================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🎬 AI VIDEO STUDIO SERVER RUNNING   ║
║                                        ║
║   🌐 http://localhost:${PORT}            ║
║                                        ║
║   ✨ Features:                         ║
║   • User Authentication               ║
║   • Project Management                ║
║   • SQLite Database                   ║
║                                        ║
║   Press Ctrl+C to stop                ║
╚════════════════════════════════════════╝
    `);
});

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

const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Get User Projects
router.get('/', requireAuth, (req, res) => {
    const sql = `SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC`;
    db.all(sql, [req.session.user.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Create/Save Project
router.post('/', requireAuth, (req, res) => {
    const { name, data } = req.body;
    const userId = req.session.user.id;

    const sql = `INSERT INTO projects (user_id, name, data) VALUES (?, ?, ?)`;
    db.run(sql, [userId, name, JSON.stringify(data)], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Project saved successfully' });
    });
});

module.exports = router;

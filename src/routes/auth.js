const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authLimiter } = require('../config/rate-limit-config');
const router = express.Router();


// Signup Route - with rate limiting and validation
router.post('/signup',
    authLimiter, // Apply rate limiting
    [
        // Input validation
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/\d/).withMessage('Password must contain a number')
            .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
            .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
            db.run(sql, [name, email, hashedPassword], function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: 'Failed to create account' });
                }

                const user = { id: this.lastID, name, email };
                req.session.user = user;
                res.json({ message: 'Signup successful', user });
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }
);


// Login Route - with rate limiting and validation
router.post('/login',
    authLimiter, // Apply rate limiting
    [
        // Input validation
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        const sql = `SELECT * FROM users WHERE email = ?`;
        db.get(sql, [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const userData = { id: user.id, name: user.name, email: user.email };
                req.session.user = userData;
                res.json({ message: 'Login successful', user: userData });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    }
);

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Check Auth Status
router.get('/check', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    try {
        const pool = req.app.get('pool');
        // Check if the pool was successfully retrieved from the app settings
        if (!pool) {
            console.error('Database pool not found in app settings!');
            return res.status(500).json({ success: false, error: 'Database configuration error' });
        }
        const [rows] = await pool.execute('SELECT id, email, password_hash, display_name, role, permission FROM users WHERE email = ?', [email]);
        if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const user = rows[0];
        
        // Update the last_login column for this user
        await pool.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );
        const p =  typeof user.permission === 'string' ? JSON.parse(user.permission) : (user.permission || []);
        req.session.user = { id: user.id, email: user.email, displayName: user.display_name, role: user.role, permission: p};
        res.json({ success: true, data: req.session.user });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

// POST /api/guest (or /api/log/guest)
router.post('/guest', (req, res) => {
    req.session.user = {
        id: 0,
        email: 'guest@demo.local',
        displayName: 'guest',
        role: 'guest',
        permission: ['overview', 'performance', 'errors', 'sessions', 'reports']
    };
    res.json({ success: true, data: req.session.user });
});

module.exports = router;
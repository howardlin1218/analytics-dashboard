const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    if (!req.session.user) return res.sendStatus(401);
    if (req.session.user.role === 'viewer' || req.session.user.role === 'guest') return res.json({ user: req.session.user });
    
    const pool = req.app.get('pool');
    try {   
        // 2. Fetch data from the database (Step 2)
        // We select the most recent 50 logs to keep the page snappy
        const [rows] = await pool.query(
            'SELECT id, event_type, url, ip_address, payload, created_at FROM activity_logs ORDER BY id ASC LIMIT 50'
        );

        // 3. Send back both user info AND the data rows
        res.json({
            user: req.session.user,
            logs: rows
        });
    } catch (err) {
        res.json({ user: req.session.user, logs: [] });
    }
});

module.exports = router;
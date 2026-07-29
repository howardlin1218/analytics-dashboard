const express = require('express');
const router = express.Router();

// GET /api/dashboard - Authentication handshake endpoint
router.get('/', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.sendStatus(401);
    }
    res.json({ user: req.session.user });
});

module.exports = router;
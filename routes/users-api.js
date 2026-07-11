const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Middleware: require super admin role
function requireAdmin(req, res, next) {
    if (!req.session.user || !['super admin'].includes(req.session.user.role)) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
}

// GET /api/users
router.get('/', requireAdmin, async (req, res) => {
    try {
        const pool = req.app.get('pool');
        const [users] = await pool.execute('SELECT id, email, display_name, role, created_at, last_login, permission FROM users ORDER BY created_at');
        // console.log(users)
        res.json({ success: true, data: users });
    } catch (err) {
        console.error('List users error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/users
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { email, displayName, password, role, permissions } = req.body;
        console.log(email);
        if (!email || !displayName || !password) {
            return res.status(400).json({ success: false, error: 'All fields required' });
        }
        const validRoles = ['super admin', 'analyst', 'viewer'];
        const userRole = validRoles.includes(role) ? role : 'viewer';

        const validPermissions = ['performance', 'errors', 'sessions'];
        let finalPermissions = [];


        if (Array.isArray(permissions)) {
            finalPermissions = permissions.filter(p => validPermissions.includes(p));
        }

        if (userRole === 'viewer') {
            finalPermissions = [];
        }
        const passwordHash = await bcrypt.hash(password, 10);

        const pool = req.app.get('pool');
        await pool.execute(
            'INSERT INTO users (email, password_hash, display_name, role, permission) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, displayName, userRole, JSON.stringify(finalPermissions)]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Email already exists' });
        }
        console.error('Create user error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /api/users/:id
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { displayName, role, permissions } = req.body;
        const validRoles = ['super admin', 'analyst', 'viewer'];
        const userRole = validRoles.includes(role) ? role : undefined;

        const allowedPermissions = ['performance', 'errors', 'sessions'];

        const pool = req.app.get('pool');
        const fields = [];
        const params = [];
        const filtered = [];
        if (displayName) { fields.push('display_name = ?'); params.push(displayName); }
        if (userRole) { fields.push('role = ?'); params.push(userRole); }

        if (userRole === 'analyst' && Array.isArray(permissions)) {
            filtered = permissions.filter(p => allowedPermissions.includes(p));
            fields.push('permission = ?'); // Ensure this matches your DB column name
            params.push(JSON.stringify(filtered));
        } else if (userRole && userRole !== 'analyst') {
            // Clear permissions if the role is changed away from analyst
            fields.push('permission = ?');
            params.push(JSON.stringify([]));
        }

        if (fields.length === 0) return res.status(400).json({ success: false, error: 'Nothing to update' });

        params.push(req.params.id);
        await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

        // sync the session credentials if editing yourself
        if (req.session && req.session.user && req.session.user.id === parseInt(req.params.id) && userRole) {
            req.session.user.displayName = displayName;
            req.session.user.role = role;
            req.session.user.permission = role === 'analyst' ? filtered : [];
            
            // req.session.save() forces Express to rewrite the session data immediately
            req.session.save(); 
            console.log(req.session);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update user error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        if (String(req.session.user.id) === String(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
        }
        const pool = req.app.get('pool');
        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete user error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
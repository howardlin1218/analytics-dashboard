const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function getLogsFromFile() {
    const jsonlPath = path.join(__dirname, '../../analytics_collector/.logs/analytics.jsonl');
    if (!fs.existsSync(jsonlPath)) return [];
    try {
        const fileContent = fs.readFileSync(jsonlPath, 'utf8');
        const lines = fileContent.trim().split('\n').filter(Boolean);
        return lines.map((line, idx) => {
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'error') {
                    return {
                        created_at: parsed.serverTimestamp || parsed.timestamp || new Date().toISOString(),
                        url: parsed.url || 'unknown',
                        payload: parsed
                    };
                }
                return null;
            } catch (e) { return null; }
        }).filter(Boolean);
    } catch (e) { return []; }
}

// Helper to merge DB and file rows (Prioritizes Database; falls back to JSONL file if DB is empty or unavailable)
function getMergedLogs(dbRows, fileRows) {
    if (Array.isArray(dbRows) && dbRows.length > 0) {
        return dbRows;
    }
    return Array.isArray(fileRows) ? fileRows : [];
}

function safeExtractSiteId(payload, rawUrl) {
    if (payload && (payload.siteId || payload.site_id)) {
        return payload.siteId || payload.site_id;
    }
    const targetUrl = (payload && payload.url) || rawUrl;
    if (!targetUrl || targetUrl === 'unknown') return null;
    try { return new URL(targetUrl).hostname; } catch (e) { return targetUrl; }
}

// Middleware: require errors analyst or super admin
function requirePermissions(req, res, next) {
    const user = req.session ? req.session.user : null;
    if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Please log in.' });
    }
    if (user.role === 'viewer') {
        return res.status(403).json({ 
            success: false, 
            error: 'Access Denied: You do not have permission to view Error data.' 
        });
    }
    const isSuperAdmin = user.role === 'super admin';
    
    // Handle permissions (ensure it's an array for .includes check)
    let perms = user.permission || [];
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch(e) { perms = []; }
    }

    const hasErrorAccess = perms.includes('errors');

    if (!isSuperAdmin && user.role !== 'guest' && !(user.role === 'analyst' && hasErrorAccess)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Access Denied: You do not have permission to view Error data.' 
        });
    }

    next();
}

router.get('/', requirePermissions, async (req, res) => {
    try {
        const selectedSite = req.query.siteId;
        let dbRows = [];
        try {
            const pool = req.app.get('pool');
            const [rows] = await pool.query(
                'SELECT created_at, url, payload FROM activity_logs WHERE event_type = "error"'
            );
            dbRows = rows || [];
        } catch(e) {}

        const fileRows = getLogsFromFile();
        const rows = getMergedLogs(dbRows, fileRows);

        let filteredRows = rows;
        if (selectedSite && selectedSite !== 'all') {
            filteredRows = rows.filter(row => {
                let payload = {};
                try { payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {}); } catch(e) {}
                const sId = safeExtractSiteId(payload, row.url);
                return sId === selectedSite;
            });
        }

        // --- PREPARE VARIABLES ---
        const errorsByDate = {}; // For the trend line chart
        const groupedErrors = {}; // For the grouped table

        // --- PROCESS THE LOGS ---
        filteredRows.forEach(row => {
            let payload = {};
            try {
                payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {});
            } catch (e) {
                return; // Skip if payload is hopelessly corrupted
            }

            // 1. Build Chart Data (Group by Day)
            const dateObj = new Date(row.created_at);
            const dateString = dateObj.toISOString().split('T')[0]; // e.g., "2026-03-14"
            errorsByDate[dateString] = (errorsByDate[dateString] || 0) + 1;

            // 2. Build Table Data (Group identical errors)
            // We use the error message as the unique "key" to group them
            // Safely grab the nested error object from the payload
            const errDetails = payload.error || {};

            // We use the error message as the unique "key" to group them
            // Resource errors might not have a message, so we fall back to the tagName/src
            const errorMsg = errDetails.message || errDetails.src || errDetails.tagName || 'Unknown Error';
            
            // Grab the specific type (e.g., 'js-error', 'api-error', 'promise-rejection')
            const errorType = errDetails.type || 'Error';
            
            // Grab the stack trace
            const stack = errDetails.stack || 'No stack trace provided by the client.';

            if (!groupedErrors[errorMsg]) {
                // First time seeing this specific error
                groupedErrors[errorMsg] = {
                    type: errorType,
                    message: errorMsg,
                    count: 0,
                    lastSeen: dateObj, 
                    stackTrace: stack
                };
            }

            // Increment the count for this specific error
            groupedErrors[errorMsg].count++;

            // Update the "last seen" time if this log is newer
            if (dateObj > groupedErrors[errorMsg].lastSeen) {
                groupedErrors[errorMsg].lastSeen = dateObj;
                groupedErrors[errorMsg].stackTrace = stack; // Keep the freshest stack trace
            }
        });

        // --- FORMAT DATA FOR FRONTEND ---

        // 1. Format the Chart Data (Sort chronologically)
        const sortedDates = Object.keys(errorsByDate).sort();
        const chart = {
            labels: sortedDates,
            values: sortedDates.map(date => errorsByDate[date])
        };

        // 2. Format the Table Data
        const table = Object.values(groupedErrors)
            .sort((a, b) => b.lastSeen - a.lastSeen) // Sort by most recent first
            .map(err => {
                return {
                    time: err.lastSeen.toLocaleString(), // e.g., "3/14/2026, 7:37:20 PM"
                    type: err.type,
                    message: err.message,
                    count: err.count,
                    stackTrace: err.stackTrace
                };
            });

        // --- SEND TO FRONTEND ---
        res.json({ chart, table, success: true });

    } catch (err) {
        console.error("Errors API Error:", err);
        res.status(500).json({ error: "Failed to load error data" });
    }
});

module.exports = router;
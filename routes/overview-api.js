const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper to read fallback rows from analytics.jsonl
function getLogsFromFile() {
    const jsonlPath = path.join(__dirname, '../../analytics_collector/.logs/analytics.jsonl');
    if (!fs.existsSync(jsonlPath)) return [];
    try {
        const fileContent = fs.readFileSync(jsonlPath, 'utf8');
        const lines = fileContent.trim().split('\n').filter(Boolean);
        return lines.map((line, idx) => {
            try {
                const parsed = JSON.parse(line);
                return {
                    id: idx + 1,
                    event_type: parsed.type || 'unknown',
                    url: parsed.url || 'unknown',
                    ip_address: parsed.ip || '127.0.0.1',
                    user_agent: parsed.technographics ? parsed.technographics.userAgent : 'unknown',
                    payload: parsed,
                    created_at: parsed.serverTimestamp || parsed.timestamp || new Date().toISOString()
                };
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

// Helper to extract siteId safely without crashing on non-URL strings
function safeExtractSiteId(payload, rawUrl) {
    if (payload && (payload.siteId || payload.site_id)) {
        return payload.siteId || payload.site_id;
    }
    const targetUrl = (payload && payload.url) || rawUrl;
    if (!targetUrl || targetUrl === 'unknown') return null;
    try {
        return new URL(targetUrl).hostname;
    } catch (e) {
        return targetUrl;
    }
}

// Middleware: require analyst or super admin
function requirePermissions(req, res, next) {
    const user = req.session ? req.session.user : null;
    if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Please log in.' });
    }
    if (user.role === 'viewer') {
        return res.status(403).json({ 
            success: false, 
            error: 'Access Denied: You do not have permission to view Overview data.' 
        });
    }

    next();
}

router.get('/sites', async (req, res) => {
    try {
        let dbRows = [];
        try {
            const pool = req.app.get('pool');
            if (pool) {
                const [rows] = await pool.query('SELECT DISTINCT url, payload FROM activity_logs');
                dbRows = rows || [];
            }
        } catch (e) {}

        const fileRows = (dbRows && dbRows.length > 0) ? [] : getLogsFromFile();
        const combinedRows = getMergedLogs(dbRows, fileRows);

        const siteSet = new Set();
        combinedRows.forEach(row => {
            let payload = {};
            if (typeof row.payload === 'string') {
                try { payload = JSON.parse(row.payload); } catch(e) {}
            } else if (row.payload && typeof row.payload === 'object') {
                payload = row.payload;
            }
            const sId = safeExtractSiteId(payload, row.url);
            if (sId) siteSet.add(sId);
        });
        const sites = Array.from(siteSet).sort();
        res.json({ success: true, sites });
    } catch (err) {
        console.error("Overview Sites Error:", err);
        res.status(500).json({ error: "Failed to load sites" });
    }
});

router.get('/', requirePermissions, async (req, res) => {
    try {
        const selectedSite = req.query.siteId;
        let dbRows = [];
        try {
            const pool = req.app.get('pool');
            if (pool) {
                const [rows] = await pool.query(
                    'SELECT id, event_type, url, ip_address, user_agent, payload, created_at FROM activity_logs'
                );
                dbRows = rows || [];
            }
        } catch (e) {}

        const fileRows = (dbRows && dbRows.length > 0) ? [] : getLogsFromFile();
        const rows = getMergedLogs(dbRows, fileRows);

        // 2. Map the database rows into the JSON format expected by the logic
        let logs = rows.map(row => {
            let payloadData = {};
            
            // Safety check: Parse the payload if MySQL returns it as a string
            if (typeof row.payload === 'string') {
                try {
                    payloadData = JSON.parse(row.payload);
                } catch (e) {
                    console.error(`Failed to parse payload for log ID ${row.id}`);
                }
            } else if (row.payload && typeof row.payload === 'object') {
                payloadData = row.payload;
            }

            // Return the combined object
            return {
                id: row.id,
                type: row.event_type,       // Map DB column 'event_type' to 'type'
                url: row.url,
                ip: row.ip_address,
                userAgent: row.user_agent,
                timestamp: row.created_at,
                ...payloadData              // Spread payload (session, timeOnPage, etc.)
            };
        });

        // Filter by selected site if specified
        if (selectedSite && selectedSite !== 'all') {
            logs = logs.filter(log => {
                const sId = safeExtractSiteId(log, log.url);
                return sId === selectedSite;
            });
        }

        // --- PREPARE VARIABLES ---
        let totalPageviews = 0;
        let totalEvents = 0;
        const uniqueSessions = new Set();
        let totalTimeOnPage = 0;
        let pageExitCount = 0;
        
        const viewsByDate = {}; // For the line chart
        const urlStats = {};    // For the top pages table

        // --- PROCESS THE LOGS ---
        logs.forEach(log => {
            // Track all unique sessions across all log types
            const sessionKey = log.session || log.sessionId;
            if (sessionKey) uniqueSessions.add(sessionKey);

            // 1. Handle "pageview" logs (For chart and table)
            if (log.type === 'pageview') {
                totalPageviews++;

                // -- Chart Data --
                // Extract just the Date part (YYYY-MM-DD)
                if (log.timestamp) {
                    const dateString = new Date(log.timestamp).toISOString().split('T')[0];
                    viewsByDate[dateString] = (viewsByDate[dateString] || 0) + 1;
                }

                // -- Table Data --
                // Safely extract just the pathname (e.g., "/index.html" instead of the full URL)
                let path = log.url;
                if (path) {
                    try {
                        const parsedUrl = new URL(log.url);
                        path = parsedUrl.pathname + parsedUrl.search;
                    } catch (e) { /* keep original if invalid URL */ }

                    if (!urlStats[path]) {
                        urlStats[path] = { views: 0, sessions: new Set() };
                    }
                    urlStats[path].views++;
                    urlStats[path].sessions.add(sessionKey);
                }
            }

            // 2. Handle "page_exit" logs (For Avg Time on Page card)
            if (log.type === 'page_exit' && log.timeOnPage) {
                totalTimeOnPage += log.timeOnPage;
                pageExitCount++;
            }

            // 3. Handle "event" and custom logs (For Total Events card)
            if (log.type === 'event' || log.type === 'error' || log.event || ['click', 'scroll_depth', 'mousemove', 'keydown', 'keyup', 'idle_break_start', 'idle_break_end'].includes(log.type)) {
                totalEvents++;
            }
        });

        // --- FORMAT DATA FOR FRONTEND ---

        // 1. Build the 4 Summary Cards
        // Convert total time in ms to average seconds
        const avgTimeSeconds = pageExitCount > 0 
            ? Math.round((totalTimeOnPage / pageExitCount) / 1000) 
            : 0;

        const formatTime = (sec) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}m ${s}s`;
        };

        const cards = [
            { title: "Total Pageviews", value: totalPageviews.toLocaleString() },
            { title: "Unique Sessions", value: uniqueSessions.size.toLocaleString() },
            { title: "Avg Time on Page", value: formatTime(avgTimeSeconds) },
            { title: "Total Events", value: totalEvents.toLocaleString() }
        ];

        // 2. Build the Line Chart (Sort dates chronologically)
        const sortedDates = Object.keys(viewsByDate).sort();
        const chart = {
            labels: sortedDates, // e.g., ["2026-02-27", "2026-02-28"]
            values: sortedDates.map(date => viewsByDate[date])
        };

        // 3. Build the Top Pages Table (Sort by views, limit to Top 10)
        const table = Object.keys(urlStats).map(path => {
            return {
                path: path,
                views: urlStats[path].views,
                unique: urlStats[path].sessions.size
            };
        })
        .sort((a, b) => b.views - a.views) // Sort highest views first
        .slice(0, 10); // Take top 10

        // --- SEND TO FRONTEND ---
        res.json({ cards, chart, table, success: true});

    } catch (err) {
        console.error("Overview API Error:", err);
        res.status(500).json({ error: "Failed to load overview data" });
    }
});
module.exports = router;
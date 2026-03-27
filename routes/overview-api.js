const express = require('express');
const router = express.Router();

// Middleware: require analyst or super admin
function requirePermissions(req, res, next) {
    const user = req.session.user;
        if (user.role === 'viewer') {
            return res.status(403).json({ 
                success: false, 
                error: 'Access Denied: You do not have permission to view Overview data.' 
            });
        }

    next();
}

router.get('/', requirePermissions, async (req, res) => {
    try {
        // 1. Fetch all your logs from the database
        const pool = req.app.get('pool');
        const [rows] = await pool.query(
            'SELECT id, event_type, url, ip_address, user_agent, payload, created_at FROM activity_logs'
        );

        // 2. Map the database rows into the JSON format expected by the logic
        const logs = rows.map(row => {
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

            // 3. Handle "event" logs (For Total Events card)
            if (log.type === 'event') {
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
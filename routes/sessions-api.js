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
                if (parsed.session || parsed.sessionId) {
                    return {
                        id: idx + 1,
                        event_type: parsed.type || 'unknown',
                        url: parsed.url || 'unknown',
                        ip_address: parsed.ip || '127.0.0.1',
                        user_agent: parsed.technographics ? parsed.technographics.userAgent : 'unknown',
                        payload: parsed,
                        created_at: parsed.serverTimestamp || parsed.timestamp || new Date().toISOString()
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

// Middleware: require analyst or super admin
function requirePermissions(req, res, next) {
    const user = req.session ? req.session.user : null;
    if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Please log in.' });
    }
    if (user.role === 'viewer') {
        return res.status(403).json({ 
            success: false, 
            error: 'Access Denied: You do not have permission to view Sessions data.' 
        });
    }
    const isSuperAdmin = user.role === 'super admin';
    
    // Handle permissions (ensure it's an array for .includes check)
    let perms = user.permission || [];
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch(e) { perms = []; }
    }

    const hasSessionsAccess = perms.includes('sessions');

    if (!isSuperAdmin && user.role !== 'guest' && !(user.role === 'analyst' && hasSessionsAccess)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Access Denied: You do not have permission to view Sessions data.' 
        });
    }

    next();
}

// Helper to make raw User Agent strings readable
function parseUserAgent(uaString) {
    if (!uaString || uaString === 'Unknown') return { os: 'Unknown', browser: 'Unknown', device: 'Desktop' };
    let os = 'Unknown', browser = 'Unknown', device = 'Desktop';

    if (uaString.includes('Windows')) os = 'Windows';
    else if (uaString.includes('Mac OS')) os = 'macOS';
    else if (uaString.includes('Linux')) os = 'Linux';
    else if (uaString.includes('Android')) { os = 'Android'; device = 'Mobile'; }
    else if (uaString.includes('iPhone') || uaString.includes('iPad')) { os = 'iOS'; device = 'Mobile'; }

    if (uaString.includes('Edg/')) browser = 'Edge';
    else if (uaString.includes('Chrome/')) browser = 'Chrome';
    else if (uaString.includes('Firefox/')) browser = 'Firefox';
    else if (uaString.includes('Safari/') && !uaString.includes('Chrome/')) browser = 'Safari';

    return { os, browser, device };
}

router.get('/', requirePermissions, async (req, res) => {
    try {
        const selectedSite = req.query.siteId;
        let dbRows = [];
        try {
            const pool = req.app.get('pool');
            const [rows] = await pool.query(`
                SELECT id, event_type, url, ip_address, user_agent, payload, created_at
                FROM activity_logs 
                WHERE COALESCE(payload->>'$.session', payload->>'$.sessionId') IS NOT NULL
            `);
            dbRows = rows || [];
        } catch(e) {}

        const fileRows = getLogsFromFile();
        const rows = getMergedLogs(dbRows, fileRows);

        let logs = rows.map(row => {
            let payload = {};
            try { payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {}); } catch(e) {}
            return {
                session_id: payload.session || payload.sessionId,
                siteId: safeExtractSiteId(payload, row.url),
                ip_address: row.ip_address,
                created_at: row.created_at
            };
        });

        if (selectedSite && selectedSite !== 'all') {
            logs = logs.filter(l => l.siteId === selectedSite);
        }

        const sessionMap = {};
        logs.forEach(l => {
            const sid = l.session_id;
            if (!sessionMap[sid]) {
                sessionMap[sid] = {
                    session_id: sid,
                    total_actions: 0,
                    start_time: l.created_at,
                    end_time: l.created_at,
                    ip_address: l.ip_address
                };
            }
            sessionMap[sid].total_actions++;
            if (new Date(l.created_at) < new Date(sessionMap[sid].start_time)) sessionMap[sid].start_time = l.created_at;
            if (new Date(l.created_at) > new Date(sessionMap[sid].end_time)) sessionMap[sid].end_time = l.created_at;
        });

        const sessions = Object.values(sessionMap).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        res.json({ success: true, data: sessions });
    } catch (err) {
        console.error('Session List Error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.get('/:id', requirePermissions, async (req, res) => {
    try {
        const sessionId = req.params.id.trim();
        let dbLogs = [];
        try {
            const pool = req.app.get('pool');
            const [rows] = await pool.query(
                `SELECT id, event_type, url, ip_address, user_agent, payload, created_at 
                 FROM activity_logs 
                 WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.session')) = ? 
                    OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.sessionId')) = ?
                 ORDER BY created_at ASC`,
                [sessionId, sessionId]
            );
            dbLogs = rows || [];
        } catch(e) {}

        const fileRows = (dbLogs && dbLogs.length > 0) ? [] : getLogsFromFile().filter(r => {
            const p = r.payload;
            return p && (p.session === sessionId || p.sessionId === sessionId);
        });

        const logs = getMergedLogs(dbLogs, fileRows);

        if (logs.length === 0) return res.json({ success: true, profile: null, timeline: [] });

        // --- DATA EXTRACTION & AGGREGATION ---
        let rawUA = "Unknown", screen = "Unknown", viewport = "Unknown", language = "Unknown";
        let network = "Unknown", downlink = "Unknown", rtt = "Unknown";
        let pixelRatio = 1, touchSupport = false;
        let cores = "Unknown", memory = "Unknown", colorScheme = "Unknown", timezone = "Unknown";
        let capabilities = { cookies: true, js: true, css: true, images: true };
        
        let maxScroll = 0, lcpSum = 0, lcpCount = 0, timeOnPageSum = 0;
        let uniquePages = new Set();
        let timelineData = [];

        logs.forEach(log => {
            let p = {};
            if (log.payload) {
                try { p = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload; } catch(e){}
            }

            const url = log.url || p.url || 'Unknown URL';
            if (url !== 'Unknown URL' && url !== 'unknown') uniquePages.add(url);

            // Tech properties mapping
            const tech = p.technographics || p.tech || {};
            if (screen === "Unknown" && (tech.screenWidth || tech.viewportWidth)) {
                screen = tech.screenWidth ? `${tech.screenWidth}x${tech.screenHeight}` : "Unknown";
                viewport = tech.viewportWidth ? `${tech.viewportWidth}x${tech.viewportHeight}` : "Unknown";
                language = tech.language || "Unknown";
                pixelRatio = tech.pixelRatio || tech.devicePixelRatio || 1;
                touchSupport = !!tech.touchSupport;
                cores = tech.cores || "Unknown";
                memory = tech.memory || "Unknown";
                colorScheme = tech.colorScheme || "Unknown";
                timezone = tech.timezone || "Unknown";
                
                // Network block
                if (tech.network) {
                    network = tech.network.effectiveType || "Unknown";
                    downlink = tech.network.downlink !== undefined ? tech.network.downlink : "Unknown";
                    rtt = tech.network.rtt !== undefined ? tech.network.rtt : "Unknown";
                } else {
                    network = tech.connectionType || "Unknown";
                    downlink = tech.connectionDownlink !== undefined ? tech.connectionDownlink : "Unknown";
                }

                // Feature capabilities
                capabilities.cookies = tech.cookiesEnabled !== undefined ? tech.cookiesEnabled : true;
                capabilities.js = tech.allowsJS !== undefined ? tech.allowsJS : true;
                capabilities.css = tech.allowsCSS !== undefined ? tech.allowsCSS : true;
                capabilities.images = tech.allowsImages !== undefined ? tech.allowsImages : true;

                if (tech.userAgent) rawUA = tech.userAgent;
                else if (tech.platform) rawUA = tech.platform; 
            }

            if (rawUA === "Unknown" && log.user_agent) rawUA = log.user_agent;

            // Tracking Aggregates
            if (p.data?.maxDepth && p.data.maxDepth > maxScroll) maxScroll = p.data.maxDepth;
            if (p.maxDepth && p.maxDepth > maxScroll) maxScroll = p.maxDepth;
            if (p.vitals?.lcp) { lcpSum += p.vitals.lcp; lcpCount++; }
            if (p.timeOnPage) timeOnPageSum += p.timeOnPage;

            // Smart Event Detection
            let rawAction = log.event_type;
            if (rawAction === 'event' || !rawAction) {
                rawAction = p.event || p.type || 'unknown';
            }
            
            // Push deep event data to timeline array
            timelineData.push({
                id: log.id,
                time: p.data?.breakStartedAt || p.data?.breakEndedAt || p.timestamp || p.serverTimestamp || log.created_at,
                action: rawAction,
                url: url,
                details: {
                    title: p.title,
                    referrer: p.referrer,
                    timing: p.timing,             
                    resources: p.resources,       
                    vitals: p.vitals,             
                    customData: p.customData,     
                    timeOnPage: p.timeOnPage,
                    errorCount: p.errorCount,
                    text: p.data?.text || p.data?.tagName || p.data?.action,
                    element: p.data?.element || p.data?.selector || p.data?.label,
                    value: p.data?.value,
                    x: p.data?.x || p.x,          
                    y: p.data?.y || p.y,          
                    threshold: p.data?.threshold,
                    maxDepth: p.data?.maxDepth || p.maxDepth,
                    durationMs: p.data?.durationMs,
                    key: p.data?.key || p.data?.code,
                    error: p.error || (rawAction === 'error' ? p : null)
                }
            });
        });

        const uaInfo = parseUserAgent(rawUA);
        const avgLcp = lcpCount > 0 ? Math.round(lcpSum / lcpCount) : null;
        
        const profile = {
            id: sessionId,
            ip: logs[0]?.ip_address || logs[0]?.p?.ip || 'Unknown',
            totalActions: logs.length,
            os: uaInfo.os,
            browser: uaInfo.browser,
            deviceType: uaInfo.device,
            screen: screen,
            viewport: viewport,
            pixelRatio: pixelRatio,
            touch: touchSupport,
            cores: cores,
            memory: memory,
            colorScheme: colorScheme,
            timezone: timezone,
            network: network,
            downlink: downlink,
            rtt: rtt,
            capabilities: capabilities,
            uniquePages: uniquePages.size,
            maxScroll: maxScroll,
            avgLcp: avgLcp,
            totalDurationSecs: timeOnPageSum > 0 ? (timeOnPageSum / 1000).toFixed(1) : 0
        };

        res.json({ success: true, profile: profile, timeline: timelineData });

    } catch (err) {
        console.error('Session Detail Error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
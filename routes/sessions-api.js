const express = require('express');
const router = express.Router();

// Middleware: require sessions analyst or super admin
function requirePermissions(req, res, next) {
    const user = req.session.user;
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

        if (!isSuperAdmin && !(user.role === 'analyst' && hasSessionsAccess)) {
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

// GET /api/sessions - Get the list of unique sessions for the sidebar
router.get('/', requirePermissions, async (req, res) => {
    try {
        const pool = req.app.get('pool');
        const [sessions] = await pool.query(`
            SELECT 
                COALESCE(payload->>'$.session', payload->>'$.sessionId') as session_id, 
                COUNT(*) as total_actions, 
                MIN(created_at) as start_time,
                MAX(created_at) as end_time,
                MAX(ip_address) as ip_address
            FROM activity_logs 
            WHERE COALESCE(payload->>'$.session', payload->>'$.sessionId') IS NOT NULL
            GROUP BY session_id 
            ORDER BY start_time DESC
        `);
        res.json({ success: true, data: sessions });
    } catch (err) {
        console.error('Session List Error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/sessions/:id - Get the detailed profile and timeline for one session
router.get('/:id', requirePermissions, async (req, res) => {
    try {
        const pool = req.app.get('pool');
        const sessionId = req.params.id.trim();

        const [logs] = await pool.query(
            `SELECT id, event_type, url, ip_address, user_agent, payload, created_at 
             FROM activity_logs 
             WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.session')) = ? 
                OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.sessionId')) = ?
             ORDER BY created_at ASC`,
            [sessionId, sessionId]
        );

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
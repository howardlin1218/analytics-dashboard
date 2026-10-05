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
                if (['pageview', 'page_exit'].includes(parsed.type)) {
                    return {
                        event_type: parsed.type,
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
            error: 'Access Denied: You do not have permission to view Performance data.' 
        });
    }

    next();
}

router.get('/', requirePermissions, async (req, res) => {
    try {
        const selectedSite = req.query.siteId;
        const { startDate, endDate } = req.query;

        let start = null;
        let end = null;
        if (startDate) {
            const parsedStart = new Date(startDate);
            if (!isNaN(parsedStart.getTime())) start = parsedStart;
        }
        if (endDate) {
            const parsedEnd = new Date(endDate);
            if (!isNaN(parsedEnd.getTime())) end = parsedEnd;
        }

        let dbRows = [];
        try {
            const pool = req.app.get('pool');
            const [rows] = await pool.query(
                'SELECT event_type, url, payload, created_at FROM activity_logs WHERE event_type IN ("pageview", "page_exit")'
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

        // Filter by date range if specified
        if (start || end) {
            filteredRows = filteredRows.filter(row => {
                let payload = {};
                try { payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {}); } catch(e) {}
                const ts = payload.serverTimestamp || payload.timestamp || row.created_at;
                if (!ts) return true;
                const d = new Date(ts);
                if (isNaN(d.getTime())) return true;
                if (start && d < start) return false;
                if (end && d > end) return false;
                return true;
            });
        }

        // --- PREPARE VARIABLES ---
        let totalLcp = 0, lcpCount = 0;
        let totalInp = 0, inpCount = 0;
        let totalCls = 0, clsCount = 0;

        // Chart Buckets (Load Time Distribution)
        const loadBuckets = { '< 1s': 0, '1s - 2s': 0, '2s - 3s': 0, '> 3s': 0 };
        
        // Per-Page Stats Table
        const pageStats = {};

        // --- PROCESS THE LOGS ---
        filteredRows.forEach(row => {
            let payload = {};
            try { payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {}); } 
            catch (e) { return; }

            let path = '/';
            if (row.url) {
                try { 
                    const parsedUrl = new URL(row.url);
                    path = parsedUrl.pathname + parsedUrl.search;
                } 
                catch (e) { path = row.url; }
            }

            if (!pageStats[path]) {
                pageStats[path] = { 
                    lcpSum: 0, lcpCount: 0, 
                    inpSum: 0, inpCount: 0, 
                    clsSum: 0, clsCount: 0 
                };
            }

            // 1. Build the Bar Chart (from pageview totalLoadTime)
            if (row.event_type === 'pageview' && payload.timing && payload.timing.totalLoadTime) {
                const loadMs = payload.timing.totalLoadTime;
                if (loadMs < 1000) loadBuckets['< 1s']++;
                else if (loadMs < 2000) loadBuckets['1s - 2s']++;
                else if (loadMs < 3000) loadBuckets['2s - 3s']++;
                else loadBuckets['> 3s']++;
            }

            // 2. Extract Web Vitals (from page_exit)
            if (payload.vitals) {
                if (payload.vitals.lcp !== null && payload.vitals.lcp !== undefined) {
                    totalLcp += payload.vitals.lcp;
                    lcpCount++;
                    pageStats[path].lcpSum += payload.vitals.lcp;
                    pageStats[path].lcpCount++;
                }
                if (payload.vitals.inp !== null && payload.vitals.inp !== undefined) {
                    totalInp += payload.vitals.inp;
                    inpCount++;
                    pageStats[path].inpSum += payload.vitals.inp;
                    pageStats[path].inpCount++;
                }
                if (payload.vitals.cls !== null && payload.vitals.cls !== undefined) {
                    totalCls += payload.vitals.cls;
                    clsCount++;
                    pageStats[path].clsSum += payload.vitals.cls;
                    pageStats[path].clsCount++;
                }
            }
        });

        // --- FORMAT DATA FOR FRONTEND ---

        const avgLcp = lcpCount ? Math.round(totalLcp / lcpCount) : 0;
        const avgInp = inpCount ? Math.round(totalInp / inpCount) : 0;
        const avgCls = clsCount ? Number((totalCls / clsCount).toFixed(3)) : 0;

        // Grading Logic (Based on official Google Web Vitals Thresholds)
        const getGrade = (val, okLimit, poorLimit) => {
            if (val <= okLimit) return { label: 'Good', color: '#28a745' }; // Green
            if (val <= poorLimit) return { label: 'Needs Work', color: '#ffc107' }; // Yellow
            return { label: 'Poor', color: '#dc3545' }; // Red
        };

        const lcpGrade = getGrade(avgLcp, 2500, 4000);
        const inpGrade = getGrade(avgInp, 200, 500);
        const clsGrade = getGrade(avgCls, 0.1, 0.25);

        // 1. Summary Cards (Now includes the label!)
        const vitals = [
            { metric: "LCP", value: `${avgLcp} ms`, status: lcpGrade.label, color: lcpGrade.color },
            { metric: "INP", value: `${avgInp} ms`, status: inpGrade.label, color: inpGrade.color },
            { metric: "CLS", value: avgCls, status: clsGrade.label, color: clsGrade.color }
        ];

        // 2. Bar Chart
        const chart = {
            labels: Object.keys(loadBuckets),
            values: Object.values(loadBuckets)
        };

        // 3. Per-Page Table
        const table = Object.keys(pageStats).map(path => {
            const stats = pageStats[path];
            return {
                page: path,
                lcp: stats.lcpCount ? Math.round(stats.lcpSum / stats.lcpCount) : 'N/A',
                inp: stats.inpCount ? Math.round(stats.inpSum / stats.inpCount) : 'N/A',
                cls: stats.clsCount ? Number((stats.clsSum / stats.clsCount).toFixed(3)) : 'N/A'
            };
        });

        res.json({ vitals, chart, table, success: true });

    } catch (err) {
        console.error("Performance API Error:", err);
        res.status(500).json({ error: "Failed to load performance data" });
    }
});

module.exports = router;
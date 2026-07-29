const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Middleware: require admin or owner role
function requirePermissions(req, res, next) {
    const { section } = req.body;
    const user = req.session.user;
    if (user.role === 'viewer') {
        return res.status(403).json({ 
            success: false, 
            error: 'You do not have permission to generate reports.' 
        });
    }
    const isSuperAdmin = user.role === 'super admin';
        
    // Handle permissions (ensure it's an array for .includes check)
    let perms = user.permission || [];
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch(e) { perms = []; }
    }

    const hasReportAccess = perms.includes(section);

    if (!isSuperAdmin && user.role !== 'guest' && !(user.role === 'analyst' && hasReportAccess)) {
        return res.status(403).json({ 
            success: false, 
            error: 'You do not have permission to generate reports.' 
        });
    }

    next();
}

function requirePermissionsDelete (req, res, next) {
    const user = req.session.user;
    if (user.role === 'viewer') {
        return res.status(403).json({ 
            success: false, 
            error: 'You do not have permission to delete reports.' 
        });
    }

    next();
}

// POST /api/reports/generate
router.post('/generate', requirePermissions, async (req, res) => {
    // Optional: Add your authentication check here to ensure only Analysts/Admins can generate
    // if (req.session?.user?.role === 'viewer') return res.status(403).json({ error: "Unauthorized" });

    const { section, comments, dataSnapshot } = req.body;
    
    // Fallback logic if you haven't fully hooked up session data yet
    const authorId = req.session?.user?.id || 1; 
    const authorName = req.session?.user?.username || 'System Analyst';

    try {
        const pool = req.app.get('pool');

        // 1. Build the HTML Template for the PDF
        let dataRows = '';

        // Helper function to turn "averageLcpLoad" into "Average Lcp Load"
        const formatKey = (key) => {
            return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        };

        if (dataSnapshot && typeof dataSnapshot === 'object') {
            for (const [key, value] of Object.entries(dataSnapshot)) {
                
                // NEW: Handle nested objects (like the 'metrics' payload from Performance)
                if (typeof value === 'object' && value !== null) {
                    dataRows += `
                        <tr>
                            <td colspan="2" style="background-color: #edf2f7; color: #2b6cb0; font-weight: bold;">
                                📊 ${formatKey(key)}
                            </td>
                        </tr>
                    `;
                    for (const [subKey, subValue] of Object.entries(value)) {
                        dataRows += `
                            <tr>
                                <td class="key-col" style="padding-left: 30px;">↳ ${formatKey(subKey)}</td>
                                <td class="val-col">${subValue}</td>
                            </tr>
                        `;
                    }
                } else {
                    // Standard flat key/value pairs
                    dataRows += `
                        <tr>
                            <td class="key-col"><strong>${formatKey(key)}</strong></td>
                            <td class="val-col">${value}</td>
                        </tr>
                    `;
                }
            }
        }

        // The HTML Template
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #2d3748; }
                    .header { border-bottom: 3px solid #3182ce; padding-bottom: 15px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #1a365d; text-transform: uppercase; letter-spacing: 1px; }
                    .header p { color: #718096; font-size: 0.95rem; margin-top: 8px; }
                    
                    h2 { color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 40px;}
                    
                    .comments-box { background: #f8fafc; padding: 20px; border-left: 5px solid #3182ce; font-size: 1.1rem; line-height: 1.6; color: #2d3748; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    th { background-color: #edf2f7; color: #4a5568; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
                    .key-col { width: 40%; background-color: #f7fafc; color: #4a5568; }
                    .val-col { font-family: monospace; font-size: 1.05rem; color: #2b6cb0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${section} Report</h1>
                    <p>Generated by: <strong>${authorName}</strong> | Date: ${new Date().toLocaleString()}</p>
                </div>

                <h2>Analyst Insights</h2>
                <div class="comments-box">
                    ${comments ? comments.replace(/\n/g, '<br>') : '<i>No analyst comments provided.</i>'}
                </div>

                <h2>Metric Snapshot</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Metric / Data Point</th>
                            <th>Recorded Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataRows || '<tr><td colspan="2">No data snapshot provided.</td></tr>'}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // 2. Launch Puppeteer (with strict flags for Ubuntu/Linux)
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        
        const page = await browser.newPage();
        
        // NEW: Fixed the timeout bug by using 'load' instead of 'networkidle0'
        await page.setContent(htmlContent, { waitUntil: 'load', timeout: 0 });
        
        // 3. Save the PDF to your public directory
        const fileName = `report_${section}_${Date.now()}.pdf`;
        const dirPath = path.join(__dirname, '../public_html/reports'); 
        
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        
        const filePath = path.join(dirPath, fileName);
        await page.pdf({ 
            path: filePath, 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20px', bottom: '20px' } 
        });
        await browser.close();

        // 4. Save Record to Database
        const fileUrl = `/reports/${fileName}`;
        const titleObj = `${section.charAt(0).toUpperCase() + section.slice(1)} Report - ${new Date().toLocaleDateString()}`;

        await pool.query(
            `INSERT INTO reports (title, section, author_id, comments, file_path) VALUES (?, ?, ?, ?, ?)`,
            [titleObj, section, authorId, comments, fileUrl]
        );

        res.json({ success: true, url: fileUrl, message: 'Report generated successfully.' });

    } catch (err) {
        console.error('Report Generation Error:', err);
        res.status(500).json({ success: false, error: 'Failed to generate report.' });
    }
});

// GET /api/reports - Fetch all saved reports for the dashboard
router.get('/', async (req, res) => {
    try {
        const pool = req.app.get('pool');
        if (!pool) return res.json({ success: true, data: [] });
        
        // Fetch reports. If you have a users table, you could JOIN it here to get the author's actual name.
        const [reports] = await pool.query(`
            SELECT id, title, section, author_id, comments, file_path, created_at 
            FROM reports 
            ORDER BY created_at DESC
        `);

        res.json({ success: true, data: reports });

    } catch (err) {
        console.error('Fetch Reports Error:', err.message);
        res.json({ success: true, data: [] });
    }
});

// DELETE /api/reports/:id
router.delete('/:id', requirePermissionsDelete, async (req, res) => {
    const reportId = req.params.id;
    const user = req.session?.user;
    try {
        const pool = req.app.get('pool');

        // 2. Fetch the report first to get the file path and section
        const [reports] = await pool.query('SELECT * FROM reports WHERE id = ?', [reportId]);
        
        if (reports.length === 0) {
            return res.status(404).json({ success: false, error: 'Report not found.' });
        }

        const report = reports[0];

        
        const isSuperAdmin = user.role === 'super admin';
            
        // Handle permissions (ensure it's an array for .includes check)
        let perms = user.permission || [];
        if (typeof perms === 'string') {
            try { perms = JSON.parse(perms); } catch(e) { perms = []; }
        }

        const hasReportAccess = perms.includes(report.section);

        if (!isSuperAdmin && !(user.role === 'analyst' && hasReportAccess)) {
            return res.status(403).json({ 
                success: false, 
                error: 'You do not have permission to delete this report.' 
            });
        }

        // 4. Delete the physical PDF file from the server
        const fileName = path.basename(report.file_path);
        const filePath = path.join(__dirname, '../public_html/reports', fileName);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // This permanently deletes the PDF file from the disk
        }

        // 5. Delete the database record
        await pool.query('DELETE FROM reports WHERE id = ?', [reportId]);

        res.json({ success: true, message: 'Report deleted successfully.' });

    } catch (err) {
        console.error('Delete Report Error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete report.' });
    }
});
module.exports = router;
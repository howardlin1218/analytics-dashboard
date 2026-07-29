(function() {
    'use strict';

    const localDev = "http://localhost:3006";

    // DOM elements and state
    const viewport = document.getElementById('app-viewport');
    const username = document.getElementById('user-display-name');

    // nav bar state
    const navOverview = document.getElementById('nav-overview');
    const navPerformance = document.getElementById('nav-performance');
    const navErrors = document.getElementById('nav-errors');
    const navAdmin = document.getElementById('nav-admin');
    const navSessions = document.getElementById('nav-sessions');
    const navReports = document.getElementById('nav-reports');
    
    // starts at overview
    navOverview.classList.add('nav-link-active');
    let lastActiveNav = navOverview;

    let currentUser = null;
    window.activeCharts = []; // Global chart registry

    const siteSelector = document.getElementById('site-selector');
    const customDropdownTrigger = document.getElementById('custom-dropdown-trigger');
    const customDropdownMenu = document.getElementById('custom-dropdown-menu');
    const customDropdownSelected = document.getElementById('custom-dropdown-selected');

    function getSelectedSite() {
        return siteSelector ? siteSelector.value : 'all';
    }

    function setSelectedSite(value, labelText) {
        if (siteSelector) {
            siteSelector.value = value;
            localStorage.setItem('_dashboard_selected_site', value);
        }
        if (customDropdownSelected) {
            customDropdownSelected.innerText = labelText || (value === 'all' ? 'All Sites' : value);
        }
        updateCustomDropdownSelectedState(value);
    }

    function updateCustomDropdownSelectedState(selectedVal) {
        if (!customDropdownMenu) return;
        const items = customDropdownMenu.querySelectorAll('.custom-dropdown-item');
        items.forEach(item => {
            const val = item.getAttribute('data-value');
            const label = item.getAttribute('data-label');
            if (val === selectedVal) {
                item.classList.add('selected');
                item.innerHTML = `<span>${label}</span><span class="check-icon">✓</span>`;
            } else {
                item.classList.remove('selected');
                item.innerHTML = `<span>${label}</span>`;
            }
        });
    }

    function renderCustomDropdown(sitesList, selectedVal) {
        if (!customDropdownMenu) return;
        customDropdownMenu.innerHTML = sitesList.map(s => {
            const label = s === 'all' ? 'All Sites' : s;
            const isSel = s === selectedVal;
            return `<div class="custom-dropdown-item ${isSel ? 'selected' : ''}" data-value="${s}" data-label="${label}">
                <span>${label}</span>
                ${isSel ? '<span class="check-icon">✓</span>' : ''}
            </div>`;
        }).join('');

        setSelectedSite(selectedVal, selectedVal === 'all' ? 'All Sites' : selectedVal);

        const items = customDropdownMenu.querySelectorAll('.custom-dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = item.getAttribute('data-value');
                const label = item.getAttribute('data-label');
                setSelectedSite(val, label);
                closeCustomDropdown();
                router();
            });
        });
    }

    function toggleCustomDropdown() {
        if (!customDropdownMenu || !customDropdownTrigger) return;
        const isOpen = customDropdownMenu.classList.contains('show');
        if (isOpen) {
            closeCustomDropdown();
        } else {
            customDropdownMenu.classList.add('show');
            customDropdownTrigger.classList.add('active');
            customDropdownTrigger.setAttribute('aria-expanded', 'true');
        }
    }

    function closeCustomDropdown() {
        if (customDropdownMenu) customDropdownMenu.classList.remove('show');
        if (customDropdownTrigger) {
            customDropdownTrigger.classList.remove('active');
            customDropdownTrigger.setAttribute('aria-expanded', 'false');
        }
    }

    if (customDropdownTrigger) {
        customDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCustomDropdown();
        });
    }

    document.addEventListener('click', (e) => {
        if (customDropdownMenu && !customDropdownMenu.contains(e.target) && customDropdownTrigger && !customDropdownTrigger.contains(e.target)) {
            closeCustomDropdown();
        }
    });

    function buildApiUrl(endpointPath) {
        const site = getSelectedSite();
        const url = new URL(localDev + endpointPath);
        if (site && site !== 'all') {
            url.searchParams.set('siteId', site);
        }
        return url.toString();
    }

    async function loadSites() {
        try {
            const res = await fetch(localDev + '/api/overview/sites', { credentials: 'include' });
            const data = await res.json();
            if (data.success && Array.isArray(data.sites)) {
                const savedSite = localStorage.getItem('_dashboard_selected_site') || 'all';
                const sitesList = ['all', ...data.sites];

                if (siteSelector) {
                    siteSelector.innerHTML = sitesList.map(s => `<option value="${s}">${s === 'all' ? 'All Sites' : s}</option>`).join('');
                    siteSelector.value = sitesList.includes(savedSite) ? savedSite : 'all';
                }

                renderCustomDropdown(sitesList, siteSelector ? siteSelector.value : 'all');
            }
        } catch (err) {
            console.error("Failed to load site selector options", err);
        }
    }

    // initial login authentication
    async function initApp() {
        try {
            const res = await fetch(localDev+'/api/dashboard', { credentials: 'include' });
            console.log(localDev+'/api/dashboard');
            if (res.status === 401) {
                window.location.href = 'http://localhost:5502/public_html/login.html';
                return;
            }

            const data = await res.json();
            currentUser = data.user; 
            if (currentUser) {
                if (currentUser.role === 'guest') {
                    username.innerText = "guest";
                } else {
                    username.innerText = currentUser.displayName + " | " + currentUser.role;
                    if (currentUser.role == "super admin") {
                        username.style.setProperty('--role-color', '#1e8449' );
                    } else if (currentUser.role == "analyst") {
                        username.style.setProperty('--role-color', '#b45309');
                        username.innerText += " (" + currentUser.permission.join(', ') + ")";
                    }
                }
            }

            setupGlobalListeners();
            await loadSites();
            router(); // Start the app

        } catch (err) {
            window.location.href = 'http://localhost:5502/public_html/login.html';
        }
    }
    
    // hash routing
    const routes = {
        '#/overview': overviewView,
        '#/performance': performanceView,
        '#/errors': errorsView,
        '#/sessions': sessionsView,
        '#/reports': reportsView,
        '#/admin': renderAdmin
    };

    function clearCharts() {
        activeCharts.forEach(chart => chart.destroy());
        activeCharts = [];
    }

    function router() {
        clearCharts(); // Destroy old charts to prevent Canvas crashes
        
        let hash = window.location.hash || '#/overview'; 
        const viewFunction = routes[hash] || routes['#/overview'];
        viewFunction();
    }

    // ==========================================
    // overview view section
    // ==========================================
    async function overviewView() {

        lastActiveNav.classList.remove('nav-link-active');
        navOverview.classList.add('nav-link-active');
        lastActiveNav = navOverview;

        if (currentUser.role !== "super admin" && currentUser.role.trim().toLowerCase() !== 'analyst' && currentUser.role !== 'guest') {
            viewport.innerHTML = `
            <div class="access-denied-container">
                <div class="lock-icon">🔒</div>
                <h2>Access Restricted</h2>
                <p>You don't have the required permissions to view this section.</p>
                <div class="permission-tag">
                    <span>Required:</span> <strong>Super Admin, Analyst</strong>
                </div>
                <button onclick="window.location.hash = '#/overview'" class="back-btn">Return to Overview</button>
            </div>`;

            return;
        }

        viewport.innerHTML = `
            <h2 class="dashboard-header"> Overview </h2>
            <div class="summary-cards" id="overview-cards">Loading metrics...</div>
            <div class="chart-container"><canvas id="pageviewsChart"></canvas></div>
            <div class="card top-pages-card">
                <h2>Top Pages</h2>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Path</th><th>Views</th><th>Unique Visitors</th></tr></thead>
                        <tbody id="top-pages-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const res = await fetch(buildApiUrl('/api/overview'), { credentials: 'include' });
            const data = await res.json();

            const cardsHtml = data.cards.map(c => `
                <div class="summary-card"><h3>${c.title}</h3><div class="value">${c.value}</div></div>
            `).join('');
            document.getElementById('overview-cards').innerHTML = cardsHtml;

            const ctx = document.getElementById('pageviewsChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.chart.labels,
                    datasets: [{
                        label: 'Pageviews', data: data.chart.values, 
                        borderColor: '#2E86C1', tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Pageviews/Day' // Main Chart Title
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date' // Label for the horizontal axis
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Number of Views' // Label for the vertical axis
                            },
                            beginAtZero: true
                        }
                    }
                }

            });
            window.activeCharts.push(chart);

            const tbody = document.getElementById('top-pages-tbody');
            data.table.forEach(row => {
                tbody.innerHTML += `<tr><td>${row.path}</td><td>${row.views}</td><td>${row.unique}</td></tr>`;
            });
        } catch (err) { console.error("Failed to load Overview", err); }
    }

    // ==========================================
    // performance view section
    // ==========================================
    async function performanceView() {
        lastActiveNav.classList.remove('nav-link-active');
        navPerformance.classList.add('nav-link-active');
        lastActiveNav = navPerformance;
        
        if (currentUser.role !== "super admin" && currentUser.role !== 'guest' && !currentUser.permission.includes('performance')) {
            viewport.innerHTML = `
            <div class="access-denied-container">
                <div class="lock-icon">🔒</div>
                <h2>Access Restricted</h2>
                <p>You don't have the required permissions to view this section.</p>
                <div class="permission-tag">
                    <span>Required:</span> <strong>Super Admin, Performance Analyst</strong>
                </div>
                <button onclick="window.location.hash = '#/overview'" class="back-btn">Return to Overview</button>
            </div>`;
            return;
        }

        // 1. Added sortable classes, data-sort attributes, and icons to the table headers
        viewport.innerHTML = `
            <h2 class="dashboard-header">Web Vitals</h2>

            <div class="report-btn-wrapper"> 
                <button onclick="openReportModal('performance')" class="btn-primary">
                    📈 Generate Performance Report
                </button>
            </div>

            <div class="summary-cards" id="vitals-gauges">Loading vitals...</div>
            <div class="chart-container"><canvas id="perfBarChart"></canvas></div>
            <div class="card top-pages-card">
                <h2>Per-Page Performance (sortable)</h2>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th class="sortable" data-sort="page">Page <span class="sort-icon"></span></th>
                                <th class="sortable" data-sort="lcp">LCP (ms) <span class="sort-icon"></span></th>
                                <th class="sortable" data-sort="inp">INP (ms) <span class="sort-icon"></span></th>
                                <th class="sortable" data-sort="cls">CLS <span class="sort-icon"></span></th>
                            </tr>
                        </thead>
                        <tbody id="perf-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const res = await fetch(buildApiUrl('/api/performance'), { credentials: 'include' });
            const data = await res.json();

            // Inject the summary cards with the Good/OK/Poor status pill
            document.getElementById('vitals-gauges').innerHTML = data.vitals.map(v => `
                <div class="summary-card" style="border-top: 4px solid ${v.color};">
                    <h3>${v.metric}</h3>
                    <div class="value" style="color:${v.color}">${v.value}</div>
                    <div style="margin-top: 8px; font-size: 0.85em; font-weight: bold; background: #f0f2f5; padding: 4px 8px; border-radius: 12px; display: inline-block; color: #555;">
                        ${v.status}
                    </div>
                </div>
            `).join('');

            // Render the Bar Chart
            const ctx = document.getElementById('perfBarChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.chart.labels,
                    datasets: [{
                        label: 'Load Time (ms)', data: data.chart.values, backgroundColor: '#2E86C1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true, // <-- Crucial for bar charts
                            title: {
                                display: true,
                                text: 'Time (ms)' // Makes the unit clear
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Page / Date'
                            }
                        }
                    }
                }
            });
            window.activeCharts.push(chart);
            
            // --- NEW SORTING LOGIC ---
            let tableData = data.table;
            let currentSort = { column: 'lcp', direction: 'desc' }; // Default to worst LCP first

            const renderTable = () => {
                const tbody = document.getElementById('perf-tbody');
                tbody.innerHTML = tableData.map(row => 
                    `<tr><td>${row.page}</td><td>${row.lcp}</td><td>${row.inp}</td><td>${row.cls}</td></tr>`
                ).join('');
            };

            const handleSort = (column) => {
                if (currentSort.column === column) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = column;
                    currentSort.direction = 'desc'; // Default new selections to descending (worst first)
                }

                tableData.sort((a, b) => {
                    let valA = a[column];
                    let valB = b[column];

                    // If sorting by Page (String), convert to lowercase for accurate alphabetizing
                    if (column === 'page') {
                        valA = typeof valA === 'string' ? valA.toLowerCase() : '';
                        valB = typeof valB === 'string' ? valB.toLowerCase() : '';
                    } else {
                        // If sorting metrics, force them into Floats so "900" doesn't beat "1200"
                        valA = parseFloat(valA) || 0;
                        valB = parseFloat(valB) || 0;
                    }

                    if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
                    return 0;
                });

                // Update UI Icons
                document.querySelectorAll('.top-pages-card th.sortable').forEach(th => {
                    th.classList.remove('sort-asc', 'sort-desc');
                    if (th.dataset.sort === column) {
                        th.classList.add(`sort-${currentSort.direction}`);
                    }
                });

                renderTable();
            };

            // Attach Event Listeners
            document.querySelectorAll('.top-pages-card th.sortable').forEach(th => {
                th.addEventListener('click', () => handleSort(th.dataset.sort));
            });

            // Trigger initial sort
            handleSort('lcp');

        } catch (err) { 
            console.error("Failed to load Performance", err); 
        }
    }
    // ==========================================
    // errors view section
    // ==========================================
    function scrollIfNeeded(targetElement) {
        // 1. Create a sensor to check visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // isIntersecting is false if the element is hidden out of view
                if (entry.intersectionRatio < 1.0) {
                    // 2. Only scroll if it's NOT in view
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end'
                    });
                }
            });
            
            // 3. Stop observing immediately so it doesn't loop forever
            observer.disconnect();
        });

        // Start the check
        observer.observe(targetElement);
}

    async function errorsView() {
        lastActiveNav.classList.remove('nav-link-active');
        navErrors.classList.add('nav-link-active');
        lastActiveNav = navErrors;

        if (currentUser.role !== "super admin" && currentUser.role !== 'guest' && !currentUser.permission.includes('errors')) {
            viewport.innerHTML = `
            <div class="access-denied-container">
                <div class="lock-icon">🔒</div>
                <h2>Access Restricted</h2>
                <p>You don't have the required permissions to view this section.</p>
                <div class="permission-tag">
                    <span>Required:</span> <strong>Super Admin, Errors Analyst</strong>
                </div>
                <button onclick="window.location.hash = '#/overview'" class="back-btn">Return to Overview</button>
            </div>`;

            return;
        }

        viewport.innerHTML = `
            <h2 class="dashboard-header">Error Tracking</h2>
            <div class="report-btn-wrapper"> 
                <button onclick="openReportModal('errors')" class="btn-primary">
                    🚨 Generate Errors Report
                </button>
            </div>
            
            <div class="chart-container"><canvas id="errorTrendChart"></canvas></div>
            <div class="card top-pages-card">
                <h2>Recent Errors (Click for details)</h2>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Time</th><th>Type</th><th>Message</th><th>Count</th></tr></thead>
                        <tbody id="error-tbody"></tbody>
                    </table>
                </div>
                <div id="stack-trace-panel">Select an error to view stack trace.</div>
            </div>
        `;

        try {
            const res = await fetch(buildApiUrl('/api/errors'), { credentials: 'include' });
            const data = await res.json();

            const ctx = document.getElementById('errorTrendChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.chart.labels,
                    datasets: [{
                        label: 'Errors over time', data: data.chart.values, 
                        borderColor: '#c0392b', backgroundColor: 'rgba(192, 57, 43, 0.2)', fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true // Guarantees a baseline of 0 errors
                        }
                    }
                }
            });
            window.activeCharts.push(chart);

            const tbody = document.getElementById('error-tbody');
            const stackPanel = document.getElementById('stack-trace-panel');

            data.table.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.time}</td><td>${row.type}</td><td>${row.message}</td><td>${row.count}</td>`;
                
                tr.addEventListener('click', () => {
                    stackPanel.style.display = 'block';
                    stackPanel.textContent = row.stackTrace || "No stack trace available.";

                    scrollIfNeeded(stackPanel);
                });
                tbody.appendChild(tr);
            });
        } catch (err) { console.error("Failed to load Errors", err); }
    }


    // ==========================================
    // sessions view section
    // ==========================================
    async function sessionsView() {
        // Nav handling (assuming these variables exist in your global scope)
        lastActiveNav.classList.remove('nav-link-active');
        navSessions.classList.add('nav-link-active');
        lastActiveNav = navSessions;

        if (currentUser.role !== "super admin" && currentUser.role !== 'guest' && !currentUser.permission.includes('sessions')) {
            viewport.innerHTML = `
            <div class="access-denied-container">
                <div class="lock-icon">🔒</div>
                <h2>Access Restricted</h2>
                <p>You don't have the required permissions to view this section.</p>
                <div class="permission-tag">
                    <span>Required:</span> <strong>Super Admin, Sessions Analyst</strong>
                </div>
                <button onclick="window.location.hash = '#/overview'" class="back-btn">Return to Overview</button>
            </div>`;

            return;
        }

        // Inject Skeleton Layout
        viewport.innerHTML = `
            <h2 class="dashboard-header">User Sessions (Tracer)</h2>
            <div class="report-btn-wrapper"> 
                <button onclick="openReportModal('sessions')" class="btn-primary">
                    👥 Generate Sessions Report
                </button>
            </div>

            <div class="session-tracer-layout">
                <div class="session-list" id="session-list">
                    <div class="loading-text">Loading sessions...</div>
                </div>
                <div class="session-timeline" id="timeline-view">
                    <div class="placeholder-state">
                        <span class="icon">🔍</span>
                        <p>Select a session from the left to trace the user's journey.</p>
                    </div>
                </div>
            </div>
        `;

        // Fetch Sessions List
        try {
            const response = await fetch(buildApiUrl('/api/sessions'), { credentials: 'include' });
            const data = await response.json();

            const listContainer = document.getElementById('session-list');
            
            if (data.data.length === 0) {
                listContainer.innerHTML = `<div class="loading-text">No session data found.</div>`;
                return;
            }

            // Render Sidebar Items
            listContainer.innerHTML = data.data.map(session => {
                const date = new Date(session.start_time).toLocaleString();
                const shortId = session.session_id.substring(0, 8) + '...'; 

                return `
                    <div class="session-card" onclick="loadSessionTimeline('${session.session_id}', this)">
                        <div class="session-card-header">
                            <strong>ID: ${shortId}</strong>
                            <span class="badge">${session.total_actions} actions</span>
                        </div>
                        <div class="session-card-date">${date}</div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            document.getElementById('session-list').innerHTML = `<div class="error-text">Failed to load sessions.</div>`;
        }
    }


    // hepler function to fetch and render the timeline for a specific session
    window.loadSessionTimeline = async function(sessionId, cardElement) {
        // Highlight selected card
        document.querySelectorAll('.session-card').forEach(el => el.classList.remove('active'));
        if (cardElement) cardElement.classList.add('active');

        const timelineContainer = document.getElementById('timeline-view');
        timelineContainer.innerHTML = `<div class="loading-text">Loading User Profile...</div>`;

        try {
            const response = await fetch(`${localDev}/api/sessions/${sessionId}`, { credentials: 'include' });
            const data = await response.json();
            
            if (!data.success) throw new Error(data.error);
            if (!data.profile) {
                timelineContainer.innerHTML = `<div class="text-muted">No data found for this session.</div>`;
                return;
            }

            const { profile, timeline } = data;

            // --- RENDER HEADER CARD ---
            const lcpDisplay = profile.avgLcp ? `${profile.avgLcp}ms` : 'N/A';
            const lcpColor = profile.avgLcp > 2500 ? 'text-danger' : 'text-success';
            const deviceIcon = profile.deviceType === 'Mobile' ? '📱' : '💻';
            const durationDisplay = profile.totalDurationSecs > 0 ? `${profile.totalDurationSecs}s` : 'N/A';
            
            const capHTML = `
                ${profile.capabilities.js ? `<span class="tag bg-green">JS</span>` : `<span class="tag bg-red">No JS</span>`}
                ${profile.capabilities.cookies ? `<span class="tag bg-green">Cookies</span>` : `<span class="tag bg-red">No Cookies</span>`}
                ${!profile.capabilities.images ? `<span class="tag bg-red">No Img</span>` : ''}
            `;

            const hwDisplay = profile.cores !== 'Unknown' ? `${profile.cores} Cores / ${profile.memory}GB RAM` : 'Unknown';
            const netDisplay = profile.network !== 'Unknown' ? `${profile.network.toUpperCase()} (${profile.downlink}Mbps, ${profile.rtt}ms)` : 'Unknown';

            const profileHTML = `
                <div class="session-profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar">${deviceIcon}</div>
                        <div class="profile-title">
                            <h3>Session: ${profile.id}</h3>
                            <p class="text-muted">IP: <strong>${profile.ip}</strong> • Duration: <strong>${durationDisplay}</strong> • ${profile.totalActions} actions</p>
                            <div style="margin-top: 5px;">${capHTML}</div>
                        </div>
                    </div>
                    <div class="profile-stats-grid">
                        <div class="stat-box"><span class="label">OS / Platform</span><span class="val">${profile.os}</span></div>
                        <div class="stat-box"><span class="label">Browser</span><span class="val">${profile.browser}</span></div>
                        <div class="stat-box"><span class="label">Hardware</span><span class="val">${hwDisplay}</span></div>
                        <div class="stat-box"><span class="label">Screen Res</span><span class="val">${profile.screen} <small>(@${profile.pixelRatio}x)</small></span></div>
                        <div class="stat-box"><span class="label">Viewport</span><span class="val">${profile.viewport}</span></div>
                        <div class="stat-box"><span class="label">Timezone</span><span class="val" title="${profile.timezone}">${profile.timezone.split('/')[1]?.replace('_',' ') || profile.timezone}</span></div>
                        <div class="stat-box"><span class="label">Theme</span><span class="val" style="text-transform:capitalize;">${profile.colorScheme}</span></div>
                        <div class="stat-box"><span class="label">Connection</span><span class="val">${netDisplay}</span></div>
                        <div class="stat-box"><span class="label">Language</span><span class="val">${profile.language}</span></div>
                        <div class="stat-box"><span class="label">Unique Pages</span><span class="val">${profile.uniquePages}</span></div>
                        <div class="stat-box"><span class="label">Max Scroll</span><span class="val">${profile.maxScroll}%</span></div>
                        <div class="stat-box"><span class="label">Avg LCP Load</span><span class="val ${lcpColor}">${lcpDisplay}</span></div>
                    </div>
                </div>
            `;

            // --- RENDER TIMELINE ---
            const timelineHTML = timeline.map((e) => {
                const timeObj = new Date(e.time);
                const timeStr = isNaN(timeObj) ? 'Unknown Time' : timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                const d = e.details;
                
                // Micro-Events
                if (e.action === 'mousemove') return `<div class="timeline-micro-event" title="Mouse Moved to X:${d.x}, Y:${d.y} at ${timeStr}"></div>`;
                if (e.action === 'heartbeat') return `<div class="timeline-micro-event heartbeat" title="Heartbeat Ping at ${timeStr}"></div>`;

                let detailsHTML = '';

                // Custom Data Badges
                let customTags = '';
                if (d.customData) {
                    customTags = Object.entries(d.customData).map(([key, val]) => 
                        `<span class="tag bg-purple" style="margin-top:8px; display:inline-block;">${key}: ${val}</span>`
                    ).join(' ');
                }

                // Macro-Events
                if (e.action === 'pageview') {
                    let metricsHTML = '';
                    if (d.timing) {
                        metricsHTML += `
                            <div class="metrics-grid" style="margin-top: 8px;">
                                ${d.timing.ttfb !== undefined ? `<div class="metric-box"><div class="metric-label">TTFB</div><div class="metric-value">${d.timing.ttfb.toFixed(1)}ms</div></div>` : ''}
                                ${d.timing.domInteractive !== undefined ? `<div class="metric-box"><div class="metric-label">DOM Ready</div><div class="metric-value">${d.timing.domInteractive.toFixed(1)}ms</div></div>` : ''}
                                ${d.timing.totalLoadTime !== undefined ? `<div class="metric-box"><div class="metric-label">Total Load</div><div class="metric-value">${d.timing.totalLoadTime.toFixed(1)}ms</div></div>` : ''}
                            </div>
                        `;
                    }
                    const refHTML = d.referrer ? `<div class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">Referrer: ${d.referrer}</div>` : '';
                    detailsHTML = `<div class="event-details"><span class="tag bg-blue">Page Loaded</span> ${d.title ? `<strong>${d.title}</strong>` : ''} ${refHTML} ${metricsHTML} <br>${customTags}</div>`;
                } 
                else if (e.action === 'page_exit' || e.action === 'pagehide') {
                    const secs = d.timeOnPage ? (d.timeOnPage / 1000).toFixed(1) + 's' : '';
                    detailsHTML = `<div class="event-details text-muted">Left page. Session duration: <strong>${secs}</strong>. Errors caught: ${d.errorCount || 0} <br>${customTags}</div>`;
                }
                else if (e.action === 'click') {
                    detailsHTML = `<div class="event-details click-box">🖱️ Clicked: <strong>"${d.text || 'Element'}"</strong> <br><code>${d.element || ''}</code> <small class="text-muted">(X:${d.x}, Y:${d.y})</small> <br>${customTags}</div>`;
                }
                else if (e.action === 'scroll_depth') {
                    detailsHTML = `<div class="event-details text-muted">📜 Scrolled past <strong>${d.threshold}%</strong> <small>(Max: ${d.maxDepth}%)</small></div>`;
                }
                else if (e.action === 'scroll_final') {
                    detailsHTML = `<div class="event-details text-muted">🛑 Final scroll depth before exit: <strong>${d.maxDepth}%</strong></div>`;
                }
                else if (e.action === 'idle_break_start') {
                    detailsHTML = `<div class="event-details idle-box text-muted">⏸️ User went idle... <br>${customTags}</div>`;
                }
                else if (e.action === 'idle_break_end') {
                    const idleSecs = d.durationMs ? (d.durationMs / 1000).toFixed(1) : 0;
                    detailsHTML = `<div class="event-details idle-box">▶️ User resumed after <strong>${idleSecs}s</strong> <br>${customTags}</div>`;
                }
                else if (e.action === 'keydown' || e.action === 'keyup') {
                    detailsHTML = `<div class="event-details">⌨️ Key pressed: <strong>${d.key}</strong></div>`;
                }
                else if (e.action === 'custom') {
                    detailsHTML = `<div class="event-details"><span class="tag bg-purple">Custom Action</span> <strong>${d.text}</strong>: ${d.element} (Value: ${d.value}) <br>${customTags}</div>`;
                }
                else if (e.action === 'noscript') {
                    detailsHTML = `<div class="event-details error-box">🚨 User loaded page with JavaScript DISABLED!</div>`;
                }
                else if (e.action === 'error' && d.error) {
                    detailsHTML = `
                        <div class="event-details error-box">
                            <div class="error-message">🚨 ${d.error.message || 'Unknown Error'}</div>
                            <div class="text-muted" style="font-size:0.75rem;">Source: ${d.error?.source || 'Unknown'} (Line ${d.error?.line || 'N/A'}, Col ${d.error?.column || 'N/A'})</div>
                            ${d.error.stack ? `<pre class="error-stack">${d.error.stack}</pre>` : ''}
                            <br>${customTags}
                        </div>
                    `;
                }

                return `
                    <div class="timeline-item">
                        <div class="timeline-marker type-${e.action.replace(/_/g, '-')}"></div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <span class="event-type">${e.action.replace(/_/g, ' ').toUpperCase()}</span>
                                <span class="event-time">${timeStr}</span>
                            </div>
                            <div class="event-url">${e.url}</div>
                            ${detailsHTML}
                        </div>
                    </div>
                `;
            }).join('');

            timelineContainer.innerHTML = profileHTML + `
                <div class="timeline-container-header">
                    <h4>Chronological Journey</h4>
                </div>
                <div class="timeline-track">
                    ${timelineHTML}
                </div>
            `;

        } catch (error) {
            timelineContainer.innerHTML = `<div class="error-text">Failed to load timeline details: ${error.message}</div>`;
        }
    }

    // ==========================================
    // reports view section
    // ==========================================
    async function reportsView() {
        // Nav handling (Update these variables to match your actual nav menu)
        lastActiveNav.classList.remove('nav-link-active');
        navReports.classList.add('nav-link-active');
        lastActiveNav = navReports;

        // Inject Skeleton Layout
        viewport.innerHTML = `
            <div class="header-actions">
                <h2 class="dashboard-header">Saved Reports</h2>
                <p class="text-muted">Downloadable PDF reports featuring data snapshots and analyst insights.</p>
            </div>
            <div id="reports-container">
                <div class="loading-text" style="margin-top: 20px;">Loading reports...</div>
            </div>
        `;

        try {
            const response = await fetch(localDev+'/api/reports');
            const data = await response.json();

            if (!data.success) throw new Error(data.error || 'Failed to fetch');

            const container = document.getElementById('reports-container');

            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="placeholder-state" style="margin-top: 40px; text-align: center; padding: 40px; background: white; border-radius: 8px; border: 1px dashed #cbd5e0;">
                        <span style="font-size: 3rem;">📁­</span>
                        <h3 style="color: #4a5568;">No Reports Found</h3>
                        <p class="text-muted">Analysts have not generated any reports yet.</p>
                    </div>
                `;
                return;
            }

            // Map the data to the HTML Grid
            const gridHTML = data.data.map(report => {
                const dateStr = new Date(report.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });

                // Set a specific icon based on the section
                let icon = '📁';
                if (report.section === 'performance') icon = '📁';
                if (report.section === 'errors') icon = '🚨';
                if (report.section === 'sessions') icon = '👥';

                // Clean up the comments for the preview snippet
                const commentPreview = report.comments ? report.comments : '<i>No analyst comments included.</i>';

                return `
                    <div class="report-card">
                        <div class="report-header">
                            <div>
                                <h3 class="report-title">${report.title}</h3>
                                <div class="report-meta">Generated: ${dateStr}</div>
                            </div>
                            <div class="report-icon">${icon}</div>
                        </div>
                        
                        <div class="report-comments" title="Analyst Context">
                            ${commentPreview}
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
                            <a href="http://localhost:5502/public_html${report.file_path}" target="_blank" class="btn-download" style="text-align: center;">
                                ⬇️ View / Download PDF
                            </a>
                            <button onclick="deleteReport(${report.id})" class="btn-delete-report">
                                🗑️ Delete Report
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `<div class="reports-grid">${gridHTML}</div>`;

        } catch (error) {
            console.error(error);
            document.getElementById('reports-container').innerHTML = `
                <div class="error-text" style="margin-top:20px;">
                    🚨 Failed to load the reports library. Please try again later.
                </div>
            `;
        }
    }

    let currentReportSection = '';

    window.openReportModal = function(section) {
        const commentsBox = document.getElementById('report-comments');
        const modalOverlay = document.getElementById('report-modal');

        // 1. The Safety Check! 
        // If it can't find the elements, print a warning instead of crashing the app.
        if (!commentsBox || !modalOverlay) {
            console.warn("⚠️ Warning: Could not find the modal HTML on the page. Check your dashboard.html!");
            return; 
        }

        // 2. If it makes it here, the elements exist, and it is 100% safe to proceed.
        currentReportSection = section; 
        commentsBox.value = ''; 
        modalOverlay.classList.toggle('active');
    }

    window.closeReportModal = function() {
        document.getElementById('report-modal').classList.toggle('active');
    }

    window.submitReport = async function() {
        const comments = document.getElementById('report-comments').value;
        const btn = document.getElementById('btn-generate-report');
        
        // 1. Gather Section-Specific Data via DOM Scraping
        let currentData = {};

        if (currentReportSection === 'sessions') {
            const activeSessionCard = document.querySelector('.session-profile-card');
            
            if (activeSessionCard) {
                // A specific user session is actively selected
                const sessionIdObj = document.querySelector('.profile-title h3');
                const metaObj = document.querySelector('.profile-title p');
                
                // Scrape all the hardware/environment stat boxes dynamically
                const stats = {};
                document.querySelectorAll('.profile-stats-grid .stat-box').forEach(box => {
                    const label = box.querySelector('.label')?.innerText.trim() || 'Stat';
                    const val = box.querySelector('.val')?.innerText.trim() || 'N/A';
                    stats[label] = val;
                });

                // Count specific events from the timeline
                const eventSummary = {
                    totalTimelineEvents: document.querySelectorAll('.timeline-item').length,
                    pageviews: document.querySelectorAll('.timeline-marker.type-pageview').length,
                    clicks: document.querySelectorAll('.timeline-marker.type-click').length,
                    errors: document.querySelectorAll('.timeline-marker.type-error, .timeline-marker.type-noscript').length
                };

                currentData = {
                    reportType: "Deep Dive User Trace",
                    targetSession: sessionIdObj ? sessionIdObj.innerText.replace('Session: ', '') : 'Unknown',
                    sessionMeta: metaObj ? metaObj.innerText : 'No metadata',
                    hardwareAndEnvironment: Object.keys(stats).length ? stats : "No hardware data available",
                    timelineSummary: eventSummary
                };

            } else {
                // no session selected, looking at the general list
                const sessionCards = document.querySelectorAll('.session-card');
                const listSummary = {};
                
                // Grab the top 5 most recent sessions from the sidebar
                sessionCards.forEach((card, index) => {
                    if(index < 5) {
                        const header = card.querySelector('.session-card-header strong')?.innerText || 'Unknown ID';
                        const badge = card.querySelector('.badge')?.innerText || '0 actions';
                        const date = card.querySelector('.session-card-date')?.innerText || 'Unknown time';
                        listSummary[`Recent Session ${index + 1}`] = `${header} - ${date} (${badge})`;
                    }
                });

                currentData = {
                    reportType: "Sessions Overview",
                    totalAvailableSessions: sessionCards.length,
                    latestActivity: Object.keys(listSummary).length ? listSummary : "No sessions logged yet"
                };
            }
        } 
        else if (currentReportSection === 'performance') {
            // Scrape the Web Vitals gauges
            const vitalCards = document.querySelectorAll('#vitals-gauges .summary-card');
            let vitals = {};
            vitalCards.forEach(card => {
                const metricName = card.querySelector('h3')?.innerText || 'Unknown Metric';
                const metricVal = card.querySelector('.value')?.innerText || 'N/A';
                const statusPill = card.querySelector('div:last-child')?.innerText || '';
                vitals[metricName] = `${metricVal} (${statusPill})`;
            });

            // Scrape the top 5 rows of the Per-Page Performance table
            const perfRows = document.querySelectorAll('#perf-tbody tr');
            const topPages = {};
            
            perfRows.forEach((row, index) => {
                if (index < 5) { // Limit to 5 so the PDF doesn't become 10 pages long
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 4) {
                        const pagePath = cols[0].innerText;
                        topPages[`Rank ${index + 1}`] = `${pagePath} (LCP: ${cols[1].innerText}, INP: ${cols[2].innerText}, CLS: ${cols[3].innerText})`;
                    }
                }
            });

            // determine dynamic table header label 
            let dynamicTableLabel = "Top Endpoints";
            // Find whichever header currently has the active sort arrow
            const activeHeader = document.querySelector('.top-pages-card th.sort-asc, .top-pages-card th.sort-desc');
            
            if (activeHeader) {
                const sortType = activeHeader.getAttribute('data-sort'); // 'page', 'lcp', 'inp', or 'cls'
                const isAsc = activeHeader.classList.contains('sort-asc');

                if (sortType === 'lcp') {
                    dynamicTableLabel = isAsc ? "Fastest Loading Pages (LCP)" : "Slowest Loading Pages (LCP)";
                } else if (sortType === 'inp') {
                    dynamicTableLabel = isAsc ? "Most Responsive Pages (INP)" : "Least Responsive Pages (INP)";
                } else if (sortType === 'cls') {
                    dynamicTableLabel = isAsc ? "Most Visually Stable Pages (CLS)" : "Highest Layout Shift Pages (CLS)";
                } else if (sortType === 'page') {
                    dynamicTableLabel = isAsc ? "Pages Tracked (A-Z)" : "Pages Tracked (Z-A)";
                }
            }
            
            currentData = {
                reportType: "Core Web Vitals & Loading",
                pagesTracked: perfRows.length,
                overallVitals: Object.keys(vitals).length ? vitals : "No vitals rendering",
                
                // By wrapping dynamicTableLabel in brackets [ ], JavaScript will use the string 
                // variable as the actual key name in your JSON payload!
                [dynamicTableLabel]: Object.keys(topPages).length ? topPages : "No page data available"
            };
        }
        else if (currentReportSection === 'errors') {
            const errorRows = document.querySelectorAll('#error-tbody tr');
            const topErrors = {};
            let totalErrorCount = 0;
            
            // Scrape the table for volume and the top 5 unique errors
            errorRows.forEach((row, index) => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 4) {
                    totalErrorCount += parseInt(cols[3].innerText) || 0;
                    
                    if (index < 5) {
                        const type = cols[1].innerText;
                        const msg = cols[2].innerText;
                        const count = cols[3].innerText;
                        topErrors[`Frequent Error ${index + 1}`] = `[${type}] ${msg} (${count} occurrences)`;
                    }
                }
            });
            
            currentData = {
                reportType: "JavaScript & Asset Errors",
                uniqueErrorsTracked: errorRows.length,
                totalErrorVolume: totalErrorCount,
                mostFrequentErrors: Object.keys(topErrors).length ? topErrors : "No errors tracked"
            };
        }

        // Visual loading state
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Generating PDF... ⏳';
        }

        try {
            const response = await fetch(localDev+'/api/reports/generate', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: currentReportSection,
                    comments: comments,
                    dataSnapshot: currentData // Sending the highly detailed scraped data
                })
            });

            const data = await response.json();
            
            if (data.success) {
                closeReportModal();
                window.open(data.url, '_blank'); 
            } else {
                alert('Error generating report: ' + data.error);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('A network error occurred while generating the report.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Generate & Save PDF';
            }
        }
    }

    window.deleteReport = async function(reportId) {
        // 1. Ask for confirmation so users don't accidentally click it
        if (!confirm("Are you sure you want to delete this report? This cannot be undone.")) {
            return;
        }

        try {
            // 2. Send the DELETE request to your backend
            const response = await fetch(`${localDev}/api/reports/${reportId}`, {
                method: 'DELETE',
                credentials: 'include',
                body: JSON.stringify({
                    section: currentReportSection
                })
            });

            const data = await response.json();

            if (data.success) {
                // 3. Re-render the view to show the updated list
                reportsView(); 
            } else {
                alert('Error deleting report: ' + data.error);
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('A network error occurred while trying to delete the report.');
        }
    }

    // ==========================================
    // admin view section
    // ==========================================
    function renderAdmin() {
        
        lastActiveNav.classList.remove('nav-link-active');
        navAdmin.classList.add('nav-link-active');
        lastActiveNav = navAdmin;

        if (currentUser.role !== 'super admin') {
            viewport.innerHTML = `
                <div class="access-denied-container">
                    <div class="lock-icon">🔒</div>
                    <h2>Access Restricted</h2>
                    <p>You don't have the required permissions to view this section.</p>
                    <div class="permission-tag">
                        <span>Required:</span> <strong>Super Admin</strong>
                    </div>
                    <button onclick="window.location.hash = '#/overview'" class="back-btn">Return to Overview</button>
                </div>`;
            return;
        }
        viewport.innerHTML = `
            <div class="container">
                <h1 class="dashboard-header">Admin Panel</h1>
                <div id="message-area"></div>
                <div class="card top-pages-card">
                    <h2>Users</h2>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Permissions</th><th>Actions</th></tr></thead>
                            <tbody id="user-table-body"><tr><td colspan="4" class="empty-state">Loading...</td></tr></tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <h2>Add User</h2>
                    <form id="add-user-form">
                        <div class="form-row">
                            <div class="form-group"><label>Email</label><input type="email" id="new-email" required></div>
                            <div class="form-group"><label>Name</label><input type="text" id="new-name" required></div>
                            <div class="form-group"><label>Password</label><input type="password" id="new-password" required></div>
                            <div class="form-group"><label>Role</label>
                                <select id="new-role">
                                    <option value="viewer">Viewer</option>
                                    <option value="super admin">Super Admin</option>
                                    <option value="analyst">Analyst</option>
                                </select>
                            </div>
                            <div class="form-group" id="permissions-group" style="display: none;">
                                <label>Analyst Permissions</label>
                                <div class="multiselect-container">
                                    <div class="select-box" onclick="toggleCheckboxArea()">
                                        <span id="select-text">Select Permissions</span>
                                        <span class="arrow"></span>
                                    </div>
                                    <div id="checkbox-area" class="checkbox-dropdown">
                                        <label>Performance<input type="checkbox" name="permission" value="performance" onchange="updateSelectText()"></label>
                                        <label>Errors<input type="checkbox" name="permission" value="errors" onchange="updateSelectText()"></label>
                                        <label>Sessions<input type="checkbox" name="permission" value="sessions" onchange="updateSelectText()"></label>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn-submit">Add</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        initAdminLogic();
    }

    function initAdminLogic() {
        const tbody = document.getElementById('user-table-body');
        const form = document.getElementById('add-user-form');
        const messageArea = document.getElementById('message-area');
        
        document.getElementById('new-role').addEventListener('change', function() {
            const permGroup = document.getElementById('permissions-group');
            if (this.value === 'analyst') {
                permGroup.style.display = 'block';
            } else {
                permGroup.style.display = 'none';
                permGroup.querySelectorAll('input').forEach(cb => cb.checked = false);
            }
        });

        // Toggle the dropdown visibility
        window.toggleCheckboxArea = function() {
            const area = document.getElementById('checkbox-area');
            const select_box = document.querySelector('.select-box');
            select_box.classList.toggle('expanded');
            area.style.display = area.style.display === 'block' ? 'none' : 'block';
        }

        // Update the box text based on selection
        window.updateSelectText = function() {
            const checkboxes = document.querySelectorAll('input[name="permission"]:checked');
            const textSpan = document.getElementById('select-text');
            
            if (checkboxes.length === 0) {
                textSpan.innerText = "Select Permissions";
            } else if (checkboxes.length <= 2) {
                // Show names if only 1 or 2 are selected
                const names = Array.from(checkboxes).map(cb => cb.value).join(', ');
                textSpan.innerText = names;
            } else {
                // Show count if many are selected
                textSpan.innerText = checkboxes.length + " Permissions Selected";
            }
        }

        // Close the dropdown if the user clicks outside of it
        window.onclick = function(event) {
            const myDropdown = document.getElementById('myDropdown');

            if (myDropdown && !event.target.matches('.dropbtn')) {
                myDropdown.style.display = 'none';
            }
        }

        function getSelectedPermissions() {
            const checkboxes = document.querySelectorAll('input[name="permission"]:checked');
            return Array.from(checkboxes).map(cb => cb.value.toLowerCase());
        }

        function showMessage(text, type) {
            const div = document.createElement('div');
            div.className = 'message message-' + type;
            div.textContent = text;
            messageArea.innerHTML = '';
            messageArea.appendChild(div);
            setTimeout(() => div.remove(), 4000);
        }

        async function loadUsers() {
            try {
                const res = await fetch(localDev+'/api/users', { credentials: 'include' });
                if (res.status === 401) {
                    window.location.href = 'http://localhost:5502/public_html/login.html';
                    return;
                }
                if (res.status === 403) {
                    tbody.innerHTML = '';
                    var td = document.createElement('td');
                    td.colSpan = 4;
                    td.className = 'empty-state';
                    td.textContent = 'Access denied. Admin role required.';
                    var tr = document.createElement('tr');
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                    return;
                }
                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                tbody.innerHTML = '';
                if (data.data.length === 0) {
                    var emptyTd = document.createElement('td');
                    emptyTd.colSpan = 4;
                    emptyTd.className = 'empty-state';
                    emptyTd.textContent = 'No users found.';
                    var emptyTr = document.createElement('tr');
                    emptyTr.appendChild(emptyTd);
                    tbody.appendChild(emptyTr);
                    return;
                }

                data.data.forEach((user) => {
                    const tr = document.createElement('tr');
                    const roleClass = user.role ? user.role.replace(' ', '-') : 'viewer';
                    
                    let perms = [];
                    try {
                        perms = typeof user.permission === 'string' 
                            ? JSON.parse(user.permission) 
                            : (user.permission || []);
                    } catch (e) {
                        perms = [];
                    }
                    let permissionDisplay = perms.length > 0 ? perms.join(', ') : 'None';
                    if (user.role === 'super admin') {
                        permissionDisplay = "All";
                    }
                    tr.innerHTML = `
                        <td>${user.email}</td>
                        <td>${user.display_name}</td>
                        <td><span class="role-badge role-${roleClass}">${user.role}</span></td>
                        <td>${permissionDisplay}</td>
                        <td>
                            <button class="btn btn-edit">Edit</button>
                            <button class="btn btn-delete">Delete</button>
                        </td>
                    `;
                    tr.querySelector('.btn-edit').addEventListener('click', () => editUser(user));
                    tr.querySelector('.btn-delete').addEventListener('click', () => deleteUser(user.id, user.email));
                    tbody.appendChild(tr);
                });
            } catch (err) {
                showMessage('Failed to load users: ' + err.message, 'error');
            }
        }

        function editUser(user) {
            var newName = prompt('Display name:', user.display_name);
            if (newName === null) return;
            var newRole = prompt('Role (super admin, analyst, viewer):', user.role);
            if (newRole === null) return;

            var permissionsArray = [];
            if (user.role === 'analyst') {
                var newPermissions = prompt('Permissions (performance, errors):', user.permissions);
                if (newPermissions === null) return;

                permissionsArray = newPermissions.split(',')
                .map(p => p.trim().toLowerCase())
                .filter(p => p.length > 0);
            }

            fetch(localDev+'/api/users/' + user.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ displayName: newName, role: newRole, permissions: permissionsArray })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    showMessage('User updated.', 'success');
                    loadUsers();

                    // if the user edited themselves, update the global state and the Navbar UI
                    if (currentUser && currentUser.id === user.id) {
                        // update the global variable
                        currentUser.displayName = newName;
                        currentUser.role = newRole;
                        if (newRole === 'analyst') {
                            currentUser.permission = permissionsArray;
                        }

                        // update the Navbar Profile Pill
                        username.innerText = currentUser.displayName + " | " + currentUser.role;

                        if (currentUser.role === "super admin") {
                            username.style.setProperty('--role-color', '#1e8449');
                        } else if (currentUser.role === "analyst") {
                            username.style.setProperty('--role-color', '#b45309');
                            username.innerText += " (" + currentUser.permission.join(', ') + ")";
                        } else {
                            username.style.setProperty('--role-color', '#2471a3'); // default/viewer color
                        }
                    }
                } else {
                    showMessage(data.error || 'Update failed.', 'error');
                }
            })
            .catch(function() { showMessage('Network error.', 'error'); });
        }

        function deleteUser(id, email) {
            if (!confirm('Delete user ' + email + '? This cannot be undone.')) return;

            fetch(localDev+'/api/users/' + id, {
                method: 'DELETE',
                credentials: 'include'
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    showMessage('User deleted.', 'success');
                    loadUsers();
                } else {
                    showMessage(data.error || 'Delete failed.', 'error');
                }
            })
            .catch(function() { showMessage('Network error.', 'error'); });
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const permGroup = document.getElementById('permissions-group');
            permGroup.style.display = 'None';
            var submitBtn = form.querySelector('.btn-submit');
            submitBtn.disabled = true;

            var payload = {
                email: document.getElementById('new-email').value,
                displayName: document.getElementById('new-name').value,
                password: document.getElementById('new-password').value,
                role: document.getElementById('new-role').value, 
                permissions: getSelectedPermissions()
            };
            try {
                var res = await fetch(localDev+'/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                var data = await res.json();
                if (data.success) {
                    showMessage('User created.', 'success');
                    form.reset();
                    loadUsers();
                } else {
                    showMessage(data.error || 'Create failed.', 'error');
                }
            } catch (err) {
                showMessage('Network error.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        });

        loadUsers();
    }

    // ==========================================
    // global listeners
    // ==========================================
    function setupGlobalListeners() {
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                const res = await fetch(localDev+'/api/log/logout', { method: 'POST', credentials: 'include' });
                if (res.ok) window.location.href = 'http://localhost:5502/public_html/login.html';
            } catch (err) {
                console.error("Logout failed", err);
            }
        });

        // Grab the button and the sidebar from the DOM
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');

        // // Listen for a click event on the button
        toggleBtn.addEventListener('click', () => {
            // Toggles the 'collapsed' class on and off
            sidebar.classList.toggle('collapsed');
        });
            

        // Listen for routing clicks!
        window.addEventListener('hashchange', router);
    }

    // Boot up the app when the file loads
    window.addEventListener('DOMContentLoaded', initApp);

})();
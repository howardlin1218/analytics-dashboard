import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Auth Session Handshake
  http.get('*/api/dashboard', () => {
    return HttpResponse.json({
      user: {
        id: 1,
        email: 'analyst@demo.local',
        displayName: 'Demo Analyst',
        role: 'analyst',
        permission: ['performance', 'errors', 'sessions', 'reports', 'overview'],
      },
    });
  }),

  // Mock Overview Metrics
  http.get('*/api/overview', () => {
    return HttpResponse.json({
      success: true,
      cards: [
        { title: 'Total Pageviews', value: '1,240' },
        { title: 'Unique Sessions', value: '380' },
        { title: 'Avg Time on Page', value: '45s' },
        { title: 'Total Events', value: '4,290' },
      ],
      chart: {
        labels: ['2026-09-28', '2026-09-29', '2026-09-30'],
        values: [410, 450, 380],
      },
      table: [
        { path: '/dashboard.html', views: 820, unique: 310 },
        { path: '/login.html', views: 420, unique: 280 },
      ],
    });
  }),

  // Mock Site Selector
  http.get('*/api/overview/sites', () => {
    return HttpResponse.json({
      success: true,
      sites: ['reporting.howard1218.site', 'collector.howard1218.site'],
    });
  }),

  // Mock Performance
  http.get('*/api/performance', () => {
    return HttpResponse.json({
      success: true,
      vitals: [
        { metric: 'LCP', value: '1200 ms', status: 'Good', color: '#28a745' },
        { metric: 'INP', value: '80 ms', status: 'Good', color: '#28a745' },
        { metric: 'CLS', value: 0.05, status: 'Good', color: '#28a745' },
      ],
      chart: {
        labels: ['< 1s', '1s - 2s', '2s - 3s', '> 3s'],
        values: [150, 40, 10, 5],
      },
      table: [
        { page: '/dashboard.html', lcp: 1100, inp: 75, cls: 0.04 },
        { page: '/login.html', lcp: 900, inp: 50, cls: 0.01 },
      ],
    });
  }),

  // Mock Errors
  http.get('*/api/errors', () => {
    return HttpResponse.json({
      success: true,
      chart: {
        labels: ['2026-09-28', '2026-09-29', '2026-09-30'],
        values: [2, 5, 1],
      },
      table: [
        {
          time: '9/30/2026, 8:00:00 PM',
          type: 'TypeError',
          message: 'Cannot read properties of undefined',
          count: 5,
          stackTrace: 'TypeError: Cannot read properties of undefined\n  at app.js:42:15',
        },
      ],
    });
  }),

  // Mock Sessions
  http.get('*/api/sessions', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          session_id: 'sess-abc-123',
          total_actions: 14,
          start_time: '2026-09-30T20:00:00.000Z',
          end_time: '2026-09-30T20:05:00.000Z',
          ip_address: '127.0.0.1',
        },
      ],
    });
  }),

  // Mock Reports
  http.get('*/api/reports', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'Performance Report - 9/30/2026',
          section: 'performance',
          author_id: 1,
          comments: 'Initial benchmark',
          file_path: '/reports/report_performance_1.pdf',
          created_at: '2026-09-30T20:00:00.000Z',
        },
      ],
    });
  }),

  // Mock Users
  http.get('*/api/users', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          email: 'admin@demo.local',
          display_name: 'Admin User',
          role: 'super admin',
          permission: '[]',
        },
        {
          id: 2,
          email: 'analyst@demo.local',
          display_name: 'Demo Analyst',
          role: 'analyst',
          permission: '["performance","errors","sessions"]',
        },
      ],
    });
  }),

  // Mock Login
  http.post('*/api/log/login', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.email === 'admin@demo.local' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          id: 1,
          email: 'admin@demo.local',
          displayName: 'Admin User',
          role: 'super admin',
          permission: [],
        },
      });
    }
    return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }),

  // Mock Guest Login
  http.post('*/api/log/guest', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 0,
        email: 'guest@demo.local',
        displayName: 'guest',
        role: 'guest',
        permission: ['overview', 'performance', 'errors', 'sessions', 'reports'],
      },
    });
  }),

  // Mock Logout
  http.post('*/api/log/logout', () => {
    return HttpResponse.json({ success: true });
  }),
];

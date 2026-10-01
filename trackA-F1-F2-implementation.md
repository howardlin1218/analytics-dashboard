# Track A (Stages F1 & F2) Implementation Reference

This document provides a comprehensive technical breakdown of all files, folders, architecture, logic, state management, and design choices implemented for **Stage F1 (Global Filtering & Foundation)** and **Stage F2 (View Migration & Decoupling)** of the Analytics Dashboard frontend refactor.

---

## 1. Architectural Overview & Coexistence Model

The refactor transforms the legacy multi-page vanilla JavaScript frontend (`dashboard.html`, `app.js`, `styles.css`, `login.html`) into a modern, type-safe **React 19 + TypeScript + Vite** Single Page Application (SPA) located in `frontend/`.

```
analytics-dashboard/
├── api.js                                # Legacy Node.js / Express API server (Untouched)
├── routes/                               # Express REST endpoint handlers (Untouched)
├── public_html/                          # Production web root
│   ├── dashboard.html                    # Legacy dashboard (Preserved untouched)
│   ├── app.js                            # Legacy app logic (Preserved untouched)
│   ├── styles.css                        # Legacy stylesheet (Preserved untouched)
│   ├── login.html, login.js              # Legacy login (Preserved untouched)
│   ├── reports/                          # Puppeteer-generated PDF reports (Preserved)
│   ├── .htaccess                         # [NEW] Apache URL rewriting for HTML5 pushState
│   ├── index.html                        # [NEW] SPA production entrypoint (compiled)
│   └── assets/                           # [NEW] Production hashed JS & CSS bundles
├── frontend/                             # [NEW] Modern React 19 + TypeScript workspace
│   ├── index.html                        # Vite HTML development entrypoint
│   ├── package.json                      # Dependency declarations & scripts
│   ├── vite.config.ts                    # Build pipeline with target ../public_html
│   ├── tailwind.config.js                # Tailwind CSS styling with obsidian dark theme
│   ├── postcss.config.js                 # PostCSS autoprefixer configuration
│   ├── tsconfig.json                     # TypeScript compiler configuration
│   ├── src/
│   │   ├── main.tsx                      # Root DOM mounting
│   │   ├── App.tsx                       # Router, Providers & Route Dispatch
│   │   ├── index.css                     # Tailwind layers, CSS variables & obsidian theme
│   │   ├── api/                          # TanStack Query hooks & HTTP client
│   │   ├── context/                      # AuthContext & FilterContext state providers
│   │   ├── types/                        # Strict TypeScript interfaces & schemas
│   │   ├── components/
│   │   │   ├── ui/                       # Radix UI design primitives
│   │   │   ├── layout/                   # AppShell, Navbar, Sidebar, ThemeToggle, SiteSelector
│   │   │   └── common/                   # MetricCard, EmptyState, AccessDenied, ReportModal, RoleBadge
│   │   ├── views/                        # Page-level components for all 8 routes
│   │   └── utils/                        # Formatting, grading, Chart.js, and date filtering
│   └── tests/                            # Vitest unit & integration test suites with MSW
└── trackA-F1-F2.md                       # Refactor specification & concerns documentation
```

### Core Architecture Pillars

1. **Strict Legacy File Preservation**:
   - The user constraint *"do not delete/modify any existing files, simply create new files/folders as needed"* was strictly maintained.
   - Vite builds to `../public_html` with `emptyOutDir: false`. Existing files (`dashboard.html`, `app.js`, `styles.css`, `login.html`, `reports/`) remain completely intact. Both legacy entrypoints and the modern SPA coexist seamlessly.
2. **Zero Backend Changes Guarantee**:
   - Express backend endpoints (`/api/dashboard`, `/api/overview`, `/api/performance`, `/api/errors`, `/api/sessions`, `/api/reports`, `/api/users`, `/api/log/*`) operate without modification.
   - The SPA client uses standard session-based cookie authentication (`credentials: 'include'`).
3. **Solid Colors & Sleek Obsidian Black Theme**:
   - Zero gradients (no linear-gradients, radial gradients, or gradient text) exist anywhere across the application.
   - Pure solid obsidian palette: Obsidian black background (`#0a0a0a`), deep card surfaces (`#141414`), refined borders (`#292929`), crisp typography (`#fafafa`), and solid blue accents (`#3b82f6`).
4. **URL Synchronization & Deep Linking**:
   - Site filters (`siteId`) and date ranges (`startDate`, `endDate`) synchronize bidirectionally with URL search parameters (`?siteId=...&startDate=...&endDate=...`).
   - Legacy hash navigation (`#/performance`) is automatically redirected to HTML5 routes (`/performance`) via `LegacyHashRedirector`.
5. **Plain Function Components with Explicit Typed Props (No React.FC)**:
   - All React components, providers, views, and layout containers are declared as standard plain functions (`export function Component({ ... }: ComponentProps)`) with explicit TypeScript props interfaces.
   - Avoids legacy `React.FC` / `FC` typing patterns, aligning with modern React/TypeScript best practices (eliminates implicit `children`, enhances generic parameter inference, enables direct IDE jump-to-definition, and provides clean function signatures).

---

## 2. Tooling, Build & Root Configuration

### [frontend/package.json](file:///Users/howardlin/analytics-dashboard/frontend/package.json)
- **What it does**: Declares production and development dependencies, build scripts, and test runners for the React application.
- **Why it's needed**: Provides reproducible package management, TypeScript compilation scripts (`build: tsc -b && vite build`), test execution (`test: vitest run`), and dependencies for React 19, TanStack Query v5, React Router v7, Radix UI, Chart.js, Lucide Icons, and Tailwind CSS.
- **Key Dependencies**:
  - `react`, `react-dom` (v19): Modern component model and React compiler compatibility.
  - `@tanstack/react-query` (v5): Server state caching, background polling, and mutation management.
  - `react-router-dom` (v7): Client-side pushState routing and deep link parameter management.
  - `@radix-ui/react-*`: Headless accessible dialogs, popovers, and dropdown menus.
  - `chart.js`, `react-chartjs-2`: Canvas-based telemetry and performance charts.
  - `date-fns`: Date calculation and formatting for presets and custom ranges.
  - `clsx`, `tailwind-merge`: Robust className concatenation without selector collisions.
  - `vitest`, `@testing-library/react`, `msw`: Automated test runner with Mock Service Worker.

### [frontend/vite.config.ts](file:///Users/howardlin/analytics-dashboard/frontend/vite.config.ts)
- **What it does**: Configures the Vite development server, alias resolution (`@`), proxy forwarding, and the production roll-out target.
- **Why it's needed**: Ensures Vite outputs compiled bundles directly to `../public_html` without wiping out existing legacy files.
- **Logic & Configuration**:
  ```typescript
  export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5500,
      proxy: { '/api': { target: 'http://localhost:3006', changeOrigin: true } }
    },
    build: {
      outDir: path.resolve(__dirname, '../public_html'),
      emptyOutDir: false, // Critical: preserves existing dashboard.html, app.js, reports/
    }
  });
  ```

### [frontend/tsconfig.json](file:///Users/howardlin/analytics-dashboard/frontend/tsconfig.json), [frontend/tsconfig.app.json](file:///Users/howardlin/analytics-dashboard/frontend/tsconfig.app.json), [frontend/tsconfig.node.json](file:///Users/howardlin/analytics-dashboard/frontend/tsconfig.node.json)
- **What it does**: Configures TypeScript strict mode, JSX compilation, module resolution, and path aliases.
- **Why it's needed**: Enforces strict compile-time type safety across the entire application and resolves `@/*` imports. `ignoreDeprecations: "6.0"` prevents compiler warnings regarding legacy `baseUrl` options.

### [frontend/tailwind.config.js](file:///Users/howardlin/analytics-dashboard/frontend/tailwind.config.js) & [frontend/postcss.config.js](file:///Users/howardlin/analytics-dashboard/frontend/postcss.config.js)
- **What it does**: Configures Tailwind utility classes, content scan paths, and design token mappings using CSS variables (`hsl(var(--...))`).
- **Why it's needed**: Enables atomic CSS compilation, dark mode class toggling (`darkMode: 'class'`), and standardized theme variables.

### [frontend/index.html](file:///Users/howardlin/analytics-dashboard/frontend/index.html)
- **What it does**: The HTML host template for Vite development and SPA compilation.
- **Why it's needed**: Declares viewport meta tags, preconnects Google fonts, mounts `<div id="root"></div>`, and references `/src/main.tsx`.

### [public_html/.htaccess](file:///Users/howardlin/analytics-dashboard/public_html/.htaccess)
- **What it does**: Apache server configuration for single-page routing and static file bypassing.
- **Why it's needed**: Allows users to refresh or navigate directly to `/performance`, `/sessions`, etc., when hosted on an Apache web server, directing unknown routes to `index.html` while allowing `/api/` and physical static files to load normally.
- **Logic**:
  ```apache
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_URI} ^/api/ [NC]
  RewriteRule ^ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
  ```

---

## 3. Core Shell, Routing & Global Styling

### [frontend/src/main.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/main.tsx)
- **What it does**: Mounts the React application into the DOM `#root` node using `ReactDOM.createRoot`.
- **Why it's needed**: Standard React 19 bootstrap file importing `./index.css` and initiating the React component tree.

### [frontend/src/index.css](file:///Users/howardlin/analytics-dashboard/frontend/src/index.css)
- **What it does**: Declares global CSS variables for colors, typography, borders, and shadows in both light mode and obsidian dark mode.
- **Why it's needed**: Replaces all legacy CSS with a clean, unified theme system while guaranteeing solid colors with zero gradients.
- **Color Token Breakdown**:
  - **Light Mode**:
    - `--background`: `0 0% 100%` (`#ffffff`)
    - `--card`: `0 0% 100%` (`#ffffff`)
    - `--muted`: `220 14.3% 95.9%` (`#f1f5f9`)
    - `--border`: `214.3 31.8% 91.4%` (`#e2e8f0`)
    - `--primary`: `217 91% 60%` (`#3b82f6`)
    - `--foreground`: `222.2 84% 4.9%` (`#020817`)
  - **Dark Mode (Sleek Obsidian Black)**:
    - `--background`: `0 0% 4%` (`#0a0a0a` pure obsidian black)
    - `--card`: `0 0% 8%` (`#141414` deep obsidian surface)
    - `--popover`: `0 0% 8%` (`#141414`)
    - `--muted`: `0 0% 13.5%` (`#222222` solid neutral dark)
    - `--border`: `0 0% 16%` (`#292929` crisp subtle border)
    - `--foreground`: `0 0% 98%` (`#fafafa` crisp white)
    - `--muted-foreground`: `0 0% 64%` (`#a3a3a3` medium light gray)
    - `--primary`: `217 91% 60%` (`#3b82f6` electric solid blue)
    - `--primary-hover`: `221 83% 53%` (`#2563eb`)

### [frontend/src/App.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/App.tsx)
- **What it does**: Root application component hosting the TanStack `QueryClientProvider`, `BrowserRouter`, `AuthProvider`, `FilterProvider`, toast notification host, and route declarations.
- **Why it's needed**: Central coordinator for client-side routing, protected layouts, and legacy redirect handlers.
- **Logic & Components**:
  - `queryClient`: Configured with `refetchOnWindowFocus: false` and `retry: 1` to prevent redundant network fetches while retaining fresh telemetry.
  - `LegacyHashRedirector`: Watches `window.location.hash`. If an incoming link has a legacy fragment (e.g., `#/performance` or `#/sessions`), it navigates to `/performance` or `/sessions` using pushState.
  - `Public Routes`: `/` (`LandingPage`), `/login` (`LoginPage`).
  - `Legacy Redirects`: `/login.html` $\to$ `/login`, `/landing.html` $\to$ `/`, `/dashboard.html` $\to$ `/overview`.
  - `Protected Layout`: `<Route element={<AppShell />}>` wraps `/overview`, `/performance`, `/errors`, `/sessions`, `/reports`, and `/admin`.

---

## 4. State Management & Context Providers

### [frontend/src/context/AuthContext.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/context/AuthContext.tsx)
- **What it does**: Provides centralized authentication state (`user`, `isLoading`, `isAuthenticated`), user login, demo guest login, and logout routines.
- **Why it's needed**: Enables reactive role-based access control (RBAC) across the entire application without page reloads.
- **Logic & Function Breakdown**:
  - `refreshUser()`: Calls `GET /api/dashboard`. If the session cookie is valid, parses user data and normalizes permissions (deserializing JSON string permissions if needed).
  - `login(email, password)`: Sends `POST /api/log/login`. On success, updates state with the authenticated `User` record.
  - `loginGuest()`: Sends `POST /api/log/guest`. Allows instant demo access with guest privileges.
  - `logout()`: Sends `POST /api/log/logout` and resets `user` to `null`.
  - `updateCurrentUserLocal(updates)`: Enables immediate optimistic updates to the current user's profile without waiting for a full session re-fetch.
  - `useAuth()`: Hook providing typed access to `AuthContext`.

### [frontend/src/context/FilterContext.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/context/FilterContext.tsx)
- **What it does**: Implements Stage F1's Global Filtering requirement, managing the globally selected site (`selectedSite`) and active date range (`dateRange`).
- **Why it's needed**: Enables coordinated filtering across all dashboard views while ensuring that sharing or bookmarking URLs preserves the exact filter state.
- **Logic & Function Breakdown**:
  - State Initialization: Reads `siteId`, `startDate`, and `endDate` from the URL search params. If absent, falls back to `localStorage._dashboard_selected_site` or defaults (`all` and Last 30 Days).
  - `setSelectedSite(site)`: Updates local state, persists selection to `localStorage`, and synchronizes `?siteId=...` in the browser URL.
  - `setDateRange(range)`: Updates `dateRange` and formats `startDate` and `endDate` into ISO date strings (`yyyy-MM-dd`) in the URL.
  - `useEffect`: Watches URL params for browser Back/Forward navigation and synchronizes state accordingly.
  - `useFilters()`: Custom hook to consume and update global filters.

---

## 5. API Client & TanStack Query Hooks

### [frontend/src/api/client.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/client.ts)
- **What it does**: Core HTTP fetch wrapper configured with `credentials: 'include'` and automated status handling.
- **Why it's needed**: Unifies error handling, JSON serialization, and dynamic base URL detection across all API requests.
- **Logic & Function Breakdown**:
  - `API_BASE`: Dynamically detects port. Uses an empty string when running with Vite proxy or behind a production reverse proxy, or uses `http://<hostname>:3006` in standalone mode.
  - Automatically sets `Content-Type: application/json` for stringified request bodies.
  - Throws typed errors with `.status` properties (`401 Unauthorized`, `403 Forbidden`).
  - Automatically parses JSON or plain text depending on the response `Content-Type` header.

### [frontend/src/api/useOverview.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/useOverview.ts)
- **What it does**: TanStack Query hook fetching high-level dashboard metrics (`cards`, `chart`, `table`).
- **Why it's needed**: Powers the Overview dashboard tab with automatic caching and query invalidation.
- **Logic**:
  - Query Key: `['overview', selectedSite, dateRange.startDate, dateRange.endDate]`.
  - Dispatches `GET /api/overview?siteId=...&startDate=...&endDate=...`.
  - Handles client-side fallback adaptation if backend returns the standard `{ success: true, cards, chart, table }` envelope.

### [frontend/src/api/usePerformance.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/usePerformance.ts)
- **What it does**: Fetches Web Vitals telemetry (`LCP`, `INP`, `CLS`) and page load distributions.
- **Why it's needed**: Powers the Performance tab with real-time performance grades and per-page metrics.
- **Logic**:
  - Query Key: `['performance', selectedSite, dateRange.startDate, dateRange.endDate]`.
  - Dispatches `GET /api/performance?siteId=...`.
  - Employs client-side date filtering fallback via [dateFilter.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/utils/dateFilter.ts) to filter page performance logs by `created_at`.

### [frontend/src/api/useErrors.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/useErrors.ts)
- **What it does**: Queries JavaScript exception logs, aggregates error counts by type, and groups error instances.
- **Why it's needed**: Provides data for error trend line charts, top error frequency tables, and stack trace inspection.
- **Logic**:
  - Query Key: `['errors', selectedSite, dateRange.startDate, dateRange.endDate]`.
  - Dispatches `GET /api/errors?siteId=...`.
  - Filters errors client-side by date range if raw log entries contain timestamps.

### [frontend/src/api/useSessions.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/useSessions.ts)
- **What it does**: Provides `useSessions()` for listing logged user sessions and `useSessionDetail(sessionId)` for deep user trace profiles.
- **Why it's needed**: Powers the Session Tracer view with device technographics and chronological user event timelines.
- **Logic**:
  - `useSessions()`: Queries `GET /api/sessions?siteId=...`.
  - `useSessionDetail(sessionId)`: Queries `GET /api/sessions/${sessionId}` when `sessionId` is not null. Returns `{ profile, timeline }` containing user platform, screen dimensions, network conditions, clicks, and pageviews.

### [frontend/src/api/useReports.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/useReports.ts)
- **What it does**: Hook providing `useReports()`, `useGenerateReport()`, and `useDeleteReport()`.
- **Why it's needed**: Manages PDF report generation via Puppeteer, report list caching, and PDF report deletion.
- **Logic**:
  - `useReports()`: Queries `GET /api/reports`. Returns generated report metadata (`id`, `title`, `file_path`, `section`, `comments`, `created_at`).
  - `useGenerateReport()`: Mutation issuing `POST /api/reports` with `{ title, section, comments, dataSnapshot }`. Invalidates `['reports']` query on success.
  - `useDeleteReport()`: Mutation issuing `DELETE /api/reports/:id`. Invalidates `['reports']` query on success.

### [frontend/src/api/useUsers.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/api/useUsers.ts)
- **What it does**: Admin user management hooks (`useUsers`, `useCreateUser`, `useUpdateUser`, `useDeleteUser`).
- **Why it's needed**: Equips Super Admins with role and permission management capabilities.
- **Logic**:
  - `useUsers()`: Queries `GET /api/users`.
  - `useCreateUser()`: Issues `POST /api/users` with email, display name, password, role, and permissions array.
  - `useUpdateUser()`: Issues `PUT /api/users/:id` to modify name, role, or permissions.
  - `useDeleteUser()`: Issues `DELETE /api/users/:id`.

---

## 6. TypeScript Contracts & Type Definitions

### [frontend/src/types/auth.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/types/auth.ts)
- **What it does**: Defines user entity structures, roles (`Role = 'super admin' | 'analyst' | 'viewer' | 'guest'`), and permissions (`'performance' | 'errors' | 'sessions'`).
- **Why it's needed**: Provides strict typing for auth state and role-based guards.

### [frontend/src/types/api.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/types/api.ts)
- **What it does**: Declares API envelope interfaces for Overview, Performance, Errors, Reports, and Users.
- **Why it's needed**: Prevents runtime contract discrepancies between the Express backend and React components.

### [frontend/src/types/telemetry.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/types/telemetry.ts)
- **What it does**: Schema definitions for Web Vitals metrics, Session profiles, technographics, and timeline events (`pageview`, `click`, `scroll_depth`, `error`, `idle_break`).
- **Why it's needed**: Types the complex payload returned by the session telemetry collector and user journey tracer.

---

## 7. UI Design System Primitives

All UI components reside in `frontend/src/components/ui/` and adhere strictly to solid colors with no gradients.

### [frontend/src/components/ui/button.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/button.tsx)
- **What it does**: Button primitive supporting variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`).
- **Why it's needed**: Unified interactive button component styled with class-variance-authority (`cva`). All hover states use solid colors (e.g. `hover:bg-blue-600` and `hover:bg-red-600`).

### [frontend/src/components/ui/card.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/card.tsx)
- **What it does**: Card container exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- **Why it's needed**: Structural container for all widgets, metrics, tables, and dialogs. Styled with solid `bg-card` and `border-border`.

### [frontend/src/components/ui/badge.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/badge.tsx)
- **What it does**: Pill badge primitive with variants (`default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`, `purple`).
- **Why it's needed**: Renders roles, HTTP methods, event tags, and status labels using solid foreground and background colors in both themes.

### [frontend/src/components/ui/dialog.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/dialog.tsx)
- **What it does**: Accessible modal dialog built on `@radix-ui/react-dialog`.
- **Why it's needed**: Powers the PDF Report Generator modal, User Edit modal, and Stack Trace expansion modal with backdrop blur and keyboard accessibility (ESC to close).

### [frontend/src/components/ui/dropdown-menu.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/dropdown-menu.tsx)
- **What it does**: Headless accessible dropdown menu built on `@radix-ui/react-dropdown-menu`.
- **Why it's needed**: Used for user profile actions, logout triggers, and contextual action menus.

### [frontend/src/components/ui/popover.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/popover.tsx)
- **What it does**: Floating overlay component built on `@radix-ui/react-popover`.
- **Why it's needed**: Anchors the `SiteSelector` dropdown and `DateRangePicker` calendar/presets popup.

### [frontend/src/components/ui/table.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/table.tsx)
- **What it does**: Composable table primitives (`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`).
- **Why it's needed**: Standardized tabular display with solid border dividers and solid row hover states (`hover:bg-muted`).

### [frontend/src/components/ui/skeleton.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/skeleton.tsx)
- **What it does**: Animated placeholder element for loading states (`animate-pulse bg-muted`).
- **Why it's needed**: Replaces jarring blank screens or text spinners with content-shaped loading skeletons during query fetching.

### [frontend/src/components/ui/date-range-picker.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/date-range-picker.tsx)
- **What it does**: Stage F1 Date Range Picker with quick presets (Today, Last 7 Days, Last 30 Days, Last 90 Days) and manual custom date input.
- **Why it's needed**: Fulfills the core Stage F1 specification, enabling users to switch reporting windows and sync with URL search params.
- **Logic**:
  - Displays currently selected date range formatted as `MMM d, yyyy - MMM d, yyyy`.
  - Preset Buttons: When clicked, calculates the start and end dates using `date-fns` (`subDays`, `startOfDay`, `endOfDay`) and updates `FilterContext`.
  - Custom Inputs: Native date inputs allow custom start and end dates with validation.

### [frontend/src/components/ui/toast.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/ui/toast.tsx)
- **What it does**: Toast notification provider and trigger helper built on `sonner`.
- **Why it's needed**: Displays non-blocking success, error, and info toasts for user creation, report generation, and deletion events.

---

## 8. Application Layout & Navigation

### [frontend/src/components/layout/AppShell.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/layout/AppShell.tsx)
- **What it does**: Primary layout container housing the `Navbar`, collapsible `Sidebar`, and content `<Outlet />`.
- **Why it's needed**: Wraps all authenticated views, enforces session checks, and renders a loading skeleton while the session initializes.
- **Logic**:
  - Inspects `isAuthenticated` and `isLoading` from `AuthContext`.
  - If unauthenticated after loading, automatically redirects to `/login`.
  - Manages mobile sidebar drawer state (`mobileOpen`) and responsive layout collapsing.

### [frontend/src/components/layout/Navbar.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/layout/Navbar.tsx)
- **What it does**: Top application bar housing the mobile menu toggle, brand logo, `SiteSelector`, `DateRangePicker`, `ThemeToggle`, and user profile dropdown.
- **Why it's needed**: Provides global controls that remain accessible across all views.
- **Design**: Styled with solid background (`bg-card`), crisp bottom border (`border-b border-border`), and solid badge for user roles.

### [frontend/src/components/layout/Sidebar.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/layout/Sidebar.tsx)
- **What it does**: Vertical navigation drawer with links to `/overview`, `/performance`, `/errors`, `/sessions`, `/reports`, and `/admin`.
- **Why it's needed**: Provides main section navigation with active route highlights (`bg-primary text-primary-foreground`) and role-based link filtering.
- **Logic**:
  - Automatically hides the `/admin` link if the user is not a `super admin`.
  - Hides `/performance`, `/errors`, or `/sessions` if an `analyst` lacks the corresponding permission.

### [frontend/src/components/layout/SiteSelector.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/layout/SiteSelector.tsx)
- **What it does**: Dropdown popover allowing users to switch between telemetry domains (`All Sites`, `siteA`, `siteB`, etc.).
- **Why it's needed**: Fulfills the multi-tenant site selector requirement, pulling dynamic site IDs from the overview endpoint and updating `FilterContext`.

### [frontend/src/components/layout/ThemeToggle.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/layout/ThemeToggle.tsx)
- **What it does**: Icon button toggling between Light Mode and Obsidian Dark Mode.
- **Why it's needed**: Switches the root HTML `dark` class, saves preference to `localStorage`, and triggers `applyChartTheme()` to restyle Chart.js axes and grids.

---

## 9. Common Domain Components

### [frontend/src/components/common/MetricCard.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/common/MetricCard.tsx)
- **What it does**: Reusable KPI metric card displaying title, formatted value, trend status, and optional colored accent border.
- **Why it's needed**: Standardizes metric presentation across Overview, Performance, and Errors tabs with zero gradient styling.

### [frontend/src/components/common/EmptyState.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/common/EmptyState.tsx)
- **What it does**: Empty state placeholder displaying an icon, title, description, and action button.
- **Why it's needed**: Fulfills the Stage F1 Empty State requirement when queries return 0 records or no sites match filters.

### [frontend/src/components/common/AccessDenied.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/common/AccessDenied.tsx)
- **What it does**: Access restriction card rendered when a user attempts to access a route or module outside their role or permissions.
- **Why it's needed**: Enforces RBAC visually with a clean explanation of required permissions.

### [frontend/src/components/common/RoleBadge.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/common/RoleBadge.tsx)
- **What it does**: Renders a color-coded solid badge for a user role (`Super Admin` $\to$ amber, `Analyst` $\to$ blue, `Viewer` $\to$ secondary, `Guest` $\to$ purple).
- **Why it's needed**: Used across the Navbar, Admin table, and User edit dialogs to display roles consistently.

### [frontend/src/components/common/ReportModal.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/components/common/ReportModal.tsx)
- **What it does**: Modal dialog allowing analysts and admins to generate a PDF report for the active section (`performance`, `errors`, `sessions`).
- **Why it's needed**: Connects view snapshots to the Puppeteer PDF generator backend (`POST /api/reports`).
- **Logic**:
  - Captures custom report title and analyst notes/comments.
  - Receives a `dataSnapshotBuilder` callback from the calling view to build the structured data dictionary expected by the backend template.
  - Submits via `useGenerateReport` mutation and triggers a success toast on completion.

---

## 10. Page Views & Module Implementations

### [frontend/src/views/LandingPage.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/LandingPage.tsx)
- **What it does**: Modern marketing and feature introduction page (`/`).
- **Why it's needed**: Replaces the legacy `landing.html` with a modern, responsive layout showcasing the analytics features and API capabilities with zero gradients.

### [frontend/src/views/LoginPage.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/LoginPage.tsx)
- **What it does**: Authentication page (`/login`) with email/password form and one-click Demo Mode (Guest Access).
- **Why it's needed**: Replaces legacy `login.html` and `login.js`, routing authenticated users directly to `/overview`.

### [frontend/src/views/OverviewView.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/OverviewView.tsx)
- **What it does**: Main telemetry dashboard view (`/overview`).
- **Why it's needed**: Replaces legacy `overview` tab with reactive KPI metric cards, daily pageview line charts, top pages tables, and Quick Actions.
- **Logic**:
  - Displays dynamic KPI cards from backend (`Total Pageviews`, `Unique Sessions`, `Avg Duration`).
  - Renders solid-color Chart.js line graph of pageviews over time with zero translucent gradients.
  - Lists top requested URL paths with pageview and unique visitor counts.

### [frontend/src/views/PerformanceView.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/PerformanceView.tsx)
- **What it does**: Core Web Vitals observability view (`/performance`).
- **Why it's needed**: Replaces legacy performance tab with Google Web Vitals benchmarks (LCP, INP, CLS), load time distributions, and per-page performance tables.
- **Logic**:
  - Role Guard: Accessible to `super admin`, `guest`, and `analyst` with `performance` permission.
  - Evaluates Web Vitals against Google thresholds via `getVitalGrade()`.
  - Per-Page Table: Supports column sorting by Path, Avg LCP, TTFB, DOM Interactive, and Sample count.
  - Connects to `ReportModal` to generate performance PDF reports.

### [frontend/src/views/ErrorsView.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/ErrorsView.tsx)
- **What it does**: JavaScript error tracking and exception analysis view (`/errors`).
- **Why it's needed**: Replaces legacy error tab with error trend bar charts, top error occurrence tables, and dual stack trace inspection.
- **Logic**:
  - Role Guard: Requires `super admin`, `guest`, or `analyst` with `errors` permission.
  - Renders solid-color Chart.js bar chart of error frequency by category.
  - Dual Stack Trace Viewer: Clicking an error row immediately populates the inline `#stack-trace-panel` below the table, and provides an "Expand" button to inspect the stack in a modal dialog.
  - Connects to `ReportModal` to generate error analysis reports.

### [frontend/src/views/SessionsView.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/SessionsView.tsx)
- **What it does**: User session journey tracer view (`/sessions`).
- **Why it's needed**: Replaces legacy session tracer with deep user trace profiles, technographics, hardware specs, network conditions, and chronological journey timelines.
- **Logic**:
  - Role Guard: Requires `super admin`, `guest`, or `analyst` with `sessions` permission.
  - Master-Detail Layout: Left column lists sessions; clicking a session loads detailed hardware, screen, network, and capability metrics on the right.
  - Timeline Replay: Renders color-coded event markers for `pageview`, `click` (with coordinates and clicked element), `scroll_depth`, `error`, and `idle_break`.
  - Connects to `ReportModal` to export user trace PDF reports.

### [frontend/src/views/ReportsView.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/ReportsView.tsx)
- **What it does**: PDF report archive and download library (`/reports`).
- **Why it's needed**: Replaces legacy reports tab, listing all generated Puppeteer PDF reports with analyst comments, creation dates, download links, and deletion buttons.
- **Logic**:
  - Accessible to all authenticated users; deletion restricted to analysts and admins.
  - Renders a 3-column responsive grid of report cards with section icons (`Performance`, `Errors`, `Sessions`).

### [frontend/src/views/AdminView.tsx](file:///Users/howardlin/analytics-dashboard/frontend/src/views/AdminView.tsx)
- **What it does**: User and role management panel (`/admin`).
- **Why it's needed**: Replaces legacy admin section, allowing Super Admins to create new users, modify roles/permissions, and delete accounts.
- **Logic**:
  - Role Guard: Strictly restricted to `super admin`. Other roles receive `<AccessDenied />`.
  - Create User Form: Manages email, display name, password, role, and granular analyst permissions checkboxes.
  - User Table: Lists registered users with display name, email, role badge, permissions, and Edit/Delete action buttons.
  - Edit Dialog: Modal allowing modification of user details and permissions with live validation.

---

## 11. Domain Utilities & Formatters

### [frontend/src/utils/cn.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/utils/cn.ts)
- **What it does**: Merges class strings using `clsx` and resolves Tailwind conflicts with `twMerge`.
- **Why it's needed**: Essential helper for reusable UI primitives to allow custom class overrides without specificity bugs.

### [frontend/src/utils/formatters.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/utils/formatters.ts)
- **What it does**: Helper functions for number and duration formatting.
- **Why it's needed**: Formats large pageview numbers (`1,234,567`), milliseconds to seconds (`2.34s`), and timestamps across all views.

### [frontend/src/utils/vitalsGrading.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/utils/vitalsGrading.ts)
- **What it does**: Classifies Web Vitals scores into Google standards (`Good`, `Needs Work`, `Poor`) and returns solid color tokens.
- **Thresholds**:
  - **LCP**: $\le$ 2500ms (Good), $\le$ 4000ms (Needs Work), $>$ 4000ms (Poor).
  - **INP**: $\le$ 200ms (Good), $\le$ 500ms (Needs Work), $>$ 500ms (Poor).
  - **CLS**: $\le$ 0.10 (Good), $\le$ 0.25 (Needs Work), $>$ 0.25 (Poor).

### [frontend/src/utils/dateFilter.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/utils/dateFilter.ts)
- **What it does**: Provides `filterItemsByDateRange(items, range)` to filter arrays of telemetry data by ISO timestamp intervals using `date-fns/isWithinInterval`.
- **Why it's needed**: Serves as a client-side fallback adapter when legacy backend endpoints lack SQL date parameters.

### [frontend/src/utils/chartSetup.ts](file:///Users/howardlin/analytics-dashboard/frontend/src/utils/chartSetup.ts)
- **What it does**: Registers Chart.js modules and exports `applyChartTheme(isDark)`.
- **Why it's needed**: Ensures Chart.js canvas elements automatically adapt their grid lines (`#262626` in dark mode) and tick labels (`#a3a3a3`) when toggling themes, maintaining solid colors without gradients.

---

## 12. Testing Infrastructure & Test Suites

The test suite runs under Vitest using `@testing-library/react` and Mock Service Worker (MSW) in `frontend/tests/`. All 9 test suites and 11 tests pass with zero errors.

### [frontend/tests/setup.ts](file:///Users/howardlin/analytics-dashboard/frontend/tests/setup.ts)
- **What it does**: Configures the JSDOM test environment, starts the MSW server before tests, resets handlers between tests, and closes the server after completion.
- **Why it's needed**: Also mocks Chart.js `Line` and `Bar` components using `React.createElement` to prevent JSDOM resize observer null pointer exceptions.

### [frontend/tests/mocks/handlers.ts](file:///Users/howardlin/analytics-dashboard/frontend/tests/mocks/handlers.ts) & [frontend/tests/mocks/server.ts](file:///Users/howardlin/analytics-dashboard/frontend/tests/mocks/server.ts)
- **What it does**: MSW mock route handlers intercepting `/api/dashboard`, `/api/overview`, `/api/performance`, `/api/errors`, `/api/sessions`, `/api/reports`, and `/api/users`.
- **Why it's needed**: Provides realistic mock API data for deterministic, isolated unit testing without requiring a live database.

### Test Suites Breakdown:
1. **[frontend/tests/AuthFlow.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/AuthFlow.test.tsx)**: Verifies user session retrieval, public landing view rendering, and login redirects.
2. **[frontend/tests/DateRangePicker.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/DateRangePicker.test.tsx)**: Tests Stage F1 date presets (`Last 7 Days`, `Last 30 Days`) and verifies that selecting a preset updates `FilterContext`.
3. **[frontend/tests/EmptyState.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/EmptyState.test.tsx)**: Verifies that the `EmptyState` component renders titles, descriptions, and triggers action callbacks.
4. **[frontend/tests/OverviewView.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/OverviewView.test.tsx)**: Validates KPI card data rendering and top pages tabular output.
5. **[frontend/tests/PerformanceView.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/PerformanceView.test.tsx)**: Tests Core Web Vitals gauge calculation and per-page performance table sorting.
6. **[frontend/tests/ErrorsView.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/ErrorsView.test.tsx)**: Verifies error frequency listing and confirms that clicking an error row immediately populates the inline stack trace panel.
7. **[frontend/tests/SessionsView.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/SessionsView.test.tsx)**: Verifies session list loading, selection state, and empty placeholder rendering.
8. **[frontend/tests/ReportsView.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/ReportsView.test.tsx)**: Tests report card rendering, analyst comments, and download button links.
9. **[frontend/tests/AdminView.test.tsx](file:///Users/howardlin/analytics-dashboard/frontend/tests/AdminView.test.tsx)**: Validates Super Admin user listing and role badge display.

---

## 13. Verification Commands

To verify and work with the refactored frontend:

```bash
# Run unit & integration tests (11 passing tests)
cd frontend
npm run test

# Run type check and production build
npm run build

# Start local development server with API proxying
npm run dev
```

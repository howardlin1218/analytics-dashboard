const config = require('./config');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/login-api');
const userRoutes = require('./routes/users-api');
const dashboardRoutes = require('./routes/dashboard-api');
const overviewRoute = require('./routes/overview-api');
const performanceRoute = require('./routes/performance-api');
const errorsRoute = require('./routes/errors-api');
const sessionsRoute = require('./routes/sessions-api');
const reportsRoute = require('./routes/reports-api');

const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());

app.set('trust proxy', 'loopback');

app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: false,
    cookie : {
        httpOnly: true,
        secure: true,
        sameSite: 'lax', 
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const pool = mysql.createPool({
    host: config.host,
    user: config.db_user,
    password: config.db_password,
    database: config.database
});

app.set('pool', pool);

// handle login endpoints
app.use('/api/log', authRoutes);

// handle user management endpoints
app.use('/api/users', userRoutes);

// handle dashboard auth
app.use('/api/dashboard', dashboardRoutes);

// get overview 
app.use('/api/overview', overviewRoute);

// get performance
app.use('/api/performance', performanceRoute);

// get errors 
app.use('/api/errors', errorsRoute);

// get sessions
app.use('/api/sessions', sessionsRoute);

// get reports
app.use('/api/reports', reportsRoute);

// Start on a different port (e.g., 3006) so it doesn't clash with the collector
app.listen(config.port, () => console.log(`Reporting API running on port ${config.port}`));
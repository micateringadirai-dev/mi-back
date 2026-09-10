require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const cateringRoutes = require('./routes/cateringRoutes');
const masalaRoutes = require('./routes/masalaRoutes');
const oilRoutes = require('./routes/oilRoutes');
const miscRoutes = require('./routes/miscRoutes');

const app = express();

connectDB();

// Security & core middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limit public form submissions to curb abuse
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(['/api/catering/orders', '/api/masala/enquiries', '/api/oil/enquiries', '/api/contact'], publicFormLimiter);

// Static file serving for uploaded images/videos/FSSAI license
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/catering', cateringRoutes);
app.use('/api/masala', masalaRoutes);
app.use('/api/oil', oilRoutes);
app.use('/api', miscRoutes); // /api/contact, /api/settings, /api/portfolio, /api/upload, /api/admin/*

app.get('/api/health', (req, res) => res.json({ success: true, message: 'MI Groups API running' }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`MI Groups API listening on port ${PORT}`));

const express = require('express');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/authRoute');
const imageRoutes = require('./routes/imageRoute');
const JobRoutes = require('./routes/JobRoute');

require('dotenv').config();

const app = express();

// Connect to MongoDB and redis
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use Routes
app.use('/auth', authRoutes);
app.use('/images', imageRoutes);
app.use('/api/JobStatus',JobRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));

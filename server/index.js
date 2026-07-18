import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images as static files at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 2,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('Please check your MongoDB Atlas connection string and IP whitelist settings');
  });

// Routes
app.get('/', (req, res) => {
  res.send('Bag Inventory API is running');
});

// Import routes
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import salesRoutes from './routes/sales.js';
import analyticsRoutes from './routes/analytics.js';
import uploadRoutes from './routes/upload.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

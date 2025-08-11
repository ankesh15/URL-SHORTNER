require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cors = require('cors');
const { nanoid } = require('nanoid');
const Url = require('./models/Url');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || '';

mongoose.set('strictQuery', true);

let mongoMemoryServer;

async function connectWithFallback() {
  // Try explicit URI first if provided
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      // eslint-disable-next-line no-console
      console.log('Connected to MongoDB');
      return;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to connect to provided MONGODB_URI. Falling back to in-memory MongoDB.', error?.message || error);
    }
  }

  // Fallback: in-memory MongoDB
  mongoMemoryServer = await MongoMemoryServer.create();
  const memUri = mongoMemoryServer.getUri();
  await mongoose.connect(memUri);
  // eslint-disable-next-line no-console
  console.log('Connected to in-memory MongoDB');
}

async function start() {
  try {
    await connectWithFallback();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on ${BASE_URL}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Server failed to start', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  try {
    await mongoose.connection.close();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Admin: list all urls (optional bonus)
app.get('/api/admin/urls', async (_req, res) => {
  const urls = await Url.find().sort({ createdAt: -1 }).lean();
  res.json(urls.map((u) => ({
    id: u._id,
    originalUrl: u.originalUrl,
    shortCode: u.shortCode,
    shortUrl: `${BASE_URL}/${u.shortCode}`,
    clicks: u.clicks || 0,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  })));
});

// Create short URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing url' });
    }

    // Validate URL
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch (_e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Reuse existing shortcode if URL already present
    const existing = await Url.findOne({ originalUrl: url });
    if (existing) {
      return res.json({
        originalUrl: existing.originalUrl,
        shortCode: existing.shortCode,
        shortUrl: `${BASE_URL}/${existing.shortCode}`,
      });
    }

    // Generate unique shortcode
    let shortCode = nanoid(6);
    // Ensure uniqueness
    // In the unlikely event of collision, retry a few times
    // Avoid infinite loops by limiting attempts
    for (let attempts = 0; attempts < 5; attempts += 1) {
      // eslint-disable-next-line no-await-in-loop
      const collision = await Url.findOne({ shortCode });
      if (!collision) break;
      shortCode = nanoid(6);
    }

    const doc = await Url.create({ originalUrl: url, shortCode });

    res.status(201).json({
      originalUrl: doc.originalUrl,
      shortCode: doc.shortCode,
      shortUrl: `${BASE_URL}/${doc.shortCode}`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/shorten', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect handler
app.get('/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const record = await Url.findOne({ shortCode: shortcode });
    if (!record) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Increment click count
    record.clicks = (record.clicks || 0) + 1;
    await record.save();

    return res.redirect(record.originalUrl);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in redirect', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

start();


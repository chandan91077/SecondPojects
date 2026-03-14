const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const contactHandler = require('./api/contact');
const port = process.env.PORT || 3000;

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  return origin === 'http://localhost:5500' || origin === 'http://127.0.0.1:5500';
};

const applyCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

app.use((req, res, next) => {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS' && req.path === '/api/contact' && isAllowedOrigin(req.headers.origin)) {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.options('/api/contact', (req, res) => {
  applyCorsHeaders(req, res);
  return res.sendStatus(204);
});

app.post('/api/contact', async (req, res) => {
  applyCorsHeaders(req, res);
  try {
    await contactHandler(req, res);
  } catch (error) {
    console.error('Unhandled server error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
});

app.get('/api/contact', (_req, res) => {
  applyCorsHeaders(_req, res);
  res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

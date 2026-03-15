const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to serve game registry
app.get('/api/games', (req, res) => {
  try {
    const registry = require('./public/games/registry.json');
    res.json(registry);
  } catch (e) {
    res.json([]);
  }
});

// SPA fallback — serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Game site running at http://localhost:${PORT}`);
});

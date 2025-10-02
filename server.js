// Minimal Express static server (no auth, no APIs)
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5173;

app.use(express.static(__dirname));

// Simple proxy for YouTube thumbnails (for preview/download). Use responsibly.
app.get('/yt-thumb', async (req, res) => {
  try {
    const vid = String(req.query.vid || '').trim();
    const resKey = String(req.query.res || 'maxresdefault').trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(vid)) { // allow 11 typical, but be a bit lenient
      return res.status(400).send('Invalid video id');
    }
    const allowed = new Set(['maxresdefault','sddefault','hqdefault','mqdefault','default']);
    const key = allowed.has(resKey) ? resKey : 'hqdefault';
    const url = `https://img.youtube.com/vi/${vid}/${key}.jpg`;
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) return res.status(r.status).send('Not found');
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch (e) {
    res.status(500).send('Proxy error');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'convert.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

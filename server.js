const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to receive score submissions
app.post('/submit', (req, res) => {
  const { alias, btc, glock, hash } = req.body;

  if (!alias || !btc || !glock || !hash) {
    return res.status(400).send('Missing required fields');
  }

  const newEntry = {
    alias,
    finalBTC: parseInt(btc, 10),
    glock,
    gameHash: hash,
    timestamp: new Date().toISOString()
  };

  let scores = [];

  try {
    if (fs.existsSync(SCORES_FILE)) {
      const data = fs.readFileSync(SCORES_FILE, 'utf8');
      scores = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading scores file:', err);
  }

  scores.push(newEntry);

  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (err) {
    console.error('Error writing scores file:', err);
    return res.status(500).send('Failed to save score');
  }

  res.redirect('/thanks.html');
});

// Endpoint to serve leaderboard data
app.get('/scores', (req, res) => {
  try {
    const data = fs.readFileSync(SCORES_FILE, 'utf8');
    const scores = JSON.parse(data);
    res.json(scores);
  } catch (err) {
    console.error('Error loading scores:', err);
    res.status(500).json({ error: 'Failed to load scores' });
  }
});

// Fallback routes for static HTML files
app.get('/leaderboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get('/submit.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submit.html'));
});

app.get('/thanks.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'thanks.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

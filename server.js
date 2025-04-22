const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route: Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Load scores
app.get('/scores', (req, res) => {
  fs.readFile('scores.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading scores.json:', err);
      return res.status(500).json({ error: 'Failed to load scores.' });
    }
    res.json(JSON.parse(data));
  });
});

// Route: Submit score
app.post('/submit', (req, res) => {
  const { alias, btc, glock, hash } = req.body;

  if (!alias || !btc || !glock || !hash) {
    return res.status(400).send('Missing score data.');
  }

  const newEntry = {
    alias,
    btc: parseInt(btc),
    glock,
    hash,
    timestamp: new Date().toISOString()
  };

  fs.readFile('scores.json', 'utf8', (err, data) => {
    let scores = [];
    if (!err && data) {
      try {
        scores = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing scores.json:', parseErr);
      }
    }

    scores.push(newEntry);

    fs.writeFile('scores.json', JSON.stringify(scores, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing to scores.json:', writeErr);
        return res.status(500).send('Failed to save score.');
      }

      res.redirect('/leaderboard.html');
    });
  });
});

// Route: Leaderboard page
app.get('/leaderboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

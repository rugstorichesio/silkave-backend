const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Path to leaderboard file
const scoresFile = path.join(__dirname, 'scores.json');

// Submit route
app.post('/submit', (req, res) => {
  const { alias, btc, glock, hash } = req.body;

  const newScore = {
    alias,
    btc: parseInt(btc),
    glock,
    hash,
    timestamp: new Date().toISOString()
  };

  fs.readFile(scoresFile, 'utf8', (err, data) => {
    let scores = [];
    if (!err && data) {
      scores = JSON.parse(data);
    }

    scores.unshift(newScore);
    if (scores.length > 100) scores = scores.slice(0, 100);

    fs.writeFile(scoresFile, JSON.stringify(scores, null, 2), err => {
      if (err) {
        console.error('Error saving score:', err);
        return res.status(500).send('Error saving score.');
      }
      res.redirect('/thanks.html');
    });
  });
});

// GET leaderboard scores
app.get('/scores', (req, res) => {
  fs.readFile(scoresFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading scores:', err);
      return res.status(500).json([]);
    }
    res.json(JSON.parse(data));
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

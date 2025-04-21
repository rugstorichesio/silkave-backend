// Import necessary modules
const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize the Express app
const app = express();

// Set the port for the server
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to display the form (submit.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submit.html'));
});

// Route to handle form submissions
app.post('/submit', (req, res) => {
  const { alias, btc, glock, hash } = req.body;

  // Create a new score object
  const newScore = {
    alias,
    btc: parseFloat(btc),
    glock,
    hash,
    timestamp: new Date().toISOString()
  };

  // Read existing scores from scores.json
  const scoresFilePath = path.join(__dirname, 'scores.json');
  let scores = [];

  if (fs.existsSync(scoresFilePath)) {
    const data = fs.readFileSync(scoresFilePath);
    scores = JSON.parse(data);
  }

  // Add the new score to the scores array
  scores.push(newScore);

  // Write the updated scores back to scores.json
  fs.writeFileSync(scoresFilePath, JSON.stringify(scores, null, 2));

  // Redirect to the thank you page
  res.redirect('/thanks.html');
});

// Route to display the leaderboard (leaderboard.html)
app.get('/leaderboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

// Route to serve the scores as JSON
app.get('/scores', (req, res) => {
  const scoresFilePath = path.join(__dirname, 'scores.json');
  if (fs.existsSync(scoresFilePath)) {
    const data = fs.readFileSync(scoresFilePath);
    const scores = JSON.parse(data);
    res.json(scores);
  } else {
    res.json([]);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

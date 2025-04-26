// Leaderboard functionality for Silk Ave

document.addEventListener("DOMContentLoaded", () => {
    fetchScores()
    updateTimestamp()
  })
  
  // Update the timestamp
  function updateTimestamp() {
    const now = new Date()
    document.getElementById("lastUpdated").textContent = now.toLocaleString()
  }
  
  // Fetch scores from the backend
  function fetchScores() {
    // Show loading state
    const scoreList = document.getElementById("scoreList")
    scoreList.innerHTML = "<li class='loading'>Loading scores...</li>"
  
    // Try to fetch from the backend
    fetch("https://silkave-backend.onrender.com/scores")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        return response.json()
      })
      .then((data) => {
        // Clear loading message
        scoreList.innerHTML = ""
  
        // Check if we have scores
        if (data.length === 0) {
          scoreList.innerHTML = "<li>No scores yet. Be the first.</li>"
          return
        }
  
        // Sort scores by BTC (highest first)
        data.sort((a, b) => b.btc - a.btc)
  
        // Display scores
        data.forEach((entry, index) => {
          const item = document.createElement("li")
  
          // Format the score entry
          let scoreText = `<strong>${index + 1}.</strong> ${entry.alias} – ${entry.btc} BTC`
          if (entry.glock === "Yes") {
            scoreText += " – with Glock"
          }
  
          // Add game hash if available
          if (entry.hash) {
            scoreText += ` <span style="font-size: 0.8rem; color: #0a0;">[Game #${entry.hash.substring(0, 6)}]</span>`
          }
  
          // Add date if available
          if (entry.date) {
            const formattedDate = new Date(entry.date).toLocaleDateString()
            scoreText += ` <span style="font-size: 0.8rem;">(${formattedDate})</span>`
          }
  
          item.innerHTML = scoreText
  
          // Highlight top 3
          if (index < 3) {
            item.classList.add("top-score")
          }
  
          scoreList.appendChild(item)
        })
      })
      .catch((error) => {
        console.error("Error fetching scores:", error)
        scoreList.innerHTML = "<li class='error'>Failed to load scores. Please try again later.</li>"
      })
  }
  
  // Refresh scores every 60 seconds
  setInterval(fetchScores, 60000)
  
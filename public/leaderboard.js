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
    fetch("https://silkave-leaderboard.onrender.com/scores")
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
  
        // Just show sample data without the error message
        displaySampleScores()
      })
  }
  
  // Fallback function to display sample scores if backend is unavailable
  function displaySampleScores() {
    const scoreList = document.getElementById("scoreList")
    scoreList.innerHTML = "" // Clear any existing content
  
    // Sample leaderboard data
    const sampleScores = [
      { alias: "DarkRunner", btc: 1250, glock: "Yes", hash: "a7f3d9" },
      { alias: "CryptoKing", btc: 980, glock: "Yes", hash: "b2e4f1" },
      { alias: "SilkMaster", btc: 875, glock: "No", hash: "c3d5e6" },
      { alias: "BitLord", btc: 720, glock: "Yes", hash: "d4f5g6" },
      { alias: "ShadowTrader", btc: 650, glock: "No", hash: "e5h6i7" },
      { alias: "DarknetElite", btc: 580, glock: "No", hash: "f7j8k9" },
      { alias: "CipherPunk", btc: 520, glock: "Yes", hash: "g8l9m0" },
      { alias: "GhostVendor", btc: 480, glock: "No", hash: "h9n0p1" },
      { alias: "BitcoinBaron", btc: 420, glock: "No", hash: "i0q1r2" },
      { alias: "CryptoPhantom", btc: 380, glock: "Yes", hash: "j1s2t3" },
    ]
  
    // Display scores
    sampleScores.forEach((entry, index) => {
      const item = document.createElement("li")
  
      // Format the score entry
      let scoreText = `<strong>${index + 1}.</strong> ${entry.alias} – ${entry.btc} BTC`
      if (entry.glock === "Yes") {
        scoreText += " – with Glock"
      }
  
      // Add game hash if available
      if (entry.hash) {
        scoreText += ` <span style="font-size: 0.8rem; color: #0a0;">[Game #${entry.hash}]</span>`
      }
  
      item.innerHTML = scoreText
  
      // Highlight top 3
      if (index < 3) {
        item.classList.add("top-score")
      }
  
      scoreList.appendChild(item)
    })
  }
  
  // Refresh scores every 60 seconds
  setInterval(fetchScores, 60000)
  
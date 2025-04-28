// Leaderboard functionality for Silk Ave

document.addEventListener("DOMContentLoaded", () => {
    fetchScores()
    updateTimestamp()
  
    // Add refresh button functionality
    const refreshButton = document.getElementById("refreshButton")
    if (refreshButton) {
      refreshButton.addEventListener("click", () => {
        fetchScores()
        updateTimestamp()
      })
    }
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
  
    // Add loading animation
    const loadingItem = scoreList.querySelector(".loading")
    if (loadingItem) {
      loadingItem.innerHTML = "Loading scores<span class='loading-dots'>...</span>"
      animateLoadingDots()
    }
  
    // Try to fetch from the backend with a timeout
    const fetchPromise = fetch("https://silkave-leaderboard.onrender.com/scores")
  
    // Set a timeout of 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 10000)
    })
  
    // Race between fetch and timeout
    Promise.race([fetchPromise, timeoutPromise])
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Clear loading message
        scoreList.innerHTML = ""
  
        // Check if we have scores
        if (!data || data.length === 0) {
          scoreList.innerHTML = "<li class='no-scores'>No scores yet. Be the first.</li>"
          return
        }
  
        // Sort scores by BTC (highest first)
        data.sort((a, b) => b.btc - a.btc)
  
        // Display scores
        data.forEach((entry, index) => {
          const item = document.createElement("li")
          item.className = "score-item"
  
          // Format the score entry
          let scoreText = `<strong>${index + 1}.</strong> ${entry.alias} – ${entry.btc} BTC`
          if (entry.glock === "Yes") {
            scoreText += " – with Glock"
          }
  
          // Add game hash if available
          if (entry.hash) {
            scoreText += ` <span class="game-hash">[Game #${entry.hash.substring(0, 6)}]</span>`
          }
  
          // Add timestamp if available
          if (entry.timestamp) {
            const date = new Date(entry.timestamp)
            scoreText += ` <span class="timestamp">${date.toLocaleDateString()}</span>`
          }
  
          item.innerHTML = scoreText
  
          // Highlight top 3
          if (index < 3) {
            item.classList.add("top-score")
          }
  
          // Add animation delay for staggered appearance
          item.style.animationDelay = `${index * 0.1}s`
  
          scoreList.appendChild(item)
        })
  
        // Show success message
        const statusElement = document.getElementById("leaderboardStatus")
        if (statusElement) {
          statusElement.textContent = `Successfully loaded ${data.length} scores`
          statusElement.className = "status-success"
  
          // Hide status after 3 seconds
          setTimeout(() => {
            statusElement.textContent = ""
            statusElement.className = ""
          }, 3000)
        }
      })
      .catch((error) => {
        console.error("Error fetching scores:", error)
  
        // Show error status
        const statusElement = document.getElementById("leaderboardStatus")
        if (statusElement) {
          statusElement.textContent = `Error loading scores: ${error.message}`
          statusElement.className = "status-error"
        }
  
        // Display sample data without the error message
        displaySampleScores()
      })
  }
  
  // Animate loading dots
  function animateLoadingDots() {
    const loadingElement = document.querySelector(".loading-dots")
    if (!loadingElement) return
  
    let dots = 0
    const maxDots = 3
  
    const interval = setInterval(() => {
      dots = (dots + 1) % (maxDots + 1)
      loadingElement.textContent = ".".repeat(dots)
  
      // Clear interval if element no longer exists
      if (!document.contains(loadingElement)) {
        clearInterval(interval)
      }
    }, 500)
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
  
    // Add a note about sample data
    const noteItem = document.createElement("li")
    noteItem.className = "sample-data-note"
    noteItem.innerHTML = "⚠️ Showing sample data - could not connect to leaderboard server"
    scoreList.appendChild(noteItem)
  
    // Display scores
    sampleScores.forEach((entry, index) => {
      const item = document.createElement("li")
      item.className = "score-item sample-data"
  
      // Format the score entry
      let scoreText = `<strong>${index + 1}.</strong> ${entry.alias} – ${entry.btc} BTC`
      if (entry.glock === "Yes") {
        scoreText += " – with Glock"
      }
  
      // Add game hash if available
      if (entry.hash) {
        scoreText += ` <span class="game-hash">[Game #${entry.hash}]</span>`
      }
  
      item.innerHTML = scoreText
  
      // Highlight top 3
      if (index < 3) {
        item.classList.add("top-score")
      }
  
      // Add animation delay for staggered appearance
      item.style.animationDelay = `${index * 0.1}s`
  
      scoreList.appendChild(item)
    })
  }
  
  // Add CSS for better styling
  function addLeaderboardStyles() {
    const style = document.createElement("style")
    style.textContent = `
      .score-item {
        animation: fadeIn 0.5s ease-in-out forwards;
        opacity: 0;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .loading-dots {
        display: inline-block;
        min-width: 20px;
      }
      
      .sample-data-note {
        color: #ff9900;
        margin-bottom: 10px;
        font-style: italic;
      }
      
      .sample-data {
        opacity: 0.8;
      }
      
      .status-success {
        color: green;
        font-size: 0.9rem;
      }
      
      .status-error {
        color: red;
        font-size: 0.9rem;
      }
      
      .game-hash {
        font-size: 0.8rem;
        color: #0a0;
      }
      
      .timestamp {
        font-size: 0.8rem;
        color: #666;
        float: right;
      }
    `
    document.head.appendChild(style)
  }
  
  // Add the styles when the script loads
  addLeaderboardStyles()
  
  // Refresh scores every 60 seconds
  setInterval(fetchScores, 60000)
  
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
  
  // Fetch scores from localStorage or display sample data
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
  
    // Try to get scores from localStorage first
    try {
      const localScores = JSON.parse(localStorage.getItem("silkAveScores") || "[]")
  
      if (localScores && localScores.length > 0) {
        displayScores(localScores)
        return
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e)
    }
  
    // If no local scores, display sample data
    displaySampleScores()
  }
  
  // Display scores from data
  function displayScores(data) {
    const scoreList = document.getElementById("scoreList")
    scoreList.innerHTML = ""
  
    // Sort scores by BTC (highest first)
    data.sort((a, b) => b.btc - a.btc)
  
    // Display scores
    data.forEach((entry, index) => {
      const item = document.createElement("li")
      item.className = "score-item"
  
      // Create main score content
      const scoreContent = document.createElement("div")
      scoreContent.className = "score-content"
  
      // Format the main score entry
      let scoreText = `<strong>${index + 1}.</strong> ${entry.alias} – ${entry.btc} BTC`
      if (entry.glock === "Yes") {
        scoreText += " – with Glock"
      }
      scoreContent.innerHTML = scoreText
  
      // Create game hash element
      const hashSpan = document.createElement("span")
      hashSpan.className = "game-hash"
      if (entry.hash) {
        hashSpan.textContent = `[Game #${entry.hash.substring(0, 6)}]`
      }
  
      // Create date element
      const dateSpan = document.createElement("span")
      dateSpan.className = "score-date"
      if (entry.timestamp) {
        const date = new Date(entry.timestamp)
        dateSpan.textContent = date.toLocaleDateString()
      }
  
      // Add all elements to the list item
      item.appendChild(scoreContent)
      item.appendChild(hashSpan)
      item.appendChild(dateSpan)
  
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
    noteItem.className = "sample-data-note score-item"
    noteItem.innerHTML = "⚠️ Showing sample data - could not connect to leaderboard server"
    scoreList.appendChild(noteItem)
  
    // Display scores
    sampleScores.forEach((entry, index) => {
      const item = document.createElement("li")
      item.className = "score-item sample-data"
  
      // Create main score content
      const scoreContent = document.createElement("div")
      scoreContent.className = "score-content"
  
      // Format the main score entry
      let scoreText = `<strong>${index + 1}.</strong> ${entry.alias} – ${entry.btc} BTC`
      if (entry.glock === "Yes") {
        scoreText += " – with Glock"
      }
      scoreContent.innerHTML = scoreText
  
      // Create game hash element
      const hashSpan = document.createElement("span")
      hashSpan.className = "game-hash"
      if (entry.hash) {
        hashSpan.textContent = `[Game #${entry.hash}]`
      }
  
      // Add all elements to the list item
      item.appendChild(scoreContent)
      item.appendChild(hashSpan)
  
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
        color: #0f0;
        margin-bottom: 10px;
        font-style: italic;
      }
      
      .sample-data {
        opacity: 0.8;
      }
      
      .status-success {
        color: #0f0;
        font-size: 0.9rem;
        text-shadow: 0 0 3px #0f0;
      }
      
      .status-error {
        color: #ff6666;
        font-size: 0.9rem;
        text-shadow: 0 0 3px #ff6666;
      }
    `
    document.head.appendChild(style)
  }
  
  // Add the styles when the script loads
  addLeaderboardStyles()
  
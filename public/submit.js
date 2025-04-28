// Score submission functionality for Silk Ave

document.addEventListener("DOMContentLoaded", () => {
    // Check if we have game data in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const gameData = urlParams.get("gameData")
  
    if (gameData) {
      try {
        // Decode and parse the game data
        const decodedData = JSON.parse(atob(gameData))
  
        // Verify we have valid game data
        if (!decodedData.btc || !decodedData.hash) {
          // Invalid game data - show thematic error
          showInvalidAccessMessage()
          return
        }
  
        // Pre-fill the form with the game data
        document.getElementById("btc").value = decodedData.btc || ""
        document.getElementById("glock").value = decodedData.glock ? "Yes" : "No"
  
        // Store the game hash in the hidden field
        if (decodedData.hash) {
          document.getElementById("hash").value = decodedData.hash
        }
      } catch (e) {
        console.error("Error parsing game data:", e)
        showInvalidAccessMessage()
      }
    } else {
      // No game data - show thematic error
      showInvalidAccessMessage()
    }
  })
  
  // Show thematic message for invalid access attempts
  function showInvalidAccessMessage() {
    const form = document.getElementById("scoreForm")
    form.style.display = "none"
  
    const message = document.getElementById("successMessage")
    message.classList.remove("hidden")
    message.classList.add("error-message")
  
    // Array of thematic error messages
    const errorMessages = [
      "ACCESS DENIED: Nice try, script kiddie. Our zero-day exploits detected your pathetic attempt to hack the leaderboard. Play the game like everyone else.",
  
      "SECURITY BREACH DETECTED: Your IP has been logged and forwarded to the darknet authorities. Or you could just play the game legitimately...",
  
      "SYSTEM: Countermeasures activated. Your attempt to falsify dark web credentials has been flagged. Real dealers earn their BTC the hard way.",
  
      "CRITICAL ERROR: Fake score submission detected. Did you really think our blockchain verification would miss that? Come back when you've actually run product.",
  
      "TERMINAL LOCKOUT: Your amateur attempt to spoof game data has triggered our dead man's switch. Earn your spot on the leaderboard or stay off the network.",
    ]
  
    // Pick a random error message
    const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)]
  
    // Create the error message with proper styling
    const errorSpan = document.createElement("span")
    errorSpan.style.color = "red"
    errorSpan.style.fontWeight = "bold"
    errorSpan.textContent = "[!] " + randomMessage
  
    // Clear the message div and append the styled error
    message.innerHTML = ""
    message.appendChild(errorSpan)
  
    // Add a return button with thematic text
    const returnButton = document.createElement("button")
    returnButton.textContent = "Return to Surface Web"
    returnButton.style.marginTop = "1rem"
    returnButton.onclick = () => {
      window.location.href = "index.html"
    }
    message.appendChild(returnButton)
  
    // Add a typing effect to just the text content
    const fullText = randomMessage
    errorSpan.textContent = "[!] "
    let i = 0
  
    function typeWriter() {
      if (i < fullText.length) {
        errorSpan.textContent += fullText.charAt(i)
        i++
        setTimeout(typeWriter, 15) // typing speed
      }
    }
  
    // Start typing effect
    typeWriter()
  
    // Play error sound
    const sound = document.getElementById("bleep")
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log("Audio play failed:", e))
    }
  }
  
  // Play sound effect
  function playBleep() {
    const sound = document.getElementById("bleep")
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log("Audio play failed:", e))
    }
  }
  
  // Submit score function
  function submitScore() {
    playBleep()
  
    const form = document.getElementById("scoreForm")
    const alias = document.getElementById("alias").value
    const btc = document.getElementById("btc").value
    const glock = document.getElementById("glock").value
    const hash = document.getElementById("hash").value
  
    if (!alias || !btc || !hash) {
      alert("Please fill in all required fields")
      return
    }
  
    // Prepare the data to send to the backend
    const scoreData = {
      alias: alias,
      btc: Number.parseInt(btc, 10),
      glock: glock,
      hash: hash,
      timestamp: new Date().toISOString(),
    }
  
    // Send the data to the backend
    fetch("https://silkave-backend.onrender.com/submit-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scoreData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        return response.json()
      })
      .then((data) => {
        // Show success message
        form.style.display = "none"
        const successMsg = document.getElementById("successMessage")
        successMsg.classList.remove("hidden")
        successMsg.classList.remove("error-message") // Remove error styling if present
  
        // Clear previous content
        successMsg.innerHTML = ""
  
        // Add success text
        const successText = document.createElement("div")
        successText.textContent = "Score submitted successfully! Check the leaderboard to see your ranking."
        successMsg.appendChild(successText)
  
        // Add a view leaderboard button
        const leaderboardButton = document.createElement("button")
        leaderboardButton.textContent = "View Leaderboard"
        leaderboardButton.style.marginTop = "1rem"
        leaderboardButton.onclick = () => {
          window.location.href = "leaderboard.html"
        }
        successMsg.appendChild(leaderboardButton)
      })
      .catch((error) => {
        console.error("Error submitting score:", error)
        // Show error message but still hide the form
        form.style.display = "none"
        const errorMsg = document.getElementById("successMessage")
        errorMsg.classList.remove("hidden")
        errorMsg.classList.add("error-message")
  
        // Clear previous content
        errorMsg.innerHTML = ""
  
        // Add error text
        const errorText = document.createElement("div")
        errorText.textContent = "Connection to secure server failed. Proxy may be compromised."
        errorText.style.color = "red"
        errorMsg.appendChild(errorText)
  
        // Add a retry button
        const retryButton = document.createElement("button")
        retryButton.textContent = "Reroute Connection"
        retryButton.style.marginTop = "1rem"
        retryButton.onclick = () => {
          window.location.reload()
        }
        errorMsg.appendChild(retryButton)
      })
  }
  
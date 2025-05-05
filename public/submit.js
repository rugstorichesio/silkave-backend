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

  // Add submit event listener to the form
  const form = document.getElementById("scoreForm")
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      submitScore()
    })
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

  // Show loading indicator
  const submitButton = document.querySelector("#scoreForm button[type='submit']")
  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = "Submitting..."
  }

  const form = document.getElementById("scoreForm")
  const alias = document.getElementById("alias").value
  const btc = document.getElementById("btc").value
  const glock = document.getElementById("glock").value
  const hash = document.getElementById("hash").value

  if (!alias || !btc || !hash) {
    alert("Please fill in all required fields")
    if (submitButton) {
      submitButton.disabled = false
      submitButton.textContent = "Submit Score"
    }
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

  // Instead of trying to send to a real server, we'll simulate a successful submission
  // This is a local version that doesn't require a backend
  simulateSuccessfulSubmission(scoreData, form)
}

// Simulate a successful submission without a backend
function simulateSuccessfulSubmission(scoreData, form) {
  // Store the score in localStorage for potential future use
  try {
    const existingScores = JSON.parse(localStorage.getItem("silkAveScores") || "[]")
    existingScores.push(scoreData)
    localStorage.setItem("silkAveScores", JSON.stringify(existingScores))
  } catch (e) {
    console.error("Error saving to localStorage:", e)
  }

  // Hide the form
  form.style.display = "none"

  // Show success message
  const successMsg = document.getElementById("successMessage")
  successMsg.classList.remove("hidden")
  successMsg.classList.remove("error-message") // Remove error styling if present

  // Clear previous content
  successMsg.innerHTML = ""

  // Add success text with animation
  const successText = document.createElement("div")
  successText.className = "success-message"
  successText.innerHTML = `<span class="success-icon">✓</span> Score submitted successfully!<br>Your score of ${scoreData.btc} BTC has been recorded.`
  successMsg.appendChild(successText)

  // Add a view leaderboard button
  const leaderboardButton = document.createElement("button")
  leaderboardButton.textContent = "View Leaderboard"
  leaderboardButton.className = "action-button"
  leaderboardButton.style.marginTop = "1rem"
  leaderboardButton.onclick = () => {
    window.location.href = "leaderboard.html"
  }
  successMsg.appendChild(leaderboardButton)

  // Add a play again button
  const playAgainButton = document.createElement("button")
  playAgainButton.textContent = "Play Again"
  playAgainButton.className = "action-button"
  playAgainButton.style.marginTop = "1rem"
  playAgainButton.style.marginLeft = "1rem"
  playAgainButton.onclick = () => {
    window.location.href = "companion.html"
  }
  successMsg.appendChild(playAgainButton)

  // Play success sound
  playSound("success")
}

// Play a sound
function playSound(soundId) {
  try {
    const sound = document.getElementById(soundId || "bleep")
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log("Audio play failed:", e))
    }
  } catch (e) {
    console.error("Error playing sound:", e)
  }
}

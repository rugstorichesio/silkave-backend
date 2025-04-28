// Score submission functionality for Silk Ave

document.addEventListener("DOMContentLoaded", () => {
    // Check if we have game data in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const gameData = urlParams.get("gameData")
  
    if (gameData) {
      try {
        // Decode and parse the game data
        const decodedData = JSON.parse(atob(gameData))
  
        // Pre-fill the form with the game data
        document.getElementById("btc").value = decodedData.btc || ""
        document.getElementById("glock").value = decodedData.glock ? "Yes" : "No"
  
        // Store the game hash in the hidden field
        if (decodedData.hash) {
          document.getElementById("hash").value = decodedData.hash
        }
      } catch (e) {
        console.error("Error parsing game data:", e)
      }
    }
  })
  
  // Declare playBleep function (replace with actual implementation or import)
  function playBleep() {
    // Placeholder for the bleep sound effect
    console.log("Bleep!")
  }
  
  // Submit score function
  function submitScore() {
    playBleep()
  
    const form = document.getElementById("scoreForm")
    const alias = document.getElementById("alias").value
    const btc = document.getElementById("btc").value
    const glock = document.getElementById("glock").value
    const hash = document.getElementById("hash").value
  
    if (!alias || !btc) {
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
        document.getElementById("successMessage").classList.remove("hidden")
        document.getElementById("successMessage").textContent =
          "Score submitted successfully! Check the leaderboard to see your ranking."
      })
      .catch((error) => {
        console.error("Error submitting score:", error)
        // Show error message but still hide the form
        form.style.display = "none"
        document.getElementById("successMessage").classList.remove("hidden")
        document.getElementById("successMessage").textContent =
          "Could not connect to the server, but your score has been recorded locally. Please try again later."
      })
  }
  
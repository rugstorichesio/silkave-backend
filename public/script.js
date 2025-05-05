// Silk Ave - Game Companion Script

const btc = 100
const glock = false
const cycle = 1
const inventory = {}
const currentPrices = {}
const eventCode = ""
const isRollCard = false
const blockBuying = false
const blockSelling = false
const bannedItem = null
const inventoryLimit = 20
const gameHistory = []
const ignoreNextNegative = false // For card 022 - Silk Security Patch
let isAdvancing = false // Flag to prevent multiple advances

// Add this after the other global variables
const specialPriceItems = {} // Track items with special prices from events

// Replace the entire sound system implementation at the top of the file with this more compatible version:

// Sound system using Web Audio API with better browser compatibility
const AudioContext = window.AudioContext || window.webkitAudioContext
let audioContext

// Initialize audio context on first user interaction
function initAudio() {
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
      console.log("Audio context initialized successfully")
    } catch (e) {
      console.error("Failed to initialize audio context:", e)
    }
  }
}

// Play a cyberpunk-themed sound with the Web Audio API
function playSound(soundType = "click") {
  try {
    // Initialize audio if needed
    if (!audioContext) {
      initAudio()
    }

    if (!audioContext || audioContext.state === "suspended") {
      console.log("Audio context is not available or is suspended. Resuming...")
      if (audioContext) {
        audioContext.resume().catch((err) => console.error("Failed to resume audio context:", err))
      }
      return Promise.resolve(false)
    }

    console.log(`Attempting to play sound: ${soundType}`)

    // Create oscillator and gain nodes
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Map sound type to appropriate parameters
    switch (soundType) {
      case "bleep": // Terminal beep sound
        oscillator.type = "square"
        oscillator.frequency.value = 660
        gainNode.gain.value = 0.1

        // Connect nodes: oscillator -> gain -> destination
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Start and stop
        oscillator.start()
        setTimeout(() => {
          try {
            oscillator.stop()
          } catch (e) {
            console.log("Oscillator already stopped")
          }
        }, 150)
        break

      case "click": // Data packet transmission sound
        oscillator.type = "sine"
        oscillator.frequency.value = 1000
        gainNode.gain.value = 0.05

        // Connect nodes
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Start and stop
        oscillator.start()
        setTimeout(() => {
          try {
            oscillator.stop()
          } catch (e) {
            console.log("Oscillator already stopped")
          }
        }, 30)
        break

      case "error": // System error sound
        oscillator.type = "sawtooth"
        oscillator.frequency.value = 220
        gainNode.gain.value = 0.1

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start()
        setTimeout(() => {
          try {
            oscillator.stop()
          } catch (e) {
            console.log("Oscillator already stopped")
          }
        }, 200)
        break

      case "success": // Transaction complete sound
        oscillator.type = "triangle"
        oscillator.frequency.value = 440
        gainNode.gain.value = 0.1

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start()
        setTimeout(() => {
          try {
            oscillator.frequency.value = 660
          } catch (e) {
            console.log("Could not change frequency")
          }
        }, 100)
        setTimeout(() => {
          try {
            oscillator.stop()
          } catch (e) {
            console.log("Oscillator already stopped")
          }
        }, 200)
        break

      default: // Default to click sound
        oscillator.type = "sine"
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.05

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start()
        setTimeout(() => {
          try {
            oscillator.stop()
          } catch (e) {
            console.log("Oscillator already stopped")
          }
        }, 50)
    }

    console.log(`Sound played: ${soundType}`)
    return Promise.resolve(true)
  } catch (e) {
    console.error("Failed to play sound:", e)
    return Promise.resolve(false)
  }
}

// Add a test sound function that plays different sounds in sequence
function testSound() {
  console.log("Testing sounds...")

  // Initialize audio on first interaction
  initAudio()

  // Make sure audio context is resumed
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch((err) => console.error("Failed to resume audio context:", err))
  }

  // Play a simple beep as a fallback if the other sounds fail
  const simpleBeep = () => {
    try {
      if (!audioContext || audioContext.state !== "running") {
        console.log("Audio context not available for simple beep")
        return
      }

      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()

      osc.type = "sine"
      osc.frequency.value = 440
      gain.gain.value = 0.1

      osc.connect(gain)
      gain.connect(audioContext.destination)

      osc.start()
      setTimeout(() => osc.stop(), 200)

      console.log("Simple beep played")
    } catch (e) {
      console.error("Even simple beep failed:", e)
    }
  }

  // Try to play the sequence, with fallback to simple beep
  simpleBeep()

  // Log that we attempted to play sounds
  console.log("Sound test complete - check console for errors")
}

// Initialize audio on first user interaction
document.addEventListener(
  "click",
  function initSound() {
    console.log("First user interaction - initializing audio")
    initAudio()

    // Try to resume audio context if it's suspended
    if (audioContext && audioContext.state === "suspended") {
      audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully")
        })
        .catch((err) => {
          console.error("Failed to resume AudioContext:", err)
        })
    }

    // Remove this listener after first click
    document.removeEventListener("click", initSound)
  },
  { once: true },
)

// Game flow state tracking
let gameFlowState = "enterEventCode"

const items = ["lsd", "weed", "cocaine", "mdma", "passports", "accounts", "ccs", "files"]
const itemNames = {
  lsd: "LSD",
  weed: "Weed",
  cocaine: "Cocaine",
  mdma: "MDMA",
  passports: "Forged Passports",
  accounts: "Hacked Accounts",
  ccs: "Skimmed Credit Cards",
  files: "Leaked Intel",
}
const priceMatrix = {
  lsd: [1, 1, 2, 3, 4, 5],
  weed: [1, 2, 3, 3, 4, 5],
  cocaine: [4, 5, 6, 7, 8, 9],
  mdma: [3, 4, 5, 6, 7, 8],
  passports: [2, 3, 4, 5, 6, 7],
  accounts: [3, 4, 5, 6, 7, 8],
  ccs: [2, 3, 5, 6, 7, 9],
  files: [4, 5, 6, 7, 8, 10],
}

// Update status bars with current game state
function updateStatusBars() {
  // Update the status bars at the top and bottom
  document.getElementById("cycle").textContent = cycle
  document.getElementById("cycleBottom").textContent = cycle
  document.getElementById("btc").textContent = btc
  document.getElementById("btcBottom").textContent = btc
  document.getElementById("glock").textContent = glock ? "Yes" : "No"
  document.getElementById("glockBottom").textContent = glock ? "Yes" : "No"

  // Count inventory items
  let totalItems = 0
  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      totalItems += inventory[item].length
    }
  }

  document.getElementById("invCount").textContent = totalItems
  document.getElementById("invCountBottom").textContent = totalItems

  // Update the liquid BTC display
  document.getElementById("liquidBtc").textContent = btc
}

// Update inventory display with current items
function updateInventoryDisplay() {
  const inventoryStatus = document.getElementById("inventoryStatus")
  let inventoryText = "Current Inventory:\n"

  let totalItems = 0

  for (const item of items) {
    const itemInventory = inventory[item] || []
    if (itemInventory.length > 0) {
      // Calculate average purchase price
      const totalCost = itemInventory.reduce((sum, price) => sum + price, 0)
      const avgPrice = (totalCost / itemInventory.length).toFixed(1)

      // Show item count and purchase prices
      inventoryText += `${itemNames[item]}: ${itemInventory.length} (bought @ ${avgPrice} BTC each)`

      // Add individual prices if there are few items
      if (itemInventory.length <= 5) {
        inventoryText += ` [${itemInventory.join(", ")} BTC]`
      }

      inventoryText += "\n"
      totalItems += itemInventory.length
    }
  }

  if (totalItems === 0) {
    inventoryText += "Empty"
  }

  inventoryStatus.textContent = inventoryText

  // Update the owned quantities in the transaction table
  for (const item of items) {
    const ownedElement = document.getElementById(`owned-${item}`)
    if (ownedElement) {
      const itemCount = (inventory[item] || []).length
      ownedElement.textContent = itemCount

      // Highlight if player owns any
      if (itemCount > 0) {
        ownedElement.style.color = "#0f0"
        ownedElement.style.fontWeight = "bold"
      } else {
        ownedElement.style.color = ""
        ownedElement.style.fontWeight = ""
      }
    }
  }
}

// Add log message to the game log
function log(message) {
  const logElement = document.getElementById("log")
  if (logElement) {
    // Add timestamp to the message
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${message}`

    // Prepend the message to the log (newest at top)
    logElement.textContent = formattedMessage + "\n" + logElement.textContent

    // Trim log if it gets too long
    const maxLines = 100
    const lines = logElement.textContent.split("\n")
    if (lines.length > maxLines) {
      logElement.textContent = lines.slice(0, maxLines).join("\n")
    }
  }
  console.log(message) // Also log to console for debugging
}

// Clear all inventory
function clearInventory() {
  for (const item of items) {
    inventory[item] = []
  }
  log("-- Inventory cleared")
  updateInventoryDisplay()
}

// Halve all prices
function halvePrices() {
  const newPrices = {}
  for (const item in currentPrices) {
    if (currentPrices.hasOwnProperty(item)) {
      newPrices[item] = Math.max(1, Math.floor(currentPrices[item] / 2))
    }
  }
  return newPrices
}

// Double all prices
function doublePrices() {
  const newPrices = {}
  for (const item in currentPrices) {
    if (currentPrices.hasOwnProperty(item)) {
      newPrices[item] = currentPrices[item] * 2
    }
  }
  return newPrices
}

// Replace the showConfirm function with a direct call to the custom modal
function showConfirm(title, message, confirmText, cancelText) {
  // Create a new promise that will be resolved when the user makes a choice
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div")
    overlay.className = "modal-overlay"

    // Create container
    const container = document.createElement("div")
    container.className = "modal-container"

    // Create header
    const header = document.createElement("div")
    header.className = "modal-header"
    header.textContent = title

    // Create content
    const content = document.createElement("div")
    content.className = "modal-content"
    content.textContent = message

    // Create buttons container
    const buttons = document.createElement("div")
    buttons.className = "modal-buttons"

    // Add OK button
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = confirmText || "OK"
    okButton.addEventListener("click", () => {
      document.body.removeChild(overlay)
      resolve(true)
    })

    // Add Cancel button
    const cancelButton = document.createElement("button")
    cancelButton.className = "modal-button"
    cancelButton.textContent = cancelText || "Cancel"
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(overlay)
      resolve(false)
    })

    // Assemble the modal
    buttons.appendChild(okButton)
    buttons.appendChild(cancelButton)
    container.appendChild(header)
    container.appendChild(content)
    container.appendChild(buttons)
    overlay.appendChild(container)

    // Add to document
    document.body.appendChild(overlay)

    // Play sound
    playSound("bleep")
  })
}

// Replace the showPrompt function with a direct implementation
function showPrompt(title, message) {
  // Create a new promise that will be resolved when the user makes a choice
  return new Promise((resolve) => {
    let inputValue = ""

    // Create overlay
    const overlay = document.createElement("div")
    overlay.className = "modal-overlay"

    // Create container
    const container = document.createElement("div")
    container.className = "modal-container"

    // Create header
    const header = document.createElement("div")
    header.className = "modal-header"
    header.textContent = title

    // Create content
    const content = document.createElement("div")
    content.className = "modal-content"
    content.textContent = message

    // Create input field
    const input = document.createElement("input")
    input.type = "text"
    input.className = "modal-input"
    input.placeholder = "Enter your response..."
    input.addEventListener("input", (e) => {
      inputValue = e.target.value
    })

    // Create buttons container
    const buttons = document.createElement("div")
    buttons.className = "modal-buttons"

    // Add OK button
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = "OK"
    okButton.addEventListener("click", () => {
      document.body.removeChild(overlay)
      resolve(inputValue)
    })

    // Add Cancel button
    const cancelButton = document.createElement("button")
    cancelButton.className = "modal-button"
    cancelButton.textContent = "Cancel"
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(overlay)
      resolve(null)
    })

    // Assemble the modal
    buttons.appendChild(okButton)
    buttons.appendChild(cancelButton)
    container.appendChild(header)
    container.appendChild(content)
    container.appendChild(input)
    container.appendChild(buttons)
    overlay.appendChild(container)

    // Add to document
    document.body.appendChild(overlay)

    // Focus the input after a short delay
    setTimeout(() => input.focus(), 100)

    // Play sound
    playSound("bleep")
  })
}

function countInventory() {
  let total = 0
  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      total += inventory[item].length
    }
  }
  return total
}

function wipeHalfInventory() {
  const itemsToRemove = Math.ceil(countInventory() / 2)
  const allItems = []

  // Collect all items into a single array
  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      allItems.push(...inventory[item])
    }
  }

  // Remove random items
  for (let i = 0; i < itemsToRemove; i++) {
    if (allItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * allItems.length)
      allItems.splice(randomIndex, 1)
    }
  }

  // Rebuild the inventory object
  clearInventory()
  for (const itemValue of allItems) {
    const itemName = Object.keys(itemNames).find((key) => itemNames[key] === itemValue)
    if (itemName) {
      if (!inventory[itemName]) {
        inventory[itemName] = []
      }
      inventory[itemName].push(itemValue)
    }
  }

  updateInventoryDisplay()
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the game log
  const logElement = document.getElementById("log")
  if (logElement && logElement.textContent === "") {
    log("Welcome to Silk Ave. You start with 100 BTC. Good luck.")
  }

  // Initialize the inventory display
  updateInventoryDisplay()

  // Initialize the market table
  updateMarketTable()

  // CRITICAL: Remove all existing event listeners from the advance cycle button
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (advanceButton) {
    // Clone and replace to remove all event listeners
    const newAdvanceButton = advanceButton.cloneNode(true)
    advanceButton.parentNode.replaceChild(newAdvanceButton, advanceButton)

    // Add a single, robust event listener
    newAdvanceButton.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("BUTTON CLICK: Advance cycle button clicked")

      // Call the advanceCycle function directly
      advanceCycle()
    })

    console.log("EVENT SETUP: Added single event listener to advance button")
  }

  // Add event listener for the sell everything button
  const sellAllButton = document.getElementById("sellAllBtn")
  if (sellAllButton) {
    const newSellAllButton = sellAllButton.cloneNode(true)
    sellAllButton.parentNode.replaceChild(newSellAllButton, sellAllButton)
    newSellAllButton.addEventListener("click", sellEverything)
  }

  // Add event listener for event code input
  const eventCodeInput = document.getElementById("eventCode")
  if (eventCodeInput) {
    const newEventCodeInput = eventCodeInput.cloneNode(true)
    eventCodeInput.parentNode.replaceChild(newEventCodeInput, eventCodeInput)
    newEventCodeInput.addEventListener("input", function () {
      if (this.value.length === 3 && gameFlowState === "enterEventCode") {
        gameFlowState = "applyEvent"
        updateGameFlowHighlight()
      }
    })
  }

  // Start the guided highlighting
  updateGameFlowHighlight()

  // Add a global click handler to log all button clicks for debugging
  document.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      console.log(`BUTTON CLICK: ${e.target.textContent || e.target.id || "unknown button"}`)
    }
  })

  // Add sound effects to all buttons with better error handling
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (e) => {
      // Don't interfere with other click handlers
      if (!e.defaultPrevented) {
        playSound("bleep")
      }
    })
  })

  // Also add sound effects to select elements when they change
  document.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", () => {
      playSound("bleep")
    })
  })

  // Add sound effects to the event code input when user presses Enter
  const eventCodeInputEnter = document.getElementById("eventCode")
  if (eventCodeInputEnter) {
    eventCodeInputEnter.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        playSound("bleep")
        applyEvent()
      }
    })
  }

  // Initialize the game state
  console.log(`GAME INIT: Starting at cycle ${cycle}`)
  isAdvancing = false
})

// Add this function to play a sound directly using the Web Audio API
// as a last resort if the audio elements aren't working

// Declare the missing variables
function updateMarketTable() {}
function advanceCycle() {}
function sellEverything() {}
function updateGameFlowHighlight() {}
function applyEvent() {}

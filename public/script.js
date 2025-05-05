// Silk Ave - Game Companion Script

// Game state variables
let btc = 100
let glock = false
let inventory = {}
const gameHash = generateGameHash()
let burnItem = ""
let currentEventCode = ""
let gameFlowState = "enterEventCode"

// Market variables
const items = ["lsd", "weed", "cocaine", "mdma", "passports", "accounts", "ccs", "files"]
const itemPrices = {
  lsd: 0,
  weed: 0,
  cocaine: 0,
  mdma: 0,
  passports: 0,
  accounts: 0,
  ccs: 0,
  files: 0,
}
const itemNames = {
  lsd: "LSD",
  weed: "Weed",
  cocaine: "Cocaine",
  mdma: "MDMA",
  passports: "Forged Passports",
  accounts: "Hacked Accounts",
  ccs: "Skimmed Credit Cards",
  files: "Leaked Files",
}

// Game settings
const maxInventory = 20
const leaderboard = []
const blockBuying = false
const blockSelling = false
const sortMethod = "default" // For inventory sorting

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Game initialized")

  // Set up event listeners
  document.getElementById("rollMarketButton").addEventListener("click", rollMarket)
  document.getElementById("applyEventButton").addEventListener("click", applyEvent)
  document.getElementById("applyBurnerDealButton").addEventListener("click", applyBurnerDeal)
  document.getElementById("submitScoreButton").addEventListener("click", submitScore)

  // Initialize game state
  updateGameState()

  // Roll initial market prices
  rollMarket()

  // Load events data
  loadEventsData()
})

// Load events data from JSON
function loadEventsData() {
  fetch("events.json")
    .then((response) => response.json())
    .then((data) => {
      console.log("Events data loaded")
      window.eventsData = data
    })
    .catch((error) => {
      console.error("Error loading events data:", error)
      showOutcome("Error: Could not load events data. Check console for details.")
    })
}

// Update game state display
function updateGameState() {
  // Update BTC display
  const btcDisplay = document.getElementById("btcDisplay")
  if (btcDisplay) btcDisplay.textContent = btc

  // Update Glock display
  const glockDisplay = document.getElementById("glockDisplay")
  if (glockDisplay) glockDisplay.textContent = glock ? "Yes" : "No"

  // Calculate inventory count
  let inventoryCount = 0
  for (const item in inventory) {
    inventoryCount += inventory[item] || 0
  }

  // Update inventory display
  const inventoryDisplay = document.getElementById("inventoryDisplay")
  if (inventoryDisplay) inventoryDisplay.textContent = `${inventoryCount}/${maxInventory}`

  // Update game flow state in status bar
  updateStatusBar(`Game flow highlight: ${gameFlowState}, BTC: ${btc}`)
}

// Update status bar
function updateStatusBar(message) {
  const statusBar = document.getElementById("statusBar")
  if (statusBar) {
    statusBar.textContent = message
  }
}

// Show outcome message
function showOutcome(message, isError = false) {
  const outcomeDisplay = document.getElementById("outcomeDisplay")
  if (outcomeDisplay) {
    // Clear previous content
    outcomeDisplay.innerHTML = ""

    // Create checkmark or error icon
    const icon = document.createElement("span")
    icon.textContent = isError ? "✗ " : "✓ "
    icon.style.color = isError ? "#f00" : "#0f0"
    icon.style.fontWeight = "bold"

    // Create message text
    const messageText = document.createTextNode(message)

    // Append to outcome display
    outcomeDisplay.appendChild(icon)
    outcomeDisplay.appendChild(messageText)

    // Add error class if needed
    if (isError) {
      outcomeDisplay.classList.add("error")
    } else {
      outcomeDisplay.classList.remove("error")
    }
  }
}

// Show confirmation dialog
function showConfirm(title, message, okText, cancelText) {
  return new Promise((resolve) => {
    // Create modal elements
    const modal = document.createElement("div")
    modal.className = "modal"

    const modalContent = document.createElement("div")
    modalContent.className = "modal-content"

    const titleElement = document.createElement("h3")
    titleElement.textContent = title

    const messageElement = document.createElement("p")
    messageElement.textContent = message

    const buttonContainer = document.createElement("div")
    buttonContainer.className = "button-container"

    const okButton = document.createElement("button")
    okButton.textContent = okText || "OK"
    okButton.onclick = () => {
      document.body.removeChild(modal)
      resolve(true)
    }

    const cancelButton = document.createElement("button")
    cancelButton.textContent = cancelText || "Cancel"
    cancelButton.onclick = () => {
      document.body.removeChild(modal)
      resolve(false)
    }

    // Assemble modal
    buttonContainer.appendChild(okButton)
    buttonContainer.appendChild(cancelButton)

    modalContent.appendChild(titleElement)
    modalContent.appendChild(messageElement)
    modalContent.appendChild(buttonContainer)

    modal.appendChild(modalContent)

    // Add to document
    document.body.appendChild(modal)
  })
}

// Show prompt dialog
function showPrompt(title, message, defaultValue) {
  return new Promise((resolve) => {
    // Create modal elements
    const modal = document.createElement("div")
    modal.className = "modal"

    const modalContent = document.createElement("div")
    modalContent.className = "modal-content"

    const titleElement = document.createElement("h3")
    titleElement.textContent = title

    const messageElement = document.createElement("p")
    messageElement.textContent = message

    const inputElement = document.createElement("input")
    inputElement.type = "text"
    inputElement.value = defaultValue || ""

    const buttonContainer = document.createElement("div")
    buttonContainer.className = "button-container"

    const okButton = document.createElement("button")
    okButton.textContent = "OK"
    okButton.onclick = () => {
      document.body.removeChild(modal)
      resolve(inputElement.value)
    }

    const cancelButton = document.createElement("button")
    cancelButton.textContent = "Cancel"
    cancelButton.onclick = () => {
      document.body.removeChild(modal)
      resolve(null)
    }

    // Assemble modal
    buttonContainer.appendChild(okButton)
    buttonContainer.appendChild(cancelButton)

    modalContent.appendChild(titleElement)
    modalContent.appendChild(messageElement)
    modalContent.appendChild(inputElement)
    modalContent.appendChild(buttonContainer)

    modal.appendChild(modalContent)

    // Add to document
    document.body.appendChild(modal)

    // Focus input
    setTimeout(() => {
      inputElement.focus()
      inputElement.select()
    }, 100)
  })
}

// Roll market prices
function rollMarket() {
  console.log("[GAME FLOW] Rolling market prices")
  gameFlowState = "rollMarket"
  updateGameState()

  // Store current prices for comparison
  const oldPrices = { ...itemPrices }

  // Generate new prices
  items.forEach((item) => {
    // Base price is 1-3 BTC
    const basePrice = Math.floor(Math.random() * 3) + 1
    itemPrices[item] = basePrice
  })

  // Update market table
  updateMarketTable()

  // Show success message
  showOutcome("Market prices updated")
}

// Update market table with current prices
function updateMarketTable() {
  const marketTable = document.getElementById("marketTable")
  if (!marketTable) return

  // Clear existing rows except header
  while (marketTable.rows.length > 1) {
    marketTable.deleteRow(1)
  }

  // If table is empty, add header row
  if (marketTable.rows.length === 0) {
    const headerRow = marketTable.insertRow()
    const itemHeader = headerRow.insertCell()
    itemHeader.textContent = "Item"
    const priceHeader = headerRow.insertCell()
    priceHeader.textContent = "Price"
  }

  // Add rows for each item
  items.forEach((item) => {
    const row = marketTable.insertRow()

    // Item name cell
    const itemCell = row.insertCell()
    itemCell.textContent = itemNames[item] || item

    // Price cell
    const priceCell = row.insertCell()
    priceCell.textContent = `${itemPrices[item]} BTC`
  })
}

// Apply an event card
function applyEvent() {
  const eventCodeInput = document.getElementById("eventCodeInput")
  if (!eventCodeInput) return

  const eventCode = eventCodeInput.value.trim()

  if (!eventCode) {
    showOutcome("Please enter an event code", true)
    return
  }

  console.log(`[GAME FLOW] Applying event (State: ${gameFlowState})`)
  gameFlowState = "applyingEvent"
  updateGameState()

  // Check if events data is loaded
  if (!window.eventsData) {
    showOutcome("Events data not loaded. Please refresh the page.", true)
    return
  }

  // Check if event code exists
  const event = window.eventsData[eventCode]
  if (!event) {
    showOutcome(`Invalid event code: ${eventCode}`, true)
    return
  }

  // Store current event code
  currentEventCode = eventCode

  // Run card effect for this event code
  try {
    runCardEffect(eventCode)
  } catch (error) {
    console.error(`Error in runCardEffect for code ${eventCode}:`, error)
    showOutcome(`Error: ${error.message}`, true)
  }
}

// Run card effect based on event code
function runCardEffect(code) {
  console.log(`Running card effect for code ${code}`)

  // Get event data
  const event = window.eventsData[code]
  if (!event) {
    throw new Error(`Event code ${code} not found`)
  }

  // Display event title and flavor text
  const cardResultElement = document.getElementById("outcomeDisplay")
  if (cardResultElement) {
    cardResultElement.innerHTML = `
            <div class="card-result">
                <div style="font-weight: bold; margin-bottom: 5px;">${event.title}</div>
                <div style="font-style: italic; margin-bottom: 10px;">${event.flavor}</div>
                <div>${event.effect}</div>
            </div>
        `
  }

  // Handle specific event codes
  switch (code) {
    case "001":
      // FBI Sting
      handleFBISting()
      break
    case "005":
      // Burner Account Blows Up
      handleBurnerAccountEvent()
      break
    case "007":
      // Crypto Crash
      handleCryptoCrash()
      break
    // Add more event handlers as needed
    default:
      // Generic handling based on effect type
      handleGenericEvent(event)
  }

  // Update game state after event
  updateGameState()
}

// Handle FBI Sting event
function handleFBISting() {
  // Roll 1d6
  const roll = Math.floor(Math.random() * 6) + 1

  if (roll <= 2) {
    // Lose all inventory + 50 BTC
    inventory = {}
    btc = Math.max(0, btc - 50)
    showOutcome(`FBI Sting: You rolled ${roll}. You lose all inventory and 50 BTC!`)
  } else {
    // Lose 1 Glock or 20 BTC
    if (glock) {
      glock = false
      showOutcome(`FBI Sting: You rolled ${roll}. You lose your Glock.`)
    } else {
      btc = Math.max(0, btc - 20)
      showOutcome(`FBI Sting: You rolled ${roll}. You lose 20 BTC.`)
    }
  }
}

// Handle Burner Account event
function handleBurnerAccountEvent() {
  showConfirm(
    "Burner Account Blows Up",
    "Choose your loss: Lose 1 Glock OR lose 10 BTC",
    "Lose Glock",
    "Lose 10 BTC",
  ).then((loseGlock) => {
    if (loseGlock) {
      glock = false
      showOutcome("You chose to lose your Glock.")
    } else {
      btc = Math.max(0, btc - 10)
      showOutcome("You chose to lose 10 BTC.")
    }
    updateGameState()
  })
}

// Handle Crypto Crash event
function handleCryptoCrash() {
  console.log("Running MARKET CRASH effect")

  // Store current prices before halving
  console.log("Current prices before:", { ...itemPrices })

  // Halve all prices (minimum 1)
  items.forEach((item) => {
    itemPrices[item] = Math.max(1, Math.floor(itemPrices[item] / 2))
  })

  console.log("New prices after halving:", { ...itemPrices })

  // Update market table
  updateMarketTable()

  // Show outcome
  showOutcome("Crypto Crash: All prices halved this round!")
}

// Handle generic event based on effect type
function handleGenericEvent(event) {
  switch (event.effectType) {
    case "ROLL":
      const roll = Math.floor(Math.random() * 6) + 1
      showOutcome(`You rolled ${roll}. ${event.effect}`)
      break
    case "FORCED":
      showOutcome(`Forced effect: ${event.effect}`)
      break
    case "CHOICE":
      showOutcome(`Choice required: ${event.effect}`)
      break
    case "MARKET":
      showOutcome(`Market effect: ${event.effect}`)
      break
    case "LUCKY":
      showOutcome(`Lucky event: ${event.effect}`)
      break
    default:
      showOutcome(`Unknown effect type: ${event.effectType}`)
  }
}

// Apply a burner deal
function applyBurnerDeal() {
  const burnerDealSelect = document.getElementById("burnerDealSelect")
  if (!burnerDealSelect) return

  const selectedItem = burnerDealSelect.value

  if (selectedItem === "--Select--") {
    showOutcome("Please select an item for the burner deal", true)
    return
  }

  // Process burner deal
  burnItem = selectedItem

  // Add item to inventory or increase BTC
  const inventoryCount = calculateInventoryCount()

  if (inventoryCount >= maxInventory) {
    // Inventory full, give BTC instead
    btc += 10
    showOutcome(`Inventory full! Received 10 BTC for the ${itemNames[selectedItem]} instead.`)
  } else {
    // Add to inventory
    if (!inventory[selectedItem]) {
      inventory[selectedItem] = 0
    }
    inventory[selectedItem]++
    showOutcome(`Added 1 ${itemNames[selectedItem]} to your inventory.`)
  }

  // Update game state
  updateGameState()
}

// Calculate total inventory count
function calculateInventoryCount() {
  let count = 0
  for (const item in inventory) {
    count += inventory[item] || 0
  }
  return count
}

// Generate a unique game hash
function generateGameHash() {
  return Math.random().toString(36).substring(2, 8)
}

// Submit score to leaderboard
function submitScore() {
  // Prepare score data
  const scoreData = {
    btc: btc,
    glock: glock ? "Yes" : "No",
    hash: gameHash,
  }

  // Encode score data for URL
  const encodedData = btoa(JSON.stringify(scoreData))

  // Redirect to submit page
  window.location.href = `submit.html?gameData=${encodedData}`
}

// Item to row mapping helper
function itemToRow(item) {
  const marketTable = document.getElementById("marketTable")
  if (!marketTable) return null

  for (let i = 1; i < marketTable.rows.length; i++) {
    const row = marketTable.rows[i]
    const itemCell = row.cells[0]

    if (itemCell && itemCell.textContent === itemNames[item]) {
      return row
    }
  }

  return null
}

// Debug function to log game state
function debugGameState() {
  console.log({
    btc,
    glock,
    inventory,
    gameHash,
    itemPrices,
    gameFlowState,
  })
}

// Add debug button to debug panel
document.addEventListener("DOMContentLoaded", () => {
  const debugPanel = document.querySelector(".debug-panel")
  if (debugPanel) {
    debugPanel.addEventListener("click", debugGameState)
  }
})

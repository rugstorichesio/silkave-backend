// Silk Ave - Game Companion Script

// Game state variables
let btc = 100
let glock = false
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
const specialPriceItems = {} // Track items with special prices from events

// Simplified sound system - only using bleep.wav
let bleepSound = null

// Initialize audio
function initAudio() {
  console.log("Initializing audio element for bleep.wav")

  try {
    // Create a new audio element
    bleepSound = new Audio()

    // Try to load the sound file with better error handling
    bleepSound.addEventListener("error", function (e) {
      console.error("Error loading bleep.wav:", e)
      console.error("Error code:", this.error ? this.error.code : "unknown")
      console.error("Error message:", this.error ? this.error.message : "unknown")
      console.log("Current src:", this.src)
    })

    // Set the source - try with and without the "sounds/" directory
    try {
      bleepSound.src = "bleep.wav"
      console.log("Trying to load bleep.wav from root directory")
    } catch (e) {
      console.error("Error setting source:", e)
    }

    // Set properties
    bleepSound.preload = "auto"
    bleepSound.volume = 0.5 // Medium volume

    console.log("Created audio element for bleep.wav")
  } catch (e) {
    console.error("Failed to create audio element:", e)
  }
}

// Play the bleep sound with better error handling
function playBleep() {
  try {
    console.log("Attempting to play bleep sound")

    if (!bleepSound) {
      console.error("Bleep sound not initialized")
      return
    }

    // Reset to beginning if already playing
    bleepSound.currentTime = 0

    // Play the sound with explicit error handling
    bleepSound
      .play()
      .then(() => {
        console.log("Bleep sound played successfully")
      })
      .catch((error) => {
        console.error("Error playing bleep sound:", error)

        // Try reloading the sound from a different path if it fails
        if (bleepSound.src.includes("bleep.wav")) {
          console.log("Trying alternate path for bleep.wav")
          bleepSound.src = "sounds/bleep.wav"
          bleepSound.play().catch((e) => console.error("Alternate path also failed:", e))
        }
      })
  } catch (e) {
    console.error("Failed to play bleep sound:", e)
  }
}

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
    playBleep()
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
    playBleep()
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
  // Initialize audio
  initAudio()

  // Initialize the game log
  const logElement = document.getElementById("log")
  if (logElement && logElement.textContent === "") {
    log("Welcome to Silk Ave. You start with 100 BTC. Good luck.")
  }

  // Initialize the inventory display
  updateInventoryDisplay()

  // Initialize the market table
  updateMarketTable()

  // Remove the test sound button if it exists
  const testSoundBtn = document.getElementById("testSoundBtn")
  if (testSoundBtn && testSoundBtn.parentNode) {
    testSoundBtn.parentNode.removeChild(testSoundBtn)
  }

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
      playBleep() // Play sound

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
    newSellAllButton.addEventListener("click", (e) => {
      playBleep() // Play sound
      sellEverything()
    })
  }

  // Add event listener for the buy glock button
  const buyGlockButton = document.getElementById("buyGlockBtn")
  if (buyGlockButton) {
    const newBuyGlockButton = buyGlockButton.cloneNode(true)
    buyGlockButton.parentNode.replaceChild(newBuyGlockButton, buyGlockButton)
    newBuyGlockButton.addEventListener("click", (e) => {
      playBleep() // Play sound
      buyGlock()
    })
  }

  // Add event listener for the execute transactions button
  const executeTransactionsButton = document.getElementById("executeTransactionsBtn")
  if (executeTransactionsButton) {
    const newExecuteTransactionsButton = executeTransactionsButton.cloneNode(true)
    executeTransactionsButton.parentNode.replaceChild(newExecuteTransactionsButton, executeTransactionsButton)
    newExecuteTransactionsButton.addEventListener("click", (e) => {
      playBleep() // Play sound
      executeTransactions()
    })
  }

  // Add event listener for the apply event button
  const applyEventButton = document.getElementById("applyEventBtn")
  if (applyEventButton) {
    const newApplyEventButton = applyEventButton.cloneNode(true)
    applyEventButton.parentNode.replaceChild(newApplyEventButton, applyEventButton)
    newApplyEventButton.addEventListener("click", (e) => {
      playBleep() // Play sound
      applyEvent()
    })
  }

  // Add event listener for the apply burner deal button
  const applyBurnerButton = document.getElementById("applyBurnerBtn")
  if (applyBurnerButton) {
    const newApplyBurnerButton = applyBurnerButton.cloneNode(true)
    applyBurnerButton.parentNode.replaceChild(newApplyBurnerButton, applyBurnerButton)
    newApplyBurnerButton.addEventListener("click", (e) => {
      playBleep() // Play sound
      applyBurnerDeal()
    })
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

    // Add Enter key handler
    newEventCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        playBleep() // Play sound
        applyEvent()
      }
    })
  }

  // Start the guided highlighting
  updateGameFlowHighlight()

  // Initialize the game state
  console.log(`GAME INIT: Starting at cycle ${cycle}`)
  isAdvancing = false
})

// Add this function definition after the other placeholder functions at the bottom of the file

function rollMarket() {
  console.log("Rolling market prices")
  playBleep()

  // Generate random prices for each item
  for (const item of items) {
    if (priceMatrix[item]) {
      const priceIndex = Math.floor(Math.random() * priceMatrix[item].length)
      currentPrices[item] = priceMatrix[item][priceIndex]
    }
  }

  // Apply any special price modifiers from events
  for (const item in specialPriceItems) {
    if (specialPriceItems.hasOwnProperty(item)) {
      currentPrices[item] = specialPriceItems[item]
    }
  }

  // Update the market table
  updateMarketTable()

  // Log the action
  log("-- Market prices rolled")

  // Update game flow state
  gameFlowState = "selectBurnerDeal"
  updateGameFlowHighlight()
}

// Add this function definition to actually update the market table
function updateMarketTable() {
  const tableBody = document.querySelector("#marketTable tbody")
  if (!tableBody) return

  // Clear existing rows
  tableBody.innerHTML = ""

  // Add a row for each item
  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")
    nameCell.textContent = itemNames[item]
    row.appendChild(nameCell)

    // Price cell
    const priceCell = document.createElement("td")
    priceCell.textContent = currentPrices[item] || "?"

    // Highlight special prices
    if (specialPriceItems[item]) {
      priceCell.style.color = "#ffff00"
      priceCell.style.fontWeight = "bold"
    }

    // Highlight burner deal
    const burnerDeal = document.getElementById("burnerDeal").value
    if (burnerDeal === item) {
      priceCell.classList.add("burner-deal-item")
    }

    row.appendChild(priceCell)

    tableBody.appendChild(row)
  }
}

// Add this function to handle the burner deal
function applyBurnerDeal() {
  console.log("Applying burner deal")
  playBleep()

  const burnerDeal = document.getElementById("burnerDeal").value

  if (!burnerDeal) {
    log("-- No burner deal selected")
    return
  }

  if (currentPrices[burnerDeal]) {
    // Store the original price in specialPriceItems
    specialPriceItems[burnerDeal] = Math.max(1, Math.floor(currentPrices[burnerDeal] / 2))

    // Update the market table
    updateMarketTable()

    log(`-- Burner deal: ${itemNames[burnerDeal]} at half price`)

    // Update game flow state
    gameFlowState = "executeTransactions"
    updateGameFlowHighlight()
  } else {
    log("-- Invalid burner deal selection")
  }
}

// Add this function to highlight the current game flow step
function updateGameFlowHighlight() {
  // Remove highlight from all elements
  document.querySelectorAll(".highlight-pulse").forEach((el) => {
    el.classList.remove("highlight-pulse")
  })

  // Add highlight based on current state
  if (gameFlowState === "enterEventCode") {
    document.getElementById("eventCode").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Enter a 3-digit event card code"
  } else if (gameFlowState === "applyEvent") {
    document.getElementById("applyEventBtn").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Apply the event card"
  } else if (gameFlowState === "rollCard") {
    document.getElementById("rollCardBtn").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Roll for card effect"
  } else if (gameFlowState === "rollMarket") {
    document.getElementById("rollMarketBtn").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Roll market prices"
  } else if (gameFlowState === "selectBurnerDeal") {
    document.getElementById("burnerDeal").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Select a burner deal (optional)"
  } else if (gameFlowState === "executeTransactions") {
    document.getElementById("executeTransactionsBtn").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Buy and sell items, then execute transactions"
  } else if (gameFlowState === "advanceCycle") {
    document.getElementById("advanceCycleBtn").classList.add("highlight-pulse")
    document.getElementById("gameHint").textContent = "Advance to the next cycle"
  }
}

// Add these functions to handle buying and selling
function executeTransactions() {
  console.log("Executing transactions")
  playBleep()

  // Process all buy orders
  for (const item of items) {
    const buyInput = document.getElementById(`buy-${item}`)
    if (buyInput && buyInput.value) {
      const quantity = Number.parseInt(buyInput.value, 10)
      if (quantity > 0) {
        buyItem(item, quantity)
      }
      buyInput.value = "" // Clear the input
    }
  }

  // Process all sell orders
  for (const item of items) {
    const sellInput = document.getElementById(`sell-${item}`)
    if (sellInput && sellInput.value) {
      const quantity = Number.parseInt(sellInput.value, 10)
      if (quantity > 0) {
        sellItem(item, quantity)
      }
      sellInput.value = "" // Clear the input
    }
  }

  // Update displays
  updateStatusBars()
  updateInventoryDisplay()

  // Update game flow state
  gameFlowState = "advanceCycle"
  updateGameFlowHighlight()
}

// Helper function to buy items
function buyItem(item, quantity) {
  if (blockBuying) {
    log(`-- Cannot buy ${itemNames[item]} - buying blocked`)
    return
  }

  if (item === bannedItem) {
    log(`-- Cannot buy ${itemNames[item]} - item banned`)
    return
  }

  const price = currentPrices[item]
  if (!price) {
    log(`-- Cannot buy ${itemNames[item]} - no price available`)
    return
  }

  const totalCost = price * quantity
  if (totalCost > btc) {
    log(`-- Cannot afford ${quantity} ${itemNames[item]} (${totalCost} BTC)`)
    return
  }

  // Check inventory limit
  const currentCount = countInventory()
  if (currentCount + quantity > inventoryLimit) {
    log(`-- Cannot buy ${quantity} ${itemNames[item]} - inventory limit reached`)
    return
  }

  // Add to inventory
  if (!inventory[item]) inventory[item] = []
  for (let i = 0; i < quantity; i++) {
    inventory[item].push(price)
  }

  // Deduct cost
  btc -= totalCost

  log(`-- Bought ${quantity} ${itemNames[item]} for ${totalCost} BTC`)
}

// Helper function to sell items
function sellItem(item, quantity) {
  if (blockSelling) {
    log(`-- Cannot sell ${itemNames[item]} - selling blocked`)
    return
  }

  if (item === bannedItem) {
    log(`-- Cannot sell ${itemNames[item]} - item banned`)
    return
  }

  const itemInventory = inventory[item] || []
  if (itemInventory.length < quantity) {
    log(`-- Not enough ${itemNames[item]} to sell (have ${itemInventory.length})`)
    return
  }

  const price = currentPrices[item]
  if (!price) {
    log(`-- Cannot sell ${itemNames[item]} - no price available`)
    return
  }

  // Remove from inventory (oldest items first)
  const soldItems = itemInventory.splice(0, quantity)

  // Calculate revenue
  const revenue = price * quantity

  // Add revenue
  btc += revenue

  // Calculate profit/loss
  const cost = soldItems.reduce((sum, buyPrice) => sum + buyPrice, 0)
  const profit = revenue - cost

  if (profit >= 0) {
    log(`-- Sold ${quantity} ${itemNames[item]} for ${revenue} BTC (profit: ${profit} BTC)`)
  } else {
    log(`-- Sold ${quantity} ${itemNames[item]} for ${revenue} BTC (loss: ${Math.abs(profit)} BTC)`)
  }
}

// Function to sell everything
function sellEverything() {
  console.log("Selling everything")
  playBleep()

  let totalSold = 0
  let totalRevenue = 0

  for (const item of items) {
    const itemInventory = inventory[item] || []
    const quantity = itemInventory.length

    if (quantity > 0 && currentPrices[item] && item !== bannedItem && !blockSelling) {
      // Calculate revenue
      const revenue = currentPrices[item] * quantity

      // Add revenue
      btc += revenue
      totalRevenue += revenue

      // Clear inventory
      inventory[item] = []

      totalSold += quantity
      log(`-- Sold ${quantity} ${itemNames[item]} for ${revenue} BTC`)
    }
  }

  if (totalSold === 0) {
    log("-- Nothing to sell")
  } else {
    log(`-- Sold everything (${totalSold} items) for ${totalRevenue} BTC`)
  }

  // Update displays
  updateStatusBars()
  updateInventoryDisplay()
}

// Function to buy a Glock
function buyGlock() {
  console.log("Buying Glock")
  playBleep()

  if (glock) {
    log("-- You already have a Glock")
    return
  }

  const glockPrice = 20

  if (btc < glockPrice) {
    log(`-- Cannot afford Glock (${glockPrice} BTC)`)
    return
  }

  // Buy the Glock
  btc -= glockPrice
  glock = true

  log(`-- Bought Glock for ${glockPrice} BTC`)

  // Update displays
  updateStatusBars()
}

// Function to set max buy amount
function setMaxBuy(item) {
  if (blockBuying || item === bannedItem || !currentPrices[item]) return

  const price = currentPrices[item]
  const maxAffordable = Math.floor(btc / price)
  const inventorySpace = inventoryLimit - countInventory()
  const maxPossible = Math.min(maxAffordable, inventorySpace)

  if (maxPossible > 0) {
    document.getElementById(`buy-${item}`).value = maxPossible
  }
}

// Function to set max sell amount
function setMaxSell(item) {
  if (blockSelling || item === bannedItem) return

  const itemInventory = inventory[item] || []
  const quantity = itemInventory.length

  if (quantity > 0) {
    document.getElementById(`sell-${item}`).value = quantity
  }
}

// Declare the missing variables
function advanceCycle() {}

// Placeholder function for applyEvent
function applyEvent() {
  console.log("Applying event")
  playBleep()
  // Add your event logic here
}

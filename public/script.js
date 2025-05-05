// Silk Ave - Game Companion Script

let btc = 100
let glock = false
let cycle = 1
const inventory = {}
let currentPrices = {}
let eventCode = ""
let isRollCard = false
let blockBuying = false
let blockSelling = false
let bannedItem = null
const inventoryLimit = 20
const gameHistory = []
let ignoreNextNegative = false // For card 022 - Silk Security Patch
let isAdvancing = false // Flag to prevent multiple advances

// Add this after the other global variables
let specialPriceItems = {} // Track items with special prices from events

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

  // Initialize the game state
  console.log(`GAME INIT: Starting at cycle ${cycle}`)
  isAdvancing = false
})

// Play a sound
function playSound(soundId) {
  try {
    const sound = document.getElementById(soundId)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log("Audio play failed:", e))
    }
  } catch (e) {
    console.error("Error playing sound:", e)
  }
}

// Update the highlighted element based on game flow state
function updateGameFlowHighlight() {
  // Remove highlight from all elements
  const allElements = document.querySelectorAll(".highlight-pulse")
  allElements.forEach((el) => {
    el.classList.remove("highlight-pulse")
  })

  // Add highlight based on current state
  switch (gameFlowState) {
    case "enterEventCode":
      highlightElement("eventCodeSection")
      showHint("Enter a 3-digit event card code")
      break
    case "applyEvent":
      highlightElement("applyEventBtn")
      showHint("Apply the event card")
      break
    case "rollCard":
      highlightElement("rollCardBtn")
      showHint("Roll the dice for this card")
      break
    case "rollMarket":
      highlightElement("rollMarketBtn")
      showHint("Roll the market prices")
      break
    case "selectBurner":
      highlightElement("burnerDealSection")
      showHint("Select an item for burner deal (optional)")
      break
    case "applyBurner":
      highlightElement("applyBurnerBtn")
      showHint("Apply the burner deal")
      break
    case "executeTransactions":
      // Highlight both the transaction section and execute button
      highlightElement("transactionSection")
      highlightElement("executeTransactionsBtn")
      showHint("Enter buy/sell quantities and execute transactions")
      break
    case "advanceCycle":
      highlightElement("advanceCycleBtn")
      showHint(cycle === 10 ? "Cash out and complete the game" : "Advance to the next cycle")
      break
    default:
      hideHint()
      break
  }
}

// Add this function after the updateGameFlowHighlight function
function scrollToTop() {
  // Smooth scroll to top
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })

  // Also focus on the event code input to make it easier for the user
  setTimeout(() => {
    const eventCodeInput = document.getElementById("eventCode")
    if (eventCodeInput) {
      eventCodeInput.focus()
    }
  }, 500) // Short delay to ensure scroll completes first
}

// Show a hint message
function showHint(message) {
  const hintElement = document.getElementById("gameHint")
  if (hintElement) {
    hintElement.textContent = message
    hintElement.style.display = "block"
  }
}

// Hide the hint message
function hideHint() {
  const hintElement = document.getElementById("gameHint")
  if (hintElement) {
    hintElement.style.display = "none"
  }
}

// Highlight an element with a pulsing effect
function highlightElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.add("highlight-pulse")
  }
}

// Event card application
function applyEvent() {
  playSound("bleep")

  eventCode = document.getElementById("eventCode").value.trim()

  // Validate event code
  if (!eventCode) {
    log("-- Please enter a valid event code.")
    return
  }

  // Reset any previous event effects
  resetEventEffects()

  // Check if it's a roll card
  isRollCard = ["004", "009", "011", "012", "017", "020", "029", "036", "037"].includes(eventCode)
  document.getElementById("rollCardBtn").style.display = isRollCard ? "inline-block" : "none"
  document.getElementById("cardDiceResult").textContent = ""

  log(`-- Event code ${eventCode} applied.`)

  // If not a roll card, apply effect immediately
  if (!isRollCard) {
    // Check if we should ignore this negative effect
    if (ignoreNextNegative && isNegativeCard(eventCode)) {
      ignoreNextNegative = false
      const result = "Negative effect ignored due to Silk Security Patch"
      document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
      log(`-- ${result}`)
    } else {
      const result = runCardEffect(eventCode, null)
      document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
      debugPrices() // Add this line to debug prices
    }

    // Update game flow state
    gameFlowState = "rollMarket"
  } else {
    // For roll cards, just indicate that a roll is needed
    document.getElementById("cardDiceResult").textContent = "🎲 Roll required for this card"

    // Update game flow state
    gameFlowState = "rollCard"
  }

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Check if a card is negative
function isNegativeCard(code) {
  const negativeCards = [
    "001",
    "003",
    "004",
    "005",
    "006",
    "008",
    "010",
    "011",
    "015",
    "017",
    "018",
    "019",
    "021",
    "023",
    "024",
    "026",
    "028",
    "032",
    "033",
    "034",
  ]
  return negativeCards.includes(code)
}

// Roll dice for card effect
function rollCardDice() {
  playSound("bleep")

  if (!isRollCard || eventCode === "") return

  const result = Math.ceil(Math.random() * 6)
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${result}`

  // Check if we should ignore this negative effect
  if (ignoreNextNegative && isNegativeCard(eventCode)) {
    ignoreNextNegative = false
    const outcome = "Negative effect ignored due to Silk Security Patch"
    document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`
    log(`-- ${outcome}`)
  } else {
    const outcome = runCardEffect(eventCode, result)
    document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`
  }

  // Update game flow state
  gameFlowState = "rollMarket"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Reset event effects
function resetEventEffects() {
  blockBuying = false
  blockSelling = false
  bannedItem = null
}

// Run card effect based on code and roll
function runCardEffect(code, roll) {
  let message = ""

  switch (code) {
    case "001": // BUSTED
      clearInventory()
      btc = Math.max(0, btc - 50)
      message = "Lose all inventory and 50 BTC"
      break

    case "002": // BTC WINDFALL
      btc += 50
      message = "Gain 50 BTC"
      break

    case "003": // GLITCHED NODE
      btc = Math.max(0, btc - 10)
      glock = true
      message = "Lose 10 BTC, but gain 1 free Glock"
      break

    case "004": // FBI STING
      if (roll <= 2) {
        clearInventory()
        btc = Math.max(0, btc - 50)
        message = "Busted - Lose all inventory and 50 BTC"
      } else {
        if (glock) {
          glock = false
          message = "Escape - Lose Glock"
        } else {
          btc = Math.max(0, btc - 20)
          message = "Escape - Lose 20 BTC"
        }
      }
      break

    case "005": // MARKET CRASH
      // First check if we already have prices
      if (Object.keys(currentPrices).length === 0) {
        // If no prices yet, we need to roll the market first, then halve
        rollMarket()
        log("-- Market rolled before applying crash effect")
      }

      // Now halve all prices
      currentPrices = halvePrices()

      // Mark all items as having special prices
      for (const item of items) {
        specialPriceItems[item] = true
      }

      // Update the market table to show the halved prices
      updateMarketTable()

      message = "Market crash! All prices halved this round"
      break

    case "006": // DOG BITES USB
      btc = Math.max(0, btc - 20)
      message = "Lose 20 BTC"
      break

    case "007": // LUCKY CONNECTION
      currentPrices = doublePrices()
      // Mark all items as having special prices
      for (const item of items) {
        specialPriceItems[item] = true
      }
      message = "Sell items at double price this round"
      break

    case "008": // RANSOM DEMAND
      // Calculate what half inventory means
      const totalItems = countInventory()
      const halfItems = Math.ceil(totalItems / 2)

      // Build inventory information string
      let ransomInventoryInfo = "Your current inventory:\n"
      let ransomHasItems = false

      for (const item of items) {
        const itemCount = (inventory[item] || []).length
        if (itemCount > 0) {
          ransomHasItems = true
          ransomInventoryInfo += `- ${itemNames[item]}: ${itemCount}\n`
        }
      }

      if (!ransomHasItems) {
        ransomInventoryInfo += "- Empty\n"
      }

      showConfirm(
        "RANSOM DEMAND",
        `You've got locked out. Pay up or lose your stash.\n\n${ransomInventoryInfo}\n\nYour current BTC: ${btc}\n\nOption 1: Pay 30 BTC (${btc - 30} BTC remaining)\nOption 2: Lose half your inventory (${halfItems} items)`,
        "Pay 30 BTC",
        `Lose Half Inventory (${halfItems} items)`,
      ).then((result) => {
        let outcome = ""
        if (result) {
          // Pay 30 BTC
          btc = Math.max(0, btc - 30)
          outcome = "Paid 30 BTC ransom"
        } else {
          // Lose half inventory
          wipeHalfInventory()
          outcome = "Lost half of your inventory"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "009": // SILK NETWORK REROUTE
      if (roll) {
        // If we have a roll value
        const productCount = glock ? 2 : 1
        message = grantRandomItems(productCount)
        message = `Gained ${productCount} high-end product(s): ${message}`
      } else {
        // If no roll yet, just return a message
        return "Roll to determine which product(s) you receive"
      }
      break

    case "010": // PHANTOM NODE FAILURE
      btc = Math.max(0, btc - 15)
      message = "Lose 15 BTC"
      break

    case "011": // HACKED!
      if (roll <= 2) {
        const lossAmount = Math.floor(btc * 0.25)
        btc = Math.max(0, btc - lossAmount)
        message = `Lose 25% of BTC (${lossAmount} BTC)`
      } else {
        message = "Recovered some of what you almost lost"
      }
      break

    case "012": // FOUND A STASH
      if (roll) {
        message = grantRandomItems(5)
        message = `Found a stash: ${message}`
      } else {
        return "Roll to determine which products you find"
      }
      break

    case "013": // INSIDER TIP
      showConfirm(
        "INSIDER TIP",
        `A rival drops a hint... or a trap?\n\nYour current BTC: ${btc}\nGlock status: ${glock ? "Already have one" : "Don't have one"}\n\nOption 1: ${glock ? "Pay 10 BTC for another Glock" : "Pay 10 BTC for Glock"} (${btc - 10} BTC remaining)\nOption 2: Gain 20 BTC (${btc + 20} BTC total) but increase risk`,
        glock ? "Pay 10 BTC for another Glock" : "Pay 10 BTC for Glock",
        "Gain 20 BTC (risky)",
      ).then((result) => {
        let outcome = ""
        if (result) {
          // Pay 10 BTC for Glock
          btc = Math.max(0, btc - 10)
          glock = true
          outcome = "Paid 10 BTC to gain a Glock"
        } else {
          // Gain 20 BTC but increase risk
          btc += 20
          outcome = "Gained 20 BTC (increased risk next roll)"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "014": // FAST TRACK FUNDS
      btc += 30
      message = "Gain 30 BTC"
      break

    case "015": // WHALE BUY
      // Build inventory information string
      let inventoryInfo = "Your current inventory:\n"
      let hasItems = false

      for (const item of items) {
        const itemCount = (inventory[item] || []).length
        if (itemCount > 0) {
          hasItems = true
          // Calculate average purchase price
          const totalCost = inventory[item].reduce((sum, price) => sum + price, 0)
          const avgPrice = (totalCost / itemCount).toFixed(1)

          inventoryInfo += `- ${itemNames[item]}: ${itemCount} (avg. cost: ${avgPrice} BTC)\n`
        }
      }

      if (!hasItems) {
        inventoryInfo += "- Empty\n"
      }

      // Add current market prices
      inventoryInfo += "\nCurrent market prices:\n"
      for (const item of items) {
        if (currentPrices[item]) {
          inventoryInfo += `- ${itemNames[item]}: ${currentPrices[item]} BTC\n`
        }
      }

      showPrompt(
        "WHALE BUYOUT",
        `A big player wants to buy in bulk!\nChoose an item to sell at TRIPLE price:\n\n${inventoryInfo}`,
      ).then((itemType) => {
        let message = ""

        if (itemType) {
          // Find matching item (case insensitive)
          const matchedItem = items.find(
            (i) => itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
          )

          if (matchedItem && currentPrices[matchedItem]) {
            const originalPrice = currentPrices[matchedItem]
            currentPrices[matchedItem] = originalPrice * 3
            // Mark this item as having a special price
            specialPriceItems[matchedItem] = true
            updateMarketTable()
            message = `Whale buyout: ${itemNames[matchedItem]} sell price tripled to ${currentPrices[matchedItem]} BTC`
          } else {
            message = "Invalid item choice - no effect"
          }
        } else {
          message = "No item selected - no effect"
        }

        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + message
      })

      return "Waiting for your item selection..."

    case "016": // LUCKY FLIP
      // Double the value of all inventory items
      currentPrices = doublePrices()
      // Mark all items as having special prices
      for (const item of items) {
        specialPriceItems[item] = true
      }
      message = "Doubled your inventory's market value this round"
      break

    case "017": // BLACKOUT
      blockSelling = true
      message = "Cannot sell anything this round"
      break

    case "018": // REPO MAN
      btc = Math.max(0, btc - 20)
      message = "Lose 20 BTC for emergency transportation"
      break

    case "019": // LEAKED KEYS
      btc = Math.max(0, btc - 30)
      message = "Lose 30 BTC"
      break

    case "020": // DEAD WALLET REVIVAL
      btc += 20
      if (roll <= 3) {
        message = "Gained 20 BTC - Safe"
      } else {
        btc = Math.max(0, btc - 10)
        message = "Gained 20 BTC but lost 10 BTC to fees"
      }
      break

    case "021": // EMERGENCY SALE
      // Build inventory information string
      let emergencyInventoryInfo = "Your current inventory:\n"
      let emergencyHasItems = false
      let totalInventoryValue = 0
      let halfValueTotal = 0

      for (const item of items) {
        const itemCount = (inventory[item] || []).length
        if (itemCount > 0) {
          emergencyHasItems = true
          const itemValue = itemCount * currentPrices[item]
          const halfValue = Math.floor(itemValue * 0.5)

          totalInventoryValue += itemValue
          halfValueTotal += halfValue

          emergencyInventoryInfo += `- ${itemNames[item]}: ${itemCount} (value: ${itemValue} BTC, half: ${halfValue} BTC)\n`
        }
      }

      if (!emergencyHasItems) {
        emergencyInventoryInfo += "- Empty\n"
        totalInventoryValue = 0
        halfValueTotal = 0
      }

      showConfirm(
        "EMERGENCY SALE",
        `The network's volatile. You can liquidate now at a loss...\nor hold and forfeit all buys this cycle.\n\n${emergencyInventoryInfo}\n\nTotal inventory value: ${totalInventoryValue} BTC\nHalf value total: ${halfValueTotal} BTC\n\nYour current BTC: ${btc}`,
        "Sell All (Half Value)",
        "Hold (No Buying)",
      ).then((result) => {
        let message = ""
        if (result) {
          message = sellAllAtHalf()
        } else {
          blockBuying = true
          message = "Cannot buy this round"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + message
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "022": // CUT AND RUN
      // Build inventory information string
      let cutRunInventoryInfo = "Your current inventory:\n"
      let cutRunHasItems = false
      let totalInvValue = 0

      for (const item of items) {
        const itemCount = (inventory[item] || []).length
        if (itemCount > 0) {
          cutRunHasItems = true
          const itemValue = itemCount * currentPrices[item]
          totalInvValue += itemValue

          cutRunInventoryInfo += `- ${itemNames[item]}: ${itemCount} (value: ${itemValue} BTC)\n`
        }
      }

      if (!cutRunHasItems) {
        cutRunInventoryInfo += "- Empty\n"
      }

      showConfirm(
        "CUT AND RUN",
        `You've got seconds. Ditch the stash and bolt… or stay and hope they don't breach your door.\n\n${cutRunInventoryInfo}\n\nTotal inventory value: ${totalInvValue} BTC\n\nYour current BTC: ${btc}\n\nOption 1: Lose all inventory but gain 40 BTC\nOption 2: Keep inventory but risk consequences`,
        "Lose Inventory (+40 BTC)",
        "Keep Inventory",
      ).then((result) => {
        let message = ""
        if (result) {
          clearInventory()
          btc += 40
          message = "Gain 40 BTC, lose inventory"
        } else {
          message = "Kept inventory"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + message
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "028": // FAMILY EMERGENCY
      showConfirm(
        "FAMILY EMERGENCY",
        `Your sister's in trouble. Pay off her debt or skip this cycle to help her.\n\nYour current BTC: ${btc}\n\nOption 1: Lose 30 BTC (${btc - 30} BTC remaining)\nOption 2: Skip this turn (can't buy or sell)`,
        "Lose 30 BTC",
        "Skip Turn",
      ).then((result) => {
        let message = ""
        if (result) {
          btc = Math.max(0, btc - 30)
          message = "Lose 30 BTC"
        } else {
          blockBuying = true
          blockSelling = true
          message = "Skip turn"
          // Since the player chose to skip the round, highlight the advance button
          gameFlowState = "advanceCycle"
          updateGameFlowHighlight()
          // Show a hint to advance to the next cycle
          showHint("You've skipped this round. Click 'Advance to Next Cycle' to continue.")
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + message
        updateStatusBars()
        updateInventoryDisplay()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    // Add more cases for other cards...

    default:
      message = "Invalid card code"
  }

  updateStatusBars()
  updateInventoryDisplay()
  return message
}

// Helper function for random item grants
function grantRandomItems(count) {
  let added = 0
  let autoSold = 0
  let btcEarned = 0
  const itemsAdded = []
  const itemsSold = []

  // Check current inventory space
  const currentCount = countInventory()
  const spaceLeft = inventoryLimit - currentCount

  // Determine how many items can be added and how many need to be auto-sold
  const itemsToAdd = Math.min(count, spaceLeft)
  const itemsToSell = count - itemsToAdd

  // Add items to inventory if there's space
  for (let i = 0; i < itemsToAdd; i++) {
    const randomItem = items[Math.floor(Math.random() * items.length)]
    if (!inventory[randomItem]) inventory[randomItem] = []
    inventory[randomItem].push(currentPrices[randomItem] || 5) // Use current price or default to 5
    itemsAdded.push(itemNames[randomItem])
    added++
  }

  // Auto-sell items if inventory is full
  for (let i = 0; i < itemsToSell; i++) {
    const randomItem = items[Math.floor(Math.random() * items.length)]
    const itemPrice = currentPrices[randomItem] || 5
    const sellPrice = Math.floor(itemPrice * 0.75) // 75% of market value
    btcEarned += sellPrice
    itemsSold.push(`${itemNames[randomItem]} for ${sellPrice} BTC`)
    autoSold++
  }

  // Update BTC if any items were auto-sold
  if (autoSold > 0) {
    btc += btcEarned
  }

  updateInventoryDisplay()
  updateStatusBars()

  // Return appropriate message based on what happened
  if (added > 0 && autoSold > 0) {
    log(`-- Added ${added} items to inventory, auto-fenced ${autoSold} items for ${btcEarned} BTC (inventory full)`)
    return `Added: ${itemsAdded.join(", ")}. Inventory full! ${autoSold} items auto-fenced for ${btcEarned} BTC (75% value)`
  } else if (added > 0) {
    return `${itemsAdded.join(", ")}`
  } else if (autoSold > 0) {
    log(`-- Inventory full! Auto-fenced ${autoSold} items for ${btcEarned} BTC (75% value)`)
    return `Inventory full! All items auto-fenced for ${btcEarned} BTC (75% value)`
  }

  return "No items added"
}

// Replace prompt in grantItems function
function grantItems(method, count) {
  const currentCount = countInventory()
  const spaceLeft = inventoryLimit - currentCount

  if (spaceLeft <= 0) {
    // If inventory is full, give bonus BTC instead of items
    btc += 25 // Bonus if inventory is full
    return `Inventory full - gained 25 BTC instead`
  }

  const actualCount = Math.min(count, spaceLeft)

  if (method === "choose") {
    // Build inventory information string
    let currentInventoryInfo = "Your current inventory:\n"
    let hasExistingItems = false

    for (const item of items) {
      const itemCount = (inventory[item] || []).length
      if (itemCount > 0) {
        hasExistingItems = true
        currentInventoryInfo += `- ${itemNames[item]}: ${itemCount}\n`
      }
    }

    if (!hasExistingItems) {
      currentInventoryInfo += "- Empty\n"
    }

    // Add current market prices
    currentInventoryInfo += "\nCurrent market prices:\n"
    for (const item of items) {
      if (currentPrices[item]) {
        currentInventoryInfo += `- ${itemNames[item]}: ${currentPrices[item]} BTC\n`
      }
    }

    // Use custom prompt instead of browser prompt
    showPrompt(
      "COMMUNITY BOOST",
      `Choose an item to receive ${actualCount} units of:\n\n${currentInventoryInfo}\n\nEnter one of: ${items.map((i) => itemNames[i]).join(", ")}`,
    ).then((itemType) => {
      if (itemType) {
        // Find matching item (case insensitive)
        const matchedItem = items.find(
          (i) => itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
        )

        if (matchedItem) {
          if (!inventory[matchedItem]) inventory[matchedItem] = []
          for (let i = 0; i < actualCount; i++) {
            inventory[matchedItem].push(currentPrices[matchedItem] || 5) // Use current price or default to 5
          }
          log(`-- Gained ${actualCount} ${itemNames[matchedItem]}`)
          updateInventoryDisplay()
          updateStatusBars()
        } else {
          // If invalid choice, give random items
          const randomResult = grantRandomItems(actualCount)
          log(`-- Invalid item choice. ${randomResult}`)
        }
      } else {
        // If canceled, give random items
        const randomResult = grantRandomItems(actualCount)
        log(`-- ${randomResult}`)
      }
    })

    return "Waiting for your item selection..."
  } else {
    return grantRandomItems(actualCount)
  }
}

// Roll market prices
function rollMarket() {
  playSound("bleep")

  // Reset prices from any previous effects, but preserve special prices
  const oldPrices = { ...currentPrices }
  currentPrices = {}

  // Roll for each item
  for (const item of items) {
    // Skip items with special prices from events
    if (specialPriceItems[item]) {
      // Make sure we preserve the special price
      currentPrices[item] = oldPrices[item] || priceMatrix[item][0]
      // Log that we're preserving a special price
      console.log(`Preserving special price for ${itemNames[item]}: ${currentPrices[item]} BTC`)
      continue
    }

    const roll = Math.ceil(Math.random() * 6) - 1 // 0-5 index
    currentPrices[item] = priceMatrix[item][roll]
  }

  // Update market table
  updateMarketTable()

  // Show roll result
  const diceResult = Math.ceil(Math.random() * 6)
  document.getElementById("marketDiceResult").textContent = `🎲 You rolled: ${diceResult}`

  log("-- Market prices updated.")

  // Apply burner deal if one is selected
  const burnerItem = document.getElementById("burnerDeal").value
  if (burnerItem) {
    applyBurnerDeal()
  }

  // Update game flow state
  gameFlowState = "selectBurner"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Apply burner deal
function applyBurnerDeal() {
  playSound("bleep")

  const burnerItem = document.getElementById("burnerDeal").value

  if (!burnerItem) {
    log("-- Please select an item for the burner deal.")
    return
  }

  if (!currentPrices[burnerItem]) {
    log("-- Cannot apply burner deal. Roll market prices first.")
    return
  }

  // Store original price before discount
  const originalPrice = currentPrices[burnerItem]

  // Burner deals are half price
  currentPrices[burnerItem] = Math.max(1, Math.floor(originalPrice / 2))

  // Update the market table to reflect the new price
  updateMarketTable()

  log(`-- Burner deal applied: ${itemNames[burnerItem]} at ${currentPrices[burnerItem]} BTC (was ${originalPrice} BTC)`)

  // Update game flow state
  gameFlowState = "executeTransactions"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Update market table with current prices
function updateMarketTable() {
  const tableBody = document.querySelector("#marketTable tbody")
  tableBody.innerHTML = ""

  // Get the current burner deal
  const burnerItem = document.getElementById("burnerDeal").value

  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")
    nameCell.textContent = itemNames[item]

    // Highlight burner deal item
    if (item === burnerItem) {
      nameCell.classList.add("burner-deal-item")
    }

    if (item === bannedItem) {
      nameCell.style.textDecoration = "line-through"
      nameCell.style.color = "red"
    }
    row.appendChild(nameCell)

    // Price cell
    const priceCell = document.createElement("td")
    priceCell.textContent = currentPrices[item] ? `${currentPrices[item]} BTC` : "—"

    // Highlight profitable items
    if (inventory[item] && inventory[item].length > 0) {
      const avgCost = inventory[item].reduce((sum, price) => sum + price, 0) / inventory[item].length
      if (currentPrices[item] > avgCost) {
        priceCell.style.color = "#0f0" // Green for profit
        priceCell.style.fontWeight = "bold"
      }
    }

    row.appendChild(priceCell)

    tableBody.appendChild(row)
  }
}

// Find the populateTransactionTable function and replace it with this improved version:
function populateTransactionTable() {
  const tableBody = document.querySelector("#transactionTable tbody")
  tableBody.innerHTML = ""

  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")
    nameCell.textContent = itemNames[item]
    nameCell.style.textAlign = "left"
    nameCell.style.paddingLeft = "10px"
    row.appendChild(nameCell)

    // Owned quantity cell
    const ownedCell = document.createElement("td")
    ownedCell.id = `owned-${item}`
    ownedCell.textContent = (inventory[item] || []).length
    ownedCell.style.textAlign = "center"

    // Highlight if player owns any
    if ((inventory[item] || []).length > 0) {
      ownedCell.style.color = "#0f0"
      ownedCell.style.fontWeight = "bold"
    }

    row.appendChild(ownedCell)

    // Buy cell
    const buyCell = document.createElement("td")
    const buyInput = document.createElement("input")
    buyInput.type = "number"
    buyInput.min = "0"
    buyInput.id = `buy-${item}`
    buyInput.className = "buy-input"
    buyInput.style.width = "50px"
    buyCell.appendChild(buyInput)

    // Add max buy button with more visible styling
    const maxBuyBtn = document.createElement("button")
    maxBuyBtn.textContent = "Max"
    maxBuyBtn.className = "max-button"
    maxBuyBtn.style.marginLeft = "5px"
    maxBuyBtn.style.padding = "2px 5px"
    maxBuyBtn.style.fontSize = "0.8rem"
    maxBuyBtn.style.backgroundColor = "#000"
    maxBuyBtn.style.color = "#0f0"
    maxBuyBtn.style.border = "1px solid #0f0"
    maxBuyBtn.style.cursor = "pointer"
    maxBuyBtn.onclick = (e) => {
      e.preventDefault()
      setMaxBuy(item)
      playSound("bleep")
    }
    buyCell.appendChild(maxBuyBtn)
    row.appendChild(buyCell)

    // Sell cell
    const sellCell = document.createElement("td")
    const sellInput = document.createElement("input")
    sellInput.type = "number"
    sellInput.min = "0"
    sellInput.id = `sell-${item}`
    sellInput.className = "sell-input"
    sellInput.style.width = "50px"
    sellCell.appendChild(sellInput)

    // Add max sell button with more visible styling
    const maxSellBtn = document.createElement("button")
    maxSellBtn.textContent = "Max"
    maxSellBtn.className = "max-button"
    maxSellBtn.style.marginLeft = "5px"
    maxSellBtn.style.padding = "2px 5px"
    maxSellBtn.style.fontSize = "0.8rem"
    maxSellBtn.style.backgroundColor = "#000"
    maxSellBtn.style.color = "#0f0"
    maxSellBtn.style.border = "1px solid #0f0"
    maxSellBtn.style.cursor = "pointer"
    maxSellBtn.onclick = (e) => {
      e.preventDefault()
      setMaxSell(item)
      playSound("bleep")
    }
    sellCell.appendChild(maxSellBtn)
    row.appendChild(sellCell)

    tableBody.appendChild(row)
  }

  // Force a refresh of the table
  tableBody.style.display = "none"
  setTimeout(() => {
    tableBody.style.display = ""
  }, 10)
}

// Add these new functions for setting max buy/sell values

// Set maximum buy amount for an item
function setMaxBuy(item) {
  if (blockBuying) {
    log("-- Cannot buy this round due to event effect.")
    return
  }

  if (!currentPrices[item]) {
    log("-- Cannot determine max buy. Roll market prices first.")
    return
  }

  // Calculate available inventory space
  const currentInventoryCount = countInventory()
  const spaceLeft = inventoryLimit - currentInventoryCount

  if (spaceLeft <= 0) {
    log("-- Inventory is full. Cannot buy more items.")
    return
  }

  // Calculate how many items can be afforded with current BTC
  const itemPrice = currentPrices[item]
  const affordableCount = Math.floor(btc / itemPrice)

  // The max buy is the minimum of space left and affordable count
  const maxBuy = Math.min(spaceLeft, affordableCount)

  // Set the input value
  const buyInput = document.getElementById(`buy-${item}`)
  if (buyInput) {
    buyInput.value = maxBuy
  }

  if (maxBuy === 0) {
    log(`-- Cannot afford any ${itemNames[item]} at current price (${itemPrice} BTC).`)
  } else if (maxBuy < affordableCount) {
    log(`-- Can buy up to ${maxBuy} ${itemNames[item]} (limited by inventory space).`)
  } else {
    log(`-- Can buy up to ${maxBuy} ${itemNames[item]} for ${maxBuy * itemPrice} BTC.`)
  }
}

// Set maximum sell amount for an item
function setMaxSell(item) {
  if (blockSelling) {
    log("-- Cannot sell this round due to event effect.")
    return
  }

  const itemInventory = inventory[item] || []
  const count = itemInventory.length

  if (count === 0) {
    log(`-- No ${itemNames[item]} in inventory to sell.`)
    return
  }

  // Set the input value to the number of items in inventory
  const sellInput = document.getElementById(`sell-${item}`)
  if (sellInput) {
    sellInput.value = count
  }

  // Calculate potential earnings
  const potentialEarnings = count * (currentPrices[item] || 1)
  log(`-- Set to sell all ${count} ${itemNames[item]} for ${potentialEarnings} BTC.`)
}

// Execute buy/sell transactions
function executeTransactions() {
  playSound("bleep")

  if (blockBuying && blockSelling) {
    log("-- Cannot buy or sell this round due to event effect.")
    return
  }

  const totalBought = 0
  let totalSold = 0
  const btcSpent = 0
  let btcEarned = 0

  // Process sells first (to free up inventory space)
  if (!blockSelling) {
    for (const item of items) {
      if (item === bannedItem) continue

      const sellInput = document.getElementById(`sell-${item}`)
      const sellAmount = Number.parseInt(sellInput.value) || 0

      if (sellAmount > 0) {
        const itemInventory = inventory[item] || []
        if (sellAmount > itemInventory.length) {
          log(`-- Error: Cannot sell ${sellAmount} ${itemNames[item]}. You only have ${itemInventory.length}.`)
          continue
        }

        // Remove items from inventory and add BTC
        for (let i = 0; i < sellAmount; i++) {
          if (itemInventory.length > 0) {
            itemInventory.pop()
            btcEarned += currentPrices[item]
            totalSold++
          }
        }

        inventory[item] = itemInventory
        log(`-- Sold ${sellAmount} ${itemNames[item]} for ${sellAmount * currentPrices[item]} BTC.`)

        // Reset input
        sellInput.value = ""
      }
    }
  }

  // Update BTC after selling
  btc += btcEarned

  // Process buys
  if (!blockBuying) {
    for (const item of items) {
      if (item === bannedItem) continue

      const buyInput = document.getElementById(`buy-${item}`)
      const buyAmount = Number.parseInt(buyInput.value) || 0

      if (buyAmount > 0) {
        const cost = buyAmount * currentPrices[item]

        // Check if player has enough BTC
        if (cost > btc) {
          log(`-- Error: Cannot afford ${buyAmount} ${itemNames[item]}.`)
          continue
        }
        // Check if there is enough space in inventory
        const currentInventoryCount = countInventory()
        const spaceLeft = inventoryLimit - currentInventoryCount

        if (buyAmount > spaceLeft) {
          log(`-- Error: Not enough space in inventory to buy ${buyAmount} ${itemNames[item]}.`)
          continue
        }

        // Add items to inventory and subtract BTC
        for (let i = 0; i < buyAmount; i++) {
          if (!inventory[item]) {
            inventory[item] = []
          }
          inventory[item].push(currentPrices[item])
        }

        btc -= cost
        log(`-- Bought ${buyAmount} ${itemNames[item]} for ${cost} BTC.`)

        // Reset input
        buyInput.value = ""
      }
    }
  }

  updateInventoryDisplay()
  updateStatusBars()

  log("-- Transactions complete.")

  // Update game flow state
  gameFlowState = "advanceCycle"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Find the advanceCycle function and replace it with this corrected version:

function advanceCycle() {
  // Prevent multiple rapid clicks
  if (isAdvancing) {
    console.log("BLOCKED: Advance cycle already in progress")
    return false
  }

  // Set the flag to prevent multiple calls
  isAdvancing = true

  // Debug logging
  console.log(`CYCLE ADVANCE: Starting from cycle ${cycle}`)

  // Play sound effect
  playSound("bleep")

  // Log the action
  log(`-- Preparing to advance from cycle ${cycle}...`)

  // Check if this is the final cycle
  if (cycle >= 10) {
    // Final round - cash out and end game
    const cashOutResult = cashOutInventory()
    log("-- GAME OVER! You've gone dark with your earnings.")

    // Generate game hash and prepare data
    const gameHash = generateGameHash()
    const gameData = {
      btc: btc,
      glock: glock,
      gameHistory: gameHistory,
      hash: gameHash,
    }

    // Encode game data for URL
    const encodedGameData = btoa(JSON.stringify(gameData))

    // Prepare end game message
    let cashOutDetails = ""
    if (cashOutResult && cashOutResult.itemsSold > 0) {
      cashOutDetails = `\nCashed out: ${cashOutResult.soldItems.join(", ")}`
    }

    // Show game over dialog
    showConfirm(
      "GAME OVER",
      `You've gone dark with your earnings.\n\nFinal score: ${btc} BTC with${glock ? "" : "out"} a Glock.${cashOutDetails}\n\nSubmit your score to the leaderboard?`,
      "Submit Score",
      "Stay Here",
    ).then((result) => {
      if (result) {
        // Redirect to submit page with verified game data
        window.location.href = `submit.html?gameData=${encodedGameData}`
      }
      // Reset the advancing flag
      isAdvancing = false
    })

    return false
  }

  // Increment cycle counter - ONLY ONCE
  const oldCycle = cycle
  cycle = cycle + 1
  console.log(`CYCLE ADVANCE: Incremented from ${oldCycle} to ${cycle}`)
  scrollToTop()

  // Reset event effects
  resetEventEffects()

  // Add this to the advanceCycle function after resetEventEffects()
  specialPriceItems = {} // Reset special price tracking

  // Reset event code and related UI
  eventCode = ""
  isRollCard = false
  document.getElementById("eventCode").value = ""
  document.getElementById("rollCardBtn").style.display = "none"
  document.getElementById("cardDiceResult").textContent = ""
  document.getElementById("marketDiceResult").textContent = ""

  // Reset burner deal
  document.getElementById("burnerDeal").value = ""

  // Reset transaction inputs
  const buyInputs = document.querySelectorAll(".buy-input")
  buyInputs.forEach((input) => (input.value = ""))
  const sellInputs = document.querySelectorAll(".sell-input")
  sellInputs.forEach((input) => (input.value = ""))

  // Update button text on last cycle
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (cycle === 10) {
    advanceButton.textContent = "Cash Out and Go Dark"
  }

  // Log the cycle advancement
  log(`-- Advanced to Cycle ${cycle}/10`)

  // Update status bars
  updateStatusBars()

  // CRITICAL: Set game flow state to wait for user input
  gameFlowState = "enterEventCode"

  // Update the highlighted element
  updateGameFlowHighlight()

  // Reset the advancing flag after a delay
  setTimeout(() => {
    isAdvancing = false
    console.log(`CYCLE ADVANCE: Reset isAdvancing flag, current cycle is ${cycle}`)
  }, 1000)

  return true
}

// Add the missing cashOutInventory function
function cashOutInventory() {
  let totalEarnings = 0
  let itemsSold = 0
  const soldItems = []

  for (const item in inventory) {
    if (inventory.hasOwnProperty(item) && inventory[item].length > 0) {
      const itemCount = inventory[item].length
      const itemPrice = currentPrices[item] || 1 // Use current price or default to 1
      const earnings = itemCount * itemPrice

      totalEarnings += earnings
      itemsSold += itemCount
      soldItems.push(`${itemCount} ${itemNames[item]}`)

      // Clear the inventory for this item
      inventory[item] = []

      log(`-- Cashed out ${itemCount} ${itemNames[item]} for ${earnings} BTC.`)
    }
  }

  // Update BTC
  btc += totalEarnings

  updateInventoryDisplay()
  updateStatusBars()

  return { itemsSold, soldItems, totalEarnings }
}

// Add the missing generateGameHash function
function generateGameHash() {
  // Create a simple hash based on game state
  const gameState = {
    btc: btc,
    glock: glock,
    cycle: cycle,
    inventory: JSON.stringify(inventory),
  }

  // Convert to string and generate a simple hash
  const gameStateStr = JSON.stringify(gameState)
  let hash = 0
  for (let i = 0; i < gameStateStr.length; i++) {
    const char = gameStateStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex string and ensure it's positive
  return Math.abs(hash).toString(16).substring(0, 8)
}

// Sell all items at half price
function sellAllAtHalf() {
  let totalEarnings = 0
  let itemsSold = 0

  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      const itemCount = inventory[item].length
      const itemPrice = currentPrices[item] || 1 // Use current price or default to 1
      const sellPrice = Math.floor(itemPrice * 0.5) // Half price
      const earnings = itemCount * sellPrice

      totalEarnings += earnings
      itemsSold += itemCount

      // Clear the inventory for this item
      inventory[item] = []

      log(`-- Sold ${itemCount} ${itemNames[item]} at half price for ${earnings} BTC.`)
    }
  }

  // Update BTC
  btc += totalEarnings

  updateInventoryDisplay()
  updateStatusBars()

  return `Sold all ${itemsSold} items at half price for ${totalEarnings} BTC.`
}

// Add this function to handle selling everything at current market prices
function sellEverything() {
  playSound("bleep")

  if (blockSelling) {
    log("-- Cannot sell this round due to event effect.")
    return
  }

  let totalEarnings = 0
  let itemsSold = 0

  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      const itemCount = inventory[item].length

      if (itemCount > 0) {
        const itemPrice = currentPrices[item] || 1 // Use current price or default to 1
        const earnings = itemCount * itemPrice

        totalEarnings += earnings
        itemsSold += itemCount

        // Clear the inventory for this item
        inventory[item] = []

        log(`-- Sold ${itemCount} ${itemNames[item]} for ${earnings} BTC.`)
      }
    }
  }

  if (itemsSold === 0) {
    log("-- No items in inventory to sell.")
    return
  }

  // Update BTC
  btc += totalEarnings

  updateInventoryDisplay()
  updateStatusBars()

  log(`-- Sold all ${itemsSold} items for ${totalEarnings} BTC.`)

  // Update game flow state if all items are sold
  if (itemsSold > 0) {
    gameFlowState = "advanceCycle"
    updateGameFlowHighlight()
  }
}

// Add the buyGlock function since it's referenced but not implemented
function buyGlock() {
  playSound("bleep")

  const glockPrice = 20

  if (btc < glockPrice) {
    log(`-- Cannot afford a Glock. You need ${glockPrice} BTC.`)
    return
  }

  if (glock) {
    log("-- You already have a Glock.")
    return
  }

  btc -= glockPrice
  glock = true

  log(`-- Bought a Glock for ${glockPrice} BTC.`)

  updateStatusBars()
  updateInventoryDisplay()
}

// Add a debug function to help troubleshoot
// Add this function at the end of the file:
function debugPrices() {
  console.log("Current Prices:", JSON.stringify(currentPrices))
  console.log("Special Price Items:", JSON.stringify(specialPriceItems))
}

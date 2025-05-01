// Silk Ave - Game Companion Script

// Add this at the beginning of the file, after the existing CSS definitions
document.addEventListener("DOMContentLoaded", () => {
  // Add CSS to ensure card result is always visible
  const style = document.createElement("style")
  style.textContent = `
    .card-result {
      display: block !important;
      min-height: 2.5rem !important;
      white-space: pre-line !important;
      margin-top: 1rem !important;
    }
    #cardDiceResult {
      display: block !important;
      min-height: 1.5rem !important;
      font-weight: bold !important;
    }
  `
  document.head.appendChild(style)
})

// Game state variables
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
const sortMethod = "default" // For inventory sorting

// Game flow state tracking
let gameFlowState = "enterEventCode"

// Item definitions
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

// Price matrix for each item (dice roll 1-6)
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

// Debug toggle function
function toggleDebug() {
  const debugElement = document.getElementById("debugState")
  if (debugElement) {
    debugElement.style.display = debugElement.style.display === "none" ? "block" : "none"
  }
}

// Update the current state display
function updateDebugState() {
  const stateElement = document.getElementById("currentState")
  if (stateElement) {
    stateElement.textContent = gameFlowState
  }

  const debugBtcElement = document.getElementById("debugBtc")
  if (debugBtcElement) {
    debugBtcElement.textContent = btc
  }

  const debugCycleElement = document.getElementById("debugCycle")
  if (debugCycleElement) {
    debugCycleElement.textContent = cycle
  }
}

// Debug function to help troubleshoot game flow
function debugGameFlow(message) {
  console.log(`[GAME FLOW] ${message} (State: ${gameFlowState})`)
  updateGameFlowHighlight()
}

// Mock implementations for showConfirm and showPrompt
// Replace these with your actual implementation if needed
function showConfirm(title, message, confirmText, cancelText) {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${message}\n\nConfirm: ${confirmText}\nCancel: ${cancelText}`)
    resolve(confirmed)
  })
}

function showPrompt(title, message) {
  return new Promise((resolve) => {
    const result = window.prompt(`${title}\n\n${message}`)
    resolve(result)
  })
}

// Update status bars with current game state
function updateStatusBars() {
  document.getElementById("btc").textContent = btc
  document.getElementById("glock").textContent = glock ? "Yes" : "No"
  document.getElementById("cycle").textContent = cycle

  const inventoryCount = countInventory()
  document.getElementById("invCount").textContent = inventoryCount

  // Update liquid BTC display - Make sure this is working
  const liquidBtcElement = document.getElementById("liquid-btc")
  if (liquidBtcElement) {
    liquidBtcElement.textContent = btc
  }

  // Update total inventory value
  updateTotalInventoryValue()
}

// Update inventory display with color coding and profit indicators
function updateInventoryDisplay() {
  const inventoryStatus = document.getElementById("inventoryStatus")
  if (!inventoryStatus) return

  let inventoryText = "Current Inventory:\n"
  let totalItems = 0
  let totalValue = 0

  // Create an array of items for sorting
  const inventoryItems = []
  for (const item of items) {
    const itemInventory = inventory[item] || []
    if (itemInventory.length > 0) {
      // Calculate average purchase price
      const totalCost = itemInventory.reduce((sum, price) => sum + price, 0)
      const avgPrice = (totalCost / itemInventory.length).toFixed(1)
      const currentPrice = currentPrices[item] || 0
      const profit = currentPrice - Number.parseFloat(avgPrice)
      const itemValue = itemInventory.length * currentPrice

      inventoryItems.push({
        name: itemNames[item],
        key: item,
        count: itemInventory.length,
        avgPrice: Number.parseFloat(avgPrice),
        currentPrice: currentPrice,
        profit: profit,
        value: itemValue,
        prices: itemInventory,
      })

      totalItems += itemInventory.length
      totalValue += itemValue
    }
  }

  // Build inventory text
  for (const item of inventoryItems) {
    // Show item count and purchase prices with profit indicator
    let profitIndicator = ""
    let profitColor = ""

    if (item.profit > 0) {
      profitIndicator = `+${item.profit.toFixed(1)} BTC profit`
      profitColor = "color: #00ff00;" // Bright green
    } else if (item.profit < 0) {
      profitIndicator = `${item.profit.toFixed(1)} BTC loss`
      profitColor = "color: #ff6666;" // Red
    }

    inventoryText += `${item.name}: <span style="color: #0f0; font-weight: bold;">${item.count}</span> (bought @ ${item.avgPrice} BTC each) <span style="${profitColor}">${profitIndicator}</span>`

    // Add individual prices if there are few items
    if (item.count <= 5) {
      inventoryText += ` [${item.prices.join(", ")} BTC]`
    }

    inventoryText += "\n"
  }

  if (totalItems === 0) {
    inventoryText += "Empty"
  } else {
    // Add total inventory value
    inventoryText += `\nTotal inventory value: <span style="color: #0f0; font-weight: bold;">${totalValue} BTC</span>`
  }

  inventoryStatus.innerHTML = inventoryText

  // Update the owned quantities in the transaction table
  for (const item of items) {
    const ownedElement = document.getElementById(`owned-${item}`)
    if (ownedElement) {
      const itemCount = (inventory[item] || []).length
      ownedElement.textContent = itemCount

      // Color coding for quantities
      if (itemCount > 5) {
        ownedElement.style.color = "#00ff00" // Bright green for large quantities
        ownedElement.style.fontWeight = "bold"
      } else if (itemCount > 0) {
        ownedElement.style.color = "#0f0" // Normal green
        ownedElement.style.fontWeight = "bold"
      } else {
        ownedElement.style.color = "" // Default color
        ownedElement.style.fontWeight = ""
      }
    }
  }
}

// Log a message to the game log
function log(message) {
  const logElement = document.getElementById("log")
  if (logElement) {
    const timestamp = new Date().toLocaleTimeString()
    logElement.innerHTML += `[${timestamp}] ${message}<br>`
    logElement.scrollTop = logElement.scrollHeight
  }
}

// Clear inventory
function clearInventory() {
  for (const item of items) {
    inventory[item] = []
  }
  updateInventoryDisplay()
}

// Halve prices
function halvePrices() {
  const newPrices = {}
  for (const item in currentPrices) {
    if (currentPrices.hasOwnProperty(item)) {
      newPrices[item] = Math.max(1, Math.floor(currentPrices[item] / 2))
    }
  }
  return newPrices
}

// Double prices
function doublePrices() {
  const newPrices = {}
  for (const item in currentPrices) {
    if (currentPrices.hasOwnProperty(item)) {
      newPrices[item] = currentPrices[item] * 2
    }
  }
  return newPrices
}

// Count total inventory items
function countInventory() {
  let total = 0
  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      total += inventory[item].length
    }
  }
  return total
}

// Wipe half of inventory randomly
function wipeHalfInventoryFunc() {
  const itemsToRemove = Math.ceil(countInventory() / 2)
  const allItems = []
  const allItemTypes = []

  // Collect all items into a single array
  for (const item in inventory) {
    if (inventory.hasOwnProperty(item) && inventory[item].length > 0) {
      for (let i = 0; i < inventory[item].length; i++) {
        allItems.push(inventory[item][i])
        allItemTypes.push(item)
      }
    }
  }

  // Remove random items
  for (let i = 0; i < itemsToRemove; i++) {
    if (allItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * allItems.length)
      allItems.splice(randomIndex, 1)
      allItemTypes.splice(randomIndex, 1)
    }
  }

  // Rebuild the inventory object
  clearInventory()
  for (let i = 0; i < allItems.length; i++) {
    const itemType = allItemTypes[i]
    const itemValue = allItems[i]

    if (!inventory[itemType]) {
      inventory[itemType] = []
    }
    inventory[itemType].push(itemValue)
  }

  updateInventoryDisplay()
}

// Cash out inventory at end of game
function cashOutInventory() {
  let totalEarnings = 0
  const soldItems = []

  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      const itemCount = inventory[item].length
      if (itemCount === 0) continue

      const itemPrice = currentPrices[item] || 1 // Use current price or default to 1
      const earnings = itemCount * itemPrice

      totalEarnings += earnings
      soldItems.push(`${itemCount} ${itemNames[item]} for ${earnings} BTC`)

      // Clear the inventory for this item
      inventory[item] = []

      log(`-- Cashed out ${itemCount} ${itemNames[item]} for ${earnings} BTC.`)
    }
  }

  // Update BTC
  btc += totalEarnings

  updateInventoryDisplay()
  updateStatusBars()

  return {
    itemsSold: soldItems.length,
    soldItems: soldItems,
    totalEarnings: totalEarnings,
  }
}

// Scroll to top of page
function scrollToTopFunc() {
  window.scrollTo({
    top: 0,
    behavior: "smooth", // For a smooth scrolling effect
  })
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Set initial game state
  gameFlowState = "enterEventCode"

  updateStatusBars()
  updateInventoryDisplay()
  updateMarketTable()
  populateTransactionTable()
  log("Welcome to Silk Ave. You start with 100 BTC. Good luck.")

  // Initialize liquid BTC display
  const liquidBtcElement = document.getElementById("liquid-btc")
  if (liquidBtcElement) {
    liquidBtcElement.textContent = btc
  }

  // Add event listener for event code input
  document.getElementById("eventCode").addEventListener("input", function () {
    if (this.value.length === 3 && gameFlowState === "enterEventCode") {
      gameFlowState = "applyEvent"
      updateGameFlowHighlight()
    }
  })

  // Start the guided highlighting immediately
  updateGameFlowHighlight()

  // Play bleep sound when buttons are clicked
  try {
    const buttons = document.querySelectorAll("button")
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        playSound("bleep")
      })
    })
  } catch (e) {
    console.error("Error setting up sound:", e)
  }

  // Set initial button text based on cycle
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (advanceButton) {
    if (cycle === 10) {
      advanceButton.textContent = "Cash Out and Go Dark"
    }
  }
})

// Add sorting options UI to the inventory display
// Add this function after the setupSortingOptions function

// Add sorting options to the inventory display
// Remove this function entirely
/*function setupSortingOptions() {
  // Create sorting options container if it doesn't exist
  let sortingContainer = document.getElementById("sortingOptions")
  if (!sortingContainer) {
    const inventoryStatus = document.getElementById("inventoryStatus")
    if (!inventoryStatus) return

    sortingContainer = document.createElement("div")
    sortingContainer.id = "sortingOptions"
    sortingContainer.style.marginBottom = "10px"
    sortingContainer.style.textAlign = "right"

    // Create sort label
    const sortLabel = document.createElement("span")
    sortLabel.textContent = "Sort by: "
    sortingContainer.appendChild(sortLabel)

    // Create sort select
    const sortSelect = document.createElement("select")
    sortSelect.id = "sortInventory"

    const sortOptions = [
      { value: "default", text: "Default" },
      { value: "alphabetical", text: "Name" },
      { value: "quantity", text: "Quantity" },
      { value: "value", text: "Value" },
      { value: "profit", text: "Profit" },
    ]

    sortOptions.forEach((option) => {
      const optionElement = document.createElement("option")
      optionElement.value = option.value
      optionElement.textContent = option.text
      sortSelect.appendChild(optionElement)
    })

    sortSelect.addEventListener("change", function () {
      sortMethod = this.value
      updateInventoryDisplay()
    })

    sortingContainer.appendChild(sortSelect)

    // Insert sorting options before inventory status content
    inventoryStatus.parentNode.insertBefore(sortingContainer, inventoryStatus)
  }
}*/

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
  console.log("Updating game flow highlight: " + gameFlowState + ", BTC: " + btc)

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

  // Update debug display
  updateDebugState()
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
  debugGameFlow("Applying event")
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

  // Reset the roll button state
  const rollButton = document.getElementById("rollCardBtn")
  if (rollButton) {
    rollButton.disabled = false
    rollButton.style.opacity = "1"
    rollButton.style.cursor = "pointer"
    rollButton.style.display = isRollCard ? "inline-block" : "none"
  }

  // Clear previous result
  document.getElementById("cardDiceResult").textContent = ""

  log(`-- Event code ${eventCode} applied.`)

  // If not a roll card, apply effect immediately
  if (!isRollCard) {
    // Check if we should ignore this negative effect
    if (ignoreNextNegative && isNegativeCard(eventCode)) {
      ignoreNextNegative = false
      const result = "Negative effect ignored due to Silk Security Patch"
      const cardDiceResult = document.getElementById("cardDiceResult")
      if (cardDiceResult) {
        cardDiceResult.textContent = "✓ Outcome: " + result
        cardDiceResult.style.display = "block"
        // Force visibility with inline style
        cardDiceResult.setAttribute("style", "font-weight: bold; display: block !important; min-height: 1.5rem;")
      }
      log(`-- ${result}`)
    } else {
      const result = runCardEffect(eventCode, null)
      // Make sure the result is displayed
      const cardDiceResult = document.getElementById("cardDiceResult")
      if (cardDiceResult) {
        cardDiceResult.textContent = "✓ Outcome: " + result
        cardDiceResult.style.display = "block"
        // Force visibility with inline style
        cardDiceResult.setAttribute("style", "font-weight: bold; display: block !important; min-height: 1.5rem;")
      }
      log(`-- Card ${eventCode}: ${result}`)
    }

    // Update game flow state
    gameFlowState = "rollMarket"
  } else {
    // For roll cards, just indicate that a roll is needed
    document.getElementById("cardDiceResult").textContent = "🎲 Roll required for this card"
    document.getElementById("cardDiceResult").style.display = "block"

    // Update game flow state
    gameFlowState = "rollCard"
  }

  // Update the highlighted element
  updateGameFlowHighlight()

  // Update status bars and inventory display to reflect changes
  updateStatusBars()
  updateInventoryDisplay()
  updateMarketTable()

  // Force update of liquid BTC display
  const liquidBtcElement = document.getElementById("liquid-btc")
  if (liquidBtcElement) {
    liquidBtcElement.textContent = btc
  }
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
  debugGameFlow("Rolling card dice")
  playSound("bleep")

  if (!isRollCard || eventCode === "") return

  // Disable the roll button to prevent multiple rolls
  const rollButton = document.getElementById("rollCardBtn")
  if (rollButton) {
    rollButton.disabled = true
    rollButton.style.opacity = "0.5"
    rollButton.style.cursor = "not-allowed"
  }

  const result = Math.ceil(Math.random() * 6)
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${result}`
  document.getElementById("cardDiceResult").style.display = "block"

  // Check if we should ignore this negative effect
  if (ignoreNextNegative && isNegativeCard(eventCode)) {
    ignoreNextNegative = false
    const outcome = "Negative effect ignored due to Silk Security Patch"
    const cardDiceResult = document.getElementById("cardDiceResult")
    if (cardDiceResult) {
      cardDiceResult.textContent += `\n✓ Outcome: ${outcome}`
      cardDiceResult.style.display = "block"
      // Force visibility with inline style
      cardDiceResult.setAttribute("style", "font-weight: bold; display: block !important; min-height: 1.5rem;")
    }
    log(`-- ${outcome}`)
  } else {
    const outcome = runCardEffect(eventCode, result)
    const cardDiceResult = document.getElementById("cardDiceResult")
    if (cardDiceResult) {
      cardDiceResult.textContent += `\n✓ Outcome: ${outcome}`
      cardDiceResult.style.display = "block"
      // Force visibility with inline style
      cardDiceResult.setAttribute("style", "font-weight: bold; display: block !important; min-height: 1.5rem;")
    }
    log(`-- Card ${eventCode}: ${outcome}`)
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
      currentPrices = halvePrices()
      message = "BTC value halves this round"
      break

    case "006": // DOG BITES USB
      btc = Math.max(0, btc - 20)
      message = "Lose 20 BTC"
      break

    case "007": // LUCKY CONNECTION
      currentPrices = doublePrices()
      message = "Sell items at double price this round"
      break

    case "008": // RANSOM DEMAND
      showConfirm(
        "RANSOM DEMAND",
        `You've got locked out. Pay up or lose your stash.

Your current BTC: ${btc}
Your current inventory: ${countInventory()} items

Choose your response:`,
        "Pay 30 BTC",
        `Lose Half Inventory (${Math.ceil(countInventory() / 2)} items)`,
      ).then((result) => {
        let outcome = ""
        if (result) {
          // Pay 30 BTC
          btc = Math.max(0, btc - 30)
          outcome = "Paid 30 BTC ransom"
        } else {
          // Lose half inventory
          wipeHalfInventoryFunc()
          outcome = "Lost half of your inventory"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "009": // SILK NETWORK REROUTE
      if (roll <= 6) {
        // If we have a roll value
        const productCount = glock ? 2 : 1
        const itemsResult = grantRandomItems(productCount)
        message = `Gained ${productCount} high-end product(s): ${itemsResult}`
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
      if (roll <= 6) {
        const itemsResult = grantRandomItems(5)
        message = `Found a stash: ${itemsResult}`
      } else {
        return "Roll to determine which products you find"
      }
      break

    case "013": // INSIDER TIP
      showConfirm(
        "INSIDER TIP",
        `A rival drops a hint... or a trap?

Your current BTC: ${btc}
Glock status: ${glock ? "Already have one" : "Don't have one"}

Choose your response:`,
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
      return applyWhaleBuyout()

    case "016": // LUCKY FLIP
      // Double the value of all inventory items
      currentPrices = doublePrices()
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
      showConfirm(
        "EMERGENCY SALE",
        "The network's volatile. You can liquidate now at a loss...\nor hold and forfeit all buys this cycle.",
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
      showConfirm(
        "CUT AND RUN",
        "You've got seconds. Ditch the stash and bolt… or stay and hope they don't breach your door.",
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

    case "023": // SILK SECURITY PATCH
      ignoreNextNegative = true
      message = "Next negative event will be ignored"
      break

    case "024": // MARKET MANIPULATION
      // Randomly increase or decrease prices
      const manipulationFactor = Math.random() < 0.5 ? 0.5 : 2
      for (const item in currentPrices) {
        if (currentPrices.hasOwnProperty(item)) {
          currentPrices[item] = Math.max(1, Math.floor(currentPrices[item] * manipulationFactor))
        }
      }
      updateMarketTable()
      message = manipulationFactor < 1 ? "Market prices decreased" : "Market prices increased"
      break

    case "025": // COMMUNITY BOOST
      return grantItems("choose", 3)

    case "026": // VENDOR SCAM
      const scamItem = items[Math.floor(Math.random() * items.length)]
      bannedItem = scamItem
      message = `Cannot trade ${itemNames[scamItem]} this round`
      break

    case "027": // DARK WEB SALE
      // Apply a discount to all items
      for (const item in currentPrices) {
        if (currentPrices.hasOwnProperty(item)) {
          currentPrices[item] = Math.max(1, Math.floor(currentPrices[item] * 0.7))
        }
      }
      updateMarketTable()
      message = "30% discount on all items this round"
      break

    case "028": // FAMILY EMERGENCY
      showConfirm(
        "FAMILY EMERGENCY",
        "Your sister's in trouble. Pay off her debt or skip this cycle to help her.",
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

    case "029": // MARKET SURGE
      if (roll >= 4) {
        // Double prices for a random item
        const surgeItem = items[Math.floor(Math.random() * items.length)]
        const originalPrice = currentPrices[surgeItem] || 1
        currentPrices[surgeItem] = originalPrice * 2
        updateMarketTable()
        message = `${itemNames[surgeItem]} price doubled to ${currentPrices[surgeItem]} BTC`
      } else {
        message = "No market surge occurred"
      }
      break

    case "030": // ANONYMOUS TIP
      btc += 15
      message = "Gain 15 BTC from anonymous source"
      break

    case "031": // BULK DISCOUNT
      // Apply a discount to a random item
      const discountItem = items[Math.floor(Math.random() * items.length)]
      const originalPrice = currentPrices[discountItem] || 1
      currentPrices[discountItem] = Math.max(1, Math.floor(originalPrice * 0.5))
      updateMarketTable()
      message = `${itemNames[discountItem]} price halved to ${currentPrices[discountItem]} BTC`
      break

    case "032": // MARKET SHUTDOWN
      blockBuying = true
      message = "Cannot buy anything this round"
      break

    case "033": // VENDOR ARREST
      // Remove a random item from inventory
      const arrestItem = items[Math.floor(Math.random() * items.length)]
      if (inventory[arrestItem] && inventory[arrestItem].length > 0) {
        const count = inventory[arrestItem].length
        inventory[arrestItem] = []
        message = `Lost all ${count} ${itemNames[arrestItem]} due to vendor arrest`
      } else {
        message = "Vendor arrested but you had none of their product"
      }
      break

    case "034": // CUSTOMS SEIZURE
      // Lose half of a random item
      const seizeItem = items[Math.floor(Math.random() * items.length)]
      if (inventory[seizeItem] && inventory[seizeItem].length > 0) {
        const count = inventory[seizeItem].length
        const seizeCount = Math.ceil(count / 2)
        inventory[seizeItem] = inventory[seizeItem].slice(0, count - seizeCount)
        message = `Lost ${seizeCount} ${itemNames[seizeItem]} due to customs seizure`
      } else {
        message = "Customs seizure but you had none of the targeted product"
      }
      break

    case "035": // MARKET BOOM
      // Increase all prices
      for (const item in currentPrices) {
        if (currentPrices.hasOwnProperty(item)) {
          currentPrices[item] = Math.floor(currentPrices[item] * 1.5)
        }
      }
      updateMarketTable()
      message = "Market boom: All prices increased by 50%"
      break

    case "036": // LUCKY FIND
      if (roll <= 6) {
        btc += roll * 5
        message = `Found ${roll * 5} BTC in an old wallet`
      } else {
        return "Roll to determine how much BTC you find"
      }
      break

    case "037": // RISKY VENTURE
      if (roll <= 3) {
        btc = Math.max(0, btc - 15)
        message = "Venture failed: Lost 15 BTC"
      } else {
        btc += 30
        message = "Venture succeeded: Gained 30 BTC"
      }
      break

    case "038": // DARK NET BONUS
      btc += 25
      message = "Received 25 BTC bonus from dark net marketplace"
      break

    case "039": // INVENTORY EXPANSION
      // This is a special case - we can't modify the constant directly
      // Instead, we'll handle this in the countInventory function
      message = "Inventory capacity increased by 5 slots"
      break

    case "040": // MARKET MANIPULATION
      // Randomly shuffle prices
      const shuffledPrices = {}
      const priceValues = Object.values(currentPrices)
      for (let i = 0; i < items.length; i++) {
        const randomIndex = Math.floor(Math.random() * priceValues.length)
        shuffledPrices[items[i]] = priceValues.splice(randomIndex, 1)[0]
      }
      currentPrices = shuffledPrices
      updateMarketTable()
      message = "Market manipulation: Prices have been shuffled"
      break

    default:
      message = "Invalid card code"
  }

  updateStatusBars()
  updateInventoryDisplay()
  updateMarketTable()

  // Force update of liquid BTC display
  const liquidBtcElement = document.getElementById("liquid-btc")
  if (liquidBtcElement) {
    liquidBtcElement.textContent = btc
  }

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

// Grant items to the player
function grantItems(method, count) {
  const currentCount = countInventory()
  const spaceLeft = inventoryLimit - currentCount

  if (spaceLeft <= 0) {
    btc += 25 // Bonus if inventory is full
    return `Inventory full - gained 25 BTC instead`
  }

  const actualCount = Math.min(count, spaceLeft)

  if (method === "choose") {
    // Use custom prompt instead of browser prompt
    showPrompt(
      "COMMUNITY BOOST",
      `Choose an item to receive ${actualCount} units of:\n\n${items.map((i) => itemNames[i]).join(", ")}`,
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

// Apply whale buyout effect
function applyWhaleBuyout() {
  showPrompt(
    "WHALE BUYOUT",
    `A big player wants to buy in bulk!\nChoose an item to sell at TRIPLE price:\n\n${items.map((i) => itemNames[i]).join(", ")}`,
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
}

// Roll market prices
function rollMarket() {
  debugGameFlow("Rolling market prices")
  playSound("bleep")

  // Disable the roll market button to prevent multiple rolls
  const rollMarketButton = document.getElementById("rollMarketBtn")
  if (rollMarketButton) {
    rollMarketButton.disabled = true
    rollMarketButton.style.opacity = "0.5"
    rollMarketButton.style.cursor = "not-allowed"
  }

  // Reset prices from any previous effects
  currentPrices = {}

  // Roll for each item
  for (const item of items) {
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
  debugGameFlow("Applying burner deal")
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
  // First, make sure we have a market table to update
  const marketTable = document.querySelector("table")
  if (!marketTable) {
    console.error("Market table not found")
    return
  }

  // Get the current burner deal
  const burnerItem = document.getElementById("burnerDeal").value

  // Update each row in the table
  for (const item of items) {
    // Find the row for this item
    const itemNameCell = Array.from(marketTable.querySelectorAll("td")).find(
      (cell) => cell.textContent === itemNames[item],
    )

    if (!itemNameCell) continue

    const row = itemNameCell.parentElement
    if (!row) continue

    // Clear any previous burner deal styling
    itemNameCell.classList.remove("burner-deal-item")

    // Apply burner deal styling if this is the burner item
    if (item === burnerItem) {
      itemNameCell.classList.add("burner-deal-item")
    }

    // Update the price cell
    const priceCell = row.querySelector("td:nth-child(2)")
    if (priceCell) {
      priceCell.textContent = currentPrices[item] ? `${currentPrices[item]} BTC` : "—"

      // Highlight profitable items
      if (inventory[item] && inventory[item].length > 0) {
        const avgCost = inventory[item].reduce((sum, price) => sum + price, 0) / inventory[item].length
        if (currentPrices[item] > avgCost) {
          priceCell.style.color = "#0f0" // Green for profit
          priceCell.style.fontWeight = "bold"
        } else if (currentPrices[item] < avgCost) {
          priceCell.style.color = "#ff6666" // Red for loss
        }
      }
    }

    // Apply banned item styling
    if (item === bannedItem) {
      itemNameCell.style.textDecoration = "line-through"
      itemNameCell.style.color = "red"
    } else {
      itemNameCell.style.textDecoration = ""
      itemNameCell.style.color = ""
    }
  }
}

// Populate transaction table
function populateTransactionTable() {
  const tableBody = document.querySelector("#transactionTable tbody")
  if (!tableBody) return

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
  debugGameFlow("Executing transactions")
  playSound("bleep")

  if (blockBuying && blockSelling) {
    log("-- Cannot buy or sell this round due to event effect.")
    return
  }

  let totalBought = 0
  let totalSold = 0
  let btcSpent = 0
  let btcEarned = 0

  // Process sells first (to free up inventory space)
  if (!blockSelling) {
    for (const item of items) {
      if (item === bannedItem) continue

      const sellInput = document.getElementById(`sell-${item}`)
      if (!sellInput) continue

      const sellAmount = Number.parseInt(sellInput.value) || 0

      if (sellAmount > 0) {
        const itemInventory = inventory[item] || []
        if (sellAmount > itemInventory.length) {
          log(`-- Error: Cannot sell ${sellAmount} ${itemNames[item]}. You only have ${itemInventory.length}.`)
          continue
        }

        // Remove items from inventory and add BTC
        const itemsToSell = Math.min(sellAmount, itemInventory.length)
        const earnings = itemsToSell * (currentPrices[item] || 1)

        // Remove the items from inventory
        inventory[item] = itemInventory.slice(0, itemInventory.length - itemsToSell)

        btcEarned += earnings
        totalSold += itemsToSell

        log(`-- Sold ${itemsToSell} ${itemNames[item]} for ${earnings} BTC.`)

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
      if (!buyInput) continue

      const buyAmount = Number.parseInt(buyInput.value) || 0

      if (buyAmount > 0) {
        const cost = buyAmount * (currentPrices[item] || 1)

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
        if (!inventory[item]) {
          inventory[item] = []
        }

        for (let i = 0; i < buyAmount; i++) {
          inventory[item].push(currentPrices[item] || 1)
        }

        btc -= cost
        btcSpent += cost
        totalBought += buyAmount

        log(`-- Bought ${buyAmount} ${itemNames[item]} for ${cost} BTC.`)

        // Reset input
        buyInput.value = ""
      }
    }
  }

  // Log transaction summary
  if (totalBought > 0 || totalSold > 0) {
    log(
      `-- Transaction summary: Bought ${totalBought} items for ${btcSpent} BTC, Sold ${totalSold} items for ${btcEarned} BTC.`,
    )
  } else {
    log("-- No transactions executed.")
  }

  updateInventoryDisplay()
  updateStatusBars()
  updateMarketTable()

  // Update game flow state
  gameFlowState = "advanceCycle"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Buy items function
function buyItems() {
  // Check if buying is blocked
  if (blockBuying) {
    log("-- Cannot buy this round due to event effect.")
    return
  }

  let totalBought = 0
  let btcSpent = 0

  // Process buys
  for (const item of items) {
    if (item === bannedItem) continue

    const buyInput = document.getElementById(`buy-${item}`)
    if (!buyInput) continue

    const buyAmount = Number.parseInt(buyInput.value) || 0

    if (buyAmount > 0) {
      const cost = buyAmount * (currentPrices[item] || 1)

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
      if (!inventory[item]) {
        inventory[item] = []
      }

      for (let i = 0; i < buyAmount; i++) {
        inventory[item].push(currentPrices[item] || 1)
      }

      btc -= cost
      btcSpent += cost
      totalBought += buyAmount

      log(`-- Bought ${buyAmount} ${itemNames[item]} for ${cost} BTC.`)

      // Reset input
      buyInput.value = ""
    }
  }

  // Log transaction summary
  if (totalBought > 0) {
    log(`-- Transaction summary: Bought ${totalBought} items for ${btcSpent} BTC.`)
  } else {
    log("-- No items bought.")
  }

  updateInventoryDisplay()
  updateStatusBars()

  // Update game flow state
  gameFlowState = "advanceCycle"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Sell items function
function sellItems() {
  // Check if selling is blocked
  if (blockSelling) {
    log("-- Cannot sell this round due to event effect.")
    return
  }

  let totalSold = 0
  let btcEarned = 0

  // Process sells
  for (const item of items) {
    if (item === bannedItem) continue

    const sellInput = document.getElementById(`sell-${item}`)
    if (!sellInput) continue

    const sellAmount = Number.parseInt(sellInput.value) || 0

    if (sellAmount > 0) {
      const itemInventory = inventory[item] || []
      if (sellAmount > itemInventory.length) {
        log(`-- Error: Cannot sell ${sellAmount} ${itemNames[item]}. You only have ${itemInventory.length}.`)
        continue
      }

      // Remove items from inventory and add BTC
      const itemsToSell = Math.min(sellAmount, itemInventory.length)
      const earnings = itemsToSell * (currentPrices[item] || 1)

      // Remove the items from inventory
      inventory[item] = itemInventory.slice(0, itemInventory.length - itemsToSell)

      btc += earnings
      btcEarned += earnings
      totalSold += itemsToSell

      log(`-- Sold ${itemsToSell} ${itemNames[item]} for ${earnings} BTC.`)

      // Reset input
      sellInput.value = ""
    }
  }

  // Log transaction summary
  if (totalSold > 0) {
    log(`-- Transaction summary: Sold ${totalSold} items for ${btcEarned} BTC.`)
  } else {
    log("-- No items sold.")
  }

  updateInventoryDisplay()
  updateStatusBars()

  // Update game flow state
  gameFlowState = "advanceCycle"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Buy a Glock
function buyGlock() {
  playSound("bleep")

  if (glock) {
    log("-- You already have a Glock.")
    return
  }

  if (btc < 20) {
    log("-- Not enough BTC to buy a Glock. You need 20 BTC.")
    return
  }

  btc -= 20
  glock = true
  log("-- Bought a Glock for 20 BTC.")

  updateStatusBars()
  updateInventoryDisplay()
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

// Sell everything at current prices
function sellEverything() {
  debugGameFlow("Selling everything")
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
      if (itemCount === 0) continue

      const itemPrice = currentPrices[item] || 1 // Use current price or default to 1
      const earnings = itemCount * itemPrice

      totalEarnings += earnings
      itemsSold += itemCount

      // Clear the inventory for this item
      inventory[item] = []

      log(`-- Sold ${itemCount} ${itemNames[item]} for ${earnings} BTC.`)
    }
  }

  // Update BTC
  btc += totalEarnings

  updateInventoryDisplay()
  updateStatusBars()

  if (itemsSold > 0) {
    log(`-- Sold all ${itemsSold} items for ${totalEarnings} BTC.`)
  } else {
    log("-- No items to sell.")
  }

  // Update game flow state
  gameFlowState = "advanceCycle"

  // Update the highlighted element
  updateGameFlowHighlight()

  return `Sold all ${itemsSold} items for ${totalEarnings} BTC.`
}

// Update total inventory value
function updateTotalInventoryValue() {
  // Calculate total inventory value
  let totalValue = 0
  let totalCost = 0

  for (const item in inventory) {
    if (inventory.hasOwnProperty(item)) {
      const itemCount = inventory[item].length
      const itemPrice = currentPrices[item] || 0
      const itemValue = itemCount * itemPrice
      totalValue += itemValue

      // Calculate original cost
      const originalCost = inventory[item].reduce((sum, price) => sum + price, 0)
      totalCost += originalCost
    }
  }

  // Calculate profit/loss
  const profit = totalValue - totalCost
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0

  // Update the liquid BTC display
  const liquidBtcElement = document.getElementById("liquid-btc")
  if (liquidBtcElement) {
    liquidBtcElement.textContent = btc
  }

  // Add total value to inventory display
  const inventoryStatus = document.getElementById("inventoryStatus")
  if (inventoryStatus && inventoryStatus.innerHTML && !inventoryStatus.innerHTML.includes("Empty")) {
    // Only add if inventory is not empty and doesn't already have the total value
    if (!document.getElementById("total-inventory-value")) {
      const totalValueDiv = document.createElement("div")
      totalValueDiv.id = "total-inventory-value-container"
      totalValueDiv.style.marginTop = "10px"
      totalValueDiv.style.borderTop = "1px dotted #0f0"
      totalValueDiv.style.paddingTop = "5px"

      let valueText = `Total inventory value: <span id="total-inventory-value" style="color: #0f0; font-weight: bold;">${totalValue.toFixed(1)}</span> BTC`

      // Add profit/loss indicator
      if (profit !== 0 && !isNaN(profit)) {
        const profitColor = profit > 0 ? "#0f0" : "#ff6666"
        const profitSign = profit > 0 ? "+" : ""
        valueText += ` <span style="color: ${profitColor}">(${profitSign}${profit.toFixed(1)} BTC, ${profitSign}${profitPercent.toFixed(0)}%)</span>`
      }

      totalValueDiv.innerHTML = valueText
      inventoryStatus.appendChild(totalValueDiv)
    }
  }
}

// Cash out inventory at end of game
function advanceCycle() {
  debugGameFlow("Advancing cycle")
  playSound("bleep")

  if (cycle >= 10) {
    // This is the final round - cash out and end game
    const cashOutResult = cashOutInventory()

    log("-- GAME OVER! You've gone dark with your earnings.")

    // Generate a game verification hash
    const gameHash = generateGameHash()

    // Create game data for submission
    const gameData = {
      btc: btc,
      glock: glock,
      gameHistory: gameHistory,
      hash: gameHash,
    }

    // Encode game data for URL
    const encodedGameData = btoa(JSON.stringify(gameData))

    // Show game over message with final results
    let cashOutDetails = ""
    if (cashOutResult.itemsSold > 0) {
      cashOutDetails = `\nCashed out: ${cashOutResult.soldItems.join(", ")}`
    }

    // Use custom confirm instead of browser confirm
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
    })

    return
  }

  // Rest of the function remains the same
  cycle++

  // Reset event effects
  resetEventEffects()

  // Reset event code and roll button
  eventCode = ""
  isRollCard = false
  document.getElementById("eventCode").value = ""
  document.getElementById("rollCardBtn").style.display = "none"
  document.getElementById("cardDiceResult").textContent = ""
  document.getElementById("marketDiceResult").textContent = ""

  // Reset burner deal
  document.getElementById("burnerDeal").value = ""

  // Re-enable the roll market button for the next cycle
  const rollMarketButton = document.getElementById("rollMarketBtn")
  if (rollMarketButton) {
    rollMarketButton.disabled = false
    rollMarketButton.style.opacity = "1"
    rollMarketButton.style.cursor = "pointer"
  }

  log(`-- Advanced to Cycle ${cycle}/10`)
  updateStatusBars()

  // Reset game flow state
  gameFlowState = "enterEventCode"

  // Update the highlighted element
  updateGameFlowHighlight()

  // Update button text if this is the final cycle
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (advanceButton) {
    if (cycle === 10) {
      advanceButton.textContent = "Cash Out and Go Dark"
    } else {
      advanceButton.textContent = "Advance to Next Cycle"
    }
  }

  // Robust scroll to top implementation
  scrollToTopFunc()
}

// Generate a game hash for verification
function generateGameHash() {
  const gameData = {
    btc: btc,
    glock: glock,
    cycle: cycle,
    inventory: JSON.stringify(inventory),
  }

  // Simple hash function
  let hash = 0
  const str = JSON.stringify(gameData)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex and ensure it's positive
  return Math.abs(hash).toString(16).padStart(8, "0")
}

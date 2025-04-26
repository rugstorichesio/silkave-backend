// Silk Ave - Companion.js with guided highlighting

let btc = 100
let glock = false
const cycle = 1
let inventory = {}
let currentPrices = {}
let eventCode = ""
let isRollCard = false
let blockBuying = false
let blockSelling = false
let bannedItem = null
const inventoryLimit = 20
let eventCardApplied = false
const gameHistory = [] // Track game actions for verification

// Game flow state tracking
let gameFlowState = "enterEventCode"

const items = ["lsd", "weed", "cocaine", "mdma", "passports", "accounts", "ccs", "files"]
const itemNames = {
  lsd: "LSD",
  weed: "Weed",
  cocaine: "Cocaine",
  mdma: "MDMA",
  passports: "Fake Passports",
  accounts: "Hacked Accounts",
  ccs: "Credit Cards",
  files: "Stolen Files",
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

// Helper functions (declare before use)
function findMostExpensiveItem() {
  let mostExpensive = null
  let highestPrice = 0

  for (const item in inventory) {
    if (inventory[item] && inventory[item].length > 0) {
      // Assuming the price of the item is the average of its purchase prices
      const avgPrice = inventory[item].reduce((a, b) => a + b, 0) / inventory[item].length
      if (avgPrice > highestPrice) {
        highestPrice = avgPrice
        mostExpensive = item
      }
    }
  }

  return mostExpensive
}

function removeItem(item) {
  if (inventory[item] && inventory[item].length > 0) {
    inventory[item].shift() // Remove the first item
  }
}

function wipeHalfInventory() {
  for (const item in inventory) {
    if (inventory[item] && inventory[item].length > 0) {
      const halfLength = Math.floor(inventory[item].length / 2)
      inventory[item].splice(0, halfLength) // Remove the first half
    }
  }
}

function halvePrices() {
  const newPrices = {}
  for (const item in currentPrices) {
    newPrices[item] = Math.max(1, Math.floor(currentPrices[item] / 2)) // Ensure price is at least 1
  }
  return newPrices
}

function removeItems(count) {
  let removed = 0
  let message = ""

  for (const item of items) {
    if (removed >= count) break // Stop if we've removed enough items

    if (inventory[item] && inventory[item].length > 0) {
      const toRemove = Math.min(count - removed, inventory[item].length) // Remove up to the count or the item's quantity
      inventory[item].splice(0, toRemove)
      removed += toRemove
      message += `Lost ${toRemove} ${itemNames[item]}, `
    }
  }

  if (message === "") {
    message = "No items to lose"
  } else {
    message = message.slice(0, -2) // Remove trailing comma and space
  }

  return message
}

// Function to grant items (either random or chosen)
function grantItems(type, count) {
  if (type === "choose") {
    const itemType = prompt(
      `COMMUNITY BOOST\n\nChoose an item to receive ${count} units of:\n\n${items.map((i) => itemNames[i]).join(", ")}\n\nOK = Get Selected Item\nCancel = Get Random Items`,
    )

    if (itemType && items.includes(itemType)) {
      if (!inventory[itemType]) inventory[itemType] = []
      for (let i = 0; i < count; i++) {
        inventory[itemType].push(currentPrices[itemType] || 1) // Use current price or default to 1
      }
      updateInventoryDisplay()
      return `Gained ${count} ${itemNames[itemType]}`
    } else {
      return grantItems("random", count) // Fallback to random if invalid input
    }
  } else {
    // Grant random items
    let message = ""
    for (let i = 0; i < count; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)]
      if (!inventory[randomItem]) inventory[randomItem] = []
      inventory[randomItem].push(currentPrices[randomItem] || 1) // Use current price or default to 1
      message += `Gained 1 ${itemNames[randomItem]}, `
    }
    updateInventoryDisplay()
    return message.slice(0, -2) // Remove trailing comma and space
  }
}

function setAllToOne() {
  for (const item of items) {
    currentPrices[item] = 1
  }
}

function doublePrices() {
  const newPrices = {}
  for (const item in currentPrices) {
    newPrices[item] = currentPrices[item] * 2
  }
  return newPrices
}

function sellAllAtHalf() {
  let totalEarned = 0
  let itemsSold = 0

  for (const item of items) {
    if (inventory[item] && inventory[item].length > 0) {
      const count = inventory[item].length
      const price = Math.max(1, Math.floor((currentPrices[item] || 1) / 2)) // Half price, min 1
      const earned = count * price

      totalEarned += earned
      itemsSold += count

      log(`-- Emergency sale: ${count} ${itemNames[item]} for ${earned} BTC.`)
    }
  }

  inventory = {} // Clear inventory
  btc += totalEarned // Add earnings
  updateStatusBars()
  updateInventoryDisplay()

  return `Sold all for ${totalEarned} BTC`
}

function countInventory() {
  let count = 0
  for (const item in inventory) {
    if (inventory[item]) {
      count += inventory[item].length
    }
  }
  return count
}

function generateGameHash() {
  const dataString = JSON.stringify({
    btc: btc,
    glock: glock,
    gameHistory: gameHistory,
  })
  let hash = 0
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// Update status bars
function updateStatusBars() {
  // Update main status
  document.getElementById("cycle").textContent = cycle
  document.getElementById("btc").textContent = btc
  document.getElementById("glock").textContent = glock ? "Yes" : "No"
  document.getElementById("invCount").textContent = countInventory()

  // Update bottom bar
  document.getElementById("cycleBottom").textContent = cycle
  document.getElementById("btcBottom").textContent = btc
  document.getElementById("glockBottom").textContent = glock ? "Yes" : "No"
  document.getElementById("invCountBottom").textContent = countInventory()
}

// Update inventory display
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
}

// Modify the log function to put timestamp at the end
function log(message) {
  const logArea = document.getElementById("log")
  const timestamp = new Date().toLocaleTimeString()

  // Add new message at the top
  logArea.textContent = `${message} [${timestamp}]\n` + logArea.textContent

  // Limit visible entries (but keep all in the DOM for scrolling)
  const entries = logArea.textContent.split("\n").filter((entry) => entry.trim() !== "")

  // If we have more than 6 entries, add a visual separator
  if (entries.length > 6) {
    // We don't need to truncate the actual content since we're using scrolling
    // Just add a visual indicator after the 6th entry
    const firstSixEntries = entries.slice(0, 6).join("\n")
    const remainingEntries = entries.slice(6).join("\n")

    // Only add the separator if we haven't already
    if (!logArea.textContent.includes("------- Previous Events -------")) {
      logArea.textContent = firstSixEntries + "\n------- Previous Events -------\n" + remainingEntries
    }
  }

  // Scroll to top to show newest entries
  logArea.scrollTop = 0
}

// Clear inventory
function clearInventory() {
  inventory = {}
  log("-- All inventory cleared.")
}

// Dummy function for populateMarketTable
function populateMarketTable() {
  // This function is intentionally left blank.
  // It's here to prevent errors when the game tries to call it.
  // The actual market table is populated dynamically.
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Game initializing...")
  updateStatusBars()
  updateInventoryDisplay()
  populateMarketTable()
  populateTransactionTable()
  log("Welcome to Silk Ave. You start with 100 BTC. Good luck.")

  // Add event listener for event code input
  document.getElementById("eventCode").addEventListener("input", function () {
    if (this.value.length === 3 && gameFlowState === "enterEventCode") {
      gameFlowState = "applyEvent"
      updateGameFlowHighlight()
    }
  })

  // Start the guided highlighting
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

  // Update the advance button text if we're on cycle 10
  updateAdvanceButtonForFinalRound()

  // Check if we're coming from a game completion with score data
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has("gameData")) {
    try {
      const gameData = JSON.parse(atob(urlParams.get("gameData")))
      if (gameData && gameData.btc && gameData.gameHistory) {
        // We have verified game data, auto-fill the form
        document.getElementById("btc").value = gameData.btc
        document.getElementById("glock").value = gameData.glock ? "Yes" : "No"
        document.getElementById("gameHistory").value = JSON.stringify(gameData.gameHistory)

        // Show a message about verified score
        const form = document.getElementById("scoreForm")
        if (form) {
          const verifiedMsg = document.createElement("div")
          verifiedMsg.className = "verified-score"
          verifiedMsg.innerHTML = "✓ Verified score from completed game"
          verifiedMsg.style.color = "#0f0"
          verifiedMsg.style.marginBottom = "1rem"
          verifiedMsg.style.textAlign = "center"
          form.prepend(verifiedMsg)
        }
      }
    } catch (e) {
      console.error("Error parsing game data:", e)
    }
  }

  console.log("Game initialization complete")
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
  console.log("Updating highlight for state:", gameFlowState)

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
  console.log("Highlighting element:", elementId)
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.add("highlight-pulse")
    console.log("Added highlight-pulse class to", elementId)
  } else {
    console.error("Element not found:", elementId)
  }
}

// Event card application
function applyEvent() {
  console.log("applyEvent function called")
  playSound("bleep")

  // Check if an event card has already been applied this cycle
  if (eventCardApplied) {
    log("-- You've already applied an event card this cycle. Advance to the next cycle to apply another.")
    return
  }

  eventCode = document.getElementById("eventCode").value.trim()

  // Validate event code
  if (!eventCode) {
    log("-- Please enter a valid event code.")
    return
  }

  // Reset any previous event effects
  resetEventEffects()

  // Check if it's a roll card
  isRollCard = ["001", "002", "009", "017", "019", "020", "023", "024"].includes(eventCode)
  document.getElementById("rollCardBtn").style.display = isRollCard ? "inline-block" : "none"
  document.getElementById("cardDiceResult").textContent = ""

  log(`-- Event code ${eventCode} applied.`)

  // Record this action in game history
  gameHistory.push({
    action: "applyEvent",
    cycle: cycle,
    eventCode: eventCode,
    btc: btc,
    inventory: JSON.parse(JSON.stringify(inventory)),
  })

  // Mark that an event card has been applied this cycle
  eventCardApplied = true

  // If not a roll card, apply effect immediately
  if (!isRollCard) {
    const result = runCardEffect(eventCode, null)
    document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result

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

// Roll dice for card effect
function rollCardDice() {
  console.log("rollCardDice function called")
  playSound("bleep")

  if (!isRollCard || eventCode === "") return

  const result = Math.ceil(Math.random() * 6)
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${result}`

  const outcome = runCardEffect(eventCode, result)
  document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`

  // Record this action in game history
  gameHistory.push({
    action: "rollCard",
    cycle: cycle,
    eventCode: eventCode,
    roll: result,
    outcome: outcome,
    btc: btc,
    inventory: JSON.parse(JSON.stringify(inventory)),
  })

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
    case "001": // FBI Sting
      if (roll <= 2) {
        clearInventory()
        btc = Math.max(0, btc - 50)
        message = "Lose all inventory and 50 BTC"
      } else {
        if (glock) {
          glock = false
          message = "Lose Glock"
        } else {
          btc = Math.max(0, btc - 20)
          message = "Lose 20 BTC"
        }
      }
      break

    case "002": // Hacked!
      if (roll <= 2) {
        const lossAmount = Math.floor(btc * 0.25)
        btc = Math.max(0, btc - lossAmount)
        message = `Lose 25% of BTC (${lossAmount} BTC)`
      } else {
        const gainAmount = Math.floor(btc * 0.125) // Half of what would have been lost
        btc += gainAmount
        message = `Recover half of what you almost lost (${gainAmount} BTC)`
      }
      break

    case "003": // Rival Ripoff
      const mostExpensiveItem = findMostExpensiveItem()
      if (mostExpensiveItem) {
        removeItem(mostExpensiveItem)
        message = `Lose your most expensive item (${itemNames[mostExpensiveItem]})`
      } else {
        message = "No items to lose"
      }
      btc = Math.max(0, btc - 10)
      message += " and 10 BTC"
      break

    case "004": // Data Breach
      inventory.passports = []
      inventory.accounts = []
      message = "Lose all Passports and Accounts"
      break

    case "005": // Burner Account Blows Up
      if (glock) {
        glock = false
        message = "Lose Glock"
      } else {
        btc = Math.max(0, btc - 10)
        message = "Lose 10 BTC"
      }
      break

    case "006": // Street Raid
      wipeHalfInventory()
      message = "Lose half of your inventory"
      break

    case "007": // Crypto Crash
      currentPrices = halvePrices()
      message = "All prices halved this round"
      break

    case "008": // Compromised Drop Point
      blockSelling = true
      message = "Cannot sell this round"
      break

    case "009": // Shipping Intercepted
      if (roll <= 3) {
        message = removeItems(3)
      } else {
        btc = Math.max(0, btc - 25)
        message = "Lose 25 BTC"
      }
      break

    case "010": // Seized Server
      blockBuying = true
      message = "Cannot buy this round"
      break

    case "011": // Found a Stash
      // Fixed: Properly handle the Found a Stash card
      const actualCount = Math.ceil(Math.random() * 10) // Random 1-10 units

      // Ask user to choose an item
      const itemType011 = prompt(
        `FOUND A STASH\n\nYou discovered ${actualCount} units of product!\nType the exact name of the item you want:\n\n${items.map((i) => itemNames[i]).join(", ")}\n\nOK = Get Selected Item\nCancel = Get Random Items`,
      )

      // Process the user's choice
      if (itemType011 && items.includes(itemType011.toLowerCase())) {
        // User selected a valid item
        const selectedItem = itemType011.toLowerCase()
        if (!inventory[selectedItem]) inventory[selectedItem] = []

        // Add the items to inventory
        for (let i = 0; i < actualCount; i++) {
          inventory[selectedItem].push(currentPrices[selectedItem] || 1)
        }

        message = `Gained ${actualCount} ${itemNames[selectedItem]}`
      } else {
        // User canceled or entered invalid item - give random items
        message = grantItems("random", actualCount)
      }
      break

    case "012": // Crypto Pump
      currentPrices = doublePrices()
      message = "All prices doubled this round"
      break

    case "013": // Inside Connection
      btc += 40
      message = "Gain 40 BTC"
      break

    case "014": // Deadman's Switch
      btc += 50
      message = "Gain 50 BTC"
      break

    case "015": // Whale Buyout
      const itemType015 = prompt(
        `WHALE BUYOUT\n\nA big player wants to buy in bulk!\nType the exact name of the item to sell at TRIPLE price:\n\n${items.map((i) => itemNames[i]).join(", ")}\n\nOK = Apply Triple Price to Selected Item\nCancel = No Effect`,
      )

      // Process the user's choice
      if (itemType015 && items.includes(itemType015.toLowerCase())) {
        const selectedItem = itemType015.toLowerCase()
        // Triple the price for this item
        if (currentPrices[selectedItem]) {
          currentPrices[selectedItem] *= 3
          message = `${itemNames[selectedItem]} price tripled to ${currentPrices[selectedItem]} BTC`
          // Update the market table to reflect the new price
          updateMarketTable()
        } else {
          message = "No effect - roll market prices first"
        }
      } else {
        message = "No effect"
      }
      break

    case "016": // Deep Web Payday
      if (!glock) {
        glock = true
        btc += 30
        message = "Gain 30 BTC and Glock"
      } else {
        btc += 10
        message = "Already had Glock — Gain 10 BTC instead"
      }
      break

    case "017": // Community Boost
      if (roll <= 3) {
        btc += 50
        message = "Gain 50 BTC"
      } else {
        message = grantItems("choose", 10)
      }
      break

    case "018": // Black Market Flash Sale
      setAllToOne()
      message = "All prices set to 1 BTC"
      break

    case "019": // Bribe Your Way Out
      if (roll <= 3) {
        wipeHalfInventory()
        btc = Math.max(0, btc - 20)
        message = "Lose half inventory and 20 BTC"
      } else {
        message = "Bribe succeeded — no effect"
      }
      break

    case "020": // Government Deal
      if (roll <= 2) {
        btc = Math.max(0, btc - 25)
        message = "Lose 25 BTC"
      } else {
        btc += 50
        message = "Gain 50 BTC"
      }
      break

    case "021": // Emergency Sale
      if (
        confirm(
          "EMERGENCY SALE\n\nThe network's volatile. You can liquidate now at a loss...\nor hold and forfeit all buys this cycle.\n\nOK = Sell all Inventory (Half Value)\nCancel = Hold Inventory (No Buying)",
        )
      ) {
        message = sellAllAtHalf()
      } else {
        blockBuying = true
        message = "Cannot buy this round"
      }
      break

    case "022": // Cut and Run
      if (
        confirm(
          "CUT AND RUN\n\nYou've got seconds. Ditch the stash and bolt… or stay and hope they don't breach your door.\n\nOK = Lose all inventory, gain 40 BTC\nCancel = Keep your inventory and gain nothing",
        )
      ) {
        clearInventory()
        btc += 40
        message = "Gain 40 BTC, lose inventory"
      } else {
        message = "Kept inventory"
      }
      break

    case "023": // Blackmail
      if (roll <= 2) {
        btc = Math.max(0, btc - 40)
        message = "Lose 40 BTC"
      } else {
        message = "No effect"
      }
      break

    case "024": // Rival's Request
      // First send 20 BTC
      btc = Math.max(0, btc - 20)

      if (roll <= 2) {
        message = "Ghosted — lost 20 BTC"
      } else {
        if (!glock) {
          btc += 40 // Get back 20 + gain 20
          glock = true
          message = "Gain 20 BTC and Glock"
        } else {
          btc += 30 // Get back 20 + gain 10
          message = "Gain 10 BTC (already had Glock)"
        }
      }
      break

    case "025": // Supply Chain Collapse
      currentPrices = doublePrices()
      message = "All prices doubled this round"
      break

    case "026": // Product Ban
      bannedItem = items[Math.floor(Math.random() * items.length)]
      message = `Banned product this round: ${itemNames[bannedItem]}`
      break

    case "027": // Domestic Disruption
      blockBuying = true
      blockSelling = true
      message = "Cannot buy or sell this round"
      // Since no buying or selling is possible, highlight the advance button
      gameFlowState = "advanceCycle"
      updateGameFlowHighlight()
      break

    case "028": // Family Emergency
      if (confirm("FAMILY EMERGENCY\n\nPress OK to lose 30 BTC.\nPress Cancel to skip this entire round.")) {
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
      break

    default:
      message = "Invalid card code"
  }

  updateStatusBars()
  updateInventoryDisplay()
  return message
}

// Roll market prices
function rollMarket() {
  console.log("rollMarket function called")
  playSound("bleep")

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

  // Record this action in game history
  gameHistory.push({
    action: "rollMarket",
    cycle: cycle,
    prices: JSON.parse(JSON.stringify(currentPrices)),
    btc: btc,
  })

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
  console.log("applyBurnerDeal function called")
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

  // Record this action in game history
  gameHistory.push({
    action: "burnerDeal",
    cycle: cycle,
    item: burnerItem,
    originalPrice: originalPrice,
    newPrice: currentPrices[burnerItem],
  })

  // Update game flow state
  gameFlowState = "executeTransactions"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Update market table with current prices
function updateMarketTable() {
  const tableBody = document.querySelector("#marketTable tbody")
  tableBody.innerHTML = ""

  // Get the current burner deal item
  const burnerItem = document.getElementById("burnerDeal").value

  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")

    // Add burner deal indicators if this is the burner item
    if (item === burnerItem && burnerItem !== "") {
      nameCell.innerHTML = `>> <span class="active-glow">${itemNames[item]}</span> <<`
    } else {
      nameCell.textContent = itemNames[item]
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

    // If this is the burner item, highlight the price cell too
    if (item === burnerItem && burnerItem !== "") {
      priceCell.style.backgroundColor = "#001100"
      priceCell.style.border = "1px solid #0f0"
      priceCell.style.boxShadow = "0 0 5px #0f0"
    }

    row.appendChild(priceCell)

    tableBody.appendChild(row)
  }
}

// Populate transaction table
function populateTransactionTable() {
  const tableBody = document.querySelector("#transactionTable tbody")
  tableBody.innerHTML = ""

  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")
    nameCell.textContent = itemNames[item]
    row.appendChild(nameCell)

    // Buy cell
    const buyCell = document.createElement("td")
    const buyInput = document.createElement("input")
    buyInput.type = "number"
    buyInput.min = "0"
    buyInput.id = `buy-${item}`
    buyInput.className = "buy-input"
    buyInput.style.width = "50px"
    buyCell.appendChild(buyInput)
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
    row.appendChild(sellCell)

    tableBody.appendChild(row)
  }
}

// Execute buy/sell transactions
function executeTransactions() {
  console.log("executeTransactions function called")
  playSound("bleep")

  if (blockBuying && blockSelling) {
    log("-- Cannot buy or sell this round due to event effect.")
    return
  }

  let totalBought = 0
  let totalSold = 0
  let btcSpent = 0
  let btcEarned = 0
  const transactionDetails = {
    bought: {},
    sold: {},
  }

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

        // Track what was sold
        transactionDetails.sold[item] = {
          amount: sellAmount,
          price: currentPrices[item],
          total: sellAmount * currentPrices[item],
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
          log(`-- Error: Cannot afford ${buyAmount} ${itemNames[item]}. Need ${cost} BTC, have ${btc} BTC.`)
          continue
        }

        // Check inventory space
        const currentInventoryCount = countInventory()
        if (currentInventoryCount + buyAmount > inventoryLimit) {
          log(
            `-- Error: Not enough inventory space. Can only add ${inventoryLimit - currentInventoryCount} more items.`,
          )
          continue
        }

        // Track what was bought
        transactionDetails.bought[item] = {
          amount: buyAmount,
          price: currentPrices[item],
          total: cost,
        }

        // Add items to inventory and subtract BTC
        if (!inventory[item]) inventory[item] = []
        for (let i = 0; i < buyAmount; i++) {
          inventory[item].push(currentPrices[item]) // Store purchase price
        }

        btcSpent += cost
        totalBought += buyAmount
        log(`-- Bought ${buyAmount} ${itemNames[item]} for ${cost} BTC.`)

        // Reset input
        buyInput.value = ""
      }
    }
  }

  // Update BTC after buying
  btc -= btcSpent

  // Log summary
  if (totalBought > 0 || totalSold > 0) {
    log(`-- Transaction complete: Bought ${totalBought}, Sold ${totalSold}, Net BTC change: ${btcEarned - btcSpent}`)

    // Record this action in game history
    gameHistory.push({
      action: "transactions",
      cycle: cycle,
      bought: transactionDetails.bought,
      sold: transactionDetails.sold,
      btcSpent: btcSpent,
      btcEarned: btcEarned,
      netChange: btcEarned - btcSpent,
      newBtcTotal: btc,
    })
  } else {
    log("-- No transactions executed.")
  }

  updateStatusBars()
  updateInventoryDisplay()

  // Update game flow state
  gameFlowState = "advanceCycle"

  // Update the highlighted element
  updateGameFlowHighlight()
}

// Sell everything in inventory
function sellEverything() {
  console.log("sellEverything function called")
  playSound("bleep")

  if (blockSelling) {
    log("-- Cannot sell due to event effect.")
    return
  }

  let totalSold = 0
  let btcEarned = 0
  const soldItems = []

  // Process all items
  for (const item of items) {
    if (item === bannedItem) continue

    const itemInventory = inventory[item] || []
    const count = itemInventory.length

    if (count > 0) {
      const earned = count * currentPrices[item]
      btcEarned += earned
      totalSold += count

      soldItems.push(`${count} ${itemNames[item]} for ${earned} BTC`)
      log(`-- Sold ${count} ${itemNames[item]} for ${earned} BTC.`)

      // Clear this item from inventory
      inventory[item] = []
    }
  }

  // Update BTC
  btc += btcEarned

  // Log summary
  if (totalSold > 0) {
    log(`-- Sold everything: ${totalSold} items for ${btcEarned} BTC.`)

    // Record this action in game history
    gameHistory.push({
      action: "sellEverything",
      cycle: cycle,
      itemsSold: totalSold,
      btcEarned: btcEarned,
      newBtcTotal: btc,
    })
  } else {
    log("-- No items to sell.")
  }

  updateStatusBars()
  updateInventoryDisplay()
}

// Buy a Glock
function buyGlock() {
  console.log("buyGlock function called")
  playSound("bleep")

  if (glock) {
    log("-- You already have a Glock.")
    return
  }

  if (btc < 20) {
    log("-- Not enough BTC to buy a Glock. Need 20 BTC.")
    return
  }

  btc -= 20
  glock = true
  log("-- Purchased a Glock for 20 BTC.")

  // Record this action in game history
  gameHistory.push({
    action: "buyGlock",
    cycle: cycle,
    cost: 20,
    newBtcTotal: btc,
  })

  updateStatusBars()
}

// Update the advance button text based on the current cycle
function updateAdvanceButtonForFinalRound() {
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (advanceButton) {
    if (cycle === 10) {
      advanceButton.textContent = "Cash Out and Go Dark"
      advanceButton.style.backgroundColor = "#006600"
      advanceButton.style.color = "#ffffff"
      advanceButton.style.fontWeight = "bold"
      advanceButton.style.border = "2px solid #00ff00"
    } else {
      advanceButton.textContent = "Advance to Next Cycle"
      advanceButton.style.backgroundColor = ""
      advanceButton.style.color = ""
      advanceButton.style.fontWeight = ""
      advanceButton.style.border = ""
    }
  }
}

// Cash out all inventory at current market prices
function cashOutInventory() {
  let totalEarned = 0
  let itemsSold = 0
  const soldItems = []

  // Only proceed if selling is allowed
  if (blockSelling) {
    log("-- Cannot sell due to event effect. Cashing out with current BTC only.")
    return { totalEarned: 0, itemsSold: 0, soldItems: [] }
  }

  // Sell all inventory at current prices
  for (const item of items) {
    if (item === bannedItem) continue

    const itemInventory = inventory[item] || []
    const count = itemInventory.length

    if (count > 0) {
      const price = currentPrices[item] || 1
      const earned = count * price

      totalEarned += earned
      itemsSold += count

      soldItems.push(`${count} ${itemNames[item]} for ${earned} BTC`)
      log(`-- Cashed out ${count} ${itemNames[item]} for ${earned} BTC.`)
    }
  }

  // Clear inventory and add BTC
  inventory = {}
  btc += totalEarned

  if (itemsSold > 0) {
    log(`-- Final cash out: Sold ${itemsSold} items for ${totalEarned} BTC.`)
  }

  return { totalEarned, itemsSold, soldItems }
}

// Advance to next cycle or cash out if on final round
function advanceCycle() {
  console.log("advanceCycle function called")
  playSound("bleep")

  if (cycle === 10) {
    // This is the final round - cash out and end game
    const cashOutResult = cashOutInventory()

    log("-- GAME OVER! You've gone dark with your earnings.")

    // Record cash out in game history
    if (cashOutResult.itemsSold > 0) {
      gameHistory.push({
        action: "cashOut",
        cycle: cycle,
        itemsSold: cashOutResult.itemsSold,
        btcEarned: cashOutResult.totalEarned,
        finalBtc: btc,
      })
    }

    // Record final game state
    gameHistory.push({
      action: "gameComplete",
      finalBtc: btc,
      hasGlock: glock,
      totalCycles: cycle,
    })

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

    // Show game over message with clearer instructions
    const gameOver = confirm(
      `GAME OVER! You've gone dark with your earnings.

Final score: ${btc} BTC with${glock ? "" : "out"} a Glock.${cashOutDetails}

Click OK to go to the leaderboard submission page.
(You'll need to enter your name and click Submit on the next screen)`,
    )

    if (gameOver) {
      // Redirect to submit page with verified game data
      window.location.href = `submit.html?gameData=${encodedGameData}`
    }

    return
  }

  // Record this action in game history
  gameHistory.push({
    action: "advanceCycle",
    fromCycle: cycle - 1,
    toCycle: cycle,
    btc: btc,
    inventory: JSON.parse(JSON.stringify(inventory)),
  })

  // Reset event card applied flag
  eventCardApplied = false

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

  log(`-- Advanced to Cycle ${cycle}/10`)
  updateStatusBars()

  // Update the advance button text for the final round
  updateAdvanceButtonForFinalRound()

  // Reset game flow state
  gameFlowState = "enterEventCode"

  // Update the highlighted element
  updateGameFlowHighlight()
}

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

// Mock functions to resolve undeclared variable errors
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

function updateInventoryDisplay() {
  console.log("updateInventoryDisplay called")
}

function log(message) {
  console.log(message)
}

function clearInventory() {
  console.log("clearInventory called")
}

function halvePrices() {
  console.log("halvePrices called")
  return currentPrices
}

// Declare missing functions
function doublePrices() {
  console.log("doublePrices called")
  return currentPrices
}

function showConfirm(title, message, confirmText, cancelText) {
  return new Promise((resolve) => {
    const result = window.confirm(`${title}\n\n${message}\n\nConfirm: ${confirmText}\nCancel: ${cancelText}`)
    resolve(result)
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

function showPrompt(title, message) {
  return new Promise((resolve) => {
    const result = window.prompt(`${title}\n\n${message}`, "")
    resolve(result)
  })
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  updateStatusBars()
  updateInventoryDisplay()
  updateMarketTable()
  // We'll use the static rows in the HTML instead of calling populateTransactionTable()
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

  // Set initial button text based on cycle
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (cycle === 10) {
    advanceButton.textContent = "Cash Out and Go Dark"
  }
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
      showPrompt(
        "WHALE BUYOUT",
        `A big player wants to buy in bulk!
Choose an item to sell at TRIPLE price:

${items.map((i) => itemNames[i]).join(", ")}`,
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
    // Use custom prompt instead of browser prompt
    showPrompt(
      "COMMUNITY BOOST",
      `Choose an item to receive ${actualCount} units of:

${items.map((i) => itemNames[i]).join(", ")}`,
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

// Advance to the next cycle
function advanceCycle() {
  playSound("bleep")

  // Reset event code
  document.getElementById("eventCode").value = ""
  document.getElementById("cardDiceResult").textContent = ""
  document.getElementById("marketDiceResult").textContent = ""

  // Reset burner deal
  document.getElementById("burnerDeal").value = ""

  // Reset transaction inputs
  const buyInputs = document.querySelectorAll(".buy-input")
  buyInputs.forEach((input) => (input.value = ""))
  const sellInputs = document.querySelectorAll(".sell-input")
  sellInputs.forEach((input) => (input.value = ""))

  // Reset any previous event effects
  resetEventEffects()

  // Update game flow state
  gameFlowState = "enterEventCode"

  // Update the highlighted element
  updateGameFlowHighlight()

  // Roll market prices
  rollMarket()

  // Update market table
  updateMarketTable()

  // Repopulate transaction table
  populateTransactionTable()

  // Increment cycle
  cycle++

  // Update button text on last cycle
  const advanceButton = document.getElementById("advanceCycleBtn")
  if (cycle === 10) {
    advanceButton.textContent = "Cash Out and Go Dark"
  }

  log(`-- Advanced to cycle ${cycle}.`)
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

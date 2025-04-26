// Silk Ave - Modified script.js with guided highlighting and custom modals

let btc = 100
let glock = false
let cycle = 1
let inventory = {}
let currentPrices = {}
let eventCode = ""
let isRollCard = false
let blockBuying = false
let blockSelling = false
let bannedItem = null
const inventoryLimit = 20

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

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
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
  isRollCard = ["001", "002", "009", "017", "019", "020", "023", "024"].includes(eventCode)
  document.getElementById("rollCardBtn").style.display = isRollCard ? "inline-block" : "none"
  document.getElementById("cardDiceResult").textContent = ""

  log(`-- Event code ${eventCode} applied.`)

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
  playSound("bleep")

  if (!isRollCard || eventCode === "") return

  const result = Math.ceil(Math.random() * 6)
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${result}`

  const outcome = runCardEffect(eventCode, result)
  document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`

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
      showPrompt(
        "FOUND A STASH",
        `You discovered a stash of product!\nChoose an item to receive 5 units of:\n\n${items.map((i) => itemNames[i]).join(", ")}`,
      ).then((itemType) => {
        let result = ""
        if (itemType) {
          // Find matching item (case insensitive)
          const matchedItem = items.find(
            (i) => itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
          )

          if (matchedItem) {
            if (!inventory[matchedItem]) inventory[matchedItem] = []
            for (let i = 0; i < 5; i++) {
              inventory[matchedItem].push(currentPrices[matchedItem] || 5) // Use current price or default to 5
            }
            result = `Gained 5 ${itemNames[matchedItem]}`
          } else {
            // If invalid choice, give random items
            result = grantRandomItems(5)
          }
        } else {
          // If canceled, give random items
          result = grantRandomItems(5)
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
        updateInventoryDisplay()
        updateStatusBars()
      })
      return "Waiting for your item selection..."

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
      showPrompt(
        "WHALE BUYOUT",
        `A big player wants to buy in bulk!\nChoose an item to sell at TRIPLE price:\n\n${items.map((i) => itemNames[i]).join(", ")}`,
      ).then((itemType) => {
        let result = ""

        if (itemType) {
          // Find matching item (case insensitive)
          const matchedItem = items.find(
            (i) => itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
          )

          if (matchedItem && currentPrices[matchedItem]) {
            const originalPrice = currentPrices[matchedItem]
            currentPrices[matchedItem] = originalPrice * 3
            updateMarketTable()
            result = `Whale buyout: ${itemNames[matchedItem]} sell price tripled to ${currentPrices[matchedItem]} BTC`
          } else {
            result = "Invalid item choice - no effect"
          }
        } else {
          result = "No item selected - no effect"
        }

        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
      })

      return "Waiting for your item selection..."

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
        showPrompt(
          "COMMUNITY BOOST",
          `Choose an item to receive 10 units of:\n\n${items.map((i) => itemNames[i]).join(", ")}`,
        ).then((itemType) => {
          let result = ""
          if (itemType) {
            // Find matching item (case insensitive)
            const matchedItem = items.find(
              (i) =>
                itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
            )

            if (matchedItem) {
              if (!inventory[matchedItem]) inventory[matchedItem] = []
              for (let i = 0; i < 10; i++) {
                inventory[matchedItem].push(currentPrices[matchedItem] || 5) // Use current price or default to 5
              }
              result = `Gained 10 ${itemNames[matchedItem]}`
            } else {
              // If invalid choice, give random items
              result = grantRandomItems(10)
            }
          } else {
            // If canceled, give random items
            result = grantRandomItems(10)
          }
          document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
          updateInventoryDisplay()
          updateStatusBars()
        })
        return "Waiting for your item selection..."
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
      showConfirm(
        "EMERGENCY SALE",
        "The network's volatile. You can liquidate now at a loss...\nor hold and forfeit all buys this cycle.",
        "Sell All (Half Value)",
        "Hold (No Buying)",
      ).then((result) => {
        let outcome = ""
        if (result) {
          outcome = sellAllAtHalf()
        } else {
          blockBuying = true
          outcome = "Cannot buy this round"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "022": // Cut and Run
      showConfirm(
        "CUT AND RUN",
        "You've got seconds. Ditch the stash and bolt… or stay and hope they don't breach your door.",
        "Lose Inventory (+40 BTC)",
        "Keep Inventory",
      ).then((result) => {
        let outcome = ""
        if (result) {
          clearInventory()
          btc += 40
          outcome = "Gain 40 BTC, lose inventory"
        } else {
          outcome = "Kept inventory"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

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
      showConfirm(
        "FAMILY EMERGENCY",
        "Your sister's in trouble. Pay off her debt or skip this cycle to help her.",
        "Lose 30 BTC",
        "Skip Turn",
      ).then((result) => {
        let outcome = ""
        if (result) {
          btc = Math.max(0, btc - 30)
          outcome = "Lose 30 BTC"
        } else {
          blockBuying = true
          blockSelling = true
          outcome = "Skip turn"
          // Since the player chose to skip the round, highlight the advance button
          gameFlowState = "advanceCycle"
          updateGameFlowHighlight()
          // Show a hint to advance to the next cycle
          showHint("You've skipped this round. Click 'Advance to Next Cycle' to continue.")
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
      })
      return "Waiting for your decision..." // Temporary message until user decides

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
  const itemsAdded = []

  for (let i = 0; i < count; i++) {
    const randomItem = items[Math.floor(Math.random() * items.length)]
    if (!inventory[randomItem]) inventory[randomItem] = []
    inventory[randomItem].push(currentPrices[randomItem] || 5) // Use current price or default to 5
    itemsAdded.push(itemNames[randomItem])
    added++
  }

  updateInventoryDisplay()
  updateStatusBars()
  return `Gained ${added} random items: ${itemsAdded.join(", ")}`
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

  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")
    nameCell.textContent = itemNames[item]
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

// Buy a Glock
function buyGlock() {
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

  updateStatusBars()
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

// Advance to next cycle
function advanceCycle() {
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
        window.location.href = `submit.html?btc=${btc}&glock=${glock ? "Yes" : "No"}&hash=${gameHash}`
      }
    })

    return
  }

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

  log(`-- Advanced to Cycle ${cycle}/10`)
  updateStatusBars()

  // Reset game flow state
  gameFlowState = "enterEventCode"

  // Update the highlighted element
  updateGameFlowHighlight()

  // Robust scroll to top implementation
  scrollToTop()
}

// Add this new function for scrolling to top
function scrollToTop() {
  try {
    // Try modern smooth scrolling first
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })

    // Also apply these for older browsers
    document.body.scrollTop = 0 // For Safari
    document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
  } catch (e) {
    // Fallback for very old browsers
    window.scrollTo(0, 0)
  }
}

// Helper Functions

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

// Count total inventory
function countInventory() {
  let count = 0
  for (const item of items) {
    count += (inventory[item] || []).length
  }
  return count
}

// Modify the log function to put timestamp at the end
function log(message) {
  const logArea = document.getElementById("log")
  const timestamp = new Date().toLocaleTimeString()
  logArea.textContent = `${message} [${timestamp}]\n` + logArea.textContent
}

// Clear inventory
function clearInventory() {
  inventory = {}
  log("-- All inventory cleared.")
}

// Remove a specific item
function removeItem(itemType) {
  if (inventory[itemType] && inventory[itemType].length > 0) {
    inventory[itemType].pop()
    return true
  }
  return false
}

// Find most expensive item
function findMostExpensiveItem() {
  let mostExpensive = null
  let highestPrice = 0

  for (const item of items) {
    const itemInventory = inventory[item] || []
    if (itemInventory.length > 0) {
      // Find highest price in this item category
      const maxPrice = Math.max(...itemInventory)
      if (maxPrice > highestPrice) {
        highestPrice = maxPrice
        mostExpensive = item
      }
    }
  }

  return mostExpensive
}

// Remove multiple items
function removeItems(count) {
  let removed = 0
  const itemsRemoved = []

  // Flatten inventory into a single array of [item, price] pairs
  const allItems = []
  for (const item of items) {
    const itemInventory = inventory[item] || []
    for (let i = 0; i < itemInventory.length; i++) {
      allItems.push([item, itemInventory[i]])
    }
  }

  // Sort by price (highest first)
  allItems.sort((a, b) => b[1] - a[1])

  // Remove the specified number of items
  for (let i = 0; i < Math.min(count, allItems.length); i++) {
    const [item, price] = allItems[i]
    removeItem(item)
    itemsRemoved.push(itemNames[item])
    removed++
  }

  if (removed === 0) {
    return "No items to remove"
  } else {
    return `Removed ${removed} items: ${itemsRemoved.join(", ")}`
  }
}

// Wipe half of inventory
function wipeHalfInventory() {
  const totalItems = countInventory()
  const toRemove = Math.ceil(totalItems / 2)

  if (totalItems === 0) {
    return
  }

  removeItems(toRemove)
  log(`-- Lost ${toRemove} items from inventory.`)
}

// Halve all prices
function halvePrices() {
  const newPrices = {}

  for (const item of items) {
    if (currentPrices[item]) {
      newPrices[item] = Math.max(1, Math.floor(currentPrices[item] / 2))
    }
  }

  updateMarketTable()
  return newPrices
}

// Double all prices
function doublePrices() {
  const newPrices = {}

  for (const item of items) {
    if (currentPrices[item]) {
      newPrices[item] = currentPrices[item] * 2
    }
  }

  updateMarketTable()
  return newPrices
}

// Set all prices to 1
function setAllToOne() {
  const newPrices = {}

  for (const item of items) {
    newPrices[item] = 1
  }

  currentPrices = newPrices
  updateMarketTable()
}

// Sell all inventory at half value
function sellAllAtHalf() {
  let totalEarned = 0
  let itemsSold = 0

  for (const item of items) {
    const itemInventory = inventory[item] || []
    const count = itemInventory.length

    if (count > 0) {
      const price = currentPrices[item] || 1
      const halfPrice = Math.max(1, Math.floor(price / 2))
      const earned = count * halfPrice

      totalEarned += earned
      itemsSold += count

      log(`-- Emergency sold ${count} ${itemNames[item]} at half price (${halfPrice} BTC each) for ${earned} BTC.`)
    }
  }

  // Clear inventory and add BTC
  inventory = {}
  btc += totalEarned

  return `Emergency sale: Sold ${itemsSold} items for ${totalEarned} BTC`
}

// Populate market table initially
function populateMarketTable() {
  const tableBody = document.querySelector("#marketTable tbody")
  tableBody.innerHTML = ""

  for (const item of items) {
    const row = document.createElement("tr")

    // Item name cell
    const nameCell = document.createElement("td")
    nameCell.textContent = itemNames[item]
    row.appendChild(nameCell)

    // Price cell
    const priceCell = document.createElement("td")
    priceCell.textContent = "—"
    row.appendChild(priceCell)

    tableBody.appendChild(row)
  }
}

// Generate a game hash for verification
function generateGameHash() {
  const dataString = JSON.stringify({
    btc: btc,
    glock: glock,
    cycle: cycle,
  })

  let hash = 0
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16).substring(0, 8)
}

// Custom prompt function
function showPrompt(title, message) {
  return new Promise((resolve) => {
    // Create modal elements
    const modal = document.createElement("div")
    modal.className = "modal"
    modal.style.display = "block"

    const modalContent = document.createElement("div")
    modalContent.className = "modal-content"

    const header = document.createElement("div")
    header.className = "modal-header"
    header.textContent = title

    const body = document.createElement("div")
    body.className = "modal-body"
    body.textContent = message

    const input = document.createElement("input")
    input.type = "text"
    input.className = "modal-input"

    const footer = document.createElement("div")
    footer.className = "modal-footer"

    const okButton = document.createElement("button")
    okButton.textContent = "OK"
    okButton.className = "modal-button"
    okButton.addEventListener("click", () => {
      resolve(input.value)
      modal.remove()
    })

    const cancelButton = document.createElement("button")
    cancelButton.textContent = "Cancel"
    cancelButton.className = "modal-button"
    cancelButton.addEventListener("click", () => {
      resolve(null)
      modal.remove()
    })

    // Assemble modal
    footer.appendChild(okButton)
    footer.appendChild(cancelButton)
    modalContent.appendChild(header)
    modalContent.appendChild(body)
    modalContent.appendChild(input)
    modalContent.appendChild(footer)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)

    // Focus on the input
    input.focus()
  })
}

// Custom confirm function
function showConfirm(title, message, okText, cancelText) {
  return new Promise((resolve) => {
    // Create modal elements
    const modal = document.createElement("div")
    modal.className = "modal"
    modal.style.display = "block"

    const modalContent = document.createElement("div")
    modalContent.className = "modal-content"

    const header = document.createElement("div")
    header.className = "modal-header"
    header.textContent = title

    const body = document.createElement("div")
    body.className = "modal-body"
    body.textContent = message

    const footer = document.createElement("div")
    footer.className = "modal-footer"

    const okButton = document.createElement("button")
    okButton.textContent = okText
    okButton.className = "modal-button"
    okButton.addEventListener("click", () => {
      resolve(true)
      modal.remove()
    })

    const cancelButton = document.createElement("button")
    cancelButton.textContent = cancelText
    cancelButton.className = "modal-button"
    cancelButton.addEventListener("click", () => {
      resolve(false)
      modal.remove()
    })

    // Assemble modal
    footer.appendChild(okButton)
    footer.appendChild(cancelButton)
    modalContent.appendChild(header)
    modalContent.appendChild(body)
    modalContent.appendChild(footer)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)
  })
}

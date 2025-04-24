// Silk Ave - Modified script.js that doesn't reveal card contents

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
})

// Event card application
function applyEvent() {
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
  } else {
    // For roll cards, just indicate that a roll is needed
    document.getElementById("cardDiceResult").textContent = "🎲 Roll required for this card"
  }
}

// Roll dice for card effect
function rollCardDice() {
  if (!isRollCard || eventCode === "") return

  const result = Math.ceil(Math.random() * 6)
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${result}`

  const outcome = runCardEffect(eventCode, result)
  document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`
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
      message = grantItems("choose", 5)
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
      message = applyWhaleBuyout()
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
      if (confirm("Sell all at half value?")) {
        message = sellAllAtHalf()
      } else {
        blockBuying = true
        message = "Cannot buy this round"
      }
      break

    case "022": // Cut and Run
      if (confirm("Lose inventory for 40 BTC?")) {
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
      break

    case "028": // Family Emergency
      if (confirm("Lose 30 BTC or skip turn?")) {
        btc = Math.max(0, btc - 30)
        message = "Lose 30 BTC"
      } else {
        blockBuying = true
        blockSelling = true
        message = "Skip turn"
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
  // Reset prices from any previous effects
  currentPrices = {}

  // Roll for each item
  for (const item of items) {
    const roll = Math.ceil(Math.random() * 6) - 1 // 0-5 index
    currentPrices[item] = priceMatrix[item][roll]
  }

  // Apply burner deal if set
  applyBurnerDeal()

  // Update market table
  updateMarketTable()

  // Show roll result
  const diceResult = Math.ceil(Math.random() * 6)
  document.getElementById("marketDiceResult").textContent = `🎲 You rolled: ${diceResult}`

  log("-- Market prices updated.")
}

// Apply burner deal
function applyBurnerDeal() {
  const burnerItem = document.getElementById("burnerDeal").value
  if (burnerItem && currentPrices[burnerItem]) {
    // Burner deals are half price
    currentPrices[burnerItem] = Math.max(1, Math.floor(currentPrices[burnerItem] / 2))
    log(`-- Burner deal applied: ${itemNames[burnerItem]} at ${currentPrices[burnerItem]} BTC`)
  }
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
}

// Buy a Glock
function buyGlock() {
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

// Advance to next cycle
function advanceCycle() {
  if (cycle >= 10) {
    log("-- Game over! Final score: " + btc + " BTC")

    // Show game over message
    const gameOver = confirm(
      `Game Over! Final score: ${btc} BTC with${glock ? "" : "out"} a Glock.\n\nWould you like to submit your score?`,
    )

    if (gameOver) {
      // Redirect to submit page with score
      window.location.href = `submit.html?btc=${btc}&glock=${glock ? "Yes" : "No"}`
    }

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
      inventoryText += `${itemNames[item]}: ${itemInventory.length}\n`
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

// Log message to the log area
function log(message) {
  const logArea = document.getElementById("log")
  const timestamp = new Date().toLocaleTimeString()
  logArea.textContent = `[${timestamp}] ${message}\n` + logArea.textContent
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

// Grant items (random or chosen)
function grantItems(method, count) {
  const currentCount = countInventory()
  const spaceLeft = inventoryLimit - currentCount

  if (spaceLeft <= 0) {
    btc += 25 // Bonus if inventory is full
    return `Inventory full - gained 25 BTC instead`
  }

  const actualCount = Math.min(count, spaceLeft)

  if (method === "random") {
    // Add random items
    let added = 0
    const itemsAdded = []

    for (let i = 0; i < actualCount; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)]
      if (!inventory[randomItem]) inventory[randomItem] = []
      inventory[randomItem].push(5) // Default value
      itemsAdded.push(itemNames[randomItem])
      added++
    }

    return `Gained ${added} random items: ${itemsAdded.join(", ")}`
  } else if (method === "choose") {
    // Let player choose item type
    const itemType = prompt(
      `Choose item type to receive ${actualCount} units:\n${items.map((i) => itemNames[i]).join(", ")}`,
    )

    // Find matching item
    const matchedItem = items.find((i) => itemNames[i].toLowerCase() === itemType.toLowerCase())

    if (matchedItem) {
      if (!inventory[matchedItem]) inventory[matchedItem] = []
      for (let i = 0; i < actualCount; i++) {
        inventory[matchedItem].push(5) // Default value
      }
      return `Gained ${actualCount} ${itemNames[matchedItem]}`
    } else {
      // If invalid choice, give random items
      return grantItems("random", actualCount)
    }
  }

  return "No items added"
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

// Apply whale buyout (triple sell price for one item)
function applyWhaleBuyout() {
  const itemType = prompt(
    `Choose item type for whale buyout (triple sell price):\n${items.map((i) => itemNames[i]).join(", ")}`,
  )

  // Find matching item
  const matchedItem = items.find((i) => itemNames[i].toLowerCase() === itemType.toLowerCase())

  if (matchedItem && currentPrices[matchedItem]) {
    const originalPrice = currentPrices[matchedItem]
    currentPrices[matchedItem] = originalPrice * 3
    updateMarketTable()
    return `Whale buyout: ${itemNames[matchedItem]} sell price tripled to ${currentPrices[matchedItem]} BTC`
  } else {
    return "Invalid item choice - no effect"
  }
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

// Silk Ave - Game Companion Script

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

// Custom confirm dialog with direct DOM manipulation
function createCustomConfirm(title, message, okText, cancelText) {
  return new Promise((resolve) => {
    // Create elements with inline styles
    const modalDiv = document.createElement("div")
    modalDiv.setAttribute(
      "style",
      `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    )

    const modalContent = document.createElement("div")
    modalContent.setAttribute(
      "style",
      `
      background-color: #111;
      color: #0f0;
      border: 2px solid #0f0;
      box-shadow: 0 0 20px #0f0;
      padding: 20px;
      width: 90%;
      max-width: 500px;
      text-align: center;
    `,
    )

    const modalTitle = document.createElement("h3")
    modalTitle.textContent = title
    modalTitle.setAttribute(
      "style",
      `
      color: #0f0;
      margin-bottom: 15px;
      text-shadow: 0 0 5px #0f0;
    `,
    )

    const modalMessage = document.createElement("p")
    modalMessage.textContent = message
    modalMessage.setAttribute(
      "style",
      `
      color: #0f0;
      margin-bottom: 20px;
      white-space: pre-line;
      text-align: left;
    `,
    )

    const buttonContainer = document.createElement("div")
    buttonContainer.setAttribute(
      "style",
      `
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    `,
    )

    const okButton = document.createElement("button")
    okButton.textContent = okText
    okButton.setAttribute(
      "style",
      `
      background-color: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px 20px;
      cursor: pointer;
      margin: 5px;
    `,
    )

    const cancelButton = document.createElement("button")
    cancelButton.textContent = cancelText
    cancelButton.setAttribute(
      "style",
      `
      background-color: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px 20px;
      cursor: pointer;
      margin: 5px;
    `,
    )

    // Add event listeners
    okButton.addEventListener("click", () => {
      document.body.removeChild(modalDiv)
      resolve(true)
    })

    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modalDiv)
      resolve(false)
    })

    // Assemble the modal
    buttonContainer.appendChild(okButton)
    buttonContainer.appendChild(cancelButton)
    modalContent.appendChild(modalTitle)
    modalContent.appendChild(modalMessage)
    modalContent.appendChild(buttonContainer)
    modalDiv.appendChild(modalContent)

    // Add to document
    document.body.appendChild(modalDiv)

    // Play sound
    playSound("bleep")
  })
}

// Custom prompt dialog with direct DOM manipulation
function createCustomPrompt(title, message) {
  return new Promise((resolve) => {
    // Create elements with inline styles
    const modalDiv = document.createElement("div")
    modalDiv.setAttribute(
      "style",
      `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    )

    const modalContent = document.createElement("div")
    modalContent.setAttribute(
      "style",
      `
      background-color: #111;
      color: #0f0;
      border: 2px solid #0f0;
      box-shadow: 0 0 20px #0f0;
      padding: 20px;
      width: 90%;
      max-width: 500px;
      text-align: center;
    `,
    )

    const modalTitle = document.createElement("h3")
    modalTitle.textContent = title
    modalTitle.setAttribute(
      "style",
      `
      color: #0f0;
      margin-bottom: 15px;
      text-shadow: 0 0 5px #0f0;
    `,
    )

    const modalMessage = document.createElement("p")
    modalMessage.textContent = message
    modalMessage.setAttribute(
      "style",
      `
      color: #0f0;
      margin-bottom: 20px;
      white-space: pre-line;
      text-align: left;
    `,
    )

    const inputField = document.createElement("input")
    inputField.type = "text"
    inputField.setAttribute(
      "style",
      `
      width: 100%;
      background-color: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px;
      margin-bottom: 20px;
      font-family: monospace;
      box-sizing: border-box;
    `,
    )

    const buttonContainer = document.createElement("div")
    buttonContainer.setAttribute(
      "style",
      `
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    `,
    )

    const okButton = document.createElement("button")
    okButton.textContent = "OK"
    okButton.setAttribute(
      "style",
      `
      background-color: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px 20px;
      cursor: pointer;
      margin: 5px;
    `,
    )

    const cancelButton = document.createElement("button")
    cancelButton.textContent = "Cancel"
    cancelButton.setAttribute(
      "style",
      `
      background-color: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px 20px;
      cursor: pointer;
      margin: 5px;
    `,
    )

    // Add event listeners
    okButton.addEventListener("click", () => {
      document.body.removeChild(modalDiv)
      resolve(inputField.value)
    })

    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modalDiv)
      resolve(null)
    })

    // Assemble the modal
    buttonContainer.appendChild(okButton)
    buttonContainer.appendChild(cancelButton)
    modalContent.appendChild(modalTitle)
    modalContent.appendChild(modalMessage)
    modalContent.appendChild(inputField)
    modalContent.appendChild(buttonContainer)
    modalDiv.appendChild(modalContent)

    // Add to document
    document.body.appendChild(modalDiv)

    // Focus the input field
    setTimeout(() => {
      inputField.focus()
    }, 100)

    // Play sound
    playSound("bleep")
  })
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
      // Create a completely new modal implementation specifically for this card
      const totalInventoryCount = countInventory()

      // Create elements with inline styles
      const modalDiv = document.createElement("div")
      modalDiv.setAttribute(
        "style",
        `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
      `,
      )

      const modalContent = document.createElement("div")
      modalContent.setAttribute(
        "style",
        `
        background-color: #111;
        color: #0f0;
        border: 2px solid #0f0;
        box-shadow: 0 0 20px #0f0;
        padding: 20px;
        width: 90%;
        max-width: 500px;
        text-align: center;
      `,
      )

      const modalTitle = document.createElement("h3")
      modalTitle.textContent = "RANSOM DEMAND"
      modalTitle.setAttribute(
        "style",
        `
        color: #0f0;
        margin-bottom: 15px;
        text-shadow: 0 0 5px #0f0;
      `,
      )

      const modalMessage = document.createElement("p")
      modalMessage.textContent = `You've got locked out. Pay up or lose your stash.

Your current BTC: ${btc}
Your current inventory: ${totalInventoryCount} items

Choose your response:`
      modalMessage.setAttribute(
        "style",
        `
        color: #0f0;
        margin-bottom: 20px;
        white-space: pre-line;
        text-align: left;
      `,
      )

      const buttonContainer = document.createElement("div")
      buttonContainer.setAttribute(
        "style",
        `
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      `,
      )

      const payButton = document.createElement("button")
      payButton.textContent = "Pay 30 BTC"
      payButton.setAttribute(
        "style",
        `
        background-color: #000;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 10px 20px;
        cursor: pointer;
        margin: 5px;
      `,
      )

      const loseButton = document.createElement("button")
      loseButton.textContent = `Lose Half Inventory (${Math.ceil(totalInventoryCount / 2)} items)`
      loseButton.setAttribute(
        "style",
        `
        background-color: #000;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 10px 20px;
        cursor: pointer;
        margin: 5px;
      `,
      )

      // Add event listeners
      payButton.addEventListener("click", () => {
        document.body.removeChild(modalDiv)
        // Pay 30 BTC
        btc = Math.max(0, btc - 30)
        const outcome = "Paid 30 BTC ransom"
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })

      loseButton.addEventListener("click", () => {
        document.body.removeChild(modalDiv)
        // Lose half inventory
        wipeHalfInventory()
        const outcome = "Lost half of your inventory"
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })

      // Assemble the modal
      buttonContainer.appendChild(payButton)
      buttonContainer.appendChild(loseButton)
      modalContent.appendChild(modalTitle)
      modalContent.appendChild(modalMessage)
      modalContent.appendChild(buttonContainer)
      modalDiv.appendChild(modalContent)

      // Add to document
      document.body.appendChild(modalDiv)

      // Play sound
      playSound("bleep")

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
      createCustomConfirm(
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
          // Note: We don't actually implement the "re-roll any 6s" mechanic here
          // as it would require tracking this state across rolls
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

    case "015": // BURNER ACCOUNT BLOWS UP
      createCustomConfirm(
        "BURNER ACCOUNT BLOWS UP",
        `Your fake identity account got exposed!

Your current BTC: ${btc}
Glock status: ${glock ? "Yes" : "No"}

Choose your response:`,
        glock ? "Lose Glock" : "Lose Glock (Not Available)",
        "Lose 10 BTC",
      ).then((result) => {
        let outcome = ""
        if (result && glock) {
          // Lose Glock
          glock = false
          outcome = "Lost Glock to cover your tracks"
        } else {
          // Lose 10 BTC
          btc = Math.max(0, btc - 10)
          outcome = "Lost 10 BTC"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

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
      createCustomConfirm(
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

    case "022": // SILK SECURITY PATCH
      ignoreNextNegative = true
      message = "You'll ignore the next negative Event card effect you draw"
      break

    case "023": // BABY MONITOR SPIKE
      btc = Math.max(0, btc - 10)
      message = "Pay 10 BTC to hush them up"
      break

    case "024": // NEWBIE FUMBLE
      btc = Math.max(0, btc - 20)
      message = "Pay 20 BTC in network insurance fees"
      break

    case "025": // SPEED BOOST
      // Select two random products to double price
      const availableItems = [...items]
      const doubledItems = []

      for (let i = 0; i < 2 && availableItems.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        const selectedItem = availableItems.splice(randomIndex, 1)[0]

        if (currentPrices[selectedItem]) {
          currentPrices[selectedItem] *= 2
          doubledItems.push(itemNames[selectedItem])
        }
      }

      updateMarketTable()
      message = `Doubled the price of: ${doubledItems.join(", ")}`
      break

    case "026": // BURNER PHONE BREAKDOWN
      blockBuying = true
      message = "Skip buying products this round"
      break

    case "027": // NEW ENCRYPTION STANDARD
      createCustomConfirm(
        "NEW ENCRYPTION STANDARD",
        `Encryption upgrades roll out. Safer... but slower.

Your current BTC: ${btc}

Choose your response:`,
        "Skip next buying/selling phase",
        "Lose 20 BTC immediately",
      ).then((result) => {
        let outcome = ""
        if (result) {
          // Skip next buying/selling phase
          blockBuying = true
          blockSelling = true
          outcome = "Skip buying/selling this round to upgrade safely"
          // Since no buying or selling is possible, highlight the advance button
          gameFlowState = "advanceCycle"
          updateGameFlowHighlight()
        } else {
          // Lose 20 BTC immediately
          btc = Math.max(0, btc - 20)
          outcome = "Lost 20 BTC by staying outdated"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "028": // PHISHING LINK
      btc = Math.max(0, btc - 30)
      message = "Lose 30 BTC"
      break

    case "029": // GOVERNMENT CONTRACT
      if (roll <= 2) {
        btc = Math.max(0, btc - 10)
        message = "No deal - lose 10 BTC"
      } else {
        btc += 50
        message = "Successful connection - gain 50 BTC"
      }
      break

    case "030": // FREE MARKET SURGE
      currentPrices = doublePrices()
      message = "All selling prices are doubled this round"
      break

    case "031": // SUDDEN SPIKE
      // Randomly pick one product type and double its price
      const randomItem = items[Math.floor(Math.random() * items.length)]
      if (currentPrices[randomItem]) {
        currentPrices[randomItem] *= 2
        updateMarketTable()
        message = `Doubled the price of ${itemNames[randomItem]}`
      } else {
        message = "No effect - market prices not set yet"
      }
      break

    case "032": // INSIDER SELL OUT
      const accountCount = (inventory.accounts || []).length
      createCustomConfirm(
        "INSIDER SELL OUT",
        `One of your contacts flips on you.

You currently have: ${accountCount} Hacked Accounts in inventory.
Your current BTC: ${btc}

Choose your response:`,
        "Pay 20 BTC",
        `Lose all ${accountCount} hacked accounts`,
      ).then((result) => {
        let outcome = ""
        if (result) {
          // Pay 20 BTC
          btc = Math.max(0, btc - 20)
          outcome = "Paid 20 BTC"
        } else {
          // Lose all hacked accounts
          inventory.accounts = []
          outcome = "Lost all hacked accounts in inventory"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + outcome
        updateStatusBars()
        updateInventoryDisplay()
        updateGameFlowHighlight()
      })
      return "Waiting for your decision..." // Temporary message until user decides

    case "033": // SICK DAY
      blockBuying = true
      blockSelling = true
      message = "Skip buying or selling this round"
      // Since no buying or selling is possible, highlight the advance button
      gameFlowState = "advanceCycle"
      updateGameFlowHighlight()
      break

    case "034": // NODE REBOOT REQUIRED
      blockBuying = true
      message = "Skip buying next round (sell only)"
      break

    case "035": // DARK MARKET PROMOTION
      btc += 10

      // Format current prices for display
      let pricesText = ""
      for (const item of items) {
        if (currentPrices[item]) {
          pricesText += `${itemNames[item]}: ${currentPrices[item]} BTC\n`
        }
      }

      // Let user pick one product to buy at half price
      createCustomPrompt(
        "DARK MARKET PROMOTION",
        `Your rep just leveled up. You've gained 10 BTC.
Choose one product to buy at half price this round:

CURRENT PRICES:
${pricesText || "No prices set yet. Roll market prices first."}
AVAILABLE CHOICES:
${items.map((i) => itemNames[i]).join(", ")}`,
      ).then((itemType) => {
        let result = ""
        if (itemType) {
          // Find matching item (case insensitive)
          const matchedItem = items.find(
            (i) => itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
          )

          if (matchedItem && currentPrices[matchedItem]) {
            const originalPrice = currentPrices[matchedItem]
            currentPrices[matchedItem] = Math.max(1, Math.floor(originalPrice / 2))
            updateMarketTable()
            result = `Gained 10 BTC and ${itemNames[matchedItem]} is half price this round`
          } else {
            result = "Gained 10 BTC (invalid item choice for discount)"
          }
        } else {
          result = "Gained 10 BTC (no item selected for discount)"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
        updateStatusBars()
      })
      return "Waiting for your item selection..." // Temporary message until user decides

    case "036": // DEEP WEB SWAP
      // Get current inventory to show in the prompt
      let currentInventoryText = ""
      for (const item of items) {
        const itemCount = (inventory[item] || []).length
        if (itemCount > 0) {
          currentInventoryText += `${itemNames[item]}: ${itemCount}\n`
        }
      }

      if (currentInventoryText === "") {
        // No inventory to trade
        message = "No items in inventory to trade"
        break
      }

      // Let user pick one product to trade
      createCustomPrompt(
        "DEEP WEB SWAP",
        `A secret meeting point opens up.
Choose one product from your inventory to trade:

YOUR CURRENT INVENTORY:
${currentInventoryText}
AVAILABLE CHOICES:
${items.map((i) => itemNames[i]).join(", ")}`,
      ).then((itemType) => {
        let result = ""
        if (itemType) {
          // Find matching item (case insensitive)
          const matchedItem = items.find(
            (i) => itemNames[i].toLowerCase() === itemType.toLowerCase() || i.toLowerCase() === itemType.toLowerCase(),
          )

          if (matchedItem && inventory[matchedItem] && inventory[matchedItem].length > 0) {
            // Remove one of the selected item
            inventory[matchedItem].pop()

            // Give a random item in return
            const randomItem = items[Math.floor(Math.random() * items.length)]
            if (!inventory[randomItem]) inventory[randomItem] = []
            inventory[randomItem].push(currentPrices[randomItem] || 5)

            result = `Traded 1 ${itemNames[matchedItem]} for 1 ${itemNames[randomItem]}`
          } else {
            result = "Trade failed - you don't have that item"
          }
        } else {
          result = "No item selected - no effect"
        }
        document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result
        updateInventoryDisplay()
        updateStatusBars()
      })
      return "Waiting for your item selection..." // Temporary message until user decides

    case "037": // GHOST WALLET FIND
      if (roll <= 3) {
        btc += 30
        message = "Gain 30 BTC"
      } else {
        btc += 50
        message = "Gain 50 BTC"
      }
      break

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
    createCustomPrompt(
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
  buyInput.value = maxBuy

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
  sellInput.value = count

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

// Sell everything in inventory
function sellEverything() {
  playSound("bleep")

  if (blockSelling) {
    log("-- Cannot sell due to event effect.")
    return
  }

  let totalSold = 0
  let btcEarned = 0

  for (const item of items) {
    if (item === bannedItem) continue

    const itemInventory = inventory[item] || []
    const count = itemInventory.length

    if (count > 0) {
      const price = currentPrices[item] || 1
      const earned = count * price

      btcEarned += earned
      totalSold += count

      log(`-- Sold ${count} ${itemNames[item]} for ${earned} BTC.`)
      inventory[item] = []
    }
  }

  // Update BTC after selling
  btc += btcEarned

  // Log summary
  if (totalSold > 0) {
    log(`-- Sold everything: ${totalSold} items for ${btcEarned} BTC.`)
  } else {
    log("-- No items to sell.")
  }

  updateStatusBars()
  updateInventoryDisplay()
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

  // Update button text based on cycle
  const advanceButton = document.getElementById("advanceCycleBtn")

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
    createCustomConfirm(
      "GAME OVER",
      `You've gone dark with your earnings.

Final score: ${btc} BTC with${glock ? "" : "out"} a Glock.${cashOutDetails}

Submit your score to the leaderboard?`,
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

  // Update button text for next cycle - FIXED: Only show "Cash Out" on cycle 10
  if (cycle === 10) {
    advanceButton.textContent = "Cash Out and Go Dark"
  } else {
    advanceButton.textContent = "Advance to Next Cycle"
  }

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

  // Update Liquid BTC display
  document.getElementById("liquidBtc").textContent = btc
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
      newPrices[item] = Math.max(1, Math.floor(currentPrices[item] / 2)) // Ensure price is at least 1
    }
  }

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

  return newPrices
}

// Generate a game verification hash
function generateGameHash() {
  const gameString = `btc:${btc},glock:${glock},cycle:${cycle},inventory:${JSON.stringify(inventory)},gameHistory:${JSON.stringify(gameHistory)}`
  let hash = 0,
    i,
    chr
  if (gameString.length === 0) return hash
  for (i = 0; i < gameString.length; i++) {
    chr = gameString.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

// Declare sellAllAtHalf function
function sellAllAtHalf() {
  if (blockSelling) {
    return "-- Cannot sell due to event effect."
  }

  let totalSold = 0
  let btcEarned = 0

  for (const item of items) {
    if (item === bannedItem) continue

    const itemInventory = inventory[item] || []
    const count = itemInventory.length

    if (count > 0) {
      const price = currentPrices[item] ? Math.floor(currentPrices[item] / 2) : 1 // Half price
      const earned = count * price

      btcEarned += earned
      totalSold += count

      log(`-- Sold ${count} ${itemNames[item]} at half price for ${earned} BTC.`)
      inventory[item] = []
    }
  }

  // Update BTC after selling
  btc += btcEarned

  // Log summary
  if (totalSold > 0) {
    log(`-- Sold everything at half price: ${totalSold} items for ${btcEarned} BTC.`)
  } else {
    log("-- No items to sell.")
  }

  updateStatusBars()
  updateInventoryDisplay()

  return `Sold ${totalSold} items at half price for ${btcEarned} BTC.`
}

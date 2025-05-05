// Silk Ave - Game Companion Script

document.addEventListener("DOMContentLoaded", () => {
  // Add CSS to ensure card result is always visible
  const style = document.createElement("style");
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
  `;
  document.head.appendChild(style);
});

// Game state variables
let btc = 100;
let glock = false;
let cycle = 1;
const inventory = {};
let currentPrices = {
  weed: 15,
  lsd: 75,
  coke: 150,
  shrooms: 30,
  molly: 60,
  ketamine: 100,
  opiates: 200,
  spice: 5,
};
let eventCode = "";
let isRollCard = false;
let blockBuying = false;
let blockSelling = false;
let bannedItem = null;
const inventoryLimit = 20;
const gameHistory = [];
let ignoreNextNegative = false; // For card 022 - Silk Security Patch
const sortMethod = "default"; // For inventory sorting

// Use the window object to access the modal functions
function showConfirm(title, message, okText = "OK", cancelText = "Cancel") {
  return window.showConfirm(title, message, okText, cancelText);
}

function showPrompt(title, message) {
  return window.showPrompt(title, message);
}

// Game flow state tracking
let gameFlowState = "enterEventCode";

// Function to handle event card logic
function applyEvent(eventCode) {
  const event = events[eventCode];
  if (!event) {
    showModal("Error", "Invalid event code.");
    return;
  }

  log(`Applying event: <span class="math-inline">\{event\.title\} \(</span>{eventCode})`);
  document.getElementById("eventCode").value = ""; // Clear the input field

  switch (event.effectType) {
    case "ROLL":
      isRollCard = true;
      displayRollModal(event);
      break;
    case "FORCED":
      isRollCard = false;
      handleForcedEvent(event);
      break;
    case "MARKET":
      isRollCard = false;
      log(`-- Market event: ${event.title}`);
      document.getElementById("marketDiceResult").textContent = event.effect;

      // Handle different MARKET events
      if (eventCode === "005") {
        // Market Crash - Halve prices
        for (const item in currentPrices) {
          currentPrices[item] = Math.max(1, Math.floor(currentPrices[item] / 2));
        }
        document.getElementById("cardDiceResult").textContent = "BTC value halves this round";
      } else if (eventCode === "025") {
        // Supply Chain Collapse - Double prices
        for (const item in currentPrices) {
          currentPrices[item] = Math.min(10000, Math.ceil(currentPrices[item] * 2)); //Added upper limit to prevent overflow
        }
        document.getElementById("cardDiceResult").textContent = "BTC value doubles this round";
      } else if (eventCode === "026") {
        // Product Ban - Ban one item
        const items = Object.keys(currentPrices);
        const bannedIndex = Math.floor(Math.random() * items.length);
        bannedItem = items[bannedIndex];
        document.getElementById("cardDiceResult").textContent = `${bannedItem.toUpperCase()} banned this round!`;
      }
      break;
    case "CHOICE":
      isRollCard = false;
      displayChoiceModal(event);
      break;
    default:
      log(`Unknown effect type: ${event.effectType}`);
  }
  updateUI();
  saveGameState();
}

// Function to handle roll results
function handleRollResult(event, roll) {
  const outcome = event.outcomes.find((o) => roll >= o.minRoll && roll <= o.maxRoll);
  if (outcome) {
    displayOutcomeModal(event.title, outcome.result);
    applyOutcomeEffect(outcome.effect);
  } else {
    displayOutcomeModal(event.title, "No outcome matched the roll.");
  }
}

// Function to apply the effects of an event
function applyOutcomeEffect(effect) {
  // Use regular expressions to extract effect type, amount, and item
  const regex = /(\w+)([+-])?(\d+)?\s?(.*)?/;
  const matches = effect.match(regex);

  if (!matches) {
    log(`Error: Could not parse effect string: ${effect}`);
    return;
  }

  const type = matches[1];
  const sign = matches[2]; // "+" or "-" (optional)
  const amount = matches[3] ? parseInt(matches[3], 10) : 0;
  const item = matches[4] ? matches[4].trim() : "";

  switch (type) {
    case "btc":
      if (sign === "-") {
        btc -= amount;
        log(`BTC decreased by ${amount}.`);
      } else {
        btc += amount;
        log(`BTC increased by ${amount}.`);
      }
      break;
    case "gain":
      inventory[item] = (inventory[item] || 0) + amount;
      log(`Gained ${amount} ${item}.`);
      break;
    case "lose":
      inventory[item] = Math.max(0, (inventory[item] || 0) - amount);
      log(`Lost ${amount} ${item}.`);
      break;
    case "glock":
      glock = sign === "+";
      log(glock ? "Glock acquired." : "Glock lost.");
      break;
    case "blockbuy":
      blockBuying = sign === "+";
      log(blockBuying ? "Buying blocked." : "Buying unblocked.");
      break;
    case "blocksell":
      blockSelling = sign === "+";
      log(blockSelling ? "Selling blocked." : "Selling unblocked.");
      break;
    case "ban":
      bannedItem = item;
      log(`${item} banned.`);
      break;
    case "unban":
      bannedItem = null;
      log("Ban lifted.");
      break;
    default:
      log(`Unknown outcome effect: ${effect}`);
  }
  updateUI();
  saveGameState();
}

// Function to handle forced events
function handleForcedEvent(event) {
  displayOutcomeModal(event.title, event.effect);
  applyOutcomeEffect(event.effect);
}

// Function to handle choice selections
function handleChoiceSelection(event, choiceIndex) {
  const choice = event.choices[choiceIndex];
  if (choice) {
    displayOutcomeModal(event.title, choice.result);
    applyOutcomeEffect(choice.effect);
  }
}

// Function to buy items
function buyItem(item, quantity) {
  quantity = parseInt(quantity);
  if (isNaN(quantity) || quantity <= 0) {
    showModal("Error", "Invalid quantity.");
    return;
  }
  if (blockBuying) {
    showModal("Notice", "Buying is currently blocked.");
    return;
  }
  if (bannedItem === item) {
    showModal("Notice", `${item} is currently banned.`);
    return;
  }
  const price = currentPrices[item];
  const cost = price * quantity;
  if (btc >= cost) {
    const currentInventory = Object.values(inventory).reduce((sum, q) => sum + q, 0);
    if (currentInventory + quantity <= inventoryLimit) {
      btc -= cost;
      inventory[item] = (inventory[item] || 0) + quantity;
      log(`Bought ${quantity} ${item} for ${cost} BTC.`);
      updateUI();
      saveGameState();
      document.getElementById(`buy-${item}-qty`).value = ""; // Clear input
    } else {
      showModal("Notice", "Inventory full (max 20 items).");
    }
  } else {
    showModal("Notice", "Not enough BTC.");
  }
}

// Function to sell items
function sellItem(item, quantity) {
  quantity = parseInt(quantity);
  if (isNaN(quantity) || quantity <= 0) {
    showModal("Error", "Invalid quantity.");
    return;
  }
  if (blockSelling) {
    showModal("Notice", "Selling is currently blocked.");
    return;
  }
  if (!inventory[item] || inventory[item] < quantity) {
    showModal("Notice", `Not enough ${item} to sell.`);
    return;
  }
  const price = currentPrices[item];
  const profit = price * quantity;
  btc += profit;
  inventory[item] -= quantity;
  if (inventory[item] === 0) {
    delete inventory[item];
  }
  log(`Sold ${quantity} ${item} for ${profit} BTC.`);
  updateUI();
  saveGameState();
  document.getElementById(`sell-${item}-qty`).value = ""; // Clear input
}

// Function to advance to the next cycle
function advanceCycle() {
  cycle++;
  if (cycle > 10) {
    endGame();
    return;
  }

  // Clear any existing card result
  document.getElementById("cardDiceResult").textContent = "";
  document.getElementById("marketDiceResult").textContent = "";

  // Reset burner deal
  document.getElementById("burnerDeal").value = "";

  // Re-enable the roll market button for the next cycle
  const rollMarketButton = document.getElementById("rollMarketBtn");
  if (rollMarketButton) {
    rollMarketButton.disabled = false;
    rollMarketButton.style.opacity = "1";
    rollMarketButton.style.cursor = "pointer";
  }

  log(`-- Advanced to Cycle ${cycle}/10`);
  updateStatusBars();

  // Reset game flow state
  gameFlowState = "enterEventCode";

  // Update the highlighted element
  updateGameFlowHighlight();

  // Update button text if this is the final cycle
  const advanceButton = document.getElementById("advanceCycleBtn");
  if (advanceButton) {
    if (cycle === 10) {
      advanceButton.textContent = "Cash Out and Go Dark";
    } else {
      advanceButton.textContent = "Advance to Next Cycle";
    }
  }

  // Robust scroll to top implementation
  scrollToTopFunc();
}

// Function to roll the dice
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// Function to update market prices
function updateMarketPrices() {
  const marketModifier = rollDice();
  document.getElementById("marketDiceResult").textContent = `Market Roll: ${marketModifier}`;
  for (const item in currentPrices) {
    const change = Math.floor(Math.random() * 11) - 5; // Random change between -5 and +5
    currentPrices[item] = Math.max(1, currentPrices[item] + change);
  }
  updateUI();
  saveGameState();
}

// Function to update the UI
function updateUI() {
  document.getElementById("btcBalance").textContent = btc;
  document.getElementById("cycleNumber").textContent = cycle;
  document.getElementById("inventoryDisplay").textContent =
    Object.entries(inventory)
      .map(([item, quantity]) => `${quantity} ${item}`)
      .join(", ") || "Empty";

  const marketTableBody = document.getElementById("marketPrices");
  marketTableBody.innerHTML = ""; // Clear existing rows
  for (const item in currentPrices) {
    const row = marketTableBody.insertRow();
    const itemCell = row.insertCell();
    const priceCell = row.insertCell();
    const buyCell = row.insertCell();
    const sellCell = row.insertCell();

    itemCell.textContent = item.toUpperCase();
    priceCell.textContent = currentPrices[item];

    const buyInput = document.createElement("input");
    buyInput.type = "number";
    buyInput.id = `buy-${item}-qty`;
    buyInput.min = "1";
    buyInput.value = "";
    const buyButton = document.createElement("button");
    buyButton.textContent = "Buy";
    buyButton.addEventListener("click", () => buyItem(item, buyInput.value));
    buyCell.appendChild(buyInput);
    buyCell.appendChild(buyButton);

    const sellInput = document.createElement("input");
    sellInput.type = "number";
    sellInput.id = `sell-${item}-qty`;
    sellInput.min = "1";
    sellInput.value = "";
    const sellButton = document.createElement("button");
    sellButton.textContent = "Sell";
    sellButton.addEventListener("click", () => sellItem(item, sellInput.value));
    sellCell.appendChild(sellInput);
    sellCell.appendChild(sellButton);
  }
  updateStatusBars();
}

// Function to update status bars (BTC and Inventory)
function updateStatusBars() {
  const btcBar = document.getElementById("btcBar");
  const invBar = document.getElementById("inventoryBar");

  const btcPercentage = Math.min(btc / 500, 1) * 100; // Assuming 500 is the max BTC for the bar
  const invPercentage = (Object.values(inventory).reduce((sum, q) => sum + q, 0) / inventoryLimit) * 100;

  btcBar.style.width = `${btcPercentage}%`;
  invBar.style.width = `${invPercentage}%`;
}

// Function to log messages to the game log
function log(message) {
  const logDiv = document.getElementById("gameLog");
  const newMessage = document.createElement("p");
  newMessage.textContent = `Cycle ${cycle}: ${message}`;
  logDiv.appendChild(newMessage);
  logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll to bottom
}

// Function to save the game state to localStorage
function saveGameState() {
  const gameState = {
    btc: btc,
    glock: glock,
    cycle: cycle,
    inventory: inventory,
    currentPrices: currentPrices,
    ignoreNextNegative: ignoreNextNegative,
  };
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

// Function to load the game state from localStorage
function loadGameState() {
  const savedState = localStorage.getItem("gameState");
  if (savedState) {
    const gameState = JSON.parse(savedState);
    btc = gameState.btc;
    glock = gameState.glock;
    cycle = gameState.cycle;
    inventory = gameState.inventory;
    currentPrices = gameState.currentPrices;
    ignoreNextNegative = gameState.ignoreNextNegative;
    log("Game state loaded.");
  } else {
    log("New game started.");
  }
  updateUI();
  updateStatusBars();
}

// Function to reset the game
function resetGame() {
  showConfirm("Reset Game", "Are you sure you want to reset the game?", "Yes, Reset", "Cancel").then((confirmed) => {
    if (confirmed) {
      localStorage.removeItem("gameState");
      btc = 100;
      glock = false;
      cycle = 1;
      inventory = {};
      currentPrices = {
        weed: 15,
        lsd: 75,
        coke: 150,
        shrooms: 30,
        molly: 60,
        ketamine: 100,
        opiates: 200,
        spice: 5,
      };
      eventCode
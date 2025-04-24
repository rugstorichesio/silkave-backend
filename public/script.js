// ==================== GLOBAL GAME STATE ====================
let btc = 100;
let glock = false;
let cycle = 1;
let inventory = {};
let currentPrices = {};
let eventCode = "";
let isRollCard = false;

const inventoryLimit = 20;
const items = ["lsd", "weed", "cocaine", "mdma", "passports", "accounts", "ccs", "files"];
const itemNames = {
  lsd: "LSD", weed: "Weed", cocaine: "Cocaine", mdma: "MDMA",
  passports: "Fake Passports", accounts: "Hacked Accounts",
  ccs: "Credit Cards", files: "Stolen Files"
};
const priceMatrix = {
  lsd: [1, 1, 2, 3, 4, 5], weed: [1, 2, 3, 3, 4, 5],
  cocaine: [4, 5, 6, 7, 8, 9], mdma: [3, 4, 5, 6, 7, 8],
  passports: [2, 3, 4, 5, 6, 7], accounts: [3, 4, 5, 6, 7, 8],
  ccs: [2, 3, 5, 6, 7, 9], files: [4, 5, 6, 7, 8, 10]
};

// ==================== CORE FUNCTIONS ====================
function applyEvent() {
  eventCode = document.getElementById("eventCode").value.trim();
  isRollCard = ["001","009","017","019","020","023","024","030","037"].includes(eventCode);
  document.querySelector("button[onclick='rollCardDice()']").style.display = isRollCard ? "inline-block" : "none";
  document.getElementById("cardDiceResult").textContent = "";
  log(`-- Event code ${eventCode} applied.`);
  if (!isRollCard) {
    const result = runCardEffect(eventCode, null);
    document.getElementById("cardDiceResult").textContent = "✓ Outcome: " + result;
  }
}

function rollCardDice() {
  if (!isRollCard || eventCode === "") return;
  const result = Math.ceil(Math.random() * 6);
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${result}`;
  const outcome = runCardEffect(eventCode, result);
  document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`;
}

function runCardEffect(code, roll) {
  let message = "";
  switch (code) {
    case "001":
      if (roll <= 2) { inventory = {}; btc -= 50; message = "Lose inventory + 50 BTC"; }
      else { btc -= 20; glock = false; message = "Lose 20 BTC + Glock"; }
      break;
    case "016":
      if (!glock) { glock = true; btc += 30; message = "Gain 30 BTC + Glock"; }
      else { btc += 40; message = "Already had Glock, gain 40 BTC"; }
      break;
    case "037":
      let rolled = items[(roll - 1) % items.length];
      if (getInventoryTotal() >= inventoryLimit) {
        let btcValue = currentPrices[rolled] * 2;
        btc += btcValue;
        message = `Inventory full — Convert to BTC: +${btcValue}`;
      } else {
        inventory[rolled] = inventory[rolled] || [];
        inventory[rolled].push(currentPrices[rolled]);
        inventory[rolled].push(currentPrices[rolled]);
        message = `Gain 2 free ${itemNames[rolled]}`;
      }
      break;
    default:
      message = "(Event logic not loaded)";
  }
  updateStatusBars();
  updateInventoryDisplay();
  return message;
}

// ==================== MARKET ====================
function rollMarket() {
  const roll = Math.floor(Math.random() * 6);
  document.getElementById("marketDiceResult").textContent = `🎲 Market Roll: ${roll + 1}`;
  currentPrices = {};
  const tbody = document.querySelector("#marketTable tbody");
  tbody.innerHTML = "";
  items.forEach(item => {
    const price = priceMatrix[item][roll];
    currentPrices[item] = price;
    tbody.innerHTML += `<tr><td>${itemNames[item]}</td><td>${price} BTC</td></tr>`;
  });
  populateTransactionTable();
}

function applyBurnerDeal() {
  const item = document.getElementById("burnerDeal").value;
  if (!item || !currentPrices[item]) return;
  currentPrices[item] = 1;
  updateMarketPricesDisplay();
  log(`-- Burner Deal: ${itemNames[item]} set to 1 BTC`);
}

function updateMarketPricesDisplay() {
  const tbody = document.querySelector("#marketTable tbody");
  tbody.innerHTML = "";
  items.forEach(item => {
    tbody.innerHTML += `<tr><td>${itemNames[item]}</td><td>${currentPrices[item]} BTC</td></tr>`;
  });
}

// ==================== INVENTORY / TRANSACTIONS ====================
function populateTransactionTable() {
  const tbody = document.querySelector("#transactionTable tbody");
  tbody.innerHTML = "";
  items.forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td>${itemNames[item]}</td>
        <td><input type="number" id="buy-${item}" min="0"></td>
        <td><input type="number" id="sell-${item}" min="0"></td>
      </tr>`;
  });
}

function executeTransactions() {
  let output = "";
  let totalInventory = getInventoryTotal();

  items.forEach(item => {
    const buyQty = parseInt(document.getElementById(`buy-${item}`).value) || 0;
    const sellQty = parseInt(document.getElementById(`sell-${item}`).value) || 0;

    if (buyQty > 0) {
      let cost = currentPrices[item] * buyQty;
      if (btc >= cost && totalInventory + buyQty <= inventoryLimit) {
        btc -= cost;
        inventory[item] = inventory[item] || [];
        for (let i = 0; i < buyQty; i++) inventory[item].push(currentPrices[item]);
        output += `>>> Bought ${buyQty} ${itemNames[item]} for ${cost} BTC (${currentPrices[item]} BTC each)\n`;
        totalInventory += buyQty;
      } else {
        output += `⛔ Cannot buy ${buyQty} ${itemNames[item]} (Insufficient BTC or space)\n`;
      }
    }

    if (sellQty > 0) {
      if (inventory[item]?.length >= sellQty) {
        let gain = currentPrices[item] * sellQty;
        btc += gain;
        inventory[item].splice(0, sellQty);
        output += `>>> Sold ${sellQty} ${itemNames[item]} for ${gain} BTC\n`;
        totalInventory -= sellQty;
      } else {
        output += `⛔ Cannot sell ${sellQty} ${itemNames[item]} (Not enough in inventory)\n`;
      }
    }
  });

  log(output.trim());
  updateStatusBars();
  updateInventoryDisplay();
  populateTransactionTable();
}

// ==================== SYSTEM ====================
function updateStatusBars() {
  document.getElementById("btc").textContent = btc;
  document.getElementById("btcBottom").textContent = btc;
  document.getElementById("glock").textContent = glock ? "Yes" : "No";
  document.getElementById("glockBottom").textContent = glock ? "Yes" : "No";
  const total = getInventoryTotal();
  document.getElementById("invCount").textContent = total;
  document.getElementById("invCountBottom").textContent = total;
  document.getElementById("cycle").textContent = cycle;
  document.getElementById("cycleBottom").textContent = cycle;
}

function updateInventoryDisplay() {
  const output = document.getElementById("inventoryStatus");
  let summary = "-- Inventory:\n";
  let total = 0;
  items.forEach(item => {
    if (inventory[item]?.length) {
      total += inventory[item].length;
      summary += `- ${itemNames[item]}: ${inventory[item].length}\n`;
    }
  });
  output.textContent = total === 0 ? "-- Inventory:\n- Empty" : summary.trim();
}

function buyGlock() {
  if (!glock && btc >= 20) {
    btc -= 20;
    glock = true;
    log(">>> Glock acquired (20 BTC deducted)");
    updateStatusBars();
  } else {
    log("⛔ Cannot buy Glock (already owned or not enough BTC)");
  }
}

function advanceCycle() {
  cycle++;
  inventory = inventory || {};
  log(`>>>>> Cycle ${cycle} Begins >>>>>`);
  updateStatusBars();
  updateInventoryDisplay();
  populateTransactionTable();
  document.getElementById("eventCode").value = "";
  document.getElementById("cardDiceResult").textContent = "";
  document.getElementById("marketDiceResult").textContent = "";
}

function log(msg) {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
}

function getInventoryTotal() {
  return Object.values(inventory).reduce((a, b) => a + (b?.length || 0), 0);
}

// ==================== EXPORT FUNCTIONS ====================
window.applyEvent = applyEvent;
window.rollCardDice = rollCardDice;
window.rollMarket = rollMarket;
window.applyBurnerDeal = applyBurnerDeal;
window.populateTransactionTable = populateTransactionTable;
window.updateStatusBars = updateStatusBars;
window.updateInventoryDisplay = updateInventoryDisplay;
window.executeTransactions = executeTransactions;
window.buyGlock = buyGlock;
window.advanceCycle = advanceCycle;
window.log = log;

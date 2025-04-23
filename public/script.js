
// ========== GAME STATE ==========
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

// ========== CORE LOGIC ==========
function applyEvent() {
  eventCode = document.getElementById("eventCode").value.trim();
  isRollCard = ["001", "009", "017", "019", "020", "021", "024", "030"].includes(eventCode);
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
    case "001": if (roll <= 2) { inventory = {}; btc -= 50; message = "-50 BTC, Inventory wiped"; } else { btc -= 20; glock = false; message = "-20 BTC, Lost Glock"; } break;
    case "002": btc -= 25; message = "-25 BTC (wallet drained)"; break;
    case "003": btc -= 10; message = "-10 BTC (ripped off)"; break;
    case "004": message = "No effect"; break;
    case "005": btc -= 15; message = "-15 BTC (firewall failure)"; break;
    case "006": btc -= 30; message = "-30 BTC (hit from unknown source)"; break;
    case "007": inventory = {}; message = "Inventory wiped (paper hands wrecked)"; break;
    case "008": btc -= 20; message = "-20 BTC (staked out drop)"; break;
    case "009": message = "Roll to bribe: 1–3 = lose 50 BTC, 4–6 = escape"; break;
    case "010": btc -= 15; message = "-15 BTC (data breach)"; break;
    case "011": message = "Gain 5 random items (auto-granted)"; break;
    case "012": btc += 60; message = "+60 BTC (billionaire pump)"; break;
    case "013": btc += 40; message = "+40 BTC (insider tip)"; break;
    case "014": btc += 50; message = "+50 BTC (dead man's switch)"; break;
    case "015": message = "Hold rare item? +25 BTC"; break;
    case "016": if (!glock) { glock = true; btc += 30; message = "Gain 30 BTC and 1 Glock"; } else { btc += 40; message = "Already had Glock. Gain 40 BTC total"; } break;
    default: message = "(Event logic not loaded)"; break;
  }
  updateStatusBars();
  updateInventoryDisplay();
  return message;
}

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

function updateStatusBars() {
  document.getElementById("btc").textContent = btc;
  document.getElementById("btcBottom").textContent = btc;
  document.getElementById("glock").textContent = glock ? "Yes" : "No";
  document.getElementById("glockBottom").textContent = glock ? "Yes" : "No";
  const total = Object.values(inventory).reduce((a, b) => a + (b?.length || 0), 0);
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

function log(msg) {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
}

// EXPORTS
window.applyEvent = applyEvent;
window.rollCardDice = rollCardDice;
window.rollMarket = rollMarket;
window.applyBurnerDeal = applyBurnerDeal;
window.populateTransactionTable = populateTransactionTable;
window.updateStatusBars = updateStatusBars;
window.updateInventoryDisplay = updateInventoryDisplay;
window.log = log;


// ================== INITIAL GAME STATE ==================
let btc = 100;
let glock = false;
let cycle = 1;
let inventory = {};
let currentPrices = {};
let burnerItem = "";
let eventCode = "";
let isRollCard = false;

const inventoryLimit = 20;
const maxCycles = 10;

const items = ["lsd", "weed", "cocaine", "mdma", "passports", "accounts", "ccs", "files"];
const itemNames = {
  lsd: "LSD",
  weed: "Weed",
  cocaine: "Cocaine",
  mdma: "MDMA",
  passports: "Fake Passports",
  accounts: "Hacked Accounts",
  ccs: "Credit Cards",
  files: "Stolen Files"
};
const priceMatrix = {
  lsd: [1, 1, 2, 3, 4, 5],
  weed: [1, 2, 3, 3, 4, 5],
  cocaine: [4, 5, 6, 7, 8, 9],
  mdma: [3, 4, 5, 6, 7, 8],
  passports: [2, 3, 4, 5, 6, 7],
  accounts: [3, 4, 5, 6, 7, 8],
  ccs: [2, 3, 5, 6, 7, 9],
  files: [4, 5, 6, 7, 8, 10]
};

// ================== EVENT SYSTEM ==================
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
    case "017": message = "Roll: 1–3 = +50 BTC, 4–6 = 10 free items"; break;
    case "018": message = "Burner deal activates — 1 item set to 1 BTC"; break;
    case "019": message = "Roll: 1–2 = +50 BTC, 3–6 = +10 BTC"; break;
    case "020": message = "Roll: Get Glock + interest or lose BTC"; break;
    case "021": message = "Option to sell all now or wait"; break;
    case "022": inventory = {}; message = "Inventory wiped — BTC keys only"; break;
    case "023": btc -= 20; message = "-20 BTC (blackmail)"; break;
    case "024": message = "Roll: Gain Glock and profit, or get scammed"; break;
    case "025": btc -= 40; message = "-40 BTC (market crash)"; break;
    case "026": btc += 100; message = "+100 BTC (contract win)"; break;
    case "027": inventory = {}; message = "Family relocation — inventory lost"; break;
    case "028": btc += 30; message = "+30 BTC (underground payout)"; break;
    case "029": btc -= 30; message = "-30 BTC (tool breakdown)"; break;
    case "030": message = "Roll: Mystery outcome"; break;
    default: message = "Unknown event code";
  }
  updateStatusBars();
  updateInventoryDisplay();
  return message;
}

// ================== MARKET ==================
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

// ================== OTHER CORE FUNCTIONS OMITTED FOR SIZE ==================
// Below are public bindings:

window.applyEvent = applyEvent;
window.rollMarket = rollMarket;
window.rollCardDice = rollCardDice;
window.applyBurnerDeal = applyBurnerDeal;
window.executeTransactions = executeTransactions;
window.buyGlock = buyGlock;
window.advanceCycle = advanceCycle;

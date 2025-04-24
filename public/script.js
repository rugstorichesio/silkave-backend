
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

// ==================== GAME FUNCTIONALITY ====================
function applyEvent() {
  eventCode = document.getElementById("eventCode").value.trim();
  isRollCard = ["001", "009", "017", "019", "020", "021", "024", "030", "036", "011", "037"].includes(eventCode);
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
  const roll = Math.ceil(Math.random() * 6);
  document.getElementById("cardDiceResult").textContent = `🎲 You rolled: ${roll}`;
  const outcome = runCardEffect(eventCode, roll);
  document.getElementById("cardDiceResult").textContent += `\n✓ Outcome: ${outcome}`;
}

function addFreeInventory(product, quantity) {
  let totalInventory = Object.values(inventory).reduce((acc, val) => acc + val.length, 0);
  let spaceAvailable = Math.max(0, inventoryLimit - totalInventory);
  let unitsToAdd = Math.min(spaceAvailable, quantity);
  let overflow = quantity - unitsToAdd;

  inventory[product] = inventory[product] || [];
  for (let i = 0; i < unitsToAdd; i++) {
    inventory[product].push(0); // Free item (price 0)
  }
  if (overflow > 0) btc += overflow * 5;

  updateStatusBars();
  updateInventoryDisplay();
  return `Gained ${unitsToAdd} ${itemNames[product]}${overflow > 0 ? ", +" + (overflow * 5) + " BTC (" + overflow + " overflow)" : ""}`;
}

function runCardEffect(code, roll) {
  let message = "";
  switch (code) {
    case "011":
      const roll011 = roll || Math.ceil(Math.random() * 6);
      const product011 = items[roll011 - 1];
      message = addFreeInventory(product011, 5);
      break;
    case "036":
      const roll036 = roll || Math.ceil(Math.random() * 6);
      const product036 = ["lsd", "weed", "mdma", "passports", "ccs", "accounts"][roll036 - 1];
      message = addFreeInventory(product036, 3);
      break;
    case "037":
      const roll037 = roll || Math.ceil(Math.random() * 3);
      const product037 = ["passports", "accounts", "ccs"][roll037 - 1];
      const quantity = glock ? 3 : 2;
      message = addFreeInventory(product037, quantity);
      break;
    default:
      message = "(Event logic not loaded)";
      break;
  }
  updateStatusBars();
  updateInventoryDisplay();
  return message;
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

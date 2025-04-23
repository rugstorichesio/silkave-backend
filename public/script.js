// Silk Ave Companion – Enhanced Script.js (v2)
// Includes: Glock logic fix, outcome summary display, roll button toggles

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

function applyEvent() {
  eventCode = document.getElementById("eventCode").value.trim();
  isRollCard = ["001", "002", "009", "017", "019", "020", "021", "022", "023", "024"].includes(eventCode);

  // Reset roll button state
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

  if (code === "001") {
    if (roll <= 2) {
      inventory = {};
      btc -= 50;
      message = "-50 BTC, Inventory wiped";
    } else {
      btc -= 20;
      glock = false;
      message = "-20 BTC, Lost Glock";
    }
  }

  if (code === "014") {
    btc += 50;
    message = "+50 BTC";
  }

  if (code === "016") {
    if (!glock) {
      glock = true;
      btc += 30;
      message = "Gain 30 BTC and 1 Glock";
    } else {
      btc += 40;
      message = "Already had Glock. Gain 40 BTC total";
    }
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

function executeTransactions() {
  let totalInv = Object.values(inventory).reduce((a, b) => a + b.length, 0);
  let out = "";
  items.forEach(item => {
    const buyQty = parseInt(document.getElementById(`buy-${item}`).value) || 0;
    const sellQty = parseInt(document.getElementById(`sell-${item}`).value) || 0;

    if (buyQty > 0) {
      const cost = buyQty * currentPrices[item];
      if (btc >= cost && totalInv + buyQty <= inventoryLimit) {
        btc -= cost;
        inventory[item] = inventory[item] || [];
        for (let i = 0; i < buyQty; i++) inventory[item].push(currentPrices[item]);
        totalInv += buyQty;
        out += `>>> Bought ${buyQty} ${itemNames[item]} @ ${currentPrices[item]} = ${cost} BTC\n`;
      } else {
        out += `⛔ Cannot buy ${itemNames[item]} (Limit/BTC)\n`;
      }
    }

    if (sellQty > 0 && inventory[item]?.length >= sellQty) {
      const gain = sellQty * currentPrices[item];
      btc += gain;
      inventory[item].splice(0, sellQty);
      totalInv -= sellQty;
      out += `>>> Sold ${sellQty} ${itemNames[item]} @ ${currentPrices[item]} = ${gain} BTC\n`;
    }
  });

  log(out.trim());
  updateStatusBars();
  updateInventoryDisplay();
  populateTransactionTable();
}

function buyGlock() {
  if (!glock && btc >= 20) {
    btc -= 20;
    glock = true;
    log(">>> Glock acquired for 20 BTC");
    updateStatusBars();
  } else {
    log("⛔ Can't buy Glock (already owned or not enough BTC)");
  }
}

function advanceCycle() {
  if (cycle >= maxCycles) {
    log("=== FINAL CYCLE: AUTO-SELLING ALL ITEMS ===");
    finalizeScore();
    return;
  }
  cycle++;
  log(`=== Cycle ${cycle} ===`);
  updateStatusBars();
}

function finalizeScore() {
  let totalGain = 0;
  items.forEach(item => {
    const qty = inventory[item]?.length || 0;
    if (qty > 0) {
      const payout = qty * (currentPrices[item] || 0);
      btc += payout;
      totalGain += payout;
      log(`>>> Auto-sold ${qty} ${itemNames[item]} for ${payout} BTC`);
    }
  });
  inventory = {};
  log(`=== FINAL BTC: ${btc} ===`);
  updateStatusBars();
  updateInventoryDisplay();
}

function updateStatusBars() {
  document.getElementById("btc").textContent = btc;
  document.getElementById("btcBottom").textContent = btc;
  document.getElementById("glock").textContent = glock ? "Yes" : "No";
  document.getElementById("glockBottom").textContent = glock ? "Yes" : "No";
  document.getElementById("cycle").textContent = cycle;
  document.getElementById("cycleBottom").textContent = cycle;
  const count = Object.values(inventory).reduce((a, b) => a + b.length, 0);
  document.getElementById("invCount").textContent = count;
  document.getElementById("invCountBottom").textContent = count;
}

function updateInventoryDisplay() {
  let out = "-- Inventory:\n";
  let total = 0;
  items.forEach(item => {
    if (inventory[item]?.length) {
      const count = inventory[item].length;
      total += count;
      const unique = [...new Set(inventory[item])];
      if (unique.length === 1) {
        out += `- ${itemNames[item]}: ${count} @ ${unique[0]} BTC\n`;
      } else {
        out += `- ${itemNames[item]}: ${count} (${inventory[item].join(", ")} BTC)\n`;
      }
    }
  });
  if (total === 0) out += "- Empty";
  document.getElementById("inventoryStatus").textContent = out;
}

function log(txt) {
  const logBox = document.getElementById("log");
  logBox.textContent += txt + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

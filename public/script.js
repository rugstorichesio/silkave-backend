// Silk Ave Companion: Full Game Logic with Hidden Card Text

let currentCardCode = null;
let marketPrices = {};
let burnerItem = null;

let player = {
  btc: 100,
  hasGlock: false,
  inventory: [],
  skipBuy: false,
  skipSell: false
};

// Load event from JSON and apply card logic
async function applyCard() {
  const code = document.getElementById('cardCode').value.trim();
  const res = await fetch('events.json');
  const data = await res.json();

  const event = data[code];
  if (!event) {
    document.getElementById('cardOutput').innerHTML = "Invalid card code.";
    return;
  }

  currentCardCode = code;
  document.getElementById('cardOutput').innerHTML = `Card ${code} applied.`;

  // Show roll button if effectType is ROLL
  document.getElementById('rollSection').style.display = event.effectType === "ROLL" ? "block" : "none";
  document.getElementById('rollResult').innerHTML = "";

  // Apply forced logic or pre-roll changes
  if (event.effectType !== "ROLL") {
    applyCardEffect(code, null);
  }
}

// Roll for ROLL-type card
function rollForCard() {
  const result = Math.ceil(Math.random() * 6);
  document.getElementById('rollResult').innerHTML = `<strong>You rolled a ${result}</strong>`;
  if (currentCardCode) applyCardEffect(currentCardCode, result);
}

// Roll market prices
function rollMarket() {
  marketPrices = {};
  const items = ["LSD", "Weed", "CCs", "Passports", "Fake Accounts", "Cocaine", "MDMA", "Files"];
  for (const item of items) {
    const base = Math.ceil(Math.random() * 6) * 5;
    marketPrices[item] = base;
  }
  displayMarket();
}

// Display current prices
function displayMarket() {
  const out = Object.entries(marketPrices)
    .map(([item, price]) => `<div>${item}: ${price} BTC</div>`)
    .join("");
  document.getElementById('marketOutput').innerHTML = out;
}

// Apply burner deal
function applyBurner() {
  burnerItem = document.getElementById('burnerSelect').value;
  if (burnerItem && marketPrices[burnerItem]) {
    marketPrices[burnerItem] = 1;
    displayMarket();
  }
}

// Apply card logic effects
function applyCardEffect(code, roll) {
  if (code === "001") {
    if (roll <= 2) {
      player.inventory = [];
      player.btc -= 50;
    } else {
      player.hasGlock = false;
      player.btc -= 20;
    }
  }

  // Add more card logic here...
  updateInventory();
}

// Inventory UI
function updateInventory() {
  const inv = player.inventory.map(item => {
    return `<div>${item.name}: ${item.qty} (Paid: ${item.paid} BTC)</div>`;
  }).join("");
  const glock = player.hasGlock ? "✔" : "✘";
  document.getElementById('inventory').innerHTML = inv || "No items yet.";
  document.getElementById('btcStatus').innerHTML = `BTC: ${player.btc} | Glock: ${glock}`;
}

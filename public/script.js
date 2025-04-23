let currentCardCode = null;

// Silk Ave Companion – Full Script for All 30 Cards

let player = {
  btc: 100,
  inventory: [
    { item: "LSD", quantity: 5, price: 10 },
    { item: "CCs", quantity: 3, price: 20 },
    { item: "Weed", quantity: 10, price: 5 },
    { item: "Passports", quantity: 2, price: 15 },
    { item: "Fake Accounts", quantity: 4, price: 12 }
  ],
  hasGlock: false,
  skipBuy: false,
  skipSell: false,
  priceMultiplier: 1,
  itemBan: null
};

async function loadEvent() {
  const code = document.getElementById('cardCode').value.trim();
  const response = await fetch('events.json');
  const data = await response.json();

  const event = data[code];
  const output = document.getElementById('eventDisplay');

  if (!event) {
    output.innerHTML = `<p>No event found for code ${code}.</p>`;
    return;
  }

  output.innerHTML = `
    <h2>${code} - ${event.title}</h2>
    <p><strong>Type:</strong> ${event.type}</p>
    <p><strong>Effect Type:</strong> ${event.effectType}</p>
    <p><strong>Effect:</strong><br>${event.effect.replace(/\n/g, "<br>")}</p>
    <p><em>${event.flavor}</em></p>
  `;

  applyCardEffect(code);
  updatePlayerDisplay();
}

function applyCardEffect(code) {
  const roll = () => Math.ceil(Math.random() * 6);

  const removeItems = (itemName) => {
    player.inventory = player.inventory.filter(i => i.item !== itemName);
  };

  const loseMostExpensiveItem = () => {
    let maxIndex = -1, maxValue = 0;
    player.inventory.forEach((item, i) => {
      const value = item.price * item.quantity;
      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    });
    if (maxIndex >= 0) player.inventory.splice(maxIndex, 1);
  };

  const loseHalfInventory = () => {
    const total = player.inventory.length;
    const toRemove = Math.floor(total / 2);
    player.inventory.splice(0, toRemove);
  };

  const addItems = (name, qty, price = 10) => {
    const found = player.inventory.find(i => i.item === name);
    if (found) found.quantity += qty;
    else player.inventory.push({ item: name, quantity: qty, price });
  };

  const randProduct = () => player.inventory.length > 0 ? player.inventory[Math.floor(Math.random() * player.inventory.length)].item : null;

  // 001 - FBI Sting
  if (code === "001") {
    if (roll() <= 2) {
      player.inventory = [];
      player.btc -= 50;
    } else {
      if (player.hasGlock) player.hasGlock = false;
      else player.btc -= 20;
    }
  }

  // 002 - Hacked!
  if (code === "002") {
    if (roll() <= 2) player.btc = Math.floor(player.btc * 0.75);
    else player.btc -= Math.floor((player.btc * 0.25) / 2);
  }

  // 003 - Rival Ripoff
  if (code === "003") {
    player.btc -= 10;
    loseMostExpensiveItem();
  }

  // 004 - Data Breach
  if (code === "004") {
    removeItems("Passports");
    removeItems("Fake Accounts");
  }

  // 005 - Burner Account Blows Up
  if (code === "005") {
    if (player.hasGlock) player.hasGlock = false;
    else player.btc -= 10;
  }

  // 006 - Street Raid
  if (code === "006") loseHalfInventory();

  // 007 - Crypto Crash
  if (code === "007") player.priceMultiplier = 0.5;

  // 008 - Compromised Drop Point
  if (code === "008") player.skipSell = true;

  // 009 - Shipping Intercepted
  if (code === "009") {
    if (roll() <= 3) player.inventory.splice(0, 3);
    else player.btc -= 25;
  }

  // 010 - Seized Server
  if (code === "010") player.skipBuy = true;

  // 011 - Found a Stash
  if (code === "011") {
    if (player.inventory.length >= 20) player.btc += 25;
    else addItems("Random Stash", 5, 10);
  }

  // 012 - Crypto Pump
  if (code === "012") player.priceMultiplier = 2;

  // 013 - Inside Connection
  if (code === "013") player.btc += 40;

  // 014 - Deadman's Switch
  if (code === "014") player.btc += 50;

  // 015 - Whale Buyout
  if (code === "015") player.priceMultiplier = 3;

  // 016 - Deep Web Payday
  if (code === "016") {
    player.btc += player.hasGlock ? 10 : 30;
    if (!player.hasGlock) player.hasGlock = true;
  }

  // 017 - Community Boost
  if (code === "017") {
    if (roll() <= 3) player.btc += 50;
    else if (player.inventory.length >= 20) player.btc += 25;
    else addItems("Boosted Goods", 10);
  }

  // 018 - Black Market Flash Sale
  if (code === "018") player.priceMultiplier = 1;

  // 019 - Bribe Your Way Out
  if (code === "019") {
    if (roll() <= 3) {
      loseHalfInventory();
      player.btc -= 20;
    }
  }

  // 020 - Government Deal
  if (code === "020") {
    if (roll() <= 2) player.btc -= 25;
    else player.btc += 50;
  }

  // 021 - Emergency Sale
  if (code === "021") {
    const panicSell = confirm("Do you want to sell all inventory at half price?");
    if (panicSell) {
      let total = 0;
      for (const item of player.inventory) total += item.price * item.quantity * 0.5;
      player.btc += Math.floor(total);
      player.inventory = [];
    } else {
      player.skipBuy = true;
    }
  }

  // 022 - Cut and Run
  if (code === "022") {
    const run = confirm("Do you want to dump inventory and gain 40 BTC?");
    if (run) {
      player.inventory = [];
      player.btc += 40;
    }
  }

  // 023 - Blackmail
  if (code === "023" && roll() <= 2) player.btc -= 40;

  // 024 - Rival’s Request
  if (code === "024") {
    player.btc -= 20;
    if (roll() <= 2) return; // ghosted
    player.btc += 20;
    if (!player.hasGlock) player.hasGlock = true;
    else player.btc += 10;
  }

  // 025 - Supply Chain Collapse
  if (code === "025") player.priceMultiplier = 2;

  // 026 - Product Ban
  if (code === "026") player.itemBan = randProduct();

  // 027 - Domestic Disruption
  if (code === "027") {
    player.skipBuy = true;
    player.skipSell = true;
  }

  // 028 - Family Emergency
  if (code === "028") {
    const skip = confirm("Skip turn instead of paying 30 BTC?");
    if (skip) {
      player.skipBuy = true;
      player.skipSell = true;
    } else {
      player.btc -= 30;
    }
  }
}

function updatePlayerDisplay() {
  const status = document.getElementById('playerStatus');
  const invList = player.inventory.map(i => `• ${i.quantity}x ${i.item} @ ${i.price} BTC`).join('<br>');
  const glockStatus = player.hasGlock ? "✔ Glock owned" : "✘ No Glock";
  status.innerHTML = `
    <h3>Player Status</h3>
    <p><strong>BTC:</strong> ${player.btc}</p>
    <p><strong>Inventory:</strong><br>${invList || "None"}</p>
    <p><strong>Glock:</strong> ${glockStatus}</p>
  `;
}

function rollForCard() {
  const result = Math.ceil(Math.random() * 6);
  document.getElementById('rollResult').innerHTML = `<strong>You rolled a ${result}</strong>`;
  if (currentCardCode) applyCardEffect(currentCardCode, result);
}

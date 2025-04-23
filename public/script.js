// ... earlier functions unchanged ...

function runCardEffect(code, roll) {
  let message = "";

  switch (code) {
    case "001":
      if (roll <= 2) {
        inventory = {};
        btc -= 50;
        message = "-50 BTC, Inventory wiped";
      } else {
        btc -= 20;
        glock = false;
        message = "-20 BTC, Lost Glock";
      }
      break;
    case "002":
      btc -= 25;
      message = "-25 BTC (wallet drained)";
      break;
    case "003":
      btc -= 10;
      message = "-10 BTC (ripped off)";
      break;
    case "004":
      message = "No effect";
      break;
    case "005":
      btc -= 15;
      message = "-15 BTC (firewall failure)";
      break;
    case "006":
      btc -= 30;
      message = "-30 BTC (hit from unknown source)";
      break;
    case "007":
      inventory = {};
      message = "Inventory wiped (paper hands wrecked)";
      break;
    case "008":
      btc -= 20;
      message = "-20 BTC (staked out drop)";
      break;
    case "009":
      message = "Roll to bribe: 1–3 = lose 50 BTC, 4–6 = escape";
      break;
    case "010":
      btc -= 15;
      message = "-15 BTC (data breach)";
      break;
    case "011":
      message = "Gain 5 random items (applied automatically)";
      break;
    case "012":
      btc += 60;
      message = "+60 BTC (billionaire pump)";
      break;
    case "013":
      btc += 40;
      message = "+40 BTC (insider tip)";
      break;
    case "014":
      btc += 50;
      message = "+50 BTC (friend vanished)";
      break;
    case "015":
      message = "Hold rare item? You gain +25 BTC";
      break;
    case "016":
      if (!glock) {
        glock = true;
        btc += 30;
        message = "Gain 30 BTC and 1 Glock";
      } else {
        btc += 40;
        message = "Already had Glock. Gain 40 BTC total";
      }
      break;
    case "017":
      message = "Roll: 1–3 = +50 BTC, 4–6 = free 10-unit product";
      break;
    case "018":
      message = "Burner deal doubles: one item set to 1 BTC";
      break;
    case "019":
      message = "Roll: 1–2 = +50 BTC, 3–6 = +10 BTC";
      break;
    case "020":
      message = "Roll: Bribe for Glock or lose 20 BTC";
      break;
    case "021":
      message = "Sell it all? Gain 30 BTC OR hold";
      break;
    case "022":
      inventory = {};
      message = "Inventory wiped (only BTC keys saved)";
      break;
    case "023":
      btc -= 20;
      message = "-20 BTC (blackmail)";
      break;
    case "024":
      message = "Roll: Gain Glock + interest, or lose 20 BTC";
      break;
    case "025":
      btc -= 40;
      message = "-40 BTC (market crash)";
      break;
    case "026":
      btc += 100;
      message = "+100 BTC (government contract)";
      break;
    case "027":
      inventory = {};
      message = "Had to move the family — inventory lost";
      break;
    case "028":
      btc += 30;
      message = "+30 BTC (underground bet paid off)";
      break;
    case "029":
      btc -= 30;
      message = "-30 BTC (tool malfunction)";
      break;
    case "030":
      message = "Roll: random event — +BTC or wipe";
      break;
    default:
      message = "Unknown card effect";
  }

  updateStatusBars();
  updateInventoryDisplay();
  return message;
}

// Core logic functions already defined above...

// Ensure UI functions are globally available for onclick handlers
window.applyEvent = applyEvent;
window.rollMarket = rollMarket;
window.rollCardDice = rollCardDice;
window.applyBurnerDeal = applyBurnerDeal;
window.executeTransactions = executeTransactions;
window.buyGlock = buyGlock;
window.advanceCycle = advanceCycle;
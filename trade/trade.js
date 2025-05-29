/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("sleep");
  ns.clearLog();

  const TICK_INTERVAL = 1000;
  const PROFIT_TARGET = 0.2; // 20% profit target
  const reserve = 1_000_000; // Reserve money not used for buying stocks

  // Create UI elements
  const win = ns.ui.createWindow("Stock Dashboard", 400, 600);
  const lblMoney = win.createLabel("");
  const lblReserve = win.createLabel("");
  const lblTradeCapital = win.createLabel("");
  const stocksLabel = win.createLabel("");
  const stockDetailsLabel = win.createLabel("");
  const btnAutoTrade = win.createButton("Auto Trade: ON");
  const btnReset = win.createButton("Reset Stats");

  // Canvas for graphs
  const canvas = win.createCanvas(380, 200);
  const ctx = canvas.getContext("2d");

  let autoTrade = true;
  let portfolioHistory = [];
  let reserveHistory = [];
  let selectedStock = null;

  // Tooltip data
  const tooltip = { text: "", x: 0, y: 0, visible: false };

  // Helper: format money with commas and decimals
  function formatMoney(value) {
    return "$" + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Helper: draw line graph on canvas
  function drawGraph(ctx, width, height, data, color, label) {
    if (data.length < 2) return [];

    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let points = [];
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * width;
      // Normalize y (invert because canvas y=0 top)
      const y = height - ((data[i] - minVal) / (maxVal - minVal)) * height;
      points.push({ x, y, value: data[i] });
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw label on top left corner
    ctx.fillStyle = color;
    ctx.font = "12px sans-serif";
    ctx.fillText(label, 5, 15);

    return points;
  }

  // Find closest point on graph to mouse x/y
  function findClosestPoint(points, mouseX, mouseY) {
    if (!points || points.length === 0) return null;
    let closest = null;
    let closestDist = Infinity;
    for (const pt of points) {
      const dx = pt.x - mouseX;
      const dy = pt.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pt;
      }
    }
    if (closestDist < 15) return closest;
    return null;
  }

  // Update UI
  async function updateUI() {
    const money = ns.getServerMoneyAvailable("home");
    const portfolioValue = ns.stock.getPortfolio().reduce((acc, p) => {
      const price = ns.stock.getPrice(p.sym);
      return acc + (p.shares * price);
    }, 0);
    const tradeCapital = money - reserve;

    portfolioHistory.push(portfolioValue);
    reserveHistory.push(money);

    lblMoney.text = `Money: ${formatMoney(money)}`;
    lblReserve.text = `Reserve: ${formatMoney(reserve)}`;
    lblTradeCapital.text = `Trade Capital: ${formatMoney(tradeCapital)}`;

    // List all stocks
    const symbols = ns.stock.getSymbols();
    const lines = symbols.map(sym => {
      const [shares, avgPrice] = ns.stock.getPosition(sym);
      return `${sym} - Shares: ${shares} @ Avg: ${formatMoney(avgPrice)}`;
    });
    stocksLabel.text = "Stocks:\n" + lines.join("\n");

    // Show selected stock details
    if (selectedStock) {
      const forecast = ns.stock.getForecast(selectedStock);
      const volatility = ns.stock.getVolatility(selectedStock);
      const askPrice = ns.stock.getAskPrice(selectedStock);
      const bidPrice = ns.stock.getBidPrice(selectedStock);
      const [shares, avgPrice] = ns.stock.getPosition(selectedStock);

      stockDetailsLabel.visible = true;
      stockDetailsLabel.text =
        `Details for ${selectedStock}:\n` +
        `Forecast: ${(forecast * 100).toFixed(2)}%\n` +
        `Volatility: ${(volatility * 100).toFixed(2)}%\n` +
        `Ask Price: ${formatMoney(askPrice)}\n` +
        `Bid Price: ${formatMoney(bidPrice)}\n` +
        `Shares Owned: ${shares}\n` +
        `Average Price: ${formatMoney(avgPrice)}`;
    } else {
      stockDetailsLabel.visible = false;
    }

    // Draw graphs
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Portfolio graph on top half
    const portPoints = drawGraph(ctx, canvas.width, canvas.height / 2 - 10, portfolioHistory, "#00ff00", "Portfolio Value");

    // Reserve graph on bottom half (scaled)
    const maxPort = Math.max(...portfolioHistory);
    const maxRes = Math.max(...reserveHistory);
    const maxVal = Math.max(maxPort, maxRes);
    const reserveScaled = reserveHistory.map(v => v * maxPort / maxRes);

    ctx.translate(0, canvas.height / 2 + 10);
    drawGraph(ctx, canvas.width, canvas.height / 2 - 10, reserveScaled, "#0099ff", "Reserve Funds (scaled)");
    ctx.resetTransform();

    // Tooltip on hover
    canvas.addEventListener("mousemove", (evt) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;
      const mouseY = evt.clientY - rect.top;

      const closestPt = findClosestPoint(portPoints, mouseX, mouseY);
      if (closestPt) {
        tooltip.text = `Value: ${formatMoney(closestPt.value)}`;
        tooltip.x = mouseX + 10;
        tooltip.y = mouseY - 20;
        tooltip.visible = true;
      } else {
        tooltip.visible = false;
      }
    });

    canvas.addEventListener("mouseleave", () => {
      tooltip.visible = false;
    });

    if (tooltip.visible) {
      ctx.fillStyle = "#222";
      ctx.fillRect(tooltip.x - 5, tooltip.y - 15, ctx.measureText(tooltip.text).width + 10, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(tooltip.text, tooltip.x, tooltip.y);
    }
  }

  // Trading logic: buy if forecast > 0.6, sell if forecast < 0.4 or profit target reached
  async function tradingLogic() {
    if (!autoTrade) return;

    const symbols = ns.stock.getSymbols();

    for (const sym of symbols) {
      const forecast = ns.stock.getForecast(sym);
      const maxShares = ns.stock.getMaxShares(sym);
      const askPrice = ns.stock.getAskPrice(sym);
      const bidPrice = ns.stock.getBidPrice(sym);
      const [shares, avgPrice] = ns.stock.getPosition(sym);

      if (forecast > 0.6 && shares === 0) {
        const money = ns.getServerMoneyAvailable("home");
        const maxAffordableShares = Math.floor((money - reserve) / askPrice);
        const sharesToBuy = Math.min(maxAffordableShares, maxShares);
        if (sharesToBuy > 0) {
          const success = ns.stock.buyStock(sym, sharesToBuy);
          if (success) ns.print(`Bought ${sharesToBuy} shares of ${sym} at ${askPrice.toFixed(2)}`);
        }
      } else if (shares > 0) {
        const profitRatio = (bidPrice - avgPrice) / avgPrice;
        if (forecast < 0.4 || profitRatio >= PROFIT_TARGET) {
          const success = ns.stock.sellStock(sym, shares);
          if (success) ns.print(`Sold ${shares} shares of ${sym} at ${bidPrice.toFixed(2)} profit ${(profitRatio*100).toFixed(1)}%`);
        }
      }
    }
  }

  // Button toggles
  btnAutoTrade.onClick(() => {
    autoTrade = !autoTrade;
    btnAutoTrade.text = autoTrade ? "Auto Trade: ON" : "Auto Trade: OFF";
  });

  btnReset.onClick(() => {
    portfolioHistory = [];
    reserveHistory = [];
    selectedStock = null;
    stockDetailsLabel.visible = false;
    ns.print("Stats reset");
  });

  // Stocks label click handler (simulate click on stock line)
  stocksLabel.onClick((mouseX, mouseY) => {
    const lineHeight = 14;
    const lines = stocksLabel.text.split("\n");
    const lineIndex = Math.floor(mouseY / lineHeight) - 1;
    const symbols = ns.stock.getSymbols();
    if (lineIndex >= 0 && lineIndex < symbols.length) {
      selectedStock = symbols[lineIndex];
    } else {
      selectedStock = null;
    }
  });

  // Initial button text
  btnAutoTrade.text = "Auto Trade: ON";

  // Main loop
  while (true) {
    await tradingLogic();
    await updateUI();
    await ns.sleep(TICK_INTERVAL);
  }
}

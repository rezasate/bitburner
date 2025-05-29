/** @param {NS} ns **/
export async function main(ns) {
    const PROFIT_TARGET = 0.2;    // Sell when profit is 20%+
    const TICK_INTERVAL = 6000;   // Run every 6 seconds

    ns.disableLog("ALL");

    while (true) {
        const symbols = ns.stock.getSymbols();

        // === SELL logic: unload bad or profitable positions ===
        for (const sym of symbols) {
            const forecast = ns.stock.getForecast(sym);
            const [longShares, longAvg] = ns.stock.getPosition(sym);
            const bidPrice = ns.stock.getBidPrice(sym);

            if (longShares > 0) {
                const profitRatio = (bidPrice - longAvg) / longAvg;

                if (forecast < 0.5 || profitRatio >= PROFIT_TARGET) {
                    const expectedRevenue = longShares * bidPrice;
                    const cost = longShares * longAvg;
                    const profit = expectedRevenue - cost;

                    ns.stock.sellStock(sym, longShares);
                    ns.tprint(`💰 Sold ${longShares} of ${sym} @ $${ns.nFormat(bidPrice, "0.00a")} | Profit: $${ns.nFormat(profit, "0.00a")}`);
                }
            }
        }

        // === BUY logic: aggressively invest in best forecasts ===
        let availableMoney = ns.getServerMoneyAvailable("home");

        // Filter symbols by forecast > 0.6 and sort descending
        const buyCandidates = symbols
            .map(sym => ({ sym, forecast: ns.stock.getForecast(sym), askPrice: ns.stock.getAskPrice(sym) }))
            .filter(s => s.forecast > 0.6)
            .sort((a, b) => b.forecast - a.forecast);

        for (const { sym, forecast, askPrice } of buyCandidates) {
            if (availableMoney < 1000) break;

            const maxShares = ns.stock.getMaxShares(sym);
            const [longShares] = ns.stock.getPosition(sym);

            let sharesToBuy = 0;

            // Try buying in 1000-share chunks up to the limit
            for (let s = 1000; s <= maxShares - longShares; s += 1000) {
                const cost = ns.stock.getPurchaseCost(sym, s, "Long");
                if (cost <= availableMoney) {
                    sharesToBuy = s;
                } else {
                    break;
                }
            }

            if (sharesToBuy > 0) {
                const bought = ns.stock.buyStock(sym, sharesToBuy);
                if (bought > 0) {
                    const cost = ns.stock.getPurchaseCost(sym, bought, "Long");
                    availableMoney -= cost;
                    ns.tprint(`📈 Bought ${bought} of ${sym} @ $${ns.nFormat(askPrice, "0.00a")} | Forecast: ${(forecast * 100).toFixed(1)}%`);
                }
            }
        }

        await ns.sleep(TICK_INTERVAL);
    }
}
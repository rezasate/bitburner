/** @param {NS} ns **/
export async function main(ns) {
    const RESERVE_FUNDS = 1e6; // Keep $1M in reserve
    const PROFIT_TARGET = 0.2; // 20% profit threshold
    const TICK_INTERVAL = 6000;

    ns.disableLog("ALL");

    while (true) {
        const symbols = ns.stock.getSymbols();

        for (const sym of symbols) {
            const forecast = ns.stock.getForecast(sym);
            const [longShares, longAvg, shortShares, shortAvg] = ns.stock.getPosition(sym);
            const bidPrice = ns.stock.getBidPrice(sym); // Price you can sell at
            const askPrice = ns.stock.getAskPrice(sym); // Price you can buy at
            const maxShares = ns.stock.getMaxShares(sym);

            // === BUY LONG ===
            if (forecast > 0.6 && longShares === 0 && shortShares === 0) {
                const availableFunds = ns.getServerMoneyAvailable("home") - RESERVE_FUNDS;

                let sharesToBuy = 0;
                for (let s = maxShares; s > 0; s -= 1000) {
                    const cost = ns.stock.getPurchaseCost(sym, s, "Long");
                    if (cost < availableFunds) {
                        sharesToBuy = s;
                        break;
                    }
                }

                if (sharesToBuy > 0) {
                    const bought = ns.stock.buyStock(sym, sharesToBuy);
                    if (bought > 0) {
                        ns.tprint(`📈 Bought ${bought} of ${sym} @ ask $${askPrice.toFixed(2)}`);
                    }
                }
            }

            // === SELL LONG ===
            if (longShares > 0) {
                const profitRatio = (bidPrice - longAvg) / longAvg;
                if (forecast < 0.5 || profitRatio >= PROFIT_TARGET) {
                    const revenue = ns.stock.sellStock(sym, longShares);
                    const profit = revenue - (longShares * longAvg);
                    ns.tprint(`💰 Sold LONG ${longShares} of ${sym} @ bid $${bidPrice.toFixed(2)} | Profit: $${profit.toFixed(0)}`);
                }
            }

            // === SHORT SELL ===
            if (forecast < 0.4 && longShares === 0 && shortShares === 0) {
                const availableFunds = ns.getServerMoneyAvailable("home") - RESERVE_FUNDS;

                let sharesToShort = 0;
                for (let s = maxShares; s > 0; s -= 1000) {
                    const cost = ns.stock.getPurchaseCost(sym, s, "Short");
                    if (cost < availableFunds) {
                        sharesToShort = s;
                        break;
                    }
                }

                if (sharesToShort > 0) {
                    const sold = ns.stock.sellShort(sym, sharesToShort);
                    if (sold > 0) {
                        ns.tprint(`📉 Shorted ${sold} of ${sym} @ bid $${bidPrice.toFixed(2)}`);
                    }
                }
            }

            // === COVER SHORT ===
            if (shortShares > 0) {
                const profitRatio = (shortAvg - askPrice) / shortAvg;
                if (forecast > 0.5 || profitRatio >= PROFIT_TARGET) {
                    const cost = ns.stock.buyShort(sym, shortShares);
                    const profit = (shortAvg * shortShares) - cost;
                    ns.tprint(`💰 Covered SHORT ${shortShares} of ${sym} @ ask $${askPrice.toFixed(2)} | Profit: $${profit.toFixed(0)}`);
                }
            }
        }

        await ns.sleep(TICK_INTERVAL);
    }
}
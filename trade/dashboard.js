/** @param {NS} ns **/
export async function main(ns) {
    const TICK_INTERVAL = 1000;
    ns.disableLog("ALL");
    ns.ui.openTail();

    const previousPositions = {};
    let realizedProfit = 0;

    function formatNumber(num, decimals = 0) {
        return num
            .toFixed(decimals)
            .replace(".", ",")
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function formatShares(num) {
        const abs = Math.abs(num);
        const sign = num < 0 ? "-" : "";
        let formatted;
        if (abs >= 1e12) {
            formatted = (abs / 1e12).toFixed(3).replace(".", ",") + " T";
        } else if (abs >= 1e9) {
            formatted = (abs / 1e9).toFixed(3).replace(".", ",") + " B";
        } else if (abs >= 1e6) {
            formatted = (abs / 1e6).toFixed(3).replace(".", ",") + " M";
        } else {
            formatted = formatNumber(abs, 0);
        }
        return sign + formatted;
    }

    function formatShort(num) {
        const abs = Math.abs(num);
        const sign = num < 0 ? "-" : "";
        let formatted;
        if (abs >= 1e12) {
            formatted = (abs / 1e12).toFixed(2).replace(".", ",") + " T";
        } else if (abs >= 1e9) {
            formatted = (abs / 1e9).toFixed(2).replace(".", ",") + " B";
        } else if (abs >= 1e6) {
            formatted = (abs / 1e6).toFixed(2).replace(".", ",") + " M";
        } else if (abs >= 1e3) {
            formatted = (abs / 1e3).toFixed(2).replace(".", ",") + " K";
        } else {
            formatted = formatNumber(abs, 2);
        }
        return sign + formatted;
    }

    while (true) {
        const symbols = ns.stock.getSymbols();
        const lines = [];
        let unrealizedProfit = 0;
        let totalStockValue = 0;

        const stockData = [];

        // Gather stock data
        for (const sym of symbols) {
            const [longShares, longAvg, shortShares, shortAvg] = ns.stock.getPosition(sym);

            let shares = 0;
            let avg = 0;
            let pos = "-";
            let sellPrice = 0;
            let profit = 0;
            let roi = 0;
            let assetValue = 0;
            let buyValue = 0;

            if (longShares > 0) {
                shares = longShares;
                avg = longAvg;
                pos = "LONG";
                sellPrice = ns.stock.getBidPrice(sym);
                profit = (sellPrice - avg) * shares;
                roi = ((sellPrice - avg) / avg) * 100;
                assetValue = sellPrice * shares;
                buyValue = avg * shares;
                unrealizedProfit += profit;
                totalStockValue += assetValue;
            } else if (shortShares > 0) {
                shares = shortShares;
                avg = shortAvg;
                pos = "SHORT";
                sellPrice = ns.stock.getAskPrice(sym);
                profit = (avg - sellPrice) * shares;
                roi = ((avg - sellPrice) / avg) * 100;
                assetValue = sellPrice * shares;
                buyValue = avg * shares;
                unrealizedProfit += profit;
                totalStockValue += assetValue;
            }

            if (!previousPositions[sym]) {
                previousPositions[sym] = { shares, avg, pos };
            } else {
                const prev = previousPositions[sym];
                if (prev.shares > 0 && shares === 0) {
                    if (prev.pos === "LONG") {
                        realizedProfit += (ns.stock.getBidPrice(sym) - prev.avg) * prev.shares;
                    } else if (prev.pos === "SHORT") {
                        realizedProfit += (prev.avg - ns.stock.getAskPrice(sym)) * prev.shares;
                    }
                }
                previousPositions[sym] = { shares, avg, pos };
            }

            if (shares > 0) {
                stockData.push({
                    sym,
                    shares,
                    avg,
                    sellPrice,
                    buyValue,
                    assetValue,
                    roi,
                    profit
                });
            }
        }

        // Header
        lines.push("=== 📊 STOCK TRADING DASHBOARD ===");
        lines.push("Sym    | Shares     | Buy Price | Sell Price  | Buy Value      | Asset Value    | ROI     | P/L         ");
        lines.push("-".repeat(108));

        // Draw table rows
        for (const data of stockData) {
            const {
                sym,
                shares,
                avg,
                sellPrice,
                buyValue,
                assetValue,
                roi,
                profit
            } = data;

            const profitColor = profit >= 0 ? "🟢" : "🔴";

            const line =
                `${sym.padEnd(6)} | ` +
                `${formatShares(shares).padStart(10)} | ` +
                `$${formatShort(avg, 0).padStart(8)} | ` +
                `$${formatShort(sellPrice, 0).padStart(10)} | ` +
                `$${formatShort(buyValue).padStart(13)} | ` +
                `$${formatShort(assetValue).padStart(13)} | ` +
                `${formatNumber(roi, 1).padStart(6)}% | ` +
                `${profitColor} $${formatShort(profit).padStart(11)}`;

            lines.push(line);
        }

        const lifetimeProfit = realizedProfit + unrealizedProfit;
        const cash = ns.getServerMoneyAvailable("home");
        const totalAssets = cash + totalStockValue;

        lines.push("-".repeat(108));
        lines.push(
            `💹Open P/L: $${formatShort(unrealizedProfit)}   |   ` +
            `💰Closed P/L: $${formatShort(realizedProfit)}   |   ` +
            `📈Lifetime P/L: $${formatShort(lifetimeProfit)}   |   ` +
            `Total Assets: $${formatShort(totalAssets)}`
        );

        ns.clearLog();
        ns.print(lines.join("\n"));
        await ns.sleep(TICK_INTERVAL);
    }
}
/** @param {NS} ns **/
export async function main(ns) {
    const dashboardName = "trade/dashboard.js";
    const autoTradeName = "trade/long.js";
    // you can add more const here

    // Kill scripts related to dashboard and auto trading
    const allScripts = ns.ps("home");
    for (const proc of allScripts) {
        const name = proc.filename.toLowerCase();
        if (name.includes(dashboardName) || name.includes(autoTradeName)) { // Add more name.includes(your const)
            ns.kill(proc.pid);
            ns.tprint(`🛑 Killed script: ${proc.filename}`);
        }
    }

    // Sell all positions
    const symbols = ns.stock.getSymbols();
    let soldAnything = false;

    for (const sym of symbols) {
        const [longShares, _longAvg, shortShares, _shortAvg] = ns.stock.getPosition(sym);

        if (longShares > 0) {
            const result = ns.stock.sellStock(sym, longShares);
            ns.tprint(`💰 Sold LONG ${longShares} shares of ${sym} @ $${result.toFixed(2)}`);
            soldAnything = true;
        }

        if (shortShares > 0) {
            const result = ns.stock.sellShort(sym, shortShares);
            ns.tprint(`💰 Covered SHORT ${shortShares} shares of ${sym} @ $${result.toFixed(2)}`);
            soldAnything = true;
        }
    }

    if (!soldAnything) {
        ns.tprint("✅ No stock positions to liquidate.");
    } else {
        ns.tprint("✅ All stock positions have been liquidated.");
    }
}

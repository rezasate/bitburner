/** @param {NS} ns **/
export async function main(ns) {
    if (ns.getHostname() !== "home") {
        ns.tprint("❌ This script must be run from home.");
        return;
    }

    const target = ns.args[0];
    if (typeof target !== "string" || !ns.serverExists(target)) {
        ns.tprint("Usage: run hack/hackfrompserv.js [valid-target-server-name]");
        return;
    }

    const scripts = ["/hack/weaken.js", "/hack/grow.js", "/hack/hack.js"];
    const hackScript = "/hack/hack.js";
    const growScript = "/hack/grow.js";
    const weakenScript = "/hack/weaken.js";

    const servers = ns.getPurchasedServers().filter(s => ns.hasRootAccess(s));
    const delayGap = 100; // Reduced for tighter concurrency
    const batchInterval = 200; // ms between stacked batches per server

    const player = ns.getPlayer();

    function getTargetStats() {
        const serverInfo = ns.getServer(target);
        return {
            weakenTime: ns.formulas.hacking.weakenTime(serverInfo, player),
            growTime: ns.formulas.hacking.growTime(serverInfo, player),
            hackTime: ns.formulas.hacking.hackTime(serverInfo, player),
            moneyMax: serverInfo.moneyMax,
            moneyAvailable: serverInfo.moneyAvailable,
            minSec: serverInfo.minDifficulty,
            currSec: serverInfo.hackDifficulty,
        };
    }

    function calcThreads(ns, targetStats, maxRam, scriptRam) {
        const moneyRatio = targetStats.moneyAvailable / targetStats.moneyMax;
        const secExcess = targetStats.currSec - targetStats.minSec;

        let hackThreads = Math.floor(ns.hackAnalyzeThreads(target, targetStats.moneyAvailable * 0.1));
        hackThreads = Math.max(1, hackThreads);
        let growThreads = Math.ceil(ns.growthAnalyze(target, targetStats.moneyMax / Math.max(targetStats.moneyAvailable, 1)));
        let weakenThreads = Math.ceil(secExcess / ns.weakenAnalyze(1));

        const totalRam = hackThreads * ns.getScriptRam(hackScript) +
                         growThreads * ns.getScriptRam(growScript) +
                         weakenThreads * ns.getScriptRam(weakenScript) * 2; // one weaken for grow, one for hack

        if (totalRam > maxRam) {
            const scale = maxRam / totalRam;
            hackThreads = Math.floor(hackThreads * scale);
            growThreads = Math.floor(growThreads * scale);
            weakenThreads = Math.floor(weakenThreads * scale);
        }

        return { hackThreads, growThreads, weakenThreads };
    }

    while (true) {
        const targetStats = getTargetStats();
        const { weakenTime, growTime, hackTime } = targetStats;
        const now = performance.now();
        const baseEnd = now + weakenTime + delayGap * 2; // End of weaken2

        for (let s = 0; s < servers.length; s++) {
            const server = servers[s];
            await ns.scp(scripts, server);
            ns.scriptKill(hackScript, server);
            ns.scriptKill(growScript, server);
            ns.scriptKill(weakenScript, server);

            const maxRam = ns.getServerMaxRam(server);
            const usedRam = ns.getServerUsedRam(server);
            const freeRam = maxRam - usedRam;

            const { hackThreads, growThreads, weakenThreads } = calcThreads(ns, targetStats, freeRam, 1);

            for (let b = 0; b < 2; b++) { // Support up to 2 stacked batches
                const offset = b * batchInterval;

                const weakenDelay1 = baseEnd - weakenTime - now + offset;
                const growDelay = baseEnd - growTime - now + delayGap + offset;
                const weakenDelay2 = baseEnd - weakenTime - now + delayGap * 2 + offset;
                const hackDelay = baseEnd - hackTime - now + delayGap * 3 + offset;

                if (weakenThreads > 0) {
                    ns.exec(weakenScript, server, weakenThreads, target, weakenDelay1);
                    ns.exec(weakenScript, server, weakenThreads, target, weakenDelay2);
                }
                if (growThreads > 0) ns.exec(growScript, server, growThreads, target, growDelay);
                if (hackThreads > 0) ns.exec(hackScript, server, hackThreads, target, hackDelay);

                //ns.tprintf("📦 Batch %d launched on %s | H:%d G:%d W:%d", b + 1, server, hackThreads, growThreads, weakenThreads);
            }
        }

        const nextCycle = weakenTime + delayGap * 4 + batchInterval * 2 + 100;
        await ns.sleep(nextCycle);
    }
}
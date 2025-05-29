/** @param {NS} ns **/
export async function main(ns) {
    if (ns.getHostname() !== "home") {
        ns.tprint("❌ This script must be run from home.");
        return;
    }

    const target = ns.args[0];
    if (!target) {
        ns.tprint("Usage: run hack/solo.js [target]");
        return;
    }

    const hackScript = "/hack/hack.js";
    const growScript = "/hack/grow.js";
    const weakenScript = "/hack/weaken.js";
    const scripts = [hackScript, growScript, weakenScript];

    const ramLimitPercent = 0.9;
    const delayGap = 200;
    const home = "home";

    const maxRam = ns.getServerMaxRam(home);
    const reservedRam = maxRam * (1 - ramLimitPercent);

    function getScriptRamMap() {
        return {
            hack: ns.getScriptRam(hackScript),
            grow: ns.getScriptRam(growScript),
            weaken: ns.getScriptRam(weakenScript),
        };
    }

    function getTimings(target) {
        const player = ns.getPlayer();
        const server = ns.getServer(target);
        return {
            hack: ns.formulas.hacking.hackTime(server, player),
            grow: ns.formulas.hacking.growTime(server, player),
            weaken: ns.formulas.hacking.weakenTime(server, player),
        };
    }

    function getTargetStats(target) {
        const server = ns.getServer(target);
        return {
            minSec: server.minDifficulty,
            currSec: server.hackDifficulty,
            maxMoney: server.moneyMax,
            currMoney: server.moneyAvailable,
        };
    }

    function scaleThreadsToFitRam(threads, ramMap, maxRam) {
        const totalRamNeeded = threads.hack * ramMap.hack + threads.grow * ramMap.grow + threads.weaken * ramMap.weaken;
        if (totalRamNeeded <= maxRam) return threads;
        const scale = maxRam / totalRamNeeded;
        return {
            hack: Math.max(1, Math.floor(threads.hack * scale)),
            grow: Math.max(1, Math.floor(threads.grow * scale)),
            weaken: Math.max(1, Math.floor(threads.weaken * scale)),
        };
    }

    let batchCounter = 0;
    const ramMap = getScriptRamMap();

    while (true) {
        const { hack, grow, weaken } = getTimings(target);
        const { currSec, minSec, currMoney, maxMoney } = getTargetStats(target);
        const now = performance.now();

        // Basic estimated needs
        let threads = {
            hack: Math.floor(ns.hackAnalyzeThreads(target, maxMoney * 0.1)) || 1,
            grow: Math.ceil(ns.growthAnalyze(target, maxMoney / Math.max(currMoney, 1))) || 1,
            weaken: Math.ceil((currSec - minSec) / ns.weakenAnalyze(1)) || 1,
        };

        const maxUsableRam = ns.getServerMaxRam(home) * ramLimitPercent - ns.getServerUsedRam(home);
        threads = scaleThreadsToFitRam(threads, ramMap, maxUsableRam);

        const batchRam = threads.hack * ramMap.hack + threads.grow * ramMap.grow + threads.weaken * ramMap.weaken;
        if (batchRam > maxUsableRam) {
            ns.printf("⚠️ Not enough RAM for batch %d. Needed: %.2fGB, Available: %.2fGB", batchCounter, batchRam, maxUsableRam);
            await ns.sleep(1000);
            continue;
        }

        const baseEnd = now + weaken + delayGap * 2;

        const delays = {
            weaken: baseEnd - weaken - now,
            grow: baseEnd - grow - now + delayGap,
            hack: baseEnd - hack - now + delayGap * 2,
        };

        // Launch all scripts
        const success =
            ns.exec(weakenScript, home, threads.weaken, target, Math.max(0, Math.floor(delays.weaken))) &&
            ns.exec(growScript, home, threads.grow, target, Math.max(0, Math.floor(delays.grow))) &&
            ns.exec(hackScript, home, threads.hack, target, Math.max(0, Math.floor(delays.hack)));

        if (success) {
            ns.printf("🚀 Launched batch %d: hack=%d, grow=%d, weaken=%d (RAM: %.2fGB)", batchCounter++, threads.hack, threads.grow, threads.weaken, batchRam);
        } else {
            ns.printf("❌ Failed to launch batch %d", batchCounter);
        }

        await ns.sleep(500);
    }
}
/** @param {NS} ns **/
export async function main(ns) {
    let target = ns.args[0];
    let moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    let securityThresh = ns.getServerMinSecurityLevel(target) + 5;
    let servers = [];
    let ramPerThread = ns.getScriptRam("/early/weaken.js");

    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");

    let serversToScan = ns.scan("home");
    while (serversToScan.length > 0) {
        let server = serversToScan.shift();
        if (!servers.includes(server) && server !== "home") {
            servers.push(server);
            serversToScan = serversToScan.concat(ns.scan(server));
            await ns.scp([
                "/early/weaken.js",
                "/early/grow.js",
                "/early/hack.js"
            ], server);

            let openPorts = 0;
            if (ns.fileExists("BruteSSH.exe")) {
                ns.brutessh(server);
                openPorts++;
            }
            if (ns.fileExists("FTPCrack.exe")) {
                ns.ftpcrack(server);
                openPorts++;
            }
            if (ns.fileExists("RelaySMTP.exe")) {
                ns.relaysmtp(server);
                openPorts++;
            }
            if (ns.fileExists("HTTPWorm.exe")) {
                ns.httpworm(server);
                openPorts++;
            }
            if (ns.fileExists("SQLInject.exe")) {
                ns.sqlinject(server);
                openPorts++;
            }
            if (ns.getServerNumPortsRequired(server) <= openPorts) {
                ns.nuke(server);
            }
        }
    }

    if (ns.hasRootAccess(target)) {
        while (true) {
            let sleepTime = 3000;
            for (let server of servers) {
                if (ns.hasRootAccess(server)) {
                    let ramAvailable = ns.getServerMaxRam(server)
                        - ns.getServerUsedRam(server);
                    let threads = Math.floor(ramAvailable / ramPerThread);

                    if (threads > 0) {
                        if (ns.getServerSecurityLevel(target) > securityThresh) {
                            sleepTime = ns.getWeakenTime(target)
                            ns.exec("/early/weaken.js", server, threads, target);
                        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
                            sleepTime = ns.getGrowTime(target)
                            ns.exec("/early/grow.js", server, threads, target);
                        } else {
                            sleepTime = ns.getHackTime(target)
                            ns.exec("/early/hack.js", server, threads, target);
                        }
                    }
                }
            }
            await ns.sleep(sleepTime + 100);
        }
    }
}
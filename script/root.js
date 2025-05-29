/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  // Tools in the order they unlock ports
  const tools = [
    { file: "BruteSSH.exe", func: ns.brutessh },
    { file: "FTPCrack.exe", func: ns.ftpcrack },
    { file: "relaySMTP.exe", func: ns.relaysmtp },
    { file: "HTTPWorm.exe", func: ns.httpworm },
    { file: "SQLInject.exe", func: ns.sqlinject }
  ];

  // Recursive scan
  function getAllServers(host = "home", discovered = new Set()) {
    discovered.add(host);
    for (const neighbor of ns.scan(host)) {
      if (!discovered.has(neighbor)) {
        getAllServers(neighbor, discovered);
      }
    }
    return Array.from(discovered);
  }

  const allServers = getAllServers()
    .filter(s => s !== "home" && !s.startsWith("pserv-"));

  for (const server of allServers) {
    try {
      // Open ports using available tools
      let openPorts = 0;
      for (const { file, func } of tools) {
        if (ns.fileExists(file, "home")) {
          func(server);
          openPorts++;
        }
      }

      // NUKE the server if enough ports are open
      if (!ns.hasRootAccess(server)) {
        const requiredPorts = ns.getServerNumPortsRequired(server);
        if (openPorts >= requiredPorts) {
          ns.nuke(server);
          ns.tprint(`✔ Rooted ${server}`);
        } else {
          ns.tprint(`✘ Not enough ports open for ${server}`);
          continue;
        }
      }
/*
      // Install backdoor if rooted
      if (ns.hasRootAccess(server) && !ns.getServer(server).backdoorInstalled) {
        await ns.singularity.connect(server);
        await ns.singularity.installBackdoor();
        ns.tprint(`🔑 Backdoor installed on ${server}`);
        await ns.singularity.connect("home");
      }
*/
    } catch (err) {
      ns.tprint(`⚠ Error on ${server}: ${err}`);
    }
  }

  ns.tprint("✅ Scan & root complete.");
}
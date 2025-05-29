/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("sleep");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("getServerMaxRam");

  const MAX_RAM = 262144;
  let ram = 8;
  let servers = ns.getPurchasedServers();

  while (ram <= MAX_RAM) {
    for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
      const name = "pserv-" + i;

      // Wait until enough money is available
      while (ns.getPurchasedServerCost(ram) > ns.getServerMoneyAvailable("home")) {
        await ns.sleep(3000);
      }

      if (servers.includes(name)) {
        if (ns.getServerMaxRam(name) < ram) {
          ns.killall(name);
          ns.deleteServer(name);
        } else {
          continue;
        }
      }

      ns.purchaseServer(name, ram);
    }

    ram *= 2;
    servers = ns.getPurchasedServers();
    await ns.sleep(1000);
  }

  ns.tprint("Reached max RAM limit of " + MAX_RAM + "GB. Stopping upgrades.");
}
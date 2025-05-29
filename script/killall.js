/** @param {NS} ns **/
export async function main(ns) {
    const servers = getAllServers(ns).filter(s => ns.hasRootAccess(s));

    for (const server of servers) {
        const scripts = ns.ps(server);
        if (scripts.length > 0) {
            ns.killall(server);
            ns.tprint(`🛑 Killed all scripts on ${server}`);
        }
    }

    ns.tprint("✅ All scripts stopped on all rooted servers.");
}

function getAllServers(ns) {
    const discovered = new Set(["home"]);
    const stack = ["home"];

    while (stack.length > 0) {
        const current = stack.pop();
        for (const neighbor of ns.scan(current)) {
            if (!discovered.has(neighbor)) {
                discovered.add(neighbor);
                stack.push(neighbor);
            }
        }
    }

    return [...discovered];
}
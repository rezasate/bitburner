/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("❌ Usage: run connect-to.js <target-server>");
        return;
    }

    const visited = new Set();
    const path = [];

    function dfs(current, trace) {
        if (current === target) {
            path.push(...trace, current);
            return true;
        }
        visited.add(current);
        for (const neighbor of ns.scan(current)) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor, [...trace, current])) return true;
            }
        }
        return false;
    }

    if (!dfs("home", [])) {
        ns.tprint(`❌ Could not find a path to ${target}`);
        return;
    }

    const connectCommand = path.map(p => `connect ${p}`).join("; ");
    ns.tprint(`🧭 Path to ${target}:`);
    ns.tprint(connectCommand);
}
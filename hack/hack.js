/** @param {NS} ns **/
export async function main(ns) {
    const [target, startTime = Date.now()] = ns.args;
    const delay = startTime - Date.now();
    if (delay > 0) await ns.sleep(delay);
    await ns.hack(target); // replace with grow() or weaken() accordingly
}
/** @param {NS} ns **/
export async function main(ns) {
    ns.run("early/root.js", 1)
    ns.run("script/purchase-servers.js", 1);
    ns.run("early/solo.js", 1, "n00dles");
    ns.run("early/deploy.js", 1, "joesguns");
}
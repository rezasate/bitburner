/** 
 * @param {NS} ns 
 **/
/*
Gets stats of each hacked server.
RAM: 2.55GB
*/

function formatNumber(num, decimals = 0) {
	return num
		.toFixed(decimals)
		.replace(".", ",")
		.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatShares(num) {
	const abs = Math.abs(num);
	const sign = num < 0 ? "-" : "";
	let formatted;
	if (abs >= 1e12) {
		formatted = (abs / 1e12).toFixed(3).replace(".", ",") + " T";
	} else if (abs >= 1e9) {
		formatted = (abs / 1e9).toFixed(3).replace(".", ",") + " B";
	} else if (abs >= 1e6) {
		formatted = (abs / 1e6).toFixed(3).replace(".", ",") + " M";
	} else {
		formatted = formatNumber(abs, 0);
	}
	return sign + formatted;
}

function formatShort(num) {
	const abs = Math.abs(num);
	const sign = num < 0 ? "-" : "";
	let formatted;
	if (abs >= 1e12) {
		formatted = (abs / 1e12).toFixed(2).replace(".", ",") + " T";
	} else if (abs >= 1e9) {
		formatted = (abs / 1e9).toFixed(2).replace(".", ",") + " B";
	} else if (abs >= 1e6) {
		formatted = (abs / 1e6).toFixed(2).replace(".", ",") + " M";
	} else if (abs >= 1e3) {
		formatted = (abs / 1e3).toFixed(2).replace(".", ",") + " K";
	} else {
		formatted = formatNumber(abs, 2);
	}
	return sign + formatted;
}

function get_all_servers(ns, all = false) {
	/*
	Scans and iterates through all servers.
	If all is false, only servers with root access and have money are returned.
	*/
	var servers = ["home"]
	var result = []

	var i = 0
	while (i < servers.length) {
		var server = servers[i]
		var s = ns.scan(server)
		for (var j in s) {
			var con = s[j]
			if (servers.indexOf(con) < 0) {
				servers.push(con)
				if (all || (ns.hasRootAccess(con) && parseInt(ns.getServerMaxMoney(con)) > 0)) {
					result.push(con)
				}
			}
		}
		i += 1
	}
	return result
}

function get_action(ns, host) {
	/*
	Gets the first action in the list and returns it.
	*/
	var actions = ns.ps(host)
	if (actions.length == 0) {
		return null
	}
	return actions[0].filename.replace("scripts/", "").replace(".js", "")
}

function pad_str(string, len) {
	/*
	Prepends the requested padding to the string.
	*/
	var pad = "                      "
	return String(pad + string).slice(-len)
}

function get_server_data(ns, server) {
	/*
	Creates the info text for each server. Currently gets money, security, and ram.
	NOTE: ns.getServer() can return a server object and obtain all of the necessary properties.
	However, ns.getServer() costs 2GB, which doubles the RAM requirement for this script.
	*/
	var moneyAvailable = ns.getServerMoneyAvailable(server)
	var moneyMax = ns.getServerMaxMoney(server)
	var securityLvl = ns.getServerSecurityLevel(server)
	var securityMin = ns.getServerMinSecurityLevel(server)
	var ram = ns.getServerMaxRam(server)
	var hackTime = ns.getHackTime(server)
	var weakTime = ns.getWeakenTime(server)
	var growTime = ns.getGrowTime(server)
	return ` h:${pad_str(parseInt(hackTime / 1000), 7)} | ` +
		` g:${pad_str(parseInt(growTime / 1000), 7)} | ` +
		` w:${pad_str(parseInt(weakTime / 1000), 7)} | ` +
		` m: ${formatShort(parseInt(moneyMax), 12)}\t\t| ` +
		`${pad_str(server, 17)}` +
		` RAM:${pad_str(parseInt(ram), 4)} | ` +
		` sec:${pad_str(securityMin, 2)}` +
		` Action:${pad_str(get_action(ns, server), 7)}`
}

function get_servers(ns) {
	/*
	Gets servers. If specific servers requested, then returns those only.
	Otherwise, scans and returns all servers.
	return: list of servers
	*/
	if (ns.args.length >= 1) {
		return ns.args
	} else {
		return get_all_servers(ns, false)
	}
}

export async function main(ns) {
	var servers = get_servers(ns)
	var stats = {}
	// For each server in servers, get the server data and add to our Hash Table.
	for (var server of servers) {
		stats[parseInt(ns.getServerMaxMoney(server))] = get_server_data(ns, server)
	}
	// Sort each server based on how much money it holds.
	var keys = Object.keys(stats)
	keys.sort((a, b) => a - b)
	// Print the results
	for (var i in keys) {
		var key = keys[i]
		ns.tprint(stats[key])
	}
}
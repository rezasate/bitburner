# Bitburner Script for Newbie (like me) Until Mid-game
Bitburner script up-to mid game. Last run on v.2.8.1 \
My strategy in mid-game: (preferable 64 GB ram available)
1. Run start.js after Augments, do crime, and wait few minutes until you can buy all programs, especially `Formulas.exe` (maybe a few more if you still in early).
2. Work for faction or company of your choose. I prefer that increase all stats.
3. After you buy all the programs, kill all script, then run `solo.js` and `hackfrompserv.js` from hack folder.
4. Run `long.js` from trade folder. Start upgrading your server if it cost less than 20% of your money, or up to you.
5. Do infiltrate to increase reputation fast. Don't buy upgrade yet.
6. If it's time to Augment, sell all your stocks, buy faction upgrade, home RAM / Core, whatever until you run out of money.
7. Augment, repeat until you buy all upgrade and eventually reach Bitnode.

## Early
1. <ins>deploy.js</ins> \
Basic from tutorial with some modifications from Suikoudan on Steam [Scripting 101](https://steamcommunity.com/sharedfiles/filedetails/?id=2717682356/). Exclude home, root all known and valid server, copy hack.js, grow.js, and weaken.js to the server, then run them in cycle. Use 5.00 GB of RAM Usage: `run early/deploy.js` from terminal.
2. <ins>solo.js</ins> \
Same basic like deploy.js, but only home server affected. Use 2.40 GB of RAM. Usage: `run early/solo.js` from terminal.
3. <ins>hack.js / grow.js / weaken.js</ins> \
Self explanatory. Basic script that deploy.js use. Use 1.70 GB of RAM.

## Hack
***This section require Formulas.exe installed***
1. <ins>solo.js</ins> \
My primary hacking script. Use 9.05 GB of RAM. It work wonderfully on low server as joesguns. Best fot grab starting capital for stock market. It will run hack, grow, weaken on batch that automatically calculate RAM, Threads, and timing precisely to execute. Usage: `run hack/solo.js joesguns` from terminal.
2. <ins>hackfrompserv.js</ins> \
My secondary hacking script. Use 11.45 GB of RAM. Need more workaround, I think it will not be as effectife as solo.js as long as you dont have singularity. I only use private own server, because other server RAM are not uniform, and I have a headache thinking of the solution. Usage: `run hack/hackfrompserv.js` from terminal, or use alias.
3. <ins> hack.js / grow.js / weaken.js</ins> \
Self explanatory. Basic script that solo.js and hackfrompserv.js use. Use 1.70 GB of RAM.

## Script
1. <ins>allserver.js</ins> \
I got this from @Tigenzero [get_stats.js](https://gist.github.com/Tigenzero/7a51a8c99379025198ac4346e8557ee6/), and modify the formatting for easy reading. It will scan all reachable server and print relevant stat H, G, W are Hack, Grow, and Weaken time respectively. Use 2.65 GB of RAM. Usage: `run script/allserver.js` from terminal.
2. <ins>analyze.js</ins> \
I got this from @hydroflame [analyze_server.js](https://github.com/bitburner-official/bitburner-scripts/blob/master/analyze_server.js/), without modification. It will scan and print relevant stat about current server. Useful to calculate threads needed in early game. Use 5.35 GB of RAM. Usage: `run script/analyze.js` from terminal.
3. <ins>connect.js</ins> \
I got this from someone on the web I'm sorry I forgot. If you read this please send me a message, or if you know who, please tell them, thank you. It will print the path to server targeted. Use 1.80 GB of RAM. Usage: `run script/connect.js run4theh111lz` from terminal.
4. <ins>drain.js</ins> \
Simple script from tutorial, just deleting the grow part. I create this to fulfill some achievement. Just use this with high thread until zero money. Use 2.35 GB of RAM. Usage: `run script/drain.js n00dles -t 2000` or whatever thread you able.
5. <ins>killall.js</ins> \
Script to kill all running script from all server. Use 2.55 GB of RAM. Usage: `run script/killall.js` from terminal.
6. <ins>purchase-servers.js</ins> \
Script to automatically purchase server up to 8 GB, 64 GB, 512 GB, 4 TB, 32 TB, 262 TB, 1 PB. Or you can modify it yourself to reach exabyte. Use 5.30 GB of RAM for the first, and 8.10 GB fot the rest. Usage: `run script/purchase-servers.js` from terminal.
7. <ins>root.js</ins> \
Root all server and has option to backdoor all of them if you have singularity. Use 2.35 GB of RAM, but if singularity included it will cost 68.35 GB of RAM. Usage: `run script/root.js` from terminal.
8. <ins>share.js</ins> \
Simple script to share leftover RAM to accelerate reputation gains. Usage: `run script/share.js` from terminal.

## Trade
***This section require WSE Account, TIX API Access, Market Data TIX API Access, and 4S Market Data Access.***
1. <ins>dashboard.js</ins> \
Script to monitor your asset. Easy to read and modify. Use 9.70 GB of RAM. Usage: `run trade/dashboard.js` from terminal. But it will automatically tail when you run long.js.
2. <ins>long.js</ins> \
Cream of the crop, money grubber script that makes you filthy rich using all your available pennies. Use 21.20 GB of RAM. Usage: `run trade/long.js` from terminal.
3. <ins>sell.js</ins> \
Kill all stock related script, and sell all your assets. Use 11.30 GB of RAM. Usage: `run trade/sell.js` from terminal.
4. <ins> short.js / trade.js</ins> \
Still on progress, update when I reach that point in game.

## About Bitburner
The game can be played at https://bitburner-official.github.io/ or installed through Steam.

// --- Contract giver NPC ---
var contractCoords = [
    {x: 2310, y: -30, z: 655},
    {x: 2380, y: 40, z: 1045},
    {x: 2471, y: 40, z: 1139}
    // add more as needed
];

// Different enemy types you can spawn (tab + name)
var enemyTypes = [
    {tab: 3, name: "Target"}, 
    {tab: 3, name: "TargetArcher"},
    {tab: 3, name: "TargetBrute"}
];

function interact(event) {
    var player = event.player;
    var pdata = player.getStoreddata();

    // initialize player contract data
    if (pdata.get("canDoContract") == null) {
        pdata.put("canDoContract", true);
        pdata.put("contractKillsLeft", 0);
        player.message("§aYou are now eligible for contracts.");
        return;
    }

    var canDo = pdata.get("canDoContract");
    if (canDo === true || canDo === "true") {
        // pick random location
        var idx = Math.floor(Math.random() * contractCoords.length);
        var coord = contractCoords[idx];

        // choose how many targets to spawn (random 2–4 for example)
        var numTargets = 1 //2 + Math.floor(Math.random() * 3);

        // spawn targets
        for (var i = 0; i < numTargets; i++) {
            var type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            event.npc.getWorld().spawnClone(coord.x, coord.y, coord.z, type.tab, type.name);
        }

        // save kill count needed
        pdata.put("contractKillsLeft", numTargets);

        // tell player
        event.npc.say("Here is your target's location, eliminate them: ("+coord.x+", "+coord.y+", "+coord.z+")");

        // lock until completed
        pdata.put("canDoContract", false);
    } else {
        var left = pdata.get("contractKillsLeft");
        if (left > 0) {
            player.message("§cYou already have an active contract. Finish it before taking another.");
        } 
    }
}

// --- Contract giver NPC ---
var contractCoords = [
    {x: 2493, y: 42, z: 866},
    {x: 2492, y: 42, z: 881},
];

// Different enemy types you can spawn (tab + name)
var enemyTypes = [
    {tab: 1, name: "B1"}, 
];

function interact(event) {
    var player = event.player;
    var pdata = player.getStoreddata();

    // --- Initialize player data if first time ---
    if (!pdata.has("canDoContract")) {
        pdata.put("canDoContract", 1); // eligible = 1, not eligible = 0
        pdata.put("contractKillsLeft", 0);
        player.message("§aYou are now eligible for contracts.");
        return;
    }

    var canDo = parseInt(pdata.get("canDoContract"));

    if (canDo === 1) {
        // pick random location
        var idx = Math.floor(Math.random() * contractCoords.length);
        var coord = contractCoords[idx];

        // choose how many targets to spawn (example: 2–4)
        var numTargets = 1; // change to 2 + Math.floor(Math.random() * 3) if you want variety

        // spawn targets
        for (var i = 0; i < numTargets; i++) {
            var type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            event.npc.getWorld().spawnClone(coord.x, coord.y, coord.z, type.tab, type.name);
        }

        // save kill count needed
        pdata.put("contractKillsLeft", numTargets);

        event.npc.say("§aHere is your target's location, eliminate them: §e(" + coord.x + ", " + coord.y + ", " + coord.z + ")§r");


        pdata.put("canDoContract", 0); // set to 0 = not eligible until finished
    } else {
        var left = parseInt(pdata.get("contractKillsLeft"));
        if (left > 0) {
            player.message("§cYou already have an active contract. Finish it before taking another.");
        }
    }
}

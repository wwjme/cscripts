// === Tour Guide NPC Script with Waypoints + Debug ===

// Track progress per player UUID
var tourProgress = {};
// Keep track of path progress per player
var pathProgress = {};

var tourStops = [
    { msg: "Are you ready for a tour?" }, 
    { msg: "Start with catching about 7 fishes. You'll need it to trade for some money." },
    { msg: "Let's now go to the second level.", path: [[2338, -48, 848],
     [2367, -41, 848], 
     [2388, -41, 785],
     [2462, -41, 842]
     ] },
    { msg: "Take the elevator to second level, I'll be waiting for you up there", coords: [2461, 47, 843], teleport: true },
    { msg: "Here at Owen's market you can trade fish for emeralds", coords: [2424, 42, 869] },
    { msg: "Now you can buy a gun and ammos to do some gigs", coords: [2435, 42, 880] },
    { msg: "Here you can get more info about Replicants hunting and rewards", path: [[2427, 42, 870],[2425, 42, 845]] },
    { msg: "In here is a drones shop, you can hire them to assist you with hunting replicants", coords: [2432, 42, 833] },
    { msg: "Over here is a money exchange", path: [[2421, 42, 834],[2428, 42, 815]] },
    { msg: "You can claim your apartment key here with the disc in your inventory, if there are no keys available, let the dev know and they will give you one in your inventory", coords: [2427, 42, 806] },
    { msg: "Over here is a cars shop", coords: [2427, 42, 806] },
    { msg: "You can also buy seeds and grow crops to make profits, Sobiezója also sell decorational items", path: [[2419, 42, 809],[2390, 42, 760]] },
    { msg: "Now we will go check out the delivery job", path: [[2426, 42, 859],[2503, 42, 843]] },
    
    { msg: "end", coords: [2434, 42, 878], teleport: true }
];

function interact(e) {
    var npc = e.npc;
    var player = e.player;
    var uuid = player.getUUID();

    if (!tourProgress[uuid]) {
        tourProgress[uuid] = 0;
        pathProgress[uuid] = 0;
    }

    var step = tourProgress[uuid];

    if (step < tourStops.length) {
        var stop = tourStops[step];
        npc.say(stop.msg);

        if (stop.coords || stop.path) {
            if (stop.teleport) {
                // Teleport instantly (single or last waypoint)
                var target = stop.coords ? stop.coords : stop.path[stop.path.length - 1];
                npc.setPosition(target[0], target[1], target[2]);
                npc.getWorld().broadcast("§b[TourGuide Debug] Teleported to " + target);
            } else if (stop.coords) {
                // Navigate to single coordinate
                npc.navigateTo(stop.coords[0], stop.coords[1], stop.coords[2], 8);
                npc.getWorld().broadcast("§b[TourGuide Debug] Navigating to " + stop.coords);
            } else if (stop.path) {
                // Start from first waypoint
                pathProgress[uuid] = 0;
                var wp = stop.path[pathProgress[uuid]];
                npc.navigateTo(wp[0], wp[1], wp[2], 8);
                npc.getWorld().broadcast("§b[TourGuide Debug] Starting path to waypoint 0 at " + wp);
            }
        }

        tourProgress[uuid] = step + 1;
    } else {
        npc.say("That's the end of the tour!");
        player.message("§a[Tour Guide] Thanks for joining the tour!");
    }
}

// Handle NPC movement per tick to continue along waypoints
function tick(e) {
    var npc = e.npc;

    for (var uuid in tourProgress) {
        var step = tourProgress[uuid] - 1; // current stop
        var stop = tourStops[step];
        if (!stop || !stop.path) continue;

        var currentWpIndex = pathProgress[uuid];
        if (currentWpIndex >= stop.path.length) continue;

        var wp = stop.path[currentWpIndex];

        // Compute distance manually
        var dx = npc.getX() - wp[0];
        var dy = npc.getY() - wp[1];
        var dz = npc.getZ() - wp[2];
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 2) { 
            // Reached waypoint → go to next
            pathProgress[uuid]++;
            if (pathProgress[uuid] < stop.path.length) {
                var nextWp = stop.path[pathProgress[uuid]];
                npc.navigateTo(nextWp[0], nextWp[1], nextWp[2], 8);
                npc.getWorld().broadcast("§b[TourGuide Debug] Reached waypoint " + (currentWpIndex) + ", moving to waypoint " + pathProgress[uuid] + " at " + nextWp);
            } else {
                npc.getWorld().broadcast("§b[TourGuide Debug] Finished all waypoints for this stop.");
            }
        } else {
            // If NPC is stuck (not navigating), retry navigation
            if (!npc.isNavigating()) {
                npc.navigateTo(wp[0], wp[1], wp[2], 8);
                npc.getWorld().broadcast("§c[TourGuide Debug] NPC stuck! Retrying waypoint " + currentWpIndex + " at " + wp);
            }
        }
    }
}

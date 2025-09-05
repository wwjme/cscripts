// === Tour Guide NPC Script with Waypoints + Movement Lock + Reset ===

// Track progress per player UUID
var tourProgress = {};
// Keep track of path progress per player
var pathProgress = {};
// Track if NPC is ready for next step per player
var readyForNext = {};

var tourStops = [
    { msg: "Are you ready for a tour?" }, 
    { msg: "Start with catching about 7 fishes. You'll need it to trade for some money." },
    { msg: "Let's now go to the second level.", path: [
        [2338, -48, 848],
        [2367, -41, 848], 
        [2388, -41, 785],
        [2462, -41, 842]
    ] },
    { msg: "Take the elevator to second level, I'll be waiting for you up there", coords: [2461, 47, 843], teleport: true },
    { msg: "Here at Owen's market you can trade fish for emeralds", path: [ [2429, 42, 861],[2424, 42, 869] ] },
    { msg: "Now you can buy a gun and ammos to do some gigs", coords: [2435, 42, 880] },
    { msg: "end", coords: [2325, -48, 855], teleport: true }
];

function interact(e) {
    var npc = e.npc;
    var player = e.player;
    var uuid = player.getUUID();

    if (!tourProgress[uuid]) {
        tourProgress[uuid] = 0;
        pathProgress[uuid] = 0;
        readyForNext[uuid] = true;
    }

    // Block interaction if NPC is still moving
    if (!readyForNext[uuid]) {
        player.message("§c[Tour Guide] Please wait, I'm still moving to the last location!");
        return;
    }

    var step = tourProgress[uuid];

    if (step < tourStops.length) {
        var stop = tourStops[step];
        npc.say(stop.msg);
        player.message("§e[Debug] Step " + step + ": " + stop.msg);

        if (stop.coords || stop.path) {
            if (stop.teleport) {
                // Teleport instantly
                var target = stop.coords ? stop.coords : stop.path[stop.path.length - 1];
                npc.setPosition(target[0], target[1], target[2]);
                player.message("§e[Debug] Teleported to " + target.join(", "));

                // If it's the last step, reset NPC
                if (step === tourStops.length - 1) {
                    npc.reset();
                    player.message("§a[Debug] NPC reset after finishing tour!");
                }

                readyForNext[uuid] = true; // instant → ready immediately
            } else if (stop.coords) {
                // Walk to location
                npc.navigateTo(stop.coords[0], stop.coords[1], stop.coords[2], 7);
                player.message("§e[Debug] Navigating to " + stop.coords.join(", "));
                readyForNext[uuid] = false;
            } else if (stop.path) {
                // Start path
                pathProgress[uuid] = 0;
                var wp = stop.path[pathProgress[uuid]];
                npc.navigateTo(wp[0], wp[1], wp[2], 7);
                player.message("§e[Debug] Starting path at " + wp.join(", "));
                readyForNext[uuid] = false;
            }
        }

        tourProgress[uuid] = step + 1;
    }
}

function tick(e) {
    var npc = e.npc;

    for (var uuid in tourProgress) {
        var step = tourProgress[uuid] - 1; // current stop
        var stop = tourStops[step];
        if (!stop) continue;

        // Handle waypoint paths
        if (stop.path) {
            var currentWpIndex = pathProgress[uuid];
            if (currentWpIndex >= stop.path.length) {
                // Finished all waypoints
                readyForNext[uuid] = true;
                continue;
            }

            var wp = stop.path[currentWpIndex];
            var dx = npc.getX() - wp[0];
            var dy = npc.getY() - wp[1];
            var dz = npc.getZ() - wp[2];
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 2) { 
                // Reached waypoint
                pathProgress[uuid]++;
                if (pathProgress[uuid] < stop.path.length) {
                    var nextWp = stop.path[pathProgress[uuid]];
                    npc.navigateTo(nextWp[0], nextWp[1], nextWp[2], 7);
                    npc.getWorld().broadcast("§e[Debug] Reached waypoint, moving to " + nextWp.join(", "));
                } else {
                    // All waypoints reached
                    readyForNext[uuid] = true;
                    npc.getWorld().broadcast("§a[Debug] Finished all waypoints for step " + step);
                }
            } else if (!npc.isNavigating()) {
                // Retry if stuck
                npc.navigateTo(wp[0], wp[1], wp[2], 7);
                npc.getWorld().broadcast("§c[Debug] NPC was stuck, retrying waypoint " + wp.join(", "));
            }
        }

        // Handle single coordinate stops
        if (stop.coords && !stop.path && !stop.teleport) {
            var dx2 = npc.getX() - stop.coords[0];
            var dy2 = npc.getY() - stop.coords[1];
            var dz2 = npc.getZ() - stop.coords[2];
            var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + dz2 * dz2);

            if (dist2 < 2) {
                readyForNext[uuid] = true;
                npc.getWorld().broadcast("§a[Debug] Arrived at coordinate stop " + stop.coords.join(", "));
            } else if (!npc.isNavigating()) {
                npc.navigateTo(stop.coords[0], stop.coords[1], stop.coords[2], 7);
                npc.getWorld().broadcast("§c[Debug] NPC was stuck, retrying coordinate " + stop.coords.join(", "));
            }
        }
    }
}

var flightTimerId = 20;
var step = 1.5;
var pitch, pl, rot;
var motionX = 0, motionY = 0, motionZ = 0;
var decay = 0.05;
var npcYaw = 0;

// Taxi route points (expand this list as needed)
var locations = [
    {x:2310, y:-30, z:655},
    {x:2380, y:40, z:1045},
    {x:2471, y:40, z:1139},
{ x: 2692, y: -15, z: 666 },
{ x: 2445, y: -52, z: 1352 },
{ x: 2672, y: -52, z: 1524 },
{ x: 2708, y: -52, z: 402 },
{ x: 2416, y: 54, z: -135 },
{ x: 2545, y: 53, z: -256 },
{ x: 2088, y: -52, z: -389 }

];

// Current trip state
var pickup = null;
var arrival = null;
var onPickup = true; // first step is pickup

function init(event) {
    event.npc.ai.stopOnInteract = false;
    event.npc.ai.returnsHome = false;
    npcYaw = event.npc.getRotation();
}

function assignNewTrip(npc) {
    // Pick two distinct random locations
    var i = Math.floor(Math.random() * locations.length);
    var j;
    do {
        j = Math.floor(Math.random() * locations.length);
    } while (j == i);

    pickup = locations[i];
    arrival = locations[j];
    onPickup = true;

npc.say("§aNew Pickup§r: ("+pickup.x+", "+pickup.y+", "+pickup.z+") " + "§aArrival§r: ("+arrival.x+", "+arrival.y+", "+arrival.z+")");

}

function interact(event) {
    event.npc.addRider(event.player);
    event.npc.getStoreddata().put("hadRider", 1);

    // Start control timer
    event.npc.timers.stop(flightTimerId);
    event.npc.timers.start(flightTimerId, 1, true);
    assignNewTrip(event.npc);
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
    var diff = ((b - a + 540) % 360) - 180;
    return (a + diff * t + 360) % 360;
}

function timer(event) {
    var npc = event.npc;
    var data = npc.getStoreddata();
    var hadRider = data.get("hadRider") == 1;

    if (event.id == flightTimerId) {
        var riders = npc.getRiders();
        var usingControl = false;

        if (riders.length > 0) {
            pl = riders[0];
            if (pl.mainhandItem && pl.mainhandItem.displayName == "Flight Control") {
                usingControl = true;

                pitch = Number(pl.getPitch().toFixed(2));
                rot = Number(pl.getRotation().toFixed(2));
                if (rot < 0) rot += 360;

                npcYaw = lerpAngle(npcYaw, rot, 0.2);
                npc.setRotation(npcYaw);

                var targetX = step * -Math.sin(toRadians(rot));
                var targetZ = step * Math.cos(toRadians(rot));
                var targetY = 0;

                if (pitch >= 20) targetY = -step;
                else if (pitch <= -20) targetY = step;

                motionX = lerp(motionX, targetX, 0.2);
                motionY = lerp(motionY, targetY, 0.2);
                motionZ = lerp(motionZ, targetZ, 0.2);
            }
        }

        if (!usingControl) {
            motionX = lerp(motionX, 0, decay);
            motionY = lerp(motionY, 0, decay);
            motionZ = lerp(motionZ, 0, decay);
        }

        npc.setMotionX(motionX);
        npc.setMotionY(motionY);
        npc.setMotionZ(motionZ);

        // Detect dismount
        if (hadRider && riders.length == 0) {
            npc.getWorld().spawnClone(2301, -48, 865, 6, "Whitecar");
            npc.despawn();
            return;
        }

        // === Trip progression ===
        if (riders.length > 0) {
            var target = onPickup ? pickup : arrival;
            if (isNear(npc, target, 6)) {
                if (onPickup) {
                    riders[0].message("§aPassenger picked up.");
                    onPickup = false;
                } else {
                    var dist = distance(pickup, arrival);
                    var reward = Math.floor(dist / 40); // adjust reward formula
                    riders[0].message("§aArrived! Distance: "+dist+" §ablocks. Reward: "+reward);
                    // Example: give reward item
                    riders[0].giveItem("minecraft:emerald", reward);

                    // Assign next trip
                    assignNewTrip(npc);
                }
            }
        }
    }
}

// === Helpers ===
function isNear(npc, pos, radius) {
    var dx = npc.getX() - pos.x;
    var dy = npc.getY() - pos.y;
    var dz = npc.getZ() - pos.z;
    return (dx*dx + dy*dy + dz*dz) <= radius*radius;
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

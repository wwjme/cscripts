var flightTimerId = 20;
var step = 0.6;
var pitch, pl, rot;
var motionX = 0, motionY = 0, motionZ = 0;
var decay = 0.05; // momentum decay
var npcYaw = 0;

function init(event) {
    event.npc.ai.stopOnInteract = false;
    event.npc.ai.returnsHome = false;
    npcYaw = event.npc.getRotation();
}

function interact(event) {
    event.npc.addRider(event.player);
    event.npc.timers.stop(flightTimerId);
    event.npc.timers.start(flightTimerId, 1, true);
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
    if (event.id != flightTimerId) return;

    var npc = event.npc;
    var riders = npc.getRiders();
    var usingControl = false;

    if (riders.length > 0) {
        pl = riders[0];
        if (pl.mainhandItem && pl.mainhandItem.displayName == "Flight Control") {
            usingControl = true;

            pitch = Number(pl.getPitch().toFixed(2));
            rot = Number(pl.getRotation().toFixed(2));
            if (rot < 0) rot += 360;

            // Smoothly rotate NPC toward player's yaw
            npcYaw = lerpAngle(npcYaw, rot, 0.2);
            npc.setRotation(npcYaw); // set yaw

            // Motion
            var targetX = step * -Math.sin(toRadians(rot));
            var targetZ = step * Math.cos(toRadians(rot));
            var targetY = 0;

            if (pitch >= 20) targetY = -step;     // look up -> move up
            else if (pitch <= -20) targetY = step; // look down -> move down

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
}

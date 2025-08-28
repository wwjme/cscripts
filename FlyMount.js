var flightTimerId = 20;
var step = 0.6; // increased speed (was 0.3)
var pitch, pl, rot;
var motionX = 0, motionY = 0, motionZ = 0;

function init(event) {
    event.npc.ai.stopOnInteract = false;
    event.npc.ai.returnsHome = false;
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

function timer(event) {
    if (event.id != flightTimerId) return;

    var npc = event.npc;
    var riders = npc.getRiders();
    if (riders.length == 0) {
        npc.setMotionX(0);
        npc.setMotionY(0);
        npc.setMotionZ(0);
        return;
    }

    pl = riders[0];
    if (!(pl.mainhandItem && pl.mainhandItem.displayName == "Flight Control")) {
        npc.setMotionX(0);
        npc.setMotionY(0);
        npc.setMotionZ(0);
        return;
    }

    pitch = Number(pl.getPitch().toFixed(2));
    rot = Number(pl.getRotation().toFixed(2));
    if (rot < 0) rot += 360;

    // Target motion
    var targetX = step * -Math.sin(toRadians(rot));
    var targetZ = step * Math.cos(toRadians(rot));
    var targetY = 0;

    if (pitch >= 20) targetY = -step;     // look up -> move up
    else if (pitch <= -20) targetY = step; // look down -> move down

    // Smooth interpolation (lerp) toward target motion
    var smoothFactor = 0.2; // keep smooth while faster
    motionX = lerp(motionX, targetX, smoothFactor);
    motionY = lerp(motionY, targetY, smoothFactor);
    motionZ = lerp(motionZ, targetZ, smoothFactor);

    npc.setMotionX(motionX);
    npc.setMotionY(motionY);
    npc.setMotionZ(motionZ);
}

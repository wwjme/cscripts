var flightTimerId = 20;
var ny, step, speed, pitch, pl, rot, xoff, zoff;

function init(event) {
    event.npc.ai.stopOnInteract = false;
    event.npc.ai.returnsHome = false;
    ny = 70;
}

function interact(event) {
    event.npc.addRider(event.player);
    event.npc.timers.stop(flightTimerId);
    event.npc.timers.start(flightTimerId, 1, true);
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function timer(event) {
    if (event.id == flightTimerId) {
        var npc = event.npc;
        var riders = npc.getRiders();
        if (riders.length > 0) {
            pl = riders[0];

            if (pl.mainhandItem && pl.mainhandItem.displayName == "Flight Control") {
                step = 0.3; // motion scale
                pitch = Number(pl.getPitch().toFixed(2));
                rot = Number(pl.getRotation().toFixed(2));
                if (rot < 0) { rot += 360; }

                // Calculate motion vectors
                var motionX = step * -Math.sin(toRadians(rot));
                var motionZ = step * Math.cos(toRadians(rot));
                var motionY = 0;

                // Adjust vertical motion based on pitch
                if (pitch >= 60) {
                    motionY = step; // go up
                } else if (pitch <= -45) {
                    motionY = -step; // go down
                }

                npc.setMotionX(motionX);
                npc.setMotionY(motionY);
                npc.setMotionZ(motionZ);
            } else {
                npc.setMotionX(0);
                npc.setMotionY(0);
                npc.setMotionZ(0);
            }
        } else {
            npc.setMotionX(0);
            npc.setMotionY(0);
            npc.setMotionZ(0);
        }
    }
}

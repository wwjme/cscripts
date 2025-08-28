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
        if (event.npc.getRiders().length != 0) {
            pl = event.npc.getRiders()[0];
            if (pl.mainhandItem && pl.mainhandItem.displayName == "Flight Control") {
                step = 5;
                speed = 4;
                pitch = Number(pl.getPitch().toFixed(2));

                if (pitch >= 60) {
                    ny--;
                    step = 1;
                    speed = 2;
                }
                if (pitch <= -45) {
                    ny++;
                    step = 1;
                    speed = 2;
                }

                rot = Number(pl.getRotation().toFixed(2));
                if (rot < 0) { rot = 360 + rot; }

                xoff = step * Number(Math.sin(toRadians(rot)).toFixed(2)) * -1;
                zoff = step * Number(Math.cos(toRadians(rot)).toFixed(2));

                event.npc.navigateTo(event.npc.x + xoff, ny, event.npc.z + zoff, speed);
            } else {
                event.npc.clearNavigation();
            }
        } else {
            event.npc.clearNavigation();
        }
    } else {
        event.npc.clearNavigation();
        ny = 70;
        event.npc.timers.stop(flightTimerId);
    }
}

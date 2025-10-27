var laneOffset = 15;
var speed = 20;               // navigateTo speed (keeps rotation/navigation behavior)
var motionSpeed = 0.45;       // speed used for npc.setMotionX/Y/Z (adjustable)
var rotateTicksThreshold = 2; // ticks to wait after navigateTo before switching to setMotion
var checkInterval = 1;
var arriveRange = 2;

var junctions = [
    {x: 59, y: -54, z: 2},
    {x: 59, y: -54, z: -76},
    {x: -5, y: -54, z: 3},
    {x: -5, y: -54, z: -76},
    {x: -37, y: -54, z: -76},
    {x: -44, y: -52, z: 3},
    {x: -44, y: -53, z: 32},
    {x: -4, y: -53, z: 33},
    {x: 59, y: -53, z: 33}
];

var trafficMap = {};
var cornerNames = ["NE","NW","SW","SE"];
var currentTarget = null;
var lastJunction = null;
var tickCounter = 0;
var uturnQueue = [];
var firstArrivalDone = false;

var HALF_LANE = laneOffset / 2;
var AXIS_TOLERANCE = Math.max(6, laneOffset * 0.8);

var CORNER_DIRS = {
    "NE": ["north","west"],
    "NW": ["west","south"],
    "SW": ["south","east"],
    "SE": ["east","north"]
};

var TARGET_CORNERS = {
    "NE_north": "SE", "NE_west": "NE",
    "NW_west": "NE", "NW_south": "NW",
    "SW_south": "NW", "SW_east": "SW",
    "SE_east": "SW", "SE_north": "SE"
};

var ENTRY_CORNERS = {
    "north": "SE", "south": "NW", "east": "SW", "west": "NE"
};

// --- Motion state ---
var motionMode = "none"; // "none" | "navigate_then_motion" | "setmotion"
var navigateTicks = 0;   // counter used when in navigate_then_motion

function init(event) {
    var npc = event.npc;
    npc.ai.stopOnInteract = false;
    npc.ai.returnsHome = false;
    npc.getAi().setNavigationType(1);
    npc.getAi().setMovingType(0);

    buildTrafficMap();

    var spawnPos = npc.getPos();
    var nearest = findNearestJunction(spawnPos);
    var startCorner = cornerNames[Math.floor(Math.random() * 4)];
    currentTarget = getPoint(nearest, startCorner, "out");
    lastJunction = nearest;
    goToTarget(npc, currentTarget);
}

function buildTrafficMap() {
    var len = junctions.length;
    for (var i = 0; i < len; i++) {
        var j = junctions[i];
        trafficMap[i] = {
            "NE": {out: createPoint(j, "NE", "out", j.x+HALF_LANE, j.z-HALF_LANE),
                   in:  createPoint(j, "NE", "in",  j.x+HALF_LANE, j.z-HALF_LANE)},
            "NW": {out: createPoint(j, "NW", "out", j.x-HALF_LANE, j.z-HALF_LANE),
                   in:  createPoint(j, "NW", "in",  j.x-HALF_LANE, j.z-HALF_LANE)},
            "SW": {out: createPoint(j, "SW", "out", j.x-HALF_LANE, j.z+HALF_LANE),
                   in:  createPoint(j, "SW", "in",  j.x-HALF_LANE, j.z+HALF_LANE)},
            "SE": {out: createPoint(j, "SE", "out", j.x+HALF_LANE, j.z+HALF_LANE),
                   in:  createPoint(j, "SE", "in",  j.x+HALF_LANE, j.z+HALF_LANE)}
        };
    }
}

function createPoint(junction, corner, type, x, z) {
    return {corner: corner, type: type, x: x, y: junction.y, z: z, parent: junction};
}

function tick(event) {
    if (++tickCounter % checkInterval !== 0) return;

    var npc = event.npc;
    if (!currentTarget) return;

    var pos = npc.getPos();

    // If we are in "navigate_then_motion" mode, count ticks and switch after threshold
    if (motionMode === "navigate_then_motion") {
        navigateTicks++;
        if (navigateTicks >= rotateTicksThreshold) {
            // cancel path navigation (if possible) and switch to setMotion
            try { npc.getAi().stopNavigation(); } catch (e) {}
            switchToSetMotion(npc, currentTarget);
        }
    }

    // If using setMotion, but we've arrived, stop motion and handle arrival
    if (motionMode === "setmotion") {
        if (getDist2D(pos, currentTarget) <= arriveRange) {
            // stop motion
            npc.setMotionX(0);
            npc.setMotionY(0);
            npc.setMotionZ(0);
            motionMode = "none";
            handleArrival(npc);
            return;
        } else {
            // keep setMotion along heading (no need to reissue each tick; but recalc to correct small drift)
            updateSetMotionDirection(npc, currentTarget);
            return;
        }
    }

    // Default behavior: not in setMotion; rely on navigation system & arrival checks
    if (getDist2D(pos, currentTarget) <= arriveRange) {
        // reached by navigateTo
        handleArrival(npc);
    } else {
        if (!npc.isNavigating() && motionMode !== "navigate_then_motion") {
            // fall back to navigation if nothing is moving the NPC
            goToTarget(npc, currentTarget);
        }
    }
}

function handleArrival(npc) {
    if (uturnQueue.length > 0) {
        currentTarget = uturnQueue.shift();
        goToTarget(npc, currentTarget);
        return;
    }
    var type = currentTarget.type;
    var junc = currentTarget.parent;
    var corner = currentTarget.corner;
    if (type === "out") {
        currentTarget = getPoint(junc, corner, "in");
        goToTarget(npc, currentTarget);
        return;
    }
    var options = getLegalMoves(junc, corner);
    if (firstArrivalDone) options.push({dir: "uturn", isUturn: true, j: junc, corner: corner});
    if (options.length === 0) return;
    var choice = options[Math.floor(Math.random() * options.length)];
    if (choice.isUturn) {
        prepareUturn(npc, junc, corner);
        if (uturnQueue.length > 0) {
            currentTarget = uturnQueue.shift();
            goToTarget(npc, currentTarget);
        }
    } else {
        lastJunction = junc;
        currentTarget = choice.out;
        goToTarget(npc, currentTarget);
    }
    firstArrivalDone = true;
}

function getLegalMoves(junc, corner) {
    var moves = [];
    var dirs = CORNER_DIRS[corner];
    for (var i = 0; i < 2; i++) {
        var dir = dirs[i];
        var nb = findNeighbourByAxis(junc, dir);
        if (!nb) continue;
        var tgtCorner = TARGET_CORNERS[corner + "_" + dir];
        var outPt = getPoint(nb, tgtCorner, "out");
        if (outPt) moves.push({dir: dir, out: outPt, corner: tgtCorner, j: nb, isUturn: false});
    }
    return moves;
}

function prepareUturn(npc, junction, startCorner) {
    uturnQueue = [];
    var idx = cornerNames.indexOf(startCorner);
    if (idx < 0) return;
    for (var i = 1; i <= 2; i++) {
        var nextCorner = cornerNames[(idx + i) % 4];
        var outPt = getPoint(junction, nextCorner, "out");
        if (outPt) uturnQueue.push(outPt);
    }
    if (lastJunction && lastJunction !== junction) {
        var dir = getDirectionToNeighbour(junction, lastJunction);
        if (dir) {
            var returnCorner = ENTRY_CORNERS[dir];
            var outPt = getPoint(lastJunction, returnCorner, "out");
            if (outPt) uturnQueue.push(outPt);
        }
    }
}

// --- NEW goToTarget that triggers rotate-then-motion behavior ---
function goToTarget(npc, target) {
    if (!target) return;
    // stop any setMotion immediately
    try {
        npc.setMotionX(0);
        npc.setMotionY(0);
        npc.setMotionZ(0);
    } catch (e) {}
    // use navigateTo to rotate properly first
    try {
        npc.navigateTo(target.x, target.y, target.z, speed);
    } catch (e) {}
    motionMode = "navigate_then_motion";
    navigateTicks = 0;
    // debug
    try { npc.say("navigateTo -> rotating to corner " + target.corner + " at (" + target.parent.x + "," + target.parent.z + ")"); } catch (e) {}
}

// --- switch from navigate to setMotion (called after rotateTicksThreshold) ---
function switchToSetMotion(npc, target) {
    if (!target) return;
    // compute horizontal direction vector
    var pos = npc.getPos();
    var dx = target.x - pos.x;
    var dz = target.z - pos.z;
    var dist = Math.sqrt(dx*dx + dz*dz);
    if (dist === 0) {
        // nothing to do
        motionMode = "none";
        return;
    }
    var mx = (dx / dist) * motionSpeed;
    var mz = (dz / dist) * motionSpeed;
    try {
        npc.setMotionX(mx);
        npc.setMotionY(0);
        npc.setMotionZ(mz);
    } catch (e) {}
    motionMode = "setmotion";
    try { npc.say("Switching to setMotion speed=" + motionSpeed.toFixed(3)); } catch (e) {}
}

// --- recalc setMotion direction (small corrections while moving) ---
function updateSetMotionDirection(npc, target) {
    var pos = npc.getPos();
    var dx = target.x - pos.x;
    var dz = target.z - pos.z;
    var dist = Math.sqrt(dx*dx + dz*dz);
    if (dist === 0) return;
    var mx = (dx / dist) * motionSpeed;
    var mz = (dz / dist) * motionSpeed;
    try {
        npc.setMotionX(mx);
        npc.setMotionZ(mz);
    } catch (e) {}
}

function getPoint(junction, corner, type) {
    var idx = junctions.indexOf(junction);
    return trafficMap[idx][corner][type];
}

function findNeighbourByAxis(origin, dir) {
    var best = null;
    var bestDist = Infinity;
    var len = junctions.length;
    for (var i = 0; i < len; i++) {
        var j = junctions[i];
        if (j === origin) continue;
        var dx = j.x - origin.x;
        var dz = j.z - origin.z;
        var ok = false;
        switch(dir) {
            case "north": ok = (Math.abs(dx) <= AXIS_TOLERANCE && dz < 0); break;
            case "south": ok = (Math.abs(dx) <= AXIS_TOLERANCE && dz > 0); break;
            case "east":  ok = (Math.abs(dz) <= AXIS_TOLERANCE && dx > 0); break;
            case "west":  ok = (Math.abs(dz) <= AXIS_TOLERANCE && dx < 0); break;
        }
        if (!ok) continue;
        var dist = dx * dx + dz * dz;
        if (dist < bestDist) {
            best = j;
            bestDist = dist;
        }
    }
    return best;
}

function getDirectionToNeighbour(origin, target) {
    var dx = target.x - origin.x;
    var dz = target.z - origin.z;
    var adx = Math.abs(dx);
    var adz = Math.abs(dz);
    if (adx <= AXIS_TOLERANCE && dz < 0) return "north";
    if (adx <= AXIS_TOLERANCE && dz > 0) return "south";
    if (adz <= AXIS_TOLERANCE && dx > 0) return "east";
    if (adz <= AXIS_TOLERANCE && dx < 0) return "west";
    return null;
}

function getDist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function findNearestJunction(pos) {
    var best = null;
    var bestDist = Infinity;
    var len = junctions.length;
    for (var i = 0; i < len; i++) {
        var j = junctions[i];
        var dx = pos.x - j.x;
        var dz = pos.z - j.z;
        var dist = dx * dx + dz * dz;
        if (dist < bestDist) {
            best = j;
            bestDist = dist;
        }
    }
    return best;
}

function goToTargetDirect(npc, target) {
    if (!target) return;
    try { npc.navigateTo(target.x, target.y, target.z, speed); } catch (e) {}
}

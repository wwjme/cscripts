var RANGE = 100;
var lastOwnerAttackTime = 0;
var currentTargetId = null;
var navResetDone = false;
var teleportedToSpawnNoOwner = false; // track teleport due to no owner

var health = 40;
var strength = 5;
// --- Helper functions ---
function hasFunc(o, name){
    try { return o && typeof o[name] === "function"; } catch(e){ return false; }
}
function getUUIDSafe(e){
    try { return e ? e.getUUID() : null; } catch(e){ return null; }
}
function isAliveEntity(e){
    try { return e && hasFunc(e, "getHealth") && e.getHealth() > 0; } catch(e){ return false; }
}

// --- Attack scanning ---
function scanForThreats(npc, owner, world){
    var nearby = world.getNearbyEntities(owner.getPos(), RANGE, -1);
    if (!nearby) return null;

    for (var i=0;i<nearby.length;i++){
        var e = nearby[i];
        if (!e) continue;
        var eId = getUUIDSafe(e);
        if (!eId || eId === owner.getUUID() || eId === npc.getUUID()) continue;
        if (!isAliveEntity(e)) continue;

        try{
            var lastTgt = hasFunc(e, "getLastAttacked") ? e.getLastAttacked() : null;
            if (lastTgt && getUUIDSafe(lastTgt) === owner.getUUID()) return e;
            var atkTgt = hasFunc(e, "getAttackTarget") ? e.getAttackTarget() : null;
            if (atkTgt && getUUIDSafe(atkTgt) === owner.getUUID()) return e;
        } catch(ignored){}
    }
    return null;
}

// --- Init function ---
function init(event){
    var npc = event.npc;
    var pos = npc.getPos();
     npc.getStats().setMaxHealth(health);
     npc.getStats().getRanged().setStrength(strength);
     npc.getStats().setHealthRegen(0);
    // Record spawn position once
    if (!npc.storeddata.has("SpawnX")) {
        npc.storeddata.put("SpawnX", pos.getX());
        npc.storeddata.put("SpawnY", pos.getY());
        npc.storeddata.put("SpawnZ", pos.getZ());
        npc.storeddata.put("SpawnWorld", npc.getWorld().getName());
    }

    var owner = npc.role ? npc.role.getFollowing() : null;
    npc.storeddata.put("OwnerName", owner ? owner.getName() : 0);
    npc.storeddata.put("OwnerUUID", owner ? owner.getUUID() : 0);
}

// --- Player interact function ---
function interact(event){
    var player = event.player;
    var npc = event.npc;
    var hand = player.getMainhandItem();
    if (!hand || hand.isEmpty()) return;

    if (hand.getName() === "minecraft:bedrock"){
        var pos = npc.getPos();
        npc.storeddata.put("SpawnX", pos.getX());
        npc.storeddata.put("SpawnY", pos.getY());
        npc.storeddata.put("SpawnZ", pos.getZ());
        npc.storeddata.put("SpawnWorld", npc.getWorld().getName());
        player.message("§aNPC spawn location updated to: X=" + pos.getX() + " Y=" + pos.getY() + " Z=" + pos.getZ());
    }
}

// --- Tick function ---
function tick(event){
    var npc = event.npc;
    var world = npc.getWorld();
    if (!npc.role) return;
    var owner = npc.role.getFollowing();

    var sx = npc.storeddata.get("SpawnX");
    var sy = npc.storeddata.get("SpawnY");
    var sz = npc.storeddata.get("SpawnZ");
    var sWorld = npc.storeddata.get("SpawnWorld");

    // --- Handle no owner ---
    if (!owner){
        npc.storeddata.put("OwnerName", 0);
        npc.storeddata.put("OwnerUUID", 0);
        npc.setAttackTarget(null);
        currentTargetId = null;

        if (!teleportedToSpawnNoOwner && sWorld === world.getName()){
            npc.getAi().setNavigationType(0);
            npc.setPos(world.getBlock(sx, sy, sz).getPos());
            teleportedToSpawnNoOwner = true; // only teleport once
            npc.reset();
            npc.getAi().setNavigationType(1);
        }
        return;
    } else {
        // reset the no-owner teleport flag when owner appears
        teleportedToSpawnNoOwner = false;
    }

    // --- Update owner info ---
    var ownerUUID = owner.getUUID();
    if (npc.storeddata.get("OwnerUUID") !== ownerUUID){
        npc.storeddata.put("OwnerName", owner.getName());
        npc.storeddata.put("OwnerUUID", ownerUUID);
    }

    // --- Clear dead target ---
    var curTarget = npc.getAttackTarget();
    if (curTarget && !isAliveEntity(curTarget)){
        npc.setAttackTarget(null);
        currentTargetId = null;
        curTarget = null;
    }

    // --- Distance & teleport/navigation ---
    try {
        var ownerPos = owner.getPos();
        var npcPos = npc.getPos();
        var dx = npcPos.getX() - ownerPos.getX();
        var dy = npcPos.getY() - ownerPos.getY();
        var dz = npcPos.getZ() - ownerPos.getZ();
        var distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (distance > 56 && sWorld === world.getName()){
            npc.getAi().setNavigationType(0);
            npc.setPos(world.getBlock(sx, sy, sz).getPos());
            navResetDone = false;
        } else if (distance > 40){
            npc.getAi().setNavigationType(0);
            npc.setPos(owner.getPos());
            npc.getAi().setNavigationType(1);
            navResetDone = true;
        } else if (!navResetDone){
            npc.getAi().setNavigationType(1);
            navResetDone = true;
        }
    } catch(e){}

    // --- Assist owner ---
    if (!curTarget && hasFunc(owner, "getLastAttackedTime") && hasFunc(owner, "getLastAttacked")){
        var oat = owner.getLastAttackedTime();
        if (oat > lastOwnerAttackTime){
            var tgt = owner.getLastAttacked();
            if (tgt && isAliveEntity(tgt)){
                npc.setAttackTarget(tgt);
                currentTargetId = getUUIDSafe(tgt);
                curTarget = tgt;
            }
            lastOwnerAttackTime = oat;
        }
    }

    // --- Scan nearby threats ---
    if (!curTarget){
        var threat = scanForThreats(npc, owner, world);
        if (threat){
            npc.setAttackTarget(threat);
            currentTargetId = getUUIDSafe(threat);
        }
    }
}

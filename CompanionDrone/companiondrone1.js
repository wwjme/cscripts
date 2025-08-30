var RANGE = 100;
var lastOwnerAttackTime = 0;
var currentTargetId = null;
var navResetDone = false; // tracks if navigationType switched back to 1 after owner returns

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

// --- Init function ---
function init(event){
    var npc = event.npc;
    var pos = npc.getPos();

    // Record spawn position once
    if (!npc.storeddata.has("SpawnX")) {
        npc.storeddata.put("SpawnX", pos.getX());
        npc.storeddata.put("SpawnY", pos.getY());
        npc.storeddata.put("SpawnZ", pos.getZ());
        npc.storeddata.put("SpawnWorld", npc.getWorld().getName());
    }

    if (npc.role == null) return;
    var owner = npc.role.getFollowing();
    if (owner == null){
        npc.storeddata.put("OwnerName", 0);
        npc.storeddata.put("OwnerUUID", 0);
    } else {
        npc.storeddata.put("OwnerName", owner.getName());
        npc.storeddata.put("OwnerUUID", owner.getUUID());
    }
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
    if (npc.role == null) return;
    var owner = npc.role.getFollowing();

    if (owner == null){
        npc.storeddata.put("OwnerName", 0);
        npc.storeddata.put("OwnerUUID", 0);
        npc.setAttackTarget(null);
        currentTargetId = null;
        return;
    }

    if (npc.storeddata.get("OwnerUUID") !== owner.getUUID()){
        npc.storeddata.put("OwnerName", owner.getName());
        npc.storeddata.put("OwnerUUID", owner.getUUID());
    }

    var curTarget = npc.getAttackTarget();
    if (curTarget && !isAliveEntity(curTarget)){
        npc.setAttackTarget(null);
        currentTargetId = null;
        curTarget = null;
    }

    // --- Teleport checks ---
    try {
        var ownerPos = owner.getPos();
        var npcPos = npc.getPos();
        var dx = npcPos.getX() - ownerPos.getX();
        var dy = npcPos.getY() - ownerPos.getY();
        var dz = npcPos.getZ() - ownerPos.getZ();
        var distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (distance > 56){
            // Teleport back to spawn location
            var sx = npc.storeddata.get("SpawnX");
            var sy = npc.storeddata.get("SpawnY");
            var sz = npc.storeddata.get("SpawnZ");
            var sWorld = npc.storeddata.get("SpawnWorld");

            if (sWorld && sWorld === world.getName()){
                npc.getAi().setNavigationType(0);
                npc.setPos(world.getBlock(sx, sy, sz).getPos());
                navResetDone = false; // reset flag so it can switch back when owner returns
            }
        } else if (distance > 40){
            // Teleport to owner
            npc.getAi().setNavigationType(0);
            npc.setPos(owner.getPos());
            npc.getAi().setNavigationType(1);
            navResetDone = true; // nav already set for owner
        } else {
            // Owner is within 40 blocks
            if (!navResetDone){
                npc.getAi().setNavigationType(1);
                navResetDone = true; // do this only once
            }
        }
    } catch(e){}

    // --- Owner attacked something -> assist ---
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

    // --- Scan nearby entities attacking owner ---
    if (!curTarget){
        var nearby = world.getNearbyEntities(owner.getPos(), RANGE, -1);
        if (nearby && nearby.length){
            for (var i=0; i<nearby.length; i++){
                var e = nearby[i];
                if (!e) continue;
                var eId = getUUIDSafe(e);
                if (!eId || eId === owner.getUUID() || eId === npc.getUUID()) continue;
                if (!isAliveEntity(e)) continue;

                // Check if this entity last attacked the owner
                if (hasFunc(e, "getLastAttacked") && hasFunc(e, "getLastAttackedTime")){
                    try{
                        var lastTgt = e.getLastAttacked();
                        if (lastTgt && getUUIDSafe(lastTgt) === owner.getUUID()){
                            npc.setAttackTarget(e);
                            currentTargetId = eId;
                            curTarget = e;
                            break;
                        }
                    }catch(ignored){}
                }

                // Check if entity is targeting owner
                if (hasFunc(e, "getAttackTarget")){
                    try{
                        var atkTgt = e.getAttackTarget();
                        if (atkTgt && getUUIDSafe(atkTgt) === owner.getUUID()){
                            npc.setAttackTarget(e);
                            currentTargetId = eId;
                            curTarget = e;
                            break;
                        }
                    }catch(ignored){}
                }
            }
        }
    }
}

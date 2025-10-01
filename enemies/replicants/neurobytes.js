function init(event){
    var npc = event.npc;
    var item = npc.world.createItem(minecraft:air, 1);
     npc.getStats().setMaxHealth(100);
     npc.getStats().getRanged().setStrength(15);
     npc.getInventory().setDropItem(1, item, 100);
     npc.getInventory().setDropItem(2, item, 100);
}

function died(event) {
    var killer = event.source; // the entity that killed this npc
    var world = event.npc.getWorld();

    if (killer == null) return;

    // Case 1: Killed by player
    if (killer.getType() == 1) { // 1 = IPlayer
        var reward = world.createItem("minecraft:emerald", 18);
        killer.giveItem(reward);
    }

    // Case 2: Killed by drone (ICustomNpc)
    else if (killer.getType() == 2) { // 2 = ICustomNpc
        var owner = killer.getOwner(); // Returns IPlayer if tamed/companion
        if (owner != null) {
            var reward2 = world.createItem("minecraft:emerald", 18);
            owner.giveItem(reward2);
        }
    }

    // Reset navigation
    event.npc.getAi().setNavigationType(0);
}

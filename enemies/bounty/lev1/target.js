// --- Configurable reward ---
// Change these values for different items/rewards
var rewardItem = "minecraft:emerald";  // item ID
var rewardCount = 5;                   // how many

function init(e){
    var npc = e.npc;
    var item = npc.world.createItem(rewardItem, rewardCount);
    npc.getInventory().setDropItem(1, item, 100);
}


function died(event) {
    var killer = event.source; // usually the player
    if (killer && killer.getStoreddata) {
        var pdata = killer.getStoreddata();
        var left = pdata.get("contractKillsLeft");



        if (left != null && left > 0) {
            left = left - 1;
            pdata.put("contractKillsLeft", left);

            killer.message( left + " targets remaining.");

            if (left <= 0) {
                pdata.put("canDoContract", true);
                killer.message("§6Contract complete! Return for a new one.");

            }
        }
    }
}

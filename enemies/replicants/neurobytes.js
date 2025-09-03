function init(event){
    var npc = event.npc;

     npc.getStats().setMaxHealth(100);
     npc.getStats().getRanged().setStrength(15);
 
}

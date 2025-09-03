function init(event){
    var npc = event.npc;

     npc.getStats().setMaxHealth(20);
     npc.getStats().getRanged().setStrength(4);
 
}

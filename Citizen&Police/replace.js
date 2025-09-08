var reseted = 0;
function init(e){

  var npc= e.npc;
  npc.say("hi");

  if(npc.getFaction().getId()==15 && reseted==0){
   npc.reset();
   npc.say("reseted");
   reseted=1;
  }
  if(npc.getFaction().getId()==15 && reseted==1){
   pos=npc.getPos();
   npc.world.spawnClone(pos.getX(), pos.getY(), pos.getZ(), 3, "CitizenPolice");
   npc.despawn();
   npc.say("daspawn");
  }
}

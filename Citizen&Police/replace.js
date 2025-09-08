var reseted = 0;
function init(e){
  npc= e.npc
  if(npc.getFaction()==15 && reseted==0){
   npc.reset()
   reseted=1;
  }
  if(npc.getFaction()==15 && reseted==1){
   pos=npc.getPos();
   world.spawnClone(pos.getX(), pos.getY(), pos.getZ(), 2, "CitizenPolice");
   npc.despawn()
  }
}

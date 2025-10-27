function init(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var API = event.API;

    // Full, properly nested NBT structure (not JSON!)
    var nbtString = '{' +
        'id:"bbs:model",' +
        'Count:1b,' +
        'tag:{' +
            'display:{Lore:["(+NBT)"]},' +
            'BlockEntityTag:{' +
                'id:"bbs:model_block_entity",' +
                'Properties:{' +
                    'global:0b,' +
                    'enabled:1b,' +
                    'shadow:0b,' +
                    'form:{' +
                        'hitboxWidth:0.5f,' +
                        'hitboxSneakMultiplier:0.9f,' +
                        'lighting:1.0f,' +
                        'visible:1b,' +
                        'color:-1,' +
                        'model:"Edrone2",' +
                        'hitboxHeight:1.8f,' +
                        'step_height:0.5f,' +
                        'uiScale:1.0f,' +
                        'animatable:1b,' +
                        'hp:20.0f,' +
                        'shaderShadow:1b,' +
                        'movement_speed:0.1f,' +
                        'keybind:0,' +
                        'hitboxEyeHeight:0.9f,' +
                        'name:"",' +
                        'id:"bbs:model",' +
                        'transform_overlay:{t:[0.0f,0.0f,0.0f],r:[0.0f,0.0f,0.0f],r2:[0.0f,0.0f,0.0f],s:[1.0f,1.0f,1.0f]},' +
                        'transformFirstPerson:{t:[0.0f,0.0f,-0.25f],r:[0.0f,0.0f,0.0f],r2:[0.0f,0.0f,0.0f],s:[1.0f,1.0f,1.0f]},' +
                        'transformThirdPerson:{t:[0.0f,0.0f,0.0f],r:[0.0f,0.0f,0.0f],r2:[0.0f,0.0f,0.0f],s:[1.0f,1.0f,1.0f]},' +
                        'transformInventory:{t:[0.0f,0.0f,0.0f],r:[0.0f,0.0f,0.0f],r2:[0.0f,0.0f,0.0f],s:[1.0f,1.0f,1.0f]},' +
                        'transform:{t:[0.0f,-0.906f,0.0f],r:[0.0f,0.0f,0.0f],r2:[0.0f,0.0f,0.0f],s:[1.0f,3.25f,1.0f]}' +
                    '}' +
                '}' +
            '}' +
        '}' +
    '}';

    // Convert to NBT and create an actual item
    var nbt = API.stringToNbt(nbtString);
    var item = world.createItemFromNbt(nbt);

    // Give to NPC
    npc.setMainhandItem(item);
    npc.say("✅ Custom BBS model applied: Edrone2");
}

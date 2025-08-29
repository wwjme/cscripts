var guiRef;                 
var mySlots = [];           
var highlightLineIds = [];  
var slotPositions = [       
    {x: 10, y: 10}, // price slot 1
    {x: 28, y: 10}, // price slot 2
    {x: 55, y: 10}  // bought item
];
var highlightedSlot = null; 
var lastNpc = null;         
var storedSlotItems = [];   

function interact(event) {
    var player = event.player;
    var api = event.API;

    lastNpc = event.npc; 
    var npcData = lastNpc.getStoreddata();

    storedSlotItems = npcData.has("SlotItems") 
        ? JSON.parse(npcData.get("SlotItems")) 
        : [null, null, null];

    highlightedSlot = null;
    highlightLineIds = [];

    guiRef = api.createCustomGui(176, 166, 0, true, player);

    mySlots = slotPositions.map(function(pos, i) {
        var slot = guiRef.addItemSlot(pos.x, pos.y);

        if(storedSlotItems[i]) {
            try {
                slot.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[i])));
            } catch(e) {}
        }
        return slot;
    });

    guiRef.showPlayerInventory(10, 50, false); 

    player.showCustomGui(guiRef);
}

function customGuiSlotClicked(event) {
    var clickedSlot = event.slot;
    var stack = event.stack;
    var player = event.player;
    var adminMode = (player.getMainhandItem().name === "minecraft:bedrock");

    var slotIndex = mySlots.indexOf(clickedSlot);

    if(adminMode) {
        // Admin mode: normal editing
        if(slotIndex !== -1) {
            highlightedSlot = clickedSlot;
            for(var i=0;i<highlightLineIds.length;i++){
                try { guiRef.removeComponent(highlightLineIds[i]); } catch(e) {}
            }
            highlightLineIds = [];

            var pos = slotPositions[slotIndex];
            var x = pos.x, y = pos.y, w = 18, h = 18;
            highlightLineIds.push(guiRef.addColoredLine(1, x, y, x+w, y, 0xADD8E6, 2));
            highlightLineIds.push(guiRef.addColoredLine(2, x, y+h, x+w, y+h, 0xADD8E6, 2));
            highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y+h, 0xADD8E6, 2));
            highlightLineIds.push(guiRef.addColoredLine(4, x+w, y, x+w, y+h, 0xADD8E6, 2));
            guiRef.update();
            return;
        }

        if(!highlightedSlot) return;

        try {
            var slotStack = highlightedSlot.getStack();
            var maxStack = stack ? stack.getMaxStackSize() : 64;

            if(stack && !stack.isEmpty()) {
                if(slotStack && !slotStack.isEmpty() && slotStack.getDisplayName() === stack.getDisplayName()) {
                    var total = slotStack.getStackSize() + stack.getStackSize();
                    if(total <= maxStack) {
                        slotStack.setStackSize(total);
                        highlightedSlot.setStack(slotStack);
                        player.removeItem(stack, stack.getStackSize());
                    } else {
                        var overflow = total - maxStack;
                        slotStack.setStackSize(maxStack);
                        highlightedSlot.setStack(slotStack);

                        var overflowCopy = player.world.createItemFromNbt(stack.getItemNbt());
                        overflowCopy.setStackSize(overflow);
                        player.removeItem(stack, stack.getStackSize());
                        player.giveItem(overflowCopy);
                    }
                } else {
                    var itemCopy = player.world.createItemFromNbt(stack.getItemNbt());
                    if(slotStack && !slotStack.isEmpty()) player.giveItem(slotStack);
                    highlightedSlot.setStack(itemCopy);
                    player.removeItem(stack, stack.getStackSize());
                }
            } else if(slotStack && !slotStack.isEmpty()) {
                player.giveItem(slotStack);
                highlightedSlot.setStack(player.world.createItem("minecraft:air", 1));
                guiRef.update();
            }

            guiRef.update();
        } catch(e) {}
    } else {
        // Buyer mode: only right slot is clickable
        if(slotIndex !== 2) return; // only bought item slot

        var priceSlots = [mySlots[0], mySlots[1]];
        var boughtItem = mySlots[2].getStack();
        if(!boughtItem || boughtItem.isEmpty()) return;

        // Check if player has enough items using same logic as original transfer
        for(var i=0;i<priceSlots.length;i++){
            var priceStack = priceSlots[i].getStack();
            if(priceStack && !priceStack.isEmpty()) {
                var totalHave = 0;
                var inv = player.getInventory().getItems();
                for(var j=0;j<inv.length;j++){
                    var s = inv[j];
                    if(s && s.getName() === priceStack.getName()){
                        totalHave += s.getStackSize();
                    }
                }
                if(totalHave < priceStack.getStackSize()){
                    player.message("§cNot enough currency!");
                    return;
                }
            }
        }

        // Remove price items from player inventory
        for(var i=0;i<priceSlots.length;i++){
            var priceStack = priceSlots[i].getStack();
            if(priceStack && !priceStack.isEmpty()) {
                var amountToRemove = priceStack.getStackSize();
                for(var j=0;j<player.getInventory().getItems().length;j++){
                    var s = player.getInventory().getItems()[j];
                    if(s && s.getName() === priceStack.getName() && amountToRemove > 0){
                        var removeAmt = Math.min(amountToRemove, s.getStackSize());
                        s.setStackSize(s.getStackSize() - removeAmt);
                        amountToRemove -= removeAmt;
                    }
                }
            }
        }

        // Give bought item
        var giveCopy = player.world.createItemFromNbt(boughtItem.getItemNbt());
        player.giveItem(giveCopy);
        player.message("§aPurchase successful!");
    }
}

function customGuiClosed(event) {
    if(!lastNpc) return;

    var npcData = lastNpc.getStoreddata();
    storedSlotItems = mySlots.map(function(slot) {
        var stack = slot.getStack();
        return stack && !stack.isEmpty() ? stack.getItemNbt().toJsonString() : null;
    });

    npcData.put("SlotItems", JSON.stringify(storedSlotItems));
}

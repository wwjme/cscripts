var guiRef;                 
var mySlots = [];           
var highlightLineIds = [];  
var slotPositions = [       
    {x: 10, y: 10},
    {x: 40, y: 10},
    {x: 70, y: 10}
];
var highlightedSlot = null; 
var lastNpc = null;         
var storedSlotItems = [];   

function interact(event) {
    var player = event.player;
    var api = event.API;

    lastNpc = event.npc; 
    var npcData = lastNpc.getStoreddata();

    // Load stored items from NPC storeddata
    if(npcData.has("SlotItems")) {
        try {
            storedSlotItems = JSON.parse(npcData.get("SlotItems"));
        } catch(e) {
            storedSlotItems = [];
        }
    } else {
        storedSlotItems = [null, null, null];
    }

    highlightedSlot = null;
    highlightLineIds = [];

    guiRef = api.createCustomGui(176, 166, 0, true, player);

    mySlots = [];
    for (var i = 0; i < 3; i++) {
        var pos = slotPositions[i];
        var slot = guiRef.addItemSlot(pos.x, pos.y);
        mySlots.push(slot);

        // Restore stored item into slot using stringToNbt
        if(storedSlotItems[i]) {
            try {
                var nbt = api.stringToNbt(storedSlotItems[i]);
                var item = player.world.createItemFromNbt(nbt);
                slot.setStack(item);
            } catch(e) {}
        }
    }

    guiRef.showPlayerInventory(10, 50, false);
    player.showCustomGui(guiRef);

    // Print last stored item NBT
    for(var i = storedSlotItems.length-1; i >= 0; i--) {
        if(storedSlotItems[i]) {
            player.message("Last item stored NBT: " + storedSlotItems[i]);
            break;
        }
    }
}

function customGuiSlotClicked(event) {
    var clickedSlot = event.slot;
    var stack = event.stack;
    var player = event.player;

    var slotFound = false;
    for (var i = 0; i < mySlots.length; i++) {
        if (clickedSlot === mySlots[i]) {
            slotFound = true;
            highlightedSlot = clickedSlot;

            if (highlightLineIds.length > 0) {
                for (var j = 0; j < highlightLineIds.length; j++) {
                    try { guiRef.removeComponent(highlightLineIds[j]); } catch(e) {}
                }
                highlightLineIds = [];
            }

            var pos = slotPositions[i];
            var x = pos.x;
            var y = pos.y;
            var width = 18;
            var height = 18;
            highlightLineIds.push(guiRef.addColoredLine(1, x, y, x + width, y, 0xADD8E6, 2));
            highlightLineIds.push(guiRef.addColoredLine(2, x, y + height, x + width, y + height, 0xADD8E6, 2));
            highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y + height, 0xADD8E6, 2));
            highlightLineIds.push(guiRef.addColoredLine(4, x + width, y, x + width, y + height, 0xADD8E6, 2));
            guiRef.update();
            break;
        }
    }

    // Inventory item clicked + slot highlighted
    if (!slotFound && highlightedSlot != null && stack != null && !stack.isEmpty()) {
        try {
            var slotStack = highlightedSlot.getStack();
            var maxStack = stack.getMaxStackSize();

            if (slotStack != null && !slotStack.isEmpty() &&
                slotStack.getDisplayName() === stack.getDisplayName()) {

                // SAME ITEM: check if slot is full
                if (slotStack.getStackSize() >= maxStack) {
                    highlightedSlot.setStack(stack);
                    player.removeItem(stack, stack.getStackSize());
                    player.giveItem(slotStack);
                    player.message("Slot full! Swapped with your held item.");
                } else {
                    var totalAmount = slotStack.getStackSize() + stack.getStackSize();
                    if (totalAmount <= maxStack) {
                        slotStack.setStackSize(totalAmount);
                        highlightedSlot.setStack(slotStack);
                        player.removeItem(stack, stack.getStackSize());
                        player.message("Stacked " + stack.getDisplayName() + " fully!");
                    } else {
                        var overflow = totalAmount - maxStack;
                        slotStack.setStackSize(maxStack);
                        highlightedSlot.setStack(slotStack);

                        var overflowCopy = player.world.createItemFromNbt(stack.getItemNbt());
                        overflowCopy.setStackSize(overflow);

                        player.removeItem(stack, stack.getStackSize());
                        player.giveItem(overflowCopy);
                        player.message("Stacked " + (stack.getStackSize() - overflow) + " items. Overflow returned!");
                    }
                }

            } else {
                var itemCopy = player.world.createItemFromNbt(stack.getItemNbt());
                var oldSlotItem = slotStack;
                highlightedSlot.setStack(itemCopy);

                if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
                    player.giveItem(oldSlotItem);
                }

                player.removeItem(stack, stack.getStackSize());
                player.message("Transferred " + stack.getDisplayName() + " to highlighted slot!");
            }

            guiRef.update();
        } catch(e) {
            player.message("Failed to transfer item: " + e);
        }
    } else if (!slotFound && highlightedSlot != null && (stack == null || stack.isEmpty())) {
        var oldSlotItem = highlightedSlot.getStack();
        if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
            player.giveItem(oldSlotItem);
            highlightedSlot.setStack(player.world.createItem("minecraft:air", 1));
            guiRef.update();
            player.message("Returned item to player from highlighted slot.");
        }
    }
}

function customGuiClosed(event) {
    if (!lastNpc) return;

    var npcData = lastNpc.getStoreddata();
    for(var i = 0; i < mySlots.length; i++) {
        var stack = mySlots[i].getStack();
        if(stack != null && !stack.isEmpty()) {
            storedSlotItems[i] = stack.getItemNbt().toJsonString();
        } else {
            storedSlotItems[i] = null;
        }
    }

    npcData.put("SlotItems", JSON.stringify(storedSlotItems));
}

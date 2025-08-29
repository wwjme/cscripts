
var guiRef;
var mySlots = [];
var highlightLineIds = [];

var slotPositions = [];
var startX = 60;
var startY = 10;
var colSpacing = 30;
var rowSpacing = 30;
for (var row = 0; row < 3; row++) {
    for (var col = 0; col < 3; col++) {
        slotPositions.push({x: startX + col * colSpacing, y: startY + row * rowSpacing});
    }
}

// Extra single slot on the left side (index 9 in storage array)
var extraSlotPosition = {x: 10, y: 30};

var highlightedSlot = null;
var lastNpc = null;
var storedSlotItems = []; // array of 10 nbt-strings or null

// small helper (compatible with older Nashorn): create array filled with null
function makeNullArray(n){
    var a = new Array(n);
    for (var i=0;i<n;i++) a[i] = null;
    return a;
}

// ---------- INTERACT ----------
function interact(event) {
    var player = event.player;
    var api = event.API;
    lastNpc = event.npc;
    var npcData = lastNpc.getStoreddata();

    // load stored items (array of length 10: 0..8 = grid, 9 = key)
    if (npcData.has("SlotItems")) {
        try {
            storedSlotItems = JSON.parse(npcData.get("SlotItems"));
            if (!storedSlotItems || storedSlotItems.length < 10) {
                var tmp = makeNullArray(10);
                if (storedSlotItems && storedSlotItems.length > 0) {
                    for (var t = 0; t < storedSlotItems.length && t < 10; t++) tmp[t] = storedSlotItems[t];
                }
                storedSlotItems = tmp;
            }
        } catch(e){
            storedSlotItems = makeNullArray(10);
        }
    } else {
        storedSlotItems = makeNullArray(10);
    }

    // get item in hand (may be null / empty)
    var handItem = player.getMainhandItem();

    // If player holds the key item (storedSlotItems[9]) -> give rewards (no GUI)
    if (handItem && !handItem.isEmpty() && storedSlotItems[9]) {
        try {
            var required = player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[9]));
            var handName = handItem.getName();
            var reqName = required.getName();
            var handNbtJson = null;
            var reqNbtJson = null;
            try { handNbtJson = handItem.getItemNbt() ? handItem.getItemNbt().toJsonString() : null; } catch(e){}
            try { reqNbtJson  = required.getItemNbt() ? required.getItemNbt().toJsonString() : null; } catch(e){}

            var matches = (handName === reqName) && (handNbtJson === reqNbtJson);

            if (matches) {
                player.removeItem(handItem, 1);

                // give rewards
                for (var i = 0; i < 9; i++) {
                    if (storedSlotItems[i]) {
                        try {
                            var reward = player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[i]));
                            player.giveItem(reward);
                        } catch(e) {}
                    }
                }

                // feedback
                lastNpc.say("Thank you!");
                return; // done
            }
        } catch(e) {}
    }

    // If player holds bedrock -> open GUI (admin edit)
    if (handItem && !handItem.isEmpty() && handItem.getName() === "minecraft:bedrock") {
        highlightedSlot = null;
        highlightLineIds = [];

        guiRef = api.createCustomGui(176, 166, 0, true, player);

        // create the 9 grid slots
        mySlots = slotPositions.map(function(pos, i) {
            var slot = guiRef.addItemSlot(pos.x, pos.y);
            if (storedSlotItems[i]) {
                try {
                    slot.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[i])));
                } catch(e) {}
            }
            return slot;
        });

        // create the extra key slot
        var extraSlot = guiRef.addItemSlot(extraSlotPosition.x, extraSlotPosition.y);
        if (storedSlotItems[9]) {
            try {
                extraSlot.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[9])));
            } catch(e) {}
        }
        mySlots.push(extraSlot);

        guiRef.showPlayerInventory(10, 110, false);
        player.showCustomGui(guiRef);
        return;
    }
}

// ---------- SLOT CLICK ----------
function customGuiSlotClicked(event) {
    var clickedSlot = event.slot;
    var stack = event.stack;
    var player = event.player;

    var slotIndex = mySlots.indexOf(clickedSlot);
    if (slotIndex !== -1) {
        highlightedSlot = clickedSlot;
        for (var h = 0; h < highlightLineIds.length; h++){
            try { guiRef.removeComponent(highlightLineIds[h]); } catch(e){}
        }
        highlightLineIds = [];

        var pos = (slotIndex < 9) ? slotPositions[slotIndex] : extraSlotPosition;
        var x = pos.x, y = pos.y, w = 18, h = 18;
        highlightLineIds.push(guiRef.addColoredLine(1, x, y, x+w, y, 0xADD8E6, 2));
        highlightLineIds.push(guiRef.addColoredLine(2, x, y+h, x+w, y+h, 0xADD8E6, 2));
        highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y+h, 0xADD8E6, 2));
        highlightLineIds.push(guiRef.addColoredLine(4, x+w, y, x+w, y+h, 0xADD8E6, 2));
        guiRef.update();
        return;
    }

    if (!highlightedSlot) return;

    try {
        var slotStack = highlightedSlot.getStack();
        var maxStack = stack ? stack.getMaxStackSize() : 64;

        if (stack && !stack.isEmpty()) {
            if (slotStack && !slotStack.isEmpty() && slotStack.getDisplayName() === stack.getDisplayName()) {
                var total = slotStack.getStackSize() + stack.getStackSize();
                if (total <= maxStack) {
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
                if (slotStack && !slotStack.isEmpty()) player.giveItem(slotStack);
                highlightedSlot.setStack(itemCopy);
                player.removeItem(stack, stack.getStackSize());
            }
        } else if (slotStack && !slotStack.isEmpty()) {
            player.giveItem(slotStack);
            highlightedSlot.setStack(player.world.createItem("minecraft:air", 1));
            guiRef.update();
        }

        guiRef.update();
    } catch(e) {}
}

// ---------- GUI CLOSED: persist ----------
function customGuiClosed(event) {
    if (!lastNpc) return;

    var toSave = makeNullArray(10);
    for (var i = 0; i < mySlots.length && i < 10; i++) {
        try {
            var st = mySlots[i].getStack();
            toSave[i] = (st && !st.isEmpty()) ? st.getItemNbt().toJsonString() : null;
        } catch(e) {
            toSave[i] = null;
        }
    }
    lastNpc.getStoreddata().put("SlotItems", JSON.stringify(toSave));
}

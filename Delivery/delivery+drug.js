var guiRef;
var mySlots = [];
var highlightLineIds = [];

// === CONFIG ===
var GRID_ROWS = 3;
var GRID_COLS = 3;
var START_X   = 60;
var START_Y   = -100;  // top grid Y offset
var COL_SPACING = 20;
var ROW_SPACING = 20;

// Extra slots (keys on the left)
var extraSlotPositionA = {x: 10, y: -50}; // top key slot
var extraSlotPositionB = {x: 10, y: 0};   // bottom key slot

// --- Build slot positions for grids ---
function buildSlotPositions(offsetY){
    var arr = [];
    for (var row = 0; row < GRID_ROWS; row++) {
        for (var col = 0; col < GRID_COLS; col++) {
            arr.push({x: START_X + col * COL_SPACING, y: offsetY + row * ROW_SPACING});
        }
    }
    return arr;
}

var slotPositionsA = buildSlotPositions(START_Y);      // top rewards grid
var slotPositionsB = buildSlotPositions(START_Y + 50); // bottom rewards grid

var GRID_SIZE = slotPositionsA.length;
var STORAGE_SIZE = GRID_SIZE + 1; // grid + key slot

// storage arrays
var storedSlotItemsA = [];
var storedSlotItemsB = [];

var highlightedSlot = null;
var lastNpc = null;

function makeNullArray(n){
    var a = new Array(n);
    for (var i=0;i<n;i++) a[i] = null;
    return a;
}

function init(e) {
    e.npc.setFaction(4);
    e.npc.getAi().setStandingType(2);
}

// Compare items strictly (id + damage + NBT)
function itemsEqualStrict(api, hand, required) {
    if (!hand || !required) return false;
    if (hand.getName() !== required.getName()) return false;
    if (hand.getItemDamage() !== required.getItemDamage()) return false;

    try {
        var hNbt = hand.getItemNbt().toJsonString();
        var rNbt = required.getItemNbt().toJsonString();
        return hNbt === rNbt;
    } catch(e) {
        return false;
    }
}

// Helper: map a mySlots index to its visual position object {x,y}
function getSlotPositionByIndex(index) {
    // Indices layout in mySlots:
    // 0..G-1         -> A grid (slotPositionsA[0..G-1])
    // G              -> extraA
    // G+1 .. G+G     -> B grid (slotPositionsB[0..G-1])
    // 2G+1           -> extraB
    var G = GRID_SIZE;
    if (index < G) {
        return slotPositionsA[index];
    } else if (index == G) {
        return extraSlotPositionA;
    } else if (index > G && index <= G + G) {
        return slotPositionsB[index - (G + 1)];
    } else {
        // last slot: extraB
        return extraSlotPositionB;
    }
}

// ---------- INTERACT ----------
function interact(event) {
    var player = event.player;
    var api = event.API;
    lastNpc = event.npc;
    var npcData = lastNpc.getStoreddata();

    // Load stored items A
    if (npcData.has("SlotItemsA")) {
        try {
            storedSlotItemsA = JSON.parse(npcData.get("SlotItemsA"));
            if (!storedSlotItemsA || storedSlotItemsA.length < STORAGE_SIZE) {
                var tmp = makeNullArray(STORAGE_SIZE);
                if (storedSlotItemsA && storedSlotItemsA.length > 0) {
                    for (var t = 0; t < storedSlotItemsA.length && t < STORAGE_SIZE; t++) tmp[t] = storedSlotItemsA[t];
                }
                storedSlotItemsA = tmp;
            }
        } catch(e){
            storedSlotItemsA = makeNullArray(STORAGE_SIZE);
        }
    } else {
        storedSlotItemsA = makeNullArray(STORAGE_SIZE);
    }

    // Load stored items B
    if (npcData.has("SlotItemsB")) {
        try {
            storedSlotItemsB = JSON.parse(npcData.get("SlotItemsB"));
            if (!storedSlotItemsB || storedSlotItemsB.length < STORAGE_SIZE) {
                var tmp2 = makeNullArray(STORAGE_SIZE);
                if (storedSlotItemsB && storedSlotItemsB.length > 0) {
                    for (var u = 0; u < storedSlotItemsB.length && u < STORAGE_SIZE; u++) tmp2[u] = storedSlotItemsB[u];
                }
                storedSlotItemsB = tmp2;
            }
        } catch(e){
            storedSlotItemsB = makeNullArray(STORAGE_SIZE);
        }
    } else {
        storedSlotItemsB = makeNullArray(STORAGE_SIZE);
    }

    var handItem = player.getMainhandItem();
    var pdata = player.getStoreddata();

    // --- Check key for Set A ---
    if (handItem && !handItem.isEmpty() && storedSlotItemsA[GRID_SIZE]) {
        try {
            var requiredA = player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsA[GRID_SIZE]));
            if (itemsEqualStrict(api, handItem, requiredA)) {
                player.removeItem(handItem, 1);
                pdata.put("canGetPackage", 1);
                for (var i = 0; i < GRID_SIZE; i++) {
                    if (storedSlotItemsA[i]) {
                        try {
                            var rewardA = player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsA[i]));
                            player.giveItem(rewardA);
                        } catch(e) {}
                    }
                }
                player.message("§aYou Received Payment Set A!");
                return;
            }
        } catch(e) {}
    }

    // --- Check key for Set B ---
    if (handItem && !handItem.isEmpty() && storedSlotItemsB[GRID_SIZE]) {
        try {
            var requiredB = player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsB[GRID_SIZE]));
            if (itemsEqualStrict(api, handItem, requiredB)) {
                player.removeItem(handItem, 1);
                pdata.put("canGetPackage", 1);
                for (var j = 0; j < GRID_SIZE; j++) {
                    if (storedSlotItemsB[j]) {
                        try {
                            var rewardB = player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsB[j]));
                            player.giveItem(rewardB);
                        } catch(e) {}
                    }
                }
                player.message("§aYou Received Payment Set B!");
                return;
            }
        } catch(e) {}
    }

    // --- If holding bedrock -> open GUI editor ---
    if (handItem && !handItem.isEmpty() && handItem.getName() === "minecraft:bedrock") {
        highlightedSlot = null;
        highlightLineIds = [];
        mySlots = [];

        guiRef = api.createCustomGui(176, 166, 0, true, player);

        // === Render Set A ===
        for (var iA = 0; iA < slotPositionsA.length; iA++) {
            var slotA = guiRef.addItemSlot(slotPositionsA[iA].x, slotPositionsA[iA].y);
            if (storedSlotItemsA[iA]) {
                try { slotA.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsA[iA]))); } catch(e){}
            }
            mySlots.push(slotA);
        }
        var extraA = guiRef.addItemSlot(extraSlotPositionA.x, extraSlotPositionA.y);
        if (storedSlotItemsA[GRID_SIZE]) {
            try { extraA.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsA[GRID_SIZE]))); } catch(e){}
        }
        mySlots.push(extraA);

        // === Render Set B ===
        for (var iB = 0; iB < slotPositionsB.length; iB++) {
            var slotB = guiRef.addItemSlot(slotPositionsB[iB].x, slotPositionsB[iB].y);
            if (storedSlotItemsB[iB]) {
                try { slotB.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsB[iB]))); } catch(e){}
            }
            mySlots.push(slotB);
        }
        var extraB = guiRef.addItemSlot(extraSlotPositionB.x, extraSlotPositionB.y);
        if (storedSlotItemsB[GRID_SIZE]) {
            try { extraB.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItemsB[GRID_SIZE]))); } catch(e){}
        }
        mySlots.push(extraB);

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

        // Determine correct pos for this slot index
        var pos = getSlotPositionByIndex(slotIndex);
        var x = pos.x, y = pos.y, w = 18, h = 18;
        highlightLineIds.push(guiRef.addColoredLine(1, x, y, x+w, y, 0xADD8E6, 2));
        highlightLineIds.push(guiRef.addColoredLine(2, x, y+h, x+w, y+h, 0xADD8E6, 2));
        highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y+h, 0xADD8E6, 2));
        highlightLineIds.push(guiRef.addColoredLine(4, x+w, y, x+w, y+h, 0xADD8E6, 2));
        try { guiRef.update(); } catch(e) {}
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
            try { guiRef.update(); } catch(e){}
        }

        try { guiRef.update(); } catch(e){}
    } catch(e) {}
}

// ---------- GUI CLOSED ----------
function customGuiClosed(event) {
    if (!lastNpc) return;

    var toSaveA = makeNullArray(STORAGE_SIZE);
    var toSaveB = makeNullArray(STORAGE_SIZE);

    // First STORAGE_SIZE slots belong to A
    for (var i = 0; i < STORAGE_SIZE; i++) {
        try {
            var stA = mySlots[i].getStack();
            toSaveA[i] = (stA && !stA.isEmpty()) ? stA.getItemNbt().toJsonString() : null;
        } catch(e) { toSaveA[i] = null; }
    }

    // Next STORAGE_SIZE slots belong to B
    for (var j = 0; j < STORAGE_SIZE; j++) {
        try {
            var stB = mySlots[STORAGE_SIZE + j].getStack();
            toSaveB[j] = (stB && !stB.isEmpty()) ? stB.getItemNbt().toJsonString() : null;
        } catch(e) { toSaveB[j] = null; }
    }

    lastNpc.getStoreddata().put("SlotItemsA", JSON.stringify(toSaveA));
    lastNpc.getStoreddata().put("SlotItemsB", JSON.stringify(toSaveB));
}

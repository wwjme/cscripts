var guiRef;
var mySlots = [];
var highlightLineIds = [];

// === CONFIG ===
var GRID_ROWS = 3;
var GRID_COLS = 3;
var START_X = 60;
var START_Y = -100; // top grid Y offset
var COL_SPACING = 20;
var ROW_SPACING = 20;

// Key slot on the left
var extraSlotPosition = {x: 10, y: -80}; 

// --- Build slot positions ---
function buildSlotPositions(offsetY){
    var arr = [];
    for (var row = 0; row < GRID_ROWS; row++) {
        for (var col = 0; col < GRID_COLS; col++) {
            arr.push({x: START_X + col * COL_SPACING, y: offsetY + row * ROW_SPACING});
        }
    }
    return arr;
}
var slotPositions = buildSlotPositions(START_Y); // reward grid

var GRID_SIZE = slotPositions.length;
var STORAGE_SIZE = GRID_SIZE + 1; // grid + key slot

// storage
var storedSlotItems = [];
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

// --- Helpers ---
function normalizeNbtJson(str){
    if(!str) return "";
    try {
        return str.replace(/"Count"\s*:\s*[\d]+[bB]?/g, "").replace(/\s+/g, "");
    } catch(e){
        return str;
    }
}

function itemsEqualStrict(api, hand, required) {
    if (!hand || !required) return false;
    if (hand.getName() !== required.getName()) return false;
    if (hand.getItemDamage() !== required.getItemDamage()) return false;
    try {
        var hNbt = hand.getItemNbt() ? hand.getItemNbt().toJsonString() : "";
        var rNbt = required.getItemNbt() ? required.getItemNbt().toJsonString() : "";
        return normalizeNbtJson(hNbt) === normalizeNbtJson(rNbt);
    } catch(e) { return false; }
}

// ---------- INTERACT ----------
function interact(event) {
    var player = event.player;
    var api = event.API;
    lastNpc = event.npc;
    var npcData = lastNpc.getStoreddata();

    // Load storage
    if (npcData.has("SlotItems")) {
        try {
            storedSlotItems = JSON.parse(npcData.get("SlotItems"));
            if (!storedSlotItems || storedSlotItems.length < STORAGE_SIZE) {
                var tmp = makeNullArray(STORAGE_SIZE);
                if (storedSlotItems && storedSlotItems.length > 0) {
                    for (var t = 0; t < storedSlotItems.length && t < STORAGE_SIZE; t++) tmp[t] = storedSlotItems[t];
                }
                storedSlotItems = tmp;
            }
        } catch(e){
            storedSlotItems = makeNullArray(STORAGE_SIZE);
        }
    } else {
        storedSlotItems = makeNullArray(STORAGE_SIZE);
    }

    var handItem = player.getMainhandItem();
    if (handItem && !handItem.isEmpty() && storedSlotItems[GRID_SIZE]) {
        try {
            var required = player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[GRID_SIZE]));
            if (itemsEqualStrict(api, handItem, required)) {
                var stackSize = handItem.getStackSize();

                // Remove full stack from player
                player.removeItem(handItem, stackSize);

                // Pick random reward slot
                var choices = [];
                for (var i = 0; i < GRID_SIZE; i++) {
                    if (storedSlotItems[i]) choices.push(i);
                }

                if (choices.length > 0) {
                    var randIndex = choices[Math.floor(Math.random() * choices.length)];
                    var reward = player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[randIndex]));
                    reward.setStackSize(stackSize);
                    player.giveItem(reward);
                    player.message("§aYou received " + stackSize + "x " + reward.getDisplayName() + "!");
                } else {
                    player.message("§cNo rewards are set in the slots!");
                }
                return;
            }
        } catch(e) {}
    }

    // Open GUI editor if holding bedrock
    if (handItem && !handItem.isEmpty() && handItem.getName() === "minecraft:bedrock") {
        highlightedSlot = null;
        highlightLineIds = [];
        mySlots = [];

        guiRef = api.createCustomGui(176, 166, 0, true, player);

        // Reward grid
        for (var i = 0; i < slotPositions.length; i++) {
            var slot = guiRef.addItemSlot(slotPositions[i].x, slotPositions[i].y);
            if (storedSlotItems[i]) {
                try { slot.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[i]))); } catch(e){}
            }
            mySlots.push(slot);
        }

        // Key slot
        var extra = guiRef.addItemSlot(extraSlotPosition.x, extraSlotPosition.y);
        if (storedSlotItems[GRID_SIZE]) {
            try { extra.setStack(player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[GRID_SIZE]))); } catch(e){}
        }
        mySlots.push(extra);

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

        var pos = (slotIndex < GRID_SIZE) ? slotPositions[slotIndex] : extraSlotPosition;
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
        try { guiRef.update(); } catch(e) {}
    } catch(e) {}
}

// ---------- GUI CLOSED ----------
function customGuiClosed(event) {
    if (!lastNpc) return;

    var toSave = makeNullArray(STORAGE_SIZE);
    for (var i = 0; i < STORAGE_SIZE; i++) {
        try {
            var st = mySlots[i].getStack();
            toSave[i] = (st && !st.isEmpty()) ? st.getItemNbt().toJsonString() : null;
        } catch(e) { toSave[i] = null; }
    }
    lastNpc.getStoreddata().put("SlotItems", JSON.stringify(toSave));
}

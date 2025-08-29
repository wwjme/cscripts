var guiRef;                 
var mySlots = [];           
var highlightLineIds = [];  
var highlightedSlot = null; 
var lastNpc = null;         
var storedSlotItems = {};   // per-page storage
var currentPage = 0;        // track current page
var maxPages = 6;           // max pages admin can create

// ---- helper: create an array of length n filled with null (since .fill isn't available) ----
function makeNullArray(n){
    var a = new Array(n);
    for (var i = 0; i < n; i++){ a[i] = null; }
    return a;
}

// ========== Layout ==========
var slotPositions = [];
var startX = -105;          
var startY = -120;          
var rowSpacing = 20.5;      
var colSpacing = 79;        
var numRows = 10;           
var numCols = 5;            

var price1OffsetX = 0;
var price2OffsetX = 18;
var boughtOffsetX = 44;

for (var col = 0; col < numCols; col++) {
    var colOffsetX = startX + col * colSpacing;
    for (var row = 0; row < numRows; row++) {
        var y = startY + row * rowSpacing;
        slotPositions.push({x: colOffsetX + price1OffsetX, y: y});  
        slotPositions.push({x: colOffsetX + price2OffsetX, y: y});  
        slotPositions.push({x: colOffsetX + boughtOffsetX, y: y});  
    }
}

// ========== Open GUI ==========
function interact(event) {
    var player = event.player;
    var api = event.API;

    lastNpc = event.npc; 
    var npcData = lastNpc.getStoreddata();

    storedSlotItems = npcData.has("SlotItems") 
        ? JSON.parse(npcData.get("SlotItems")) 
        : {};

    if(!storedSlotItems[currentPage]){
        storedSlotItems[currentPage] = makeNullArray(slotPositions.length);
    }

    highlightedSlot = null;
    highlightLineIds = [];

    if(!guiRef){
        guiRef = api.createCustomGui(176, 166, 0, true, player);

        guiRef.addButton(2,"Next",  284, -30, 35, 19);
        guiRef.addButton(3,"Back",  -153, -30,  35, 19);

        var adminMode = (player.getMainhandItem().name === "minecraft:bedrock");
        if(adminMode){
            guiRef.addButton(4,"Create", 284, -60, 35, 19);
        }

        mySlots = slotPositions.map(function(pos) {
            return guiRef.addItemSlot(pos.x, pos.y);
        });

        guiRef.showPlayerInventory(0, 91, false); 
        player.showCustomGui(guiRef);
    }

    for(var i=0; i<mySlots.length; i++){
        mySlots[i].setStack(null);
        if(storedSlotItems[currentPage][i]) {
            try {
                var item = player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[currentPage][i]));
                mySlots[i].setStack(item);
            } catch(e) {}
        }
    }

    guiRef.update();
}

// ========== Button Click ==========
function customGuiButton(event){
    var player = event.player;
    var adminMode = (player.getMainhandItem().name === "minecraft:bedrock");
    var npcData = lastNpc.getStoreddata();

    var totalPages = Object.keys(storedSlotItems).length;

    if(event.buttonId == 2){ // Next
        savePageItems();
        if(currentPage+1 < totalPages){ 
            currentPage++;
            interact({player: player, API: event.API, npc: lastNpc});
            player.message("§eSwitched to page " + (currentPage+1));
        } else {
            player.message("§cNo more pages available!");
        }
    }

    if(event.buttonId == 3){ // Previous
        if(currentPage > 0){
            savePageItems();
            currentPage--;
            interact({player: player, API: event.API, npc: lastNpc});
            player.message("§eSwitched to page " + (currentPage+1));
        } else {
            player.message("§cAlready on first page!");
        }
    }

    if(event.buttonId == 4 && adminMode){ // Create Page
        if(totalPages < maxPages){
            savePageItems();
            var newPage = totalPages;
            storedSlotItems[newPage] = makeNullArray(slotPositions.length);
            currentPage = newPage;
            interact({player: player, API: event.API, npc: lastNpc});
            player.message("§aCreated page " + (currentPage+1));
        } else {
            player.message("§cMaximum of " + maxPages + " pages reached!");
        }
    }
}

// ========== Slot Click ==========
function customGuiSlotClicked(event) {
    var clickedSlot = event.slot;
    var stack = event.stack;
    var player = event.player;
    var adminMode = (player.getMainhandItem().name === "minecraft:bedrock");

    var slotIndex = mySlots.indexOf(clickedSlot);

    if(adminMode) {
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
        if(slotIndex % 3 !== 2) return; 

        var rowStart = slotIndex - 2; 
        var priceSlots = [mySlots[rowStart], mySlots[rowStart+1]];
        var boughtItem = mySlots[slotIndex].getStack();
        if(!boughtItem || boughtItem.isEmpty()) return;

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

        var giveCopy = player.world.createItemFromNbt(boughtItem.getItemNbt());
        player.giveItem(giveCopy);
        player.message("§aPurchase successful!");
    }
}

// ========== Save GUI ==========
function customGuiClosed(event) {
    savePageItems();
    guiRef = null; // <<< reset so next interact() will recreate it
}

function savePageItems(){
    if(!lastNpc) return;
    var npcData = lastNpc.getStoreddata();

    storedSlotItems[currentPage] = mySlots.map(function(slot) {
        var stack = slot.getStack();
        return stack && !stack.isEmpty() ? stack.getItemNbt().toJsonString() : null;
    });

    npcData.put("SlotItems", JSON.stringify(storedSlotItems));
}

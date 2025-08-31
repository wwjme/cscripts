var guiRef;                 
var mySlots = [];           
var highlightLineIds = [];  
var highlightedSlot = null; 
var lastNpc = null;         
var storedSlotItems = {};   // per-page slot storage
var storedPageTexts = {};   // per-page text storage
var currentPage = 0;        
var maxPages = 6;           

// ---- helper ----
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

    storedPageTexts = npcData.has("PageTexts")
        ? JSON.parse(npcData.get("PageTexts"))
        : {};

    if(!storedSlotItems[currentPage]){
        storedSlotItems[currentPage] = makeNullArray(slotPositions.length);
    }
    if(!storedPageTexts[currentPage]){
        storedPageTexts[currentPage] = "";
    }

    highlightedSlot = null;
    highlightLineIds = [];

    // Only create GUI once
    if(!guiRef){
        guiRef = api.createCustomGui(176, 166, 0, true, player);

        guiRef.addButton(2,"Next",  284, -30, 35, 19);
        guiRef.addButton(3,"Back",  -153, -30,  35, 19);

        var adminMode = (player.getMainhandItem().name === "minecraft:bedrock");
        if(adminMode){
            guiRef.addButton(4,"Create", 284, -60, 35, 19);
            guiRef.addTextField(10, -80, -150, 160, 20);
        } else {
            guiRef.addLabel(11, "", -80, -150, 160, 20);
        }

        mySlots = slotPositions.map(function(pos) {
            return guiRef.addItemSlot(pos.x, pos.y);
        });

        guiRef.showPlayerInventory(0, 91, false); 
        player.showCustomGui(guiRef);
    }

    updatePage(player, api);
}

// ========== Update Page ==========
function updatePage(player, api){
    if(!guiRef) return;

    // Update slots
    for(var i=0; i<mySlots.length; i++){
        mySlots[i].setStack(null);
        if(storedSlotItems[currentPage][i]) {
            try {
                var item = player.world.createItemFromNbt(api.stringToNbt(storedSlotItems[currentPage][i]));
                mySlots[i].setStack(item);
            } catch(e) {}
        }
    }

    // Update text field / label
    try {
        var adminMode = (player.getMainhandItem().name === "minecraft:bedrock");
        if(adminMode){
            var tf = guiRef.getComponent(10);
            if(tf) tf.setText(storedPageTexts[currentPage] || "");
        } else {
            var lbl = guiRef.getComponent(11);
            if(lbl) lbl.setText(storedPageTexts[currentPage] || "");
        }
    } catch(e){}

    try { guiRef.update(); } catch(e){}
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
            updatePage(player, event.API);
        } else {
            player.message("§cNo more pages available!");
        }
    }

    if(event.buttonId == 3){ // Previous
        if(currentPage > 0){
            savePageItems();
            currentPage--;
            updatePage(player, event.API);
        } else {
            player.message("§cAlready on first page!");
        }
    }

    if(event.buttonId == 4 && adminMode){ // Create Page
        if(totalPages < maxPages){
            savePageItems();
            var newPage = totalPages;
            storedSlotItems[newPage] = makeNullArray(slotPositions.length);
            storedPageTexts[newPage] = "";
            currentPage = newPage;
            updatePage(player, event.API);
            player.message("§aCreated page " + (currentPage+1));
        } else {
            player.message("§cMaximum of " + maxPages + " pages reached!");
        }
    }
}

// ========== Slot Click ==========
function customGuiSlotClicked(event) {
    // unchanged from your version
    // ...
}

// ========== Save GUI ==========
function customGuiClosed(event) {
    savePageItems();
    guiRef = null;
}

function savePageItems(){
    if(!lastNpc) return;
    var npcData = lastNpc.getStoreddata();

    storedSlotItems[currentPage] = mySlots.map(function(slot) {
        var stack = slot.getStack();
        return stack && !stack.isEmpty() ? stack.getItemNbt().toJsonString() : null;
    });

    try {
        if(guiRef){
            var tf = guiRef.getComponent(10);
            if(tf){ storedPageTexts[currentPage] = tf.getText(); }
        }
    } catch(e){}

    npcData.put("SlotItems", JSON.stringify(storedSlotItems));
    npcData.put("PageTexts", JSON.stringify(storedPageTexts));
}

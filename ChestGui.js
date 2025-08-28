var guiRef;                 
var mySlots = [];           
var highlightLineIds = [];  
var slotPositions = [];     
var highlightedSlot = null; 

// GUI offsets
var guiOffsetX = -10; // move GUI right
var guiOffsetY = 90; // move GUI up

// Generate 36 slot positions in 4 rows × 9 columns
(function generateSlotPositions() {
    var rows = 4;
    var cols = 9;
    var startX = 10 + guiOffsetX;
    var startY = 10 - guiOffsetY;
    var spacingX = 18;  
    var spacingY = 18;  
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            slotPositions.push({
                x: startX + c * spacingX,
                y: startY + r * spacingY
            });
        }
    }
})();

function interact(event) {
    var player = event.player;
    var api = event.API;

    highlightedSlot = null;
    highlightLineIds = [];

    guiRef = api.createCustomGui(176, 160, 0, true, player);

    mySlots = [];
    for (var i = 0; i < slotPositions.length; i++) {
        var pos = slotPositions[i];
        mySlots.push(guiRef.addItemSlot(pos.x, pos.y));
    }

    guiRef.showPlayerInventory(10 + guiOffsetX, 120 - guiOffsetY, false); 
    player.showCustomGui(guiRef);
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
            var x = pos.x - 1;
            var y = pos.y - 1;
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

    if (!slotFound && highlightedSlot != null) {
        if (stack != null && !stack.isEmpty()) {
            try {
                var itemCopy = player.world.createItemFromNbt(stack.getItemNbt());
                var oldSlotItem = highlightedSlot.getStack();
                highlightedSlot.setStack(itemCopy);

                if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
                    player.giveItem(oldSlotItem);
                }

                player.removeItem(stack, stack.getStackSize());
                guiRef.update();
            } catch(e) {}
        } else {
            var oldSlotItem = highlightedSlot.getStack();
            if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
                player.giveItem(oldSlotItem);
                highlightedSlot.setStack(player.world.createItem("minecraft:air", 1));
                guiRef.update();
            }
        }
    }
}


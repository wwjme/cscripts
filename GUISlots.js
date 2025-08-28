var guiRef;                 
var mySlots = [];           
var highlightLineIds = [];  
var slotPositions = [       
    {x: 10, y: 10},
    {x: 40, y: 10},
    {x: 70, y: 10}
];
var highlightedSlot = null; // currently highlighted slot

function interact(event) {
    var player = event.player;
    var api = event.API;

    // Create GUI
    guiRef = api.createCustomGui(176, 166, 0, true, player);

    // Add 3 draggable slots
    mySlots = [];
    for (var i = 0; i < 3; i++) {
        var pos = slotPositions[i];
        mySlots.push(guiRef.addItemSlot(pos.x, pos.y));
    }

    // Show player inventory
    guiRef.showPlayerInventory(10, 50);

    // Open GUI
    player.showCustomGui(guiRef);
}

function customGuiSlotClicked(event) {
    var clickedSlot = event.slot;
    var stack = event.stack;
    var player = event.player;

    // --- If clicked a custom slot, highlight it ---
    var slotFound = false;
    for (var i = 0; i < mySlots.length; i++) {
        if (clickedSlot === mySlots[i]) {
            slotFound = true;
            highlightedSlot = clickedSlot;

            // Clear previous highlights
            if (highlightLineIds.length > 0) {
                for (var j = 0; j < highlightLineIds.length; j++) {
                    try { guiRef.removeComponent(highlightLineIds[j]); } catch(e) {}
                }
                highlightLineIds = [];
            }

            // Draw rectangle around the clicked slot
            var pos = slotPositions[i];
            var x = pos.x;
            var y = pos.y;
            var width = 18;
            var height = 18;
            highlightLineIds.push(guiRef.addColoredLine(1, x, y, x + width, y, 0xFF0000FF, 2));       // Top
            highlightLineIds.push(guiRef.addColoredLine(2, x, y + height, x + width, y + height, 0xFF0000FF, 2)); // Bottom
            highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y + height, 0xFF0000FF, 2));  // Left
            highlightLineIds.push(guiRef.addColoredLine(4, x + width, y, x + width, y + height, 0xFF0000FF, 2)); // Right
            guiRef.update();
            break;
        }
    }

    // --- If clicked inventory item AND a slot is highlighted, transfer item with NBT ---
    if (!slotFound && highlightedSlot != null && stack != null && !stack.isEmpty()) {
        try {
            var nbt = stack.getItemNbt();
            var itemCopy;
            if (nbt != null) {
                itemCopy = player.world.createItemFromNbt(nbt);
            } else {
                itemCopy = player.world.createItem(stack.getName(), stack.getStackSize());
            }

            highlightedSlot.setStack(itemCopy);
            guiRef.update();

            // Remove the same amount from player's inventory
            var removed = player.removeItem(stack, stack.getStackSize());
            if (!removed) {
                player.message("Warning: Could not remove all items from inventory!");
            }

            player.message("Transferred " + stack.getDisplayName() + " to highlighted slot!");
        } catch(e) {
            player.message("Failed to transfer item: " + e);
        }
    }

    // --- Message about clicked slot ---
    if (stack != null && !stack.isEmpty()) {
        player.message("You clicked: " + stack.getDisplayName());
    } else {
        player.message("You clicked an empty slot.");
    }
}

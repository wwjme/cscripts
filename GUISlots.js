var guiRef;                 // global GUI reference
var mySlots = [];           // array to store our 3 special slots
var highlightLineIds = [];  // store colored line IDs for the rectangle
var slotPositions = [       // positions of the 3 slots
    {x: 10, y: 10},
    {x: 40, y: 10},
    {x: 70, y: 10}
];
var highlightedSlot = null; // currently highlighted slot

function interact(event) {
    var player = event.player;
    var api = event.API;

    // Reset highlights and selected slot when opening GUI
    highlightedSlot = null;
    highlightLineIds = [];

    // Create GUI
    guiRef = api.createCustomGui(176, 166, 0, true, player);

    // Add 3 draggable slots
    mySlots = [];
    for (var i = 0; i < 3; i++) {
        var pos = slotPositions[i];
        mySlots.push(guiRef.addItemSlot(pos.x, pos.y));
    }

    // Show player inventory
    guiRef.showPlayerInventory(10, 50, false);

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
            highlightLineIds.push(guiRef.addColoredLine(1, x, y, x + width, y, 0xADD8E6, 2));       // Top
            highlightLineIds.push(guiRef.addColoredLine(2, x, y + height, x + width, y + height, 0xADD8E6, 2)); // Bottom
            highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y + height, 0xADD8E6, 2));  // Left
            highlightLineIds.push(guiRef.addColoredLine(4, x + width, y, x + width, y + height, 0xADD8E6, 2)); // Right
            guiRef.update();
            break;
        }
    }

    // --- If clicked inventory item AND a slot is highlighted, transfer/swap item ---
    if (!slotFound && highlightedSlot != null) {
        if (stack != null && !stack.isEmpty()) {
            try {
                // Copy inventory item including NBT
                var itemCopy = player.world.createItemFromNbt(stack.getItemNbt());
                
                // Swap with slot
                var oldSlotItem = highlightedSlot.getStack();
                highlightedSlot.setStack(itemCopy);

                // Give old slot item back to player if exists
                if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
                    player.giveItem(oldSlotItem);
                }

                // Remove one stack from inventory
                player.removeItem(stack, stack.getStackSize());

                guiRef.update();
                player.message("Transferred " + stack.getDisplayName() + " to highlighted slot!");
            } catch(e) {
                player.message("Failed to transfer item: " + e);
            }
        } else {
            // Clicked empty inventory slot, return highlighted slot item to player
            var oldSlotItem = highlightedSlot.getStack();
            if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
                player.giveItem(oldSlotItem);
                highlightedSlot.setStack(player.world.createItem("minecraft:air", 1)); // clear slot
                guiRef.update();
                player.message("Returned item to player from highlighted slot.");
            }
        }
    }

    // --- Message about clicked slot ---
    if (stack != null && !stack.isEmpty()) {
        player.message("You clicked: " + stack.getDisplayName());
    } else {
        player.message("You clicked an empty slot.");
    }
}

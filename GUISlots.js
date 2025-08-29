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

    highlightedSlot = null;
    highlightLineIds = [];

    guiRef = api.createCustomGui(176, 166, 0, true, player);

    mySlots = [];
    for (var i = 0; i < 3; i++) {
        var pos = slotPositions[i];
        mySlots.push(guiRef.addItemSlot(pos.x, pos.y));
    }

    guiRef.showPlayerInventory(10, 50, false);
    player.showCustomGui(guiRef);
}

function customGuiSlotClicked(event) {
    var clickedSlot = event.slot;
    var stack = event.stack;
    var player = event.player;

    // Highlight clicked custom slot
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
                    // Slot full -> swap stacks
                    highlightedSlot.setStack(stack);
                    player.removeItem(stack, stack.getStackSize());
                    player.giveItem(slotStack);
                    player.message("Slot full! Swapped with your held item.");
                } else {
                    // Add to existing stack
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
                // DIFFERENT ITEM or empty slot: replace
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
        // Clicked empty inventory slot, return highlighted slot item
        var oldSlotItem = highlightedSlot.getStack();
        if (oldSlotItem != null && !oldSlotItem.isEmpty()) {
            player.giveItem(oldSlotItem);
            highlightedSlot.setStack(player.world.createItem("minecraft:air", 1));
            guiRef.update();
            player.message("Returned item to player from highlighted slot.");
        }
    }

    if (stack != null && !stack.isEmpty()) {
        player.message("You clicked: " + stack.getDisplayName());
    } else {
        player.message("You clicked an empty slot.");
    }
}

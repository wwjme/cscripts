var guiRef;      // GUI reference
var mySlot;      // single GUI slot

function interact(event) {
    var player = event.player;
    var api = event.API;

    // Create GUI
    guiRef = api.createCustomGui(176, 166, 0, true, player);

    // Add a single slot at position x=10, y=10
    mySlot = guiRef.addItemSlot(10, 10);

    // Show player inventory
    guiRef.showPlayerInventory(10, 50);

    // Open GUI
    player.showCustomGui(guiRef);
}

function customGuiSlotClicked(event) {
    var stack = event.stack;
    var player = event.player;

    // If clicked an inventory item (not empty)
    if (stack != null && !stack.isEmpty()) {
        try {
            // Copy item including NBT to the GUI slot
            var itemCopy = player.world.createItemFromNbt(stack.getItemNbt());
            mySlot.setStack(itemCopy);

            // Remove item from player's inventory/storage
            player.removeItem(stack.getName(), stack.getStackSize());

            // Update GUI to show the copied item
            guiRef.update();

        } catch (e) {
            player.message("Failed to transfer item: " + e);
        }
    }
}

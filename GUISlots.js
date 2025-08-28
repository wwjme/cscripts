var myGuiSlot; // store the special slot

function interact(event) {
    var player = event.player;
    var api = event.API;

    // Create GUI
    var gui = api.createCustomGui(176, 166, 0, true, player);

    // Add one draggable slot and store its reference
    myGuiSlot = gui.addItemSlot(10, 10);

    // Show player inventory
    gui.showPlayerInventory(10, 50);

    // Open GUI
    player.showCustomGui(gui);
}

function customGuiSlotClicked(event) {
    var clickedSlot = event.slot; // CustomGuiItemSlotWrapper
    var stack = event.stack;
    var player = event.player;
    var api = event.API;

    // Only trigger for our special GUI slot
    if (clickedSlot === myGuiSlot) {
        // Recreate the GUI to add colored rectangle
        var gui = api.createCustomGui(176, 166, 0, true, player);

        // Add the slot again
        myGuiSlot = gui.addItemSlot(10, 10);

        // Draw blue rectangle around the slot
        var x = 10;
        var y = 10;
        var width = 18;
        var height = 18;

        gui.addColoredLine(1, x, y, x + width, y, 0xFF0000FF, 2);       // Top
        gui.addColoredLine(2, x, y + height, x + width, y + height, 0xFF0000FF, 2); // Bottom
        gui.addColoredLine(3, x, y, x, y + height, 0xFF0000FF, 2);  // Left
        gui.addColoredLine(4, x + width, y, x + width, y + height, 0xFF0000FF, 2); // Right

        // Show player inventory
        gui.showPlayerInventory(10, 50);

        // Reopen GUI so rectangle is visible
        player.showCustomGui(gui);

        // Message about clicked slot
        if (stack != null && !stack.isEmpty()) {
            player.message("You clicked the special GUI slot containing: " + stack.getDisplayName());
        } else {
            player.message("You clicked the special GUI slot which is empty.");
        }
    } else {
        // Clicked some other slot (like inventory)
        if (stack != null && !stack.isEmpty()) {
            player.message("You clicked another slot containing: " + stack.getDisplayName());
        } else {
            player.message("You clicked another slot which is empty.");
        }
    }
}

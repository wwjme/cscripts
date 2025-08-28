var myGuiSlot;        // store the special GUI slot
var highlighted = false; // tracks whether the rectangle is visible

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

    // Determine if we should highlight
    if (clickedSlot === myGuiSlot) {
        highlighted = true; // show rectangle
    } else {
        highlighted = false; // remove rectangle
    }

    // Recreate GUI
    var gui = api.createCustomGui(176, 166, 0, true, player);

    // Add the special slot again
    myGuiSlot = gui.addItemSlot(10, 10);

    // Draw rectangle if highlighted
    if (highlighted) {
        var x = 10;
        var y = 10;
        var width = 18;
        var height = 18;

        gui.addColoredLine(1, x, y, x + width, y, 0xFF0000FF, 2);       // Top
        gui.addColoredLine(2, x, y + height, x + width, y + height, 0xFF0000FF, 2); // Bottom
        gui.addColoredLine(3, x, y, x, y + height, 0xFF0000FF, 2);  // Left
        gui.addColoredLine(4, x + width, y, x + width, y + height, 0xFF0000FF, 2); // Right
    }

    // Show player inventory
    gui.showPlayerInventory(10, 50);

    // Reopen GUI
    player.showCustomGui(gui);

    // Send message about clicked slot
    if (stack != null && !stack.isEmpty()) {
        player.message("You clicked: " + stack.getDisplayName());
    } else {
        player.message("You clicked an empty slot.");
    }
}

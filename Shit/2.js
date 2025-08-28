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

    // Remove any clicked inventory item (if not empty)
    if (stack != null && !stack.isEmpty()) {
        player.removeItem(stack.getName(), stack.getStackSize());
    }
}

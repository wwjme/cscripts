var guiRef;                 // global GUI reference
var mySlots = [];           // array to store our 3 special slots
var highlightLineIds = [];  // store colored line IDs for the rectangle
var slotPositions = [       // positions of the 3 slots
    {x: 10, y: 10},
    {x: 40, y: 10},
    {x: 70, y: 10}
];

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

    // --- Clear previous highlight rectangle ---
    if (highlightLineIds.length > 0) {
        for (var i = 0; i < highlightLineIds.length; i++) {
            try { guiRef.removeComponent(highlightLineIds[i]); } catch(e) {}
        }
        highlightLineIds = [];
    }

    // --- Determine which slot was clicked ---
    for (var i = 0; i < mySlots.length; i++) {
        if (clickedSlot === mySlots[i]) {
            var pos = slotPositions[i];
            var x = pos.x;
            var y = pos.y;
            var width = 18;
            var height = 18;

            // Draw rectangle around the clicked slot
            highlightLineIds.push(guiRef.addColoredLine(1, x, y, x + width, y, 0xFF0000FF, 2));       // Top
            highlightLineIds.push(guiRef.addColoredLine(2, x, y + height, x + width, y + height, 0xFF0000FF, 2)); // Bottom
            highlightLineIds.push(guiRef.addColoredLine(3, x, y, x, y + height, 0xFF0000FF, 2));  // Left
            highlightLineIds.push(guiRef.addColoredLine(4, x + width, y, x + width, y + height, 0xFF0000FF, 2)); // Right
            break; // only highlight one slot
        }
    }

    // Update GUI to show changes
    guiRef.update();

    // --- Message about clicked slot ---
    if (stack != null && !stack.isEmpty()) {
        player.message("You clicked: " + stack.getDisplayName());
    } else {
        player.message("You clicked an empty slot.");
    }
}

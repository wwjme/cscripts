function init(e) {
    var npc = e.npc;
    var display = npc.getDisplay();

    // --- Citizen faction ---
    npc.setFaction(1);

    // Male or female (50/50)
    var isMale = Math.random() < 0.5;

    if (isMale) {
        var maleSkins = [
            "cyberpunkskins:textures/b/b01",
            "cyberpunkskins:textures/b/b02",
            "cyberpunkskins:textures/b/b03",
        ];
        var maleNames = [
            "John", "Michael", "David", "Chris", "Daniel", "Alex", "Robert", "James"
        ];

        display.setSkinTexture(randomFrom(maleSkins));
        display.setName(randomFrom(maleNames));

    } else {
        var femaleSkins = [
            "cyberpunkskins:textures/g/g01",
            "cyberpunkskins:textures/g/g02",
            "cyberpunkskins:textures/g/g03",
        ];
        var femaleNames = [
            "Sarah", "Emily", "Anna", "Sophia", "Kate", "Maria", "Laura", "Emma"
        ];

        display.setSkinTexture(randomFrom(femaleSkins));
        display.setName(randomFrom(femaleNames));
    }
}

// --- Helper: Pick random from array ---
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

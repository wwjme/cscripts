function init(e) {
    var npc = e.npc;
    var display = npc.getDisplay();

    // --- Police spawn chance (16%) ---
    if (Math.random() < 0.16) {
        display.setSkinTexture("cyberpunkskins:textures/g1.png");
        display.setName("LCPD");
        npc.setFaction(1); // Police faction
        return;
    }

    // --- Otherwise: Citizen ---
    npc.setFaction(1); // Citizen faction

    // Male or female (50/50)
    var isMale = Math.random() < 0.5;

    if (isMale) {
        var maleSkins = [
            "customnpcs:textures/entity/humanmale/camosteve.png",
            "customnpcs:textures/entity/humanmale/chefsteve.png",
            "customnpcs:textures/entity/humanmale/doctorsteve.png"
        ];
        var maleNames = [
            "John", "Michael", "David", "Chris", "Daniel", "Alex", "Robert", "James"
        ];

        display.setSkinTexture(randomFrom(maleSkins));
        display.setName(randomFrom(maleNames));

    } else {
        var femaleSkins = [
            "customnpcs:textures/entity/humanfemale/camostephenie.png",
            "customnpcs:textures/entity/humanfemale/chefstephanie.png",
            "customnpcs:textures/entity/humanfemale/doctorstephanie.png"
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

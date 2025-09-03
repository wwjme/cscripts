function init(e) {
    var npc = e.npc;
    var display = npc.getDisplay();

    // --- Citizen faction ---
    npc.setFaction(1);

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
            "customnpcs:textures/entity/humanfemale/camostephanie.png",
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

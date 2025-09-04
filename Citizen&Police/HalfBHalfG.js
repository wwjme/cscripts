function init(e) {
    var npc = e.npc;
    var display = npc.getDisplay();

    // --- Citizen faction ---
    npc.setFaction(15);

    // Male or female (50/50)
    var isMale = Math.random() < 0.5;

    if (isMale) {
        // Generate skins b01 → b34
        var maleSkins = [];
        for (var i = 1; i <= 34; i++) {
            var num = (i < 10 ? "0" + i : i); // b01, b02 ... b34
            maleSkins.push("cyberpunkskins:textures/b/b" + num + ".png");
        }

        var maleNames = [
            "John", "Michael", "David", "Chris", "Daniel", "Alex", "Robert", "James",
            "William", "Joseph", "Anthony", "Mark", "Matthew", "Andrew", "Joshua", "Brian",
            "Kevin", "Jason", "Justin", "Ryan", "Brandon", "Jacob", "Nicholas", "Eric",
            "Jonathan", "Stephen", "Larry", "Scott", "Frank", "Tyler", "Dennis", "Jerry",
            "Aaron", "Adam", "Patrick", "Sean", "Zachary", "Nathan", "Samuel", "Kyle",
            "Benjamin", "Paul", "Ethan", "Gregory", "Jordan", "Cameron", "Dylan", "Hunter"
        ];
        display.setModel("customnpcs:Classic");
        display.setSkinTexture(randomFrom(maleSkins));
        display.setName(randomFrom(maleNames));

    } else {
        // Generate skins g01 → g34
        var femaleSkins = [];
        for (var i = 1; i <= 34; i++) {
            var num = (i < 10 ? "0" + i : i); // g01, g02 ... g34
            femaleSkins.push("cyberpunkskins:textures/g/g" + num + ".png");
        }

        var femaleNames = [
            "Sarah", "Emily", "Anna", "Sophia", "Kate", "Maria", "Laura", "Emma",
            "Olivia", "Isabella", "Mia", "Amelia", "Charlotte", "Harper", "Evelyn", "Abigail",
            "Ella", "Grace", "Chloe", "Victoria", "Natalie", "Hannah", "Lily", "Zoe",
            "Samantha", "Leah", "Stella", "Claire", "Audrey", "Savannah", "Brooklyn", "Bella",
            "Lucy", "Avery", "Scarlett", "Aria", "Ellie", "Maya", "Sofia", "Layla",
            "Nora", "Riley", "Hazel", "Aurora", "Violet", "Penelope", "Lillian", "Naomi"
        ];
        display.setModel("customnpcs:Alex");
        display.setSkinTexture(randomFrom(femaleSkins));
        display.setName(randomFrom(femaleNames));
    }
}

// --- Helper: Pick random from array ---
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

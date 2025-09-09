var NpcFOV = 100;
var TeleportDestination = [2380, 43, 955];

// Track which player is being chased
var chasingTarget = null;

// Keep track so we don't scan a player more than once per detection
var scannedPlayers = {};
var isPolice = 1;

function init(e) {
    var npc = e.npc;
    var display = npc.getDisplay();

    // --- Citizen faction ---
    npc.setFaction(17);
    npc.getAi().setAvoidsWater(true);

    if (Math.random() < 0.11) {
        display.setSkinTexture("cyberpunkskins:textures/lcpd.png");
        display.setName("LCPD");
        npc.getAi().setRetaliateType(0);
        npc.getStats().setMaxHealth(100);

        var gun = npc.world.createItem("tacz:modern_kinetic_gun", 1);
        gun.getNbt().putString("GunId", "cyber_armorer:ajax");
        npc.setMainhandItem(gun);
        npc.getInventory().setProjectile(npc.world.createItem("minecraft:gold_nugget", 1));

        npc.getStats().getRanged().setStrength(2);
        npc.getStats().getRanged().setAccuracy(80);
        npc.getStats().getRanged().setRange(100);
        npc.getStats().getRanged().setDelay(1, 1);
        npc.getStats().getRanged().setBurstDelay(1);
        npc.getStats().getRanged().setHasGravity(false);
        npc.getStats().getRanged().setSpeed(40);
        npc.getStats().setAggroRange(100);
        npc.getStats().getRanged().setSound(0, "customnpcs:gun.pistol.shot");
        npc.getStats().getRanged().setSound(1, "");
        npc.getStats().getRanged().setSound(2, "tacz:target_block_hit");
        npc.getStats().getRanged().setMeleeRange(4);
        isPolice = 1;
        return;
    }

    // Male or female (50/50)
    var isMale = Math.random() < 0.5;

    if (isMale) {
        var maleSkins = [];
        for (var i = 1; i <= 34; i++) {
            var num = (i < 10 ? "0" + i : i);
            maleSkins.push("cyberpunkskins:textures/b/b" + num + ".png");
        }

        var maleNames = [
            "John", "Michael", "David", "Chris", "Daniel", "Alex", "Robert", "James",
            "William", "Joseph", "Anthony", "Mark", "Matthew", "Andrew", "Joshua", "Brian",
            "Kevin", "Jason", "Justin", "Ryan", "Brandon", "Jacob", "Nicholas", "Eric",
            "Jonathan", "Stephen", "Larry", "Scott", "Frank", "Tyler", "Dennis", "Jerry",
            "Aaron", "Adam", "Patrick", "Sean", "Zachary", "Nathan", "Samuel", "Kyle",
            "Benjamin", "Paul", "Ethan", "Gregory", "Jordan", "Cameron", "Dylan", "Hunter",
            "Logan", "Adrian", "Connor", "Evan", "Tristan", "Austin", "Shawn", "Colton",
            "Owen", "Landon", "Chad", "Trevor", "Spencer", "Marcus", "Vincent", "Bradley",
            "Peter", "George", "Louis", "Arthur", "Maxwell", "Dean", "Curtis", "Phillip",
            "Craig", "Douglas", "Raymond", "Mitchell", "Derek", "Edwin", "Jonah", "Brady",
            "Cody", "Dustin", "Blake", "Wesley", "Henry", "Oscar", "Malcolm", "Clifford",
            "Harold", "Howard", "Bruce", "Victor", "Jeffrey", "Allen", "Caleb", "Gordon",
            "Neil", "Stuart", "Elliot", "Curt", "Terrence", "Leonard", "Louis", "Randall",
            "Edgar", "Marshall", "Frederick", "Phillip", "Stanley", "Norman", "Wayne", "Glen",
            "Elijah", "Hudson", "Bryce", "Troy", "Keith", "Melvin", "Ralph", "Jared",
            "Joey", "Dominic", "Marco", "Angelo", "Ricky", "Darren", "Clinton", "Damian",
            "Luther", "Francis", "Hugh", "Julian", "Quentin", "Theo", "Silas", "Earl",
            "Harvey", "Eugene", "Casey", "Shane", "Colby", "Grant", "Warren", "Russell",
            "Dwight", "Byron", "Gilbert", "Leon", "Maurice", "Ivan", "Felix", "Alfred"
        ];
        npc.getAi().setRetaliateType(1);
        npc.setMainhandItem(null);
        npc.getStats().setMaxHealth(20);
        display.setSkinTexture(randomFrom(maleSkins));
        display.setName(randomFrom(maleNames));
        isPolice = 0;
    } else {
        var femaleSkins = [];
        for (var i = 1; i <= 34; i++) {
            var num = (i < 10 ? "0" + i : i);
            femaleSkins.push("cyberpunkskins:textures/g/g" + num + ".png");
        }

        var femaleNames = [
            "Sarah", "Emily", "Anna", "Sophia", "Kate", "Maria", "Laura", "Emma",
            "Olivia", "Isabella", "Mia", "Amelia", "Charlotte", "Harper", "Evelyn", "Abigail",
            "Ella", "Grace", "Chloe", "Victoria", "Natalie", "Hannah", "Lily", "Zoe",
            "Samantha", "Leah", "Stella", "Claire", "Audrey", "Savannah", "Brooklyn", "Bella",
            "Lucy", "Avery", "Scarlett", "Aria", "Ellie", "Maya", "Sofia", "Layla",
            "Nora", "Riley", "Hazel", "Aurora", "Violet", "Penelope", "Lillian", "Naomi",
            "Allison", "Madison", "Eleanor", "Paisley", "Camila", "Genesis", "Peyton", "Hailey",
            "Mackenzie", "Skylar", "Kylie", "Alexis", "Autumn", "Eva", "Bailey", "Cora",
            "Jasmine", "Serenity", "Faith", "Trinity", "Makayla", "Gianna", "Sadie", "Alexa",
            "Katherine", "Piper", "Reagan", "Valeria", "Elena", "Clara", "Vivian", "Julia",
            "Lydia", "Isla", "Athena", "Aubrey", "Addison", "Camille", "Rose", "Margaret",
            "Adeline", "Alice", "Eliana", "Valentina", "Willow", "Paislee", "Rylee", "Juliana",
            "Mariah", "Adrianna", "Josephine", "Delilah", "Gabriella", "Emilia", "Daisy", "Arabella",
            "Melody", "Summer", "Dakota", "Harmony", "Kinsley", "Parker", "Tessa", "Freya",
            "Eden", "Hope", "Morgan", "Nicole", "Rebecca", "Rachel", "Vanessa", "Amber",
            "Bianca", "Chelsea", "Whitney", "Heidi", "Jade", "Ivy", "Phoebe", "Danielle",
            "Molly", "Amberly", "Kayla", "Gloria", "Lola", "Anastasia", "Esme", "Megan",
            "Crystal", "Fiona", "Joanna", "Sylvia", "Miriam", "Elise", "Lila", "Cecilia",
            "Miranda", "Noelle", "Priscilla", "Iris", "Angela", "Diana", "Paulina", "Renee"
        ];
        npc.getAi().setRetaliateType(1);
        npc.getStats().setMaxHealth(20);
        display.setModel("customnpcs:customnpcalex");
        display.setSkinTexture(randomFrom(femaleSkins));
        display.setName(randomFrom(femaleNames));
        npc.setMainhandItem(null);
        isPolice = 0;
    }
}

function tick(e) {
    if (isPolice == 1) {
        var npc = e.npc;

        if (chasingTarget == null) {
            var ents = npc.world.getNearbyEntities(npc.getPos(), npc.stats.getAggroRange(), 1); // 1 = players
            for (var i = 0; i < ents.length; i++) {
                var player = ents[i];
                if (CheckFOV(npc, player, NpcFOV) && npc.canSeeEntity(player)) {
                    if (!scannedPlayers[player.getUUID()]) {
                        scannedPlayers[player.getUUID()] = true;

                        var sugarItem = npc.world.createItem("minecraft:sugar", 1);
                        var sugarCount = player.getInventory().count(sugarItem, true, true);

                        if (sugarCount > 0) {
                            player.message("§e[Scanner] NPC detected sugar in your inventory!");
                            npc.say("I see sugar...");
                            chasingTarget = player;
                            npc.getAi().setWalkingSpeed(5);
                        }
                    }
                }
            }
        } else {
            if (!chasingTarget.isAlive()) {
                resetChase(npc, chasingTarget);
                return;
            }

            var pos = chasingTarget.getPos();
            npc.navigateTo(pos.getX(), pos.getY(), pos.getZ(), 10);

            var dist = npc.getPos().distanceTo(pos);

            if (dist > 30) {
                npc.say("Lost sight of " + chasingTarget.getName() + "...");
                resetChase(npc, chasingTarget);
                return;
            }

            if (dist < 4) {
                npc.setAttackTarget(chasingTarget);
            }
        }
    }
}

function meleeAttack(e) {
    var target = e.target;
    var npc = e.npc;

    //  Only handle players
    if (target.getType() == 1) {
        target.setPosition(TeleportDestination[0], TeleportDestination[1], TeleportDestination[2]);
        npc.say("Teleporting " + target.getName() + "!");

        var inv = target.getInventory();
        var size = inv.getSize();
        for (var slot = 0; slot < size; slot++) {
            var item = inv.getSlot(slot);
            if (item != null && item.getName() == "minecraft:sugar") {
                inv.setSlot(slot, null);
            }
        }
        target.message("You've been locked up");

        resetChase(npc, target);
    }
}

function resetChase(npc, player) {
    npc.getAi().setWalkingSpeed(5);
    if (player) {
        scannedPlayers[player.getUUID()] = false;
    }
    chasingTarget = null;
}

function CheckFOV(seer, seen, FOV) {
    var P = seer.getRotation();
    if (P < 0) P = P + 360;
    var rot = Math.abs(GetPlayerRotation(seer, seen) - P);
    if (rot > 180) rot = Math.abs(rot - 360);
    return (rot < FOV / 2);
}

function GetPlayerRotation(npc, player) {
    var dx = npc.getX() - player.getX();
    var dz = player.getZ() - npc.getZ();
    var angle;
    if (dz >= 0) {
        angle = (Math.atan(dx / dz) * 180 / Math.PI);
        if (angle < 0) angle = 360 + angle;
    } else {
        dz = -dz;
        angle = 180 - (Math.atan(dx / dz) * 180 / Math.PI);
    }
    return angle;
}

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

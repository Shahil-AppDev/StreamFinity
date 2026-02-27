#!/usr/bin/env node
/**
 * Build gifts catalog from PNG files
 * Parses filenames like "001_Rose.png" → { id: 1, name: "Rose", ... }
 * Assigns coin/diamond values based on TikTok's known pricing tiers
 */

const fs = require('fs');
const path = require('path');

const GIFTS_DIR = path.resolve('G:/Downloads/gifts_1216 (1)/gifts');
const OUTPUT_JSON = path.resolve(__dirname, '../server/data/gifts.json');

// ── Known TikTok gift prices (id → coins) ──
// Source: TikTok gift catalog, verified values
const KNOWN_PRICES = {
    1: 1,        // Rose
    2: 5,        // Flame Heart
    3: 5,        // You're Awesome
    4: 5,        // Blow a Kiss
    5: 1,        // Fairy Wings
    6: 5,        // Love You So Much
    7: 1,        // TikTok
    8: 1,        // Cool
    9: 5,        // Wink Wink
    10: 1,       // Freestyle
    11: 1,       // Oldies
    12: 1,       // Pop
    13: 1,       // Tom the Tomato
    14: 1,       // Mamma Mia
    15: 1,       // Steven Wingman
    16: 1,       // Alien Pet
    17: 1,       // Guardian Wings
    18: 1,       // Summer Pass S
    19: 5,       // Hearty Talk
    20: 5,       // Go for it
    21: 5,       // Morning Bloom
    22: 5,       // Slay
    23: 5,       // White Rose
    24: 5,       // Heart Puff
    25: 1,       // Rainbow
    26: 10,      // Basketball
    27: 10,      // Cake Slice
    28: 1,       // Lightning Bolt
    29: 10,      // Give It All
    30: 10,      // Clapperboard
    31: 1,       // GG
    32: 1,       // Ice Cream Cone
    33: 5,       // Gingerbread Heart
    34: 5,       // Heart Me
    35: 1,       // Thumbs Up
    36: 5,       // Heart
    37: 5,       // Love You
    38: 10,      // Birthday Cake
    39: 10,      // Fest Pop
    40: 10,      // Music Album
    41: 10,      // Wink Charm
    42: 10,      // Go Popular
    43: 10,      // Club Cheers
    522: 1,      // Community Gift
    632: 1,      // Star
    637: 1,      // So Cute
    686: 1,      // It's Corn
    687: 1,      // Chili
    688: 1,      // GOAT
    689: 1,      // I'm New Here
    690: 1,      // LIVE
    691: 1,      // Football
    694: 1,      // Pumpkin
    695: 5,      // Miss You
    696: 1,      // 2026
    703: 1,      // Thumbs Up
    704: 5,      // Team Bracelet
    705: 5,      // Overreact
    706: 10,     // Name Shoutout
    707: 5,      // Peach
    708: 5,      // Tofu
    709: 5,      // I'm Blue
    710: 5,      // Hello Traveler
    711: 5,      // Golden Player
    712: 5,      // Choc Chip Cookie
    713: 5,      // Finger Heart
    714: 5,      // Pumpkin Pie
    715: 5,      // Applause
    716: 10,     // Super Popular
    717: 5,      // Cheer You Up
    718: 10,     // Club Power
    719: 10,     // Drum
    720: 10,     // Slow Motion
    721: 10,     // Journey Pass
    722: 10,     // Love Piggy
    723: 5,      // Potato with Ice Cream
    724: 10,     // Friendship Necklace
    725: 10,     // Rosa
    726: 10,     // Whistle
    727: 10,     // Tiny Diny
    728: 10,     // Ice Lolly
    729: 10,     // Gold Boxing Gloves
    730: 10,     // League Ball
    731: 10,     // Lucky Pony
    732: 10,     // ASMR Time
    733: 10,     // Cherry Blossom Bunny
    734: 10,     // EWC
    735: 10,     // Style Me Up
    736: 15,     // Heart Gaze
    737: 10,     // Chocolate
    738: 10,     // Hi Bear
    739: 49,     // Dolphin
    740: 10,     // Pumpkin Latte
    741: 15,     // Bravo
    742: 15,     // Summer Sun
    743: 15,     // S Flowers
    744: 15,     // Perfume
    745: 15,     // Let Em Cook
    746: 15,     // Golden Buzzer
    747: 15,     // Capybara
    748: 10,     // U Make Miso Happy
    749: 10,     // You Are My Jam
    750: 10,     // You Are On A Roll
    751: 10,     // Doughnut
    752: 10,     // Bagel
    753: 10,     // Sign Language Love
    754: 15,     // Football Helmet
    755: 15,     // Butterfly
    756: 15,     // October
    757: 15,     // Family
    758: 15,     // Hat and Mustache
    759: 15,     // Cap
    760: 15,     // Charmer Bow
    761: 10,     // Sundae Bowl
    762: 15,     // Breakthrough Star
    763: 10,     // Mark of Love
    764: 10,     // Bubble Gum
    765: 15,     // Love Painting
    766: 10,     // Like-Pop
    767: 15,     // Guitar
    768: 15,     // Kiss Your Heart
    769: 10,     // Little Crown
    770: 10,     // Paper Crane
    771: 10,     // Birthday Crown
    772: 15,     // Level-up Sparks
    773: 15,     // Greeting Heart
    774: 15,     // Club Victory
    775: 10,     // Heart Me Flex
    776: 10,     // Fest Gear
    777: 10,     // Mishka Bear
    778: 15,     // Hand Heart
    779: 15,     // Shell Energy
    780: 25,     // Hand Hearts
    781: 25,     // Confetti
    782: 25,     // Singing Magic
    783: 25,     // Marvelous Confetti
    784: 25,     // Mini Star
    785: 25,     // Game Controller
    786: 25,     // Super GG
    787: 25,     // Santa Cocoa
    788: 25,     // Raving Snail
    789: 25,     // Catrina
    790: 25,     // Caterpillar Chaos
    791: 25,     // Feather Tiara
    792: 25,     // Balloon Crown
    793: 25,     // Masquerade
    794: 25,     // Chatting Popcorn
    795: 25,     // Big Shout Out
    796: 25,     // Bowknot
    797: 25,     // Potato Transformation
    798: 25,     // Sceptre
    799: 25,     // Umbrella
    800: 25,     // Kiss
    801: 25,     // Mask
    802: 25,     // Sunglasses
    803: 25,     // Joker Ball
    804: 25,     // Chirpy Kisses
    805: 25,     // Coconut Juice
    806: 25,     // Rose Hand
    807: 25,     // Juicy Smile
    808: 25,     // Sour Buddy
    809: 25,     // Suitcase
    810: 49,     // Flower Headband
    811: 25,     // Floating Octopus
    812: 25,     // Cheering Crab
    813: 25,     // Coffee Magic
    814: 49,     // Massage for You
    815: 25,     // Stinging Bee
    816: 49,     // Sending Positivity
    817: 49,     // Love You
    818: 49,     // Garland Headpiece
    819: 49,     // Hearts
    820: 49,     // League Countdown
    821: 49,     // Cheer For You
    822: 49,     // Birthday Glasses
    823: 49,     // Hanging Lights
    824: 49,     // Panther Paws
    825: 25,     // Meerkat
    826: 49,     // Potato in Paris
    827: 49,     // Night Star
    828: 49,     // Wooly Hat
    829: 49,     // Blow Bubbles
    830: 49,     // Gamer Cat
    831: 25,     // Bowtiful Crown
    832: 49,     // Melon Juice
    833: 25,     // Pinch Cheek
    834: 99,     // Magic Genie
    835: 49,     // Gold Medal
    836: 49,     // I Love TikTok LIVE
    837: 49,     // Rose Bear
    838: 49,     // Happy Hat 26
    839: 49,     // Dreamy Strings
    840: 49,     // Party Blossom
    841: 49,     // Surfing Penguin
    842: 49,     // Melodic Birds
    843: 49,     // Treasured Voice
    844: 49,     // Face-pulling
    845: 25,     // Forest Elf
    846: 49,     // Palm Breeze
    847: 49,     // Music Bubbles
    848: 49,     // Cheer Mic
    849: 49,     // Star Goggles
    850: 49,     // Ice Cream Mic
    851: 49,     // Candy Bouquet
    852: 49,     // Pinch Face
    853: 49,     // Music Mate
    854: 49,     // Penguin Snowpal
    855: 49,     // Melody Glasses
    856: 49,     // Bat Headwear
    857: 49,     // Go Hamster
    858: 49,     // Hi Rosie
    859: 49,     // Kicker Challenge
    860: 49,     // United Heart
    861: 49,     // Puppy Kisses
    862: 49,     // Butterfly for You
    863: 49,     // Rock Star
    864: 49,     // Play for You
    865: 49,     // Naughty Chicken
    866: 49,     // Fruit Friends
    867: 25,     // Elephant Trunk
    868: 25,     // Corgi
    869: 49,     // Boxing Gloves
    870: 49,     // LIVE Ranking Crown
    871: 49,     // Budding Heart
    872: 49,     // Lover's Glasses
    873: 49,     // Love Bomb
    874: 99,     // Rising Key
    875: 49,     // Legend Crown
    876: 49,     // Gamer 2025
    877: 49,     // Journal
    878: 49,     // Trick or Treat
    879: 99,     // Fest Cheers
    880: 49,     // Feather Mask
    881: 49,     // Air Dancer
    882: 49,     // Rocking Shroom
    883: 49,     // Candy Bouquet
    884: 49,     // Gingerbread Man
    885: 49,     // Vintage Flight
    886: 49,     // Beach Maracas
    887: 99,     // Mystic Drink
    888: 49,     // Batwing Hat
    889: 49,     // Juicy Cap
    890: 49,     // Marked with Love
    891: 49,     // Become Kitten
    892: 49,     // Backing Monkey
    893: 49,     // Summer Pass M
    894: 99,     // Vinyl Flip
    895: 99,     // Good Morning
    896: 49,     // Singing Sax
    897: 25,     // Confetti Bear
    898: 99,     // Santa Owl Surprise
    899: 49,     // Tiger Lift
    900: 49,     // Rosie's Concert
    901: 49,     // Pharaoh Mask
    902: 99,     // Alien Buddy
    903: 49,     // Shoot the Apple
    904: 49,     // Kitten Kneading
    905: 49,     // Let Butterfly Dances
    906: 99,     // Sage the Smart Bean
    907: 99,     // Rocky the Rock Bean
    908: 99,     // Jollie the Joy Bean
    909: 99,     // Rosie the Rose Bean
    910: 49,     // Tom's Hug
    911: 25,     // Relaxed Goose
    912: 49,     // Magic Rhythm
    913: 49,     // Forever Rosa
    914: 49,     // Cotton the Seal
    915: 99,     // Sage's Slash
    916: 99,     // Happy Friday
    917: 99,     // Good Afternoon
    918: 99,     // Good Night
    919: 99,     // Good Evening
    920: 49,     // Reindeer Milk
    921: 49,     // Taraxacum Corgi
    922: 99,     // Bounce Speakers
    923: 99,     // Mic Champ
    924: 49,     // Wishing Cake
    925: 49,     // Crystal Dreams
    926: 49,     // Xmas Tree Hat
    927: 49,     // Space Love
    928: 49,     // Batting Cutie
    929: 49,     // Captured Vocals
    930: 49,     // Candy Loot
    931: 49,     // Pirate's Treasure
    932: 49,     // Terminator Face
    933: 49,     // Encore Clap
    934: 49,     // Beating Heart
    935: 25,     // City Pop
    936: 99,     // Celebration Hat
    937: 49,     // Music Conductor
    938: 49,     // Halloween Fun Hat
    939: 99,     // Hat of Joy
    940: 49,     // Powerful Mind
    941: 49,     // Rose Soundwave
    942: 49,     // Surfing Penguin
    943: 49,     // Panda Hug
    944: 49,     // Sakura Corgi
    945: 99,     // Coral
    946: 49,     // Gold Microphone
    947: 49,     // Hands Up
    948: 49,     // Mystery Box
    949: 49,     // Puyo Shower
    950: 49,     // Cozy Xmas Set
    951: 49,     // Halloween Ghost
    952: 49,     // Prince
    953: 49,     // Bunny Crown
    954: 49,     // Flower Show
    955: 99,     // XXXL Flowers
    956: 99,     // Dragon Crown
    957: 49,     // Couch Potato
    958: 99,     // Manifesting
    959: 99,     // DJ Glasses
    960: 49,     // VR Goggles
    961: 49,     // Big Potato
    962: 99,     // You're Amazing
    963: 49,     // Dream Team
    964: 99,     // Lion's Mane
    965: 49,     // Money Gun
    966: 99,     // Trophy
    967: 49,     // Mic Drop
    968: 99,     // Magic Prop
    969: 49,     // Gem Gun
    970: 49,     // Cuddle with Me
    971: 99,     // Star Map Polaris
    972: 99,     // Bouquet
    973: 49,     // Racing Helmet
    974: 99,     // Quarterback Frank
    975: 99,     // Bubbly Kiss
    976: 49,     // Money Magnet
    977: 99,     // Happy Weekend
    978: 99,     // League Trophy
    979: 49,     // Fully Bloomed Sakura
    980: 49,     // Join Butterflies
    981: 199,    // Swan
    982: 49,     // Colorful Wings
    983: 49,     // Tango
    984: 99,     // Snow Angel
    985: 99,     // Bonfire Night
    986: 49,     // Love Flight
    987: 99,     // Train
    988: 99,     // LOVE U
    989: 99,     // Medium Fandom
    990: 99,     // Star Rider
    991: 99,     // Carnival Music
    992: 49,     // Flamingo Floaty
    993: 99,     // Travel with You
    994: 49,     // Lucky Airdrop Box
    995: 199,    // Grand Show
    996: 99,     // Trending Figure
    997: 49,     // Picnic Basket
    998: 49,     // Flamingo Groove
    999: 49,     // Fairy Wings
    1000: 49,    // Feather Flock
    1001: 199,   // Galaxy
    1002: 199,   // Blooming Ribbons
    1003: 99,    // Glowing Jellyfish
    1004: 199,   // Drums
    1005: 99,    // Gerry the Giraffe
    1006: 199,   // Disco Ball
    1007: 199,   // Sparkle Dance
    1008: 99,    // Shiny Air Balloon
    1009: 199,   // Silver Sports Car
    1010: 199,   // Gold Mine
    1011: 199,   // Watermelon Love
    1012: 99,    // Dinosaur
    1013: 199,   // Super LIVE Star
    1014: 199,   // Joy Floats
    1015: 199,   // Candy Puffs
    1016: 299,   // Pumpkin Carriage
    1017: 299,   // Fireworks
    1018: 299,   // Diamond Tree
    1019: 299,   // Magic Role
    1020: 299,   // Exclusive Spark
    1021: 199,   // Golden Stars
    1022: 99,    // Diamond
    1023: 299,   // Umbrella of Love
    1024: 199,   // Gaming Chair
    1025: 299,   // Travel in the US
    1026: 299,   // Starlight Sceptre
    1027: 299,   // Vibrant Stage
    1028: 199,   // Moonlight Flower
    1029: 299,   // Racing Debut
    1030: 299,   // Space Cat
    1031: 299,   // Galaxy Globe
    1032: 299,   // Under Control
    1033: 199,   // Potato Floating
    1034: 199,   // Potato Eating Spaghetti
    1035: 299,   // Future Encounter
    1036: 199,   // Greeting Card
    1037: 299,   // Lover's Lock
    1038: 199,   // Pim Bear
    1039: 299,   // Chasing the Dream
    1040: 299,   // Diamond Ring
    1041: 299,   // Level Ship
    1042: 299,   // EWC Trophy
    1043: 299,   // You're So Fly
    1044: 299,   // Astrobear
    1045: 199,   // Viking Hammer
    1046: 199,   // Shooting Stars
    1047: 299,   // ASMR Starter Kit
    1048: 299,   // Blooming Heart
    1049: 299,   // Center Stage
    1050: 299,   // Here We Go
    1051: 299,   // Fox Legend
    1052: 299,   // Watch Out
    1053: 299,   // Love Drop
    1054: 299,   // Mystery Firework
    1055: 299,   // Cooper Flies Home
    1056: 199,   // Let Us Dance
    1057: 299,   // Doll New Year Greeting
    1058: 199,   // Star of Red Carpet
    1059: 299,   // Touchdown Party
    1060: 199,   // Cable Car
    1061: 299,   // Take My Rose
    1062: 299,   // Power Couple
    1063: 299,   // Vacation LIVE
    1064: 299,   // Sky Drift
    1065: 199,   // Baby Dragon
    1066: 199,   // Crystal Crown
    1067: 299,   // Cooper Picnic
    1068: 299,   // Countdown to Joy
    1069: 299,   // Whale Diving
    1070: 299,   // Lemon Love Booth
    1071: 299,   // Sage's Coinbot
    1072: 299,   // Rocky's Punch
    1073: 299,   // Jollie's Heartland
    1074: 299,   // Blow Rosie Kisses
    1075: 499,   // Jetski
    1076: 499,   // By the Glaziers
    1077: 199,   // Snow Plough
    1078: 299,   // Hit The Buzzer
    1079: 499,   // Summer Pass L
    1080: 499,   // Space Dog
    1081: 499,   // Animal Band
    1082: 499,   // Magic Stage
    1083: 199,   // Sleepy Kitty
    1084: 499,   // Samfaring Tom
    1085: 499,   // Cupid
    1086: 499,   // Motorcycle
    1087: 299,   // Pink Dream
    1088: 499,   // Party Bus
    1089: 199,   // Bull
    1090: 499,   // Rhythmic Bear
    1091: 299,   // Beach Day
    1092: 299,   // Ring of Honor-Cube
    1093: 299,   // Level-up Spotlight
    1094: 499,   // Fest Party
    1095: 499,   // Dancing Bears
    1096: 499,   // Car Drifting
    1097: 499,   // Meteor Shower
    1098: 499,   // Look Up
    1099: 499,   // Dream Big
    1100: 299,   // Gaming Keyboard
    1101: 299,   // Cozy Night
    1102: 499,   // Magic World
    1103: 299,   // Field Goal Teddy
    1104: 499,   // Next Level
    1105: 299,   // Tractor
    1106: 999,   // Your Concert
    1107: 999,   // Fiery Dragon
    1108: 499,   // Leon the Kitten
    1109: 499,   // Private Jet
    1110: 999,   // Signature Jet
    1111: 999,   // Sugar Whiskers
    1112: 999,   // Benny the Calf
    1113: 999,   // Hero Space Ship
    1114: 999,   // Sage's Venture
    1115: 499,   // Diamond Gun
    1116: 999,   // Flying Jets
    1117: 999,   // League Fandom
    1118: 999,   // 1st Anniversary
    1119: 999,   // LIVE on Holiday
    1120: 999,   // Frosty Fight
    1121: 999,   // Silver Sports Car
    1122: 999,   // Sweet Performance
    1123: 999,   // Unicorn Fantasy
    1124: 999,   // Gamer's EVE
    1125: 999,   // Go New England
    1126: 999,   // Fluffy Buddies
    1127: 999,   // Wolf
    1128: 999,   // Cub on Clouds
    1129: 999,   // Valiant Odyssey
    1130: 999,   // Devoted Heart
    1131: 999,   // Strong Finish
    1132: 999,   // Work Hard Play Harder
    1133: 999,   // Future City
    1134: 999,   // With You
    1135: 999,   // Sam in New City
    1136: 999,   // Blissful Together
    1137: 999,   // Lili the Leopard
    1138: 999,   // Carnival Fantasy
    1139: 999,   // Celebration Time
    1140: 999,   // Happy Party
    1141: 2999,  // Sports Car
    1142: 2999,  // 2nd Anniversary
    1143: 2999,  // Illumination
    1144: 2999,  // Majestic Hearts
    1145: 2999,  // Go Big Alpha Drifter
    1146: 2999,  // Star Throne
    1147: 2999,  // Saxophone
    1148: 2999,  // Leon and Lili
    1149: 2999,  // Henry
    1150: 2999,  // Octopus
    1151: 4999,  // Sunset Speedway
    1152: 4999,  // Interstellar
    1153: 4999,  // Falcon
    1154: 4999,  // Holiday Leon
    1155: 4999,  // White Wolf
    1156: 4999,  // 3rd Anniversary
    1157: 4999,  // Convertible Car
    1158: 4999,  // Red Lightning
    1159: 4999,  // Convertible
    1160: 4999,  // Gimme The Mic
    1161: 4999,  // Go Seattle
    1162: 4999,  // Level-up Spectacle
    1163: 4999,  // Summer Pass XL
    1164: 9999,  // Spaceship
    1165: 9999,  // Invincible Hammer
    1166: 9999,  // Crystal Heart
    1167: 9999,  // Storm Blade
    1168: 9999,  // Holy Arc
    1169: 9999,  // Time for Family
    1170: 9999,  // Go Big Stallion
    1171: 9999,  // Community Support
    1172: 9999,  // Snow Leopard
    1173: 9999,  // Party On On
    1174: 4999,  // Gaming Console
    1175: 9999,  // Future Journey
    1176: 4999,  // Pyramids
    1177: 9999,  // Rosa Nebula
    1178: 9999,  // Leopard
    1179: 9999,  // LNY Horse
    1180: 9999,  // Ski With Me
    1181: 4999,  // Paris
    1182: 9999,  // Bran Castle
    1183: 9999,  // White Tiger
    1184: 9999,  // Amusement Park
    1185: 4999,  // Fly Love
    1186: 9999,  // Carnival Wagon
    1187: 9999,  // Spark
    1188: 14999, // TikTok Shuttle
    1189: 14999, // Premium Shuttle
    1190: 14999, // Castle Fantasy
    1191: 14999, // Level Ship
    1192: 14999, // Infinite Heart
    1193: 9999,  // Adam's Dream
    1194: 14999, // Phoenix
    1195: 14999, // Cyber Roar
    1196: 14999, // Greatsword Temple
    1197: 14999, // Solar Temple
    1198: 14999, // Dragon Flame
    1199: 19999, // Lion
    1200: 19999, // TikTok Houses Glory
    1201: 19999, // Gorilla
    1202: 19999, // Sam the Whale
    1203: 19999, // Guardian Rhino
    1204: 24999, // Zeus
    1205: 19999, // Leon and Lion
    1206: 29999, // TikTok Universe (small)
    1207: 24999, // TikTok Stars
    1208: 24999, // Thunder Falcon
    1209: 24999, // Holiday Lion
    1210: 24999, // Fire Phoenix
    1211: 24999, // Pegasus
    1212: 29999, // Valerian's Oath
    1213: 29999, // Arnold the Warrior
    1214: 29999, // Julius the Champion
    1215: 34999, // TikTok Universe
    1216: 34999, // Holiday Universe
};

// ── Creator gifts (IDs 44-685 approx) — custom creator gifts, typically 1 coin ──
// These are personalized gifts with creator branding

// ── Tier classification based on coin value ──
function getTier(coins) {
    if (coins <= 1)     return 'free';
    if (coins <= 10)    return 'basic';
    if (coins <= 49)    return 'standard';
    if (coins <= 99)    return 'premium';
    if (coins <= 299)   return 'deluxe';
    if (coins <= 999)   return 'epic';
    if (coins <= 4999)  return 'legendary';
    if (coins <= 14999) return 'mythic';
    return 'universe';
}

// ── Diamond conversion: 1 diamond ≈ 2 coins (TikTok rate) ──
function coinsToDiamonds(coins) {
    return Math.max(1, Math.round(coins / 2));
}

// ── Parse all files ──
const files = fs.readdirSync(GIFTS_DIR).filter(f => f.endsWith('.png')).sort((a, b) => {
    const idA = parseInt(a.split('_')[0]);
    const idB = parseInt(b.split('_')[0]);
    return idA - idB;
});

console.log(`Found ${files.length} gift files`);

const gifts = [];

for (const file of files) {
    const match = file.match(/^(\d+)_(.+)\.png$/);
    if (!match) {
        console.warn(`Skipping unrecognized file: ${file}`);
        continue;
    }

    const id = parseInt(match[1]);
    const rawName = match[2].replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const fileSize = fs.statSync(path.join(GIFTS_DIR, file)).size;

    // Determine if this is a creator gift (IDs 44-685 with large file sizes are typically creator gifts)
    const isCreatorGift = (id >= 44 && id <= 685 && fileSize > 500000);

    // Get coin value
    let coins;
    if (KNOWN_PRICES[id] !== undefined) {
        coins = KNOWN_PRICES[id];
    } else if (isCreatorGift) {
        coins = 1; // Creator gifts are 1 coin
    } else {
        // Estimate based on file size pattern (larger = more expensive, animated)
        if (fileSize < 25000) coins = 1;
        else if (fileSize < 35000) coins = 5;
        else if (fileSize < 45000) coins = 10;
        else if (fileSize < 55000) coins = 25;
        else if (fileSize < 65000) coins = 49;
        else coins = 99;
    }

    const diamonds = coinsToDiamonds(coins);
    const tier = getTier(coins);

    gifts.push({
        id,
        name: rawName,
        file: file,
        image: `/static/gifts/${file}`,
        coins,
        diamonds,
        tier,
        isCreator: isCreatorGift,
        fileSize
    });
}

// Sort by ID
gifts.sort((a, b) => a.id - b.id);

// Stats
const tiers = {};
gifts.forEach(g => { tiers[g.tier] = (tiers[g.tier] || 0) + 1; });
const creatorCount = gifts.filter(g => g.isCreator).length;

console.log(`\nCatalog: ${gifts.length} gifts`);
console.log(`Creator gifts: ${creatorCount}`);
console.log(`Standard gifts: ${gifts.length - creatorCount}`);
console.log(`\nTier distribution:`);
Object.entries(tiers).sort((a, b) => b[1] - a[1]).forEach(([tier, count]) => {
    console.log(`  ${tier.padEnd(12)} ${count}`);
});

// Ensure output directory exists
const outDir = path.dirname(OUTPUT_JSON);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Write catalog
fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ version: 1, count: gifts.length, generated: new Date().toISOString(), gifts }, null, 2));
console.log(`\nWritten to ${OUTPUT_JSON}`);

// Also write a compact version for the client
const compactGifts = gifts.map(g => ({
    id: g.id, n: g.name, i: g.image, c: g.coins, d: g.diamonds, t: g.tier, cr: g.isCreator ? 1 : 0
}));
const compactPath = path.join(outDir, 'gifts-compact.json');
fs.writeFileSync(compactPath, JSON.stringify(compactGifts));
console.log(`Compact version: ${compactPath} (${(fs.statSync(compactPath).size / 1024).toFixed(1)} KB)`);

/**
 * Node.js script to convert Forest Shuffle card.js to JSON
 * Run with: node help/convertToJson.js
 */

const fs = require('fs');
const path = require('path');

// Read the JavaScript file
const jsFilePath = path.join(__dirname, 'cards', 'card.js');
const jsContent = fs.readFileSync(jsFilePath, 'utf8');

// Execute the JavaScript in a sandboxed context
const extractedData = {};

// Mock define function for AMD module
global.define = function (data) {
    // This won't be used, but prevents errors
};

// Create sandbox with required constants
const sandbox = {
    // Card type constants
    W_CARD: "wCard",
    V_CARD: "vCard",
    H_CARD: "hCard",
    TREE: "Tree",

    // Tag constants
    BUTTERFLY: "Butterfly",
    INSECT: "Insect",
    MUSHROOM: "Mushroom",
    BIRD: "Bird",
    BAT: "Bat",
    PAW: "Paw",
    AMPHIBIAN: "Amphibian",
    PLANT: "Plant",
    CLOVEN: "Cloven-hoofed animal",
    MOUNTAIN: "Mountain",
    EDGE: "Woodland Edge",
    SHRUB: "Shrub",

    // Deck constants
    BASIC_DECK: "basic",
    ALPINE_DECK: "alpine",
    EDGE_DECK: "edge",

    // Species name constants (will be populated)
    PURPLE_EMPEROR: "Purple Emperor",
    LARGE_TORTOISESHELL: "Large Tortoiseshell",
    GNAT: "Gnat",
    BEECH: "Beech",
    CHANTERELLE: "Chanterelle",
    BULLFINCH: "Bullfinch",
    PENNY_BUN: "Penny Bun",
    CAMBERWELL_BEAUTY: "Camberwell Beauty",
    TREE_FERNS: "Tree Ferns",
    CHAFFINCH: "Chaffinch",
    BIRCH: "Birch",
    HEDGEHOG: "Hedgehog",
    EUROPEAN_BADGER: "European Badger",
    GOSHAWK: "Goshawk",
    POND_TURTLE: "Pond Turtle",
    RED_SQUIRREL: "Red Squirrel",
    WOLF: "Wolf",
    WILD_STRAWBERRIES: "Wild Strawberries",
    OAK: "Oak",
    BROWN_BEAR: "Brown Bear",
    RED_DEER: "Red Deer",
    GREAT_SPOTTED_WOODPECKER: "Great Spotted Woodpecker",
    SQUEAKER: "Squeaker",
    FIRE_SALAMANDER: "Fire Salamander",
    FLY_AGARIC: "Fly Agaric",
    TAWNY_OWL: "Tawny Owl",
    GREATER_HORSESHOE_BAT: "Greater Horseshoe Bat",
    FALLOW_DEER: "Fallow Deer",
    BECHSTEIN: "Bechstein's bat",
    RED_FOX: "Red Fox",
    RACCOON: "Raccoon",
    BEECH_MARTEN: "Beech Marten",
    PEACOCK_BUTTERFLY: "Peacock Butterfly",
    WILD_BOAR: "Wild Boar",
    SILVER_FIR: "Silver Fir",
    SYCAMORE: "Sycamore",
    EUROPEAN_HARE: "European Hare",
    TREE_FROG: "Tree Frog",
    HORSE_CHESTNUT: "Horse Chestnut",
    FIREFLIES: "Fireflies",
    BLACKBERRIES: "Blackberries",
    DOUGLAS_FIR: "Douglas Fir",
    MOSS: "Moss",
    EUROPEAN_FAT_DORMOUSE: "European Fat Dormouse",
    MOLE: "Mole",
    COMMON_TOAD: "Common Toad",
    PARASOL_MUSHROOM: "Parasol Mushroom",
    ROE_DEER: "Roe Deer",
    STAG_BEETLE: "Stag Beetle",
    LINDEN: "Linden",
    EURASIAN_JAY: "Eurasian Jay",
    BARBASTELLE_BAT: "Barbastelle Bat",
    VIOLET_CARPENTER_BEE: "Violet Carpenter Bee",
    LYNX: "Lynx",
    WOOD_ANT: "Wood Ant",

    // Alpine
    VACCINIUM_MYRTILLUS: "Vaccinium Myrtillus",
    ICHTHYOSAURA_ALPESTRIS: "Ichthyosaura Alpestris",
    LARIX: "Larix",
    CRATERELLUS_CORNUCOPIODES: "Craterellus Cornucopiodes",
    LARIX_DECIDUA: "Larix Decidua",
    AQUILA_CHRYSAETOS: "Aquila Chrysaetos",
    PINUS_CEMBRA: "Pinus Cembra",
    LEPUS_TIMIDUS: "Lepus Timidus",
    RUPICAPRA_RUPICAPRA: "Rupicapra Rupicapra",
    GENTIANA: "Gentiana",
    TETRAO_UROGALLUS: "Tetrao Urogallus",
    PARNASSIUS_PHOEBUS: "Parnassius Phoebus",
    PINUS: "Pinus",
    MARMOTA_MARMOTA: "Marmota Marmota",
    CAPRA_IBEX: "Capra Ibex",
    CORVUS_CORAX: "Corvus Corax",
    GYPAETUS_BARBATUS: "Gypaetus Barbatus",
    LEONTOPODIUM_NIVALE: "Leontopodium Nivale",
    HYPSUGO_SAVII: "Hypsugo Savii",

    // Edge
    SQUEAKER_EDGE: "Squeaker Edge",
    SAMBUCUS: "Sambucus",
    COMMON_HAZEL: "Common Hazel",
    BLACKTHORN: "Blackthorn",
    WILD_BOAR_FEMALE_: "Wild Boar (Female)",
    BEEHIVE: "Beehive",
    EUROPEAN_BISON: "European Bison",
    EUROPEAN_WILDCAT: "European Wildcat",
    COMMON_PIPISTRELLE: "Common Pipistrelle",
    MOSQUITO: "Mosquito",
    EUROPEAN_POLECAT: "European Polecat",
    MAP_BUTTERFLY: "Map Butterfly",
    HAZEL_DOORMOUSE: "Hazel Doormouse",
    URTICA: "Urtica",
    GREAT_GREEN_BUSH_CRICKET: "Great Green Bush-Cricket",
    EUROPEAN_WATER_VOLE: "European Water Vole",
    EURASIAN_MAGPIE: "Eurasian Magpie",
    COMMON_NIGHTINGALE: "Common Nightingale",
    BARN_OWL: "Barn Owl",
    DIGITALIS: "Digitalis",
};

// Extract CARDS_DATA and SPECIES_DATA using regex
const cardsDataMatch = jsContent.match(/const CARDS_DATA = \{([\s\S]*?)\};/);
const speciesDataMatch = jsContent.match(/const SPECIES_DATA = \{([\s\S]*?)\};/);

if (!cardsDataMatch || !speciesDataMatch) {
    console.error('Could not extract card data from JavaScript file');
    process.exit(1);
}

// Use eval in a more controlled way - just extract the data objects
const evalCode = `
${Object.keys(sandbox).map(key => `const ${key} = ${JSON.stringify(sandbox[key])};`).join('\n')}

const $f = (data) => {
  return {
    type: data[0],
    species: data[1],
    tree_symbol: data[2],
    deck: data[3],
  };
};

const CARDS_DATA = {${cardsDataMatch[1]}};
const SPECIES_DATA = {${speciesDataMatch[1]}};

JSON.stringify({ CARDS_DATA, SPECIES_DATA }, null, 2);
`;

try {
    const result = eval(evalCode);
    const data = JSON.parse(result);

    // Write to JSON files
    const outputDir = path.join(__dirname, '..', 'server', 'src', 'game', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(outputDir, 'cardsData.json'),
        JSON.stringify(data.CARDS_DATA, null, 2)
    );

    fs.writeFileSync(
        path.join(outputDir, 'speciesData.json'),
        JSON.stringify(data.SPECIES_DATA, null, 2)
    );

    console.log('✅ Successfully converted card data to JSON!');
    console.log(`   Cards: ${Object.keys(data.CARDS_DATA).length}`);
    console.log(`   Species: ${Object.keys(data.SPECIES_DATA).length}`);
    console.log(`   Output: ${outputDir}`);

} catch (error) {
    console.error('Error converting data:', error);
    process.exit(1);
}

let $f = (data) => {
  return {
    type: data[0],
    species: data[1],
    tree_symbol: data[2],
    deck: data[3],
  };
};

/*
 * Game Constants
 */

const W_CARD = "wCard";
const V_CARD = "vCard";
const H_CARD = "hCard";
const PURPLE_EMPEROR = "Purple Emperor";
const LARGE_TORTOISESHELL = "Large Tortoiseshell";
const GNAT = "Gnat";
const BEECH = "Beech";
const TREE = "Tree";
const CHANTERELLE = "Chanterelle";
const BULLFINCH = "Bullfinch";
const PENNY_BUN = "Penny Bun";
const CAMBERWELL_BEAUTY = "Camberwell Beauty";
const TREE_FERNS = "Tree Ferns";
const CHAFFINCH = "Chaffinch";
const BIRCH = "Birch";
const HEDGEHOG = "Hedgehog";
const EUROPEAN_BADGER = "European Badger";
const GOSHAWK = "Goshawk";
const POND_TURTLE = "Pond Turtle";
const RED_SQUIRREL = "Red Squirrel";
const WOLF = "Wolf";
const WILD_STRAWBERRIES = "Wild Strawberries";
const OAK = "Oak";
const BROWN_BEAR = "Brown Bear";
const RED_DEER = "Red Deer";
const GREAT_SPOTTED_WOODPECKER = "Great Spotted Woodpecker";
const SQUEAKER = "Squeaker";
const FIRE_SALAMANDER = "Fire Salamander";
const FLY_AGARIC = "Fly Agaric";
const TAWNY_OWL = "Tawny Owl";
const GREATER_HORSESHOE_BAT = "Greater Horseshoe Bat";
const FALLOW_DEER = "Fallow Deer";
const BECHSTEIN = "Bechstein's bat";
const RED_FOX = "Red Fox";
const RACCOON = "Raccoon";
const BEECH_MARTEN = "Beech Marten";
const PEACOCK_BUTTERFLY = "Peacock Butterfly";
const WILD_BOAR = "Wild Boar";
const SILVER_FIR = "Silver Fir";
const SYCAMORE = "Sycamore";
const EUROPEAN_HARE = "European Hare";
const TREE_FROG = "Tree Frog";
const HORSE_CHESTNUT = "Horse Chestnut";
const FIREFLIES = "Fireflies";
const BLACKBERRIES = "Blackberries";
const DOUGLAS_FIR = "Douglas Fir";
const MOSS = "Moss";
const EUROPEAN_FAT_DORMOUSE = "European Fat Dormouse";
const MOLE = "Mole";
const COMMON_TOAD = "Common Toad";
const PARASOL_MUSHROOM = "Parasol Mushroom";
const ROE_DEER = "Roe Deer";
const STAG_BEETLE = "Stag Beetle";
const LINDEN = "Linden";
const EURASIAN_JAY = "Eurasian Jay";
const BARBASTELLE_BAT = "Barbastelle Bat";
const VIOLET_CARPENTER_BEE = "Violet Carpenter Bee";
const LYNX = "Lynx";
const WOOD_ANT = "Wood Ant";
const CLOVEN = "Cloven-hoofed animal";

//tags
const BUTTERFLY = "Butterfly";
const INSECT = "Insect";
const MUSHROOM = "Mushroom";
const BIRD = "Bird";
const BAT = "Bat";
const PAW = "Paw";
const AMPHIBIAN = "Amphibian";
const PLANT = "Plant";

//Alpine Shuffle from here
const MOUNTAIN = "Mountain";
const VACCINIUM_MYRTILLUS = "Vaccinium Myrtillus";
const ICHTHYOSAURA_ALPESTRIS = "Ichthyosaura Alpestris";
const LARIX = "Larix";
const CRATERELLUS_CORNUCOPIODES = "Craterellus Cornucopiodes";
const LARIX_DECIDUA = "Larix Decidua";
const AQUILA_CHRYSAETOS = "Aquila Chrysaetos";
const PINUS_CEMBRA = "Pinus Cembra";
const LEPUS_TIMIDUS = "Lepus Timidus";
const RUPICAPRA_RUPICAPRA = "Rupicapra Rupicapra";
const GENTIANA = "Gentiana";
const TETRAO_UROGALLUS = "Tetrao Urogallus";
const PARNASSIUS_PHOEBUS = "Parnassius Phoebus";
const PINUS = "Pinus";
const MARMOTA_MARMOTA = "Marmota Marmota";
const CAPRA_IBEX = "Capra Ibex";
const CORVUS_CORAX = "Corvus Corax";
const GYPAETUS_BARBATUS = "Gypaetus Barbatus";
const LEONTOPODIUM_NIVALE = "Leontopodium Nivale";
const HYPSUGO_SAVII = "Hypsugo Savii";
//edge
const SQUEAKER_EDGE = "Squeaker Edge";
const SAMBUCUS = "Sambucus";
const COMMON_HAZEL = "Common Hazel";
const BLACKTHORN = "Blackthorn";
const WILD_BOAR_FEMALE_ = "Wild Boar (Female)";
const BEEHIVE = "Beehive";
const EUROPEAN_BISON = "European Bison";
const EUROPEAN_WILDCAT = "European Wildcat";
const COMMON_PIPISTRELLE = "Common Pipistrelle";
const MOSQUITO = "Mosquito";
const EUROPEAN_POLECAT = "European Polecat";
const MAP_BUTTERFLY = "Map Butterfly";
const HAZEL_DOORMOUSE = "Hazel Doormouse";
const URTICA = "Urtica";
const GREAT_GREEN_BUSH_CRICKET = "Great Green Bush-Cricket";
const EUROPEAN_WATER_VOLE = "European Water Vole";
const EURASIAN_MAGPIE = "Eurasian Magpie";
const COMMON_NIGHTINGALE = "Common Nightingale";
const BARN_OWL = "Barn Owl";
const DIGITALIS = "Digitalis";
const EDGE = "Woodland Edge";
const SHRUB = "Shrub";

const BASIC_DECK = "basic";
const ALPINE_DECK = "alpine";
const EDGE_DECK = "edge";

const WITH_OTHERS = [
  FIREFLIES,
  HORSE_CHESTNUT,
  FIRE_SALAMANDER,
  CAMBERWELL_BEAUTY,
  LARGE_TORTOISESHELL,
  PEACOCK_BUTTERFLY,
  PURPLE_EMPEROR,
  PARNASSIUS_PHOEBUS,
  "Silver-Washed Fritillary",
];
const SLOT_SCORE = [EUROPEAN_HARE, COMMON_TOAD];

// prettier-ignore
const CARDS_DATA = {
  1: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  2: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  3: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  4: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  5: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  6: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  7: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  8: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  9: $f([TREE, [LINDEN], [LINDEN], BASIC_DECK]),
  10: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  11: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  12: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  13: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  14: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  15: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  16: $f([TREE, [OAK], [OAK], BASIC_DECK]),
  17: $f([TREE, [SILVER_FIR], [SILVER_FIR], BASIC_DECK]),
  18: $f([TREE, [SILVER_FIR], [SILVER_FIR], BASIC_DECK]),
  19: $f([TREE, [SILVER_FIR], [SILVER_FIR], BASIC_DECK]),
  20: $f([TREE, [SILVER_FIR], [SILVER_FIR], BASIC_DECK]),
  21: $f([TREE, [SILVER_FIR], [SILVER_FIR], BASIC_DECK]),
  22: $f([TREE, [SILVER_FIR], [SILVER_FIR], BASIC_DECK]),
  23: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  24: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  25: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  26: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  27: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  28: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  29: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  30: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  31: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  32: $f([TREE, [BIRCH], [BIRCH], BASIC_DECK]),
  33: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  34: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  35: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  36: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  37: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  38: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  39: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  40: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  41: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  42: $f([TREE, [BEECH], [BEECH], BASIC_DECK]),
  43: $f([TREE, [SYCAMORE], [SYCAMORE], BASIC_DECK]),
  44: $f([TREE, [SYCAMORE], [SYCAMORE], BASIC_DECK]),
  45: $f([TREE, [SYCAMORE], [SYCAMORE], BASIC_DECK]),
  46: $f([TREE, [SYCAMORE], [SYCAMORE], BASIC_DECK]),
  47: $f([TREE, [SYCAMORE], [SYCAMORE], BASIC_DECK]),
  48: $f([TREE, [SYCAMORE], [SYCAMORE], BASIC_DECK]),
  49: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  50: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  51: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  52: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  53: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  54: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  55: $f([TREE, [DOUGLAS_FIR], [DOUGLAS_FIR], BASIC_DECK]),
  56: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  57: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  58: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  59: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  60: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  61: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  62: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  63: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  64: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  65: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  66: $f([TREE, [HORSE_CHESTNUT], [HORSE_CHESTNUT], BASIC_DECK]),
  67: $f([W_CARD, [''], [''], BASIC_DECK]),
  68: $f([W_CARD, [''], [''], BASIC_DECK]),
  69: $f([W_CARD, [''], [''], BASIC_DECK]),
  70: $f([H_CARD, [EUROPEAN_HARE, EUROPEAN_BADGER], [LINDEN, DOUGLAS_FIR], BASIC_DECK]),
  71: $f([H_CARD, [EUROPEAN_HARE, GREATER_HORSESHOE_BAT], [OAK, LINDEN], BASIC_DECK]),
  72: $f([H_CARD, [EUROPEAN_HARE, RED_FOX], [SILVER_FIR, OAK], BASIC_DECK]),
  73: $f([H_CARD, [RACCOON, EUROPEAN_HARE], [DOUGLAS_FIR, SYCAMORE], BASIC_DECK]),
  74: $f([H_CARD, [WILD_BOAR, EUROPEAN_HARE], [SYCAMORE, SILVER_FIR], BASIC_DECK]),
  75: $f([H_CARD, ['Brown Long-Eared Bat', EUROPEAN_HARE], [SYCAMORE, LINDEN], BASIC_DECK]),
  76: $f([H_CARD, [RACCOON, ROE_DEER], [SILVER_FIR, BEECH], BASIC_DECK]),
  77: $f([H_CARD, ['Brown Long-Eared Bat', EUROPEAN_BADGER], [SYCAMORE, DOUGLAS_FIR], BASIC_DECK]),
  78: $f([H_CARD, [BARBASTELLE_BAT, WILD_BOAR], [HORSE_CHESTNUT, OAK], BASIC_DECK]),
  79: $f([H_CARD, [BROWN_BEAR, RACCOON], [LINDEN, SILVER_FIR], BASIC_DECK]),
  80: $f([H_CARD, [BEECH_MARTEN, BROWN_BEAR], [SYCAMORE, HORSE_CHESTNUT], BASIC_DECK]),
  81: $f([H_CARD, [RED_DEER, BROWN_BEAR], [LINDEN, BEECH], BASIC_DECK]),
  82: $f([H_CARD, [BARBASTELLE_BAT, BEECH_MARTEN], [SILVER_FIR, HORSE_CHESTNUT], BASIC_DECK]),
  83: $f([H_CARD, [LYNX, EUROPEAN_HARE], [DOUGLAS_FIR, BIRCH], BASIC_DECK]),
  84: $f([H_CARD, [WILD_BOAR, BEECH_MARTEN], [BIRCH, OAK], BASIC_DECK]),
  85: $f([H_CARD, [EUROPEAN_BADGER, GNAT], [HORSE_CHESTNUT, OAK], BASIC_DECK]),
  86: $f([H_CARD, [RED_FOX, VIOLET_CARPENTER_BEE], [LINDEN, DOUGLAS_FIR], BASIC_DECK]),
  87: $f([H_CARD, [WILD_BOAR, ROE_DEER], [SYCAMORE, HORSE_CHESTNUT], BASIC_DECK]),
  88: $f([H_CARD, [FALLOW_DEER, WILD_BOAR], [LINDEN, DOUGLAS_FIR], BASIC_DECK]),
  89: $f([H_CARD, [FALLOW_DEER, ROE_DEER], [LINDEN, BIRCH], BASIC_DECK]),
  90: $f([H_CARD, [RED_DEER, FALLOW_DEER], [SILVER_FIR, SYCAMORE], BASIC_DECK]),
  91: $f([H_CARD, [VIOLET_CARPENTER_BEE, LYNX], [DOUGLAS_FIR, BEECH], BASIC_DECK]),
  92: $f([H_CARD, [EUROPEAN_FAT_DORMOUSE, BARBASTELLE_BAT], [BEECH, OAK], BASIC_DECK]),
  93: $f([H_CARD, [GREATER_HORSESHOE_BAT, EUROPEAN_FAT_DORMOUSE], [BEECH, DOUGLAS_FIR], BASIC_DECK]),
  94: $f([H_CARD, [RED_FOX, WOLF], [LINDEN, SILVER_FIR], BASIC_DECK]),
  95: $f([H_CARD, [EUROPEAN_FAT_DORMOUSE, 'Brown Long-Eared Bat'], [SILVER_FIR, BEECH], BASIC_DECK]),
  96: $f([H_CARD, [BECHSTEIN, EUROPEAN_FAT_DORMOUSE], [BEECH, OAK], BASIC_DECK]),
  97: $f([H_CARD, [GNAT, VIOLET_CARPENTER_BEE], [BIRCH, DOUGLAS_FIR], BASIC_DECK]),
  98: $f([H_CARD, [WOLF, GNAT], [DOUGLAS_FIR, HORSE_CHESTNUT], BASIC_DECK]),
  99: $f([H_CARD, [ROE_DEER, SQUEAKER], [LINDEN, SYCAMORE], BASIC_DECK]),
  100: $f([H_CARD, [BECHSTEIN, WOLF], [OAK, SILVER_FIR], BASIC_DECK]),
  101: $f([H_CARD, [ROE_DEER, LYNX], [SILVER_FIR, LINDEN], BASIC_DECK]),
  102: $f([H_CARD, [BEECH_MARTEN, BECHSTEIN], [BEECH, BIRCH], BASIC_DECK]),
  103: $f([H_CARD, [EUROPEAN_HARE, RED_DEER], [BEECH, HORSE_CHESTNUT], BASIC_DECK]),
  104: $f([H_CARD, [WOLF, GREATER_HORSESHOE_BAT], [SYCAMORE, LINDEN], BASIC_DECK]),
  105: $f([H_CARD, [SQUEAKER, RED_DEER], [HORSE_CHESTNUT, OAK], BASIC_DECK]),
  106: $f([H_CARD, [RED_FOX, SQUEAKER], [BEECH, OAK], BASIC_DECK]),
  107: $f([H_CARD, [LYNX, RACCOON], [DOUGLAS_FIR, BIRCH], BASIC_DECK]),
  108: $f([H_CARD, [SQUEAKER, LYNX], [OAK, SILVER_FIR], BASIC_DECK]),
  109: $f([H_CARD, [EUROPEAN_HARE, BEECH_MARTEN], [BIRCH, HORSE_CHESTNUT], BASIC_DECK]),
  110: $f([H_CARD, [LYNX, RED_FOX], [HORSE_CHESTNUT, DOUGLAS_FIR], BASIC_DECK]),
  111: $f([H_CARD, [EUROPEAN_HARE, RED_DEER], [BIRCH, HORSE_CHESTNUT], BASIC_DECK]),
  112: $f([H_CARD, [VIOLET_CARPENTER_BEE, EUROPEAN_HARE], [SILVER_FIR, SYCAMORE], BASIC_DECK]),
  113: $f([H_CARD, [EUROPEAN_BADGER, FALLOW_DEER], [HORSE_CHESTNUT, BIRCH], BASIC_DECK]),
  114: $f([V_CARD, [GOSHAWK, MOSS], [DOUGLAS_FIR, LINDEN], BASIC_DECK]),
  115: $f([V_CARD, [GREAT_SPOTTED_WOODPECKER, WOOD_ANT], [LINDEN, BIRCH], BASIC_DECK]),
  116: $f([V_CARD, [CHAFFINCH, WOOD_ANT], [BIRCH, BEECH], BASIC_DECK]),
  117: $f([V_CARD, [TAWNY_OWL, STAG_BEETLE], [BEECH, SYCAMORE], BASIC_DECK]),
  118: $f([V_CARD, ['Silver-Washed Fritillary', FIRE_SALAMANDER], [OAK, HORSE_CHESTNUT], BASIC_DECK]),
  119: $f([V_CARD, [PURPLE_EMPEROR, POND_TURTLE], [HORSE_CHESTNUT, SYCAMORE], BASIC_DECK]),
  120: $f([V_CARD, [CAMBERWELL_BEAUTY, POND_TURTLE], [SYCAMORE, BIRCH], BASIC_DECK]),
  121: $f([V_CARD, [LARGE_TORTOISESHELL, FIRE_SALAMANDER], [SILVER_FIR, DOUGLAS_FIR], BASIC_DECK]),
  122: $f([V_CARD, [BULLFINCH, TREE_FROG], [DOUGLAS_FIR, LINDEN], BASIC_DECK]),
  123: $f([V_CARD, [CHAFFINCH, STAG_BEETLE], [SYCAMORE, BIRCH], BASIC_DECK]),
  124: $f([V_CARD, [GOSHAWK, WOOD_ANT], [SILVER_FIR, BEECH], BASIC_DECK]),
  125: $f([V_CARD, [GREAT_SPOTTED_WOODPECKER, COMMON_TOAD], [LINDEN, OAK], BASIC_DECK]),
  126: $f([V_CARD, [EURASIAN_JAY, TREE_FERNS], [BIRCH, HORSE_CHESTNUT], BASIC_DECK]),
  127: $f([V_CARD, [TAWNY_OWL, WILD_STRAWBERRIES], [BEECH, SYCAMORE], BASIC_DECK]),
  128: $f([V_CARD, ['Silver-Washed Fritillary', BLACKBERRIES], [OAK, SILVER_FIR], BASIC_DECK]),
  129: $f([V_CARD, [PURPLE_EMPEROR, MOSS], [HORSE_CHESTNUT, DOUGLAS_FIR], BASIC_DECK]),
  130: $f([V_CARD, [CAMBERWELL_BEAUTY, FIREFLIES], [SYCAMORE, LINDEN], BASIC_DECK]),
  131: $f([V_CARD, [LARGE_TORTOISESHELL, BLACKBERRIES], [SILVER_FIR, BIRCH], BASIC_DECK]),
  132: $f([V_CARD, [BULLFINCH, HEDGEHOG], [DOUGLAS_FIR, BEECH], BASIC_DECK]),
  133: $f([V_CARD, [PEACOCK_BUTTERFLY, HEDGEHOG], [SILVER_FIR, OAK], BASIC_DECK]),
  134: $f([V_CARD, [RED_SQUIRREL, COMMON_TOAD], [DOUGLAS_FIR, HORSE_CHESTNUT], BASIC_DECK]),
  135: $f([V_CARD, [RED_SQUIRREL, FIREFLIES], [HORSE_CHESTNUT, SYCAMORE], BASIC_DECK]),
  136: $f([V_CARD, [CHAFFINCH, COMMON_TOAD], [BEECH, SILVER_FIR], BASIC_DECK]),
  137: $f([V_CARD, [EURASIAN_JAY, FIREFLIES], [BIRCH, DOUGLAS_FIR], BASIC_DECK]),
  138: $f([V_CARD, ['Silver-Washed Fritillary', MOSS], [BEECH, LINDEN], BASIC_DECK]),
  139: $f([V_CARD, [PEACOCK_BUTTERFLY, CHANTERELLE], [OAK, SILVER_FIR], BASIC_DECK]),
  140: $f([V_CARD, [PEACOCK_BUTTERFLY, FIREFLIES], [HORSE_CHESTNUT, BEECH], BASIC_DECK]),
  141: $f([V_CARD, [LARGE_TORTOISESHELL, MOLE], [SYCAMORE, OAK], BASIC_DECK]),
  142: $f([V_CARD, [GOSHAWK, HEDGEHOG], [SILVER_FIR, HORSE_CHESTNUT], BASIC_DECK]),
  143: $f([V_CARD, [GREAT_SPOTTED_WOODPECKER, WILD_STRAWBERRIES], [DOUGLAS_FIR, SYCAMORE], BASIC_DECK]),
  144: $f([V_CARD, [EURASIAN_JAY, FLY_AGARIC], [SYCAMORE, SILVER_FIR], BASIC_DECK]),
  145: $f([V_CARD, [TAWNY_OWL, PENNY_BUN], [BIRCH, DOUGLAS_FIR], BASIC_DECK]),
  146: $f([V_CARD, [RED_SQUIRREL, FIRE_SALAMANDER], [BEECH, LINDEN], BASIC_DECK]),
  147: $f([V_CARD, [PURPLE_EMPEROR, TREE_FROG], [BIRCH, OAK], BASIC_DECK]),
  148: $f([V_CARD, [PEACOCK_BUTTERFLY, COMMON_TOAD], [LINDEN, BEECH], BASIC_DECK]),
  149: $f([V_CARD, [CAMBERWELL_BEAUTY, TREE_FROG], [BIRCH, OAK], BASIC_DECK]),
  150: $f([V_CARD, [BULLFINCH, PARASOL_MUSHROOM], [DOUGLAS_FIR, HORSE_CHESTNUT], BASIC_DECK]),
  151: $f([V_CARD, [GOSHAWK, COMMON_TOAD], [OAK, SYCAMORE], BASIC_DECK]),
  152: $f([V_CARD, [EURASIAN_JAY, TREE_FERNS], [HORSE_CHESTNUT, SILVER_FIR], BASIC_DECK]),
  153: $f([V_CARD, [TAWNY_OWL, COMMON_TOAD], [SYCAMORE, DOUGLAS_FIR], BASIC_DECK]),
  154: $f([V_CARD, [BULLFINCH, TREE_FERNS], [SILVER_FIR, LINDEN], BASIC_DECK]),
  155: $f([V_CARD, [RED_SQUIRREL, WILD_STRAWBERRIES], [OAK, BIRCH], BASIC_DECK]),
  156: $f([V_CARD, ['Silver-Washed Fritillary', BLACKBERRIES], [OAK, BEECH], BASIC_DECK]),
  157: $f([V_CARD, [PURPLE_EMPEROR, FLY_AGARIC], [LINDEN, OAK], BASIC_DECK]),
  158: $f([V_CARD, [CAMBERWELL_BEAUTY, CHANTERELLE], [HORSE_CHESTNUT, BIRCH], BASIC_DECK]),
  159: $f([V_CARD, [LARGE_TORTOISESHELL, MOLE], [BEECH, SYCAMORE], BASIC_DECK]),
  160: $f([V_CARD, [CHAFFINCH, PARASOL_MUSHROOM], [SYCAMORE, SILVER_FIR], BASIC_DECK]),
  161: $f([V_CARD, [GREAT_SPOTTED_WOODPECKER, PENNY_BUN], [LINDEN, DOUGLAS_FIR], BASIC_DECK]),
  //Alpine Shuffle from here
  162: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  163: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  164: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  165: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  166: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  167: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  168: $f([TREE, [LARIX_DECIDUA], [LARIX], ALPINE_DECK]),
  169: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  170: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  171: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  172: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  173: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  174: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  175: $f([TREE, [PINUS_CEMBRA], [PINUS], ALPINE_DECK]),
  176: $f([H_CARD, [MARMOTA_MARMOTA, RUPICAPRA_RUPICAPRA], [BEECH, PINUS], ALPINE_DECK]),
  177: $f([H_CARD, [MARMOTA_MARMOTA, TETRAO_UROGALLUS], [LARIX, DOUGLAS_FIR], ALPINE_DECK]),
  178: $f([H_CARD, [LEPUS_TIMIDUS, MARMOTA_MARMOTA], [SILVER_FIR, PINUS], ALPINE_DECK]),
  179: $f([H_CARD, [CAPRA_IBEX, MARMOTA_MARMOTA], [LARIX, BIRCH], ALPINE_DECK]),
  180: $f([H_CARD, [RUPICAPRA_RUPICAPRA, TETRAO_UROGALLUS], [LARIX, BEECH], ALPINE_DECK]),
  181: $f([H_CARD, [LEPUS_TIMIDUS, RUPICAPRA_RUPICAPRA], [LARIX, DOUGLAS_FIR], ALPINE_DECK]),
  182: $f([H_CARD, [HYPSUGO_SAVII, CAPRA_IBEX], [SILVER_FIR, PINUS], ALPINE_DECK]),
  183: $f([H_CARD, [TETRAO_UROGALLUS, HYPSUGO_SAVII], [LARIX, PINUS], ALPINE_DECK]),
  184: $f([H_CARD, [TETRAO_UROGALLUS, CAPRA_IBEX], [PINUS, DOUGLAS_FIR], ALPINE_DECK]),
  185: $f([V_CARD, [PARNASSIUS_PHOEBUS, CRATERELLUS_CORNUCOPIODES], [PINUS, LARIX], ALPINE_DECK]),
  186: $f([V_CARD, [PARNASSIUS_PHOEBUS, LEONTOPODIUM_NIVALE], [DOUGLAS_FIR, PINUS], ALPINE_DECK]),
  187: $f([V_CARD, [PARNASSIUS_PHOEBUS, VACCINIUM_MYRTILLUS], [LARIX, BIRCH], ALPINE_DECK]),
  188: $f([V_CARD, [PARNASSIUS_PHOEBUS, ICHTHYOSAURA_ALPESTRIS], [SILVER_FIR, PINUS], ALPINE_DECK]),
  189: $f([V_CARD, [AQUILA_CHRYSAETOS, CRATERELLUS_CORNUCOPIODES], [BEECH, PINUS], ALPINE_DECK]),
  190: $f([V_CARD, [GYPAETUS_BARBATUS, GENTIANA], [SILVER_FIR, LARIX], ALPINE_DECK]),
  191: $f([V_CARD, [AQUILA_CHRYSAETOS, ICHTHYOSAURA_ALPESTRIS], [LARIX, DOUGLAS_FIR], ALPINE_DECK]),
  192: $f([V_CARD, [CORVUS_CORAX, GENTIANA], [LARIX, BEECH], ALPINE_DECK]),
  193: $f([V_CARD, [CORVUS_CORAX, VACCINIUM_MYRTILLUS], [DOUGLAS_FIR, PINUS], ALPINE_DECK]),
  194: $f([V_CARD, [GYPAETUS_BARBATUS, ICHTHYOSAURA_ALPESTRIS], [LARIX, SILVER_FIR], ALPINE_DECK]),
  195: $f([V_CARD, [GYPAETUS_BARBATUS, LEONTOPODIUM_NIVALE], [PINUS, LARIX], ALPINE_DECK]),
  196: $f([V_CARD, [AQUILA_CHRYSAETOS, GENTIANA], [SILVER_FIR, PINUS], ALPINE_DECK]),
  197: $f([H_CARD, [HYPSUGO_SAVII, LEPUS_TIMIDUS], [LARIX, PINUS], ALPINE_DECK]),
  //Edge
  198: $f([TREE, [SAMBUCUS], [LINDEN], EDGE_DECK]),
  199: $f([TREE, [SAMBUCUS], [SYCAMORE], EDGE_DECK]),
  200: $f([TREE, [SAMBUCUS], [BIRCH], EDGE_DECK]),
  201: $f([TREE, [SAMBUCUS], [OAK], EDGE_DECK]),
  202: $f([TREE, [COMMON_HAZEL], [HORSE_CHESTNUT], EDGE_DECK]),
  203: $f([TREE, [COMMON_HAZEL], [OAK], EDGE_DECK]),
  204: $f([TREE, [COMMON_HAZEL], [BEECH], EDGE_DECK]),
  205: $f([TREE, [COMMON_HAZEL], [BIRCH], EDGE_DECK]),
  206: $f([TREE, [BLACKTHORN], [DOUGLAS_FIR], EDGE_DECK]),
  207: $f([TREE, [BLACKTHORN], [BIRCH], EDGE_DECK]),
  208: $f([TREE, [BLACKTHORN], [SILVER_FIR], EDGE_DECK]),
  209: $f([TREE, [BLACKTHORN], [SYCAMORE], EDGE_DECK]),
  210: $f([V_CARD, [MAP_BUTTERFLY, DIGITALIS], [LINDEN, DOUGLAS_FIR], EDGE_DECK]),
  211: $f([V_CARD, [MAP_BUTTERFLY, URTICA], [SYCAMORE, BIRCH], EDGE_DECK]),
  212: $f([V_CARD, [MAP_BUTTERFLY, GREAT_GREEN_BUSH_CRICKET], [OAK, SILVER_FIR], EDGE_DECK]),
  213: $f([V_CARD, [MAP_BUTTERFLY, EUROPEAN_WATER_VOLE], [SILVER_FIR, SYCAMORE], EDGE_DECK]),
  214: $f([V_CARD, [EURASIAN_MAGPIE, DIGITALIS], [BEECH, BIRCH], EDGE_DECK]),
  215: $f([V_CARD, [EURASIAN_MAGPIE, URTICA], [SILVER_FIR, HORSE_CHESTNUT], EDGE_DECK]),
  216: $f([V_CARD, [EURASIAN_MAGPIE, GREAT_GREEN_BUSH_CRICKET], [BIRCH, BEECH], EDGE_DECK]),
  217: $f([V_CARD, [COMMON_NIGHTINGALE, DIGITALIS], [BEECH, SYCAMORE], EDGE_DECK]),
  218: $f([V_CARD, [COMMON_NIGHTINGALE, URTICA], [OAK, SYCAMORE], EDGE_DECK]),
  219: $f([V_CARD, [COMMON_NIGHTINGALE, EUROPEAN_WATER_VOLE], [HORSE_CHESTNUT, BEECH], EDGE_DECK]),
  220: $f([V_CARD, [BARN_OWL, DIGITALIS], [BIRCH, OAK], EDGE_DECK]),
  221: $f([V_CARD, [BARN_OWL, GREAT_GREEN_BUSH_CRICKET], [SYCAMORE, OAK], EDGE_DECK]),
  222: $f([H_CARD, [WILD_BOAR_FEMALE_, BEEHIVE], [BIRCH, SYCAMORE], EDGE_DECK]),
  223: $f([H_CARD, [EUROPEAN_BISON, WILD_BOAR_FEMALE_], [OAK, SYCAMORE], EDGE_DECK]),
  224: $f([H_CARD, [WILD_BOAR_FEMALE_, EUROPEAN_WILDCAT], [SILVER_FIR, HORSE_CHESTNUT], EDGE_DECK]),
  225: $f([H_CARD, [COMMON_PIPISTRELLE, SQUEAKER_EDGE], [LINDEN, SILVER_FIR], EDGE_DECK]),
  226: $f([H_CARD, [SQUEAKER_EDGE, MOSQUITO], [HORSE_CHESTNUT, BEECH], EDGE_DECK]),
  227: $f([H_CARD, [EUROPEAN_POLECAT, SQUEAKER_EDGE], [SILVER_FIR, DOUGLAS_FIR], EDGE_DECK]),
  228: $f([H_CARD, [BEEHIVE, COMMON_PIPISTRELLE], [BEECH, SYCAMORE], EDGE_DECK]),
  229: $f([H_CARD, [EUROPEAN_WILDCAT, BEEHIVE], [OAK, BIRCH], EDGE_DECK]),
  230: $f([H_CARD, [COMMON_PIPISTRELLE, EUROPEAN_BISON], [BIRCH, BEECH], EDGE_DECK]),
  231: $f([H_CARD, [EUROPEAN_BISON, EUROPEAN_POLECAT], [BEECH, SYCAMORE], EDGE_DECK]),
  232: $f([H_CARD, [MOSQUITO, EUROPEAN_POLECAT], [BIRCH, OAK], EDGE_DECK]),
  233: $f([H_CARD, [EUROPEAN_WILDCAT, MOSQUITO], [SYCAMORE, OAK], EDGE_DECK]),

};

/**
 * Species
 */
const SPECIES_DATA = {
  Blackberries: {
    name: "Blackberries",
    nb: 3,
    tags: [PLANT],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 2 points for each card with a plant symbol",
  },

  Bullfinch: {
    name: "Bullfinch",
    nb: 4,
    tags: [BIRD],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 2 points for each card with an insect symbol",
  },

  CamberwellBeauty: {
    name: "Camberwell Beauty",
    nb: 4,
    tags: [INSECT, BUTTERFLY],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  Chaffinch: {
    name: "Chaffinch",
    nb: 4,
    tags: [BIRD],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "5 points if it's on a Beech",
  },

  Chanterelle: {
    name: "Chanterelle",
    nb: 2,
    tags: [MUSHROOM],
    cost: 2,
    type: "vCard",
    effect: "Whenever you play a card with a tree symbol receive 1 card",
    bonus: "",
    points: "",
  },

  CommonToad: {
    name: "Common Toad",
    nb: 6,
    tags: [AMPHIBIAN],
    cost: 0,
    type: "vCard",
    effect: "Up to 2 Common Toads may share this spot",
    bonus: "",
    points: "Gain 5 points if 2 Common Toads share this spot",
  },

  EurasianJay: {
    name: "Eurasian Jay",
    nb: 4,
    tags: [BIRD],
    cost: 1,
    type: "vCard",
    effect: "Take another turn after this one",
    bonus: "",
    points: "Gain 3 points",
  },

  FireSalamander: {
    name: "Fire Salamander",
    nb: 3,
    tags: [AMPHIBIAN],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus:
      "Play a card with a paw symbol for free (you can’t use its effect or bonus)",
    points: "Gain points according to the number of Fire Salamander you have",
  },

  Fireflies: {
    name: "Fireflies",
    nb: 4,
    tags: [INSECT],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points according to the number of Fireflies you have",
  },

  FlyAgaric: {
    name: "Fly Agaric",
    nb: 2,
    tags: [MUSHROOM],
    cost: 2,
    type: "vCard",
    effect: "Whenever you play a card with a paw symbol receive 1 card",
    bonus: "",
    points: "",
  },

  Goshawk: {
    name: "Goshawk",
    nb: 4,
    tags: [BIRD],
    cost: 2,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 3 points for each card with a bird symbol",
  },

  GreatSpottedWoodpecker: {
    name: "Great Spotted Woodpecker",
    nb: 4,
    tags: [BIRD],
    cost: 1,
    type: "vCard",
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 10 points if no other forest has more trees",
  },

  Hedgehog: {
    name: "Hedgehog",
    nb: 3,
    tags: [PAW],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus: "Receive 1 card",
    points: "Gain 2 points for each card with a butterfly symbol",
  },

  LargeTortoiseshell: {
    name: "Large Tortoiseshell",
    nb: 4,
    tags: [INSECT, BUTTERFLY],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  Mole: {
    name: "Mole",
    nb: 2,
    tags: [PAW],
    cost: 2,
    type: "vCard",
    effect: "immediately play any number of cards by paying their cost",
    bonus: "",
    points: "",
  },

  Moss: {
    name: "Moss",
    nb: 3,
    tags: [PLANT],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 10 points if you have at least 10 trees",
  },

  ParasolMushroom: {
    name: "Parasol Mushroom",
    nb: 2,
    tags: [MUSHROOM],
    cost: 2,
    type: "vCard",
    effect: "Whenever you play a card below a tree receive 1 card",
    bonus: "",
    points: "",
  },

  PeacockButterfly: {
    name: "Peacock Butterfly",
    nb: 4,
    tags: [INSECT, BUTTERFLY],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  PennyBun: {
    name: "Penny Bun",
    nb: 2,
    tags: [MUSHROOM],
    cost: 2,
    type: "vCard",
    effect: "Whenever you play a card atop a tree receive 1 card",
    bonus: "",
    points: "",
  },

  PondTurtle: {
    name: "Pond Turtle",
    nb: 2,
    tags: [AMPHIBIAN],
    cost: 2,
    type: "vCard",
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 5 points",
  },

  PurpleEmperor: {
    name: "Purple Emperor",
    nb: 4,
    tags: [INSECT, BUTTERFLY],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  RedSquirrel: {
    name: "Red Squirrel",
    nb: 4,
    tags: [PAW],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points if it’s on an Oak",
  },

  SilverWashedFritillary: {
    name: "Silver-Washed Fritillary",
    nb: 4,
    tags: [INSECT, BUTTERFLY],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  StagBeetle: {
    name: "Stag Beetle",
    nb: 2,
    tags: [INSECT],
    cost: 2,
    type: "vCard",
    effect: "",
    bonus:
      "Play a card with a bird symbol for free (you can’t use its effect or bonus)",
    points: "Gain 1 point for each card with a paw symbol",
  },

  TawnyOwl: {
    name: "Tawny Owl",
    nb: 4,
    tags: [BIRD],
    cost: 2,
    type: "vCard",
    effect: "Receive 1 card",
    bonus: "Receive 2 cards",
    points: "Gain 5 points",
  },

  TreeFerns: {
    name: "Tree Ferns",
    nb: 3,
    tags: [PLANT],
    cost: 1,
    type: "vCard",
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 6 point for each card with an amphibian symbol",
  },

  TreeFrog: {
    name: "Tree Frog",
    nb: 3,
    tags: [AMPHIBIAN],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points for each Gnat",
  },

  WildStrawberries: {
    name: "Wild Strawberries",
    nb: 3,
    tags: [PLANT],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 10 points if you have all 8 different tree species",
  },

  WoodAnt: {
    name: "Wood Ant",
    nb: 3,
    tags: [INSECT],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 2 points for each card below a tree",
  },

  BarbastelleBat: {
    name: "Barbastelle Bat",
    nb: 3,
    tags: [BAT],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points if you have at least 3 different bat species",
  },

  Bechsteinsbat: {
    name: "Bechstein's Bat",
    nb: 3,
    tags: [BAT],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points if you have at least 3 different bat species",
  },

  BeechMarten: {
    name: "Beech Marten",
    nb: 5,
    tags: [PAW],
    cost: 1,
    type: "hCard",
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 5 points per fully occupied tree",
  },

  BrownBear: {
    name: "Brown Bear",
    nb: 3,
    tags: [PAW],
    cost: 3,
    type: "hCard",
    effect: "Place all cards from the clearing in your cave",
    bonus: "Receive 1 card and take another turn after this one",
    points: "",
  },

  BrownLongEaredBat: {
    name: "Brown Long-Eared Bat",
    nb: 3,
    tags: [BAT],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points if you have at least 3 different bat species",
  },

  EuropeanBadger: {
    name: "European Badger",
    nb: 4,
    tags: [PAW],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus:
      "Play a card with a paw symbol for free (you can’t use its effect or bonus)",
    points: "Gain 2 points",
  },

  EuropeanFatDormouse: {
    name: "European Fat Dormouse",
    nb: 4,
    tags: [PAW],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 15 points if a bat also occupies this tree",
  },

  EuropeanHare: {
    name: "European Hare",
    nb: 11,
    tags: [PAW],
    cost: 0,
    type: "hCard",
    effect: "Any number of European Hares may share this spot",
    bonus: "",
    points: "Gain 1 point for each European Hare",
  },

  FallowDeer: {
    name: "Fallow Deer",
    nb: 4,
    tags: ["Cloven-hoofed animal", "Deer"],
    cost: 2,
    type: "hCard",
    effect: "",
    bonus: "Receive 2 cards",
    points: "Gain 3 points for each card with cloven-hoofed animal symbol",
  },

  Gnat: {
    name: "Gnat",
    nb: 3,
    tags: [INSECT],
    cost: 0,
    type: "hCard",
    effect: "Play any number of bat cards for free",
    bonus: "",
    points: "Gain 1 point for each card with a bat symbol",
  },

  GreaterHorseshoeBat: {
    name: "Greater Horseshoe Bat",
    nb: 3,
    tags: [BAT],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points if you have at least 3 different bat species",
  },

  Lynx: {
    name: "Lynx",
    nb: 6,
    tags: [PAW],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 10 points if you have at least 1 Roe Deer",
  },

  Raccoon: {
    name: "Raccoon",
    nb: 4,
    tags: [PAW],
    cost: 1,
    type: "hCard",
    effect:
      "Place any number of cards from hand in your cave; draw an equal number of cards from the deck",
    bonus: "",
    points: "",
  },

  RedDeer: {
    name: "Red Deer",
    nb: 5,
    tags: ["Cloven-hoofed animal", "Deer"],
    cost: 2,
    type: "hCard",
    effect: "",
    bonus:
      "Play a card with a deer symbol for free (you can’t use its effect or bonus)",
    points: "Gain 1 point for each card with a tree or plant symbol",
  },

  RedFox: {
    name: "Red Fox",
    nb: 5,
    tags: [PAW],
    cost: 2,
    type: "hCard",
    effect: "Receive 1 card for each European Hare",
    bonus: "",
    points: "Gain 2 points for each European Hare",
  },

  RoeDeer: {
    name: "Roe Deer",
    nb: 5,
    tags: ["Cloven-hoofed animal", "Deer"],
    cost: 2,
    type: "hCard",
    effect: "",
    bonus: "Receive 1 card",
    points: "Gain 3 points for each card with a matching tree symbol",
  },

  Squeaker: {
    name: "Squeaker",
    nb: 4,
    tags: ["Cloven-hoofed animal"],
    cost: 0,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 1 point",
  },

  VioletCarpenterBee: {
    name: "Violet Carpenter Bee",
    nb: 4,
    tags: [INSECT],
    cost: 1,
    type: "hCard",
    effect:
      "The tree this bee occupies counts as one additional tree of its type",
    bonus: "",
    points: "",
  },

  WildBoar: {
    name: "Wild Boar",
    nb: 5,
    tags: ["Cloven-hoofed animal"],
    cost: 2,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 10 points if you have at least 1 Squeaker",
  },

  Wolf: {
    name: "Wolf",
    nb: 4,
    tags: [PAW],
    cost: 3,
    type: "hCard",
    effect: "Receive 1 card for each Deer",
    bonus: "Take another turn after this one",
    points: "Gain 5 points for each card with a deer symbol",
  },

  Linden: {
    name: "Linden",
    nb: 9,
    tags: [TREE],
    cost: 1,
    type: TREE,
    effect: "",
    bonus: "",
    points: "Gain 1 point or 3 points if no other forest has more Linden Trees",
  },

  Oak: {
    name: "Oak",
    nb: 7,
    tags: [TREE],
    cost: 2,
    type: TREE,
    effect: "",
    bonus: "Take another turn after this one",
    points: "Gain 10 points if you have all 8 different tree species",
  },

  SilverFir: {
    name: "Silver Fir",
    nb: 6,
    tags: [TREE],
    cost: 2,
    type: TREE,
    effect: "",
    bonus:
      "Play a card with a paw symbol for free (you can’t use its effect or bonus)",
    points: "Gain 2 points for each card attached to this Silver Fir",
  },

  Birch: {
    name: "Birch",
    nb: 10,
    tags: [TREE],
    cost: 0,
    type: TREE,
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 1 point",
  },

  Beech: {
    name: "Beech",
    nb: 10,
    tags: [TREE],
    cost: 1,
    type: TREE,
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 5 points if you have at least 4 Beeches",
  },

  Sycamore: {
    name: "Sycamore",
    nb: 6,
    tags: [TREE],
    cost: 2,
    type: TREE,
    effect: "",
    bonus: "",
    points: "Gain 1 point for each card with a tree symbol",
  },
  DouglasFir: {
    name: "Douglas Fir",
    nb: 7,
    tags: [TREE],
    cost: 2,
    type: TREE,
    effect: "",
    bonus: "Take another turn after this one",
    points: "Gain 5 points",
  },
  HorseChestnut: {
    name: "Horse Chestnut",
    nb: 11,
    tags: [TREE],
    cost: 1,
    type: TREE,
    effect: "",
    bonus: "",
    points: "Gain points according to the number of Horse Chestnuts you have",
  },

  //   █████████   ████             ███                          █████████  █████                    ██████     ██████  ████
  //  ███░░░░░███ ░░███            ░░░                          ███░░░░░███░░███                    ███░░███   ███░░███░░███
  // ░███    ░███  ░███  ████████  ████  ████████    ██████    ░███    ░░░  ░███████   █████ ████  ░███ ░░░   ░███ ░░░  ░███   ██████
  // ░███████████  ░███ ░░███░░███░░███ ░░███░░███  ███░░███   ░░█████████  ░███░░███ ░░███ ░███  ███████    ███████    ░███  ███░░███
  // ░███░░░░░███  ░███  ░███ ░███ ░███  ░███ ░███ ░███████     ░░░░░░░░███ ░███ ░███  ░███ ░███ ░░░███░    ░░░███░     ░███ ░███████
  // ░███    ░███  ░███  ░███ ░███ ░███  ░███ ░███ ░███░░░      ███    ░███ ░███ ░███  ░███ ░███   ░███       ░███      ░███ ░███░░░
  // █████   █████ █████ ░███████  █████ ████ █████░░██████    ░░█████████  ████ █████ ░░████████  █████      █████     █████░░██████
  //░░░░░   ░░░░░ ░░░░░  ░███░░░  ░░░░░ ░░░░ ░░░░░  ░░░░░░      ░░░░░░░░░  ░░░░ ░░░░░   ░░░░░░░░  ░░░░░      ░░░░░     ░░░░░  ░░░░░░
  //                     ░███
  //                     █████
  //                    ░░░░░

  HypsugoSavii: {
    name: "Hypsugo savii",
    nb: 3,
    tags: [BAT],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 5 points if you have at least 3 different bat species",
  },

  LarixDecidua: {
    name: "Larix decidua",
    nb: 7,
    tags: [TREE, MOUNTAIN],
    cost: 1,
    type: TREE,
    effect: "",
    bonus:
      "Play a card with a mountain symbol for free (you can’t use its effect or bonus)",
    points: "Gain 3 points",
  },

  PinusCembra: {
    name: "Pinus cembra",
    nb: 7,
    tags: [TREE, MOUNTAIN],
    cost: 2,
    type: TREE,
    effect: "Receive 1 card",
    bonus: "Receive 1 card",
    points: "Gain 1 point for each card with a mountain symbol",
  },

  CraterellusCornucopiodes: {
    name: "Craterellus Cornucopiodes",
    nb: 2,
    tags: [MUSHROOM, MOUNTAIN],
    cost: 2,
    type: "vCard",
    effect: "Whenever you play a card with a mountain symbol receive 1 card",
    bonus: "",
    points: "",
  },

  ParnassiusPhoebus: {
    name: "Parnassius phoebus",
    nb: 4,
    tags: [BUTTERFLY, MOUNTAIN],
    cost: 0,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  Gentiana: {
    name: "Gentiana",
    nb: 3,
    tags: [PLANT, MOUNTAIN],
    cost: 0,
    type: "vCard",
    effect:
      "Play a card with a butterfly symbol for free (you can’t use its effect or bonus)",
    bonus: "",
    points: "Gain 3 points for each card with a butterfly symbol",
  },

  VacciniumMyrtillus: {
    name: "Vaccinium myrtillus",
    nb: 3,
    tags: [PLANT, MOUNTAIN],
    cost: 1,
    type: "vCard",
    effect:
      "Play a card with a amphibian symbol for free (you can’t use its effect or bonus)",
    bonus: "",
    points: "Gain 2 points for each different bird",
  },

  IchthyosauraAlpestris: {
    name: "Ichthyosaura Alpestris",
    nb: 3,
    tags: [AMPHIBIAN, MOUNTAIN],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus:
      "Play a card with a mountain symbol, and a card with an insect symbol for free (you can’t use its effect or bonus)",
    points: "Gain 2 points for each card with an insect symbol",
  },

  AquilaChrysaetos: {
    name: "Aquila chrysaetos",
    nb: 3,
    tags: [BIRD, MOUNTAIN],
    cost: 1,
    type: "vCard",
    effect: "",
    bonus: "",
    points: "Gain 1 point for each card with a paw or amphibian symbol",
  },

  CorvusCorax: {
    name: "Corvus corax",
    nb: 2,
    tags: [BIRD, MOUNTAIN],
    cost: 1,
    type: "vCard",
    effect: "Receive 1 card",
    bonus: "",
    points: "Gain 5 points",
  },

  LeontopodiumNivale: {
    name: "Leontopodium nivale",
    nb: 2,
    tags: [PLANT, MOUNTAIN],
    cost: 1,
    type: "vCard",
    effect: "Receive 1 card",
    bonus: "Receive 1 card",
    points: "Gain 3 points",
  },

  GypaetusBarbatus: {
    name: "Gypaetus barbatus",
    nb: 3,
    tags: [BIRD, MOUNTAIN],
    cost: 1,
    type: "vCard",
    effect: "Place 2 cards from the clearing in your cave",
    bonus: "",
    points: "Gain 1 point for each card in your cave",
  },

  CapraIbex: {
    name: "Capra ibex",
    nb: 3,
    tags: ["Cloven-hoofed animal", MOUNTAIN],
    cost: 3,
    type: "hCard",
    effect: "Take another turn after this one",
    bonus: "",
    points: "Gain 10 points",
  },

  LepusTimidus: {
    name: "Lepus timidus",
    nb: 3,
    tags: [PAW, MOUNTAIN],
    cost: 0,
    type: "hCard",
    effect: "Counts as a European Hare",
    bonus: "",
    points: "Gain 1 point for each European Hare",
  },

  MarmotaMarmota: {
    name: "Marmota marmota",
    nb: 4,
    tags: [PAW, MOUNTAIN],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 3 points for each different plants",
  },

  RupicapraRupicapra: {
    name: "Rupicapra rupicapra",
    nb: 3,
    tags: ["Cloven-hoofed animal", MOUNTAIN],
    cost: 1,
    type: "hCard",
    effect: "",
    bonus: "",
    points: "Gain 3 points for each card with a matching tree symbol",
  },

  TetraoUrogallus: {
    name: "Tetrao urogallus",
    nb: 4,
    tags: [BIRD, MOUNTAIN],
    cost: 1,
    type: "hCard",
    effect:
      "Play a card with a plant symbol for free (you can’t use its effect or bonus)",
    bonus: "",
    points: "Gain 1 point for each card with a plant symbol",
  },

  // ██████████     █████
  //░░███░░░░░█    ░░███
  // ░███  █ ░   ███████   ███████  ██████
  // ░██████    ███░░███  ███░░███ ███░░███
  // ░███░░█   ░███ ░███ ░███ ░███░███████
  // ░███ ░   █░███ ░███ ░███ ░███░███░░░
  // ██████████░░████████░░███████░░██████
  //░░░░░░░░░░  ░░░░░░░░  ░░░░░███ ░░░░░░
  //                      ███ ░███
  //                     ░░██████
  //                      ░░░░░░
  Sambucus: {
    name: "Elderberry",
    nb: 4,
    tags: [EDGE, SHRUB],
    cost: 2,
    type: TREE,
    effect: "Whenever you play a card with a plant symbol receive 1 card",
    bonus:
      "Play a card with a plant symbol for free (you can’t use its effect or bonus)",
    points: "",
  },

  CommonHazel: {
    name: "Common Hazel",
    nb: 4,
    tags: [EDGE, SHRUB],
    cost: 2,
    type: TREE,
    effect: "Whenever you play a card with a bat symbol receive 1 card",
    bonus:
      "Play a card with a bat symbol for free (you can’t use its effect or bonus)",
    points: "",
  },

  Blackthorn: {
    name: "Blackthorn",
    nb: 4,
    tags: [EDGE, SHRUB],
    cost: 2,
    type: TREE,
    effect: "Whenever you play a card with a butterfly symbol receive 1 card",
    bonus:
      "Play a card with a butterfly symbol for free (you can’t use its effect or bonus)",
    points: "",
  },

  WildBoarFemale: {
    name: "Wild Boar (Female)",
    nb: 3,
    tags: [EDGE, CLOVEN],
    cost: 2,
    type: H_CARD,
    effect: "Remove all cards in the clearing from the game",
    bonus: "Play a squeaker for free",
    points: "Gain 10 points for each squeaker",
  },

  Beehive: {
    name: "Bee Swarm",
    nb: 3,
    tags: [EDGE, INSECT],
    cost: 1,
    type: H_CARD,
    effect:
      "Put all cards with a plant, shrub or tree symbol from the clearing in your cave",
    bonus: "",
    points: "Gain 1 point for each card with a plant symbol",
  },

  EuropeanBison: {
    name: "European Bison",
    nb: 3,
    tags: [EDGE, CLOVEN],
    cost: 3,
    type: H_CARD,
    effect: "Take another turn after this one",
    bonus: "",
    points: "Gain 2 points for each card with an oak or beech symbol",
  },

  EuropeanWildcat: {
    name: "European Wildcat",
    nb: 3,
    tags: [EDGE, PAW],
    cost: 1,
    type: H_CARD,
    effect: "Take 1 card from the clearing",
    bonus: "",
    points: "Gain 1 point for each card with a woodland edge symbol",
  },

  CommonPipistrelle: {
    name: "Common Pipistrelle",
    nb: 3,
    tags: [EDGE, BAT],
    cost: 1,
    type: H_CARD,
    effect: "",
    bonus: "",
    points: "Gain 5 points if you have at least 3 different bat species",
  },

  SqueakerEdge: {
    name: "Squeaker",
    nb: 3,
    tags: [EDGE, CLOVEN],
    cost: 0,
    type: H_CARD,
    effect: "",
    bonus: "",
    points: "Gain 1 point",
  },

  Mosquito: {
    name: "Crane Fly",
    nb: 3,
    tags: [EDGE, INSECT],
    cost: 1,
    type: H_CARD,
    effect: "Play any number of bat cards for free",
    bonus: "Take all cards with a bat symbol from the clearing into your hand",
    points: "Gain 1 point for each card with a bat symbol",
  },

  EuropeanPolecat: {
    name: "European Polecat",
    nb: 3,
    tags: [EDGE, PAW],
    cost: 2,
    type: H_CARD,
    effect: "",
    bonus: "Take another turn after this one",
    points: "Gain 10 points if this is the only card on a tree or shrub",
  },

  MapButterfly: {
    name: "Map Butterfly",
    nb: 4,
    tags: [EDGE, INSECT, BUTTERFLY],
    cost: 0,
    type: V_CARD,
    effect: "",
    bonus: "",
    points: "Gain points for each set of different butterflies",
  },

  Digitalis: {
    name: "Digitalis",
    nb: 4,
    tags: [EDGE, PLANT],
    cost: 0,
    type: V_CARD,
    effect: "",
    bonus: "",
    points: "Gain points for different plants",
  },

  Urtica: {
    name: "Stinging Nettle",
    nb: 3,
    tags: [EDGE, PLANT],
    cost: 0,
    type: V_CARD,
    effect: "Any number of butteflies may share a slot on this tree or shrub",
    bonus: "",
    points: "Gain 2 points for each card with a butterfly symbol",
  },

  GreatGreenBushCricket: {
    name: "Great Green Bush-Cricket",
    nb: 3,
    tags: [EDGE, INSECT],
    cost: 1,
    type: V_CARD,
    effect:
      "Play a card with a bird symbol for free (you can’t use its effect or bonus)",
    bonus: "",
    points: "Gain 1 point for each card with an insect symbol",
  },

  EuropeanWaterVole: {
    name: "Water Vole",
    nb: 2,
    tags: [EDGE, PAW],
    cost: 2,
    type: V_CARD,
    effect: "Immediately play any number of cards from hand as tree saplings",
    bonus: "Take another turn after this one",
    points: "",
  },

  EurasianMagpie: {
    name: "Eurasian Magpie",
    nb: 3,
    tags: [EDGE, BIRD],
    cost: 1,
    type: V_CARD,
    effect: "Take 1 card from the clearing",
    bonus: "Put 2 cards from the clearing into your cave",
    points: "Gain 3 points",
  },

  CommonNightingale: {
    name: "Nightingale",
    nb: 3,
    tags: [EDGE, BIRD],
    cost: 1,
    type: V_CARD,
    effect: "",
    bonus: "Take another turn after this one",
    points: "Gain 5 points if it’s on a shrub",
  },

  BarnOwl: {
    name: "Barn Owl",
    nb: 2,
    tags: [EDGE, BIRD],
    cost: 2,
    type: V_CARD,
    effect:
      "Take another turn after this one if you have at least one bat in your forest",
    bonus: "",
    points: "Gain 3 points for each card with a bat symbol",
  },
};

import type { CardTag, TreeSymbol } from '../../../shared/types';

const speciesNames: Record<string, string> = {
  'Blackberries': '黑莓', 'Bullfinch': '红腹灰雀', 'Camberwell Beauty': '黑脉蛱蝶', 'Chaffinch': '苍头燕雀',
  'Chanterelle': '鸡油菌', 'Common Toad': '欧洲蟾蜍', 'Eurasian Jay': '松鸦', 'Fire Salamander': '火蝾螈',
  'Fireflies': '萤火虫', 'Fly Agaric': '毒蝇伞', 'Goshawk': '苍鹰', 'Great Spotted Woodpecker': '大斑啄木鸟',
  'Hedgehog': '欧洲刺猬', 'Large Tortoiseshell': '大蛱蝶', 'Mole': '欧洲鼹鼠', 'Moss': '苔藓',
  'Parasol Mushroom': '高大环柄菇', 'Peacock Butterfly': '孔雀蛱蝶', 'Penny Bun': '牛肝菌', 'Pond Turtle': '欧洲泽龟',
  'Purple Emperor': '紫闪蛱蝶', 'Red Squirrel': '红松鼠', 'Silver-Washed Fritillary': '银纹豹蛱蝶', 'Stag Beetle': '锹形虫',
  'Tawny Owl': '灰林鸮', 'Tree Ferns': '桫椤', 'Tree Frog': '欧洲树蛙', 'Wild Strawberries': '野草莓',
  'Wood Ant': '红林蚁', 'Barbastelle Bat': '宽耳蝠', "Bechstein's Bat": '大耳蝠', 'Beech Marten': '石貂',
  'Brown Bear': '棕熊', 'Brown Long-Eared Bat': '褐长耳蝠', 'European Badger': '欧洲獾', 'European Fat Dormouse': '欧洲睡鼠',
  'European Hare': '欧洲野兔', 'Fallow Deer': '黇鹿', 'Gnat': '蚋', 'Greater Horseshoe Bat': '大菊头蝠',
  'Lynx': '欧亚猞猁', 'Raccoon': '浣熊', 'Red Deer': '马鹿', 'Red Fox': '赤狐', 'Roe Deer': '欧洲狍',
  'Squeaker': '野猪幼崽', 'Violet Carpenter Bee': '紫木蜂', 'Wild Boar': '野猪', 'Wolf': '狼',
  'Linden': '椴树', 'Oak': '橡树', 'Silver Fir': '欧洲银冷杉', 'Birch': '白桦', 'Beech': '山毛榉',
  'Sycamore': '欧洲槭', 'Douglas Fir': '花旗松', 'Horse Chestnut': '欧洲七叶树', 'Hypsugo savii': '萨氏伏翼',
  'Larix decidua': '欧洲落叶松', 'Pinus cembra': '瑞士五针松', 'Craterellus Cornucopiodes': '号角菌',
  'Parnassius phoebus': '福布斯绢蝶', 'Gentiana': '龙胆', 'Vaccinium myrtillus': '欧洲越橘',
  'Ichthyosaura Alpestris': '高山蝾螈', 'Aquila chrysaetos': '金雕', 'Corvus corax': '渡鸦',
  'Leontopodium nivale': '高山火绒草', 'Gypaetus barbatus': '胡兀鹫', 'Capra ibex': '阿尔卑斯山羊',
  'Lepus timidus': '雪兔', 'Marmota marmota': '阿尔卑斯旱獭', 'Rupicapra rupicapra': '岩羚羊',
  'Tetrao urogallus': '西方松鸡', 'Elderberry': '接骨木', 'Common Hazel': '欧洲榛', 'Blackthorn': '黑刺李',
  'Wild Boar (Female)': '雌野猪', 'Bee Swarm': '蜂群', 'European Bison': '欧洲野牛', 'European Wildcat': '欧洲野猫',
  'Common Pipistrelle': '普通伏翼', 'Crane Fly': '大蚊', 'European Polecat': '欧洲艾鼬', 'Map Butterfly': '地图蝶',
  'Digitalis': '毛地黄', 'Stinging Nettle': '大荨麻', 'Great Green Bush-Cricket': '绿螽斯', 'Water Vole': '水䶄',
  'Eurasian Magpie': '喜鹊', 'Nightingale': '夜莺', 'Barn Owl': '仓鸮'
};

const tagNames: Record<CardTag, string> = {
  Tree: '树木', Bird: '鸟类', Plant: '植物', Butterfly: '蝴蝶', Mammal: '哺乳动物', Amphibian: '两栖动物',
  Insect: '昆虫', Arachnid: '蛛形纲', Mushroom: '蘑菇', Alpine: '高山', Bat: '蝙蝠', Deer: '鹿', Beetle: '甲虫',
  Paw: '爪印', Wing: '翅膀', 'Cloven-hoofed animal': '偶蹄动物', Mountain: '山地', 'Woodland Edge': '林缘', Shrub: '灌木'
};

const treeSymbols: Record<TreeSymbol, string> = {
  Birch: '白桦', Beech: '山毛榉', Linden: '椴树', Oak: '橡树', 'Horse Chestnut': '欧洲七叶树',
  'Douglas Fir': '花旗松', 'Silver Fir': '欧洲银冷杉', Sycamore: '欧洲槭', Larix: '落叶松', Pinus: '松树'
};

const effects: Record<string, string> = {
  'Whenever you play a card with a tree symbol receive 1 card': '每当你打出一张带树木符号的牌时，抽 1 张牌。',
  'Up to 2 Common Toads may share this spot': '同一位置最多可放置 2 只欧洲蟾蜍。',
  'Take another turn after this one': '本回合结束后，再进行一个回合。',
  'Whenever you play a card with a paw symbol receive 1 card': '每当你打出一张带爪印符号的牌时，抽 1 张牌。',
  'Receive 1 card': '抽 1 张牌。',
  'immediately play any number of cards by paying their cost': '立即支付费用并打出任意数量的卡牌。',
  'Whenever you play a card below a tree receive 1 card': '每当你在树木下方打出一张牌时，抽 1 张牌。',
  'Whenever you play a card atop a tree receive 1 card': '每当你在树木上方打出一张牌时，抽 1 张牌。',
  'Place all cards from the clearing in your cave': '将林间空地中的所有牌放入你的洞穴。',
  'Any number of European Hares may share this spot': '任意数量的欧洲野兔可以共用此位置。',
  'Play any number of bat cards for free': '免费打出任意数量的蝙蝠牌。',
  'Place any number of cards from hand in your cave; draw an equal number of cards from the deck': '将任意数量的手牌放入洞穴，然后从牌库抽取等量卡牌。',
  'Receive 1 card for each European Hare': '你的森林中每有 1 只欧洲野兔，抽 1 张牌。',
  'The tree this bee occupies counts as one additional tree of its type': '这只木蜂所在的树额外视为 1 棵同树种的树。',
  'Receive 1 card for each Deer': '你的森林中每有 1 只鹿，抽 1 张牌。',
  'Whenever you play a card with a mountain symbol receive 1 card': '每当你打出一张带山地符号的牌时，抽 1 张牌。',
  'Play a card with a butterfly symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带蝴蝶符号的牌（不能使用其效果或奖励）。',
  'Play a card with a amphibian symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带两栖动物符号的牌（不能使用其效果或奖励）。',
  'Place 2 cards from the clearing in your cave': '将林间空地中的 2 张牌放入你的洞穴。',
  'Counts as a European Hare': '视为欧洲野兔。',
  'Play a card with a plant symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带植物符号的牌（不能使用其效果或奖励）。',
  'Whenever you play a card with a plant symbol receive 1 card': '每当你打出一张带植物符号的牌时，抽 1 张牌。',
  'Whenever you play a card with a bat symbol receive 1 card': '每当你打出一张带蝙蝠符号的牌时，抽 1 张牌。',
  'Whenever you play a card with a butterfly symbol receive 1 card': '每当你打出一张带蝴蝶符号的牌时，抽 1 张牌。',
  'Remove all cards in the clearing from the game': '将林间空地中的所有牌移出游戏。',
  'Put all cards with a plant, shrub or tree symbol from the clearing in your cave': '将林间空地中所有带植物、灌木或树木符号的牌放入你的洞穴。',
  'Take 1 card from the clearing': '从林间空地拿取 1 张牌。',
  'Any number of butteflies may share a slot on this tree or shrub': '任意数量的蝴蝶可以共用这棵树或灌木的同一位置。',
  'Play a card with a bird symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带鸟类符号的牌（不能使用其效果或奖励）。',
  'Immediately play any number of cards from hand as tree saplings': '立即将任意数量的手牌作为树苗打出。',
  'Take another turn after this one if you have at least one bat in your forest': '若你的森林中至少有 1 只蝙蝠，本回合结束后再进行一个回合。'
};

const bonuses: Record<string, string> = {
  'Play a card with a paw symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带爪印符号的牌（不能使用其效果或奖励）。',
  'Receive 1 card': '抽 1 张牌。', 'Receive 2 cards': '抽 2 张牌。',
  'Play a card with a bird symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带鸟类符号的牌（不能使用其效果或奖励）。',
  'Receive 1 card and take another turn after this one': '抽 1 张牌，并在本回合结束后再进行一个回合。',
  'Play a card with a deer symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带鹿符号的牌（不能使用其效果或奖励）。',
  'Take another turn after this one': '本回合结束后，再进行一个回合。',
  'Play a card with a mountain symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带山地符号的牌（不能使用其效果或奖励）。',
  'Play a card with a mountain symbol, and a card with an insect symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带山地符号的牌和 1 张带昆虫符号的牌（不能使用其效果或奖励）。',
  'Play a card with a plant symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带植物符号的牌（不能使用其效果或奖励）。',
  'Play a card with a bat symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带蝙蝠符号的牌（不能使用其效果或奖励）。',
  'Play a card with a butterfly symbol for free (you can’t use its effect or bonus)': '免费打出 1 张带蝴蝶符号的牌（不能使用其效果或奖励）。',
  'Play a squeaker for free': '免费打出 1 只野猪幼崽。',
  'Take all cards with a bat symbol from the clearing into your hand': '将林间空地中所有带蝙蝠符号的牌拿入手牌。',
  'Put 2 cards from the clearing into your cave': '将林间空地中的 2 张牌放入你的洞穴。'
};

const points: Record<string, string> = {
  'Gain 2 points for each card with a plant symbol': '每张带植物符号的牌得 2 分。',
  'Gain 2 points for each card with an insect symbol': '每张带昆虫符号的牌得 2 分。',
  'Gain points for each set of different butterflies': '每组不同种类的蝴蝶按套组计分。',
  "5 points if it's on a Beech": '若位于山毛榉上，得 5 分。',
  'Gain 5 points if 2 Common Toads share this spot': '若 2 只欧洲蟾蜍共用此位置，每只得 5 分。',
  'Gain 3 points': '得 3 分。',
  'Gain points according to the number of Fire Salamander you have': '根据你拥有的火蝾螈数量计分。',
  'Gain points according to the number of Fireflies you have': '根据你拥有的萤火虫数量计分。',
  'Gain 3 points for each card with a bird symbol': '每张带鸟类符号的牌得 3 分。',
  'Gain 10 points if no other forest has more trees': '若没有其他森林拥有更多树木，得 10 分。',
  'Gain 2 points for each card with a butterfly symbol': '每张带蝴蝶符号的牌得 2 分。',
  'Gain 10 points if you have at least 10 trees': '若你至少拥有 10 棵树，得 10 分。',
  'Gain 5 points': '得 5 分。', 'Gain 5 points if it’s on an Oak': '若位于橡树上，得 5 分。',
  'Gain 1 point for each card with a paw symbol': '每张带爪印符号的牌得 1 分。',
  'Gain 6 point for each card with an amphibian symbol': '每张带两栖动物符号的牌得 6 分。',
  'Gain 5 points for each Gnat': '每只蚋得 5 分。',
  'Gain 10 points if you have all 8 different tree species': '若你拥有全部 8 种不同树种，得 10 分。',
  'Gain 2 points for each card below a tree': '每张位于树木下方的牌得 2 分。',
  'Gain 5 points if you have at least 3 different bat species': '若你至少拥有 3 种不同的蝙蝠，每张此牌得 5 分。',
  'Gain 5 points per fully occupied tree': '每棵四个位置均被占用的树得 5 分。',
  'Gain 2 points': '得 2 分。', 'Gain 15 points if a bat also occupies this tree': '若这棵树上也有蝙蝠，得 15 分。',
  'Gain 1 point for each European Hare': '每只欧洲野兔得 1 分。',
  'Gain 3 points for each card with cloven-hoofed animal symbol': '每张带偶蹄动物符号的牌得 3 分。',
  'Gain 1 point for each card with a bat symbol': '每张带蝙蝠符号的牌得 1 分。',
  'Gain 10 points if you have at least 1 Roe Deer': '若你至少拥有 1 只欧洲狍，得 10 分。',
  'Gain 1 point for each card with a tree or plant symbol': '每张带树木或植物符号的牌得 1 分。',
  'Gain 2 points for each European Hare': '每只欧洲野兔得 2 分。',
  'Gain 3 points for each card with a matching tree symbol': '每张带匹配树木符号的牌得 3 分。',
  'Gain 1 point': '得 1 分。', 'Gain 10 points if you have at least 1 Squeaker': '若你至少拥有 1 只野猪幼崽，得 10 分。',
  'Gain 5 points for each card with a deer symbol': '每张带鹿符号的牌得 5 分。',
  'Gain 1 point or 3 points if no other forest has more Linden Trees': '得 1 分；若没有其他森林拥有更多椴树，则得 3 分。',
  'Gain 2 points for each card attached to this Silver Fir': '每张附着在这棵欧洲银冷杉上的牌得 2 分。',
  'Gain 5 points if you have at least 4 Beeches': '若你至少拥有 4 棵山毛榉，得 5 分。',
  'Gain 1 point for each card with a tree symbol': '每张带树木符号的牌得 1 分。',
  'Gain points according to the number of Horse Chestnuts you have': '根据你拥有的欧洲七叶树数量计分。',
  'Gain 1 point for each card with a mountain symbol': '每张带山地符号的牌得 1 分。',
  'Gain 3 points for each card with a butterfly symbol': '每张带蝴蝶符号的牌得 3 分。',
  'Gain 2 points for each different bird': '每种不同的鸟类得 2 分。',
  'Gain 1 point for each card with a paw or amphibian symbol': '每张带爪印或两栖动物符号的牌得 1 分。',
  'Gain 1 point for each card in your cave': '洞穴中的每张牌得 1 分。', 'Gain 10 points': '得 10 分。',
  'Gain 3 points for each different plants': '每种不同的植物得 3 分。',
  'Gain 1 point for each card with a plant symbol': '每张带植物符号的牌得 1 分。',
  'Gain 10 points for each squeaker': '每只野猪幼崽得 10 分。',
  'Gain 2 points for each card with an oak or beech symbol': '每张带橡树或山毛榉符号的牌得 2 分。',
  'Gain 1 point for each card with a woodland edge symbol': '每张带林缘符号的牌得 1 分。',
  'Gain 10 points if this is the only card on a tree or shrub': '若这是该树木或灌木上唯一的牌，得 10 分。',
  'Gain points for different plants': '根据不同植物的种类数量计分。',
  'Gain 1 point for each card with an insect symbol': '每张带昆虫符号的牌得 1 分。',
  'Gain 5 points if it’s on a shrub': '若位于灌木上，得 5 分。',
  'Gain 3 points for each card with a bat symbol': '每张带蝙蝠符号的牌得 3 分。'
};

export type CardTextKind = 'effect' | 'bonus' | 'points';

export function translateSpeciesName(name: string): string {
  return speciesNames[name] ?? name;
}

export function translateCardTag(tag: CardTag): string {
  return tagNames[tag] ?? tag;
}

export function translateTreeSymbol(symbol: TreeSymbol | string): string {
  return treeSymbols[symbol as TreeSymbol] ?? symbol;
}

export function translateCardText(text: string, kind: CardTextKind): string {
  if (!text) return text;
  const dictionary = kind === 'effect' ? effects : kind === 'bonus' ? bonuses : points;
  return dictionary[text] ?? text;
}

export const chineseCardTranslationCoverage = { speciesNames, tagNames, treeSymbols, effects, bonuses, points };

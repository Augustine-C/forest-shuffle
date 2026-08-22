/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'zh-CN';

const en = {
  language: 'Language', status: 'Status', connected: 'Connected', disconnected: 'Disconnected', rules: 'Rules', backToGame: 'Back to game', backToLobby: 'Back to lobby', gameInfo: 'Game information',
  enterName: 'Enter name', enterNameAndCode: 'Enter name and room code', copyRoomCode: 'Copy this room code:', forestGathering: 'The forest is gathering', gameLobby: 'Game Lobby', lobbyIntro: 'Choose the decks, invite your table, then begin.',
  roomCode: 'Room code', copied: 'Copied!', copyCode: 'Copy code', atTable: 'At the table', players: 'Players', host: 'Host', you: 'You', invite: 'Share {code} to invite up to {count} more player(s).', hostControls: 'Host controls', gameSetup: 'Game setup',
  startingPlayer: 'Who most recently walked in a forest?', playableDecks: 'Playable decks', baseGame: 'Base game', baseDesc: 'The heart of the forest', alpine: 'Alpine', alpineDesc: 'Mountain species and trees', edge: 'Woodland Edge', edgeDesc: 'Shrubs and edge dwellers',
  deckNote: 'Exploration and promotional cards remain reference-only.', startGame: 'Start game', readyToGrow: 'Ready to grow', waitingHost: 'Waiting for the host', waitingHostDesc: 'The game will begin when the host finishes choosing the decks.',
  buildWoodland: 'Build a thriving woodland', forestShuffle: 'Forest Shuffle', homeIntro: 'Plant trees, welcome wildlife, and create the most valuable forest before winter arrives.', playerCount: '2–5 players', minutes: '60 min', strategy: 'Strategy', onlineTable: 'Online table', enterForest: 'Enter the forest',
  joinIntro: 'Create a new room or join friends with their four-letter code.', yourName: 'Your name', namePlaceholder: 'How should the forest know you?', createGame: 'Create a new game', orJoin: 'or join a room', joinGame: 'Join game', exploreGallery: 'Explore the card gallery', galleryDesc: 'Browse all 233 cards before playing', readRules: 'Read the rules', rulesDesc: 'Full reference in English and 中文',
  cardReference: 'Card reference', galleryTitle: 'Forest Shuffle Card Gallery', galleryIntro: 'Browse all physical cards and inspect both halves of split cards.', cardFilters: 'Card filters', search: 'Search', searchPlaceholder: 'Species name or card number', deck: 'Deck', allDecks: 'All decks', cardType: 'Card type', allTypes: 'All types', trees: 'Trees', leftRight: 'Left / right', topBottom: 'Top / bottom', winter: 'Winter',
  hideDuplicates: 'Hide duplicate artwork', physicalCards: '{shown} of {total} physical cards', cards: 'Cards', noCards: 'No cards match these filters.', cardNumber: 'Card #{number}', winterCard: 'Winter card', closeDetails: 'Close card details', cost: 'Cost', treeSymbol: 'Tree symbol', effect: 'Effect', bonus: 'Bonus', points: 'Points', selectCardDetails: 'Select a card to keep its details open.', symbol: 'Symbol',
  gameOver: 'Game Over!', pointCount: '{count} points', viewRules: 'View Rules', backHome: 'Back to Home', yourTurn: "It's YOUR Turn!", waitingFor: 'Waiting for {name}...', myScore: 'My score', currentScore: 'Your current score is {score}', scoreBreakdown: 'Score breakdown', breakdownUnavailable: 'Breakdown will appear after the game server updates.', butterflySet: 'Butterfly set {number}', differentButterflies: '{count} different species', scoringCards: '{count} scoring card(s)', collectionCards: '{count} card(s) in this set', caveCards: '{count} card(s) × 1 point', totalScore: 'Total', deckCount: 'Deck: {count} cards', winterCount: 'Winter: {count}/3',
  replacementHand: 'Draw replacement hand', keepHand: 'Keep this hand', currentSixRemoved: 'Your current six cards will be returned to the box.', drawDeck: 'Draw from deck', takeSelected: 'Take selected clearing card', backTurn: 'Back to turn options', selectExact: 'Select exactly {count} card(s) from the clearing.', confirmSelection: 'Confirm selection', decline: 'Decline',
  selectEligible: 'Select an eligible card from your hand, then choose its forest position.', playFree: 'Play {name} for free', chooseHalf: 'Choose a highlighted forest slot to select the card half.', chooseHalfCost: 'Choose a highlighted forest slot to select the card half and its cost.', plantPay: 'Plant {name} (Pay {cost})', playPay: 'Play {name} (Pay {cost})', done: 'Done', paidPlayHelp: 'Select and place cards normally. Choose Done after your final play.',
  selectedHandCards: '{count} hand card(s) selected.', exchangeSelected: 'Exchange selected cards', playSaplings: 'Play selected saplings', matchingMove: 'The matching cards will all move to your hand.', takeMatching: 'Take all matching cards', triggerOrder: 'Resolve any triggers you want in your chosen order.', drawFor: 'Draw for {name}', finishTriggers: 'Finish triggers', chooseAbilities: '{name}: choose abilities', useBoth: 'Use effect, then bonus', useEffectOnly: 'Use effect only', useBonusOnly: 'Use bonus only', useNeither: 'Use neither',
  drawOne: 'Draw 1 Card', drawTwo: 'Draw 2 Cards', takeAndDraw: 'Take {take} + Draw {draw}', takeDeckNow: 'Take from deck', chooseTurnAction: 'Draw cards or play one card', clickClearingToTake: 'Click any clearing card to take it', selectedPlay: 'Playing {name}', paymentProgress: 'Payment: {selected} of {required} cards', cancelPlay: 'Cancel', playSapling: 'Play as Sapling', waitingPending: 'Waiting for the pending action to be resolved.', myHand: 'My Hand ({count})', myForest: 'My Forest', playerForest: "{name}'s Forest", chooseForest: 'Choose a forest to view', myForestTab: 'My forest', viewingOnly: 'Viewing only — switch to My forest to place cards.', noTrees: 'No trees yet. Plant one!', emptyForest: 'This forest is empty.', sapling: 'Sapling',
  clearing: 'Clearing (Market)', empty: 'Empty', myCave: 'My Cave ({count})', opponents: 'Opponents', handCount: 'Hand: {count} cards', forestCount: 'Forest: {count} trees', caveCount: 'Cave: {count} cards', viewForest: 'View forest', needCost: 'Need {required} cards for cost. Selected {selected}.', rulesDialog: 'Forest Shuffle rules', rulesLanguage: 'Rules language'
} as const;

type TranslationKey = keyof typeof en;
type TranslationValues = Record<string, string | number>;

const zh: Record<TranslationKey, string> = {
  language: '语言', status: '状态', connected: '已连接', disconnected: '未连接', rules: '规则', backToGame: '返回游戏', backToLobby: '返回大厅', gameInfo: '游戏信息',
  enterName: '请输入名字', enterNameAndCode: '请输入名字和房间代码', copyRoomCode: '复制此房间代码：', forestGathering: '森林伙伴正在集结', gameLobby: '游戏大厅', lobbyIntro: '选择牌组，邀请伙伴，然后开始游戏。',
  roomCode: '房间代码', copied: '已复制！', copyCode: '复制代码', atTable: '已入座', players: '玩家', host: '房主', you: '你', invite: '分享 {code}，还可邀请 {count} 位玩家。', hostControls: '房主设置', gameSetup: '游戏设置',
  startingPlayer: '谁最近在森林里散过步？', playableDecks: '可用牌组', baseGame: '基础游戏', baseDesc: '森林的核心牌组', alpine: '高山扩展', alpineDesc: '高山物种与树木', edge: '林缘扩展', edgeDesc: '灌木与林缘生物',
  deckNote: '探索与推广卡牌目前仅供参考。', startGame: '开始游戏', readyToGrow: '准备生长', waitingHost: '等待房主', waitingHostDesc: '房主完成牌组选择后，游戏便会开始。',
  buildWoodland: '打造生机勃勃的森林', forestShuffle: '森森不息', homeIntro: '种植树木，迎接野生动物，在冬天来临前打造最具价值的森林。', playerCount: '2–5 名玩家', minutes: '约 60 分钟', strategy: '策略游戏', onlineTable: '在线牌桌', enterForest: '进入森林',
  joinIntro: '创建新房间，或使用四位代码加入好友。', yourName: '你的名字', namePlaceholder: '森林该如何称呼你？', createGame: '创建新游戏', orJoin: '或加入房间', joinGame: '加入游戏', exploreGallery: '浏览卡牌图鉴', galleryDesc: '游戏前查看全部 233 张卡牌', readRules: '阅读规则', rulesDesc: '查看完整中文版与英文版规则',
  cardReference: '卡牌资料', galleryTitle: '《森森不息》卡牌图鉴', galleryIntro: '浏览所有实体卡牌，并查看双拼卡的两侧信息。', cardFilters: '卡牌筛选', search: '搜索', searchPlaceholder: '物种英文名或卡牌编号', deck: '牌组', allDecks: '全部牌组', cardType: '卡牌类型', allTypes: '全部类型', trees: '树木', leftRight: '左 / 右', topBottom: '上 / 下', winter: '冬季',
  hideDuplicates: '隐藏重复图案', physicalCards: '显示 {shown} / {total} 张实体卡牌', cards: '卡牌', noCards: '没有符合筛选条件的卡牌。', cardNumber: '卡牌 #{number}', winterCard: '冬季卡', closeDetails: '关闭卡牌详情', cost: '费用', treeSymbol: '树木符号', effect: '效果', bonus: '奖励', points: '分数', selectCardDetails: '选择一张卡牌以持续查看详情。', symbol: '符号',
  gameOver: '游戏结束！', pointCount: '{count} 分', viewRules: '查看规则', backHome: '返回首页', yourTurn: '轮到你了！', waitingFor: '等待 {name}…', myScore: '我的分数', currentScore: '你当前的分数为 {score}', scoreBreakdown: '分数明细', breakdownUnavailable: '游戏服务更新后将显示分数明细。', butterflySet: '蝴蝶套组 {number}', differentButterflies: '{count} 种不同蝴蝶', scoringCards: '{count} 张计分牌', collectionCards: '套组中共 {count} 张', caveCards: '{count} 张牌 × 1 分', totalScore: '总分', deckCount: '牌库：{count} 张', winterCount: '冬季：{count}/3',
  replacementHand: '重抽手牌', keepHand: '保留手牌', currentSixRemoved: '你当前的六张牌将移出游戏。', drawDeck: '从牌库抽取', takeSelected: '拿取所选林间空地卡牌', backTurn: '返回行动选择', selectExact: '请从林间空地选择恰好 {count} 张牌。', confirmSelection: '确认选择', decline: '放弃',
  selectEligible: '从手牌选择一张符合条件的牌，然后选择森林位置。', playFree: '免费打出 {name}', chooseHalf: '选择高亮的森林卡槽以确定打出哪一侧。', chooseHalfCost: '选择高亮的森林卡槽以确定卡牌侧面和费用。', plantPay: '种植 {name}（支付 {cost}）', playPay: '打出 {name}（支付 {cost}）', done: '完成', paidPlayHelp: '按通常方式选择并放置卡牌；打出最后一张后选择“完成”。',
  selectedHandCards: '已选择 {count} 张手牌。', exchangeSelected: '交换所选卡牌', playSaplings: '将所选卡牌作为树苗打出', matchingMove: '所有符合条件的牌都会移入你的手牌。', takeMatching: '拿取所有符合条件的牌', triggerOrder: '按你选择的顺序结算任意触发效果。', drawFor: '结算 {name} 的抽牌', finishTriggers: '结束触发结算', chooseAbilities: '{name}：选择能力', useBoth: '先使用效果，再使用奖励', useEffectOnly: '仅使用效果', useBonusOnly: '仅使用奖励', useNeither: '都不使用',
  drawOne: '抽 1 张牌', drawTwo: '抽 2 张牌', takeAndDraw: '拿取 {take} 张 + 抽取 {draw} 张', takeDeckNow: '从牌库拿取', chooseTurnAction: '抽取卡牌或打出一张牌', clickClearingToTake: '点击任意林间空地卡牌即可拿取', selectedPlay: '准备打出：{name}', paymentProgress: '费用：已选择 {selected}/{required} 张牌', cancelPlay: '取消', playSapling: '作为树苗打出', waitingPending: '等待当前待处理行动完成。', myHand: '我的手牌（{count}）', myForest: '我的森林', playerForest: '{name} 的森林', chooseForest: '选择要查看的森林', myForestTab: '我的森林', viewingOnly: '当前仅供查看——切换至“我的森林”才能放置卡牌。', noTrees: '还没有树，种下一棵吧！', emptyForest: '这片森林还是空的。', sapling: '树苗',
  clearing: '林间空地（市场）', empty: '空', myCave: '我的洞穴（{count}）', opponents: '对手', handCount: '手牌：{count} 张', forestCount: '森林：{count} 棵树', caveCount: '洞穴：{count} 张', viewForest: '查看森林', needCost: '需要 {required} 张牌支付费用，当前已选 {selected} 张。', rulesDialog: '《森森不息》规则', rulesLanguage: '规则语言'
};

interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLanguage(): Language {
  const saved = localStorage.getItem('forest_shuffle_language');
  if (saved === 'en' || saved === 'zh-CN') return saved;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const setLanguage = (next: Language) => {
    localStorage.setItem('forest_shuffle_language', next);
    setLanguageState(next);
  };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const t = (key: TranslationKey, values: TranslationValues = {}) => {
    let text = language === 'en' ? en[key] : zh[key];
    Object.entries(values).forEach(([name, value]) => { text = text.replaceAll(`{${name}}`, String(value)); });
    return text;
  };
  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <div className="language-switcher" role="group" aria-label={t('language')}>
      <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
      <button type="button" className={language === 'zh-CN' ? 'active' : ''} aria-pressed={language === 'zh-CN'} onClick={() => setLanguage('zh-CN')}>中文</button>
    </div>
  );
}

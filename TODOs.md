# Forest Shuffle Rules Implementation TODOs

This document records gaps found by comparing the game implementation with the bundled rulebook and card appendix in `help/game-rules/`.

## P0 - Complete playable rule flow

- [x] Implement pending effect and bonus actions end to end.
  - [x] Consume the `bonusActions` produced by `server/src/game/effectsEngine.ts` instead of discarding them in `GameState.playCard()`.
  - Add server events, validation, serialized pending-action state, and client controls for:
    - [x] selecting clearing cards for a hand or cave;
    - [x] playing one eligible card for free;
    - [x] playing any number of eligible cards for free;
    - [x] playing multiple cards while paying their combined costs (Mole);
    - [x] exchanging hand cards for deck cards (Raccoon);
    - [x] playing cards as saplings (Water Vole);
    - [x] taking all matching cards from the clearing;
    - [x] playing a Squeaker for free.
  - [x] Keep the active turn open until every required selection and nested effect is resolved.
  - [x] Reject unrelated actions while a mandatory selection is pending.

- [x] Implement permanent and triggered effects.
  - [x] Trigger Chanterelle, Fly Agaric, Parasol Mushroom, Penny Bun, Black Trumpet, and expansion shrubs at the timing specified in the appendix.
  - [x] Resolve permanent effects after payment but before the played card's own effect and bonus.
  - [x] Support multiple copies of a trigger and the ordering of simultaneous triggers.
  - [x] Stop all remaining resolution immediately if the third winter card appears.

- [x] Support cards sharing a slot.
  - [x] Change `PlacedTree` slots from a single card to a representation that can hold multiple cards where allowed.
  - [x] Implement European Hare, Common Toad, Cuckoo, and Stinging Nettle placement restrictions.
  - [x] Replace the `checkSharedSlot()` stub in `server/src/game/cardMatching.ts`.
  - [x] Update serialization, client rendering, placement validation, card counting, and scoring for shared slots.

- [x] Make effects and bonuses optional.
  - [x] Ask the player whether to use an eligible effect or color-matched bonus.
  - [x] Always resolve the effect before the bonus when both are chosen.
  - [x] Permit a player to decline either or both without blocking the turn.

- [x] Correct end-of-turn and extra-turn sequencing.
  - [x] Check and empty a clearing containing 10 or more cards before beginning an awarded extra turn.
  - [x] Preserve multiple extra turns earned during nested Mole resolutions.
  - [x] Do not advance the active player while an extra turn or pending action remains.

## P0 - Complete scoring

- [x] Replace the partial text parser with explicit, testable scoring rules for every supported species.
  - The current parser returns zero for many conditional and species-based cards, including Beech, Linden, bats, Hares, deer, Lynx, Wild Boar, Moss, and several expansion species.
  - Avoid treating phrases such as "per fully occupied tree" as fixed points.
  - Add an exhaustive test that fails when a species with scoring text has no scoring implementation.

- [x] Correct variable scoring tables.
  - Fireflies: 0/10/15/20 points for 1/2/3/4 or more Fireflies.
  - Fire Salamanders: 5/15/25 points for 1/2/3 or more Fire Salamanders.
  - Horse Chestnuts: 1/4/9/16/25/36 points for 1-6 cards and 49 points for 7 or more, including Violet Carpenter Bee adjustments.
  - Butterflies: 0/3/6/12/20/35/55/80 points for 1-8 different species in each set.

- [x] Score repeated butterfly sets correctly.
  - Preserve duplicate butterfly cards so they can form additional sets.
  - Assign each butterfly card to at most one set.
  - Support the additional expansion butterfly species.

- [ ] Implement positional, adjacency, and shared-slot scoring.
  - Fully occupied trees and cards attached to specific tree species.
  - European Fat Dormouse opposite a bat.
  - European Polecat alone on a tree or shrub.
  - Common Toad and European Hare shared-slot totals.
  - Silver Fir attached-card totals when slots contain multiple cards.
  - Nightingale on shrubs and Cuckoo placement-dependent behavior.

- [ ] Implement forest-wide and opponent-relative scoring.
  - Most trees and most Lindens, including ties.
  - Tree-species thresholds and tree saplings where the rule includes them.
  - Matching tree symbols and multi-type symbol scoring.
  - Different plant/bird types, bats, Hares, deer, Squeakers, and other species dependencies.
  - Violet Carpenter Bee adjustments only for the five applicable rulings.

## P1 - Core rule completeness

- [ ] Implement the initial-hand mulligan.
  - Offer it only when the six-card opening hand contains no tree.
  - Return the original six cards to the box rather than the clearing or deck.
  - Permit at most one mulligan per player.

- [ ] Represent the start-player rule.
  - Allow the lobby to select the player who most recently walked in a forest, or document and expose an agreed digital substitute.

- [ ] Prevent drawing as a pass at the 10-card hand limit.
  - A player with 10 cards must play a card rather than select the draw action.
  - A player with 9 cards draws exactly one card.

- [ ] Preserve one-at-a-time draw choices.
  - Let players choose deck or clearing separately for each draw instead of submitting all clearing choices up front.
  - Stop immediately if a draw reveals the third winter card.

- [ ] Verify tree-sapling interactions consistently.
  - Count saplings for cards whose rules explicitly include them.
  - Exclude them from tree species and tree-color counts where required.
  - Reveal a card to the clearing whenever a sapling is played if required by the applicable play path.

- [ ] Hide cave contents from opponents.
  - Serialize cave counts publicly while sending card identities only to the owning player, unless a rule explicitly reveals them.

## P1 - Expansion support

- [ ] Add lobby selection for the base game, Alpine expansion, and Woodland Edge expansion.
  - Pass the selected deck list into `createDeck()` instead of always using the base deck.
  - Apply the correct setup and card-count rules for the chosen combination.

- [ ] Distinguish shrubs from trees in the game model.
  - Shrubs provide four slots but are not trees and have no tree symbol.
  - Playing a shrub must not trigger rules that apply only to playing a tree.
  - Update all tree-counting and placement helpers accordingly.

- [ ] Add Exploration and promotional cards if they are intended to be playable.
  - Add their card records, species definitions, effects, bonuses, scoring, images, and tests.
  - Otherwise, clearly label the digital appendix entries as reference-only.

- [ ] Implement expansion-specific edge cases.
  - Mountain Hare scoring with European Hares without sharing their slot.
  - O Christmas Tree delaying the third winter card once.
  - Mistletoe flipping a tree into a sapling.
  - Blackthorn/Common Hazel/Elderberry triggers.
  - Water Vole and nested Mole resolution order.
  - Female Wild Boar clearing removal and free Squeaker bonus.

## P1 - Validation and state integrity

- [ ] Make `GameState` enforce active-player and game-ended checks, not only the socket layer.
- [ ] Validate every pending choice server-side against card types, ownership, available slots, hand limits, and current clearing contents.
- [ ] Ensure rejected and interrupted actions are atomic and do not partially mutate hands, forests, caves, or the clearing.
- [ ] Define behavior for an exhausted deck before the third winter card, even if it should be unreachable in normal play.
- [ ] Preserve pending effects and extra turns across disconnect/rejoin.

## P1 - Tests required for rule confidence

- [ ] Add deterministic unit tests for every species' scoring rule.
- [ ] Add effect and bonus tests covering both use and decline paths.
- [ ] Add nested-resolution tests for mushrooms, Mole, Water Vole, free plays, and winter interruption.
- [ ] Add placement tests for all orientations, shrubs, shared slots, and full trees.
- [ ] Add clearing tests for exactly 10 cards, more than 10 cards, cave movement, and removal from the game.
- [ ] Add setup tests for 2-5 players, mulligans, deck combinations, and winter-card placement.
- [ ] Add scoring examples from the rulebook and appendix as regression fixtures.
- [ ] Add multiplayer tests for invalid turns, hidden information, reconnects, and final-score synchronization.
- [ ] Keep the required verification suite green:
  - `cd server && npm test && npm run build`
  - `cd client && npm run build && npm run lint`

## Currently working subset

The current implementation already covers basic deck construction, ordinary payments, single-card slot placement, tree and sapling placement, simple deck draws, the hand-size cap during draws, clearing cleanup in ordinary turns, winter-card replacement and termination, caves worth one point per card, several simple draw/extra-turn effects, and a limited subset of fixed or per-symbol scoring. Existing automated checks pass, but they do not cover the incomplete rules above.

#!/usr/bin/env python3
"""Convert the bundled Forest Shuffle rule PDFs into reference Markdown."""

from pathlib import Path
import re

import pdfplumber


ROOT = Path(__file__).resolve().parent
RULES_DIR = ROOT / 'game-rules'


def extract_appendix() -> str:
    pages: list[str] = []
    with pdfplumber.open(RULES_DIR / 'appendix.pdf') as pdf:
        for number, page in enumerate(pdf.pages, 1):
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ''
            # The page number precedes decorative card examples in the PDF.
            text = re.split(rf'\n{number}\n', text, maxsplit=1)[0]
            text = re.sub(r'-\n(?=[a-z])', '', text)
            text = re.sub(r'\n(?=[a-z(])', ' ', text)
            text = re.sub(r'[ \t]+', ' ', text)
            text = re.sub(
                r'(?m)^([A-Z][^\n]+\((?:[^\n]*)(?:tree|shrub|left/right|top|bottom|above)[^\n]*cost: [0-9]+\))$',
                r'## \1',
                text,
            )
            text = re.sub(r'(?m)^(Permanent effect|Effect|Bonus|Points|Example|Special case):', r'**\1:**', text)
            pages.append(text.strip())

    body = '\n\n'.join(pages)
    body = re.sub(r'^Forest Shuffle\nAAppppeennddiixx\n', '', body)
    body = re.sub(
        r'^Including.*?does not have one\.\n',
        'This appendix lists every card alphabetically, including the Alpine, Woodland Edge, and Exploration expansion cards. '
        'Each heading gives its placement, deck frequency, and cost. If an entry has no effect or bonus, '
        'the card has none.\n',
        body,
        count=1,
        flags=re.DOTALL,
    )
    # Illustrated examples produce interleaved card text in PDF extraction. The prose
    # examples are therefore omitted; effect, bonus, and scoring rules are retained.
    body = re.sub(r'\n\*\*Example:\*\*.*?(?=\n## |\Z)', '', body, flags=re.DOTALL)
    body = re.sub(r'(?m)^\d{1,2}$\n?', '', body)
    body = re.sub(r'(?m)^.*(?:\b\w\b ){6,}.*$\n?', '', body)
    body = re.sub(r'(?m)^(?:Stag Beetle|Great Spotted Woodpecker)$\n?', '', body)
    body = re.sub(r'(?m)^(?:070|02A)$\n?', '', body)
    body = re.sub(r'(?m)(?<!\n)^(## )', r'\n\1', body)
    body = body.replace('–', '-').replace('—', '-')
    body = body.replace('( , ', '(').replace('( left/right', '(left/right')
    body = body.replace('* , , :', '*Expansion note:*').replace('* , :', '*Expansion note:*').replace('* :', '*Expansion note:*')

    # Replace graphical icons with searchable text. Each replacement is scoped to
    # a single card entry and was checked against the rendered source page.
    icon_terms = {
        'Alpine Marmot': [('different type', 'different plant type')],
        'Alpine Newt': [('Place a card and/or a card', 'Place a card with the Mountain symbol and/or a card with the insect symbol'), ('each card', 'each insect-symbol card')],
        'Barn Owl': [('each card', 'each bat card')],
        'Bee Swarm': [('with the , , or symbol', 'with the plant, shrub, or tree symbol'), ('1 points for each card', '1 point for each plant card')],
        'Blackthorn': [('play a card', 'play a butterfly card'), ('playing a card', 'playing a butterfly card'), ('Place a card', 'Place a butterfly card')],
        'Blackberries': [('each card', 'each plant card')],
        'Black Trumpet': [('play a card', 'play a card with the Mountain symbol'), ('playing a card', 'playing a card with the Mountain symbol')],
        'Blueberry': [('Place a card', 'Place an amphibian card'), ('different type', 'different bird type')],
        'Bullfinch': [('Each card', 'Each insect card')],
        'Capercaillie': [('Place a card', 'Place a plant card'), ('each card', 'each plant card')],
        'Cardinal': [('current number of cards', 'current number of tree cards')],
        'Chamois': [('( / / )', '(Beech / Stone Pine / European Larch)')],
        'Chanterelle': [('play a card', 'play a tree card'), ('playing a card', 'playing a tree card')],
        'Common Hazel': [('play a card', 'play a bat card'), ('playing a card', 'playing a bat card'), ('Place a card', 'Place a bat card')],
        'Crane Fly': [('each card', 'each bat card')],
        'Cuckoo': [('another bird atop the or on which it is placed', 'another bird atop the tree or shrub on which it is placed')],
        'Elderberry': [('play a card', 'play a plant card'), ('playing a card', 'playing a plant card'), ('Place a card', 'Place a plant card')],
        'Elk': [('()', '(Silver Fir, Linden)')],
        'European Badger': [('Place a card', 'Place a pawed-animal card')],
        'European Bison': [('()', '(Oak, Beech)')],
        'European Larch': [('Place a card', 'Place a card with the Mountain symbol')],
        'European Wildcat': [('each card', 'each Woodland Edge card')],
        'Fallow Deer': [('each card', 'each cloven-hoofed-animal card')],
        'Fire Salamander': [('Place a card', 'Place a pawed-animal card')],
        'Fly Agaric': [('play a card', 'play a pawed-animal card'), ('playing a card', 'playing a pawed-animal card')],
        'Gentian': [('Place a card', 'Place a butterfly card'), ('each card', 'each butterfly card')],
        'Gnat': [('Each card', 'Each bat card')],
        'Golden Eagle': [('each card and 1 point for each card', 'each pawed-animal card and 1 point for each amphibian card')],
        'Goshawk': [('each card', 'each bird card')],
        'Great Green Bush-Cricket': [('Place a card', 'Place a bird card'), ('each card', 'each insect card')],
        'Hedgehog': [('each card', 'each butterfly card')],
        'Mistletoe': [('Place a card', 'Place a plant card'), ('each card', 'each plant card')],
        'Palm Tree': [('Place a card', 'Place a bird card'), ('each card', 'each bird card')],
        'Red Deer': [('Place a card', 'Place a deer card'), ('each and card', 'each tree and plant card')],
        'Robin': [('each card', 'each insect card')],
        'Roe Deer': [('( / / / / )', '(Silver Fir / Beech / Sycamore / Horse Chestnut / Linden / Birch)')],
        'Sable': [('3 point for each card', '3 points for each pawed-animal card')],
        'Silver Fir': [('Place a card', 'Place a pawed-animal card'), ('Effect*:', '**Effect*:**')],
        'Stag Beetle': [('Place a card', 'Place a bird card'), ('each card', 'each pawed-animal card')],
        'Stinging Nettle': [('each card', 'each butterfly card')],
        'Stone Pine': [('each card', 'each card with the Mountain symbol')],
        'Sycamore': [('each card', 'each tree card')],
        'Tree Ferns': [('each card', 'each amphibian card')],
        'Troll': [('each card', 'each tree card')],
        'Turkey Oak': [('each card', 'each cloven-hoofed-animal card')],
        'White Stork': [('each and card', 'each insect and amphibian card')],
        'Whinchat': [('each card', 'each plant card')],
        'Wolf': [('current number of cards', 'current number of deer cards'), ('each card', 'each deer card')],
    }
    for name, terms in icon_terms.items():
        pattern = rf'(## {re.escape(name)} \([^\n]+\)\n)(.*?)(?=\n## |\Z)'
        match = re.search(pattern, body, flags=re.DOTALL)
        if not match:
            continue
        entry = match.group(2)
        for old, new in terms:
            entry = entry.replace(old, new)
        body = body[:match.start(2)] + entry + body[match.end(2):]

    body = re.sub(
        r'(The following table shows the possible point totals for Beeches:)\n.*?(?=\n## Beech Marten)',
        r'''\1

| Beeches | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Total points | 0 | 0* | 0** | 20 | 25 | 30 | 35 | 40 | 45 | 50 |

\* 10 points if you placed at least two Violet Carpenter Bees at your Beeches.

\** 15 points if you placed at least one Violet Carpenter Bee at a Beech.''',
        body,
        flags=re.DOTALL,
    )
    hare_table = '''

| Hares | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | ... |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| Total points | 1 | 4 | 9 | 16 | 25 | 36 | 49 | 64 | 81 | 100 | 121 | ... |'''
    body = body.replace('The following table shows the possible point totals for Hares:\n# of Hares in', 'The following table shows the possible point totals for Hares:' + hare_table)
    body = body.replace('3 point.\n## European Polecat', '3 points.\n## European Polecat')
    body = body.replace('scored together 070 (see Mountain Hare)', 'scored together (see Mountain Hare)')
    body = body.replace('Wild Boar (♀♀)', 'Wild Boar (♀)')
    body = body.replace('slots-these', 'slots - these').replace('card-for', 'card - for')
    body = body.replace('• ', '- ')
    violet_entry = '''## Violet Carpenter Bee (left/right, 4×, cost: 1)
**Effect:** Whenever the number of trees of a certain species is required, each Violet Carpenter Bee at a tree of that species increases that number by 1. This is relevant to five cards:

- **Beech:** The bee can help meet the four-Beech threshold, but the bee itself does not score as a Beech.
- **Horse Chestnut:** The bee increases the number used to determine the value of the Horse Chestnut set, but does not itself score as a Horse Chestnut.
- **Linden:** The bee increases your Linden count when determining who has the most, but only actual Lindens score.
- **Great Spotted Woodpecker and Moss:** The bee increases the number of trees in your forest for these cards.

In all other cases, the bee only increases the count of its attached tree's species; it is not another tree card. For example, three Oaks and a Violet Carpenter Bee count as four Oaks when a rule asks how many Oaks you have, but only the three Oaks score Oak points.

**Points:** The Violet Carpenter Bee scores no points.'''
    body = re.sub(
        r'## Violet Carpenter Bee \([^\n]+\)\n.*?(?=\n## Water Vole)',
        violet_entry,
        body,
        flags=re.DOTALL,
    )
    body = re.sub(r'\n{3,}', '\n\n', body)
    body = body.replace('\n## ', '\n\n## ')
    body = re.sub(r'(?m)(?<!\n)\n(1\. |-[ *])', r'\n\n\1', body)
    body = re.sub(r'(?m)(^\d+\..*\n)(\*\*(?:Bonus|Points):\*\*)', r'\1\n\2', body)
    return f'''# Forest Shuffle Card Appendix

> Markdown reference proofread against `appendix.pdf`. Graphical type and tree icons are written as text. Illustrated scoring examples are omitted; the card rules and scoring formulas are retained.

{body}
'''


def rules_markdown() -> str:
    return '''# Forest Shuffle Rules

> Markdown reference proofread against `rules.pdf`. This edition is for 2-5 players, ages 10 and up, with a playing time of about 60 minutes. Illustrated examples are omitted. Card-specific rulings are in [appendix.md](appendix.md).

## Object of the game

Create an ecologically balanced habitat by planting trees and placing animals, plants, and mushrooms around them. Species score according to their individual preferences. The player with the most points wins.

## Components

- 180 cards total: 66 trees, 48 cards split top/bottom, 44 cards split left/right, 3 winter cards, 5 cave cards, and 14 reference cards
- 1 game board (the clearing)
- 1 scorepad

## Setup

1. Place the clearing (the game board) in the center of the playing area, within everyone's reach. Place the 14 reference cards next to it.
2. Each player takes a cave card and places it in front of them.
3. Set the 3 winter cards aside. Shuffle the remaining cards and return cards unseen to the box according to player count:

   | Players | Cards removed |
   | ---: | ---: |
   | 2 | 30 |
   | 3 | 20 |
   | 4 | 10 |
   | 5 | None |

4. Divide the remaining cards into three face-down piles of similar size.
5. Shuffle two winter cards into one pile and put the third winter card on top of that pile.
6. Put the other two piles on top of the pile containing the winter cards. Place this deck to the left of the clearing.
7. Each player draws 6 cards. If none is a tree, that player may take one mulligan: return all six cards to the box and draw six replacements.
8. The player who most recently took a walk in a forest starts.

## Game flow

Beginning with the start player and proceeding clockwise, each player performs exactly one action:

### A. Draw two cards

Draw two cards, one at a time. Each may be either the top face-down card of the deck or a face-up card from the clearing.

You may hold no more than 10 cards. If you begin with 9 cards, draw only one.

#### Winter cards

The lower third of the deck contains three winter cards. When you draw one, place it face up next to the clearing and immediately draw a replacement. When the third winter card is drawn, the game ends immediately.

### B. Play a card and check the clearing

Pay the card's cost, place it in your forest, and optionally perform its effect and bonus. Then check whether the clearing must be emptied.

## Playing cards

To pay a card's cost, place that many other cards from your hand face up in the clearing. For a split card, choose the half you are playing and pay only that half's cost. Some bonuses require particular payment cards.

Your played cards form your forest. Trees are played face up on their own. Split cards must be placed beside a tree.

Each card or card half shows an illustration, cost, type symbol, point value, name, card color with tree symbol, and the number of copies in the game. Some also show an effect and/or bonus.

### Trees

Each tree provides one card slot on each side: top, bottom, left, and right. A slot is empty until at least one card is played there. A tree is fully occupied when all four sides have at least one card.

Whenever you play a tree, draw the top card of the deck and place it face up in the clearing. This can reveal a winter card; resolve it normally.

### Tree saplings

Instead of playing a tree, you may play any card from your hand face down as a universal tree sapling. It has four card slots, but belongs to none of the eight tree species and is not a separate species.

### Animals, plants, and mushrooms

Non-tree cards are split horizontally or vertically. Place the chosen inhabitant in an empty slot on the corresponding side of a tree, sliding the unused half under the tree. Only the visible half counts for the rest of the game and for scoring.

A split card can be played only if a tree has an empty slot on the corresponding side.

## Effects and bonuses

Using effects and bonuses is optional. If using both, resolve the effect first and then the bonus.

### Effects

- Most effects are instant and can be used once immediately after the card is played.
- Mushrooms provide permanent effects beginning on your next turn. When you later place a card matching the mushroom's trigger, you may resolve the mushroom immediately.

### Bonuses

A colored-arrow bonus activates only if every card discarded to pay the cost has the same card color/tree symbol as the card being played. Either half of a split payment card can provide the matching symbol.

### Check the clearing

At the end of your turn, if the clearing contains 10 or more cards, return every card in it to the game box. Your turn then ends, unless an effect or bonus grants another turn.

## End of the game and scoring

When the third winter card is revealed, the game ends immediately; the active player does not finish their turn.

Add the points from every visible card in your forest, then add 1 point for each card under your cave. The highest score wins. Tied players share the victory.

For exact card scoring and edge cases, consult [appendix.md](appendix.md).

## Symbol overview

### Type symbols

The rulebook identifies: amphibian, tree, bat, deer, insect, European Hare, cloven-hoofed animal, plant, pawed animal, mushroom, butterfly, and bird.

### Common effect and bonus symbols

- Draw the indicated number of cards from the top of the deck.
- Draw cards equal to the number of cards in your forest showing the indicated type symbol, observing the 10-card hand limit.
- Draw cards equal to the number of European Hares in your forest, observing the 10-card hand limit.
- Place a creature with the indicated type symbol from your hand into your forest without paying its cost; do not use that card's effect or bonus.
- Take another full turn after this one, choosing action A or B normally.

Drawing cards can reveal a winter card; resolve it as described above.

### Tree symbols

Sycamore, Birch, Beech, Douglas Fir, Oak, Horse Chestnut, Linden, and Silver Fir.

## Credits

Game design by Kosch. Illustrations by Toni Llobet and Judit Piella. Graphic design by Klemens Franz / atelier198. Development by Maren Holderbaum. Translation by Sonja Hüttinger. Forestry consultant: Felix Behnke. © 2023 Lookout GmbH.
'''


def main() -> None:
    rules = rules_markdown().replace('–', '-').replace('—', '-')
    appendix = extract_appendix()
    assert appendix.count('\n## ') == 108, 'unexpected appendix card count'
    for fragment in (' atop the or ', ' each and card', '()', '♀♀'):
        assert fragment not in appendix, f'unresolved PDF extraction artifact: {fragment!r}'
    (RULES_DIR / 'rules.md').write_text(rules, encoding='utf-8')
    (RULES_DIR / 'appendix.md').write_text(appendix, encoding='utf-8')


if __name__ == '__main__':
    main()

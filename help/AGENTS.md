# Reference and Conversion Guidelines

## Purpose and Layout

This directory stores supporting source material rather than runtime application code. `game-rules/` contains the rulebook PDFs, `cards/card.js` and `lang/` contain reference card/localization data, `reference/` contains upstream-style JavaScript and CSS, and `assets/` contains reference images. Conversion utilities live at the directory root.

Preserve reference files as faithfully as possible. Do not make gameplay fixes in `reference/`; implement runtime behavior under `server/src/game/` and cite the relevant rule or card text in the change description.

## Conversion Commands

From the repository root:

```bash
node help/convertToJson.js
python3 help/convert_cards.py
```

`convertToJson.js` parses `cards/card.js` and overwrites `server/src/game/data/cardsData.json` and `speciesData.json`. Review the resulting JSON diff and run `npx ts-node src/game/verifyCardData.ts` from `server/`. The Python converter prints a simplified TypeScript representation to standard output; it currently contains an absolute repository path, so update it carefully if portability is part of the task.

## Data and Asset Conventions

Keep original species names, deck identifiers (`basic`, `alpine`, `edge`), orientations (`Tree`, `hCard`, `vCard`, `wCard`), punctuation, and numeric card IDs intact. Do not hand-edit generated JSON without also correcting its source or documenting why regeneration is inappropriate.

Use descriptive lowercase asset names consistent with existing files. Avoid committing editor metadata such as `.DS_Store`. For rule or image replacements, verify the file opens correctly and note its provenance in the pull request.

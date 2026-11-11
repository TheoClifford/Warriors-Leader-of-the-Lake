# Warriors: Leader of the Lake

A playable prototype: a Clan-management saga in the spirit of *King of Dragon Pass*, set in the world of Warriors.
You take nine lives from StarClan, choose the heart you lead with, and guide ThunderClan through three years of
seasons, rivals, omens and spirit-walks toward a prophecy about the lake.

## Run it

Open `dist/index.html` in a browser. No server or install needed.

## Build

The game is written as separate source files in `src/` and bundled into one self-contained page:

```
python3 build.py      # writes dist/index.html
```

| File | What it holds |
|---|---|
| `src/data.js` | Clans, territory, council, hearts, legends, lore, names |
| `src/events.js` | Events, ceremonies, story beats, Gatherings, raids, finale |
| `src/engine.js` | State, seasons, prey, combat, AI Clans, actions |
| `src/ui.js` | Rendering, tabs, creation, saving |
| `src/editor.js` | Inline text editor and per-screen notes |
| `src/art.js` | All art: canvas scenes, SVG portraits, sigils, map |
| `src/style.css`, `src/template.html` | Styles and page shell |

## Editor

Click **Edit text and notes** (top right) in the game. Outlined text can be rewritten in place, notes can be pinned to
any screen, and **Jump to a screen** visits any event without playing to it. **All edits and notes** exports
everything as Markdown or JSON for a source edit pass.

On the published claude.ai page, edits and notes are shared with everyone who can edit the page. Opened from this
repo, they are kept in that browser only.

Edits are stored as overrides keyed by the exact original text. Text containing generated values (a random warrior
name, a fresh-kill count) only re-applies when the same text appears again, so fold those edits into `src/` during
the edit pass.

## Tests

```
pip install playwright
python3 test/sim.py 40     # 40 randomised full playthroughs; reports crashes and ending spread
python3 test/editor.py     # editor end-to-end check
```

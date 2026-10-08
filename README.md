# Category CLI v3

A reorganization of the UNIX command line.

 Instead of memorizing a flat list of binaries (`ls`, `mkdir`, `rm`), you pick a **category**, then an **action**, then an optional **argument**.

## Benefits

UNIX discoverability is zero: you must know `ls` exists before you can use it.

This CLI keeps valid next keys on screen. Beginners read the chips; experts chain `D L Return`.  UNIX pipe composability can be
added later.


```
d (directory) › l (list) › Return          # list cwd
d (directory) › m (make) › mydir › Return  # create a folder
d (directory) › n (navigate) › Doc › Return  # unique prefix → Documents
```

Open `Category-Cli-V2-Graphical.html` in a browser. No build step.

## Keyboard

Each letter **commits** as you type. There is no separate preview-then-lock step.

| Step | Keys | What happens |
| --- | --- | --- |
| Category | `D` `F` `P` `S` `H` | Fills CAT. Category bar hides; action chips appear. |
| Action | letter for that category | Fills ACT. Action bar hides. If the action needs an argument, ARG becomes active. If it does not, a **Go** button appears. |
| Argument | printable keys, including Space | Appends to ARG. Tab cycles autocomplete when the action supports it. |
| Run | Return / Enter, or tap **Go** | Executes. On Apple the button reads **Go ↩ Return**; elsewhere **Go ↵ Enter**. |
| Back | Delete / Backspace / Escape | Trims ARG, then clears ACT, then clears CAT. Matching bars come back. |

Space is **not** the run key. It is a character in ARG (folder and file names may contain spaces).

Instructions sit on the command line: to the right of ARG (`type folder name`, `type filename`, …) or to the right of Go (`press Return to list`).

## Categories

```
[d] directory   [l]ist  [m]ake  [n]avigate  [r]emove  [e] rename
[f] file        [v]iew  [e]dit  [n]ew       [d]elete
[p] program     [x] execute     [l]ist
[s] system      [i]nfo  [c]lear [h]elp
[h] help        [l]ist  [c]ats
```

Chip colors: directory blue `#2563eb`, file cyan `#0891b2`, program pink `#db2777`, system green `#059669`, help amber `#d97706`. Action chips are solid magenta `#7c3aed`. The CAT field uses the selected category color; ACT stays magenta; ARG is amber.

`d` is both the directory category and `f › d` (delete file). `h` is both help and `s › h` (system help). After CAT is filled, the letter is an action. Escape back to pick a different category.

## Layout

Fixed 100dvh window (`#app-shell` padded 12px / 24px from 640px). Dark title bar shows **Category CLI v3** and the current path (`cwd`).

The middle pane is the **output log** only. It starts empty. New cards **append** at the bottom (oldest first) and the pane scrolls to the latest. No “Output Log” heading and no always-on directory browser.

Above the command footer, bars appear only when they apply:

1. **Options** — autocomplete chips or real variants, after an action is chosen.
2. **Actions** — while CAT is filled and ACT is empty.
3. **Categories** — while CAT is empty.
4. **Command line** — CAT › ACT › ARG, then Go when the action needs no argument, then the hint.

On viewports below 640px, chips stack the key over a short label (`D` / `dir`, `N` / `nav`). From 640px they are a single row with the full word.

## Directory list cards

`d › l` renders a grid of tiles. **Directory** tiles are clickable and replace that card’s listing in place (global `cwd` does not change). After the first dive, **Back** / **Forward** appear with the current path and walk a per-card history (clicking a new folder drops the forward stack). Files and program tiles are not navigable. Empty folders show `empty directory`.

A successful **navigate** log card is chips only (no “changed to …” body). Errors still show as text.

## Autocomplete

| Command | ARG chips | Tab / Enter |
| --- | --- | --- |
| `p › x` execute | program names | unique prefix is enough; tokens after a space stay as args |
| `d › n` navigate | `..`, `/`, child folders of cwd | unique prefix (`Doc` → `Documents`) |
| `d › e` rename | child folders only | `old new` (prefix on the old name) |
| `d › m` make | none | type a folder name |

## Virtual filesystem

Mock home at `/` (cloned from `seed-fs.js` on load):

- `Desktop/` — `screenshot.png`
- `Documents/` — `notes.txt`, `todo.md`, `resume.md`
- `Downloads/` — `archive.tar.gz`
- `Pictures/` — empty
- `Projects/cli/` — `readme.md`, `src/index.ts`; `Projects/site/` empty
- `.bashrc`, `.profile`

`s › c` clears the log only, not the filesystem.

## How to use

1. Open `Category-Cli-V2-Graphical.html`.
2. Type:
   - `d` `l` Return — list `/`
   - `d` `m` `mydir` Return — make a folder
   - `d` `n` `Doc` Return — navigate to `Documents`
   - `d` `e` `Pictures` Space `Album` Return — rename
   - `f` `v` `notes.txt` Return — view a file (from that directory)
   - `p` `x` `py` Return — execute `python` (unique prefix)

On a phone, tap category and action chips, then **Go** when it appears.

## Files

```
Category-Cli-V2-Graphical.html   page (title: Category CLI v3)
app.js                           UI and command runner
categories.js                    Z — categories, actions, colors, hints
seed-fs.js                       D0 mock home
programs.js                      PROGRAMS list
styles.css                       Tailwind extract + layout / chip / Go styles
dark-theme.css                   dark overlay
external-links.js                off-site links open in a new tab
vendor.js                        minified React 18.3.1 + ReactDOM
README.md                        this file
```

Scripts load in that order (classic scripts, not modules). Do not name a programs global `P0` — `vendor.js` uses `P0` as `Symbol.for("react.element")`.

## Architecture

- No-build React in the page. Input is a `keydown` listener on the shell (`#app-shell`), not an `<input>`.
- State: `step` (0 category, 1 action, 2 arg), committed/preview category and action, `arg`, `cwd`, `fs` from `cloneFs(D0)`, `history` (last 30 cards).
- `styles.css` is a static Tailwind v3.4.18 extract. New class names in JS do nothing unless the matching CSS already exists — add a dedicated rule when you need a new utility.


## Changelog

- **v3 (current):** letter commits immediately; Return / Go runs. Category, action, and options bars hide as the command fills in. Mock home FS, program and directory autocomplete, in-place list browsing, log appends at the bottom.
- **v3 (earlier):** category committed on the action letter; Space ran the command.
- **v2:** graphical + keyboard hybrid; Space committed every box (`d Space l Space`).
- **v1:** terminal prototype, text-only.

## Roadmap

- [ ] File-name autocomplete (view / edit / delete / new)
- [ ] Flags as a fourth segment: `d › l › [a]ll`
- [ ] `f › copy` with two arg boxes
- [ ] `g (git)` category
- [ ] Pipe category to restore composability

---

MIT / experiment.

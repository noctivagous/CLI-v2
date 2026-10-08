# Category / Menu Based CLI — v3

A rethink of the UNIX command line. Instead of memorizing 200 flat binaries (`ls`, `mkdir`, `rm`), you navigate 4 categories. The **action letter** commits the category — `SPACE` is only needed to run the action or to get its argument.

> Original UNIX: programs launched individually and were short.
> This CLI: programs don't exist individually. The CLI is redesigned around category menus inline.

```
d (directory) > l (list) > [lists directory]   # keys: d l SPACE
d (directory) > m (make) > Enter name: mydir    # keys: d m SPACE mydir ENTER
```

Build in this directory:

- `Category-Cli-V2-Graphical.html` - Graphical + keyboard hybrid, now running v3 behavior (window title reads "Category CLI v3")

Open the file directly in a browser. No build step.

## Demo

**v3 interaction:**

1. Press `D` - previews `directory`. Right panel shows all actions for D.
2. Press `L` - commits to the directory category AND previews `list`. Box 1 locks (blue).
3. Press `SPACE` - commits the action and executes. (If the action needs an argument, `SPACE` opens the arg box instead; type the arg, then `SPACE`/`ENTER` to run.)

`LETTER` = select. The second letter commits the category. `SPACE` = run / arg. `ESC` / `B` = back. `BACKSPACE` = clear.

## The Model

**Command grammar:**

```
command := category > action > [arg]
        := LETTER (preview category)
           LETTER (commit category, preview action)
           SPACE  (run — or open the arg box when one is needed)
```

It's modal, not flat. You stay inside a category while working.

```
Root:       [d]irectory [f]ile [s]ystem [h]elp
d:          [l]ist [m]ake [c]hange [r]emove
f:          [v]iew [e]dit [n]ew [d]elete
s:          [i]nfo [c]lear [h]elp
h:          [l]ist [c]ats
```

Note: two action keys collide with category keys — `d` is both the directory category and `f > d (delete)`, and `h` is both the help category and `s > h`. When a category is previewed, the action meaning wins: `f d SPACE` deletes a file, `s h SPACE` runs system help. To pick a different category instead, press `ESC` (or `BACKSPACE`) to cancel the preview first.

## Visual Language

This is not a terminal with colors. It's a graphical layout that is still keyboard-driven.

The command line is broken into rectangle segments, each with its own type style, conforming to an 8px baseline grid:

- **Box 1 - CATEGORY (Blue):** 180x88px, `#2563eb` border, `#eff6ff` preview, solid blue when committed. Tag: `1 CATEGORY`
- **Box 2 - ACTION (Violet):** 180x88px, `#7c3aed` theme. Tag: `2 ACTION`
- **Box 3 - ARG (Amber):** 240x88px, dashed when empty, solid when active. Tag: `3 ARG`

- Active: thick border + glow + blinking cursor
- Committed: solid fill + checkmark
- Empty: dashed gray

Context menu to the right is not help text - it's part of the command line. It shows all valid next keys for the current segment.

Background is `#f8fafc` with a dot grid to make the baseline visible. Typography: JetBrains Mono for the big letter (32px), Inter 11px uppercase for labels.

## Why

**UNIX problem:** Discoverability is zero. You must know `ls` exists before you can use it. `man` is after the fact.

**This fix:**

1.  **Always visible options.** Pressing `D` shows you what you can do with directories.
2.  **Preview without execution.** You can explore `D > L > M` without running anything until SPACE.
3.  **Contextual args.** `m (make)` prompts `Enter name:` in its own box, instead of requiring `mkdir -p foo/bar` syntax.
4.  **Two speeds:** Beginner pauses on `D` to read the menu, expert fast-chains `D L SPACE`.

Tradeoff: Loses UNIX pipe composability. Future version adds `| (pipe)` as a category.

## How to Use

1.  Open `Category-Cli-V2-Graphical.html`
2.  Type:
    - `d` `l` `space` - list current directory
    - `d` `m` `space` `mydir` `enter` - make dir
    - `d` `c` `space` `src` `enter` - change dir
    - `f` `v` `space` `notes.txt` `enter` - view file

Virtual FS included: `src/ docs/ projects/ notes.txt README.md`

## Files

```
/category-cli/
  README.md                         <- this file (v3)
  Category-Cli-V2-Graphical.html    <- graphical keyboard blend, v3 behavior
```

## Architecture

- Single-file React + Tailwind, no deps
- State: `step` (0=category, 1=action, 2=arg), `preview`, `committedCategory`, `committedAction`, `fs`, `cwd`, `history`
- Input is global `keydown` listener, not an `<input>` - keeps it keyboard-first
- `SPACE` in step 0 is a no-op in v3: the category commits when the action letter is pressed
- Output renders as a grid of file boxes, not plain text, to stay on baseline grid

## Changelog

- **v3:** category commits on the action letter (`d l SPACE`); `SPACE` runs the action / opens the arg box. `SPACE` no longer commits the category.
- **v2:** graphical + keyboard hybrid, `SPACE` committed every box (`d SPACE l SPACE`).
- **v1:** terminal prototype, text-only.

## Roadmap

- [ ] Arg box autocomplete from real FS
- [ ] 4th box for flags: `d > l > [a]ll`
- [ ] `f > c (copy)` with two arg boxes side-by-side
- [ ] `g (git)` category to prove it scales beyond files
- [ ] Pipe category: `| (pipe)` to restore composability

---
MIT / experiment.

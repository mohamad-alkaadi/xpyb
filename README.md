# xpyb

Offline slide decks with runnable Python notebooks. Turn a Jupyter notebook into a
presentation, design the slides, and run the code live in front of your audience.

## Contents

- [Overview and features](#overview-and-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick start](#quick-start)
- [CLI reference](#cli-reference)
- [Editing decks](#editing-decks)
- [Presentation Mode](#presentation-mode)
- [Python virtual environments](#python-virtual-environments)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Uninstallation](#uninstallation)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Overview and features

- **100% offline.** The app makes no network requests: no external APIs, no AI services,
  no telemetry, no CDN fonts or scripts. Network requests from the app window are
  blocked. Your own Python code is not sandboxed, so it can do whatever Python can do,
  including using the network. Installing xpyb does need a network connection to download
  its npm dependencies.
- **Proportional 16:9 canvas.** Every slide is laid out on a fixed `1280×720` canvas and
  scaled as a whole, so it looks the same on any screen or projector.
- **11 PowerPoint-style layouts.** Title slide, Section header, Title and body, Title and
  two columns, Title only, One column text, Main point, Section title and description,
  Caption, Big number, and Blank. Switching layouts never deletes content.
- **Polymorphic slots.** Each slot can show **Text** (Markdown with `$…$` math),
  **Code** (Python), or **Output** (the result of any code cell in the deck).
- **Transparent code blocks.** Syntax-highlighted code sits directly on the slide color,
  with an optional frosted backdrop, a dark or light tint, and auto-contrast text.
- **Rich outputs.** Text, tracebacks, HTML tables (such as pandas DataFrames), images,
  and LaTeX.
- **Live presentations.** All code is run before the first slide appears, and you can
  edit and re-run it during the talk.
- **Notebook round trip.** Convert `.ipynb` files to `.xpyb` decks, and later reload
  changed cells with **Sync from .ipynb** without losing your design.

## Prerequisites

| Requirement | Notes |
| --- | --- |
| [Node.js](https://nodejs.org/) 22.12 or newer, with npm | Needed to build and install xpyb. |
| Python 3 | Runs your code. It must be reachable as `python` or `python3`, or chosen in the app. |
| `ipykernel` and `jupyter_client` | Required in **every** Python environment you run code with. |

Install the Python packages into the environment you will use. A virtual environment is
recommended:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install ipykernel jupyter_client
```

On Windows (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install ipykernel jupyter_client
```

## Installation

Each installer builds the app, adds a shortcut to your App Drawer, Applications folder,
or Start Menu, associates `.xpyb` files so that double-clicking opens them, and installs
the `xpyb` terminal command. It installs for the current user only.

Run the commands from the project folder. Running an installer again updates the
installation; close xpyb first. After installing, the app no longer depends on the
project folder.

### Linux

```bash
./scripts/install.sh --linux
```

Run it **without** `sudo`.

| What | Where |
| --- | --- |
| Application | `~/.local/share/xpyb` |
| Terminal command | `~/.local/bin/xpyb` |
| App Drawer shortcut | `~/.local/share/applications/xpyb.desktop` |
| File type | `~/.local/share/mime/packages/xpyb.xml` |

(`XDG_DATA_HOME` replaces `~/.local/share` when it is set.)

#### `PATH` setup

If `~/.local/bin` is not on your `PATH`, the installer tells you. Add this line to
`~/.bashrc` (or `~/.zshrc` for zsh), then open a new terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

#### `chrome-sandbox` permissions

Some distributions, including recent Ubuntu releases, restrict unprivileged user
namespaces. There the app's sandbox helper must be owned by root, otherwise xpyb does not
start. The installer detects this and asks for your `sudo` password to set it up. If it
cannot ask, run these commands yourself:

```bash
sudo chown root:root ~/.local/share/xpyb/chrome-sandbox
```

```bash
sudo chmod 4755 ~/.local/share/xpyb/chrome-sandbox
```

Repeat this after every reinstall (the installer asks again).

### macOS

```bash
./scripts/install.sh --mac
```

| What | Where |
| --- | --- |
| Application | `~/Applications/xpyb.app` (visible in Launchpad and Spotlight) |
| Terminal command | `~/.local/bin/xpyb` |

The installer declares the `.xpyb` document type, signs the app for your machine
(ad-hoc signature), and registers it with Launch Services.

`~/.local/bin` is usually not on the `PATH` on macOS. Add this line to `~/.zshrc`, then
open a new terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Windows

In PowerShell:

```powershell
.\scripts\install.ps1
```

If PowerShell refuses to run scripts, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

| What | Where |
| --- | --- |
| Application and `xpyb.cmd` command | `%LOCALAPPDATA%\Programs\xpyb` |
| Start Menu shortcut | `xpyb` |
| `PATH` | The install folder is added to your **User** `PATH` |

**Restart your terminal** after installing so that it sees the new `PATH`.

File association: in an administrator PowerShell the installer uses `assoc` and `ftype`
(machine-wide). Otherwise it writes the equivalent keys for your user only. If Windows
asks which app should open a `.xpyb` file, choose xpyb.

To install elsewhere, pass `-InstallDir "D:\Apps\xpyb"` to both the install and uninstall
scripts.

## Quick start

1. Convert a notebook. This creates `talk.xpyb` next to it:

   ```bash
   xpyb convert talk.ipynb
   ```

2. Open the deck:

   ```bash
   xpyb talk.xpyb
   ```

3. Each notebook cell starts as its own slide. Choose layouts and colors. To show a
   result on a slide, switch a slot to **Output** and pick the code cell.
4. Press **Save** (`Ctrl+S` / `Cmd+S`), then **Present**.

## CLI reference

| Command | Effect |
| --- | --- |
| `xpyb` | Open the editor without a deck. |
| `xpyb <file.xpyb>` | Open a deck in the editor. |
| `xpyb present <file.xpyb>` | Compile the deck and present it in full screen. |
| `xpyb convert <notebook.ipynb>` | Create a deck next to the notebook. |
| `xpyb -h`, `xpyb --help` | Show the usage guide and exit. |

Examples:

```bash
xpyb
```

```bash
xpyb lectures/week1.xpyb
```

```bash
xpyb present lectures/week1.xpyb
```

```bash
xpyb convert lectures/week1.ipynb
```

```bash
xpyb --help
```

Notes:

- `convert` never overwrites an existing deck. Move or rename the old file first, or use
  **Sync from .ipynb** in the editor to update it.
- Only nbformat 4 notebooks are supported.
- Exit codes: `0` success, `1` failure (such as a missing file), `2` invalid arguments.
- The editor has no "Open file" or "Convert" button. Open a deck by passing its path or by
  double-clicking the file.

## Editing decks

- **Slides:** add, duplicate, delete, and reorder them from the toolbar.
- **Slots:** point at a slot to switch between **Text**, **Code**, and **Output**. Click a
  text slot to edit its Markdown.
- **Style:** choose a layout, background and text colors, and the code backdrop.
- **Running code:** use a slot's **▶ Run** button or `Shift+Enter`. Code runs in the
  deck's folder, and cells share one kernel, as in a notebook. `input()` is not
  supported.
- **Saving:** **Unsaved changes** appears next to **Save** until the deck is written.
  xpyb does not save automatically and does **not** warn you when you close the window
  with unsaved changes.
- **Sync from .ipynb:** reloads code and Markdown from the notebook the deck was converted
  from.
  - Layouts, colors, backdrop settings, and slot choices are kept.
  - New notebook cells become new slides.
  - Notebook cells you edited in xpyb are **overwritten** by the notebook version.
  - Cells removed from the notebook stay in the deck, and the message counts them.
  - Content you created in the editor is left alone.
  - Press **Save** to keep the result.

## Presentation Mode

Start it with the **Present** button or `xpyb present <file.xpyb>`.

1. Every code cell runs in slide order, with a progress bar
   ("Compiling cell X of Y..."). A cell that raises an error does not stop the others.
   If Python itself cannot start, compiling stops and the slides open with the traceback.
2. Slide 1 appears. Navigate with the keyboard.
3. Press `E` to edit the code on the current slide, then `Shift+Enter` to run it. The
   result appears where a slot shows that cell's output.
4. Press `Esc` to lock the code, and `Esc` again to return to the editor.

Every time you start presenting, all cells run again in the same kernel. Keep that in
mind for cells with side effects. Live edits change the open deck; save them if you want
to keep them.

## Python virtual environments

### Started from a terminal

xpyb inherits the terminal's environment unchanged, including `PATH` and `VIRTUAL_ENV`.
Activate your environment first and your code uses it automatically:

```bash
source .venv/bin/activate
```

```bash
xpyb talk.xpyb
```

If the environment is **not** activated, code runs with whatever `python` or `python3`
your `PATH` finds. Packages installed only in your virtual environment are then missing,
and you see the standard Python `ModuleNotFoundError` traceback. This is intentional:
xpyb never switches environments behind your back. The same error naming `ipykernel` or
`jupyter_client` means those two packages are missing from the Python being used.

### Started from the App Drawer, Start Menu, or by double-clicking

There is no activated terminal in this case, so pick the interpreter in the app:

1. Open the deck.
2. In the editor toolbar, open the **Python** menu.
3. Choose one of:
   - **.venv** or **venv** — listed when that folder is next to the deck file.
   - **Browse…** — select any Python executable, for example
     `~/envs/data/bin/python` or `C:\envs\data\Scripts\python.exe`.
   - **Environment default** — go back to the `python` found on `PATH`.
4. Run your code, or press **Present**.

Changing the interpreter starts a fresh kernel and clears the current results. The choice
applies to the open window and is not saved, so pick it again after restarting xpyb. To
present with a virtual environment, open the deck, choose the interpreter, then press
**Present**.

## Keyboard shortcuts

### Editor

| Keys | Action |
| --- | --- |
| `Ctrl+S` / `Cmd+S` | Save the deck |
| `Shift+Enter` | Run the code cell you are editing |
| `Enter` | Edit the focused text slot |
| `Esc` | Finish editing a text slot |

### Presentation Mode

| Keys | Action |
| --- | --- |
| `ArrowRight` or `Space` | Next slide |
| `ArrowLeft` | Previous slide |
| `E` | Unlock live editing for the code on this slide |
| `Shift+Enter` | Re-run the code cell you are editing |
| `Esc` | Lock the code; if nothing is unlocked, leave the presentation (also cancels compiling) |
| `Ctrl+S` / `Cmd+S` | Save the deck, including live edits |

While the cursor is in a code editor, the arrows, `Space`, and `E` type as usual. Press
`Esc` to go back to slide navigation.

## Uninstallation

Uninstalling removes the application, shortcut, file association, and terminal command.
Your decks, notebooks, and application settings are not touched. A `PATH` line you added
to your shell profile stays.

### Linux

```bash
./scripts/uninstall.sh --linux
```

### macOS

```bash
./scripts/uninstall.sh --mac
```

### Windows

```powershell
.\scripts\uninstall.ps1
```

If you installed from an administrator PowerShell, uninstall from one too, so that the
machine-wide file association is removed. The uninstaller also removes the folder from
your User `PATH`; restart your terminal afterwards.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| `xpyb: command not found` | Add `~/.local/bin` to your `PATH` (Linux, macOS) or restart the terminal (Windows). |
| The app does not start on Linux | Set the [`chrome-sandbox` permissions](#chrome-sandbox-permissions). |
| `ModuleNotFoundError` | Activate the right environment or pick it in the **Python** menu; install the package there. |
| Installer says `~/.local/bin/xpyb` already exists | Remove that file, or run `npm unlink -g xpyb`, then install again. |
| A slide shows no result | Switch a slot to **Output** and choose the code cell. |

## Development

```bash
npm install
```

```bash
npm start
```

```bash
npm test
```

```bash
npm run build
```

On Linux systems with the sandbox restriction described above, `npm start` needs the same
permissions on `node_modules/electron/dist/chrome-sandbox`.

Tests that need a real kernel are skipped unless `python3` has `ipykernel` and
`jupyter_client`, or `XPYB_TEST_PYTHON` points to a Python that does:

```bash
XPYB_TEST_PYTHON="$PWD/.venv/bin/python" npm test
```

The installer tests run only after `npm run build` has created `dist/`. The PowerShell
tests run only when `pwsh` is available.

Project layout and coding rules are described in [`CLAUDE.md`](CLAUDE.md).

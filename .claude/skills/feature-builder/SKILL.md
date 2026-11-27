---
name: feature-builder
description: Build a single self-contained greenfield feature or milestone for xpyb following CLAUDE.md architectural rules, with mandatory automated regression tests. Use when implementing new milestones from scratch.
---

# Feature Builder

Build one self-contained greenfield feature or milestone while strictly enforcing `CLAUDE.md`.

## Execution Steps

1. **Constraint & Protected-File Audit**
   - Read `CLAUDE.md` first and verify stack boundaries (plain `.js`/`.jsx` with `rafce`, 100% offline zero-API policy, `1280x720` `16:9` `SlideStage` scaling, inherited `process.env` Python `venv` behavior), target UI language (English), and protected files.
   - Confirm responsive app shell behavior across Desktop (`>= 1024px`), Tablet (`768px–1023px`), and Compact (`< 768px`) viewports without distorting the `16:9` slide stage.
   - Do NOT modify protected files (`README.md`, `scripts/*`, or earlier milestone files unless wiring IPC/routes).

2. **Declare the File Blueprint First**
   - Before creating or editing any code, output the exact list of files to create or update under `bin/`, `electron/lib/`, `python/`, `src/lib/<domain>/`, `src/context/`, `src/components/<page>/`, `src/components/common/<group>/`, and `tests/<domain>/`.
   - Verify **one `rafce` component per file** and **max 2-level prop drilling** in the blueprint.

3. **Build Pure Logic First (`electron/lib/` & `src/lib/`)**
   - Implement `.ipynb` ↔ `.xpyb` mapping, CLI parsing, kernel JSON-line framing, 11-layout slot schemas, `1280x720` viewport scale math, and IPC wrappers as pure functions in `electron/lib/` and `src/lib/`.
   - Enforce **25 lines or fewer** per function and add English JSDoc (`@param`, `@returns`) above each exported function.

4. **Wire Domain State (`src/context/`)**
   - Expose shared feature state via focused `useContext` providers (`DeckContext`, `KernelContext`, `PresentationContext`) under `src/context/`.
   - Keep `src/App.jsx` strictly for provider composition and top-level view switching.

5. **Build UI Components (`src/components/`)**
   - Author every component in plain `.jsx` using the `rafce` arrow-function pattern, one component per file.
   - Place all `useState` calls at the **very top** of every component (right after `useContext`).
   - Keep event handlers and custom hooks at **25 lines or fewer**.
   - Extract any repeated UI pattern into `src/components/common/<group>/`.

6. **Write Tests & Run Full Regression Gate (`tests/`)**
   - Write automated Vitest unit and integration tests under `tests/<domain>/` covering all new `electron/lib/` and `src/lib/` functions, state transitions, and user interactions.
   - Run `npm test` (the **entire** test suite, not just new tests) AND `npm run build`.
   - Do NOT finish or commit until 100% of old and new tests pass with zero build errors.

# Project Engineering Constitution (`CLAUDE.md`)

## 1. Stack & Runtime Constraints

- **Desktop & CLI Shell:** Electron + Node.js CLI entry (`bin/xpyb.js`) supporting `xpyb <file.xpyb>`, `xpyb convert <notebook.ipynb>`, and `xpyb present <file.xpyb>`, plus OS app drawer / Start Menu registration across Linux, macOS, and Windows.
- **Python Execution Bridge:** Local `python/kernel_runner.py` using `jupyter_client` and `ipykernel` over `stdin`/`stdout` JSON lines. Spawned with unmodified `{ env: process.env }` so terminal-activated virtual environments (`VIRTUAL_ENV` and `PATH`) work natively—and unactivated environments naturally raise standard `ModuleNotFoundError` tracebacks—with an optional GUI Interpreter Picker fallback.
- **Frontend UI:** React 19, Vite, Tailwind CSS (plain `.js`/`.jsx` files only—no TypeScript), CodeMirror 6 (`@uiw/react-codemirror` + `@codemirror/lang-python`), and locally bundled `marked`, `DOMPurify`, and `KaTeX`.
- **Testing:** Vitest + React Testing Library.
- **Network & Privacy Policy:** **100% offline.** Zero external network requests, zero CDN fonts or scripts, zero telemetry, and zero AI/ML APIs.
- **Slide Aspect Ratio & Scaling:** Every slide canvas MUST render inside a fixed `1280x720` (`16:9`) logical coordinate space wrapped in `SlideStage` (`transform: scale(...)` driven by `ResizeObserver`) so slides maintain exact `16:9` proportions across every screen and projector size without reflow, stretching, or clipping.
- **Resource & Performance Budget:** Target a low-RAM footprint (smooth on 8 GB RAM); terminate spawned Python kernel child processes cleanly on window close or restart, and revoke temporary Blob/Object URLs immediately on unmount.
- **Languages:** All code identifiers, file names, git commits, and JSDoc comments MUST be in **English**. User-facing UI text MUST be in **English**.

## 2. Directory Architecture

- `bin/` — Cross-platform CLI entry point (`xpyb.js`).
- `electron/` — Main process (`main.js`), secure `contextBridge` preload (`preload.js`), and `electron/lib/` (CLI argument parser, `.ipynb` ↔ `.xpyb` converter, filesystem I/O, Python kernel process manager).
- `python/` — Local `kernel_runner.py` (`jupyter_client` JSON-line stdio execution bridge).
- `src/lib/<domain>/` — Pure business logic, 11 slide layout schemas, polymorphic slot mappers, `1280x720` viewport scale math, contrast helpers, and thin `window.xpybApi` IPC wrappers. Zero React imports.
- `src/context/` — Focused React Context providers (`DeckContext`, `KernelContext`, `PresentationContext`) for cross-component domain state.
- `src/components/<page>/` — Feature UI components grouped by view (`editor/`, `slides/`, `presenter/`, `toolbar/`).
- `src/components/common/<group>/` — Reusable UI primitives shared across two or more features (`inputs/`, `modals/`, `code/`).
- `scripts/` — Cross-platform shell installers/uninstallers (`install.sh` / `uninstall.sh` with `--linux` and `--mac` flags, and `install.ps1` / `uninstall.ps1` for Windows).
- `tests/<domain>/` — Vitest unit and integration tests mirroring `electron/lib/`, `src/lib/`, `context/`, and `components/`.

## 3. Non-Negotiable Code Craftsmanship Rules

1. **One Component Per File (`rafce` Pattern):** Every React component MUST live in its own `.jsx` file using the `rafce` arrow-function structure (`const ComponentName = () => { ... }; export default ComponentName;`). Never define helper sub-components inside another component file.
2. **Thin Root (`App.jsx`):** Keep `App.jsx` strictly for top-level provider composition and editor/presenter view switching—never business logic, IPC calls, or local feature state.
3. **`useState` at the Very Top:** Place all `useState` declarations at the top of every component (immediately after `useContext` calls), before derived variables, `useRef`, `useEffect`, or event handlers.
4. **25-Line Logic Limit:** Keep every pure function, custom hook, and event handler at **25 lines or fewer**. Break complex workflows into small, single-purpose helper functions in `electron/lib/` or `src/lib/`. _(Declarative JSX `return` markup is exempt.)_
5. **2-Level Prop Drilling Cap:** Never pass props through more than **2 component levels**. Lift shared state into a focused `useContext` provider under `src/context/`.
6. **English JSDoc Comments:** Document every exported function in `electron/lib/`, `src/lib/`, and every custom hook with concise English JSDoc (`@param`, `@returns`).
7. **Responsive App Shell & 16:9 Canvas:** Editor chrome and modals must work cleanly without horizontal overflow across Desktop (`>= 1024px`), Tablet (`768px–1023px`), and Compact (`< 768px`) viewports while keeping the slide canvas locked to `16:9` (`1280x720`).
8. **Strict Scope Discipline:** Build only what the current milestone requests; never add unrequested features or alter unrelated files.

## 4. Protected Files & Verification Gate

- **Protected Files:** Do NOT modify `README.md`, `scripts/*`, `.env*`, or completed milestone modules unless explicitly authorized in the prompt.
- **Mandatory Gate:** Before finishing any milestone or committing, run `npm test` (entire regression suite) and `npm run build` until 100% pass with zero errors.

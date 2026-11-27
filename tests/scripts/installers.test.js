import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const repo = path.resolve(import.meta.dirname, '../..');
const script = (name) => path.join(repo, 'scripts', name);
const hasPwsh = spawnSync('pwsh', ['-NoProfile', '-Command', '1']).status === 0;
const isPosix = process.platform !== 'win32';

// The installers copy dist/, which only exists after a build.
const dist = path.join(repo, 'dist', 'index.html');

let home;
let runtime;
const run = (name, flag, ...extraPath) =>
  spawnSync('bash', [script(name), flag], {
    encoding: 'utf8',
    input: '',
    env: {
      PATH: [path.join(home, 'tools'), '/usr/bin', '/bin', ...extraPath].join(':'),
      HOME: home,
      XPYB_SKIP_BUILD: '1',
      XPYB_ELECTRON_DIST: runtime,
    },
  });
const at = (...parts) => path.join(home, ...parts);
const read = (...parts) => fs.readFileSync(at(...parts), 'utf8');
const write = (file, text, mode = 0o644) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, { mode });
};
// Stands in for system tools so that tests never touch the real desktop databases.
const stub = (name) =>
  write(at('tools', name), `#!/bin/sh\necho "${name} $*" >>"$HOME/tools.log"\n`, 0o755);

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'xpyb home '));
  runtime = at('runtime');
  write(path.join(runtime, 'electron'), '#!/bin/sh\necho "$ELECTRON_RUN_AS_NODE $*"\n', 0o755);
  write(path.join(runtime, 'resources', 'default_app.asar'), 'x');
  write(path.join(runtime, 'Electron.app/Contents/MacOS/Electron'), '', 0o755);
  write(path.join(runtime, 'Electron.app/Contents/Resources/default_app.asar'), 'x');
  ['update-mime-database', 'update-desktop-database', 'xdg-mime', 'plutil', 'codesign'].forEach(stub);
});
afterEach(() => {
  fs.rmSync(home, { recursive: true, force: true });
});

describe.skipIf(!isPosix || !fs.existsSync(dist))('shell installers', () => {
  const app = ['.local', 'share', 'xpyb'];

  it('installs on Linux with a CLI link, launcher and file type', () => {
    expect(run('install.sh', '--linux').status).toBe(0);
    expect(fs.existsSync(at(...app, 'resources/app/electron/main.js'))).toBe(true);
    expect(fs.existsSync(at(...app, 'resources/app/dist/index.html'))).toBe(true);
    expect(fs.existsSync(at(...app, 'resources/default_app.asar'))).toBe(false);
    const desktop = read('.local/share/applications/xpyb.desktop');
    expect(desktop).toContain(`Exec="${at(...app, 'xpyb-app')}" %f`);
    expect(desktop).toContain('MimeType=application/x-xpyb;');
    expect(read('.local/share/mime/packages/xpyb.xml')).toContain('*.xpyb');
    expect(read('tools.log')).toContain('xdg-mime default xpyb.desktop application/x-xpyb');
    const cli = spawnSync(at('.local/bin/xpyb'), ['convert', 'a b.ipynb'], { encoding: 'utf8' });
    expect(cli.stdout).toBe(`1 ${at(...app, 'resources/app/bin/xpyb.js')} convert a b.ipynb\n`);
  });

  it('explains PATH setup only when ~/.local/bin is missing from it', () => {
    const missing = run('install.sh', '--linux').stdout;
    expect(missing).toContain('is not on your PATH');
    expect(missing).toContain('export PATH="$HOME/.local/bin:$PATH"');
    const present = run('install.sh', '--linux', at('.local/bin')).stdout;
    expect(present).not.toContain('is not on your PATH');
    expect(present).toContain('xpyb --help');
  });

  it('reinstalls over itself and uninstalls cleanly', () => {
    write(at('.config/mimeapps.list'), '[Default Applications]\napplication/x-xpyb=xpyb.desktop\nt/x=y\n');
    run('install.sh', '--linux');
    expect(run('install.sh', '--linux').status).toBe(0);
    expect(run('uninstall.sh', '--linux').status).toBe(0);
    ['.local/bin/xpyb', '.local/share/xpyb', '.local/share/applications/xpyb.desktop'].forEach(
      (item) => expect(fs.existsSync(at(item))).toBe(false),
    );
    expect(read('.config/mimeapps.list')).toBe('[Default Applications]\nt/x=y\n');
    expect(run('uninstall.sh', '--linux').status).toBe(0);
  });

  it('never replaces or removes files it did not create', () => {
    write(at('.local/bin/xpyb'), 'mine');
    expect(run('install.sh', '--linux').stderr).toContain('already exists');
    expect(fs.existsSync(at(...app))).toBe(false);
    run('uninstall.sh', '--linux');
    expect(read('.local/bin/xpyb')).toBe('mine');
    write(at(...app, 'keep.txt'), 'data');
    expect(run('uninstall.sh', '--linux').status).toBe(1);
    expect(run('install.sh', '--linux').status).toBe(1);
    expect(read(...app, 'keep.txt')).toBe('data');
  });

  it('builds a macOS app bundle and removes it again', () => {
    expect(run('install.sh', '--mac').status).toBe(0);
    const resources = 'Applications/xpyb.app/Contents/Resources';
    expect(fs.existsSync(at(resources, 'app/bin/xpyb.js'))).toBe(true);
    expect(fs.existsSync(at(resources, 'default_app.asar'))).toBe(false);
    expect(fs.readlinkSync(at('.local/bin/xpyb'))).toBe(at(resources, 'xpyb-cli'));
    expect(read('tools.log')).toContain('plutil -replace CFBundleDocumentTypes');
    expect(read('tools.log')).toContain('codesign --force --deep --sign -');
    expect(run('uninstall.sh', '--mac').status).toBe(0);
    expect(fs.existsSync(at('Applications/xpyb.app'))).toBe(false);
  });

  it('asks for a platform flag', () => {
    expect(run('install.sh', '--bsd').status).toBe(2);
    expect(run('uninstall.sh', '').status).toBe(2);
  });
});

describe.skipIf(!hasPwsh)('PowerShell installers', () => {
  const pwsh = (command) =>
    spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8' });

  it.each(['install.ps1', 'uninstall.ps1', 'lib/windows.ps1'])('parses %s', (name) => {
    const result = pwsh(
      `$errors = $null; [System.Management.Automation.Language.Parser]::ParseFile('${script(name)}', [ref]$null, [ref]$errors) | Out-Null; $errors.Count`,
    );
    expect(result.stdout.trim()).toBe('0');
  });

  it('adds a PATH entry once and removes only that entry', () => {
    const result = pwsh(
      `. '${script('lib/windows.ps1')}'; ` +
        "Add-PathEntry '%A%\\bin;C:\\x\\xpyb\;C:\\t' 'C:\\x\\xpyb'; " +
        "Add-PathEntry '' 'C:\\x'; Remove-PathEntry '%A%\\bin;C:\\X\\XPYB;C:\\t' 'C:\\x\\xpyb'",
    );
    expect(result.stdout.trim().split(/\r?\n/)).toEqual([
      '%A%\\bin;C:\\t;C:\\x\\xpyb',
      'C:\\x',
      '%A%\\bin;C:\\t',
    ]);
  });
});

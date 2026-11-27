import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createKernelManager } = require('../../electron/lib/kernel/kernelManager');

// Needs a Python with jupyter_client and ipykernel; set XPYB_TEST_PYTHON to choose one.
const python = process.env.XPYB_TEST_PYTHON || 'python3';
const probe = spawnSync(python, ['-c', 'import jupyter_client, ipykernel']);
const scriptPath = path.resolve(import.meta.dirname, '../../python/kernel_runner.py');

describe.skipIf(probe.status !== 0)('kernel runner with a real kernel', () => {
  const manager = createKernelManager({ scriptPath });
  const ready = manager.setPythonPath(python);
  const run = async (code) => (await ready, manager.execute(code));
  afterAll(() => manager.shutdown());

  it('returns streams and DataFrame-style HTML', { timeout: 60000 }, async () => {
    const result = await run(
      'import sys\nprint("out é")\nprint("err", file=sys.stderr)\n' +
        'class T:\n    def _repr_html_(self): return "<table></table>"\nT()',
    );
    expect(result.status).toBe('ok');
    expect(result.outputs.map((output) => output.type)).toEqual(['stdout', 'stderr', 'html']);
    expect(result.outputs[0].text).toBe('out é\n');
  });

  it('returns base64 images', async () => {
    const result = await run(
      'from IPython.display import SVG, display\n' +
        'display(SVG(\'<svg xmlns="http://www.w3.org/2000/svg"></svg>\'))',
    );
    expect(result.outputs[0]).toMatchObject({ type: 'image', mime: 'image/svg+xml' });
    expect(Buffer.from(result.outputs[0].data, 'base64').toString()).toContain('<svg');
  });

  it('returns ModuleNotFoundError tracebacks', async () => {
    const result = await run('import xpyb_missing_module');
    expect(result.outputs[0].ename).toBe('ModuleNotFoundError');
  });

  it('interrupts a running cell', async () => {
    await run('kept = 1');
    const running = run('import time\ntime.sleep(60)');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await manager.interrupt();
    expect((await running).outputs.at(-1).ename).toBe('KeyboardInterrupt');
  });

  it('restarts during execution and clears state', { timeout: 60000 }, async () => {
    const running = run('import time\ntime.sleep(60)');
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await manager.restart()).toEqual({ status: 'ok' });
    expect((await running).status).toBe('aborted');
    expect((await run('kept')).outputs[0].ename).toBe('NameError');
  });

  it('recovers after the kernel dies', { timeout: 60000 }, async () => {
    expect((await run('import os\nos._exit(1)')).kernelDied).toBe(true);
    expect((await run('print(2)')).status).toBe('ok');
  });

  it('terminates the kernel process on shutdown', { timeout: 60000 }, async () => {
    const pid = Number((await run('import os\nprint(os.getpid())')).outputs[0].text);
    await manager.shutdown();
    await expect.poll(() => isAlive(pid), { timeout: 10000 }).toBe(false);
  });
});

function isAlive(pid) {
  try {
    return process.kill(pid, 0);
  } catch {
    return false;
  }
}

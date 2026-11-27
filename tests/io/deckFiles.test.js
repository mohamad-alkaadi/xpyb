import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deck, notebook } from '../converter/fixtures.js';

const require = createRequire(import.meta.url);
const { convertNotebookFile, readDeck, writeDeck } = require('../../electron/lib/io/deckFiles');

let dir;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xpyb-io-'));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('deck files', () => {
  it('saves and reloads a deck without leaving temporary files', async () => {
    const target = path.join(dir, 'talk.xpyb');
    await writeDeck(target, deck());
    await writeDeck(target, deck());
    expect(await readDeck(target)).toEqual({ filePath: target, deck: deck() });
    expect(await fs.readdir(dir)).toEqual(['talk.xpyb']);
  });

  it('refuses to save an invalid deck over a good one', async () => {
    const target = path.join(dir, 'talk.xpyb');
    await writeDeck(target, deck());
    await expect(writeDeck(target, {})).rejects.toThrow('Not an xpyb deck');
    expect((await readDeck(target)).deck).toEqual(deck());
  });

  it('rejects relative paths and wrong extensions', async () => {
    await expect(readDeck('talk.xpyb')).rejects.toThrow('absolute .xpyb');
    await expect(writeDeck(path.join(dir, 'x.json'), deck())).rejects.toThrow('absolute .xpyb');
    await expect(convertNotebookFile(null)).rejects.toThrow('absolute .ipynb');
  });

  it('reports invalid JSON and missing files', async () => {
    const target = path.join(dir, 'bad.xpyb');
    await fs.writeFile(target, '{');
    await expect(readDeck(target)).rejects.toThrow('Invalid JSON');
    await expect(readDeck(path.join(dir, 'none.xpyb'))).rejects.toThrow('ENOENT');
  });

  it('converts a notebook beside itself and records its path', async () => {
    const source = path.join(dir, 'my talk.ipynb');
    await fs.writeFile(source, JSON.stringify(notebook()));
    const result = await convertNotebookFile(source);
    expect(result.deckPath).toBe(path.join(dir, 'my talk.xpyb'));
    expect((await readDeck(result.deckPath)).deck.sourceNotebook).toBe(source);
  });

  it('never overwrites an existing deck', async () => {
    const source = path.join(dir, 'talk.ipynb');
    await fs.writeFile(source, JSON.stringify(notebook()));
    await fs.writeFile(path.join(dir, 'talk.xpyb'), 'edited');
    await expect(convertNotebookFile(source)).rejects.toThrow('already exists');
    expect(await fs.readFile(path.join(dir, 'talk.xpyb'), 'utf8')).toBe('edited');
  });
});

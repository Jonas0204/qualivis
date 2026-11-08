import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs the real server as a child process against temporary directories (QV_* overrides),
// so nothing is written into the repository and no legacy build is needed.
const script = fileURLToPath(new URL('./serve-legacy.mjs', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'qv-legacy-server-'));
const dirs = {
  build: join(temp, 'build'),
  fixtures: join(temp, 'fixtures'),
  capture: join(temp, 'capture'),
};
let server;
let base;

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolvePort(port));
    });
  });
}

function startServer(port) {
  return new Promise((resolveStart, reject) => {
    const child = spawn(process.execPath, [script, String(port)], {
      env: {
        ...process.env,
        QV_LEGACY_BUILD_DIR: dirs.build,
        QV_FIXTURES_DIR: dirs.fixtures,
        QV_CAPTURE_DIR: dirs.capture,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`server exited early (code ${code})`)));
    child.stdout.on('data', chunk => {
      if (String(chunk).includes('legacy server on')) resolveStart(child);
    });
  });
}

beforeAll(async () => {
  mkdirSync(dirs.build, { recursive: true });
  writeFileSync(join(dirs.build, 'index.html'), '<app-root></app-root>');
  mkdirSync(join(dirs.fixtures, 'demo', 'src', 'components'), { recursive: true });
  writeFileSync(join(dirs.fixtures, 'demo', 'src', 'b.js'), 'b');
  writeFileSync(join(dirs.fixtures, 'demo', 'src', 'components', 'A.js'), 'a component');
  writeFileSync(join(dirs.fixtures, 'demo', 'src', 'a.js'), 'a');
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  server = await startServer(port);
});

afterAll(() => {
  server?.kill();
  rmSync(temp, { recursive: true, force: true });
});

describe('legacy server', () => {
  it('lists fixture files in canonical (sorted) order', async () => {
    const res = await fetch(`${base}/fixtures/demo/manifest.json`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(['src/a.js', 'src/b.js', 'src/components/A.js']);
  });

  it('serves fixture file contents', async () => {
    const res = await fetch(`${base}/fixtures/demo/src/components/A.js`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('a component');
  });

  it('refuses fixture paths that escape the fixture directory', async () => {
    // %2F keeps the URL parser from resolving the dots; the server decodes them itself.
    const res = await fetch(`${base}/fixtures/demo/..%2F..%2Fbuild%2Findex.html`);
    expect(res.status).toBe(500);
  });

  it('writes captured data into the capture directory', async () => {
    const res = await fetch(`${base}/capture/demo/a.json`, { method: 'POST', body: '{"ok":true}' });
    expect(res.status).toBe(200);
    expect(readFileSync(join(dirs.capture, 'demo', 'a.json'), 'utf8')).toBe('{"ok":true}');
  });

  it('refuses capture paths outside the capture directory', async () => {
    const res = await fetch(`${base}/capture/..%2Fescaped.json`, { method: 'POST', body: 'x' });
    expect(res.status).toBe(500);
    expect(existsSync(join(temp, 'escaped.json'))).toBe(false);
  });

  it('falls back to index.html for app routes', async () => {
    const res = await fetch(`${base}/component-graph/graph`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<app-root></app-root>');
  });

  it('redirects the root to the app base path', async () => {
    const res = await fetch(`${base}/`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/component-graph/');
  });
});

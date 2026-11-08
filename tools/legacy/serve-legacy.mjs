// Zero-dependency static server for the legacy Angular build (gh-pages) plus fixtures.
//   /component-graph/*             -> legacy build (SPA fallback to index.html)
//   /fixtures/<name>/manifest.json -> sorted list of fixture files (relative paths)
//   /fixtures/<name>/<path>        -> fixture file content
//   POST /capture/<name>/<file>    -> writes request body to <captureDir>/<name>/<file>
// Binds to 127.0.0.1 only. Usage: node tools/legacy/serve-legacy.mjs [port]

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Directories can be overridden for tests (QV_* environment variables).
const buildDir = process.env.QV_LEGACY_BUILD_DIR ?? join(root, '.cache', 'legacy-build');
const fixturesDir = process.env.QV_FIXTURES_DIR ?? join(root, 'testdata', 'fixtures');
const captureDir = process.env.QV_CAPTURE_DIR ?? join(root, 'testdata', 'golden');
const port = Number(process.argv[2] ?? 4300);
const BASE = '/component-graph/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const safeJoin = (base, rel) => {
  const full = resolve(base, normalize(rel).replace(/^([/\\])+/, ''));
  if (full !== resolve(base) && !full.startsWith(resolve(base) + sep))
    throw new Error('path escape');
  return full;
};

const listFiles = async (dir, prefix = '') => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listFiles(join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out.sort(); // canonical order (ADR-006)
};

const send = (res, status, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = decodeURIComponent(url.pathname);

    if (req.method === 'POST' && path.startsWith('/capture/')) {
      const target = safeJoin(captureDir, path.slice('/capture/'.length));
      const chunks = [];
      for await (const c of req) chunks.push(c);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, Buffer.concat(chunks));
      return send(res, 200, 'ok');
    }

    if (path.startsWith('/fixtures/')) {
      const [name, ...parts] = path.slice('/fixtures/'.length).split('/');
      const fixtureRoot = safeJoin(fixturesDir, name);
      if (parts.join('/') === 'manifest.json') {
        return send(res, 200, JSON.stringify(await listFiles(fixtureRoot)), types['.json']);
      }
      return send(res, 200, await readFile(safeJoin(fixtureRoot, parts.join('/'))));
    }

    if (path.startsWith(BASE)) {
      let file = safeJoin(buildDir, path.slice(BASE.length));
      const isFile = await stat(file)
        .then(s => s.isFile())
        .catch(() => false);
      if (!isFile) file = join(buildDir, 'index.html'); // SPA fallback
      return send(
        res,
        200,
        await readFile(file),
        types[extname(file)] ?? 'application/octet-stream'
      );
    }

    if (path === '/') {
      res.writeHead(302, { location: BASE });
      return res.end();
    }
    return send(res, 404, 'not found');
  } catch (err) {
    return send(res, 500, String(err));
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`legacy server on http://127.0.0.1:${port}${BASE}`);
});

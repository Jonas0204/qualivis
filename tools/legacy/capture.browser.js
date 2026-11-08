// tools/legacy/capture.browser.js
// Captures golden reference data from the legacy Angular build. Run in the browser console on
// http://127.0.0.1:4300/component-graph/ after localStorage.clear() + reload.
window.qvCapture = async function qvCapture(fixture) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const save = (file, body) =>
    fetch(`/capture/${fixture}/${file}`, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
    });
  const waitFor = async (pred, timeout = 120000) => {
    const t0 = Date.now();
    while (!pred()) {
      if (Date.now() - t0 > timeout) throw new Error('timeout waiting for condition');
      await sleep(100);
    }
  };
  const nodeEls = () => [...document.querySelectorAll('#zoomGroup g.node')];
  const positions = () => JSON.stringify(nodeEls().map(g => [g.__data__.x, g.__data__.y]));
  const waitStable = async () => {
    let last = '';
    for (let i = 0; i < 200; i++) {
      await sleep(300);
      const now = positions();
      if (now === last) return;
      last = now;
    }
  };
  const safeName = id => id.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const text = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);

  function snapshot(view) {
    const root = document.querySelector('#d3-root');
    const nodes = nodeEls().map(g => {
      const d = g.__data__;
      const main = g.querySelector('circle.circle-node');
      const overlay = g.querySelector('circle.circle-overlay');
      const inner = g.querySelector('circle.inner-circle');
      const label = g.querySelector('tspan.label-text');
      return {
        id: d.id,
        label: d.label ?? null,
        type: d.type ?? null,
        kind: d.kind ?? null,
        special: !!d.special,
        returnsJSX: !!d.returnsJSX,
        isUsingThis: d.isUsingThis ?? null,
        extends: !!d.extends,
        width: d.width,
        height: d.height,
        warn: !!d.warn,
        error: !!d.error,
        cluster: d.cluster ?? null,
        icons: (d.icons || []).map(i => ({
          icon: i.icon,
          class: i.class,
          description: i.description,
        })),
        x: d.x,
        y: d.y,
        dom: {
          mainR: main && Number(main.getAttribute('r')),
          mainClass: main && main.getAttribute('class'),
          overlayClass: overlay && overlay.getAttribute('class'),
          overlayFill: overlay && overlay.getAttribute('fill'),
          overlayStrokeWidth: overlay && overlay.getAttribute('stroke-width'),
          innerR: inner && Number(inner.getAttribute('r')),
          innerClass: inner && inner.getAttribute('class'),
          label: label ? label.textContent : null,
          iconTexts: [...g.querySelectorAll('tspan.icon')].map(
            t => `${t.getAttribute('class')}:${t.textContent}`
          ),
          previews: [...g.querySelectorAll('circle.function')].map(c => ({
            cls: c.getAttribute('class'),
            title: c.querySelector('title')?.textContent ?? null,
            hidden: c.style.display === 'none',
            cx: Number(c.getAttribute('cx')),
            cy: Number(c.getAttribute('cy')),
          })),
          dots: [...g.querySelectorAll('text.dots')].map(t => ({
            x: Number(t.getAttribute('x')),
            y: Number(t.getAttribute('y')),
          })),
        },
      };
    });
    const links = [...document.querySelectorAll('#zoomGroup line')].map(l => ({
      source: l.__data__.source.id,
      target: l.__data__.target.id,
      inherits: !!l.__data__.inherits,
      dash: l.getAttribute('stroke-dasharray'),
    }));
    return {
      view,
      url: location.pathname + location.search,
      container: [root.clientWidth, root.clientHeight],
      settings: JSON.parse(localStorage.getItem('settings') || 'null'),
      hasClusterButton: !!document.querySelector('.show-cluster-button'),
      nodes,
      links,
    };
  }

  async function readPanel() {
    await sleep(300);
    const panel = document.querySelector('app-code-quality');
    return {
      header: text(panel.querySelector('.cell-header')),
      metrics: [...panel.querySelectorAll('.quality-metric')].map(m => ({
        name: text(m.querySelector('.name')),
        description: m.querySelector('.name').getAttribute('title'),
        value: text(m.querySelector('.value')),
        valueTitle: m.querySelector('.value').getAttribute('title'),
        barClass: m.querySelector('mat-progress-bar').getAttribute('class'),
      })),
      icons: [...panel.querySelectorAll('app-icon-description')].map(i => ({
        hostClass: i.getAttribute('class'),
        icon: text(i.querySelector('.icon')),
        description: text(i.querySelector('.description')),
      })),
    };
  }

  async function panelsForAll() {
    const out = [];
    for (const g of nodeEls()) {
      g.querySelector('circle.circle-overlay').dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
      out.push({ id: g.__data__.id, panel: await readPanel() });
    }
    document
      .querySelector('#d3-root svg')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return out;
  }

  // 1. Load fixture via synthetic drop (paths in canonical order from the manifest)
  const list = await (await fetch(`/fixtures/${fixture}/manifest.json`)).json();
  const items = [];
  for (const rel of list) {
    const content = await (await fetch(`/fixtures/${fixture}/${rel}`)).text();
    const file = new File([content], rel.split('/').pop(), { type: 'text/plain' });
    Object.defineProperty(file, 'webkitRelativePath', { value: `/${fixture}/${rel}` });
    items.push({ kind: 'file', getAsFile: () => file });
  }
  const drop = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(drop, 'dataTransfer', { value: { items } });
  document.querySelector('[appdroptarget]').dispatchEvent(drop);

  // 2. Wait for analysis + first layout
  await waitFor(
    () =>
      location.pathname.endsWith('/graph') &&
      !document.querySelector('mat-progress-bar') &&
      nodeEls().length > 0
  );
  await waitStable();

  // 3. Analysis results (written by the app on beforeunload)
  window.onbeforeunload();
  await save('legacy-report.json', localStorage.getItem('report'));
  await save('legacy-filemap.json', localStorage.getItem('components'));
  await save('legacy-appgraph.json', localStorage.getItem('graph'));

  // 4. App view rules + panels
  await save('legacy-dom-app.json', snapshot('app'));
  await save('legacy-panels-app.json', await panelsForAll());

  // 5. Component views (every component node with inner functions)
  const targets = nodeEls()
    .map(g => g.__data__)
    .filter(d => d.id.startsWith('/') && d.functions && d.functions.length >= 1)
    .map(d => d.id);
  for (const id of targets) {
    const g = nodeEls().find(n => n.__data__.id === id);
    g.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await waitFor(() => !!document.querySelector('button[aria-label="Back to app graph"]'));
    await waitStable();
    await save(`legacy-dom-component-${safeName(id)}.json`, snapshot('component'));
    await save(`legacy-panels-component-${safeName(id)}.json`, await panelsForAll());
    document.querySelector('button[aria-label="Back to app graph"]').click();
    await waitFor(() => !document.querySelector('button[aria-label="Back to app graph"]'));
    await waitStable();
  }
  return { fixture, files: list.length, componentViews: targets.length };
};

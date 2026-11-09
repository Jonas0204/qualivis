// tools/legacy/capture-cluster-colors.browser.js
// Captures the cluster colours of the legacy build: ground truth for
// packages/core/src/rules/color.ts (P05-S02). Run in the browser console on
// http://127.0.0.1:4300/component-graph/ after localStorage.clear() + reload, then
// `await qvCaptureClusterColors('mini')`. It loads the fixture itself and writes only
// legacy-cluster-colors.json; capture.browser.js would rewrite all goldens, and their positions
// depend on the window size.
window.qvCaptureClusterColors = async function qvCaptureClusterColors(
    fixture,
    componentId = `/${fixture}/src/App.js#App`
) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
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

    // 1. Load the fixture via a synthetic drop (same as capture.browser.js)
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
    await waitFor(
        () =>
            location.pathname.endsWith('/graph') &&
            !document.querySelector('mat-progress-bar') &&
            nodeEls().length > 0
    );
    await waitStable();

    // 2. Open the component view and switch the cluster colours on
    const g = nodeEls().find(n => n.__data__.id === componentId);
    if (!g) throw new Error(`node not found: ${componentId}`);
    g.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await waitFor(() => !!document.querySelector('button[aria-label="Back to app graph"]'));
    await waitStable();
    await waitFor(() => !!document.querySelector('.show-cluster-button'));
    document.querySelector('.show-cluster-button').click();
    await sleep(500);

    // 3. Colours of every node with a cluster
    const colors = nodeEls()
        .filter(n => n.__data__.cluster !== undefined)
        .map(n => ({
            id: n.__data__.id,
            cluster: n.__data__.cluster,
            fill: n.querySelector('circle.circle-node').style.fill,
            stroke: n.querySelector('circle.circle-overlay').style.stroke,
        }));
    await fetch(`/capture/${fixture}/legacy-cluster-colors.json`, {
        method: 'POST',
        body: JSON.stringify({ fixture, componentId, colors }, null, 2),
    });
    return {
        fixture,
        componentId,
        nodes: colors.length,
        clusters: [...new Set(colors.map(c => c.cluster))],
    };
};

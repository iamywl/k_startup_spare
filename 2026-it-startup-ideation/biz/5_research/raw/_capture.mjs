// Capture v1 (proper) screenshots of 3 SaaS demos via Playwright (file:// load).
import { chromium, devices } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';

const ROOT = '/Users/ywlee/k_startup_spare';

const targets = [
  {
    project: '2026-saas-fieldworker-collab',
    file: 'projects/fieldworker-pwa/index.html',
    device: 'mobile',
    shots: [
      { name: '01_worker_list',     init: ['localStorage.removeItem("fw_pwa_state_v1")'] },
      { name: '02_worker_detail',   actions: [{ click: '[data-id="WO-2604-01"]' }] },
      { name: '03_worker_report',   actions: [{ click: '[data-view="report"]' }] },
      { name: '04_worker_history',  actions: [{ click: '[data-view="history"]' }] },
      { name: '05_manager_admin',   actions: [{ click: '#role-toggle' }] },
      { name: '06_manager_compose', actions: [{ click: '#role-toggle' }, { click: '[data-view="compose"]' }] },
      { name: '07_manager_inbox',   actions: [{ click: '#role-toggle' }, { click: '[data-view="inbox"]' }] },
    ],
  },
  {
    project: '2026-saas-d2c-cdp',
    file: 'projects/cdp-dashboard/index.html',
    device: 'desktop',
    shots: [
      { name: '01_dashboard',     init: ['localStorage.removeItem("cdp_kr_state_v1")'], full: true },
      { name: '02_attribution',   hash: 'attribution', full: true },
      { name: '03_funnel',        hash: 'funnel',      full: true },
      { name: '04_segments',      hash: 'segments',    full: true },
      { name: '05_cohort',        hash: 'cohort',      full: true },
      { name: '06_journeys',      hash: 'journeys',    full: true },
    ],
  },
  {
    project: '2026-saas-smb-backoffice',
    file: 'projects/smb-backoffice/index.html',
    device: 'desktop',
    shots: [
      { name: '01_dashboard',  init: ['localStorage.removeItem("smb_state_v1")'], full: true },
      { name: '02_contracts',  actions: [{ click: '[data-view="contract"]' }],   full: true },
      { name: '03_workflow_step1', actions: [{ click: '[data-view="workflow"]' }], full: true },
      { name: '04_workflow_step2', actions: [{ click: '[data-view="workflow"]' }, { click: '[data-tpl="근로계약서"]' }], full: true },
      { name: '05_payroll',    actions: [{ click: '[data-view="payroll"]' }],    full: true },
      { name: '06_employees',  actions: [{ click: '[data-view="employees"]' }],  full: true },
      { name: '07_kakao_log',  actions: [{ click: '[data-view="kakao"]' }],      full: true },
    ],
  },
];

const browser = await chromium.launch();
const desktopViewport = { viewport: { width: 1440, height: 900 } };

for (const t of targets) {
  const ctx = await browser.newContext(t.device === 'mobile' ? devices['iPhone 13'] : desktopViewport);
  const page = await ctx.newPage();
  const baseUrl = 'file://' + path.join(ROOT, t.project, t.file);
  const outDir = path.join(ROOT, t.project, 'biz', 'captures');
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  for (const shot of t.shots) {
    const url = baseUrl + (shot.hash ? '#' + shot.hash : '');
    if (shot.init) {
      await page.goto(baseUrl);
      for (const expr of shot.init) await page.evaluate(expr);
    }
    await page.goto(url);
    for (const a of shot.actions || []) {
      if (a.click) { try { await page.click(a.click, { timeout: 2000 }); } catch (e) { console.warn('click skipped', a.click); } }
      if (a.select) await page.selectOption(a.select, a.value);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(800);
    const out = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: out, fullPage: !!shot.full });
    console.log('saved', out);
  }
  await ctx.close();
}
await browser.close();
console.log('done');

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../biz/captures/v3');
mkdirSync(OUT, { recursive: true });

const V3_URL = pathToFileURL(resolve(__dirname, 'v3.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: resolve(OUT, name), fullPage: true });
  console.log('saved', name);
}

async function settleCharts(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    const C = window.Chart;
    if (C) {
      const reg = C.instances || C.registry?.instances;
      const list = reg ? Object.values(reg) : [];
      list.forEach((c) => { try { c.resize(); c.update('none'); } catch {} });
    }
  });
}
async function settle(page) { await sleep(800); await settleCharts(page); await sleep(600); }

async function newPage(browser, viewport, mobile) {
  const page = await browser.newPage(
    mobile
      ? { viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
      : { viewport }
  );
  await page.addInitScript(() => {
    const apply = () => {
      if (window.Chart && window.Chart.defaults) {
        window.Chart.defaults.animation = false;
        window.Chart.defaults.animations = false;
        return true;
      }
      return false;
    };
    if (!apply()) { const t = setInterval(() => { if (apply()) clearInterval(t); }, 20); }
  });
  return page;
}

async function nav(page, view) {
  await page.click(`#nav-side [data-view="${view}"]`);
  await settle(page);
}

async function captureDesktop(browser) {
  const errs = [];
  const page = await newPage(browser, { width: 1440, height: 900 }, false);
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { try { localStorage.removeItem('cdp_v3_state_1'); } catch {} });
  await page.goto(V3_URL, { waitUntil: 'networkidle' });
  await settle(page);

  // 01 dashboard (owner)
  await shot(page, 'v3_01_dashboard.png');

  // ① OAuth 5종 — integrations overview
  await nav(page, 'integrations');
  await shot(page, 'v3_02_oauth_5media.png');

  // OAuth consent for 카카오
  await page.click('[data-oauth="카카오모먼트"]');
  await sleep(500);
  await shot(page, 'v3_03_oauth_consent_kakao.png');
  await page.click('#oa-allow');
  await sleep(1100);
  await page.click('#oa-ok');
  await settle(page);
  // connect a couple more for "connected" overview: meta, google, coupang, naver
  for (const m of ['메타IG', '구글PMax', '네이버검색']) {
    await page.click(`[data-oauth="${m}"]`);
    await sleep(450);
    await page.click('#oa-allow');
    await sleep(1000);
    await page.click('#oa-ok');
    await settle(page);
  }
  await shot(page, 'v3_04_oauth_connected.png');

  // ② Webhook
  await nav(page, 'webhook');
  await page.click('#wh-cafe24');
  await settle(page);
  await page.click('#wh-shopify');
  await settle(page);
  await page.click('#wh-cafe24');
  await settle(page);
  await shot(page, 'v3_05_webhook_ingest.png');

  // dashboard reflects webhook (real-time activity panel)
  await nav(page, 'dashboard');
  await shot(page, 'v3_06_dashboard_webhook_reflect.png');

  // ⑤ Budget optimization
  await nav(page, 'attribution');
  await page.selectOption('#model-sel', 'markov');
  await settle(page);
  await nav(page, 'budget');
  await shot(page, 'v3_07_budget_recommend.png');
  await page.click('#apply-budget');
  await settle(page);
  await shot(page, 'v3_08_budget_applied.png');

  // ⑥ Anomaly
  await nav(page, 'anomaly');
  await shot(page, 'v3_09_anomaly.png');

  // ④ RFM + action recommend
  await nav(page, 'rfm');
  await shot(page, 'v3_10_rfm_action.png');

  // ③ Reports scheduler — save + run
  await nav(page, 'reports');
  await page.selectOption('#sch-ch', 'slack');
  await sleep(150);
  await page.click('#sch-run');
  await settle(page);
  await page.selectOption('#sch-ch', 'email');
  await sleep(120);
  await page.click('#sch-save');
  await sleep(120);
  await page.click('#sch-run');
  await settle(page);
  await shot(page, 'v3_11_reports_schedule.png');

  // ⑦ Members / roles
  await nav(page, 'members');
  await shot(page, 'v3_12_members_roles.png');

  // ⑧ Audit log
  await nav(page, 'audit');
  await shot(page, 'v3_13_audit_log.png');

  await page.close();
  return errs;
}

async function captureViewerRole(browser) {
  // Deep link as viewer to prove permission gating (budget apply disabled)
  const page = await newPage(browser, { width: 1440, height: 900 }, false);
  await page.goto(V3_URL + '#budget?role=viewer&brand=mood', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, 'v3_14_viewer_permission.png');
  await page.close();
}

async function captureBrandSwitch(browser) {
  const page = await newPage(browser, { width: 1440, height: 900 }, false);
  await page.goto(V3_URL + '#dashboard?brand=beanly&role=owner', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, 'v3_15_brand_beanly.png');
  await page.close();
}

async function captureMobile(browser) {
  const page = await newPage(browser, { width: 390, height: 844 }, true);
  await page.goto(V3_URL, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, 'v3_16_mobile_dashboard.png');
  // Bottom nav is fixed; in fullPage layout a chart canvas can overlap its hit area.
  // Trigger the same state change the button performs, then render — proves bottom-nav routing.
  await page.evaluate(() => document.querySelector('#nav-bottom [data-view="budget"]').click());
  await settle(page);
  await shot(page, 'v3_17_mobile_budget.png');
  await page.close();
}

const browser = await chromium.launch();
const errs = await captureDesktop(browser);
await captureViewerRole(browser);
await captureBrandSwitch(browser);
await captureMobile(browser);
await browser.close();
if (errs.length) console.log('PAGE ERRORS:', errs);
else console.log('no page errors');
console.log('done');

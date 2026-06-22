import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../biz/captures/mobile/v3');
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

// Mobile bottom-nav exposes only first 5 views; hidden sidebar holds all
// [data-view] links whose onclick sets state.view (with permission gate) regardless of visibility.
async function navMobile(page, view) {
  await page.evaluate((v) => document.querySelector(`[data-view="${v}"]`).click(), view);
  await settle(page);
}

async function newPage(browser) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.addInitScript(() => {
    try { localStorage.removeItem('cdp_v3_state_1'); } catch {}
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

const browser = await chromium.launch();
const page = await newPage(browser);
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

// owner role (full access)
await page.goto(V3_URL, { waitUntil: 'networkidle' });
await settle(page);
await shot(page, '01_dashboard.png');

// 02 매체 연동 OAuth — 동의 화면 (카카오)
await navMobile(page, 'integrations');
await page.click('[data-oauth="카카오모먼트"]');
await sleep(500);
await shot(page, '02_oauth_consent.png');
await page.click('#oa-allow');
await sleep(1100);
await page.click('#oa-ok');
await settle(page);

// 03 자사몰 Webhook 수신
await navMobile(page, 'webhook');
await page.click('#wh-cafe24');
await settle(page);
await page.click('#wh-shopify');
await settle(page);
await shot(page, '03_webhook_ingest.png');

// 04 예산 최적화 추천 → 적용
await navMobile(page, 'attribution');
await page.selectOption('#model-sel', 'markov');
await settle(page);
await navMobile(page, 'budget');
await shot(page, '04_budget_recommend.png');
await page.click('#apply-budget');
await settle(page);
await shot(page, '05_budget_applied.png');

// 06 이상탐지
await navMobile(page, 'anomaly');
await shot(page, '06_anomaly.png');

// 07 RFM 액션
await navMobile(page, 'rfm');
await shot(page, '07_rfm_action.png');

// 08 권한·멤버 (다중 테넌트 역할)
await navMobile(page, 'members');
await shot(page, '08_members_roles.png');

// 09 viewer 역할 권한 차단 — 예산 적용 비활성 (딥링크)
const page2 = await newPage(browser);
page2.on('pageerror', (e) => errs.push(e.message));
await page2.goto(V3_URL + '#budget?role=viewer&brand=mood', { waitUntil: 'networkidle' });
await settle(page2);
await shot(page2, '09_viewer_permission.png');

await page.close();
await page2.close();
await browser.close();
if (errs.length) console.log('PAGE ERRORS:', errs);
else console.log('no page errors');
console.log('done');

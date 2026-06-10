import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../biz/captures');
const OUT_V2 = resolve(OUT, 'v2');
mkdirSync(OUT, { recursive: true });
mkdirSync(OUT_V2, { recursive: true });

const V1_URL = pathToFileURL(resolve(__dirname, 'index.html')).href;
const V2_URL = pathToFileURL(resolve(__dirname, 'v2.html')).href;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, dir, name) {
  await page.screenshot({ path: resolve(dir, name), fullPage: true });
  console.log('saved', name);
}

async function settleCharts(page) {
  // Force every Chart.js instance to recompute size against its final container
  // width — guards against canvases that drew before the CSS grid laid out.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    const C = window.Chart;
    if (C) {
      const reg = C.instances || C.registry?.instances;
      const list = reg ? Object.values(reg) : [];
      list.forEach((c) => {
        try { c.resize(); c.update('none'); } catch {}
      });
    }
  });
}

async function gotoView(page, url, hash) {
  await page.goto(url + '#' + hash, { waitUntil: 'networkidle' });
  // Charts render after Chart.js parses; give animations time to settle, then
  // force a resize so responsive canvases recompute against the final grid width.
  await sleep(900);
  await settleCharts(page);
  await sleep(700);
}

// Disable Chart.js animations before any chart is constructed so screenshots
// always capture the fully-drawn final frame regardless of timing.
async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    const apply = () => {
      if (window.Chart && window.Chart.defaults) {
        window.Chart.defaults.animation = false;
        window.Chart.defaults.animations = false;
        return true;
      }
      return false;
    };
    if (!apply()) {
      const t = setInterval(() => { if (apply()) clearInterval(t); }, 20);
    }
  });
  return page;
}

async function captureV1(browser) {
  const page = await newPage(browser);

  await gotoView(page, V1_URL, 'dashboard');
  await shot(page, OUT, '01_dashboard.png');

  await gotoView(page, V1_URL, 'attribution');
  await shot(page, OUT, '02_attribution.png');

  // Action: toggle attribution model to Markov (re-renders whole view).
  await page.selectOption('#model-sel', 'markov');
  await sleep(900);
  await settleCharts(page);
  await sleep(700);
  await shot(page, OUT, '02b_attribution_markov.png');

  await gotoView(page, V1_URL, 'funnel');
  await shot(page, OUT, '03_funnel.png');

  await gotoView(page, V1_URL, 'segments');
  await shot(page, OUT, '04_segments.png');

  // Action: open segment builder, fill, save -> persisted custom segment row.
  await page.click('#add-seg');
  await sleep(400);
  await page.fill('#seg-name', '메타 유입 VIP');
  await page.selectOption('#seg-channel', '메타IG');
  await page.selectOption('#seg-tier', 'VIP');
  await page.fill('#seg-min', '150000');
  await sleep(300);
  await shot(page, OUT, '04b_segment_builder.png');
  await page.click('#seg-save');
  await sleep(700);
  await shot(page, OUT, '04c_segment_saved.png');

  await gotoView(page, V1_URL, 'cohort');
  await shot(page, OUT, '05_cohort.png');

  await gotoView(page, V1_URL, 'journeys');
  // Action: filter to journeys containing 네이버검색.
  await sleep(500);
  await page.check('.jf[data-ch="네이버검색"]');
  await sleep(700);
  await shot(page, OUT, '06_journeys.png');

  await page.close();
}

async function settle(page) {
  await sleep(900);
  await settleCharts(page);
  await sleep(700);
}

async function nav(page, view) {
  // desktop sidebar uses [data-view]; click first visible match
  await page.click(`#nav-side [data-view="${view}"]`);
  await settle(page);
}

async function captureV2Desktop(browser) {
  const page = await newPage(browser);
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  // reset state so seed data is deterministic-ish and no stale schema
  await page.addInitScript(() => { try { localStorage.removeItem('cdp_v2_state_2'); } catch {} });
  await page.goto(V2_URL, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, OUT_V2, 'v2_01_dashboard.png');

  // 2) Brand switcher -> Beanly Coffee
  await page.selectOption('#brand-sel', 'beanly');
  await settle(page);
  await shot(page, OUT_V2, 'v2_02_brand_switch.png');
  await page.selectOption('#brand-sel', 'mood');
  await settle(page);

  // Attribution + Markov toggle (실 알고리즘)
  await nav(page, 'attribution');
  await page.selectOption('#model-sel', 'markov');
  await settle(page);
  await shot(page, OUT_V2, 'v2_03_attribution_markov.png');

  // Funnel
  await nav(page, 'funnel');
  await shot(page, OUT_V2, 'v2_04_funnel.png');

  // Segments + builder action
  await nav(page, 'segments');
  await page.click('#add-seg');
  await sleep(400);
  await page.fill('#seg-name', '카카오 유입 재구매');
  await page.selectOption('#seg-channel', '카카오모먼트');
  await page.selectOption('#seg-tier', '재구매');
  await page.fill('#seg-min', '120000');
  await sleep(300);
  await page.click('#seg-save');
  await settle(page);
  await shot(page, OUT_V2, 'v2_05_segments.png');

  // 8) RFM 자동 세그먼트 (실 RFM)
  await nav(page, 'rfm');
  await shot(page, OUT_V2, 'v2_06_rfm.png');

  // Cohort
  await nav(page, 'cohort');
  await shot(page, OUT_V2, 'v2_07_cohort.png');

  // 3) CSV bulk import — upload a file -> preview -> apply
  await nav(page, 'import');
  const csvPath = resolve(__dirname, '_sample_spend.csv');
  await page.setInputFiles('#csv-file', csvPath);
  await sleep(500);
  await shot(page, OUT_V2, 'v2_08_csv_import.png');
  await page.click('#apply-csv');
  await settle(page);

  // 6) Naver 검색광고 OAuth mock — real consent screen flow
  await nav(page, 'integrations');
  await page.click('[data-oauth="네이버검색"]');
  await sleep(500);
  await shot(page, OUT_V2, 'v2_09_oauth_consent.png');
  await page.click('#oa-allow');
  await sleep(1100); // spinner -> token done
  await shot(page, OUT_V2, 'v2_10_oauth_token.png');
  await page.click('#oa-ok');
  await settle(page);
  await shot(page, OUT_V2, 'v2_11_integrations_connected.png');

  // 7) 자동 보고 스케줄러 + 발송 로그
  await nav(page, 'schedule');
  await page.selectOption('#sch-ch', 'slack');
  await sleep(200);
  await page.click('#sch-test');
  await settle(page);
  await page.selectOption('#sch-ch', 'email');
  await sleep(150);
  await page.click('#sch-save');
  await settle(page);
  await shot(page, OUT_V2, 'v2_12_schedule_sendlog.png');

  // 4) URL state deep link + share (capture dashboard with hash + toast)
  await nav(page, 'dashboard');
  await page.click('#share');
  await sleep(500);
  await shot(page, OUT_V2, 'v2_13_share_link.png');

  await page.close();
  return errs;
}

async function captureV2DeepLink(browser) {
  // Open a deep link directly to attribution+markov+beanly to prove URL restore
  const page = await newPage(browser);
  await page.goto(V2_URL + '#attribution?model=markov&brand=beanly', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, OUT_V2, 'v2_14_deeplink_restore.png');
  await page.close();
}

async function captureV2Mobile(browser) {
  // iPhone 13 viewport -> sidebar hidden, bottom nav shown
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
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
  await page.goto(V2_URL, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, OUT_V2, 'v2_15_mobile_dashboard.png');
  // bottom nav -> attribution
  await page.click('#nav-bottom [data-view="attribution"]');
  await settle(page);
  await shot(page, OUT_V2, 'v2_16_mobile_attribution_bottomnav.png');
  await page.close();
}

const ONLY_V2 = process.argv.includes('--v2');
const browser = await chromium.launch();
if (!ONLY_V2) await captureV1(browser);
const errs = await captureV2Desktop(browser);
await captureV2DeepLink(browser);
await captureV2Mobile(browser);
await browser.close();
if (errs.length) console.log('PAGE ERRORS:', errs);
else console.log('no page errors');
console.log('done');

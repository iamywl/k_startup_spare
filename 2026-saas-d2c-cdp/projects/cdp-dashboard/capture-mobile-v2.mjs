import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../biz/captures/mobile/v2');
mkdirSync(OUT, { recursive: true });

const V2_URL = pathToFileURL(resolve(__dirname, 'v2.html')).href;
const CSV = resolve(__dirname, '_sample_spend.csv');
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

// Mobile bottom-nav exposes only first 5 views; the hidden sidebar holds all
// [data-view] links whose onclick sets state.view regardless of visibility.
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
    try { localStorage.removeItem('cdp_v2_state_2'); } catch {}
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

await page.goto(V2_URL, { waitUntil: 'networkidle' });
await settle(page);
await shot(page, '01_dashboard.png'); // bottom-nav + KPI cards

// 02 어트리뷰션 + Markov 토글 (실 알고리즘 결과)
await navMobile(page, 'attribution');
await page.selectOption('#model-sel', 'markov');
await settle(page);
await shot(page, '02_attribution_markov.png');

// 03 깔때기 (퍼널)
await navMobile(page, 'funnel');
await shot(page, '03_funnel.png');

// 04 세그먼트 빌더 모달 — 작성 중
await navMobile(page, 'segments');
await page.click('#add-seg');
await sleep(400);
await page.fill('#seg-name', '카카오 유입 재구매');
await page.selectOption('#seg-channel', '카카오모먼트');
await page.selectOption('#seg-tier', '재구매');
await page.fill('#seg-min', '120000');
await sleep(300);
await shot(page, '04_segment_builder_modal.png');
await page.click('#seg-save');
await settle(page);

// 05 RFM 자동 세그먼트
await navMobile(page, 'rfm');
await shot(page, '05_rfm.png');

// 06 CSV 가져오기 — 업로드 미리보기
await navMobile(page, 'import');
await page.setInputFiles('#csv-file', CSV);
await sleep(500);
await shot(page, '06_csv_import.png');
await page.click('#apply-csv');
await settle(page);

// 07 매체 연동 OAuth 동의 화면
await navMobile(page, 'integrations');
await page.click('[data-oauth="네이버검색"]');
await sleep(500);
await shot(page, '07_oauth_consent.png');
await page.click('#oa-allow');
await sleep(1100);
await page.click('#oa-ok');
await settle(page);
await shot(page, '08_integrations_connected.png');

// 09 자동 보고 스케줄러 + 발송 로그
await navMobile(page, 'schedule');
await page.selectOption('#sch-ch', 'slack');
await sleep(200);
await page.click('#sch-test');
await settle(page);
await shot(page, '09_schedule_sendlog.png');

await page.close();
await browser.close();
if (errs.length) console.log('PAGE ERRORS:', errs);
else console.log('no page errors');
console.log('done');

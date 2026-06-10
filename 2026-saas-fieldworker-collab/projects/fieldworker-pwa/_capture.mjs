// Capture v1 (index.html) + v2 (v2.html) screenshots via Playwright (file:// load).
// Mobile device = iPhone 13. Output only into this project's biz/captures.
//
// Role bug fix: role/view state is persisted in localStorage and survives reloads,
// so toggling via #role-toggle across shots was non-deterministic. Instead we seed
// the exact desired {role, view, selected} into localStorage before each navigation.
import { chromium, devices } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..'); // 2026-saas-fieldworker-collab
const CAP_DIR = path.join(PROJECT_ROOT, 'biz', 'captures');
const V2_DIR = path.join(CAP_DIR, 'v2');

const V1_KEY = 'fw_pwa_state_v1';
const V2_KEY = 'fw_v2_state';

// 1x1 + sized PNG as a fake camera photo (red square) for upload preview demos.
const DEMO_PNG_DATAURL = (() => {
  // 8x8 solid orange PNG, base64.
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVR4nGP8z8Dwn4ECwESJ5lEDRg0YNWDUgKFmAAB1NQMFvc6S1QAAAABJRU5ErkJggg==';
})();

async function seedV1(page, baseUrl, patch) {
  await page.goto(baseUrl);
  await page.evaluate((p) => {
    const KEY = 'fw_pwa_state_v1';
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s) return; // app seeds itself on first render
    Object.assign(s, p);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, patch);
  await page.goto(baseUrl); // reload so render() reads the patched state
  await page.waitForTimeout(400);
}

// CAPTURE_V1=1 to also regenerate the v1 captures in biz/captures/. By default
// only v2 captures (biz/captures/v2) are (re)generated so existing v1 evidence
// referenced by the v1 report is left intact.
const REGEN_V1 = process.env.CAPTURE_V1 === '1';

async function run() {
  const browser = await chromium.launch();

  if (REGEN_V1) {
    await captureV1(browser);
  }

  // ---------- v2 (v2.html) ----------
  await captureV2(browser);

  await browser.close();
  console.log('done');
}

async function captureV1(browser) {
  const ctx = await browser.newContext(devices['iPhone 13']);
  const page = await ctx.newPage();

  // ---------- v1 (index.html) ----------
  const v1Url = 'file://' + path.join(PROJECT_ROOT, 'projects', 'fieldworker-pwa', 'index.html');
  await fs.mkdir(CAP_DIR, { recursive: true });

  // Prime app once so localStorage has seed state, then reset to known baseline.
  await page.goto(v1Url);
  await page.waitForTimeout(300);

  // 01 worker list (baseline worker/list)
  await seedV1(page, v1Url, { role: 'worker', view: 'list', selected: null });
  await shot(page, path.join(CAP_DIR, '01_worker_list.png'));

  // 02 worker detail with a real attached photo (proves upload + preview + completion gate)
  await seedV1(page, v1Url, { role: 'worker', view: 'list', selected: 'WO-2604-01' });
  await page.evaluate((dataUrl) => {
    const KEY = 'fw_pwa_state_v1';
    const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find((x) => x.id === 'WO-2604-01');
    if (o && !o.photos.length) o.photos.push(dataUrl);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, DEMO_PNG_DATAURL);
  await page.goto(v1Url);
  await page.waitForTimeout(400);
  await shot(page, path.join(CAP_DIR, '02_worker_detail.png'));

  // 03 worker report — show a typed memo (simulating voice->text result) before send
  await seedV1(page, v1Url, { role: 'worker', view: 'report', selected: null });
  await page.fill('#memo', '음성 입력: A-3호기 측면 펜스 일부 이격 발견, 즉시 점검 요망').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, path.join(CAP_DIR, '03_worker_report.png'));

  // 04 worker history — push a couple of history entries for a non-empty view
  await seedV1(page, v1Url, { role: 'worker', view: 'history', selected: null });
  await page.evaluate(() => {
    const KEY = 'fw_pwa_state_v1';
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s.history.length) {
      const now = new Date().toLocaleString('ko-KR');
      s.history = [
        { t: now, label: '작업 완료', detail: 'WO-2604-01 컨베이어 벨트 청소 (사진 1장)' },
        { t: now, label: '이상 보고', detail: '[설비 고장] 2호기 베어링 소음 발생' },
      ];
    }
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.goto(v1Url);
  await page.waitForTimeout(400);
  await shot(page, path.join(CAP_DIR, '04_worker_history.png'));

  // 05 manager admin (dashboard) — seed role=manager,view=admin directly
  await seedV1(page, v1Url, { role: 'manager', view: 'admin', selected: null });
  await shot(page, path.join(CAP_DIR, '05_manager_admin.png'));

  // 06 manager compose
  await seedV1(page, v1Url, { role: 'manager', view: 'compose', selected: null });
  await page.fill('#c-title', '야간 교대 전 설비 점검').catch(() => {});
  await page.fill('#c-detail', '벨트 장력 확인\n비상정지 버튼 동작 시험').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, path.join(CAP_DIR, '06_manager_compose.png'));

  // 07 manager inbox
  await seedV1(page, v1Url, { role: 'manager', view: 'inbox', selected: null });
  await shot(page, path.join(CAP_DIR, '07_manager_inbox.png'));

  await ctx.close();
}

async function seedV2(page, baseUrl, patch) {
  await page.goto(baseUrl);
  await page.evaluate((p) => {
    const KEY = 'fw_v2_state';
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s) return;
    Object.assign(s, p);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, patch);
  await page.goto(baseUrl);
  await page.waitForTimeout(450);
}

// Rich worker/order/report seed so feature-specific shots have realistic content.
function v2RichPatch(extra) {
  const photo = DEMO_PNG_DATAURL;
  const now = new Date().toLocaleString('ko-KR');
  return Object.assign({
    history: [
      { t: now, label: '작업 완료', detail: 'WO-2604-04 품질 샘플 채취 (사진 2장)', role: 'worker' },
      { t: now, label: '이상 보고', detail: '[설비 고장] 2호기 베어링 소음 발생', role: 'worker' },
      { t: now, label: '푸시 구독', detail: 'mock · mock://push/endpoint/ab12cd34…', role: 'worker' },
      { t: now, label: '오프라인 큐 복구', detail: '완료 WO-2604-01', role: 'worker' },
    ],
    _seedPhoto: photo,
  }, extra || {});
}

async function captureV2(browser) {
  const v2Url = 'file://' + path.join(PROJECT_ROOT, 'projects', 'fieldworker-pwa', 'v2.html');
  await fs.mkdir(V2_DIR, { recursive: true });

  // ---- Mobile (iPhone 13) context ----
  const mctx = await browser.newContext(devices['iPhone 13']);
  const page = await mctx.newPage();
  await page.goto(v2Url);
  await page.waitForTimeout(300);

  // 01 worker list (online, 3 roles entry point)
  await seedV2(page, v2Url, { role: 'worker', view: 'list', selected: null, online: true, pushSubscribed: false });
  await shot(page, path.join(V2_DIR, '01_worker_list.png'));

  // 02 worker detail — checklist applied (제조 템플릿) + attached photo + geo recorded (feature 6,7,8)
  await seedV2(page, v2Url, { role: 'worker', view: 'list', selected: 'WO-2604-01', online: true });
  await page.evaluate((photo) => {
    const KEY = 'fw_v2_state'; const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find((x) => x.id === 'WO-2604-01');
    o.checks = JSON.parse(JSON.stringify(s.templates['제조']));
    o.checks[0].d = true; o.checks[1].d = true; // partial completion
    o.photos = [photo];
    o.geo = { lat: 37.5012, lng: 127.039, mock: true };
    localStorage.setItem(KEY, JSON.stringify(s));
  }, DEMO_PNG_DATAURL);
  await page.goto(v2Url); await page.waitForTimeout(450);
  await shot(page, path.join(V2_DIR, '02_worker_detail_checklist.png'));

  // 03 산업 템플릿 선택 시트 (제조·F&B·물류) — feature 8
  await seedV2(page, v2Url, { role: 'worker', view: 'list', selected: 'WO-2604-03', online: true });
  await page.evaluate(() => {
    const KEY = 'fw_v2_state'; const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find((x) => x.id === 'WO-2604-03'); o.checks = []; // empty so apply-tpl button shows
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.goto(v2Url); await page.waitForTimeout(400);
  await page.click('#apply-tpl').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, path.join(V2_DIR, '03_checklist_templates_sheet.png'));

  // 04 worker report form (Web Speech memo simulated)
  await seedV2(page, v2Url, { role: 'worker', view: 'report', selected: null, online: true });
  await page.fill('#memo', '음성 입력: A-3호기 측면 안전펜스 일부 이격 발견, 즉시 점검 요망').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, path.join(V2_DIR, '04_worker_report_voice.png'));

  // 05 OFFLINE — queue accumulated banner (feature 3)
  await seedV2(page, v2Url, { role: 'worker', view: 'list', selected: null, online: false, queue: [{ type: 'complete', id: 'WO-2604-01' }, { type: 'report', r: { id: 'IR-204' } }] });
  await shot(page, path.join(V2_DIR, '05_offline_queue.png'));

  // 06 worker history including IndexedDB sync recovery entry (feature 3)
  await seedV2(page, v2Url, v2RichPatch({ role: 'worker', view: 'history', selected: null, online: true }));
  await shot(page, path.join(V2_DIR, '06_worker_history_sync.png'));

  // 07 worker mypage — push subscribed ON + stats (feature 5)
  await seedV2(page, v2Url, v2RichPatch({ role: 'worker', view: 'mypage', selected: null, online: true, pushSubscribed: true, pushMode: 'mock', pushEndpoint: 'mock://push/endpoint/ab12cd34' }));
  await shot(page, path.join(V2_DIR, '07_worker_mypage_push.png'));

  // 08 camera mock-fallback sheet (feature 6) — open detail then trigger stream button
  await seedV2(page, v2Url, { role: 'worker', view: 'list', selected: 'WO-2604-02', online: true });
  await page.click('#open-cam').catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, path.join(V2_DIR, '08_camera_mock_stream.png'));

  // 09 foreman compose (작업 발행 + 체크리스트 템플릿 선택)
  await seedV2(page, v2Url, { role: 'foreman', view: 'compose', selected: null, online: true });
  await page.fill('#c-title', '야간 교대 전 컨베이어 안전 점검').catch(() => {});
  await page.fill('#c-detail', '벨트 장력 확인\n비상정지 버튼 동작 시험\n윤활유 잔량 점검').catch(() => {});
  await page.selectOption('#c-tpl', '제조').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, path.join(V2_DIR, '09_foreman_compose.png'));

  // 10 foreman inbox (이상 수신)
  await seedV2(page, v2Url, { role: 'foreman', view: 'inbox', selected: null, online: true });
  await shot(page, path.join(V2_DIR, '10_foreman_inbox.png'));

  // 11 foreman lines (다중 라인 진척)
  await seedV2(page, v2Url, { role: 'foreman', view: 'lines', selected: null, online: true });
  await shot(page, path.join(V2_DIR, '11_foreman_lines.png'));

  // 12 PM dashboard (KPI + 라인별 진척 + 일괄 알림)
  await seedV2(page, v2Url, { role: 'pm', view: 'admin', selected: null, online: true });
  await shot(page, path.join(V2_DIR, '12_pm_admin.png'));

  // 13 PM report (주간 보고서 + 우선순위 분포 + CSV)
  await seedV2(page, v2Url, { role: 'pm', view: 'report-mgr', selected: null, online: true });
  await shot(page, path.join(V2_DIR, '13_pm_report.png'));

  // 14 PM team (다중 사용자 — 5명 역할별)
  await seedV2(page, v2Url, { role: 'pm', view: 'team', selected: null, online: true });
  await shot(page, path.join(V2_DIR, '14_pm_team.png'));

  await mctx.close();

  // ---- Desktop (responsive lg+ side nav) context (feature 1) ----
  const dctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const dpage = await dctx.newPage();
  await dpage.goto(v2Url); await dpage.waitForTimeout(300);

  // 15 desktop worker list — side nav + multi-column grid
  await seedV2(dpage, v2Url, { role: 'worker', view: 'list', selected: null, online: true, pushSubscribed: true, pushMode: 'mock' });
  await shot(dpage, path.join(V2_DIR, '15_desktop_worker.png'));

  // 16 desktop PM dashboard — wide KPI grid + side nav PWA status (SW/push/online)
  await seedV2(dpage, v2Url, { role: 'pm', view: 'admin', selected: null, online: true, pushSubscribed: true, pushMode: 'mock' });
  await shot(dpage, path.join(V2_DIR, '16_desktop_pm.png'));

  await dctx.close();
}

async function shot(page, out) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

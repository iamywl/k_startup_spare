// Mobile-only capture for v2.html — viewport 390x844 (iPhone 12/13 logical px),
// deviceScaleFactor 2, isMobile + hasTouch. Output → biz/captures/mobile/v2.
// State is seeded directly into localStorage (then reload) so the bottom-tab
// mobile nav renders the desired role/view deterministically (no toggle drift).
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(PROJECT_ROOT, 'biz', 'captures', 'mobile', 'v2');
const URL_V2 = 'file://' + path.join(HERE, 'v2.html');
const KEY = 'fw_v2_state';

const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVR4nGP8z8Dwn4ECwESJ5lEDRg0YNWDUgKFmAAB1NQMFvc6S1QAAAABJRU5ErkJggg==';

async function seed(page, patch, evalFn) {
  await page.goto(URL_V2);
  await page.evaluate(({ p, KEY }) => {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s) return;
    Object.assign(s, p);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, { p: patch, KEY });
  if (evalFn) await page.evaluate(evalFn, { PHOTO, KEY });
  await page.goto(URL_V2);
  await page.waitForTimeout(450);
}

async function shot(page, name) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  console.log('saved', name);
}

async function run() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
  await page.goto(URL_V2);
  await page.waitForTimeout(300);

  // 01 작업자 작업목록 (현장 진입 화면 · 하단 탭바)
  await seed(page, { role: 'worker', view: 'list', selected: null, online: true, pushSubscribed: false });
  await shot(page, '01_작업자_작업목록.png');

  // 02 작업 상세 — 산업 체크리스트(제조) 적용 + 사진 첨부 + 위치기록
  await seed(page, { role: 'worker', view: 'list', selected: 'WO-2604-01', online: true }, ({ PHOTO, KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find(x => x.id === 'WO-2604-01');
    o.checks = JSON.parse(JSON.stringify(s.templates['제조']));
    o.checks[0].d = true; o.checks[1].d = true;
    o.photos = [PHOTO];
    o.geo = { lat: 37.5012, lng: 127.039, mock: true };
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await shot(page, '02_작업상세_체크리스트.png');

  // 03 산업 템플릿 선택 시트 (제조·F&B·물류) — 바텀시트 모달
  await seed(page, { role: 'worker', view: 'list', selected: 'WO-2604-03', online: true }, ({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find(x => x.id === 'WO-2604-03'); o.checks = [];
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.click('#apply-tpl').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '03_템플릿선택_시트.png');

  // 04 이상보고 작성 — 음성 입력(Web Speech) 메모
  await seed(page, { role: 'worker', view: 'report', selected: null, online: true });
  await page.fill('#memo', '음성 입력: A-3호기 측면 안전펜스 일부 이격 발견, 즉시 점검 요망').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, '04_이상보고_음성메모.png');

  // 05 오프라인 큐 누적 배너 (네트워크 OFF)
  await seed(page, { role: 'worker', view: 'list', selected: null, online: false, queue: [{ type: 'complete', id: 'WO-2604-01' }, { type: 'report', r: { id: 'IR-204' } }] });
  await shot(page, '05_오프라인_큐누적.png');

  // 06 마이페이지 — 푸시 구독 ON + 통계 (개인화)
  await seed(page, {
    role: 'worker', view: 'mypage', selected: null, online: true,
    pushSubscribed: true, pushMode: 'mock', pushEndpoint: 'mock://push/endpoint/ab12cd34',
  });
  await shot(page, '06_마이페이지_푸시구독.png');

  // 07 카메라 mock 촬영 시트 (권한 없을 때 폴백) — 모달
  await seed(page, { role: 'worker', view: 'list', selected: 'WO-2604-02', online: true });
  await page.click('#open-cam').catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '07_카메라_mock시트.png');

  // 08 PM 대시보드 — KPI + 라인별 진척 (관리자 모바일 뷰)
  await seed(page, { role: 'pm', view: 'admin', selected: null, online: true });
  await shot(page, '08_PM_대시보드.png');

  await ctx.close();
  await browser.close();
  console.log('done');
}

run().catch((e) => { console.error(e); process.exit(1); });

// Mobile-only capture for v3.html — viewport 390x844, deviceScaleFactor 2,
// isMobile + hasTouch. Output → biz/captures/mobile/v3. State seeded into
// localStorage (then reload) so the bottom-tab mobile nav renders the desired
// role/view deterministically.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(PROJECT_ROOT, 'biz', 'captures', 'mobile', 'v3');
const URL_V3 = 'file://' + path.join(HERE, 'v3.html');
const KEY = 'fw_v3_state';

const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVR4nGP8z8Dwn4ECwESJ5lEDRg0YNWDUgKFmAAB1NQMFvc6S1QAAAABJRU5ErkJggg==';

async function seed(page, patch, evalFn) {
  await page.goto(URL_V3);
  await page.evaluate(({ p, KEY }) => {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s) return;
    Object.assign(s, p);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, { p: patch, KEY });
  if (evalFn) await page.evaluate(evalFn, { PHOTO, KEY });
  await page.goto(URL_V3);
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
  await page.goto(URL_V3);
  await page.waitForTimeout(300);

  // 01 작업자 작업목록 (현장 진입 화면 · 하단 탭바)
  await seed(page, { role: 'worker', view: 'list', selected: null, online: true });
  await shot(page, '01_작업자_작업목록.png');

  // 02 작업 상세 — 제조 LOTO 체크리스트 적용 + 사진 + 위치기록
  await seed(page, { role: 'worker', view: 'list', selected: 'WO-2606-01', online: true }, ({ PHOTO, KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find(x => x.id === 'WO-2606-01');
    o.checks = [
      { l: '전원 차단·차단기 잠금', d: true },
      { l: '잔류 에너지 방출 확인', d: true },
      { l: 'LOTO 표지 부착', d: false },
      { l: '관계자 통보', d: false },
      { l: '시운전 전 잠금 해제 기록', d: false },
    ];
    o.photos = [PHOTO];
    o.geo = { lat: 37.5012, lng: 127.039, mock: true };
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await shot(page, '02_작업상세_LOTO체크리스트.png');

  // 03 이상보고 — 심각도(중대) 선택 + 음성 메모
  await seed(page, { role: 'worker', view: 'report', selected: null, online: true });
  await page.fill('#memo', '음성 입력: A-3호기 측면 안전펜스 일부 이격 발견, 즉시 점검 요망').catch(() => {});
  await page.click('[data-sev="중대"]').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, '03_이상보고_심각도.png');

  // 04 네이티브 설치 안내 시트 (마이페이지) — 모달
  await seed(page, { role: 'worker', view: 'mypage', selected: null, online: true, pushSubscribed: true, pushMode: 'mock', pushEndpoint: 'mock://push/endpoint/ab12cd34' });
  await page.click('#install-native').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '04_네이티브설치_시트.png');

  // 05 안전관리자 — 위험분석 실행 결과 (AI 점수)
  await seed(page, { role: 'safety', view: 'risk', selected: null, online: true });
  await page.click('#run-risk').catch(() => {});
  await page.waitForTimeout(700);
  await shot(page, '05_안전_위험분석결과.png');

  // 06 안전관리자 — 안전 KPI 추세 대시보드
  await seed(page, { role: 'safety', view: 'kpi', selected: null, online: true });
  await shot(page, '06_안전_KPI추세.png');

  // 07 반장 — SLA 에스컬레이션 실행 결과
  await seed(page, { role: 'foreman', view: 'sla', selected: null, online: true }, ({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    s.slaRule = { highMin: 60, normalMin: 80, lowMin: 200, escalateTo: 'foreman' };
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.click('#run-escalation').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '07_반장_SLA에스컬레이션.png');

  // 08 PM — 푸시 캠페인 발송 로그
  await seed(page, { role: 'pm', view: 'campaign', selected: null, online: true });
  await page.fill('#pc-title', '폭염 대비 수분 섭취·15분 휴식 의무화 안내').catch(() => {});
  await page.click('#pc-send').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '08_PM_푸시캠페인.png');

  // 09 PM — 종합 대시보드 (KPI + SLA 위반 + 라인별)
  await seed(page, { role: 'pm', view: 'admin', selected: null, online: true });
  await shot(page, '09_PM_대시보드.png');

  // 10 PM — 팀 (7명 · 4역할 다중 사용자)
  await seed(page, { role: 'pm', view: 'team', selected: null, online: true });
  await shot(page, '10_PM_팀_4역할.png');

  await ctx.close();
  await browser.close();
  console.log('done');
}

run().catch((e) => { console.error(e); process.exit(1); });

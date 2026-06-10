// Capture v3 (v3.html) screenshots via Playwright (file:// load).
// Mobile device = iPhone 13; a few desktop shots at 1440x980.
// Output ONLY into biz/captures/v3 (CLAUDE.md). Role/view state is seeded
// directly into localStorage before each shot to avoid toggle-accumulation bugs.
import { chromium, devices } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..'); // 2026-saas-fieldworker-collab
const OUT = path.join(PROJECT_ROOT, 'biz', 'captures', 'v3');
const URL_V3 = 'file://' + path.join(HERE, 'v3.html');
const KEY = 'fw_v3_state';

// 8x8 solid orange PNG as a fake attached photo.
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
  if (evalFn) {
    await page.evaluate(evalFn, { PHOTO, KEY });
  }
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

  // ================= Mobile (iPhone 13) =================
  const mctx = await browser.newContext(devices['iPhone 13']);
  const page = await mctx.newPage();
  await page.goto(URL_V3); await page.waitForTimeout(300);

  // 01 worker list
  await seed(page, { role: 'worker', view: 'list', selected: null, online: true });
  await shot(page, '01_worker_list.png');

  // 02 worker detail — 산업별 체크리스트(제조 LOTO) 적용 + 사진 + geo (기능 1)
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
  await shot(page, '02_worker_detail_checklist.png');

  // 03 산업별 체크리스트 라이브러리 선택 시트 (기능 1)
  await seed(page, { role: 'worker', view: 'list', selected: 'WO-2606-02', online: true }, ({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    const o = s.orders.find(x => x.id === 'WO-2606-02'); o.checks = [];
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.click('#apply-tpl').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '03_checklist_library_sheet.png');

  // 04 worker report — 심각도 + 음성 메모 (기능 8 입력측)
  await seed(page, { role: 'worker', view: 'report', selected: null, online: true });
  await page.fill('#memo', '음성 입력: A-3호기 측면 안전펜스 일부 이격 발견, 즉시 점검 요망').catch(() => {});
  await page.click('[data-sev="중대"]').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, '04_worker_report_severity.png');

  // 05 OFFLINE — 큐 누적 (기능 8)
  await seed(page, { role: 'worker', view: 'list', selected: null, online: false, queue: [{ type: 'complete', id: 'WO-2606-01', label: '완료 WO-2606-01' }, { type: 'report', label: '이상 IR-204' }] });
  await shot(page, '05_offline_queue.png');

  // 06 worker mypage — 네이티브 설치 안내 시트 (기능 4)
  await seed(page, { role: 'worker', view: 'mypage', selected: null, online: true, pushSubscribed: true, pushMode: 'mock', pushEndpoint: 'mock://push/endpoint/ab12cd34' });
  await page.click('#install-native').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '06_native_install_sheet.png');

  // 07 safety — 안전 KPI 대시보드 (기능 3)
  await seed(page, { role: 'safety', view: 'kpi', selected: null, online: true });
  await shot(page, '07_safety_kpi_trends.png');

  // 08 safety — 위험분석 실행 결과 (기능 2)
  await seed(page, { role: 'safety', view: 'risk', selected: null, online: true });
  await page.click('#run-risk').catch(() => {});
  await page.waitForTimeout(700);
  await shot(page, '08_risk_analysis_result.png');

  // 09 safety — 산업별 체크리스트 라이브러리 전경 (기능 1)
  await seed(page, { role: 'safety', view: 'checklists', selected: null, online: true });
  await shot(page, '09_checklist_library.png');

  // 10 safety — 감사 로그 (동기화 충돌 해결 포함, 기능 8)
  await seed(page, { role: 'safety', view: 'audit', selected: null, online: true }, ({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    const now = new Date().toLocaleString('ko-KR');
    s.syncLog = [
      { t: now, label: '완료 WO-2606-01', strategy: 'client-wins', applied: true, reason: '클라이언트 변경 적용' },
      { t: now, label: '완료 WO-2606-03', strategy: 'server-wins', applied: false, reason: '서버 우선(LWW) — 이미 완료됨' },
    ];
    s.history = [
      { t: now, label: '위험분석 실행', detail: '전사 점수 54 · C(주의)', role: 'safety' },
      { t: now, label: 'SLA 에스컬레이션', detail: 'WO-2606-03 원료 투입 — 30분 초과 → 반장 상향', role: 'pm' },
      { t: now, label: '오프라인 큐 동기화', detail: '완료 WO-2606-01 · client-wins · 적용', role: 'worker' },
      { t: now, label: '이상 처리', detail: 'IR-303', role: 'foreman' },
      { t: now, label: '푸시 캠페인', detail: '폭염 대비 안내 · 전사 · sent (mock)', role: 'pm' },
    ];
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await shot(page, '10_safety_audit_log.png');

  // 11 foreman — SLA / 에스컬레이션 (기능 6)
  await seed(page, { role: 'foreman', view: 'sla', selected: null, online: true }, ({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    // tighten SLA so we get visible breaches deterministically
    s.slaRule = { highMin: 60, normalMin: 80, lowMin: 200, escalateTo: 'foreman' };
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.click('#run-escalation').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '11_foreman_sla_escalation.png');

  // 12 foreman compose — 산업별 체크리스트 첨부 (기능 1 + 7)
  await seed(page, { role: 'foreman', view: 'compose', selected: null, online: true });
  await page.fill('#c-title', '야간 교대 전 컨베이어 LOTO 점검').catch(() => {});
  await page.fill('#c-detail', '벨트 장력 확인\n비상정지 버튼 동작 시험\n윤활유 잔량 점검').catch(() => {});
  await page.selectOption('#c-tpl', '제조 · 설비 LOTO(잠금/표지)').catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, '12_foreman_compose.png');

  // 13 PM — 푸시 캠페인 발송 로그 (기능 5)
  await seed(page, { role: 'pm', view: 'campaign', selected: null, online: true });
  await page.fill('#pc-title', '폭염 대비 수분 섭취·15분 휴식 의무화 안내').catch(() => {});
  await page.click('#pc-send').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '13_pm_campaign.png');

  // 14 PM — 대시보드 (KPI + SLA 위반 + 라인별)
  await seed(page, { role: 'pm', view: 'admin', selected: null, online: true });
  await shot(page, '14_pm_dashboard.png');

  // 15 PM — 팀 (7명 · 4역할, 기능 7)
  await seed(page, { role: 'pm', view: 'team', selected: null, online: true });
  await shot(page, '15_pm_team_4roles.png');

  await mctx.close();

  // ================= Desktop (responsive lg+ side nav) =================
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const dpage = await dctx.newPage();
  await dpage.goto(URL_V3); await dpage.waitForTimeout(300);

  // 16 desktop — safety risk analysis (wide) with run
  await seed(dpage, { role: 'safety', view: 'risk', selected: null, online: true, pushSubscribed: true, pushMode: 'mock' });
  await dpage.click('#run-risk').catch(() => {});
  await dpage.waitForTimeout(700);
  await shot(dpage, '16_desktop_risk.png');

  // 17 desktop — safety KPI trends (wide)
  await seed(dpage, { role: 'safety', view: 'kpi', selected: null, online: true });
  await shot(dpage, '17_desktop_kpi.png');

  // 18 desktop — PM dashboard with side nav PWA status
  await seed(dpage, { role: 'pm', view: 'admin', selected: null, online: true, pushSubscribed: true, pushMode: 'mock' });
  await shot(dpage, '18_desktop_pm_dashboard.png');

  await dctx.close();
  await browser.close();
  console.log('done');
}

run().catch((e) => { console.error(e); process.exit(1); });

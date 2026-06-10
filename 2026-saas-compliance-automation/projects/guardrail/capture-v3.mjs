// 가드레일 v3 — 실 구동 캡처 스크립트 (Series A 데모)
// file:// 로드 → 8기능 시나리오 클릭 → biz/captures/v3/ 에만 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = "file://" + path.join(__dirname, "v3.html");
const OUT = path.resolve(__dirname, "../../biz/captures/v3");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("saved:", name);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text()); });
  const dl = [];
  page.on("download", (d) => dl.push(d.suggestedFilename()));

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(500);

  // 데이터 시드: 체크리스트 일부 충족 + 자동수집 + 정책 생성으로 의미있는 화면 확보
  // 1) 체크리스트 데모 시드
  await page.getByRole("button", { name: /통제 체크리스트/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /데모 시드/ }).click();
  await sleep(400);

  // 2) 자동수집 스캔 (AWS+GCP) → 증적 자동 등록
  await page.getByRole("button", { name: /증적 자동수집 스캔/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /AWS 스캔 실행/ }).click();
  await sleep(400);
  await page.getByRole("button", { name: /GCP 스캔 실행/ }).click();
  await sleep(400);

  // 3) 정책 조직변수 저장 + 생성 (일치성·패키지에 사용)
  await page.getByRole("button", { name: /정책문서·버전관리/ }).click();
  await sleep(300);
  await page.fill("#oname", "주식회사 가드레일테크");
  await page.fill("#oresp", "정보보호최고책임자 김보안");
  await page.fill("#odate", "2026-07-01");
  await page.getByRole("button", { name: /조직 변수 저장/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: "생성", exact: true }).first().click();
  await sleep(400);

  // ===== 캡처 시작 =====

  // 01 — KPI·SLA 대시보드 (#8)
  await page.getByRole("button", { name: /KPI·SLA 대시보드/ }).click();
  await sleep(500);
  await shot(page, "v3_01_kpi_sla_dashboard.png");

  // 02 — 실시간 연속 모니터링: 정기 점검 PASS (#1)
  await page.getByRole("button", { name: /실시간 연속 모니터링/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /정기 점검 실행/ }).click();
  await sleep(500);
  await shot(page, "v3_02_monitor_pass.png");

  // 03 — drift 유발 시뮬레이션 + Slack 알림 (#1)
  await page.getByRole("button", { name: /설정 변경 시뮬레이션/ }).click();
  await sleep(600);
  await shot(page, "v3_03_monitor_drift.png");

  // 04 — 위험 스코어링·우선순위 (#4)
  await page.getByRole("button", { name: /위험 스코어링/ }).click();
  await sleep(500);
  await shot(page, "v3_04_risk_scoring.png");

  // 05 — 위험 등록부에서 티켓+Jira 생성 (#3 연계)
  const tjBtn = page.getByRole("button", { name: /티켓\+Jira/ }).first();
  if (await tjBtn.count() > 0) { await tjBtn.click(); await sleep(400); }
  await shot(page, "v3_05_risk_ticket_jira.png");

  // 06 — 다중 프레임워크 교차매핑 (#2): 교차충족 데모
  await page.getByRole("button", { name: /다중 프레임워크 교차매핑/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /충족 처리 \(교차 반영\)/ }).click();
  await sleep(500);
  await shot(page, "v3_06_crossmap.png");

  // 07 — 정책↔증적 일치성 자동검사 (#6)
  await page.getByRole("button", { name: /정책↔증적 일치성/ }).click();
  await sleep(500);
  await shot(page, "v3_07_consistency.png");

  // 08 — 과제 티켓·GRC 연동 (일괄 티켓+Jira)
  await page.getByRole("button", { name: /과제 티켓·GRC 연동/ }).click();
  await sleep(300);
  const bulk = page.getByRole("button", { name: /일괄 생성/ });
  if (await bulk.count() > 0) { await bulk.click(); await sleep(400); }
  // 첫 티켓 담당자 배정 + 진행
  const sels = page.locator("select").filter({ hasText: /담당자 미배정/ });
  if (await sels.count() > 0) { await sels.first().selectOption({ index: 1 }); await sleep(300); }
  const startBtns = page.getByRole("button", { name: /진행 시작/ });
  if (await startBtns.count() > 0) { await startBtns.first().click(); await sleep(300); }
  await shot(page, "v3_08_tickets_grc.png");

  // 09 — 외부 연동 (Jira·Slack) 로그 (#3)
  await page.getByRole("button", { name: /외부 연동\(Jira·Slack\)/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /준비율 요약 Slack 알림 발송/ }).click();
  await sleep(400);
  await shot(page, "v3_09_integrations.png");

  // 10 — 심사관 협업 포털: 심사관 역할로 증적 요청 생성 (#5)
  await page.selectOption("#role-sel", "auditor");
  await sleep(300);
  await page.getByRole("button", { name: /심사관 협업 포털/ }).click();
  await sleep(300);
  await page.fill("#rnote", "MFA 적용 화면 캡처와 IAM 설정 로그 제출 요청");
  await page.getByRole("button", { name: /요청 등록/ }).click();
  await sleep(400);
  // 코멘트 1건 추가
  const cinput = page.locator('input[placeholder="코멘트 입력"]').first();
  if (await cinput.count() > 0) { await cinput.fill("제출 기한은 6/12까지 부탁드립니다"); await page.getByRole("button", { name: "코멘트", exact: true }).first().click(); await sleep(300); }
  await shot(page, "v3_10_auditor_portal.png");

  // 11 — 심사관 승인 → 통제 충족 처리 (#5 워크플로 완결)
  const approve = page.getByRole("button", { name: "승인", exact: true }).first();
  if (await approve.count() > 0) { await approve.click(); await sleep(400); }
  await shot(page, "v3_11_portal_approved.png");

  // 12 — 영문 ISO 심사패키지: 영어 전환 + 패키지 화면 (#7)
  await page.selectOption("#role-sel", "ciso");
  await sleep(200);
  await page.selectOption("#lang-sel", "en");
  await sleep(300);
  await page.getByRole("button", { name: /심사패키지\(다국어\)|Audit/ }).click();
  await sleep(300);
  // 영문 PDF 생성 트리거
  await page.getByRole("button", { name: /English ISO Package/ }).click();
  await sleep(800);
  await shot(page, "v3_12_package_en.png");

  // 13 — 국문 패키지 PDF 생성 (다국어 입증)
  await page.selectOption("#lang-sel", "ko");
  await sleep(300);
  await page.getByRole("button", { name: /심사패키지\(다국어\)/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /국문 패키지 PDF 생성/ }).click();
  await sleep(800);
  await shot(page, "v3_13_package_ko.png");

  // 14 — 감사로그·추세
  await page.getByRole("button", { name: /감사로그·추세/ }).click();
  await sleep(300);
  const seedTrend = page.getByRole("button", { name: /데모 추세 시드 생성/ });
  if (await seedTrend.count() > 0) { await seedTrend.click(); await sleep(400); }
  await shot(page, "v3_14_audit_trend.png");

  // 15 — 다중 조직(테넌트) 전환: 클라우드원(CSAP)
  await page.selectOption("#tenant-sel", { index: 1 });
  await sleep(400);
  await page.getByRole("button", { name: /KPI·SLA 대시보드/ }).click();
  await sleep(400);
  await shot(page, "v3_15_tenant_csap.png");

  // 16 — 모바일 반응형 (KPI 대시보드)
  await page.setViewportSize({ width: 414, height: 896 });
  await page.getByRole("button", { name: /KPI·SLA 대시보드/ }).click();
  await sleep(400);
  await shot(page, "v3_16_mobile_kpi.png");

  // 17 — 새로고침 후 상태 지속 (멀티테넌트·모니터링·연동 복원)
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await sleep(700);
  await page.getByRole("button", { name: /외부 연동\(Jira·Slack\)/ }).click();
  await sleep(400);
  await shot(page, "v3_17_persistence_reload.png");

  await browser.close();
  console.log("DOWNLOADS:", dl);
  console.log("DONE");
})();

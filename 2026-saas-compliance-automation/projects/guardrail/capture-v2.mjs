// 가드레일 v2 — 실 구동 캡처 스크립트 (Beta / Series A 데모)
// file:// 로드 → 8기능 시나리오 클릭 → biz/captures/v2/ 에만 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = "file://" + path.join(__dirname, "v2.html");
const OUT = path.resolve(__dirname, "../../biz/captures/v2");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("saved:", name);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text()); });
  const dl = [];
  page.on("download", (d) => dl.push(d.suggestedFilename()));

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(500);

  // 01 — 다중 프레임워크 매핑 (공통통제 매핑표 + 단일입력 데모)
  await page.getByRole("button", { name: /다중 프레임워크 매핑/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /충족 처리/ }).click();
  await sleep(300);
  await shot(page, "v2_01_framework_mapping.png");

  // 02 — 프레임워크 전환 (ISO 27001 활성 → 공통통제 재사용 입증)
  await page.getByRole("button", { name: /ISO 27001/ }).click();
  await sleep(400);
  await shot(page, "v2_02_framework_switch_iso.png");
  // 다시 ISMS-P 로 복귀
  await page.getByRole("button", { name: /ISMS-P · 활성|ISMS-P/ }).first().click();
  await sleep(300);

  // 03 — 통제 체크리스트 + 데모 시드
  await page.getByRole("button", { name: /통제 체크리스트/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /데모 시드/ }).click();
  await sleep(400);
  await shot(page, "v2_03_checklist_seeded.png");

  // 04 — 증적 자동수집 스캔 (AWS + Azure)
  await page.getByRole("button", { name: /증적 자동수집 스캔/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /AWS 스캔 실행/ }).click();
  await sleep(400);
  await page.getByRole("button", { name: /GCP 스캔 실행/ }).click();
  await sleep(400);
  await shot(page, "v2_04_autoscan_results.png");

  // 05 — 증적 관리 (자동수집 + 수동 통합)
  await page.getByRole("button", { name: /증적 관리/ }).click();
  await sleep(300);
  const pngBase64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 320; c.height = 180;
    const x = c.getContext("2d");
    x.fillStyle = "#1e293b"; x.fillRect(0, 0, 320, 180);
    x.fillStyle = "#4f46e5"; x.fillRect(0, 0, 320, 32);
    x.fillStyle = "#ffffff"; x.font = "bold 14px sans-serif";
    x.fillText("접근권한 검토 결과 (수동 증적)", 12, 21);
    x.fillStyle = "#e2e8f0"; x.font = "12px monospace";
    x.fillText("admin    | MFA: ON  | 2026-06-01", 14, 64);
    x.fillText("operator | MFA: ON  | 2026-06-05", 14, 90);
    x.fillStyle = "#22c55e"; x.fillText("검토 완료 / 이상 없음", 14, 124);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.setInputFiles("#file", { name: "접근권한_검토결과.png", mimeType: "image/png", buffer: Buffer.from(pngBase64, "base64") });
  await sleep(400);
  await page.selectOption("#ctrl", { index: 0 });
  await page.fill("#exp", "2026-12-31");
  await page.getByRole("button", { name: /증적 등록/ }).click();
  await sleep(400);
  await shot(page, "v2_05_evidence_combined.png");

  // 06 — 과제 티켓 (일괄 생성 + 담당자 배정 + 진행)
  await page.getByRole("button", { name: /과제 티켓/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /일괄 티켓 생성/ }).click();
  await sleep(400);
  // 첫 티켓 담당자 배정
  const sels = page.locator("select").filter({ hasText: /담당자 미배정/ });
  if (await sels.count() > 0) { await sels.first().selectOption({ index: 1 }); await sleep(300); }
  // 첫 티켓 진행 시작
  const startBtns = page.getByRole("button", { name: /진행 시작/ });
  if (await startBtns.count() > 0) { await startBtns.first().click(); await sleep(300); }
  await shot(page, "v2_06_tickets_board.png");

  // 07 — 정책문서 생성 + 새 버전 (버전관리)
  await page.getByRole("button", { name: /정책문서·버전관리/ }).click();
  await sleep(300);
  await page.fill("#oname", "주식회사 가드레일테크");
  await page.fill("#oresp", "정보보호최고책임자 김보안");
  await page.fill("#odate", "2026-07-01");
  await page.getByRole("button", { name: /조직 변수 저장/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: "생성", exact: true }).first().click();
  await sleep(400);
  await shot(page, "v2_07_policy_generated.png");

  // 08 — 정책 새 버전 + diff
  await page.fill("#oresp", "정보보호최고책임자 박신임");
  await page.getByRole("button", { name: /조직 변수 저장/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /새 버전 생성/ }).first().click();
  await sleep(400);
  // v2 chip 클릭하여 diff 표시
  const v2chip = page.getByRole("button", { name: /^v2 ·/ }).first();
  if (await v2chip.count() > 0) { await v2chip.click(); await sleep(300); }
  await shot(page, "v2_08_policy_version_diff.png");

  // 09 — 심사 대응 패키지 PDF 생성 + CSV + 알림
  await page.getByRole("button", { name: /심사 대응 패키지/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /심사 패키지 PDF 생성/ }).click();
  await sleep(900);
  await page.getByRole("button", { name: /심사관에 패키지 발송/ }).click();
  await sleep(400);
  await shot(page, "v2_09_package_pdf.png");

  // 10 — 감사로그·준비율 추세
  await page.getByRole("button", { name: /감사로그·추세/ }).click();
  await sleep(300);
  const seedTrend = page.getByRole("button", { name: /데모 추세 시드 생성/ });
  if (await seedTrend.count() > 0) { await seedTrend.click(); await sleep(400); }
  await shot(page, "v2_10_audit_trend.png");

  // 11 — 다중 조직(테넌트) 전환
  await page.selectOption("#tenant-sel", { index: 1 });
  await sleep(400);
  await page.getByRole("button", { name: /갭분석 대시보드/ }).click();
  await sleep(400);
  await shot(page, "v2_11_tenant_switch_csap.png");

  // 12 — 역할 권한: 심사관 뷰 (읽기 전용)
  await page.selectOption("#role-sel", "auditor");
  await sleep(300);
  await page.getByRole("button", { name: /통제 체크리스트/ }).click();
  await sleep(400);
  await shot(page, "v2_12_auditor_readonly.png");

  // 13 — 모바일 반응형 (대시보드)
  await page.selectOption("#role-sel", "ciso");
  await sleep(200);
  await page.setViewportSize({ width: 414, height: 896 });
  await page.getByRole("button", { name: /갭분석 대시보드/ }).click();
  await sleep(400);
  await shot(page, "v2_13_mobile_dashboard.png");

  // 14 — 새로고침 후 상태 지속 (멀티테넌트·역할 복원)
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.reload();
  await sleep(700);
  await shot(page, "v2_14_persistence_after_reload.png");

  await browser.close();
  console.log("DOWNLOADS:", dl);
  console.log("DONE");
})();

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT = resolve(__dirname, "../../biz/captures/v3");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") { console.log("PAGE ERR:", m.text()); errors.push(m.text()); } });
  page.on("pageerror", (e) => { console.log("PAGE EXC:", e.message); errors.push(e.message); });

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("aside", { timeout: 30000 });
  await sleep(1300);

  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("captured", name); };

  // 01. 대시보드 (서울, 청구담당)
  await shot("v3_01_dashboard_seoul");

  // 02. 기관 관리 — 3개 테넌트 격리
  await page.click("aside >> text=기관 관리");
  await sleep(600);
  await shot("v3_02_tenant_admin_3");

  // 03. 신규 청구 워크플로 step1 (대구 테넌트 — DTx 대상)
  await page.selectOption("aside select", "T-DAEGU");
  await sleep(500);
  await page.click("aside >> text=신규 청구·DTx");
  await sleep(500);
  await page.fill('input[placeholder="예: 비기질성 불면증(F51.0)"]', "비기질성 불면증(F51.0)");
  await page.fill("textarea", "재진 진찰, 물리치료, DTx 불면증 인지치료앱 처방");
  await sleep(300);
  await shot("v3_03_workflow_input_dtx");

  // 04. 자동매핑 + 반려예측 사전검증
  await page.click("button:has-text('자동매핑·반려예측 →')");
  await sleep(700);
  await shot("v3_04_automap_denial_predict");

  // 05. DTx 추가 후 (만성통증 DTx 추가하여 DTx 라벨 강조 + 예측 갱신)
  // 여기서는 불면증 DTx가 이미 매핑됨; 만성통증 DTx도 추가
  const dtxBtn = page.locator("button:has-text('+ 만성통증 DTx')");
  if (await dtxBtn.count() > 0) { await dtxBtn.click(); await sleep(600); }
  await shot("v3_05_dtx_added_predict");

  // 06. 청구서 미리보기 (대구 violet 양식 + DTx)
  await page.click("button:has-text('다음: 청구서 →')");
  await sleep(600);
  await shot("v3_06_claim_preview_dtx");

  // 07. 제출 화면 (채널/엔드포인트)
  await page.click("button:has-text('다음: 제출 →')");
  await sleep(500);
  await shot("v3_07_submit_channel");

  // 제출 -> 청구 목록
  await page.click("button:has-text('제출 →')");
  await sleep(800);
  await shot("v3_08_claim_list_predicted");

  // 09. 심사·반려예측 콘솔
  await page.click("aside >> text=심사·반려예측");
  await sleep(600);
  await shot("v3_09_review_denial_console");

  // 심사 실행 (대기건 처리)
  let adj = page.locator("button:has-text('심사 실행')");
  if (await adj.count() > 0) { await adj.first().click(); await sleep(700); }
  if (await page.locator("button:has-text('심사 실행')").count() > 0) { await page.locator("button:has-text('심사 실행')").first().click(); await sleep(700); }
  await shot("v3_10_review_adjudicated");

  // 11. 정산·미수금·펌뱅킹 (서울 테넌트 — 지급완료 1건 + 접수 미수금 1건으로 aging 표시)
  await page.selectOption("aside select", "T-SEOUL");
  await sleep(400);
  await page.click("aside >> text=정산·미수금·펌뱅킹");
  await sleep(600);
  await shot("v3_11_settlement_aging");

  // 펌뱅킹 이체파일 생성
  const [dl] = await Promise.all([
    page.waitForEvent("download").catch(() => null),
    page.click("text=펌뱅킹 이체파일 생성·다운로드"),
  ]);
  await sleep(700);
  await shot("v3_12_firmbanking_file");

  // 13. 수가 고시 관리 — diff
  await page.click("aside >> text=수가 고시 관리");
  await sleep(600);
  await shot("v3_13_codebook_diff");

  // 고시 2024 적용 (버전 전환)
  const applyBtn = page.locator("button:has-text('이 고시 적용')").first();
  if (await applyBtn.count() > 0) { await applyBtn.click(); await sleep(700); }
  await shot("v3_14_codebook_version_applied");

  // 다시 2026 고시로 복귀 (이후 KPI 정합)
  const back2026 = page.locator("button:has-text('이 고시 적용')").first();
  if (await back2026.count() > 0) { await back2026.click(); await sleep(500); }

  // 15. 다기관 통합 정산 (본부관리자 역할)
  await page.click("aside >> text=본부관리자");
  await sleep(700);
  await page.click("aside >> text=다기관 통합 정산");
  await sleep(700);
  await shot("v3_15_group_settlement");

  // 16. 감사로그·KPI
  await page.click("aside >> text=감사로그·KPI");
  await sleep(700);
  await shot("v3_16_audit_kpi");

  // 17. 청구 목록 상세 모달 + 연동 로그 (청구담당 복귀)
  await page.click("aside >> text=청구담당");
  await sleep(500);
  await page.selectOption("aside select", "T-DAEGU");
  await sleep(400);
  await page.click("aside >> text=청구 목록");
  await sleep(500);
  const detailBtns = await page.locator("text=상세").all();
  if (detailBtns.length) { await detailBtns[detailBtns.length - 1].click(); await sleep(700); await shot("v3_17_claim_detail_log");
    const close = page.locator(".fixed button", { hasText: "×" }).first();
    if (await close.count() > 0) { await close.click(); await sleep(400); } }

  // 18. RBAC — 의료진 (제한 메뉴)
  await page.click("aside >> text=의료진");
  await sleep(700);
  await shot("v3_18_rbac_doctor");

  // 부산 테넌트로 (정해린 실손) → 환자 앱
  await page.click("aside >> text=청구담당");
  await sleep(400);
  await page.selectOption("aside select", "T-BUSAN");
  await sleep(400);

  // 19~21. 환자 앱 (모바일)
  await page.click("aside >> text=환자");
  await sleep(800);
  await page.setViewportSize({ width: 414, height: 900 });
  await sleep(700);
  await shot("v3_19_patient_app_mobile");

  // 실손 청구하기
  const rmb = page.locator("button:has-text('실손보험 청구하기')").first();
  if (await rmb.count() > 0) { await rmb.click(); await sleep(700); }
  await shot("v3_20_patient_reimburse_filed");

  // 환자앱 동의/서명 (대구 박지훈은 동의완료 → 다른 미동의 환자가 없으면 서울 이서연으로 동의 시연)
  await page.setViewportSize({ width: 1440, height: 980 });
  await sleep(400);
  await page.click("text=관리자 모드");
  await sleep(500);
  await page.selectOption("aside select", "T-SEOUL");
  await sleep(400);
  await page.click("aside >> text=환자");
  await sleep(600);
  await page.setViewportSize({ width: 414, height: 900 });
  await sleep(600);
  // 이서연(P-0002) 선택 - 동의 필요
  await page.selectOption("select", "P-0002").catch(() => {});
  await sleep(500);
  const consentBtn = page.locator("button:has-text('동의하기')").first();
  if (await consentBtn.count() > 0) {
    await consentBtn.click();
    await sleep(500);
    const cv = page.locator("canvas.sig-canvas");
    const box = await cv.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 30, box.y + 70);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 35);
      await page.mouse.move(box.x + 130, box.y + 90);
      await page.mouse.move(box.x + 190, box.y + 45);
      await page.mouse.move(box.x + 250, box.y + 80);
      await page.mouse.up();
    }
    await page.check('input[type="checkbox"]');
    await sleep(400);
    await shot("v3_21_patient_consent_sign_mobile");
    await page.click("text=동의·서명 저장");
    await sleep(700);
    await shot("v3_22_patient_consent_saved_mobile");
  }

  await browser.close();
  console.log("DONE", errors.length ? ("ERRORS:" + errors.length) : "no-errors");
}
main().catch((e) => { console.error(e); process.exit(1); });

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT = resolve(__dirname, "../../biz/captures/v2");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") { console.log("PAGE ERR:", m.text()); errors.push(m.text()); } });
  page.on("pageerror", (e) => { console.log("PAGE EXC:", e.message); errors.push(e.message); });

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("aside", { timeout: 30000 });
  await sleep(1300);

  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("captured", name); };

  // 01. 대시보드 (서울 테넌트, 청구담당)
  await shot("v2_01_dashboard_seoul");

  // 02. 기관 관리 — 멀티테넌트 격리
  await page.click("text=기관 관리");
  await sleep(600);
  await shot("v2_02_tenant_admin");

  // 03. 테넌트 전환 (부산) — 데이터 격리 확인
  await page.selectOption("aside select", "T-BUSAN");
  await sleep(700);
  await page.click("text=청구 대시보드");
  await sleep(600);
  await shot("v2_03_dashboard_busan_isolated");

  // 다시 서울로
  await page.selectOption("aside select", "T-SEOUL");
  await sleep(600);

  // 04. 신규 청구 워크플로 step1 - 처방 입력
  await page.click("text=신규 청구");
  await sleep(500);
  await page.fill('input[placeholder="예: 급성 상기도 감염(J06.9)"]', "급성 기관지염(J20.9)");
  await page.fill("textarea", "재진 진찰, 혈액검사 시행, 흉부 엑스레이 촬영, 심전도 검사, 근육주사 1회, 물리치료, 처방 조제(원외)");
  await sleep(300);
  await shot("v2_04_workflow_input");

  // 05. 자동매핑 + 검증 결과
  await page.click("text=자동매핑 실행");
  await sleep(700);
  await shot("v2_05_automap_validation");

  // 06. 청구서 미리보기 (기관 양식)
  await page.click("text=다음: 청구서");
  await sleep(600);
  await shot("v2_06_claim_preview");

  // 07. EDI 제출 화면
  await page.click("text=다음: 제출");
  await sleep(500);
  await shot("v2_07_edi_submit");

  // 제출 실행 -> 청구 목록
  await page.click("button:has-text('EDI 제출 →')");
  await sleep(800);
  await shot("v2_08_claim_list_submitted");

  // 09. 심사·정산 콘솔
  await page.click("text=심사·정산 콘솔");
  await sleep(600);
  await shot("v2_09_review_console");

  // EDI 심사 실행 (대기 청구 1건 이상)
  const adj = page.locator("button:has-text('EDI 심사 실행')");
  if (await adj.count() > 0) { await adj.first().click(); await sleep(700); }
  if (await page.locator("button:has-text('EDI 심사 실행')").count() > 0) { await page.locator("button:has-text('EDI 심사 실행')").first().click(); await sleep(700); }
  await shot("v2_10_review_adjudicated");

  // 11. 청구 목록 상세 모달 + EDI 로그
  await page.click("text=청구 목록");
  await sleep(600);
  const detailBtns = await page.locator("text=상세").all();
  await detailBtns[detailBtns.length - 1].click();
  await sleep(700);
  await shot("v2_11_claim_detail_edilog");
  await page.locator(".fixed button", { hasText: "×" }).first().click();
  await sleep(400);

  // 12. CSV 내보내기 (다운로드 트리거 — 토스트 확인)
  const [ download ] = await Promise.all([
    page.waitForEvent("download").catch(() => null),
    page.click("text=CSV 내보내기"),
  ]);
  await sleep(600);
  await shot("v2_12_csv_export");

  // 13. 환자 관리 + 동의 모달/전자서명
  await page.click("text=환자 관리");
  await sleep(600);
  await shot("v2_13_patient_list");

  // 동의 받기 (이서연 - 동의 필요)
  const consentBtn = page.locator("text=동의 받기").first();
  if (await consentBtn.count() > 0) {
    await consentBtn.click();
    await sleep(500);
    // 서명 그리기
    const cv = page.locator("canvas.sig-canvas");
    const box = await cv.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 40);
    await page.mouse.move(box.x + 140, box.y + 100);
    await page.mouse.move(box.x + 200, box.y + 50);
    await page.mouse.move(box.x + 260, box.y + 90);
    await page.mouse.move(box.x + 320, box.y + 45);
    await page.mouse.up();
    await page.check('input[type="checkbox"]');
    await sleep(400);
    await shot("v2_14_consent_signature");
    await page.click("text=동의·서명 저장");
    await sleep(700);
    await shot("v2_15_consent_saved");
  }

  // 16. RBAC — 의료진 역할 (제한된 메뉴)
  await page.click("aside >> text=의료진");
  await sleep(700);
  await shot("v2_16_rbac_doctor");

  // 부산 테넌트로 전환 (정해린: 현대해상 실손 + 청구 보유)
  await page.selectOption("aside select", "T-BUSAN");
  await sleep(600);

  // 17~20. 환자 역할 — 모바일 포털 (반응형)
  await page.click("aside >> text=환자");
  await sleep(800);
  // 모바일 뷰포트로 전환
  await page.setViewportSize({ width: 414, height: 896 });
  await sleep(600);
  await shot("v2_17_patient_portal_mobile");

  // 청구 내역 영역 (정해린: 현대해상 실손, 청구 1건)
  await sleep(300);
  await shot("v2_18_patient_portal_claims_mobile");

  // 실손 청구하기
  const rmb = page.locator("button:has-text('실손보험 청구하기')").first();
  if (await rmb.count() > 0) { await rmb.click(); await sleep(700); }
  await shot("v2_19_patient_reimburse_filed");

  // 20. 모바일 동의 화면 (다른 환자 동의 필요 시) — 데스크톱 복귀 후 청구담당 대시보드 최종 집계
  await page.setViewportSize({ width: 1440, height: 960 });
  await sleep(500);
  await page.click("text=관리자 모드");
  await sleep(700);
  await page.click("text=청구 대시보드");
  await sleep(700);
  await shot("v2_20_dashboard_final_aggregate");

  await browser.close();
  console.log("DONE", errors.length ? ("ERRORS:" + errors.length) : "no-errors");
}
main().catch((e) => { console.error(e); process.exit(1); });

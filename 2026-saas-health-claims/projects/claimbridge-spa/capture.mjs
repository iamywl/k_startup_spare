import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "index.html");
const OUT = resolve(__dirname, "../../biz/captures");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERR:", m.text()); });

  // 깨끗한 상태에서 시작
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // CDN(react/tailwind/babel) 로드 + 렌더 대기
  await page.waitForSelector("aside", { timeout: 30000 });
  await sleep(1200);

  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log("captured", name);
  };

  // 1. 대시보드 (시드 데이터)
  await shot("v1_01_dashboard");

  // 2. 워크플로 step1 - 처방 입력
  await page.click("text=신규 청구 워크플로");
  await sleep(400);
  await page.fill('input[placeholder="예: 본태성 고혈압(I10)"]', "급성 상기도 감염(J06.9)");
  await page.fill('textarea', "재진 진찰, 혈액검사 시행, 흉부 엑스레이 촬영, 근육주사 1회, 물리치료, 처방 조제(원외)");
  await sleep(300);
  await shot("v1_02_workflow_step1_prescription");

  // 3. step2 - 환자 등록 (신규)
  await page.click("text=다음: 환자 등록");
  await sleep(400);
  await page.click("text=신규 환자 등록");
  await sleep(200);
  await page.fill('input[placeholder="성명"]', "박지훈");
  await page.fill('input[placeholder="주민번호(마스킹)"]', "880925-1******");
  await page.fill('input[placeholder="연락처"]', "010-7777-8888");
  await sleep(300);
  await shot("v1_03_workflow_step2_patient");

  // 4. step3 - 코드 매핑
  await page.click("text=다음: 코드 매핑");
  await sleep(500);
  await shot("v1_04_workflow_step3_codemapping");

  // 5. step4 - 청구서 미리보기
  await page.click("text=다음: 청구서 생성");
  await sleep(500);
  await shot("v1_05_workflow_step4_preview");

  // 6. step5 - 청구서 생성 + 상태추적
  await page.click("text=청구서 확정·생성");
  await sleep(600);
  await shot("v1_06_workflow_step5_status_created");

  // 7. 상태 전이 (작성→제출→접수)
  await page.click("text=다음 단계로 →");
  await sleep(400);
  await page.click("text=다음 단계로 →");
  await sleep(500);
  await shot("v1_07_status_advanced");

  // 8. 청구 목록 (필터)
  await page.click("text=청구 목록으로");
  await sleep(500);
  await shot("v1_08_claim_list");

  // 9. 청구 상세 모달 (청구서 + QR)
  const rows = await page.locator("text=상세").all();
  await rows[rows.length - 1].click();
  await sleep(600);
  await shot("v1_09_claim_detail_modal");

  // 10. 모달 내 상태 전이 -> 지급완료 (상태 전이 버튼 그룹 내 마지막 '지급완료' 버튼)
  await page.locator(".fixed button", { hasText: "지급완료" }).last().click();
  await sleep(500);
  await shot("v1_10_claim_paid");
  await page.locator(".fixed button", { hasText: "×" }).first().click();
  await sleep(400);

  // 11. 환자 목록
  await page.click("text=환자 목록");
  await sleep(500);
  await shot("v1_11_patient_list");

  // 12. localStorage 지속성 검증 — 새로고침 후 데이터 유지
  await page.reload();
  await page.waitForSelector("aside", { timeout: 30000 });
  await sleep(1000);
  await page.click("text=청구 대시보드");
  await sleep(600);
  await shot("v1_12_persistence_after_reload");

  await browser.close();
  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT = resolve(__dirname, "../../biz/captures/mobile/v2");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch();
  const errors = [];
  // 모바일 뷰포트 (iPhone 12 급)
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") { console.log("PAGE ERR:", m.text()); errors.push(m.text()); } });
  page.on("pageerror", (e) => { console.log("PAGE EXC:", e.message); errors.push(e.message); });

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("aside", { timeout: 30000 });
  await sleep(1300);

  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("captured", name); };

  // 모바일: nav 버튼은 오프캔버스 드로어 안에 있다. 햄버거로 열고 클릭(클릭 시 자동 닫힘).
  const openDrawer = async () => {
    const ham = page.locator("#mobile-hamburger");
    if (await ham.count() > 0 && await ham.isVisible()) { await ham.click(); await sleep(450); }
  };
  const nav = async (label) => {
    await openDrawer();
    await page.click(`aside >> text=${label}`);
    await sleep(650);
  };

  // 01. 대시보드 (서울, 청구담당) — 모바일 홈
  await shot("01_대시보드_서울");

  // 02. 햄버거 드로어 열림 (오프캔버스 사이드바 — 테넌트/역할/메뉴)
  await openDrawer();
  await shot("02_드로어_메뉴");
  // 드로어 백드롭 닫기
  await page.locator(".drawer-backdrop").click({ position: { x: 360, y: 400 } }).catch(() => {});
  await sleep(400);

  // 03. 신규 청구 워크플로 — 처방 입력
  await nav("신규 청구");
  await page.fill('input[placeholder="예: 급성 상기도 감염(J06.9)"]', "급성 기관지염(J20.9)");
  await page.fill("textarea", "재진 진찰, 혈액검사 시행, 흉부 엑스레이 촬영, 근육주사 1회, 물리치료, 처방 조제(원외)");
  await sleep(300);
  await shot("03_신규청구_처방입력");

  // 04. 자동매핑 + 검증 결과
  await page.click("text=자동매핑 실행");
  await sleep(700);
  await shot("04_자동매핑_검증결과");

  // 05. 청구서 미리보기
  await page.click("text=다음: 청구서");
  await sleep(600);
  await shot("05_청구서_미리보기");

  // 06. EDI 제출 화면 → 제출 실행
  await page.click("text=다음: 제출");
  await sleep(500);
  await shot("06_EDI_제출화면");
  await page.click("button:has-text('EDI 제출 →')");
  await sleep(800);

  // 07. 청구 목록 (제출됨) — 카드/테이블 모바일 레이아웃
  await nav("청구 목록");
  await shot("07_청구목록");

  // 08. 청구 상세 모달 + EDI 로그
  const detailBtns = await page.locator("text=상세").all();
  if (detailBtns.length) {
    await detailBtns[detailBtns.length - 1].click();
    await sleep(700);
    await shot("08_청구상세_EDI로그");
    await page.locator(".fixed button", { hasText: "×" }).first().click().catch(() => {});
    await sleep(400);
  }

  // 09. 심사·정산 콘솔
  await nav("심사·정산 콘솔");
  const adj = page.locator("button:has-text('EDI 심사 실행')");
  if (await adj.count() > 0) { await adj.first().click(); await sleep(700); }
  await shot("09_심사정산_콘솔");

  // 10. 환자 관리 → 전자서명 동의 모달
  await nav("환자 관리");
  await shot("10_환자관리_목록");
  const consentBtn = page.locator("text=동의 받기").first();
  if (await consentBtn.count() > 0) {
    await consentBtn.click();
    await sleep(500);
    const cv = page.locator("canvas.sig-canvas");
    const box = await cv.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 30, box.y + 60);
      await page.mouse.down();
      await page.mouse.move(box.x + 70, box.y + 30);
      await page.mouse.move(box.x + 120, box.y + 80);
      await page.mouse.move(box.x + 170, box.y + 40);
      await page.mouse.move(box.x + 220, box.y + 75);
      await page.mouse.up();
    }
    await page.check('input[type="checkbox"]').catch(() => {});
    await sleep(400);
    await shot("11_전자서명_동의모달");
    await page.click("text=동의·서명 저장").catch(() => {});
    await sleep(700);
  }

  // 12. 환자 앱 (모바일 포털) — 역할 전환은 드로어 안 역할버튼
  await openDrawer();
  await page.click("aside >> text=환자");
  await sleep(800);
  await shot("12_환자앱_포털");

  // 13. 실손 청구하기 (환자앱 액션)
  const rmb = page.locator("button:has-text('실손보험 청구하기')").first();
  if (await rmb.count() > 0) { await rmb.click(); await sleep(700); await shot("13_환자앱_실손청구"); }

  await browser.close();
  console.log("DONE", errors.length ? ("ERRORS:" + errors.length) : "no-errors");
}
main().catch((e) => { console.error(e); process.exit(1); });

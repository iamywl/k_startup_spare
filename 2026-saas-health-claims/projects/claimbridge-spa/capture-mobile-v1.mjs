import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "index.html");
const OUT = resolve(__dirname, "../../biz/captures/mobile/v1");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch();
  const errors = [];
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
  await sleep(1200);

  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("captured", name); };

  const openDrawer = async () => {
    const ham = page.locator("#mobile-hamburger");
    if (await ham.count() > 0 && await ham.isVisible()) { await ham.click(); await sleep(450); }
  };
  // 드로어에서 메뉴 클릭 → 클릭 시 자동 닫힘(setDrawerOpen(false))
  const nav = async (label) => {
    await openDrawer();
    await page.click(`aside >> text=${label}`);
    await sleep(650);
  };

  // 04_action.png (구) 자리 보존용 — 기존 3장은 그대로 두고 신규 워크플로 캡처를 추가
  // 01. 청구 대시보드 (모바일 홈)
  await shot("04_대시보드");

  // 02. 햄버거 오프캔버스 드로어 (4개 메뉴 노출)
  await openDrawer();
  await shot("05_드로어_메뉴");
  await page.locator(".drawer-backdrop").click({ position: { x: 360, y: 600 } }).catch(() => {});
  await sleep(350);

  // 03. 신규 청구 워크플로 — 1단계 처방·진료 입력
  await nav("신규 청구 워크플로");
  await page.fill('input[placeholder="예: 본태성 고혈압(I10)"]', "본태성 고혈압(I10)");
  await page.fill("textarea", "재진 진찰, 혈액검사 시행, 흉부 엑스레이 촬영, 근육주사 1회, 처방 조제(원외)");
  await sleep(300);
  await shot("06_워크플로_처방입력");

  // 04. 2단계 환자 등록/선택
  await page.click("button:has-text('다음: 환자 등록 →')");
  await sleep(500);
  await shot("07_워크플로_환자선택");

  // 05. 3단계 청구코드 자동매핑 (수가/급여 구분 표)
  await page.click("button:has-text('다음: 코드 매핑 →')");
  await sleep(500);
  await shot("08_워크플로_코드매핑");

  // 06. 4단계 청구서 미리보기·생성
  await page.click("button:has-text('다음: 청구서 생성 →')");
  await sleep(500);
  await shot("09_워크플로_청구서미리보기");

  // 07. 5단계 청구서 확정·생성 → 상태 추적
  await page.click("button:has-text('청구서 확정·생성 →')");
  await sleep(700);
  await shot("10_워크플로_상태추적");

  // 08. 청구 목록
  await nav("청구 목록");
  await shot("11_청구목록");

  // 09. 청구 상세 (있으면)
  const detailBtns = await page.locator("text=상세").all();
  if (detailBtns.length) {
    await detailBtns[detailBtns.length - 1].click();
    await sleep(600);
    await shot("12_청구상세");
    await page.locator(".fixed button", { hasText: "×" }).first().click().catch(() => {});
    await sleep(350);
  }

  // 10. 환자 목록
  await nav("환자 목록");
  await shot("13_환자목록");

  await browser.close();
  console.log("DONE", errors.length ? ("ERRORS:" + errors.length) : "no-errors");
}
main().catch((e) => { console.error(e); process.exit(1); });

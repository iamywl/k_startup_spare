// 트레이드릴레이 v1 실 구동 캡처 — file:// index.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v1/ , 모바일 → biz/captures/mobile/v1/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "index.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v1");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v1");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", `${dir.split("/").slice(-2).join("/")}/${name}`));

const go = async (page, v) => { await page.evaluate((view) => window.setView(view), v); await wait(page, 450); };

// 캡처할 뷰 시나리오
const VIEWS = [
  ["dashboard", "01_대시보드"],
  ["items", "02_품목HS코드"],
  ["origin", "03_FTA원산지"],
  ["docs", "04_수출신고서"],
  ["refund", "05_관세환급"],
  ["data", "06_데이터설정"],
];

async function runViewport(browser, opts, outDir, prefix, isMobile) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(APP);
  await wait(page, 1200);

  for (const [v, name] of VIEWS) {
    await go(page, v);
    await shot(page, outDir, name);
  }
  // 워크플로 모달: 수출 건 등록
  await go(page, "items");
  await page.evaluate(() => window.openNewItem && window.openNewItem());
  await wait(page, 500);
  await shot(page, outDir, "07_수출건등록모달");
  await page.keyboard.press("Escape").catch(() => {});

  // 모바일 전용: 더보기 드로어
  if (isMobile) {
    await go(page, "dashboard");
    await page.evaluate(() => window.openDrawer && window.openDrawer());
    await wait(page, 450);
    await shot(page, outDir, "08_더보기드로어");
  }

  console.log(`${prefix} 콘솔에러:`, errs.length, errs.slice(0, 3).join(" | "));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  await runViewport(browser, { viewport: { width: 1280, height: 900 } }, OUT_PC, "PC", false);
  await runViewport(
    browser,
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    OUT_M, "모바일", true
  );
  await browser.close();
})();

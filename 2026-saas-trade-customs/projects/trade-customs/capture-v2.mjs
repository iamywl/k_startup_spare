// 트레이드릴레이 v2 실 구동 캡처 — file:// v2.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v2/ , 모바일 → biz/captures/mobile/v2/
// 워크스페이스 루트 node_modules 심링크로 playwright 해석.
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v2");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v2");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false })
    .then(() => console.log("saved", `${dir.split("/").slice(-2).join("/")}/${name}`));

const role = async (page, r) => { await page.evaluate((x) => window.setRole(x), r); await wait(page, 400); };
const go = async (page, v) => { await page.evaluate((view) => window.setView(view), v); await wait(page, 450); };

async function runViewport(browser, opts, outDir, prefix, isMobile) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  // 깨끗한 시드 — 각 뷰포트 독립
  await page.addInitScript(() => localStorage.removeItem("traderelay-v2"));
  await page.goto(APP);
  await wait(page, 1200);

  // 관세사 역할(전체 테넌트) — 대시보드
  await role(page, "broker");
  await go(page, "dashboard");
  await shot(page, outDir, "01_관세사_대시보드");

  // 관리 수출기업 멀티테넌트 포트폴리오
  await go(page, "clients");
  await shot(page, outDir, "02_관리수출기업_멀티테넌트");

  // 품목·HS — 가중 점수 분류 모달
  await go(page, "items");
  await page.evaluate(() => window.runClassify("e4"));
  await wait(page, 500);
  await shot(page, outDir, "03_HS분류_가중점수");
  await page.evaluate(() => window.closeModal && window.closeModal());
  await wait(page, 250);

  // FTA 원산지·다협정 최적화 비교
  await go(page, "origin");
  await shot(page, outDir, "04_FTA다협정최적화");

  // 원산지 RVC 정량 판정 모달
  await page.evaluate(() => window.openOrigin("e5"));
  await wait(page, 500);
  await shot(page, outDir, "05_원산지_RVC정량판정");
  await page.evaluate(() => window.closeModal && window.closeModal());
  await wait(page, 250);

  // 수출신고서 + 착지원가 시뮬 모달
  await go(page, "docs");
  await page.evaluate(() => window.openLanded("e3"));
  await wait(page, 500);
  await shot(page, outDir, "06_관세물류비_착지원가시뮬");
  await page.evaluate(() => window.closeModal && window.closeModal());
  await wait(page, 250);

  // UNI-PASS 전자신고 — 전송 후 로그
  await go(page, "filing");
  await page.evaluate(() => window.doUnipass && window.doUnipass("e3"));
  await wait(page, 500);
  await go(page, "filing");
  await shot(page, outDir, "07_UNIPASS_전자신고로그");

  // 관세 환급 — 정밀 산정 + 접수
  await go(page, "refund");
  await shot(page, outDir, "08_관세환급_정밀산정");

  // 연동 로그·설정 (통합 감사추적)
  await go(page, "data");
  await shot(page, outDir, "09_외부연동로그_감사추적");

  // 포워더 역할 — 권한 분리된 선적 뷰
  await role(page, "forwarder");
  await go(page, "forward");
  await page.evaluate(() => window.doForward && window.doForward("e3"));
  await wait(page, 500);
  await go(page, "forward");
  await shot(page, outDir, "10_포워더_선적부킹");

  // 수출기업 역할 — 자사 데이터만(RBAC)
  await role(page, "exporter");
  await go(page, "dashboard");
  await shot(page, outDir, "11_수출기업_RBAC대시보드");

  // 모바일 전용: 더보기 드로어(역할·테넌트 전환)
  if (isMobile) {
    await role(page, "broker");
    await go(page, "dashboard");
    await page.evaluate(() => window.openDrawer && window.openDrawer());
    await wait(page, 450);
    await shot(page, outDir, "12_더보기드로어_역할테넌트");
  } else {
    // PC: 새 수출 건 등록 모달(테넌트 선택)
    await role(page, "broker");
    await go(page, "items");
    await page.evaluate(() => window.openNewItem && window.openNewItem());
    await wait(page, 450);
    await shot(page, outDir, "12_수출건등록_테넌트선택");
    await page.evaluate(() => window.closeModal && window.closeModal());
  }

  console.log(`${prefix} 콘솔에러:`, errs.length, errs.slice(0, 3).join(" | "));
  await ctx.close();
  return errs.length;
}

(async () => {
  const browser = await chromium.launch();
  const e1 = await runViewport(browser, { viewport: { width: 1280, height: 900 } }, OUT_PC, "PC", false);
  const e2 = await runViewport(
    browser,
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    OUT_M, "모바일", true
  );
  await browser.close();
  console.log("총 콘솔에러 PC/모바일:", e1, e2);
})();

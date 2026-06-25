// 트레이드릴레이 v3 실 구동 캡처 — file:// v3.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v3/ , 모바일 → biz/captures/mobile/v3/
// 워크스페이스 루트 node_modules 심링크로 playwright 해석.
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v3");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v3");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false })
    .then(() => console.log("saved", `${dir.split("/").slice(-2).join("/")}/${name}`));

const role = async (page, r) => { await page.evaluate((x) => window.setRole(x), r); await wait(page, 400); };
const lang = async (page, l) => { await page.evaluate((x) => window.setLang(x), l); await wait(page, 350); };
const go = async (page, v) => { await page.evaluate((view) => window.setView(view), v); await wait(page, 450); };

async function runViewport(browser, opts, outDir, prefix, isMobile) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.addInitScript(() => localStorage.removeItem("traderelay-v3"));
  await page.goto(APP);
  await wait(page, 1200);

  // 01 관세사 대시보드 (KO)
  await role(page, "broker"); await lang(page, "ko"); await go(page, "dashboard");
  await shot(page, outDir, "01_관세사_대시보드_KO");

  // 02 관리 수출기업 멀티테넌트
  await go(page, "clients");
  await shot(page, outDir, "02_관리수출기업_멀티테넌트");

  // 03 HS 가중 점수 분류
  await go(page, "items");
  await page.evaluate(() => window.runClassify("e4")); await wait(page, 500);
  await shot(page, outDir, "03_HS분류_가중점수");
  await page.evaluate(() => window.closeModal && window.closeModal()); await wait(page, 250);

  // 04 FTA 다협정 최적화
  await go(page, "origin");
  await shot(page, outDir, "04_FTA다협정최적화");

  // 05 관세율 변동 시나리오 (신규)
  await go(page, "scenario");
  await shot(page, outDir, "05_관세율변동시나리오");

  // 06 다국가 공급망 원산지 누적 (신규)
  await go(page, "supply");
  await shot(page, outDir, "06_공급망원산지누적_rollup");

  // 07 수출 채산성 최적화 (신규)
  await go(page, "profit");
  await shot(page, outDir, "07_수출채산성_최적협정국가");

  // 08 FTA 사후검증 리스크 (신규)
  await go(page, "postaudit");
  await shot(page, outDir, "08_FTA사후검증_리스크스코어");

  // 09 무역금융 L/C — 은행 역할 (신규 연동/역할)
  await role(page, "bank");
  await go(page, "trade_fin");
  await page.evaluate(() => { const i=window; }); // ensure
  await page.evaluate(() => window.doLC && window.doLC("e3")); await wait(page, 450);
  await go(page, "trade_fin"); await wait(page, 300);
  await page.evaluate(() => window.doNego && window.doNego("e3")); await wait(page, 450);
  await go(page, "trade_fin");
  await shot(page, outDir, "09_무역금융_LC_네고");

  // 10 해외 바이어 포털 — 바이어 역할 (자동 EN 전환)
  await role(page, "buyer");
  await go(page, "buyer");
  await shot(page, outDir, "10_해외바이어포털_EN");

  // 11 바이어 주문·서류 조회 모달
  await page.evaluate(() => window.buyerView && window.buyerView("e1")); await wait(page, 500);
  await shot(page, outDir, "11_바이어_주문서류조회_EN");
  await page.evaluate(() => window.closeModal && window.closeModal()); await wait(page, 250);

  // 12 영문 대시보드 (EN i18n) — 관세사 EN
  await role(page, "broker"); await lang(page, "en"); await go(page, "dashboard");
  await shot(page, outDir, "12_대시보드_EN_i18n");

  // 13 영문 채산성 최적화 (EN)
  await go(page, "profit");
  await shot(page, outDir, "13_채산성_EN");
  await lang(page, "ko");

  // 14 통합 외부연동 로그 (7채널 — 무역금융·선사EDI 포함)
  await role(page, "broker"); await go(page, "data");
  await shot(page, outDir, "14_외부연동로그_7채널");

  // 15 포워더 선적 + 선사 EDI — 포워더 역할
  await role(page, "forwarder"); await go(page, "forward");
  await page.evaluate(() => window.doForward && window.doForward("e3")); await wait(page, 500);
  await go(page, "forward");
  await shot(page, outDir, "15_포워더_선적_선사EDI");

  // 16 수출기업 역할 RBAC 대시보드
  await role(page, "exporter"); await lang(page, "ko"); await go(page, "dashboard");
  await shot(page, outDir, "16_수출기업_RBAC대시보드");

  // 17 모바일/PC 분기: 모바일=더보기 드로어(언어·역할·테넌트), PC=원산지 RVC 모달
  if (isMobile) {
    await role(page, "broker"); await go(page, "dashboard");
    await page.evaluate(() => window.openDrawer && window.openDrawer()); await wait(page, 450);
    await shot(page, outDir, "17_더보기드로어_언어역할테넌트");
  } else {
    await role(page, "broker"); await go(page, "supply");
    await page.evaluate(() => window.openComponent && window.openComponent("e1")); await wait(page, 450);
    await shot(page, outDir, "17_공급망_부품추가모달");
    await page.evaluate(() => window.closeModal && window.closeModal());
  }

  console.log(`${prefix} 콘솔에러:`, errs.length, errs.slice(0, 4).join(" | "));
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

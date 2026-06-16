// 발주메이트 v3 실 구동 캡처 — file:// v3.html → PC(1280x800) + 모바일(390x844)
// PC → biz/captures/v3/ , 모바일 → biz/captures/mobile/v3/
// v3 신규: Holt-Winters 예측 · 예산제약 발주최적화(LP) · 폐기/마진 분석 · 본사 통합정산
//          · 공급사 평가/추천 · 외부연동(POS/OAuth/오픈뱅킹 webhook/전자세금계산서/CSV) · KO/EN
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v3");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v3");
const KEY = "balju-mate-v3";

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function navTo(page, view, isMobile) {
  if (!isMobile) {
    await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
  } else {
    const bn = await page.$(`#bottomnav button[data-view="${view}"]`);
    if (bn) { await bn.click({ force: true }); }
    else {
      await page.click("#hamb"); await page.waitForTimeout(450);
      await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(420);
  const ok = await page.evaluate(v => document.querySelector(".view.active")?.id === "view-" + v, view);
  if (!ok) { await page.evaluate(v => go(v), view); await page.waitForTimeout(420); }
}

async function setRole(page, role) {
  await page.selectOption("#roleSel", role);
  await page.waitForTimeout(650);
}

async function drive(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.goto(APP);
  await page.waitForTimeout(1100);

  const top = () => page.evaluate(() => window.scrollTo(0, 0));
  const bottom = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // ── 점주(owner) ──
  // 1) 대시보드 (Holt-Winters 차트)
  await shot(page, dir, "01-dashboard");
  if (isMobile) {
    await page.click("#hamb"); await page.waitForTimeout(400);
    await shot(page, dir, "02-drawer");
    await page.evaluate(() => document.body.classList.remove("drawer-open"));
    await page.waitForTimeout(350);
  }

  // 2) 재고 현황
  await navTo(page, "inventory", isMobile);
  await shot(page, dir, isMobile ? "03-inventory" : "02-inventory");

  // 3) 수요예측 (Holt-Winters)
  await navTo(page, "forecast", isMobile);
  await top(); await page.waitForTimeout(150);
  await page.click("#runForecast", { force: true });
  await page.waitForTimeout(750);
  await shot(page, dir, isMobile ? "04-forecast-hw" : "03-forecast-hw");
  await bottom(); await page.waitForTimeout(450);
  await shot(page, dir, isMobile ? "05-suggest" : "04-suggest");

  // 4) 예산제약 발주최적화 (LP)
  await navTo(page, "optimize", isMobile);
  await top(); await page.waitForTimeout(200);
  await page.click("#runOpt", { force: true });
  await page.waitForTimeout(600);
  await shot(page, dir, isMobile ? "06-optimize" : "05-optimize");

  // 5) ABC·EOQ 분석
  await navTo(page, "abc", isMobile);
  await page.waitForTimeout(550);
  await shot(page, dir, isMobile ? "07-abc" : "06-abc");
  await bottom(); await page.waitForTimeout(400);
  await shot(page, dir, isMobile ? "08-abc-eoq" : "07-abc-eoq");

  // 6) 폐기·마진 분석
  await navTo(page, "waste", isMobile);
  await page.waitForTimeout(550);
  await shot(page, dir, isMobile ? "09-waste" : "08-waste");

  // 7) 발주서 초안 → 발주/발송(알림톡 mock)
  await navTo(page, "forecast", isMobile);
  await top(); await page.waitForTimeout(150);
  const hasDraft = await page.$("#createDraft:not([disabled])");
  if (!hasDraft) { await page.click("#runForecast", { force: true }); await page.waitForTimeout(650); }
  await page.click("#createDraft", { force: true });
  await page.waitForTimeout(600);
  await shot(page, dir, isMobile ? "10-draft" : "09-draft");
  for (let i = 0; i < 4; i++) {
    const sb = await page.$('#draftBody [data-send="0"]');
    if (!sb) break;
    await sb.scrollIntoViewIfNeeded(); await sb.click({ force: true }); await page.waitForTimeout(600);
  }
  await bottom(); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "11-sent-log" : "10-sent-log");

  // 8) 입고·검수 — 검수 모달(부분/이슈) + 정상 입고
  await navTo(page, "receive", isMobile);
  await top(); await page.waitForTimeout(300);
  const insp = await page.$("#pendingRows [data-insp]");
  if (insp) {
    await insp.click({ force: true }); await page.waitForTimeout(450);
    await shot(page, dir, isMobile ? "12-inspect-modal" : "11-inspect-modal");
    await page.evaluate(() => {
      document.querySelector("#inspRatio").value = "85";
      document.querySelector("#inspQuality").value = "minor";
      document.querySelector("#inspConfirm").click();
    });
    await page.waitForTimeout(500);
  }
  for (let i = 0; i < 5; i++) {
    const b = await page.$("#pendingRows [data-recv]");
    if (!b) break;
    await b.scrollIntoViewIfNeeded(); await b.click({ force: true }); await page.waitForTimeout(350);
  }
  await top(); await page.waitForTimeout(250);
  await shot(page, dir, isMobile ? "13-received" : "12-received");

  // 9) 정산
  await navTo(page, "settle", isMobile);
  await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "14-settle" : "13-settle");

  // 10) 공급사 평가·추천 (Scorecard + 대안 추천)
  await navTo(page, "suppliers", isMobile);
  await page.waitForTimeout(400);
  await page.click("#recalcScore", { force: true });
  await page.waitForTimeout(450);
  await shot(page, dir, isMobile ? "15-supplier-score" : "14-supplier-score");
  await bottom(); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "16-supplier-reco" : "15-supplier-reco");

  // 11) 외부 연동 허브 — POS·OAuth·오픈뱅킹 webhook·세금계산서·CSV
  await navTo(page, "integrations", isMobile);
  await top(); await page.waitForTimeout(300);
  await page.click("#posImport", { force: true }); await page.waitForTimeout(450);
  await page.click("#oauthKakao", { force: true }); await page.waitForTimeout(400);
  await page.click("#bankWebhook", { force: true }); await page.waitForTimeout(450);
  await page.click("#taxIssue", { force: true }); await page.waitForTimeout(400);
  await page.click("#csvImport", { force: true }); await page.waitForTimeout(450);
  await page.evaluate(() => { if (document.querySelector(".view.active")?.id !== "view-integrations") go("integrations"); });
  await top(); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "17-integrations" : "16-integrations");
  await bottom(); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "18-integration-log" : "17-integration-log");

  // 12) 알림 센터
  await navTo(page, "notif", isMobile);
  await page.click("#genAlerts", { force: true }); await page.waitForTimeout(500);
  await top(); await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "19-notif" : "18-notif");

  // ── 본사(hq) ── 다점포 현황
  await setRole(page, "hq");
  await navTo(page, "portfolio", isMobile);
  await page.waitForTimeout(700);
  await shot(page, dir, isMobile ? "20-hq-portfolio" : "19-hq-portfolio");

  // 본사 통합정산 (공급사×매장 롤업 + 세금계산서/오픈뱅킹 mock)
  await navTo(page, "consolidate", isMobile);
  await page.waitForTimeout(600);
  await shot(page, dir, isMobile ? "21-hq-consolidate" : "20-hq-consolidate");
  await page.click("#csTax", { force: true }); await page.waitForTimeout(400);
  await page.click("#csBank", { force: true }); await page.waitForTimeout(400);
  await bottom(); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "22-hq-consolidate-tax" : "21-hq-consolidate-tax");

  // ── 공급사(supplier) ── 수주 관리
  await setRole(page, "supplier");
  await navTo(page, "supplierPortal", isMobile);
  await page.waitForTimeout(550);
  await shot(page, dir, isMobile ? "23-supplier-portal" : "22-supplier-portal");

  // ── EN 토글 (점주 대시보드) ──
  await setRole(page, "owner");
  if (isMobile) { await page.click("#hamb"); await page.waitForTimeout(420); }
  await page.click('.sidebar .lang-btn[data-lang="en"]', { force: true });
  await page.waitForTimeout(450);
  if (isMobile) { await page.evaluate(() => document.body.classList.remove("drawer-open")); await page.waitForTimeout(300); }
  await navTo(page, "dashboard", isMobile);
  await top(); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "24-en-dashboard" : "23-en-dashboard");
  if (isMobile) { await page.click("#hamb"); await page.waitForTimeout(420); }
  await page.click('.sidebar .lang-btn[data-lang="ko"]', { force: true });
  await page.waitForTimeout(300);
  if (isMobile) { await page.evaluate(() => document.body.classList.remove("drawer-open")); await page.waitForTimeout(300); }

  // 13) 상태 지속성: 새로고침 후 점주 대시보드 유지
  await page.evaluate((k) => {
    const g = JSON.parse(localStorage.getItem(k));
    g.role = "owner"; g.store = "st1"; localStorage.setItem(k, JSON.stringify(g));
  }, KEY);
  await page.goto(APP);
  await page.waitForTimeout(1100);
  await shot(page, dir, isMobile ? "25-persist" : "24-persist");
}

const run = async () => {
  const browser = await chromium.launch();

  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pcPage = await pc.newPage();
  await drive(pcPage, OUT_PC, false);
  await pc.close();

  const m = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const mPage = await m.newPage();
  await drive(mPage, OUT_M, true);
  await m.close();

  await browser.close();
  console.log("done");
};
run().catch((e) => { console.error(e); process.exit(1); });

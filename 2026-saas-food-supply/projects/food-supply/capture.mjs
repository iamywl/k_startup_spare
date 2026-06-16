// 발주메이트 v2 실 구동 캡처 — file:// v2.html → PC(1280x800) + 모바일(390x844)
// PC → biz/captures/v2/ , 모바일 → biz/captures/mobile/v2/
// 다중 역할(점주/본사/공급사) · EWMA 예측 · ABC/EOQ · 발주/검수/정산 · 공급사 평가 · 외부연동
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v2");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v2");

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function navTo(page, view, isMobile) {
  // 데스크톱은 사이드바, 모바일은 (있으면) 바텀탭, 없으면 드로어에서 클릭
  if (!isMobile) {
    await page.click(`.nav-btn[data-view="${view}"]`, { force: true });
  } else {
    const bn = await page.$(`#bottomnav button[data-view="${view}"]`);
    if (bn) { await bn.click({ force: true }); }
    else {
      await page.click("#hamb"); await page.waitForTimeout(450);
      await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(400);
  // 뷰가 실제로 전환됐는지 확인 — 안 됐으면 라우터 직접 호출(폴백)
  const ok = await page.evaluate(v => document.querySelector(".view.active")?.id === "view-" + v, view);
  if (!ok) { await page.evaluate(v => go(v), view); await page.waitForTimeout(400); }
}

async function setRole(page, role) {
  await page.selectOption("#roleSel", role);
  await page.waitForTimeout(600);
}

async function drive(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(1100);

  const top = () => page.evaluate(() => window.scrollTo(0, 0));
  const bottom = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // ── 점주(owner) ──
  // 1) 대시보드(EWMA 차트)
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

  // 3) 수요예측(EWMA) 실행
  await navTo(page, "forecast", isMobile);
  await top(); await page.waitForTimeout(150);
  await page.click("#runForecast", { force: true });
  await page.waitForTimeout(700);
  await shot(page, dir, isMobile ? "04-forecast" : "03-forecast");
  // 제안 카드까지 스크롤
  await bottom(); await page.waitForTimeout(450);
  await shot(page, dir, isMobile ? "05-suggest" : "04-suggest");

  // 4) ABC·EOQ 분석
  await navTo(page, "abc", isMobile);
  await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "06-abc" : "05-abc");
  await bottom(); await page.waitForTimeout(400);
  await shot(page, dir, isMobile ? "07-abc-eoq" : "06-abc-eoq");

  // 5) 발주서 초안 만들기 → 발주 화면 → 알림톡 발송(mock)
  await navTo(page, "forecast", isMobile);
  await top(); await page.waitForTimeout(150);
  // 예측이 비어있으면 다시 실행
  const hasDraft = await page.$("#createDraft:not([disabled])");
  if (!hasDraft) { await page.click("#runForecast", { force: true }); await page.waitForTimeout(600); }
  await page.click("#createDraft", { force: true });
  await page.waitForTimeout(600);
  await shot(page, dir, isMobile ? "08-draft" : "07-draft");
  // 모든 그룹 발송
  for (let i = 0; i < 4; i++) {
    const sb = await page.$('#draftBody [data-send="0"]');
    if (!sb) break;
    await sb.scrollIntoViewIfNeeded(); await sb.click({ force: true }); await page.waitForTimeout(600);
  }
  await bottom(); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "09-sent-log" : "08-sent-log");

  // 6) 입고·검수 — 정상 입고 + 검수 모달(부분/이슈)
  await navTo(page, "receive", isMobile);
  await top(); await page.waitForTimeout(300);
  // 첫 건은 검수 모달 열어 부분입고 기록
  const insp = await page.$("#pendingRows [data-insp]");
  if (insp) {
    await insp.click({ force: true }); await page.waitForTimeout(400);
    await shot(page, dir, isMobile ? "10-inspect-modal" : "09-inspect-modal");
    await page.fill("#inspRatio", "85");
    await page.selectOption("#inspQuality", "minor");
    await page.click("#inspConfirm"); await page.waitForTimeout(500);
  }
  // 나머지는 정상 입고
  for (let i = 0; i < 5; i++) {
    const b = await page.$("#pendingRows [data-recv]");
    if (!b) break;
    await b.scrollIntoViewIfNeeded(); await b.click({ force: true }); await page.waitForTimeout(350);
  }
  await top(); await page.waitForTimeout(250);
  await shot(page, dir, isMobile ? "11-received" : "10-received");

  // 7) 정산
  await navTo(page, "settle", isMobile);
  await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "12-settle" : "11-settle");

  // 8) 공급사 평가
  await navTo(page, "suppliers", isMobile);
  await page.waitForTimeout(400);
  await page.click("#recalcScore", { force: true });
  await page.waitForTimeout(400);
  await bottom(); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "13-supplier-score" : "12-supplier-score");

  // 9) 외부 연동(POS + CSV)
  await navTo(page, "integrations", isMobile);
  await top(); await page.waitForTimeout(300);
  await page.click("#posImport", { force: true }); await page.waitForTimeout(500);
  await page.click("#csvImport", { force: true }); await page.waitForTimeout(500);
  // 뷰 재확인(다운로드 클릭이 헤드리스에서 부작용 없도록 export는 생략)
  await page.evaluate(() => { if (document.querySelector(".view.active")?.id !== "view-integrations") go("integrations"); });
  await top(); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "14-integrations" : "13-integrations");

  // 10) 알림 센터
  await navTo(page, "notif", isMobile);
  await page.click("#genAlerts", { force: true }); await page.waitForTimeout(500);
  await top(); await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "15-notif" : "14-notif");

  // ── 본사(hq) 역할: 다점포 ──
  await setRole(page, "hq");
  await navTo(page, "portfolio", isMobile);
  await page.waitForTimeout(700);
  await shot(page, dir, isMobile ? "16-hq-portfolio" : "15-hq-portfolio");

  // ── 공급사(supplier) 역할: 수주 관리 ──
  await setRole(page, "supplier");
  await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "17-supplier-portal" : "16-supplier-portal");

  // 11) 상태 지속성: 새로고침 후 점주 대시보드 (정산·재고 유지)
  await page.evaluate(() => {
    const g = JSON.parse(localStorage.getItem("balju-mate-v2"));
    g.role = "owner"; g.store = "st1"; localStorage.setItem("balju-mate-v2", JSON.stringify(g));
  });
  await page.goto(APP);
  await page.waitForTimeout(1100);
  await shot(page, dir, isMobile ? "18-persist" : "17-persist");
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

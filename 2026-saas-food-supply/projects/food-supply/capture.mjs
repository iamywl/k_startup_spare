// 발주메이트 v1 실 구동 캡처 — file:// v1.html 로드 → PC(1280x800) + 모바일(390x844)
// PC → biz/captures/v1/ , 모바일 → biz/captures/mobile/v1/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v1.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v1");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v1");

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

// 공통 시나리오: 예측 → 발주 초안 → 발송 → 입고/정산까지 상태 만들기
async function drive(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(1100); // 차트 렌더

  // 1. 대시보드
  await shot(page, dir, "01-dashboard");

  if (isMobile) {
    // 드로어 열기
    await page.click("#hamb");
    await page.waitForTimeout(400);
    await shot(page, dir, "02-drawer");
    // 백드롭의 좌측 일부만 사이드바가 덮으므로 우측 가장자리를 눌러 닫기
    await page.evaluate(() => document.body.classList.remove("drawer-open"));
    await page.waitForTimeout(350);
  }

  const nav = async (view) => {
    const sel = isMobile ? `.bottomnav button[data-view="${view}"]` : `.nav-btn[data-view="${view}"]`;
    await page.click(sel, { force: true });
    await page.waitForTimeout(450);
  };

  // 2. 품목·공급사
  await nav("catalog");
  await shot(page, dir, isMobile ? "03-catalog" : "02-catalog");
  // 소비 기록(재고 차감) 실행 → 상태 변화 (행이 재렌더되므로 매번 첫 행 재조회)
  for (let i = 0; i < 2; i++) {
    const btn = await page.$("#itemRows [data-consume]");
    if (btn) {
      await btn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await btn.click({ force: true });
      await page.waitForTimeout(300);
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "04-catalog-consume" : "03-catalog-consume");

  // 3. 소비예측 실행
  await nav("forecast");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.click("#runForecast", { force: true });
  await page.waitForTimeout(600);
  await shot(page, dir, isMobile ? "05-forecast" : "04-forecast");
  // 스크롤하여 제안 목록 노출
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await shot(page, dir, isMobile ? "06-suggest" : "05-suggest");

  // 발주서 초안 생성
  await page.click("#createDraft", { force: true });
  await page.waitForTimeout(600);
  await shot(page, dir, isMobile ? "07-draft" : "06-draft");

  // 4. 발주 발송(mock) — 첫 그룹
  for (let i = 0; i < 3; i++) {
    const sb = await page.$('#draftBody [data-send="0"]');
    if (!sb) break;
    await sb.scrollIntoViewIfNeeded();
    await sb.click({ force: true });
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "08-sent-log" : "07-sent-log");

  // 5. 입고·정산
  await nav("settle");
  await shot(page, dir, isMobile ? "09-settle-pending" : "08-settle-pending");
  // 입고확정 — 확정 시 행이 사라지고 재렌더되므로 매번 첫 버튼 재조회
  for (let i = 0; i < 6; i++) {
    const b = await page.$("#pendingRows [data-recv]");
    if (!b) break;
    await b.scrollIntoViewIfNeeded();
    await b.click({ force: true }); await page.waitForTimeout(400);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "10-settled" : "09-settled");

  // 6. 상태 지속성: 새로고침 후 대시보드 반영
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.goto(APP);
  await page.waitForTimeout(1100);
  await shot(page, dir, isMobile ? "11-persist" : "10-persist");
}

const run = async () => {
  const browser = await chromium.launch();

  // PC
  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pcPage = await pc.newPage();
  await drive(pcPage, OUT_PC, false);
  await pc.close();

  // 모바일
  const m = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mPage = await m.newPage();
  await drive(mPage, OUT_M, true);
  await m.close();

  await browser.close();
  console.log("done");
};
run().catch((e) => { console.error(e); process.exit(1); });

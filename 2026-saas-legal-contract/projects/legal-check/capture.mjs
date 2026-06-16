// 리걸체크 v1 PoC 실 구동 캡처 — PC(1280x800) + 모바일(390x844)
// file:// v1.html 로드 → 각 뷰/액션 결과 캡처 → biz/captures/v1, biz/captures/mobile/v1
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v1.html");
const PC = resolve(__dirname, "../../biz/captures/v1");
const MOB = resolve(__dirname, "../../biz/captures/mobile/v1");

const wait = (p, ms = 400) => p.waitForTimeout(ms);

async function driveCore(page) {
  // 예시 불러오기 → 분석
  await page.click("#loadSample");
  await wait(page, 300);
  await page.click("#analyzeBtn");
  await wait(page, 900);
}

async function runPC() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 600);

  const shot = (n) => page.screenshot({ path: `${PC}/${n}.png`, fullPage: false });

  // 1. 입력 뷰 (예시 채움)
  await page.click("#loadSample");
  await wait(page, 400);
  await shot("01-input.png");

  // 2. 분석 결과 (하이라이트 + 차트 + 게이지)
  await page.click("#analyzeBtn");
  await wait(page, 1100);
  await shot("02-analysis.png");

  // 3. 본문 하이라이트 스크롤
  await page.evaluate(() => document.querySelector(".main").scrollTo(0, 0));
  await page.evaluate(() => window.scrollTo(0, 520));
  await wait(page, 400);
  await shot("03-highlight.png");

  // 4. 수정 제안 + 전체 채택
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="suggest"]');
  await wait(page, 400);
  await page.click("#adoptAll");
  await wait(page, 400);
  await shot("04-suggest.png");

  // 5. 표준계약서 생성기
  await page.click('.nav-btn[data-view="generate"]');
  await wait(page, 300);
  await page.fill('#tplFields input[data-k="client"]', "○○주식회사");
  await page.fill('#tplFields input[data-k="vendor"]', "△△ 스튜디오");
  await page.fill('#tplFields input[data-k="amount"]', "30,000,000");
  await page.fill('#tplFields input[data-k="period"]', "2026-07-01 ~ 2026-09-30");
  await page.click("#genDocBtn");
  await wait(page, 600);
  await shot("05-generate.png");

  // 6. PDF 발행 (다운로드 검증) — 분석 뷰의 PDF 버튼
  await page.click('.nav-btn[data-view="analysis"]');
  await wait(page, 500);
  const dl = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await page.click('#view-analysis .btn-row button:last-child');
  const d = await dl;
  if (d) console.log("PDF downloaded:", await d.suggestedFilename());
  await wait(page, 500);
  await shot("06-pdf-issued.png");

  // 7. 검토 이력 (지속성)
  await page.click('.nav-btn[data-view="history"]');
  await wait(page, 400);
  await shot("07-history.png");

  // 8. 새로고침 후 이력 유지 (localStorage 지속성)
  await page.goto(APP);
  await wait(page, 700);
  await page.click('.nav-btn[data-view="history"]');
  await wait(page, 500);
  await shot("08-persistence.png");

  await browser.close();
  console.log("PC done");
}

async function runMobile() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 600);

  const shot = (n) => page.screenshot({ path: `${MOB}/${n}.png`, fullPage: false });

  // 1. 입력 홈 (앱바 + 바텀탭)
  await page.click("#loadSample");
  await wait(page, 400);
  await shot("01-input.png");

  // 2. 분석 결과 상단 (KPI 2열 + 차트)
  await page.click("#analyzeBtn");
  await wait(page, 1100);
  await shot("02-analysis-top.png");

  // 3. 분석 결과 스크롤 (게이지 + 하이라이트)
  await page.evaluate(() => window.scrollTo(0, 560));
  await wait(page, 400);
  await shot("03-analysis-scroll.png");

  // 4. 수정 제안 (바텀탭 이동)
  await page.click('.bottomnav button[data-view="suggest"]');
  await wait(page, 400);
  await page.click("#adoptAll");
  await wait(page, 400);
  await shot("04-suggest.png");

  // 5. 표준계약서 생성
  await page.click('.bottomnav button[data-view="generate"]');
  await wait(page, 300);
  await page.fill('#tplFields input[data-k="client"]', "○○주식회사");
  await page.fill('#tplFields input[data-k="vendor"]', "△△ 스튜디오");
  await page.click("#genDocBtn");
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 520));
  await wait(page, 300);
  await shot("05-generate.png");

  // 6. 검토 이력
  await page.click('.bottomnav button[data-view="history"]');
  await wait(page, 400);
  await shot("06-history.png");

  // 7. 분석 본문 하이라이트 더 아래로
  await page.click('.bottomnav button[data-view="analysis"]');
  await wait(page, 400);
  await page.evaluate(() => window.scrollTo(0, 1100));
  await wait(page, 400);
  await shot("07-highlight.png");

  await browser.close();
  console.log("Mobile done");
}

await runPC();
await runMobile();
console.log("ALL done");

// 리걸체크 캡처 — v1(보존) + v2 실 구동 캡처
// v2: file:// v2.html → 9뷰·3역할·diff·협상·서명·관리자 입출력 결과 → biz/captures/v2, biz/captures/mobile/v2
// 실행: PLAYWRIGHT_BROWSERS_PATH=0 node capture.mjs   (또는 글로벌 chromium 사용)
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const PC = resolve(__dirname, "../../biz/captures/v2");
const MOB = resolve(__dirname, "../../biz/captures/mobile/v2");
mkdirSync(PC, { recursive: true });
mkdirSync(MOB, { recursive: true });

const wait = (p, ms = 400) => p.waitForTimeout(ms);

async function fresh(ctx) {
  const page = await ctx.newPage();
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 500);
  return page;
}

async function seedAndAnalyze(page, isMobile) {
  // 데모 케이스 채우기
  await page.click("#seedDemo");
  await wait(page, 500);
  // 새 케이스 분석 (입력 → 분석)
  if (isMobile) await page.click('.bottomnav button[data-view="input"]');
  else await page.click('.nav-btn[data-view="input"]');
  await wait(page, 300);
  await page.click("#loadSample");
  await wait(page, 300);
  await page.click("#analyzeBtn");
  await wait(page, 1000);
}

async function runPC() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await fresh(ctx);
  const shot = (n) => page.screenshot({ path: `${PC}/${n}`, fullPage: false });

  // 1. 케이스 보드 (데모 시드 후)
  await page.click("#seedDemo");
  await wait(page, 600);
  await shot("01-board.png");

  // 새 케이스 분석
  await page.click('.nav-btn[data-view="input"]');
  await wait(page, 300);
  await page.click("#loadSample");
  await wait(page, 300);
  await shot("02-input.png");
  await page.click("#analyzeBtn");
  await wait(page, 1100);

  // 3. 분석 결과 (가중치 모델 + 차트 2종 + 게이지)
  await shot("03-analysis.png");

  // 4. 본문 하이라이트 스크롤
  await page.evaluate(() => window.scrollTo(0, 760));
  await wait(page, 400);
  await shot("04-highlight.png");

  // 5. 표준 대비 diff
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="diff"]');
  await wait(page, 500);
  await shot("05-diff.png");
  await page.evaluate(() => window.scrollTo(0, 560));
  await wait(page, 350);
  await shot("06-diff-scroll.png");

  // 7. 협상 우선순위 (ROI 랭킹 + scatter)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="negotiate"]');
  await wait(page, 500);
  await page.click("#adoptAll");
  await wait(page, 400);
  await shot("07-negotiate.png");
  await page.evaluate(() => window.scrollTo(0, 520));
  await wait(page, 350);
  await shot("08-negotiate-list.png");

  // 9. 협업 코멘트 (검토자 역할로 전환 후 작성)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.role-opt[data-role="reviewer"]');
  await wait(page, 300);
  await page.click('.nav-btn[data-view="collab"]');
  await wait(page, 400);
  await page.fill("#commentText", "손해배상 상한(LoL)이 없습니다. 계약금액 한도로 캡을 거는 협상이 필요합니다.");
  await page.selectOption("#commentClause", { index: 1 }).catch(() => {});
  await page.click("#addComment");
  await wait(page, 500);
  await shot("09-collab-reviewer.png");

  // 10. 검토자 작업 보드 (큐)
  await page.click('.nav-btn[data-view="board"]');
  await wait(page, 500);
  await shot("10-reviewer-board.png");

  // 11. 전자서명 (mock 발송 + 전원 서명)
  await page.click('.role-opt[data-role="client"]');
  await wait(page, 300);
  await page.click('.nav-btn[data-view="sign"]');
  await wait(page, 400);
  await page.click("#sendSign");
  await wait(page, 500);
  await page.click("#signAll");
  await wait(page, 600);
  await shot("11-esign.png");

  // 12. 표준계약서 생성
  await page.click('.nav-btn[data-view="generate"]');
  await wait(page, 300);
  await page.fill('#tplFields input[data-k="client"]', "○○주식회사");
  await page.fill('#tplFields input[data-k="vendor"]', "△△ 스튜디오");
  await page.fill('#tplFields input[data-k="amount"]', "30,000,000");
  await page.fill('#tplFields input[data-k="period"]', "2026-07-01 ~ 2026-09-30");
  await page.click("#genDocBtn");
  await wait(page, 500);
  await shot("12-generate.png");

  // 13. 관리자 리포트 (포트폴리오 차트 + 입출력)
  await page.click('.role-opt[data-role="admin"]');
  await wait(page, 300);
  await page.click('.nav-btn[data-view="admin"]');
  await wait(page, 600);
  await shot("13-admin.png");

  // 14. CSV 내보내기 (다운로드 검증)
  const dl = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await page.click("#exportCsv");
  const d = await dl;
  if (d) console.log("CSV downloaded:", await d.suggestedFilename());
  await wait(page, 400);
  await page.evaluate(() => window.scrollTo(0, 560));
  await wait(page, 300);
  await shot("14-admin-io.png");

  // 15. 검토 이력 + PDF 발행
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.role-opt[data-role="client"]');
  await wait(page, 200);
  await page.click('.nav-btn[data-view="history"]');
  await wait(page, 500);
  const dl2 = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await page.click("#historyBody .pdfRec");
  const d2 = await dl2;
  if (d2) console.log("PDF downloaded:", await d2.suggestedFilename());
  await wait(page, 500);
  await shot("15-history.png");

  // 16. 새로고침 후 지속성
  await page.goto(APP);
  await wait(page, 800);
  await page.click('.nav-btn[data-view="board"]');
  await wait(page, 500);
  await shot("16-persistence.png");

  await browser.close();
  console.log("PC done");
}

async function runMobile() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const page = await fresh(ctx);
  const shot = (n) => page.screenshot({ path: `${MOB}/${n}`, fullPage: false });
  const closeDrawer = () => page.evaluate(() => document.body.classList.remove("drawer-open"));

  // 1. 케이스 보드 (앱바 + 바텀탭)
  await page.click("#seedDemo");
  await wait(page, 600);
  await shot("01-board.png");

  // 2. 햄버거 드로어 열기 (사이드바 재구성 확인)
  await page.click("#hamBtn");
  await wait(page, 450);
  await shot("02-drawer.png");
  await closeDrawer();
  await wait(page, 350);

  // 3. 입력
  await page.click('.bottomnav button[data-view="input"]');
  await wait(page, 300);
  await page.click("#loadSample");
  await wait(page, 300);
  await shot("03-input.png");
  await page.click("#analyzeBtn");
  await wait(page, 1100);

  // 4. 분석 상단 (KPI 2열 + 차트)
  await shot("04-analysis-top.png");
  // 5. 분석 스크롤 (게이지 + 본문)
  await page.evaluate(() => window.scrollTo(0, 720));
  await wait(page, 400);
  await shot("05-analysis-scroll.png");

  // 6. 표준 대비 diff (더보기 시트 → diff)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#moreTab");
  await wait(page, 400);
  await shot("06-more-sheet.png");
  await page.click('.sheet-item[data-view="diff"]');
  await wait(page, 500);
  await shot("07-diff.png");

  // 8. 협상 우선순위
  await page.click('.bottomnav button[data-view="negotiate"]');
  await wait(page, 400);
  await page.click("#adoptAll");
  await wait(page, 400);
  await page.evaluate(() => window.scrollTo(0, 480));
  await wait(page, 350);
  await shot("08-negotiate.png");

  // 9. 협업 코멘트 (검토자)
  await page.click("#hamBtn");
  await wait(page, 400);
  await page.click('.role-opt[data-role="reviewer"]');
  await wait(page, 300);
  await closeDrawer();
  await wait(page, 600);
  await page.click("#moreTab");
  await wait(page, 350);
  await page.click('.sheet-item[data-view="collab"]');
  await wait(page, 400);
  await page.fill("#commentText", "IP 포괄귀속 조항은 반드시 carve-out 협상하세요.");
  await page.click("#addComment");
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 360));
  await wait(page, 300);
  await shot("09-collab.png");

  // 10. 전자서명
  await page.click("#moreTab");
  await wait(page, 350);
  await page.click('.sheet-item[data-view="sign"]');
  await wait(page, 400);
  await page.click("#sendSign");
  await wait(page, 400);
  await page.click("#signAll");
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 300));
  await wait(page, 300);
  await shot("10-esign.png");

  // 11. 관리자 리포트 (관리자 역할)
  await page.click("#hamBtn");
  await wait(page, 400);
  await page.click('.role-opt[data-role="admin"]');
  await wait(page, 300);
  await closeDrawer();
  await wait(page, 600);
  await page.click("#moreTab");
  await wait(page, 350);
  await page.click('.sheet-item[data-view="admin"]');
  await wait(page, 600);
  await shot("11-admin.png");
  await page.evaluate(() => window.scrollTo(0, 620));
  await wait(page, 350);
  await shot("12-admin-io.png");

  // 13. 검토 이력
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#moreTab");
  await wait(page, 350);
  await page.click('.sheet-item[data-view="history"]');
  await wait(page, 500);
  await shot("13-history.png");

  await browser.close();
  console.log("Mobile done");
}

await runPC();
await runMobile();
console.log("ALL done");

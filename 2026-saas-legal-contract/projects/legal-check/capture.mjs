// 리걸체크 캡처 — v1·v2(보존) + v3 실 구동 캡처
// v3: file:// v3.html → 13뷰·3역할·KO/EN·TF-IDF diff·협상 시뮬레이터·OAuth 전자서명·버전관리·감사로그
//     → biz/captures/v3 (PC ≥15) · biz/captures/mobile/v3 (모바일 ≥15)
// 실행: npm i -D playwright && npx playwright install chromium && node capture.mjs
//      캡처 후: rm -rf node_modules package*.json
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const PC = resolve(__dirname, "../../biz/captures/v3");
const MOB = resolve(__dirname, "../../biz/captures/mobile/v3");
mkdirSync(PC, { recursive: true });
mkdirSync(MOB, { recursive: true });

const wait = (p, ms = 400) => p.waitForTimeout(ms);

async function fresh(ctx) {
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push("console:" + m.text()); });
  page._errs = errs;
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 500);
  return page;
}

async function checkOverflow(page, label) {
  const ov = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  if (ov > 0) console.log(`  [WARN] ${label} horizontal overflow = ${ov}px`);
  return ov;
}

async function runPC() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await fresh(ctx);
  const shot = (n) => page.screenshot({ path: `${PC}/${n}`, fullPage: false });

  // 1. 케이스 보드
  await page.click("#seedDemo");
  await wait(page, 650);
  await shot("01-board.png");

  // 2. 계약서 입력
  await page.click('.nav-btn[data-view="input"]');
  await wait(page, 300);
  await page.click("#loadSample");
  await wait(page, 300);
  await shot("02-input.png");
  await page.click("#analyzeBtn");
  await wait(page, 1100);

  // 3. 위험 분석 (가중치 + 캘리브레이션)
  await shot("03-analysis.png");

  // 4. 본문 하이라이트
  await page.evaluate(() => window.scrollTo(0, 780));
  await wait(page, 400);
  await shot("04-highlight.png");

  // 5. 표준 대비 diff (TF-IDF 코사인)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="diff"]');
  await wait(page, 500);
  await shot("05-diff.png");
  await page.evaluate(() => window.scrollTo(0, 600));
  await wait(page, 350);
  await shot("06-diff-scroll.png");

  // 7. 협상 우선순위 (ROI + 법령 근거)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="negotiate"]');
  await wait(page, 500);
  await shot("07-negotiate.png");
  await page.evaluate(() => window.scrollTo(0, 560));
  await wait(page, 350);
  await shot("08-negotiate-law.png");

  // 9. 협상 시뮬레이터 (조건 변경 → 재계산)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="simulate"]');
  await wait(page, 500);
  // 상위 3개 독소조항을 '수정'으로 토글
  await page.$$eval('.sim-toggle button[data-v="1"]', (btns) => { btns.slice(0, 4).forEach((b) => b.click()); });
  await wait(page, 600);
  await shot("09-simulate.png");

  // 10. 표준계약서 생성
  await page.click('.nav-btn[data-view="generate"]');
  await wait(page, 300);
  await page.fill('#tplFields input[data-k="client"]', "○○주식회사");
  await page.fill('#tplFields input[data-k="vendor"]', "△△ 스튜디오");
  await page.fill('#tplFields input[data-k="amount"]', "30,000,000");
  await page.fill('#tplFields input[data-k="period"]', "2026-07-01 ~ 2026-09-30");
  await page.click("#genDocBtn");
  await wait(page, 500);
  await shot("10-generate.png");

  // 11. 협업 코멘트 (검토자, 실시간 알림 로그)
  await page.click('.role-opt[data-role="reviewer"]');
  await wait(page, 300);
  await page.click('.nav-btn[data-view="collab"]');
  await wait(page, 400);
  await page.fill("#commentText", "손해배상 상한(LoL)이 없습니다. 계약금액 한도로 캡을 거는 협상이 필요합니다.");
  await page.selectOption("#commentClause", { index: 1 }).catch(() => {});
  await page.click("#addComment");
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 520));
  await wait(page, 350);
  await shot("11-collab-notif.png");

  // 12. 전자서명 OAuth 연결 + 발송
  await page.click('.role-opt[data-role="client"]');
  await wait(page, 300);
  await page.click('.nav-btn[data-view="sign"]');
  await wait(page, 400);
  await page.click("#oauthBtn");
  await wait(page, 900);
  await page.click("#sendSign");
  await wait(page, 500);
  await page.click("#signAll");
  await wait(page, 600);
  await shot("12-esign-oauth.png");

  // 13. 버전 관리
  await page.click('.nav-btn[data-view="versions"]');
  await wait(page, 400);
  await page.fill("#verNote", "위약금 10%·IP carve-out 반영 협상본");
  await page.click("#snapVer");
  await wait(page, 500);
  await shot("13-versions.png");

  // 14. 관리자 리포트
  await page.click('.role-opt[data-role="admin"]');
  await wait(page, 300);
  await page.click('.nav-btn[data-view="admin"]');
  await wait(page, 600);
  await shot("14-admin.png");

  // 15. CSV 내보내기 (다운로드 검증)
  const dl = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await page.click("#exportCsv");
  const d = await dl;
  if (d) console.log("CSV downloaded:", await d.suggestedFilename());
  await wait(page, 400);
  await page.evaluate(() => window.scrollTo(0, 600));
  await wait(page, 300);
  await shot("15-admin-io.png");

  // 16. 감사 로그
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.nav-btn[data-view="audit"]');
  await wait(page, 500);
  await shot("16-audit.png");

  // 17. 검토 이력 + PDF 발행
  await page.click('.role-opt[data-role="client"]');
  await wait(page, 200);
  await page.click('.nav-btn[data-view="history"]');
  await wait(page, 500);
  const dl2 = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await page.click("#historyBody .pdfRec");
  const d2 = await dl2;
  if (d2) console.log("PDF downloaded:", await d2.suggestedFilename());
  await wait(page, 500);
  await shot("17-history.png");

  // 18. EN 모드 (i18n 토글) — 분석 화면
  await page.click('.lang-opt[data-lang="en"]');
  await wait(page, 500);
  await page.click('.nav-btn[data-view="board"]');
  await wait(page, 400);
  await shot("18-en-board.png");
  await page.click('.nav-btn[data-view="negotiate"]').catch(() => {});
  await wait(page, 500);
  await shot("19-en-negotiate.png");
  await page.click('.lang-opt[data-lang="ko"]');
  await wait(page, 400);

  console.log("PC overflow check:", await checkOverflow(page, "PC"));
  console.log("PC errors:", page._errs.length ? page._errs : "none");
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
  const tapView = async (v) => {
    // 바텀탭에 있으면 바텀탭, 아니면 더보기 시트
    const inBottom = ["board", "analysis", "simulate", "negotiate"].includes(v);
    if (inBottom) { await page.click(`.bottomnav button[data-view="${v}"]`); }
    else { await page.click("#moreTab"); await wait(page, 350); await page.click(`.sheet-item[data-view="${v}"]`); }
    await wait(page, 450);
  };

  // 1. 보드 (앱바 + 바텀탭)
  await page.click("#seedDemo");
  await wait(page, 650);
  await shot("01-board.png");

  // 2. 햄버거 드로어
  await page.click("#hamBtn");
  await wait(page, 450);
  await shot("02-drawer.png");
  await closeDrawer();
  await wait(page, 350);

  // 3. 입력
  await tapView("input");
  await page.click("#loadSample");
  await wait(page, 300);
  await shot("03-input.png");
  await page.click("#analyzeBtn");
  await wait(page, 1100);

  // 4. 분석 상단
  await shot("04-analysis-top.png");
  // 5. 분석 스크롤 (게이지 + 캘리브레이션 + 본문)
  await page.evaluate(() => window.scrollTo(0, 740));
  await wait(page, 400);
  await shot("05-analysis-scroll.png");

  // 6. 더보기 시트
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#moreTab");
  await wait(page, 400);
  await shot("06-more-sheet.png");
  await page.click('.sheet-item[data-view="diff"]');
  await wait(page, 500);
  // 7. diff (상하 스택)
  await shot("07-diff.png");

  // 8. 협상 우선순위 (법령 근거)
  await page.click('.bottomnav button[data-view="negotiate"]');
  await wait(page, 450);
  await page.evaluate(() => window.scrollTo(0, 500));
  await wait(page, 350);
  await shot("08-negotiate.png");

  // 9. 협상 시뮬레이터
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.bottomnav button[data-view="simulate"]');
  await wait(page, 450);
  await page.$$eval('.sim-toggle button[data-v="1"]', (btns) => { btns.slice(0, 3).forEach((b) => b.click()); });
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 420));
  await wait(page, 350);
  await shot("09-simulate.png");

  // 10. 협업 코멘트 (검토자)
  await page.click("#hamBtn");
  await wait(page, 400);
  await page.click('.role-opt[data-role="reviewer"]');
  await wait(page, 300);
  await closeDrawer();
  await wait(page, 500);
  await tapView("collab");
  await page.fill("#commentText", "IP 포괄귀속 조항은 반드시 carve-out 협상하세요.");
  await page.click("#addComment");
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 360));
  await wait(page, 300);
  await shot("10-collab.png");

  // 11. 전자서명 OAuth
  await page.click("#hamBtn");
  await wait(page, 400);
  await page.click('.role-opt[data-role="client"]');
  await wait(page, 300);
  await closeDrawer();
  await wait(page, 500);
  await tapView("sign");
  await page.click("#oauthBtn");
  await wait(page, 900);
  await shot("11-esign-oauth.png");
  await page.click("#sendSign");
  await wait(page, 400);
  await page.click("#signAll");
  await wait(page, 500);
  await page.evaluate(() => window.scrollTo(0, 360));
  await wait(page, 300);
  await shot("12-esign-done.png");

  // 13. 버전 관리
  await tapView("versions");
  await page.fill("#verNote", "위약금 10% 하향 협상본");
  await page.click("#snapVer");
  await wait(page, 500);
  await shot("13-versions.png");

  // 14. 관리자 리포트 (관리자)
  await page.click("#hamBtn");
  await wait(page, 400);
  await page.click('.role-opt[data-role="admin"]');
  await wait(page, 300);
  await closeDrawer();
  await wait(page, 500);
  await tapView("admin");
  await shot("14-admin.png");
  await page.evaluate(() => window.scrollTo(0, 640));
  await wait(page, 350);
  await shot("15-admin-io.png");

  // 16. 감사 로그
  await page.evaluate(() => window.scrollTo(0, 0));
  await tapView("audit");
  await shot("16-audit.png");

  // 17. EN 모드
  await page.click("#mobLang");
  await wait(page, 500);
  await page.click('.bottomnav button[data-view="board"]');
  await wait(page, 400);
  await shot("17-en-board.png");

  console.log("Mobile overflow check:", await checkOverflow(page, "Mobile"));
  console.log("Mobile errors:", page._errs.length ? page._errs : "none");
  await browser.close();
  console.log("Mobile done");
}

await runPC();
await runMobile();
console.log("ALL done");

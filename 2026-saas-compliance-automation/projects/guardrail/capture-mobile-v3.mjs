// 가드레일 v3 — 모바일 실 구동 캡처 (390×844, 햄버거 드로어 내비)
// file:// 로드 → 시드 → 6+ 화면 캡처 → biz/captures/mobile/v3/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = "file://" + path.join(__dirname, "v3.html");
const OUT = path.resolve(__dirname, "../../biz/captures/mobile/v3");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("saved:", name);
}

async function nav(page, re) {
  await page.click("#mobile-hamburger");
  await sleep(350);
  await page.locator("#nav button", { hasText: re }).first().click();
  await sleep(400);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text()); });

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(600);

  // 시드: 체크리스트 + 자동수집 + 정책
  await nav(page, /통제 체크리스트|체크리스트/);
  const seedBtn = page.getByRole("button", { name: /데모 시드/ });
  if (await seedBtn.count() > 0) { await seedBtn.click(); await sleep(400); }

  // ===== 캡처 =====

  // 01 — 햄버거 드로어 (모바일 내비 입증)
  await page.click("#mobile-hamburger");
  await sleep(450);
  await shot(page, "01_드로어_내비.png");
  await page.evaluate(() => document.body.classList.remove("drawer-open"));
  await sleep(300);

  // 02 — KPI·SLA 대시보드
  await nav(page, /KPI·SLA 대시보드/);
  await sleep(400);
  await shot(page, "02_KPI대시보드.png");

  // 03 — 실시간 연속 모니터링 (정기 점검 실행)
  await nav(page, /실시간 연속 모니터링/);
  await page.getByRole("button", { name: /정기 점검 실행/ }).click();
  await sleep(500);
  await shot(page, "03_연속모니터링.png");

  // 04 — drift 시뮬레이션 + 알림
  const driftBtn = page.getByRole("button", { name: /설정 변경 시뮬레이션/ });
  if (await driftBtn.count() > 0) { await driftBtn.click(); await sleep(600); }
  await shot(page, "04_드리프트탐지.png");

  // 05 — 위험 스코어링·우선순위
  await nav(page, /위험 스코어링/);
  await sleep(400);
  await shot(page, "05_위험스코어링.png");

  // 06 — 다중 프레임워크 교차매핑
  await nav(page, /다중 프레임워크 교차매핑/);
  const cm = page.getByRole("button", { name: /충족 처리 \(교차 반영\)/ });
  if (await cm.count() > 0) { await cm.click(); await sleep(400); }
  await shot(page, "06_교차매핑.png");

  // 07 — 정책↔증적 일치성
  await nav(page, /정책↔증적 일치성/);
  await sleep(500);
  await shot(page, "07_일치성검사.png");

  // 08 — 외부 연동(Jira·Slack) 로그
  await nav(page, /외부 연동\(Jira·Slack\)/);
  const slackBtn = page.getByRole("button", { name: /준비율 요약 Slack 알림 발송/ });
  if (await slackBtn.count() > 0) { await slackBtn.click(); await sleep(400); }
  await shot(page, "08_외부연동.png");

  // 09 — 심사관 협업 포털 (심사관 역할)
  await page.selectOption("#role-sel", "auditor");
  await sleep(300);
  await nav(page, /심사관 협업 포털/);
  const rnote = page.locator("#rnote");
  if (await rnote.count() > 0) {
    await rnote.fill("MFA 적용 화면 캡처와 IAM 설정 로그 제출 요청");
    await page.getByRole("button", { name: /요청 등록/ }).click();
    await sleep(400);
  }
  await shot(page, "09_심사관포털.png");

  // 10 — 심사패키지(다국어)
  await page.selectOption("#role-sel", "ciso");
  await sleep(200);
  await nav(page, /심사패키지\(다국어\)/);
  await sleep(400);
  await shot(page, "10_심사패키지.png");

  await browser.close();
  console.log("DONE");
})();

// 가드레일 v2 — 모바일 실 구동 캡처 (390×844, 햄버거 드로어 내비)
// file:// 로드 → 시드 → 6+ 화면 캡처 → biz/captures/mobile/v2/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = "file://" + path.join(__dirname, "v2.html");
const OUT = path.resolve(__dirname, "../../biz/captures/mobile/v2");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("saved:", name);
}

// 모바일: 햄버거 드로어를 열고 nav 항목 클릭 (클릭 시 드로어 자동 닫힘)
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

  // 시드: 체크리스트 데모 시드 + 자동수집 스캔
  await nav(page, /통제 체크리스트/);
  await page.getByRole("button", { name: /데모 시드/ }).click();
  await sleep(400);

  await nav(page, /증적 자동수집 스캔/);
  await page.getByRole("button", { name: /AWS 스캔 실행/ }).click();
  await sleep(400);
  await page.getByRole("button", { name: /GCP 스캔 실행/ }).click();
  await sleep(400);

  // 정책 생성 (대시보드·패키지에 의미 부여)
  await nav(page, /정책문서·버전관리/);
  await page.fill("#oname", "주식회사 가드레일테크");
  await page.fill("#oresp", "정보보호최고책임자 김보안");
  await page.fill("#odate", "2026-07-01");
  await page.getByRole("button", { name: /조직 변수 저장/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: "생성", exact: true }).first().click();
  await sleep(400);

  // ===== 캡처 =====

  // 01 — 햄버거 드로어 열린 상태 (모바일 내비 입증)
  await page.click("#mobile-hamburger");
  await sleep(450);
  await shot(page, "01_드로어_내비.png");
  await page.evaluate(() => document.body.classList.remove("drawer-open"));
  await sleep(300);

  // 02 — 갭분석 대시보드
  await nav(page, /갭분석 대시보드/);
  await sleep(300);
  await shot(page, "02_대시보드.png");

  // 03 — 통제 체크리스트 (시드 반영 상태)
  await nav(page, /통제 체크리스트/);
  await sleep(300);
  await shot(page, "03_체크리스트.png");

  // 04 — 다중 프레임워크 매핑
  await nav(page, /다중 프레임워크 매핑/);
  await sleep(300);
  await shot(page, "04_프레임워크매핑.png");

  // 05 — 증적 자동수집 스캔 결과
  await nav(page, /증적 자동수집 스캔/);
  await sleep(300);
  await shot(page, "05_자동수집스캔.png");

  // 06 — 과제 티켓 (일괄 생성)
  await nav(page, /과제 티켓/);
  await page.getByRole("button", { name: /일괄 티켓 생성/ }).click();
  await sleep(400);
  await shot(page, "06_과제티켓.png");

  // 07 — 정책문서·버전관리
  await nav(page, /정책문서·버전관리/);
  await sleep(300);
  await shot(page, "07_정책문서.png");

  // 08 — 심사 대응 패키지 (PDF 생성)
  await nav(page, /심사 대응 패키지/);
  await page.getByRole("button", { name: /심사 패키지 PDF 생성/ }).click();
  await sleep(900);
  await shot(page, "08_심사패키지.png");

  // 09 — 감사로그·추세
  await nav(page, /감사로그·추세/);
  const seedTrend = page.getByRole("button", { name: /데모 추세 시드 생성/ });
  if (await seedTrend.count() > 0) { await seedTrend.click(); await sleep(400); }
  await shot(page, "09_감사로그추세.png");

  await browser.close();
  console.log("DONE");
})();

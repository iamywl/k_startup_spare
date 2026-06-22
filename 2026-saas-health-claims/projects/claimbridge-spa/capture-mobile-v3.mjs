import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT = resolve(__dirname, "../../biz/captures/mobile/v3");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") { console.log("PAGE ERR:", m.text()); errors.push(m.text()); } });
  page.on("pageerror", (e) => { console.log("PAGE EXC:", e.message); errors.push(e.message); });

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("aside", { timeout: 30000 });
  await sleep(1300);

  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("captured", name); };

  const openDrawer = async () => {
    const ham = page.locator("#mobile-hamburger");
    if (await ham.count() > 0 && await ham.isVisible()) { await ham.click(); await sleep(450); }
  };
  // 드로어 안에서 메뉴 클릭 (클릭 시 자동 닫힘)
  const nav = async (label) => {
    await openDrawer();
    await page.click(`aside >> text=${label}`);
    await sleep(700);
  };
  // 드로어 안에서 테넌트 전환 (드로어 유지)
  const setTenant = async (val) => {
    await openDrawer();
    await page.selectOption("aside select", val);
    await sleep(400);
    // 백드롭으로 드로어 닫기
    await page.locator(".drawer-backdrop").click({ position: { x: 360, y: 420 } }).catch(() => {});
    await sleep(350);
  };
  // 드로어 안에서 역할 전환
  const setRole = async (label) => {
    await openDrawer();
    await page.click(`aside >> text=${label}`);
    await sleep(700);
  };

  // 01. 대시보드 (서울, 청구담당) — 모바일 홈
  await shot("01_대시보드_서울");

  // 02. 햄버거 드로어 (3개 테넌트·역할·확장 메뉴)
  await openDrawer();
  await shot("02_드로어_메뉴");
  await page.locator(".drawer-backdrop").click({ position: { x: 360, y: 420 } }).catch(() => {});
  await sleep(350);

  // 03. 신규 청구·DTx — 처방 입력 (대구 테넌트, DTx 대상)
  await setTenant("T-DAEGU");
  await nav("신규 청구·DTx");
  await page.fill('input[placeholder="예: 비기질성 불면증(F51.0)"]', "비기질성 불면증(F51.0)");
  await page.fill("textarea", "재진 진찰, 물리치료, DTx 불면증 인지치료앱 처방");
  await sleep(300);
  await shot("03_신규청구_DTx입력");

  // 04. 자동매핑 + 반려예측 사전검증
  await page.click("button:has-text('자동매핑·반려예측 →')");
  await sleep(700);
  await shot("04_자동매핑_반려예측");

  // 05. 청구서 미리보기 (DTx 포함)
  await page.click("button:has-text('다음: 청구서 →')");
  await sleep(600);
  await shot("05_청구서_미리보기_DTx");

  // 06. 제출 화면 → 제출 실행
  await page.click("button:has-text('다음: 제출 →')");
  await sleep(500);
  await shot("06_제출화면");
  await page.click("button:has-text('제출 →')");
  await sleep(800);

  // 07. 청구 목록 (반려예측 라벨)
  await nav("청구 목록");
  await shot("07_청구목록_반려예측");

  // 08. 청구 상세 모달 + 연동 로그
  const detailBtns = await page.locator("text=상세").all();
  if (detailBtns.length) {
    await detailBtns[detailBtns.length - 1].click();
    await sleep(700);
    await shot("08_청구상세_연동로그");
    await page.locator(".fixed button", { hasText: "×" }).first().click().catch(() => {});
    await sleep(400);
  }

  // 09. 심사·반려예측 콘솔
  await nav("심사·반려예측");
  let adj = page.locator("button:has-text('심사 실행')");
  if (await adj.count() > 0) { await adj.first().click(); await sleep(700); }
  await shot("09_심사_반려예측콘솔");

  // 10. 정산·미수금·펌뱅킹 (서울 테넌트 — aging)
  await setTenant("T-SEOUL");
  await nav("정산·미수금·펌뱅킹");
  await shot("10_정산_미수금_펌뱅킹");

  // 11. 수가 고시 관리 (diff)
  await nav("수가 고시 관리");
  await shot("11_수가고시_diff");

  // 12. 다기관 통합 정산 (본부관리자 역할 전환)
  await setRole("본부관리자");
  await nav("다기관 통합 정산");
  await shot("12_다기관_통합정산");

  // 13. 감사로그·KPI
  await nav("감사로그·KPI");
  await shot("13_감사로그_KPI");

  // 14. 환자 앱 (모바일) — 청구담당 복귀 후 부산 테넌트 환자
  await setRole("청구담당");
  await setTenant("T-BUSAN");
  await openDrawer();
  await page.click("aside >> text=환자");
  await sleep(800);
  await shot("14_환자앱_포털");

  // 15. 실손 청구하기 (있으면)
  const rmb = page.locator("button:has-text('실손보험 청구하기')").first();
  if (await rmb.count() > 0) { await rmb.click(); await sleep(700); await shot("15_환자앱_실손청구"); }

  await browser.close();
  console.log("DONE", errors.length ? ("ERRORS:" + errors.length) : "no-errors");
}
main().catch((e) => { console.error(e); process.exit(1); });

// 캐시브릿지 PoC 실 구동 캡처 스크립트
// file:// 로 v1.html 로드 → PC(1280x800) + 모바일(390x844) 각 핵심 화면 캡처
// TARGET 환경변수로 다른 버전도 캡처 가능 (예: TARGET=v2.html node capture.mjs)
// 캡처 폴더: ../../biz/captures/<ver>, ../../biz/captures/mobile/<ver>
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET || "v1.html";
const VER = TARGET.replace(".html", "");
const APP = "file://" + resolve(__dirname, TARGET);
const PC = resolve(__dirname, `../../biz/captures/${VER}`);
const MO = resolve(__dirname, `../../biz/captures/mobile/${VER}`);
[PC, MO].forEach((d) => mkdirSync(d, { recursive: true }));

const wait = (p, ms = 500) => p.waitForTimeout(ms);

async function closeDrawer(page) {
  await page.evaluate(() => {
    const d = document.getElementById("drawer"); const b = document.getElementById("drawerBackdrop");
    if (d) d.classList.remove("open"); if (b) b.classList.add("hidden");
    const m = document.getElementById("modalWrap"); if (m) m.classList.add("hidden");
  });
}
async function setRole(page, roleId, isMobile) {
  if (isMobile) { await page.click("#mRoleBtn"); await wait(page, 350); await page.click(`#roleSwitchM [data-role="${roleId}"]`); }
  else { await page.click(`#roleSwitch [data-role="${roleId}"]`); }
  await wait(page, 600); await closeDrawer(page);
}
async function navTo(page, v, isMobile) {
  await closeDrawer(page); await wait(page, 150);
  if (isMobile) {
    const inBar = await page.$(`#bottomnav [data-view="${v}"]`);
    if (inBar) { await inBar.click(); }
    else { await page.click("#moreTab"); await wait(page, 350); await page.click(`#navDrawer [data-view="${v}"]`); await wait(page, 200); await closeDrawer(page); }
  } else { await page.click(`#navDesktop [data-view="${v}"]`); }
  await wait(page, 650);
}

async function flow(page, OUT, tag, isMobile = false) {
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", tag, name); };

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 900);

  // ===== 사업주(owner) =====
  await setRole(page, "owner", isMobile);
  await shot("01-owner-dashboard");                  // 현금흐름 대시보드(매출/리스크/현금흐름)

  await navTo(page, "sales", isMobile);
  await shot("02-owner-sales");                       // 카드매출 내역
  const sync = await page.$("text=PG 동기화"); if (sync) { await sync.click().catch(()=>{}); await wait(page, 500); await shot("03-owner-pg-sync"); }

  // 선정산 워크플로 4단계
  await navTo(page, "advance", isMobile);
  await shot("04-advance-step1-limit");              // 1단계 한도산정
  const next1 = await page.$("text=리스크 심사로"); if (next1) { await next1.click(); await wait(page, 600); await shot("05-advance-step2-risk"); }
  const next2 = await page.$("text=약정서 작성"); if (next2) { await next2.click(); await wait(page, 600); await shot("06-advance-step3-agreement"); }
  await page.check("#advAgree").catch(()=>{});
  await wait(page, 200);
  const exec = await page.$("text=실행 →"); if (exec) { await exec.click(); await wait(page, 700); await shot("07-advance-step4-executed"); }

  // 상환·연체
  await navTo(page, "repay", isMobile);
  await shot("08-owner-repay");                       // 상환 카드
  const pay = await page.$('[onclick^="payInstallment"]'); if (pay) { await pay.click(); await wait(page, 600); await shot("09-owner-repay-paid"); }

  // 현금흐름 예측
  await navTo(page, "cashflow", isMobile);
  await wait(page, 700);
  await shot("10-owner-cashflow");                    // 잔고 추이 + 유입유출

  // 정산 스케줄
  await navTo(page, "settle", isMobile);
  await wait(page, 600);
  await shot("11-owner-settle");

  // 계산기
  await navTo(page, "calc", isMobile);
  const calcBtn = await page.$("text=계산하기"); if (calcBtn) { await calcBtn.click(); await wait(page, 500); await shot("12-calc-result"); }

  // 리포트 (PDF 발행 가능 화면)
  await navTo(page, "reports", isMobile);
  await wait(page, 700);
  await shot("13-owner-reports");

  // ===== 심사역(analyst) =====
  await setRole(page, "analyst", isMobile);
  await shot("14-analyst-dashboard");
  await navTo(page, "underwrite", isMobile);
  await wait(page, 500);
  await shot("15-analyst-underwrite-queue");
  const detail = await page.$('[onclick^="showRiskDetail"]'); if (detail) { await detail.click(); await wait(page, 500); await shot("16-analyst-risk-detail"); await closeDrawer(page); }
  await navTo(page, "portfolio", isMobile);
  await wait(page, 500);
  await shot("17-analyst-portfolio");

  // ===== 관리자(admin) =====
  await setRole(page, "admin", isMobile);
  await shot("18-admin-dashboard");
  await navTo(page, "integrations", isMobile);
  await wait(page, 500);
  await shot("19-admin-integrations");
  const fw = await page.$("text=테스트 수신"); if (fw) { await fw.click(); await wait(page, 600); await shot("20-admin-webhook-fired"); }
  await navTo(page, "notices", isMobile);
  await wait(page, 400);
  await shot("21-admin-notices");
  await navTo(page, "settings", isMobile);
  await wait(page, 400);
  await shot("22-admin-settings");

  // 지속성: 새로고침 후 사업주 복귀
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("cashbridge-v1")); if (s) { s._role = "owner"; localStorage.setItem("cashbridge-v1", JSON.stringify(s)); } });
  await page.goto(APP);
  await wait(page, 900);
  await shot("23-persistence");
}

const run = async () => {
  const browser = await chromium.launch();

  const pc = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await flow(pc, PC, "PC");
  await pc.close();

  const mo = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await flow(mo, MO, "MO", true);
  // 모바일 전용: 드로어(역할+전체메뉴) 열린 화면
  await mo.goto(APP);
  await mo.waitForTimeout(900);
  await mo.click("#mMenu");
  await mo.waitForTimeout(400);
  await mo.screenshot({ path: `${MO}/24-drawer.png`, fullPage: false });
  console.log("saved MO 24-drawer");
  await mo.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

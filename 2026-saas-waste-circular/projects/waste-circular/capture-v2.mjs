// 리사이클로 v2 실 구동 캡처 — file:// v2.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v2/ , 모바일 → biz/captures/mobile/v2/
// 멀티테넌트·RBAC·예측·추천·검증·연동(4) + 3자 서명 워크플로
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v2");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v2");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function setRole(page, role) { await page.selectOption("#roleSel", role); await sleep(350); }
async function setSite(page, site) { await page.selectOption("#siteSel", site); await sleep(350); }

async function navTo(page, view, isMobile) {
  if (!isMobile) {
    await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
  } else {
    const bn = await page.$(`#bottomnav button[data-view="${view}"]:not([hidden])`);
    if (bn) { await bn.click({ force: true }); }
    else {
      await page.click("#hamb"); await sleep(380);
      await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
    }
  }
  await sleep(420);
  await page.evaluate((v) => window.go(v), view);
  await sleep(320);
}

async function drawSig(page) {
  const pad = await page.$("#signPad"); const b = await pad.boundingBox();
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx - 70, cy); await page.mouse.down();
  await page.mouse.move(cx - 30, cy - 26, { steps: 5 });
  await page.mouse.move(cx + 12, cy + 22, { steps: 5 });
  await page.mouse.move(cx + 56, cy - 16, { steps: 5 });
  await page.mouse.up(); await sleep(180);
}

async function drive(page, dir, isMobile) {
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await sleep(900);

  const top = () => page.evaluate(() => window.scrollTo(0, 0));
  const bottom = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // 01 대시보드 (예측 차트·이상탐지 KPI·멀티테넌트/역할 셀렉트)
  await shot(page, dir, "01-dashboard");

  if (isMobile) {
    await page.click("#hamb"); await sleep(420);
    await shot(page, dir, "02-drawer");
    await page.evaluate(() => document.body.classList.remove("drawer-open"));
    await sleep(300);
  }

  // 02 배출·계근 + IoT 자동수신
  await navTo(page, "discharge", isMobile);
  await page.click("#dRegister", { force: true }); await sleep(400);
  await page.click("#iotPull", { force: true }); await sleep(500);
  await top(); await sleep(200);
  await shot(page, dir, isMobile ? "03-discharge-iot" : "02-discharge-iot");

  // 03 전자인계서 — 3자 순차 서명 (배출자 서명 모달)
  await navTo(page, "manifest", isMobile);
  await top(); await sleep(250);
  await shot(page, dir, isMobile ? "04-manifest-3party" : "03-manifest-3party");
  // 배출담당 역할로 배출자 서명
  await setRole(page, "emitter");
  await navTo(page, "manifest", isMobile);
  const sb = await page.$("[data-sign]");
  if (sb) {
    await sb.click({ force: true }); await sleep(420);
    await shot(page, dir, isMobile ? "05-sign-step" : "04-sign-step");
    await drawSig(page); await page.click("#signConfirm", { force: true }); await sleep(450);
  }
  // 운반기사 → 처리장 순차 서명
  await setRole(page, "driver");
  await navTo(page, "manifest", isMobile);
  let s2 = await page.$("[data-sign]:not([disabled])");
  if (s2) { await s2.click({ force: true }); await sleep(380); await drawSig(page); await page.click("#signConfirm", { force: true }); await sleep(420); }
  await setRole(page, "proc");
  await navTo(page, "manifest", isMobile);
  let s3 = await page.$("[data-sign]:not([disabled])");
  if (s3) { await s3.click({ force: true }); await sleep(380); await drawSig(page); await page.click("#signConfirm", { force: true }); await sleep(450); }
  await setRole(page, "admin");
  await navTo(page, "manifest", isMobile);
  await top(); await sleep(250);
  await shot(page, dir, isMobile ? "06-manifest-issued" : "05-manifest-issued");

  // 04 배출량 예측 (이동평균+추세)
  await navTo(page, "forecast", isMobile);
  await top(); await sleep(350);
  await shot(page, dir, isMobile ? "07-forecast" : "06-forecast");

  // 05 처리업체 추천 (가중 점수)
  await navTo(page, "recommend", isMobile);
  await page.click("#recRun", { force: true }); await sleep(400);
  await top(); await sleep(200);
  await shot(page, dir, isMobile ? "08-recommend" : "07-recommend");

  // 06 정산 검증 (이상치 탐지) — 이상치가 시드된 달성 물류센터(s2)에서 캡처
  await setSite(page, "s2");
  await navTo(page, "verify", isMobile);
  await page.click("#verRun", { force: true }); await sleep(400);
  await top(); await sleep(200);
  await shot(page, dir, isMobile ? "09-verify" : "08-verify");

  // 07 정산 — 검증보류(이상 건 차단) + 정상 정산 확정 (s2)
  await navTo(page, "settle", isMobile);
  const setBtn = await page.$("[data-settle]:not([disabled])");
  if (setBtn) { await setBtn.click({ force: true }); await sleep(420); }
  await top(); await sleep(200);
  await shot(page, dir, isMobile ? "10-settle-hold" : "09-settle-hold");
  await setSite(page, "s1");

  // 08 ESG·탄소 + 외부 제출(mock)
  await navTo(page, "esg", isMobile);
  await top(); await sleep(300);
  await page.click("#esgSubmit", { force: true }); await sleep(450);
  await shot(page, dir, isMobile ? "11-esg-submit" : "10-esg-submit");

  // 09 외부연동 4종 — 올바로 전송 + IoT + 탄소 제출 로그
  await navTo(page, "integration", isMobile);
  await top(); await sleep(250);
  const ab = await page.$("#allbaroExport:not([disabled])");
  if (ab) { await ab.click({ force: true }); await sleep(450); }
  await page.click("#carbonSubmit", { force: true }); await sleep(400);
  await shot(page, dir, isMobile ? "12-integration-logs" : "11-integration-logs");

  // 10 운반·처리 콘솔 — 운반기사 역할 뷰
  await setRole(page, "driver");
  await navTo(page, "partner", isMobile);
  await top(); await sleep(300);
  await shot(page, dir, isMobile ? "13-driver-console" : "12-driver-console");

  // 11 감사로그 (행위자·역할·테넌트)
  await setRole(page, "admin");
  await navTo(page, "audit", isMobile);
  await top(); await sleep(300);
  await shot(page, dir, isMobile ? "14-audit-log" : "13-audit-log");

  // 12 테넌트·RBAC 매트릭스
  await navTo(page, "tenant", isMobile);
  await top(); await sleep(300);
  await shot(page, dir, isMobile ? "15-tenant-rbac" : "14-tenant-rbac");
  await bottom(); await sleep(250);
  await shot(page, dir, isMobile ? "16-rbac-matrix" : "15-rbac-matrix");

  // 13 심사관(읽기) 역할 — 권한 제한 화면
  await setRole(page, "auditor");
  await navTo(page, "settle", isMobile);
  await top(); await sleep(300);
  await shot(page, dir, isMobile ? "17-auditor-readonly" : "16-auditor-readonly");

  // 14 다른 테넌트 전환 — 데이터 분리 입증
  await setRole(page, "admin");
  await setSite(page, "s3");
  await navTo(page, "dashboard", isMobile);
  await top(); await sleep(350);
  await shot(page, dir, isMobile ? "18-tenant-switch" : "17-tenant-switch");

  // 15 상태 지속성 — 새로고침 후 복원
  await page.goto(APP); await sleep(900);
  await shot(page, dir, isMobile ? "19-persist" : "18-persist");

  // overflow 검증 (모바일)
  if (isMobile) {
    const views = ["dashboard","discharge","manifest","settle","forecast","recommend","verify","esg","integration","partner","audit","tenant"];
    let maxOv = 0;
    await page.evaluate(() => localStorage.clear());
    await page.goto(APP); await sleep(700);
    for (const v of views) {
      await page.evaluate((vv) => window.go(vv), v); await sleep(250);
      const ov = await page.evaluate(() => document.body.scrollWidth - window.innerWidth);
      if (ov > maxOv) maxOv = ov;
    }
    console.log("MOBILE max overflow(px):", maxOv);
  }
  console.log("pageerror count:", errs.length, errs.slice(0, 3));
}

const run = async () => {
  const browser = await chromium.launch();
  const pc = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await drive(await pc.newPage(), OUT_PC, false);
  await pc.close();

  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await drive(await m.newPage(), OUT_M, true);
  await m.close();

  await browser.close();
  console.log("done");
};
run().catch((e) => { console.error(e); process.exit(1); });

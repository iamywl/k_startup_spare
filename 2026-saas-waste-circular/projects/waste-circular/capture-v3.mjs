// 리사이클로 v3 실 구동 캡처 — file:// v3.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v3/ , 모바일 → biz/captures/mobile/v3/
// 시리즈A: LCA·순환경제(MCI)·처리경로 최적화·부정리스크 + KO/EN i18n + 역할/연동 확장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v3");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v3");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function setRole(page, role) { await page.selectOption("#roleSel", role); await sleep(350); }
async function setSite(page, site) { await page.selectOption("#siteSel", site); await sleep(350); }
async function setLang(page, en) {
  const cur = await page.evaluate(() => window.LANG || (localStorage.getItem("recyclo-v3") ? JSON.parse(localStorage.getItem("recyclo-v3")).lang : "ko"));
  const want = en ? "en" : "ko";
  if (cur !== want) { await page.click("#langToggle"); await sleep(400); }
}

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
  await sleep(340);
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
  const M = isMobile;

  // 01 대시보드 (KO)
  await shot(page, dir, "01-dashboard");

  if (M) {
    await page.click("#hamb"); await sleep(420);
    await shot(page, dir, "02-drawer");
    await page.evaluate(() => document.body.classList.remove("drawer-open"));
    await sleep(300);
  }

  // 02 순환경제 지표 (MCI)
  await navTo(page, "circular", M);
  await top(); await sleep(350);
  await shot(page, dir, M ? "03-circular" : "02-circular");
  await bottom(); await sleep(250);
  await shot(page, dir, M ? "04-circular-trend" : "03-circular-trend");

  // 03 LCA 전과정 탄소 + 환경공단 제출
  await navTo(page, "lca", M);
  await top(); await sleep(300);
  await page.click("#lcaSubmit", { force: true }); await sleep(450);
  await shot(page, dir, M ? "05-lca" : "04-lca");
  await bottom(); await sleep(250);
  await shot(page, dir, M ? "06-lca-byitem" : "05-lca-byitem");

  // 04 처리경로 최적화 (탄소 가중 슬라이더)
  await navTo(page, "route", M);
  await page.click("#rtRun", { force: true }); await sleep(400);
  await top(); await sleep(200);
  await shot(page, dir, M ? "07-route" : "06-route");

  // 05 부정 리스크 스코어 — 이상치 시드된 s2
  await setSite(page, "s2");
  await navTo(page, "risk", M);
  await page.click("#rkRun", { force: true }); await sleep(400);
  await top(); await sleep(200);
  await shot(page, dir, M ? "08-risk" : "07-risk");
  await setSite(page, "s1");

  // 06 유가물 거래소 — 등록 + 체결
  await navTo(page, "exchange", M);
  await page.click("#exList", { force: true }); await sleep(350);
  await page.click("#exMatch", { force: true }); await sleep(450);
  await top(); await sleep(200);
  await shot(page, dir, M ? "09-exchange" : "08-exchange");

  // 07 외부연동 — 지자체·환경공단 신규 2종 로그
  await navTo(page, "integration", M);
  await top(); await sleep(250);
  const ab = await page.$("#allbaroExport:not([disabled])");
  if (ab) { await ab.click({ force: true }); await sleep(420); }
  await page.click("#muniSend", { force: true }); await sleep(420);
  await page.click("#kecoSend", { force: true }); await sleep(420);
  await bottom(); await sleep(250);
  await shot(page, dir, M ? "10-integration-new" : "09-integration-new");

  // 08 EN — 대시보드 (i18n 토글)
  await setLang(page, true);
  await navTo(page, "dashboard", M);
  await top(); await sleep(350);
  await shot(page, dir, M ? "11-en-dashboard" : "10-en-dashboard");

  // 09 EN — 순환경제(MCI)
  await navTo(page, "circular", M);
  await top(); await sleep(300);
  await shot(page, dir, M ? "12-en-circular" : "11-en-circular");

  // 10 EN — LCA
  await navTo(page, "lca", M);
  await top(); await sleep(300);
  await shot(page, dir, M ? "13-en-lca" : "12-en-lca");

  // 11 EN — 처리경로 최적화 (탄소 가중 0.8로 이동)
  await navTo(page, "route", M);
  await page.evaluate(() => { const s = document.getElementById("rtW"); s.value = 80; s.dispatchEvent(new Event("input")); });
  await sleep(400);
  await top(); await sleep(200);
  await shot(page, dir, M ? "14-en-route" : "13-en-route");

  // 12 EN — 부정 리스크
  await setSite(page, "s2");
  await navTo(page, "risk", M);
  await page.click("#rkRun", { force: true }); await sleep(400);
  await top(); await sleep(200);
  await shot(page, dir, M ? "15-en-risk" : "14-en-risk");
  await setSite(page, "s1");
  await setLang(page, false);

  // 13 신규 역할 — ESG심사역 뷰 (제한된 내비)
  await setRole(page, "esgrev");
  await navTo(page, "esg", M);
  await top(); await sleep(300);
  await shot(page, dir, M ? "16-role-esgrev" : "15-role-esgrev");

  // 14 신규 역할 — 지자체담당 뷰
  await setRole(page, "muni");
  await navTo(page, "integration", M);
  await top(); await sleep(300);
  await shot(page, dir, M ? "17-role-muni" : "16-role-muni");

  // 15 테넌트·권한 매트릭스 (7역할·신규 권한)
  await setRole(page, "admin");
  await navTo(page, "tenant", M);
  await bottom(); await sleep(300);
  await shot(page, dir, M ? "18-rbac-matrix" : "17-rbac-matrix");

  // 16 기존 워크플로 회귀 — 배출·계근 + IoT
  await navTo(page, "discharge", M);
  await page.click("#dRegister", { force: true }); await sleep(380);
  await page.click("#iotPull", { force: true }); await sleep(450);
  await top(); await sleep(200);
  await shot(page, dir, M ? "19-discharge-iot" : "18-discharge-iot");

  // 17 전자인계서 3자 서명 회귀 (관리자 뷰)
  await navTo(page, "manifest", M);
  await top(); await sleep(250);
  await shot(page, dir, M ? "20-manifest" : "19-manifest");

  // 18 정산 — 고위험 차단 회귀 (s2)
  await setSite(page, "s2");
  await navTo(page, "settle", M);
  await top(); await sleep(250);
  await shot(page, dir, M ? "21-settle-block" : "20-settle-block");
  await setSite(page, "s1");

  // 19 감사로그 (신규 행위 기록)
  await navTo(page, "audit", M);
  await top(); await sleep(300);
  await shot(page, dir, M ? "22-audit" : "21-audit");

  // 20 상태 지속성 — 새로고침 후 (언어·역할·데이터 유지)
  await page.goto(APP); await sleep(900);
  await shot(page, dir, M ? "23-persist" : "22-persist");

  // overflow 검증 (모바일)
  if (M) {
    const views = ["dashboard", "discharge", "manifest", "settle", "forecast", "circular", "lca", "route",
      "recommend", "verify", "risk", "esg", "integration", "exchange", "partner", "audit", "tenant"];
    let maxOv = 0;
    await page.evaluate(() => localStorage.clear());
    await page.goto(APP); await sleep(700);
    for (const v of views) {
      await page.evaluate((vv) => window.go(vv), v); await sleep(220);
      const ov = await page.evaluate(() => document.body.scrollWidth - window.innerWidth);
      if (ov > maxOv) maxOv = ov;
    }
    // EN 도 점검
    await page.click("#langToggle"); await sleep(300);
    for (const v of views) {
      await page.evaluate((vv) => window.go(vv), v); await sleep(180);
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

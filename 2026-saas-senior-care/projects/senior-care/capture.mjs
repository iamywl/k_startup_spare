// 돌봄노트 PoC 실 구동 캡처 스크립트
// file:// 로 vN.html 로드 → PC(1280x800) + 모바일(390x844) 각 핵심 화면 캡처
// 기본 타깃 v3.html. 다른 버전: TARGET=v2.html node capture.mjs
// 캡처 폴더: ../../biz/captures/<ver>, ../../biz/captures/mobile/<ver>
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET || "v3.html";
const VER = TARGET.replace(".html", "");
const APP = "file://" + resolve(__dirname, TARGET);
const PC = resolve(__dirname, `../../biz/captures/${VER}`);
const MO = resolve(__dirname, `../../biz/captures/mobile/${VER}`);
const STORE = "doltbom-" + VER;

mkdirSync(PC, { recursive: true });
mkdirSync(MO, { recursive: true });

const wait = (p, ms = 450) => p.waitForTimeout(ms);

async function seedPhotos(page) {
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key));
    const td = s && s._tenants && s._tenants[s._activeTenant];
    if (td && td.visits) {
      const svg = (txt) =>
        "data:image/svg+xml;utf8," +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#cfeae5"/><text x="200" y="200" font-size="20" fill="#0a6d60" text-anchor="middle" font-family="sans-serif">${txt}</text></svg>`);
      td.visits.forEach((v, i) => { if (i < 3) v.photos = [svg("방문 현장 사진"), svg("서비스 기록")]; });
      localStorage.setItem(key, JSON.stringify(s));
    }
  }, STORE);
}
async function closeModals(page) {
  await page.evaluate(() => { const m = document.getElementById("modalRoot"); if (m) m.innerHTML = ""; });
}
async function setRole(page, roleId, isMobile) {
  await closeModals(page);
  if (isMobile) {
    await page.click("#mMenuBtn"); await wait(page, 350);
    await page.click(`#roleMobile [data-role="${roleId}"]`);
  } else {
    await page.click(`#roleDesktop [data-role="${roleId}"]`);
  }
  await wait(page, 550);
}
async function navTo(page, v, isMobile) {
  await closeModals(page);
  if (isMobile) {
    const inBar = await page.$(`.bottomnav [data-view="${v}"]`);
    if (inBar) { await inBar.click(); }
    else {
      await page.click("#moreTab"); await wait(page, 350);
      await page.click(`#navDrawer [data-dview="${v}"]`);
    }
  } else {
    await page.click(`#navDesktop [data-view="${v}"]`);
  }
  await wait(page, 550);
}

async function flow(page, OUT, tag, isMobile = false) {
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", tag, name); };

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 700);
  await seedPhotos(page);
  await page.goto(APP);
  await wait(page, 800);

  // ===== 관리자(admin) — v1/v2 계승 핵심 =====
  await setRole(page, "admin", isMobile);
  await shot("01-admin-dashboard");

  await navTo(page, "recipients", isMobile);
  await shot("02-recipients");

  await navTo(page, "careplan", isMobile);
  for (let i = 0; i < 2; i++) { const n = await page.$("#cpNext"); if (n) await n.click(); await wait(page, 350); }
  await shot("03-careplan-services");

  await navTo(page, "visits", isMobile);
  const vn = await page.$("#visNew");
  if (vn) {
    await vn.click(); await wait(page, 400);
    await page.click("#vwNext"); await wait(page, 350);
    for (let i = 0; i < 4; i++) { const c = await page.$(`[data-chk="${i}"]`); if (c) await c.click(); await wait(page, 130); }
    await shot("04-visit-checklist");
    await page.click("#vwNext"); await wait(page, 350);
    await page.click("#vwNext"); await wait(page, 350);
    await page.click("#vwNext"); await wait(page, 450);
    await closeModals(page);
  }

  await navTo(page, "billing", isMobile);
  await shot("05-billing");

  // ===== v2 계승: 법인 콘솔 / 위험예측 / 인력최적화 / 수가시뮬 / EDI / 감사 =====
  await navTo(page, "corp", isMobile);
  await shot("06-corp-console");

  await navTo(page, "risklab", isMobile);
  await shot("07-risklab");
  const rk = await page.$("[data-risk]"); if (rk) { await rk.click(); await wait(page, 450); await shot("08-risklab-detail"); await closeModals(page); }

  await navTo(page, "optimize", isMobile);
  await shot("09-optimize");

  await navTo(page, "edi", isMobile);
  const ob = await page.$("#oauthBtn"); if (ob) { await ob.click(); await wait(page, 500); }
  await shot("10-edi-oauth");
  const sb = await page.$("#ediSend"); if (sb) { await sb.click(); await wait(page, 600); await shot("11-edi-sent"); }

  // ===== v3 신규: 수요예측 =====
  await navTo(page, "forecast", isMobile);
  await shot("12-forecast");
  const h9 = await page.$('[data-h="9"]'); if (h9) { await h9.click(); await wait(page, 450); await shot("13-forecast-9mo"); }

  // ===== v3 신규: 케어 질 벤치마킹 =====
  await navTo(page, "benchmark", isMobile);
  await shot("14-benchmark");

  // ===== v3 신규: 수가 시뮬레이션 (v2 계승, 슬라이더) =====
  await navTo(page, "revenue", isMobile);
  await shot("15-revenue-sim");

  // ===== v3 신규: 약물 안전 =====
  await navTo(page, "meds", isMobile);
  await shot("16-meds");
  const md = await page.$("[data-meds]"); if (md) { await md.click(); await wait(page, 450); await shot("17-meds-detail"); await closeModals(page); }

  // ===== v3 신규: 재원·이탈 예측 =====
  await navTo(page, "churn", isMobile);
  await shot("18-churn");
  const ch = await page.$("[data-churn]"); if (ch) { await ch.click(); await wait(page, 450); await shot("19-churn-detail"); await closeModals(page); }

  // ===== v3 신규: 전자처방·EMR =====
  await navTo(page, "emr", isMobile);
  const ep = await page.$("#emrPull"); if (ep) { await ep.click(); await wait(page, 500); }
  await shot("20-emr");

  // ===== v3 신규: IoT·웨어러블 =====
  await navTo(page, "iot", isMobile);
  const ist = await page.$("#iotStart"); if (ist) { await ist.click(); await wait(page, 2600); }
  await shot("21-iot");
  const isp = await page.$("#iotStop"); if (isp) { await isp.click(); await wait(page, 200); }

  // ===== v3 신규: 보험사 정산 =====
  await navTo(page, "settlement", isMobile);
  const ss = await page.$("#stSubmit"); if (ss) { await ss.click(); await wait(page, 500); }
  await shot("22-settlement");
  const sh = await page.$("#stHook"); if (sh) { await sh.click(); await wait(page, 500); await shot("23-settlement-webhook"); }

  // ===== 감사 로그 (위 활동이 적립됨) =====
  await navTo(page, "audit", isMobile);
  await shot("24-audit-log");

  // ===== i18n 영어 전환 — 대시보드 =====
  await navTo(page, "dashboard", isMobile);
  const lang = isMobile ? "#mLangBtn" : "#langBtn";
  await page.click(lang); await wait(page, 600); await shot("25-dashboard-en");
  // 영어 상태에서 v3 신규 뷰 하나 더
  await navTo(page, "forecast", isMobile); await shot("26-forecast-en");
  await navTo(page, "benchmark", isMobile); await shot("27-benchmark-en");
  await page.click(lang); await wait(page, 400);

  // ===== 요양보호사(care) — 약물·IoT 접근 =====
  await setRole(page, "care", isMobile);
  await shot("28-care-dashboard");

  // ===== 보호자(guardian) =====
  await setRole(page, "guardian", isMobile);
  await shot("29-guardian-dash");
  await navTo(page, "gjournal", isMobile); await shot("30-guardian-journal");

  // 지속성: 새로고침 후 관리자/수요예측 복귀
  await page.evaluate((key) => { const s = JSON.parse(localStorage.getItem(key)); s._role = "admin"; s._view = "forecast"; localStorage.setItem(key, JSON.stringify(s)); }, STORE);
  await page.goto(APP);
  await wait(page, 900);
  await shot("31-persistence");
}

const run = async () => {
  const browser = await chromium.launch();

  const pc = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await flow(pc, PC, "PC");
  await pc.close();

  const mo = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await flow(mo, MO, "MO", true);
  // 모바일 전용: 드로어 열린 화면 (신규 7뷰 포함 메뉴)
  await mo.goto(APP); await mo.waitForTimeout(800);
  await mo.click("#mMenuBtn"); await mo.waitForTimeout(400);
  await mo.screenshot({ path: `${MO}/32-drawer.png`, fullPage: false });
  console.log("saved MO 32-drawer");
  await mo.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

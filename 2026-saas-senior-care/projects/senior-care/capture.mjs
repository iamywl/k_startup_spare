// 돌봄노트 PoC 실 구동 캡처 스크립트
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
const STORE = "doltbom-" + VER;

mkdirSync(PC, { recursive: true });
mkdirSync(MO, { recursive: true });

const wait = (p, ms = 450) => p.waitForTimeout(ms);

async function seedPhotos(page) {
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && s.visits) {
      const svg = (txt) =>
        "data:image/svg+xml;utf8," +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#cfeae5"/><text x="200" y="200" font-size="20" fill="#0a6d60" text-anchor="middle" font-family="sans-serif">${txt}</text></svg>`);
      s.visits.forEach((v, i) => { if (i < 3) v.photos = [svg("방문 현장 사진"), svg("서비스 기록")]; });
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

  // ===== 관리자(admin) =====
  await setRole(page, "admin", isMobile);
  await shot("01-admin-dashboard");

  await navTo(page, "recipients", isMobile);
  await shot("02-recipients");
  const card = await page.$("[data-recip]");
  if (card) { await card.click(); await wait(page, 500); await shot("03-recipient-detail"); await closeModals(page); }

  await navTo(page, "careplan", isMobile);
  await shot("04-careplan-step1");
  // 워크플로 진행
  for (let i = 0; i < 2; i++) { const n = await page.$("#cpNext"); if (n) await n.click(); await wait(page, 400); }
  await shot("05-careplan-services");

  await navTo(page, "schedule", isMobile);
  await shot("06-schedule");

  await navTo(page, "visits", isMobile);
  await shot("07-visits");
  const vn = await page.$("#visNew");
  if (vn) {
    await vn.click(); await wait(page, 450); await shot("08-visit-wizard-step1");
    await page.click("#vwNext"); await wait(page, 400);
    // 체크리스트 토글 (각 토글마다 모달이 재렌더되므로 재조회)
    for (let i = 0; i < 4; i++) { const c = await page.$(`[data-chk="${i}"]`); if (c) await c.click(); await wait(page, 160); }
    await shot("09-visit-checklist");
    await page.click("#vwNext"); await wait(page, 400); await shot("10-visit-photo-note");
    await page.click("#vwNext"); await wait(page, 400); await shot("11-visit-confirm");
    await page.click("#vwNext"); await wait(page, 500);
    await closeModals(page);
  }

  await navTo(page, "attendance", isMobile);
  await shot("12-attendance");
  const ckin = await page.$("[data-in]"); if (ckin) { await ckin.click(); await wait(page, 450); await shot("13-attendance-checkin"); }

  await navTo(page, "billing", isMobile);
  await shot("14-billing");
  const bd = await page.$("[data-bill]"); if (bd) { await bd.click(); await wait(page, 450); await shot("15-bill-detail"); await closeModals(page); }
  const fc = await page.$("#fileClaim");
  if (fc) {
    await fc.click(); await wait(page, 450); await shot("16-claim-wizard");
    for (let i = 0; i < 3; i++) { const n = await page.$("#clNext"); if (n) await n.click(); await wait(page, 350); }
    await shot("17-claim-settle");
    const done = await page.$("#clNext"); if (done) await done.click(); await wait(page, 450);
    await closeModals(page);
  }

  await navTo(page, "guardian", isMobile);
  await shot("18-guardian-comm");
  const gs = await page.$("#gSend");
  if (gs) { await gs.click(); await wait(page, 450); await shot("19-guardian-send"); await page.click("#gsDo").catch(()=>{}); await wait(page, 450); await closeModals(page); }

  await navTo(page, "reports", isMobile);
  await shot("20-reports");

  await navTo(page, "integrations", isMobile);
  await shot("21-integrations");
  const wt = await page.$("#webhookTest"); if (wt) { await wt.click(); await wait(page, 600); await shot("22-integration-log"); }

  await navTo(page, "notices", isMobile);
  await shot("23-notices");

  await navTo(page, "settings", isMobile);
  await shot("24-settings");

  // i18n 영어 전환 — 대시보드
  await navTo(page, "dashboard", isMobile);
  const lang = isMobile ? "#mLangBtn" : "#langBtn";
  await page.click(lang); await wait(page, 600); await shot("25-dashboard-en");
  await page.click(lang); await wait(page, 400);

  // ===== 요양보호사(care) =====
  await setRole(page, "care", isMobile);
  await shot("26-care-dashboard");
  await navTo(page, "myvisits", isMobile); await shot("27-care-myvisits");

  // ===== 보호자(guardian) =====
  await setRole(page, "guardian", isMobile);
  await shot("28-guardian-dash");
  await navTo(page, "gjournal", isMobile); await shot("29-guardian-journal");
  await navTo(page, "gbilling", isMobile); await shot("30-guardian-billing");

  // 지속성: 새로고침 후 관리자 복귀
  await page.evaluate((key) => { const s = JSON.parse(localStorage.getItem(key)); s._role = "admin"; s._view = "dashboard"; localStorage.setItem(key, JSON.stringify(s)); }, STORE);
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
  // 모바일 전용: 드로어 열린 화면
  await mo.goto(APP); await mo.waitForTimeout(800);
  await mo.click("#mMenuBtn"); await mo.waitForTimeout(400);
  await mo.screenshot({ path: `${MO}/32-drawer.png`, fullPage: false });
  console.log("saved MO 32-drawer");
  await mo.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

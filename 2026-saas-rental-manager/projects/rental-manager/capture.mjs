// 임대지기 PoC 실 구동 캡처 스크립트
// file:// 로 v3.html(기본) 로드 → PC(1280x800) + 모바일(390x844) 각 핵심 화면 캡처
// TARGET 환경변수로 v1.html / v2.html 도 캡처 가능 (예: TARGET=v2.html node capture.mjs)
// 캡처 폴더: captures/<ver>, captures/mobile/<ver>
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET || "v3.html";
const VER = TARGET.replace(".html", "");
const APP = "file://" + resolve(__dirname, TARGET);
const PC = resolve(__dirname, `../../biz/captures/${VER}`);
const MO = resolve(__dirname, `../../biz/captures/mobile/${VER}`);
const STORE = VER === "v3" ? "rental-jigi-v3" : VER === "v2" ? "rental-jigi-v2" : "rental-jigi";

const wait = (p, ms = 500) => p.waitForTimeout(ms);

async function seedPhotos(page) {
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && s.repairs) {
      const svg = (txt) =>
        "data:image/svg+xml;base64," +
        btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#dbe6f5"/><text x="300" y="150" font-size="24" fill="#1f6fd6" text-anchor="middle" font-family="sans-serif">${txt}</text></svg>`);
      s.repairs.forEach((r, i) => { if (i < 2) r.photo = svg("하자 증빙 사진 (예시)"); });
      localStorage.setItem(key, JSON.stringify(s));
    }
  }, STORE);
}
async function ensureDrawerClosed(page) {
  await page.evaluate(() => {
    const d = document.getElementById("drawer"); const b = document.getElementById("drawerBackdrop");
    if (d) d.classList.remove("open"); if (b) b.classList.add("hidden");
  });
}
async function closeModals(page){
  await page.evaluate(()=>{ const m=document.getElementById("modalWrap"); if(m) m.classList.add("hidden"); const s=document.getElementById("sheetWrap"); if(s) s.classList.add("hidden"); });
}
async function setRole(page, roleId, isMobile) {
  if (isMobile) { await ensureDrawerClosed(page); await page.click("#mRoleBtn"); await wait(page, 350); await page.click(`#roleSwitchM [data-role="${roleId}"]`); }
  else { await page.click(`#roleSwitch [data-role="${roleId}"]`); }
  await wait(page, 550); await ensureDrawerClosed(page);
}
async function navTo(page, v, isMobile) {
  await ensureDrawerClosed(page); await wait(page, 150);
  if (isMobile) {
    const inBar = await page.$(`#bottomnav [data-view="${v}"]`);
    if (inBar) { await inBar.click(); }
    else { await page.click("#moreTab"); await wait(page, 350); await page.click(`#navDrawer [data-view="${v}"]`); await wait(page, 200); await ensureDrawerClosed(page); }
  } else { await page.click(`#navDesktop [data-view="${v}"]`); }
  await wait(page, 600);
}
async function toggleLang(page, isMobile){ const id = isMobile ? "#mLangBtn" : "#langBtn"; await page.click(id); await wait(page, 600); }

async function flow(page, OUT, tag, isMobile = false) {
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", tag, name); };

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 700);
  await seedPhotos(page);
  await page.goto(APP);
  await wait(page, 900);

  // ===== 임대인(owner) =====
  await setRole(page, "owner", isMobile);
  await wait(page, 700);
  await shot("01-owner-portfolio");                 // 포트폴리오 대시보드

  await navTo(page, "units", isMobile);
  await shot("02-owner-units");                     // 건물·세대(회귀 적정가 열)

  // 03 세대 상세 — 다변수 회귀 추정 모달
  const unitRow = await page.$("[data-unit]");
  if (unitRow) { await unitRow.click(); await wait(page, 500); await shot("03-owner-rent-regression"); const cl = await page.$("#mdClose2"); if (cl) await cl.click(); await wait(page, 300); }

  await navTo(page, "rent", isMobile);
  await shot("04-owner-rent");                       // 청구·수납(세금계산서 버튼)

  // 05 수납 처리 워크플로
  const pay = await page.$("[data-pay]"); if (pay) await pay.click(); await wait(page); await shot("05-owner-rent-paid");

  await navTo(page, "risk", isMobile);
  await wait(page, 600);
  await shot("06-owner-risk-engine");               // 연체 위험 + 룰엔진(발동 전)

  // 07 룰엔진 실행 → 단계별 자동 발송
  const runE = await page.$("#runEngine"); if (runE) { await runE.click(); await wait(page, 700); await shot("07-owner-dunning-fired"); }

  // 08 연체 근거 모달
  const rd = await page.$("[data-riskdetail]"); if (rd) { await rd.click(); await wait(page, 500); await shot("08-owner-risk-detail"); const cl = await page.$("#mdClose"); if (cl) await cl.click(); await wait(page, 300); }

  await navTo(page, "yield", isMobile);
  await wait(page, 700);
  await shot("09-owner-yield");                      // 수익률

  await navTo(page, "cashflow", isMobile);
  await wait(page, 800);
  await shot("10-owner-cashflow");                   // 12개월 현금흐름 시뮬

  await navTo(page, "optimize", isMobile);
  await wait(page, 800);
  await shot("11-owner-optimize");                   // 포트폴리오 최적화

  await navTo(page, "tax", isMobile);
  await wait(page, 800);
  await shot("12-owner-tax");                        // 세금 자동계산(분리 vs 종합)

  await navTo(page, "integrations", isMobile);
  await wait(page, 500);
  await shot("13-owner-integrations");               // 국토부/오픈뱅킹/전자세금계산서/OAuth
  const fw = await page.$("#fireWebhook"); if (fw) { await fw.click(); await wait(page, 600); await shot("14-owner-webhook-fired"); }

  // 15 계약·전자서명
  await navTo(page, "contract", isMobile);
  await shot("15-owner-contract");
  const sg = await page.$("[data-sign]");
  if (sg) {
    await sg.click(); await wait(page, 500);
    await page.check("#signAgree").catch(() => {});
    const box = await page.$("#signPad");
    if (box) { const b = await box.boundingBox(); await page.mouse.move(b.x + 40, b.y + 70); await page.mouse.down(); await page.mouse.move(b.x + 90, b.y + 40); await page.mouse.move(b.x + 140, b.y + 100); await page.mouse.move(b.x + 200, b.y + 50); await page.mouse.up(); }
    await wait(page, 300); await shot("16-owner-esign");
    const done = await page.$("#signDo"); if (done) await done.click(); await wait(page, 500);
  }
  await closeModals(page);

  // 17 알림 센터(알림톡 + 내용증명 로그)
  await navTo(page, "notices", isMobile);
  await shot("17-owner-notices");

  // 18 영어 전환(i18n) — 포트폴리오 영문
  await navTo(page, "portfolio", isMobile);
  await toggleLang(page, isMobile);
  await wait(page, 600);
  await shot("18-owner-portfolio-en");
  // 19 영문 세금 계산
  await navTo(page, "tax", isMobile);
  await wait(page, 700);
  await shot("19-owner-tax-en");
  await toggleLang(page, isMobile); // back to Korean
  await wait(page, 500);

  // ===== 관리소장(manager) =====
  await setRole(page, "manager", isMobile);
  await wait(page, 600);
  await shot("20-manager-dashboard");
  await navTo(page, "risk", isMobile); await wait(page, 600);
  await shot("21-manager-risk");

  // ===== 임차인(tenant) =====
  await setRole(page, "tenant", isMobile);
  await wait(page, 600);
  await shot("22-tenant-home");
  await navTo(page, "tbill", isMobile); await wait(page, 400); await shot("23-tenant-bill");
  await navTo(page, "trepair", isMobile); await wait(page, 400); await shot("24-tenant-repair");

  // 25 지속성: 새로고침 후 (임대인 복귀, 룰엔진/수납/서명 로그 유지)
  await page.evaluate((key) => { const s = JSON.parse(localStorage.getItem(key)); s._role = "owner"; s._building = "all"; s._lang="ko"; localStorage.setItem(key, JSON.stringify(s)); }, STORE);
  await page.goto(APP);
  await wait(page, 1000);
  await shot("25-persistence");
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
  await mo.click("#mRoleBtn");
  await mo.waitForTimeout(400);
  await mo.screenshot({ path: `${MO}/26-drawer.png`, fullPage: false });
  console.log("saved MO 26-drawer");
  // 모바일 전용: OAuth 로그인 게이트
  await mo.goto(APP + "?login");
  await mo.waitForTimeout(900);
  await mo.screenshot({ path: `${MO}/27-login.png`, fullPage: false });
  console.log("saved MO 27-login");
  await mo.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

// 리사이클로 v1 실 구동 캡처 — file:// index.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v1/ , 모바일 → biz/captures/mobile/v1/
// 워크플로: 배출 등록 → 계근 → 전자서명 인계서 → 정산 → ESG → 연동
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "index.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v1");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v1");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function navTo(page, view, isMobile) {
  if (!isMobile) {
    await page.click(`.nav-btn[data-view="${view}"]`, { force: true });
  } else {
    const bn = await page.$(`#bottomnav button[data-view="${view}"]`);
    if (bn) { await bn.click({ force: true }); }
    else {
      await page.click("#hamb"); await page.waitForTimeout(400);
      await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
    }
  }
  await page.waitForTimeout(400);
  const ok = await page.evaluate(v => document.querySelector(".view.active")?.id === "view-" + v, view);
  if (!ok) { await page.evaluate(v => go(v), view); await page.waitForTimeout(350); }
}

async function drawSignature(page) {
  const pad = await page.$("#signPad");
  const box = await pad.boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx - 70, cy); await page.mouse.down();
  await page.mouse.move(cx - 30, cy - 28, { steps: 6 });
  await page.mouse.move(cx + 10, cy + 24, { steps: 6 });
  await page.mouse.move(cx + 55, cy - 18, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

async function drive(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(900);

  const top = () => page.evaluate(() => window.scrollTo(0, 0));
  const bottom = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // 1) 대시보드 (KPI + 차트)
  await shot(page, dir, "01-dashboard");

  if (isMobile) {
    await page.click("#hamb"); await page.waitForTimeout(400);
    await shot(page, dir, "02-drawer");
    await page.evaluate(() => document.body.classList.remove("drawer-open"));
    await page.waitForTimeout(300);
  }

  // 2) 배출·계근 — 배출 등록 후 계근 입력 (체인 검증)
  await navTo(page, "discharge", isMobile);
  await top(); await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "03-discharge" : "02-discharge");
  // 배출 등록
  await page.fill("#dWeight", "1500");
  await page.click("#dRegister", { force: true });
  await page.waitForTimeout(500);
  // 새로 등록된 건 계근 입력(운반/처리 중량)
  const carry = await page.$$('[data-w="carry"]');
  const proc = await page.$$('[data-w="proc"]');
  if (carry[0]) { await carry[0].fill("1485"); await carry[0].dispatchEvent("change"); await page.waitForTimeout(300); }
  const carry2 = await page.$$('[data-w="carry"]');
  const proc2 = await page.$$('[data-w="proc"]');
  if (proc2[0]) { await proc2[0].fill("1480"); await proc2[0].dispatchEvent("change"); await page.waitForTimeout(300); }
  await top(); await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "04-weighing" : "03-weighing");

  // 3) 전자인계서 — 서명 모달 → 발행
  await navTo(page, "manifest", isMobile);
  await top(); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "05-manifest-list" : "04-manifest-list");
  const signBtn = await page.$("[data-sign]");
  if (signBtn) {
    await signBtn.click({ force: true });
    await page.waitForTimeout(450);
    await shot(page, dir, isMobile ? "06-sign-modal" : "05-sign-modal");
    await drawSignature(page);
    await page.click("#signConfirm", { force: true });
    await page.waitForTimeout(500);
  }
  await top(); await page.waitForTimeout(250);
  await shot(page, dir, isMobile ? "07-manifest-issued" : "06-manifest-issued");

  // 4) 정산 — 정산 확정
  await navTo(page, "settle", isMobile);
  await top(); await page.waitForTimeout(300);
  const setBtn = await page.$("[data-settle]");
  if (setBtn) { await setBtn.click({ force: true }); await page.waitForTimeout(450); }
  await top(); await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "08-settle" : "07-settle");

  // 5) ESG 리포트
  await navTo(page, "esg", isMobile);
  await top(); await page.waitForTimeout(400);
  await shot(page, dir, isMobile ? "09-esg" : "08-esg");
  await bottom(); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "10-esg-detail" : "09-esg-detail");

  // 6) 연동 — 올바로 매핑 내보내기(mock)
  await navTo(page, "integration", isMobile);
  await top(); await page.waitForTimeout(300);
  await page.click("#allbaroExport", { force: true });
  await page.waitForTimeout(450);
  await shot(page, dir, isMobile ? "11-integration" : "10-integration");

  // 7) 상태 지속성 — 새로고침 후 대시보드 유지
  await page.goto(APP);
  await page.waitForTimeout(900);
  await shot(page, dir, isMobile ? "12-persist" : "11-persist");
}

const run = async () => {
  const browser = await chromium.launch();

  const pc = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pcPage = await pc.newPage();
  await drive(pcPage, OUT_PC, false);
  await pc.close();

  const m = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const mPage = await m.newPage();
  await drive(mPage, OUT_M, true);
  await m.close();

  await browser.close();
  console.log("done");
};
run().catch((e) => { console.error(e); process.exit(1); });

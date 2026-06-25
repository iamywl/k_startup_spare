// 세이프온 v1 실 구동 캡처 — file:// index.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v1/ , 모바일 → biz/captures/mobile/v1/
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

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function nav(page, view, isMobile) {
  if (isMobile) {
    const bn = await page.$(`#bottomnav button[data-view="${view}"]`);
    if (bn) { await bn.click({ force: true }); }
    else { await page.click("#bottomnav button:last-child"); await wait(page, 350);
      await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true }); }
  } else {
    await page.click(`.sidebar .nav-btn[data-view="${view}"]`, { force: true });
  }
  await wait(page, 400);
  const ok = await page.evaluate(v => curView === v, view);
  if (!ok) { await page.evaluate(v => go(v), view); await wait(page, 350); }
}
const sign = async (page) => {
  // 캔버스에 서명 드로잉
  const box = await page.$("#signpad");
  if (!box) return;
  const b = await box.boundingBox();
  await page.mouse.move(b.x + 20, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + 60, b.y + 30); await page.mouse.move(b.x + 100, b.y + b.height - 20);
  await page.mouse.move(b.x + 150, b.y + 40); await page.mouse.move(b.x + 200, b.y + b.height / 2);
  await page.mouse.up();
  await wait(page, 200);
};

async function drive(page, dir, isMobile) {
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto(APP); await page.evaluate(() => localStorage.clear());
  await page.goto(APP); await wait(page, 900);

  // 1) 대시보드
  await shot(page, dir, "01-dashboard");
  if (isMobile) { await page.click("#bottomnav button:last-child"); await wait(page, 450); await shot(page, dir, "02-drawer");
    await page.evaluate(() => closeDrawer()); await wait(page, 350); }

  // 2) 위험성평가 워크플로
  await nav(page, "risk", isMobile);
  await shot(page, dir, isMobile ? "03-risk-list" : "02-risk-list");
  await page.evaluate(() => startRisk()); await wait(page, 400);
  await page.evaluate(() => rwNav(1)); await wait(page, 400); // step1 평가
  await shot(page, dir, isMobile ? "04-risk-assess" : "03-risk-assess");
  await page.evaluate(() => rwNav(1)); await wait(page, 300); // step2 대책
  await page.evaluate(() => { document.querySelectorAll("textarea").forEach((t,i)=>{ t.value="안전난간·개구부 덮개 설치, 안전대 부착설비 사용"; t.dispatchEvent(new Event("change")); }); });
  await wait(page, 300);
  await page.evaluate(() => rwNav(1)); await wait(page, 400); // step3 검토
  await shot(page, dir, isMobile ? "05-risk-review" : "04-risk-review");
  await page.evaluate(() => rwFinish()); await wait(page, 500);
  await shot(page, dir, isMobile ? "06-risk-done" : "05-risk-done");

  // 3) TBM 워크플로 + 서명
  await nav(page, "tbm", isMobile);
  await page.evaluate(() => startTbm()); await wait(page, 400);
  await page.evaluate(() => { document.querySelectorAll(".check-item input").forEach((c,i)=>{ if(i<5){ c.checked=true; c.dispatchEvent(new Event("change")); }}); });
  await wait(page, 300);
  await shot(page, dir, isMobile ? "07-tbm-check" : "06-tbm-check");
  await page.evaluate(() => twNav(1)); await wait(page, 300); // 위험요인
  await page.evaluate(() => { const t=document.querySelector("textarea"); if(t){t.value="3층 개구부 단부 추락 — 안전난간·덮개 확인, 안전대 체결 후 작업"; t.dispatchEvent(new Event("change"));} });
  await page.evaluate(() => twNav(1)); await wait(page, 500); // 서명
  await page.fill("#signName", "김현장");
  await sign(page);
  await shot(page, dir, isMobile ? "08-tbm-sign" : "07-tbm-sign");
  await page.evaluate(() => addSign()); await wait(page, 500);
  await page.evaluate(() => tbmFinish()); await wait(page, 500);
  await shot(page, dir, isMobile ? "09-tbm-done" : "08-tbm-done");

  // 4) 아차사고 신고 + 사진(데이터URL 주입)
  await nav(page, "incident", isMobile);
  await page.evaluate(() => startInc()); await wait(page, 400);
  await page.evaluate(() => { IW.severity="상"; IW.where="3층 동측 개구부"; });
  await shot(page, dir, isMobile ? "10-incident-type" : "09-incident-type");
  await page.evaluate(() => iwNav(1)); await wait(page, 300);
  // 더미 사진 2장 주입(실 FileReader 경로 대신 dataURL push로 미리보기 실증)
  await page.evaluate(() => {
    const c=document.createElement("canvas"); c.width=200;c.height=150; const x=c.getContext("2d");
    x.fillStyle="#cfd6de";x.fillRect(0,0,200,150);x.fillStyle="#e2601a";x.fillRect(20,90,160,18);x.fillStyle="#1b2330";x.font="16px sans-serif";x.fillText("현장사진 1",40,50);
    IW.photos.push(c.toDataURL("image/png"));
    const c2=document.createElement("canvas"); c2.width=200;c2.height=150; const y=c2.getContext("2d");
    y.fillStyle="#dde3ea";y.fillRect(0,0,200,150);y.fillStyle="#bd2d33";y.fillRect(30,40,40,70);y.fillStyle="#1b2330";y.font="16px sans-serif";y.fillText("현장사진 2",40,130);
    IW.photos.push(c2.toDataURL("image/png"));
    document.getElementById("incPhotoGrid").innerHTML=IW.photos.map(p=>`<img src="${p}">`).join("");
  });
  await wait(page, 300);
  await shot(page, dir, isMobile ? "11-incident-photo" : "10-incident-photo");
  await page.evaluate(() => iwNav(1)); await wait(page, 300);
  await page.evaluate(() => { IW.reporter="이성호"; IW.desc="개구부 덮개가 들려 있어 작업자가 발을 헛디딜 뻔함. 즉시 덮개 고정."; });
  await page.evaluate(() => incFinish()); await wait(page, 500);
  await shot(page, dir, isMobile ? "12-incident-done" : "11-incident-done");

  // 5) 안전교육 이수
  await nav(page, "edu", isMobile);
  await wait(page, 300);
  await shot(page, dir, isMobile ? "13-edu" : "12-edu");

  // 6) 법정 안전서류
  await nav(page, "docs", isMobile);
  await wait(page, 300);
  await shot(page, dir, isMobile ? "14-docs" : "13-docs");

  // 7) 전자결재함 + 승인
  await nav(page, "approval", isMobile);
  await wait(page, 300);
  await shot(page, dir, isMobile ? "15-approval" : "14-approval");
  await page.evaluate(() => { const a=S.approvals.find(x=>x.status==="진행"); if(a) approve(a.id); }); await wait(page, 400);
  await shot(page, dir, isMobile ? "16-approval-step" : "15-approval-step");

  // 8) 역할 전환(작업자)
  await page.evaluate(() => setRole("ceo")); await wait(page, 400);
  await nav(page, "dashboard", isMobile);
  await wait(page, 300);
  await shot(page, dir, isMobile ? "17-role-ceo" : "16-role-ceo");

  // 9) 상태 지속성: 새로고침 후 데이터 유지
  await page.evaluate(() => setRole("manager"));
  await page.goto(APP); await wait(page, 900);
  await nav(page, "risk", isMobile); await wait(page, 300);
  await shot(page, dir, isMobile ? "18-persist" : "17-persist");

  console.log(isMobile ? "MOBILE" : "PC", "pageerrors:", errs.length, errs.slice(0, 3));
}

const run = async () => {
  const browser = await chromium.launch();
  const pc = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await drive(await pc.newPage(), OUT_PC, false); await pc.close();
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await drive(await m.newPage(), OUT_M, true); await m.close();
  await browser.close(); console.log("done");
};
run().catch(e => { console.error(e); process.exit(1); });

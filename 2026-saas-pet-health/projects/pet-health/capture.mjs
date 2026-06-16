// 펫헬스북 v3 실 구동 캡처 스크립트 (시리즈A 데모)
// file:// v3.html 로드 → PC(1280x800) + 모바일(390x844) 핵심 화면 캡처
// 보호자/수의사/보험사/병원admin 4역할 · v3 알고리즘(질병 위험 예측·성장곡선·약물 상호작용)
//  · 외부통합(EMR·캘린더·웨어러블 OAuth·다보험사) · KO/EN i18n 포함
// PC → biz/captures/v3/ , 모바일 → biz/captures/mobile/v3/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const PC = resolve(__dirname, "../../biz/captures/v3");
const MO = resolve(__dirname, "../../biz/captures/mobile/v3");

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));
const wait = (page, ms = 400) => page.waitForTimeout(ms);

async function ensureClosed(page) {
  await page.evaluate(() => document.body.classList.remove("drawer-open"));
  await wait(page, 200);
}
async function go(page, isMobile, view) {
  if (isMobile) {
    await ensureClosed(page);
    await page.click("#hbBtn");
    await wait(page, 350);
    await page.click(`#drawer [data-view="${view}"]`);
  } else {
    await page.click(`#sidebar [data-view="${view}"]`);
  }
  await wait(page, 550);
}
async function setRole(page, isMobile, role) {
  if (isMobile) {
    await ensureClosed(page);
    await page.click("#hbBtn");
    await wait(page, 350);
    await page.click(`#drawer [data-role-pick="${role}"]`);
  } else {
    await page.click(`#sidebar [data-role-pick="${role}"]`);
  }
  await wait(page, 600);
}
async function setLang(page, isMobile, lang) {
  // PC: 사이드바 lang-tog / 모바일: 상단 mLangTog
  if (isMobile) {
    await page.click(`#mLangTog [data-lang="${lang}"]`).catch(()=>{});
  } else {
    await page.click(`#sidebar [data-lang="${lang}"]`).catch(()=>{});
  }
  await wait(page, 550);
}

async function flow(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 1000);

  // ===== 보호자 =====
  await shot(page, dir, "01-guardian-home");

  await go(page, isMobile, "pets");
  await shot(page, dir, "02-guardian-pets");

  await go(page, isMobile, "records");
  await shot(page, dir, "03-records-timeline");

  await go(page, isMobile, "schedule");
  await shot(page, dir, "04-schedule");
  const done = await page.$(".done-sched");
  if (done) { await done.click(); await wait(page, 600); await shot(page, dir, "05-schedule-completed"); }

  // 건강 리포트 (v2 알고리즘)
  await go(page, isMobile, "report");
  await wait(page, 800);
  await shot(page, dir, "06-report-algorithms");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(page, 500);
  await shot(page, dir, "07-report-trend-outlier");

  // ★ v3 질병 위험 예측 (로지스틱·성장곡선·약물 상호작용)
  await go(page, isMobile, "predict");
  await wait(page, 900);
  await shot(page, dir, "08-predict-disease-risk");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(page, 500);
  await shot(page, dir, "09-predict-drug-interaction");
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(page, 300);

  // 보험청구 (다보험사)
  await go(page, isMobile, "claims");
  await shot(page, dir, "10-claims-list");
  const row = await page.$("[data-claim]");
  if (row) { await row.click(); await wait(page, 500); await shot(page, dir, "11-claim-detail-flow"); await page.click(".sheet .close").catch(()=>{}); await wait(page, 300); }

  // 데이터·연동 (웨어러블 OAuth → 동기화 + 연동 현황)
  await go(page, isMobile, "integrations");
  await wait(page, 300);
  await page.click("#runNotifSweep").catch(()=>{});
  await wait(page, 400);
  await page.click("#oauthWearable").catch(()=>{});
  await wait(page, 500);
  await page.click("#syncWearable").catch(()=>{});
  await wait(page, 700);
  await shot(page, dir, "12-integrations-oauth");

  // ===== 수의사 =====
  await setRole(page, isMobile, "vet");
  await shot(page, dir, "13-vet-dashboard");

  await go(page, isMobile, "vetpatients");
  await wait(page, 400);
  await shot(page, dir, "14-vet-patient-chart");

  await go(page, isMobile, "vetwrite");
  await wait(page, 300);
  await page.fill("#vw_dx", "외이염 (좌측)").catch(()=>{});
  await page.fill("#vw_plan", "세정·점이액 7일, 1주 후 재진").catch(()=>{});
  await shot(page, dir, "15-vet-write-record");
  await page.click("#vetForm button[type=submit]").catch(()=>{});
  await wait(page, 700);
  await shot(page, dir, "16-vet-record-saved");

  // ===== 병원 admin (v3 신규 역할) =====
  await setRole(page, isMobile, "hospital");
  await wait(page, 400);
  await page.click("#emrSync").catch(()=>{});   // EMR 연동
  await wait(page, 700);
  await shot(page, dir, "17-hospital-dashboard-emr");

  await go(page, isMobile, "hospsched");
  await wait(page, 400);
  await page.click("#calSync").catch(()=>{});   // 캘린더 동기화
  await wait(page, 600);
  await shot(page, dir, "18-hospital-calendar-sync");

  // ===== 보험사 =====
  await setRole(page, isMobile, "insurer");
  await shot(page, dir, "19-insurer-dashboard");

  await go(page, isMobile, "insclaims");
  await wait(page, 400);
  await shot(page, dir, "20-insurer-claims");
  const irow = await page.$("[data-insclaim]");
  if (irow) { await irow.click(); await wait(page, 500); await shot(page, dir, "21-insurer-review"); await page.click(".sheet .close").catch(()=>{}); await wait(page, 300); }

  await go(page, isMobile, "insrisk");
  await wait(page, 700);
  await shot(page, dir, "22-insurer-risk-analysis");

  // ===== i18n: English 토글 =====
  await setRole(page, isMobile, "guardian");
  await wait(page, 300);
  await setLang(page, isMobile, "en");
  await shot(page, dir, "23-i18n-english-home");
  await go(page, isMobile, "predict");
  await wait(page, 800);
  await shot(page, dir, "24-i18n-english-predict");
  await setLang(page, isMobile, "ko");
  await wait(page, 300);

  // 모바일 전용: 드로어(역할 전환) + 스크롤 본문
  if (isMobile) {
    await ensureClosed(page);
    await page.click("#hbBtn");
    await wait(page, 450);
    await shot(page, dir, "25-mobile-drawer");
    await ensureClosed(page);
    await wait(page, 350);
    await go(page, isMobile, "predict");
    await wait(page, 700);
    await page.evaluate(() => window.scrollTo(0, 700));
    await wait(page, 400);
    await shot(page, dir, "26-mobile-predict-scrolled");
  }
}

const run = async () => {
  const browser = await chromium.launch();

  const pcCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const pcPage = await pcCtx.newPage();
  await flow(pcPage, PC, false);
  await pcCtx.close();

  const moCtx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const moPage = await moCtx.newPage();
  await flow(moPage, MO, true);
  await moCtx.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

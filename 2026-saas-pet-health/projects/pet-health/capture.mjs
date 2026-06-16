// 펫헬스북 v2 실 구동 캡처 스크립트
// file:// v2.html 로드 → PC(1280x800) + 모바일(390x844) 핵심 화면 캡처
// 보호자/수의사/보험사 3역할 · 알고리즘(위험스코어·BCS·체중추세) · 청구 흐름 · 외부통합 포함
// PC → biz/captures/v2/ , 모바일 → biz/captures/mobile/v2/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const PC = resolve(__dirname, "../../biz/captures/v2");
const MO = resolve(__dirname, "../../biz/captures/mobile/v2");

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));
const wait = (page, ms = 400) => page.waitForTimeout(ms);

// 역할/뷰 이동: 데스크톱은 사이드바, 모바일은 드로어 열어서 클릭
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
  await wait(page, 500);
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

async function flow(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 1000);

  // ===== 보호자 =====
  // 01 멀티펫 홈 대시보드
  await shot(page, dir, "01-guardian-home");

  // 02 반려동물 프로필 (견종 프로토콜)
  await go(page, isMobile, "pets");
  await shot(page, dir, "02-guardian-pets");

  // 03 새 반려동물 등록 시트
  await page.click("#addPet");
  await wait(page, 450);
  await shot(page, dir, "03-add-pet-sheet");
  await page.click(".sheet .close");
  await wait(page, 300);

  // 04 건강기록 타임라인
  await go(page, isMobile, "records");
  await shot(page, dir, "04-records-timeline");

  // 05 접종/투약/구충 스케줄 (D-day) + 완료 처리
  await go(page, isMobile, "schedule");
  await shot(page, dir, "05-schedule");
  const done = await page.$(".done-sched");
  if (done) { await done.click(); await wait(page, 600); await shot(page, dir, "06-schedule-completed"); }

  // 07 건강 리포트 (알고리즘: 위험스코어·BCS·체중추세·이상치)
  await go(page, isMobile, "report");
  await wait(page, 800);
  await shot(page, dir, "07-report-algorithms");
  // 리포트 하단(체중추세 차트)까지 스크롤
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(page, 500);
  await shot(page, dir, "08-report-trend-outlier");

  // 09 보험청구 (목록 + 상세 흐름)
  await go(page, isMobile, "claims");
  await shot(page, dir, "09-claims-list");
  const row = await page.$("[data-claim]");
  if (row) { await row.click(); await wait(page, 500); await shot(page, dir, "10-claim-detail-flow"); await page.click(".sheet .close").catch(()=>{}); await wait(page, 300); }

  // 11 데이터·연동 (알림톡 로그 + 웨어러블)
  await go(page, isMobile, "integrations");
  await wait(page, 300);
  await page.click("#runNotifSweep").catch(()=>{});
  await wait(page, 500);
  await page.click("#syncWearable").catch(()=>{});
  await wait(page, 700);
  await shot(page, dir, "11-integrations");

  // 12 알림센터
  await go(page, isMobile, "notifs");
  await shot(page, dir, "12-notifications");

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

  // ===== 보험사 =====
  await setRole(page, isMobile, "insurer");
  await shot(page, dir, "17-insurer-dashboard");

  await go(page, isMobile, "insclaims");
  await wait(page, 400);
  await shot(page, dir, "18-insurer-claims");
  const irow = await page.$("[data-insclaim]");
  if (irow) { await irow.click(); await wait(page, 500); await shot(page, dir, "19-insurer-review"); await page.click(".sheet .close").catch(()=>{}); await wait(page, 300); }

  await go(page, isMobile, "insrisk");
  await wait(page, 700);
  await shot(page, dir, "20-insurer-risk-analysis");

  // 모바일 전용: 드로어 열림 + 스크롤 본문
  if (isMobile) {
    await setRole(page, isMobile, "guardian");
    await ensureClosed(page);
    await page.click("#hbBtn");
    await wait(page, 450);
    await shot(page, dir, "21-mobile-drawer");
    await ensureClosed(page);
    await wait(page, 350);
    await go(page, isMobile, "report");
    await wait(page, 700);
    await page.evaluate(() => window.scrollTo(0, 600));
    await wait(page, 400);
    await shot(page, dir, "22-mobile-report-scrolled");
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

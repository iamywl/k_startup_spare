// 펫헬스북 v1 실 구동 캡처 스크립트
// file:// v1.html 로드 → PC(1280x800) + 모바일(390x844) 핵심 화면 캡처
// PC → biz/captures/v1/ , 모바일 → biz/captures/mobile/v1/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v1.html");
const PC = resolve(__dirname, "../../biz/captures/v1");
const MO = resolve(__dirname, "../../biz/captures/mobile/v1");

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function flow(page, dir, isMobile) {
  // 깨끗한 시드 상태
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(900);

  // 1. 홈 대시보드 (차트 렌더 대기)
  await page.waitForTimeout(700);
  await shot(page, dir, "01-home");

  // 2. 반려동물 프로필
  await page.click(`${isMobile ? ".bottomnav" : ".sidebar"} [data-view="pets"]`);
  await page.waitForTimeout(400);
  await shot(page, dir, "02-pets");

  // 3. 새 반려동물 등록 시트 열기
  await page.click("#addPet");
  await page.waitForTimeout(450);
  await shot(page, dir, "03-add-pet-sheet");
  await page.click(".sheet .close");
  await page.waitForTimeout(300);

  // 4. 건강기록 타임라인
  await page.click(`${isMobile ? ".bottomnav" : ".sidebar"} [data-view="records"]`);
  await page.waitForTimeout(400);
  await shot(page, dir, "04-records-timeline");

  // 5. 기록 추가 액션 (체중) → 저장 후 반영
  await page.click("#addRec");
  await page.waitForTimeout(400);
  await page.selectOption("#rt", "weight");
  await page.waitForTimeout(150);
  await page.fill("#rkg", "8.4");
  await page.click("#saveRec");
  await page.waitForTimeout(500);
  await shot(page, dir, "05-record-added");

  // 6. 접종/투약/구충 스케줄 (D-day 자동계산)
  await page.click(`${isMobile ? ".bottomnav" : ".sidebar"} [data-view="schedule"]`);
  await page.waitForTimeout(450);
  await shot(page, dir, "06-schedule");

  // 7. 완료 처리 → 다음 일정 자동 재계산
  const done = await page.$(".done-sched");
  if (done) {
    await done.click();
    await page.waitForTimeout(600);
    await shot(page, dir, "07-schedule-completed");
  }

  // 8. 예약·건강수첩 뷰
  await page.click(`${isMobile ? ".bottomnav" : ".sidebar"} [data-view="clinic"]`);
  await page.waitForTimeout(450);
  await shot(page, dir, "08-clinic");

  // 9. 병원 예약 신청 → 내역 반영
  await page.click("#bookForm button[type=submit]");
  await page.waitForTimeout(500);
  await shot(page, dir, "09-booking-added");

  // 10. 상태 지속성: 새로고침 후 홈에 데이터 유지 + 알림 배지
  await page.goto(APP);
  await page.waitForTimeout(1100);
  await shot(page, dir, "10-persistence-after-reload");

  // 모바일 전용: 스크롤된 본문(검수 §2.4)
  if (isMobile) {
    await page.click(`.bottomnav [data-view="schedule"]`);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    await shot(page, dir, "11-schedule-scrolled");
  }
}

const run = async () => {
  const browser = await chromium.launch();

  // PC 1280x800
  const pcCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const pcPage = await pcCtx.newPage();
  await flow(pcPage, PC, false);
  await pcCtx.close();

  // 모바일 390x844
  const moCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const moPage = await moCtx.newPage();
  await flow(moPage, MO, true);
  await moCtx.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

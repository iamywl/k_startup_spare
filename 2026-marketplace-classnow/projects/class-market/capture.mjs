// 클래스나우 v1 실 구동 캡처 — 양면 원데이클래스 마켓
// file:// v1.html → PC(1280x800) + 모바일(390x844) 핵심 화면
// 3역할(수강생·강사·관리자) · 예약 워크플로 · 추천/정산 알고리즘
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
const wait = (page, ms = 400) => page.waitForTimeout(ms);

async function ensureClosed(page) {
  await page.evaluate(() => document.body.classList.remove("drawer-open"));
  await wait(page, 180);
}
async function go(page, isMobile, view) {
  if (isMobile) {
    // 바텀탭에 있으면 거기서, 없으면 드로어에서
    const inTab = await page.$(`#bottomnav [data-view="${view}"]`);
    if (inTab) { await inTab.click(); }
    else {
      await ensureClosed(page);
      await page.click("#hbBtn"); await wait(page, 320);
      await page.click(`#drawer [data-view="${view}"]`);
    }
  } else {
    await page.click(`#sidebar [data-view="${view}"]`);
  }
  await wait(page, 520);
}
async function setRole(page, isMobile, role) {
  if (isMobile) {
    await ensureClosed(page);
    await page.click("#hbBtn"); await wait(page, 320);
    await page.click(`#drawer [data-role-pick="${role}"]`);
  } else {
    await page.click(`#sidebar [data-role-pick="${role}"]`);
  }
  await wait(page, 560);
}

async function flow(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 900);

  // ===== 수강생: 탐색·필터 =====
  await shot(page, dir, "01-guest-explore");

  // 카테고리 필터 + 정렬
  await page.click('[data-cat="cook"]').catch(()=>{});
  await wait(page, 450);
  await shot(page, dir, "02-explore-filtered");
  await page.click('[data-cat="all"]').catch(()=>{});
  await wait(page, 400);

  // 맞춤 추천 (콘텐츠기반)
  await go(page, isMobile, "reco");
  await wait(page, 500);
  await shot(page, dir, "03-reco-algorithm");

  // 클래스 상세
  await go(page, isMobile, "explore");
  await wait(page, 400);
  await page.click("#grid .cls");
  await wait(page, 600);
  await shot(page, dir, "04-class-detail");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(page, 400);
  await shot(page, dir, "05-detail-reviews");
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(page, 300);

  // 예약 워크플로
  await page.click("#bookNow");
  await wait(page, 500);
  await shot(page, dir, "06-booking-step1-slot");
  await page.click("#sheet [data-slot]:not(.full)");
  await wait(page, 300);
  await page.click("#bookNext");
  await wait(page, 400);
  await page.click("#qPlus").catch(()=>{});
  await wait(page, 200);
  await page.fill("#bnote", "비건 옵션으로 부탁드려요!").catch(()=>{});
  await shot(page, dir, "07-booking-step2-qty");
  await page.click("#bookNext");
  await wait(page, 400);
  await shot(page, dir, "08-booking-step3-pay");
  await page.click("#bookNext"); // 결제
  await wait(page, 700);
  await shot(page, dir, "09-booking-confirmed");
  await page.click("#sheet .close").catch(()=>{});
  await wait(page, 300);

  // 내 예약 + 취소/환불
  await go(page, isMobile, "bookings");
  await wait(page, 400);
  await shot(page, dir, "10-my-bookings");
  await page.click("[data-cancel]").catch(()=>{});
  await wait(page, 500);
  await shot(page, dir, "11-cancel-refund");
  await page.click("#sheet .close").catch(()=>{});
  await wait(page, 300);

  // 메시지
  await go(page, isMobile, "messages");
  await wait(page, 400);
  await page.fill("#msgIn", "주차 가능한가요?").catch(()=>{});
  await page.click("#msgSend").catch(()=>{});
  await wait(page, 1000);
  await shot(page, dir, "12-messages");

  // 위시리스트 (먼저 찜 하나)
  await go(page, isMobile, "explore");
  await wait(page, 400);
  await page.click("#grid .cls .heart").catch(()=>{});
  await wait(page, 300);
  await go(page, isMobile, "wishlist");
  await wait(page, 400);
  await shot(page, dir, "13-wishlist");

  // ===== 강사 =====
  await setRole(page, isMobile, "host");
  await wait(page, 500);
  await shot(page, dir, "14-host-dashboard");

  await go(page, isMobile, "hclasses");
  await wait(page, 400);
  await shot(page, dir, "15-host-classes");
  await page.click("#newClass").catch(()=>{});
  await wait(page, 400);
  await page.fill("#cf_title", "원데이 라자냐 클래스").catch(()=>{});
  await shot(page, dir, "16-host-class-edit");
  await page.click("#sheet .close").catch(()=>{});
  await wait(page, 300);

  await go(page, isMobile, "hbookings");
  await wait(page, 400);
  await page.click("[data-checkin]").catch(()=>{});
  await wait(page, 400);
  await shot(page, dir, "17-host-bookings-checkin");

  await go(page, isMobile, "hsettle");
  await wait(page, 500);
  await shot(page, dir, "18-host-settlement");

  await go(page, isMobile, "hreviews");
  await wait(page, 400);
  await page.fill("[id^=rep_]", "소중한 후기 감사합니다! 다음에 또 뵐게요 :)").catch(()=>{});
  await shot(page, dir, "19-host-review-reply");

  // ===== 관리자 =====
  await setRole(page, isMobile, "admin");
  await wait(page, 600);
  await shot(page, dir, "20-admin-stats");

  await go(page, isMobile, "adisputes");
  await wait(page, 400);
  await page.click("[data-dispute]").catch(()=>{});
  await wait(page, 500);
  await shot(page, dir, "21-admin-dispute");
  await page.click("#sheet .close").catch(()=>{});
  await wait(page, 300);

  await go(page, isMobile, "apolicy");
  await wait(page, 400);
  await shot(page, dir, "22-admin-policy-fee");

  await go(page, isMobile, "acatalog");
  await wait(page, 400);
  await shot(page, dir, "23-admin-catalog");

  // 모바일 전용: 드로어(역할 전환)
  if (isMobile) {
    await ensureClosed(page);
    await page.click("#hbBtn");
    await wait(page, 450);
    await shot(page, dir, "24-mobile-drawer");
    await ensureClosed(page);
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

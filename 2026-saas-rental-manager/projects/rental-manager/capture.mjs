// 임대지기 v1 PoC 실 구동 캡처 스크립트
// file:// 로 v1.html 로드 → PC(1280x800) + 모바일(390x844) 각 핵심 화면 캡처
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v1.html");
const PC = resolve(__dirname, "../../biz/captures/v1");
const MO = resolve(__dirname, "../../biz/captures/mobile/v1");

const wait = (p, ms = 450) => p.waitForTimeout(ms);

async function seedRepairPhoto(page) {
  // 하자 사진 미리보기를 만들기 위해 1x1 데이터 URL을 직접 시드
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("rental-jigi-v1"));
    if (s && s.repairs[0]) {
      s.repairs[0].photo =
        "data:image/svg+xml;base64," +
        btoa(
          '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#dbe6f5"/><text x="300" y="150" font-size="26" fill="#1f6fd6" text-anchor="middle" font-family="sans-serif">하자 증빙 사진 (예시)</text></svg>'
        );
    }
    localStorage.setItem("rental-jigi-v1", JSON.stringify(s));
  });
}

async function flow(page, OUT, tag, isMobile = false) {
  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log("saved", tag, name);
  };
  // 모바일은 바텀탭(#bottomnav), PC는 사이드바(#navDesktop)의 visible 버튼만 클릭
  const navScope = isMobile ? "#bottomnav" : "#navDesktop";
  const navTo = async (v) => page.click(`${navScope} [data-view="${v}"]`);

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 700);
  await seedRepairPhoto(page);
  await page.goto(APP);
  await wait(page, 900);

  // 1. 대시보드 (차트 렌더)
  await wait(page, 700);
  await shot("01-dashboard");

  // 2. 호실·임차인
  await navTo("units");
  await wait(page);
  await shot("02-units");

  // 3. 월세 수납
  await navTo("rent");
  await wait(page);
  await shot("03-rent");

  // 4. 수납 처리 액션 (워크플로: 미납 → 수납)
  const payBtn = await page.$("[data-pay]");
  if (payBtn) await payBtn.click();
  await wait(page);
  await shot("04-rent-paid");

  // 5. 일괄 독촉 → 로그 노출
  const remindAll = await page.$("#remindAll");
  if (remindAll) await remindAll.click();
  await wait(page);
  await shot("05-remind-log");

  // 6. 계약 관리
  await navTo("contract");
  await wait(page);
  await shot("06-contract");

  // 7. 하자보수
  await navTo("repair");
  await wait(page);
  await shot("07-repair");

  // 8. 하자 접수 폼(사진 업로드 영역)
  const addRepair = await page.$("#addRepair");
  if (addRepair) {
    await addRepair.click();
    await wait(page);
    await shot("08-repair-form");
    const cancel = await page.$("#mdCancel");
    if (cancel) await cancel.click();
    await wait(page, 250);
  }

  // 9. 빠른 등록 시트 / 호실 등록 모달 (보이는 버튼만)
  const addSel = isMobile ? "#mAdd" : "#dAdd";
  const dAdd = await page.$(addSel);
  if (dAdd) {
    await dAdd.click();
    await wait(page, 400);
    await shot("09-quick-sheet");
    const q = await page.$('[data-quick="unit"]');
    if (q) {
      await q.click();
      await wait(page, 500);
      await shot("10-unit-form");
      const cancel = await page.$("#mdCancel");
      if (cancel) await cancel.click();
    }
  }

  // 10. 지속성: 새로고침 후 대시보드(수납 처리 반영 유지)
  await page.goto(APP);
  await wait(page, 1000);
  await shot("11-persistence");
}

const run = async () => {
  const browser = await chromium.launch();

  // PC
  const pc = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await flow(pc, PC, "PC");
  await pc.close();

  // Mobile
  const mo = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await flow(mo, MO, "MO", true);
  // 모바일 전용: 스크롤된 본문 + 바텀탭 확인용 추가컷
  await mo.goto(APP);
  await mo.waitForTimeout(900);
  await mo.evaluate(() => window.scrollTo(0, 9999));
  await mo.waitForTimeout(400);
  await mo.screenshot({ path: `${MO}/12-dash-scroll.png`, fullPage: false });
  console.log("saved MO 12-dash-scroll");
  await mo.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

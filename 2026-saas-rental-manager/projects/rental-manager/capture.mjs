// 임대지기 v2 PoC 실 구동 캡처 스크립트
// file:// 로 v2.html 로드 → PC(1280x800) + 모바일(390x844) 각 핵심 화면 캡처
// v1.html 도 계속 열 수 있음(이 스크립트는 v2 전용). 캡처 폴더: captures/v2, captures/mobile/v2
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET || "v2.html";
const VER = TARGET.replace(".html", "");
const APP = "file://" + resolve(__dirname, TARGET);
const PC = resolve(__dirname, `../../biz/captures/${VER}`);
const MO = resolve(__dirname, `../../biz/captures/mobile/${VER}`);

const wait = (p, ms = 500) => p.waitForTimeout(ms);

async function seedPhotos(page) {
  // 하자 사진 미리보기를 위해 예시 dataURL 시드 (v2 repairs 구조)
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("rental-jigi-v2"));
    if (s && s.repairs) {
      const svg = (txt) =>
        "data:image/svg+xml;base64," +
        btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#dbe6f5"/><text x="300" y="150" font-size="24" fill="#1f6fd6" text-anchor="middle" font-family="sans-serif">${txt}</text></svg>`
        );
      s.repairs.forEach((r, i) => { if (i < 2) r.photo = svg("하자 증빙 사진 (예시)"); });
      localStorage.setItem("rental-jigi-v2", JSON.stringify(s));
    }
  });
}

async function ensureDrawerClosed(page) {
  await page.evaluate(() => {
    const d = document.getElementById("drawer"); const b = document.getElementById("drawerBackdrop");
    if (d) d.classList.remove("open");
    if (b) b.classList.add("hidden");
  });
}

// 역할 전환 (데스크톱 사이드바 / 모바일 드로어). 전환 시 setRole 이 드로어를 닫는다.
async function setRole(page, roleId, isMobile) {
  if (isMobile) {
    await ensureDrawerClosed(page);
    await page.click("#mRoleBtn"); // 드로어 열기
    await wait(page, 350);
    await page.click(`#roleSwitchM [data-role="${roleId}"]`);
  } else {
    await page.click(`#roleSwitch [data-role="${roleId}"]`);
  }
  await wait(page, 550);
  await ensureDrawerClosed(page);
}

async function navTo(page, v, isMobile) {
  await ensureDrawerClosed(page);
  await wait(page, 150);
  // 모바일: 바텀바에 없으면 더보기 드로어로
  if (isMobile) {
    const inBar = await page.$(`#bottomnav [data-view="${v}"]`);
    if (inBar) { await inBar.click(); }
    else {
      await page.click("#moreTab");
      await wait(page, 350);
      await page.click(`#navDrawer [data-view="${v}"]`);
      await wait(page, 200);
      await ensureDrawerClosed(page);
    }
  } else {
    await page.click(`#navDesktop [data-view="${v}"]`);
  }
  await wait(page, 550);
}

async function flow(page, OUT, tag, isMobile = false) {
  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log("saved", tag, name);
  };

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await wait(page, 700);
  await seedPhotos(page);
  await page.goto(APP);
  await wait(page, 900);

  // ===== 임대인(owner) =====
  await setRole(page, "owner", isMobile);

  // 01 포트폴리오 대시보드 (다중건물 차트)
  await wait(page, 700);
  await shot("01-owner-portfolio");

  // 02 건물·세대 (적정가 추정 열)
  await navTo(page, "units", isMobile);
  await shot("02-owner-units");

  // 03 청구·수납 (CSV 버튼 노출)
  await navTo(page, "rent", isMobile);
  await shot("03-owner-rent");

  // 04 수납 처리 워크플로 (미납→수납)
  const pay = await page.$("[data-pay]");
  if (pay) await pay.click();
  await wait(page);
  await shot("04-owner-rent-paid");

  // 05 연체 위험 관리 (알고리즘 1: 스코어링 + 차트)
  await navTo(page, "risk", isMobile);
  await wait(page, 700);
  await shot("05-owner-risk");

  // 06 연체 근거 모달 (산출 근거)
  const rd = await page.$("[data-riskdetail]");
  if (rd) {
    await rd.click();
    await wait(page, 500);
    await shot("06-owner-risk-detail");
    const cl = await page.$("#mdClose");
    if (cl) await cl.click();
    await wait(page, 300);
  }

  // 07 수익률 분석 (알고리즘 3: Cap rate/NOI/ROI + 차트)
  await navTo(page, "yield", isMobile);
  await wait(page, 700);
  await shot("07-owner-yield");

  // 08 계약·전자서명
  await navTo(page, "contract", isMobile);
  await shot("08-owner-contract");

  // 09 전자서명 모달 (캔버스 서명 흐름 mock)
  const sg = await page.$("[data-sign]");
  if (sg) {
    await sg.click();
    await wait(page, 500);
    // 동의 체크 + 서명 그리기
    await page.check("#signAgree").catch(() => {});
    const box = await page.$("#signPad");
    if (box) {
      const b = await box.boundingBox();
      await page.mouse.move(b.x + 40, b.y + 70);
      await page.mouse.down();
      await page.mouse.move(b.x + 90, b.y + 40);
      await page.mouse.move(b.x + 140, b.y + 100);
      await page.mouse.move(b.x + 200, b.y + 50);
      await page.mouse.up();
    }
    await wait(page, 300);
    await shot("09-owner-esign");
    const done = await page.$("#signDo");
    if (done) await done.click();
    await wait(page, 500);
  }

  // 10 세대 상세 (적정 임대료 추정 알고리즘 2)
  await navTo(page, "units", isMobile);
  await wait(page, 400);
  const unitRow = await page.$("[data-unit]");
  if (unitRow) {
    await unitRow.click();
    await wait(page, 500);
    await shot("10-owner-unit-rent-estimate");
    const cl = await page.$("#mdClose2");
    if (cl) await cl.click();
    await wait(page, 300);
  }

  // 11 알림 센터 (외부통합1: 카카오 알림톡 로그) — 먼저 일괄 독촉
  await navTo(page, "rent", isMobile);
  await wait(page, 400);
  const remindAll = await page.$("#remindAll");
  if (remindAll) await remindAll.click();
  await wait(page, 500);
  await navTo(page, "notices", isMobile);
  await wait(page, 400);
  await shot("11-owner-notices-kakao");

  // 12 CSV 입금대사 모달 (외부통합2)
  await navTo(page, "rent", isMobile);
  await wait(page, 400);
  const csvImport = await page.$("#csvImport");
  if (csvImport) {
    await csvImport.click();
    await wait(page, 400);
    const sample = await page.$("#csvSample");
    if (sample) await sample.click();
    await wait(page, 300);
    await shot("12-owner-csv-import");
    const cl = await page.$("#mdCancel");
    if (cl) await cl.click();
    await wait(page, 300);
  }

  // 13 세무·정산 리포트
  await navTo(page, "tax", isMobile);
  await wait(page, 400);
  await shot("13-owner-tax");

  // ===== 관리소장(manager) =====
  await setRole(page, "manager", isMobile);
  await wait(page, 600);
  await shot("14-manager-dashboard");

  // 15 관리소장 하자보수 (권한 내 작업)
  await navTo(page, "repair", isMobile);
  await wait(page, 500);
  await shot("15-manager-repair");

  // ===== 임차인(tenant) =====
  await setRole(page, "tenant", isMobile);
  await wait(page, 600);
  await shot("16-tenant-home");

  // 17 임차인 청구·납부
  await navTo(page, "tbill", isMobile);
  await wait(page, 500);
  await shot("17-tenant-bill");

  // 18 임차인 하자 신고
  await navTo(page, "trepair", isMobile);
  await wait(page, 500);
  await shot("18-tenant-repair");

  // 19 지속성: 새로고침 후 (임대인으로 복귀, 수납/서명/독촉 반영 유지)
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("rental-jigi-v2")); s._role = "owner"; s._building = "all"; localStorage.setItem("rental-jigi-v2", JSON.stringify(s)); });
  await page.goto(APP);
  await wait(page, 1000);
  await shot("19-persistence");
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
  // 모바일 전용: 드로어 열린 화면 + 스크롤된 본문 추가컷
  await mo.goto(APP);
  await mo.waitForTimeout(900);
  await mo.click("#mRoleBtn"); // 드로어(역할+전체메뉴) 열기
  await mo.waitForTimeout(400);
  await mo.screenshot({ path: `${MO}/20-drawer.png`, fullPage: false });
  console.log("saved MO 20-drawer");
  await mo.close();

  await browser.close();
  console.log("done");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

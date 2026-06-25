// 셀러스튜디오 v1 실 구동 캡처 — file:// v1.html → PC(1280x800) + 모바일(390x844)
// PC → biz/captures/v1/ , 모바일 → biz/captures/mobile/v1/
// 결정론 엔진: 상세페이지·채널카피·이미지변형(canvas)·A/B·품질스코어·금칙어검수·다국어·관리자
import { chromium } from "playwright";
import { resolve } from "path";

const APP = "file://" + resolve("/Users/ywlee/k_startup_spare/2026-ai-seller-studio/projects/seller-studio/v1.html");
const OUT_PC = resolve("/Users/ywlee/k_startup_spare/2026-ai-seller-studio/biz/captures/v1");
const OUT_M = resolve("/Users/ywlee/k_startup_spare/2026-ai-seller-studio/biz/captures/mobile/v1");

const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));
const top = (p) => p.evaluate(() => window.scrollTo(0, 0));
const bottom = (p) => p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

async function nav(page, view, isMobile) {
  if (isMobile) {
    const bn = await page.$(`#bottomnav button[data-view="${view}"]`);
    if (bn) { await bn.click({ force: true }); }
    else { await page.evaluate((v) => go(v), view); }
  } else {
    await page.evaluate((v) => go(v), view);
  }
  await page.waitForTimeout(350);
}

async function drive(page, dir, isMobile) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(900);

  // 1) 대시보드 (AI 정직성 배너 + KPI)
  await shot(page, dir, "01-dashboard");

  if (isMobile) {
    await page.click(".hamb"); await page.waitForTimeout(450);
    await shot(page, dir, "02-drawer");
    await page.evaluate(() => closeDrawer()); await page.waitForTimeout(300);
  }

  // 2) 제품 목록
  await nav(page, "products", isMobile);
  await shot(page, dir, isMobile ? "03-products" : "02-products");

  // 3) 상세페이지 생성 (결정론 6섹션)
  await nav(page, "detail", isMobile);
  await top(page); await page.waitForTimeout(150);
  await page.evaluate(() => runDetail()); await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "04-detail-gen" : "03-detail-gen");
  await bottom(page); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "05-detail-bottom" : "04-detail-bottom");

  // 4) 광고 카피 (채널별 글자수 제약)
  await nav(page, "copy", isMobile);
  await top(page); await page.waitForTimeout(150);
  await page.evaluate(() => runCopy()); await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "06-copy" : "05-copy");
  await bottom(page); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "07-copy-bottom" : "06-copy-bottom");

  // 5) 이미지 변형 (canvas 실픽셀) + 변형 6종
  await nav(page, "image", isMobile);
  await top(page); await page.waitForTimeout(400);
  await shot(page, dir, isMobile ? "08-image" : "07-image");
  await page.evaluate(() => genVariants()); await page.waitForTimeout(600);
  await bottom(page); await page.waitForTimeout(400);
  await shot(page, dir, isMobile ? "09-image-variants" : "08-image-variants");

  // 6) A/B 비교 (4톤 점수순)
  await nav(page, "ab", isMobile);
  await top(page); await page.waitForTimeout(150);
  await page.evaluate(() => runAB()); await page.waitForTimeout(500);
  await shot(page, dir, isMobile ? "10-ab" : "09-ab");
  await bottom(page); await page.waitForTimeout(350);
  await shot(page, dir, isMobile ? "11-ab-bottom" : "10-ab-bottom");

  // 7) 품질·전환 스코어 (룰 eval)
  await nav(page, "quality", isMobile);
  await top(page); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "12-quality" : "11-quality");
  // 금칙어 샘플 → 검수 작동 캡처
  await page.evaluate(() => qaSample()); await page.waitForTimeout(400);
  await bottom(page); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "13-quality-banned" : "12-quality-banned");

  // 8) 브랜드 톤·금칙어
  await nav(page, "brand", isMobile);
  await top(page); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "14-brand" : "13-brand");

  // 9) 히스토리 (앞 생성들이 누적됨)
  await nav(page, "history", isMobile);
  await top(page); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "15-history" : "14-history");

  // 10) 내보내기
  await nav(page, "export", isMobile);
  await top(page); await page.waitForTimeout(250);
  await shot(page, dir, isMobile ? "16-export" : "15-export");

  // 11) 사용량
  await nav(page, "usage", isMobile);
  await top(page); await page.waitForTimeout(250);
  await shot(page, dir, isMobile ? "17-usage" : "16-usage");

  // 12) 관리자 (역할 전환 → 멀티테넌트·룰 인벤토리)
  await page.evaluate(() => { const s = document.querySelector("#roleSel"); s.value = "admin"; s.onchange({ target: s }); });
  await page.waitForTimeout(300);
  await nav(page, "admin", isMobile);
  await top(page); await page.waitForTimeout(300);
  await shot(page, dir, isMobile ? "18-admin" : "17-admin");

  // 13) 다국어 EN — 상세 재생성
  await page.evaluate(() => { const s = document.querySelector("#langSel"); s.value = "en"; s.onchange({ target: s }); });
  await page.waitForTimeout(300);
  await nav(page, "detail", isMobile);
  await page.evaluate(() => runDetail()); await page.waitForTimeout(450);
  await top(page); await page.waitForTimeout(200);
  await shot(page, dir, isMobile ? "19-en-detail" : "18-en-detail");

  // 14) 상태 지속성 — 새로고침 후 대시보드 유지 (KO 복귀)
  await page.evaluate(() => { const g = JSON.parse(localStorage.getItem("seller-studio-v1")); g.lang = "ko"; g.role = "seller"; localStorage.setItem("seller-studio-v1", JSON.stringify(g)); });
  await page.goto(APP); await page.waitForTimeout(900);
  await shot(page, dir, isMobile ? "20-persist" : "19-persist");
}

const run = async () => {
  const browser = await chromium.launch();

  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await drive(await pc.newPage(), OUT_PC, false);
  await pc.close();

  const m = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  await drive(await m.newPage(), OUT_M, true);
  await m.close();

  await browser.close();
  console.log("done");
};
run().catch((e) => { console.error(e); process.exit(1); });

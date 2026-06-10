// 클래스렌즈 v1 PoC 실 구동 캡처 스크립트
// file:// 로 index.html 로드 → 각 뷰/액션 결과 캡처 → biz/captures/ 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "index.html");
const OUT = resolve(__dirname, "../../biz/captures");

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log("saved", name);
};

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // 깨끗한 시드 상태로 시작
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(900);

  // 1. 대시보드 (차트 렌더 대기)
  await page.waitForTimeout(700);
  await shot(page, "01-dashboard");

  // 2. 입력 화면
  await page.click('button[data-view="input"]');
  await page.waitForTimeout(400);
  await shot(page, "02-input-form");

  // 3. 수기 입력 액션 실행 → 토스트/이력 반영
  await page.fill("#mTitle", "6월 형성평가");
  await page.fill("#mScore", "92");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await shot(page, "03-input-saved");

  // 4. CSV 업로드 액션 → 인입 로그
  await page.click("#csvSample");
  await page.waitForTimeout(200);
  await page.click("#csvUpload");
  await page.waitForTimeout(500);
  await shot(page, "04-csv-uploaded");

  // 5. 히트맵
  await page.click('button[data-view="heatmap"]');
  await page.waitForTimeout(500);
  await shot(page, "05-heatmap");

  // 6. 추천 생성 + 배포 추가
  await page.click('button[data-view="recommend"]');
  await page.waitForTimeout(300);
  await page.click("#genRecommend");
  await page.waitForTimeout(400);
  const addBtns = await page.$$(".addDist");
  for (let i = 0; i < Math.min(3, addBtns.length); i++) await addBtns[i].click();
  await page.waitForTimeout(300);
  await page.click("#distributeAll");
  await page.waitForTimeout(400);
  await shot(page, "06-recommend-distributed");

  // 7. 리포트 생성
  await page.click('button[data-view="report"]');
  await page.waitForTimeout(300);
  await page.click("#buildReport");
  await page.waitForTimeout(700);
  await shot(page, "07-report");

  // 8. 워크플로 (3단계: 추천 배포) 까지 진행
  await page.click('button[data-view="workflow"]');
  await page.waitForTimeout(300);
  await page.click("#wfNext"); // -> step1 분석
  await page.waitForTimeout(300);
  await shot(page, "08-workflow-analysis");
  await page.click("#wfNext"); // -> step2 추천
  await page.waitForTimeout(300);
  const wfGen = await page.$("#wfGenRec");
  if (wfGen) await wfGen.click();
  await page.waitForTimeout(400);
  await page.click("#wfNext"); // -> step3 리포트
  await page.waitForTimeout(300);
  await shot(page, "09-workflow-report-complete");

  // 9. 상태 지속성 검증: 새로고침 후 대시보드에 입력 데이터 유지
  await page.goto(APP);
  await page.waitForTimeout(900);
  await page.click('button[data-view="input"]');
  await page.waitForTimeout(500);
  await shot(page, "10-persistence-after-reload");

  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

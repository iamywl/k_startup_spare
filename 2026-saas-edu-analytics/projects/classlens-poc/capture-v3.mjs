// 클래스렌즈 v3 Series A 실 구동 캡처 스크립트
// file:// 로 v3.html 로드 → 8기능/4역할별 결과 캡처 → biz/captures/v3/ 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT = resolve(__dirname, "../../biz/captures/v3");
const KEY = "classlens_v3_state";

// localStorage 직접 시드(역할/뷰 상태) 헬퍼
async function seedState(page, patch) {
  await page.evaluate(({ KEY, patch }) => {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    Object.assign(s, patch);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, { KEY, patch });
}

const run = async () => {
  const browser = await chromium.launch();

  // ===== 데스크톱 (교육청·학교·교사) =====
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", name); };

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(1100);

  // 01. 교육청 통합 대시보드 (다계층 테넌트)
  await seedState(page, { role: "district" });
  await page.goto(APP); await page.waitForTimeout(900);
  await page.click('button[data-view="district"]'); await page.waitForTimeout(700);
  await shot("01-district-overview");

  // 02. 예측 모델 (능선회귀·로지스틱, 근거 노출) — 학교 관리자 스코프
  await seedState(page, { role: "school", scopeSchool: "sch1", currentClass: "c1" });
  await page.goto(APP); await page.waitForTimeout(900);
  await page.click('button[data-view="predict"]'); await page.waitForTimeout(700);
  await shot("02-predict-model");

  // 03. 형평성 분석 (지니·사분위·로렌츠)
  await page.click('button[data-view="equity"]'); await page.waitForTimeout(700);
  await shot("03-equity-analysis");

  // 04. 개입 추천 엔진 (선수개념 그래프 경로) — 정우진(고위험) 선택
  await page.click('button[data-view="intervene"]'); await page.waitForTimeout(400);
  await page.selectOption("#interveneStudent", "c1_s4").catch(() => {});
  await page.click("#genPath"); await page.waitForTimeout(500);
  await shot("04-intervention-path");

  // 05. 멀티소스 연동 (AIDT·LMS·CSV 인입·정규화)
  await page.click('button[data-view="connect"]'); await page.waitForTimeout(400);
  await page.click('.srcPull[data-src="AIDT"]'); await page.waitForTimeout(300);
  await page.click('.srcPull[data-src="LMS"]'); await page.waitForTimeout(300);
  await page.click('.srcPull[data-src="CSV"]'); await page.waitForTimeout(400);
  await shot("05-multisource-ingest");

  // 06. 멀티소스 CSV 내보내기
  await page.click("#exportConnCsv"); await page.waitForTimeout(400);
  await shot("06-multisource-csv");

  // 07. 교사 협업 (루브릭 작성·공유·채택)
  await page.click('button[data-view="collab"]'); await page.waitForTimeout(300);
  await page.fill("#rbTitle", "소수의 곱셈 형성평가 루브릭");
  await page.fill("#rbCriteria", "소수점 위치 정확성\n자릿값 이해\n풀이 과정 서술");
  await page.click("#addRubric"); await page.waitForTimeout(300);
  const adopt = await page.$(".adoptRb"); if (adopt) await adopt.click();
  await page.waitForTimeout(400);
  await shot("07-teacher-collab");

  // 08. 학부모 캠페인 (세그먼트 일괄 발송) + 예약 슬롯
  await page.click('button[data-view="parentcamp"]'); await page.waitForTimeout(300);
  await page.selectOption("#campSeg", "all"); await page.waitForTimeout(150);
  await page.click("#sendCampaign"); await page.waitForTimeout(400);
  const slot = await page.$(".bookSlot"); if (slot) await slot.click();
  await page.waitForTimeout(400);
  await shot("08-parent-campaign");

  // 09. 개인정보 거버넌스 (감사로그·보존정책)
  await page.click('button[data-view="governance"]'); await page.waitForTimeout(500);
  await shot("09-governance");

  // 10. 동의 일괄 철회 + 보존 파기
  await page.selectOption("#revokeScope", "class"); await page.waitForTimeout(150);
  await page.click("#bulkRevoke"); await page.waitForTimeout(300);
  await page.click("#purgeExpired"); await page.waitForTimeout(400);
  await shot("10-bulk-revoke-purge");

  // 11. 워크플로 A (예측→개입→배포) 완주
  await page.click('button[data-view="workflow"]'); await page.waitForTimeout(300);
  await page.selectOption("#wfPick", "A"); await page.waitForTimeout(300);
  await page.click("#wfNext"); await page.waitForTimeout(300); // step1 경로생성
  let gp = await page.$("#wfGenPaths"); if (gp) await gp.click(); await page.waitForTimeout(300);
  await page.click("#wfNext"); await page.waitForTimeout(300); // step2 배포
  let dp = await page.$("#wfDistPaths"); if (dp) await dp.click(); await page.waitForTimeout(400);
  await shot("11-workflow-a-predict-intervene");

  // 12. 워크플로 D (교육청 롤업→형평성→권고) — 교육청 역할
  await seedState(page, { role: "district", wfPick: "D", wfStep: { A: 0, B: 0, C: 0, D: 0 } });
  await page.goto(APP); await page.waitForTimeout(900);
  await page.click('button[data-view="workflow"]'); await page.waitForTimeout(300);
  await page.selectOption("#wfPick", "D"); await page.waitForTimeout(300);
  await page.click("#wfNext"); await page.waitForTimeout(300); // step1 형평성
  await page.click("#wfNext"); await page.waitForTimeout(300); // step2 권고
  await shot("12-workflow-d-district-equity");

  // 13. 학교 대시보드 (학급 롤업·예측 위험 분포)
  await seedState(page, { role: "school", scopeSchool: "sch1" });
  await page.goto(APP); await page.waitForTimeout(900);
  await page.click('button[data-view="school"]'); await page.waitForTimeout(700);
  await shot("13-school-dashboard");

  // 14. 상태 지속성: 새로고침 후 예측 모델 유지 + 가명처리 적용
  await page.evaluate(({ KEY }) => { const s = JSON.parse(localStorage.getItem(KEY)); s.pseudoOn = true; s.role = "teacher"; s.currentTeacher = "t1"; s.currentClass = "c1"; localStorage.setItem(KEY, JSON.stringify(s)); }, { KEY });
  await page.goto(APP); await page.waitForTimeout(900);
  await page.click('button[data-view="predict"]'); await page.waitForTimeout(600);
  await shot("14-persistence-pseudonymized");

  await page.close();

  // ===== 모바일 (학부모) =====
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mshot = async (name) => { await m.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", name); };
  await m.goto(APP); await m.waitForTimeout(300);
  await m.evaluate(({ KEY }) => { const s = JSON.parse(localStorage.getItem(KEY)) || {}; s.role = "parent"; s.parentTab = "home"; s.parentStudent = "c1_s4"; s.pseudoOn = false; localStorage.setItem(KEY, JSON.stringify(s)); }, { KEY });
  await m.goto(APP); await m.waitForTimeout(800);

  // 15. 학부모 모바일 홈
  await mshot("15-parent-mobile-home");

  // 16. 학부모 모바일 예측 (학기말 예측·위험확률)
  await m.click('button[data-ptab="predict"]'); await m.waitForTimeout(600);
  await mshot("16-parent-mobile-predict");

  // 17. 학부모 모바일 상담 예약
  await m.click('button[data-ptab="book"]'); await m.waitForTimeout(400);
  const pmb = await m.$(".pmBook"); if (pmb) await pmb.click();
  await m.waitForTimeout(400);
  await mshot("17-parent-mobile-booking");

  await m.close();
  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

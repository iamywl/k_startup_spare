// 클래스렌즈 v2 Beta 실 구동 캡처 스크립트
// file:// 로 v2.html 로드 → 8기능/역할별 결과 캡처 → biz/captures/v2/ 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT = resolve(__dirname, "../../biz/captures/v2");

const run = async () => {
  const browser = await chromium.launch();

  // ===== 데스크톱 (교사·관리자) =====
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", name); };

  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP);
  await page.waitForTimeout(1100);

  // 01. 교사 대시보드 (추세 회귀·위험점수 반영)
  await shot("01-teacher-dashboard");

  // 02. 위험학생 조기경보 (알고리즘 근거)
  await page.click('button[data-view="risk"]');
  await page.waitForTimeout(500);
  await shot("02-risk-alert");

  // 03. 취약개념 군집 (k-means)
  await page.click('button[data-view="cluster"]');
  await page.waitForTimeout(300);
  await page.click("#runCluster");
  await page.waitForTimeout(500);
  await shot("03-cluster-kmeans");

  // 04. 학급 비교·추세 차트
  await page.click('button[data-view="compare"]');
  await page.waitForTimeout(800);
  await shot("04-class-compare");

  // 05. AIDT 로그 연동 — API Pull(mock) → 파싱·인입
  await page.click('button[data-view="ingest"]');
  await page.waitForTimeout(300);
  await page.click("#pullApi");
  await page.waitForTimeout(400);
  await page.click("#ingestLog");
  await page.waitForTimeout(600);
  await shot("05-aidt-ingest");

  // 06. CSV 내보내기 후 로그 (외부 통합 2건 중 파일 출력)
  await page.click("#exportIngestCsv");
  await page.waitForTimeout(400);
  await shot("06-aidt-csv-export");

  // 07. 맞춤 과제 추천 + 배포
  await page.click('button[data-view="recommend"]');
  await page.waitForTimeout(300);
  await page.click("#genRecommend");
  await page.waitForTimeout(400);
  const addBtns = await page.$$(".addDist");
  for (let i = 0; i < Math.min(4, addBtns.length); i++) await addBtns[i].click();
  await page.waitForTimeout(200);
  await page.click("#distributeAll");
  await page.waitForTimeout(400);
  await shot("07-recommend-distribute");

  // 08. 리포트 + 알림톡 발송(mock)
  await page.click('button[data-view="report"]');
  await page.waitForTimeout(300);
  await page.click("#buildReport");
  await page.waitForTimeout(500);
  await page.click("#sendAlim");
  await page.waitForTimeout(300);
  // 미동의 학생 케이스도 발송 시도 (제외 로그 확인) — 동의자 인덱스 0 이미 발송, 다음 학생 선택
  await page.selectOption("#reportStudent", { index: 5 }).catch(() => {});
  await page.waitForTimeout(200);
  await page.click("#buildReport");
  await page.waitForTimeout(300);
  await page.click("#sendAlim");
  await page.waitForTimeout(400);
  await shot("08-report-alimtalk");

  // 09. 개인정보·동의 (가명 OFF 상태 — 실명/외부ID)
  await page.click('button[data-view="privacy"]');
  await page.waitForTimeout(400);
  await shot("09-privacy-consent");

  // 10. 가명처리 적용 후 (분석 화면 마스킹)
  await page.click("#pseudoToggle");
  await page.waitForTimeout(400);
  await shot("10-pseudonymized");

  // 11. 워크플로 B (로그인입→군집→경보) 완주 화면
  await page.click("#pseudoToggle"); // 가명 해제(이후 화면 가독)
  await page.click('button[data-view="workflow"]');
  await page.waitForTimeout(300);
  await page.selectOption("#wfPick", "B");
  await page.waitForTimeout(300);
  await page.click("#wfNext"); // -> step1 군집
  await page.waitForTimeout(300);
  const runC = await page.$("#wfRunCluster"); if (runC) await runC.click();
  await page.waitForTimeout(300);
  await page.click("#wfNext"); // -> step2 경보
  await page.waitForTimeout(400);
  await shot("11-workflow-b-alert");

  // 12. 워크플로 C (동의→가명→발송) 발송 단계
  await page.selectOption("#wfPick", "C");
  await page.waitForTimeout(300);
  await page.click("#wfNext"); // step1 가명
  await page.waitForTimeout(200);
  const ap = await page.$("#wfApplyPseudo"); if (ap) await ap.click();
  await page.waitForTimeout(200);
  await page.click("#wfNext"); // step2 발송
  await page.waitForTimeout(300);
  const sendAll = await page.$("#wfSendAll"); if (sendAll) await sendAll.click();
  await page.waitForTimeout(500);
  await shot("12-workflow-c-send");

  // 13. 관리자(학교 전체) 멀티테넌트 + 격리 검증
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("classlens_v2_state")); s.pseudoOn = false; localStorage.setItem("classlens_v2_state", JSON.stringify(s)); });
  await page.goto(APP);
  await page.waitForTimeout(900);
  await page.selectOption("#roleSelect", "admin");
  await page.waitForTimeout(400);
  await page.click('button[data-view="admin"]');
  await page.waitForTimeout(500);
  await shot("13-admin-multitenant");

  // 14. 상태 지속성: 새로고침 후 위험경보 유지(AIDT 인입분 포함)
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("classlens_v2_state")); s.role = "teacher"; s.currentTeacher = "t1"; s.currentClass = "c1"; localStorage.setItem("classlens_v2_state", JSON.stringify(s)); });
  await page.goto(APP);
  await page.waitForTimeout(900);
  await page.click('button[data-view="risk"]');
  await page.waitForTimeout(400);
  await shot("14-persistence-after-reload");

  await page.close();

  // ===== 모바일 (학부모) =====
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mshot = async (name) => { await m.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", name); };
  await m.goto(APP);
  await m.waitForTimeout(300);
  await m.evaluate(() => { const s = JSON.parse(localStorage.getItem("classlens_v2_state")) || {}; s.role = "parent"; s.parentTab = "home"; s.parentStudent = "c1_s0"; localStorage.setItem("classlens_v2_state", JSON.stringify(s)); });
  await m.goto(APP);
  await m.waitForTimeout(800);

  // 15. 학부모 모바일 홈
  await mshot("15-parent-mobile-home");

  // 16. 학부모 모바일 추세
  await m.click('button[data-ptab="trend"]');
  await m.waitForTimeout(600);
  await mshot("16-parent-mobile-trend");

  // 17. 학부모 모바일 동의 관리
  await m.click('button[data-ptab="consent"]');
  await m.waitForTimeout(400);
  await mshot("17-parent-mobile-consent");

  await m.close();
  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

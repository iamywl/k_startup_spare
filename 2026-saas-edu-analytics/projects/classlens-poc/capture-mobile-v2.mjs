// 클래스렌즈 v2 모바일(학부모 앱) 실 구동 캡처 — 390×844
// file:// 로 v2.html 로드 → 학부모 모바일 셸 4탭 + 상호작용 결과 캡처 → biz/captures/mobile/v2/ 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT = resolve(__dirname, "../../biz/captures/mobile/v2");
const KEY = "classlens_v2_state";

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const m = await ctx.newPage();
  m.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
  m.on("console", (msg) => { if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text()); });

  const shot = async (name) => { await m.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log("saved", name); };

  // 초기 로드 → 학부모 역할 + 알림톡 시드(알림 탭 백지 방지)
  await m.goto(APP);
  await m.evaluate(() => localStorage.clear());
  await m.goto(APP);
  await m.waitForTimeout(300);
  await m.evaluate(({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    s.role = "parent"; s.parentTab = "home"; s.parentStudent = "c1_s0";
    s.alimLog = [
      "✓ [클래스렌즈] 김민준 학생 5월 단원평가 리포트가 발송되었습니다. 평균 대비 추세를 확인해 주세요.",
      "⚠ [클래스렌즈] 김민준 학생 취약개념(분수의 덧셈) 보충 학습이 추천되었습니다.",
      "[클래스렌즈] 김민준 학생 4월 형성평가 결과 안내드립니다.",
    ];
    localStorage.setItem(KEY, JSON.stringify(s));
  }, { KEY });
  await m.goto(APP);
  await m.waitForTimeout(800);

  // 01. 학부모 홈 — 최근 성취·추세·취약개념·추천 학습
  await shot("01_학부모홈_성취요약");

  // 02. 추세 탭 — 성취 추세 차트 + 회차별 점수
  await m.click('button[data-ptab="trend"]');
  await m.waitForTimeout(700);
  await shot("02_추세_차트_회차별점수");

  // 03. 알림 탭 — 받은 알림톡(시드 3건)
  await m.click('button[data-ptab="alim"]');
  await m.waitForTimeout(400);
  await shot("03_알림톡_수신함");

  // 04. 동의 탭 — 개인정보 활용 동의 관리(현재 상태)
  await m.click('button[data-ptab="consent"]');
  await m.waitForTimeout(400);
  await shot("04_동의관리_현재상태");

  // 05. 동의 토글 결과 — 버튼 클릭 후 상태 전환 + 토스트
  await m.click("#pmConsentBtn");
  await m.waitForTimeout(500);
  await shot("05_동의토글_상태전환_토스트");

  // 06. 홈으로 복귀 — 하단 탭바 활성 표시 확인(전체 셸 가독)
  await m.click('button[data-ptab="home"]');
  await m.waitForTimeout(500);
  // 본문 하단까지 스크롤해 추천 학습 영역 노출
  await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await m.waitForTimeout(300);
  await shot("06_홈_추천학습_하단스크롤");

  await ctx.close();
  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

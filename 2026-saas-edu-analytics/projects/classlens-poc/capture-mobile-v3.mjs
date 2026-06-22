// 클래스렌즈 v3 모바일(학부모 앱) 실 구동 캡처 — 390×844
// file:// 로 v3.html 로드 → 학부모 모바일 셸 4탭 + 예약/예측 상호작용 캡처 → biz/captures/mobile/v3/ 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT = resolve(__dirname, "../../biz/captures/mobile/v3");
const KEY = "classlens_v3_state";

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

  // 초기 로드 → 학부모 역할 + 캠페인 알림 시드(알림 탭 백지 방지)
  await m.goto(APP);
  await m.evaluate(() => localStorage.clear());
  await m.goto(APP);
  await m.waitForTimeout(300);
  await m.evaluate(({ KEY }) => {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    s.role = "parent"; s.parentTab = "home"; s.parentStudent = "c1_s4"; s.pseudoOn = false;
    s.campLog = (s.campLog || []).concat([
      "✓ [클래스렌즈] 정우진 학부모님께 학기말 예측 리포트를 발송했습니다. (캠페인: 고위험군 케어)",
      "✓ [클래스렌즈] 정우진 학생 개입 경로(선수개념 보강)가 추천되었습니다.",
    ]);
    s.alimLog = (s.alimLog || []).concat([
      "⚠ [클래스렌즈] 정우진 학생 학업 위험확률이 상승했습니다. 상담 예약을 권장합니다.",
    ]);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, { KEY });
  await m.goto(APP);
  await m.waitForTimeout(800);

  // 01. 학부모 홈 — 최근 성취·취약개념·추천 가정학습(개입 경로)
  await shot("01_학부모홈_성취요약");

  // 02. 예측 탭 — 학기말 성취 예측·위험확률·추세 차트
  await m.click('button[data-ptab="predict"]');
  await m.waitForTimeout(700);
  await shot("02_예측_학기말성취_위험확률");

  // 03. 예약 탭 — 상담 예약 슬롯 목록(예약 전)
  await m.click('button[data-ptab="book"]');
  await m.waitForTimeout(400);
  await shot("03_상담예약_슬롯목록");

  // 04. 예약 확정 결과 — 슬롯 예약 클릭 후 '예약완료' + 토스트
  const pmb = await m.$(".pmBook");
  if (pmb) await pmb.click();
  await m.waitForTimeout(500);
  await shot("04_상담예약_확정_토스트");

  // 05. 알림 탭 — 받은 알림톡(캠페인+위험 알림 시드)
  await m.click('button[data-ptab="alim"]');
  await m.waitForTimeout(400);
  await shot("05_알림톡_수신함_캠페인");

  // 06. 예측 탭 차트 하단까지 스크롤 — 성취 추세(예측 점선 포함) 노출
  await m.click('button[data-ptab="predict"]');
  await m.waitForTimeout(600);
  await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await m.waitForTimeout(400);
  await shot("06_예측_추세차트_하단스크롤");

  await ctx.close();
  await browser.close();
  console.log("done");
};

run().catch((e) => { console.error(e); process.exit(1); });

// 가드레일 v1 — 실 구동 캡처 스크립트
// file:// 로드 → 시나리오 클릭 → biz/captures/ 에만 저장
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = "file://" + path.join(__dirname, "index.html");
const OUT = path.resolve(__dirname, "../../biz/captures");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await sleep(350);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("saved:", name);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // 깨끗한 상태에서 시작
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(400);

  // 01 — 워크플로 1단계 (프레임워크 선택)
  await page.getByRole("button", { name: /준비 워크플로/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /ISMS-P/ }).first().click();
  await shot(page, "v1_01_workflow_framework.png");

  // 02 — 통제 체크리스트 + 데모 시드 적용 (절반 충족)
  await page.getByRole("button", { name: /통제 체크리스트/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: /데모 시드/ }).click();
  await sleep(300);
  await shot(page, "v1_02_checklist_seeded.png");

  // 03 — 체크리스트 개별 토글 (특정 항목 충족 처리)
  // 첫 카테고리 첫 행의 "충족" 버튼 클릭
  const metButtons = page.getByRole("button", { name: "충족", exact: true });
  await metButtons.nth(0).click();
  await metButtons.nth(2).click();
  await sleep(300);
  await shot(page, "v1_03_checklist_toggle.png");

  // 04 — 증적 업로드 (실 파일 업로드 + 미리보기)
  await page.getByRole("button", { name: /증적 관리/ }).click();
  await sleep(300);
  // 가시성 있는 컬러 PNG를 브라우저 캔버스로 생성 (증적 스크린샷 시뮬레이션)
  const pngBase64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 320; c.height = 200;
    const x = c.getContext("2d");
    x.fillStyle = "#1e293b"; x.fillRect(0, 0, 320, 200);
    x.fillStyle = "#4f46e5"; x.fillRect(0, 0, 320, 36);
    x.fillStyle = "#ffffff"; x.font = "bold 15px sans-serif";
    x.fillText("접근권한 검토 결과 (콘솔 캡처)", 12, 24);
    x.fillStyle = "#e2e8f0"; x.font = "12px monospace";
    x.fillText("admin   | MFA: ON  | last: 2026-06-01", 14, 70);
    x.fillText("operator| MFA: ON  | last: 2026-06-05", 14, 96);
    x.fillText("guest   | DISABLED | revoked", 14, 122);
    x.fillStyle = "#22c55e"; x.fillRect(14, 150, 12, 12);
    x.fillStyle = "#cbd5e1"; x.fillText("검토 완료 / 이상 계정 없음", 34, 161);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.setInputFiles("#file", {
    name: "접근권한_검토결과.png",
    mimeType: "image/png",
    buffer: Buffer.from(pngBase64, "base64"),
  });
  await sleep(400);
  // 통제 항목 선택 (접근통제 계정관리)
  await page.selectOption("#ctrl", "2.5.1");
  await page.fill("#exp", "2026-12-31");
  await shot(page, "v1_04_evidence_preview.png");

  // 05 — 증적 등록 후 목록
  await page.getByRole("button", { name: /증적 등록/ }).click();
  await sleep(300);
  // 두번째 증적 추가 (텍스트성 파일)
  await page.setInputFiles("#file", {
    name: "정보보호정책_v1.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("정보보호 정책 문서 본문 ...", "utf-8"),
  });
  await sleep(300);
  await page.selectOption("#ctrl", "2.1.1");
  await page.getByRole("button", { name: /증적 등록/ }).click();
  await sleep(300);
  await shot(page, "v1_05_evidence_list.png");

  // 06 — 정책문서 생성 (조직 변수 저장 + 템플릿 생성)
  await page.getByRole("button", { name: /정책문서 생성/ }).click();
  await sleep(300);
  await page.fill("#oname", "주식회사 가드레일테크");
  await page.fill("#oresp", "정보보호최고책임자 김보안");
  await page.fill("#odate", "2026-07-01");
  await page.fill("#over", "1.0");
  await page.getByRole("button", { name: /조직 변수 저장/ }).click();
  await sleep(300);
  await page.getByRole("button", { name: "생성", exact: true }).first().click();
  await sleep(300);
  await page.getByRole("button", { name: "생성", exact: true }).nth(1).click();
  await sleep(300);
  await shot(page, "v1_06_policy_generated.png");

  // 07 — 갭분석 대시보드 (게이지 + 분류 막대 + 갭 테이블)
  await page.getByRole("button", { name: /갭분석 대시보드/ }).click();
  await sleep(400);
  await shot(page, "v1_07_dashboard.png");

  // 08 — 새로고침 후 상태 지속 검증 (localStorage 유지)
  await page.reload();
  await sleep(600);
  await shot(page, "v1_08_persistence_after_reload.png");

  await browser.close();
  console.log("DONE");
})();

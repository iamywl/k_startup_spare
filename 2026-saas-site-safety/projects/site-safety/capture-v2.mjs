// 세이프온 v2 실 구동 캡처 — file:// v2.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v2/ , 모바일 → biz/captures/mobile/v2/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v2.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v2");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v2");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function nav(page, view, isMobile) {
  // v2: 직접 go() 호출이 안정적 (RBAC·테넌트 상태가 얽혀 있어 클릭 경로보다 확실)
  await page.evaluate(v => go(v), view);
  await wait(page, 380);
}
const sign = async (page) => {
  const box = await page.$("#signpad");
  if (!box) return;
  const b = await box.boundingBox();
  await page.mouse.move(b.x + 20, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + 60, b.y + 30); await page.mouse.move(b.x + 100, b.y + b.height - 20);
  await page.mouse.move(b.x + 150, b.y + 40); await page.mouse.move(b.x + 200, b.y + b.height / 2);
  await page.mouse.up();
  await wait(page, 200);
};

async function drive(page, dir, isMobile) {
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto(APP); await page.evaluate(() => localStorage.clear());
  await page.goto(APP); await wait(page, 900);

  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  // 1) 본사 통합 대시보드 (HSE팀 역할 기본)
  await page.evaluate(() => { setRole("hsm"); }); await wait(page, 400);
  await nav(page, "hq", isMobile);
  await shot(page, dir, num() + "-hq-dashboard");

  if (isMobile) { await page.click("#bottomnav button:last-child"); await wait(page, 450); await shot(page, dir, num() + "-drawer");
    await page.evaluate(() => closeDrawer()); await wait(page, 350); }

  // 2) 중대재해 위험지수 (알고리즘 — 게이지·기여도분해·예측)
  await nav(page, "riskindex", isMobile);
  await shot(page, dir, num() + "-riskindex");
  // 위험지수 CSV 내보내기 → 로그 적재
  await page.evaluate(() => exportCsiCsv()); await wait(page, 300);
  // 고위험 현장으로 전환(수원=최고위험) 후 위험지수 재확인
  await page.evaluate(() => setSite("s2")); await wait(page, 400);
  await nav(page, "riskindex", isMobile);
  await shot(page, dir, num() + "-riskindex-high");

  // 3) 기상 위험경보 (외부 API mock — 수원은 폭염35+강풍13 경보)
  await nav(page, "weather", isMobile);
  await shot(page, dir, num() + "-weather");
  await page.evaluate(() => sendWeatherAlert()); await wait(page, 400);
  await shot(page, dir, num() + "-weather-sent");

  // 4) 현장 안전현황 (현장 단위 + 기상배너)
  await nav(page, "dashboard", isMobile);
  await shot(page, dir, num() + "-site-dashboard");

  // 5) 위험성평가 워크플로 (강북 현장으로 복귀)
  await page.evaluate(() => setSite("s1")); await wait(page, 300);
  await nav(page, "risk", isMobile);
  await page.evaluate(() => startRisk()); await wait(page, 350);
  await page.evaluate(() => rwNav(1)); await wait(page, 350);
  await shot(page, dir, num() + "-risk-assess");
  await page.evaluate(() => rwNav(1)); await wait(page, 250);
  await page.evaluate(() => { document.querySelectorAll("textarea").forEach(t => { t.value = "안전난간·개구부 덮개 설치, 안전대 부착설비 사용"; t.dispatchEvent(new Event("change")); }); });
  await wait(page, 250);
  await page.evaluate(() => rwNav(1)); await wait(page, 350);
  await shot(page, dir, num() + "-risk-review");
  await page.evaluate(() => rwFinish()); await wait(page, 500); // 고위험 → 알림톡 자동발송
  await shot(page, dir, num() + "-risk-done");

  // 6) TBM 워크플로 + 캔버스 서명
  await nav(page, "tbm", isMobile);
  await page.evaluate(() => startTbm()); await wait(page, 350);
  await page.evaluate(() => { document.querySelectorAll(".check-item input").forEach((c, i) => { if (i < 5) { c.checked = true; c.dispatchEvent(new Event("change")); } }); });
  await wait(page, 250);
  await shot(page, dir, num() + "-tbm-check");
  await page.evaluate(() => twNav(1)); await wait(page, 250);
  await page.evaluate(() => { const t = document.querySelector("textarea"); if (t) { t.value = "3층 개구부 단부 추락 — 안전난간·덮개 확인, 안전대 체결 후 작업"; t.dispatchEvent(new Event("change")); } });
  await page.evaluate(() => twNav(1)); await wait(page, 500);
  await page.fill("#signName", "김현장");
  await sign(page);
  await shot(page, dir, num() + "-tbm-sign");
  await page.evaluate(() => addSign()); await wait(page, 500);
  await page.evaluate(() => tbmFinish()); await wait(page, 500);

  // 7) 아차사고 신고 + 사진 (위험도 상 → 결재·알림톡)
  await nav(page, "incident", isMobile);
  await page.evaluate(() => startInc()); await wait(page, 350);
  await page.evaluate(() => { IW.severity = "상"; IW.where = "3층 동측 개구부"; });
  await shot(page, dir, num() + "-incident-type");
  await page.evaluate(() => iwNav(1)); await wait(page, 250);
  await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 200; c.height = 150; const x = c.getContext("2d");
    x.fillStyle = "#cfd6de"; x.fillRect(0, 0, 200, 150); x.fillStyle = "#e2601a"; x.fillRect(20, 90, 160, 18); x.fillStyle = "#1b2330"; x.font = "16px sans-serif"; x.fillText("현장사진 1", 40, 50);
    IW.photos.push(c.toDataURL("image/png"));
    document.getElementById("incPhotoGrid").innerHTML = IW.photos.map(p => `<img src="${p}">`).join("");
  });
  await wait(page, 250);
  await shot(page, dir, num() + "-incident-photo");
  await page.evaluate(() => iwNav(1)); await wait(page, 250);
  await page.evaluate(() => { IW.reporter = "이성호"; IW.desc = "개구부 덮개가 들려 있어 작업자가 발을 헛디딜 뻔함. 즉시 덮개 고정."; });
  await page.evaluate(() => incFinish()); await wait(page, 500);

  // 8) 안전교육 이수 (CSV 입출력 포함)
  await nav(page, "edu", isMobile);
  await shot(page, dir, num() + "-edu");
  await page.evaluate(() => exportEduCsv()); await wait(page, 300);

  // 9) 법정 안전서류
  await nav(page, "docs", isMobile);
  await shot(page, dir, num() + "-docs");

  // 10) 전자결재함 — HSE팀(안전관리자) 결재 → 소장 → 경영책임자 RBAC
  await nav(page, "approval", isMobile);
  await shot(page, dir, num() + "-approval");
  await page.evaluate(() => { const a = site().approvals.find(x => x.status === "진행"); if (a) approve(a.id); }); await wait(page, 400);
  // 현장소장으로 전환 후 2단계 결재
  await page.evaluate(() => setRole("manager")); await wait(page, 350);
  await nav(page, "approval", isMobile);
  await page.evaluate(() => { const a = site().approvals.find(x => x.status === "진행"); if (a) approve(a.id); }); await wait(page, 400);
  await shot(page, dir, num() + "-approval-rbac");

  // 11) 알림톡·외부 연동 로그 (HSE팀으로 복귀해 로그 열람)
  await page.evaluate(() => setRole("hsm")); await wait(page, 350);
  await nav(page, "notify", isMobile);
  await shot(page, dir, num() + "-notify-log");
  await page.evaluate(() => testKakao()); await wait(page, 400);
  await shot(page, dir, num() + "-notify-sent");

  // 12) 현장·연동 설정 (연동 스위치)
  await nav(page, "settings", isMobile);
  await shot(page, dir, num() + "-settings");

  // 13) RBAC: 원청(열람전용) 역할 — 본사 대시보드만, 잠긴 메뉴
  await page.evaluate(() => setRole("client")); await wait(page, 400);
  await nav(page, "hq", isMobile);
  await shot(page, dir, num() + "-role-client");
  if (!isMobile) {
    // PC: 사이드바 잠금 메뉴가 보이도록
    await shot(page, dir, num() + "-role-client-nav");
  }

  // 14) RBAC: 작업자 역할 — 현장현황(열람전용 아님, 제한 메뉴)
  await page.evaluate(() => setRole("worker")); await wait(page, 400);
  await nav(page, "dashboard", isMobile);
  await shot(page, dir, num() + "-role-worker");

  // 15) 상태 지속성: 새로고침 후 데이터 유지 (HSE팀·강북 위험지수)
  await page.evaluate(() => { setRole("hsm"); setSite("s1"); });
  await page.goto(APP); await wait(page, 900);
  await nav(page, "riskindex", isMobile);
  await shot(page, dir, num() + "-persist");

  console.log(isMobile ? "MOBILE" : "PC", "shots:", n, "pageerrors:", errs.length, errs.slice(0, 3));
}

const run = async () => {
  const browser = await chromium.launch();
  const pc = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await drive(await pc.newPage(), OUT_PC, false); await pc.close();
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await drive(await m.newPage(), OUT_M, true); await m.close();
  await browser.close(); console.log("done");
};
run().catch(e => { console.error(e); process.exit(1); });

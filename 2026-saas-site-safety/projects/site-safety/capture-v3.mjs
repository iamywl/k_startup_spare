// 세이프온 v3 실 구동 캡처 — file:// v3.html → PC(1280x900) + 모바일(390x844)
// PC → biz/captures/v3/ , 모바일 → biz/captures/mobile/v3/
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = "file://" + resolve(__dirname, "v3.html");
const OUT_PC = resolve(__dirname, "../../biz/captures/v3");
const OUT_M = resolve(__dirname, "../../biz/captures/mobile/v3");
mkdirSync(OUT_PC, { recursive: true });
mkdirSync(OUT_M, { recursive: true });

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (page, dir, name) =>
  page.screenshot({ path: `${dir}/${name}.png`, fullPage: false }).then(() => console.log("saved", name));

async function nav(page, view) {
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
  await page.goto(APP); await page.evaluate(() => { localStorage.clear(); });
  await page.goto(APP); await wait(page, 900);

  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  // 1) 본사 통합 대시보드 (HSE팀 기본)
  await page.evaluate(() => { setRole("hsm"); setSite("s1"); }); await wait(page, 400);
  await nav(page, "hq");
  await shot(page, dir, num() + "-hq-dashboard");

  if (isMobile) {
    await page.click("#bottomnav button:last-child"); await wait(page, 450);
    await shot(page, dir, num() + "-drawer");
    await page.evaluate(() => closeDrawer()); await wait(page, 350);
  }

  // 2) 중대재해 발생확률 (로지스틱) — 수원(최고위험)
  await page.evaluate(() => setSite("s2")); await wait(page, 350);
  await nav(page, "predict");
  await shot(page, dir, num() + "-predict-logistic");
  await page.evaluate(() => exportPredictCsv()); await wait(page, 300);
  // 고위험 에스컬레이션(지자체 신고 + 알림톡) — s2가 충분히 높지 않으면 로그만
  await page.evaluate(() => { const b=[...document.querySelectorAll('.btn.pri')].find(x=>/지자체/.test(x.textContent)); if(b) b.click(); }); await wait(page, 400);
  await shot(page, dir, num() + "-predict-escalate");

  // 3) 위험 핫스팟 군집 (K-means)
  await nav(page, "hotspot");
  await shot(page, dir, num() + "-hotspot-cluster");
  await page.evaluate(() => exportHotspotCsv()); await wait(page, 250);
  await page.evaluate(() => hotspotNotify()); await wait(page, 300);
  await shot(page, dir, num() + "-hotspot-notify");

  // 4) 중대재해 위험지수 CSI (v2 유지)
  await nav(page, "riskindex");
  await shot(page, dir, num() + "-riskindex");

  // 5) 기상 위험경보
  await nav(page, "weather");
  await shot(page, dir, num() + "-weather");

  // 6) 작업허가(PTW) 워크플로 — 강북 현장
  await page.evaluate(() => setSite("s1")); await wait(page, 300);
  await nav(page, "ptw");
  await shot(page, dir, num() + "-ptw-corr");
  await page.evaluate(() => startPtw()); await wait(page, 300);
  await page.evaluate(() => { PW.where = "5층 외부 비계"; pwNav(1); }); await wait(page, 300);
  await page.evaluate(() => { const ta = document.querySelector("textarea"); if (ta) { ta.value = "안전대 100% 체결·하부 출입통제·화기감시자 배치·소화기 비치"; ta.dispatchEvent(new Event("change")); } });
  await wait(page, 200);
  await shot(page, dir, num() + "-ptw-controls");
  await page.evaluate(() => pwNav(1)); await wait(page, 300);
  await page.evaluate(() => ptwFinish()); await wait(page, 400);
  await shot(page, dir, num() + "-ptw-issued");

  // 7) 위험성평가 (v2 유지, 고위험 → KOSHA 가능)
  await nav(page, "risk");
  await page.evaluate(() => startRisk()); await wait(page, 300);
  await page.evaluate(() => rwNav(1)); await wait(page, 300);
  await page.evaluate(() => rwNav(1)); await wait(page, 250);
  await page.evaluate(() => { document.querySelectorAll("textarea").forEach(t => { t.value = "안전난간·개구부 덮개 설치, 안전대 부착설비 사용"; t.dispatchEvent(new Event("change")); }); });
  await page.evaluate(() => rwNav(1)); await wait(page, 300);
  await shot(page, dir, num() + "-risk-review");
  await page.evaluate(() => rwFinish()); await wait(page, 500);

  // 8) TBM + 캔버스 서명
  await nav(page, "tbm");
  await page.evaluate(() => startTbm()); await wait(page, 300);
  await page.evaluate(() => { document.querySelectorAll(".check-item input").forEach((c, i) => { if (i < 5) { c.checked = true; c.dispatchEvent(new Event("change")); } }); });
  await wait(page, 200);
  await shot(page, dir, num() + "-tbm-check");
  await page.evaluate(() => twNav(1)); await wait(page, 250);
  await page.evaluate(() => { const t = document.querySelector("textarea"); if (t) { t.value = "3층 개구부 단부 추락 — 안전난간·덮개 확인"; t.dispatchEvent(new Event("change")); } });
  await page.evaluate(() => twNav(1)); await wait(page, 500);
  await page.fill("#signName", "김현장"); await sign(page);
  await shot(page, dir, num() + "-tbm-sign");
  await page.evaluate(() => addSign()); await wait(page, 400);
  await page.evaluate(() => tbmFinish()); await wait(page, 400);

  // 9) 아차사고 신고 + 사진 (위험도 상)
  await nav(page, "incident");
  await page.evaluate(() => startInc()); await wait(page, 300);
  await page.evaluate(() => { IW.severity = "상"; IW.where = "3층 동측 개구부"; });
  await page.evaluate(() => iwNav(1)); await wait(page, 250);
  await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 200; c.height = 150; const x = c.getContext("2d");
    x.fillStyle = "#cfd6de"; x.fillRect(0, 0, 200, 150); x.fillStyle = "#e2601a"; x.fillRect(20, 90, 160, 18);
    x.fillStyle = "#1b2330"; x.font = "16px sans-serif"; x.fillText("현장사진 1", 40, 50);
    IW.photos.push(c.toDataURL("image/png"));
    document.getElementById("incPhotoGrid").innerHTML = IW.photos.map(p => `<img src="${p}">`).join("");
  });
  await wait(page, 200);
  await shot(page, dir, num() + "-incident-photo");
  await page.evaluate(() => iwNav(1)); await wait(page, 250);
  await page.evaluate(() => { IW.reporter = "이성호"; IW.desc = "개구부 덮개가 들려 있어 발을 헛디딜 뻔함."; });
  await page.evaluate(() => incFinish()); await wait(page, 400);

  // 10) 교육효과 통계분석 (Welch t)
  await nav(page, "eduanalysis");
  await shot(page, dir, num() + "-edu-analysis");

  // 11) 안전교육 이수 (CSV)
  await nav(page, "edu");
  await shot(page, dir, num() + "-edu");
  await page.evaluate(() => exportEduCsv()); await wait(page, 250);

  // 12) 협력업체 안전 포털
  await nav(page, "partner");
  await shot(page, dir, num() + "-partner");
  await page.evaluate(() => partnerBroadcast()); await wait(page, 300);

  // 13) 지자체·산재 연동센터 (3종 mock)
  await nav(page, "gov");
  await page.evaluate(() => govReport()); await wait(page, 300);
  await page.evaluate(() => wcfReport()); await wait(page, 300);
  await page.evaluate(() => koshaSync()); await wait(page, 300);
  await nav(page, "gov");
  await shot(page, dir, num() + "-gov-hub");

  // 14) 법정 안전서류
  await nav(page, "docs");
  await shot(page, dir, num() + "-docs");

  // 15) 전자결재 4단계 RBAC — 협력사 → 안전관리자 → 소장 → 경영책임자
  await page.evaluate(() => setRole("subcon")); await wait(page, 350);
  await nav(page, "approval");
  await page.evaluate(() => { const a = site().approvals.find(x => x.status === "진행"); if (a) approve(a.id); }); await wait(page, 350);
  await page.evaluate(() => setRole("hsm")); await wait(page, 300);
  await nav(page, "approval");
  await page.evaluate(() => { const a = site().approvals.find(x => x.status === "진행"); if (a) approve(a.id); }); await wait(page, 350);
  await shot(page, dir, num() + "-approval-rbac");

  // 16) 알림톡·외부 연동 로그 (8채널)
  await nav(page, "notify");
  await shot(page, dir, num() + "-notify-log");

  // 17) 현장·연동 설정 (8종 연동 스위치)
  await nav(page, "settings");
  await shot(page, dir, num() + "-settings");

  // 18) 다국어 EN — 본사 대시보드
  await page.evaluate(() => setLang("en")); await wait(page, 400);
  await nav(page, "hq");
  await shot(page, dir, num() + "-en-hq");

  // 19) EN — 발생확률(로지스틱)
  await page.evaluate(() => setSite("s2")); await wait(page, 300);
  await nav(page, "predict");
  await shot(page, dir, num() + "-en-predict");

  // 20) EN — 핫스팟 군집
  await nav(page, "hotspot");
  await shot(page, dir, num() + "-en-hotspot");

  // 21) EN — TBM 워크플로(외국인 근로자 대응)
  await page.evaluate(() => setSite("s1")); await wait(page, 250);
  await nav(page, "tbm");
  await page.evaluate(() => startTbm()); await wait(page, 300);
  await shot(page, dir, num() + "-en-tbm");
  if (isMobile) {
    await page.click("#bottomnav button:last-child"); await wait(page, 400);
    await shot(page, dir, num() + "-en-drawer");
    await page.evaluate(() => closeDrawer()); await wait(page, 300);
  }

  // 22) KO 복귀 + RBAC 협력사 역할 화면(잠긴 메뉴)
  await page.evaluate(() => { setLang("ko"); setRole("subcon"); }); await wait(page, 400);
  await nav(page, "dashboard");
  await shot(page, dir, num() + "-role-subcon");

  // 23) RBAC 원청(열람전용) — 발생확률 열람
  await page.evaluate(() => setRole("client")); await wait(page, 400);
  await nav(page, "predict");
  await shot(page, dir, num() + "-role-client");

  // 24) 상태 지속성: 새로고침 후 데이터 유지
  await page.evaluate(() => { setRole("hsm"); setSite("s1"); });
  await page.goto(APP); await wait(page, 900);
  await nav(page, "ptw");
  await shot(page, dir, num() + "-persist");

  console.log(isMobile ? "MOBILE" : "PC", "shots:", n, "pageerrors:", errs.length, errs.slice(0, 4));
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

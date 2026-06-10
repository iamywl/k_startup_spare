// car-advisor v2 실 구동 캡처 → ../../biz/captures/v2 저장
// 실행: (루트에서) npm i playwright  →  node 2026-car-salary-advisor/projects/car-advisor/capture-v2.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL = "file://" + path.join(__dirname, "v2.html");
const OUT = path.resolve(__dirname, "../../biz/captures/v2");
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 980 } });
  const shot = async (n) => { await sleep(450); await pg.screenshot({ path: path.join(OUT, n + ".png") }); console.log("saved", n); };
  const click = async (t) => { const el = await pg.$(`text=${t}`); if (el) { await el.click().catch(() => {}); return true; } return false; };

  await pg.goto(URL, { waitUntil: "networkidle" }); await sleep(600);
  await shot("01_input");
  const sel = await pg.$("select"); if (sel) await sel.selectOption({ index: 1 }).catch(() => {});
  await click("가능해요"); await sleep(300);
  await click("내 차 찾기"); await sleep(900);
  await shot("02_results");
  await click("EV"); await sleep(700);
  await shot("03_ev_results_subsidy");
  const selz = await pg.$$("select"); if (selz.length) { await selz[selz.length - 1].selectOption({ label: "5년 TCO 낮은 순" }).catch(() => {}); await sleep(500); await shot("04_sort_tco"); }
  const card = await pg.$(".car-card");
  if (card) { await card.click(); await sleep(800); await shot("05_detail_subsidy_tco"); await pg.mouse.wheel(0, 500); await sleep(400); await shot("06_detail_scroll"); await click("비교함에 담기"); await sleep(300); const x = await pg.$("text=×"); if (x) { await x.click().catch(() => {}); await sleep(300); } }
  await click("체감 옵션으로 좁히기"); await sleep(300); await shot("07_filters");
  const cards = await pg.$$(".car-card"); if (cards[1]) { await cards[1].click(); await sleep(600); await click("비교함에 담기"); await sleep(300); const x2 = await pg.$("text=×"); if (x2) { await x2.click().catch(() => {}); await sleep(300); } }
  await click("비교함"); await sleep(700); await shot("08_compare_tco"); const xc = await pg.$("text=×"); if (xc) { await xc.click().catch(() => {}); await sleep(300); }
  await click("데이터 동기화"); await sleep(600); await shot("09_sync"); const xs = await pg.$("text=×"); if (xs) { await xs.click().catch(() => {}); await sleep(300); }
  await click("보조금 안내"); await sleep(600); await shot("10_subsidy_guide"); const xg = await pg.$("text=×"); if (xg) { await xg.click().catch(() => {}); await sleep(300); }
  await click("내 시나리오"); await sleep(600); await shot("11_profile");
  await b.close(); console.log("done");
})();

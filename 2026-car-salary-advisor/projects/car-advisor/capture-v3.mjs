// car-advisor v3 실 구동 캡처 → ../../biz/captures/v3
// 실행: (루트에서) npm i playwright  →  node 2026-car-salary-advisor/projects/car-advisor/capture-v3.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL = "file://" + path.join(__dirname, "v3.html");
const OUT = path.resolve(__dirname, "../../biz/captures/v3");
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 980 } });
  const shot = async (n) => { await sleep(450); await pg.screenshot({ path: path.join(OUT, n + ".png") }); console.log("saved", n); };
  const bs = async (re) => { const a = await pg.$$("button, a"); for (const el of a) { const t = (await el.innerText().catch(() => "")) || ""; if (re.test(t) && !/비교함/.test(t)) { await el.click().catch(() => {}); return t.trim(); } } return null; };

  await pg.goto(URL, { waitUntil: "networkidle" }); await sleep(700);
  await shot("01_input");
  await bs(/라이프|마법사/); await sleep(700); await shot("02_wizard");
  await bs(/이대로 적용|적용/); await sleep(500);
  const sel = await pg.$("select"); if (sel) await sel.selectOption({ index: 1 }).catch(() => {});
  await bs(/가능해요/); await bs(/내 차 찾기/); await sleep(1000);
  await shot("03_results");
  const sb = await pg.$('input[type="text"], input:not([type="number"])');
  if (sb) { await sb.fill("통풍 빼고"); await sleep(800); await shot("04_negation_search"); await sb.fill(""); await sleep(300); }
  await bs(/#캠핑차박/); await sleep(700); await shot("05_persona_popular"); await bs(/#캠핑차박/); await sleep(300);
  await bs(/^EV/); await sleep(500);
  const c = await pg.$(".car-card"); if (c) await c.click(); await sleep(800);
  await shot("06_detail_top");
  await pg.mouse.move(640, 500);
  await pg.mouse.wheel(0, 520); await sleep(350); await shot("07_detail_region_compare");
  await pg.mouse.wheel(0, 520); await sleep(350); await shot("08_detail_finance");
  for (let i = 0; i < 3; i++) { await pg.mouse.wheel(0, 420); await sleep(280); }
  await shot("09_detail_finance_methods");
  const x = await pg.$("text=×"); if (x) await x.click().catch(() => {}); await sleep(300);
  await bs(/카드|🖼/); await sleep(900); await shot("10_share_card");
  await b.close(); console.log("done");
})();

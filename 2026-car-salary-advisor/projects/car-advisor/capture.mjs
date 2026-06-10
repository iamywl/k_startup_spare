// car-advisor 실 구동 캡처 (file:// 로드 → 시나리오 → ../../biz/captures 저장)
// 실행: (workspace 루트에서) npm i playwright  →  node capture.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL = "file://" + path.join(__dirname, "index.html");
const OUT = path.resolve(__dirname, "../../biz/captures");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const shot = async (n) => { await sleep(400); await page.screenshot({ path: path.join(OUT, n + ".png") }); console.log("saved", n); };

  await page.goto(URL, { waitUntil: "networkidle" });
  await sleep(500);
  await shot("01_input");

  await page.click("text=내 차 찾기");
  await sleep(800);
  await shot("02_results");

  await page.click("text=#캠핑차박");
  await sleep(700);
  await shot("03_results_persona_camping");
  await page.click("text=#캠핑차박");
  await sleep(400);

  const sb = await page.$('input[type="text"], input:not([type="number"])');
  if (sb) { await sb.fill("엉따"); await sleep(700); await shot("04_search_eongtta"); await sb.fill(""); await sleep(300); }

  await page.click(".car-card");
  await sleep(700);
  await shot("05_detail");

  const add = await page.$("text=비교함에 담기"); if (add) { await add.click(); await sleep(400); }
  const x = await page.$("text=×"); if (x) { await x.click().catch(() => {}); await sleep(300); }
  const cards = await page.$$(".car-card");
  if (cards[1]) {
    await cards[1].click(); await sleep(500);
    const a2 = await page.$("text=비교함에 담기"); if (a2) { await a2.click(); await sleep(300); }
    const x2 = await page.$("text=×"); if (x2) { await x2.click().catch(() => {}); await sleep(300); }
  }
  await page.click("text=비교함").catch(() => {});
  await sleep(700);
  await shot("06_compare");

  await browser.close();
  console.log("done");
})();

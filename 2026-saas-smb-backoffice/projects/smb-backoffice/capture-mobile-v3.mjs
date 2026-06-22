import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = pathToFileURL(resolve(__dirname, 'v3.html')).href;
const OUT = resolve(__dirname, '../../biz/captures/mobile/v3');
mkdirSync(OUT, { recursive: true });

const errors = [];
const shot = async (page, name) => { await page.screenshot({ path: resolve(OUT, name) }); console.log('saved', name); };

const bottomGo = async (m, v) => { await m.click(`#bottomnav [data-view="${v}"]`); await m.waitForTimeout(350); };
const moreGo = async (m, v) => {
  await m.click('#moreBtn');
  await m.waitForSelector('#moreSheet [data-goto]');
  await m.click(`#moreSheet [data-goto="${v}"]`);
  await m.waitForTimeout(350);
};

const run = async () => {
  const browser = await chromium.launch();
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errors.push('pageerror: ' + e.message));
  m.on('console', x => { if (x.type() === 'error') errors.push('console.error: ' + x.text()); });

  await m.goto(APP_URL);
  await m.evaluate(() => localStorage.clear());
  await m.reload();
  await m.waitForSelector('#bottomnav button');
  await m.waitForTimeout(400);

  // 01 분석 대시보드 (인건비 추세 + 4대보험 부담)
  await shot(m, '01_분석_대시보드.png');

  // 02 전자세금계산서 — 입력/자동세액 폼
  await bottomGo(m, 'tax');
  await shot(m, '02_전자세금계산서_입력.png');

  // 03 전자세금계산서 발급 → 국세청 API mock 응답
  await m.fill('#tx-supply', '7000000').catch(()=>{});
  await m.click('#tx-issue').catch(()=>{});
  await m.waitForTimeout(900);
  await shot(m, '03_세금계산서_API발급.png');

  // 04 급여 · 펌뱅킹 CSV 생성
  await bottomGo(m, 'payroll');
  await m.click('#csv-firmbank').catch(()=>{});
  await m.waitForTimeout(500);
  await shot(m, '04_급여_펌뱅킹CSV.png');

  // 05 연차·근태 자동 정산
  await bottomGo(m, 'leave');
  await m.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
  await m.waitForTimeout(250);
  await shot(m, '05_연차_근태정산.png');

  // 06 노무사 자문 챗 고도화 (근거 조항 + 후속질문)
  await bottomGo(m, 'advisor');
  await m.click('.chat-quick[data-q="임금체불"]').catch(()=>{});
  await m.waitForTimeout(300);
  await m.click('.chat-quick[data-q="육아휴직"]').catch(()=>{});
  await m.waitForTimeout(300);
  await shot(m, '06_노무사_챗_고도화.png');

  // 07 다중회사 통합 콘솔 (더보기 시트 경유)
  await moreGo(m, 'console');
  await shot(m, '07_다중회사_콘솔.png');

  // 08 감사 로그 (오너 전용 — 세금계산서/CSV 활동 기록)
  await moreGo(m, 'audit');
  await shot(m, '08_감사로그.png');

  await m.close();
  await browser.close();

  console.log('\n=== VERIFICATION (mobile v3) ===');
  console.log('page errors:', errors.length ? errors : 'none');
};

run().catch(e => { console.error(e); process.exit(1); });

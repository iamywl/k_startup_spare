import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = pathToFileURL(resolve(__dirname, 'index.html')).href;
const OUT = resolve(__dirname, '../../biz/captures/mobile/v1');
mkdirSync(OUT, { recursive: true });

const errors = [];
const shot = async (page, name) => { await page.screenshot({ path: resolve(OUT, name) }); console.log('saved', name); };

// 모바일: bottomnav 직접 메뉴는 [data-view], 그 외 메뉴는 '더보기' 시트의 [data-goto] 사용
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

  // 01 대시보드 + 하단 내비
  await shot(m, '01_대시보드.png');

  // 02 전자계약 목록
  await bottomGo(m, 'contract');
  await shot(m, '02_전자계약_목록.png');

  // 03 더보기 시트 — 전체 메뉴 접근(좁은 화면 사이드바 대체)
  await m.click('#moreBtn');
  await m.waitForSelector('#moreSheet [data-goto]');
  await m.waitForTimeout(250);
  await shot(m, '03_더보기_전체메뉴.png');
  await m.click('#moreSheet [data-goto="workflow"]');
  await m.waitForTimeout(350);

  // 04 계약 워크플로 step2 — 템플릿 선택 → 직원 변수 작성
  await m.click('[data-tpl="근로계약서"]').catch(()=>{});
  await m.waitForSelector('#wf-employee', { timeout: 4000 }).catch(()=>{});
  await m.waitForTimeout(300);
  await shot(m, '04_워크플로_작성.png');

  // 05 워크플로 step4 — 캔버스 전자서명
  await m.click('[data-next]').catch(()=>{});       // step3 PDF 미리보기
  await m.waitForSelector('#pdf-iframe', { timeout: 6000 }).catch(()=>{});
  await m.waitForTimeout(1200);
  await m.click('[data-next]').catch(()=>{});       // step4 서명·발송
  await m.waitForSelector('#sig', { timeout: 4000 }).catch(()=>{});
  const box = await m.locator('#sig').boundingBox().catch(()=>null);
  if (box) {
    await m.mouse.move(box.x + 40, box.y + 55); await m.mouse.down();
    for (let i = 0; i <= 34; i++) { await m.mouse.move(box.x + 40 + i * 7, box.y + 55 + Math.sin(i / 3) * 24); }
    await m.mouse.up();
    await m.click('#sig-save').catch(()=>{});
    await m.waitForTimeout(500);
  }
  await shot(m, '05_워크플로_서명.png');

  // 06 급여 — 4대보험 자동계산 + 요율 패널 펼침
  await bottomGo(m, 'payroll');
  await m.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
  await m.waitForTimeout(250);
  await shot(m, '06_급여_4대보험.png');

  // 07 직원 관리 — 추가 모달(폼 입력 상태)
  await bottomGo(m, 'employees');
  await m.click('#emp-add').catch(()=>{});
  await m.waitForTimeout(250);
  await m.fill('#ef-name', '한지민').catch(()=>{});
  await m.fill('#ef-dept', '재무').catch(()=>{});
  await m.fill('#ef-salary', '3600000').catch(()=>{});
  await shot(m, '07_직원_추가모달.png');
  await m.keyboard.press('Escape').catch(()=>{});
  await m.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d=>d.close()); }).catch(()=>{});
  await m.waitForTimeout(200);

  // 08 근태 현황
  await moreGo(m, 'attendance');
  await shot(m, '08_근태.png');

  // 09 알림톡 발송 로그
  await moreGo(m, 'kakao');
  await shot(m, '09_알림톡_로그.png');

  await m.close();
  await browser.close();

  console.log('\n=== VERIFICATION (mobile v1) ===');
  console.log('page errors:', errors.length ? errors : 'none');
};

run().catch(e => { console.error(e); process.exit(1); });

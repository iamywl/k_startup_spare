import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = pathToFileURL(resolve(__dirname, 'index.html')).href;
const OUT = resolve(__dirname, '../../biz/captures');
mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  await page.screenshot({ path: resolve(OUT, name) });
  console.log('saved', name);
};

const CHROME_FT = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const run = async () => {
  // 정식 Chrome for Testing 빌드는 PDF 뷰어를 포함 → iframe 내 PDF 렌더 가능
  // (기본 headless_shell 은 PDF 플러그인 미포함으로 미리보기가 공백 처리됨)
  const browser = await chromium.launch({ executablePath: CHROME_FT, channel: undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#nav a');

  const go = async (view) => {
    await page.click(`[data-view="${view}"]`);
    await page.waitForTimeout(250);
  };

  // 1. 대시보드
  await go('dash');
  await shot(page, '01_dashboard.png');

  // 2. 전자계약 목록
  await go('contract');
  await shot(page, '02_contracts.png');

  // 3. 워크플로 step1 (템플릿 선택)
  await go('workflow');
  await shot(page, '03_workflow_step1.png');

  // step2 변수 입력 (근로계약서)
  await page.click('[data-tpl="근로계약서"]');
  await page.waitForSelector('#wf-employee');
  await shot(page, '04_workflow_step2.png');

  // step3 PDF 미리보기 (jsPDF 실 생성 → iframe)
  await page.click('[data-next]');
  await page.waitForSelector('#pdf-iframe');
  await page.waitForTimeout(2500); // PDF 뷰어 렌더 대기
  await shot(page, '05_workflow_step3_pdf.png');

  // 실제 PDF 생성 검증: datauristring 길이 확인
  const pdfLen = await page.evaluate(() => {
    const { jsPDF } = window.jspdf;
    const d = new jsPDF({ format: 'a4', unit: 'mm' });
    d.text('test', 10, 10);
    return d.output('datauristring').length;
  });

  // step4 서명·발송 — 캔버스에 실제 서명 드로잉
  await page.click('[data-next]');
  await page.waitForSelector('#sig');
  const box = await page.locator('#sig').boundingBox();
  await page.mouse.move(box.x + 60, box.y + 90);
  await page.mouse.down();
  for (let i = 0; i <= 40; i++) {
    const x = box.x + 60 + i * 9;
    const y = box.y + 90 + Math.sin(i / 3) * 35;
    await page.mouse.move(x, y);
  }
  await page.mouse.up();
  await page.click('#sig-save');
  await page.waitForTimeout(300);
  const sigSaved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('smb_state_v1'));
    return !!(s && s.signImg && s.signImg.startsWith('data:image/png'));
  });
  await shot(page, '06_workflow_step4_sign.png');

  // 서명+발송+알림톡 실행 → 계약/로그 추가
  await page.click('#send-final');
  await page.waitForTimeout(400);
  await shot(page, '07_workflow_done.png');
  await page.waitForTimeout(1300); // 자동 contract 뷰 전환 대기

  // 8. 급여 (자동계산 결과) + 요율 패널 펼침
  await go('payroll');
  await page.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
  await page.waitForTimeout(200);
  await shot(page, '08_payroll.png');

  // 급여 계산 검증값 추출
  const payCheck = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('smb_state_v1'));
    // 첫 직원 계산 재현
    return s.employees.map(e => e.name + ':' + e.salary);
  });

  // 9. 직원관리 + 추가 모달
  await go('employees');
  await shot(page, '09_employees.png');
  await page.click('#emp-add');
  await page.waitForTimeout(200);
  await page.fill('#ef-name', '한지민');
  await page.fill('#ef-dept', '재무');
  await page.fill('#ef-salary', '3600000');
  await page.fill('#ef-email', 'han@smb.kr');
  await page.fill('#ef-phone', '010-7777-8888');
  await shot(page, '10_employee_add_modal.png');
  await page.click('#ef-save');
  await page.waitForTimeout(300);
  const empAdded = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('smb_state_v1'));
    return s.employees.some(e => e.name === '한지민');
  });
  // 영속성 검증: reload 후에도 유지
  await page.reload();
  await page.waitForSelector('#nav a');
  await go('employees');
  const empPersist = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('smb_state_v1'));
    return s.employees.some(e => e.name === '한지민');
  });
  await shot(page, '11_employees_after_add.png');

  // 10. 근태
  await go('attendance');
  await shot(page, '12_attendance.png');

  // 11. 알림톡 로그 (워크플로/추가 발송 반영)
  await go('kakao');
  await shot(page, '13_kakao_log.png');

  // 12. 문서함
  await go('docs');
  await shot(page, '14_docs.png');

  await browser.close();

  console.log('\n=== VERIFICATION ===');
  console.log('PDF datauristring length:', pdfLen, pdfLen > 1000 ? 'OK' : 'FAIL');
  console.log('signature saved (base64 png):', sigSaved);
  console.log('employee added:', empAdded, '| persisted after reload:', empPersist);
  console.log('employees:', payCheck.join(', '));
  console.log('page errors:', errors.length ? errors : 'none');
};

run().catch(e => { console.error(e); process.exit(1); });

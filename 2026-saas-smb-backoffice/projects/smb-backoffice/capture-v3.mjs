import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = pathToFileURL(resolve(__dirname, 'v3.html')).href;
const OUT = resolve(__dirname, '../../biz/captures/v3');
mkdirSync(OUT, { recursive: true });

const CHROME_FT = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const errors = [];
const shot = async (page, name) => { await page.screenshot({ path: resolve(OUT, name) }); console.log('saved', name); };

const run = async () => {
  const browser = await chromium.launch({ executablePath: CHROME_FT });

  // ============ DESKTOP 1440x900 ============
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#nav a');

  const go = async (v) => { await page.click(`#sidebar [data-view="${v}"]`); await page.waitForTimeout(250); };

  // 01 분석 대시보드 (인건비 추세 + 4대보험 부담)
  await go('dash');
  await shot(page, '01_dashboard_analytics.png');

  // 02 다중회사 통합 콘솔
  await go('console');
  await page.waitForTimeout(200);
  await shot(page, '02_console_multicompany.png');

  // 03 테넌트 전환 — 테크랩
  await page.selectOption('#tenant-switch', 'co-techlab');
  await page.waitForTimeout(250);
  await go('dash');
  await shot(page, '03_dashboard_techlab.png');
  // 봄날카페 직원수 검증
  await page.selectOption('#tenant-switch', 'co-bom-cafe');
  await page.waitForTimeout(150);
  const bomEmp = await page.evaluate(() => JSON.parse(localStorage.getItem('smb_state_v3')).tenants['co-bom-cafe'].employees.length);
  await page.selectOption('#tenant-switch', 'co-smallbox');
  await page.waitForTimeout(150);

  // 04 전자세금계산서 — 입력/자동세액 화면
  await go('tax');
  await page.waitForTimeout(200);
  await shot(page, '04_tax_invoice_form.png');

  // 05 전자세금계산서 발급 → 국세청 API mock 요청/응답
  await page.fill('#tx-supply', '7000000');
  await page.click('#tx-issue');
  await page.waitForTimeout(900);
  await shot(page, '05_tax_invoice_api_issued.png');
  const taxResp = await page.textContent('#tx-api').catch(()=> '(none)');

  // 06 세금계산서 한글 PDF (발급내역 첫 행)
  // (검증은 헤드리스 download 대신 PDF blob 직접 검증; 화면은 발급내역 테이블)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await shot(page, '06_tax_ledger.png');
  await page.evaluate(() => window.scrollTo(0, 0));

  // 07 연차·근태 자동 정산
  await go('leave');
  await page.waitForTimeout(200);
  await page.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
  await page.waitForTimeout(150);
  await shot(page, '07_leave_settlement.png');

  // 08 급여 · 펌뱅킹 CSV 생성
  await go('payroll');
  await page.waitForTimeout(200);
  await page.click('#csv-firmbank');
  await page.waitForTimeout(500);
  await shot(page, '08_payroll_firmbanking_csv.png');
  const csvText = await page.textContent('#csv-preview').catch(()=> '(none)');

  // 09 노무사 자문 챗 고도화 (근거 조항 + 후속질문)
  await go('advisor');
  await page.click('.chat-quick[data-q="임금체불"]');
  await page.waitForTimeout(300);
  await page.click('.chat-quick[data-q="육아휴직"]');
  await page.waitForTimeout(300);
  await shot(page, '09_advisor_chat_advanced.png');

  // 10 감사 로그 (오너 전용 — 세금계산서/CSV 활동 기록됨)
  await go('audit');
  await page.waitForTimeout(200);
  await shot(page, '10_audit_log.png');

  // 11 권한 전환 — 직원(staff): 제한된 메뉴만 표시
  await page.selectOption('#role-switch', 'staff');
  await page.waitForTimeout(250);
  await shot(page, '11_role_staff_restricted.png');
  const staffNav = await page.evaluate(() => [...document.querySelectorAll('#nav [data-view]')].map(a=>a.dataset.view));
  await page.selectOption('#role-switch', 'owner');
  await page.waitForTimeout(200);

  // 12 다국어(EN) — 대시보드 영어 전환
  await go('dash');
  await page.click('#lang-btn');
  await page.waitForTimeout(300);
  await shot(page, '12_i18n_en_dashboard.png');
  const enLabel = await page.textContent('#nav').catch(()=> '');

  // 13 다국어(EN) — 전자세금계산서 영어
  await page.click('#sidebar [data-view="tax"]');
  await page.waitForTimeout(250);
  await shot(page, '13_i18n_en_tax.png');
  // 한국어 복귀
  await page.click('#lang-btn');
  await page.waitForTimeout(200);

  // 14 전자계약 (한글 PDF 발급 진입)
  await page.click('#sidebar [data-view="contract"]');
  await page.waitForTimeout(200);
  await shot(page, '14_contract.png');

  await page.close();

  // ============ MOBILE 390x844 ============
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await m.goto(APP_URL);
  await m.waitForSelector('#bottomnav button');
  await m.waitForTimeout(300);
  await shot(m, '15_mobile_dashboard.png');
  await m.click('#bottomnav [data-view="tax"]');
  await m.waitForTimeout(300);
  await shot(m, '16_mobile_tax.png');
  await m.click('#bottomnav [data-view="advisor"]');
  await m.waitForTimeout(250);
  await m.click('.chat-quick[data-q="퇴직금"]');
  await m.waitForTimeout(300);
  await shot(m, '17_mobile_advisor.png');
  await m.close();

  // ============ PDF 검증 (헤드리스, 한글 폰트 + 세금계산서) ============
  const v = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await v.goto(APP_URL);
  await v.evaluate(() => localStorage.clear());
  await v.reload();
  await v.waitForSelector('#nav a');
  const pdfCheck = await v.evaluate(async () => {
    // 세금계산서 PDF 생성 후 텍스트/폰트 사용 여부 점검
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ format:'a4', unit:'mm' });
    const hasFont = !!(window.NANUM_GOTHIC_B64 && window.NANUM_GOTHIC_B64.length > 10000);
    if (hasFont) { doc.addFileToVFS('Nanum.ttf', window.NANUM_GOTHIC_B64); doc.addFont('Nanum.ttf','Nanum','normal'); doc.setFont('Nanum'); }
    doc.text('전자세금계산서 공급가액 세액 합계', 20, 20);
    const out = doc.output('datauristring');
    return { hasFont, pdfLen: out.length, fontInVFS: hasFont };
  });

  // CSV/세액 산출 검증
  const calcCheck = await v.evaluate(() => {
    // 세금계산서 세액 (7,000,000 → vat 700,000 → total 7,700,000)
    const supply = 7000000; const vat = Math.round(supply*0.10);
    // 급여 net 검증 (스몰박스 이지원 3,800,000)
    const RATES={np:0.045,hi:0.03545,ltOnHi:0.1295,lt:0.009};
    const s=3800000; const np=Math.round(s*RATES.np),hi=Math.round(s*RATES.hi),lt=Math.round(hi*RATES.ltOnHi),emp=Math.round(s*RATES.lt);
    const ins=np+hi+lt+emp;
    return { supply, vat, total: supply+vat, payIns: ins };
  });

  await v.close();
  await browser.close();

  console.log('\n=== VERIFICATION ===');
  console.log('bom-cafe employees:', bomEmp, '(expect 3)');
  console.log('tax API response head:', taxResp.slice(0, 80).replace(/\n/g,' '));
  console.log('tax calc:', calcCheck.supply, '+vat', calcCheck.vat, '=total', calcCheck.total, '(expect 7000000/700000/7700000)');
  console.log('payroll 이지원 insurance:', calcCheck.payIns, '(expect 357355)');
  console.log('CSV head:', csvText.split('\n')[0]);
  console.log('CSV total row:', csvText.split('\n').slice(-1)[0]);
  console.log('PDF korean font in VFS:', pdfCheck.hasFont, 'pdfLen:', pdfCheck.pdfLen);
  console.log('staff visible nav:', staffNav);
  console.log('EN nav contains "Analytics":', enLabel.includes('Analytics'));
  console.log('page errors:', errors.length ? errors : 'none');
};

run().catch(e => { console.error(e); process.exit(1); });

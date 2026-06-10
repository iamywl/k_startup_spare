import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = pathToFileURL(resolve(__dirname, 'v2.html')).href;
const OUT = resolve(__dirname, '../../biz/captures/v2');
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

  // 01 대시보드 (스몰박스)
  await go('dash');
  await shot(page, '01_dashboard.png');

  // 02 테넌트 스위처 — 테크랩으로 전환 후 대시보드 (직원 5명)
  await page.selectOption('#tenant-switch', 'co-techlab');
  await page.waitForTimeout(300);
  await shot(page, '02_tenant_switch_techlab.png');
  // 봄날카페로도 전환 검증
  await page.selectOption('#tenant-switch', 'co-bom-cafe');
  await page.waitForTimeout(200);
  const bomEmp = await page.evaluate(() => JSON.parse(localStorage.getItem('smb_state_v2')).tenants['co-bom-cafe'].employees.length);
  // 다시 스몰박스
  await page.selectOption('#tenant-switch', 'co-smallbox');
  await page.waitForTimeout(200);

  // 03 전자계약 목록 (QR/한글PDF/ICS 버튼)
  await go('contract');
  await shot(page, '03_contracts_list.png');

  // 04 QR 모달 (완료 계약)
  await page.click('[data-qr="C-2024-01"]');
  await page.waitForTimeout(400);
  await shot(page, '04_contract_qr_modal.png');
  await page.evaluate(() => document.getElementById('qr-dlg').close());

  // 워크플로 → 한글 PDF
  await go('workflow');
  await page.click('[data-tpl="근로계약서"]');
  await page.waitForSelector('#wf-employee');
  await page.click('[data-next]');                 // step3
  await page.waitForSelector('#pdf-iframe');
  await page.waitForTimeout(3500);                 // 폰트 로드 + PDF 렌더
  // 05 한글 PDF 미리보기
  await shot(page, '05_workflow_korean_pdf.png');

  // 폰트 모드 확인
  const fontStatus = await page.textContent('#font-status').catch(()=>'(none)');

  // step4 서명 + QR 생성
  await page.click('[data-next]');
  await page.waitForSelector('#sig');
  const box = await page.locator('#sig').boundingBox();
  await page.mouse.move(box.x + 60, box.y + 90); await page.mouse.down();
  for (let i = 0; i <= 40; i++) { await page.mouse.move(box.x + 60 + i * 9, box.y + 90 + Math.sin(i / 3) * 35); }
  await page.mouse.up();
  await page.click('#sig-save');
  await page.waitForTimeout(500);
  // 06 서명 + QR 생성
  await shot(page, '06_workflow_sign_qr.png');

  // 발송 (알림톡 mock API 흐름)
  await page.click('#send-final');
  await page.waitForTimeout(900);
  // 07 알림톡 mock API 요청/응답 로그
  await shot(page, '07_workflow_kakao_api.png');

  // 08 QR 검증 페이지 — 유효 토큰
  await go('verify');
  await page.click('.vf-quick');                   // 첫 토큰 클릭 (C-2024-01)
  await page.waitForTimeout(400);
  await shot(page, '08_verify_valid.png');

  // 09 QR 검증 — 위변조 실패
  await page.fill('#vf-in', 'C-2024-01:deadbeefdeadbeef');
  await page.click('#vf-go');
  await page.waitForTimeout(300);
  await shot(page, '09_verify_tampered.png');

  // 10 급여 (누진 계산 + 요율 패널)
  await go('payroll');
  await page.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
  await page.waitForTimeout(200);
  await shot(page, '10_payroll.png');

  // 급여 검증값
  const payCheck = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('smb_state_v2'));
    const e = s.tenants['co-smallbox'].employees.find(x=>x.name==='이지원');
    // 재계산
    const RATES={np:0.045,hi:0.03545,ltOnHi:0.1295,lt:0.009};
    const np=Math.round(e.salary*RATES.np),hi=Math.round(e.salary*RATES.hi),lt=Math.round(hi*RATES.ltOnHi),emp=Math.round(e.salary*RATES.lt);
    return { salary:e.salary, ins:np+hi+lt+emp };
  });

  // 11 직원 관리 + 추가 모달
  await go('employees');
  await page.click('#emp-add');
  await page.waitForTimeout(200);
  await page.fill('#ef-name', '한지민');
  await page.fill('#ef-dept', '재무');
  await page.fill('#ef-salary', '3600000');
  await page.fill('#ef-email', 'han@smb.kr');
  await page.fill('#ef-phone', '010-7777-8888');
  await shot(page, '11_employee_add_modal.png');
  await page.click('#ef-save');
  await page.waitForTimeout(300);
  // 영속 검증
  await page.reload(); await page.waitForSelector('#nav a'); await go('employees');
  const empPersist = await page.evaluate(() => JSON.parse(localStorage.getItem('smb_state_v2')).tenants['co-smallbox'].employees.some(e=>e.name==='한지민'));
  await shot(page, '12_employees_after_add.png');

  // 13 직원 대시보드 (개인 포털)
  await go('portal');
  await page.waitForTimeout(300);
  await shot(page, '13_employee_portal.png');

  // 14 직원 포털 — 미서명 계약 전자서명
  await page.selectOption('#portal-emp', { label: '정나연 (디자인)' }).catch(()=>{});
  await page.waitForTimeout(300);
  const hasSign = await page.locator('[data-portal-sign]').count();
  if (hasSign) {
    await page.click('[data-portal-sign]');
    await page.waitForTimeout(300);
    const pb = await page.locator('#psig').boundingBox();
    if (pb) {
      await page.mouse.move(pb.x + 40, pb.y + 60); await page.mouse.down();
      for (let i = 0; i <= 30; i++) { await page.mouse.move(pb.x + 40 + i * 10, pb.y + 60 + Math.sin(i / 2.5) * 25); }
      await page.mouse.up();
    }
    await shot(page, '14_portal_sign.png');
    await page.click('#psig-save');
    await page.waitForTimeout(300);
  } else {
    await shot(page, '14_portal_sign.png');
  }

  // 15 노무사 자문 챗
  await go('advisor');
  await page.click('.chat-quick[data-q="연차 며칠"]');
  await page.waitForTimeout(300);
  await page.click('.chat-quick[data-q="최저임금"]');
  await page.waitForTimeout(300);
  await page.fill('#chat-in', '수습기간 임금 감액 가능한가요?');
  await page.click('#chat-send');
  await page.waitForTimeout(400);
  await shot(page, '15_advisor_chat.png');

  // 16 알림톡 발송 페이지 + mock API 로그
  await go('kakao');
  await page.click('#kakao-test');
  await page.waitForTimeout(700);
  await shot(page, '16_kakao_api_log.png');

  // 17 근태·캘린더 (ICS export 버튼)
  await go('attendance');
  await shot(page, '17_attendance_ics.png');

  // 18 문서함
  await go('docs');
  await shot(page, '18_docs.png');

  await page.close();

  // ============ MOBILE 390x844 (Bottom Nav) ============
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await m.goto(APP_URL);
  await m.waitForSelector('#bottomnav button');
  await m.waitForTimeout(300);
  // 19 모바일 대시보드 + Bottom Nav
  await shot(m, '19_mobile_dashboard.png');
  // 20 모바일 노무사 챗 via Bottom Nav
  await m.click('#bottomnav [data-view="advisor"]');
  await m.waitForTimeout(300);
  await m.click('.chat-quick[data-q="주휴수당"]');
  await m.waitForTimeout(300);
  await shot(m, '20_mobile_advisor.png');
  // 21 모바일 급여
  await m.click('#bottomnav [data-view="payroll"]');
  await m.waitForTimeout(300);
  await shot(m, '21_mobile_payroll.png');
  await m.close();

  await browser.close();

  console.log('\n=== VERIFICATION ===');
  console.log('font status (workflow):', fontStatus);
  console.log('bom-cafe employees:', bomEmp, '(expect 3)');
  console.log('payroll 이지원 salary:', payCheck.salary, 'insurance sum:', payCheck.ins);
  console.log('employee 한지민 persisted after reload:', empPersist);
  console.log('page errors:', errors.length ? errors : 'none');
};

run().catch(e => { console.error(e); process.exit(1); });

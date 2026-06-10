// ====================================================================
// 스몰박스 SMB 백오피스 v3 — 시리즈A 데모
//  전자세금계산서 API mock · i18n(KO/EN) · 노무사 챗 고도화 · 연차/근태 정산+ICS
//  급여 이체(펌뱅킹 CSV) · 분석 대시보드 · 권한/감사로그 · 다중 회사 통합 콘솔
//  한글 PDF: v2 nanum-font.js 재사용. 키 부재 시 mock fallback.
// ====================================================================
const KEY = 'smb_state_v3';

// ---------- i18n ----------
const I18N = {
  ko: {
    appSub: '시트당 9,900원/월 · v3.0 시리즈A 데모',
    company: '회사 전환', console: '통합 콘솔', role: '권한',
    owner: '오너', admin: '관리자', staff: '직원',
    nav_dash: '분석 대시보드', nav_tax: '전자세금계산서', nav_leave: '연차·근태 정산',
    nav_payroll: '급여·이체', nav_advisor: '노무사 자문', nav_audit: '감사 로그',
    nav_console: '다중회사 콘솔', nav_contract: '전자계약',
    kpi_emp: '직원 수', kpi_labor: '인건비(월)', kpi_ins: '4대보험 부담', kpi_tax: '발행 세금계산서',
    laborTrend: '인건비 추세 (6개월)', insBurden: '4대보험 사업주 부담 구성',
    taxTitle: '전자세금계산서 발급', taxIssue: '세금계산서 발급',
    supply: '공급가액', vat: '세액(10%)', total: '합계금액', issue: '발급',
    leaveTitle: '연차·근태 자동 정산', payrollTitle: '급여 · 은행 이체',
    advisorTitle: '노무사 자문 챗 (고도화)', auditTitle: '감사 로그',
    consoleTitle: '다중 회사 통합 관리 콘솔',
    lang: '한국어', guest: '게스트 · 로그인 없이 둘러봐요',
  },
  en: {
    appSub: '$9,900/seat/mo · v3.0 Series A Demo',
    company: 'Switch Company', console: 'Console', role: 'Role',
    owner: 'Owner', admin: 'Admin', staff: 'Staff',
    nav_dash: 'Analytics', nav_tax: 'e-Tax Invoice', nav_leave: 'Leave & Attendance',
    nav_payroll: 'Payroll & Transfer', nav_advisor: 'Labor Advisor', nav_audit: 'Audit Log',
    nav_console: 'Multi-Company', nav_contract: 'e-Contract',
    kpi_emp: 'Employees', kpi_labor: 'Labor cost (mo)', kpi_ins: 'Employer insurance', kpi_tax: 'Tax invoices',
    laborTrend: 'Labor Cost Trend (6mo)', insBurden: 'Employer Insurance Breakdown',
    taxTitle: 'e-Tax Invoice Issuance', taxIssue: 'Issue Invoice',
    supply: 'Supply value', vat: 'VAT (10%)', total: 'Total', issue: 'Issue',
    leaveTitle: 'Leave & Attendance Auto-settlement', payrollTitle: 'Payroll & Bank Transfer',
    advisorTitle: 'Labor Advisor Chat (Advanced)', auditTitle: 'Audit Log',
    consoleTitle: 'Multi-Company Management Console',
    lang: 'English', guest: 'Guest · demo without login',
  },
};
function L(k){ return (I18N[state.lang] || I18N.ko)[k] || k; }
// bilingual helper for data labels
function B(ko, en){ return state.lang === 'en' ? en : ko; }

// ---------- 다중 회사(테넌트) 시드 ----------
function seedTenants(){
  return {
    'co-smallbox': {
      id:'co-smallbox', name:'(주)스몰박스', nameEn:'Smallbox Inc.', biz:'129-81-00001', plan:'Growth', color:'#4F46E5',
      employees:[
        { id:'E001', name:'이지원', nameEn:'Jiwon Lee', dept:'개발', join:'2024-03-01', salary:3800000, bank:'국민', acct:'123-45-678901', annualUsed:5, annualTotal:15 },
        { id:'E002', name:'박민서', nameEn:'Minseo Park', dept:'마케팅', join:'2024-08-15', salary:3200000, bank:'신한', acct:'110-222-333444', annualUsed:8, annualTotal:15 },
        { id:'E003', name:'최지훈', nameEn:'Jihoon Choi', dept:'영업', join:'2023-01-10', salary:3500000, bank:'우리', acct:'1002-444-555666', annualUsed:11, annualTotal:16 },
        { id:'E004', name:'정나연', nameEn:'Nayeon Jung', dept:'디자인', join:'2025-04-01', salary:3400000, bank:'카카오', acct:'3333-01-7654321', annualUsed:2, annualTotal:11 },
      ],
      taxInvoices:[
        { id:'T20260501-001', date:'2026-05-04', buyer:'한솔 디자인', buyerBiz:'220-11-33445', supply:5000000, vat:500000, status:'발급완료', ntsCode:'NTS-AC-9921' },
        { id:'T20260512-002', date:'2026-05-12', buyer:'클라우드인프라(주)', buyerBiz:'301-22-55667', supply:2400000, vat:240000, status:'발급완료', ntsCode:'NTS-AC-9947' },
      ],
      auditLog:[
        { t:'2026-06-05 09:12', actor:'오너', role:'owner', action:'급여 이체 파일 생성', detail:'firmbanking_202606.csv (4건)' },
        { t:'2026-06-04 14:30', actor:'관리자', role:'admin', action:'세금계산서 발급', detail:'T20260512-002 / ₩2,640,000' },
        { t:'2026-06-03 11:02', actor:'직원(이지원)', role:'staff', action:'연차 신청', detail:'2026-06-10 (1일)' },
      ],
    },
    'co-bom-cafe': {
      id:'co-bom-cafe', name:'봄날카페', nameEn:'Bomnal Cafe', biz:'214-12-55667', plan:'Basic', color:'#db2777',
      employees:[
        { id:'E001', name:'한가람', nameEn:'Garam Han', dept:'매장', join:'2025-02-01', salary:2300000, bank:'농협', acct:'301-1234-5678-01', annualUsed:3, annualTotal:12 },
        { id:'E002', name:'오세윤', nameEn:'Seyun Oh', dept:'베이커리', join:'2025-06-01', salary:2500000, bank:'기업', acct:'010-987654-01-011', annualUsed:1, annualTotal:11 },
        { id:'E003', name:'문서아', nameEn:'Seoa Moon', dept:'매장', join:'2026-01-15', salary:2200000, bank:'국민', acct:'987-65-432109', annualUsed:0, annualTotal:5 },
      ],
      taxInvoices:[
        { id:'T20260420-001', date:'2026-04-20', buyer:'원두유통상사', buyerBiz:'128-33-99887', supply:1800000, vat:180000, status:'발급완료', ntsCode:'NTS-AC-8810' },
      ],
      auditLog:[
        { t:'2026-06-02 08:00', actor:'오너', role:'owner', action:'직원 추가', detail:'문서아(매장)' },
      ],
    },
    'co-techlab': {
      id:'co-techlab', name:'테크랩 스튜디오', nameEn:'TechLab Studio', biz:'305-88-12345', plan:'Pro', color:'#0891b2',
      employees:[
        { id:'E001', name:'서준호', nameEn:'Junho Seo', dept:'연구', join:'2022-09-01', salary:5200000, bank:'하나', acct:'620-910123-456', annualUsed:9, annualTotal:17 },
        { id:'E002', name:'임채원', nameEn:'Chaewon Lim', dept:'연구', join:'2024-05-01', salary:4800000, bank:'국민', acct:'333-21-998877', annualUsed:4, annualTotal:15 },
        { id:'E003', name:'강도윤', nameEn:'Doyoon Kang', dept:'프로덕트', join:'2024-11-01', salary:4500000, bank:'토스', acct:'1000-1234-5678', annualUsed:6, annualTotal:15 },
        { id:'E004', name:'윤하늘', nameEn:'Haneul Yoon', dept:'경영지원', join:'2025-03-01', salary:3900000, bank:'신한', acct:'110-555-666777', annualUsed:2, annualTotal:11 },
        { id:'E005', name:'배시우', nameEn:'Siwoo Bae', dept:'프로덕트', join:'2025-07-01', salary:4200000, bank:'우리', acct:'1002-888-999000', annualUsed:1, annualTotal:11 },
      ],
      taxInvoices:[
        { id:'T20260503-001', date:'2026-05-03', buyer:'대기업SI(주)', buyerBiz:'104-81-22334', supply:18000000, vat:1800000, status:'발급완료', ntsCode:'NTS-AC-9001' },
        { id:'T20260515-002', date:'2026-05-15', buyer:'스타트업파트너스', buyerBiz:'211-88-44556', supply:6500000, vat:650000, status:'발급완료', ntsCode:'NTS-AC-9055' },
        { id:'T20260528-003', date:'2026-05-28', buyer:'글로벌IT', buyerBiz:'120-86-77889', supply:9200000, vat:920000, status:'발급완료', ntsCode:'NTS-AC-9120' },
      ],
      auditLog:[
        { t:'2026-06-05 17:40', actor:'관리자', role:'admin', action:'세금계산서 발급', detail:'T20260528-003 / ₩10,120,000' },
      ],
    },
  };
}

let state = JSON.parse(localStorage.getItem(KEY) || 'null');
if (!state) {
  state = { view:'dash', activeTenant:'co-smallbox', tenants:seedTenants(),
            lang:'ko', role:'owner',
            chat:[{role:'bot', text:'안녕하세요. 노무 자문 챗 v3이에요. 연차·해고·최저임금·수습·4대보험·주휴·퇴직금·임금체불·육아휴직·통상임금 등을 근거 조항과 함께 알려드려요.'}],
            taxForm:{}, lastTaxResponse:null, lastCsv:null };
  persist();
}
if (!state.tenants) { localStorage.removeItem(KEY); location.reload(); }
function persist(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function T(){ return state.tenants[state.activeTenant]; }
function tName(t){ return state.lang==='en' ? (t.nameEn||t.name) : t.name; }
function eName(e){ return state.lang==='en' ? (e.nameEn||e.name) : e.name; }

const KRW = n => '₩ ' + Math.round(n).toLocaleString('ko-KR');

// ---------- 감사 로그 기록 ----------
function logAudit(action, detail){
  const roleKo = { owner:'오너', admin:'관리자', staff:'직원' }[state.role] || state.role;
  T().auditLog.unshift({ t:new Date().toLocaleString('ko-KR'), actor:roleKo, role:state.role, action, detail });
  persist();
}

// ====================================================================
// 실 알고리즘 1: 급여 누진 계산 (4대보험 + 소득세)
// ====================================================================
const RATES = { np:0.045, hi:0.03545, ltOnHi:0.1295, lt:0.009, ph:0 };
// 사업주 부담 요율(분석용): 국민연금4.5 건강3.545 장기요양 고용0.9+0.25(고용안정) 산재0.7[추정]
const EMP_RATES = { np:0.045, hi:0.03545, ltOnHi:0.1295, emp:0.0115, accident:0.007 };
function calcIncomeTax(monthly){
  const annual = monthly*12; let tax;
  if (annual<=14000000) tax=annual*0.06;
  else if (annual<=50000000) tax=840000+(annual-14000000)*0.15;
  else if (annual<=88000000) tax=6240000+(annual-50000000)*0.24;
  else tax=15360000+(annual-88000000)*0.35;
  const yearly=Math.max(0,tax-550000);
  return Math.round((yearly/12)*1.1);
}
function calcPay(s){
  const np=Math.round(s*RATES.np), hi=Math.round(s*RATES.hi);
  const lt=Math.round(hi*RATES.ltOnHi), emp=Math.round(s*RATES.lt), ph=0;
  const tax=calcIncomeTax(s); const ins=np+hi+lt+emp;
  return { np,hi,lt,emp,ph,ins,tax,net:s-ins-tax };
}
// 사업주 4대보험 부담 (분석 차트용)
function calcEmployerBurden(s){
  const np=Math.round(s*EMP_RATES.np), hi=Math.round(s*EMP_RATES.hi);
  const lt=Math.round(hi*EMP_RATES.ltOnHi), emp=Math.round(s*EMP_RATES.emp), accident=Math.round(s*EMP_RATES.accident);
  return { np, hi, lt, emp, accident, total: np+hi+lt+emp+accident };
}

// ====================================================================
// 실 알고리즘 2: 전자세금계산서 세액 산출 (공급가액 → VAT → 합계)
// ====================================================================
function calcTaxInvoice(supplyInput, taxType){
  const supply = Math.round(Number(supplyInput)||0);
  // 과세(10%) / 영세율(0%) / 면세(no vat)
  let vat = 0;
  if (taxType==='과세' || taxType==='taxable' || !taxType) vat = Math.round(supply * 0.10);
  else if (taxType==='영세율' || taxType==='zero') vat = 0;
  else vat = 0; // 면세
  return { supply, vat, total: supply + vat };
}
// 합계금액으로부터 역산(공급대가 → 공급가액) — 부가가치세 역산 알고리즘
function reverseFromTotal(total){
  const supply = Math.round(Number(total) / 1.1);
  return { supply, vat: Math.round(total) - supply, total: Math.round(total) };
}

// ====================================================================
// 외부 통합 1: 국세청 e-세금계산서 발급 API mock (요청/응답 흐름)
// ====================================================================
async function issueTaxInvoiceMock(payload){
  // 국세청 전자세금계산서 발급 API(홈택스/팝빌 등) REST 호출 형태 시뮬레이션. 키 부재 → mock 응답.
  const req = {
    method:'POST',
    url:'https://api.hometax.go.kr/etax/v1/invoices/issue',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer (mock — 인증서/키 미주입)', 'X-NTS-CERT':'(mock)' },
    body:{
      writeDate: payload.date,
      issueType: '01', // 정발행
      taxType: payload.taxType||'과세',
      supplier:{ bizNo: payload.supplierBiz, name: payload.supplierName },
      buyer:{ bizNo: payload.buyerBiz, name: payload.buyer },
      itemList:[{ name: payload.item||'용역대금', supplyAmount: payload.supply, taxAmount: payload.vat }],
      totalAmount: payload.total,
    },
  };
  await new Promise(r=>setTimeout(r, 450)); // 네트워크 지연 시뮬레이션
  const ntsCode = 'NTS-AC-' + Math.floor(1000 + Math.random()*9000);
  const res = {
    resultCode:'0000', resultMessage:'정상발급', isSuccessful:true,
    ntsConfirmNum: ntsCode,                       // 국세청 승인번호
    invoiceMgtKey: 'INV-' + Date.now().toString().slice(-9),
    issueDateTime: new Date().toISOString(),
    supplyAmount: payload.supply, taxAmount: payload.vat, totalAmount: payload.total,
  };
  return { req, res, http:200, ntsCode };
}

// ====================================================================
// 외부 통합 2: 은행 펌뱅킹 급여이체 CSV 생성 (실 산출)
// ====================================================================
function buildFirmbankingCSV(rows, payDate){
  // 표준 펌뱅킹 대량이체 레이아웃 근사: 순번,입금은행,입금계좌,예금주,금액,적요
  const head = ['순번','입금은행','입금계좌','예금주','이체금액','적요'];
  const lines = [head.join(',')];
  let total = 0;
  rows.forEach((r, i) => {
    total += r.amount;
    lines.push([ i+1, r.bank, r.acct, r.name, r.amount, `${payDate} 급여` ].join(','));
  });
  lines.push(['합계','','','', total, `${rows.length}건`].join(','));
  return { csv: lines.join('\r\n'), total, count: rows.length };
}
function downloadText(filename, text, mime){
  const blob = new Blob(['﻿'+text], { type:(mime||'text/csv')+';charset=utf-8' }); // BOM for Excel 한글
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
}

// ====================================================================
// 외부 통합 3: ICS 생성 (연차/근태)
// ====================================================================
function icsEscape(s){ return String(s).replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n'); }
function toICSDate(d){ const dt=new Date(d); return dt.getFullYear()+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0'); }
function buildICS(events){
  const now=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  let out=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SMB Backoffice//v3//KO','CALSCALE:GREGORIAN'];
  events.forEach((e,i)=>{
    out.push('BEGIN:VEVENT');
    out.push('UID:'+(e.uid||('smb-v3-'+i+'-'+Date.now())+'@smb.kr'));
    out.push('DTSTAMP:'+now);
    out.push('DTSTART;VALUE=DATE:'+toICSDate(e.date));
    out.push('SUMMARY:'+icsEscape(e.title));
    if(e.desc) out.push('DESCRIPTION:'+icsEscape(e.desc));
    out.push('END:VEVENT');
  });
  out.push('END:VCALENDAR');
  return out.join('\r\n');
}
function downloadICS(filename, events){
  const blob=new Blob([buildICS(events)],{type:'text/calendar;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
}

// ---------- 한글 PDF 폰트 (v2 nanum-font.js 재사용) ----------
let _fontMode='none';
function ensureKoreanFont(doc){
  if (window.NANUM_GOTHIC_B64 && window.NANUM_GOTHIC_B64.length>10000){
    doc.addFileToVFS('Nanum.ttf', window.NANUM_GOTHIC_B64);
    doc.addFont('Nanum.ttf','Nanum','normal'); _fontMode='local-bundle'; return true;
  }
  _fontMode='fallback-latin'; return false;
}
function kfont(doc, ok){ doc.setFont(ok?'Nanum':'helvetica','normal'); }

// ====================== 권한 모델 ======================
// 라우트별 허용 역할
const ROUTE_ROLES = {
  dash:['owner','admin','staff'], tax:['owner','admin'], leave:['owner','admin','staff'],
  payroll:['owner','admin'], advisor:['owner','admin','staff'], audit:['owner'],
  console:['owner'], contract:['owner','admin'],
};
function canAccess(v){ return (ROUTE_ROLES[v]||['owner']).includes(state.role); }

// ====================== 네비게이션 ======================
const NAV = [
  ['dash','📊','nav_dash'], ['tax','🧾','nav_tax'], ['leave','🌴','nav_leave'],
  ['payroll','💸','nav_payroll'], ['advisor','⚖️','nav_advisor'],
  ['audit','🛡️','nav_audit'], ['console','🏢','nav_console'], ['contract','📝','nav_contract'],
];
const BOTTOM = [['dash','📊','nav_dash'],['tax','🧾','nav_tax'],['payroll','💸','nav_payroll'],['leave','🌴','nav_leave'],['advisor','⚖️','nav_advisor']];

function renderNav(){
  const nav = NAV.filter(([k])=>canAccess(k));
  document.getElementById('nav').innerHTML = nav.map(([k,i,n])=>`<a data-view="${k}" class="block px-3 py-2 rounded text-sm cursor-pointer ${state.view===k?'bg-blue-50 text-blue-700 font-semibold':'text-slate-700 hover:bg-slate-50'}">${i} ${L(n)}</a>`).join('');
  document.getElementById('bottomnav').innerHTML = BOTTOM.filter(([k])=>canAccess(k)).map(([k,i,n])=>`<button data-view="${k}" class="flex flex-col items-center px-1 py-1 ${state.view===k?'text-blue-600 font-semibold':'text-slate-500'}"><span class="text-lg leading-none">${i}</span><span class="text-[10px]">${L(n)}</span></button>`).join('');
  // 테넌트
  const sel=document.getElementById('tenant-switch');
  sel.innerHTML = Object.values(state.tenants).map(t=>`<option value="${t.id}" ${t.id===state.activeTenant?'selected':''}>${tName(t)}</option>`).join('');
  const t=T(); document.getElementById('tenant-meta').textContent = `${B('사업자','Biz No')} ${t.biz} · ${t.plan} · ${B('직원','staff')} ${t.employees.length}${B('명','')}`;
  // 역할
  const rs=document.getElementById('role-switch'); if(rs){ rs.innerHTML=['owner','admin','staff'].map(r=>`<option value="${r}" ${r===state.role?'selected':''}>${L(r)}</option>`).join(''); }
  // i18n labels in shell
  document.getElementById('app-sub').textContent = L('appSub');
  document.getElementById('lbl-company').textContent = L('company');
  document.getElementById('lbl-role').textContent = L('role');
  document.getElementById('lbl-guest').textContent = L('guest');
  document.getElementById('lang-btn').textContent = state.lang==='ko' ? 'EN' : '한국어';
}

// ====================== 분석 대시보드 (차트 고도화) ======================
function vDash(){
  const t=T();
  const totalSalary=t.employees.reduce((a,b)=>a+b.salary,0);
  const empBurden=t.employees.reduce((a,b)=>a+calcEmployerBurden(b.salary).total,0);
  const taxCount=t.taxInvoices.length;
  // 6개월 인건비 추세(시드: 입사 누적 근사 + 변동)
  const base=totalSalary;
  const trend=[0.86,0.89,0.92,0.95,0.97,1.0].map((f,i)=>({ m:`${i+1}`, v:Math.round(base*f) }));
  const burdenAgg=t.employees.reduce((a,e)=>{const b=calcEmployerBurden(e.salary);a.np+=b.np;a.hi+=b.hi+b.lt;a.emp+=b.emp;a.accident+=b.accident;return a;},{np:0,hi:0,emp:0,accident:0});
  const maxV=Math.max(...trend.map(x=>x.v));
  const burdenTotal=burdenAgg.np+burdenAgg.hi+burdenAgg.emp+burdenAgg.accident;
  const seg=(label,val,color)=>{const pct=burdenTotal?Math.round(val/burdenTotal*100):0;return `<div class="flex items-center gap-2 text-xs"><span class="inline-block w-3 h-3 rounded" style="background:${color}"></span><span class="flex-1">${label}</span><span class="text-slate-500">${KRW(val)} · ${pct}%</span></div>`;};
  return `<h1 class="text-2xl font-bold">${L('nav_dash')} <span class="text-base font-normal text-slate-400">· ${tName(t)}</span></h1>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    ${kpi(L('kpi_emp'), t.employees.length+B('명',''), tName(t))}
    ${kpi(L('kpi_labor'), KRW(totalSalary), B('기본급 합','gross'))}
    ${kpi(L('kpi_ins'), KRW(empBurden), B('사업주 4대보험','employer share'))}
    ${kpi(L('kpi_tax'), taxCount+B('건',''), B('이번 분기','this quarter'))}
  </div>
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
    <div class="bg-white rounded-2xl p-5 border">
      <div class="font-semibold mb-4">${L('laborTrend')}</div>
      <div class="flex items-end gap-3 h-40">
        ${trend.map(x=>`<div class="flex-1 flex flex-col items-center justify-end h-full">
          <div class="text-[10px] text-slate-500 mb-1">${(x.v/1e6).toFixed(1)}M</div>
          <div class="w-full bg-blue-500 rounded-t" style="height:${Math.round(x.v/maxV*100)}%"></div>
          <div class="text-[10px] text-slate-400 mt-1">M-${6-Number(x.m)+1}</div></div>`).join('')}
      </div>
    </div>
    <div class="bg-white rounded-2xl p-5 border">
      <div class="font-semibold mb-4">${L('insBurden')}</div>
      <div class="flex h-6 rounded-full overflow-hidden mb-4">
        <div style="width:${burdenTotal?burdenAgg.np/burdenTotal*100:0}%;background:#4F46E5"></div>
        <div style="width:${burdenTotal?burdenAgg.hi/burdenTotal*100:0}%;background:#0891b2"></div>
        <div style="width:${burdenTotal?burdenAgg.emp/burdenTotal*100:0}%;background:#16a34a"></div>
        <div style="width:${burdenTotal?burdenAgg.accident/burdenTotal*100:0}%;background:#db2777"></div>
      </div>
      <div class="space-y-2">
        ${seg(B('국민연금','Pension'),burdenAgg.np,'#4F46E5')}
        ${seg(B('건강+장기요양','Health+LTC'),burdenAgg.hi,'#0891b2')}
        ${seg(B('고용보험','Employment'),burdenAgg.emp,'#16a34a')}
        ${seg(B('산재보험','Accident'),burdenAgg.accident,'#db2777')}
      </div>
      <div class="mt-4 pt-3 border-t text-sm flex justify-between"><span class="font-semibold">${B('월 사업주 총부담','Monthly employer total')}</span><span class="font-bold text-blue-600">${KRW(burdenTotal)}</span></div>
    </div>
  </section>`;
}
function kpi(l,v,s){ return `<div class="bg-white rounded-2xl p-5 border"><div class="text-xs text-slate-500">${l}</div><div class="text-2xl font-bold mt-1">${v}</div><div class="text-xs text-slate-500 mt-1">${s}</div></div>`; }

// ====================== 전자세금계산서 발급 ======================
function vTax(){
  const t=T();
  const f=state.taxForm||{};
  const calc=calcTaxInvoice(f.supply||5000000, f.taxType); // 입력 기본값과 동기화
  const r=state.lastTaxResponse;
  return `<h1 class="text-2xl font-bold">${L('taxTitle')} <span class="text-base font-normal text-slate-400">· ${tName(t)}</span></h1>
  <div class="mt-2 text-sm text-slate-500">${B('공급가액 입력 → 세액 자동계산 → 국세청 e-세금계산서 발급 API(mock) 요청/응답 → 발급내역 적재','Enter supply → auto VAT → NTS e-Tax API (mock) request/response → ledger')}</div>
  <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-2xl border p-6 space-y-3">
      <div class="font-semibold">${B('발급 정보 입력','Issue form')}</div>
      <label class="block"><span class="text-xs text-slate-500">${B('공급받는자(상호)','Buyer')}</span><input id="tx-buyer" value="${f.buyer||'한솔 디자인'}" class="mt-1 w-full border rounded-lg p-3 text-sm"></label>
      <label class="block"><span class="text-xs text-slate-500">${B('공급받는자 사업자번호','Buyer Biz No')}</span><input id="tx-buyerbiz" value="${f.buyerBiz||'220-11-33445'}" class="mt-1 w-full border rounded-lg p-3 text-sm"></label>
      <label class="block"><span class="text-xs text-slate-500">${B('품목','Item')}</span><input id="tx-item" value="${f.item||'SMB 백오피스 UI 키트 용역'}" class="mt-1 w-full border rounded-lg p-3 text-sm"></label>
      <div class="grid grid-cols-2 gap-2">
        <label class="block"><span class="text-xs text-slate-500">${L('supply')}</span><input id="tx-supply" type="number" value="${f.supply||5000000}" class="mt-1 w-full border rounded-lg p-3 text-sm"></label>
        <label class="block"><span class="text-xs text-slate-500">${B('과세유형','Tax type')}</span>
          <select id="tx-type" class="mt-1 w-full border rounded-lg p-3 text-sm">
            <option value="과세" ${f.taxType==='과세'||!f.taxType?'selected':''}>${B('과세 10%','Taxable 10%')}</option>
            <option value="영세율" ${f.taxType==='영세율'?'selected':''}>${B('영세율 0%','Zero-rated 0%')}</option>
            <option value="면세" ${f.taxType==='면세'?'selected':''}>${B('면세','Exempt')}</option>
          </select></label>
      </div>
      <div id="tx-calc" class="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
        <div class="flex justify-between"><span class="text-slate-500">${L('supply')}</span><span class="font-mono">${KRW(calc.supply)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">${L('vat')}</span><span class="font-mono">${KRW(calc.vat)}</span></div>
        <div class="flex justify-between border-t pt-1 font-bold"><span>${L('total')}</span><span class="font-mono text-blue-600">${KRW(calc.total)}</span></div>
      </div>
      <button id="tx-issue" class="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold">${L('taxIssue')} → ${B('국세청 API','NTS API')}</button>
    </div>
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">${B('국세청 API 요청/응답','NTS API request/response')}</div>
      <pre id="tx-api" class="bg-slate-900 text-emerald-300 text-[11px] rounded-lg p-3 overflow-x-auto h-[300px] ${r?'':'hidden'}">${r?r:''}</pre>
      ${r?'':'<div class="text-slate-400 text-sm">왼쪽에서 발급을 실행하면 API 호출 흐름을 보여드려요.</div>'}
    </div>
  </div>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <div class="px-5 pt-4 font-semibold">${B('발급 내역','Issued ledger')}</div>
    <table class="w-full text-sm min-w-[720px] mt-2"><thead class="bg-slate-50 text-slate-600"><tr>
      <th class="text-left p-3">${B('승인번호','NTS code')}</th><th class="text-left p-3">${B('일자','Date')}</th><th class="text-left p-3">${B('공급받는자','Buyer')}</th>
      <th class="text-right p-3">${L('supply')}</th><th class="text-right p-3">${L('vat')}</th><th class="text-right p-3">${L('total')}</th>
      <th class="text-left p-3">${B('상태','Status')}</th><th class="text-right p-3">PDF</th></tr></thead>
      <tbody>${t.taxInvoices.map(iv=>`<tr class="border-t">
        <td class="p-3 font-mono text-xs">${iv.ntsCode}</td><td class="p-3 text-xs">${iv.date}</td><td class="p-3">${iv.buyer}</td>
        <td class="p-3 text-right">${KRW(iv.supply)}</td><td class="p-3 text-right text-slate-500">${KRW(iv.vat)}</td><td class="p-3 text-right font-semibold">${KRW(iv.supply+iv.vat)}</td>
        <td class="p-3 text-emerald-600">${iv.status}</td>
        <td class="p-3 text-right"><button data-tax-pdf="${iv.id}" class="text-blue-600 text-xs">한글PDF</button></td></tr>`).join('')}</tbody>
    </table>
  </div>`;
}

// ====================== 연차·근태 자동 정산 ======================
function vLeave(){
  const t=T();
  return `<h1 class="text-2xl font-bold">${L('leaveTitle')} <span class="text-base font-normal text-slate-400">· ${tName(t)}</span></h1>
  <div class="mt-2 text-sm text-slate-500">${B('근속연수 기반 연차 자동 산정(근기법 제60조) · 잔여/소진 정산 · 연차 ICS 내보내기','Auto annual-leave by tenure (Labor Act §60) · remaining/used settlement · ICS export')}</div>
  <div class="mt-4 flex gap-2 flex-wrap">
    <button id="leave-ics" class="px-4 py-2 rounded-lg border bg-white font-semibold">📅 ${B('연차 일정 ICS 내보내기','Leave ICS export')}</button>
    <button id="leave-recalc" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">${B('근속 기반 연차 재정산','Recalculate by tenure')}</button>
  </div>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <table class="w-full text-sm min-w-[760px]"><thead class="bg-slate-50 text-slate-600"><tr>
      <th class="text-left p-3">${B('직원','Employee')}</th><th class="text-left p-3">${B('입사일','Join')}</th><th class="text-right p-3">${B('근속(년)','Tenure(y)')}</th>
      <th class="text-right p-3">${B('법정 연차','Statutory')}</th><th class="text-right p-3">${B('소진','Used')}</th><th class="text-right p-3">${B('잔여','Remaining')}</th>
      <th class="text-right p-3">${B('미사용 정산금','Payout')}</th></tr></thead>
      <tbody>${t.employees.map(e=>{
        const tenure=annualByTenure(e.join); const remain=Math.max(0,tenure.days - e.annualUsed);
        const dayPay=Math.round(e.salary/209*8); const payout=remain*dayPay;
        return `<tr class="border-t"><td class="p-3 font-medium">${eName(e)}</td><td class="p-3 text-xs">${e.join}</td>
        <td class="p-3 text-right">${tenure.years}</td><td class="p-3 text-right font-semibold">${tenure.days}${B('일','')}</td>
        <td class="p-3 text-right text-slate-500">${e.annualUsed}${B('일','')}</td>
        <td class="p-3 text-right ${remain>0?'text-emerald-600':'text-slate-400'} font-semibold">${remain}${B('일','')}</td>
        <td class="p-3 text-right">${KRW(payout)}</td></tr>`;}).join('')}</tbody>
    </table>
  </div>
  <details class="mt-4 bg-white rounded-2xl border p-5">
    <summary class="cursor-pointer text-sm font-semibold">${B('연차 산정 규칙 (근기법 제60조)','Accrual rule (Labor Act §60)')}</summary>
    <ul class="text-sm mt-3 list-disc pl-5 space-y-1 text-slate-600">
      <li>${B('1년간 80% 이상 출근 시 15일 발생.','15 days after 80%+ attendance for 1 year.')}</li>
      <li>${B('3년 이상 근속 시 매 2년마다 1일 가산(최대 25일).','+1 day every 2 years after 3 years (max 25).')}</li>
      <li>${B('입사 1년 미만: 1개월 개근당 1일(최대 11일).','Under 1 year: 1 day per full month (max 11).')}</li>
      <li>${B('미사용 정산금 = 잔여일 × (월급/209×8)','Payout = remaining × (salary/209×8)')} <span class="text-slate-400">[추정 통상일급]</span></li>
    </ul>
  </details>`;
}
// 실 알고리즘: 근속연수 → 법정 연차일수
function annualByTenure(join){
  const j=new Date(join); const now=new Date();
  let years=now.getFullYear()-j.getFullYear();
  const md=(now.getMonth()-j.getMonth()) || (now.getDate()-j.getDate());
  if(md<0) years--;
  const months=Math.max(0,(now.getFullYear()-j.getFullYear())*12 + (now.getMonth()-j.getMonth()));
  let days;
  if(years<1){ days=Math.min(11, months); }
  else { days=15 + Math.max(0, Math.floor((years-1)/2)); days=Math.min(25, days); }
  return { years:Math.max(0,years), days };
}

// ====================== 급여 · 은행 이체 ======================
function vPayroll(){
  const t=T();
  const totalNet=t.employees.reduce((a,e)=>a+calcPay(e.salary).net,0);
  return `<h1 class="text-2xl font-bold">${L('payrollTitle')} <span class="text-base font-normal text-slate-400">· ${tName(t)}</span></h1>
  <div class="mt-2 text-sm text-slate-500">${B('4대보험·소득세 누진 자동공제 → 실지급액 산출 → 은행 펌뱅킹 대량이체 CSV 생성','Auto deduction → net pay → firm-banking bulk-transfer CSV')}</div>
  <div class="mt-4 flex gap-2 flex-wrap items-center">
    <button id="csv-firmbank" class="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold">💸 ${B('급여 이체 CSV 생성 (펌뱅킹)','Generate transfer CSV')}</button>
    <span class="text-sm text-slate-500">${B('이체 총액','Transfer total')}: <b>${KRW(totalNet)}</b> · ${t.employees.length}${B('건','')}</span>
  </div>
  <pre id="csv-preview" class="hidden mt-4 bg-slate-900 text-emerald-300 text-[11px] rounded-lg p-4 overflow-x-auto"></pre>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <table class="w-full text-sm min-w-[820px]"><thead class="bg-slate-50 text-slate-600"><tr>
      <th class="text-left p-3">${B('직원','Employee')}</th><th class="text-left p-3">${B('입금은행','Bank')}</th><th class="text-left p-3">${B('계좌','Account')}</th>
      <th class="text-right p-3">${B('기본급','Gross')}</th><th class="text-right p-3">${B('4대보험','Insurance')}</th><th class="text-right p-3">${B('소득세','Tax')}</th>
      <th class="text-right p-3">${B('실지급','Net')}</th><th class="text-center p-3">PDF</th></tr></thead>
      <tbody>${t.employees.map(e=>{const p=calcPay(e.salary);return `<tr class="border-t">
        <td class="p-3 font-medium">${eName(e)}</td><td class="p-3">${e.bank}</td><td class="p-3 font-mono text-xs">${e.acct}</td>
        <td class="p-3 text-right">${KRW(e.salary)}</td><td class="p-3 text-right text-slate-500">${KRW(p.ins)}</td>
        <td class="p-3 text-right text-slate-500">${KRW(p.tax)}</td><td class="p-3 text-right font-semibold">${KRW(p.net)}</td>
        <td class="p-3 text-center"><button data-payslip="${e.id}" class="px-2 py-1 rounded bg-slate-100 text-xs font-semibold">${B('명세서','Payslip')}</button></td></tr>`;}).join('')}</tbody>
    </table>
  </div>`;
}

// ====================== 노무사 자문 챗 (고도화) ======================
function vAdvisor(){
  return `<h1 class="text-2xl font-bold">${L('advisorTitle')}</h1>
  <div class="mt-2 text-sm text-slate-500">${B('근거 조항 인용 + 후속질문 제안. 법적 효력 없음 — 정식 자문은 공인노무사.','Cites legal articles + follow-up suggestions. Not legal advice.')}</div>
  <div class="mt-4 bg-white rounded-2xl border p-4 max-w-3xl">
    <div id="chat-log" class="space-y-3 h-[400px] overflow-y-auto p-2">${state.chat.map(m=>chatBubble(m)).join('')}</div>
    <div class="mt-3 flex gap-2"><input id="chat-in" placeholder="${B('예: 임금체불 시 어떻게 하나요?','e.g. unpaid wages?')}" class="flex-1 border rounded-lg p-3 text-sm"><button id="chat-send" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">${B('전송','Send')}</button></div>
    <div class="mt-2 flex gap-2 flex-wrap text-xs">
      ${['연차','최저임금','수습','해고','4대보험','주휴수당','퇴직금','임금체불','육아휴직','통상임금','연장근로','직장내괴롭힘'].map(q=>`<button class="chat-quick px-2 py-1 rounded-full border text-slate-600" data-q="${q}">${q}</button>`).join('')}
    </div>
  </div>`;
}
function chatBubble(m){
  return m.role==='me'
    ? `<div class="flex justify-end"><div class="chat-bubble-me px-3 py-2 text-sm max-w-[80%]">${m.text}</div></div>`
    : `<div class="flex justify-start"><div class="chat-bubble-bot px-3 py-2 text-sm max-w-[88%] whitespace-pre-line">${m.text}${m.follow?`<div class="mt-2 pt-2 border-t border-slate-300 flex flex-wrap gap-1">${m.follow.map(f=>`<button class="chat-quick text-[11px] px-2 py-0.5 rounded-full bg-white border text-blue-600" data-q="${f}">↳ ${f}</button>`).join('')}</div>`:''}</div></div>`;
}
// 확장 룰 + 근거 조항 + 후속질문
const ADVISOR_RULES=[
  { keys:['연차','연차휴가','휴가일수'], law:'근로기준법 제60조',
    ans:'연차유급휴가: 1년간 80% 이상 출근 시 15일 발생. 3년 이상 근속 시 매 2년마다 1일 가산(최대 25일). 입사 1년 미만은 1개월 개근당 1일(최대 11일).',
    follow:['미사용 연차 수당','연차 사용촉진'] },
  { keys:['미사용','연차수당','연차 정산'], law:'근로기준법 제60조·제61조',
    ans:'미사용 연차는 통상임금 기준 수당으로 지급. 단 사용자가 사용촉진(제61조) 절차를 적법히 이행하면 보상의무 면제 가능. 본 시스템 [연차·근태 정산] 메뉴가 잔여일×통상일급으로 자동 산출합니다.',
    follow:['연차 사용촉진','통상임금'] },
  { keys:['최저임금','시급'], law:'최저임금법 제6조',
    ans:'최저임금 미만 지급은 위반(3년 이하 징역 또는 2천만원 이하 벌금). 월 환산은 주40시간+주휴 포함 209시간 기준. 연도별 고시값 확인 필요.',
    follow:['수습 감액','주휴수당'] },
  { keys:['수습','감액','수습기간'], law:'최저임금법 시행령 제3조',
    ans:'수습 근로자는 수습 시작 후 3개월 이내 최저임금의 90%까지 감액 가능. 단 1년 미만 계약이거나 단순노무직(고용부 고시)은 감액 불가.',
    follow:['최저임금','근로계약서'] },
  { keys:['해고','해고예고','해고 통보'], law:'근로기준법 제23조·제26조·제27조',
    ans:'해고는 30일 전 예고 또는 30일분 통상임금(해고예고수당) 지급. 해고사유·시기는 서면 통지(제27조) 필수. 부당해고는 노동위원회 구제신청(3개월 내) 대상.',
    follow:['부당해고 구제','해고예고수당 예외'] },
  { keys:['부당해고','구제신청'], law:'근로기준법 제28조',
    ans:'부당해고를 당한 근로자는 해고일로부터 3개월 이내 노동위원회에 구제신청 가능. 인용 시 원직복직 또는 금전보상(임금상당액) 명령.',
    follow:['해고','통상임금'] },
  { keys:['4대보험','사대보험','보험료'], law:'국민연금법·국민건강보험법·고용보험법·산재보험법',
    ans:'4대보험: 국민연금(본인4.5%)·건강보험(본인3.545%+장기요양)·고용보험(본인0.9%)·산재보험(전액 사업주). [급여·이체] 모듈이 자동 공제·명세서 발급. [분석 대시보드]에서 사업주 부담 구성을 확인할 수 있습니다.',
    follow:['두루누리 지원','산재보험'] },
  { keys:['주휴','주휴수당'], law:'근로기준법 제55조',
    ans:'1주 소정근로 15시간 이상 + 개근 시 1일분 유급휴일. 주40시간 근로자는 통상 8시간분 지급.',
    follow:['연장근로','최저임금'] },
  { keys:['퇴직금','퇴직급여','퇴직'], law:'근로자퇴직급여보장법 제8조',
    ans:'계속근로 1년 이상 + 4주 평균 주15시간 이상 근로자에게 30일분 평균임금/년 지급. 퇴직 후 14일 이내 지급 원칙.',
    follow:['평균임금','임금체불'] },
  { keys:['임금체불','체불','밀린 임금'], law:'근로기준법 제36조·제43조',
    ans:'임금은 매월 1회 이상 정기·통화·전액·직접 지급(제43조). 퇴직 시 14일 내 청산(제36조). 체불 시 고용노동부 진정 또는 소액체당금(대지급금) 신청 가능.',
    follow:['대지급금','퇴직금'] },
  { keys:['육아휴직','육아'], law:'남녀고용평등법 제19조',
    ans:'만 8세 이하 또는 초2 이하 자녀 양육 위해 최대 1년 육아휴직 가능. 사업주는 불리한 처우 금지. 고용보험에서 육아휴직급여 지급.',
    follow:['출산전후휴가','4대보험'] },
  { keys:['통상임금'], law:'근로기준법 시행령 제6조',
    ans:'통상임금은 정기·일률·고정적으로 지급되는 임금. 연장·야간·휴일근로 가산수당, 해고예고수당, 연차수당 산정의 기준이 됩니다.',
    follow:['연장근로','평균임금'] },
  { keys:['연장','야간','휴일','가산수당','연장근로'], law:'근로기준법 제56조',
    ans:'연장·야간(22~06시)·휴일근로는 통상임금 50% 가산(8시간 초과 휴일은 100%). 5인 이상 사업장 적용.',
    follow:['통상임금','주52시간'] },
  { keys:['직장내괴롭힘','괴롭힘','갑질'], law:'근로기준법 제76조의2·76조의3',
    ans:'직장 내 괴롭힘 발생 시 사용자는 지체 없이 조사·피해자 보호·가해자 조치 의무. 신고를 이유로 한 불이익 처우는 금지(위반 시 형사처벌).',
    follow:['해고','부당해고 구제'] },
];
function advisorReply(q){
  const s=q.toLowerCase();
  for(const r of ADVISOR_RULES){ if(r.keys.some(k=>s.includes(k.toLowerCase()))) return { text:`${r.ans}\n\n📎 근거: ${r.law}`, follow:r.follow }; }
  return { text:'아직 맞는 답을 못 찾았어요. 아래 칩(연차·최저임금·수습·해고·4대보험·주휴수당·퇴직금·임금체불·육아휴직·통상임금·연장근로·직장내괴롭힘)을 눌러보세요. 구체적인 사안은 공인노무사 자문을 받아보시길 권해요.', follow:['연차','임금체불','퇴직금'] };
}

// ====================== 감사 로그 ======================
function vAudit(){
  const t=T();
  const badge=r=>({owner:'bg-purple-100 text-purple-700',admin:'bg-blue-100 text-blue-700',staff:'bg-slate-100 text-slate-600'}[r]||'bg-slate-100');
  return `<h1 class="text-2xl font-bold">${L('auditTitle')} <span class="text-base font-normal text-slate-400">· ${tName(t)}</span></h1>
  <div class="mt-2 text-sm text-slate-500">${B('오너 전용. 역할별(오너/관리자/직원) 활동 이력을 시각으로 기록.','Owner-only. Activity history by role.')}</div>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <table class="w-full text-sm min-w-[680px]"><thead class="bg-slate-50 text-slate-600"><tr>
      <th class="text-left p-3">${B('시각','Time')}</th><th class="text-left p-3">${B('수행자','Actor')}</th><th class="text-left p-3">${B('권한','Role')}</th>
      <th class="text-left p-3">${B('활동','Action')}</th><th class="text-left p-3">${B('상세','Detail')}</th></tr></thead>
      <tbody>${t.auditLog.map(a=>`<tr class="border-t"><td class="p-3 text-xs text-slate-500">${a.t}</td><td class="p-3">${a.actor}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ${badge(a.role)}">${L(a.role)}</span></td>
        <td class="p-3 font-medium">${a.action}</td><td class="p-3 text-xs text-slate-500">${a.detail}</td></tr>`).join('')}</tbody>
    </table>
  </div>`;
}

// ====================== 다중 회사 통합 콘솔 ======================
function vConsole(){
  const all=Object.values(state.tenants);
  const grand={ emp:0, salary:0, burden:0, tax:0 };
  const rows=all.map(t=>{
    const salary=t.employees.reduce((a,e)=>a+e.salary,0);
    const burden=t.employees.reduce((a,e)=>a+calcEmployerBurden(e.salary).total,0);
    const taxTotal=t.taxInvoices.reduce((a,iv)=>a+iv.supply+iv.vat,0);
    grand.emp+=t.employees.length; grand.salary+=salary; grand.burden+=burden; grand.tax+=taxTotal;
    return { t, salary, burden, taxTotal };
  });
  const maxSalary=Math.max(...rows.map(r=>r.salary));
  return `<h1 class="text-2xl font-bold">${L('consoleTitle')}</h1>
  <div class="mt-2 text-sm text-slate-500">${B('오너가 보유한 모든 회사를 단일 화면에서 비교·전환·합산.','Compare/switch/aggregate all owned companies in one view.')}</div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    ${kpi(B('회사 수','Companies'), all.length+B('개',''), B('통합 관리','consolidated'))}
    ${kpi(B('총 직원','Total staff'), grand.emp+B('명',''), '')}
    ${kpi(B('총 인건비(월)','Total labor'), KRW(grand.salary), '')}
    ${kpi(B('세금계산서 합계','Tax invoices'), KRW(grand.tax), B('발행 누계','issued'))}
  </div>
  <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
    ${rows.map(r=>`<div class="bg-white rounded-2xl border p-5 ${r.t.id===state.activeTenant?'ring-2 ring-blue-500':''}">
      <div class="flex items-center justify-between"><div class="font-semibold" style="color:${r.t.color}">${tName(r.t)}</div><span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">${r.t.plan}</span></div>
      <div class="text-xs text-slate-400 mt-1">${r.t.biz}</div>
      <div class="mt-3 space-y-1 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">${B('직원','Staff')}</span><span>${r.t.employees.length}${B('명','')}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">${B('인건비','Labor')}</span><span>${KRW(r.salary)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">${B('사업주 보험','Insurance')}</span><span>${KRW(r.burden)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">${B('세금계산서','Tax inv.')}</span><span>${KRW(r.taxTotal)}</span></div>
      </div>
      <div class="mt-3 h-1.5 bg-slate-100 rounded-full"><div class="h-1.5 rounded-full" style="width:${Math.round(r.salary/maxSalary*100)}%;background:${r.t.color}"></div></div>
      <button data-console-switch="${r.t.id}" class="mt-4 w-full py-2 rounded-lg ${r.t.id===state.activeTenant?'bg-slate-100 text-slate-500':'bg-blue-600 text-white'} text-sm font-semibold">${r.t.id===state.activeTenant?B('현재 회사','Active'):B('이 회사로 전환','Switch')}</button>
    </div>`).join('')}
  </div>`;
}

// ====================== 전자계약 (간소) ======================
function vContract(){
  const t=T();
  return `<h1 class="text-2xl font-bold">${L('nav_contract')} <span class="text-base font-normal text-slate-400">· ${tName(t)}</span></h1>
  <div class="mt-2 text-sm text-slate-500">${B('근로/용역/NDA 계약을 한글 PDF로 발급. (세부 워크플로는 v2 모듈과 연동)','Issue contracts as Korean PDF.')}</div>
  <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
    ${[['근로계약서','표준 근로계약서'],['용역계약서','용역 표준계약'],['NDA','비밀유지계약']].map(([k,d])=>`
    <div class="bg-white rounded-2xl border p-5"><div class="font-semibold">${k}</div><div class="text-sm text-slate-500 mt-1">${d}</div>
      <button data-contract-pdf="${k}" class="mt-4 w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">한글 PDF 발급</button></div>`).join('')}
  </div>`;
}

// ====================== PDF ======================
function buildTaxPdf(iv){
  const { jsPDF }=window.jspdf; const doc=new jsPDF({format:'a4',unit:'mm'});
  const ok=ensureKoreanFont(doc); const t=T(); kfont(doc,ok);
  doc.setFontSize(18); doc.text('전자세금계산서', 105, 25, {align:'center'});
  doc.setFontSize(9); doc.text('(국세청 e-세금계산서 발급 — 승인번호 '+iv.ntsCode+')', 105, 31, {align:'center'});
  doc.line(20,36,190,36);
  doc.setFontSize(11); let y=48;
  const row=(k,v)=>{ doc.text(`${k} :  ${v??'-'}`, 25, y); y+=9; };
  row('공급자', t.name+' ('+t.biz+')');
  row('공급받는자', iv.buyer+' ('+(iv.buyerBiz||'-')+')');
  row('작성일자', iv.date);
  row('공급가액', iv.supply.toLocaleString('ko-KR')+' 원');
  row('세액(부가가치세)', iv.vat.toLocaleString('ko-KR')+' 원');
  doc.setFontSize(13); doc.text('합계금액 :  '+(iv.supply+iv.vat).toLocaleString('ko-KR')+' 원', 25, y+4);
  doc.setFontSize(9); doc.text('SMB 백오피스 자동 발행 · '+new Date().toLocaleString('ko-KR'), 20, 285);
  return doc;
}
function buildPayslip(emp){
  const { jsPDF }=window.jspdf; const p=calcPay(emp.salary);
  const doc=new jsPDF({format:'a4',unit:'mm'}); const ok=ensureKoreanFont(doc); const t=T(); kfont(doc,ok);
  doc.setFontSize(18); doc.text('급여명세서 — '+new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long'}), 105,25,{align:'center'});
  doc.setFontSize(10); doc.text(t.name, 105,33,{align:'center'}); doc.line(20,38,190,38);
  let y=50; const row=(k,v)=>{doc.setFontSize(11);doc.text(`${k} :  ${v}`,25,y);y+=9;};
  row('성명', `${emp.name} (${emp.id})`); row('부서', emp.dept); row('입사일', emp.join); y+=3;
  doc.line(20,y,190,y); y+=8; doc.setFontSize(12);
  doc.text('지급', 25, y); doc.text('공제', 110, y); y+=9; doc.setFontSize(11);
  doc.text('기본급: '+emp.salary.toLocaleString('ko-KR'), 25, y);
  doc.text('국민연금: '+p.np.toLocaleString('ko-KR'), 110, y); y+=8;
  doc.text('건강보험: '+p.hi.toLocaleString('ko-KR'), 110, y); y+=8;
  doc.text('장기요양: '+p.lt.toLocaleString('ko-KR'), 110, y); y+=8;
  doc.text('고용보험: '+p.emp.toLocaleString('ko-KR'), 110, y); y+=8;
  doc.text('소득세+지방세: '+p.tax.toLocaleString('ko-KR'), 110, y); y+=8;
  doc.text('공제 합계: '+(p.ins+p.tax).toLocaleString('ko-KR'), 110, y); y+=12;
  doc.line(20,y,190,y); y+=11; doc.setFontSize(14);
  doc.text('실 지급액: '+p.net.toLocaleString('ko-KR')+' 원', 105, y, {align:'center'});
  doc.setFontSize(9); doc.text('SMB 백오피스 자동 발행 · '+new Date().toLocaleString('ko-KR'), 20, 285);
  return doc;
}
function buildContractPdf(kind){
  const { jsPDF }=window.jspdf; const doc=new jsPDF({format:'a4',unit:'mm'});
  const ok=ensureKoreanFont(doc); const t=T(); kfont(doc,ok);
  doc.setFontSize(18); doc.text(kind, 105, 25, {align:'center'});
  doc.setFontSize(10); doc.text(t.name+' — SMB 통합 백오피스로 발행', 105, 33, {align:'center'}); doc.line(20,38,190,38);
  let y=52; doc.setFontSize(10);
  doc.text('제1조 (목적) 본 계약은 표준 양식에 따라 체결한다.',25,y); y+=8;
  doc.text('제2조 (기간·보수) 별도 합의에 따른다.',25,y); y+=8;
  doc.text('제3조 (기타) 본 계약에 정함이 없는 사항은 관계 법령에 따른다.',25,y);
  doc.setFontSize(9); doc.text('발행일시: '+new Date().toLocaleString('ko-KR'), 20, 285);
  return doc;
}

function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1700); }

// ====================== 라우팅 ======================
const VIEWS={dash:vDash,tax:vTax,leave:vLeave,payroll:vPayroll,advisor:vAdvisor,audit:vAudit,console:vConsole,contract:vContract};
function render(){
  if(!canAccess(state.view)){ state.view='dash'; }
  renderNav();
  document.getElementById('main').innerHTML=VIEWS[state.view]();
  bind();
}

function bind(){
  document.querySelectorAll('[data-view]').forEach(a=>a.onclick=()=>{ state.view=a.dataset.view; persist(); render(); });
  const ts=document.getElementById('tenant-switch'); if(ts) ts.onchange=()=>{ state.activeTenant=ts.value; persist(); render(); toast(B('회사 전환: ','Switched: ')+tName(T())); };
  const rs=document.getElementById('role-switch'); if(rs) rs.onchange=()=>{ state.role=rs.value; persist(); render(); toast(B('권한 전환: ','Role: ')+L(state.role)); };
  const lb=document.getElementById('lang-btn'); if(lb) lb.onclick=()=>{ state.lang= state.lang==='ko'?'en':'ko'; persist(); render(); };

  // 세금계산서
  const txSync=()=>{ ['buyer','buyerbiz','item','supply'].forEach(k=>{ const el=document.getElementById('tx-'+k); if(el) state.taxForm[k==='buyerbiz'?'buyerBiz':k]=el.value; }); const ty=document.getElementById('tx-type'); if(ty) state.taxForm.taxType=ty.value; };
  // 라이브 세액 미리보기 — 전체 render 대신 calc 박스만 갱신(포커스/DOM churn 방지)
  const txLive=()=>{ txSync(); const c=calcTaxInvoice(state.taxForm.supply, state.taxForm.taxType); const box=document.getElementById('tx-calc'); if(box){ box.children[0].lastElementChild.textContent=KRW(c.supply); box.children[1].lastElementChild.textContent=KRW(c.vat); box.children[2].lastElementChild.textContent=KRW(c.total); } persist(); };
  ['tx-supply','tx-type'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.oninput=txLive; el.onchange=txLive; } });
  const txIssue=document.getElementById('tx-issue'); if(txIssue) txIssue.onclick=async()=>{
    txSync();
    const calc=calcTaxInvoice(state.taxForm.supply, state.taxForm.taxType);
    const t=T();
    const r=await issueTaxInvoiceMock({ date:new Date().toISOString().slice(0,10), taxType:state.taxForm.taxType||'과세',
      supplierBiz:t.biz, supplierName:t.name, buyer:state.taxForm.buyer, buyerBiz:state.taxForm.buyerBiz,
      item:state.taxForm.item, supply:calc.supply, vat:calc.vat, total:calc.total });
    state.lastTaxResponse='POST '+r.req.url+'\n'+JSON.stringify(r.req.headers,null,2)+'\n'+JSON.stringify(r.req.body,null,2)+'\n\n← HTTP '+r.http+'\n'+JSON.stringify(r.res,null,2);
    const id='T'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+String(t.taxInvoices.length+1).padStart(3,'0');
    t.taxInvoices.unshift({ id, date:r.req.body.writeDate, buyer:state.taxForm.buyer, buyerBiz:state.taxForm.buyerBiz, supply:calc.supply, vat:calc.vat, status:'발급완료', ntsCode:r.ntsCode });
    logAudit('세금계산서 발급', `${id} / ${KRW(calc.total)} (${r.ntsCode})`);
    persist(); render(); toast(B('세금계산서를 발급했어요 ','e-Tax issued ')+r.ntsCode);
  };
  document.querySelectorAll('[data-tax-pdf]').forEach(b=>b.onclick=()=>{ const iv=T().taxInvoices.find(x=>x.id===b.dataset.taxPdf); buildTaxPdf(iv).save(iv.id+'.pdf'); toast(B('세금계산서 PDF','Tax PDF')); });

  // 연차/근태
  const li=document.getElementById('leave-ics'); if(li) li.onclick=()=>{
    const ev=T().employees.flatMap(e=>{ const remain=Math.max(0,annualByTenure(e.join).days-e.annualUsed); return remain>0?[{ uid:'leave-'+e.id+'@smb.kr', date:new Date(Date.now()+86400000*7), title:`[연차] ${e.name} 잔여 ${remain}일`, desc:`${e.name} 연차 잔여 ${remain}일 — 소진 권장` }]:[]; });
    downloadICS('annual-leave.ics', ev); logAudit('연차 ICS 내보내기', `${ev.length}건`); toast(B('연차를 ICS로 내보냈어요 ','Leave ICS ')+`(${ev.length})`);
  };
  const lr=document.getElementById('leave-recalc'); if(lr) lr.onclick=()=>{
    T().employees.forEach(e=>{ e.annualTotal=annualByTenure(e.join).days; }); persist(); render(); toast(B('근속 기준으로 다시 정산했어요','Recalculated'));
  };

  // 급여 CSV (펌뱅킹)
  const cf=document.getElementById('csv-firmbank'); if(cf) cf.onclick=()=>{
    const t=T(); const payDate=new Date().toISOString().slice(0,10);
    const rows=t.employees.map(e=>({ bank:e.bank, acct:e.acct, name:e.name, amount:calcPay(e.salary).net }));
    const { csv, total, count }=buildFirmbankingCSV(rows, payDate);
    state.lastCsv=csv; const pre=document.getElementById('csv-preview'); pre.classList.remove('hidden'); pre.textContent=csv;
    const fn=`firmbanking_${payDate.replace(/-/g,'')}.csv`;
    downloadText(fn, csv, 'text/csv');
    logAudit('급여 이체 파일 생성', `${fn} (${count}건 / ${KRW(total)})`);
    persist(); toast(B('펌뱅킹 CSV를 만들었어요 ','Firmbanking CSV ')+`(${count}, ${KRW(total)})`);
  };
  document.querySelectorAll('[data-payslip]').forEach(b=>b.onclick=()=>{ const e=T().employees.find(x=>x.id===b.dataset.payslip); buildPayslip(e).save(`payslip_${e.id}.pdf`); toast(B('명세서 PDF','Payslip PDF')); });

  // 노무사 챗
  const cs=document.getElementById('chat-send'); if(cs) cs.onclick=()=>chatSend();
  const ci=document.getElementById('chat-in'); if(ci) ci.onkeydown=e=>{ if(e.key==='Enter') chatSend(); };
  document.querySelectorAll('.chat-quick').forEach(b=>b.onclick=()=>{ const inp=document.getElementById('chat-in'); if(inp){ inp.value=b.dataset.q; } chatSend(b.dataset.q); });

  // 콘솔
  document.querySelectorAll('[data-console-switch]').forEach(b=>b.onclick=()=>{ state.activeTenant=b.dataset.consoleSwitch; persist(); render(); toast(B('회사 전환: ','Switched: ')+tName(T())); });

  // 계약 PDF
  document.querySelectorAll('[data-contract-pdf]').forEach(b=>b.onclick=()=>{ buildContractPdf(b.dataset.contractPdf).save(b.dataset.contractPdf+'.pdf'); toast(B('계약 PDF를 발급했어요','Contract PDF')); });
}

function chatSend(force){
  const inp=document.getElementById('chat-in'); const q=(force||(inp&&inp.value)||'').trim(); if(!q) return;
  const reply=advisorReply(q);
  state.chat.push({role:'me',text:q});
  state.chat.push({role:'bot',text:reply.text,follow:reply.follow});
  persist(); render();
  const log=document.getElementById('chat-log'); if(log) log.scrollTop=log.scrollHeight;
}

render();

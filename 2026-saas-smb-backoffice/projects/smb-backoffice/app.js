// ====================================================================
// 스몰박스 SMB 백오피스 v2 — 다중 테넌트 · 한글 PDF · QR · ICS · 알림톡 mock
// ====================================================================
const KEY = 'smb_state_v2';

// ---------- 다중 회사(테넌트) 시드 ----------
function seedTenants(){
  return {
    'co-smallbox': {
      id:'co-smallbox', name:'(주)스몰박스', biz:'129-81-00001', plan:'Growth', color:'#2563eb',
      employees:[
        { id:'E001', name:'이지원', dept:'개발', join:'2024-03-01', salary:3800000, email:'lee@smb.kr', phone:'010-1111-2222' },
        { id:'E002', name:'박민서', dept:'마케팅', join:'2024-08-15', salary:3200000, email:'park@smb.kr', phone:'010-2222-3333' },
        { id:'E003', name:'최지훈', dept:'영업', join:'2025-01-10', salary:3500000, email:'choi@smb.kr', phone:'010-3333-4444' },
        { id:'E004', name:'정나연', dept:'디자인', join:'2025-04-01', salary:3400000, email:'jung@smb.kr', phone:'010-4444-5555' },
      ],
      contracts:[
        { id:'C-2024-01', kind:'근로계약서', target:'최지훈', status:'완료', sent:'2025-01-10', signed:'2025-01-10', expire:'2026-01-09', hash:'a1f3c920' },
        { id:'C-2024-02', kind:'NDA', target:'박민서', status:'완료', sent:'2026-03-30', signed:'2026-03-31', expire:'2028-03-30', hash:'b7d4e810' },
        { id:'C-2024-03', kind:'용역계약서', target:'한솔 디자인', status:'서명대기', sent:'2026-04-21', signed:null, expire:'2026-05-31', hash:null },
        { id:'C-2024-04', kind:'근로계약서', target:'정나연', status:'서명대기', sent:'2026-04-22', signed:null, expire:'2027-04-21', hash:null },
      ],
      kakao:[
        { t:'2026-04-22 09:14', to:'정나연', tpl:'근로계약 발송', result:'열람 ✓', code:200 },
        { t:'2026-04-21 16:02', to:'한솔 디자인', tpl:'용역계약 발송', result:'열람 ✓', code:200 },
        { t:'2026-04-20 18:00', to:'전 직원(4)', tpl:'급여 명세 발송', result:'4/4 열람', code:200 },
      ],
    },
    'co-bom-cafe': {
      id:'co-bom-cafe', name:'봄날카페', biz:'214-12-55667', plan:'Basic', color:'#db2777',
      employees:[
        { id:'E001', name:'한가람', dept:'매장', join:'2025-02-01', salary:2300000, email:'han@bom.kr', phone:'010-5555-6666' },
        { id:'E002', name:'오세윤', dept:'베이커리', join:'2025-06-01', salary:2500000, email:'oh@bom.kr', phone:'010-6666-7777' },
        { id:'E003', name:'문서아', dept:'매장', join:'2026-01-15', salary:2200000, email:'moon@bom.kr', phone:'010-7777-8888' },
      ],
      contracts:[
        { id:'B-2025-01', kind:'근로계약서', target:'한가람', status:'완료', sent:'2025-02-01', signed:'2025-02-01', expire:'2026-01-31', hash:'c2a9f561' },
        { id:'B-2026-01', kind:'근로계약서', target:'문서아', status:'서명대기', sent:'2026-01-15', signed:null, expire:'2027-01-14', hash:null },
      ],
      kakao:[
        { t:'2026-01-15 10:00', to:'문서아', tpl:'근로계약 발송', result:'열람 ✓', code:200 },
      ],
    },
    'co-techlab': {
      id:'co-techlab', name:'테크랩 스튜디오', biz:'305-88-12345', plan:'Pro', color:'#0891b2',
      employees:[
        { id:'E001', name:'서준호', dept:'연구', join:'2023-09-01', salary:5200000, email:'seo@techlab.io', phone:'010-8888-9999' },
        { id:'E002', name:'임채원', dept:'연구', join:'2024-05-01', salary:4800000, email:'lim@techlab.io', phone:'010-9999-0000' },
        { id:'E003', name:'강도윤', dept:'프로덕트', join:'2024-11-01', salary:4500000, email:'kang@techlab.io', phone:'010-1212-3434' },
        { id:'E004', name:'윤하늘', dept:'경영지원', join:'2025-03-01', salary:3900000, email:'yoon@techlab.io', phone:'010-3434-5656' },
        { id:'E005', name:'배시우', dept:'프로덕트', join:'2025-07-01', salary:4200000, email:'bae@techlab.io', phone:'010-5656-7878' },
      ],
      contracts:[
        { id:'T-2023-01', kind:'근로계약서', target:'서준호', status:'완료', sent:'2023-09-01', signed:'2023-09-01', expire:'2026-08-31', hash:'d8e1b743' },
        { id:'T-2024-09', kind:'NDA', target:'강도윤', status:'완료', sent:'2024-11-01', signed:'2024-11-02', expire:'2029-11-01', hash:'e4c7a209' },
        { id:'T-2026-01', kind:'용역계약서', target:'클라우드인프라(주)', status:'서명대기', sent:'2026-05-02', signed:null, expire:'2026-12-31', hash:null },
      ],
      kakao:[
        { t:'2026-05-02 11:20', to:'클라우드인프라(주)', tpl:'용역계약 발송', result:'열람 ✓', code:200 },
        { t:'2026-04-30 18:00', to:'전 직원(5)', tpl:'급여 명세 발송', result:'5/5 열람', code:200 },
      ],
    },
  };
}

let state = JSON.parse(localStorage.getItem(KEY) || 'null');
if (!state) {
  state = { view:'dash', activeTenant:'co-smallbox', tenants:seedTenants(),
            wfStep:1, wfData:{}, signImg:null, theme:'light',
            chat:[{role:'bot', text:'안녕하세요, 노무 자문 챗봇이에요. 연차·해고·최저임금·수습·4대보험 등을 물어봐 주세요.'}],
            empView:null };
  persist();
}
// 마이그레이션 안전장치
if (!state.tenants) { localStorage.removeItem(KEY); location.reload(); }
function persist(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function T(){ return state.tenants[state.activeTenant]; }

const KRW = n => '₩ ' + Math.round(n).toLocaleString('ko-KR');

// ---------- 급여 누진 계산 (실 알고리즘) ----------
// 본인부담 요율 2025 근사: 국민연금4.5% 건강3.545% 장기요양=건강×12.95% 고용0.9% 산재0(사업주전액)
const RATES = { np:0.045, hi:0.03545, ltOnHi:0.1295, lt:0.009, ph:0 };
function calcIncomeTax(monthly){
  const annual = monthly*12; let tax;
  if (annual<=14000000) tax=annual*0.06;
  else if (annual<=50000000) tax=840000+(annual-14000000)*0.15;
  else if (annual<=88000000) tax=6240000+(annual-50000000)*0.24;
  else tax=15360000+(annual-88000000)*0.35;
  const yearly=Math.max(0,tax-550000);
  return Math.round((yearly/12)*1.1); // 지방소득세 10% 가산
}
function calcPay(s){
  const np=Math.round(s*RATES.np), hi=Math.round(s*RATES.hi);
  const lt=Math.round(hi*RATES.ltOnHi), emp=Math.round(s*RATES.lt), ph=0;
  const tax=calcIncomeTax(s); const ins=np+hi+lt+emp;
  return { np,hi,lt,emp,ph,ins,tax,net:s-ins-tax };
}

// ---------- 서명 해시 (실 알고리즘 — djb2 변형 hex) ----------
function signHash(str){
  let h=5381; for(let i=0;i<str.length;i++){ h=((h<<5)+h)+str.charCodeAt(i); h=h>>>0; }
  // 2차 혼합으로 길이 확보
  let h2=2166136261>>>0; for(let i=0;i<str.length;i++){ h2^=str.charCodeAt(i); h2=Math.imul(h2,16777619)>>>0; }
  return (h.toString(16).padStart(8,'0') + h2.toString(16).padStart(8,'0'));
}

// ---------- 한글 PDF 폰트 로딩 (외부 통합: 로컬 번들 → CDN fetch 폴백) ----------
let _fontReady=false, _fontMode='none';
async function ensureKoreanFont(doc){
  if (window.__nanumB64){ injectFont(doc, window.__nanumB64); _fontMode='local-bundle'; return true; }
  // 1) 로컬 번들 (오프라인 자체완결)
  if (window.NANUM_GOTHIC_B64 && window.NANUM_GOTHIC_B64.length>10000){
    window.__nanumB64 = window.NANUM_GOTHIC_B64;
    injectFont(doc, window.__nanumB64); _fontMode='local-bundle'; return true;
  }
  // 2) 폴백 — Google Fonts 에서 NanumGothic TTF fetch (외부 통합 #1)
  try{
    const css = await (await fetch('https://fonts.googleapis.com/css?family=Nanum+Gothic&subset=korean')).text();
    const m = css.match(/url\((https:[^)]+\.ttf)\)/);
    if(!m) throw new Error('ttf url not found');
    const buf = await (await fetch(m[1])).arrayBuffer();
    let bin=''; const b=new Uint8Array(buf); for(let i=0;i<b.length;i++) bin+=String.fromCharCode(b[i]);
    window.__nanumB64 = btoa(bin);
    injectFont(doc, window.__nanumB64); _fontMode='cdn-fetch'; return true;
  }catch(e){
    console.warn('한글 폰트 로드 실패, latin 폴백:', e.message); _fontMode='fallback-latin'; return false;
  }
}
function injectFont(doc, b64){ doc.addFileToVFS('Nanum.ttf', b64); doc.addFont('Nanum.ttf','Nanum','normal'); }
function kfont(doc, ok){ doc.setFont(ok?'Nanum':'helvetica','normal'); }

// ---------- 네비게이션 ----------
const NAV = [
  ['dash','📊','대시보드'], ['contract','📝','전자계약'], ['workflow','🔄','계약 워크플로'],
  ['verify','🔍','QR 검증'], ['attendance','⏰','근태·캘린더'], ['payroll','💰','급여'],
  ['employees','👥','직원 관리'], ['portal','🙋','직원 대시보드'],
  ['kakao','💬','알림톡 발송'], ['advisor','⚖️','노무사 챗'], ['docs','📁','문서함'],
];
const BOTTOM = [['dash','📊','홈'],['contract','📝','계약'],['payroll','💰','급여'],['advisor','⚖️','자문'],['portal','🙋','내정보']];

function renderNav(){
  document.getElementById('nav').innerHTML = NAV.map(([k,i,n])=>`<a data-view="${k}" class="block px-3 py-2 rounded text-sm cursor-pointer ${state.view===k?'bg-blue-50 text-blue-700 font-semibold':'text-slate-700 hover:bg-slate-50'}">${i} ${n}</a>`).join('');
  document.getElementById('bottomnav').innerHTML = BOTTOM.map(([k,i,n])=>`<button data-view="${k}" class="flex flex-col items-center px-2 py-1 ${state.view===k?'text-blue-600 font-semibold':'text-slate-500'}"><span class="text-lg leading-none">${i}</span><span>${n}</span></button>`).join('');
  // 테넌트 스위처
  const sel = document.getElementById('tenant-switch');
  sel.innerHTML = Object.values(state.tenants).map(t=>`<option value="${t.id}" ${t.id===state.activeTenant?'selected':''}>${t.name}</option>`).join('');
  const t=T(); document.getElementById('tenant-meta').textContent = `사업자 ${t.biz} · ${t.plan} · 직원 ${t.employees.length}명`;
}

// ====================== 화면 ======================
function vDash(){
  const t=T();
  const totalSalary=t.employees.reduce((a,b)=>a+b.salary,0);
  const totalNet=t.employees.reduce((a,b)=>a+calcPay(b.salary).net,0);
  const pending=t.contracts.filter(c=>c.status==='서명대기').length;
  return `<h1 class="text-2xl font-bold">대시보드 <span class="text-base font-normal text-slate-400">· ${t.name}</span></h1>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    ${kpi('직원 수', t.employees.length+'명','4대보험 자동 계산')}
    ${kpi('대기 계약', pending+'건','알림톡 발송 대상')}
    ${kpi('이번달 총급여', KRW(totalSalary), `실 지급 ${KRW(totalNet)}`)}
    ${kpi('알림톡 누계', t.kakao.length+'건','최근 7일')}
  </div>
  <section class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
    <div class="bg-white rounded-2xl p-5 border"><div class="font-semibold mb-3">최근 알림톡 활동</div>
      <ul class="text-sm space-y-2 text-slate-700">
        ${t.kakao.slice(0,5).map(k=>`<li>· ${k.t} — <b>${k.to}</b> · ${k.tpl} <span class="text-emerald-600 text-xs">${k.result}</span></li>`).join('')}
      </ul></div>
    <div class="bg-white rounded-2xl p-5 border"><div class="font-semibold mb-3">대기중 계약</div>
      <ul class="text-sm space-y-2 text-slate-700">
        ${t.contracts.filter(c=>c.status==='서명대기').map(c=>`<li>· <b>${c.kind}</b> → ${c.target} (발송 ${c.sent})</li>`).join('') || '<li class="text-slate-400">대기중인 계약이 아직 없어요</li>'}
      </ul></div>
  </section>`;
}
function kpi(l,v,s){ return `<div class="bg-white rounded-2xl p-5 border"><div class="text-xs text-slate-500">${l}</div><div class="text-2xl font-bold mt-1">${v}</div><div class="text-xs text-slate-500 mt-1">${s}</div></div>`; }

function vContract(){
  const t=T();
  return `<h1 class="text-2xl font-bold">전자계약 <span class="text-base font-normal text-slate-400">· ${t.name}</span></h1>
  <div class="mt-2 text-sm text-slate-500">한글 PDF(NanumGothic 임베드) · QR 검증 발급 · ICS 만료 알림 · 알림톡 발송</div>
  <div class="mt-4 flex gap-2 flex-wrap">
    <button id="new-c" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">+ 새 계약 워크플로</button>
    <button id="ics-contracts" class="px-4 py-2 rounded-lg border bg-white font-semibold">📅 계약 만료 ICS 내보내기</button>
  </div>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <table class="w-full text-sm min-w-[640px]">
      <thead class="bg-slate-50 text-slate-600"><tr><th class="text-left p-3">계약 ID</th><th class="text-left p-3">유형</th><th class="text-left p-3">상대방</th><th class="text-left p-3">상태</th><th class="text-left p-3">만료일</th><th class="text-right p-3">동작</th></tr></thead>
      <tbody>${t.contracts.map(c=>`<tr class="border-t">
        <td class="p-3 font-mono text-xs">${c.id}</td><td class="p-3">${c.kind}</td><td class="p-3">${c.target}</td>
        <td class="p-3 ${c.status==='서명대기'?'text-amber-600':'text-emerald-600'}">${c.status}</td>
        <td class="p-3 text-xs">${c.expire||'-'}</td>
        <td class="p-3 text-right whitespace-nowrap">
          <button data-pdf="${c.id}" class="text-blue-600 text-xs">한글PDF</button>
          ${c.hash?`<button data-qr="${c.id}" class="text-purple-600 text-xs ml-2">QR</button>`:''}
        </td></tr>`).join('')}</tbody>
    </table>
  </div>
  <dialog id="qr-dlg" class="rounded-2xl p-0 w-[360px] backdrop:bg-black/40">
    <div class="p-6 text-center">
      <h3 class="font-semibold mb-1">계약 검증 QR</h3>
      <div id="qr-box" class="flex justify-center my-4"></div>
      <div id="qr-cap" class="text-xs text-slate-500 break-all"></div>
      <button onclick="document.getElementById('qr-dlg').close()" class="mt-4 px-4 py-2 rounded-lg border">닫기</button>
    </div>
  </dialog>`;
}

function vWorkflow(){
  const step=state.wfStep||1;
  const dot=i=>`<div class="w-7 h-7 rounded-full ${step>=i?'bg-blue-600 text-white':'bg-slate-200 text-slate-500'} font-bold flex items-center justify-center text-sm">${i}</div>`;
  const line=i=>`<div class="flex-1 h-1 ${step>i?'bg-blue-600':'bg-slate-200'} mx-2"></div>`;
  return `<h1 class="text-2xl font-bold">계약 발행 워크플로</h1>
  <div class="mt-6 flex items-center">${dot(1)}${line(1)}${dot(2)}${line(2)}${dot(3)}${line(3)}${dot(4)}</div>
  <div class="flex justify-between text-xs text-slate-500 mt-2"><span>1.템플릿</span><span>2.변수</span><span>3.한글PDF</span><span>4.서명·QR·발송</span></div>
  <div class="mt-8">${[wfStep1,wfStep2,wfStep3,wfStep4][step-1]()}</div>`;
}
function wfStep1(){
  const tpls=[
    {id:'근로계약서',desc:'표준 근로계약서 — 고용노동부 표준 양식 기반'},
    {id:'용역계약서',desc:'용역(SI·디자인·콘텐츠) 표준 계약서'},
    {id:'NDA',desc:'비밀유지계약서'},
  ];
  return `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    ${tpls.map(t=>`<button data-tpl="${t.id}" class="text-left bg-white rounded-2xl border p-5 hover:border-blue-500 hover:shadow"><div class="font-semibold">${t.id}</div><div class="text-sm text-slate-500 mt-1">${t.desc}</div></button>`).join('')}
  </div>`;
}
function wfStep2(){
  const k=state.wfData.kind;
  const fields={ '근로계약서':[['상대방(이름)','employee','정나연'],['시작일','startDate','2026-04-22'],['직책','position','UI/UX 디자이너'],['월급(원)','salary','3400000']],
    '용역계약서':[['용역사(상호)','vendor','한솔 디자인'],['프로젝트명','project','SMB 백오피스 UI 키트'],['대금(원)','fee','5000000'],['납기일','dueDate','2026-05-31']],
    'NDA':[['상대방','party','박민서'],['기한(년)','term','2'],['범위','scope','전 사업영역의 영업비밀']] }[k];
  return `<div class="bg-white rounded-2xl border p-6 max-w-xl space-y-3">
    <div class="text-sm text-slate-500">템플릿: <b>${k}</b></div>
    ${fields.map(([l,n,v])=>`<label class="block"><span class="text-xs text-slate-500">${l}</span><input id="wf-${n}" value="${state.wfData[n]||v}" class="mt-1 w-full border rounded-lg p-3 text-sm"></label>`).join('')}
    <div class="flex gap-2 pt-2"><button data-back class="flex-1 py-2 rounded-lg border">이전</button><button data-next class="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold">다음 → 한글 PDF</button></div>
  </div>`;
}
function wfStep3(){
  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-2xl border p-6">
      <div class="text-sm text-slate-500">한글 PDF 미리보기 (jsPDF + NanumGothic 임베드)</div>
      <div id="font-status" class="text-xs text-emerald-600 mt-1">한글 폰트를 불러오는 중이에요…</div>
      <iframe id="pdf-iframe" class="w-full h-[520px] mt-3 border rounded"></iframe>
    </div>
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">생성된 계약서 정보</div>
      <table class="text-sm w-full"><tbody>${Object.entries(state.wfData).filter(([k])=>k!=='kind').map(([k,v])=>`<tr class="border-t"><td class="p-2 text-slate-500">${k}</td><td class="p-2">${v}</td></tr>`).join('')}</tbody></table>
      <div class="mt-6 space-y-2">
        <button id="dl-pdf" class="w-full py-2 rounded-lg border">한글 PDF 다운로드</button>
        <button data-back class="w-full py-2 rounded-lg border">이전</button>
        <button data-next class="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold">다음 → 서명·QR·발송</button>
      </div>
    </div>
  </div>`;
}
function wfStep4(){
  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">서명란</div>
      <canvas id="sig" width="500" height="180" class="border rounded-lg bg-slate-50 w-full touch-none"></canvas>
      <div class="flex gap-2 mt-3"><button id="sig-clear" class="flex-1 py-2 rounded-lg border">지우기</button><button id="sig-save" class="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold">서명 저장 → QR 생성</button></div>
      <div id="sig-qr" class="mt-4 flex flex-col items-center"></div>
    </div>
    <div class="bg-white rounded-2xl border p-6 space-y-3">
      <div class="font-semibold">발송 (알림톡 mock API)</div>
      <div class="text-sm text-slate-500">상대방: <b>${state.wfData.employee||state.wfData.vendor||state.wfData.party||'-'}</b></div>
      <label class="block"><span class="text-xs text-slate-500">알림 채널</span>
        <select id="ch" class="mt-1 w-full border rounded-lg p-2 text-sm"><option>카카오 알림톡</option><option>이메일</option><option>SMS</option></select></label>
      <button id="send-final" class="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold">서명 해시 + QR + 알림톡 발송</button>
      <pre id="api-log" class="hidden bg-slate-900 text-emerald-300 text-[11px] rounded-lg p-3 overflow-x-auto"></pre>
      <div id="wf-done" class="hidden bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">발송했어요! 계약·알림톡 로그·QR 검증에 추가했어요.</div>
    </div>
  </div>`;
}

// ---------- QR 계약 검증 페이지 ----------
function vVerify(){
  const t=T();
  const v=state.verifyInput||'';
  const found = state.verifyResult;
  return `<h1 class="text-2xl font-bold">QR 계약 검증</h1>
  <div class="mt-2 text-sm text-slate-500">계약 발행 시 생성된 서명 해시를 QR로 인코딩. 수신자가 코드/해시를 입력하면 위·변조 여부를 검증.</div>
  <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">검증 코드 입력</div>
      <input id="vf-in" value="${v}" placeholder="예: C-2024-01:a1f3c920..." class="w-full border rounded-lg p-3 text-sm font-mono">
      <button id="vf-go" class="mt-3 w-full py-2 rounded-lg bg-purple-600 text-white font-semibold">검증</button>
      <div class="mt-3 text-xs text-slate-400">완료된 계약의 QR 토큰: ${t.contracts.filter(c=>c.hash).map(c=>`<button class="vf-quick text-purple-600 underline" data-tok="${c.id}:${c.hash}">${c.id}</button>`).join(', ')||'아직 없어요'}</div>
    </div>
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">검증 결과</div>
      ${found ? (found.ok
        ? `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
             <div class="text-emerald-700 font-bold text-lg">✓ 유효한 계약</div>
             <table class="text-sm mt-3 w-full"><tbody>
               <tr class="border-t"><td class="p-2 text-slate-500">계약 ID</td><td class="p-2 font-mono">${found.c.id}</td></tr>
               <tr class="border-t"><td class="p-2 text-slate-500">유형</td><td class="p-2">${found.c.kind}</td></tr>
               <tr class="border-t"><td class="p-2 text-slate-500">상대방</td><td class="p-2">${found.c.target}</td></tr>
               <tr class="border-t"><td class="p-2 text-slate-500">서명 해시</td><td class="p-2 font-mono text-xs">${found.c.hash}</td></tr>
               <tr class="border-t"><td class="p-2 text-slate-500">상태</td><td class="p-2 text-emerald-600">${found.c.status}</td></tr>
             </tbody></table></div>`
        : `<div class="bg-red-50 border border-red-200 rounded-xl p-4"><div class="text-red-700 font-bold text-lg">✗ 검증 실패</div><div class="text-sm text-red-600 mt-1">${found.msg}</div></div>`)
        : '<div class="text-slate-400 text-sm">왼쪽에서 코드를 입력하거나 토큰을 눌러보세요.</div>'}
    </div>
  </div>`;
}

function vAttendance(){
  const t=T(); const today=new Date(); const week=['월','화','수','목','금','토','일'];
  return `<h1 class="text-2xl font-bold">근태·캘린더</h1>
  <button id="ics-shift" class="mt-4 px-4 py-2 rounded-lg border bg-white font-semibold">📅 이번 주 시프트 ICS 내보내기</button>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">이번 주 출퇴근 (예시)</div>
      <table class="w-full text-sm"><thead class="bg-slate-50 text-slate-600"><tr><th class="p-3 text-left">요일</th><th class="p-3 text-right">출근</th><th class="p-3 text-right">퇴근</th><th class="p-3 text-right">근무</th></tr></thead>
      <tbody>${week.map((d,i)=>i<5?`<tr class="border-t"><td class="p-3">${d}</td><td class="p-3 text-right">09:0${i+1}</td><td class="p-3 text-right">18:1${i}</td><td class="p-3 text-right text-emerald-600">9시간</td></tr>`:`<tr class="border-t"><td class="p-3">${d}</td><td colspan="3" class="p-3 text-right text-slate-400">휴무</td></tr>`).join('')}</tbody></table>
    </div>
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">시프트 캘린더 — ${today.getFullYear()}.${today.getMonth()+1}</div>
      <div class="grid grid-cols-7 gap-1 text-xs">${week.map(d=>`<div class="text-center text-slate-500 p-1">${d}</div>`).join('')}
      ${Array.from({length:28},(_,i)=>{const off=i%7>=5; return `<div class="aspect-square border rounded p-1 ${off?'bg-slate-50 text-slate-400':'bg-emerald-50'}">${i+1}<div class="text-[10px]">${off?'휴무':'주간'}</div></div>`;}).join('')}</div>
    </div>
  </div>`;
}

function vPayroll(){
  const t=T();
  return `<h1 class="text-2xl font-bold">급여 명세 — 이번 달 <span class="text-base font-normal text-slate-400">· ${t.name}</span></h1>
  <div class="text-sm text-slate-500 mt-1">4대보험 + 소득세 누진 자동 계산. 명세서는 한글 PDF로 즉시 발급.</div>
  <div class="bg-white rounded-2xl border mt-6 overflow-x-auto">
    <table class="w-full text-sm min-w-[680px]">
      <thead class="bg-slate-50 text-slate-600"><tr><th class="text-left p-3">직원</th><th class="text-left p-3">부서</th><th class="text-right p-3">기본급</th><th class="text-right p-3">4대보험</th><th class="text-right p-3">소득세</th><th class="text-right p-3">실 지급</th><th class="text-center p-3">동작</th></tr></thead>
      <tbody>${t.employees.map(e=>{const p=calcPay(e.salary); return `<tr class="border-t">
        <td class="p-3 font-medium">${e.name}</td><td class="p-3">${e.dept}</td>
        <td class="p-3 text-right">${KRW(e.salary)}</td><td class="p-3 text-right text-slate-500">${KRW(p.ins)}</td>
        <td class="p-3 text-right text-slate-500">${KRW(p.tax)}</td><td class="p-3 text-right font-semibold">${KRW(p.net)}</td>
        <td class="p-3 text-center space-x-1 whitespace-nowrap">
          <button data-payslip="${e.id}" class="px-2 py-1 rounded bg-slate-100 text-xs font-semibold">명세서 PDF</button>
          <button data-notify="${e.id}" class="px-2 py-1 rounded bg-yellow-300 text-yellow-900 text-xs font-bold">알림톡</button>
        </td></tr>`;}).join('')}</tbody>
    </table>
  </div>
  <details class="mt-4 bg-white rounded-2xl border p-5">
    <summary class="cursor-pointer text-sm font-semibold">계산 요율 (시연 기본값)</summary>
    <table class="text-sm mt-3 w-full"><tbody>${[
      ['국민연금 (본인부담)',RATES.np*100,'월 기본급 × 4.5%'],
      ['건강보험 (본인부담)',RATES.hi*100,'월 기본급 × 3.545%'],
      ['장기요양보험',RATES.ltOnHi*100,'건강보험료 × 12.95%'],
      ['고용보험 (실업급여분)',RATES.lt*100,'월 기본급 × 0.9%'],
      ['산재보험',RATES.ph*100,'전액 사업주 부담 (본인 공제 0)'],
      ['소득세+지방소득세',null,'간이세액 누진율 근사 [추정]'],
    ].map(([k,v,n])=>`<tr class="border-t"><td class="p-2">${k}</td><td class="p-2 text-right">${v===null?'-':v.toFixed(3)+'%'}</td><td class="p-2 text-xs text-slate-400">${n}</td></tr>`).join('')}</tbody></table>
  </details>`;
}

function vEmployees(){
  const t=T();
  return `<h1 class="text-2xl font-bold">직원 관리 <span class="text-base font-normal text-slate-400">· ${t.name}</span></h1>
  <button id="emp-add" class="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">+ 직원 추가</button>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <table class="w-full text-sm min-w-[640px]"><thead class="bg-slate-50 text-slate-600"><tr><th class="text-left p-3">사번</th><th class="text-left p-3">이름</th><th class="text-left p-3">부서</th><th class="text-left p-3">입사일</th><th class="text-right p-3">월급</th><th class="text-left p-3">연락처</th><th class="text-right p-3">동작</th></tr></thead>
      <tbody>${t.employees.map(e=>`<tr class="border-t"><td class="p-3 font-mono text-xs">${e.id}</td><td class="p-3 font-medium">${e.name}</td><td class="p-3">${e.dept}</td><td class="p-3">${e.join}</td><td class="p-3 text-right">${KRW(e.salary)}</td><td class="p-3 text-xs text-slate-500">${e.phone}</td>
        <td class="p-3 text-right space-x-2"><button data-edit="${e.id}" class="text-xs text-blue-600">편집</button><button data-del="${e.id}" class="text-xs text-red-600">삭제</button></td></tr>`).join('')}</tbody></table>
  </div>
  <dialog id="emp-dlg" class="rounded-2xl p-0 backdrop:bg-black/40 w-[480px] max-w-[92vw]">
    <form method="dialog" class="p-6 space-y-3">
      <h3 id="emp-dlg-title" class="text-lg font-semibold">직원 추가</h3>
      <input id="ef-name" placeholder="이름" class="w-full border rounded-lg p-3 text-sm">
      <div class="grid grid-cols-2 gap-2"><input id="ef-dept" placeholder="부서" class="border rounded-lg p-3 text-sm"><input id="ef-join" type="date" class="border rounded-lg p-3 text-sm"></div>
      <input id="ef-salary" type="number" placeholder="월급(원)" class="w-full border rounded-lg p-3 text-sm">
      <div class="grid grid-cols-2 gap-2"><input id="ef-email" type="email" placeholder="이메일" class="border rounded-lg p-3 text-sm"><input id="ef-phone" placeholder="연락처" class="border rounded-lg p-3 text-sm"></div>
      <div class="flex justify-end gap-2"><button value="cancel" class="px-4 py-2 rounded-lg border">취소</button><button id="ef-save" value="ok" class="px-4 py-2 rounded-lg bg-blue-600 text-white">저장</button></div>
    </form>
  </dialog>`;
}

// ---------- 직원 대시보드 (개인 포털) ----------
function vPortal(){
  const t=T();
  const eid = state.empView || t.employees[0]?.id;
  const e = t.employees.find(x=>x.id===eid) || t.employees[0];
  if(!e) return `<h1 class="text-2xl font-bold">직원 대시보드</h1><p class="text-slate-400 mt-4">아직 등록된 직원이 없어요.</p>`;
  const p=calcPay(e.salary);
  const myContracts=t.contracts.filter(c=>c.target===e.name);
  return `<h1 class="text-2xl font-bold">직원 대시보드 (개인 포털)</h1>
  <div class="mt-2 text-sm text-slate-500">직원 본인이 로그인해 개인 명세를 조회하고 미서명 계약에 전자서명하는 화면 (역할 분기 시뮬레이션).</div>
  <div class="mt-4 flex items-center gap-2 flex-wrap">
    <span class="text-sm text-slate-500">직원 전환:</span>
    <select id="portal-emp" class="border rounded-lg p-2 text-sm">${t.employees.map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${x.name} (${x.dept})</option>`).join('')}</select>
    <span class="ml-auto px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">역할: 직원</span>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div class="bg-white rounded-2xl border p-5"><div class="text-xs text-slate-500">이번 달 실수령</div><div class="text-2xl font-bold mt-1">${KRW(p.net)}</div><div class="text-xs text-slate-500 mt-1">기본급 ${KRW(e.salary)}</div></div>
    <div class="bg-white rounded-2xl border p-5"><div class="text-xs text-slate-500">공제 합계</div><div class="text-2xl font-bold mt-1">${KRW(p.ins+p.tax)}</div><div class="text-xs text-slate-500 mt-1">4대보험+소득세</div></div>
    <div class="bg-white rounded-2xl border p-5"><div class="text-xs text-slate-500">내 계약</div><div class="text-2xl font-bold mt-1">${myContracts.length}건</div><div class="text-xs text-slate-500 mt-1">${myContracts.filter(c=>c.status==='서명대기').length}건 서명대기</div></div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">내 급여 명세</div>
      <table class="w-full text-sm"><tbody>
        <tr class="border-t"><td class="p-2 text-slate-500">기본급</td><td class="p-2 text-right">${KRW(e.salary)}</td></tr>
        <tr class="border-t"><td class="p-2 text-slate-500">국민연금</td><td class="p-2 text-right">-${KRW(p.np)}</td></tr>
        <tr class="border-t"><td class="p-2 text-slate-500">건강+장기요양</td><td class="p-2 text-right">-${KRW(p.hi+p.lt)}</td></tr>
        <tr class="border-t"><td class="p-2 text-slate-500">고용보험</td><td class="p-2 text-right">-${KRW(p.emp)}</td></tr>
        <tr class="border-t"><td class="p-2 text-slate-500">소득세+지방세</td><td class="p-2 text-right">-${KRW(p.tax)}</td></tr>
        <tr class="border-t font-bold"><td class="p-2">실 수령액</td><td class="p-2 text-right text-blue-600">${KRW(p.net)}</td></tr>
      </tbody></table>
      <button id="portal-payslip" class="mt-4 w-full py-2 rounded-lg border font-semibold">내 명세서 한글 PDF</button>
    </div>
    <div class="bg-white rounded-2xl border p-6">
      <div class="font-semibold mb-3">내 계약 / 전자서명</div>
      ${myContracts.length? myContracts.map(c=>`<div class="border rounded-xl p-3 mb-2 flex items-center justify-between">
        <div><div class="font-medium text-sm">${c.kind} <span class="font-mono text-xs text-slate-400">${c.id}</span></div><div class="text-xs ${c.status==='서명대기'?'text-amber-600':'text-emerald-600'}">${c.status}</div></div>
        ${c.status==='서명대기'?`<button data-portal-sign="${c.id}" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">서명하기</button>`:`<span class="text-emerald-600 text-xs">✓ 완료</span>`}
      </div>`).join('') : '<div class="text-slate-400 text-sm">아직 배정된 계약이 없어요.</div>'}
      <canvas id="psig" width="400" height="120" class="border rounded-lg bg-slate-50 w-full mt-3 touch-none hidden"></canvas>
      <div id="psig-ctl" class="hidden gap-2 mt-2"><button id="psig-clear" class="flex-1 py-2 rounded-lg border text-sm">지우기</button><button id="psig-save" class="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">서명 완료</button></div>
    </div>
  </div>`;
}

function vKakao(){
  const t=T();
  return `<h1 class="text-2xl font-bold">알림톡 발송 <span class="text-base font-normal text-slate-400">· ${t.name}</span></h1>
  <div class="mt-2 text-sm text-slate-500">키 부재 시 mock API 흐름(요청/응답 시뮬레이션). 실 발송은 NHN Toast/카카오 비즈메시지 키 주입 시 활성화.</div>
  <div class="mt-4 flex gap-2 flex-wrap">
    <button id="kakao-test" class="px-4 py-2 rounded-lg bg-yellow-300 text-yellow-900 font-bold">테스트 알림톡 발송 (mock API)</button>
  </div>
  <pre id="kakao-api" class="hidden mt-4 bg-slate-900 text-emerald-300 text-[11px] rounded-lg p-4 overflow-x-auto"></pre>
  <div class="mt-6 bg-white rounded-2xl border overflow-x-auto">
    <table class="w-full text-sm min-w-[560px]"><thead class="bg-slate-50 text-slate-600"><tr><th class="text-left p-3">시각</th><th class="text-left p-3">수신</th><th class="text-left p-3">템플릿</th><th class="text-left p-3">HTTP</th><th class="text-left p-3">결과</th></tr></thead>
      <tbody>${t.kakao.map(k=>`<tr class="border-t"><td class="p-3 text-xs text-slate-500">${k.t}</td><td class="p-3">${k.to}</td><td class="p-3">${k.tpl}</td><td class="p-3 font-mono text-xs ${(k.code||200)<400?'text-emerald-600':'text-red-600'}">${k.code||200}</td><td class="p-3 text-emerald-600">${k.result}</td></tr>`).join('')}</tbody></table>
  </div>`;
}

// ---------- 노무사 자문 챗 (룰 기반) ----------
function vAdvisor(){
  return `<h1 class="text-2xl font-bold">노무사 자문 챗</h1>
  <div class="mt-2 text-sm text-slate-500">룰 기반 자동 응답(키워드 매칭). 법적 효력 없음 — 정식 자문은 공인노무사. [추정 근거: 근로기준법·최저임금법]</div>
  <div class="mt-4 bg-white rounded-2xl border p-4 max-w-2xl">
    <div id="chat-log" class="space-y-3 h-[380px] overflow-y-auto p-2">
      ${state.chat.map(m=>chatBubble(m)).join('')}
    </div>
    <div class="mt-3 flex gap-2"><input id="chat-in" placeholder="예: 연차는 며칠인가요?" class="flex-1 border rounded-lg p-3 text-sm"><button id="chat-send" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">전송</button></div>
    <div class="mt-2 flex gap-2 flex-wrap text-xs">
      ${['연차 며칠','최저임금','수습 감액','해고 예고','4대보험','주휴수당'].map(q=>`<button class="chat-quick px-2 py-1 rounded-full border text-slate-600" data-q="${q}">${q}</button>`).join('')}
    </div>
  </div>`;
}
function chatBubble(m){
  return m.role==='me'
    ? `<div class="flex justify-end"><div class="chat-bubble-me px-3 py-2 text-sm max-w-[80%]">${m.text}</div></div>`
    : `<div class="flex justify-start"><div class="chat-bubble-bot px-3 py-2 text-sm max-w-[85%] whitespace-pre-line">${m.text}</div></div>`;
}
function advisorReply(q){
  const s=q.toLowerCase();
  const rules=[
    [['연차','연차휴가','휴가일수'], '연차유급휴가: 1년간 80% 이상 출근 시 15일 발생. 3년 이상 근속마다 1일씩 가산(최대 25일). 입사 1년 미만은 1개월 개근당 1일(최대 11일). 근거: 근로기준법 제60조. [참고]'],
    [['최저임금','시급'], '2026년 최저임금은 시급 기준으로 고시값을 확인해야 합니다(연도별 고시). 월 환산은 주 40시간+주휴 포함 209시간 기준. 미만 지급 시 최저임금법 위반. 근거: 최저임금법 제6조. [연도 고시값 확인 필요]'],
    [['수습','감액','수습기간'], '수습 사용 근로자는 수습 시작 후 3개월 이내에 한해 최저임금의 90%까지 감액 가능. 단, 1년 미만 계약이거나 단순노무직은 감액 불가. 근거: 최저임금법 시행령 제3조. [참고]'],
    [['해고','해고예고','해고 통보'], '사용자는 근로자를 해고하려면 30일 전 예고하거나 30일분 통상임금(해고예고수당)을 지급해야 합니다. 3개월 미만 근속 등 예외 존재. 부당해고는 노동위원회 구제신청 대상. 근거: 근로기준법 제26·23조. [참고]'],
    [['4대보험','사대보험','보험료'], '4대보험: 국민연금(본인4.5%)·건강보험(본인3.545%+장기요양)·고용보험(본인0.9%)·산재보험(전액 사업주 부담). 본 시스템 급여 모듈이 자동 공제·명세서 발급합니다. [2025 근사 요율]'],
    [['주휴','주휴수당'], '주휴수당: 1주 소정근로 15시간 이상이고 개근 시 1일분 유급휴일 부여. 주 40시간 근로자는 통상 1일(8시간)분. 근거: 근로기준법 제55조. [참고]'],
    [['퇴직금','퇴직'], '계속근로기간 1년 이상, 4주 평균 주 15시간 이상 근로자에게 퇴직급여 지급(30일분 평균임금/년). 근거: 근로자퇴직급여 보장법 제8조. [참고]'],
    [['연장','야간','휴일','가산수당'], '연장·야간(22~06시)·휴일근로는 통상임금의 50% 가산(8시간 초과 휴일은 100%). 5인 이상 사업장 적용. 근거: 근로기준법 제56조. [참고]'],
  ];
  for(const [keys,ans] of rules){ if(keys.some(k=>s.includes(k.toLowerCase()))) return ans; }
  return '아직 등록된 키워드와 맞는 답을 못 찾았어요. \'연차/최저임금/수습/해고/4대보험/주휴/퇴직금/가산수당\' 등으로 다시 물어봐 주세요. 구체적인 사안은 공인노무사 자문을 받아보시길 권해요.';
}

function vDocs(){
  const t=T();
  const cnt=k=>t.contracts.filter(c=>c.kind===k).length;
  const cards=[['근로계약',cnt('근로계약서'),'bg-blue-50 text-blue-700'],['용역계약',cnt('용역계약서'),'bg-purple-50 text-purple-700'],['NDA',cnt('NDA'),'bg-amber-50 text-amber-700'],['세금계산서',47,'bg-emerald-50 text-emerald-700'],['재직증명',t.employees.length,'bg-slate-100 text-slate-700'],['기타',11,'bg-pink-50 text-pink-700']];
  return `<h1 class="text-2xl font-bold">문서함 <span class="text-base font-normal text-slate-400">· ${t.name}</span></h1>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">${cards.map(([n,c,cls])=>`<div class="${cls} rounded-2xl p-5"><div class="text-sm">${n}</div><div class="text-3xl font-bold mt-1">${c}건</div></div>`).join('')}</div>`;
}

// ====================== PDF (한글 NanumGothic) ======================
async function buildPdf(kind,data){
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({format:'a4',unit:'mm'});
  const ok=await ensureKoreanFont(doc);
  const t=T();
  kfont(doc,ok); doc.setFontSize(18);
  doc.text(kind, 105, 25, {align:'center'});
  doc.setFontSize(10);
  doc.text(`${t.name} — SMB 통합 백오피스 SaaS로 발행`, 105, 33, {align:'center'});
  doc.line(20,38,190,38);
  let y=50;
  const row=(k,v)=>{ doc.setFontSize(11); doc.text(`${k} :  ${v??'-'}`, 25, y); y+=9; };
  if(kind==='근로계약서'){
    row('근로자', data.employee); row('직책', data.position); row('근로개시일', data.startDate); row('월 기본급(원)', Number(data.salary||0).toLocaleString('ko-KR'));
    y+=3; doc.setFontSize(10);
    doc.text('제1조 (근로시간) 주 40시간, 월~금 09:00~18:00 (휴게 1시간 포함).',25,y); y+=7;
    doc.text('제2조 (4대보험) 국민연금·건강보험·고용보험·산재보험에 가입한다.',25,y); y+=7;
    doc.text('제3조 (수습) 근로개시일로부터 3개월간 수습기간으로 한다.',25,y); y+=7;
    doc.text('제4조 (기타) 본 계약에 정함이 없는 사항은 근로기준법에 따른다.',25,y);
  } else if(kind==='용역계약서'){
    row('용역사', data.vendor); row('프로젝트', data.project); row('대금(원)', Number(data.fee||0).toLocaleString('ko-KR')); row('납기일', data.dueDate);
    y+=3; doc.setFontSize(10);
    doc.text('제1조 (용역범위) 별첨 과업지시서에 정한 바에 따른다.',25,y); y+=7;
    doc.text('제2조 (대금지급) 착수금 30%, 납품 검수 후 잔금 70%.',25,y); y+=7;
    doc.text('제3조 (지식재산권) 최종 산출물의 권리는 대금 완납 시 발주자에게 귀속한다.',25,y);
  } else {
    row('상대방', data.party); row('기한(년)', data.term); row('보호범위', data.scope);
    y+=3; doc.setFontSize(10);
    doc.text('제1조 (비밀유지) 양 당사자는 상대방의 비밀정보를 제3자에게 누설하지 않는다.',25,y); y+=7;
    doc.text(`제2조 (기간) 본 계약은 체결일로부터 ${data.term||'-'}년간 유효하다.`,25,y);
  }
  doc.setFontSize(11); doc.line(120,250,185,250); doc.text('서명', 152,256,{align:'center'});
  if(state.signImg){ try{ doc.addImage(state.signImg,'PNG',122,228,60,20); }catch(e){} }
  doc.setFontSize(9); doc.text('발행일시: '+new Date().toLocaleString('ko-KR'), 20, 285);
  if(data.__hash){ doc.text('검증해시: '+data.__hash, 20, 290); }
  return doc;
}
async function buildPayslip(emp){
  const { jsPDF }=window.jspdf; const p=calcPay(emp.salary);
  const doc=new jsPDF({format:'a4',unit:'mm'}); const ok=await ensureKoreanFont(doc); const t=T();
  kfont(doc,ok); doc.setFontSize(18);
  doc.text('급여명세서 — '+new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long'}), 105,25,{align:'center'});
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

// ====================== ICS 생성 (실 알고리즘) ======================
function icsEscape(s){ return String(s).replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n'); }
function toICSDate(d){ // all-day → YYYYMMDD
  const dt=new Date(d); return dt.getFullYear()+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0');
}
function buildICS(events){
  const now=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  let out=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SMB Backoffice//v2//KO','CALSCALE:GREGORIAN'];
  events.forEach((e,i)=>{
    out.push('BEGIN:VEVENT');
    out.push('UID:'+(e.uid||('smb-'+i+'-'+Date.now())+'@smb.kr'));
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

// ====================== 알림톡 mock API (외부 통합 흐름) ======================
async function sendKakaoMock(to, tpl, vars){
  // 외부 SaaS(NHN Toast) REST 호출 형태를 시뮬레이션. 키 부재 → mock 응답.
  const req={ method:'POST', url:'https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/{appkey}/messages',
    headers:{ 'Content-Type':'application/json', 'X-Secret-Key':'(mock — 키 미주입)' },
    body:{ senderKey:'mock-sender', templateCode:tpl, recipientList:[{ recipientNo:'(masked)', templateParameter:vars||{} }] } };
  await new Promise(r=>setTimeout(r,400)); // 네트워크 지연 시뮬레이션
  const res={ header:{ resultCode:0, resultMessage:'success', isSuccessful:true },
    message:{ requestId:'req-'+Math.random().toString(36).slice(2,10), sendResults:[{ recipientSeq:1, resultCode:'MESSAGE_ACCEPTED' }] } };
  return { req, res, http:200, t:new Date().toLocaleString('ko-KR'), to, tpl };
}

function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1700); }

// ====================== 라우팅·바인딩 ======================
const VIEWS={dash:vDash,contract:vContract,workflow:vWorkflow,verify:vVerify,attendance:vAttendance,payroll:vPayroll,employees:vEmployees,portal:vPortal,kakao:vKakao,advisor:vAdvisor,docs:vDocs};
function render(){ renderNav(); document.getElementById('main').innerHTML=VIEWS[state.view](); bind(); }

function bind(){
  document.querySelectorAll('[data-view]').forEach(a=>a.onclick=()=>{ state.view=a.dataset.view; if(state.view!=='workflow'){ state.wfStep=1; state.wfData={}; } persist(); render(); });
  // 테넌트 스위처
  const ts=document.getElementById('tenant-switch'); if(ts) ts.onchange=()=>{ state.activeTenant=ts.value; state.empView=null; state.verifyResult=null; persist(); render(); toast('회사 전환: '+T().name); };

  // 전자계약
  document.querySelectorAll('[data-pdf]').forEach(b=>b.onclick=async()=>{
    const c=T().contracts.find(x=>x.id===b.dataset.pdf);
    const doc=await buildPdf(c.kind,{ employee:c.target, vendor:c.target, party:c.target, position:'-', startDate:c.sent, salary:0, project:'-', fee:0, dueDate:c.expire, term:'2', scope:'-', __hash:c.hash });
    doc.save(`${c.id}.pdf`); toast('한글 PDF를 내려받았어요');
  });
  document.querySelectorAll('[data-qr]').forEach(b=>b.onclick=()=>{
    const c=T().contracts.find(x=>x.id===b.dataset.qr);
    const token=`${c.id}:${c.hash}`;
    const qr=qrcode(0,'M'); qr.addData(token); qr.make();
    document.getElementById('qr-box').innerHTML=qr.createImgTag(5,8);
    document.getElementById('qr-cap').textContent=`토큰: ${token} · 검증 페이지에서 위·변조 확인`;
    document.getElementById('qr-dlg').showModal();
  });
  const icsC=document.getElementById('ics-contracts'); if(icsC) icsC.onclick=()=>{
    const ev=T().contracts.filter(c=>c.expire).map(c=>({ uid:c.id+'@smb.kr', date:c.expire, title:`[계약만료] ${c.kind} · ${c.target}`, desc:`계약 ${c.id} 만료 예정. 갱신 검토 필요.` }));
    downloadICS('contract-expiry.ics', ev); toast(`ICS로 내보냈어요 (${ev.length}건)`);
  };
  const newC=document.getElementById('new-c'); if(newC) newC.onclick=()=>{ state.view='workflow'; state.wfStep=1; state.wfData={}; persist(); render(); };

  // 워크플로
  document.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>{ state.wfData={kind:b.dataset.tpl}; state.wfStep=2; persist(); render(); });
  const next=document.querySelector('[data-next]'); if(next) next.onclick=async()=>{
    if(state.wfStep===2){ ['employee','startDate','position','salary','vendor','project','fee','dueDate','party','term','scope'].forEach(n=>{ const el=document.getElementById('wf-'+n); if(el) state.wfData[n]=el.value; }); }
    state.wfStep++; persist(); render();
    if(state.wfStep===3){
      const doc=await buildPdf(state.wfData.kind, state.wfData);
      const fs=document.getElementById('font-status'); if(fs) fs.textContent = _fontMode==='fallback-latin' ? '한글 폰트를 못 불러왔어요. 영문으로 표시될 수 있어요' : `한글 폰트를 불러왔어요 (${_fontMode})`;
      document.getElementById('pdf-iframe').src=URL.createObjectURL(doc.output('blob'));
    }
  };
  const back=document.querySelector('[data-back]'); if(back) back.onclick=()=>{ state.wfStep=Math.max(1,state.wfStep-1); persist(); render(); };
  const dl=document.getElementById('dl-pdf'); if(dl) dl.onclick=async()=>{ const doc=await buildPdf(state.wfData.kind,state.wfData); doc.save(`${state.wfData.kind}_${Date.now()}.pdf`); toast('한글 PDF를 내려받았어요'); };

  // 서명 캔버스 (워크플로)
  bindSignature('sig','sig-clear','sig-save',()=>{
    const target=state.wfData.employee||state.wfData.vendor||state.wfData.party||'';
    state.wfData.__hash=signHash(state.signImg+target+state.wfData.kind);
    persist();
    const token=`NEW:${state.wfData.__hash}`;
    const qr=qrcode(0,'M'); qr.addData(token); qr.make();
    const box=document.getElementById('sig-qr'); if(box) box.innerHTML=`<div class="text-xs text-slate-500 mb-1">검증 QR (서명 해시)</div>${qr.createImgTag(4,6)}<div class="text-[10px] text-slate-400 mt-1 font-mono break-all">${state.wfData.__hash}</div>`;
    toast('서명을 저장하고 QR을 만들었어요');
  });

  const sf=document.getElementById('send-final'); if(sf) sf.onclick=async()=>{
    if(!state.signImg){ toast('서명을 먼저 해주세요'); return; }
    const target=state.wfData.employee||state.wfData.vendor||state.wfData.party||'상대방';
    if(!state.wfData.__hash) state.wfData.__hash=signHash(state.signImg+target+state.wfData.kind);
    const id='C-'+Date.now().toString().slice(-6);
    // 알림톡 mock API 흐름
    const r=await sendKakaoMock(target, state.wfData.kind+'_발송', { 계약ID:id });
    const log=document.getElementById('api-log');
    if(log){ log.classList.remove('hidden'); log.textContent='POST '+r.req.url+'\n'+JSON.stringify(r.req.body,null,2)+'\n\n← HTTP '+r.http+'\n'+JSON.stringify(r.res,null,2); }
    const t=T();
    t.contracts.unshift({ id, kind:state.wfData.kind, target, status:'완료', sent:new Date().toISOString().slice(0,10), signed:new Date().toISOString().slice(0,10), expire:state.wfData.dueDate||'2027-12-31', hash:state.wfData.__hash });
    t.kakao.unshift({ t:r.t, to:target, tpl:state.wfData.kind+' 발송', result:'발송 완료(MESSAGE_ACCEPTED)', code:r.http });
    persist();
    const wd=document.getElementById('wf-done'); if(wd) wd.classList.remove('hidden'); toast('계약과 알림톡을 보냈어요 (mock)');
  };

  // 급여
  document.querySelectorAll('[data-payslip]').forEach(b=>b.onclick=async()=>{ const e=T().employees.find(x=>x.id===b.dataset.payslip); (await buildPayslip(e)).save(`payslip_${e.id}.pdf`); toast('명세서 한글 PDF를 내려받았어요'); });
  document.querySelectorAll('[data-notify]').forEach(b=>b.onclick=async()=>{
    const e=T().employees.find(x=>x.id===b.dataset.notify);
    const r=await sendKakaoMock(e.name,'급여명세_발송',{ 사번:e.id });
    T().kakao.unshift({ t:r.t, to:e.name, tpl:'급여 명세 발송', result:'발송 완료(MESSAGE_ACCEPTED)', code:r.http }); persist(); toast('알림톡을 보냈어요 (mock API)');
  });

  // QR 검증
  const vfGo=document.getElementById('vf-go'); if(vfGo) vfGo.onclick=()=>{ runVerify(document.getElementById('vf-in').value.trim()); };
  document.querySelectorAll('.vf-quick').forEach(b=>b.onclick=()=>{ runVerify(b.dataset.tok); });

  // 근태 ICS
  const icsS=document.getElementById('ics-shift'); if(icsS) icsS.onclick=()=>{
    const base=new Date(); const ev=[];
    for(let i=0;i<5;i++){ const d=new Date(base); d.setDate(base.getDate()+i); ev.push({ uid:'shift-'+i+'@smb.kr', date:d, title:`[근무] 주간 시프트 09:00-18:00`, desc:`${T().name} 주간 근무` }); }
    downloadICS('weekly-shift.ics', ev); toast(`시프트를 ICS로 내보냈어요 (${ev.length}건)`);
  };

  // 직원 CRUD
  const ea=document.getElementById('emp-add');
  if(ea){
    ea.onclick=()=>{ ['ef-name','ef-dept','ef-join','ef-salary','ef-email','ef-phone'].forEach(i=>document.getElementById(i).value=''); document.getElementById('emp-dlg-title').textContent='직원 추가'; window._editId=null; document.getElementById('emp-dlg').showModal(); };
    document.getElementById('ef-save').onclick=(e)=>{
      e.preventDefault();
      const data={ name:val('ef-name'),dept:val('ef-dept'),join:val('ef-join'),salary:+val('ef-salary')||0,email:val('ef-email'),phone:val('ef-phone') };
      if(!data.name) return; const t=T();
      if(window._editId){ Object.assign(t.employees.find(x=>x.id===window._editId), data); }
      else { t.employees.push({ id:'E'+String(t.employees.length+1).padStart(3,'0'), ...data }); }
      persist(); document.getElementById('emp-dlg').close(); render(); toast('직원 정보를 저장했어요');
    };
  }
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    const e=T().employees.find(x=>x.id===b.dataset.edit); if(!e) return;
    ['name','dept','join','salary','email','phone'].forEach(f=>document.getElementById('ef-'+f).value=e[f]);
    document.getElementById('emp-dlg-title').textContent='직원 편집 — '+e.name; window._editId=e.id; document.getElementById('emp-dlg').showModal();
  });
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ if(!confirm('이 직원을 삭제할까요?')) return; const t=T(); t.employees=t.employees.filter(x=>x.id!==b.dataset.del); persist(); render(); toast('직원을 삭제했어요'); });

  // 직원 포털
  const pe=document.getElementById('portal-emp'); if(pe) pe.onchange=()=>{ state.empView=pe.value; persist(); render(); };
  const pp=document.getElementById('portal-payslip'); if(pp) pp.onclick=async()=>{ const e=T().employees.find(x=>x.id===(state.empView||T().employees[0].id)); (await buildPayslip(e)).save(`my_payslip_${e.id}.pdf`); toast('내 명세서 한글 PDF를 내려받았어요'); };
  document.querySelectorAll('[data-portal-sign]').forEach(b=>b.onclick=()=>{
    window._portalSignCid=b.dataset.portalSign;
    const cv=document.getElementById('psig'), ctl=document.getElementById('psig-ctl');
    cv.classList.remove('hidden'); ctl.classList.remove('hidden'); ctl.classList.add('flex');
    bindSignature('psig','psig-clear','psig-save',()=>{
      const c=T().contracts.find(x=>x.id===window._portalSignCid);
      if(c){ c.status='완료'; c.signed=new Date().toISOString().slice(0,10); c.hash=signHash(state.signImg+c.target+c.kind); }
      persist(); render(); toast('전자서명 완료 → 계약 확정');
    });
  });

  // 노무사 챗
  const cs=document.getElementById('chat-send'); if(cs) cs.onclick=()=>chatSend();
  const ci=document.getElementById('chat-in'); if(ci) ci.onkeydown=e=>{ if(e.key==='Enter') chatSend(); };
  document.querySelectorAll('.chat-quick').forEach(b=>b.onclick=()=>{ document.getElementById('chat-in').value=b.dataset.q; chatSend(); });

  // 알림톡 테스트
  const kt=document.getElementById('kakao-test'); if(kt) kt.onclick=async()=>{
    const e=T().employees[0]; const r=await sendKakaoMock(e.name,'테스트_알림',{ 메모:'연결 테스트' });
    const pre=document.getElementById('kakao-api'); pre.classList.remove('hidden');
    pre.textContent='POST '+r.req.url+'\nHeaders: '+JSON.stringify(r.req.headers)+'\nBody: '+JSON.stringify(r.req.body,null,2)+'\n\n← HTTP '+r.http+'\n'+JSON.stringify(r.res,null,2);
    T().kakao.unshift({ t:r.t, to:e.name, tpl:'테스트 알림', result:'발송 완료(MESSAGE_ACCEPTED)', code:r.http }); persist();
    setTimeout(render,1200);
  };
}

function runVerify(input){
  state.verifyInput=input;
  if(!input){ state.verifyResult={ok:false,msg:'코드를 입력해 주세요.'}; persist(); render(); return; }
  const [id,hash]=input.split(':');
  const c=T().contracts.find(x=>x.id===id);
  if(!c) state.verifyResult={ok:false,msg:`계약 ${id}을(를) 찾지 못했어요 (현재 회사: ${T().name}).`};
  else if(!c.hash) state.verifyResult={ok:false,msg:'아직 서명되지 않은 계약이에요 (해시 없음).'};
  else if(c.hash!==hash) state.verifyResult={ok:false,msg:'해시가 일치하지 않아요. 원본과 다른 계약일 수 있어요.'};
  else state.verifyResult={ok:true,c};
  persist(); render();
}

function chatSend(){
  const inp=document.getElementById('chat-in'); const q=inp.value.trim(); if(!q) return;
  state.chat.push({role:'me',text:q});
  state.chat.push({role:'bot',text:advisorReply(q)});
  persist(); render();
  const log=document.getElementById('chat-log'); if(log) log.scrollTop=log.scrollHeight;
}

function bindSignature(canvasId,clearId,saveId,onSave){
  const sig=document.getElementById(canvasId); if(!sig) return;
  const ctx=sig.getContext('2d'); ctx.lineWidth=2; ctx.strokeStyle='#0f172a'; let d=false;
  sig.onpointerdown=e=>{ d=true; ctx.beginPath(); ctx.moveTo(e.offsetX,e.offsetY); };
  sig.onpointermove=e=>{ if(d){ ctx.lineTo(e.offsetX,e.offsetY); ctx.stroke(); } };
  sig.onpointerup=()=>d=false; sig.onpointerleave=()=>d=false;
  const cl=document.getElementById(clearId); if(cl) cl.onclick=()=>ctx.clearRect(0,0,sig.width,sig.height);
  const sv=document.getElementById(saveId); if(sv) sv.onclick=()=>{ state.signImg=sig.toDataURL('image/png'); persist(); onSave&&onSave(); };
}

function val(id){ return document.getElementById(id).value; }

render();

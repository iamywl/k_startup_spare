"use strict";
/* ─────────────────────────────────────────────────────────
   발주메이트 v3 — 식자재 자동발주·재고·공급망 SaaS (단일 HTML 자체완결)
   v3 도약(v2 위에):
   - 수요예측: Holt-Winters(레벨+추세+요일 계절성) ↔ EWMA 토글
   - 예산제약 발주 최적화: greedy LP relaxation(가치/원 우선 배분)
   - 폐기·마진 분석: 과잉재고 폐기위험 금액화 + 이익 레버리지
   - 공급사 다기준 추천: 품목별 대안 공급사 추천
   - 본사 통합정산: 공급사×매장 롤업 + 부가세 + 전자세금계산서/오픈뱅킹 mock
   - 외부 통합: POS API·오픈뱅킹 webhook·전자세금계산서·OAuth·알림톡 양방향(콜백)
   - i18n: KO/EN 토글
   ───────────────────────────────────────────────────────── */
const LS = "balju-mate-v3";
const todayISO = () => new Date().toISOString().slice(0,10);
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ── i18n ── */
const I18N = {
  ko:{
    "ctx.role":"역할 (다중 테넌트)","ctx.store":"매장 선택",
    "nav.ops":"운영","nav.dashboard":"대시보드","nav.portfolio":"다점포 현황","nav.consolidate":"본사 통합정산",
    "nav.inventory":"재고 현황","nav.catalog":"품목·공급사","nav.predict":"예측·발주","nav.forecast":"수요예측 (HW)",
    "nav.optimize":"예산제약 발주최적화","nav.abc":"ABC·EOQ 분석","nav.waste":"폐기·마진 분석","nav.orders":"발주·발송",
    "nav.receive":"입고·검수","nav.settle":"정산","nav.supply":"공급망·연동","nav.suppliers":"공급사 평가·추천",
    "nav.integrations":"외부 연동 허브","nav.notif":"알림 센터","nav.portal":"공급사 포털","nav.portalMenu":"수주 관리",
    "foot":"데모 모드 · 오프라인 동작<br/>역할·매장·언어 전환은 모두 로컬에서 동작합니다.",
    "dash.title":"재고 대시보드","dash.desc":"오늘 기준 재고·예측·발주 상태를 한눈에. Holt-Winters 수요예측 기반.",
    "dash.kItems":"관리 품목","dash.kItemsSub":"활성 SKU","dash.kReorder":"재주문 필요","dash.kSuggest":"금일 발주 제안액",
    "dash.kSuggestSub":"HW·EOQ 기반","dash.kWaste":"예상 폐기 위험","dash.kWasteSub":"과잉재고 추정",
    "dash.trend":"14일 소진 추이 · Holt-Winters","dash.trendHint":"실측 소비(막대) 위에 추세+계절 예측선을 겹쳐 표시",
    "dash.cover":"품목별 재고 커버일수","dash.coverHint":"현재고 ÷ 일평균소비 = 며칠 버티는가",
    "dash.urgent":"긴급 재주문 품목","dash.urgentHint":"행을 누르면 발주 화면으로 이동합니다.",
    "th.item":"품목","th.supplier":"공급사","th.stock":"현재고","th.avgHW":"일평균(HW)","th.cover":"커버일수","th.status":"상태",
    "th.store":"매장","th.region":"지역","th.items":"품목","th.reorder":"재주문","th.suggestAmt":"발주 제안액","th.monthSettle":"월 정산",
    "th.value":"평가액","th.action":"조치","th.price":"단가","th.phone":"연락처","th.handle":"취급","th.score":"평가점",
    "th.muHW":"예측 μ","th.trend":"추세","th.season":"계절(×)","th.safety":"안전재고","th.suggestQty":"제안수량","th.verdict":"판정",
    "th.need":"필요수량","th.valuePer":"가치/원","th.allocQty":"배정수량","th.allocAmt":"배정액","th.result":"결과",
    "th.annual":"연간 사용액","th.annualDemand":"연간수요","th.cycle":"주문주기(일)","th.policy":"관리정책",
    "th.excess":"과잉수량","th.wasteAmt":"폐기위험액","th.advice":"권고","th.poNo":"발주번호","th.itemCnt":"품목수","th.amount":"금액",
    "th.progress":"진행","th.callback":"공급사확인","th.time":"일시","th.delay":"납기지연","th.sentAt":"발송일시",
    "th.inspResult":"검수결과","th.leadDays":"납기(일)","th.recvAt":"입고일시","th.settleAmt":"정산액","th.recv":"입고",
    "th.curSup":"현재 공급사","th.curScore":"현재 점수","th.recoSup":"추천 공급사","th.recoScore":"추천 점수","th.recoReason":"사유",
    "th.sum":"합계","th.orderStore":"발주매장",
    "pf.title":"다점포 현황","pf.desc":"본사 관점 — 체인 전 매장의 재고·발주·정산을 한 화면에서 비교합니다.",
    "pf.kStores":"운영 매장","pf.kStoresSub":"활성 점포","pf.kReorder":"재주문 경보 합","pf.kSuggest":"금주 발주 제안액",
    "pf.kSettle":"월 누적 정산","pf.allStores":"전 매장 합산","pf.cSuggest":"매장별 발주 제안액","pf.cSuggestHint":"발주 부담이 큰 매장 식별",
    "pf.cAlert":"매장별 재주문 경보","pf.cAlertHint":"품절 위험 매장 비교","pf.table":"매장 포트폴리오","pf.tableHint":"행을 누르면 해당 매장으로 전환합니다.",
    "cs.title":"본사 통합정산","cs.desc":"체인 전 매장의 정산을 공급사·매장 단위로 롤업합니다. 오픈뱅킹 정산·전자세금계산서 연동(mock).",
    "cs.kTotal":"통합 정산액","cs.allStores":"전 매장 합산","cs.kVat":"부가세(10%)","cs.kVatSub":"세금계산서 기준","cs.kCount":"정산 건수",
    "cs.cBySup":"공급사별 통합 정산","cs.cBySupHint":"체인 전체의 거래처 집중도","cs.cByStore":"매장별 정산 비중","cs.cByStoreHint":"매장별 원가 부담",
    "cs.rollup":"공급사 × 매장 정산 롤업","cs.taxBtn":"전자세금계산서 발행(mock)","cs.bankBtn":"오픈뱅킹 이체 요청(mock)",
    "inv.title":"재고 현황","inv.desc":"품목별 현재고·커버일수·상태. 소비 기록으로 재고를 차감합니다.",
    "inv.kValue":"총 재고 평가액","inv.kValueSub":"현재고 × 단가","inv.kLow":"품절 임박","inv.kLowSub":"커버 3일 이하","inv.kOver":"과잉 재고","inv.kOverSub":"커버 14일 초과",
    "inv.table":"품목 재고","inv.tableHint":"[−소비]로 재고 차감(소비 이력 기록). ABC 등급은 사용액 파레토 기준.",
    "cat.title":"품목 · 공급사 관리","cat.desc":"품목별 현재고·리드타임·안전계수, 공급사 정보를 관리합니다.","cat.add":"품목 추가 / 수정",
    "cat.addHint":"현재고·단가·발주 비용을 입력하면 즉시 저장됩니다(localStorage).","cat.name":"품목명","cat.supplier":"공급사","cat.stock":"현재고",
    "cat.price":"단가(원)","cat.lead":"리드타임(일)","cat.orderCost":"발주비용(원)","cat.hold":"보관비율(%/년)","cat.z":"서비스수준 Z","cat.save":"품목 저장",
    "cat.suppliers":"공급사","cat.suppliersHint":"발주서가 발송되는 거래처입니다. 평가 점수는 [공급사 평가]에서.","cat.supName":"공급사명","cat.supPhone":"담당 연락처(mock)",
    "cat.addSup":"공급사 추가","cat.list":"품목 목록","cat.listHint":"[수정]으로 불러오기, [−]로 재고 차감(소비 기록)됩니다.",
    "fc.title":"수요예측 · 재주문 제안 (Holt-Winters)","fc.desc":"Holt-Winters(레벨+추세+요일 계절성)로 일평균을 추정하고, 서비스레벨(Z) 기반 안전재고로 ROP·제안수량을 산출합니다. EWMA와 비교 가능.",
    "fc.param":"예측 파라미터","fc.paramHint":"레벨 α·추세 β·계절 γ. Holt-Winters는 추세·요일 계절성을 분리 추정합니다.","fc.method":"예측 방법",
    "fc.alpha":"레벨 α","fc.target":"목표 커버일수","fc.beta":"추세 β (HW)","fc.gamma":"계절 γ (HW)","fc.run":"예측 실행 · 재주문 계산",
    "fc.result":"계산 결과 (품목별)","fc.runFirst":"[예측 실행]을 눌러 계산하세요.","fc.suggest":"발주 제안 (부족 품목)",
    "fc.suggestEmpty":"예측 실행 후 재주문점 이하 품목이 여기에 제안됩니다.","fc.createDraft":"선택 품목으로 발주서 초안 만들기 →",
    "opt.title":"예산제약 발주최적화","opt.desc":"발주 예산이 한정될 때, 품절 위험(서비스가치)이 큰 품목부터 채우는 선형계획(LP) 근사 최적화입니다.",
    "opt.budget":"발주 예산 설정","opt.budgetHint":"예산 한도 안에서 단위당 품절위험 감소(가치/원)가 큰 품목을 우선 배분합니다(greedy LP relaxation).",
    "opt.cap":"예산 한도(원)","opt.obj":"목적함수","opt.run":"최적 배분 계산","opt.kBudget":"예산 한도","opt.kSpent":"배정액","opt.kSpentSub":"예산 내",
    "opt.kCovered":"충족 품목","opt.kCoveredSub":"전량/부분","opt.table":"품목별 최적 배분","opt.tableHint":"예산이 모자라면 가치/원이 낮은 품목은 일부만(부분 발주) 또는 제외됩니다.","opt.runFirst":"[최적 배분 계산]을 눌러 실행하세요.",
    "abc.title":"ABC 재고분류 · EOQ 분석","abc.desc":"파레토(80/20)로 품목을 A·B·C 등급으로 나누고, 경제적주문량(EOQ)으로 최적 발주 배치를 산출합니다.",
    "abc.pareto":"ABC 누적 사용액 (파레토)","abc.paretoHint":"상위 품목이 사용액의 대부분을 차지(80/20)","abc.donut":"등급별 분포","abc.donutHint":"A=집중관리 · B=정기관리 · C=단순관리",
    "abc.table":"품목별 ABC · EOQ","abc.tableHint":"EOQ = √(2·연간수요·발주비용 ÷ (단가·보관비율)). 주문주기 = EOQ ÷ 일평균.",
    "ws.title":"폐기·마진 분석","ws.desc":"과잉재고로 인한 폐기 위험을 금액화하고, 식재료비 절감이 영업이익에 미치는 레버리지를 분석합니다.",
    "ws.kWaste":"월 추정 폐기손실","ws.kWasteSub":"과잉재고×폐기율","ws.kStockout":"품절 기회손실","ws.kStockoutSub":"결품 추정","ws.kProfit":"이익 개선 잠재","ws.kProfitSub":"절감→이익 레버",
    "ws.cWaste":"품목별 폐기 위험","ws.cWasteHint":"커버일수 14일 초과 과잉분의 폐기 추정","ws.cLever":"식재료비 절감 → 이익 레버리지","ws.cLeverHint":"절감 1%p가 영업이익에 미치는 배수",
    "ws.table":"품목별 폐기·마진",
    "ord.title":"발주서 · 발송 추적","ord.desc":"공급사별 발주서를 생성·PDF 다운로드하고, 알림톡 발송 후 공급사 확인 콜백까지 추적합니다.",
    "ord.draft":"발주서 초안","ord.draftHint":"소비예측·최적화에서 넘어온 초안입니다. 공급사별로 묶여 발주됩니다.","ord.draftEmpty":"아직 초안이 없습니다. [수요예측]에서 발주서 초안을 만드세요.",
    "ord.history":"발송 이력 · 추적","ord.export":"발주 이력 CSV 내보내기","ord.histEmpty":"발송 이력이 없습니다.",
    "rc.title":"입고 · 검수","rc.desc":"발송한 발주를 입고 처리합니다. 검수에서 수량·품질 불일치를 기록하면 공급사 평가에 반영됩니다.",
    "rc.kOpen":"입고 대기","rc.kOpenSub":"발송·미입고","rc.kDone":"검수 완료","rc.kDoneSub":"정산 반영","rc.kIssue":"불일치 건","rc.kIssueSub":"수량/품질",
    "rc.pending":"입고 대기 발주","rc.pendingHint":"[정상 입고]는 재고 전량 반영, [검수…]는 검수 모달에서 수량·품질을 기록합니다.","rc.pendingEmpty":"입고 대기 건이 없습니다.",
    "rc.inspHist":"검수 이력","rc.inspEmpty":"검수 이력이 없습니다.",
    "st.title":"정산","st.desc":"입고 확정된 발주의 정산 내역입니다. 공급사별·기간별 원가가 집계됩니다.",
    "st.kTotal":"누적 정산액","st.kTotalSub":"전체 기간","st.kCount":"정산 건수","st.kCountSub":"입고 완료","st.kTop":"최다 거래 공급사","st.kTopSub":"금액 기준",
    "st.cDonut":"공급사별 정산 비중","st.cDonutHint":"거래처 집중도 확인","st.cList":"정산 내역","st.cListHint":"최근순","st.empty":"정산 내역이 없습니다.",
    "sup.title":"공급사 평가 · 추천 (Scorecard)","sup.desc":"납기준수율·단가경쟁력·품질(검수 통과율)을 가중 평균해 종합점수를 산출하고, 품목별 대안 공급사를 추천합니다.",
    "sup.weights":"평가 가중치","sup.weightsHint":"세 지표의 가중치 합은 100%로 정규화됩니다.","sup.wDelivery":"납기준수 (%)","sup.wPrice":"단가경쟁력 (%)","sup.wQuality":"품질 (%)",
    "sup.recalc":"평가 재계산","sup.scorecard":"공급사 스코어카드","sup.reco":"품목별 대안 공급사 추천",
    "int.title":"외부 연동 허브","int.desc":"POS 매출 API·오픈뱅킹 정산 webhook·전자세금계산서·OAuth 로그인·알림톡 양방향을 한 곳에서 관리합니다. 모두 오프라인 mock으로 동작합니다.",
    "int.pos":"① POS 매출 API","int.posHint":"POS API에서 일별 메뉴 판매를 받아 식자재 소비로 환산(mock).","int.posBtn":"POS API 동기화(mock)",
    "int.oauth":"② OAuth 로그인","int.oauthHint":"카카오/네이버 OAuth 흐름(mock 토큰 발급, 키 0).","int.oauthKakao":"카카오로 로그인(mock)","int.oauthNaver":"네이버로 로그인(mock)",
    "int.bank":"③ 오픈뱅킹 webhook","int.bankHint":"정산 이체 요청 → 입금완료 webhook 콜백 수신(mock).","int.bankBtn":"정산 이체·webhook 수신(mock)",
    "int.tax":"④ 전자세금계산서 API","int.taxHint":"입고 정산건에 대해 세금계산서 발행 요청(mock).","int.taxBtn":"세금계산서 발행(mock)",
    "int.csvIn":"⑤ 재고 CSV 입력","int.csvInHint":"CSV 텍스트를 붙여넣어 현재고를 일괄 갱신(파싱·검증).","int.csvInBtn":"CSV 가져오기·검증",
    "int.csvOut":"⑥ 재고 CSV 내보내기","int.csvOutHint":"현재 재고·예측을 CSV로 다운로드.","int.csvOutInv":"재고 현황 CSV","int.csvOutFc":"예측 결과 CSV",
    "int.log":"연동 이벤트 로그","int.logEmpty":"아직 연동 이벤트가 없습니다.","int.disconnected":"미연결","int.connected":"연결됨","int.loggedOut":"로그아웃 상태","int.loggedIn":"로그인됨",
    "nt.title":"알림 센터","nt.desc":"재주문 경보·납기지연·검수 이슈·연동 결과·공급사 확인 콜백을 한 곳에 모읍니다.","nt.alerts":"알림","nt.gen":"현재 상태로 알림 생성","nt.empty":"[현재 상태로 알림 생성]을 눌러 재주문·재고 경보를 모으세요.",
    "sp.title":"수주 관리 (공급사 포털)","sp.desc":"공급사 관점 — 우리 회사로 들어온 발주를 확인하고 출고 처리합니다. 출고 시 식당에 알림톡 콜백을 보냅니다.",
    "sp.kNew":"신규 수주","sp.kNewSub":"미출고","sp.kShipped":"출고 완료","sp.kShippedSub":"입고 대기","sp.kAmount":"수주 금액","sp.kAmountSub":"전체",
    "sp.incoming":"들어온 발주","sp.incomingHint":"[출고 처리]를 누르면 식당 측 입고 대기로 넘어가고 발주 확인 콜백이 발송됩니다.","sp.empty":"수주가 없습니다.",
    "insp.title":"입고 검수 — ","insp.hint":"실제 입고된 수량·품질을 기록합니다. 불일치는 공급사 평가에 반영됩니다.","insp.ratio":"입고 비율(%)","insp.quality":"품질","insp.cancel":"취소","insp.confirm":"검수 확정",
  },
  en:{
    "ctx.role":"Role (multi-tenant)","ctx.store":"Select store",
    "nav.ops":"Operations","nav.dashboard":"Dashboard","nav.portfolio":"Multi-store","nav.consolidate":"HQ settlement",
    "nav.inventory":"Inventory","nav.catalog":"Items·Suppliers","nav.predict":"Forecast·Order","nav.forecast":"Demand (HW)",
    "nav.optimize":"Budget optimizer","nav.abc":"ABC·EOQ","nav.waste":"Waste·Margin","nav.orders":"Orders·Send",
    "nav.receive":"Receive·Inspect","nav.settle":"Settlement","nav.supply":"Supply·Integrations","nav.suppliers":"Supplier score·reco",
    "nav.integrations":"Integration hub","nav.notif":"Notifications","nav.portal":"Supplier portal","nav.portalMenu":"Orders inbox",
    "foot":"Demo mode · works offline<br/>Role·store·language switching all run locally.",
    "dash.title":"Inventory dashboard","dash.desc":"Today's inventory·forecast·order status at a glance. Powered by Holt-Winters forecasting.",
    "dash.kItems":"Managed items","dash.kItemsSub":"Active SKU","dash.kReorder":"Reorder needed","dash.kSuggest":"Today's order value",
    "dash.kSuggestSub":"HW·EOQ based","dash.kWaste":"Est. waste risk","dash.kWasteSub":"Excess stock est.",
    "dash.trend":"14-day usage · Holt-Winters","dash.trendHint":"Trend+seasonality forecast line over actual usage (bars)",
    "dash.cover":"Cover days by item","dash.coverHint":"Stock ÷ daily usage = days of cover",
    "dash.urgent":"Urgent reorder items","dash.urgentHint":"Click a row to go to the order screen.",
    "th.item":"Item","th.supplier":"Supplier","th.stock":"Stock","th.avgHW":"Daily (HW)","th.cover":"Cover","th.status":"Status",
    "th.store":"Store","th.region":"Region","th.items":"Items","th.reorder":"Reorder","th.suggestAmt":"Order value","th.monthSettle":"Monthly",
    "th.value":"Value","th.action":"Action","th.price":"Price","th.phone":"Phone","th.handle":"Items","th.score":"Score",
    "th.muHW":"Forecast μ","th.trend":"Trend","th.season":"Season(×)","th.safety":"Safety","th.suggestQty":"Suggest qty","th.verdict":"Verdict",
    "th.need":"Need qty","th.valuePer":"Value/₩","th.allocQty":"Alloc qty","th.allocAmt":"Alloc amt","th.result":"Result",
    "th.annual":"Annual usage","th.annualDemand":"Annual demand","th.cycle":"Cycle(days)","th.policy":"Policy",
    "th.excess":"Excess qty","th.wasteAmt":"Waste risk","th.advice":"Advice","th.poNo":"PO No.","th.itemCnt":"Items","th.amount":"Amount",
    "th.progress":"Progress","th.callback":"Confirm","th.time":"Time","th.delay":"Lead delay","th.sentAt":"Sent at",
    "th.inspResult":"Inspection","th.leadDays":"Lead(d)","th.recvAt":"Received at","th.settleAmt":"Settled","th.recv":"Receive",
    "th.curSup":"Current supplier","th.curScore":"Cur. score","th.recoSup":"Recommended","th.recoScore":"Reco. score","th.recoReason":"Reason",
    "th.sum":"Total","th.orderStore":"Order store",
    "pf.title":"Multi-store overview","pf.desc":"HQ view — compare inventory·orders·settlement across all chain stores.",
    "pf.kStores":"Stores","pf.kStoresSub":"Active","pf.kReorder":"Reorder alerts","pf.kSuggest":"Weekly order value","pf.kSettle":"Monthly settlement","pf.allStores":"All stores",
    "pf.cSuggest":"Order value by store","pf.cSuggestHint":"Identify high-load stores","pf.cAlert":"Reorder alerts by store","pf.cAlertHint":"Compare stockout-risk stores",
    "pf.table":"Store portfolio","pf.tableHint":"Click a row to switch to that store.",
    "cs.title":"HQ consolidated settlement","cs.desc":"Roll up settlement across all chain stores by supplier·store. Open-banking·e-tax-invoice (mock).",
    "cs.kTotal":"Consolidated total","cs.allStores":"All stores","cs.kVat":"VAT (10%)","cs.kVatSub":"Tax-invoice basis","cs.kCount":"Settlements",
    "cs.cBySup":"By supplier","cs.cBySupHint":"Chain-wide supplier concentration","cs.cByStore":"By store","cs.cByStoreHint":"Cost burden by store",
    "cs.rollup":"Supplier × store rollup","cs.taxBtn":"Issue e-tax invoice (mock)","cs.bankBtn":"Open-banking transfer (mock)",
    "inv.title":"Inventory","inv.desc":"Stock·cover·status by item. Consumption logging deducts stock.",
    "inv.kValue":"Total inventory value","inv.kValueSub":"Stock × price","inv.kLow":"Near stockout","inv.kLowSub":"Cover ≤3d","inv.kOver":"Excess stock","inv.kOverSub":"Cover >14d",
    "inv.table":"Item inventory","inv.tableHint":"[−Use] deducts stock (logs consumption). ABC grade by usage-value Pareto.",
    "cat.title":"Items · Suppliers","cat.desc":"Manage stock·lead time·safety factor per item, and supplier info.","cat.add":"Add / Edit item",
    "cat.addHint":"Entering stock·price·order cost saves instantly (localStorage).","cat.name":"Item name","cat.supplier":"Supplier","cat.stock":"Stock",
    "cat.price":"Price(₩)","cat.lead":"Lead time(d)","cat.orderCost":"Order cost(₩)","cat.hold":"Holding(%/yr)","cat.z":"Service level Z","cat.save":"Save item",
    "cat.suppliers":"Suppliers","cat.suppliersHint":"Trading partners that receive POs. Scores in [Supplier score].","cat.supName":"Supplier name","cat.supPhone":"Contact (mock)",
    "cat.addSup":"Add supplier","cat.list":"Item list","cat.listHint":"[Edit] to load, [−] deducts stock (logs use).",
    "fc.title":"Demand forecast · reorder (Holt-Winters)","fc.desc":"Holt-Winters (level+trend+weekday seasonality) estimates daily usage; service-level (Z) safety stock yields ROP·suggested qty. Comparable with EWMA.",
    "fc.param":"Forecast parameters","fc.paramHint":"Level α·trend β·season γ. Holt-Winters estimates trend and weekday seasonality separately.","fc.method":"Method",
    "fc.alpha":"Level α","fc.target":"Target cover days","fc.beta":"Trend β (HW)","fc.gamma":"Season γ (HW)","fc.run":"Run forecast · reorder",
    "fc.result":"Results (by item)","fc.runFirst":"Click [Run forecast] to compute.","fc.suggest":"Order suggestions (short items)",
    "fc.suggestEmpty":"Items at/below ROP appear here after running the forecast.","fc.createDraft":"Create PO draft from selected →",
    "opt.title":"Budget-constrained order optimizer","opt.desc":"When the order budget is limited, a linear-programming (LP) approximation fills high stockout-risk items first.",
    "opt.budget":"Budget setup","opt.budgetHint":"Within the budget cap, items with higher stockout-risk reduction per ₩ (value/₩) are allocated first (greedy LP relaxation).",
    "opt.cap":"Budget cap(₩)","opt.obj":"Objective","opt.run":"Compute allocation","opt.kBudget":"Budget cap","opt.kSpent":"Allocated","opt.kSpentSub":"Within budget",
    "opt.kCovered":"Covered items","opt.kCoveredSub":"Full/partial","opt.table":"Optimal allocation by item","opt.tableHint":"If budget is short, low value/₩ items get partial orders or are excluded.","opt.runFirst":"Click [Compute allocation] to run.",
    "abc.title":"ABC classification · EOQ","abc.desc":"Pareto (80/20) splits items into A·B·C grades; EOQ yields the optimal order batch.",
    "abc.pareto":"ABC cumulative usage (Pareto)","abc.paretoHint":"Top items take most of usage value (80/20)","abc.donut":"Grade distribution","abc.donutHint":"A=focus · B=regular · C=simple",
    "abc.table":"ABC · EOQ by item","abc.tableHint":"EOQ = √(2·annual demand·order cost ÷ (price·holding)). Cycle = EOQ ÷ daily usage.",
    "ws.title":"Waste·Margin analysis","ws.desc":"Quantify waste risk from excess stock and analyze how food-cost savings leverage operating profit.",
    "ws.kWaste":"Est. monthly waste loss","ws.kWasteSub":"Excess×waste rate","ws.kStockout":"Stockout opp. loss","ws.kStockoutSub":"Shortage est.","ws.kProfit":"Profit upside","ws.kProfitSub":"Saving→profit lever",
    "ws.cWaste":"Waste risk by item","ws.cWasteHint":"Waste est. of excess above 14-day cover","ws.cLever":"Food-cost saving → profit leverage","ws.cLeverHint":"Multiplier of 1%p saving on operating profit",
    "ws.table":"Waste·Margin by item",
    "ord.title":"Purchase orders · tracking","ord.desc":"Generate supplier POs·download PDFs, then track from KakaoTalk send to supplier confirmation callback.",
    "ord.draft":"PO draft","ord.draftHint":"Draft carried over from forecast·optimizer, grouped per supplier.","ord.draftEmpty":"No draft yet. Create one in [Demand forecast].",
    "ord.history":"Send history · tracking","ord.export":"Export order history CSV","ord.histEmpty":"No send history.",
    "rc.title":"Receive · Inspect","rc.desc":"Receive sent POs. Recording quantity/quality mismatches at inspection feeds supplier scoring.",
    "rc.kOpen":"Awaiting receipt","rc.kOpenSub":"Sent·not received","rc.kDone":"Inspected","rc.kDoneSub":"Settled","rc.kIssue":"Mismatches","rc.kIssueSub":"Qty/quality",
    "rc.pending":"Awaiting receipt","rc.pendingHint":"[Receive] applies full stock, [Inspect…] records qty·quality in the modal.","rc.pendingEmpty":"No pending receipts.",
    "rc.inspHist":"Inspection history","rc.inspEmpty":"No inspection history.",
    "st.title":"Settlement","st.desc":"Settlement of received POs. Cost is aggregated by supplier·period.",
    "st.kTotal":"Total settled","st.kTotalSub":"All time","st.kCount":"Settlements","st.kCountSub":"Received","st.kTop":"Top supplier","st.kTopSub":"By amount",
    "st.cDonut":"Settlement share by supplier","st.cDonutHint":"Check supplier concentration","st.cList":"Settlement list","st.cListHint":"Most recent","st.empty":"No settlements.",
    "sup.title":"Supplier score · recommendation","sup.desc":"Weighted average of delivery·price·quality (inspection pass rate) yields a composite score, plus alternative-supplier recommendations per item.",
    "sup.weights":"Scoring weights","sup.weightsHint":"The three weights are normalized to 100%.","sup.wDelivery":"Delivery (%)","sup.wPrice":"Price (%)","sup.wQuality":"Quality (%)",
    "sup.recalc":"Recalculate","sup.scorecard":"Supplier scorecard","sup.reco":"Alternative supplier recommendation by item",
    "int.title":"Integration hub","int.desc":"Manage POS sales API·open-banking settlement webhook·e-tax invoice·OAuth login·two-way KakaoTalk in one place. All run as offline mocks.",
    "int.pos":"① POS sales API","int.posHint":"Receive daily menu sales from POS API and convert to ingredient usage (mock).","int.posBtn":"Sync POS API (mock)",
    "int.oauth":"② OAuth login","int.oauthHint":"Kakao/Naver OAuth flow (mock token, zero keys).","int.oauthKakao":"Login with Kakao (mock)","int.oauthNaver":"Login with Naver (mock)",
    "int.bank":"③ Open-banking webhook","int.bankHint":"Transfer request → deposit-complete webhook callback (mock).","int.bankBtn":"Transfer·receive webhook (mock)",
    "int.tax":"④ E-tax invoice API","int.taxHint":"Request tax-invoice issuance for received settlements (mock).","int.taxBtn":"Issue tax invoice (mock)",
    "int.csvIn":"⑤ Inventory CSV import","int.csvInHint":"Paste CSV text to bulk-update stock (parse·validate).","int.csvInBtn":"Import·validate CSV",
    "int.csvOut":"⑥ Inventory CSV export","int.csvOutHint":"Download current stock·forecast as CSV.","int.csvOutInv":"Inventory CSV","int.csvOutFc":"Forecast CSV",
    "int.log":"Integration event log","int.logEmpty":"No integration events yet.","int.disconnected":"Disconnected","int.connected":"Connected","int.loggedOut":"Logged out","int.loggedIn":"Logged in",
    "nt.title":"Notifications","nt.desc":"Reorder alerts·lead delays·inspection issues·integration results·supplier confirmation callbacks in one place.","nt.alerts":"Alerts","nt.gen":"Generate from current state","nt.empty":"Click [Generate from current state] to gather reorder·stock alerts.",
    "sp.title":"Orders inbox (supplier portal)","sp.desc":"Supplier view — confirm incoming POs and process shipping. Shipping sends a KakaoTalk callback to the restaurant.",
    "sp.kNew":"New orders","sp.kNewSub":"Unshipped","sp.kShipped":"Shipped","sp.kShippedSub":"Awaiting receipt","sp.kAmount":"Order value","sp.kAmountSub":"Total",
    "sp.incoming":"Incoming orders","sp.incomingHint":"[Ship] moves the PO to the restaurant's receipt queue and sends a confirmation callback.","sp.empty":"No orders.",
    "insp.title":"Receipt inspection — ","insp.hint":"Record actually received quantity·quality. Mismatches feed supplier scoring.","insp.ratio":"Receipt ratio(%)","insp.quality":"Quality","insp.cancel":"Cancel","insp.confirm":"Confirm",
  }
};
let LANG = "ko";
const t = k => (I18N[LANG][k] ?? I18N.ko[k] ?? k);
const KRW = n => (LANG==="en"? "₩" : "₩") + Math.round(n).toLocaleString(LANG==="en"?"en-US":"ko-KR");
function applyI18n(){
  $$("[data-i18n]").forEach(el=>{
    const k=el.getAttribute("data-i18n"); const v=I18N[LANG][k];
    if(v==null) return;
    if(v.includes("<")) el.innerHTML=v; else el.textContent=v;
  });
  $("#brandSub").textContent = LANG==="en"? "Food supply-chain SaaS · v3" : "식자재 공급망 SaaS · v3";
  document.documentElement.lang = LANG;
}

/* ── 14일 소비 이력 생성기 ── */
function makeHist(base, weekendBoost, noise){
  const today = new Date();
  return Array.from({length:14},(_,i)=>{
    const d = new Date(); d.setDate(today.getDate()-(13-i));
    const dow = d.getDay();
    const wk = (dow===5||dow===6||dow===0) ? weekendBoost : 1;
    const trend = 1 + (i-7)*0.012;
    const v = base * wk * trend + (Math.sin(i*1.3)*noise);
    return Math.max(0, Math.round(v));
  });
}
function days14(){
  const today=new Date();
  return Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(today.getDate()-(13-i)); return d.toISOString().slice(0,10); });
}

/* ── 시드 ── */
function seedStore(idPrefix, stockMul){
  const sup = [
    {id:"s1", name:"한밭청과", phone:"053-101-1111"},
    {id:"s2", name:"대구축산유통", phone:"053-202-2222"},
    {id:"s3", name:"신선수산", phone:"053-303-3333"},
    {id:"s4", name:"영남농수산", phone:"053-404-4444"},
  ];
  const d = days14();
  const defs = [
    {id:"i1", name:"양파 15kg망", supplier:"s1", price:18000, lead:2, moq:5, z:1.65, unit:"망", base:14, wk:1.4, noise:3, stock:30, orderCost:15000, hold:25},
    {id:"i2", name:"대파 1kg",     supplier:"s1", price:3200,  lead:1, moq:10,z:1.65, unit:"단", base:7,  wk:1.3, noise:2, stock:36, orderCost:12000, hold:30},
    {id:"i3", name:"삼겹살 1kg",   supplier:"s2", price:12500, lead:2, moq:5, z:1.65, unit:"kg", base:24, wk:1.6, noise:4, stock:40, orderCost:18000, hold:20},
    {id:"i4", name:"한우 등심 1kg",supplier:"s2", price:48000, lead:3, moq:2, z:2.05, unit:"kg", base:4,  wk:1.8, noise:1.5,stock:7,  orderCost:20000, hold:18},
    {id:"i5", name:"고등어 손질",  supplier:"s3", price:4200,  lead:2, moq:6, z:1.65, unit:"마리",base:10, wk:1.2, noise:2, stock:24, orderCost:14000, hold:22},
    {id:"i6", name:"활광어 1kg",   supplier:"s3", price:26000, lead:2, moq:2, z:2.05, unit:"kg", base:3,  wk:1.7, noise:1, stock:5,  orderCost:16000, hold:20},
    {id:"i7", name:"상추 4kg",     supplier:"s1", price:9000,  lead:1, moq:4, z:1.65, unit:"박스",base:5,  wk:1.5, noise:1.5,stock:14, orderCost:12000, hold:35},
    {id:"i8", name:"식용유 18L",   supplier:"s2", price:36000, lead:3, moq:1, z:1.28, unit:"통", base:1.5,wk:1.1, noise:0.6,stock:9,  orderCost:15000, hold:8},
  ];
  const items = defs.map(it=>({
    id:it.id, name:it.name, supplier:it.supplier, price:it.price, lead:it.lead, moq:it.moq, z:it.z, unit:it.unit,
    stock: Math.round(it.stock*stockMul), orderCost:it.orderCost, hold:it.hold,
    hist: makeHist(it.base, it.wk, it.noise), days:d,
  }));
  const histOrders=[
    {no:"PO-HIST-101", supplier:"s1", items:[{id:"i1",name:"양파 15kg망",supplier:"s1",qty:40,price:18000,unit:"망"}], status:"received", _simDelay:0, inspect:{ratio:100,quality:"pass"}, total:720000, promisedLead:2, actualLead:2, sentAt:"이력", recvAt:"이력"},
    {no:"PO-HIST-102", supplier:"s2", items:[{id:"i3",name:"삼겹살 1kg",supplier:"s2",qty:30,price:12500,unit:"kg"}], status:"received", _simDelay:1, inspect:{ratio:100,quality:"pass"}, total:375000, promisedLead:2, actualLead:3, sentAt:"이력", recvAt:"이력"},
    {no:"PO-HIST-103", supplier:"s3", items:[{id:"i5",name:"고등어 손질",supplier:"s3",qty:18,price:4200,unit:"마리"}], status:"received", _simDelay:0, inspect:{ratio:80,quality:"minor"}, total:75600, promisedLead:2, actualLead:2, sentAt:"이력", recvAt:"이력"},
    {no:"PO-HIST-104", supplier:"s4", items:[{id:"i1",name:"양파 15kg망",supplier:"s4",qty:30,price:16500,unit:"망"}], status:"received", _simDelay:0, inspect:{ratio:100,quality:"pass"}, total:495000, promisedLead:2, actualLead:2, sentAt:"이력", recvAt:"이력"},
  ];
  const settlements=histOrders.map(o=>({no:o.no, supplier:o.supplier, amount:Math.round(o.total*(o.inspect.quality==="fail"?0:o.inspect.ratio/100)), at:"이력"}));
  return {suppliers:sup, items, orders:histOrders, settlements, seq:1001};
}
function seed(){
  const g={
    stores:[
      {id:"st1", name:"본점 (동성로)", region:"대구 중구", mul:1},
      {id:"st2", name:"2호점 (수성못)", region:"대구 수성구", mul:1.25},
      {id:"st3", name:"3호점 (칠곡)", region:"대구 북구", mul:0.8},
    ],
    data:{ st1:seedStore("st1",1), st2:seedStore("st2",1.25), st3:seedStore("st3",0.8) },
    role:"owner", store:"st1", notifs:[], intEvents:[], lang:"ko",
    conn:{pos:false, oauth:null, bank:false},
  };
  g.data.st2.orders.push({no:"PO-NEW-201", supplier:"s3", store:"st2",
    items:[{id:"i6",name:"활광어 1kg",supplier:"s3",qty:6,price:26000,unit:"kg"}],
    total:156000, status:"sent", sentAt:"오늘", promisedLead:2});
  g.data.st3.orders.push({no:"PO-NEW-202", supplier:"s3", store:"st3",
    items:[{id:"i5",name:"고등어 손질",supplier:"s3",qty:12,price:4200,unit:"마리"}],
    total:50400, status:"sent", sentAt:"오늘", promisedLead:2});
  return g;
}
let G = loadG();
function loadG(){
  try{ const r=JSON.parse(localStorage.getItem(LS)); if(r&&r.data&&r.stores) return r; }catch(e){}
  const s=seed(); localStorage.setItem(LS,JSON.stringify(s)); return s;
}
function save(){ localStorage.setItem(LS,JSON.stringify(G)); }
function S(){ return G.data[G.store]; }
const supName = id => (S().suppliers.find(s=>s.id===id)||{}).name || "-";
const storeName = id => (G.stores.find(s=>s.id===id)||{}).name || "-";

/* ── 통계·예측 헬퍼 ── */
function mean(a){ return a.length? a.reduce((x,y)=>x+y,0)/a.length : 0; }
function stdev(a){ if(a.length<2) return 0; const m=mean(a);
  return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)); }

function ewma(arr, alpha){
  if(!arr.length) return 0;
  let s = arr[0];
  for(let i=1;i<arr.length;i++) s = alpha*arr[i] + (1-alpha)*s;
  return s;
}
/** Holt-Winters (가법 추세 + 곱셈 요일 계절성, 주기=7).
 *  반환: {level, trend, mu(1스텝 예측), seasonFactor(오늘요일), seasons[7]} */
function holtWinters(arr, days, alpha, beta, gamma){
  const m=7;
  if(arr.length < m+1) { const mu=ewma(arr,alpha); return {level:mu, trend:0, mu, seasonFactor:1, seasons:Array(m).fill(1)}; }
  // 계절 초기화: 요일별 평균 / 전체 평균
  const overall = mean(arr)||1;
  const byDow = Array.from({length:m},()=>[]);
  days.forEach((dstr,i)=>{ byDow[new Date(dstr).getDay()].push(arr[i]); });
  let seasons = byDow.map(v=> v.length? (mean(v)/overall) : 1);
  // 정규화(평균 1)
  const sMean = mean(seasons)||1; seasons = seasons.map(s=> s/sMean);
  let level = overall, trend = (mean(arr.slice(-3)) - mean(arr.slice(0,3)))/Math.max(1,arr.length-3);
  for(let i=0;i<arr.length;i++){
    const dow = new Date(days[i]).getDay();
    const s = seasons[dow] || 1;
    const x = arr[i];
    const prevLevel = level;
    level = alpha*(x/(s||1)) + (1-alpha)*(level+trend);
    trend = beta*(level-prevLevel) + (1-beta)*trend;
    seasons[dow] = gamma*(x/(level||1)) + (1-gamma)*s;
  }
  const todayDow = new Date().getDay();
  const sf = Math.min(1.8, Math.max(0.5, seasons[todayDow]||1));
  const mu = Math.max(0, (level+trend)*sf);
  return {level, trend, mu, seasonFactor:sf, seasons};
}
/** 품목별 예측 — method: 'hw' | 'ewma' */
function computeItem(it, opt){
  const {alpha=0.35, beta=0.1, gamma=0.2, targetCover=7, method="hw"} = opt||{};
  const arr = it.hist;
  let mu, trend=0, sf=1;
  if(method==="hw"){
    const hw = holtWinters(arr, it.days, alpha, beta, gamma);
    mu = hw.mu; trend = hw.trend; sf = hw.seasonFactor;
  } else {
    mu = ewma(arr, alpha);
  }
  const sigma = stdev(arr.slice(-7));
  const safety = it.z * sigma * Math.sqrt(it.lead);
  const rop = mu*it.lead + safety;
  const target = mu*targetCover + safety;
  let suggest = Math.max(0, target - it.stock);
  if(suggest>0) suggest = Math.ceil(suggest/it.moq)*it.moq;
  const cover = mu>0 ? it.stock/mu : 999;
  const need = it.stock <= rop;
  return {mu, trend, sf, sigma, safety, rop, target, suggest, cover, need};
}
function eoq(it, muDaily){
  const D = muDaily*365;
  const H = it.price * (it.hold/100);
  if(H<=0||D<=0) return {D, q:0, cycle:0};
  const q = Math.sqrt(2*D*it.orderCost / H);
  const cycle = muDaily>0 ? q/muDaily : 0;
  return {D, q, cycle};
}
function classifyABC(){
  const rows = S().items.map(it=>{
    const mu = ewma(it.hist, 0.35);
    const annual = mu*365*it.price;
    return {it, mu, annual};
  }).sort((a,b)=>b.annual-a.annual);
  const total = rows.reduce((s,r)=>s+r.annual,0)||1;
  let cum=0;
  rows.forEach(r=>{ cum+=r.annual; r.cumPct = cum/total*100;
    r.abc = r.cumPct<=80 ? "A" : r.cumPct<=95 ? "B" : "C"; });
  return {rows, total};
}
function abcOf(itemId){ const {rows}=classifyABC(); return (rows.find(r=>r.it.id===itemId)||{}).abc || "C"; }

/* ── 역할·매장 컨텍스트 ── */
const ROLE_LABEL = {owner:"점주", hq:"본사", supplier:"공급사"};
const ROLE_LABEL_EN = {owner:"Owner", hq:"HQ", supplier:"Supplier"};
const ROLE_EMOJI = {owner:"🍳", hq:"🏢", supplier:"🚚"};
function roleLabel(r){ return LANG==="en"? ROLE_LABEL_EN[r] : ROLE_LABEL[r]; }
function applyRole(){
  const role=G.role;
  $$(".nav-btn[data-roles]").forEach(b=>{ b.hidden = !b.dataset.roles.split(",").includes(role); });
  $$(".nav-group").forEach(g=>{
    let n=g.nextElementSibling, anyVisible=false;
    while(n && n.classList.contains("nav-btn")){ if(!n.hidden) anyVisible=true; n=n.nextElementSibling; }
    g.style.display = anyVisible ? "" : "none";
  });
  const storeBox = $("#storeSel").parentElement;
  if(role==="supplier"){ storeBox.querySelector("#storeLbl").textContent = LANG==="en"?"Supplier account":"공급사 계정";
    $("#storeSel").innerHTML = `<option>${LANG==="en"?"Sinseon Seafood (Daegu)":"신선수산 (대구)"}</option>`; $("#storeSel").disabled=true; }
  else if(role==="hq"){ storeBox.querySelector("#storeLbl").textContent = LANG==="en"?"Select store (HQ)":"매장 선택 (본사)";
    $("#storeSel").disabled=false; fillStoreSel(); }
  else { storeBox.querySelector("#storeLbl").textContent = LANG==="en"?"My store":"내 매장";
    $("#storeSel").disabled=true; fillStoreSel(); }
  $("#tbRole").textContent = roleLabel(role);
  $("#tbName").textContent = role==="hq" ? (LANG==="en"?"BaljuMate HQ":"발주메이트 본사") : role==="supplier" ? (LANG==="en"?"Sinseon Portal":"신선수산 포털") : storeName(G.store);
  buildBottomNav();
  const first = $$(".nav-btn[data-roles]").find(b=>!b.hidden);
  go(first ? first.dataset.view : "dashboard");
}
function fillStoreSel(){
  $("#storeSel").innerHTML = G.stores.map(s=>`<option value="${s.id}" ${s.id===G.store?"selected":""}>${s.name}</option>`).join("");
}
function buildBottomNav(){
  const vis = $$(".nav-btn[data-roles]").filter(b=>!b.hidden);
  const pick = vis.slice(0,5);
  $("#bottomnav").innerHTML = pick.map(b=>{
    const ic = b.querySelector(".ic").textContent;
    const label = b.querySelector("[data-i18n]")? t(b.querySelector("[data-i18n]").getAttribute("data-i18n")) : "";
    const short = label.split(" ")[0].slice(0, LANG==="en"?6:4);
    return `<button data-view="${b.dataset.view}"><span class="ic">${ic}</span>${short}</button>`;
  }).join("");
  $$("#bottomnav button").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
}
$("#roleSel").addEventListener("change",e=>{ G.role=e.target.value; save(); applyRole();
  toast(`${ROLE_EMOJI[G.role]} ${roleLabel(G.role)}${LANG==="en"?" view":" 화면으로 전환했어요"}`); });
$("#storeSel").addEventListener("change",e=>{ if(G.role==="supplier") return; G.store=e.target.value; save();
  go(currentView); toast(`${storeName(G.store)}${LANG==="en"?"":" 매장으로 전환했어요"}`); });

/* ── 언어 토글 ── */
$$(".lang-btn").forEach(b=>b.addEventListener("click",()=>{
  LANG=b.dataset.lang; G.lang=LANG; save();
  $$(".lang-btn").forEach(x=>x.classList.toggle("active", x.dataset.lang===LANG));
  applyI18n(); applyRole();
  toast(LANG==="en"?"Switched to English":"한국어로 전환했어요");
}));

/* ── 라우팅 ── */
let currentView="dashboard";
function go(view){
  currentView=view;
  $$(".view").forEach(v=>v.classList.toggle("active", v.id==="view-"+view));
  $$(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  $$("#bottomnav button").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  document.body.classList.remove("drawer-open");
  const r={dashboard:renderDashboard, portfolio:renderPortfolio, consolidate:renderConsolidate, inventory:renderInventory,
    catalog:renderCatalog, forecast:null, optimize:null, abc:renderABC, waste:renderWaste, orders:renderOrders,
    receive:renderReceive, settle:renderSettle, suppliers:renderSuppliers, integrations:renderIntegrations,
    notif:renderNotif, supplierPortal:renderSupplierPortal};
  if(r[view]) r[view]();
  window.scrollTo(0,0);
}
$$(".nav-btn").forEach(b=> b.addEventListener("click",()=>go(b.dataset.view)));
$("#hamb").addEventListener("click",()=>document.body.classList.toggle("drawer-open"));
$("#backdrop").addEventListener("click",()=>document.body.classList.remove("drawer-open"));
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),2200); }

/* ── 대시보드 ── */
let trendChart, coverChart;
function fcOpt(){ return {alpha:0.35, beta:0.1, gamma:0.2, targetCover:7, method:"hw"}; }
function renderDashboard(){
  const calc = S().items.map(it=>({it, c:computeItem(it,fcOpt()), abc:abcOf(it.id)}));
  const reorder = calc.filter(x=>x.c.need).length;
  const suggestVal = calc.reduce((s,x)=>s + x.c.suggest*x.it.price, 0);
  const waste = calc.reduce((s,x)=>{ const ex=Math.max(0, x.it.stock - x.c.mu*14); return s + ex*x.it.price*0.15; },0);
  $("#kpiItems").textContent = S().items.length;
  $("#kpiReorder").textContent = reorder;
  $("#kpiSuggest").textContent = KRW(suggestVal);
  $("#kpiWaste").textContent = KRW(waste);
  $("#dashChip").textContent = `${ROLE_EMOJI[G.role]} ${roleLabel(G.role)}`;
  $("#dashTitle").textContent = G.role==="hq" ? `${storeName(G.store)} ${LANG==="en"?"dashboard":"대시보드"}` : t("dash.title");

  const urgent = calc.filter(x=>x.c.need).concat(calc.filter(x=>!x.c.need)).slice(0,8);
  const stTxt = LANG==="en"? {r:"Reorder",w:"Watch",ok:"OK"} : {r:"재주문 필요",w:"주의",ok:"충분"};
  $("#dashRows").innerHTML = urgent.map(({it,c,abc})=>{
    const st = it.stock<=c.rop ? `<span class="pill danger">${stTxt.r}</span>`
      : it.stock<=c.rop*1.4 ? `<span class="pill warn">${stTxt.w}</span>` : `<span class="pill ok">${stTxt.ok}</span>`;
    return `<tr class="row-click" data-go="orders">
      <td>${it.name}</td><td>${supName(it.supplier)}</td><td><span class="pill tag-${abc.toLowerCase()}">${abc}</span></td>
      <td class="num">${it.stock}</td><td class="num">${c.rop.toFixed(1)}</td>
      <td class="num">${c.mu.toFixed(1)}</td><td class="num">${c.cover>=999?"—":c.cover.toFixed(1)}${LANG==="en"?"d":"일"}</td><td>${st}</td></tr>`;
  }).join("");
  $$("#dashRows tr").forEach(r=>r.addEventListener("click",()=>go(r.dataset.go)));

  const days = S().items[0].days;
  const totals = days.map((_,d)=> S().items.reduce((s,it)=>s+(it.hist[d]||0),0));
  // HW 라인(전체 합 시계열)
  const hw = holtWinters(totals, days, 0.35, 0.1, 0.2);
  const line=[]; let lv=totals[0], tr=0;
  for(let i=0;i<totals.length;i++){ const dow=new Date(days[i]).getDay(); const s=hw.seasons[dow]||1;
    const pl=lv; lv=0.35*(totals[i]/(s||1))+0.65*(lv+tr); tr=0.1*(lv-pl)+0.9*tr; line.push(Math.max(0,(lv+tr)*s)); }
  if(trendChart) trendChart.destroy();
  trendChart = new Chart($("#trendChart"),{
    data:{labels:days.map(d=>d.slice(5)), datasets:[
      {type:"bar", label:LANG==="en"?"Actual":"실측 소비", data:totals, backgroundColor:"rgba(47,83,214,.18)", borderRadius:4},
      {type:"line", label:LANG==="en"?"Holt-Winters":"HW 예측", data:line, borderColor:"#2f53d6", backgroundColor:"transparent", tension:.35, pointRadius:2, borderWidth:2}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, labels:{boxWidth:12,font:{size:11}}}}, scales:{y:{beginAtZero:true}}}
  });
  const cov = calc.map(x=>({n:x.it.name, v: x.c.cover>=999?0:Math.min(x.c.cover,30)}));
  if(coverChart) coverChart.destroy();
  coverChart = new Chart($("#coverChart"),{ type:"bar",
    data:{labels:cov.map(c=>c.n), datasets:[{label:LANG==="en"?"Cover days":"커버일수", data:cov.map(c=>c.v),
      backgroundColor: cov.map(c=> c.v<3?"#b0303a":c.v<6?"#d39a2a":"#2f53d6"), borderRadius:6}]},
    options:{indexAxis:"y", responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true}}}
  });
}

/* ── 다점포 ── */
let pfChart, pfAlertChart;
function storeAgg(stId){
  const d = G.data[stId];
  const calc = d.items.map(it=>computeItem(it,fcOpt()));
  const reorder = calc.filter(c=>c.need).length;
  const suggest = calc.reduce((s,c,i)=>s + c.suggest*d.items[i].price,0);
  const settle = d.settlements.reduce((s,x)=>s+x.amount,0);
  return {reorder, suggest, settle, items:d.items.length};
}
function renderPortfolio(){
  const aggs = G.stores.map(st=>({st, ...storeAgg(st.id)}));
  $("#pfStores").textContent = G.stores.length;
  $("#pfReorder").textContent = aggs.reduce((s,a)=>s+a.reorder,0);
  $("#pfSuggest").textContent = KRW(aggs.reduce((s,a)=>s+a.suggest,0));
  $("#pfSettle").textContent = KRW(aggs.reduce((s,a)=>s+a.settle,0));
  const stTxt = LANG==="en"? {d:"Watch",w:"Observe",ok:"Good"} : {d:"주의",w:"관찰",ok:"양호"};
  $("#pfRows").innerHTML = aggs.map(a=>{
    const st = a.reorder>=3 ? `<span class="pill danger">${stTxt.d}</span>` : a.reorder>=1 ? `<span class="pill warn">${stTxt.w}</span>` : `<span class="pill ok">${stTxt.ok}</span>`;
    return `<tr class="row-click" data-st="${a.st.id}">
      <td>${a.st.name}</td><td>${a.st.region}</td><td class="num">${a.items}</td>
      <td class="num">${a.reorder}</td><td class="num">${KRW(a.suggest)}</td><td class="num">${KRW(a.settle)}</td><td>${st}</td></tr>`;
  }).join("");
  $$("#pfRows tr").forEach(r=>r.addEventListener("click",()=>{ G.store=r.dataset.st; save(); fillStoreSel(); go("dashboard");
    toast(`${storeName(G.store)}${LANG==="en"?"":" 매장으로 전환했어요"}`); }));
  if(pfChart) pfChart.destroy();
  pfChart = new Chart($("#pfChart"),{ type:"bar",
    data:{labels:aggs.map(a=>a.st.name), datasets:[{label:"발주 제안액", data:aggs.map(a=>a.suggest), backgroundColor:"#2f53d6", borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
  if(pfAlertChart) pfAlertChart.destroy();
  pfAlertChart = new Chart($("#pfAlertChart"),{ type:"bar",
    data:{labels:aggs.map(a=>a.st.name), datasets:[{label:"재주문 경보", data:aggs.map(a=>a.reorder),
      backgroundColor:aggs.map(a=>a.reorder>=3?"#b0303a":a.reorder>=1?"#d39a2a":"#137a4b"), borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}});
}

/* ── 본사 통합정산 ── */
let csSupChart, csStoreChart;
function consolidatedRollup(){
  // 공급사 × 매장 정산 매트릭스
  const supSet={};
  G.stores.forEach(st=>{ G.data[st.id].suppliers.forEach(s=>{ supSet[s.id]=s.name; }); });
  const matrix={}; // supId -> {stId->amt}
  let grand=0;
  Object.keys(supSet).forEach(sid=> matrix[sid]={total:0});
  G.stores.forEach(st=>{
    G.data[st.id].settlements.forEach(se=>{
      if(!matrix[se.supplier]) matrix[se.supplier]={total:0};
      matrix[se.supplier][st.id]=(matrix[se.supplier][st.id]||0)+se.amount;
      matrix[se.supplier].total += se.amount; grand+=se.amount;
    });
  });
  return {supSet, matrix, grand};
}
function renderConsolidate(){
  const {supSet, matrix, grand} = consolidatedRollup();
  const count = G.stores.reduce((s,st)=>s+G.data[st.id].settlements.length,0);
  $("#csTotal").textContent=KRW(grand);
  $("#csVat").textContent=KRW(grand*0.1);
  $("#csCount").textContent=count;
  $("#csHead1").textContent=G.stores[0].name; $("#csHead2").textContent=G.stores[1].name; $("#csHead3").textContent=G.stores[2].name;
  const sids=Object.keys(matrix).filter(sid=>matrix[sid].total>0);
  $("#csRows").innerHTML = sids.map(sid=>{
    const m=matrix[sid];
    return `<tr><td>${supSet[sid]}</td>
      <td class="num">${KRW(m[G.stores[0].id]||0)}</td><td class="num">${KRW(m[G.stores[1].id]||0)}</td><td class="num">${KRW(m[G.stores[2].id]||0)}</td>
      <td class="num"><b>${KRW(m.total)}</b></td>
      <td><button class="btn ghost sm" data-csbank="${sid}">${LANG==="en"?"Transfer":"이체"}</button></td></tr>`;
  }).join("") || `<tr><td colspan="6" class="empty">—</td></tr>`;
  $$("#csRows [data-csbank]").forEach(b=>b.addEventListener("click",()=>{
    const sid=b.dataset.csbank; const amt=matrix[sid].total;
    pushLog("#csLog","오픈뱅킹",`[오픈뱅킹 이체 mock] ${supSet[sid]}\n→ 통합 정산액 ${KRW(amt)} 이체 요청\n→ webhook 콜백: {status:"DONE", bankTxId:"OB${Date.now().toString().slice(-8)}"} 수신`);
    logInt("오픈뱅킹", `${supSet[sid]} ${KRW(amt)} 이체·입금완료 webhook(mock)`);
    toast(LANG==="en"?"Open-banking transfer (mock)":"오픈뱅킹 이체 요청을 보냈어요(mock)");
  }));

  if(csSupChart) csSupChart.destroy();
  csSupChart = new Chart($("#csSupChart"),{ type:"doughnut",
    data:{labels:sids.map(s=>supSet[s]), datasets:[{data:sids.map(s=>matrix[s].total),
      backgroundColor:["#2f53d6","#137a4b","#d39a2a","#b0303a","#7e87a8"]}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:12,font:{size:11}}}}}});
  const byStore=G.stores.map(st=>G.data[st.id].settlements.reduce((s,x)=>s+x.amount,0));
  if(csStoreChart) csStoreChart.destroy();
  csStoreChart = new Chart($("#csStoreChart"),{ type:"bar",
    data:{labels:G.stores.map(s=>s.name), datasets:[{label:"정산액", data:byStore, backgroundColor:"#2f53d6", borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
}
$("#csTax").addEventListener("click",()=>{
  const {grand}=consolidatedRollup();
  pushLog("#csLog","세금계산서",`[전자세금계산서 발행 mock] ${todayISO()}\n→ 공급가액 ${KRW(grand)} · 세액 ${KRW(grand*0.1)} · 합계 ${KRW(grand*1.1)}\n→ 국세청 e-세로 전송: 승인번호 NTS${Date.now().toString().slice(-10)} (HTTP 200, mock)`);
  logInt("세금계산서", `통합 세금계산서 발행 공급가 ${KRW(grand)}(mock)`);
  toast(LANG==="en"?"E-tax invoice issued (mock)":"전자세금계산서를 발행했어요(mock)");
});
$("#csBank").addEventListener("click",()=>{
  const {grand}=consolidatedRollup();
  pushLog("#csLog","오픈뱅킹",`[오픈뱅킹 일괄 이체 mock] ${todayISO()}\n→ 전 공급사 통합 정산 ${KRW(grand)} 일괄 이체 요청\n→ 입금완료 webhook 콜백 수신 (txCount=${G.stores.length}개 매장 롤업)`);
  logInt("오픈뱅킹", `통합 정산 ${KRW(grand)} 일괄 이체(mock)`);
  toast(LANG==="en"?"Bulk transfer requested (mock)":"오픈뱅킹 일괄 이체를 요청했어요(mock)");
});
function pushLog(sel, type, msg){
  const div=document.createElement("div"); div.className="log";
  div.textContent=`[${type}] ${new Date().toLocaleString("ko-KR",{hour12:false})}\n${msg}`;
  $(sel).prepend(div);
}

/* ── 재고 현황 ── */
function renderInventory(){
  const calc = S().items.map(it=>({it, c:computeItem(it,fcOpt()), abc:abcOf(it.id)}));
  const value = S().items.reduce((s,it)=>s+it.stock*it.price,0);
  const low = calc.filter(x=>x.c.cover<3).length;
  const over = calc.filter(x=>x.c.cover<999 && x.c.cover>14).length;
  $("#invValue").textContent=KRW(value); $("#invLow").textContent=low; $("#invOver").textContent=over;
  const stTxt = LANG==="en"? {l:"Low",o:"Excess",ok:"OK"} : {l:"품절임박",o:"과잉",ok:"적정"};
  $("#invRows").innerHTML = calc.map(({it,c,abc})=>{
    const st = c.cover<3 ? `<span class="pill danger">${stTxt.l}</span>` : c.cover>14 ? `<span class="pill warn">${stTxt.o}</span>` : `<span class="pill ok">${stTxt.ok}</span>`;
    return `<tr><td>${it.name}</td><td><span class="pill tag-${abc.toLowerCase()}">${abc}</span></td><td>${supName(it.supplier)}</td>
      <td class="num">${it.stock} ${it.unit}</td><td class="num">${c.cover>=999?"—":c.cover.toFixed(1)}${LANG==="en"?"d":"일"}</td>
      <td class="num">${KRW(it.stock*it.price)}</td><td>${st}</td>
      <td><button class="btn ghost sm" data-consume="${it.id}">−${LANG==="en"?"Use":"소비"}</button></td></tr>`;
  }).join("");
  $$("#invRows [data-consume]").forEach(b=>b.addEventListener("click",()=>consume(b.dataset.consume,"inventory")));
}

/* ── 품목·공급사 ── */
function fillSupplierSelect(){ $("#fSupplier").innerHTML = S().suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join(""); }
function renderCatalog(){
  fillSupplierSelect();
  const scores = supplierScores();
  $("#supplierRows").innerHTML = S().suppliers.map(s=>{
    const cnt = S().items.filter(i=>i.supplier===s.id).length;
    const sc = scores[s.id]; const sv = sc? sc.total.toFixed(0) : "—";
    return `<tr><td>${s.name}</td><td>${s.phone||"-"}</td><td class="num">${cnt}</td><td class="num">${sv}</td></tr>`;
  }).join("") || `<tr><td colspan="4" class="empty">—</td></tr>`;
  $("#itemRows").innerHTML = S().items.map(it=>`
    <tr><td>${it.name}</td><td>${supName(it.supplier)}</td>
      <td class="num">${it.stock} ${it.unit}</td><td class="num">${KRW(it.price)}</td>
      <td class="num">${it.lead}d / Z${it.z} / ${it.moq}</td>
      <td><button class="btn ghost sm" data-edit="${it.id}">${LANG==="en"?"Edit":"수정"}</button>
          <button class="btn ghost sm" data-consume="${it.id}">−${LANG==="en"?"Use":"소비"}</button></td></tr>`).join("")
    || `<tr><td colspan="6" class="empty">—</td></tr>`;
  $$("#itemRows [data-edit]").forEach(b=>b.addEventListener("click",()=>editItem(b.dataset.edit)));
  $$("#itemRows [data-consume]").forEach(b=>b.addEventListener("click",()=>consume(b.dataset.consume,"catalog")));
}
function editItem(id){
  const it=S().items.find(i=>i.id===id); if(!it) return;
  $("#fEditId").value=it.id; $("#fName").value=it.name; $("#fSupplier").value=it.supplier;
  $("#fStock").value=it.stock; $("#fPrice").value=it.price; $("#fLead").value=it.lead;
  $("#fMoq").value=it.moq; $("#fZ").value=it.z; $("#fOrderCost").value=it.orderCost; $("#fHold").value=it.hold;
  window.scrollTo({top:0,behavior:"smooth"}); toast(LANG==="en"?"Item loaded for edit":"수정할 품목을 불러왔어요");
}
function consume(id, back){
  const it=S().items.find(i=>i.id===id); if(!it) return;
  const dec=Math.max(1, Math.round(ewma(it.hist,0.35)*0.4));
  it.stock=Math.max(0, it.stock-dec);
  it.hist=[...it.hist.slice(1), dec+Math.round(Math.random()*2)];
  save();
  if(back==="inventory") renderInventory(); else renderCatalog();
  toast(`${it.name} ${dec}${it.unit} ${LANG==="en"?"consumed":"소비 기록"} (${LANG==="en"?"stock":"재고"} ${it.stock})`);
}
$("#saveItem").addEventListener("click",()=>{
  const name=$("#fName").value.trim(); if(!name){toast(LANG==="en"?"Enter item name":"품목명을 입력하세요");return;}
  const id=$("#fEditId").value || ("i"+Date.now());
  const obj={id, name, supplier:$("#fSupplier").value, stock:+$("#fStock").value||0, price:+$("#fPrice").value||0,
    lead:+$("#fLead").value||1, moq:+$("#fMoq").value||1, z:+$("#fZ").value||1.65,
    orderCost:+$("#fOrderCost").value||15000, hold:+$("#fHold").value||20, unit:"단위"};
  const ex=S().items.find(i=>i.id===id);
  if(ex){ obj.hist=ex.hist; obj.days=ex.days; obj.unit=ex.unit; Object.assign(ex,obj); }
  else { obj.days=S().items[0]?.days||days14(); obj.hist=Array(14).fill(Math.max(1,Math.round((+$("#fStock").value||10)/7))); S().items.push(obj); }
  save();
  $("#fEditId").value=""; $("#fName").value=""; $("#fStock").value=0; $("#fPrice").value=0;
  renderCatalog(); toast(ex?(LANG==="en"?"Item updated":"품목을 수정했어요"):(LANG==="en"?"Item added":"품목을 추가했어요"));
});
$("#addSupplier").addEventListener("click",()=>{
  const name=$("#sName").value.trim(); if(!name){toast(LANG==="en"?"Enter supplier name":"공급사명을 입력하세요");return;}
  S().suppliers.push({id:"s"+Date.now(), name, phone:$("#sPhone").value.trim()});
  save(); $("#sName").value=""; $("#sPhone").value=""; renderCatalog(); toast(LANG==="en"?"Supplier added":"공급사를 추가했어요");
});

/* ── 수요예측(Holt-Winters / EWMA) ── */
let lastForecast=[];
function curFcOpt(){
  return {alpha:+$("#alpha").value, beta:+$("#beta").value, gamma:+$("#gamma").value,
    targetCover:+$("#targetCover").value, method:$("#fcMethodSel").value};
}
$("#runForecast").addEventListener("click",()=>{
  const opt=curFcOpt();
  lastForecast=S().items.map(it=>({it, c:computeItem(it,opt)}));
  const vTxt = LANG==="en"? {need:"Order",keep:"Keep"} : {need:"발주 필요",keep:"유지"};
  $("#forecastRows").innerHTML=lastForecast.map(({it,c})=>{
    const verdict=c.need?`<span class="pill danger">${vTxt.need}</span>`:`<span class="pill ok">${vTxt.keep}</span>`;
    return `<tr><td>${it.name}</td><td class="num">${c.mu.toFixed(2)}</td><td class="num">${opt.method==="hw"?(c.trend>=0?"+":"")+c.trend.toFixed(2):"—"}</td>
      <td class="num">${opt.method==="hw"?"×"+c.sf.toFixed(2):"—"}</td><td class="num">${c.sigma.toFixed(2)}</td>
      <td class="num">${c.safety.toFixed(1)}</td><td class="num">${c.rop.toFixed(1)}</td>
      <td class="num">${it.stock}</td><td class="num">${c.suggest}</td><td>${verdict}</td></tr>`;
  }).join("");
  $("#fcMethod").style.display="inline-flex";
  $("#fcMethod").textContent = opt.method==="hw"
    ? `${LANG==="en"?"Method":"방법"}: Holt-Winters (α=${opt.alpha}, β=${opt.beta}, γ=${opt.gamma}) · ${LANG==="en"?"level+trend+weekday seasonality":"레벨+추세+요일 계절성"} · ROP = μ·L + Z·σ·√L`
    : `${LANG==="en"?"Method":"방법"}: EWMA (α=${opt.alpha}) · ROP = μ·L + Z·σ·√L`;

  const need=lastForecast.filter(x=>x.c.need && x.c.suggest>0);
  if(need.length===0){
    $("#suggestList").innerHTML=`<div class="empty">${LANG==="en"?"No items at/below ROP. Stock is sufficient 👍":"현재 재주문점 이하 품목이 없습니다. 재고가 충분합니다 👍"}</div>`;
    $("#createDraft").disabled=true;
  } else {
    $("#suggestList").innerHTML=need.map(({it,c})=>{
      const e=eoq(it,c.mu);
      const eoqRound = Math.max(it.moq, Math.ceil(e.q/it.moq)*it.moq);
      const why = LANG==="en"
        ? `Stock ${it.stock} ≤ ROP ${c.rop.toFixed(1)} · HW daily ${c.mu.toFixed(1)} · safety ${c.safety.toFixed(1)} · target ${c.target.toFixed(1)} · cycle ${e.cycle.toFixed(0)}d`
        : `현재고 ${it.stock} ≤ ROP ${c.rop.toFixed(1)} · HW 일평균 ${c.mu.toFixed(1)} · 안전재고 ${c.safety.toFixed(1)} · 목표 ${c.target.toFixed(1)} · 권장 주문주기 ${e.cycle.toFixed(0)}일`;
      return `<div class="sugg" data-item="${it.id}">
        <div class="top"><div>
          <div class="name">${it.name} <span class="pill muted">${supName(it.supplier)}</span> <span class="eoq-badge">EOQ ${e.q.toFixed(0)}${it.unit}</span></div>
          <div class="why">${why}</div>
        </div><label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink-2)">
          <input type="checkbox" class="pick" checked style="width:auto"/> ${LANG==="en"?"Include":"포함"}</label></div>
        <div class="qty"><span style="font-size:12.5px;color:var(--ink-2)">${LANG==="en"?"Qty":"발주수량"}</span>
          <input type="number" class="qInput" min="0" value="${c.suggest}"/>
          <button class="btn ghost sm" data-eoq="${eoqRound}" type="button">EOQ ${eoqRound}</button>
          <span style="font-size:12.5px;color:var(--ink-3)">× ${KRW(it.price)} = </span>
          <b class="lineSum">${KRW(c.suggest*it.price)}</b></div>
      </div>`;
    }).join("");
    $("#createDraft").disabled=false;
    $$(".sugg").forEach(card=>{
      const q=card.querySelector(".qInput"), sum=card.querySelector(".lineSum");
      const it=S().items.find(i=>i.id===card.dataset.item);
      const recalc=()=>sum.textContent=KRW((+q.value||0)*it.price);
      q.addEventListener("input",recalc);
      card.querySelector("[data-eoq]").addEventListener("click",e=>{ q.value=e.target.dataset.eoq; recalc(); });
    });
  }
  toast(opt.method==="hw"?(LANG==="en"?"Holt-Winters forecast computed":"Holt-Winters 예측을 계산했어요"):(LANG==="en"?"EWMA forecast computed":"EWMA 예측을 계산했어요"));
});

let currentDraft=null;
$("#createDraft").addEventListener("click",()=>{
  const lines=[];
  $$(".sugg").forEach(card=>{
    if(!card.querySelector(".pick").checked) return;
    const it=S().items.find(i=>i.id===card.dataset.item);
    const qty=+card.querySelector(".qInput").value||0;
    if(qty>0) lines.push({id:it.id, name:it.name, supplier:it.supplier, qty, price:it.price, unit:it.unit});
  });
  if(lines.length===0){toast(LANG==="en"?"No items included":"포함된 품목이 없습니다");return;}
  const groups={}; lines.forEach(l=>{ (groups[l.supplier]=groups[l.supplier]||[]).push(l); });
  currentDraft=Object.entries(groups).map(([sid,items])=>({supplier:sid, items}));
  toast(`${LANG==="en"?"PO draft created":"발주서 초안 "+currentDraft.length+"건 생성"} → ${LANG==="en"?"orders":"발주 화면으로"}`);
  go("orders");
});

/* ── 예산제약 발주최적화 (greedy LP relaxation) ── */
$("#runOpt").addEventListener("click",()=>{
  const budget=+$("#optBudget").value||0;
  const opt=fcOpt();
  // 부족 품목의 필요수량·가치(품절위험 감소) 계산
  const cand=S().items.map(it=>{
    const c=computeItem(it,opt);
    const need=Math.max(0, c.suggest);
    // 단위당 가치: 품절위험(현재고 부족분 × Z) → 안전재고 미달 정도. ABC A이면 가중.
    const shortfall=Math.max(0, c.rop - it.stock);
    const abc=abcOf(it.id);
    const abcW = abc==="A"?1.5:abc==="B"?1.1:1;
    const riskValue = (shortfall+1) * abcW * (it.price>0? 1:0);  // 위험 점수
    const valuePerWon = riskValue / Math.max(1, it.price);       // 가치/원
    return {it, need, price:it.price, valuePerWon, abc, alloc:0, c};
  }).filter(x=>x.need>0);
  // greedy: 가치/원 내림차순으로 예산 소진까지 배정(부분 허용)
  cand.sort((a,b)=>b.valuePerWon-a.valuePerWon);
  let spent=0;
  cand.forEach(x=>{
    const fullCost=x.need*x.price;
    if(spent+fullCost<=budget){ x.alloc=x.need; spent+=fullCost; }
    else { const rem=Math.max(0,budget-spent); const q=x.price>0?Math.floor(rem/x.price):0; x.alloc=q; spent+=q*x.price; }
  });
  const covered=cand.filter(x=>x.alloc>0).length;
  $("#optKBudget").textContent=KRW(budget);
  $("#optKSpent").textContent=KRW(spent);
  $("#optKCovered").textContent=`${covered}/${cand.length}`;
  const resTxt = LANG==="en"? {full:"Full",part:"Partial",none:"Excluded"} : {full:"전량",part:"부분",none:"제외"};
  $("#optRows").innerHTML = cand.length? cand.map(x=>{
    const res = x.alloc>=x.need ? `<span class="pill ok">${resTxt.full}</span>` : x.alloc>0 ? `<span class="pill warn">${resTxt.part} ${Math.round(x.alloc/x.need*100)}%</span>` : `<span class="pill muted">${resTxt.none}</span>`;
    return `<tr><td>${x.it.name} <span class="pill tag-${x.abc.toLowerCase()}">${x.abc}</span></td><td class="num">${x.need} ${x.it.unit}</td>
      <td class="num">${(x.valuePerWon*1e6).toFixed(2)}</td><td class="num">${x.alloc} ${x.it.unit}</td>
      <td class="num">${KRW(x.alloc*x.price)}</td><td>${res}</td></tr>`;
  }).join("") : `<tr><td colspan="6" class="empty">${LANG==="en"?"No shortage items.":"부족 품목이 없습니다."}</td></tr>`;
  // 최적 배분으로 발주서 초안 생성 가능하게 currentDraft에 반영
  const lines=cand.filter(x=>x.alloc>0).map(x=>({id:x.it.id,name:x.it.name,supplier:x.it.supplier,qty:x.alloc,price:x.price,unit:x.it.unit}));
  if(lines.length){ const groups={}; lines.forEach(l=>{(groups[l.supplier]=groups[l.supplier]||[]).push(l);});
    currentDraft=Object.entries(groups).map(([sid,items])=>({supplier:sid,items})); }
  toast(LANG==="en"?`Allocated ${KRW(spent)} within budget`:`예산 내 ${KRW(spent)} 배정 (발주 화면에서 발송 가능)`);
});

/* ── ABC·EOQ ── */
let abcChart, abcDonut;
function renderABC(){
  const {rows}=classifyABC();
  $("#abcRows").innerHTML=rows.map(r=>{
    const mu=r.mu, e=eoq(r.it,mu);
    const policy = LANG==="en"
      ? (r.abc==="A"?"Focus·frequent":r.abc==="B"?"Regular":"Simple·bulk")
      : (r.abc==="A"?"집중관리·잦은 점검":r.abc==="B"?"정기관리":"단순관리·대량발주");
    return `<tr><td>${r.it.name}</td><td><span class="pill tag-${r.abc.toLowerCase()}">${r.abc}</span></td>
      <td class="num">${KRW(r.annual)}</td><td class="num">${r.cumPct.toFixed(1)}%</td>
      <td class="num">${e.D.toFixed(0)}</td><td class="num">${e.q.toFixed(0)} ${r.it.unit}</td>
      <td class="num">${e.cycle.toFixed(0)}</td><td>${policy}</td></tr>`;
  }).join("");
  if(abcChart) abcChart.destroy();
  abcChart = new Chart($("#abcChart"),{
    data:{labels:rows.map(r=>r.it.name), datasets:[
      {type:"bar", label:LANG==="en"?"Annual usage":"연간 사용액", data:rows.map(r=>Math.round(r.annual)), backgroundColor:"rgba(47,83,214,.5)", borderRadius:4, yAxisID:"y"},
      {type:"line", label:LANG==="en"?"Cumulative %":"누적%", data:rows.map(r=>+r.cumPct.toFixed(1)), borderColor:"#b0303a", backgroundColor:"transparent", tension:.2, pointRadius:3, yAxisID:"y1"}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{boxWidth:12,font:{size:11}}}},
      scales:{y:{beginAtZero:true}, y1:{position:"right",beginAtZero:true,max:100,grid:{drawOnChartArea:false}}}}});
  const counts={A:0,B:0,C:0}; rows.forEach(r=>counts[r.abc]++);
  if(abcDonut) abcDonut.destroy();
  abcDonut = new Chart($("#abcDonut"),{ type:"doughnut",
    data:{labels:LANG==="en"?["A focus","B regular","C simple"]:["A 집중","B 정기","C 단순"], datasets:[{data:[counts.A,counts.B,counts.C],
      backgroundColor:["#2f53d6","#137a4b","#c2c8d6"]}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:12,font:{size:11}}}}}});
}

/* ── 폐기·마진 분석 ── */
let wsChart, wsLeverChart;
function renderWaste(){
  const opt=fcOpt();
  const calc=S().items.map(it=>{ const c=computeItem(it,opt);
    const excess=Math.max(0, it.stock - c.mu*14);   // 14일 커버 초과분
    const wasteAmt=excess*it.price*0.15;             // 과잉분의 15% 폐기 추정
    const stockout=c.need? Math.max(0,c.rop-it.stock)*c.mu*0.1*it.price*3 : 0; // 결품 기회손실 추정
    return {it,c,excess,wasteAmt,stockout};
  });
  const totWaste=calc.reduce((s,x)=>s+x.wasteAmt,0);
  const totStockout=calc.reduce((s,x)=>s+x.stockout,0);
  const monthFoodCost=S().items.reduce((s,it)=>s+ewma(it.hist,0.35)*30*it.price,0);
  // 이익 개선 잠재: 폐기+품절 절감의 일부가 이익으로 (보수적 60%)
  const profitUp=(totWaste+totStockout)*0.6;
  $("#wsWaste").textContent=KRW(totWaste);
  $("#wsStockout").textContent=KRW(totStockout);
  $("#wsProfit").textContent=KRW(profitUp);
  const advTxt=LANG==="en"?{cut:"Reduce order",ok:"OK",buy:"Reorder"}:{cut:"발주 축소",ok:"적정",buy:"발주 권장"};
  $("#wsRows").innerHTML=calc.map(x=>{
    const adv = x.excess>0 ? `<span class="pill warn">${advTxt.cut}</span>` : x.c.need ? `<span class="pill danger">${advTxt.buy}</span>` : `<span class="pill ok">${advTxt.ok}</span>`;
    return `<tr><td>${x.it.name}</td><td class="num">${x.c.cover>=999?"—":x.c.cover.toFixed(1)}${LANG==="en"?"d":"일"}</td>
      <td class="num">${x.excess.toFixed(0)} ${x.it.unit}</td><td class="num">${KRW(x.wasteAmt)}</td><td>${adv}</td></tr>`;
  }).join("");
  const wrows=calc.filter(x=>x.wasteAmt>0).sort((a,b)=>b.wasteAmt-a.wasteAmt);
  if(wsChart) wsChart.destroy();
  wsChart = new Chart($("#wsChart"),{ type:"bar",
    data:{labels:(wrows.length?wrows:calc).map(x=>x.it.name), datasets:[{label:LANG==="en"?"Waste risk(₩)":"폐기위험액", data:(wrows.length?wrows:calc).map(x=>Math.round(x.wasteAmt)),
      backgroundColor:"#b0303a", borderRadius:6}]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}});
  // 이익 레버리지: 식재료비 절감 0~5%p가 영업이익(가정 7%)에 미치는 배수
  const margin=0.07; const labels=[0,1,2,3,4,5];
  const lever=labels.map(p=> monthFoodCost? ( (monthFoodCost*(p/100)) / (monthFoodCost/0.35*margin||1) *100 ) : 0); // 절감액/영업이익 %
  if(wsLeverChart) wsLeverChart.destroy();
  wsLeverChart = new Chart($("#wsLeverChart"),{ type:"line",
    data:{labels:labels.map(p=>p+"%p"), datasets:[{label:LANG==="en"?"Profit improvement %":"영업이익 개선%", data:lever.map(v=>+v.toFixed(1)),
      borderColor:"#137a4b", backgroundColor:"rgba(19,122,75,.12)", fill:true, tension:.3, pointRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
}

/* ── 알림 ── */
function pushNotif(kind, title, desc){
  G.notifs=G.notifs||[];
  G.notifs.unshift({kind, title, desc, at:new Date().toLocaleString("ko-KR",{hour12:false})});
  G.notifs=G.notifs.slice(0,40); save();
}

/* ── ⑦ 발주서·발송 ── */
function renderOrders(){
  if(!currentDraft || currentDraft.length===0){
    $("#draftBody").innerHTML=`<div class="empty">${t("ord.draftEmpty")}</div>`;
  } else {
    $("#draftBody").innerHTML=currentDraft.map((g,gi)=>{
      const total=g.items.reduce((s,l)=>s+l.qty*l.price,0);
      return `<div class="card" style="margin-bottom:12px;border-color:var(--brand-soft)">
        <h3>${supName(g.supplier)} <span class="pill muted">${g.items.length}${LANG==="en"?" items":"품목"}</span></h3>
        <div class="table-scroll"><table><thead><tr><th>${t("th.item")}</th><th class="num">${LANG==="en"?"Qty":"수량"}</th><th class="num">${t("th.price")}</th><th class="num">${t("th.amount")}</th></tr></thead>
        <tbody>${g.items.map(l=>`<tr><td>${l.name}</td><td class="num">${l.qty} ${l.unit}</td><td class="num">${KRW(l.price)}</td><td class="num">${KRW(l.qty*l.price)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><th colspan="3" class="num">${t("th.sum")}</th><th class="num">${KRW(total)}</th></tr></tfoot></table></div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn ghost sm" data-pdf="${gi}">📄 ${LANG==="en"?"PO PDF":"발주서 PDF"}</button>
          <button class="btn primary sm" data-send="${gi}">📨 ${LANG==="en"?"Send KakaoTalk (mock)":"알림톡 발송(mock)"}</button>
        </div></div>`;
    }).join("");
    $$("#draftBody [data-pdf]").forEach(b=>b.addEventListener("click",()=>downloadPDF(currentDraft[+b.dataset.pdf])));
    $$("#draftBody [data-send]").forEach(b=>b.addEventListener("click",()=>sendOrder(+b.dataset.send)));
  }
  const orders=S().orders;
  if(orders.length===0){
    $("#orderRows").innerHTML=`<tr><td colspan="8" class="empty">${t("ord.histEmpty")}</td></tr>`;
  } else {
    const stTxt = LANG==="en"? {received:"Received",shipped:"Shipped",sent:"Sent"} : {received:"입고완료",shipped:"출고됨",sent:"발송"};
    $("#orderRows").innerHTML=orders.slice().reverse().map(o=>{
      const st = o.status==="received" ? `<span class="pill ok">${stTxt.received}</span>`
        : o.status==="shipped" ? `<span class="pill brand">${stTxt.shipped}</span>` : `<span class="pill warn">${stTxt.sent}</span>`;
      const cb = o.confirmed
        ? `<span class="pill ok">✔ ${LANG==="en"?"Confirmed":"확인됨"}</span>`
        : (o.status==="received"?`<span class="pill ok">✔</span>`:`<span class="pill muted">${LANG==="en"?"Awaiting":"대기"}</span>`);
      return `<tr><td>${o.no}</td><td>${supName(o.supplier)}</td><td class="num">${o.items.length}</td>
        <td class="num">${KRW(o.total)}</td><td>${st}</td><td>${cb}</td><td>${o.sentAt}</td>
        <td><button class="btn ghost sm" data-rpdf="${o.no}">PDF</button></td></tr>`;
    }).join("");
    $$("#orderRows [data-rpdf]").forEach(b=>b.addEventListener("click",()=>{
      const o=S().orders.find(x=>x.no===b.dataset.rpdf);
      downloadPDF({supplier:o.supplier, items:o.items}, o.no);
    }));
  }
}

/* jsPDF 한글 발주서 */
let _fontReady=null;
async function ensureKoreanFont(doc){
  if(_fontReady===false) return false;
  try{
    if(!window._nanumB64){
      const url="https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_three@1.0/NanumGothic.ttf";
      const buf=await fetch(url).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();});
      let bin=""; const bytes=new Uint8Array(buf);
      for(let i=0;i<bytes.length;i++) bin+=String.fromCharCode(bytes[i]);
      window._nanumB64=btoa(bin);
    }
    doc.addFileToVFS("NanumGothic.ttf", window._nanumB64);
    doc.addFont("NanumGothic.ttf","NanumGothic","normal");
    doc.setFont("NanumGothic"); _fontReady=true; return true;
  }catch(e){ _fontReady=false; return false; }
}
async function downloadPDF(group, forcedNo){
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:"pt", format:"a4"});
  const ok=await ensureKoreanFont(doc);
  const no=forcedNo || ("PO-"+todayISO().replace(/-/g,"")+"-"+S().seq);
  const total=group.items.reduce((s,l)=>s+l.qty*l.price,0);
  if(ok){
    let y=56; doc.setFontSize(18); doc.text("발 주 서 (Purchase Order)",40,y); y+=26;
    doc.setFontSize(11);
    doc.text(`발주번호: ${no}`,40,y); doc.text(`발주일자: ${todayISO()}`,330,y); y+=18;
    doc.text(`공급사: ${supName(group.supplier)}`,40,y); y+=18;
    doc.text(`발주매장: ${storeName(G.store)}  (담당: <TODO: 사용자 입력>)`,40,y); y+=24;
    doc.setFillColor(240,242,249); doc.rect(40,y,515,22,"F");
    doc.text("품목",48,y+15); doc.text("수량",300,y+15); doc.text("단가",380,y+15); doc.text("금액",470,y+15); y+=30;
    group.items.forEach(l=>{ doc.text(String(l.name),48,y); doc.text(`${l.qty} ${l.unit}`,300,y);
      doc.text(KRW(l.price),380,y); doc.text(KRW(l.qty*l.price),470,y); y+=20; });
    y+=6; doc.setLineWidth(.5); doc.line(40,y,555,y); y+=20;
    doc.setFontSize(13); doc.text(`합계: ${KRW(total)} (VAT 별도)`,360,y);
    doc.setFontSize(9); doc.setTextColor(130);
    doc.text("본 발주서는 발주메이트 v3 데모에서 자동 생성되었습니다.",40,800);
  } else {
    const c=document.createElement("canvas"); c.width=900; c.height=240+group.items.length*40;
    const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height);
    x.fillStyle="#1b1f2a"; x.font="bold 30px sans-serif"; x.fillText("발 주 서 (Purchase Order)",40,56);
    x.font="18px sans-serif";
    x.fillText(`발주번호: ${no}    발주일자: ${todayISO()}`,40,96);
    x.fillText(`공급사: ${supName(group.supplier)}   발주매장: ${storeName(G.store)}`,40,124);
    x.font="bold 18px sans-serif"; let yy=176;
    x.fillText("품목",48,yy); x.fillText("수량",420,yy); x.fillText("단가",560,yy); x.fillText("금액",720,yy);
    x.font="17px sans-serif"; yy+=34;
    group.items.forEach(l=>{ x.fillText(String(l.name),48,yy); x.fillText(`${l.qty} ${l.unit}`,420,yy);
      x.fillText(KRW(l.price),560,yy); x.fillText(KRW(l.qty*l.price),720,yy); yy+=38; });
    x.font="bold 20px sans-serif"; x.fillText(`합계: ${KRW(total)} (VAT 별도)`,520,yy+20);
    doc.addImage(c.toDataURL("image/png"),"PNG",30,30,535,(c.height/c.width)*535);
  }
  doc.save(`${no}.pdf`); toast(LANG==="en"?"PO PDF generated":"발주서 PDF를 생성했어요");
}
async function sendOrder(gi){
  const g=currentDraft[gi]; if(!g) return;
  const no="PO-"+todayISO().replace(/-/g,"")+"-"+(S().seq++);
  const total=g.items.reduce((s,l)=>s+l.qty*l.price,0);
  const now=new Date().toLocaleString("ko-KR",{hour12:false});
  const promisedLead = Math.round(mean(g.items.map(l=>{ const it=S().items.find(i=>i.id===l.id); return it?it.lead:2; })));
  const order={no, supplier:g.supplier, store:G.store, items:g.items.map(l=>({...l})), total, status:"sent", sentAt:now, promisedLead, confirmed:false};
  S().orders.push(order);
  const sup=S().suppliers.find(s=>s.id===g.supplier);
  const div=document.createElement("div"); div.className="log";
  div.textContent=
`[알림톡 mock 발송 로그] ${now}
→ 채널: 카카오 알림톡 (대체발송: SMS)
→ 수신: ${sup.name} (${sup.phone||"연락처 미등록"})
→ 발주번호 ${no} · ${g.items.length}품목 · ${KRW(total)}
→ 템플릿: PO_NOTICE_01 · 결과: 전송 성공 (HTTP 200, mock) · 공급사 확인 대기`;
  $("#sendLog").prepend(div);
  pushNotif("brand", LANG==="en"?"PO sent":"발주서 발송", `${sup.name} → ${no} (${KRW(total)})`);
  logInt("알림톡", `${no} → ${sup.name} 발송 성공(mock)`);
  currentDraft.splice(gi,1);
  save(); renderOrders(); toast(LANG==="en"?`Sent to ${sup.name} (${no})`:`${sup.name}에 발주서를 발송했어요 (${no})`);
}
$("#exportOrders").addEventListener("click",()=>{
  const rows=[["발주번호","공급사","품목수","금액","상태","발송일시"]];
  S().orders.forEach(o=>rows.push([o.no,supName(o.supplier),o.items.length,o.total,o.status,o.sentAt]));
  if(rows.length===1){ toast(LANG==="en"?"No order history to export":"내보낼 발주 이력이 없습니다"); return; }
  downloadCSV(rows, `발주이력_${storeName(G.store)}_${todayISO()}.csv`);
  logInt("CSV", `발주 이력 ${rows.length-1}건 내보내기`);
});

/* ── ⑧ 입고·검수 ── */
function renderReceive(){
  const pending=S().orders.filter(o=>o.status==="sent"||o.status==="shipped");
  const done=S().orders.filter(o=>o.status==="received");
  const issues=S().orders.filter(o=>(o.inspect && o.inspect.quality!=="pass") || (o.inspect&&o.inspect.ratio<100));
  $("#rcOpen").textContent=pending.length; $("#rcDone").textContent=done.length; $("#rcIssue").textContent=issues.length;
  $("#pendingRows").innerHTML=pending.length? pending.map(o=>{
    const delay = orderDelay(o);
    const dpill = delay>0 ? `<span class="pill danger">+${delay}${LANG==="en"?"d":"일"}</span>` : `<span class="pill ok">${LANG==="en"?"On-time":"정시"}</span>`;
    return `<tr><td>${o.no}</td><td>${supName(o.supplier)}</td><td class="num">${KRW(o.total)}</td><td class="num">${dpill}</td><td>${o.sentAt}</td>
    <td><button class="btn primary sm" data-recv="${o.no}">${LANG==="en"?"Receive":"정상 입고"}</button>
        <button class="btn ghost sm" data-insp="${o.no}">${LANG==="en"?"Inspect…":"검수…"}</button></td></tr>`;
  }).join("")
    : `<tr><td colspan="6" class="empty">${t("rc.pendingEmpty")}</td></tr>`;
  $$("#pendingRows [data-recv]").forEach(b=>b.addEventListener("click",()=>receive(b.dataset.recv,{ratio:100,quality:"pass"})));
  $$("#pendingRows [data-insp]").forEach(b=>b.addEventListener("click",()=>openInspect(b.dataset.insp)));

  const inspected=S().orders.filter(o=>o.status==="received");
  $("#inspectRows").innerHTML=inspected.length? inspected.slice().reverse().map(o=>{
    const q=o.inspect||{ratio:100,quality:"pass"};
    const res = q.quality==="pass"&&q.ratio>=100 ? `<span class="pill ok">${LANG==="en"?"Normal":"정상"}</span>`
      : q.quality==="fail" ? `<span class="pill danger">${LANG==="en"?"Rejected":"불량반품"}</span>`
      : `<span class="pill warn">${q.ratio<100?`${LANG==="en"?"Partial":"부분"}(${q.ratio}%)`:(LANG==="en"?"Minor":"경미불량")}</span>`;
    return `<tr><td>${o.no}</td><td>${supName(o.supplier)}</td><td>${res}</td><td class="num">${o.actualLead??"—"}</td><td>${o.recvAt||"—"}</td></tr>`;
  }).join("") : `<tr><td colspan="5" class="empty">${t("rc.inspEmpty")}</td></tr>`;
}
function orderDelay(o){ return o._simDelay ?? 0; }
let inspTarget=null;
function openInspect(no){
  inspTarget=no; $("#inspNo").textContent=no; $("#inspRatio").value=100; $("#inspQuality").value="pass";
  $("#inspModal").style.display="flex";
}
$("#inspCancel").addEventListener("click",()=>{ $("#inspModal").style.display="none"; inspTarget=null; });
$("#inspConfirm").addEventListener("click",()=>{
  const ratio=Math.min(100,Math.max(0,+$("#inspRatio").value||0));
  const quality=$("#inspQuality").value;
  receive(inspTarget,{ratio,quality});
  $("#inspModal").style.display="none"; inspTarget=null;
});
function receive(no, inspect){
  const o=S().orders.find(x=>x.no===no); if(!o || o.status==="received") return;
  o.status="received"; o.inspect=inspect;
  o.recvAt=new Date().toLocaleString("ko-KR",{hour12:false});
  o.actualLead = (o.promisedLead||2) + (o._simDelay||0);
  const factor = inspect.quality==="fail" ? 0 : inspect.ratio/100;
  o.items.forEach(l=>{ const it=S().items.find(i=>i.id===l.id); if(it) it.stock += Math.round(l.qty*factor); });
  const settleAmt = Math.round(o.total*factor);
  S().settlements.push({no:o.no, supplier:o.supplier, amount:settleAmt, at:o.recvAt});
  if(inspect.quality!=="pass" || inspect.ratio<100)
    pushNotif("danger",LANG==="en"?"Inspection issue":"검수 이슈",`${no} ${supName(o.supplier)} — ${inspect.quality==="fail"?(LANG==="en"?"rejected":"불량 반품"):`${LANG==="en"?"partial":"부분입고"} ${inspect.ratio}%`}`);
  save(); renderReceive(); toast(LANG==="en"?`${no} received (${KRW(settleAmt)} settled)`:`${no} 입고 처리 (${KRW(settleAmt)} 정산)`);
}

/* ── ⑨ 정산 ── */
let settleChart;
function renderSettle(){
  const st=S().settlements;
  $("#stTotal").textContent=KRW(st.reduce((s,x)=>s+x.amount,0));
  $("#stCount").textContent=st.length;
  const bySup={}; st.forEach(s=>bySup[s.supplier]=(bySup[s.supplier]||0)+s.amount);
  const top=Object.entries(bySup).sort((a,b)=>b[1]-a[1])[0];
  $("#stTop").textContent= top? supName(top[0]) : "—";
  $("#settleRows").innerHTML=st.length? st.slice().reverse().map(s=>`
    <tr><td>${s.no}</td><td>${supName(s.supplier)}</td><td class="num">${KRW(s.amount)}</td><td>${s.at}</td></tr>`).join("")
    : `<tr><td colspan="4" class="empty">${t("st.empty")}</td></tr>`;
  const labels=Object.keys(bySup).map(supName), data=Object.values(bySup);
  if(settleChart) settleChart.destroy();
  settleChart=new Chart($("#settleChart"),{ type:"doughnut",
    data:{labels:labels.length?labels:[LANG==="en"?"None":"없음"], datasets:[{data:data.length?data:[1],
      backgroundColor:["#2f53d6","#137a4b","#d39a2a","#b0303a","#7e87a8"]}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:12,font:{size:11}}}}}});
}

/* ── ⑩ 공급사 평가·추천 ── */
function supplierScores(){
  const W={d:+($("#wDelivery")?.value||40), p:+($("#wPrice")?.value||30), q:+($("#wQuality")?.value||30)};
  const sum=(W.d+W.p+W.q)||1; W.d/=sum; W.p/=sum; W.q/=sum;
  const scores={};
  const supAvgPrice={};
  S().suppliers.forEach(s=>{ const its=S().items.filter(i=>i.supplier===s.id);
    supAvgPrice[s.id]= its.length? mean(its.map(i=>i.price)) : 0; });
  const prices=Object.values(supAvgPrice).filter(v=>v>0);
  const maxP=Math.max(...prices,1), minP=Math.min(...prices,1);
  S().suppliers.forEach(s=>{
    const recv=S().orders.filter(o=>o.supplier===s.id && o.status==="received");
    const onTime=recv.filter(o=>(o._simDelay||0)<=0).length;
    const delivery= recv.length? onTime/recv.length*100 : 90;
    const pass=recv.filter(o=>o.inspect && o.inspect.quality==="pass" && o.inspect.ratio>=100).length;
    const quality= recv.length? pass/recv.length*100 : 92;
    const ap=supAvgPrice[s.id];
    const price= maxP===minP? 80 : 60 + (1-(ap-minP)/(maxP-minP))*40;
    const total= delivery*W.d + price*W.p + quality*W.q;
    scores[s.id]={delivery, price, quality, total, recvCount:recv.length, W, avgPrice:ap};
  });
  return scores;
}
function renderSuppliers(){
  const scores=supplierScores();
  const arr=S().suppliers.map(s=>({s, ...scores[s.id]})).sort((a,b)=>b.total-a.total);
  const gTxt = LANG==="en"? {a:"Excellent",b:"Good",c:"Watch"} : {a:"우수",b:"양호",c:"관찰"};
  $("#scoreCards").innerHTML=arr.map((r,i)=>{
    const grade = r.total>=85?gTxt.a:r.total>=70?gTxt.b:gTxt.c;
    const gp = r.total>=85?"ok":r.total>=70?"brand":"warn";
    const lb = LANG==="en"? {d:"Delivery",p:"Price",q:"Quality"} : {d:"납기준수율",p:"단가경쟁력",q:"품질(검수통과)"};
    const bar=(label,v,color)=>`<div style="margin:8px 0">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2);margin-bottom:4px">
        <span>${label}</span><b>${v.toFixed(0)}${LANG==="en"?"":"점"}</b></div>
      <div class="scorebar"><i style="width:${Math.min(100,v)}%;background:${color}"></i></div></div>`;
    return `<div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>${i+1}. ${r.s.name} <span class="pill ${gp}">${grade}</span></h3>
        <div style="font-size:26px;font-weight:800;color:var(--brand)">${r.total.toFixed(0)}<span style="font-size:13px;color:var(--ink-3)">/100</span></div>
      </div>
      <p class="hint" style="margin-top:4px">${LANG==="en"?`Receipts ${r.recvCount} · weights delivery ${(r.W.d*100).toFixed(0)}/price ${(r.W.p*100).toFixed(0)}/quality ${(r.W.q*100).toFixed(0)}`:`입고 이력 ${r.recvCount}건 · 가중치 납기${(r.W.d*100).toFixed(0)}/단가${(r.W.p*100).toFixed(0)}/품질${(r.W.q*100).toFixed(0)}`}</p>
      ${bar(lb.d, r.delivery, "#2f53d6")}
      ${bar(lb.p, r.price, "#137a4b")}
      ${bar(lb.q, r.quality, "#d39a2a")}
    </div>`;
  }).join("");
  renderReco(scores);
}
/* 품목별 다기준 대안 공급사 추천 */
function renderReco(scores){
  const supItems={};
  S().suppliers.forEach(s=>{ supItems[s.id]=S().items.filter(i=>i.supplier===s.id); });
  const rows=S().items.map(it=>{
    const curScore=scores[it.supplier]?.total||0;
    // 같은 카테고리(이름 첫 단어 무시) — 데모상 다른 공급사 전체를 후보로, 점수×가격 기준
    let best=null;
    S().suppliers.forEach(s=>{
      if(s.id===it.supplier) return;
      const sc=scores[s.id]?.total||0;
      // 후보 점수: 종합점수 우위 + 평균단가 우위 보정
      const cand={sup:s, score:sc};
      if(!best || cand.score>best.score) best=cand;
    });
    return {it, curSup:it.supplier, curScore, best};
  }).filter(r=>r.best && r.best.score > r.curScore+2);
  if(rows.length===0){
    $("#recoRows").innerHTML=`<tr><td colspan="6" class="empty">${LANG==="en"?"Current suppliers are already optimal. No switch recommended.":"현재 공급사가 모두 최적입니다. 교체 권고 없음."}</td></tr>`;
    return;
  }
  $("#recoRows").innerHTML=rows.map(r=>{
    const gain=(r.best.score-r.curScore).toFixed(0);
    const reason = LANG==="en"? `Composite +${gain}pt (delivery·price·quality)` : `종합점수 +${gain}점 (납기·단가·품질 우위)`;
    return `<tr><td>${r.it.name}</td><td>${supName(r.curSup)}</td><td class="num">${r.curScore.toFixed(0)}</td>
      <td><b style="color:var(--brand)">${r.best.sup.name}</b></td><td class="num">${r.best.score.toFixed(0)}</td><td>${reason}</td></tr>`;
  }).join("");
}
$("#recalcScore").addEventListener("click",()=>{ renderSuppliers(); toast(LANG==="en"?"Supplier scores recalculated":"공급사 평가를 재계산했어요"); });

/* ── ⑪ 외부 연동 허브 ── */
function logInt(type, msg){
  G.intEvents=G.intEvents||[];
  G.intEvents.unshift({type, msg, at:new Date().toLocaleString("ko-KR",{hour12:false})});
  G.intEvents=G.intEvents.slice(0,30); save();
  if($("#view-integrations").classList.contains("active")) renderIntLog();
}
function renderIntLog(){
  const ev=G.intEvents||[];
  $("#intLog").innerHTML = ev.length? ev.map(e=>`<div class="log">[${e.type}] ${e.at}\n${e.msg}</div>`).join("")
    : `<div class="empty">${t("int.logEmpty")}</div>`;
}
function renderIntegrations(){
  renderIntLog();
  // 연결 상태 복원
  setConn("#posConn", G.conn?.pos, "int.connected","int.disconnected");
  setConn("#bankConn", G.conn?.bank, "int.connected","int.disconnected");
  setConn("#oauthConn", !!G.conn?.oauth, "int.loggedIn","int.loggedOut", G.conn?.oauth);
}
function setConn(sel, on, onKey, offKey, extra){
  const el=$(sel); if(!el) return;
  el.classList.toggle("on", !!on);
  el.querySelector("span:last-child").textContent = (on? t(onKey):t(offKey)) + (on&&extra? ` · ${extra}`:"");
}
$("#posImport").addEventListener("click",()=>{
  let totalUnits=0, lines=[];
  S().items.forEach(it=>{
    const sold=Math.max(1, Math.round(ewma(it.hist,0.4)*(0.8+Math.random()*0.5)));
    it.stock=Math.max(0, it.stock - Math.round(sold*0.6));
    it.hist=[...it.hist.slice(1), sold];
    totalUnits+=sold; lines.push(`${it.name}: ${sold}${it.unit}`);
  });
  G.conn.pos=true; save();
  const now=new Date().toLocaleString("ko-KR",{hour12:false});
  const div=document.createElement("div"); div.className="log";
  div.textContent=`[POS API mock] ${now}\n→ GET /pos/v1/sales?date=${todayISO()} (HTTP 200)\n→ ${S().items.length}개 메뉴 전표 → 식자재 소비 ${totalUnits}단위 환산\n→ ${lines.slice(0,4).join(" · ")}${lines.length>4?" …":""}\n→ 재고·소비 이력 반영 완료`;
  $("#posLog").innerHTML=""; $("#posLog").prepend(div);
  setConn("#posConn", true, "int.connected","int.disconnected");
  logInt("POS", `매출 동기화 — 식자재 ${totalUnits}단위 소비 반영`);
  pushNotif("brand",LANG==="en"?"POS sync":"POS 동기화",`${LANG==="en"?"":"어제 매출 기준 "}${totalUnits}${LANG==="en"?" units consumed":"단위 소비 반영"}`);
  toast(LANG==="en"?"POS synced (mock)":"POS 매출을 동기화했어요");
});
function oauthLogin(provider){
  const token=`${provider}_at_${Math.random().toString(36).slice(2,10)}`;
  G.conn.oauth=provider==="kakao"?"카카오":"네이버"; save();
  const now=new Date().toLocaleString("ko-KR",{hour12:false});
  const div=document.createElement("div"); div.className="log";
  div.textContent=`[OAuth ${provider} mock] ${now}\n→ 302 redirect → /oauth/${provider}/callback?code=mock_${Math.random().toString(36).slice(2,8)}\n→ POST /oauth/token → access_token=${token} (키 0, mock)\n→ 사용자: demo@balju-mate.io · 로그인 성공`;
  $("#oauthLog").innerHTML=""; $("#oauthLog").prepend(div);
  setConn("#oauthConn", true, "int.loggedIn","int.loggedOut", G.conn.oauth);
  logInt("OAuth", `${G.conn.oauth} 로그인 토큰 발급(mock)`);
  toast(LANG==="en"?`Logged in via ${provider} (mock)`:`${G.conn.oauth}로 로그인했어요(mock)`);
}
$("#oauthKakao").addEventListener("click",()=>oauthLogin("kakao"));
$("#oauthNaver").addEventListener("click",()=>oauthLogin("naver"));
$("#bankWebhook").addEventListener("click",()=>{
  const due=S().settlements.reduce((s,x)=>s+x.amount,0);
  const txId="OB"+Date.now().toString().slice(-8);
  G.conn.bank=true; save();
  const now=new Date().toLocaleString("ko-KR",{hour12:false});
  const div=document.createElement("div"); div.className="log";
  div.textContent=`[오픈뱅킹 webhook mock] ${now}\n→ POST /openbanking/transfer {amount:${Math.round(due)}, store:"${storeName(G.store)}"}\n→ 202 Accepted · txId=${txId}\n← webhook 콜백 수신: {event:"DEPOSIT_DONE", txId:"${txId}", status:"DONE"}`;
  $("#bankLog").innerHTML=""; $("#bankLog").prepend(div);
  setConn("#bankConn", true, "int.connected","int.disconnected");
  logInt("오픈뱅킹", `정산 ${KRW(due)} 이체·입금완료 webhook(mock)`);
  pushNotif("ok",LANG==="en"?"Settlement deposited":"정산 입금완료",`${KRW(due)} · txId ${txId}`);
  toast(LANG==="en"?"Transfer webhook received (mock)":"이체·입금완료 webhook을 받았어요(mock)");
});
$("#taxIssue").addEventListener("click",()=>{
  const supply=S().settlements.reduce((s,x)=>s+x.amount,0);
  const vat=Math.round(supply*0.1);
  const apr="NTS"+Date.now().toString().slice(-10);
  const now=new Date().toLocaleString("ko-KR",{hour12:false});
  const div=document.createElement("div"); div.className="log";
  div.textContent=`[전자세금계산서 mock] ${now}\n→ POST /etax/issue {공급가액:${Math.round(supply)}, 세액:${vat}}\n→ 국세청 e-세로 전송 (HTTP 200)\n→ 승인번호 ${apr} · 합계 ${KRW(supply*1.1)}`;
  $("#taxLog").innerHTML=""; $("#taxLog").prepend(div);
  logInt("세금계산서", `세금계산서 발행 공급가 ${KRW(supply)}·세액 ${KRW(vat)}(mock)`);
  toast(LANG==="en"?"E-tax invoice issued (mock)":"전자세금계산서를 발행했어요(mock)");
});
$("#csvImport").addEventListener("click",()=>{
  const txt=$("#csvIn").value.trim();
  const res=parseStockCSV(txt);
  const div=document.createElement("div"); div.className="log";
  if(res.errors.length && res.applied===0){
    div.textContent=`[CSV 검증 실패]\n${res.errors.join("\n")}`;
  } else {
    div.textContent=`[CSV 가져오기] ${res.applied}건 반영${res.errors.length?`, ${res.errors.length}건 오류:\n- `+res.errors.join("\n- "):""}`;
    save(); logInt("CSV", `재고 CSV ${res.applied}건 반영`+(res.errors.length?` (${res.errors.length}건 오류)`:""));
  }
  $("#csvLog").innerHTML=""; $("#csvLog").prepend(div);
  toast(res.applied?(LANG==="en"?`${res.applied} stock rows updated`:`${res.applied}건 재고를 갱신했어요`):(LANG==="en"?"Validation error, nothing applied":"검증 오류로 반영하지 않았어요"));
});
function parseStockCSV(txt){
  const out={applied:0, errors:[]};
  const rows=txt.split(/\r?\n/).map(r=>r.trim()).filter(Boolean);
  if(!rows.length){ out.errors.push(LANG==="en"?"Empty input":"빈 입력"); return out; }
  let start=0;
  if(/품목|name/i.test(rows[0]) && /재고|stock/i.test(rows[0])) start=1;
  for(let i=start;i<rows.length;i++){
    const cells=rows[i].split(",").map(c=>c.trim());
    if(cells.length<2){ out.errors.push(`${i+1}행: 열 부족`); continue; }
    const [name, stockStr]=cells;
    const stock=Number(stockStr);
    if(!name){ out.errors.push(`${i+1}행: 품목명 없음`); continue; }
    if(!Number.isFinite(stock) || stock<0){ out.errors.push(`${i+1}행: 재고값 오류(${stockStr})`); continue; }
    const it=S().items.find(x=>x.name===name);
    if(!it){ out.errors.push(`${i+1}행: 미등록 품목(${name})`); continue; }
    it.stock=Math.round(stock); out.applied++;
  }
  return out;
}
function downloadCSV(rows, filename){
  const csv="﻿"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  URL.revokeObjectURL(a.href);
  $("#csvExportLog").style.display="inline-flex"; $("#csvExportLog").textContent=`${LANG==="en"?"Exported":"내보냄"}: ${filename}`;
}
$("#csvExportInv").addEventListener("click",()=>{
  const rows=[["품목","공급사","현재고","단위","단가","평가액"]];
  S().items.forEach(it=>rows.push([it.name,supName(it.supplier),it.stock,it.unit,it.price,it.stock*it.price]));
  downloadCSV(rows,`재고현황_${storeName(G.store)}_${todayISO()}.csv`); logInt("CSV","재고 현황 내보내기");
  toast(LANG==="en"?"Inventory CSV exported":"재고 현황 CSV를 내보냈어요");
});
$("#csvExportFc").addEventListener("click",()=>{
  const rows=[["품목","HW일평균","안전재고","ROP","현재고","제안수량"]];
  S().items.forEach(it=>{ const c=computeItem(it,fcOpt());
    rows.push([it.name,c.mu.toFixed(2),c.safety.toFixed(1),c.rop.toFixed(1),it.stock,c.suggest]); });
  downloadCSV(rows,`예측결과_${storeName(G.store)}_${todayISO()}.csv`); logInt("CSV","예측 결과 내보내기");
  toast(LANG==="en"?"Forecast CSV exported":"예측 결과 CSV를 내보냈어요");
});

/* ── ⑫ 알림 센터 ── */
function renderNotif(){
  const list=G.notifs||[];
  const color={danger:"#b0303a",warn:"#d39a2a",brand:"#2f53d6",ok:"#137a4b"};
  $("#notifList").innerHTML=list.length? list.map(n=>`
    <div class="notif"><span class="dot" style="background:${color[n.kind]||"#858d9d"}"></span>
      <div class="body"><div class="t">${n.title}</div><div class="d">${n.desc}</div><div class="time">${n.at}</div></div></div>`).join("")
    : `<div class="empty">${t("nt.empty")}</div>`;
}
$("#genAlerts").addEventListener("click",()=>{
  const calc=S().items.map(it=>({it,c:computeItem(it,fcOpt())}));
  let n=0;
  calc.filter(x=>x.c.need).forEach(({it,c})=>{ pushNotif("danger",LANG==="en"?"Reorder alert":"재주문 경보",`${it.name} ${LANG==="en"?"stock":"현재고"} ${it.stock} ≤ ROP ${c.rop.toFixed(1)}`); n++; });
  calc.filter(x=>x.c.cover>14 && x.c.cover<999).forEach(({it,c})=>{ pushNotif("warn",LANG==="en"?"Excess stock":"과잉재고",`${it.name} ${LANG==="en"?"cover":"커버"} ${c.cover.toFixed(0)}${LANG==="en"?"d":"일"} — ${LANG==="en"?"waste risk":"폐기 위험"}`); n++; });
  renderNotif(); toast(LANG==="en"?`${n} alerts generated`:`${n}건 알림을 생성했어요`);
});

/* ── ⑬ 공급사 포털 (양방향 알림톡 콜백) ── */
function renderSupplierPortal(){
  const SUP="s3";
  let incoming=[];
  G.stores.forEach(st=>{ G.data[st.id].orders.forEach(o=>{ if(o.supplier===SUP) incoming.push({...o, _store:st.id}); }); });
  const news=incoming.filter(o=>o.status==="sent");
  const shipped=incoming.filter(o=>o.status==="shipped");
  $("#spNew").textContent=news.length; $("#spShipped").textContent=shipped.length;
  $("#spAmount").textContent=KRW(incoming.reduce((s,o)=>s+o.total,0));
  const stTxt=LANG==="en"?{received:"Received",shipped:"Shipped",sent:"New"}:{received:"입고완료",shipped:"출고됨",sent:"신규"};
  $("#spRows").innerHTML=incoming.length? incoming.slice().reverse().map(o=>{
    const st = o.status==="received"?`<span class="pill ok">${stTxt.received}</span>`:o.status==="shipped"?`<span class="pill brand">${stTxt.shipped}</span>`:`<span class="pill warn">${stTxt.sent}</span>`;
    const act = o.status==="sent" ? `<button class="btn primary sm" data-ship="${o._store}|${o.no}">${LANG==="en"?"Ship":"출고 처리"}</button>` : "—";
    return `<tr><td>${o.no}</td><td>${storeName(o._store)}</td><td class="num">${o.items.length}</td>
      <td class="num">${KRW(o.total)}</td><td>${st}</td><td>${act}</td></tr>`;
  }).join("") : `<tr><td colspan="6" class="empty">${t("sp.empty")}</td></tr>`;
  $$("#spRows [data-ship]").forEach(b=>b.addEventListener("click",()=>{
    const [stId,no]=b.dataset.ship.split("|");
    const o=G.data[stId].orders.find(x=>x.no===no);
    if(o){
      o.status="shipped"; o.confirmed=true; o.shippedAt=new Date().toLocaleString("ko-KR",{hour12:false}); save();
      // 양방향 알림톡 콜백: 공급사 → 식당
      pushNotif("brand",LANG==="en"?"Supplier confirmed":"공급사 발주 확인",`${no} ${LANG==="en"?"shipped — KakaoTalk callback to":"출고 — 식당에 알림톡 콜백:"} ${storeName(stId)}`);
      logInt("알림톡(콜백)", `${no} 공급사 출고 확인 → ${storeName(stId)} 콜백 발송(mock)`);
      renderSupplierPortal();
      toast(LANG==="en"?`${no} shipped — callback sent`:`${no} 출고 처리 — 식당에 확인 콜백을 보냈어요`);
    }
  }));
}

/* ── 검수 모달 백드롭 클릭 닫기 ── */
$("#inspModal").addEventListener("click",e=>{ if(e.target.id==="inspModal"){ $("#inspModal").style.display="none"; inspTarget=null; } });

/* ── 초기화 ── */
LANG = (G.lang==="en"||G.lang==="ko")? G.lang : "ko";
$$(".lang-btn").forEach(x=>x.classList.toggle("active", x.dataset.lang===LANG));
$("#roleSel").value=G.role;
applyI18n();
applyRole();   // 역할/매장/내비 세팅 + 첫 뷰 렌더

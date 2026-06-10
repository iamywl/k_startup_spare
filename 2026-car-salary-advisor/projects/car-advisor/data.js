// car-advisor 데이터 파일 (순수 데이터/상수, 함수·DOM 접근 없음)
// 모든 수치는 2024~2025 라인업 기준 근사치/추정. 실제 구매 전 제조사·딜러 확인 필요.
// 계약: ./_CONTRACT.md 의 전역명·옵션 키 33종·그룹·스키마·COST 형태를 그대로 준수.

// ── 옵션 메타 (33종) ─────────────────────────────────────────────
// group ∈ climate | parking | digital | longdrive | cargo
// valueWeight ∈ 'high'|'mid'|'low'
//  high(시세방어): frontVentSeat, rearVentSeat, scc, hda, oemNavi, hud, svm, ledHeadlamp
//  low(취향): sunroof, ota, outlet220v
//  나머지 mid
window.OPTION_META = [
  // climate (☀️ 계절·기후)
  { key:'frontHeatedSeat', label:'앞좌석 열선',          consumer:'엉따',                group:'climate',   valueWeight:'mid'  },
  { key:'frontVentSeat',   label:'앞좌석 통풍',          consumer:'등땀 방지',           group:'climate',   valueWeight:'high' },
  { key:'rearHeatedSeat',  label:'2열 열선',            consumer:'2열 엉따',            group:'climate',   valueWeight:'mid'  },
  { key:'rearVentSeat',    label:'2열 통풍',            consumer:'2열 통풍',            group:'climate',   valueWeight:'high' },
  { key:'heatedWheel',     label:'스티어링 휠 열선',     consumer:'손따',                group:'climate',   valueWeight:'mid'  },
  { key:'remoteClimate',   label:'원격 시동/공조',       consumer:'미리 따뜻/시원',       group:'climate',   valueWeight:'mid'  },
  { key:'multiZoneHvac',   label:'멀티존 공조',          consumer:'운전석 따로 조수석 따로', group:'climate', valueWeight:'mid'  },
  { key:'memorySeat',      label:'메모리 시트',          consumer:'내 자세 기억',         group:'climate',   valueWeight:'mid'  },

  // parking (🅿️ 주차·좁은길)
  { key:'svm',             label:'360° 어라운드뷰',      consumer:'위에서 보는 화면',      group:'parking',   valueWeight:'high' },
  { key:'parkingSensor',   label:'주차센서',            consumer:'삑삑이',               group:'parking',   valueWeight:'mid'  },
  { key:'rearCam',         label:'후방 카메라',          consumer:'후방 화면',            group:'parking',   valueWeight:'mid'  },
  { key:'rspa',            label:'원격 스마트 주차',      consumer:'알아서 주차',          group:'parking',   valueWeight:'mid'  },
  { key:'bvm',             label:'후측방 모니터',        consumer:'사각지대 영상',         group:'parking',   valueWeight:'mid'  },
  { key:'ledHeadlamp',     label:'LED/매트릭스 헤드램프', consumer:'밝은 LED 라이트',      group:'parking',   valueWeight:'high' },

  // digital (📱 디지털)
  { key:'oemNavi',         label:'순정 내비',           consumer:'기본 내비',            group:'digital',   valueWeight:'high' },
  { key:'phoneProjection', label:'카플레이/안드로이드오토', consumer:'폰 미러링',           group:'digital',   valueWeight:'mid'  },
  { key:'wirelessCharger', label:'무선 충전',           consumer:'올려두면 충전',         group:'digital',   valueWeight:'mid'  },
  { key:'hud',             label:'HUD',               consumer:'앞유리 표시',          group:'digital',   valueWeight:'high' },
  { key:'ota',             label:'OTA 업데이트',        consumer:'무선 업데이트',         group:'digital',   valueWeight:'low'  },

  // longdrive (🛣️ 장거리)
  { key:'scc',             label:'스마트 크루즈',        consumer:'알아서 속도 유지',      group:'longdrive', valueWeight:'high' },
  { key:'lfa',             label:'차로 유지 보조',       consumer:'핸들 살짝 잡아줌',      group:'longdrive', valueWeight:'mid'  },
  { key:'hda',             label:'고속도로 주행보조',     consumer:'고속도로 반자율',       group:'longdrive', valueWeight:'high' },
  { key:'fca',             label:'전방 충돌방지',        consumer:'알아서 브레이크',       group:'longdrive', valueWeight:'mid'  },
  { key:'bca',             label:'후측방 충돌방지',      consumer:'옆차 경고',            group:'longdrive', valueWeight:'mid'  },
  { key:'rcca',            label:'후방 교차충돌 방지',    consumer:'후진 시 옆차 경고',     group:'longdrive', valueWeight:'mid'  },
  { key:'ecs',             label:'전자제어 서스펜션',     consumer:'노면 따라 부드럽게',     group:'longdrive', valueWeight:'mid'  },
  { key:'autoHold',        label:'오토 홀드',           consumer:'정차 시 발 떼도 정지',   group:'longdrive', valueWeight:'mid'  },

  // cargo (🏕️ 적재·거주)
  { key:'powerTailgate',   label:'스마트 전동 트렁크',    consumer:'발로 차면 열림',        group:'cargo',     valueWeight:'mid'  },
  { key:'flatFold',        label:'2열 풀플랫',          consumer:'평탄화 차박',          group:'cargo',     valueWeight:'mid'  },
  { key:'rearSunshade',    label:'2열 햇빛가리개',       consumer:'2열 햇빛 차단',         group:'cargo',     valueWeight:'mid'  },
  { key:'outlet220v',      label:'실내 220V',          consumer:'차에서 콘센트',         group:'cargo',     valueWeight:'low'  },
  { key:'sunroof',         label:'선루프',             consumer:'하늘 보이는 창',        group:'cargo',     valueWeight:'low'  }
];

// ── 옵션 세부설명 (ⓘ 툴팁용, 소비자 친화 해요체) ─────────────────
// 각 OPTION_META.key 에 대응. "이게 뭔지 + 왜 좋은지(언제 유용한지)".
window.OPTION_DESC = {
  frontHeatedSeat: '앞좌석 방석·등받이를 따뜻하게 데워줘요. 추운 겨울 아침 시동 직후 엉덩이부터 금방 따뜻해져요.',
  frontVentSeat:   '앞좌석에서 바람이 나와 등과 허벅지를 시원하게 해줘요. 여름철 등에 차는 땀과 끈적임을 막아줘요.',
  rearHeatedSeat:  '2열 좌석에도 열선을 넣어 따뜻하게 해줘요. 뒷자리에 자주 타는 가족·아이가 겨울에 덜 추워요.',
  rearVentSeat:    '2열 좌석에서도 시원한 바람이 나와요. 뒷자리 승객이 많은 여름 장거리에서 특히 쾌적해요.',
  heatedWheel:     '운전대(핸들)를 따뜻하게 데워줘요. 손이 시린 겨울에 장갑 없이도 손이 금방 따뜻해져요.',
  remoteClimate:   '타기 전에 스마트키·앱으로 시동을 걸어 미리 데우거나 식혀둬요. 한여름·한겨울에 쾌적한 실내로 바로 탈 수 있어요.',
  multiZoneHvac:   '운전석과 조수석의 온도를 따로 맞출 수 있어요. 더위·추위 타는 정도가 다른 동승자와 다툴 일이 없어요.',
  memorySeat:      '운전자별 시트·거울 위치를 기억해 버튼 하나로 맞춰줘요. 여러 사람이 번갈아 탈 때 매번 조절할 필요가 없어요.',
  svm:             '차 주변을 위에서 내려다보듯 보여줘요. 좁은 주차장이나 골목에서 휠 긁힘·접촉을 막아줘요.',
  parkingSensor:   '장애물에 가까워지면 삑삑 소리로 알려줘요. 주차할 때 앞뒤 간격을 눈치껏 맞추기 쉬워져요.',
  rearCam:         '후진할 때 차 뒤쪽을 화면으로 보여줘요. 뒤가 잘 안 보이는 차에서 후진 사고를 크게 줄여줘요.',
  rspa:            '차 밖에서 스마트키로 차를 알아서 주차·출차시켜요. 옆 차와 너무 붙어 문을 못 여는 좁은 칸에서 편해요.',
  bvm:             '방향지시등을 켜면 사각지대 옆쪽을 영상으로 보여줘요. 차선 변경 때 옆 차를 못 봐서 나는 사고를 막아줘요.',
  ledHeadlamp:     '밝고 또렷한 LED 전조등이에요. 어두운 밤길·시골길에서 시야가 넓어져 운전이 한결 안전해요.',
  oemNavi:         '차에 기본 내장된 내비게이션이에요. 폰 거치 없이 큰 화면으로 길 안내를 받고 과속 단속도 알려줘요.',
  phoneProjection: '카플레이·안드로이드오토로 폰 화면을 차 화면에 띄워요. 익숙한 내비·음악 앱을 큰 화면으로 안전하게 써요.',
  wirelessCharger: '폰을 올려두기만 하면 무선으로 충전돼요. 케이블을 꽂았다 뺐다 할 필요 없이 운전 중 배터리 걱정이 줄어요.',
  hud:             '속도·길 안내를 앞유리에 띄워줘요. 시선을 아래로 내리지 않아 전방을 보면서 정보를 확인할 수 있어요.',
  ota:            '인터넷으로 차 소프트웨어를 무선 업데이트해요. 정비소에 가지 않고도 기능이 개선되고 새 기능이 추가돼요.',
  scc:             '앞차와 거리를 맞춰 알아서 가속·감속해요. 막히는 길과 고속도로 출퇴근이 훨씬 덜 피곤해요.',
  lfa:             '차로 가운데를 유지하도록 핸들을 살짝 잡아줘요. 장거리 운전에서 차선을 벗어나지 않게 도와줘 덜 지쳐요.',
  hda:             '고속도로에서 속도 유지와 차로 유지를 함께 도와줘요. 출퇴근 정체·장거리에서 반자율에 가깝게 편하게 달려요.',
  fca:             '앞차·보행자와 충돌이 예상되면 스스로 브레이크를 잡아요. 한눈판 순간의 추돌 사고를 막거나 피해를 줄여줘요.',
  bca:             '뒤 옆에서 오는 차를 감지해 경고하고 필요하면 제동해줘요. 차선 변경 중 옆 차와의 접촉을 예방해요.',
  rcca:            '후진 중 옆에서 다가오는 차를 감지해 알려줘요. 주차장에서 빠져나올 때 안 보이는 차와의 사고를 막아줘요.',
  ecs:             '노면 상태에 맞춰 서스펜션 단단함을 자동 조절해요. 과속방지턱·울퉁불퉁한 길에서도 승차감이 부드러워요.',
  autoHold:        '정차하면 브레이크를 자동으로 잡아 발을 떼도 안 밀려요. 막히는 길·신호 대기에서 발이 덜 피곤해요.',
  powerTailgate:   '버튼·발차기로 트렁크가 자동으로 열려요. 양손에 짐을 들었을 때 손 안 대고 트렁크를 열 수 있어요.',
  flatFold:        '2열 시트를 접으면 바닥이 평평해져요. 차박·캠핑 때 누울 자리를 만들거나 큰 짐을 싣기 좋아요.',
  rearSunshade:    '2열 창문에 햇빛가리개가 달려 있어요. 뒷자리 아이·승객을 강한 햇빛과 눈부심에서 보호해줘요.',
  outlet220v:      '차 안에서 가정용 220V 콘센트를 쓸 수 있어요. 캠핑·차박에서 노트북·전기포트 등 가전을 바로 쓸 수 있어요.',
  sunroof:         '지붕에 열리는 유리창(선루프)이 있어요. 답답함을 줄이고 환기가 잘 되며 개방감 있는 드라이브를 즐겨요.'
};

// ── 그룹 메타 ────────────────────────────────────────────────────
window.GROUP_META = {
  climate:  { label:'계절·기후',   icon:'☀️' },
  parking:  { label:'주차·좁은길', icon:'🅿️' },
  digital:  { label:'디지털',     icon:'📱' },
  longdrive:{ label:'장거리',     icon:'🛣️' },
  cargo:    { label:'적재·거주',   icon:'🏕️' }
};

// ── 페르소나 (5개) ──────────────────────────────────────────────
window.PERSONAS = [
  { tag:'초보운전',   options:['svm','bvm','parkingSensor'] },
  { tag:'장거리출퇴근', options:['scc','lfa','frontVentSeat'] },
  { tag:'캠핑차박',   options:['flatFold','powerTailgate','outlet220v'] },
  { tag:'수족냉증',   options:['frontHeatedSeat','heatedWheel','remoteClimate'] },
  { tag:'패밀리카',   options:['rearVentSeat','rearSunshade','rcca'] }
];

// ── 검색어 → 옵션키 (일대다 허용). 소문자·공백제거 후 조회. ───────────
window.SYNONYMS = {
  // 계약 예시
  '엉따':['frontHeatedSeat','rearHeatedSeat'], '열선':['frontHeatedSeat'],
  '통풍':['frontVentSeat','rearVentSeat'], '등땀':['frontVentSeat'],
  '손따':['heatedWheel'], '핸들열선':['heatedWheel'],
  '360':['svm'], '어라운드뷰':['svm'], '탑뷰':['svm'],
  '카플레이':['phoneProjection'], '안드로이드오토':['phoneProjection'], '미러링':['phoneProjection'],
  '크루즈':['scc'], '스마트크루즈':['scc'], '차로유지':['lfa'],
  '차박':['flatFold'], '풀플랫':['flatFold'], '평탄화':['flatFold'],
  '전동트렁크':['powerTailgate'], '무선충전':['wirelessCharger'], '내비':['oemNavi'], 'hud':['hud'],
  '선루프':['sunroof'], '썬루프':['sunroof'], '2열통풍':['rearVentSeat'], '2열엉따':['rearHeatedSeat'],

  // 합리적 확장
  '시트열선':['frontHeatedSeat','rearHeatedSeat'], '뒷좌석열선':['rearHeatedSeat'],
  '앞통풍':['frontVentSeat'], '뒷통풍':['rearVentSeat'], '뒷좌석통풍':['rearVentSeat'],
  '스티어링열선':['heatedWheel'], '핸들따뜻':['heatedWheel'],
  '원격시동':['remoteClimate'], '리모트시동':['remoteClimate'], '예약공조':['remoteClimate'],
  '듀얼공조':['multiZoneHvac'], '독립공조':['multiZoneHvac'],
  '메모리시트':['memorySeat'], '자세기억':['memorySeat'],
  '서라운드뷰':['svm'], '버드뷰':['svm'], '주차센서':['parkingSensor'], '삑삑이':['parkingSensor'],
  '후방카메라':['rearCam'], '후방캠':['rearCam'], '후진카메라':['rearCam'],
  '원격주차':['rspa'], '리모트주차':['rspa'], '스마트주차':['rspa'],
  '후측방':['bvm','bca'], '사각지대':['bvm'], 'bvm':['bvm'],
  'led':['ledHeadlamp'], '매트릭스':['ledHeadlamp'], '헤드램프':['ledHeadlamp'], '헤드라이트':['ledHeadlamp'],
  '순정내비':['oemNavi'], '기본내비':['oemNavi'],
  '폰미러링':['phoneProjection'], '미러링크':['phoneProjection'],
  '무선충전기':['wirelessCharger'], '헤드업':['hud'], '헤드업디스플레이':['hud'],
  '오타':['ota'], '무선업데이트':['ota'],
  '스마트크루즈컨트롤':['scc'], '어댑티브크루즈':['scc'], 'scc':['scc'],
  '차선유지':['lfa'], '핸들보조':['lfa'], 'lfa':['lfa'],
  '고속도로주행보조':['hda'], '반자율':['hda'], 'hda':['hda'], '자율주행':['hda','scc','lfa'],
  '전방충돌':['fca'], '긴급제동':['fca'], 'fca':['fca'],
  '후측방충돌':['bca'], '후방교차':['rcca'],
  '서스펜션':['ecs'], '전자제어서스펜션':['ecs'], '에어서스펜션':['ecs'],
  '오토홀드':['autoHold'],
  '발로여는트렁크':['powerTailgate'], '스마트트렁크':['powerTailgate'], '파워테일게이트':['powerTailgate'],
  '평탄화시트':['flatFold'], '2열폴딩':['flatFold'], '풀플랫시트':['flatFold'],
  '햇빛가리개':['rearSunshade'], '선쉐이드':['rearSunshade'], '커튼':['rearSunshade'],
  '220v':['outlet220v'], '콘센트':['outlet220v'], '인버터':['outlet220v'], '전기콘센트':['outlet220v'],
  '파노라마':['sunroof'], '오픈에어':['sunroof'],
  '캠핑':['flatFold','outlet220v','powerTailgate'],
  '출퇴근':['scc','lfa','frontVentSeat'],
  '초보':['svm','parkingSensor','rearCam'],
  '가족':['rearVentSeat','rearSunshade','rcca']
};

// ── 유지비 상수 (계약 형태 그대로) ───────────────────────────────
window.COST = {
  fuelPriceWon: { '가솔린':1650, '디젤':1540, 'LPG':1100, '하이브리드':1650, 'EV':320 }, // 원/L (EV는 원/kWh) [추정]
  autoTaxPerCc: [ {max:1000, won:80}, {max:1600, won:140}, {max:Infinity, won:200} ],     // ×1.3(지방교육세)
  autoTaxEvFlatWon: 130000,
  insuranceBaseWon: 400000, insurancePriceRate: 0.012,   // 연보험 = base + (price만원*10000)*rate [추정]
  maintByFuelWon: { '가솔린':600000, '디젤':700000, 'LPG':550000, '하이브리드':450000, 'EV':300000 } // 연 소모품·정비 [추정]
};

// ── 차량 데이터 (30대 내외, 대표 트림 큐레이션. 모든 수치 근사치) ───
// options 는 OPTION_META 33개 키를 모두 boolean 으로 포함.
window.CARS = [
  // ── 경형 ──────────────────────────────────────────────
  {
    id:'hyundai-casper-inspiration',
    brand:'현대', model:'캐스퍼', trim:'인스퍼레이션',
    segment:'경형', bodyType:'SUV', fuel:'가솔린', drivetrain:'FWD',
    price:1990, displacementCc:998, efficiency:14.3,
    realEfficiency:11.4,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:4, lengthMm:3595, widthMm:1595, weightKg:1005, trunkL:233,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:false, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:false, multiZoneHvac:false, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:false, phoneProjection:true, wirelessCharger:false, hud:false, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:false, rcca:false, ecs:false, autoHold:false,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:false },
    kncapGrade:4, depreciationRate:0.14   // [추정] 경차 구형 안전도·인기 유지 보통
  },
  {
    id:'kia-morning-signature',
    brand:'기아', model:'모닝', trim:'시그니처',
    segment:'경형', bodyType:'해치백', fuel:'가솔린', drivetrain:'FWD',
    price:1700, displacementCc:998, efficiency:15.7,
    realEfficiency:13.3,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:3595, widthMm:1595, weightKg:935, trunkL:255,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:false, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:false, multiZoneHvac:false, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:false,
              oemNavi:false, phoneProjection:true, wirelessCharger:true, hud:false, ota:false,
              scc:false, lfa:true, hda:false, fca:true, bca:false, rcca:false, ecs:false, autoHold:false,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:false },
    kncapGrade:3, depreciationRate:0.15   // [추정] 경차 안전도 낮은 편, 감가 보통
  },
  {
    id:'kia-ray-signature',
    brand:'기아', model:'레이', trim:'시그니처',
    segment:'경형', bodyType:'박스카', fuel:'가솔린', drivetrain:'FWD',
    price:1900, displacementCc:998, efficiency:13.0,
    realEfficiency:10.8,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:4, lengthMm:3595, widthMm:1595, weightKg:1035, trunkL:206,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:false, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:false, remoteClimate:false, multiZoneHvac:false, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:false,
              oemNavi:false, phoneProjection:true, wirelessCharger:false, hud:false, ota:false,
              scc:false, lfa:true, hda:false, fca:true, bca:false, rcca:false, ecs:false, autoHold:false,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:false },
    kncapGrade:3, depreciationRate:0.11   // [추정] 박스카 안전도 낮으나 레이는 잔존가치 강세
  },

  // ── 소형/준중형 세단 ─────────────────────────────────────
  {
    id:'hyundai-avante-inspiration',
    brand:'현대', model:'아반떼', trim:'인스퍼레이션',
    segment:'준중형', bodyType:'세단', fuel:'가솔린', drivetrain:'FWD',
    price:2700, displacementCc:1598, efficiency:14.5,
    realEfficiency:13.2,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4710, widthMm:1825, weightKg:1245, trunkL:474,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:false, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.13   // [추정] 최신 안전도 5, 베스트셀러 감가 양호
  },
  {
    id:'kia-k3-signature',
    brand:'기아', model:'K3', trim:'시그니처',
    segment:'준중형', bodyType:'세단', fuel:'가솔린', drivetrain:'FWD',
    price:2500, displacementCc:1598, efficiency:14.1,
    realEfficiency:12,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4640, widthMm:1800, weightKg:1255, trunkL:502,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:false, multiZoneHvac:false, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:false, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:false, rcca:false, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.14   // [추정] 안전도 5, 준중형 감가 보통
  },

  // ── 중형 세단 ────────────────────────────────────────────
  {
    id:'hyundai-sonata-inspiration',
    brand:'현대', model:'쏘나타', trim:'인스퍼레이션',
    segment:'중형', bodyType:'세단', fuel:'가솔린', drivetrain:'FWD',
    price:3400, displacementCc:1598, efficiency:13.8,
    realEfficiency:11.6,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4910, widthMm:1860, weightKg:1450, trunkL:510,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.14   // [추정] 안전도 5, 중형 세단 표준 감가
  },
  {
    id:'kia-k5-signature',
    brand:'기아', model:'K5', trim:'시그니처',
    segment:'중형', bodyType:'세단', fuel:'가솔린', drivetrain:'FWD',
    price:3300, displacementCc:1598, efficiency:13.6,
    realEfficiency:11.8,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4905, widthMm:1860, weightKg:1465, trunkL:540,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:false, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.14   // [추정] 안전도 5, 중형 세단 표준 감가
  },
  {
    id:'kia-k5-lpg',
    brand:'기아', model:'K5', trim:'2.0 LPi 프레스티지',
    segment:'중형', bodyType:'세단', fuel:'LPG', drivetrain:'FWD',
    price:3000, displacementCc:1999, efficiency:9.6,
    realEfficiency:7.9,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4905, widthMm:1860, weightKg:1510, trunkL:480,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:false, multiZoneHvac:true, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:false, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:true, rcca:false, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:false, rearSunshade:false, outlet220v:false, sunroof:false },
    kncapGrade:5, depreciationRate:0.16   // [추정] LPG 트림 수요 좁아 감가 다소 큼
  },

  // ── 준대형 세단 ──────────────────────────────────────────
  {
    id:'hyundai-grandeur-cal',
    brand:'현대', model:'그랜저', trim:'캘리그래피',
    segment:'준대형', bodyType:'세단', fuel:'가솔린', drivetrain:'FWD',
    price:4380, displacementCc:2497, efficiency:10.4,
    realEfficiency:9.4,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:5035, widthMm:1880, weightKg:1660, trunkL:510,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.13   // [추정] 인기 준대형, 잔존가치 견조
  },
  {
    id:'hyundai-grandeur-hev',
    brand:'현대', model:'그랜저 하이브리드', trim:'캘리그래피',
    segment:'준대형', bodyType:'세단', fuel:'하이브리드', drivetrain:'FWD',
    price:4720, displacementCc:1598, efficiency:18.0,
    realEfficiency:16.7,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:5035, widthMm:1880, weightKg:1690, trunkL:510,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.12   // [추정] HEV 인기 트림, 감가 가장 양호한 축
  },
  {
    id:'kia-k8-signature',
    brand:'기아', model:'K8', trim:'시그니처',
    segment:'준대형', bodyType:'세단', fuel:'가솔린', drivetrain:'FWD',
    price:4200, displacementCc:2497, efficiency:10.6,
    realEfficiency:9.5,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:5015, widthMm:1875, weightKg:1640, trunkL:512,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.13   // [추정] 준대형, 잔존가치 견조
  },

  // ── 대형/제네시스 세단 ───────────────────────────────────
  {
    id:'genesis-g80-25t',
    brand:'제네시스', model:'G80', trim:'2.5T 럭셔리',
    segment:'대형', bodyType:'세단', fuel:'가솔린', drivetrain:'RWD',
    price:6200, displacementCc:2497, efficiency:10.0,
    realEfficiency:9.4,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4995, widthMm:1925, weightKg:1845, trunkL:424,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:true, autoHold:true,
              powerTailgate:true, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.11   // [추정] 제네시스 브랜드 잔존가치 강세
  },

  // ── 소형 SUV ─────────────────────────────────────────────
  {
    id:'kia-seltos-signature',
    brand:'기아', model:'셀토스', trim:'시그니처',
    segment:'소형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'FWD',
    price:2800, displacementCc:1598, efficiency:12.8,
    realEfficiency:10.6,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4390, widthMm:1800, weightKg:1370, trunkL:498,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:false, multiZoneHvac:false, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.12   // [추정] 인기 소형SUV, 잔존가치 양호
  },
  {
    id:'hyundai-kona-inspiration',
    brand:'현대', model:'코나', trim:'인스퍼레이션',
    segment:'소형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'FWD',
    price:2900, displacementCc:1598, efficiency:12.6,
    realEfficiency:12,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4350, widthMm:1825, weightKg:1395, trunkL:466,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:false,
              svm:true, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.13   // [추정] 소형SUV, 감가 보통
  },

  // ── 중형 SUV ─────────────────────────────────────────────
  {
    id:'hyundai-tucson-inspiration',
    brand:'현대', model:'투싼', trim:'인스퍼레이션',
    segment:'중형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'AWD',
    price:3600, displacementCc:1598, efficiency:11.8,
    realEfficiency:10.4,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4640, widthMm:1865, weightKg:1560, trunkL:620,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.11   // [추정] 인기 중형SUV, 잔존가치 강세
  },
  {
    id:'kia-sportage-signature',
    brand:'기아', model:'스포티지', trim:'시그니처',
    segment:'중형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'FWD',
    price:3500, displacementCc:1598, efficiency:11.9,
    realEfficiency:9.5,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4660, widthMm:1865, weightKg:1545, trunkL:587,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:false,
              svm:true, parkingSensor:true, rearCam:true, rspa:false, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:false, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.12   // [추정] 인기 중형SUV, 잔존가치 양호
  },
  {
    id:'hyundai-santafe-cal',
    brand:'현대', model:'싼타페', trim:'캘리그래피',
    segment:'중형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'AWD',
    price:4200, displacementCc:2497, efficiency:10.0,
    realEfficiency:9,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:7, lengthMm:4830, widthMm:1900, weightKg:1810, trunkL:725,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.12   // [추정] 패밀리 중형SUV, 감가 양호
  },
  {
    id:'kia-sorento-signature',
    brand:'기아', model:'쏘렌토', trim:'시그니처',
    segment:'중형SUV', bodyType:'SUV', fuel:'디젤', drivetrain:'AWD',
    price:4100, displacementCc:2151, efficiency:13.5,
    realEfficiency:11.2,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:7, lengthMm:4815, widthMm:1900, weightKg:1860, trunkL:660,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.13   // [추정] 디젤 중형SUV, 감가 보통
  },
  {
    id:'kia-sorento-hev',
    brand:'기아', model:'쏘렌토 하이브리드', trim:'시그니처',
    segment:'중형SUV', bodyType:'SUV', fuel:'하이브리드', drivetrain:'AWD',
    price:4400, displacementCc:1598, efficiency:15.3,
    realEfficiency:12.9,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:7, lengthMm:4815, widthMm:1900, weightKg:1885, trunkL:660,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.11   // [추정] HEV 인기 중형SUV, 잔존가치 강세
  },

  // ── 대형 SUV ─────────────────────────────────────────────
  {
    id:'hyundai-palisade-cal',
    brand:'현대', model:'팰리세이드', trim:'캘리그래피',
    segment:'대형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'AWD',
    price:5300, displacementCc:3470, efficiency:8.6,
    realEfficiency:7,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:7, lengthMm:4995, widthMm:1975, weightKg:2070, trunkL:509,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.11   // [추정] 대형SUV 베스트셀러, 잔존가치 강세
  },
  {
    id:'genesis-gv80-25t',
    brand:'제네시스', model:'GV80', trim:'2.5T AWD',
    segment:'대형SUV', bodyType:'SUV', fuel:'가솔린', drivetrain:'AWD',
    price:6900, displacementCc:2497, efficiency:8.9,
    realEfficiency:7.8,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4945, widthMm:1975, weightKg:2120, trunkL:735,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:true, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.12   // [추정] 제네시스 대형SUV, 잔존가치 양호
  },

  // ── 하이브리드(별도 소형) ────────────────────────────────
  {
    id:'kia-niro-hev-signature',
    brand:'기아', model:'니로 하이브리드', trim:'시그니처',
    segment:'소형SUV', bodyType:'SUV', fuel:'하이브리드', drivetrain:'FWD',
    price:3300, displacementCc:1580, efficiency:20.8,
    realEfficiency:16.8,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4420, widthMm:1825, weightKg:1475, trunkL:451,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:false,
              svm:true, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:false, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.13   // [추정] HEV 소형SUV, 연비 강점 감가 보통
  },

  // ── MPV ──────────────────────────────────────────────────
  {
    id:'kia-carnival-signature',
    brand:'기아', model:'카니발', trim:'시그니처',
    segment:'대형SUV', bodyType:'MPV', fuel:'디젤', drivetrain:'FWD',
    price:4300, displacementCc:2151, efficiency:12.5,
    realEfficiency:10.9,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:9, lengthMm:5155, widthMm:1995, weightKg:2120, trunkL:627,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:false, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:false,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.11   // [추정] 카니발 수요 견조, 잔존가치 강세
  },

  // ── EV ───────────────────────────────────────────────────
  {
    id:'hyundai-ioniq5-long',
    brand:'현대', model:'아이오닉 5', trim:'롱레인지 프레스티지',
    segment:'중형SUV', bodyType:'SUV', fuel:'EV', drivetrain:'RWD',
    price:5200, displacementCc:0, efficiency:5.0,
    realEfficiency:4.1,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4655, widthMm:1890, weightKg:1980, trunkL:527,
    aerKm:458, batteryKwh:84,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:false, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:false, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.17   // [추정] EV 초기 감가 큼, 안전도 5
  },
  {
    id:'kia-ev6-long',
    brand:'기아', model:'EV6', trim:'롱레인지 GT-line',
    segment:'중형SUV', bodyType:'SUV', fuel:'EV', drivetrain:'RWD',
    price:5500, displacementCc:0, efficiency:4.8,
    realEfficiency:4.5,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4695, widthMm:1890, weightKg:2010, trunkL:490,
    aerKm:475, batteryKwh:84,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:false, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:false, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.17   // [추정] EV 초기 감가 큼, 안전도 5
  },
  {
    id:'kia-ev9-earth',
    brand:'기아', model:'EV9', trim:'어스(Earth)',
    segment:'대형SUV', bodyType:'SUV', fuel:'EV', drivetrain:'AWD',
    price:7800, displacementCc:0, efficiency:4.2,
    realEfficiency:3.8,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:7, lengthMm:5010, widthMm:1980, weightKg:2545, trunkL:333,
    aerKm:501, batteryKwh:99,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:true,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:false, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:true, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:true, outlet220v:true, sunroof:true },
    kncapGrade:5, depreciationRate:0.18   // [추정] 고가 대형 EV, 초기 감가 가장 큼
  },
  {
    id:'hyundai-casper-ev-inspiration',
    brand:'현대', model:'캐스퍼 일렉트릭', trim:'인스퍼레이션',
    segment:'경형', bodyType:'SUV', fuel:'EV', drivetrain:'FWD',
    price:2990, displacementCc:0, efficiency:5.6,
    realEfficiency:4.5,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:4, lengthMm:3825, widthMm:1610, weightKg:1340, trunkL:280,
    aerKm:315, batteryKwh:49,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:false, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:false, memorySeat:false,
              svm:false, parkingSensor:true, rearCam:true, rspa:false, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:false, ota:true,
              scc:true, lfa:true, hda:false, fca:true, bca:true, rcca:true, ecs:false, autoHold:true,
              powerTailgate:false, flatFold:true, rearSunshade:false, outlet220v:true, sunroof:false },
    kncapGrade:4, depreciationRate:0.18   // [추정] 경형 EV, 초기 감가 큼·안전도 보통
  },
  {
    id:'tesla-model3-rwd',
    brand:'테슬라', model:'모델 3', trim:'RWD',
    segment:'중형', bodyType:'세단', fuel:'EV', drivetrain:'RWD',
    price:4699, displacementCc:0, efficiency:6.1,
    realEfficiency:5.5,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4720, widthMm:1850, weightKg:1760, trunkL:594,
    aerKm:403, batteryKwh:60,
    options:{ frontHeatedSeat:true, frontVentSeat:false, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:false, rearCam:true, rspa:true, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:false, wirelessCharger:true, hud:false, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:false, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.16   // [추정] EV 감가 크나 테슬라 수요로 다소 방어
  },
  {
    id:'tesla-modely-rwd',
    brand:'테슬라', model:'모델 Y', trim:'RWD',
    segment:'중형SUV', bodyType:'SUV', fuel:'EV', drivetrain:'RWD',
    price:5299, displacementCc:0, efficiency:5.5,
    realEfficiency:4.4,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4750, widthMm:1920, weightKg:1920, trunkL:854,
    aerKm:466, batteryKwh:60,
    options:{ frontHeatedSeat:true, frontVentSeat:false, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:false, rearCam:true, rspa:true, bvm:false, ledHeadlamp:true,
              oemNavi:true, phoneProjection:false, wirelessCharger:true, hud:false, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:false, ecs:false, autoHold:true,
              powerTailgate:true, flatFold:true, rearSunshade:false, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.16   // [추정] EV 감가 크나 모델Y 수요로 다소 방어
  },

  // ── 수입 (일부) ──────────────────────────────────────────
  {
    id:'mercedes-e250-avantgarde',
    brand:'벤츠', model:'E-Class', trim:'E 250 아방가르드',
    segment:'대형', bodyType:'세단', fuel:'가솔린', drivetrain:'RWD',
    price:7600, displacementCc:1999, efficiency:11.0,
    realEfficiency:10.2,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:4949, widthMm:1880, weightKg:1840, trunkL:540,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:true, autoHold:true,
              powerTailgate:true, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.17   // [추정] 수입 세단, 초기 감가 큼
  },
  {
    id:'bmw-520i-luxury',
    brand:'BMW', model:'5 Series', trim:'520i 럭셔리',
    segment:'대형', bodyType:'세단', fuel:'가솔린', drivetrain:'RWD',
    price:7400, displacementCc:1998, efficiency:11.4,
    realEfficiency:9.5,   // [추정] 실연비 ≈ 공인연비의 0.80~0.95배 근사
    seats:5, lengthMm:5060, widthMm:1900, weightKg:1750, trunkL:520,
    aerKm:null, batteryKwh:null,
    options:{ frontHeatedSeat:true, frontVentSeat:true, rearHeatedSeat:true, rearVentSeat:false,
              heatedWheel:true, remoteClimate:true, multiZoneHvac:true, memorySeat:true,
              svm:true, parkingSensor:true, rearCam:true, rspa:true, bvm:true, ledHeadlamp:true,
              oemNavi:true, phoneProjection:true, wirelessCharger:true, hud:true, ota:true,
              scc:true, lfa:true, hda:true, fca:true, bca:true, rcca:true, ecs:true, autoHold:true,
              powerTailgate:true, flatFold:false, rearSunshade:true, outlet220v:false, sunroof:true },
    kncapGrade:5, depreciationRate:0.18   // [추정] 수입 세단, 초기 감가 가장 큼
  }
];

// ── EV 지자체 보조금·세제 상수 (v2 확장, 모두 [추정 2025]) ──────────
window.REGIONS = [   // EV 지자체 보조금 만원 [추정 2025]
  {code:'seoul',name:'서울',evLocalManwon:150}, {code:'gyeonggi',name:'경기',evLocalManwon:150},
  {code:'incheon',name:'인천',evLocalManwon:200}, {code:'busan',name:'부산',evLocalManwon:200},
  {code:'daegu',name:'대구',evLocalManwon:200}, {code:'gwangju',name:'광주',evLocalManwon:300},
  {code:'daejeon',name:'대전',evLocalManwon:200}, {code:'ulsan',name:'울산',evLocalManwon:250},
  {code:'sejong',name:'세종',evLocalManwon:200}, {code:'gangwon',name:'강원',evLocalManwon:230},
  {code:'chungbuk',name:'충북',evLocalManwon:230}, {code:'chungnam',name:'충남',evLocalManwon:240},
  {code:'jeonbuk',name:'전북',evLocalManwon:280}, {code:'jeonnam',name:'전남',evLocalManwon:320},
  {code:'gyeongbuk',name:'경북',evLocalManwon:350}, {code:'gyeongnam',name:'경남',evLocalManwon:300},
  {code:'jeju',name:'제주',evLocalManwon:200}
];

window.SUBSIDY = {   // 모두 [추정]
  ev: { nationalMaxManwon:650, fullPriceCapManwon:5500, halfPriceCapManwon:8500 },
  // 국고: 차량가<full→국고 전액, full~half→국고×0.5, >half→0
  taxBenefit: {  // 친환경차 세제 감면 한도 만원 [추정]
    EV:  { gaesoseManwon:300, chwideukManwon:140 },
    하이브리드: { gaesoseManwon:0, chwideukManwon:40 }
  }
};

// ── v3 확장 (계약 _CONTRACT_V3.md §A2, 추가 전용 · 기존 전역 불변) ───────
// 모두 mock/추정. 순수 데이터/상수. 위 기존 전역(OPTION_META·CARS 등)은 변경·삭제하지 않음.

window.SUBSIDY_STOCK = {   // D14 지자체 EV 보조금 잔여 물량 비율 0~1 [mock 2025]
  seoul:0.10, gyeonggi:0.32, incheon:0.22, busan:0.28, daegu:0.35, gwangju:0.45,
  daejeon:0.30, ulsan:0.40, sejong:0.50, gangwon:0.55, chungbuk:0.48, chungnam:0.42,
  jeonbuk:0.52, jeonnam:0.60, gyeongbuk:0.58, gyeongnam:0.44, jeju:0.25
};

window.OPTION_REVIEW = {   // D26 옵션 체감 후기 1줄 [mock] — 키는 OPTION_META.key 와 일치
  svm:            '"좁은 골목·주차장에서 진짜 효자예요. 휠 긁힘 걱정이 사라졌어요" — 30대 초보운전자',
  scc:            '"막히는 출퇴근길 발 떼고 있으니 피로가 확 줄었어요" — 왕복 60km 직장인',
  frontVentSeat:  '"여름에 등에 땀이 안 차서 셔츠가 안 젖어요. 한번 쓰면 못 빼요" — 영업직 운전자',
  rearVentSeat:   '"뒷자리 아이가 덥다고 안 보채요. 장거리 가족여행 필수였어요" — 두 아이 아빠',
  hud:            '"앞유리에 속도·길안내가 떠서 시선이 안 내려가요. 안전운전에 도움돼요" — 40대 운전자',
  powerTailgate:  '"양손에 짐 들고도 발만 갖다 대면 트렁크가 열려요. 장보고 올 때 최고" — 워킹맘',
  flatFold:       '"2열 접으니 진짜 평평해서 차박 매트 깔기 좋아요" — 차박 입문 캠퍼',
  heatedWheel:    '"겨울 아침 장갑 없이도 핸들이 금방 따뜻해져요. 손 시린 사람 필수" — 수족냉증 운전자',
  lfa:            '"고속도로에서 핸들을 살짝 잡아줘 차선 이탈 걱정이 줄었어요" — 장거리 통근자',
  rspa:           '"옆차랑 붙어 문도 못 열 좁은 칸에 차 밖에서 알아서 넣어줘요" — 도심 거주 운전자',
  oemNavi:        '"폰 거치 없이 큰 화면으로 길안내 받고 단속도 알려줘서 편해요" — 50대 운전자',
  wirelessCharger:'"폰 올려두면 충전돼서 케이블 꽂을 일이 없어졌어요" — 출퇴근 직장인',
  ledHeadlamp:    '"시골 밤길이 대낮처럼 환해져서 야간운전 무서움이 줄었어요" — 지방 거주 운전자',
  remoteClimate:  '"타기 전 미리 시원하게 해두니 한여름 찜통차가 사라졌어요" — 여름철 운전자',
  hda:            '"고속도로 정체에서 반자율로 따라가니 장거리가 훨씬 덜 피곤해요" — 주말 장거리족',
  rearSunshade:   '"뒷자리 아이 눈부심 없이 재울 수 있어 햇빛 강한 날 든든해요" — 영유아 부모',
  outlet220v:     '"차에서 전기포트·노트북 바로 쓰니 캠핑 장비가 줄었어요" — 오토캠핑족',
  memorySeat:     '"부부가 번갈아 타도 버튼 하나로 내 자세로 돌아와요" — 공동명의 부부'
};

window.OPTION_PACKAGE = {  // D19 옵션→묶이는 패키지명 [mock] — 키는 OPTION_META.key 와 일치
  rearVentSeat:'컴포트 II 패키지', svm:'파킹 어시스트 패키지', hud:'테크 패키지',
  rspa:'파킹 어시스트 패키지', memorySeat:'컴포트 II 패키지', ecs:'다이내믹 패키지',
  bvm:'파킹 어시스트 패키지', hda:'드라이빙 어시스트 패키지', scc:'드라이빙 어시스트 패키지',
  ledHeadlamp:'테크 패키지', powerTailgate:'컨비니언스 패키지', rearSunshade:'컴포트 II 패키지'
};

window.PERSONA_POPULAR = { // D27 페르소나별 인기 차 id [mock 집계] — id 는 실제 CARS[].id, 각 페르소나 옵션 충족
  초보운전:    ['hyundai-sonata-inspiration','hyundai-tucson-inspiration','kia-sportage-signature','kia-k8-signature'],
  장거리출퇴근: ['hyundai-avante-inspiration','kia-k5-signature','hyundai-grandeur-hev','kia-niro-hev-signature','hyundai-sonata-inspiration'],
  캠핑차박:    ['hyundai-santafe-cal','kia-sorento-hev','kia-carnival-signature','hyundai-ioniq5-long','kia-ev6-long'],
  수족냉증:    ['hyundai-avante-inspiration','hyundai-grandeur-hev','hyundai-kona-inspiration','kia-niro-hev-signature'],
  패밀리카:    ['hyundai-santafe-cal','kia-sorento-hev','kia-carnival-signature','hyundai-palisade-cal','hyundai-grandeur-hev']
};

window.FINANCE = {         // D9·D10 금융 가정 [추정]
  loanAprPct:6.5, loanMonths:60, rentResidualPct:0.40, rentAprPct:8.0
};

window.SOURCE_META = {     // D23 데이터 출처·신선도 [mock]
  price:      { src:'제조사 가격표(mock)',        date:'2025-03' },
  subsidy:    { src:'무공해차 통합누리집(mock)',   date:'2025-01' },
  fuel:       { src:'오피넷(mock)',              date:'2025-06' },
  efficiency: { src:'에너지공단(mock)',           date:'2025-01' }
};

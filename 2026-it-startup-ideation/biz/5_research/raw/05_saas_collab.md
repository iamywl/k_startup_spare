# 한국 SaaS / 협업 / 생산성 Landscape (2016~2026) — Raw

> 카테고리별 리서치 Agent 원본 산출물. **WebSearch 14회 호출 — 1차 출처 URL 검증됨.**

## 1. 대표 기업/스타트업

| 회사 | 창업 | 서비스 | 누적 투자 / 매출 | 현 상태 |
|---|---|---|---|---|
| 토스랩 (잔디) | 2014 | 팀 메신저·협업툴 | 시리즈B 140억(2020)[^1] | 유료 5,000사, 2024.1 사상 첫 월간 흑자[^2] |
| 마드라스체크 (플로우) | 2015 | 프로젝트관리·메신저 통합 | 누적 100억대[^3] | 2025년 수주 210억, IPO 추진[^4] |
| 콜라비팀 (콜라비) | 2015 | 이슈 기반 문서 협업 | 시리즈A[^5] | 2023.9 서비스 종료[^5] |
| NHN 두레이 | 2021 분사 | 올인원 그룹웨어·ERP | NHN 자회사 | 2024 매출 161.6억, 공공 100여 곳·국방부 30만 사용자[^6] |
| 네이버웍스 | 2014 | 협업·메신저 | 모회사 내부 | 글로벌 450만 사용자, 국내 MAU 1위[^7] |
| 카카오워크 | 2019 | 메신저형 협업툴 | 카카오 자체 | 2023 MAU 11.3만, 정체[^8] |
| 모두싸인 | 2015 | 전자계약 | 시리즈C 177억(2024.4), 누적 약 350억[^9] | 매출 59.2억(2023)→93.1억(2025)[추정][^10], CLM·Legal AI |
| 스윗테크놀로지스 | 2017 | 글로벌 협업툴 | 누적 약 450억[^11] | 2024 한국 인력 63% 감원, 경영난[^11] |
| 원티드랩 | 2015 | HR·채용 SaaS, LaaS | KOSDAQ 상장 | 2024 매출 367억, 영업손실 8억[^12] |

## 2. 시장 규모

| 연도 | 한국 SaaS | 한국 퍼블릭 클라우드(SW) | 출처 |
|---|---|---|---|
| 2016 | [추정] 0.4–0.6조 | – | – |
| 2020 | [추정] 1.1조 | – | – |
| 2022 | 1.74조 | 3.02조 | IDC Korea[^14][^15] |
| 2023 | 약 1.8조 | – | SPRi/메트로서울[^13] |
| 2024 | – | 홀클라우드 14.6조 | IDC Korea[^16] |
| 2025 | 2.55조 (전망) | – | IDC Korea[^15] |
| 2026 | – | 퍼블릭 클라우드 SW 3.06조 (전망) | IDC Korea[^16] |

- 글로벌 SaaS 약 360조 vs 한국 약 2조, **국내 SW 시장 내 SaaS 비중 21.8%, 그중 글로벌 SaaS 약 70% 점유**[^13].
- 한국 DevOps: 2024년 2.5억 USD, CAGR 21.4% → 2033년 17.4억 USD[^17].

## 3. 솔루션 성숙도

| 카테고리 | 단계 | 근거 |
|---|---|---|
| 메신저·협업툴 (잔디·웍스·카카오워크·플로우) | 성숙기 진입 | 5,000+ 유료사·MAU 18만+·흑자 사례[^2][^4][^7] |
| 그룹웨어·ERP 통합 (두레이·웍스) | 확장기 | 공공·대기업 대량 도입, 두자릿수 성장[^6] |
| 전자계약·법무 (모두싸인·도큐사인 KR) | 확장기 | 시리즈C 도달, CLM·Legal AI[^9] |
| HR SaaS (원티드 LaaS·플렉스·시프티) | 상용 초기→확장기 | 상장사 등장하나 흑자 미달[^12] |
| 노코드·로코드 | PoC→상용 초기 | 글로벌 161.7억 USD CAGR 30.9%, 국내 토종 부족[^18] |
| DevTools (CI/CD·관측성) | 상용 초기 | 와탭 등 제한적, 시장 2.5억 USD[^17] |

## 4. 사업 모델
시트당 월 구독(5,000–15,000원) / Freemium→Paid / 엔터프라이즈·공공 SI 결합 / Usage 기반(API·문서·계약 수) / Vertical SaaS.

## 5. White Space

| # | White Space | 근거·기회 |
|---|---|---|
| 1 | 한국 SMB 통합 백오피스 SaaS (전자세금계산서+급여+계약+근태 올인원, 시트당 1만원 이하) | 글로벌 SaaS 70% 점유, SMB 가격 저항 큼[^13]. SMB 360만개 중 SaaS 침투 [추정] 10% 미만 |
| 2 | Vertical 협업툴 (제조 현장·F&B·물류 작업자용 모바일 퍼스트) | 사무직 외 75% 워커 미커버[추정] |
| 3 | 한국어 LLM 결합 노코드/AI Agent Builder | 글로벌 노코드 CAGR 30.9%, 국내 토종 부재[^18]. 정부 SaaS 육성 2조→2.5조 모멘텀[^15] |
| 4 | 공공·금융 컴플라이언스 특화 SaaS (CSAP·ISMS-P 자동) | NHN두레이 공공 100곳[^6], CSAP 인증 비용·기간 장벽 → 사전 인증 PaaS |
| 5 | DevTools / Observability / FinOps 한국화 | 한국 DevOps CAGR 21.4%[^17], Datadog·Snyk 등 토종 부재. FinOps 사실상 공백 |

## 출처
[^1]: 머니투데이 「잔디 140억 시리즈B」 https://news.mt.co.kr/mtview.php?no=2020090209414284816
[^2]: 플래텀 「잔디 1월 흑자, 5,000사」 https://platum.kr/archives/222282
[^3]: TheVC 마드라스체크 https://thevc.kr/madrascheck
[^4]: 헤럴드경제 「플로우 210억 IPO」 https://biz.heraldcorp.com/article/10665311
[^5]: TheVC 콜라비팀 https://thevc.kr/collabee
[^6]: TheVC NHN두레이 https://thevc.kr/nhndooray ; 청년일보 https://www.youthdaily.co.kr/news/article.html?no=194040
[^7]: 네이버웍스 보도자료 https://naver.worksmobile.com/pr/230313/
[^8]: 한국경제 「네이버웍스 1위」 https://www.hankyung.com/article/202304105737Y
[^9]: 머니투데이 「모두싸인 177억 시리즈C」 https://news.mt.co.kr/mtview.php?no=2024050315021170977
[^10]: TheVC 모두싸인 https://thevc.kr/modusign
[^11]: 딜사이트 「스윗 경영난」 https://dealsite.co.kr/articles/131221
[^12]: ZDNet 「원티드랩 2024 매출 367억」 https://zdnet.co.kr/view/?no=20250321173845
[^13]: 메트로서울 「글로벌 SaaS 360조, 한국 2조」 https://www.metroseoul.co.kr/article/20240626500126
[^14]: IDC Korea 2022 퍼블릭 클라우드 https://www.idc.com/getdoc.jsp?containerId=prAP49890622
[^15]: ZDNet 「한국 SaaS 2025년 2.55조」 https://zdnet.co.kr/view/?no=20230222144336
[^16]: IDC Korea 2024 홀클라우드 https://my.idc.com/getdoc.jsp?containerId=prAP52555024
[^17]: IMARC South Korea DevOps https://www.imarcgroup.com/south-korea-devops-market
[^18]: GII Korea 글로벌 로우코드 https://m.giikorea.co.kr/report/moi1440124-low-code-development-platform-market-share.html

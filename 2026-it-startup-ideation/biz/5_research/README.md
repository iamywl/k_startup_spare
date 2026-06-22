last_updated: 2026-06-22 00:00

# 5_research — IT 창업 아이디에이션 시장 리서치 원본 모음

이 ideation의 카테고리별 시장 리서치 원본 모음 — 6개 IT 카테고리를 조사해 후보 3개를 발굴하고, 실현 프로젝트(`2026-saas-*`)로 이관했다.

## 원본 자료 목록 (`raw/`)

| 파일 | 카테고리 | 출처 수(대략) | 핵심 내용 | 비고 |
| :--- | :--- | ---: | :--- | :--- |
| [`raw/01_ai_llm.md`](./raw/01_ai_llm.md) | AI/LLM (생성형 AI SaaS) | 16 | 업스테이지·뤼튼 등 대표사, 한국 AI 시장 3.4조(2025), 규제산업 RAG·현장직 음성 AI white space | **제외** — 사용자 방향성(개발계획서) |
| [`raw/02_fintech.md`](./raw/02_fintech.md) | FinTech | 5 (재검증 필요) | 토스·카카오페이 등, 간편결제·인터넷은행 성숙기, 시니어 금융·SMB Embedded Finance white space | **제외** — 사용자 방향성 + 출처 미검증(메모리 기반) |
| [`raw/03_edtech.md`](./raw/03_edtech.md) | EdTech | 15 | 뤼이드·콴다·클래스101 등, 사교육비 29.2조(2024), AI디지털교과서 보완재·시니어 평생교육 white space | 후보 풀(미실현) |
| [`raw/04_healthtech.md`](./raw/04_healthtech.md) | HealthTech / 디지털 헬스케어 | 19 (재검증 필요) | 닥터나우·루닛·DTx 등, 광의 시장 4.3조(2023), 재가 만성질환·DTx 청구 자동화 white space | 후보 풀(미실현) · 출처 미검증(메모리 기반) |
| [`raw/05_saas_collab.md`](./raw/05_saas_collab.md) | SaaS / 협업 / 생산성 | 18 | 잔디·플로우·두레이 등, 한국 SaaS 2.55조(2025E), SMB 통합 백오피스·현장직 버티컬 협업툴 white space | **실현 →** `2026-saas-fieldworker-collab`(현장직 버티컬 협업) + `2026-saas-smb-backoffice`(SMB 통합 백오피스) |
| [`raw/06_ecommerce.md`](./raw/06_ecommerce.md) | eCommerce / D2C / 커머스 인프라 | 12 | 쿠팡·무신사·카페24·아임웹 등, 거래액 271조(2025), D2C 통합 CDP·ROAS 어트리뷰션 white space | **실현 →** `2026-saas-d2c-cdp`(D2C 브랜드 통합 CDP·어트리뷰션) |

## 카테고리 선정 결과

- **제외 (사용자 방향성)**: AI/LLM, FinTech — 개발계획서의 사용자 방향성에 따라 후보에서 제외. FinTech는 출처가 메모리 기반(미검증)이라는 한계도 있음.
- **후보 풀(미실현)**: EdTech, HealthTech — white space는 도출했으나 이번 사이클 실현 대상에서 제외.
- **실현된 3개 프로젝트**:
  - SaaS협업(`05_saas_collab.md`) → `2026-saas-fieldworker-collab`(현장직 버티컬 협업) · `2026-saas-smb-backoffice`(SMB 통합 백오피스)
  - D2C/CDP(`06_ecommerce.md` white space #5) → `2026-saas-d2c-cdp`(D2C 통합 CDP·ROAS 어트리뷰션)

> 출처 수는 각 문서 하단 `## 출처` 각주의 대략적 개수다. `재검증 필요` 표기 문서(02·04)는 WebSearch 호출 없이 메모리 기반으로 작성되어 1차 출처(DART·통계청·KHIDI 등) 재확인이 필요하다.

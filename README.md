# Cardfolio

반다이 남코의 **아이돌마스터 카드폴리오** 제품을 수집·관리하기 위한 개인용 웹 애플리케이션입니다. 부스터팩별 카드 목록을 바인더처럼 살펴보고, 보유 수량과 수집 진척도, 위시 리스트를 관리하는 것을 목표로 합니다.

본 프로젝트는 일부 계획 문서 및 작업 로그 문서를 제외하면 전부 AI를 사용하여 구현하는 것을 목표로 하는 연습 프로젝트입니다. 

## 주요 기능

- **부스터팩 선택 및 분류**: 20개 부스터팩을 7대 시리즈 카테고리 순서대로 그룹화하여 제공
- **카드 그리드 및 이미지 조회**: 카드 프레임 내 순수 이미지만 깔끔하게 노출하는 반응형 그리드
- **카드 확대 뷰어 (라이트박스)**: 카드를 클릭하여 고화질 원본 비율 이미지를 크게 확대 조회
- 전체 카드와 보유 카드만 보는 토글
- 보유 수량의 직접 입력 및 `+` / `-` 조절
- **보유 수량 일괄 추가**: 여러 카드·현재 페이지 전체를 선택해 각 1장씩 추가하고, 최근 일괄 추가 1회를 되돌리기
- **위시 리스트 일괄 추가**: 선택한 카드를 목표 1장으로 추가·되돌리기, 기존 목표 수량 유지 및 전체 삭제 확인 모달 제공
- 미보유 카드의 흑백·반투명 표시
- 팩별 수집 진척도 표시
- 원하는 카드를 추가하고 목표 수량을 설정하는 위시 리스트
- 위시 리스트를 카드 이미지와 수량이 담긴 PNG로 내보내기
- **위시 리스트 정렬**: 부스터 팩 순서, 카드 등급 높은 순/낮은 순, 아이돌 이름순(한국어 가나다 / 일본 가나순) 정렬 지원
- **아이돌 검색**: 전체·시리즈·팩별 이름·별칭과 샤니마스(REFRAC7IONS 포함)·SideM 유닛 검색, 쉼표로 여러 이름 검색 지원
- **검색 편의 기능**: 자동완성 목록, 단체 카드 포함·제외 옵션, 로고 클릭 시 전체 카드 화면으로 복귀

## 기술 구성

| 구분 | 기술 | 용도 |
| --- | --- | --- |
| 프런트엔드 | React + TypeScript + Vite | 타입 안전한 SPA 개발 및 빌드 |
| 스타일 | 모던 CSS | 반응형 카드 그리드, 라이트박스 모달, 다크 테마 |
| 상태 관리 | Zustand + persist | 보유 수량 및 위시 리스트의 브라우저 localStorage 영속 저장 |
| 라우팅 | React Router | 카드 목록·위시 리스트 화면 전환 |
| 이미지 내보내기 | html-to-image | 위시 리스트 PNG 생성·다운로드 |


## 부스터팩 카테고리 순서

1. **아이돌마스터** (`アイドルマスターver`)
2. **아이돌마스터 신데렐라 걸즈** (`シンデレラガールズver. vol.1` ~ `vol.6`)
3. **아이돌마스터 밀리언라이브** (`ミリオンライブ！ver`, `vol.2`, `vol.3`, `vol.4`)
4. **아이돌마스터 SIDE M** (`SideM ver. vol.1`, `vol.2`)
5. **아이돌마스터 샤이니 컬러즈** (`シャイニーカラーズver. vol.1`, `vol.2`, `vol.3`)
6. **학원 아이돌마스터** (`学園アイドルマスター ver. vol.1`)
7. **프리미엄 팩 시리즈** (`プレミアムパック MOIW DAY1`, `MOIW DAY2`, `IWSF`)

## 카드 데이터 및 이미지

- 카드 이미지는 `images/<부스터팩 이름>/*.webp`에 보관합니다.
- `npm run build:card-data`는 이미지 폴더를 읽어 `src/data/cards.json`을 생성/유지합니다.
- 현재 수록된 데이터는 **20개 팩, 2,373장** WebP 카드 이미지 및 가공 등급 포함 총 **2,814장**의 카드로 구성됩니다.
- `src/data/idol.json`에 아이돌·직원·교사 등 검색용 인물 **347명**의 이름과 별칭을 등록했습니다.
- **IWSF의 SR·SEC를 제외한 모든 카드의 아이돌 연결을 완료**했습니다.

## 시작하기

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

개발 서버 주소는 터미널에 표시됩니다. 기본적으로 `http://localhost:5173`입니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build:card-data` | 이미지 폴더로부터 카드 메타데이터 생성 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run build` | 카드 데이터 생성 후 프로덕션 빌드 |
| `npm run preview` | 프로덕션 빌드 결과 미리보기 |

## 디렉터리 구조

```text
Cardfolio/
├── images/                    # 부스터팩별 카드 WebP 이미지
│   └── <부스터팩>/
├── public/                    # 파비콘 등 공개 정적 자산
├── scripts/
│   ├── build-card-data.ts     # cards.json 생성 스크립트
│   └── card-idol-rules.ts    # 카드별 아이돌 연결 규칙
├── src/
│   ├── app/                   # App 진입점
│   ├── components/            # 공용 UI (CardGrid, CardTile, CardModal, PackSelector, QuantityControl)
│   │   ├── IdolSearch.tsx     # 아이돌 검색 및 추천 목록
│   │   └── ConfirmDialog.tsx  # 전체 삭제 확인 모달
│   ├── data/
│   │   ├── cards.json         # 생성된 카드 메타데이터 (2,814장)
│   │   ├── idol.json          # 인물 명부 및 검색 별칭
│   │   ├── idol-units.json    # 샤니마스·SideM 유닛 이름 및 별칭
│   │   ├── idol-search-groups.json      # 신호등 등 검색 그룹
│   │   ├── cinderella-pack-orders.json # 신데렐라 걸즈 팩별 순서
│   │   ├── moiw-pack-orders.json        # MOIW 팩별 순서
│   │   ├── iwsf-pack-order.json         # IWSF 카드 순서
│   │   └── shiny-refractions.json      # REFRAC7IONS 그룹 구성·검색 별칭
│   ├── features/
│   │   ├── collection/        # 수집 진척도·필터·일괄 수량 수정
│   │   └── wishlist/          # 위시 리스트·PNG 내보내기 도메인
│   ├── pages/                 # 카드 목록·위시 리스트 화면
│   ├── stores/                # 보유 수량·위시 리스트·테마 저장소
│   │   └── useCardBrowseStore.ts # 화면 이동 시 검색·필터·페이지 유지
│   ├── styles/                # UI 스타일시트 (app.css)
│   ├── types/                 # 카드 및 인물 타입 정의 (card.ts, idol.ts)
│   └── utils/
│       ├── packCategories.ts  # 팩 카테고리 분류
│       ├── cardBrowse.ts      # 검색 범위·필터·정렬·페이지 처리
│       └── idolSearch.ts      # 이름·별칭·그룹 검색 및 추천
├── package.json
├── implementation_log.md      # 구현 기록
└── README.md
```

## 라이선스 및 저작권

카드 이미지는 공식 사이트에 게시된 자료이며, 저작권은 권리자에게 있습니다. 본 프로젝트에서는 개인 컬렉션 관리 목적의 로컬 자산으로만 취급합니다.

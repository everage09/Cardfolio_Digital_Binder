# Cardfolio 작업 가이드

## 프로젝트 개요

Cardfolio는 아이돌마스터 카드폴리오를 개인적으로 수집·관리하기 위한 React 웹 앱이다. 부스터팩별 카드 목록, 보유 수량과 수집 진척도, 위시 리스트 및 PNG 내보내기를 제공하는 것이 목표다.

현재 로드맵 **1단계(기반 구축)**, **2단계(부스터팩 선택, 카드 그리드, 이미지 표시)**, **3단계(보유 수량 영속 저장, 수집 진척도, 보유 필터)**, **4단계(위시 리스트 및 목표 수량 관리)**, **5단계(위시 리스트 PNG 내보내기 및 반응형 점검)**가 완료되어 있다.

- React + TypeScript + Vite 프로젝트 구성
- React Router 기반 상단 내비게이션 바 및 화면 라우팅 (`/`, `/wishlist`)
- `images/` 아래 20개 팩, 2,373장 WebP 카드 이미지 보관 및 가공 등급 포함 총 2,814장 카드 데이터 관리
- 이미지 폴더에서 `src/data/cards.json`을 생성/유지하는 스크립트 구성
- Vite 개발 서버와 프로덕션 빌드에서 `/images/...` 경로로 카드 이미지 제공 (`cardfolio-images` 플러그인)
- 20개 팩을 7대 시리즈 순서로 그룹화 및 정렬하여 드롭다운(`<optgroup>`)으로 제공
- 카드 타일 내 파일명 없이 순수 이미지만 깔끔하게 표시하는 반응형 그리드
- 카드 클릭 시 고화질 원본 비율을 감상할 수 있는 라이트박스 확대 모달
- Zustand + `persist(localStorage)` 기반 보유 수량 영속 저장 (`useCollectionStore`)
- 미보유 카드는 회색조/반투명 처리, 보유 카드는 풀컬러 및 수량 뱃지(`×N`) 표시
- 카드 종류 기준 팩별 수집 진척도 프로그레스 바 및 통계 표시
- 전체 / 보유 / 미보유 카드 필터링 토글 탭 지원
- Zustand + `persist(localStorage)` 기반 위시 리스트 및 목표 수량 영속 저장 (`useWishlistStore`)
- 카드 타일 빠른 위시 버튼(♡/♥), 상세 모달 내 위시 추가/제거 토글
- 위시리스트 전용 페이지에서 목표 수량 관리 및 전체/개별 삭제 지원
- html-to-image 기반 위시 리스트 고해상도 PNG 이미지 내보내기 및 다운로드
- 모바일·태블릿·데스크톱 전 해상도 반응형 레이아웃 최적화

## 부스터팩 카테고리 표기 순서

1. **아이돌마스터**
2. **아이돌마스터 신데렐라 걸즈**
3. **아이돌마스터 밀리언라이브**
4. **아이돌마스터 SIDE M**
5. **아이돌마스터 샤이니 컬러즈**
6. **학원 아이돌마스터**
7. **프리미엄 팩 시리즈**

## 주요 명령어

프로젝트 루트(`Cardfolio/`)에서 실행한다.

```bash
npm install
npm run dev
npm run build:card-data
npm run typecheck
npm run build
npm run preview
```

카드 이미지가 변경되었다면 `npm run build:card-data`를 실행해 `src/data/cards.json`을 갱신한다. 기능 변경 후에는 최소 `npm run typecheck`를, 가능하면 `npm run build`까지 실행한다.

## 파일 및 자산 규칙

- `images/<부스터팩 이름>/*.webp`는 공식 카드 이미지 원본이다. 파일명·폴더명 변경, 삭제, 변환은 명시적으로 요청받은 경우에만 수행한다.
- `src/data/cards.json`은 생성/유지 파일이다. 직접 편집하지 말고 `scripts/build-card-data.ts`를 수정하거나 생성 명령을 실행한다.
- `vite.config.ts`의 `cardfolio-images` 플러그인은 개발 서버 제공과 `dist/images` 복사를 담당한다. 이미지 경로 정책을 바꿀 때 함께 수정한다.
- `dist/`, `node_modules/`는 생성물이며 소스 변경 대상으로 다루지 않는다.
- 각 로드맵 단계 및 주요 기능 구현 완료 시 진행/완료 내역을 `implementation_log.md`에 반드시 기록하고 최신 상태를 유지한다. (로드맵 5단계 완료 이후의 작업 내용은 '로드맵 이후 추가 구현 및 편의 기능' 등 별도 부제목으로 구분하여 기록한다.)
- `work_log/`는 사용자가 직접 관리하므로 임의로 수정하거나 git 커밋에 포함하지 않는다.

## Git 브랜치 및 작업 규칙

- **기능 개발 브랜치 생성**: 신규 기능(feature) 개발을 시작할 때는 최신 `main` 브랜치를 기반으로 해당 기능을 위한 전용 브랜치(예: `feat/...` 또는 기능명 브랜치)를 새로 생성하여 작업을 진행한다.
- **브랜치 정리**: 기능 개발 완료 후 원격(remote) 푸시 및 PR 병합이 완료되면, 해당 기능 개발 브랜치는 삭제한다.
- **신규 기능 착수**: 추후 또 다른 신규 기능을 개발할 때는 이전 브랜치를 재사용하지 않고, 최신 기준의 새 브랜치를 다시 생성하여 개발한다.

## 코드 구조와 확장 방향

```text
src/
  app/                 # 라우터·전역 Provider
  components/          # 재사용 UI: CardGrid, CardTile, CardModal, PackSelector, QuantityControl 등
  data/                # 생성 카드 데이터와 팩 메타데이터 (cards.json)
  features/
    collection/        # 보유 수량·수집 진척도 (3단계 예정)
    wishlist/          # 위시 리스트·PNG 내보내기 (4~5단계 예정)
  hooks/
  pages/               # CardListPage, WishlistPage
  stores/              # Zustand 영속 상태 (3단계 예정)
  styles/              # UI 스타일시트 (app.css)
  types/               # 도메인 타입 정의 (card.ts)
  utils/               # 카테고리 분류 등 헬퍼 (packCategories.ts)
scripts/
  build-card-data.ts
```

다음 기능 구현 시 React Router, Zustand의 `persist(localStorage)`, html-to-image를 추가한다. 로그인이나 서버는 첫 버전의 범위 밖이며, 개인 브라우저 저장소를 기본 저장 위치로 사용한다.

## UI·도메인 동작 원칙

- **카드 표시**: 카드 프레임에는 파일명 등 텍스트를 노출하지 않고 순수 카드 이미지만 렌더링한다. 클릭 시 고화질 확대 모달이 열린다.
- **보유 상태**: 보유 수량이 1 이상인 카드는 보유 상태다. 0인 카드는 회색조·낮은 불투명도로 표시한다.
- **진척도**: 카드 **종류** 기준이다: 수량이 1 이상인 카드 수 ÷ 해당 팩의 전체 카드 수.
- **수량 수정**: +/- 버튼과 직접 입력을 모두 지원하고 즉시 영속 저장한다.
- **위시 리스트 (4~5단계 예정)**: 카드 ID와 목표 수량을 저장한다. PNG 출력에는 카드 이미지와 목표 수량을 명확하게 표시한다.

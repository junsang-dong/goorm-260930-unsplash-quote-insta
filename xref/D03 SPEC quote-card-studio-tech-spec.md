# Quote Card Studio — 기술 명세서

> Unsplash 사진 + 명언 → 인스타그램 규격 PNG 카드 생성 웹앱
> 구름 바이브코딩 실무활용 과정 실습 프로젝트 · 작성: 넥스트플랫폼 · 2026-09-30 · v1.0

---

## 1. 개요

### 1.1 목적

분위기 키워드로 Unsplash 사진을 검색하고, 명언을 얹어 Canvas로 합성한 뒤 인스타그램 규격(1:1, 4:5, 9:16) PNG로 내보내는 웹앱을 만든다. 서버 없이 브라우저 로컬 스토리지만으로 동작하며, 로컬 실행(`npm run dev`)과 GitHub Pages 배포를 모두 지원한다.

### 1.2 범위

| 구분 | 포함 (MVP) | 제외 (향후 과제) |
|---|---|---|
| 사진 | 키워드 검색, 랜덤 추천, 방향 필터 | 사용자 사진 업로드 |
| 명언 | 로컬 JSON(한/영), 직접 입력, 즐겨찾기 | 외부 명언 API, AI 명언 생성 |
| 편집 | 폰트·크기·정렬·위치·오버레이 조절 | 레이어 자유 배치, 스티커 |
| 출력 | PNG 다운로드, 모바일 공유(Web Share API) | 인스타그램 직접 업로드(Graph API는 서버·비즈니스 계정 필요) |
| 저장 | 로컬 스토리지(설정·즐겨찾기·최근 작업·프리셋) | 클라우드 동기화, 로그인 |

### 1.3 교육 포인트

1. **외부 API 연동:** 인증 헤더, 페이지네이션, Rate limit 헤더 읽기
2. **Canvas 합성과 CORS:** `crossOrigin="anonymous"` 누락 시 발생하는 tainted canvas 오류를 직접 겪고 해결
3. **API 이용 가이드라인 준수:** 핫링크, 다운로드 트래킹, 작가 출처 표기
4. **클라이언트 앱의 키 관리:** 정적 배포 시 API 키가 노출되는 구조를 이해하고 BYOK 방식으로 해결
5. **로컬 스토리지 설계:** 키 네이밍, 스키마 버전, 용량 한계(약 5MB)

---

## 2. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 빌드 | Vite 6 | `npm create vite@latest -- --template react` |
| UI | React 19 | 함수형 컴포넌트 + Hooks |
| 스타일 | CSS Modules 또는 Tailwind CSS | 수강생 선택 |
| 상태 관리 | React Context + `useReducer` | 외부 라이브러리 없이 |
| 이미지 합성 | Canvas 2D API | 라이브러리 없이 직접 구현 |
| 폰트 | Google Fonts | Noto Sans KR, Noto Serif KR, Gowun Batang, Nanum Myeongjo |
| 저장소 | `localStorage` | 접두사 `qcs:` |
| 배포 | GitHub Pages + GitHub Actions | `vite.config.js`의 `base` 설정 필요 |

라우터는 사용하지 않는다(단일 화면 + 모달). GitHub Pages는 SPA 새로고침 시 404가 나기 때문에, 라우터가 필요해지면 `HashRouter`를 쓴다.

---

## 3. Unsplash API 명세

공식 문서: https://unsplash.com/documentation

### 3.1 기본 정보

| 항목 | 값 |
|---|---|
| Base URL | `https://api.unsplash.com/` |
| 버전 헤더 | `Accept-Version: v1` |
| 인증 헤더 | `Authorization: Client-ID {ACCESS_KEY}` |
| 인증 방식 | Public authentication (Access Key만 사용, Secret Key는 절대 클라이언트에 넣지 않음) |
| Rate limit | Demo 모드 **시간당 50회** / Production 승인 후 시간당 1,000회 |
| 카운트 대상 | `api.unsplash.com` JSON 요청만 카운트. `images.unsplash.com` 이미지 요청은 카운트하지 않음 |
| 응답 헤더 | `X-Ratelimit-Limit`, `X-Ratelimit-Remaining` |

Demo 모드는 교육·데모 목적에 적합하다고 공식 문서에 명시되어 있다. 수강생 24명이 각자 자신의 키로 실습하면 1인당 시간당 50회로 충분하다.

### 3.2 사용 엔드포인트

#### ① 사진 검색 — `GET /search/photos`

| 파라미터 | 앱에서 사용하는 값 | 설명 |
|---|---|---|
| `query` | 분위기 키워드의 **영문 검색어** | 한국어 검색(`lang`)은 베타 기능이라 별도 신청 필요 → 한글 키워드를 영문으로 매핑해서 전송 |
| `page` | 1, 2, 3… | 무한 스크롤 |
| `per_page` | `30` | 최대값. 호출 횟수를 줄이기 위해 항상 30 사용 |
| `orientation` | `squarish` / `portrait` | 선택한 출력 비율에 따라 자동 지정 |
| `color` | (선택) | `black_and_white`, `black`, `white`, `yellow`, `orange`, `red`, `purple`, `magenta`, `green`, `teal`, `blue` |
| `content_filter` | `high` | 교육 환경이므로 엄격 필터 적용 |
| `order_by` | `relevant` | 기본값 |

응답 형식: `{ total, total_pages, results: Photo[] }`

#### ② 랜덤 사진 — `GET /photos/random`

"오늘의 카드" 기능에 사용한다. `count`(최대 30)를 넣으면 **항상 배열로** 응답하고, 빼면 단일 객체로 응답한다는 점에 주의한다. 앱에서는 형식을 통일하기 위해 항상 `count`를 지정한다.

| 파라미터 | 값 |
|---|---|
| `query` | 분위기 키워드 영문 검색어 |
| `orientation` | 출력 비율에 따라 |
| `content_filter` | `high` |
| `count` | `10` |

#### ③ 다운로드 트래킹 — `GET /photos/:id/download`

**PNG로 내보낼 때마다 반드시 호출한다.** 사진 조회수(view)는 핫링크로 자동 집계되지만, 다운로드 수는 이 엔드포인트를 호출해야 작가에게 집계된다. 이 엔드포인트는 트래킹 전용이며 응답 URL을 이미지 표시에 쓰지 않는다.

- 호출 URL: 사진 객체의 `links.download_location`을 그대로 사용 (없으면 `/photos/{id}/download`로 구성)
- 인증 헤더를 포함해야 하며, Rate limit 1회가 차감된다.

### 3.3 Photo 객체 — 앱에서 사용하는 필드

```jsonc
{
  "id": "Dwu85P9SOIk",
  "width": 2448,
  "height": 3264,
  "color": "#6E633A",          // 대표색 → 텍스트 색·오버레이 자동 결정
  "blur_hash": "LFC$yH...",     // 로딩 플레이스홀더 (선택)
  "alt_description": "...",     // img alt 속성
  "urls": {
    "raw": "https://images.unsplash.com/photo-...?ixid=...",  // 합성용 (파라미터 직접 추가)
    "small": "...",             // 검색 결과 그리드 (w=400)
    "thumb": "..."              // 최근 작업 목록 (w=200)
  },
  "links": {
    "html": "https://unsplash.com/photos/...",
    "download_location": "https://api.unsplash.com/photos/.../download"
  },
  "user": {
    "name": "Joe Example",
    "username": "exampleuser",
    "links": { "html": "https://unsplash.com/@exampleuser" }
  }
}
```

### 3.4 동적 이미지 URL (Imgix)

모든 이미지 URL은 쿼리 파라미터로 크기·포맷을 바꿀 수 있고, 이 요청은 Rate limit에 포함되지 않는다. 공식 지원 파라미터는 `w`, `h`, `crop`, `fm`, `auto=format`, `q`, `fit`, `dpr`이다.

**규칙:** URL에 들어 있는 `ixid` 파라미터는 반드시 유지해야 한다. `urls.raw` 뒤에 `&`로 파라미터를 이어 붙이는 방식을 쓰면 자동으로 지켜진다.

| 용도 | URL 구성 |
|---|---|
| 검색 그리드 | `urls.small` 그대로 |
| 에디터 미리보기·합성 | `urls.raw + "&w=2160&fit=max&q=85&fm=jpg"` |
| 최근 작업 썸네일 | `urls.thumb` 그대로 |

합성용 이미지는 가로 2160px로 받아서 Canvas에서 cover 방식으로 자른다. 9:16(1080×1920)에서도 화질이 떨어지지 않도록 여유를 둔 값이다.

### 3.5 이용 가이드라인 준수 체크리스트

| # | 요구사항 | 앱 구현 |
|---|---|---|
| 1 | **핫링크:** API가 준 이미지 URL을 그대로 사용 | 이미지를 서버나 로컬 스토리지에 재호스팅하지 않음. 최근 작업은 URL만 저장 |
| 2 | **다운로드 트래킹:** 다운로드 시 `download_location` 호출 | PNG 내보내기, 공유 시 호출 |
| 3 | **출처 표기:** 작가와 Unsplash를 표기하고 링크 제공 | 에디터 하단 크레딧 바, 검색 카드 hover 표시 |
| 4 | **UTM 파라미터:** Unsplash로 가는 모든 링크에 `?utm_source={앱이름}&utm_medium=referral` | `buildUnsplashLink()` 헬퍼로 일괄 처리 |
| 5 | Secret Key 비노출 | Access Key만 사용 |

권장 표기 형식: **Photo by [작가명](작가 프로필 링크) on [Unsplash](unsplash.com 링크)**

내보낸 PNG 이미지 안에도 작은 크레딧(`Photo by 작가명 / Unsplash`)을 넣는 옵션을 제공하고, 기본값을 켜둔다. 이미지 내 표기는 필수 요구사항은 아니지만, SNS에 올라간 뒤에도 작가 정보가 남도록 하는 좋은 관행이다.

### 3.6 에러 처리

에러 응답은 `{ "errors": ["..."] }` 형식이다.

| 상태 코드 | 의미 | 앱 동작 |
|---|---|---|
| 401 | 잘못된 Access Key | 설정 모달을 열고 "API 키를 확인해 주세요" 표시 |
| 403 | 권한 없음 또는 Rate limit 초과 | `X-Ratelimit-Remaining`이 0이면 "시간당 한도 소진, 약 1시간 후 재시도" 표시 |
| 404 | 리소스 없음 | 사진 목록에서 제거 |
| 500, 503 | Unsplash 서버 오류 | 재시도 버튼 표시, https://status.unsplash.com 링크 안내 |
| 네트워크 오류 | 오프라인 등 | 토스트로 안내 |

---

## 4. API 키 관리: BYOK 방식

### 4.1 문제

Vite는 `VITE_`로 시작하는 환경변수를 **빌드 결과물 JS에 문자열로 그대로 넣는다.** GitHub Pages에 배포하면 누구나 개발자 도구로 키를 볼 수 있고, 다른 사람이 호출해서 내 Rate limit을 소진시킬 수 있다.

### 4.2 해결: Bring Your Own Key

1. 앱 첫 실행 시 설정 모달에서 사용자가 자신의 Access Key를 입력한다.
2. 키는 `localStorage`의 `qcs:settings`에 저장되고, 해당 브라우저에만 남는다.
3. 로컬 개발 편의를 위해 `.env.local`의 `VITE_UNSPLASH_ACCESS_KEY`가 있으면 **개발 모드(`import.meta.env.DEV`)에서만** 기본값으로 사용한다.
4. `.env.local`은 `.gitignore`에 포함한다(Vite 템플릿 기본 포함 여부를 반드시 확인).

```js
// src/services/apiKey.js
export function getAccessKey(settings) {
  if (settings.accessKey) return settings.accessKey;
  if (import.meta.env.DEV) return import.meta.env.VITE_UNSPLASH_ACCESS_KEY ?? '';
  return '';
}
```

---

## 5. 기능 명세

### F1. 분위기 키워드 검색

- 상단에 분위기 칩(chip) 12개를 표시하고, 클릭하면 해당 영문 검색어로 검색한다.
- 자유 입력창도 제공한다. 한글을 입력하면 매핑 테이블에서 찾고, 없으면 입력값 그대로 전송한다(영문 입력 권장 안내).
- 결과는 3열 그리드(모바일 2열), 스크롤 하단 도달 시 다음 페이지를 불러온다.
- 같은 검색 조건(검색어+페이지+방향+색상)의 결과는 메모리 캐시에 보관해 재호출하지 않는다.
- 화면 우상단에 남은 호출 횟수(`X-Ratelimit-Remaining`)를 작은 배지로 표시한다.

**분위기 키워드 매핑 (`src/data/moods.js`)**

| 칩 | 검색어 | 추천 명언 태그 |
|---|---|---|
| 평온 | `calm nature minimal` | peace |
| 도전 | `mountain summit climbing` | challenge |
| 새벽 | `dawn sunrise mist` | beginning |
| 위로 | `soft light window rain` | comfort |
| 열정 | `fire sunset vivid` | passion |
| 고독 | `lonely silhouette fog` | solitude |
| 성장 | `sprout plant growth` | growth |
| 여행 | `road trip landscape` | journey |
| 집중 | `desk workspace minimal` | focus |
| 바다 | `ocean waves horizon` | freedom |
| 밤 | `night city lights stars` | reflection |
| 계절 | `autumn leaves` | change |

### F2. 명언 선택

- 사진을 선택하면 오른쪽 패널에 현재 분위기 태그와 일치하는 명언을 우선 추천한다.
- 탭: **추천 / 전체 / 즐겨찾기 / 직접 입력**
- 언어 필터: 한국어 / English / 전체
- 명언 카드의 ☆ 버튼으로 즐겨찾기에 추가하거나 해제한다.
- 직접 입력한 명언은 "내 명언"으로 저장된다(최대 100개).

**명언 데이터 (`src/data/quotes.json`)**

```json
[
  {
    "id": "q001",
    "text": "천 리 길도 한 걸음부터.",
    "author": "속담",
    "lang": "ko",
    "tags": ["challenge", "growth", "beginning"]
  },
  {
    "id": "q002",
    "text": "The journey of a thousand miles begins with one step.",
    "author": "Lao Tzu",
    "lang": "en",
    "tags": ["journey", "beginning"]
  }
]
```

- 규모: 한국어 50개 + 영어 50개
- 출처 원칙: 속담, 고전, 사망 후 70년 이상 지난 인물의 문장 위주로 수록한다. 현대 작가의 문장은 저작권이 남아 있을 수 있으므로 기본 데이터에서 제외하고, 사용자 직접 입력으로 처리한다.

### F3. 카드 에디터

화면 중앙에 Canvas 미리보기, 오른쪽에 편집 패널을 둔다. 모든 변경은 즉시 미리보기에 반영된다.

| 항목 | 옵션 | 기본값 |
|---|---|---|
| 출력 비율 | 1:1 (1080×1080), 4:5 (1080×1350), 9:16 (1080×1920) | 4:5 |
| 폰트 | Noto Sans KR, Noto Serif KR, Gowun Batang, Nanum Myeongjo | Noto Serif KR |
| 글자 크기 | 32–96px (슬라이더) | 56px |
| 줄 간격 | 1.2–2.0 | 1.5 |
| 정렬 | 왼쪽 / 가운데 / 오른쪽 | 가운데 |
| 세로 위치 | 상단 / 중앙 / 하단 | 중앙 |
| 텍스트 색 | 자동 / 흰색 / 검정 / 직접 선택 | 자동 |
| 오버레이 | 자동 / 수동(0–80%) | 자동 |
| 오버레이 스타일 | 단색 / 그라디언트(하단→상단) | 단색 |
| 저자 표시 | 켜기/끄기 | 켜기 |
| 사진 크레딧 | 켜기/끄기 | 켜기 |
| 사진 위치 | 가로·세로 오프셋 슬라이더 (cover 크롭 기준점) | 중앙 |

### F4. 색상 자동 결정 (`color` 필드 활용)

사진의 대표색(`photo.color`)으로 상대 휘도(WCAG relative luminance)를 계산해 텍스트 색과 오버레이를 정한다.

| 대표색 휘도 L | 텍스트 색 | 오버레이 | 오버레이 불투명도 |
|---|---|---|---|
| L < 0.18 (어두움) | `#FFFFFF` | 검정 | 20% |
| 0.18 ≤ L < 0.5 (중간) | `#FFFFFF` | 검정 | 35–50% (L에 비례) |
| L ≥ 0.5 (밝음) | `#111111` | 흰색 | 25–40% (L에 비례) |

```js
// src/utils/color.js
export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function autoStyle(hex) {
  const L = luminance(hex);
  if (L < 0.18) return { text: '#FFFFFF', overlay: '0,0,0', opacity: 0.2 };
  if (L < 0.5) return { text: '#FFFFFF', overlay: '0,0,0', opacity: 0.35 + (L - 0.18) * 0.47 };
  return { text: '#111111', overlay: '255,255,255', opacity: 0.25 + (L - 0.5) * 0.3 };
}
```

대표색은 사진 전체의 평균에 가깝기 때문에, 텍스트가 놓이는 영역의 실제 밝기와 다를 수 있다. v1.1에서는 Canvas `getImageData()`로 텍스트 영역의 평균 밝기를 직접 측정하는 방식으로 개선한다(탐험 미션 🔴 소재).

### F5. PNG 내보내기와 공유

1. 사용자가 **[PNG 저장]**을 누른다.
2. `document.fonts.ready`와 선택 폰트의 로딩 완료를 기다린다.
3. 1080×H 크기의 오프스크린 Canvas에 최종 해상도로 다시 그린다.
4. `canvas.toBlob(cb, 'image/png')`로 Blob을 만든다.
5. **다운로드 트래킹 API를 호출한다**(실패해도 저장은 진행하고 콘솔에 경고).
6. 파일명 `quote-card_{ratio}_{YYYYMMDD-HHmm}.png`로 다운로드한다.
7. 최근 작업 목록에 카드 정보를 저장한다.

**[공유]** 버튼은 `navigator.canShare({ files })`가 `true`인 환경(주로 모바일)에서만 표시한다. 공유 시트에서 인스타그램을 선택하면 바로 게시 화면으로 넘어간다. 이때도 다운로드 트래킹을 호출한다.

### F6. 최근 작업과 프리셋

- **최근 작업:** 최근 20개를 저장하고 썸네일(`urls.thumb`)과 명언 앞부분을 표시한다. 클릭하면 에디터 상태를 그대로 복원한다. PNG 자체는 저장하지 않는다(용량 문제).
- **프리셋:** 현재 에디터 스타일(폰트, 크기, 정렬, 위치, 오버레이)을 이름 붙여 저장한다(최대 10개). 기본 프리셋 3종(미니멀, 감성 세리프, 스토리 볼드)을 제공한다.

### F7. 설정

- Unsplash Access Key 입력, 저장, 연결 테스트(`/photos/random?count=1` 호출로 확인)
- 앱 이름(UTM `utm_source` 값, 기본 `quote_card_studio`)
- 콘텐츠 필터(`high` / `low`)
- 데이터 관리: 전체 데이터 JSON 내보내기·가져오기, 초기화

---

## 6. 로컬 스토리지 스키마

모든 키는 `qcs:` 접두사를 붙이고, 값에는 스키마 버전을 포함한다.

| 키 | 타입 | 최대 개수 | 내용 |
|---|---|---|---|
| `qcs:settings` | object | 1 | API 키, 앱 이름, 필터, 마지막 비율 |
| `qcs:favorites` | string[] | 제한 없음 | 즐겨찾기 명언 ID 목록 |
| `qcs:customQuotes` | Quote[] | 100 | 직접 입력한 명언 |
| `qcs:recentCards` | Card[] | 20 | 최근 작업 카드 |
| `qcs:presets` | Preset[] | 10 | 스타일 프리셋 |

```ts
// 타입 정의 (문서용)
type Settings = {
  version: 1;
  accessKey: string;
  appName: string;              // utm_source
  contentFilter: 'high' | 'low';
  lastRatio: '1:1' | '4:5' | '9:16';
};

type PhotoRef = {               // Photo 객체에서 필요한 필드만 저장
  id: string;
  color: string;
  rawUrl: string;
  thumbUrl: string;
  htmlUrl: string;
  downloadLocation: string;
  authorName: string;
  authorUsername: string;
};

type CardStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  textColor: 'auto' | string;
  overlayMode: 'auto' | 'manual';
  overlayOpacity: number;
  overlayType: 'solid' | 'gradient';
  showAuthor: boolean;
  showCredit: boolean;
  offsetX: number;              // -1 ~ 1
  offsetY: number;
};

type Card = {
  id: string;                   // crypto.randomUUID()
  createdAt: string;            // ISO 8601
  ratio: '1:1' | '4:5' | '9:16';
  photo: PhotoRef;
  quote: { text: string; author: string };
  style: CardStyle;
};

type Preset = { id: string; name: string; style: CardStyle };
```

**저장 헬퍼 원칙**

- 읽기와 쓰기를 모두 `try/catch`로 감싼다(시크릿 모드, 저장 공간 초과 대비).
- 쓰기에서 `QuotaExceededError`가 나면 가장 오래된 최근 작업부터 삭제한 뒤 재시도한다.
- 읽은 값의 `version`이 현재 버전과 다르면 마이그레이션 함수를 거친다.

```js
// src/services/storage.js
const PREFIX = 'qcs:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[storage] save failed', key, e);
    return false;
  }
}
```

---

## 7. Canvas 합성 명세

### 7.1 렌더링 순서

```
1. 배경 사진 (cover 크롭 + 오프셋)
2. 오버레이 (단색 또는 그라디언트)
3. 명언 텍스트 (자동 줄바꿈)
4. 저자 표기 ("— 저자명")
5. 사진 크레딧 (우하단 작은 글씨)
```

### 7.2 이미지 로딩: CORS 처리 (핵심 교육 포인트)

`crossOrigin` 속성 없이 불러온 외부 이미지를 Canvas에 그리면 Canvas가 **오염(tainted)** 상태가 된다. 오염된 Canvas에서 `toBlob()`이나 `toDataURL()`을 호출하면 `SecurityError`가 발생한다. `images.unsplash.com`은 CORS 응답 헤더를 제공하므로 `crossOrigin="anonymous"`만 지정하면 해결된다.

```js
// src/utils/loadImage.js
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';   // ← 이 한 줄을 빼면 PNG 내보내기에서 SecurityError
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

**함정:** 같은 URL을 `crossOrigin` 없이 `<img>` 태그로 먼저 표시했다면, 브라우저 캐시가 CORS 헤더 없는 응답을 재사용해 여전히 오류가 날 수 있다. 그래서 합성용 이미지는 검색 그리드용(`urls.small`)과 **다른 URL**(`raw + &w=2160...`)을 쓰도록 설계했다. 미리보기용 `<img>`에도 `crossOrigin="anonymous"`를 일관되게 지정하는 것을 권장한다.

### 7.3 Cover 크롭

```js
// src/utils/drawCover.js
export function drawCover(ctx, img, W, H, offsetX = 0, offsetY = 0) {
  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const maxX = (dw - W) / 2;
  const maxY = (dh - H) / 2;
  const dx = -maxX + offsetX * maxX;   // offset: -1(왼쪽 끝) ~ 1(오른쪽 끝)
  const dy = -maxY + offsetY * maxY;
  ctx.drawImage(img, dx, dy, dw, dh);
}
```

### 7.4 텍스트 줄바꿈 (한국어 대응)

영어는 공백 단위로 줄을 바꾸고, 공백 단위로 넣었을 때 한 단어가 최대 폭을 넘으면 글자 단위로 쪼갠다. 한국어도 어절(공백) 단위를 우선해 CSS의 `word-break: keep-all`과 비슷한 결과를 낸다. 사용자가 입력한 줄바꿈(`\n`)은 그대로 존중한다.

```js
// src/utils/wrapText.js
export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else if (!line) {
        // 단어 하나가 너무 긴 경우: 글자 단위로 분할
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
```

### 7.5 레이아웃 상수

| 항목 | 값 |
|---|---|
| 좌우 여백 | 캔버스 폭의 10% (108px) |
| 상하 여백 | 1:1·4:5는 10%, 9:16은 14% (인스타 스토리 상하 UI 영역 회피) |
| 저자 글자 크기 | 본문의 45% |
| 본문과 저자 간격 | 본문 글자 크기의 1.2배 |
| 크레딧 | 20px, 불투명도 70%, 우하단 여백 32px |

### 7.6 폰트 로딩

Canvas는 폰트가 로딩되기 전에 그리면 기본 폰트로 그려버린다. 렌더링 전에 반드시 폰트 로딩을 기다린다.

```js
await document.fonts.load(`${style.fontSize}px "${style.fontFamily}"`);
```

`index.html`에서 Google Fonts를 `<link>`로 미리 불러오고, `display=swap`을 사용한다. 폰트 파일은 Canvas를 오염시키지 않는다.

---

## 8. 아키텍처와 폴더 구조

### 8.1 데이터 흐름

```
[분위기 칩/검색어] → useUnsplashSearch → Unsplash API → 결과 그리드
        ↓ 사진 선택
[EditorContext] ← 명언 선택 / 스타일 조절
        ↓
useCardRenderer → Canvas 미리보기
        ↓ PNG 저장
exportCard() → toBlob → trackDownload() → 다운로드 → recentCards 저장
```

### 8.2 폴더 구조

```
quote-card-studio/
├── .github/workflows/deploy.yml
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── context/
│   │   ├── SettingsContext.jsx      # API 키, 앱 설정
│   │   └── EditorContext.jsx        # 선택 사진, 명언, 스타일 (useReducer)
│   ├── services/
│   │   ├── unsplash.js              # API 호출 + 캐시 + Rate limit 추적
│   │   ├── apiKey.js
│   │   └── storage.js
│   ├── hooks/
│   │   ├── useUnsplashSearch.js     # 검색 + 무한 스크롤
│   │   ├── useLocalStorage.js
│   │   └── useCardRenderer.js       # Canvas 렌더링
│   ├── utils/
│   │   ├── color.js
│   │   ├── loadImage.js
│   │   ├── drawCover.js
│   │   ├── wrapText.js
│   │   ├── renderCard.js            # 렌더링 순서 조합
│   │   └── attribution.js           # UTM 링크 생성
│   ├── data/
│   │   ├── moods.js
│   │   ├── quotes.json
│   │   └── presets.js
│   └── components/
│       ├── Header.jsx               # 로고, Rate limit 배지, 설정 버튼
│       ├── MoodChips.jsx
│       ├── SearchBar.jsx
│       ├── PhotoGrid.jsx
│       ├── PhotoCard.jsx            # 썸네일 + hover 작가 표기
│       ├── CardCanvas.jsx           # 미리보기
│       ├── EditorPanel.jsx
│       ├── RatioSelector.jsx
│       ├── QuotePicker.jsx          # 탭: 추천/전체/즐겨찾기/직접 입력
│       ├── Attribution.jsx          # "Photo by ○○ on Unsplash"
│       ├── ExportButtons.jsx        # PNG 저장, 공유
│       ├── RecentCards.jsx
│       ├── PresetManager.jsx
│       └── SettingsModal.jsx
├── index.html
├── vite.config.js
├── .env.example                     # VITE_UNSPLASH_ACCESS_KEY=
├── .gitignore                       # .env.local 포함 확인
└── README.md
```

### 8.3 Unsplash 서비스 핵심 코드

```js
// src/services/unsplash.js
const BASE = 'https://api.unsplash.com';
const cache = new Map();
let rateLimit = { limit: null, remaining: null };
export const getRateLimit = () => rateLimit;

async function request(path, params, accessKey) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

  const cacheKey = url.toString();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  });

  rateLimit = {
    limit: Number(res.headers.get('X-Ratelimit-Limit')),
    remaining: Number(res.headers.get('X-Ratelimit-Remaining')),
  };

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.errors?.join(', ') || res.statusText);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  cache.set(cacheKey, data);
  return data;
}

export const searchPhotos = (accessKey, { query, page = 1, orientation, color, contentFilter = 'high' }) =>
  request('/search/photos', {
    query, page, per_page: 30, orientation, color, content_filter: contentFilter,
  }, accessKey);

export const randomPhotos = (accessKey, { query, orientation, contentFilter = 'high' }) =>
  request('/photos/random', {
    query, orientation, count: 10, content_filter: contentFilter,
  }, accessKey);

// 다운로드 트래킹: 캐시하지 않음 (매번 호출해야 함)
export async function trackDownload(accessKey, photo) {
  const url = photo.downloadLocation || `${BASE}/photos/${photo.id}/download`;
  try {
    await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
    });
  } catch (e) {
    console.warn('[unsplash] download tracking failed', e);
  }
}
```

### 8.4 출처 링크 헬퍼

```js
// src/utils/attribution.js
export function withUtm(url, appName) {
  const u = new URL(url);
  u.searchParams.set('utm_source', appName);
  u.searchParams.set('utm_medium', 'referral');
  return u.toString();
}

export const authorLink = (photo, appName) =>
  withUtm(`https://unsplash.com/@${photo.authorUsername}`, appName);

export const unsplashLink = (appName) => withUtm('https://unsplash.com/', appName);
```

---

## 9. 화면 구성

```
┌───────────────────────────────────────────────────────────────┐
│ Quote Card Studio                      [API 42/50] [⚙ 설정]   │
├───────────────────────────────────────────────────────────────┤
│ [평온] [도전] [새벽] [위로] [열정] [고독] [성장] ...  [🔍 검색] │
├──────────────────────┬────────────────────┬───────────────────┤
│  사진 그리드          │   Canvas 미리보기   │  편집 패널         │
│  ┌──┐ ┌──┐ ┌──┐      │   ┌────────────┐   │  비율 [1:1][4:5]  │
│  │  │ │  │ │  │      │   │            │   │       [9:16]      │
│  └──┘ └──┘ └──┘      │   │  명언 텍스트 │   │  명언 선택 ▾      │
│  ┌──┐ ┌──┐ ┌──┐      │   │   — 저자    │   │  폰트 / 크기 / 정렬│
│  │  │ │  │ │  │      │   │            │   │  위치 / 오버레이   │
│  └──┘ └──┘ └──┘      │   └────────────┘   │  프리셋 ▾          │
│  (무한 스크롤)        │  Photo by ○○ on    │  [PNG 저장] [공유] │
│                      │  Unsplash          │                   │
├──────────────────────┴────────────────────┴───────────────────┤
│ 최근 작업: [썸네일][썸네일][썸네일] ...                          │
└───────────────────────────────────────────────────────────────┘
```

모바일(768px 미만)에서는 **사진 → 편집 → 내보내기** 3단계 탭 구조로 전환한다.

---

## 10. 로컬 실행과 GitHub Pages 배포

### 10.1 로컬 실행

```bash
npm create vite@latest quote-card-studio -- --template react
cd quote-card-studio
npm install
cp .env.example .env.local      # 키 입력 (선택)
npm run dev                     # http://localhost:5173
```

### 10.2 `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/quote-card-studio/',   // GitHub 저장소 이름과 동일하게
});
```

### 10.3 GitHub Actions 워크플로 (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

GitHub 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정해야 한다. 워크플로에 API 키를 시크릿으로 넣지 않는다(BYOK 방식이므로 필요 없음).

---

## 11. 개발 로드맵

| 단계 | 목표 | 주요 작업 | 완료 기준 |
|---|---|---|---|
| **Phase 1** | 프로젝트 기반 | Vite 생성, 폴더 구조, 설정 모달, 스토리지 헬퍼 | 키 저장 후 연결 테스트 성공 |
| **Phase 2** | 사진 검색 | 분위기 칩, 검색, 그리드, 무한 스크롤, 캐시, Rate limit 배지 | 12개 칩 모두 결과 표시 |
| **Phase 3** | Canvas 합성 | loadImage, drawCover, wrapText, 자동 색상, 3개 비율 | 3개 비율 미리보기 정상 |
| **Phase 4** | 명언과 편집 | quotes.json 100개, QuotePicker, EditorPanel 전 옵션 | 편집 즉시 미리보기 반영 |
| **Phase 5** | 내보내기 | PNG 저장, 다운로드 트래킹, Web Share, 최근 작업 | PNG 저장 + 트래킹 호출 확인 |
| **Phase 6** | 마무리와 배포 | 프리셋, 반응형, README, GitHub Actions 배포 | GitHub Pages URL에서 전 기능 동작 |

---

## 12. 테스트 체크리스트

### 기능

- [ ] 잘못된 키 입력 시 401 안내가 표시된다
- [ ] 12개 분위기 칩 모두 검색 결과가 나온다
- [ ] 같은 검색을 반복하면 API가 재호출되지 않는다(Rate limit 배지 숫자 유지)
- [ ] 1:1, 4:5, 9:16 PNG의 실제 픽셀 크기가 명세와 일치한다
- [ ] 밝은 사진(설경 등)에서 텍스트가 자동으로 어두운 색이 된다
- [ ] 긴 한국어 명언(80자 이상)이 여백 안에서 줄바꿈된다
- [ ] 폰트를 바꾼 직후 저장해도 선택한 폰트로 저장된다
- [ ] 새로고침 후 즐겨찾기, 최근 작업, 프리셋이 유지된다

### 가이드라인 준수

- [ ] 모든 사진 표시 위치에 작가명과 Unsplash 출처가 보인다
- [ ] 작가, Unsplash 링크에 `utm_source`, `utm_medium=referral`이 붙어 있다
- [ ] PNG 저장 시 개발자 도구 Network 탭에서 `/download` 요청이 확인된다
- [ ] 이미지 URL에 `ixid` 파라미터가 유지된다

### 배포

- [ ] GitHub Pages에서 에셋 404가 없다(`base` 설정 확인)
- [ ] 빌드 결과물(`dist/assets/*.js`)에 API 키 문자열이 없다

---

## 13. 트러블슈팅 가이드 (교육 자료용)

| 증상 | 원인 | 해결 |
|---|---|---|
| `SecurityError: The operation is insecure` / `Tainted canvases may not be exported` | 이미지 로딩 시 `crossOrigin` 누락 | `img.crossOrigin = 'anonymous'` 추가, 합성용 URL 분리 |
| 401 Unauthorized | Access Key 오타, Secret Key를 잘못 입력 | 설정에서 Access Key 재입력 |
| 403 + `Rate Limit Exceeded` | 시간당 50회 초과 | 1시간 대기, 캐시 동작 확인, `per_page=30` 사용 여부 확인 |
| PNG에 기본 폰트가 찍힘 | 폰트 로딩 전 렌더링 | `document.fonts.load()` 대기 |
| 배포 후 흰 화면, JS 404 | `vite.config.js`의 `base` 누락 | 저장소 이름으로 `base` 설정 |
| 한글 검색 결과가 이상함 | `lang` 파라미터가 베타 기능 | 분위기 매핑 테이블의 영문 검색어 사용 |
| `/photos/random` 결과 처리 오류 | `count` 유무에 따라 객체와 배열로 응답이 달라짐 | 항상 `count` 지정 |
| 최근 작업 저장 실패 | localStorage 용량 초과(이미지 저장 시) | URL과 메타데이터만 저장 |

---

## 14. 수업 미션 연계 (선택)

| 난이도 | 미션 | 학습 포인트 |
|---|---|---|
| 🟢 | `crossOrigin` 줄을 지우고 PNG 저장을 시도한 뒤, 오류 메시지를 읽고 원인 설명하기 | CORS, tainted canvas |
| 🟢 | 분위기 칩 3개를 직접 추가하고 검색어 튜닝하기 | API 파라미터 실험 |
| 🟡 | 대표색 대신 텍스트 영역의 실제 평균 밝기로 텍스트 색 결정하기 | `getImageData()` |
| 🟡 | 명언 50개를 Claude로 생성·검수해 `quotes.json`에 추가하기 | 구조화 데이터 생성 |
| 🔴 | GPT/Gemini API로 사진 설명(`alt_description`)에 어울리는 명언 추천 기능 추가하기 | LLM API 연동(Day 12 연계) |
| 🔴 | 카드 5장을 한 번에 만드는 캐러셀(여러 장 게시물) 모드 구현하기 | 배치 렌더링, ZIP 내보내기 |

---

## 참고 자료

- Unsplash API Documentation — https://unsplash.com/documentation
- Unsplash API Guidelines — https://help.unsplash.com/api-guidelines/unsplash-api-guidelines
- Guideline: Attribution — https://help.unsplash.com/api-guidelines/guideline-attribution
- Guideline: Triggering a download — https://help.unsplash.com/api-guidelines/guideline-triggering-a-download
- Unsplash API Status — https://status.unsplash.com
- MDN: CORS enabled image — https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
- Vite: Deploying a Static Site — https://vite.dev/guide/static-deploy

---

*작성: 동준상 · 넥스트플랫폼 · naebon@naver.com · nextplatform.net*

# WORD QUEST — 선생님·원장용 랜딩페이지

기사·소문·검색으로 들어온 **선생님 / 원장 / 학부모**가 신뢰를 얻고 **도입 문의**를 남기게 하는 정적 페이지입니다.
학생용 게임 앱과는 별개이며, 운영사는 **타이거오키드**입니다.

빌드 스텝이 없습니다. 파일을 그대로 호스팅하면 됩니다.

---

## 빠르게 보기

```bash
npm run dev            # http://localhost:8080
```

## 검증 (배포 전 필수)

```bash
npm install            # playwright-core (검증 전용, 사이트 자체는 의존성 0)
npm run verify         # 100점 채점 — 85점 미만이면 exit 1
npm run verify:static  # 브라우저 없이 정적 검사만
```

`.verify/view-*.png` 에 360 / 390 / 768 / 1280 / 1440 스크린샷이 남습니다.

## OG 이미지 다시 만들기

```bash
npm run og             # tools/og-image.html → assets/img/og-image.png (1200×630)
```

> 한글 웹폰트(Pretendard)를 내려받을 수 있는 환경에서 돌려야 글자가 예쁘게 나옵니다.
> 오프라인에서 돌리면 시스템 폴백 폰트로 렌더됩니다.

---

## 배포 전 체크리스트

> ⚠️ **릴리스 게이트 — 이건 반드시 처리하고 공개하세요.**
> **`npm run form:check` 를 돌려 "접수됨" 을 확인할 것.** 폼은 FormSubmit 중계로 연결돼 있지만,
>    받을 주소를 **최초 1회 확인**해야 문의가 도착합니다. 확인 전에는 접수되지 않습니다.
>    페이지의 전환 목표가 문의 하나이므로, 이걸 안 하면 문의가 한 건도 안 들어옵니다.

### 1. 도메인 교체 (필수)

`index.html` `<head>` 의 아래 4곳을 실제 도메인으로 바꾸세요. OG 이미지는 **절대경로**여야
카카오톡·페이스북 공유 미리보기가 뜹니다.

| 위치 | 현재 값 |
|---|---|
| `<link rel="canonical">` | `https://ranha0924.github.io/tigerOrchid/` |
| `og:url` | 〃 |
| `og:image` | `.../assets/img/og-image.png` |
| `twitter:image` | 〃 |

### 2. 문의 폼 활성화 (필수 · 1회)

기본값은 **FormSubmit 중계**입니다. 계정을 만들 필요는 없지만, "이 주소로 받겠다" 는
확인을 **한 번** 해줘야 문의가 도착합니다.

```bash
npm run form:check     # 1회차 — 확인 메일이 발송됩니다
# → ranha.projects@gmail.com 메일함에서 FormSubmit 확인 메일의 링크를 클릭
npm run form:check     # 2회차 — "✔ 접수됨" 이 뜨면 완료
```

`✔ 접수됨` 을 본 뒤에 공개하세요. 그전까지 폼은 **성공했다고 말하지 않고**
"전송에 실패했습니다" 와 함께 작성한 내용을 복사할 수 있게 꺼내둡니다.

받는 주소나 방식을 바꾸려면 `assets/js/config.js` **한 파일만** 고치면 됩니다.

- **기본 · FormSubmit** — `formsubmit.target` 에 받을 이메일. 활성화 후 FormSubmit 이 주는
  별칭(랜덤 문자열)으로 바꿔두면 소스에 메일 주소가 노출되지 않습니다.
- **1안 · Google Form** — 구글 폼을 만들고 `formResponseUrl` + `entry.*` ID 를 넣은 뒤
  `FORM_MODE: 'google'`. 알림은 구글 폼 → 응답 → ⋮ → "새 응답에 대한 이메일 알림 받기".
- **2안 · Firestore** — `inquiries` 컬렉션에 저장하는 엔드포인트를 만들고 `firestore.endpoint` 에 넣은 뒤
  `FORM_MODE: 'firestore'`.
- **폴백 · mailto** — 위 설정이 비어 있으면 자동으로 메일 클라이언트를 엽니다.
  **설정 전에도 문의가 조용히 사라지지 않습니다.**

> 방식을 바꾸면 `privacy.html` 5항(처리 위탁 및 국외 이전)의 수탁자 표도 함께 고치세요.

### 3. 스크린샷 (완료 — 교체 시 참고)

`assets/img/screen-*.png` 5장은 **실제 사용 화면**입니다. 학교명·학생 이름은 모자이크했습니다.

| 파일 | 화면 | 쓰이는 곳 |
|---|---|---|
| `screen-dashboard.png` | 최다 오답 TOP 10 + 반 랭킹 | 히어로 슬라이드 1 |
| `screen-setup.png` | 엑셀 붙여넣기 · 반 배포 | 히어로 슬라이드 2 |
| `screen-battle.png` | 몬스터 전투 | 3번 섹션 ① |
| `screen-dex.png` | 포획 도감 | 3번 섹션 ② |
| `screen-class.png` | 학생별 현황 | 3번 섹션 ③ |

새 캡처로 바꿀 때 지킬 것:

- **브라우저 주소창·안드로이드 내비게이션 바를 잘라내고 상태바 + 앱 화면만 남깁니다.**
  5장 크기가 같아야 폰 목업 높이가 어긋나지 않습니다. 현재 기준은 원본 1080×2126.
- **정확히 1/2(540×1063)로 축소 후 256색 PNG.** 픽셀아트라 정수배 축소가 아니면
  뭉개지고, 256색이면 사실상 무손실인데 용량이 1/3 됩니다.
- **개인정보를 반드시 가리고**, 히어로·3번 섹션의 "학생 이름과 학교명은 가렸습니다"
  문구를 유지하세요. 가릴 게 없는 캡처라면 그 문구를 지우면 됩니다.
- **히어로에는 선생님 화면만.** 몬스터·게임 아트는 3번 섹션부터 (`npm run verify` 가 잡습니다).
- 교체 후 `npm run og` 로 OG 이미지도 갱신하세요.

### 4. 데모 영상

1분 데모가 완성되면 `index.html` 의 `<!-- VIDEO SLOT -->` 주석에 적힌 대로
히어로의 슬라이더 블록을 유튜브(unlisted) 임베드로 교체하세요.

### 5. 9월 지표 추가

`index.html` 의 `<!-- SEPT SLOT -->` 주석을 풀고 값만 채우면 됩니다.
참여율 % / 누적 학습 단어 수 / 선생님 코멘트 / 언론 보도 링크.

---

## 구조

```
index.html              섹션 1~10
privacy.html            개인정보처리방침 (푸터 필수 링크)
assets/css/tokens.css   ★ 디자인 토큰 — 색·타이포·간격의 단일 진실 소스
assets/css/style.css    레이아웃 · 컴포넌트
assets/js/config.js     ★ 폼 엔드포인트 설정
assets/js/main.js       슬라이더 · 폼 (의존성 0)
assets/img/             실제 스크린샷 5장(마스킹 완료) · 몬스터 · OG · 파비콘
tools/verify.mjs        자동 검증 + 채점
tools/render-og.mjs     OG 이미지 생성
docs/                   PLAN.md · DESIGN-SYSTEM.md · VERIFICATION.md
CLAUDE.md               프로젝트 메모리 (톤 규칙 · 금지 목록)
```

## 디자인 시스템

"난초의 보라로 단정하게, 호랑이의 오렌지로 생기 있게." — 자세한 규칙은
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

색을 새로 쓰고 싶으면 **먼저 `tokens.css` 에 토큰을 만드세요.** HEX 하드코딩은 검증에서 걸립니다.

## 호스팅

정적 파일이면 어디든 됩니다.

- **GitHub Pages** — Settings → Pages → Branch 지정
- **Firebase Hosting** — `firebase deploy` (`public: "."`)
- **Netlify / Vercel** — 빌드 명령 없이 루트 배포
- **기존 도메인 하위 경로** — 폴더째 업로드 (모든 경로가 상대경로입니다)

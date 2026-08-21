/* ==========================================================================
   ★ 운영자가 고치는 파일은 여기 하나입니다.

   1) 사이트 주소가 바뀌면 SITE_BASE_URL 을 고치고 `npm run site-url` 실행.
   2) 문의 폼을 어디로 보낼지는 FORM_MODE 로 정합니다.
      설정이 비어 있으면 자동으로 'mailto'로 떨어집니다 —
      설정 전에도 문의가 조용히 사라지는 일은 없습니다.
   ========================================================================== */
window.WQ_CONFIG = {

  /* ── 사이트 기본 URL (단일 소스) ───────────────────────────────────────
     도메인이 바뀌면 여기 한 곳만 고친 뒤 `npm run site-url` 을 실행한다.
     index.html 의 canonical / og:url / og:image / twitter:image 4곳이
     이 값으로 갱신된다. (크롤러는 JS를 읽지 않으므로 HTML에 절대경로가
     박혀 있어야 하고, 어긋나면 `npm run verify` 가 잡는다.)
     끝에 슬래시 없이 적는다. */
  SITE_BASE_URL: 'https://tiger-orchid.vercel.app',

  /* 'google' | 'firestore' | 'mailto'  (기본: mailto) */
  FORM_MODE: 'mailto',

  /* ── 1안) Google Form (제일 빠름) ──────────────────────────────────────
     설정 방법
       1. 구글 폼을 만든다. 질문 4개: 성함 / 소속 / 연락처 / 문의 내용
          (+ 선택: "유입 경로" 단답 질문 — 보도자료별 전환 확인용)
       2. 폼 편집 화면 → 미리보기(눈 아이콘) → 페이지 소스 보기
       3. 각 질문의 `entry.숫자` 를 찾아 아래에 넣는다
       4. 주소창의 .../viewform 을 .../formResponse 로 바꿔 formResponseUrl 에 넣는다
       5. FORM_MODE 를 'google' 로 바꾼다
     알림 메일은 구글 폼 → 응답 → ⋮ → "새 응답에 대한 이메일 알림 받기" 로 켠다.
     ──────────────────────────────────────────────────────────────────── */
  google: {
    formResponseUrl: '',          // 예: 'https://docs.google.com/forms/d/e/1FAIpQL.../formResponse'
    entries: {
      name:    '',                // 예: 'entry.1234567890'
      org:     '',
      contact: '',
      message: '',
      utm:     ''                 // (선택) 유입 경로 질문의 entry ID — 비우면 유입 경로는 보내지 않는다
    }
  },

  /* ── 2안) Firestore inquiries 컬렉션 + 이메일 알림 ─────────────────────
     Cloud Function(또는 아무 서버리스 엔드포인트)을 하나 두고,
     그 함수가 inquiries 컬렉션에 저장하고 메일을 보내게 한다.
     endpoint 를 채우고 FORM_MODE 를 'firestore' 로 바꾸면 된다.
     보내는 JSON: { name, org, contact, message, page, ts, utm }
       utm 은 주소에 utm_source/utm_medium/utm_campaign 이 있을 때만 객체,
       없으면 null — 필드를 모르는 기존 수신부와도 호환된다.
     ──────────────────────────────────────────────────────────────────── */
  firestore: {
    endpoint: ''                  // 예: 'https://asia-northeast3-프로젝트.cloudfunctions.net/inquiry'
  },

  /* ── 폴백) 메일 클라이언트로 넘기기 ─────────────────────────────────── */
  mailto: {
    to: 'ranha.projects@gmail.com',
    subject: 'WORD QUEST 도입 문의'
  }
};

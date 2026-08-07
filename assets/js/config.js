/* ==========================================================================
   ★ 운영자가 고치는 파일은 여기 하나입니다.

   문의 폼을 어디로 보낼지 정합니다.
   설정이 비어 있으면 자동으로 'mailto'로 떨어집니다 —
   설정 전에도 문의가 조용히 사라지는 일은 없습니다.
   ========================================================================== */
window.WQ_CONFIG = {

  /* 'formsubmit' | 'google' | 'firestore' | 'mailto'  (기본: formsubmit) */
  FORM_MODE: 'formsubmit',

  /* ── 기본) FormSubmit 중계 — 계정 없이 메일함으로 바로 받는다 ──────────
     문의가 formsubmit.co 를 거쳐 아래 주소로 메일 전송된다.

     ★ 최초 1회만 해야 하는 일 (안 하면 문의가 도착하지 않는다)
       1. `npm run form:check` 를 실행한다 (또는 배포된 페이지에서 직접 문의를 한 번 넣는다)
       2. ranha.projects@gmail.com 로 FormSubmit 확인 메일이 온다 → 링크를 누른다
       3. `npm run form:check` 를 한 번 더 실행해 "접수됨" 이 뜨는지 확인한다
     확인 전 첫 요청은 접수되지 않는다. 그래서 페이지는 성공했다고 말하지 않고
     작성한 내용을 화면에 꺼내 복사할 수 있게 한다.

     target 에는 이메일 대신, 활성화 후 FormSubmit 이 주는 별칭(랜덤 문자열)을 넣어도 된다.
     별칭을 쓰면 소스에 메일 주소가 노출되지 않아 스팸 수집을 줄일 수 있다.
     ──────────────────────────────────────────────────────────────────── */
  formsubmit: {
    target:  'ranha.projects@gmail.com',   // 이메일 또는 활성화 후 받은 별칭
    subject: 'WORD QUEST 도입 문의'
  },

  /* ── 1안) Google Form ─────────────────────────────────────────────────
     설정 방법
       1. 구글 폼을 만든다. 질문 4개: 성함 / 소속 / 연락처 / 문의 내용
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
      message: ''
    }
  },

  /* ── 2안) Firestore inquiries 컬렉션 + 이메일 알림 ─────────────────────
     Cloud Function(또는 아무 서버리스 엔드포인트)을 하나 두고,
     그 함수가 inquiries 컬렉션에 저장하고 메일을 보내게 한다.
     endpoint 를 채우고 FORM_MODE 를 'firestore' 로 바꾸면 된다.
     보내는 JSON: { name, org, contact, message, page, ts }
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

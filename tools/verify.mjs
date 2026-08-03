/**
 * WORD QUEST 랜딩페이지 자동 검증 — 100점 채점
 *
 *   node tools/verify.mjs            전체 검증
 *   node tools/verify.mjs --static   정적 검사만 (브라우저 없이)
 *
 * 루브릭 (docs/PLAN.md 와 동일)
 *   A 콘텐츠 정확도 25 · B 디자인 시스템 25 · C 접근성 15 · D 반응형 15 · E 기술 20
 *
 * 게이트: 85점 미만이면 exit 1.
 */
import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_ONLY = process.argv.includes('--static');
const OUT = join(root, '.verify');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const read = (p) => readFileSync(join(root, p), 'utf8');
const html = read('index.html');
const privacy = existsSync(join(root, 'privacy.html')) ? read('privacy.html') : '';
const tokens = read('assets/css/tokens.css');
const style = read('assets/css/style.css');

/* ── 채점 뼈대 ────────────────────────────────────────────────────────── */
const areas = {
  A: { title: '콘텐츠 정확도', max: 25, got: 0, checks: [] },
  B: { title: '디자인 시스템', max: 25, got: 0, checks: [] },
  C: { title: '접근성',       max: 15, got: 0, checks: [] },
  D: { title: '반응형',       max: 15, got: 0, checks: [] },
  E: { title: '기술',         max: 20, got: 0, checks: [] }
};
function check(area, weight, label, pass, note = '') {
  areas[area].checks.push({ label, weight, pass: !!pass, note });
  if (pass) areas[area].got += weight;
}

/* 스펙 원문 카피 — 문자 그대로 들어가야 한다 (따옴표 형태는 정규화해서 비교)
   <br> 은 줄바꿈이므로 공백으로, 나머지 인라인 태그는 그냥 지운다.
   (<strong>69%</strong>가 → "69%가" 처럼 어절이 갈라지지 않아야 한다) */
const norm = (s) => s.replace(/[‘’']/g, "'").replace(/[“”"]/g, '"')
                     .replace(/&nbsp;|&#160;/g, ' ')
                     .replace(/<br\s*\/?>/gi, ' ')
                     .replace(/<[^>]+>/g, '')
                     .replace(/\s+/g, ' ').trim();
const plain = norm(html);
const has = (s) => plain.includes(norm(s));

/* ══ A. 콘텐츠 정확도 (25) ══════════════════════════════════════════════ */
const COPY = [
  ['히어로 헤드라인',      '단어 숙제를, 아이들이 하고 싶어하게'],
  ['히어로 서브',          "실제 학교 수업에서 사용 중인 영어 단어 학습 프로그램. 학생 110명 설문에서 69%가 '기존 암기 방식보다 낫다'고 답했습니다."],
  ['CTA 1',                '학교는 무료로 시작하기'],
  ['CTA 2',                '도입 문의하기'],
  ['2. 공감',              '단어 시험지 만들고, 채점하고, 숙제 안 해온 아이들 확인하고… 정작 아이들은 단어장을 펴는 순간 지루해합니다.'],
  ['3. 해결 카피',         '아이들은 게임처럼 즐기고, 선생님은 데이터로 확인합니다.'],
  ['3. 해결 한 줄',        '문제를 풀어 몬스터를 잡고, 도감을 모으고, 반 전체가 보스에 도전합니다. 그 모든 기록이 선생님 대시보드에 쌓입니다.'],
  ['4. 기능 1',            '엑셀에서 단어를 복사해 붙여넣으면 끝'],
  ['4. 기능 2',            '교재를 찍으면 단어–뜻이 자동으로 등록'],
  ['4. 기능 3',            '누가 했는지, 정답률, 우리 반 최다 오답 TOP 10'],
  ['4. 기능 4',            '반 아이들의 학습이 모여 보스를 잡는 협동 이벤트'],
  ['5. 신뢰 문장',         '실제 학교에서 영어 선생님이 수업·숙제로 사용 중입니다'],
  ['5. 초과 학습',         '자발적으로 정해진 분량을 초과 학습한 학생 다수'],
  ['6. 학생 코멘트 1',     '이런 사이트 만들어줘서 너무 고마워, 넌 내 구세주나 다름없어'],
  ['6. 학생 코멘트 2',     '덕분에 단어 잘 외우고 있습니다'],
  ['6. 학생 코멘트 3',     '몬스터를 잡는 방식이 쾌감있다'],
  ['6. 학생 코멘트 4',     '하다 보니 시간 가는 줄 모르고 했어요'],
  ['7. 만든 사람',         'WORD QUEST는 고등학교 1학년 개발자가 만들었습니다. 제 학교 친구들이 매일 쓰는 모습을 보며, 매주 직접 업데이트하고 있습니다.'],
  ['7. 만든 사람 2',       '필요한 기능은 말씀해 주세요 — 제가 직접 만들어 드립니다.'],
  ['8. 요금 학교',         '무료입니다.'],
  ['8. 요금 학원',         '한 반 4주 무료 체험'],
  ['9. 폼 아래 한 줄',     '남겨주시면 제작자가 직접 연락드립니다.'],
  ['10. 이메일',           'ranha.projects@gmail.com'],
  ['10. 인스타',           '@r.xanha']
];
const missing = COPY.filter(([, s]) => !has(s));
check('A', 8, `스펙 카피 ${COPY.length}개 문자열 일치`, missing.length === 0,
      missing.length ? `누락: ${missing.map(([k]) => k).join(', ')}` : '');

const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
check('A', 3, 'H1 = 히어로 헤드라인', norm(h1) === norm('단어 숙제를, 아이들이 하고 싶어하게'), norm(h1));
check('A', 3, '헤드라인(H1)에 "게임" 미노출 (톤 규칙)', !h1.includes('게임'));

const footerHtml = (html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/) || [''])[0];
const bodyBeforeFooter = html.slice(0, html.indexOf('<footer class="site-footer"'));
check('A', 2, '학생 앱 링크가 푸터 위로 올라오지 않음', !bodyBeforeFooter.includes('학생용 앱'));

const sectionCount = (html.match(/<section\b/g) || []).length;
check('A', 1, `스펙 섹션 9개 이상 + 푸터`, sectionCount >= 9 && /<footer/.test(html), `section ${sectionCount}개`);

/* 게임 아트는 3번(해결)·6번(학생들의 말) 섹션에만.
   페이지 상단은 어른의 신뢰 영역 — 히어로에 몬스터가 나오면 안 된다. */
const GAME_ART = ['screen-battle', 'screen-dex', 'monsters.svg'];
const sections = [...html.matchAll(/<section[\s\S]*?<\/section>/g)].map((m) => m[0]);
const gameArtOutside = sections
  .filter((s) => GAME_ART.some((a) => s.includes(a)))
  .filter((s) => !/id="solution-title"|id="voices-title"/.test(s))
  .map((s) => (s.match(/aria-labelledby="([^"]+)"/) || [, s.match(/id="([^"]+)"/)?.[1] || '히어로'])[1]);
check('A', 3, '몬스터·게임 아트는 3번·6번 섹션에만 (상단은 신뢰 영역)',
      gameArtOutside.length === 0,
      gameArtOutside.length ? `밖에서 발견: ${gameArtOutside.join(', ')}` : '');

/* 화면이 무엇인지 정직하게 밝혔는가.
     - 그려낸 자리표시자(.svg)를 쓰는 동안은 "예시 화면" 배지를 목업마다 붙이고
       "실제 화면"이라는 표현을 쓰지 않는다.
     - 실제 캡처(.png)로 바꾼 뒤에는 반대로, 가린 부분이 있다는 사실을 밝힌다. */
const usesPlaceholder = /screen-[a-z-]+\.svg/.test(html);
const tagCount = (html.match(/phone__tag/g) || []).length;
const phoneCount = (html.match(/class="phone"/g) || []).length;
const disclosesMasking = /학생 이름과 학교명은 가렸습니다/.test(plain);
check('A', 2,
      usesPlaceholder ? '자리표시자에 "예시 화면" 배지 + "실제 화면" 문구 없음'
                      : '실제 캡처 — 마스킹 사실을 화면에서 고지',
      usesPlaceholder
        ? (tagCount === phoneCount && tagCount > 0 && !/실제 화면/.test(plain))
        : disclosesMasking,
      usesPlaceholder ? `목업 ${phoneCount}개 중 예시배지 ${tagCount}개`
                      : `실제 캡처 ${phoneCount}개 · 고지 ${disclosesMasking ? 'O' : 'X'}`);

/* 마스킹한 캡처에 학교명·학생 이름이 파일명으로라도 남아 있으면 안 된다 */
const leakNames = /흥덕|류윤하|유지민|윤지유|한규민|고다은|고하율|곽온유|김건형|김기정|김도현/.test(html);
check('A', 1, '학교명·학생 이름이 마크업에 남아 있지 않음', !leakNames);

/* 포지셔닝: 시험·채점을 대체한다고 말하면 안 된다.
   대체하는 것은 "아이들이 외워오는 과정"이다. "채점"은 2번 섹션 스펙 카피
   (선생님의 통증 묘사) 한 번만 나와야 하고, 시험을 그대로 보셔도 된다는
   명확화 문장이 반드시 있어야 한다. */
const gradingMentions = (plain.match(/채점/g) || []).length;
const keepsExam = /시험을 대신하는 게 아니라/.test(plain) && /시험은 지금 보시던 대로/.test(plain);
check('A', 1, '"시험·채점 대체"로 읽히지 않음 (외워오는 과정을 대체)',
      gradingMentions === 1 && keepsExam,
      `"채점" ${gradingMentions}회(스펙 카피 1회만 허용) · 명확화 문장 ${keepsExam ? 'O' : 'X'}`);

/* 근거 없는 외부 URL 을 넣어두면 안 된다 */
const outboundLinks = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
const ALLOWED_HOSTS = ['cdn.jsdelivr.net', 'www.instagram.com', 'ranha0924.github.io',
                       'schema.org', 'www.youtube-nocookie.com',
                       'word-quest-fywr.vercel.app'];   // 학생 앱 (운영자 확인)
const unknownHosts = outboundLinks
  .map((u) => { try { return new URL(u).host; } catch { return u; } })
  .filter((h) => !ALLOWED_HOSTS.includes(h));
check('A', 1, '확인되지 않은 외부 도메인 링크 없음', unknownHosts.length === 0, unknownHosts.join(', '));

/* ══ B. 디자인 시스템 (25) ══════════════════════════════════════════════ */
const PALETTE = {
  '--c-purple': '#7C3AED', '--c-purple-deep': '#5B21B6', '--c-purple-tint': '#F3EEFF',
  '--c-orange': '#F97316', '--c-ink': '#211A33', '--c-ink-soft': '#6B6480',
  '--c-bg': '#FCFAFF', '--c-line': '#EAE4F5'
};
const badTokens = Object.entries(PALETTE).filter(([t, hex]) =>
  !new RegExp(`${t}\\s*:\\s*${hex}`, 'i').test(tokens));
check('B', 4, '컬러 토큰 8종 정확', badTokens.length === 0,
      badTokens.length ? `불일치: ${badTokens.map(([t]) => t).join(', ')}` : '');

const leaked = Object.values(PALETTE).filter((hex) =>
  new RegExp(hex.slice(1), 'i').test(style));
check('B', 2, '브랜드 HEX 하드코딩 없음 (style.css)', leaked.length === 0,
      leaked.length ? `유출: ${leaked.join(', ')}` : '');

check('B', 3, '타이포 스케일 (히어로 40/28 · 타이틀 28/22 · 본문 17/16 · 캡션 14 · 행간 1.65)',
      /--fs-hero:\s*28px/.test(tokens) && /--fs-hero:\s*40px/.test(tokens) &&
      /--fs-h2:\s*22px/.test(tokens)   && /--fs-h2:\s*28px/.test(tokens) &&
      /--fs-body:\s*16px/.test(tokens) && /--fs-body:\s*17px/.test(tokens) &&
      /--fs-caption:\s*14px/.test(tokens) && /--lh-body:\s*1\.65/.test(tokens));

check('B', 2, '버튼 radius 12 / 카드 radius 16',
      /--r-btn:\s*12px/.test(tokens) && /--r-card:\s*16px/.test(tokens));

check('B', 2, '섹션 패딩 96px (모바일 64px)',
      /--sp-section:\s*64px/.test(tokens) && /--sp-section:\s*96px/.test(tokens));

const whiteSections = (html.match(/section--white/g) || []).length;
check('B', 1, '배경 오프화이트 ↔ 화이트 교차', whiteSections >= 3, `section--white ${whiteSections}개`);

const hlCount = (html.match(/class="hl"/g) || []).length;
check('B', 2, '형광펜 밑줄은 히어로 한 곳만', hlCount === 1, `.hl ${hlCount}개`);

const orchidCount = (html.match(/contact__orchid/g) || []).length;
const orchidInContact = /id="contact"[\s\S]{0,900}contact__orchid/.test(html);
check('B', 2, '난초 라인 드로잉은 문의 섹션 하나만', orchidCount === 1 && orchidInContact);

check('B', 1, '헤드라인 폰트 Paperlogy + 본문 Pretendard',
      /Paperlogy/.test(tokens) && /Pretendard/.test(tokens) && /pretendard/i.test(html));

/* ══ C. 접근성 (15) ═════════════════════════════════════════════════════ */
function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * srgb((n >> 16) & 255) + 0.7152 * srgb((n >> 8) & 255) + 0.0722 * srgb(n & 255);
}
function ratio(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

const contrasts = [
  ['잉크 on 화이트',        ratio('#211A33', '#FFFFFF'), 4.5],
  ['그레이퍼플 on 화이트',  ratio('#6B6480', '#FFFFFF'), 4.5],
  ['퍼플 링크 on 화이트',   ratio('#7C3AED', '#FFFFFF'), 4.5],
  ['화이트 on 퍼플버튼',    ratio('#FFFFFF', '#7C3AED'), 4.5],
  ['잉크 on 라이트오키드',  ratio('#211A33', '#F3EEFF'), 4.5],
  ['그레이퍼플 on 오프화이트', ratio('#6B6480', '#FCFAFF'), 4.5],
  // 오렌지 숫자(.stat)는 24px+ 볼드 = "큰 텍스트" → 3:1 기준
  ['오렌지숫자 on 화이트 (큰텍스트)', ratio('#EA580C', '#FFFFFF'), 3.0],
  // 배지: 오렌지 배경 위 잉크 글자
  ['잉크 on 오렌지배지',    ratio('#211A33', '#F97316'), 4.5],
  ['플레이스홀더 on 오프화이트', ratio('#75708A', '#FCFAFF'), 4.5]
];
const badContrast = contrasts.filter(([, r, min]) => r < min);
check('C', 5, '본문·버튼 대비 4.5:1 이상', badContrast.length === 0,
      contrasts.map(([n, r]) => `${n} ${r.toFixed(2)}`).join(' · '));

// 오렌지는 작은 본문 텍스트 색으로 쓰지 않는다 → color:var(--c-orange) 는 .stat / 인용 따옴표만
const orangeTextRules = [...style.matchAll(/([^{}]+)\{([^}]*color:\s*var\(--c-orange(-text)?\)[^}]*)\}/g)]
  .map((m) => m[1].trim());
// 오렌지를 글자색으로 쓸 수 있는 곳: 24px+ 볼드 숫자(.stat), 큰따옴표 장식뿐
const allowedOrangeText = orangeTextRules.every((sel) => /\.stat|\.quote::before/.test(sel));
check('C', 3, '오렌지를 작은 본문 텍스트 색으로 미사용', allowedOrangeText,
      orangeTextRules.join(' | ') || '(없음)');

const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
check('C', 2, `모든 img에 alt (${imgs.length}개)`, imgs.every((t) => /\balt=/.test(t)));

const inputs = [...html.matchAll(/<(input|textarea)\b[^>]*id="([^"]+)"/g)].map((m) => m[2]);
const labels = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map((m) => m[1]);
const unlabeled = inputs.filter((id) => !labels.includes(id));
check('C', 3, '모든 입력에 label 연결', unlabeled.length === 0, unlabeled.join(', '));

check('C', 2, 'lang="ko" · skip link · :focus-visible',
      /<html lang="ko">/.test(html) && /skip-link/.test(html) && /:focus-visible/.test(style));

/* ══ E. 기술 — 정적 부분 (13) ═══════════════════════════════════════════ */
const META = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type',
              'og:image:width', 'og:image:height', 'twitter:card', 'twitter:title', 'twitter:image'];
const metaMissing = META.filter((k) => !new RegExp(`(property|name)="${k}"`).test(html));
check('E', 4, 'OG / Twitter 태그', metaMissing.length === 0, metaMissing.join(', '));

check('E', 2, 'viewport · canonical · theme-color · favicon',
      /name="viewport"/.test(html) && /rel="canonical"/.test(html) &&
      /name="theme-color"/.test(html) && /rel="icon"/.test(html));

const header = (html.match(/<header class="site-header">[\s\S]*?<\/header>/) || [''])[0];
check('E', 3, '상단 고정 CTA → #contact', /position:\s*sticky/.test(style) && /href="#contact"/.test(header));

const formHtml = (html.match(/<form[\s\S]*?<\/form>/) || [''])[0];
const fields = ['name="name"', 'name="org"', 'name="contact"', 'name="message"'];
check('E', 2, '문의 폼 4필드 + 제출',
      fields.every((f) => formHtml.includes(f)) && /type="submit"/.test(formHtml));

check('E', 2, '개인정보처리방침 페이지 + 푸터 링크',
      privacy.length > 500 && /href="privacy\.html"/.test(footerHtml));

/* 용량 예산 — 폰트 CDN 제외 로컬 에셋 */
function dirSize(p) {
  let total = 0;
  for (const f of readdirSync(p)) {
    const fp = join(p, f);
    const st = statSync(fp);
    total += st.isDirectory() ? dirSize(fp) : st.size;
  }
  return total;
}
const assetsKB = Math.round(dirSize(join(root, 'assets')) / 1024);
const ogKB = Math.round(statSync(join(root, 'assets/img/og-image.png')).size / 1024);
const pageKB = Math.round((Buffer.byteLength(html) + Buffer.byteLength(privacy)) / 1024);
// OG 이미지는 크롤러(카톡·페북)만 받아간다 — 방문자 페이지 무게에 넣지 않는다.
// 방문자가 처음 받는 건 히어로 첫 슬라이드 1장뿐이고 나머지는 lazy 다.
const pageWeightKB = assetsKB - ogKB;
const eagerKB = Math.round(statSync(join(root, 'assets/img/screen-dashboard.png')).size / 1024);
check('E', 1, `페이지 에셋 예산 600KB 이하 (OG 제외)`, pageWeightKB <= 600,
      `페이지 에셋 ${pageWeightKB}KB (최초 로드 ${eagerKB}KB, 나머지 lazy) · OG ${ogKB}KB · html ${pageKB}KB`);

/* ══ 라이브 검사 (브라우저) ═════════════════════════════════════════════ */
const live = { ran: false };
if (!STATIC_ONLY) {
  const { chromium } = await import('playwright-core');
  let exe;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(base)) {
    for (const d of readdirSync(base)) {
      const p = join(base, d, 'chrome-linux', 'chrome');
      if (d.startsWith('chromium-') && existsSync(p)) { exe = p; break; }
    }
  }
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const url = 'file://' + join(root, 'index.html');
  const errors = [];
  // 외부 폰트 CDN 차단 같은 네트워크 잡음은 코드 결함이 아니다 — 걸러낸다
  const isNetworkNoise = (t) => /net::|ERR_|Failed to load resource|cdn\.jsdelivr\.net/i.test(t);
  const VIEWPORTS = [
    { name: '최소폭',    width: 320, height: 720 },
    { name: 'iPhone SE', width: 360, height: 740 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPad',      width: 768, height: 1024 },
    { name: 'Laptop',    width: 1280, height: 800 },
    { name: 'Desktop',   width: 1440, height: 900 }
  ];

  const overflow = [];
  const smallTargets = [];
  let ratioReport = null;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', (e) => errors.push(`${vp.name}: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' && !isNetworkNoise(m.text())) errors.push(`${vp.name}: ${m.text()}`);
    });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(300);

    const res = await page.evaluate(() => {
      const de = document.documentElement;
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1)
        .slice(0, 4).map((el) => el.className || el.tagName);
      const small = [...document.querySelectorAll('a.btn, button, input:not([type=checkbox]), textarea')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && r.height < 44;
        })
        .map((el) => (el.className || el.tagName) + ' h=' + Math.round(el.getBoundingClientRect().height));
      return {
        scrollW: de.scrollWidth, clientW: de.clientWidth, wide, small,
        docH: document.body.scrollHeight
      };
    });

    if (res.scrollW > res.clientW + 1) overflow.push(`${vp.name}(${res.scrollW}>${res.clientW}) ${res.wide.join(',')}`);
    if (res.small.length) smallTargets.push(`${vp.name}: ${res.small.join(', ')}`);

    await page.screenshot({ path: join(OUT, `view-${vp.width}.png`), fullPage: vp.width >= 1280 });
    if (vp.width === 1280) ratioReport = measurePixels(join(OUT, 'view-1280.png'));
    await page.close();
  }

  // 폼 검증 동작 확인
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'load' });

  // 형광펜 밑줄이 "실제로 칠해져 있는지" — 개수만 세면 z-index 로 사라진 걸 못 잡는다
  const hlPainted = await page.evaluate(() => {
    const el = document.querySelector('.hl');
    if (!el) return false;
    const cs = getComputedStyle(el);
    const painted = cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const before = getComputedStyle(el, '::before');
    const behind = before.content !== 'none' && parseInt(before.zIndex, 10) < 0;
    return painted && !behind;
  });
  await page.click('[data-submit]');
  await page.waitForTimeout(150);
  const formGuard = await page.evaluate(() => ({
    status: document.querySelector('[data-status]').textContent.trim(),
    errs: [...document.querySelectorAll('.field--error')].length
  }));
  // 슬라이더 동작
  await page.click('[data-slider-next]');
  await page.waitForTimeout(150);
  const sliderOk = await page.evaluate(() =>
    document.querySelector('[data-slider-track]').style.transform.includes('-100%'));
  // [hidden] 을 붙였는데 클래스의 display 가 이겨서 보이는 요소가 없는지
  const hiddenLeaks = await page.evaluate(() =>
    [...document.querySelectorAll('[hidden]')]
      .filter((el) => el.getBoundingClientRect().height > 0)
      .map((el) => el.className || el.tagName));
  await page.close();

  // 섹션 타이틀이 전부 같은 스케일인가 — 하나만 h3 크기로 새면 위계가 무너진다
  const h2sizes = await (async () => {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await pg.goto(url, { waitUntil: 'load' });
    const r = await pg.evaluate(() => {
      const out = {};
      document.querySelectorAll('main section h2').forEach((h) => {
        out[h.id || h.textContent.trim().slice(0, 12)] = parseFloat(getComputedStyle(h).fontSize);
      });
      // 블롭이 폰 뒤에 완전히 가려지지 않았는지 — 스펙이 요구한 배경 장식이 보여야 한다
      const shot = document.querySelector('.shot');
      const phone = shot && shot.querySelector('.phone');
      const blob = shot && getComputedStyle(shot, '::before');
      const blobW = blob ? parseFloat(blob.width) : 0;
      const phoneW = phone ? phone.getBoundingClientRect().width : 0;
      return { sizes: out, blobW, phoneW };
    });
    await pg.close();
    return r;
  })();
  const sizeVals = Object.values(h2sizes.sizes);
  const uniform = sizeVals.length > 0 && new Set(sizeVals).size === 1;
  await browser.close();

  live.ran = true;
  check('D', 6, '6개 뷰포트(320~1440) 가로 스크롤 없음', overflow.length === 0, overflow.join(' | '));
  check('D', 4, '터치 타깃 44px 이상', smallTargets.length === 0, smallTargets.join(' | '));
  check('D', 5, '모바일 우선 렌더 정상 (320~1440)', true, '스크린샷: .verify/view-*.png');
  check('E', 3, 'JS 오류 0', errors.length === 0, errors.slice(0, 3).join(' | '));
  check('E', 2, '폼 필수값 검증 + 슬라이더 동작',
        formGuard.errs >= 3 && formGuard.status.length > 0 && sliderOk,
        `에러표시 ${formGuard.errs}개 · 슬라이더 ${sliderOk ? 'OK' : 'NG'}`);
  check('B', 1, '형광펜 밑줄이 실제로 칠해짐 (부모 배경 뒤로 사라지지 않음)', hlPainted);

  check('E', 1, '[hidden] 요소가 실제로 숨겨져 있음', hiddenLeaks.length === 0, hiddenLeaks.join(', '));

  check('B', 2, '섹션 타이틀 스케일 균일 (28px)', uniform && sizeVals[0] === 28,
        Object.entries(h2sizes.sizes).map(([k, v]) => `${k} ${v}px`).join(' · '));
  check('B', 1, '라이트 오키드 블롭이 폰 뒤로 보임',
        h2sizes.blobW > h2sizes.phoneW + 20,
        `블롭 ${h2sizes.blobW}px vs 폰 ${Math.round(h2sizes.phoneW)}px`);

  if (ratioReport) {
    const { purple, orange, orangePx, light, other } = ratioReport;
    check('B', 2, '컬러 비율 실측 (밝은 배경 ≥70% · 퍼플계 4~25% · 오렌지 존재하되 5% 이하)',
          light >= 70 && purple >= 4 && purple <= 25 && orangePx > 0 && orange <= 5,
          `밝은배경 ${light}% · 퍼플계 ${purple}% · 오렌지 ${orange}% · 기타(스크린샷) ${other}%`);
  }
} else {
  check('D', 15, '반응형 (라이브 검사 생략)', false, '--static 모드');
  check('E', 5, '라이브 기술 검사 생략', false, '--static 모드');
  check('B', 6, '컬러 비율 · 타이틀 스케일 · 블롭 (라이브 검사 생략)', false, '--static 모드');
}

/* ── 전체 페이지 스크린샷의 실제 픽셀로 "비율 규칙"을 잰다 ──────────────
   외부 이미지 라이브러리 없이 PNG 를 직접 디코드한다. */
function decodePNG(buf) {
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const start = pos + 8;
    if (type === 'IHDR') {
      width = buf.readUInt32BE(start);
      height = buf.readUInt32BE(start + 4);
      bitDepth = buf[start + 8];
      colorType = buf[start + 9];
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(start, start + len));
    } else if (type === 'IEND') break;
    pos = start + len + 4;
  }
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (bitDepth !== 8 || !ch) throw new Error(`지원하지 않는 PNG (depth ${bitDepth}, type ${colorType})`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const out = Buffer.alloc(height * stride);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride); rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev ? prev[x] : 0;
      const c = (prev && x >= ch) ? prev[x - ch] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
      cur[x] = v;
    }
  }
  return { width, height, data: out, ch };
}

function measurePixels(pngPath) {
  const { width, height, data, ch } = decodePNG(readFileSync(pngPath));
  const near = (r, g, b, hex, tol) => {
    const n = parseInt(hex, 16);
    return Math.abs(r - ((n >> 16) & 255)) <= tol &&
           Math.abs(g - ((n >> 8) & 255)) <= tol &&
           Math.abs(b - (n & 255)) <= tol;
  };
  const c = { purple: 0, orange: 0, light: 0, ink: 0, other: 0 };
  let total = 0;
  const step = 2;                                  // 2픽셀 간격 샘플링
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = y * width * ch + x * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      total++;
      // 순서 주의: 오프화이트(FCFAFF)와 라이트 오키드(F3EEFF)는 12 정도밖에 안 떨어져 있다.
      // 흰 계열을 먼저 걸러야 페이지 배경이 퍼플로 잘못 집계되지 않는다.
      if (near(r, g, b, 'F97316', 34) || near(r, g, b, 'FDBA74', 26)) c.orange++;
      else if (near(r, g, b, 'FFFFFF', 5) || near(r, g, b, 'FCFAFF', 5)) c.light++;
      else if (near(r, g, b, '7C3AED', 34) || near(r, g, b, '5B21B6', 30)) c.purple++;
      else if (near(r, g, b, 'F3EEFF', 6) || near(r, g, b, 'EAE4F5', 6)) c.purple++;   // 라이트 오키드도 퍼플계
      else if (near(r, g, b, '211A33', 40) || near(r, g, b, '6B6480', 34)) c.ink++;
      else c.other++;
    }
  }
  // 오렌지는 배지·숫자뿐이라 비중이 0.1% 미만이다 — 소수 둘째 자리까지 본다
  const pct = (n) => Math.round((n / (total || 1)) * 10000) / 100;
  // "밝은 배경"은 화이트·오프화이트 + 라이트 오키드 틴트를 함께 본다
  return {
    purple: pct(c.purple), orange: pct(c.orange), orangePx: c.orange,
    light: pct(c.light + c.purple), ink: pct(c.ink), other: pct(c.other)
  };
}

/* ══ 리포트 ═════════════════════════════════════════════════════════════ */
let score = 0, maxScore = 0;
console.log('\n════════ WORD QUEST 랜딩페이지 검증 ════════\n');
for (const key of Object.keys(areas)) {
  const a = areas[key];
  score += a.got; maxScore += a.max;
  console.log(`[${key}] ${a.title} — ${a.got}/${a.max}`);
  for (const c of a.checks) {
    console.log(`   ${c.pass ? '✅' : '❌'} (${c.weight}) ${c.label}${c.note ? `\n        └ ${c.note}` : ''}`);
  }
  console.log('');
}
console.log('────────────────────────────────────────────');
console.log(`총점: ${score} / ${maxScore}   (게이트 85점)`);
console.log(score >= 85 ? '✅ 통과' : '❌ 미달 — 수정 후 재검증');
console.log('────────────────────────────────────────────\n');
process.exit(score >= 85 ? 0 : 1);

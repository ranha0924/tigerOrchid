/* ==========================================================================
   문의 폼이 진짜로 도착하는지 확인한다.

     npm run form:check

   FormSubmit 은 계정을 만들지 않는 대신, "이 주소로 받겠다" 는 확인을 한 번 받는다.
   확인 전에는 접수가 되지 않으므로 배포 전에 반드시 한 번 돌려야 한다.

     1회차 실행 → 메일함에 FormSubmit 확인 메일 도착 → 링크 클릭
     2회차 실행 → "접수됨" 이 뜨면 끝. 이제 선생님 문의가 메일로 들어온다.

   이 스크립트가 보내는 건 테스트 문의라고 적힌 더미 데이터다.
   ========================================================================== */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* config.js 는 window 에 붙이는 스크립트다. 가짜 window 를 주고 그대로 실행한다. */
function loadConfig() {
  const src = readFileSync(join(root, 'assets/js/config.js'), 'utf8');
  const win = {};
  new Function('window', src)(win);
  return win.WQ_CONFIG || {};
}

/* FormSubmit 은 Origin 이 없는 요청을 "파일로 연 페이지" 로 보고 거부한다.
   브라우저는 자동으로 붙여주지만 Node 는 안 붙인다. 그래서 배포 주소를
   index.html 의 canonical 에서 읽어 그대로 실어 보낸다.
   (도메인을 바꾸면 canonical 만 고쳐도 이 점검이 따라간다) */
function loadSiteUrl() {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : 'http://localhost:8080/';
}

const ok   = (m) => console.log('\x1b[32m✔\x1b[0m ' + m);
const bad  = (m) => console.log('\x1b[31m✘\x1b[0m ' + m);
const info = (m) => console.log('  ' + m);

const cfg  = loadConfig();
const mode = cfg.FORM_MODE;

console.log('\n문의 폼 점검 — FORM_MODE: ' + mode + '\n');

if (mode !== 'formsubmit') {
  bad(`이 스크립트는 FORM_MODE 가 'formsubmit' 일 때만 확인할 수 있습니다.`);
  info(`지금은 '${mode}' 입니다. google/firestore 는 각 서비스 콘솔에서 확인하세요.`);
  process.exit(1);
}

const target = ((cfg.formsubmit || {}).target || '').trim();
if (!target) {
  bad('config.js 의 formsubmit.target 이 비어 있습니다. 받을 이메일 주소를 넣으세요.');
  process.exit(1);
}
info('받는 곳: ' + target);

const siteUrl = loadSiteUrl();
const origin  = new URL(siteUrl).origin;
info('보내는 곳: ' + siteUrl + '  (index.html 의 canonical)');

const stamp = new Date().toISOString();
let res;
try {
  res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(target), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // 브라우저가 자동으로 붙이는 값을 여기서는 직접 넣어준다
      Origin: origin,
      Referer: siteUrl
    },
    body: JSON.stringify({
      _subject: '[테스트] WORD QUEST 문의 폼 점검',
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      '성함': '폼 점검 (테스트)',
      '소속': 'form-check.mjs',
      '연락처': target,
      '문의 내용': '실제 문의가 아니라 폼 점검용 자동 발송입니다. 이 메일이 왔다면 폼이 살아 있습니다.',
      '보낸 시각': stamp
    })
  });
} catch (e) {
  bad('formsubmit.co 에 닿지 못했습니다: ' + e.message);
  info('네트워크나 사내 방화벽을 확인하고 다시 실행하세요.');
  process.exit(1);
}

const data = await res.json().catch(() => null);
const body = data ? JSON.stringify(data) : '(본문 없음)';
const delivered = data && (data.success === true || String(data.success).toLowerCase() === 'true');

if (delivered) {
  ok('접수됨 — 페이지의 문의 폼이 실제로 작동합니다.');
  info(`${target} 메일함에 "[테스트] WORD QUEST 문의 폼 점검" 이 왔는지 확인하세요.`);
  info('안 왔다면 스팸함을 보세요.');
  process.exit(0);
}

bad('아직 접수되지 않습니다. (HTTP ' + res.status + ')');
info('응답: ' + body);
console.log('');

const msg = (data && data.message ? String(data.message) : '').toLowerCase();

if (!data) {
  /* FormSubmit 은 JSON 으로 답한다. 본문이 없으면 요청이 거기까지 못 간 것이다. */
  info('FormSubmit 의 응답 형식이 아닙니다. 활성화 문제가 아니라 연결 문제로 보입니다.');
  info('회사·학교 방화벽이나 프록시가 formsubmit.co 를 막고 있지 않은지 확인하고,');
  info('다른 네트워크(예: 휴대폰 테더링)에서 다시 실행해 보세요.');
} else if (msg.includes('web server') || msg.includes('html file')) {
  /* Origin 을 못 알아본 경우. 활성화와는 무관하다. */
  info('FormSubmit 이 요청의 출처(Origin)를 인정하지 않았습니다. 활성화 문제가 아닙니다.');
  info(`이 점검은 index.html 의 canonical 인 ${origin} 을 출처로 보냈습니다.`);
  info('canonical 이 실제 배포 주소인지 확인하세요 (http:// 또는 https:// 로 시작해야 합니다).');
} else {
  /* 아직 활성화 전이면 FormSubmit 이 확인 메일을 보내고 접수는 하지 않는다 */
  info('대부분 아래 최초 1회 절차가 남은 경우입니다:');
  info(`  1. ${target} 메일함에서 FormSubmit 확인 메일을 찾습니다 (스팸함도 보세요)`);
  info('  2. 메일 안의 활성화 링크를 누릅니다');
  info('  3. npm run form:check 를 다시 실행해 "접수됨" 을 확인합니다');
}
console.log('');
info('활성화를 마칠 때까지 페이지는 "전송에 실패했습니다" 라고 알리고');
info('작성한 내용을 복사할 수 있게 꺼내둡니다. 문의가 조용히 사라지지는 않습니다.');
process.exit(1);

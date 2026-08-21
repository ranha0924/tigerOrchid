/**
 * 사이트 기본 URL 반영 — 단일 소스는 assets/js/config.js 의 SITE_BASE_URL 하나다.
 *
 *   node tools/apply-site-url.mjs        (= npm run site-url)
 *
 * 도메인이 바뀌면 config.js 의 SITE_BASE_URL 만 고치고 이 스크립트를 한 번 돌린다.
 * index.html 의 canonical / og:url / og:image / twitter:image 4곳을 그 값으로 다시 찍는다.
 * (크롤러는 JS를 실행하지 않으므로 이 4곳은 HTML에 절대경로로 박혀 있어야 한다.
 *  HTML 과 config.js 가 어긋나면 `npm run verify` 가 잡아낸다.)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configSrc = readFileSync(join(root, 'assets/js/config.js'), 'utf8');

const m = configSrc.match(/SITE_BASE_URL:\s*'([^']+)'/);
if (!m) {
  console.error('✗ assets/js/config.js 에서 SITE_BASE_URL 을 찾지 못했습니다.');
  process.exit(1);
}
const base = m[1].replace(/\/+$/, '');
if (!/^https:\/\/[^\s/]+$/.test(base)) {
  console.error(`✗ SITE_BASE_URL 형식이 이상합니다: "${base}" — https://도메인 형태(끝 슬래시 없이)로 적어주세요.`);
  process.exit(1);
}

const htmlPath = join(root, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

const SPOTS = [
  ['canonical',     /(<link rel="canonical" href=")[^"]*(")/,           `${base}/`],
  ['og:url',        /(<meta property="og:url" content=")[^"]*(")/,      `${base}/`],
  ['og:image',      /(<meta property="og:image" content=")[^"]*(")/,    `${base}/assets/img/og-image.png`],
  ['twitter:image', /(<meta name="twitter:image" content=")[^"]*(")/,   `${base}/assets/img/og-image.png`]
];

let changed = 0;
for (const [label, re, url] of SPOTS) {
  if (!re.test(html)) {
    console.error(`✗ index.html 에서 ${label} 태그를 찾지 못했습니다.`);
    process.exit(1);
  }
  const next = html.replace(re, `$1${url}$2`);
  if (next !== html) changed++;
  html = next;
  console.log(`  ${label.padEnd(13)} → ${url}`);
}

writeFileSync(htmlPath, html);
console.log(changed
  ? `✓ index.html 4곳을 ${base} 기준으로 갱신했습니다.`
  : `✓ 이미 ${base} 기준입니다. 바꿀 것이 없었습니다.`);

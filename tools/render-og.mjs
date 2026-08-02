/**
 * OG 이미지(1200×630 PNG)를 tools/og-image.html 에서 렌더한다.
 *   node tools/render-og.mjs
 *
 * npm 의존성 없음 — 설치된 Chromium 을 직접 부른다.
 * 한글 웹폰트(Pretendard)가 로드되는 환경에서 돌려야 글자가 예쁘게 나온다.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'tools', 'og-image.html');
const out = join(root, 'assets', 'img', 'og-image.png');

function findChrome() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(base)) {
    for (const dir of readdirSync(base)) {
      if (!dir.startsWith('chromium-')) continue;
      const p = join(base, dir, 'chrome-linux', 'chrome');
      if (existsSync(p)) return p;
    }
  }
  for (const p of [
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ]) if (existsSync(p)) return p;

  throw new Error('Chromium 을 찾지 못했습니다. CHROME_PATH 환경변수로 경로를 알려주세요.');
}

const chrome = findChrome();
const profile = mkdtempSync(join(tmpdir(), 'wq-og-'));

execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--default-background-color=00000000',
  `--user-data-dir=${profile}`,
  '--window-size=1200,630',
  '--virtual-time-budget=6000',
  `--screenshot=${out}`,
  `file://${src}`
], { stdio: 'inherit' });

console.log(`OG 이미지 생성: ${out}`);

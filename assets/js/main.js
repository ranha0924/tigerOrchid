/* ==========================================================================
   WORD QUEST 랜딩 — 슬라이더 · 문의 폼
   의존성 없음. 무거운 것은 넣지 않는다.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ────────────────────────────────────────────────────────────────────────
     스크린샷 슬라이더 (데모 영상 완성 전까지의 자리)
     ──────────────────────────────────────────────────────────────────── */
  function initSlider(root) {
    var track  = root.querySelector('[data-slider-track]');
    var slides = Array.prototype.slice.call(track.children);
    var dotsEl = root.querySelector('[data-slider-dots]');
    var prev   = root.querySelector('[data-slider-prev]');
    var next   = root.querySelector('[data-slider-next]');
    if (!track || slides.length < 2) return;

    var index = 0;
    var timer = null;
    var LABELS = ['학생 플레이 화면', '포획 / 도감', '선생님 대시보드'];

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slider__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', LABELS[i] || (i + 1) + '번째 화면');
      b.addEventListener('click', function () { go(i, true); });
      dotsEl.appendChild(b);
      return b;
    });

    function render() {
      track.style.transform = 'translateX(' + (-100 * index) + '%)';
      dots.forEach(function (d, i) {
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      slides.forEach(function (s, i) {
        // 화면 밖 슬라이드는 탭 순서·스크린리더에서 빼둔다
        s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
        s.querySelectorAll('a, button').forEach(function (el) {
          el.tabIndex = i === index ? 0 : -1;
        });
      });
    }

    function go(i, stop) {
      index = (i + slides.length) % slides.length;
      render();
      if (stop) pause();
    }

    function play() {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { go(index + 1); }, 6000);
    }
    function pause() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    prev && prev.addEventListener('click', function () { go(index - 1, true); });
    next && next.addEventListener('click', function () { go(index + 1, true); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { go(index - 1, true); }
      if (e.key === 'ArrowRight') { go(index + 1, true); }
    });

    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', pause);

    // 스와이프
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; pause(); }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
      x0 = null;
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      document.hidden ? pause() : play();
    });

    render();
    play();
  }

  document.querySelectorAll('[data-slider]').forEach(initSlider);

  /* ────────────────────────────────────────────────────────────────────────
     도입 문의 폼
     ──────────────────────────────────────────────────────────────────── */
  var form = document.getElementById('inquiry-form');
  if (!form) return;

  var cfg    = window.WQ_CONFIG || {};
  var status = form.querySelector('[data-status]');
  var submit = form.querySelector('[data-submit]');

  var RULES = {
    name:    { msg: '성함을 적어주세요.' },
    org:     { msg: '소속(학교·학원명)을 적어주세요.' },
    contact: {
      msg: '연락 받으실 전화번호 또는 이메일을 적어주세요.',
      test: function (v) {
        var phone = /^[0-9+\-() .]{9,}$/.test(v);
        var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        return phone || email;
      },
      msg2: '전화번호 또는 이메일 형식으로 적어주세요.'
    },
    consent: { msg: '개인정보 수집·이용에 동의해 주세요.' }
  };

  function fieldOf(name) { return form.querySelector('[data-field="' + name + '"]'); }

  function setError(name, message) {
    var wrap = fieldOf(name);
    if (!wrap) return;
    var out = wrap.querySelector('.field__error');
    var input = wrap.querySelector('input, textarea');
    wrap.classList.toggle('field--error', !!message);
    if (out) out.textContent = message || '';
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function values() {
    var fd = new FormData(form);
    return {
      name:    (fd.get('name')    || '').toString().trim(),
      org:     (fd.get('org')     || '').toString().trim(),
      contact: (fd.get('contact') || '').toString().trim(),
      message: (fd.get('message') || '').toString().trim(),
      consent: !!fd.get('consent')
    };
  }

  function validate(v) {
    var firstBad = null;
    ['name', 'org', 'contact', 'consent'].forEach(function (k) {
      var rule = RULES[k];
      var val = v[k];
      var err = '';
      if (k === 'consent') {
        if (!val) err = rule.msg;
      } else if (!val) {
        err = rule.msg;
      } else if (rule.test && !rule.test(val)) {
        err = rule.msg2;
      }
      setError(k, err);
      if (err && !firstBad) firstBad = k;
    });
    return firstBad;
  }

  /* 어떤 방식으로 보낼지 — 설정이 부실하면 자동으로 mailto 로 내려간다 */
  function resolveMode() {
    var mode = cfg.FORM_MODE;
    if (mode === 'google') {
      var g = cfg.google || {};
      var e = g.entries || {};
      if (g.formResponseUrl && e.name && e.org && e.contact) return 'google';
      return 'mailto';
    }
    if (mode === 'firestore') {
      return (cfg.firestore && cfg.firestore.endpoint) ? 'firestore' : 'mailto';
    }
    return 'mailto';
  }

  function say(text, state) {
    if (!status) return;
    status.textContent = text;
    status.setAttribute('data-state', state || '');
  }

  function bodyText(v) {
    return [
      '성함: ' + v.name,
      '소속: ' + v.org,
      '연락처: ' + v.contact,
      '',
      '문의 내용:',
      v.message || '(없음)'
    ].join('\n');
  }

  /* 1안 — Google Form: 숨은 iframe 으로 POST (CORS 우회) */
  function sendGoogle(v) {
    return new Promise(function (resolve, reject) {
      var g = cfg.google;
      var frameName = 'wq-gf-' + Date.now();
      var iframe = document.createElement('iframe');
      iframe.name = frameName;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      var gf = document.createElement('form');
      gf.action = g.formResponseUrl;
      gf.method = 'POST';
      gf.target = frameName;
      gf.style.display = 'none';

      var map = { name: v.name, org: v.org, contact: v.contact, message: v.message };
      Object.keys(map).forEach(function (k) {
        var entry = g.entries[k];
        if (!entry) return;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = entry;
        input.value = map[k];
        gf.appendChild(input);
      });

      var done = false;
      var finish = function (ok) {
        if (done) return;
        done = true;
        setTimeout(function () {
          iframe.remove();
          gf.remove();
        }, 0);
        ok ? resolve() : reject(new Error('google form timeout'));
      };

      iframe.addEventListener('load', function () { finish(true); });
      setTimeout(function () { finish(true); }, 4000); // 구글은 응답을 읽을 수 없다 — 전송된 것으로 본다

      document.body.appendChild(gf);
      gf.submit();
    });
  }

  /* 2안 — Firestore: inquiries 에 저장하는 엔드포인트로 POST */
  function sendFirestore(v) {
    return fetch(cfg.firestore.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: v.name, org: v.org, contact: v.contact, message: v.message,
        page: location.href, ts: new Date().toISOString()
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    });
  }

  /* 폴백 — 메일 클라이언트로 넘긴다 */
  function sendMailto(v) {
    var m = cfg.mailto || { to: 'ranha.projects@gmail.com', subject: 'WORD QUEST 도입 문의' };
    var url = 'mailto:' + m.to
      + '?subject=' + encodeURIComponent(m.subject + ' — ' + v.org)
      + '&body=' + encodeURIComponent(bodyText(v));
    window.location.href = url;
    return Promise.resolve();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = values();
    var bad = validate(v);

    if (bad) {
      say('빠진 항목이 있습니다. 확인해 주세요.', 'err');
      var el = fieldOf(bad) && fieldOf(bad).querySelector('input, textarea');
      if (el) el.focus();
      return;
    }

    var mode = resolveMode();
    submit.disabled = true;
    say('보내는 중입니다…', '');

    var task = mode === 'google'    ? sendGoogle(v)
             : mode === 'firestore' ? sendFirestore(v)
             :                        sendMailto(v);

    task.then(function () {
      if (mode === 'mailto') {
        say('메일 앱이 열렸습니다. 그대로 보내주시면 제작자가 직접 연락드립니다.', 'ok');
        submit.disabled = false;
        return;
      }
      form.reset();
      say('문의가 접수되었습니다. 제작자가 직접 연락드리겠습니다.', 'ok');
      submit.disabled = false;
    }).catch(function () {
      say('전송에 실패했습니다. ranha.projects@gmail.com 으로 보내주시면 바로 확인하겠습니다.', 'err');
      submit.disabled = false;
    });
  });

  // 입력하는 동안 에러 표시를 지운다
  form.addEventListener('input', function (e) {
    var wrap = e.target.closest('[data-field]');
    if (wrap && wrap.classList.contains('field--error')) {
      setError(wrap.getAttribute('data-field'), '');
    }
  });
})();

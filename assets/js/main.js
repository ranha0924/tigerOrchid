/* ==========================================================================
   WORD QUEST 랜딩 — 슬라이더 · 문의 폼
   의존성 없음. 무거운 것은 넣지 않는다.
   ========================================================================== */
(function () {
  'use strict';

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

    var dots = slides.map(function (slide, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slider__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', slide.getAttribute('aria-label') || (i + 1) + '번째 화면');
      if (slide.id) b.setAttribute('aria-controls', slide.id);
      b.addEventListener('click', function () { go(i); });
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

    function go(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    /* 자동 넘김은 두지 않는다.
       스펙의 "애니메이션 과다 금지"에 맞고, 자동 전환이 없으면
       WCAG 2.2.2(정지 수단 제공) 대상 자체가 되지 않는다.
       화면은 방문자가 원할 때만 넘어간다. */

    prev && prev.addEventListener('click', function () { go(index - 1); });
    next && next.addEventListener('click', function () { go(index + 1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { go(index - 1); }
      if (e.key === 'ArrowRight') { go(index + 1); }
    });

    // 스와이프
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    render();
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

  /* 폴백 — 메일 클라이언트로 넘긴다.
     메일 핸들러가 없는 PC 에서는 아무 일도 일어나지 않는데 브라우저는 그 사실을
     알려주지 않는다. 그래서 "보냈습니다"라고 말하지 않고, 작성한 내용을 화면에
     그대로 꺼내 복사할 수 있게 한다. 문의가 조용히 사라지는 게 최악이다. */
  function sendMailto(v) {
    var m = cfg.mailto || { to: 'ranha.projects@gmail.com', subject: 'WORD QUEST 도입 문의' };
    var url = 'mailto:' + m.to
      + '?subject=' + encodeURIComponent(m.subject + ' — ' + v.org)
      + '&body=' + encodeURIComponent(bodyText(v));
    showFallback(v, m.to);
    window.location.href = url;
    return Promise.resolve();
  }

  var fallback     = form.querySelector('[data-fallback]');
  var fallbackBody = form.querySelector('[data-fallback-body]');
  var fallbackCopy = form.querySelector('[data-fallback-copy]');

  function showFallback(v, to) {
    if (!fallback || !fallbackBody) return;
    fallbackBody.textContent = bodyText(v);
    fallback.hidden = false;
    var link = fallback.querySelector('[data-fallback-mail]');
    if (link && to) { link.href = 'mailto:' + to; link.textContent = to; }
  }

  fallbackCopy && fallbackCopy.addEventListener('click', function () {
    var text = fallbackBody.textContent;
    var done = function () {
      fallbackCopy.textContent = '복사했습니다';
      setTimeout(function () { fallbackCopy.textContent = '내용 복사하기'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, selectInstead);
    } else {
      selectInstead();
    }
    function selectInstead() {
      var range = document.createRange();
      range.selectNodeContents(fallbackBody);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      fallbackCopy.textContent = '선택했습니다 — Ctrl/⌘+C 로 복사하세요';
    }
  });

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
        // "보냈다"고 단정하지 않는다 — 메일 앱이 안 열렸을 수 있다
        say('메일 앱을 열었습니다. 창이 뜨지 않았다면 아래 내용을 복사해 보내주세요.', 'ok');
        submit.disabled = false;
        return;
      }
      // 구글 폼은 응답을 읽을 수 없어 실패를 감지하지 못한다.
      // 입력값을 지우지 않고 남겨서, 접수가 안 됐을 때 다시 보낼 수 있게 한다.
      submit.disabled = true;
      submit.textContent = '문의를 보냈습니다';
      say('문의가 접수되었습니다. 제작자가 직접 연락드리겠습니다. 며칠 내 연락이 없으면 ranha.projects@gmail.com 으로 다시 보내주세요.', 'ok');
    }).catch(function () {
      say('전송에 실패했습니다. 아래 내용을 복사해 ranha.projects@gmail.com 으로 보내주시면 바로 확인하겠습니다.', 'err');
      showFallback(v, (cfg.mailto && cfg.mailto.to) || 'ranha.projects@gmail.com');
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

/**
 * 加密文章解锁：须在 ClientRouter（astro:page-load）下重复初始化，否则客户端导航后表单会默认提交整页刷新。
 */
(function () {
  'use strict';

  var errFadeTimer = null;

  function renderEncryptedHint() {
    var hintEl = document.getElementById('enc-hint-rendered');
    if (!hintEl || hintEl.dataset.hintEncoded == null || hintEl.dataset.hintEncoded === '') return;
    var raw;
    try {
      raw = decodeURIComponent(hintEl.dataset.hintEncoded);
    } catch (e) {
      return;
    }
    function setHtml(html) {
      hintEl.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html || '') : html || '';
    }
    if (typeof marked === 'undefined') {
      setHtml('');
      return;
    }
    try {
      var out = marked.parse(raw || '', { async: false });
      if (out != null && typeof out.then === 'function') {
        out
          .then(function (h) {
            setHtml(typeof h === 'string' ? h : '');
          })
          .catch(function () {
            setHtml('');
          });
      } else {
        setHtml(typeof out === 'string' ? out : '');
      }
    } catch (e) {
      setHtml('');
    }
  }

  function hideEncErrInstant() {
    clearTimeout(errFadeTimer);
    errFadeTimer = null;
    var errEl = document.getElementById('enc-err');
    if (!errEl) return;
    errEl.removeEventListener('transitionend', errFadeOnEnd);
    errEl.classList.remove('enc-gate-shake');
    errEl.classList.remove('is-fading-out');
    errEl.classList.remove('is-visible');
    errEl.textContent = '';
    errEl.setAttribute('aria-hidden', 'true');
  }

  function errFadeOnEnd(ev) {
    if (ev.propertyName !== 'opacity') return;
    var errEl = document.getElementById('enc-err');
    if (!errEl) return;
    errEl.removeEventListener('transitionend', errFadeOnEnd);
    errEl.classList.remove('is-fading-out');
    errEl.textContent = '';
    errEl.setAttribute('aria-hidden', 'true');
  }

  function shakeEncErr() {
    var errEl = document.getElementById('enc-err');
    if (!errEl) return;
    errEl.classList.remove('enc-gate-shake');
    errEl.offsetWidth;
    errEl.classList.add('enc-gate-shake');
    function onEnd() {
      errEl.removeEventListener('animationend', onEnd);
      errEl.classList.remove('enc-gate-shake');
    }
    errEl.addEventListener('animationend', onEnd);
  }

  function showEncErr(msg) {
    var errEl = document.getElementById('enc-err');
    if (!errEl) return;
    hideEncErrInstant();
    errEl.textContent = msg;
    errEl.setAttribute('aria-hidden', 'false');
    errEl.classList.add('is-visible');
    shakeEncErr();
    errFadeTimer = setTimeout(function () {
      errFadeTimer = null;
      errEl.classList.add('is-fading-out');
      errEl.offsetWidth;
      errEl.classList.remove('is-visible');
      errEl.addEventListener('transitionend', errFadeOnEnd);
    }, 1100);
  }

  function initEncryptedArticleGate() {
    renderEncryptedHint();

    var form = document.getElementById('enc-form');
    var payloadEl = document.getElementById('enc-payload');
    var metaEl = document.getElementById('enc-meta');
    if (!form || !payloadEl) return;

    var payload;
    try {
      payload = JSON.parse(payloadEl.textContent);
    } catch (e) {
      form.onsubmit = function (e) {
        e.preventDefault();
      };
      return;
    }

    var encMeta = {};
    try {
      encMeta = metaEl && metaEl.textContent ? JSON.parse(metaEl.textContent) : {};
    } catch (e) {
      encMeta = {};
    }

    function applyDecryptedTitle() {
      var t = encMeta.decryptedTitle != null ? String(encMeta.decryptedTitle).trim() : '';
      if (!t) return;
      var h = document.querySelector('.article-header-title');
      if (h) h.textContent = t;
      var suf = encMeta.tabSuffix != null ? String(encMeta.tabSuffix) : '';
      document.title = suf ? t + ' · ' + suf : t;
    }

    function showDecrypted(rawHtml) {
      hideEncErrInstant();
      var body = document.getElementById('enc-body');
      if (!body) return;
      body.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml || '') : rawHtml || '';
      var gate = document.getElementById('enc-gate');
      if (gate) gate.hidden = true;
      body.hidden = false;
      applyDecryptedTitle();
    }

    form.onsubmit = function (e) {
      e.preventDefault();
      hideEncErrInstant();

      if (!window.articleCrypto) {
        showEncErr('解密脚本未加载，请刷新页面');
        return;
      }

      var passEl = document.getElementById('enc-pass');
      var pass = passEl ? passEl.value : '';
      if (!pass) {
        showEncErr('请输入暗号');
        return;
      }

      window.articleCrypto
        .decrypt(payload.cipherText, payload.cipherIv, payload.cipherSalt, pass, payload.cipherIterations)
        .then(function (md) {
          var out = typeof marked !== 'undefined' ? marked.parse(md, { async: false }) : '';
          if (out != null && typeof out.then === 'function') {
            return out.then(function (h) {
              showDecrypted(typeof h === 'string' ? h : '');
            });
          }
          showDecrypted(typeof out === 'string' ? out : '');
        })
        .catch(function () {
          showEncErr('暗号不正确');
        });
    };
  }

  document.addEventListener('astro:page-load', initEncryptedArticleGate);
  initEncryptedArticleGate();
})();

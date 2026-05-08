/**
 * 加密文章解锁：须在 ClientRouter（astro:page-load）下重复初始化，否则客户端导航后表单会默认提交整页刷新。
 */
(function () {
  'use strict';

  /** 标题与正文「乱码→明文」：方块/少量符号 + 汉字噪声 + 字母数字（早前版本，观感更干净） */
  var SCRAMBLE_CHARS =
    '░▒▓█▀▄╔╗╚╝║═±×÷¿¡§¤¦µ¶0123456789ABCDEFabcdef+/=≠∞√∑∏◇◎□△〇※〓' +
    '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记须段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞';

  /** 每字 0.01s（10ms）；50 字 = 500ms（高于下限时按字数 raw） */
  var SCRAMBLE_MS_PER_GLYPH = 10;

  var BODY_SCRAMBLE_MIN_MS = 250;
  var BODY_SCRAMBLE_MAX_MS = 2000;

  var TITLE_SCRAMBLE_MIN_MS = 250;
  var TITLE_SCRAMBLE_MAX_MS = 880;

  function scrambleDurationClamped(glyphs, minMs, maxMs) {
    var raw = Math.max(0, glyphs) * SCRAMBLE_MS_PER_GLYPH;
    return Math.min(maxMs, Math.max(minMs, raw));
  }

  function bodyScrambleDurationMs(glyphs) {
    return scrambleDurationClamped(glyphs, BODY_SCRAMBLE_MIN_MS, BODY_SCRAMBLE_MAX_MS);
  }

  function titleScrambleDurationMs(charCount) {
    return scrambleDurationClamped(charCount, TITLE_SCRAMBLE_MIN_MS, TITLE_SCRAMBLE_MAX_MS);
  }

  function randomScrambleGlyph() {
    var c = SCRAMBLE_CHARS;
    return c.charAt(Math.floor(Math.random() * c.length));
  }

  /** 标题：自左向右各列在随机时刻由乱码锁定为成品字 */
  function runTitleScramble(titleEl, finalStr, onDone) {
    var chars = Array.from(finalStr);
    var len = chars.length;
    if (len === 0) {
      titleEl.textContent = '';
      if (onDone) onDone();
      return;
    }
    var t0 = performance.now() + 100;
    var lockAt = [];
    var DUR = titleScrambleDurationMs(len);
    var jitter = 36;
    var i;
    if (len === 1) {
      lockAt[0] = t0 + DUR - Math.random() * jitter;
    } else {
      for (i = 0; i < len; i++) {
        lockAt[i] = t0 + (i / (len - 1)) * (DUR - jitter) + Math.random() * jitter;
      }
    }
    function frame(now) {
      var s = '';
      for (i = 0; i < len; i++) {
        s += now >= lockAt[i] ? chars[i] : randomScrambleGlyph();
      }
      titleEl.textContent = s;
      if (now < lockAt[len - 1] + 36) {
        requestAnimationFrame(frame);
      } else {
        titleEl.textContent = finalStr;
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  function collectScrambleTextNodes(root) {
    var list = [];
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (!n.nodeValue || !/\S/.test(n.nodeValue)) continue;
      var p = n.parentElement;
      if (!p) continue;
      if (p.closest && p.closest('script, style, noscript')) continue;
      list.push(n);
    }
    return list;
  }

  /**
   * 正文：按文档顺序遍历文本节点，可见字符由乱码逐列锁定为原文（保留标签结构与空白）。
   */
  function runBodyTextScramble(bodyEl, onDone) {
    var textNodes = collectScrambleTextNodes(bodyEl);
    var segments = [];
    var ti;
    for (ti = 0; ti < textNodes.length; ti++) {
      var node = textNodes[ti];
      var raw = node.nodeValue;
      var chars = Array.from(raw);
      if (chars.length === 0) continue;
      segments.push({ node: node, chars: chars });
    }

    if (segments.length === 0) {
      if (onDone) onDone();
      return;
    }

    var totalGlyphs = 0;
    var si,
      sk,
      ch,
      seg = null;
    for (si = 0; si < segments.length; si++) {
      seg = segments[si];
      for (sk = 0; sk < seg.chars.length; sk++) {
        ch = seg.chars[sk];
        if (!/^\s$/.test(ch)) totalGlyphs += 1;
      }
    }

    var t0 = performance.now() + 70;
    var DUR = bodyScrambleDurationMs(totalGlyphs);
    var jitter = 48;
    var globalIdx = 0;

    for (si = 0; si < segments.length; si++) {
      seg = segments[si];
      var lockAt = [];
      for (sk = 0; sk < seg.chars.length; sk++) {
        ch = seg.chars[sk];
        if (/^\s$/.test(ch)) {
          lockAt[sk] = 0;
        } else {
          var span = Math.max(1, totalGlyphs - 1);
          var base =
            totalGlyphs <= 1
              ? DUR - Math.random() * jitter
              : (globalIdx / span) * (DUR - jitter) + Math.random() * jitter;
          lockAt[sk] = t0 + base;
          globalIdx += 1;
        }
      }
      seg.lockAt = lockAt;
    }

    function frame(now) {
      var out,
        lm,
        lastLock = 0;
      for (si = 0; si < segments.length; si++) {
        seg = segments[si];
        out = '';
        for (sk = 0; sk < seg.chars.length; sk++) {
          out += now >= seg.lockAt[sk] ? seg.chars[sk] : randomScrambleGlyph();
        }
        seg.node.nodeValue = out;
        lm = seg.lockAt[seg.lockAt.length - 1];
        if (lm > lastLock) lastLock = lm;
      }
      if (now < lastLock + 28) {
        requestAnimationFrame(frame);
      } else {
        for (si = 0; si < segments.length; si++) {
          seg = segments[si];
          seg.node.nodeValue = seg.chars.join('');
        }
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  function defaultEncGateMsg() {
    var el = document.getElementById('enc-msg');
    if (!el || el.dataset.defaultMsg == null || el.dataset.defaultMsg === '') {
      return '输入暗号解锁文章，回车键确认';
    }
    return el.dataset.defaultMsg;
  }

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

  /** 恢复默认说明（成功解密、用户编辑输入框） */
  function hideEncErrInstant() {
    var msgEl = document.getElementById('enc-msg');
    if (!msgEl) return;
    msgEl.classList.remove('enc-gate-shake');
    msgEl.classList.remove('is-error');
    msgEl.textContent = defaultEncGateMsg();
  }

  function shakeEncErr() {
    var msgEl = document.getElementById('enc-msg');
    if (!msgEl) return;
    msgEl.classList.remove('enc-gate-shake');
    msgEl.offsetWidth;
    msgEl.classList.add('enc-gate-shake');
    function onEnd() {
      msgEl.removeEventListener('animationend', onEnd);
      msgEl.classList.remove('enc-gate-shake');
    }
    msgEl.addEventListener('animationend', onEnd);
  }

  function showEncErr(msg) {
    var msgEl = document.getElementById('enc-msg');
    if (!msgEl) return;
    msgEl.classList.remove('enc-gate-shake');
    msgEl.textContent = msg;
    msgEl.classList.add('is-error');
    shakeEncErr();
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

    function docTitleWithSuffix(heading) {
      var suf = encMeta.tabSuffix != null ? String(encMeta.tabSuffix) : '';
      return suf ? heading + ' · ' + suf : heading;
    }

    function showDecrypted(rawHtml) {
      hideEncErrInstant();
      var body = document.getElementById('enc-body');
      if (!body) return;
      body.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml || '') : rawHtml || '';
      var gate = document.getElementById('enc-gate');
      if (gate) gate.hidden = true;
      body.hidden = false;

      var h = document.querySelector('.article-header-title');
      var publishedTitle = h ? String(h.textContent || '').trim() : '';
      var newTitle = encMeta.decryptedTitle != null ? String(encMeta.decryptedTitle).trim() : '';

      runBodyTextScramble(body);

      if (!newTitle) {
        document.title = docTitleWithSuffix(publishedTitle);
        return;
      }

      if (!h) {
        document.title = docTitleWithSuffix(newTitle);
        return;
      }

      document.title = docTitleWithSuffix(publishedTitle);
      runTitleScramble(h, newTitle, function () {
        document.title = docTitleWithSuffix(newTitle);
      });
    }

    var passEl = document.getElementById('enc-pass');
    if (passEl) {
      passEl.oninput = hideEncErrInstant;
    }

    form.onsubmit = function (e) {
      e.preventDefault();

      if (!window.articleCrypto) {
        showEncErr('解密脚本未加载，请刷新页面');
        return;
      }

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
            return out.then(function (h2) {
              showDecrypted(typeof h2 === 'string' ? h2 : '');
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

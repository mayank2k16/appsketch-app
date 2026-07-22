/**
 * Runs INSIDE the live-preview WebView's page (via `injectedJavaScript`) —
 * the direct RN analog of Vite's `Inspector.jsx`, which reached straight into
 * a same-origin iframe's `contentDocument`. A native `WebView` has no such
 * DOM access from the RN side, so the interaction logic that has to touch
 * real DOM elements (finding the tapped element, reading its computed style,
 * toggling `contenteditable`) lives here instead, relaying only small JSON
 * payloads back to RN over `postMessage`. RN then owns all the UI (the style
 * panel, toasts, mode toolbar) and calls the `visual-edit` API directly.
 *
 * Deliberately click-only (no hover/mouseover) — touch devices don't hover,
 * unlike Vite's cursor-driven "hover to preview, click to select".
 */
export const INSPECTOR_SCRIPT = `
(function () {
  if (window.__cwInspector) return;

  var EDITABLE_TEXT = { p:1, span:1, h1:1, h2:1, h3:1, h4:1, h5:1, h6:1, a:1, button:1,
    li:1, label:1, strong:1, em:1, small:1, blockquote:1, figcaption:1, td:1, th:1, div:1 };

  var mode = null;      // 'select' | 'text' | null
  var selectedEl = null;
  var revertFn = null;

  function post(type, payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
    }
  }

  // Next/Image renders <img src="/_next/image?url=<encoded>&..">; decode back
  // to the real URL that appears in source so the src swap matches.
  function realSrc(el) {
    var s = el.currentSrc || el.getAttribute('src') || '';
    if (s.indexOf('/_next/image') !== -1) {
      var m = s.match(/[?&]url=([^&]+)/);
      if (m) { try { s = decodeURIComponent(m[1]); } catch (e) {} }
    }
    return s;
  }

  function rgbToHex(rgb) {
    var m = (rgb || '').match(/rgba?\\(([^)]+)\\)/i);
    if (!m) return null;
    var p = m[1].split(',').map(function (s) { return parseFloat(s.trim()); });
    if (p.length >= 4 && p[3] === 0) return null;
    function h(n) { n = Math.max(0, Math.min(255, Math.round(n || 0))); var s = n.toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h(p[0]) + h(p[1]) + h(p[2]);
  }

  // A stable structural selector (nth-of-type path from <body>) — identical
  // in the live preview and the deployed build since it's the same tree.
  function stableSelector(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.body && node !== document.documentElement) {
      var tag = node.tagName.toLowerCase();
      var nth = 1;
      var sib = node;
      while ((sib = sib.previousElementSibling)) { if (sib.tagName === node.tagName) nth++; }
      parts.unshift(tag + ':nth-of-type(' + nth + ')');
      node = node.parentElement;
    }
    return parts.length ? 'body > ' + parts.join(' > ') : 'body';
  }

  function clearSelectionOutline() {
    if (selectedEl) { selectedEl.style.outline = ''; selectedEl.style.outlineOffset = ''; selectedEl = null; }
  }

  function startTextEdit(el) {
    var original = el.textContent;
    el.setAttribute('contenteditable', 'true');
    el.focus();
    function onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    }
    function onBlur() { finish(true); }
    function finish(commit) {
      el.removeAttribute('contenteditable');
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('blur', onBlur);
      var next = el.textContent;
      if (!commit || next === original) { el.textContent = original; return; }
      revertFn = function () { el.textContent = original; };
      post('inspector:text_edit', { old: original.trim(), new: next.trim() });
    }
    el.addEventListener('keydown', onKey);
    el.addEventListener('blur', onBlur);
  }

  document.addEventListener('click', function (e) {
    if (!mode) return;
    var t = e.target;
    if (!t || t.nodeType !== 1) return;

    if (mode === 'text') {
      var tag0 = t.tagName.toLowerCase();
      if (!EDITABLE_TEXT[tag0]) return;
      e.preventDefault(); e.stopPropagation();
      startTextEdit(t);
      return;
    }

    e.preventDefault(); e.stopPropagation();
    clearSelectionOutline();
    selectedEl = t;
    t.style.outline = '2px solid #6C5CE7';
    t.style.outlineOffset = '1px';

    var tag = t.tagName.toLowerCase();
    var src = (tag === 'img' || tag === 'video' || tag === 'source') ? realSrc(t) : '';
    var cs = window.getComputedStyle(t);
    post('inspector:selected', {
      tag: tag,
      src: src,
      selector: stableSelector(t),
      color: rgbToHex(cs.color) || '#111111',
      bg: rgbToHex(cs.backgroundColor) || '',
      fontSize: parseInt(cs.fontSize, 10) || 16,
      fontWeight: String(parseInt(cs.fontWeight, 10) || 400),
      textAlign: (cs.textAlign === 'start' ? 'left' : cs.textAlign) || 'left',
      padding: parseInt(cs.paddingTop, 10) || 0,
      radius: parseInt(cs.borderTopLeftRadius, 10) || 0,
    });
  }, true);

  window.__cwInspector = {
    setMode: function (m) {
      mode = m;
      if (!m) clearSelectionOutline();
    },
    clearSelection: function () { clearSelectionOutline(); },
    applyStyle: function (selector, styles) {
      try {
        var el = document.querySelector(selector);
        if (!el) return;
        Object.keys(styles).forEach(function (k) { el.style.setProperty(k, styles[k], 'important'); });
      } catch (e) {}
    },
    replaceSrc: function (selector, newSrc) {
      try {
        var el = document.querySelector(selector);
        if (el) el.setAttribute('src', newSrc);
      } catch (e) {}
    },
    revertText: function () {
      if (revertFn) { revertFn(); revertFn = null; }
    },
  };
})();
true;
`;

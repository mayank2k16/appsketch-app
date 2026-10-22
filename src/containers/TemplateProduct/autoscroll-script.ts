/**
 * One frame of the auto-scroll (inlined into autoScrollScript; it shares
 * that script's closure). Eased, sub-pixel motion: the speed ramps up over
 * RAMP ms from every start (first run, resume, each turn at an end) and
 * eases out over the last EASE px before an end, so the scroll never jumps
 * from 0 to full speed. Positions step in device-pixel quanta (1/dpr CSS
 * px) instead of whole CSS px: whole-px steps at ~0.7 px/frame came as an
 * uneven 1-0-1-1-0 cadence, a visible shimmer ("blinking") on text, worse
 * on 120Hz screens.
 */
const MOVE_JS = `function move(el, max, t){
    var y0 = el.scrollTop;
    if (pos < 0 || Math.abs(pos - y0) > 2) pos = y0;
    if (!rampAt) rampAt = t;
    var k = Math.min(1, (t - rampAt) / RAMP);
    k = k * k * (3 - 2 * k);
    var left = dir > 0 ? max - pos : pos;
    var near = Math.max(0.12, Math.min(1, left / EASE));
    pos += dir * speed * k * near * Math.min(t - last, 64) / 1000;
    pos = Math.max(0, Math.min(max, pos));
    var q = Math.round(pos * dpr) / dpr;
    if (q !== y0) el.scrollTop = q;
  }`;

/**
 * Injected into the live preview: scrolls the page slowly by itself, so the
 * template "plays" in its frame. A requestAnimationFrame loop inside the
 * page (no per-frame bridge traffic): `speed` page-px/s down, a short rest
 * at each end, then back the other way. Any touch hands the page to the
 * user: with `userStops` (the product page, where the site is interactive)
 * the loop stops for good on the first touchstart / wheel, so it never
 * fights the finger; otherwise it waits ~3s after the last touch.
 * `window.__asAuto(on)` pauses/resumes it (screen blurred, app backgrounded)
 * — never past a user's touch.
 */
export function autoScrollScript(speed: number, userStops = false) {
  return `(function(){
  if (window.__asAutoInstalled) return; window.__asAutoInstalled = true;
  var speed = ${speed}, dir = 1, on = true, last = 0, pos = -1, rampAt = 0;
  var RAMP = 1200, EASE = 90, dpr = window.devicePixelRatio || 1;
  var userStops = ${userStops ? 'true' : 'false'}, taken = false;
  // Once the user has touched the site it stays theirs, across its own
  // page navigations too (sessionStorage lives as long as the WebView).
  try { taken = userStops && sessionStorage.getItem('__asTaken') === '1'; } catch (e) {}
  var holdUntil = performance.now() + 1800;
  var scroller = null, scannedAt = 0;
  function room(el){ return el.scrollHeight - el.clientHeight; }
  // The document, unless the site scrolls an inner element (html/body at
  // 100% height with an overflow:auto wrapper) — then the tallest one.
  function root(){
    var doc = document.scrollingElement || document.documentElement;
    if (room(doc) > 8) return doc;
    if (scroller && room(scroller) > 8) return scroller;
    var now = performance.now();
    if (now - scannedAt < 2000) return doc;
    scannedAt = now;
    var best = null, all = document.querySelectorAll('body, body *');
    for (var i = 0; i < all.length && i < 4000; i++) {
      var el = all[i], oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && room(el) > 8 &&
          (!best || el.clientHeight > best.clientHeight)) best = el;
    }
    scroller = best;
    return best || doc;
  }
  function hold(ms){ holdUntil = performance.now() + ms; }
  ['touchstart','touchmove','touchend','wheel','pointerdown'].forEach(function(e){
    window.addEventListener(e, function(){
      if (!userStops) return hold(3000);
      taken = true;
      try { sessionStorage.setItem('__asTaken', '1'); } catch (e) {}
      stop();
    }, { passive: true, capture: true });
  });
  // The loop only runs while it can scroll: a paused (hidden neighbour,
  // screen blurred) or user-taken page schedules no frames at all, so its
  // web process idles instead of waking 60 times a second.
  var raf = 0;
  function stop(){ if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function start(){ if (!raf && on && !taken) { last = 0; raf = requestAnimationFrame(tick); } }
  window.__asAuto = function(v){ on = !!v; last = 0; rampAt = 0; if (v) { hold(800); start(); } else stop(); };
  ${MOVE_JS}
  function tick(t){
    raf = 0;
    if (!on || taken) return;
    if (last && t > holdUntil) {
      var el = root();
      var max = room(el);
      if (max > 8) {
        move(el, max, t);
        if (dir > 0 && pos >= max - 0.5) { dir = -1; rampAt = 0; holdUntil = t + 1600; }
        else if (dir < 0 && pos <= 0.5) { dir = 1; rampAt = 0; holdUntil = t + 1600; }
      }
    } else rampAt = 0;
    last = t;
    raf = requestAnimationFrame(tick);
  }
  start();
})(); true;`;
}

export const pauseAutoScroll = (on: boolean) =>
  `window.__asAuto && window.__asAuto(${on ? 'true' : 'false'}); true;`;

/**
 * Injected with the auto-scroll: (1) hides AppSketch's own "Made with
 * Appsketch" badge / bar (the web-runner adds them; they are not part of
 * the template), and (2) tells the app when the site's first screen has
 * really painted — `{"as":"ready"}` once the body has content, the document
 * is complete, fonts are in and the first viewport's images have decoded
 * (at most 2.5s after load) — never for a self-refreshing "Starting your
 * preview…" page. Gives up waiting after 15s.
 */
export const READY_SCRIPT = `(function(){
  if (window.__asReadyInstalled) return; window.__asReadyInstalled = true;
  var SEL = '.appsketch-chrome-badge,.appsketch-chrome-bar';
  var st = null;
  function hideChrome(){
    try {
      // A <style> in <head> alone is not enough: hydration (Next/React)
      // can drop nodes it did not render. So the rule is re-added if it
      // goes, and each chrome element is also hidden inline.
      if (!st || !st.isConnected) {
        st = document.createElement('style');
        st.textContent = SEL + '{display:none!important}';
        (document.body || document.head || document.documentElement).appendChild(st);
      }
      var els = document.querySelectorAll(SEL);
      for (var i = 0; i < els.length; i++) els[i].style.setProperty('display', 'none', 'important');
    } catch (e) {}
  }
  hideChrome();
  document.addEventListener('DOMContentLoaded', hideChrome);
  addEventListener('load', hideChrome);
  [300, 1000, 2500, 5000].forEach(function(d){ setTimeout(hideChrome, d); });
  try {
    var hq = 0;
    new MutationObserver(function(){ clearTimeout(hq); hq = setTimeout(hideChrome, 120); })
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  if (document.querySelector('meta[http-equiv="refresh"]')) return;
  // "Ready" = the first screen has really painted: the body has content,
  // the document has finished loading, its web fonts are in and every image
  // in the first viewport has decoded. Capped at 2.5s after load (a slow
  // image never holds the site back for long) and 15s overall; then two
  // frames so the paint is on screen before the app fades it in.
  var t0 = Date.now(), loadedAt = 0, fontsIn = !document.fonts, sent = false;
  try { document.fonts.ready.then(function(){ fontsIn = true; }); } catch (e) { fontsIn = true; }
  function post(){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage('{"as":"ready"}'); }
  function painted(){
    if (sent) return; sent = true;
    requestAnimationFrame(function(){ requestAnimationFrame(post); });
  }
  function firstScreenImagesIn(){
    var imgs = document.images, h = innerHeight, w = innerWidth;
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.complete) continue;
      var r = im.getBoundingClientRect();
      if (r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < h && r.right > 0 && r.left < w) return false;
    }
    return true;
  }
  function check(){
    if (document.querySelector('meta[http-equiv="refresh"]')) return;
    var now = Date.now();
    if (now - t0 > 15000) return painted();
    var b = document.body;
    var text = b ? (b.innerText || '').trim().length : 0;
    var media = b ? b.querySelectorAll('img,canvas,video,svg').length : 0;
    if ((text > 40 || media > 3) && document.readyState === 'complete') {
      if (!loadedAt) loadedAt = now;
      if ((fontsIn && firstScreenImagesIn()) || now - loadedAt > 2500) return painted();
    }
    setTimeout(check, 80);
  }
  check();
})(); true;`;

/**
 * Injected first: keeps the site exactly one viewport wide, so the whole
 * Desktop (1280) / Tablet (820) / Mobile (390) width is what the panel
 * scales down — a site with one over-wide element would otherwise lay out
 * wider than its viewport and show only its left part (its header's right
 * end cut off). Adds a width=device-width viewport if the page has none
 * and clips horizontal overflow at the root (`clip`, not `hidden`, so
 * sticky headers keep working).
 */
export const FIT_SCRIPT = `(function(){
  if (window.__asFitInstalled) return; window.__asFitInstalled = true;
  try {
    var head = document.head || document.documentElement;
    if (!document.querySelector('meta[name="viewport"]')) {
      var m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1';
      head.appendChild(m);
    }
    var st = document.createElement('style');
    st.textContent = 'html,body{overflow-x:clip!important}';
    head.appendChild(st);
  } catch (e) {}
})(); true;`;

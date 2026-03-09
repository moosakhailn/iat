// script.js — set iframe height to available space (viewport minus header & footer).
// Keeps iframe full-width (no container). If cross-origin blocks inner measurement,
// this script falls back to filling available viewport space so the iframe looks integrated.

document.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('iatIframe');
  const header = document.getElementById('iatHeaderStack');
  const footer = document.getElementById('siteFooter');

  if (!iframe) return;

  // compute available height: viewport - header - footer
  function computeAvailableHeight() {
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const footerH = footer ? footer.getBoundingClientRect().height : 0;
    // ensure a sensible minimum for small devices
    const avail = Math.max(480, Math.floor(window.innerHeight - headerH - footerH));
    return avail;
  }

  // Try to read iframe document height if same-origin
  function tryMeasureIframeContent() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return null;
      const body = doc.body;
      const html = doc.documentElement;
      const height = Math.max(
        body ? body.scrollHeight : 0,
        body ? body.offsetHeight : 0,
        html ? html.scrollHeight : 0,
        html ? html.offsetHeight : 0
      );
      if (height && Number.isFinite(height)) return height;
    } catch (err) {
      // cross-origin likely -> cannot measure
    }
    return null;
  }

  // Set the iframe height (px)
  function setIframeHeight(px) {
    iframe.style.height = px + 'px';
  }

  // Primary resizing routine: attempt same-origin measurement, otherwise set avail height
  async function resizeIframeSmart() {
    // immediate available height as base
    const avail = computeAvailableHeight();
    setIframeHeight(avail);

    // try same-origin measurement
    const measured = tryMeasureIframeContent();
    if (measured) {
      // clamp to at least avail and within reason
      const final = Math.max(avail, Math.min(measured, Math.max(measured, avail)));
      setIframeHeight(final);
      return;
    }

    // attempt postMessage handshake: ask iframe to send height (works only if child implements listener)
    let replied = false;
    function onMessage(e) {
      const data = e.data || {};
      if (data && data.type === 'embed-height' && typeof data.height === 'number') {
        replied = true;
        setIframeHeight(Math.max(avail, Math.floor(data.height)));
        window.removeEventListener('message', onMessage);
      }
    }
    window.addEventListener('message', onMessage);

    try {
      // send request - this won't throw; child must listen and reply
      iframe.contentWindow.postMessage({ type: 'request-embed-height' }, '*');
    } catch (err) {
      // ignore
    }

    // wait briefly for reply then fallback
    await new Promise(resolve => setTimeout(resolve, 650));
    window.removeEventListener('message', onMessage);
    if (!replied) {
      // fallback: make the iframe comfortably tall so it visually integrates.
      // Use a generous size so content appears natural and not "boxed".
      const fallback = Math.max(avail, window.innerHeight * 1.0, 900);
      setIframeHeight(Math.floor(fallback));
    }
  }

  // Run on iframe load and on window resize/orientationchange
  iframe.addEventListener('load', () => {
    // small delay to allow iframe render
    setTimeout(resizeIframeSmart, 160);
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeIframeSmart, 140);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeIframeSmart, 260);
  });

  // initial call in case iframe is already loaded
  setTimeout(resizeIframeSmart, 250);

  // footer year
  (function(){ const y = new Date().getFullYear(); const el = document.getElementById('year'); if(el) el.textContent = y; })();
});
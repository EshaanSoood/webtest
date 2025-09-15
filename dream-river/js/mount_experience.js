(function(){
  if (window.__experienceMounted) { return; }
  function q(sel, root){ return (root||document).querySelector(sel); }
  function R(p, base){ try{ return new URL(p, base).toString(); }catch(_){ return p; } }
  async function mountExperience(opts){
    var expContainer = q('.experience') || null;
    var expRoot = q('#experience-root');
    var rootForMount = opts && opts.rootEl || expRoot;
    if (!rootForMount) return;
    if (window.__experienceMounted) return;
    window.__experienceMounted = true;
    var baseRoot = opts && opts.baseRoot || rootForMount.getAttribute('data-base-root') || '.';
    var baseUrl = R(baseRoot.replace(/\/+$/, '') + '/', document.baseURI);
    var debug = /(?:\?|&)debug=1(?:&|$)/.test(String(location.search||''));
    if (debug) console.log('[mount] page=', location.pathname, 'base=', baseUrl);

    // Pre-play gate (apply to .experience if present, else to #experience-root)
    var gateRoot = expContainer || rootForMount || document.body;
    var qs = new URLSearchParams(location.search || '');
    var skipGate = qs.has('t') || qs.get('autoplay') === '1';
    if (!skipGate){
      gateRoot.classList.add('preplay');
      try { gateRoot.querySelectorAll('.chapter, .cta-shelf, .chapters-block, #cta-root').forEach(function(n){ n.setAttribute('aria-hidden','true'); }); } catch(_){ }
      var videoEl = q('#dr-player-iframe') || gateRoot.querySelector('video') || q('video');
      var unlock = function(){
        gateRoot.classList.remove('preplay');
        try { gateRoot.querySelectorAll('.chapter, .cta-shelf, .chapters-block, #cta-root').forEach(function(n){ n.removeAttribute('aria-hidden'); }); } catch(_){ }
        try { videoEl && videoEl.removeEventListener && videoEl.removeEventListener('play', unlock); } catch(_){ }
      };
      if (videoEl && videoEl.addEventListener) videoEl.addEventListener('play', unlock, { once: true });
      // Also unlock when dr:time reports progress > 0 (covers Vimeo adapter)
      var once = function(ev){
        try {
          var d = ev && ev.detail || {};
          var t = (typeof d.t==='number')? d.t : (typeof d.seconds==='number'? d.seconds:0);
          if (t > 0) {
            window.removeEventListener('dr:time', once);
            unlock();
          }
        } catch(_){}
      };
      window.addEventListener('dr:time', once);
      // if query requires unlock now
      if (skipGate) unlock();
    }

    // Wire time driver (already included): ensures dr:time events with {t,seconds}
    // Initialize subchapter engine (already included): listens to dr:time and renders
    // Initialize CTA renderer (already included): listens to dr:cue/chapterchange only

    // Provide resolved URLs to engines if they read config
    window.__EXPERIENCE_BASE_URL__ = baseUrl;
  }
  document.addEventListener('DOMContentLoaded', function(){ mountExperience({}); });
  window.mountExperience = mountExperience;
})();

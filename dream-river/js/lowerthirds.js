(function(){
  var DOC_ID = 'doc';
  var ROOT_CLASS = 'lt-root';
  var LT_CLASS = 'lt';
  var DEFAULT_STYLE = 'slide';
  var LT_CUES = [];
  var fired = new Set();
  var lastTime = 0;
  var warnedJson = false;

  function $(sel, root){ return (root||document).querySelector(sel); }
  function createRoot(){
    var root = document.querySelector('.'+ROOT_CLASS);
    if (root) return root;
    root = document.createElement('div');
    root.className = ROOT_CLASS;
    root.setAttribute('role','status');
    root.setAttribute('aria-live','polite');
    document.body.appendChild(root);
    return root;
  }

  function sanitizeStyle(style){
    var allowed = ['slide','fade','zoom','wipe-horizontal','typewriter','underline-wipe','blue-unfurl'];
    return allowed.indexOf(style) !== -1 ? style : DEFAULT_STYLE;
  }

  function removeExisting(root){
    try { while (root.firstChild) root.removeChild(root.firstChild); } catch(_){ }
  }

  function showLowerThird(opts){
    opts = opts || {};
    var title = String(opts.title||'').trim();
    if (!title) return;
    var sub = String(opts.sub||'');
    var duration = Number(opts.duration||opts.dur||4);
    if (!isFinite(duration) || duration <= 0) duration = 4;
    var style = sanitizeStyle(String(opts.style||DEFAULT_STYLE));

    var root = createRoot();
    removeExisting(root);

    var el = document.createElement('div');
    el.className = LT_CLASS + ' ' + LT_CLASS + '--' + style + ' ' + LT_CLASS + '--enter';
    el.style.setProperty('--in', '0.6s');
    el.style.setProperty('--hold', duration + 's');
    el.style.setProperty('--out', '0.5s');
    el.style.setProperty('--delay', '0s');

    var h = document.createElement('div');
    h.className = 'lt-title';
    h.textContent = title;
    el.appendChild(h);
    if (sub){
      var p = document.createElement('div');
      p.className = 'lt-sub';
      p.innerHTML = sub; // allow simple inline markup like <em>
      el.appendChild(p);
    }
    root.appendChild(el);

    var totalMs = Math.round((0.6 + duration + 0.5) * 1000);
    var exitTimer = setTimeout(function(){ try { el.classList.remove('lt--enter'); el.classList.add('lt--exiting'); } catch(_){ } }, Math.max(0, Math.round((0.6 + duration) * 1000)));
    var removeTimer = setTimeout(function(){ try { if (el.parentNode) el.parentNode.removeChild(el); } catch(_){ } }, totalMs + 120);
    return { el: el, exitTimer: exitTimer, removeTimer: removeTimer };
  }

  async function loadCues(){
    var base = (window.__EXPERIENCE_BASE_URL__) || document.baseURI;
    function R(p){ try { return new URL(p, base).toString(); } catch(_) { return p; } }
    try {
      var res = await fetch(R('./config/lower_thirds.json'));
      if (!res.ok) throw new Error('HTTP '+res.status);
      var json = await res.json();
      if (Array.isArray(json)) LT_CUES = json.slice().sort(function(a,b){ return (a.t||0)-(b.t||0); });
    } catch(err){ if (!warnedJson) { warnedJson = true; console.warn('[lowerthirds] Could not load lower_thirds.json:', err && err.message ? err.message : err); } }
  }

  function onTimeUpdate(t){
    // Re-arm if scrubbed back > 6s
    if (t + 6 < lastTime){ fired.clear(); }
    lastTime = t;
    var ct = Math.floor(t);
    for (var i=0;i<LT_CUES.length;i++){
      var cue = LT_CUES[i];
      var tt = Number(cue.t||0);
      if (!isFinite(tt)) continue;
      var key = 't:'+tt+'|'+(cue.title||'');
      if (fired.has(key)) continue;
      if (Math.abs(ct - Math.floor(tt)) <= 1){
        fired.add(key);
        showLowerThird({ title: cue.title||'', sub: cue.sub||'', duration: Number(cue.dur||4), style: cue.style||DEFAULT_STYLE });
      }
    }
  }

  function wireVideo(){
    var v = document.getElementById(DOC_ID) || document.getElementById('dr-player-iframe') || document.querySelector('video');
    if (v && v.addEventListener){
      v.addEventListener('timeupdate', function(){ try { onTimeUpdate(v.currentTime||0); } catch(_){ } });
    }
    // Always also listen to dr:time, which is fed by the time driver (HTML5 or Vimeo)
    try { window.addEventListener('dr:time', function(ev){ var d=ev&&ev.detail||{}; var t=(typeof d.t==='number')? d.t : (typeof d.seconds==='number'? d.seconds:0); onTimeUpdate(t||0); }); } catch(_){ }
  }

  // Export API
  window.showLowerThird = showLowerThird;

  // Init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ createRoot(); wireVideo(); loadCues(); });
  else { createRoot(); wireVideo(); loadCues(); }
})();



(function(){
  var INTERVAL_MS = 100;
  var adapter = null, ticker = null, lastSent = -1;

  function emit(t){
    if (typeof t !== 'number' || !isFinite(t)) t = 0;
    if (t === lastSent) return; lastSent = t;
    try { window.dispatchEvent(new CustomEvent('dr:time', { detail: { t:t, seconds:t } })); } catch(_){ }
  }

  function startTicker(){
    if (!adapter || typeof adapter.getCurrentTime !== 'function') return;
    if (ticker) clearInterval(ticker);
    ticker = setInterval(function(){
      try {
        var p = adapter.getCurrentTime();
        if (p && typeof p.then === 'function') { p.then(function(t){ emit(t||0); }).catch(function(){}); }
        else { emit(Number(p||0)); }
      } catch(_){}
    }, INTERVAL_MS);
  }

  function stopTicker(){ if (ticker) { clearInterval(ticker); ticker=null; } }

  function createAdapter(){
    var el = document.getElementById('dr-player-iframe');
    if (!el) {
      var v = document.querySelector('video');
      if (v) el = v;
    }
    if (!el) return null;

    // HTML5 <video>
    if (el.tagName && el.tagName.toLowerCase() === 'video'){
      var video = el;
      return {
        on: function(evt, cb){ try { video.addEventListener(evt, cb); } catch(_){} },
        getCurrentTime: function(){ try { return Number(video.currentTime||0); } catch(_) { return 0; } },
        pause: function(){ try { video.pause(); } catch(_){} },
        play: function(){ try { return video.play(); } catch(_) { return Promise.reject(); } },
        isPaused: function(){ try { return video.paused; } catch(_) { return true; } }
      };
    }

    // Vimeo iframe
    if (el.tagName && el.tagName.toLowerCase() === 'iframe' && window.Vimeo && typeof window.Vimeo.Player === 'function'){
      var vp = new window.Vimeo.Player(el);
      return {
        on: function(evt, cb){ try { vp.on(evt, function(data){ if (evt === 'timeupdate') { cb({ seconds: (data && data.seconds) || 0 }); } else if (evt === 'play' || evt === 'pause' || evt === 'ended') { cb(data); } }); } catch(_){} },
        getCurrentTime: function(){ try { return vp.getCurrentTime(); } catch(_) { return Promise.resolve(0); } },
        pause: function(){ try { return vp.pause(); } catch(_) { return Promise.resolve(); } },
        play: function(){ try { return vp.play(); } catch(_) { return Promise.reject(); } },
        isPaused: function(){ try { return vp.getPaused(); } catch(_) { return Promise.resolve(true); } }
      };
    }
    return null;
  }

  function init(){
    adapter = createAdapter();
    // expose for other modules needing pause/play
    window.__DR_PLAYER_ADAPTER__ = adapter;
    if (!adapter) return;

    try {
      adapter.on('timeupdate', function(e){
        var t=0;
        if (e && typeof e.seconds==='number') t=e.seconds;
        else {
          var v=adapter.getCurrentTime();
          if (v && typeof v.then==='function'){ v.then(function(x){ emit(Number(x||0)); }); return; }
          t=Number(v||0);
        }
        emit(t||0);
      });
    } catch(_){ }
    try { adapter.on('play', startTicker); } catch(_){ }
    try { adapter.on('pause', stopTicker); } catch(_){ }
    emit(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

(function(){
  function $(sel, scope){ return (scope||document).querySelector(sel); }
  function $all(sel, scope){ return Array.from((scope||document).querySelectorAll(sel)); }

  function renderList(root, list, reduced){
    var ul = root.querySelector('.memory-list');
    if (!ul) return;
    ul.innerHTML='';
    var items = reduced ? list.slice(0, 10) : list.slice(0, 80);
    items.forEach(function(it, idx){
      var li = document.createElement('li');
      li.className = 'memory-card' + (idx===0? ' is-focus' : '');
      li.setAttribute('tabindex','-1');
      li.innerHTML = '<p class="memory-quote">“'+ (it.message||'') +'”</p>'+
                     '<p class="memory-name">– '+ (it.name||'Anonymous') +'</p>'+
                     '<p class="memory-city"><em>'+ (it.city||'') +'</em></p>';
      ul.appendChild(li);
    });
  }

  function animateWall(root){
    var list = root.querySelector('.memory-list');
    var cards = $all('.memory-card', list);
    if (!cards.length) return function(){};
    var t0 = performance.now();
    var focusIdx = 0;
    var running = true;
    var focusIntervalMs = 5000;
    var lastSwitch = t0;

    function step(ts){
      if (!running) return;
      var dt = ts - t0;
      var angleBase = dt * 0.0001; // slow orbit
      cards.forEach(function(card, i){
        var r = 80 + (i % 8) * 8;
        var a = angleBase + i * 0.6;
        var x = Math.cos(a) * r;
        var y = Math.sin(a) * (r * 0.45);
        var s = 0.9;
        if (i === focusIdx){ s = 1.12; }
        card.style.transform = 'translate(calc(-50% + '+x+'px), calc(-50% + '+y+'px)) scale('+s+')';
        card.style.opacity = (i===focusIdx)? '1' : '0.35';
      });
      if (ts - lastSwitch > focusIntervalMs){
        cards[focusIdx].classList.remove('is-focus');
        focusIdx = (focusIdx + 1) % cards.length;
        cards[focusIdx].classList.add('is-focus');
        lastSwitch = ts;
      }
      requestAnimationFrame(step);
    }

    var rafId = requestAnimationFrame(step);
    return function pause(){ running = false; cancelAnimationFrame(rafId); };
  }

  function init(root, opts){
    function getApiBaseFromQuery(){ try{ var u=new URL(location.href); return u.searchParams.get('apiBase')||''; }catch(_){ return ''; } }
    var apiBase = (opts && opts.apiBase) || getApiBaseFromQuery() || '';
    var limit = (opts && opts.limit) || 100;
    var cta = root.querySelector('.memory-cta'); if (!cta) return;
    var wall = cta.querySelector('.memory-wall');
    var form = cta.querySelector('.memory-form');
    var btnPrimary = cta.querySelector('.memory-primary');
    var btnAnim = cta.querySelector('.memory-anim-toggle');
    var live = cta.querySelector('.memory-live');
    var errorEl = cta.querySelector('.error');
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var data = [];
    var stopAnim = function(){};

    function setWallHidden(on){ wall.setAttribute('aria-hidden', on? 'true':'false'); if (on) { wall.setAttribute('inert',''); } else { wall.removeAttribute('inert'); } }
    function showForm(){ form.hidden = false; setWallHidden(true); var first = form.querySelector('input,textarea,button'); first && first.focus(); }
    function hideForm(){ form.hidden = true; setWallHidden(false); wall.focus && wall.focus(); }

    async function fetchMemories(){
      try{
        if (!apiBase){ throw new Error('API not configured'); }
        var url = apiBase + '?limit=' + encodeURIComponent(limit);
        var res = await fetch(url, { method:'GET', mode:'cors' });
        if (!res.ok) throw new Error('GET failed');
        var json = await res.json();
        data = Array.isArray(json)? json : (json.items||[]);
        renderList(cta, data, prefersReduced);
        if (!prefersReduced){ stopAnim = animateWall(cta); }
      } catch(err){
        if (errorEl){
          errorEl.hidden = false;
          errorEl.textContent = (!apiBase)
            ? 'Memory API is not configured. Set window.DR_MEMORY_WALL.apiBase or pass ?apiBase=YOUR_WEB_APP_URL.'
            : 'Could not load memories. ';
          if (apiBase){ var a=document.createElement('a'); a.href='#'; a.textContent='Retry'; a.addEventListener('click', function(e){ e.preventDefault(); errorEl.hidden = true; fetchMemories(); }); errorEl.appendChild(a); }
        }
        renderList(cta, [], prefersReduced);
      }
    }

    async function postMemory(payload){
      try {
        var res = await fetch(apiBase, { method:'POST', mode:'cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if (res && res.type === 'opaque') { return { ok: true, opaque: true }; }
        if (!res || !res.ok) throw new Error('POST failed');
        try { return await res.json(); } catch(_) { return { ok: true }; }
      } catch(err) {
        try { await fetch(apiBase, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); } catch(_) {}
        return { ok: true, fallback: true };
      }
    }

    btnPrimary.addEventListener('click', function(){ showForm(); });
    btnAnim.addEventListener('click', function(){ var pressed = btnAnim.getAttribute('aria-pressed') === 'true'; var next = !pressed; btnAnim.setAttribute('aria-pressed', String(next)); btnAnim.textContent = next? 'Pause' : 'Play'; if (next){ // pressed=true means animations ON
        prefersReduced = false; stopAnim = animateWall(cta);
      } else { stopAnim(); }
    });

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      if (!apiBase){ if (errorEl){ errorEl.hidden=false; errorEl.textContent='Memory API is not configured. Set window.DR_MEMORY_WALL.apiBase or pass ?apiBase=YOUR_WEB_APP_URL.'; } return; }
      var fd = new FormData(form);
      var payload = { name: fd.get('name')||'', city: fd.get('city')||'', message: fd.get('message')||'', timestamp_iso: new Date().toISOString() };
      try {
        var saved = await postMemory(payload);
        data.unshift(payload);
        renderList(cta, data, prefersReduced);
        hideForm();
        if (live){ live.textContent = 'Your memory has been added.'; }
        var firstCard = cta.querySelector('.memory-card'); firstCard && firstCard.focus && firstCard.focus();
      } catch(err){ if (errorEl){ errorEl.hidden = false; errorEl.textContent = 'Could not submit. Please try again.'; } }
    });
    var cancelBtn = cta.querySelector('.memory-cancel, .cancel, button.cancel');
    if (cancelBtn) { cancelBtn.addEventListener('click', function(){ hideForm(); }); }

    fetchMemories();
  }

  window.DRMemoryWall = { init: init };
})();



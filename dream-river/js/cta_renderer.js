(function(){
  var rootEl = document.getElementById('experience-root'); if (!rootEl) return;
  var BASE = window.__EXPERIENCE_BASE_URL__ || document.baseURI;
  function R(p, base){ try { return new URL(p, base).toString(); } catch(_) { return p; } }
  function $(sel, scope){ return (scope||rootEl).querySelector(sel); }

  var host = $('#cta-root', rootEl) || (function(){ var d=document.createElement('div'); d.id='cta-root'; rootEl.appendChild(d); return d; })();
  var shadow = host.shadowRoot || host.attachShadow({mode:'open'});
  function ensureFontStyle(){
    if (shadow.querySelector('style[data-font="the-seasons"]')) return;
    var st = document.createElement('style');
    st.setAttribute('data-font','the-seasons');
    st.textContent = 'h1,h2,h3,h4,h5,h6,.cta-title{font-family:"the-seasons",sans-serif;}';
    shadow.appendChild(st);
  }
  ensureFontStyle();

  var map=null, ctas=null, idx=null, lastChapter=null, chapters=null, audioByChapter={};
  function norm(v){ return String(v||'').toLowerCase().trim().replace(/\s+/g,'-'); }

  function indexCtas(){ idx={}; var list=(ctas&&ctas.list)||[]; for (var i=0;i<list.length;i++){ var e=list[i]; [e.id,e.slug,e.title].forEach(function(k){ if(k) idx[norm(k)]=e; }); } }

  function ctaFragmentPath(id){
    switch(id){
      case 'instagram_follow': return R('./ctas/instagram.html', BASE);
      case 'physical_copy':    return R('./ctas/physical_copy.html', BASE);
      case 'happy_memory':     return R('./ctas/happy_memory.html', BASE);
      case 'share_album':      return R('./ctas/share_album.html', BASE);
      case 'share_song':       return R('./ctas/share_song.html', BASE);
      case 'merch':            return R('./ctas/merch.html', BASE);
      case 'subscribe':        return R('./ctas/subscribe.html?v=20250912-3', BASE);
      case 'tell_a_friend':    return R('./ctas/tell_a_friend.html?v=20250912-3', BASE);
      default: return null;
    }
  }

  async function fetchFragment(path){
    var html = await fetch(path).then(function(r){ return r.text(); });
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var node = wrap.firstElementChild || wrap;
    if (node.classList && node.classList.contains('cta-card')) node.classList.add('block');
    return node;
  }

  function wireShareBlocks(root, globals, trackUrl){
    if (!root) return;
    var albumUrl = (globals && globals.album_url) || '';
    var defaultTrack = (globals && globals.soundcloud_default) || '';
    var track = trackUrl || defaultTrack;

    function isWebUrl(u){ return /^(https?:)?\/\//.test(String(u||'')); }
    root.querySelectorAll('[data-net]').forEach(function(btn){
      var net = btn.getAttribute('data-net');
      var routes = {
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=',
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=',
        whatsapp: 'https://api.whatsapp.com/send?text='
      };
      var href = null;
      if (btn.closest('.cta-card[data-track]') || btn.closest('[data-share="song"]')){
        var effectiveTrack = track;
        if (!isWebUrl(effectiveTrack)) effectiveTrack = albumUrl; // fallback to album link for local/relative
        var t = encodeURIComponent(effectiveTrack);
        var text = encodeURIComponent("I'm listening to this track from 'Dream River': ");
        if (net==='facebook') href = routes.facebook + t;
        else if (net==='linkedin') href = routes.linkedin + t;
        else if (net==='whatsapp') href = routes.whatsapp + text + t;
      } else {
        var a = encodeURIComponent(albumUrl);
        var text2 = encodeURIComponent("Sailing through 'Dream River' — give it a spin: ");
        if (net==='facebook') href = routes.facebook + a;
        else if (net==='linkedin') href = routes.linkedin + a;
        else if (net==='whatsapp') href = routes.whatsapp + text2 + a;
      }
      if (href){
        btn.setAttribute('href', href);
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
      }
    });

    root.querySelectorAll('.copy').forEach(function(btn){
      btn.addEventListener('click', function(){
        var text = track || albumUrl;
        navigator.clipboard.writeText(text).then(function(){
          btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy Link'; }, 1500);
        }).catch(function(){
          btn.textContent = 'Copy failed'; setTimeout(function(){ btn.textContent = 'Copy Link'; }, 1500);
        });
      });
    });
  }

  async function loadAll(){
    try{ map = await fetch(R('./config/chapter_cta_map.json', BASE)).then(function(r){return r.json()}); }catch(_){ map={}; }
    try{ ctas = await fetch(R('./config/ctas.json', BASE)).then(function(r){return r.json()}); }catch(_){ ctas={ list:[], globals:{} }; }
    try{ chapters = await fetch(R('./config/chapters.json', BASE)).then(function(r){return r.json()}); }catch(_){ chapters = []; }
    indexCtas();
    var list = (chapters && (chapters.chapters||chapters)) || [];
    for (var i=0;i<list.length;i++){ var c=list[i]; if (c && c.id && c.audio){ audioByChapter[String(c.id)] = c.audio; } }
  }

  function clearShadow(){ while (shadow.firstChild) shadow.removeChild(shadow.firstChild); ensureFontStyle(); }

  async function renderForCtaId(ctaId, chapterId){
    if (!ctaId) { clearShadow(); return; }
    var entry = idx && idx[norm(ctaId)] || null;
    if (entry && (entry.html || entry.url || entry.text)){
      var wrap=document.createElement('div'); wrap.className='dr-cta';
      if (entry.html){ wrap.innerHTML = entry.html; }
      else {
        var text=entry.text||entry.title||''; var url=entry.url||entry.href||''; var btn=entry.buttonText||entry.button||'Learn more';
        if(text){ var p=document.createElement('p'); p.textContent=text; wrap.appendChild(p);} if(url){ var p2=document.createElement('p'); var a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.className='btn'; a.textContent=btn; p2.appendChild(a); wrap.appendChild(p2);} }
      clearShadow(); shadow.appendChild(wrap);
      // For inline CTAs coming from config, do not force song share context
      wireShareBlocks(shadow, ctas && ctas.globals || {}, '');
      return;
    }
    var fragPath = ctaFragmentPath(ctaId);
    if (fragPath){
      try{
        var node = await fetchFragment(fragPath);
        // Only mark as song-share when the CTA is specifically a song share
        var isSongShare = (ctaId === 'share_song');
        var isAlbumShare = (ctaId === 'share_album');
        if (isSongShare){
          var explicitTrack = node.getAttribute('data-track-url') || '';
          var fallbackTrack = (ctas && ctas.globals && ctas.globals.soundcloud_default) || '';
          var chapterAudio = audioByChapter[chapterId] || '';
          var chosenTrack = explicitTrack || chapterAudio || fallbackTrack;
          if (chosenTrack){
            node.setAttribute('data-track-url', chosenTrack);
          }
          node.setAttribute('data-share', 'song');
          node.classList.add('cta-card');
          node.classList.add('block');
          node.setAttribute('data-track', '1');
        } else if (isAlbumShare){
          try { node.setAttribute('data-share', 'album'); } catch(_){ }
          try { node.removeAttribute('data-track'); } catch(_){ }
          try { node.removeAttribute('data-track-url'); } catch(_){ }
        }
        clearShadow(); ensureFontStyle(); shadow.appendChild(node);
        // Execute any embedded scripts within the CTA fragment (e.g., YouTube subscribe)
        try {
          var scripts = shadow.querySelectorAll('script');
          scripts.forEach(function(oldScript){
            var newScript = document.createElement('script');
            for (var i=0;i<oldScript.attributes.length;i++){
              var attr = oldScript.attributes[i];
              newScript.setAttribute(attr.name, attr.value);
            }
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
          });
          // Try to render YouTube subscribe buttons if API present
          try { if (window.gapi && gapi.ytsubscribe && typeof gapi.ytsubscribe.go === 'function') { gapi.ytsubscribe.go(shadow); } } catch(_){ }
          // Poll briefly for gapi in case platform.js loads after injection
          try {
            var tries=0; var iv=setInterval(function(){
              tries++;
              try{
                if (window.gapi && gapi.ytsubscribe && typeof gapi.ytsubscribe.go === 'function'){
                  gapi.ytsubscribe.go(shadow);
                  clearInterval(iv);
                }
              } catch(_){ }
              if (tries>30) { try{ clearInterval(iv); }catch(_){ } }
            }, 200);
          } catch(_){ }
        } catch(_){ }
        // Initialize Happy Memory CTA wall if present
        try {
          if (node && node.classList && node.classList.contains('memory-cta') && window.DRMemoryWall && typeof window.DRMemoryWall.init === 'function'){
            window.DRMemoryWall.init(shadow, (window.DR_MEMORY_WALL || {}));
          }
        } catch(_){ }
        var trackToUse = '';
        if (isSongShare){
          trackToUse = node.getAttribute('data-track-url') || '';
        }
        wireShareBlocks(shadow, ctas && ctas.globals || {}, trackToUse);
      } catch(_){ clearShadow(); }
    } else {
      clearShadow();
    }
  }

  function onChapter(ch){
    if (!map) return;
    if (ch==='intro' || ch==='thank-you') { clearShadow(); return; }
    if (ch===lastChapter) return; lastChapter=ch;
    var entry = map[ch] || map[norm(ch)] || null;
    var ctaId = null;
    if (Array.isArray(entry)) ctaId = entry[0]; else if (typeof entry === 'string') ctaId = entry;
    renderForCtaId(ctaId, ch);
  }

  window.addEventListener('dr:cue', function(ev){ var d=ev&&ev.detail||{}; if (!d.chapterId) return; onChapter(d.chapterId); });

  loadAll();
})();

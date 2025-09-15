(function(){
  var ROOT = document.getElementById('experience-root');
  if (!ROOT) return;

  var BASE_DIR = './Assets/audio/song titles';
  var mapByChapter = {
    'mountain-muse': { title: 'Mountain Muse', filename: 'ST_Mountain Muse.webm' },
    'glass-blown-acquaintances': { title: 'Glass Blown Acquaintances', filename: 'ST_Glass Blown Acquintaances.webm' },
    'miss-lightning': { title: 'Miss Lightning', filename: 'ST_miss lightning.webm' },
    'if-our-hearts-could-talk': { title: 'If Our Hearts Could Talk', filename: 'ST_if Our Hearts Could Talk.webm' },
    'plea-for-forgiveness': { title: 'Plea For Forgiveness', filename: 'ST_Plea for Forgiveness.webm' },
    'here-for-a-good-time': { title: 'Here For A Good Time', filename: 'ST_Here for a good time.webm' },
    'hexes-and-spells': { title: 'Hexes & Spells', filename: 'ST_Hexes & Spells.webm' },
    'sailing-through-dream-river': { title: 'Sailing Through Dream River', filename: 'ST_Sailing Through Dream River.webm' }
  };

  function buildSrcPath(filename){
    // Encode base dir (spaces) and filename (spaces, & etc.) safely
    var base = BASE_DIR.replace(/\/$/, '');
    return encodeURI(base) + '/' + encodeURIComponent(filename);
  }

  function posterFromFilename(filename){
    // Map ST_X.webm -> ST_X_lastframe.webp (preserve exact name and spaces)
    if (!filename) return '';
    if (!/\.webm$/i.test(filename)) return '';
    var stem = filename.replace(/\.webm$/i, '');
    return stem + '_lastframe.webp';
  }

  function createLowerThirdWrapper(title){
    var wrap = document.createElement('div');
    wrap.className = 'lowerthird-wrap';
    wrap.setAttribute('role','img');
    wrap.setAttribute('aria-label', 'A river flows out showing the title of the song ' + (title||'') + '.');
    wrap.setAttribute('aria-hidden','false');
    wrap.tabIndex = -1; // ensure not focusable
    return wrap;
  }

  function makeVideo(src, poster){
    var v = document.createElement('video');
    v.className = 'lowerthird-video';
    v.setAttribute('muted','');
    v.muted = true;
    v.setAttribute('playsinline','');
    v.setAttribute('preload','auto');
    v.autoplay = true;
    v.loop = false;
    v.controls = false;
    v.disablePictureInPicture = true;
    v.setAttribute('aria-hidden','true');
    if (poster) v.setAttribute('poster', poster);
    var source = document.createElement('source');
    source.src = src;
    source.type = 'video/webm';
    v.appendChild(source);
    return v;
  }

  function freezeOnLastFrame(video){
    try{
      var t = Math.max(0, (video.duration||0) - 0.05);
      video.currentTime = t;
      video.pause();
    } catch(_){ try { video.pause(); } catch(_){} }
  }

  function showTextFallback(container, titleText){
    var text = document.createElement('div');
    text.className = 'lowerthird-fallback-text';
    text.textContent = 'A river flows out showing the title of the song ' + (titleText||'') + '.';
    container.appendChild(text);
  }

  function injectFor(container, chapterTitle, src, posterUrl){
    if (!container) return;
    // Find the first heading inside this chapter
    var heading = container.querySelector('h1, h2, h3, .chapter-title');
    var titleText = chapterTitle || (heading && (heading.textContent||'').trim()) || 'Mountain Muse';

    // Preserve semantic heading: keep in DOM but visually hide
    if (heading){ heading.classList.add('visually-hidden'); }

    // Insert lower-third wrapper before the heading
    var wrap = createLowerThirdWrapper(titleText);
    var video = makeVideo(src, posterUrl||'');
    wrap.appendChild(video);
    if (heading && heading.parentNode){ heading.parentNode.insertBefore(wrap, heading); }
    else { container.insertBefore(wrap, container.firstChild); }

    var playedOnce = false;
    video.addEventListener('ended', function(){ playedOnce = true; freezeOnLastFrame(video); }, { once:false });
    video.addEventListener('canplay', function(){ if (!playedOnce){ try { video.play().catch(function(){ /* leave poster visible */ }); } catch(_){} } });
    // Autoplay may be blocked: ensure a frame is visible
    video.addEventListener('loadeddata', function(){ if (video.paused){ try { video.currentTime = 0.001; } catch(_){} } });

    // If video fails to load entirely, show text fallback inside wrapper
    video.addEventListener('error', function(){ showTextFallback(wrap, titleText); });
    // If no poster and we cannot play, also show text fallback on suspend
    if (!posterUrl){ video.addEventListener('suspend', function(){ if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE){ showTextFallback(wrap, titleText); } }); }
  }

  window.addEventListener('dr:cue', function(ev){
    var d = (ev && ev.detail) || {};
    var id = String(d.chapterId||'').toLowerCase();
    var cfg = mapByChapter[id];
    if (!cfg) return;
    var chapterEl = ROOT.querySelector('.chapter.active');
    if (!chapterEl) return;
    if (chapterEl.querySelector('.lowerthird-wrap')) return; // already injected
    var src = buildSrcPath(cfg.filename);
    var poster = posterFromFilename(cfg.filename);
    var posterUrl = poster ? buildSrcPath(poster) : '';
    injectFor(chapterEl, cfg.title, src, posterUrl);
  });
})();



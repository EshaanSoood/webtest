(function(){
  const experience = document.querySelector('.experience');
  const root = experience || document.body;
  const scope = experience || document;

  function findBehindHeading(){
    if (!experience) return null;
    const h2s = Array.from(experience.querySelectorAll('h2'));
    return h2s.find(h => (h.textContent||'').trim().toLowerCase() === 'behind the curtain') || h2s[1] || null;
  }

  let bar = (experience || document).querySelector('.listen-bar');
  if (!bar) {
    const heading = findBehindHeading();
    if (heading && heading.parentNode){
      bar = document.createElement('div');
      bar.className = 'listen-bar';
      bar.innerHTML = '<span class="listen-bar-text">Listen To This Song?</span> <button class="listen-bar-btn" type="button">Play</button>';
      heading.parentNode.insertBefore(bar, heading.nextSibling);
    }
  }
  if (!bar) return;

  const playBtn = bar.querySelector('.listen-bar-btn');
  let audioHost = (experience || document).querySelector('.listen-bar-audio');
  if (!audioHost) {
    audioHost = document.createElement('div');
    audioHost.className = 'listen-bar-audio';
    audioHost.setAttribute('aria-hidden','true');
    bar.parentNode.insertBefore(audioHost, bar.nextSibling);
  }

  const videoEl = scope.querySelector('#dr-player-iframe') || scope.querySelector('video') || document.querySelector('#dr-player-iframe') || document.querySelector('video');
  const playerAdapter = window.__DR_PLAYER_ADAPTER__ || null;
  const allowed = new Set([
    'mountain-muse',
    'glass-blown-acquaintances',
    'miss-lightning',
    'if-our-hearts-could-talk',
    'plea-for-forgiveness',
    'here-for-a-good-time',
    'hexes-and-spells',
    'sailing-through-dream-river'
  ]);

  let listenMap = {};
  let currentChapterId = null;
  let currentAudio = null;
  let videoWasPlaying = false;
  let unlocked = false;

  function R(rel){ try { return new URL(rel, document.baseURI).toString(); } catch { return rel; } }
  async function loadJSON(rel){ try{ const r=await fetch(R(rel)); if(!r.ok) return null; return await r.json(); } catch { return null; } }
  async function fetchFragment(path){ const r=await fetch(R(path)); if(!r.ok) return null; return await r.text(); }

  function setBarVisible(on){ bar.style.display = on ? '' : 'none'; }

  function refreshBarVisibility(){
    const allowedChapter = currentChapterId && allowed.has(currentChapterId);
    const shouldShow = unlocked && allowedChapter;
    setBarVisible(shouldShow);
    playBtn.disabled = !shouldShow || !listenMap[currentChapterId];
  }

  window.addEventListener('dr:cue', (ev)=>{ const d=(ev&&ev.detail)||{}; currentChapterId = d.chapterId || null; refreshBarVisibility(); });
  window.addEventListener('dr:time', (ev)=>{ const d=(ev&&ev.detail)||{}; const t = (typeof d.t==='number')? d.t : (typeof d.seconds==='number'? d.seconds:0); if (t>0) { unlocked = true; refreshBarVisibility(); } });
  if (videoEl){
    (videoEl.addEventListener ? videoEl.addEventListener.bind(videoEl) : function(_,fn){ try{ (playerAdapter && playerAdapter.on) ? playerAdapter.on('play', fn) : null; } catch(_){} })( 'play', ()=>{
      unlocked = true;
      refreshBarVisibility();
      // If user resumes the video while a song is playing, pause the song
      if (currentAudio && !currentAudio.paused){
        try { currentAudio.pause(); } catch{}
        playBtn.textContent = 'Play';
      }
    });
  }

  function stopAudio(){
    if (!currentAudio) return;
    try { currentAudio.pause(); } catch{}
    if (currentAudio.parentNode) currentAudio.parentNode.removeChild(currentAudio);
    currentAudio = null;
    playBtn.textContent = 'Play';
  }

  async function playForCurrentChapter(){
    if (!currentChapterId) return;
    const fragId = listenMap[currentChapterId];
    if (!fragId) return;
    stopAudio();
    const html = await fetchFragment(`./listens/${fragId}.html`);
    if (!html) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const audio = wrap.querySelector('audio');
    if (!audio) return;
    audio.controls = true;
    audioHost.innerHTML = '';
    audioHost.appendChild(audio);
    currentAudio = audio;
    audio.addEventListener('play', ()=>{
      if (playerAdapter) {
        try { playerAdapter.isPaused && playerAdapter.isPaused().then ? playerAdapter.isPaused().then(function(p){ videoWasPlaying = !p; }).catch(function(){ videoWasPlaying = false; }) : videoWasPlaying = false; } catch(_){}
        try { playerAdapter.pause && playerAdapter.pause(); } catch(_){ }
      } else if (videoEl) {
        try { videoWasPlaying = !videoEl.paused; videoEl.pause(); } catch(_){ }
      }
      playBtn.textContent='Pause';
    });
    function resumeVideo(){
      playBtn.textContent='Play';
      if (videoWasPlaying){
        if (playerAdapter && playerAdapter.play){ try { playerAdapter.play().catch(function(){}); } catch(_){} }
        else if (videoEl){ try { videoEl.play().catch(function(){}); } catch(_){} }
      }
    }
    audio.addEventListener('pause', resumeVideo);
    audio.addEventListener('ended', resumeVideo);
    try { await audio.play(); } catch{}
  }

  playBtn.addEventListener('click', ()=>{ if (currentAudio && !currentAudio.paused){ currentAudio.pause(); } else { playForCurrentChapter(); } });
  // Remove global 'P' play/pause shortcut to avoid interfering with text inputs

  (async () => {
    const map = await loadJSON('./config/chapter_listen_map.json');
    listenMap = (map && typeof map==='object') ? map : {};
    setBarVisible(false);
  })();
})();

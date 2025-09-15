// Listen shelf: chapter-to-fragment mapping (like CTAs). Loads listens/<mappedId>.html on chapter change.
(function () {
  const experience = document.querySelector('.experience');
  const root = experience || document.querySelector('#experience-root') || document.body;
  const scope = experience || document;

  // Place shelf directly below video, above "Behind the Curtain"
  const videoWrapper = scope.querySelector('#dr-player') || scope.querySelector('.embed-wrapper') || scope.querySelector('video')?.closest('div') || scope.querySelector('video');
  const chaptersWrapper = scope.querySelector('.chapters-block') || scope.querySelector('#experience-root');

  let shelf = (experience || document).querySelector('.listen-shelf');
  if (!shelf) {
    shelf = document.createElement('section');
    shelf.className = 'listen-shelf';
    const parent = experience || (videoWrapper && videoWrapper.parentNode) || (chaptersWrapper && chaptersWrapper.parentNode) || root;
    // Prefer heading marker
    let marker = null;
    if (experience) {
      const h2s = experience.querySelectorAll('h2.heading-white');
      marker = (h2s && h2s.length > 1) ? h2s[1] : Array.from(experience.querySelectorAll('h2')).find(h => (h.textContent||'').trim().toLowerCase() === 'behind the curtain');
    }
    if (marker && marker.parentNode) marker.parentNode.insertBefore(shelf, marker);
    else if (videoWrapper && chaptersWrapper && videoWrapper.parentNode === chaptersWrapper.parentNode) videoWrapper.parentNode.insertBefore(shelf, chaptersWrapper);
    else if (videoWrapper) videoWrapper.parentNode.insertBefore(shelf, videoWrapper.nextSibling);
    else if (chaptersWrapper) chaptersWrapper.parentNode.insertBefore(shelf, chaptersWrapper);
    else parent.insertBefore(shelf, parent.firstChild);
  }

  function setVisible(on) { shelf.style.display = on ? '' : 'none'; }
  function R(rel) { try { return new URL(rel, document.baseURI).toString(); } catch { return rel; } }
  async function loadJSON(rel){ try{ const r=await fetch(R(rel)); if(!r.ok) return null; return await r.json(); } catch { return null; } }
  async function loadFragment(path){ const r = await fetch(R(path)); if(!r.ok) return null; return await r.text(); }

  let listenMap = {}; // chapterId -> fragmentId (string)
  let currentChapter = null;

  async function onChapter(chapterId){
    if (!chapterId) { setVisible(false); currentChapter=null; return; }
    const fragId = listenMap[chapterId] || chapterId; // fallback: use chapterId as fragmentId
    if (currentChapter === chapterId) return;
    const html = await loadFragment(`./listens/${fragId}.html`);
    if (!html) { setVisible(false); currentChapter=null; return; }
    shelf.innerHTML = html;
    currentChapter = chapterId;
    setVisible(true);
  }

  // Primary: follow cue changes
  window.addEventListener('dr:cue', (ev) => { const d = (ev && ev.detail) || {}; onChapter(d.chapterId); });

  // Fallback: derive current chapter from timecodes.json driven by dr:time (no <video> dependency)
  let orderIds = [];
  let firstStartById = {};
  function parseTime(s){ if (typeof s==='number') return s; const a=String(s||'0').trim().split(':').map(Number); if(a.length===3) return a[0]*3600+a[1]*60+a[2]; if(a.length===2) return a[0]*60+a[1]; return a[0]||0; }
  function activeIdAt(t){
    for (let i=0;i<orderIds.length;i++){
      const id = orderIds[i];
      const s = Number(firstStartById[id]||0);
      let e = Infinity;
      for (let j=i+1;j<orderIds.length;j++){
        const nid = orderIds[j]; if (nid in firstStartById){ e = firstStartById[nid]; break; }
      }
      if (t >= s && t < e) return id;
    }
    return null;
  }
  function onTimeEvent(ev){ const d=(ev&&ev.detail)||{}; const t = (typeof d.t==='number')? d.t : (typeof d.seconds==='number'? d.seconds: null); if (t==null) return; const id=activeIdAt(t); if (id) onChapter(id); }

  (async () => {
    const m = await loadJSON('./config/chapter_listen_map.json');
    listenMap = (m && typeof m==='object') ? m : {};
    const ch = await loadJSON('./config/chapters.json');
    const tc = await loadJSON('./config/timecodes.json');
    const chapters = Array.isArray(ch) ? ch : (ch?.chapters || []);
    orderIds = chapters.map(c=>String(c.id));
    firstStartById = {};
    if (Array.isArray(tc)){
      for (const r of tc){
        const t=parseTime(r.at);
        const id=String((r.chapterId ?? r.id ?? r.chapter) || '');
        const baseId = id.includes('/')? id.split('/')[0] : id;
        if(!baseId) continue;
        if(!(baseId in firstStartById) || t<firstStartById[baseId]) firstStartById[baseId]=t;
      }
    }
    setVisible(false);
    window.addEventListener('dr:time', onTimeEvent);
  })();
})();

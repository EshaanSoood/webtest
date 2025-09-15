(function(){
  var rootEl = document.getElementById('experience-root');
  if (!rootEl) return;
  var BASE = window.__EXPERIENCE_BASE_URL__ || document.baseURI;
  function R(p, base){ try { return new URL(p, base).toString(); } catch(_) { return p; } }
  function $(sel, scope){ return (scope||rootEl).querySelector(sel); }
  var hostBaseAssets = './Assets/';
  function resolveAssetPath(src){
    if (!src) return '';
    if (/^(https?:)?\/\//.test(src)) return src;
    if (src.startsWith('file://')) return src;
    if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')){
      return src;
    }
    return hostBaseAssets + src;
  }
  var containers = {
    player: null,
    subs: null,
    cta: null
  };
  function ensureStructure(){
    containers.subs = containers.subs || (function(){ var d=document.createElement('div'); d.id='subs-root'; rootEl.appendChild(d); return d; })();
    containers.cta = containers.cta || (function(){ var d=document.createElement('div'); d.id='cta-root'; rootEl.appendChild(d); return d; })();
  }
  async function fetchJson(paths){ for (var i=0;i<paths.length;i++){ try { var res = await fetch(paths[i]); if (res.ok) return await res.json(); } catch(_){ } } throw new Error('All fetch fallbacks failed: '+paths.join(', ')); }
  var timeline=[], ranges=[], chapters=null, lastKey=null, EPS=0.25;
  function parseTime(s){ if (typeof s==='number') return s; var a=String(s||'0').trim().split(':').map(Number); if (a.length===3) return a[0]*3600+a[1]*60+a[2]; if (a.length===2) return a[0]*60+a[1]; return a[0]||0; }
  function splitKey(key){ var i=String(key).indexOf('/'); return i===-1?{chapterId:key,slug:''}:{chapterId:key.slice(0,i),slug:key.slice(i+1)}; }
  function computeRanges(){ ranges = []; for (var i=0;i<timeline.length;i++){ var start = timeline[i].t, end = (i+1<timeline.length)? timeline[i+1].t : Number.POSITIVE_INFINITY, key = timeline[i].key, p = splitKey(key); if (end<=start) end=start+0.01; ranges.push({start:start, end:end, key:key, chapterId:p.chapterId, slug:p.slug}); } }
  function findIdx(t){ var lo=0, hi=timeline.length-1, ans=0; while(lo<=hi){ var mid=(lo+hi)>>1; if (timeline[mid].t<=t+EPS){ ans=mid; lo=mid+1; } else { hi=mid-1; } } return ans; }
  function buildSubHtml(ch, slug){
    var subs = ch.subs||[]; var count={}; var hit=null; for (var i=0;i<subs.length;i++){ var ty=subs[i].type||'text'; count[ty]=(count[ty]||1); var id=ty+'-'+count[ty]; subs[i].__id=id; if (id===slug) hit=subs[i]; count[ty]++; }
    var s = hit || subs[0]; if (!s) return '';
    if (s.type==='text'){ var txt = s.content||''; return '<div class="sub" data-sub-key="'+ch.id+'/'+s.__id+'"><p>'+txt+'</p></div>'; }
    if (s.type==='image'){ var src=s.src||''; var alt=s.alt||''; var fixed = resolveAssetPath(src); return '<div class="sub" data-sub-key="'+ch.id+'/'+s.__id+'"><figure><img src="'+fixed+'" alt="'+alt+'"></figure></div>'; }
    return '<div class="sub" data-sub-key="'+ch.id+'/'+s.__id+'"></div>';
  }
  function escapeHtml(s){ return String(s==null? '': s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function renderByKey(key){ var parts = splitKey(key); var ch = (chapters.chapters||chapters||[]).find(function(c){ return String(c.id)===parts.chapterId; }); if (!ch) return; var heading = '<h3 class="chapter-title">'+escapeHtml(ch.title || parts.chapterId)+'</h3>'; var content = buildSubHtml(ch, parts.slug); content = content.replace('class="sub"','class="sub active"'); containers.subs.innerHTML = '<section class="chapter active">'+heading+content+'</section>'; }
  function onTime(t){ if (!timeline.length) return; var idx=findIdx(t); var r=ranges[idx]; if (!r) return; if (t<r.start-EPS || (!isFinite(r.end)?false: t>=r.end-1e-6+EPS)) return; if (r.key===lastKey) return; lastKey=r.key; try { if (typeof window.renderSubByKey==='function'){ window.renderSubByKey(r.key);} else { renderByKey(r.key);} } catch(_){ renderByKey(r.key); } try { window.dispatchEvent(new CustomEvent('dr:cue', { detail:{ key:r.key, chapterId:r.chapterId, slug:r.slug, t:t } })); } catch(_){ } }
  function attach(){ window.addEventListener('dr:time', function(ev){ var d=ev&&ev.detail||{}; var t = (typeof d.t==='number')? d.t : (typeof d.seconds==='number'? d.seconds:0); onTime(t); }); }
  (async function init(){
    ensureStructure();
    var cfgCandidates = [ R('./config/timecodes.json', BASE) ];
    var chCandidates  = [ R('./config/chapters.json',  BASE) ];
    var tc = await fetchJson(cfgCandidates);
    chapters = await fetchJson(chCandidates);
    timeline = (Array.isArray(tc)?tc:[]).map(function(c){ return { t:parseTime(c.at), key:c.chapter||c.key||'' }; }).filter(function(x){ return x.key && isFinite(x.t); }).sort(function(a,b){return a.t-b.t});
    computeRanges(); attach(); onTime(0);
  })();
})();

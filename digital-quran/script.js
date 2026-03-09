/* NAVBAR & MOBILE SIDEBAR */
const menuBtn = document.getElementById('menuBtn');
const mobileSidebar = document.getElementById('mobileSidebar');
const closeBtn = document.getElementById('closeBtn');
const headerStack = document.getElementById('headerStack');

menuBtn?.addEventListener('click', ()=>{
  mobileSidebar.classList.add('open');
  mobileSidebar.setAttribute('aria-hidden','false');
  menuBtn.setAttribute('aria-expanded','true');
});
closeBtn?.addEventListener('click', ()=>{
  mobileSidebar.classList.remove('open');
  mobileSidebar.setAttribute('aria-hidden','true');
  menuBtn.setAttribute('aria-expanded','false');
});
mobileSidebar?.addEventListener('click', e=>{
  if(e.target.tagName==='A' && window.innerWidth<=900){
    mobileSidebar.classList.remove('open');
    mobileSidebar.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
  }
});
window.addEventListener('keydown', e=>{
  if(e.key==='Escape' && mobileSidebar.classList.contains('open')){
    mobileSidebar.classList.remove('open');
    mobileSidebar.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
  }
});
window.addEventListener('resize', ()=>{
  if(window.innerWidth>900 && mobileSidebar.classList.contains('open')){
    mobileSidebar.classList.remove('open');
    mobileSidebar.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
  }
});
window.addEventListener('scroll', ()=>{
  if(window.scrollY>6) headerStack.classList.add('scrolled');
  else headerStack.classList.remove('scrolled');
});


/* script.js — Full working Qur'an reader script
   - Defensive (null checks)
   - No risky insertBefore / DOM moves
   - Manual Juz mapping + segJuz support
   - Works with your existing HTML IDs (segJuz, segSurah, etc.)
   - Keep in sync with your page/CSS
*/

/* ---------- endpoints ---------- */
const QURAN_COM = "https://api.quran.com/api/v4";
const ALQURAN = "https://api.alquran.cloud/v1";
const QURANENC_BASE = "https://quranenc.com/api/v1";

/* ---------- DOM refs (defensive) ---------- */

const surahListEl = document.getElementById("surahList");
const surahSearchEl = document.getElementById("surahSearch");
const viewModeEl = document.getElementById("viewMode");
const translationSelect = document.getElementById("translationSelect");
const translitToggleBtn = document.getElementById("translitToggle");
const translitLabel = translitToggleBtn?.querySelector(".dq-btn-label");
const reciterSelect = document.getElementById("reciterSelect");
const pageNumberInput = document.getElementById("pageNumber");
const pageLabel = document.getElementById("pageLabel");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");

const playSurahBtn = document.getElementById("playSurahBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stopBtn");
const prevAyahBtn = document.getElementById("prevAyahBtn");
const nextAyahBtn = document.getElementById("nextAyahBtn");
const seekInput = document.getElementById("seek");
const elapsedEl = document.getElementById("elapsed");
const durationEl = document.getElementById("duration");
const repeatModeEl = document.getElementById("repeatMode");
const repeatCountEl = document.getElementById("repeatCount");
const decRepeat = document.getElementById("decRepeat");
const incRepeat = document.getElementById("incRepeat");

const themeToggle = document.getElementById("themeToggle");
const toastEl = document.getElementById("toast");
const audio = document.getElementById("audio");

const juzInfoEl = document.getElementById("juzInfo");
const rangeModeEl = document.getElementById("rangeMode");
const startSurahEl = document.getElementById("startSurah");
const endSurahEl = document.getElementById("endSurah");
const startJuzEl = document.getElementById("startJuz");
const endJuzEl = document.getElementById("endJuz");
const startRangeBtn = document.getElementById("startRangeBtn");
const surahRangeControls = document.getElementById("surahRangeControls");
const juzRangeControls = document.getElementById("juzRangeControls");

const quranContainer = document.getElementById("quranContainer");
const segSurahBtn = document.getElementById("segSurah");
const segJuzBtn = document.getElementById("segJuz");

/* ---------- state ---------- */
let chapters = [];
let juzList = null;
let currentSurah = 1;
let currentPage = 1;
let currentVerses = [];
let currentPageGrouped = {};
let audioCache = {};
let playQueue = [];
let queuePos = -1;
let translitOn = false;
let themeLight = false;
let activeListMode = 'surah';
let previousPlayingChapter = null;

let pagesToPlay = null;
let pagesToPlayIndex = 0;

/* ---------- reciters, translations & manual juz starts ---------- */
const RECITERS = [
  { key: "ar.alafasy", name: "Mishary Alafasy" },
  { key: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
  { key: "ar.husary", name: "Mahmoud Al-Husary" },
  { key: "ar.minshawi", name: "Minshawi" }
];

const TRANSLATION_KEYS = {
  english: ['english_saheeh','en.sahih','english_saheeh'],
  pashto: ['pashto_rwwad','ps.pashto','pashto'],
  dari: ['dari_badkhashani','fa.dari','dari']
};

/* Manual Juz starts + ends (used to build precise juzList if API missing) */
const JUZ_STARTS = [
  {juz:1,  start:{c:1,v:1}},
  {juz:2,  start:{c:2,v:142}},
  {juz:3,  start:{c:2,v:253}},
  {juz:4,  start:{c:3,v:93}},
  {juz:5,  start:{c:4,v:24}},
  {juz:6,  start:{c:4,v:148}},
  {juz:7,  start:{c:5,v:82}},
  {juz:8,  start:{c:6,v:111}},
  {juz:9,  start:{c:7,v:88}},
  {juz:10, start:{c:8,v:41}},
  {juz:11, start:{c:9,v:93}},
  {juz:12, start:{c:11,v:6}},
  {juz:13, start:{c:12,v:53}},
  {juz:14, start:{c:15,v:1}},
  {juz:15, start:{c:17,v:1}},
  {juz:16, start:{c:18,v:75}},
  {juz:17, start:{c:21,v:1}},
  {juz:18, start:{c:23,v:1}},
  {juz:19, start:{c:25,v:21}},
  {juz:20, start:{c:27,v:56}},
  {juz:21, start:{c:29,v:46}},
  {juz:22, start:{c:33,v:31}},
  {juz:23, start:{c:36,v:28}},
  {juz:24, start:{c:39,v:32}},
  {juz:25, start:{c:41,v:47}},
  {juz:26, start:{c:46,v:1}},
  {juz:27, start:{c:51,v:31}},
  {juz:28, start:{c:58,v:1}},
  {juz:29, start:{c:67,v:1}},
  {juz:30, start:{c:78,v:1}}
];

/* ---------- helpers ---------- */
function toast(msg, t = 1700){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.style.opacity = 1;
  setTimeout(()=>{ toastEl.classList.add('hidden'); toastEl.style.opacity = 0; }, t);
}
function toArabicIndic(n){ return String(n).split('').map(d => (/\d/.test(d) ? '٠١٢٣٤٥٦٧٨٩'[d] : d)).join(''); }
async function fetchJson(url){ const r = await fetch(url); if(!r.ok) throw new Error(`${url} -> ${r.status}`); return r.json(); }

/* ---------- populate reciters ---------- */
function populateReciters(){
  if(!reciterSelect) return;
  reciterSelect.innerHTML = "";
  RECITERS.forEach(r => {
    const o = document.createElement("option");
    o.value = r.key; o.textContent = r.name;
    reciterSelect.appendChild(o);
  });
}

/* ---------- build manual juz list (create full juz objects) ---------- */
function buildManualJuzList(){
  const list = [];
  for(let i=0;i<JUZ_STARTS.length;i++){
    const cur = JUZ_STARTS[i];
    const next = JUZ_STARTS[i+1];
    const end = next ? { c: next.start.c, v: next.start.v - 1 } : { c: 114, v: 9999 };
    list.push({
      juz_number: cur.juz,
      start_chapter: cur.start.c,
      start_verse: cur.start.v,
      end_chapter: end.c,
      end_verse: end.v
    });
  }
  juzList = list;
}

/* ---------- derive juz label for a surah ---------- */
function deriveJuzLabel(chapterId){
  if(!juzList) return '—';
  for(const j of juzList){
    if(Number(chapterId) >= j.start_chapter && Number(chapterId) <= j.end_chapter) return `Juz ${j.juz_number}`;
  }
  return '—';
}

/* ---------- render side lists ---------- */
function renderSurahList(list){
  if(!surahListEl) return;
  if(activeListMode === 'juz') return;
  surahListEl.innerHTML = "";
  list.forEach((ch, i) => {
    const li = document.createElement('li');
    const en = ch.englishName || ch.name_simple || ch.name_en || ch.translated_name?.name || '';
    li.innerHTML = `<strong>${ch.id} — ${en}</strong><div class="muted">${deriveJuzLabel(ch.id)}</div>`;
    li.dataset.id = ch.id;
    li.addEventListener('click', ()=>{ currentSurah = Number(ch.id); viewModeEl.value = "verse"; loadSurah(currentSurah); });
    li.style.setProperty('--i', (i*0.04)+'s');
    requestAnimationFrame(()=> li.classList.add('appear'));
    surahListEl.appendChild(li);
  });
}

function renderJuzList(list){
  if(!surahListEl) return;
  surahListEl.innerHTML = "";
  list.forEach((j, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>Juz ${j.juz_number}</strong><div class="muted" style="font-size:0.9rem;margin-top:6px">starts: ${j.start_chapter}:${j.start_verse} — ends: ${j.end_chapter}:${j.end_verse}</div></div><div class="muted">▶</div>`;
    li.addEventListener('click', ()=> { readJuzRange(j.juz_number, j.juz_number); });
    li.style.setProperty('--i', (i*0.04)+'s');
    requestAnimationFrame(()=> li.classList.add('appear'));
    surahListEl.appendChild(li);
  });
}

/* ---------- populate selects ---------- */
function populateSurahSelects(list){
  if(!startSurahEl || !endSurahEl) return;
  startSurahEl.innerHTML = ""; endSurahEl.innerHTML = "";
  list.forEach(ch => {
    const txt = `${ch.id} — ${ch.englishName || ch.name_en || ''}`;
    const o1 = document.createElement("option"); o1.value = ch.id; o1.textContent = txt;
    const o2 = o1.cloneNode(true);
    startSurahEl.appendChild(o1); endSurahEl.appendChild(o2);
  });
  endSurahEl.value = list.length; startSurahEl.value = 1;
}
function populateJuzSelects(list){
  if(!startJuzEl || !endJuzEl) return;
  startJuzEl.innerHTML = ""; endJuzEl.innerHTML = "";
  for(const j of list){
    const o1 = document.createElement("option"); o1.value = j.juz_number; o1.textContent = `Juz ${j.juz_number}`;
    const o2 = o1.cloneNode(true);
    startJuzEl.appendChild(o1); endJuzEl.appendChild(o2);
  }
}

/* ---------- chapter page map cache ---------- */
const chapterPageMapCache = {};
async function getChapterPageMap(surah){
  if(chapterPageMapCache[surah]) return chapterPageMapCache[surah];
  try{
    const json = await fetchJson(`${ALQURAN}/surah/${surah}/quran-uthmani`);
    if(json && json.data && Array.isArray(json.data.ayahs)){
      const map = {};
      json.data.ayahs.forEach(a => { if(a.numberInSurah) map[a.numberInSurah] = a.page || null; });
      chapterPageMapCache[surah] = map;
      return map;
    }
  }catch(e){}
  chapterPageMapCache[surah] = {};
  return {};
}

/* ---------- fetch helpers ---------- */
async function fetchVersesFromQuranComByChapter(surah){
  const fields = "text_uthmani,verse_number,chapter_id,verse_key,id";
  const url = `${QURAN_COM}/verses/by_chapter/${surah}?language=en&words=true&word_fields=transliteration&fields=${fields}&per_page=500`;
  const json = await fetchJson(url);
  return json.verses || [];
}
async function fetchVersesFromQuranComByPage(page){
  const fields = "text_uthmani,verse_number,chapter_id,verse_key,id";
  const url = `${QURAN_COM}/verses/by_page/${page}?language=en&words=true&word_fields=transliteration&fields=${fields}&per_page=500`;
  const json = await fetchJson(url);
  return json.verses || [];
}
async function fetchTranslationsFromQuranEnc(surah, lang){
  const keys = TRANSLATION_KEYS[lang] || TRANSLATION_KEYS.english;
  for(const k of keys){
    try{
      const url = `${QURANENC_BASE}/translation/sura/${k}/${surah}`;
      const res = await fetch(url);
      if(!res.ok) continue;
      const json = await res.json();
      if(json && json.result && json.result.length){
        const map = {};
        json.result.forEach(r => { map[Number(r.aya)] = r.translation || r.translation_text || ""; });
        return map;
      }
    }catch(e){ continue; }
  }
  return {};
}
async function fetchAudioForSurah(reciterKey, surah){
  audioCache[reciterKey] = audioCache[reciterKey] || {};
  if(audioCache[reciterKey][surah]) return audioCache[reciterKey][surah];
  try{
    const url = `${ALQURAN}/surah/${surah}/${reciterKey}`;
    const json = await fetchJson(url);
    const list = (json.data && json.data.ayahs) ? json.data.ayahs.map(a => a.audio) : [];
    audioCache[reciterKey][surah] = list;
    return list;
  }catch(e){
    console.warn("audio fetch failed", e);
    audioCache[reciterKey][surah] = [];
    return [];
  }
}
async function fetchAyahAudioFallback(reciterKey, chap, verse){
  try{
    const url = `${ALQURAN}/ayah/${chap}:${verse}/${reciterKey}`;
    const json = await fetchJson(url);
    if(json && json.data && json.data.audio) return json.data.audio;
  }catch(e){}
  return null;
}

/* ---------- surah intro & calligraphy banner ---------- */
function createSurahIntro(chapterObj){
  const div = document.createElement("div");
  div.className = "surah-intro card";
  const arabicName = chapterObj?.name_arabic || chapterObj?.name || chapterObj?.name_simple || "";
  const engName = chapterObj?.englishName || chapterObj?.name_simple || chapterObj?.name_en || chapterObj?.english_name || "";
  const meaning = chapterObj?.translated_name?.name || chapterObj?.englishNameTranslation || "";
  const surahId = Number(chapterObj?.id || chapterObj?.chapter_id || 0);

  div.innerHTML = `
    <div class="surah-arabic-calligraphy">${arabicName}</div>
    <div class="surah-meta">
      <div style="font-weight:800;color:var(--text-main)">${engName ? engName : ("Surah " + (surahId||""))}</div>
      ${meaning ? `<div class="muted">— ${meaning}</div>` : ''}
      <div style="flex:1"></div>
      <div class="muted" style="font-size:0.9rem">Ayahs: ${chapterObj?.verses_count || chapterObj?.verses || '—'}</div>
    </div>
    <div class="surah-divider"></div>
  `;

  if(surahId !== 9){
    const b = document.createElement("div");
    b.className = "bismillah-silhouette";
    b.textContent = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
    div.appendChild(b);
    requestAnimationFrame(()=> { b.style.transform = "translate(-50%,-30%) scale(1.02)"; });
  }
  return div;
}

function showSurahCalligraphyBanner(chapterId){
  const chapterMeta = chapters.find(c => Number(c.id) === Number(chapterId)) || {};
  const nameAr = chapterMeta?.name_arabic || chapterMeta?.name || '';
  const nameEn = chapterMeta?.englishName || chapterMeta?.name_simple || chapterMeta?.name_en || '';
  const existing = document.querySelector('.now-surah-banner');
  if(existing){ existing.remove(); }
  const banner = document.createElement('div');
  banner.className = 'now-surah-banner';
  banner.innerHTML = `<div style="font-family: 'Amiri', serif; font-size:22px; line-height:1">${nameAr}</div><div style="font-size:14px;color:rgba(255,255,255,0.9)">${nameEn}</div>`;
  document.body.appendChild(banner);
  setTimeout(()=> banner.style.opacity = 1, 40);
  setTimeout(()=> { banner.style.opacity = 0; banner.remove(); }, 4200);
}

/* ---------- rendering ---------- */
function renderCurrentView(){
  if(pageLabel) pageLabel.style.display = (viewModeEl?.value === "page") ? "" : "none";
  if(viewModeEl?.value === "page") renderPageMode(); else renderVerseMode();
}

function renderVerseMode(){
  if(!quranContainer) return;
  quranContainer.className = "dq-main verse-mode";
  quranContainer.innerHTML = "";
  if(!currentVerses.length){ quranContainer.innerHTML = `<div class="dq-loading">No verses</div>`; return; }

  const chapterMeta = chapters.find(c => Number(c.id) === Number(currentVerses[0].chapter_id)) || chapters.find(c => Number(c.id) === Number(currentSurah)) || {};
  if(chapterMeta){ const intro = createSurahIntro(chapterMeta); quranContainer.appendChild(intro); }

  currentVerses.forEach((v, idx) => {
    const card = document.createElement("div"); card.className = "ayah"; card.dataset.index = idx;
    const meta = document.createElement("div"); meta.className = "meta";
    const playBtn = document.createElement("button"); playBtn.className = "dq-play"; playBtn.textContent = "▶ Play";
    playBtn.addEventListener("click", ()=> playSingleAyah(idx));
    const navPrev = document.createElement("button"); navPrev.className = "dq-btn small"; navPrev.textContent = "««"; navPrev.title = "Prev ayah"; navPrev.onclick = ()=> jumpToAyah(idx-1);
    const navNext = document.createElement("button"); navNext.className = "dq-btn small"; navNext.textContent = "»»"; navNext.title = "Next ayah"; navNext.onclick = ()=> jumpToAyah(idx+1);
    meta.appendChild(playBtn); meta.appendChild(navPrev); meta.appendChild(navNext);

    const content = document.createElement("div"); content.className = "content";
    const arabicDiv = document.createElement("div"); arabicDiv.className = "dq-arabic";
    arabicDiv.innerHTML = `<div style="display:flex;align-items:center;justify-content:flex-end;gap:12px"><div>${v.text_uthmani}</div><div class="dq-ayah-number">${toArabicIndic(v.verse_number)}</div></div>`;
    const transDiv = document.createElement("div"); transDiv.className = "dq-translation"; transDiv.innerHTML = v.translation ? v.translation : '<span style="opacity:.6">Translation not available</span>';
    const translitDiv = document.createElement("div"); translitDiv.className = "dq-translit"; translitDiv.innerHTML = (translitOn && v.transliteration) ? v.transliteration : '';
    translitDiv.style.display = (translitOn && v.transliteration) ? 'block' : 'none';
    const perProgress = document.createElement("input"); perProgress.type = "range"; perProgress.min = 0; perProgress.max = 100; perProgress.value = 0; perProgress.style.width = "100%";
    perProgress.oninput = (e) => { if(queuePos>=0 && playQueue[queuePos] && playQueue[queuePos].ayahIndex===idx && audio?.duration){ audio.currentTime = (e.target.value/100)*audio.duration; } };
    content.appendChild(arabicDiv); content.appendChild(transDiv); content.appendChild(translitDiv); content.appendChild(perProgress);
    const actions = document.createElement("div"); actions.style.display='flex'; actions.style.gap='8px'; actions.style.marginTop='6px';
    const copyBtn = document.createElement("button"); copyBtn.className='dq-btn small'; copyBtn.textContent='Copy';
    copyBtn.addEventListener('click', ()=> { const text = `${v.chapter_id}:${v.verse_number} — ${stripTags(v.text_uthmani)}`; navigator.clipboard?.writeText(text).then(()=> toast('Copied to clipboard')).catch(()=> toast('Copy failed')); });
    actions.appendChild(copyBtn); content.appendChild(actions);
    card.appendChild(meta); card.appendChild(content);
    quranContainer.appendChild(card);
    v._ui = { card, perProgress, translitDiv, transDiv };
  });
}

function renderPageMode(){
  if(!quranContainer) return;
  quranContainer.className = "dq-main page-mode";
  quranContainer.innerHTML = "";
  const wrap = document.createElement("div"); wrap.className = "mushaf";
  const surahOrder = Object.keys(currentPageGrouped).map(Number);

  if(surahOrder.length === 0 && currentVerses.length){
    currentVerses.forEach(v => {
      const span = document.createElement("div"); span.className = "ayah";
      span.innerHTML = `<span class="arabic-text">${v.text_uthmani}</span><button class="dq-ayah-number" data-chapter="${v.chapter_id}" data-verse="${v.verse_number}">${toArabicIndic(v.verse_number)}</button>${(translitOn && v.transliteration)?`<div class="dq-translit" style="direction:ltr;margin-top:6px">${v.transliteration}</div>`:''}`;
      wrap.appendChild(span);
    });
  } else {
    for(const sId of surahOrder){
      const chapterMeta = (chapters.find(c => c.id === Number(sId)) || {});
      if(chapterMeta){
        const intro = createSurahIntro(chapterMeta);
        wrap.appendChild(intro);
      }
      const surahHeader = document.createElement('div'); surahHeader.className='dq-surah-header'; surahHeader.style.margin='8px 0';
      const chapMeta = chapters.find(c => c.id === Number(sId)) || {};
      surahHeader.innerHTML = `<strong style="display:block">${chapMeta.id || sId} — ${chapMeta.englishName || chapMeta.name_simple || ''}</strong>`;
      wrap.appendChild(surahHeader);
      currentPageGrouped[sId].forEach(v => {
        const span = document.createElement("div"); span.className = "ayah";
        span.innerHTML = `<span class="arabic-text">${v.text_uthmani}</span><button class="dq-ayah-number" data-chapter="${v.chapter_id}" data-verse="${v.verse_number}">${toArabicIndic(v.verse_number)}</button>${(translitOn && v.transliteration)?`<div class="dq-translit" style="direction:ltr;margin-top:6px">${v.transliteration}</div>`:''}`;
        wrap.appendChild(span);
      });
    }
  }

  quranContainer.appendChild(wrap);

  // page-mode click handlers
  quranContainer.querySelectorAll('.dq-ayah-number').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const verse = Number(e.currentTarget.dataset.verse);
      const chap = Number(e.currentTarget.dataset.chapter);
      const idx = currentVerses.findIndex(v => Number(v.chapter_id) === chap && Number(v.verse_number) === verse);
      if(idx >= 0){ await buildPlayQueue(idx); queuePos = idx; startQueue(); }
      else {
        try{
          await fetchAudioForSurah(reciterSelect?.value || RECITERS[0].key, chap);
          const audioList = (audioCache[reciterSelect?.value || RECITERS[0].key] && audioCache[reciterSelect?.value || RECITERS[0].key][chap]) || [];
          const url = audioList[verse - 1];
          if(url){ audio.src = url; audio.currentTime = 0; await audio.play(); highlightPageAyah(chap, verse); if(playPauseBtn) playPauseBtn.textContent = "⏸"; playQueue=[]; queuePos=-1; }
          else{
            const single = await fetchJson(`${ALQURAN}/ayah/${chap}:${verse}/${reciterSelect?.value || RECITERS[0].key}`);
            if(single && single.data && single.data.audio){ audio.src = single.data.audio; audio.currentTime = 0; await audio.play(); highlightPageAyah(chap, verse); if(playPauseBtn) playPauseBtn.textContent = "⏸"; }
            else toast("Audio not available for this ayah (try another reciter).");
          }
        }catch(err){ console.warn("page-mode fallback audio error", err); toast("Could not play ayah audio."); }
      }
    });
  });
}

function highlightPageAyah(chapter, verse){
  document.querySelectorAll('.ayah.playing').forEach(el => el.classList.remove('playing'));
  const el = quranContainer?.querySelector(`.dq-ayah-number[data-chapter='${chapter}'][data-verse='${verse}']`);
  if(el){ const parent = el.closest('.ayah'); if(parent) parent.classList.add('playing'); }
}

/* ---------- playback queue & controls ---------- */
async function buildPlayQueue(startIndex = 0){
  playQueue = [];
  const reciterKey = reciterSelect?.value || RECITERS[0].key;
  const surahIds = Array.from(new Set(currentVerses.map(v => v.chapter_id)));
  await Promise.all(surahIds.map(s => fetchAudioForSurah(reciterKey, s)));
  for(const v of currentVerses){
    const surah = Number(v.chapter_id);
    const audioList = (audioCache[reciterKey] && audioCache[reciterKey][surah]) || [];
    const url = audioList[v.verse_number - 1] || v.audio || "";
    playQueue.push({ ayahIndex: currentVerses.indexOf(v), url, chapter: surah, verse: v.verse_number, page: v.page || null });
  }
  queuePos = Math.max(0, Math.min(startIndex, playQueue.length - 1));
}

async function startQueue(){
  if(!playQueue.length || queuePos < 0 || queuePos >= playQueue.length){ toast("No audio available"); return; }
  const item = playQueue[queuePos]; const verse = currentVerses[item.ayahIndex];
  if(previousPlayingChapter !== item.chapter){ previousPlayingChapter = item.chapter; showSurahCalligraphyBanner(item.chapter); }
  document.querySelectorAll('.ayah.playing').forEach(el => el.classList.remove('playing'));
  if(verse && verse._ui && verse._ui.card){ verse._ui.card.classList.add('playing'); verse._ui.card.scrollIntoView({behavior:'smooth', block:'center'}); verse._ui.card.classList.add('glow'); setTimeout(()=> verse._ui.card.classList.remove('glow'), 1200); }
  if(!item.url){
    const fallback = await fetchAyahAudioFallback(reciterSelect?.value || RECITERS[0].key, item.chapter, item.verse);
    if(fallback){ item.url = fallback; playQueue[queuePos].url = fallback; }
  }
  if(!item.url){ toast("Audio unavailable — try another reciter"); audio?.pause(); if(audio) audio.src = ""; if(playPauseBtn) playPauseBtn.textContent = "▶"; return; }
  audio.src = item.url; audio.currentTime = 0;
  try{ await audio.play(); if(playPauseBtn) playPauseBtn.textContent = "▐▐"; }catch(e){ console.warn("play failed", e); toast("Playback failed — try another reciter"); }
}

async function playSingleAyah(index){ await buildPlayQueue(index); queuePos = index; startQueue(); }
function jumpToAyah(index){ index = Math.max(0, Math.min(currentVerses.length-1, index)); playSingleAyah(index); }

/* prev/next handlers */
prevAyahBtn?.addEventListener('click', ()=> {
  if(playQueue.length===0){ buildPlayQueue(0).then(()=> { if(queuePos>0){ queuePos--; startQueue(); } else toast("Already first ayah"); }); return;
  }
  if(queuePos>0){ queuePos--; startQueue(); } else toast("Already first ayah");
});
nextAyahBtn?.addEventListener('click', ()=> {
  if(playQueue.length===0){ buildPlayQueue(0).then(()=> { if(queuePos < playQueue.length - 1){ queuePos++; startQueue(); } else toast("Already last ayah"); }); return;
  }
  if(queuePos < playQueue.length - 1){ queuePos++; startQueue(); } else toast("Already at last ayah");
});

/* play surah */
playSurahBtn?.addEventListener('click', async ()=> { await buildPlayQueue(0); queuePos = 0; startQueue(); });

/* play/pause/stop */
playPauseBtn?.addEventListener('click', ()=> { if(!audio?.src){ playSurahBtn?.click(); return; } if(audio.paused){ audio.play().then(()=> playPauseBtn.textContent="⏸").catch(()=> toast("Playback failed")); } else { audio.pause(); playPauseBtn.textContent="▶"; } });
stopBtn?.addEventListener('click', ()=> { audio?.pause(); if(audio) audio.currentTime = 0; if(playPauseBtn) playPauseBtn.textContent = "▶"; });

/* audio timeupdate */
audio?.addEventListener('timeupdate', ()=>{
  if(!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  if(seekInput) seekInput.value = pct;
  if(elapsedEl) elapsedEl.textContent = formatTime(audio.currentTime);
  if(durationEl) durationEl.textContent = formatTime(audio.duration);
  const item = playQueue[queuePos];
  if(item){
    const verse = currentVerses[item.ayahIndex];
    if(verse && verse._ui && verse._ui.perProgress) verse._ui.perProgress.value = pct;
  }
});
seekInput?.addEventListener('input', ()=> { if(!audio.duration) return; audio.currentTime = (seekInput.value / 100) * audio.duration; });

/* ended handling (repeats & page-plan advance) */
audio?.addEventListener('ended', async ()=>{
  const repeatMode = repeatModeEl?.value || 'none';
  const repeatCount = Math.max(1, Number(repeatCountEl?.value || 1));

  if(repeatMode === "ayah"){
    const item = playQueue[queuePos];
    item._played = (item._played || 0) + 1;
    if(item._played < repeatCount){ audio.currentTime = 0; audio.play(); return; } else { item._played = 0; }
  }

  if(queuePos < playQueue.length - 1){
    queuePos++; startQueue(); return;
  }

  if(viewModeEl?.value === "page" && pagesToPlay && pagesToPlayIndex < pagesToPlay.length - 1){
    pagesToPlayIndex++;
    const nextPage = pagesToPlay[pagesToPlayIndex];
    if(nextPage){
      quranContainer.querySelector('.mushaf')?.classList.add('page-flip-out');
      setTimeout(async ()=>{
        await loadPage(nextPage);
        quranContainer.querySelector('.mushaf')?.classList.add('page-flip-in');
        setTimeout(()=> quranContainer.querySelector('.mushaf')?.classList.remove('page-flip-in'), 900);
        await buildPlayQueue(0); queuePos = 0; startQueue();
      }, 520);
      return;
    }
  }

  if(viewModeEl?.value === "page"){
    const nextPage = Math.min(604, Number(currentPage) + 1);
    if(nextPage && nextPage !== currentPage){
      quranContainer.querySelector('.mushaf')?.classList.add('page-flip-out');
      setTimeout(async ()=>{
        await loadPage(nextPage);
        quranContainer.querySelector('.mushaf')?.classList.add('page-flip-in');
        setTimeout(()=> quranContainer.querySelector('.mushaf')?.classList.remove('page-flip-in'), 900);
        await buildPlayQueue(0); queuePos = 0; startQueue();
      }, 520);
      return;
    }
  }

  if(repeatMode === "surah"){
    playQueue._repeats = (playQueue._repeats || 0) + 1;
    if(playQueue._repeats < repeatCount){ queuePos = 0; startQueue(); return; } else { playQueue._repeats = 0; }
  }

  if(playPauseBtn) playPauseBtn.textContent = "▶";
  document.querySelectorAll('.ayah.playing').forEach(e=> e.classList.remove('playing'));
});

/* ---------- UI wiring ---------- */
viewModeEl?.addEventListener('change', async ()=>{
  if(viewModeEl.value !== 'page'){ pagesToPlay = null; pagesToPlayIndex = 0; renderCurrentView(); return; }
  try{
    const chap = await fetchJson(`${QURAN_COM}/chapters/${currentSurah}`);
    const chapterObj = chap.chapter || chap;
    let startPage = null;
    if(chapterObj && chapterObj.pages && Array.isArray(chapterObj.pages) && chapterObj.pages.length) startPage = chapterObj.pages[0];
    if(!startPage){
      const amap = await getChapterPageMap(currentSurah);
      const firstPage = Object.values(amap).find(p => !!p);
      if(firstPage) startPage = firstPage;
    }
    if(startPage){ pageNumberInput.value = startPage; await loadPage(startPage); return; }
  }catch(e){ console.debug("page lookup failed", e); }
  toast("Could not determine surah start page automatically — showing verse view.");
  viewModeEl.value = "verse";
  renderCurrentView();
});

translationSelect?.addEventListener('change', ()=> { if(viewModeEl?.value === "page") loadPage(currentPage); else loadSurah(currentSurah); });
reciterSelect?.addEventListener('change', ()=> { audioCache[reciterSelect.value] = audioCache[reciterSelect.value] || {}; toast("Reciter changed"); });

prevPageBtn?.addEventListener('click', ()=> { pagesToPlay = null; pagesToPlayIndex = 0; const p = Math.max(1, Number(pageNumberInput?.value) - 1); if(pageNumberInput) pageNumberInput.value = p; loadPage(p); });
nextPageBtn?.addEventListener('click', ()=> { pagesToPlay = null; pagesToPlayIndex = 0; const p = Math.min(604, Number(pageNumberInput?.value) + 1); if(pageNumberInput) pageNumberInput.value = p; loadPage(p); });
pageNumberInput?.addEventListener('change', ()=> { const p = Math.max(1, Math.min(604, Number(pageNumberInput?.value || 1))); if(pageNumberInput) pageNumberInput.value = p; loadPage(p); });

themeToggle?.addEventListener('click', ()=> { themeLight = !themeLight; document.body.classList.toggle('theme-light', themeLight); const label = themeToggle.querySelector('.dq-btn-label'); if(label) label.textContent = themeLight ? 'Light' : 'Dark'; });
translitToggleBtn?.addEventListener('click', ()=> { translitOn = !translitOn; translitToggleBtn.setAttribute('aria-pressed', translitOn ? 'true' : 'false'); if(translitLabel) translitLabel.textContent = translitOn ? 'On' : 'Off'; renderCurrentView(); });

rangeModeEl?.addEventListener('change', ()=> {
  const mode = rangeModeEl.value;
  if(mode === 'surah'){ surahRangeControls.style.display = ""; juzRangeControls.style.display = "none"; }
  else if(mode === 'juz'){ surahRangeControls.style.display = "none"; juzRangeControls.style.display = ""; }
  else { surahRangeControls.style.display = "none"; juzRangeControls.style.display = "none"; }
});

/* start reading a range */
startRangeBtn?.addEventListener('click', async ()=>{
  const mode = rangeModeEl.value;
  if(mode === 'surah'){
    const s = Number(startSurahEl.value || 1), e = Number(endSurahEl.value || s);
    if(s>e){ toast("Start Surah must be <= End Surah"); return; }
    await readSurahRange(s,e);
  } else if(mode === 'juz'){
    if(!juzList){ toast("Juz data not available"); return; }
    const sj = Number(startJuzEl.value || 1), ej = Number(endJuzEl.value || sj);
    if(sj>ej){ toast("Start Juz must be <= End Juz"); return; }
    await readJuzRange(sj, ej);
  } else if(mode === 'all'){
    await readSurahRange(1,114);
  }
});

/* ---------- read range implementations ---------- */
async function readSurahRange(startS, endS){
  try{
    if(!quranContainer) return;
    quranContainer.innerHTML = `<div class="dq-loading">Preparing Surahs ${startS} → ${endS} …</div>`;
    if(viewModeEl.value === 'page'){
      pagesToPlay = [];
      pagesToPlayIndex = 0;
      for(let s=startS; s<=endS; s++){
        const amap = await getChapterPageMap(s);
        const first = Object.values(amap).find(p => !!p);
        if(first && !pagesToPlay.includes(first)) pagesToPlay.push(first);
      }
      if(pagesToPlay.length){
        await loadPage(pagesToPlay[0]);
        if(pageNumberInput) pageNumberInput.value = pagesToPlay[0];
        await buildPlayQueue(0); queuePos = 0; startQueue();
        return;
      }
    }

    const all = [];
    for(let s=startS; s<=endS; s++){
      const verses = await fetchVersesFromQuranComByChapter(s);
      const transMap = await fetchTranslationsFromQuranEnc(s, translationSelect?.value || 'english');
      const audioUrls = await fetchAudioForSurah(reciterSelect?.value || RECITERS[0].key, s);
      const pageMap = await getChapterPageMap(s);
      verses.forEach(v => {
        let translit = "";
        if(v.words && Array.isArray(v.words)) translit = v.words.map(w => w.transliteration?.text || "").filter(Boolean).join(" ");
        const verseNum = Number(v.verse_number);
        all.push({
          id: v.id, chapter_id: v.chapter_id, verse_number: verseNum,
          text_uthmani: v.text_uthmani, transliteration: translit || "",
          translation: transMap[verseNum] || "", audio: audioUrls[verseNum-1] || "", page: (pageMap && pageMap[verseNum]) || null
        });
      });
    }
    currentVerses = all;
    renderCurrentView();
    await buildPlayQueue(0); queuePos = 0; startQueue();
  }catch(err){ console.error("readSurahRange error", err); toast("Failed to prepare range — see console"); }
}

async function readJuzRange(sj, ej){
  if(!juzList){ toast("Juz metadata not available"); return; }
  try{
    if(!quranContainer) return;
    quranContainer.innerHTML = `<div class="dq-loading">Preparing Juz ${sj} → ${ej} …</div>`;
    if(viewModeEl.value === 'page'){
      const pageSet = new Set();
      for(let j = sj; j <= ej; j++){
        const obj = juzList.find(x => Number(x.juz_number) === j);
        if(!obj) continue;
        const sc = obj.start_chapter, ec = obj.end_chapter;
        for(let chap = sc; chap <= ec; chap++){
          const amap = await getChapterPageMap(chap);
          Object.values(amap).forEach(p => { if(p) pageSet.add(p); });
        }
      }
      const pages = Array.from(pageSet).sort((a,b)=>a-b);
      if(pages.length){
        pagesToPlay = pages; pagesToPlayIndex = 0;
        await loadPage(pagesToPlay[0]);
        if(pageNumberInput) pageNumberInput.value = pagesToPlay[0];
        await buildPlayQueue(0); queuePos = 0; startQueue();
        return;
      }
    }

    const all = [];
    for(let j = sj; j <= ej; j++){
      const obj = juzList.find(x => Number(x.juz_number) === j);
      if(!obj) continue;
      const sc = obj.start_chapter, sv = obj.start_verse, ec = obj.end_chapter, ev = obj.end_verse;
      for(let chap = sc; chap <= ec; chap++){
        const verses = await fetchVersesFromQuranComByChapter(chap);
        const transMap = await fetchTranslationsFromQuranEnc(chap, translationSelect?.value || 'english');
        const audioUrls = await fetchAudioForSurah(reciterSelect?.value || RECITERS[0].key, chap);
        const pageMap = await getChapterPageMap(chap);
        verses.forEach(v => {
          const verseNum = Number(v.verse_number);
          const include = (chap > sc && chap < ec) || (chap === sc && chap === ec && verseNum >= sv && verseNum <= ev) || (chap === sc && chap < ec && verseNum >= sv) || (chap > sc && chap === ec && verseNum <= ev);
          if(include){
            let translit = "";
            if(v.words && Array.isArray(v.words)) translit = v.words.map(w => w.transliteration?.text || "").filter(Boolean).join(" ");
            all.push({
              id: v.id, chapter_id: v.chapter_id, verse_number: verseNum,
              text_uthmani: v.text_uthmani, transliteration: translit || "",
              translation: transMap[verseNum] || "", audio: audioUrls[verseNum-1] || "", page: (pageMap && pageMap[verseNum]) || null
            });
          }
        });
      }
    }
    currentVerses = all;
    renderCurrentView();
    await buildPlayQueue(0); queuePos = 0; startQueue();
  }catch(err){ console.error("readJuzRange error", err); toast("Failed to prepare juz range — see console"); }
}

/* ---------- small utils ---------- */
function formatTime(s){ if(!s || isNaN(s) || !isFinite(s)) return "0:00"; const m = Math.floor(s/60); const sec = Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function updateJuzInfoForSurah(surahId){ if(!juzList || !juzInfoEl){ if(juzInfoEl) juzInfoEl.textContent = `Juz: —`; return; } for(const j of juzList){ if(Number(surahId) >= j.start_chapter && Number(surahId) <= j.end_chapter){ juzInfoEl.textContent = `Juz: ${j.juz_number}`; return; } } juzInfoEl.textContent = `Juz: —`; }
function stripTags(html){ const tmp = document.createElement('div'); tmp.innerHTML = html; return tmp.textContent || tmp.innerText || ''; }

/* ---------- segmented controls (surah/juz) ---------- */
segSurahBtn?.addEventListener('click', ()=> {
  activeListMode = 'surah';
  segSurahBtn.classList.add('active');
  segJuzBtn?.classList.remove('active');
  renderSurahList(chapters);
});
segJuzBtn?.addEventListener('click', ()=> {
  activeListMode = 'juz';
  segJuzBtn.classList.add('active');
  segSurahBtn?.classList.remove('active');
  // show manual juz list (built earlier)
  if(!juzList) buildManualJuzList();
  renderJuzList(juzList);
});

/* ---------- search ---------- */
surahSearchEl?.addEventListener('input', (e)=>{
  const q = (e.target.value || '').trim().toLowerCase();
  if(!q){ renderSurahList(chapters); return; }
  const filtered = chapters.filter(c => {
    const names = `${c.englishName || ''} ${c.name_simple || ''} ${c.name_arabic || ''}`.toLowerCase();
    return String(c.id) === q || names.includes(q);
  });
  renderSurahList(filtered);
});

/* ---------- load surah / page ---------- */
async function loadSurah(surah){
  if(!quranContainer) return;
  quranContainer.innerHTML = `<div class="dq-loading">Loading surah ${surah}…</div>`;
  try{
    const verses = await fetchVersesFromQuranComByChapter(surah);
    const transMap = await fetchTranslationsFromQuranEnc(surah, translationSelect?.value || 'english');
    const audioUrls = await fetchAudioForSurah(reciterSelect?.value || RECITERS[0].key, surah);
    const pageMap = await getChapterPageMap(surah);
    currentVerses = verses.map(v=>{
      let translit = "";
      if(v.words && Array.isArray(v.words)) translit = v.words.map(w => w.transliteration?.text || "").filter(Boolean).join(" ");
      const verseNum = Number(v.verse_number);
      return { id: v.id, chapter_id: v.chapter_id, verse_number: verseNum, text_uthmani: v.text_uthmani, transliteration: translit || "", translation: transMap[verseNum] || "", audio: audioUrls[verseNum-1] || "", page: (pageMap && pageMap[verseNum]) || null };
    });
    currentSurah = Number(surah);
    updateJuzInfoForSurah(currentSurah);
    renderCurrentView();
  }catch(err){ console.error("loadSurah error", err); if(quranContainer) quranContainer.innerHTML = `<div class="dq-loading">Failed to load surah.</div>`; toast("Failed to load surah"); }
}

async function loadPage(page){
  if(!quranContainer) return;
  quranContainer.innerHTML = `<div class="dq-loading">Loading page ${page}…</div>`;
  try{
    const verses = await fetchVersesFromQuranComByPage(page);
    const surahIds = Array.from(new Set(verses.map(v => v.chapter_id)));
    const transMaps = {};
    for(const s of surahIds){
      transMaps[s] = await fetchTranslationsFromQuranEnc(s, translationSelect?.value || 'english');
      await fetchAudioForSurah(reciterSelect?.value || RECITERS[0].key, s);
      await getChapterPageMap(s);
    }
    currentVerses = [];
    currentPageGrouped = {};
    for(const v of verses){
      let translit = "";
      if(v.words && Array.isArray(v.words)) translit = v.words.map(w => w.transliteration?.text || "").filter(Boolean).join(" ");
      const verseNum = Number(v.verse_number);
      const surahId = Number(v.chapter_id);
      const audioList = (audioCache[reciterSelect?.value || RECITERS[0].key] && audioCache[reciterSelect?.value || RECITERS[0].key][surahId]) || [];
      const obj = { id: v.id, chapter_id: surahId, verse_number: verseNum, text_uthmani: v.text_uthmani, transliteration: translit || "", translation: (transMaps[surahId] && transMaps[surahId][verseNum]) || "", audio: audioList[verseNum-1] || "", page: page };
      currentVerses.push(obj);
      if(!currentPageGrouped[surahId]) currentPageGrouped[surahId] = [];
      currentPageGrouped[surahId].push(obj);
    }
    currentPage = Number(page);
    renderCurrentView();
  }catch(err){ console.error("loadPage error", err); if(quranContainer) quranContainer.innerHTML = `<div class="dq-loading">Failed to load page.</div>`; toast("Failed to load page"); }
}

/* ---------- init ---------- */
(async function init(){
  try{
    populateReciters();
    buildManualJuzList();
    populateJuzSelects(juzList);
    try{
      const data = await fetchJson(`${QURAN_COM}/chapters`);
      chapters = data.chapters || [];
    }catch(e){
      console.warn("chapters fetch failed", e);
      chapters = Array.from({length:114}, (_,i)=>({id:i+1, englishName:`Surah ${i+1}`, name: `سورة ${i+1}`, verses:0}));
    }
    renderSurahList(chapters);
    populateSurahSelects(chapters);
    if(startSurahEl) startSurahEl.value = 1;
    if(endSurahEl) endSurahEl.value = chapters.length || 114;
    document.getElementById('segSurah')?.classList.add('active');

    // defaults
    viewModeEl.value = "verse";
    if(pageLabel) pageLabel.style.display = "none";
    document.body.classList.remove('theme-light');

    // initial load
    await loadSurah(1);
  }catch(e){
    console.error("init error", e);
    toast("Initialization failed — check console");
  }
})();

document.getElementById("year").textContent = new Date().getFullYear();
// app.js — Church Platform Logic

/* ══════════════════════════════════════════════════════
   SERMON DATA
   These YouTube videos are confirmed embedding-enabled.
   Replace with your own sermon video IDs when ready.
   ══════════════════════════════════════════════════════ */
const SERMONS = [
  { id: 'TbOuGs4_MhE', title: 'How Great Is Our God',         speaker: 'Chris Tomlin',    duration: '4 min' },
  { id: 'CqybaIesbuA', title: 'What A Beautiful Name',        speaker: 'Hillsong Worship', duration: '5 min' },
  { id: 'XHGQ4kM8GNk', title: 'Oceans (Where Feet May Fail)', speaker: 'Hillsong UNITED',  duration: '9 min' },
  { id: 'yvET2RHxVAE', title: 'Way Maker',                    speaker: 'Leeland',          duration: '7 min' },
  { id: 'h_D3VFfhvs4', title: '10,000 Reasons (Bless the Lord)', speaker: 'Matt Redman',  duration: '5 min' },
  { id: 'IUMmTqCLFT8', title: 'Good Good Father',             speaker: 'Chris Tomlin',    duration: '5 min' },
  { id: 'zBWzpRO5bKo', title: 'Build My Life',                speaker: 'Housefires',       duration: '6 min' },
];

const LIVE_ID = 'jfKfPfyJRdk';

/* ══════════════════════════════════════════════════════
   PRAYER STORE
   ══════════════════════════════════════════════════════ */
const PrayerStore = {
  KEY: 'gcc_prayers_v2',
  get()    { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  set(arr) { localStorage.setItem(this.KEY, JSON.stringify(arr)); },
  add(name, text) {
    const arr  = this.get();
    const item = { id: Date.now().toString(36), name: name.trim(), text: text.trim(), ts: Date.now(), prayed: false };
    arr.unshift(item); this.set(arr); return item;
  },
  pray(id)   { const a = this.get(); const p = a.find(x => x.id === id); if (p) { p.prayed = true; this.set(a); } },
  remove(id) { this.set(this.get().filter(x => x.id !== id)); },
  count()    { return this.get().length; },
  prayedN()  { return this.get().filter(x => x.prayed).length; },
};

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
function esc(s) { const d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `on ${type}`;
  clearTimeout(el._t); el._t = setTimeout(() => { el.className = ''; }, 3200);
}
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* ══════════════════════════════════════════════════════
   SERMONS UI
   ══════════════════════════════════════════════════════ */
const shuffled = [...SERMONS].sort(() => Math.random() - .5);

function renderSermons() {
  const list = document.getElementById('sermon-list');
  if (!list) return;
  list.innerHTML = shuffled.map(s => `
    <div class="sc" data-id="${s.id}" id="sc-${s.id}" role="button" tabindex="0" aria-label="Play ${esc(s.title)}">
      <div class="sc-art">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <div class="sc-info">
        <div class="sc-label">Audio Sermon</div>
        <div class="sc-title">${esc(s.title)}</div>
        <div class="sc-meta">${esc(s.speaker)} &middot; ${s.duration}</div>
      </div>
      <div class="sc-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <button class="play-btn" aria-label="Play ${esc(s.title)}">${playIcon()}</button>
    </div>`).join('');

  list.querySelectorAll('.sc').forEach(card => {
    const handler = () => handlePlay(card.dataset.id);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){e.preventDefault();handler();} });
    card.querySelector('.play-btn').addEventListener('click', e => { e.stopPropagation(); handler(); });
  });
}

function playIcon()  { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`; }
function pauseIcon() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`; }

function handlePlay(id) {
  if (liveActive) stopLive();
  YTAudio.toggle(id);
}

function syncSermonUI() {
  $$('.sc').forEach(card => {
    const id = card.dataset.id;
    const on = YTAudio.isPlaying(id);
    card.classList.toggle('playing', on);
    const btn = card.querySelector('.play-btn');
    if (btn) btn.innerHTML = on ? pauseIcon() : playIcon();
  });
  syncNPBar();
}

/* ══════════════════════════════════════════════════════
   NOW PLAYING BAR
   ══════════════════════════════════════════════════════ */
function syncNPBar() {
  const bar  = document.getElementById('npbar');
  const id   = YTAudio.getCurrent();
  const alive = (id && YTAudio.getPlaying()) || liveActive;
  if (!alive) { bar.classList.remove('on'); return; }
  bar.classList.add('on');
  const titleEl = document.getElementById('np-title');
  const subEl   = document.getElementById('np-sub');
  const playBtn = document.getElementById('np-play');
  if (liveActive) { titleEl.textContent = 'Live Worship Service'; subEl.textContent = 'Now Live'; }
  else {
    const s = SERMONS.find(x => x.id === id);
    titleEl.textContent = s ? s.title : 'Sermon';
    subEl.textContent   = s ? s.speaker : 'Audio';
  }
  if (playBtn) playBtn.innerHTML = YTAudio.getPlaying() ? pauseIcon() : playIcon();
}

/* ══════════════════════════════════════════════════════
   LIVE SERVICE
   ══════════════════════════════════════════════════════ */
let liveActive = false;

function initLive() {
  document.getElementById('listen-btn')?.addEventListener('click', () => liveActive ? stopLive() : startLive());
}
function startLive() {
  YTAudio.stop(); liveActive = true;
  YTAudio.play(LIVE_ID);
  const btn = document.getElementById('listen-btn');
  if (btn) { btn.classList.add('live-on'); btn.querySelector('svg').innerHTML=`<rect x="6" y="6" width="12" height="12" fill="currentColor"/>`; btn.querySelector('span').textContent='Stop'; }
  syncNPBar();
}
function stopLive() {
  YTAudio.stop(); liveActive = false;
  const btn = document.getElementById('listen-btn');
  if (btn) { btn.classList.remove('live-on'); btn.querySelector('svg').innerHTML=`<polygon points="5,3 19,12 5,21" fill="currentColor"/>`; btn.querySelector('span').textContent='Listen'; }
  syncNPBar();
}

/* ══════════════════════════════════════════════════════
   PRAYER WALL
   ══════════════════════════════════════════════════════ */
function initPrayer() {
  const form = document.getElementById('prayer-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const text = document.getElementById('p-text').value.trim();
    if (!name || !text) { toast('Please fill in all fields.', 'er'); return; }
    PrayerStore.add(name, text);
    document.getElementById('p-name').value = '';
    document.getElementById('p-text').value = '';
    renderWall();
    toast('Prayer submitted — we are praying for you.', 'ok');
  });
  renderWall();
}

function renderWall() {
  const wall = document.getElementById('prayer-wall');
  if (!wall) return;
  const prayers = PrayerStore.get();
  if (!prayers.length) {
    wall.innerHTML = `<div class="empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><p>No prayer requests yet. Be the first to share.</p></div>`;
    return;
  }
  wall.innerHTML = prayers.map(p => `
    <div class="prayer-card ${p.prayed?'prayed':''}">
      <div class="p-head">
        <div><div class="p-name">${esc(p.name)}</div><div class="p-time">${ago(p.ts)}</div></div>
        ${p.prayed ? '<span class="p-badge">Prayed</span>' : ''}
      </div>
      <div class="p-text">${esc(p.text)}</div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════
   ADMIN
   ══════════════════════════════════════════════════════ */
function initAdmin() {
  $$('.asi').forEach(item => {
    item.addEventListener('click', () => {
      $$('.asi').forEach(i => i.classList.remove('active'));
      $$('.admin-panel').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(item.dataset.panel)?.classList.add('active');
    });
  });
}
function renderAdminPrayers() {
  const list = document.getElementById('admin-prayers-list');
  if (!list) return;
  const prayers = PrayerStore.get();
  if (!prayers.length) { list.innerHTML = `<div class="empty"><p>No prayer requests yet.</p></div>`; return; }
  list.innerHTML = prayers.map(p => `
    <div class="apc ${p.prayed?'prayed':''}" data-id="${p.id}">
      <div class="apc-head">
        <div><div class="apc-name">${esc(p.name)}</div><div class="apc-time">${new Date(p.ts).toLocaleString()}</div></div>
        ${p.prayed ? '<span class="p-badge">Prayed</span>' : ''}
      </div>
      <div class="apc-text">${esc(p.text)}</div>
      <div class="apc-acts">
        ${!p.prayed ? `<button class="btn-sm btn-green" onclick="adminPray('${p.id}')">Mark as Prayed</button>` : ''}
        <button class="btn-sm btn-red" onclick="adminDel('${p.id}')">Delete</button>
      </div>
    </div>`).join('');
}
function renderAdminStats() {
  const t = document.getElementById('stat-total'); const p = document.getElementById('stat-prayed');
  if (t) t.textContent = PrayerStore.count(); if (p) p.textContent = PrayerStore.prayedN();
}
function adminPray(id) { PrayerStore.pray(id); renderAdminPrayers(); renderAdminStats(); renderWall(); toast('Marked as prayed','ok'); }
function adminDel(id)  { PrayerStore.remove(id); renderAdminPrayers(); renderAdminStats(); renderWall(); toast('Request removed',''); }

/* ══════════════════════════════════════════════════════
   NAV
   ══════════════════════════════════════════════════════ */
function initNav() {
  const burger=document.getElementById('burger'), drawer=document.getElementById('drawer'), overlay=document.getElementById('overlay');
  const open=()=>{drawer.classList.add('open');overlay.classList.add('on');};
  const close=()=>{drawer.classList.remove('open');overlay.classList.remove('on');};
  burger?.addEventListener('click',open); overlay?.addEventListener('click',close);
  $$('[data-route]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); Router.navigate(el.dataset.route); close(); });
  });
}
function initNPBar() {
  document.getElementById('np-play')?.addEventListener('click', () => { YTAudio.getPlaying() ? YTAudio.pause() : YTAudio.resume(); });
  document.getElementById('np-stop')?.addEventListener('click', () => {
    YTAudio.stop(); liveActive = false; syncNPBar(); syncSermonUI();
    const lb=document.getElementById('listen-btn');
    if(lb){lb.classList.remove('live-on');lb.querySelector('svg').innerHTML=`<polygon points="5,3 19,12 5,21" fill="currentColor"/>`;lb.querySelector('span').textContent='Listen';}
  });
}

/* ══════════════════════════════════════════════════════
   ROUTE CHANGE
   ══════════════════════════════════════════════════════ */
document.addEventListener('route', ({ detail: r }) => {
  if (r==='sermons') renderSermons();
  if (r==='prayer')  renderWall();
  if (r==='admin')   { renderAdminPrayers(); renderAdminStats(); }
});

/* ══════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  YTAudio.init();
  YTAudio.onStateChange(({ playing, id }) => { syncSermonUI(); syncNPBar(); });

  Router.define({ home:'pg-home', sermons:'pg-sermons', live:'pg-live', prayer:'pg-prayer', admin:'pg-admin' });

  $$('.card[data-route]').forEach(c => {
    c.style.cursor='pointer';
    c.addEventListener('click', () => Router.navigate(c.dataset.route));
  });

  initNav(); initPrayer(); initLive(); initAdmin(); initNPBar(); renderSermons();
  Router.init('home');

  const asl = document.getElementById('admin-sermon-list');
  if (asl) {
    asl.innerHTML = SERMONS.map(s => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${esc(s.title)}</div>
          <div style="font-size:11px;color:var(--text-2)">${esc(s.speaker)} &middot; ${s.duration} &middot; <code style="color:var(--gold);font-size:10.5px">${s.id}</code></div>
        </div>
      </div>`).join('');
  }
});

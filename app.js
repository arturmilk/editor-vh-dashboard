/* Editor VH · Alinhamento — dashboard estático (GitHub Pages)
   Dados: data/notes.json no próprio repositório, lido e gravado pela API do GitHub. */
(() => {
  'use strict';

  // ---------------------------------------------------------------- config
  const CFG = Object.assign({ owner: '', repo: '', branch: 'main', path: 'data/notes.json' }, window.DASH_CONFIG || {});
  const USERS = {
    arthur: { id: 'arthur', name: 'Arthur', short: 'Arthur', initials: 'A' },
    victor: { id: 'victor', name: 'Victor Hugo', short: 'Victor', initials: 'VH' },
  };
  const STAGES = ['Roteiro', 'Áudio', 'Transcrição', 'Corte', 'J/L-cuts', 'Motion', 'Legenda', 'Render/Master', 'Marca', 'Pipeline', 'Outro'];
  const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];
  const KEYS = { session: 'vhd.session', token: 'vhd.token', local: 'vhd.local', view: 'vhd.view', theme: 'vhd.theme' };
  const POLL_MS = { github: 30000, readonly: 90000 };

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* sem storage */ } },
  };

  // ---------------------------------------------------------------- utils
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfWeek = (d) => addDays(startOfDay(d), -startOfDay(d).getDay());
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmt = (d, o) => new Intl.DateTimeFormat('pt-BR', o).format(d);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const minutesOf = (d) => d.getHours() * 60 + d.getMinutes();
  const fmtDur = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h${pad(m % 60)}` : `${m / 60}h`);

  function relTime(iso) {
    const d = new Date(iso); const diff = (Date.now() - d) / 1000;
    if (diff < 45) return 'agora';
    if (diff < 3600) return `há ${Math.round(diff / 60)} min`;
    if (diff < 86400 && sameDay(d, new Date())) return `hoje, ${fmtTime(d)}`;
    if (sameDay(d, addDays(new Date(), -1))) return `ontem, ${fmtTime(d)}`;
    return `${fmt(d, { day: '2-digit', month: 'short' })}, ${fmtTime(d)}`;
  }

  const ICON = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>',
    unlink: '<svg viewBox="0 0 24 24"><path d="M9 15l-2 2a3 3 0 0 1-4-4l3-3M15 9l2-2a3 3 0 0 1 4 4l-3 3M4 4l16 16"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/></svg>',
    toggle: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="2.5"/></svg>',
  };

  // ---------------------------------------------------------------- store
  class StoreError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  const EMPTY = () => ({ version: 1, notes: [] });
  const b64enc = (s) => { const b = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(bin); };
  const b64dec = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  function normalize(d) {
    d = d && typeof d === 'object' ? d : {};
    const notes = Array.isArray(d.notes) ? d.notes : [];
    return {
      version: 1,
      notes: notes.filter((n) => n && n.id && n.start).map((n) => ({
        id: String(n.id), author: USERS[n.author] ? n.author : 'arthur',
        title: String(n.title || 'Sem título'), body: String(n.body || ''), stage: n.stage || 'Outro',
        start: n.start, duration: Number(n.duration) || 60,
        approved: !!n.approved, approvedBy: n.approvedBy || null, approvedAt: n.approvedAt || null,
        createdAt: n.createdAt || n.start, updatedAt: n.updatedAt || n.createdAt || n.start,
        comments: Array.isArray(n.comments) ? n.comments : [],
      })),
    };
  }

  function detectRepo() {
    if (CFG.owner && CFG.repo) return;
    const h = location.hostname;
    if (!h.endsWith('.github.io')) return;
    CFG.owner = h.split('.')[0];
    const seg = location.pathname.split('/').filter(Boolean)[0];
    CFG.repo = seg && !seg.includes('.') ? seg : h;
  }

  const Store = {
    mode: 'local', sha: null,
    init() {
      detectRepo();
      this.mode = CFG.owner && CFG.repo ? (ls.get(KEYS.token) ? 'github' : 'readonly') : 'local';
    },
    url() { return `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.path}`; },
    headers(json) {
      const h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      const t = ls.get(KEYS.token);
      if (t && this.mode === 'github') h.Authorization = `Bearer ${t}`;
      if (json) h['Content-Type'] = 'application/json';
      return h;
    },
    async remote() {
      const r = await fetch(`${this.url()}?ref=${encodeURIComponent(CFG.branch)}&_=${Date.now()}`, { headers: this.headers(), cache: 'no-store' });
      if (r.status === 404) { this.sha = null; return EMPTY(); }
      if (r.status === 401) throw new StoreError('token', 'Seu token do GitHub é inválido ou expirou.');
      if (!r.ok) throw new StoreError('http', `GitHub respondeu ${r.status}.`);
      const j = await r.json();
      this.sha = j.sha;
      return normalize(j.content ? JSON.parse(b64dec(j.content) || '{}') : {});
    },
    async load() {
      if (this.mode === 'local') {
        const raw = ls.get(KEYS.local);
        if (raw) { try { return normalize(JSON.parse(raw)); } catch { /* recria */ } }
        const seed = seedData(); ls.set(KEYS.local, JSON.stringify(seed)); return seed;
      }
      try { return await this.remote(); } catch (e) {
        if (this.mode === 'readonly') {
          // sem token a API tem limite baixo: cai para o arquivo publicado no Pages
          const r = await fetch(`${CFG.path}?_=${Date.now()}`, { cache: 'no-store' });
          if (r.ok) return normalize(await r.json());
        }
        throw e;
      }
    },
    async mutate(fn, message) {
      if (this.mode === 'readonly') throw new StoreError('readonly', 'Conecte seu token do GitHub para editar.');
      if (this.mode === 'local') {
        const d = await this.load(); fn(d); ls.set(KEYS.local, JSON.stringify(d)); return d;
      }
      for (let attempt = 0; attempt < 5; attempt++) {
        const d = await this.remote();
        fn(d);
        const body = { message, branch: CFG.branch, content: b64enc(JSON.stringify(d, null, 2) + '\n') };
        if (this.sha) body.sha = this.sha;
        const r = await fetch(this.url(), { method: 'PUT', headers: this.headers(true), body: JSON.stringify(body) });
        if (r.ok) { const j = await r.json(); this.sha = j.content && j.content.sha; return d; }
        if (r.status === 409 || r.status === 422) { await sleep(250 * (attempt + 1) + Math.random() * 250); continue; }
        if (r.status === 401) throw new StoreError('token', 'Seu token do GitHub é inválido ou expirou.');
        if (r.status === 403 || r.status === 404) throw new StoreError('perm', 'Seu token não tem permissão de escrita neste repositório.');
        throw new StoreError('http', `GitHub respondeu ${r.status}.`);
      }
      throw new StoreError('conflict', 'Outra pessoa salvou ao mesmo tempo. Tente de novo.');
    },
  };

  function seedData() {
    const w = startOfWeek(new Date());
    const at = (day, h, m = 0) => { const d = addDays(w, day); d.setHours(h, m, 0, 0); return d.toISOString(); };
    const mk = (author, title, stage, start, duration, body, approvedBy) => ({
      id: uid(), author, title, stage, start, duration, body,
      approved: !!approvedBy, approvedBy: approvedBy || null, approvedAt: approvedBy ? start : null,
      createdAt: start, updatedAt: start, comments: [],
    });
    return normalize({ notes: [
      mk('arthur', 'Exemplo · Limpeza de voz com DeepFilterNet', 'Áudio', at(1, 10), 90, 'Anotação de exemplo do modo demonstração.\n\nO que mudou: …\nComo testar: …', 'victor'),
      mk('victor', 'Exemplo · J-cut de 0,5 s sobre pausa', 'J/L-cuts', at(2, 14), 60, 'Anotação de exemplo. Abra, comente e use o interruptor para aprovar.'),
      mk('arthur', 'Exemplo · Serif itálica na palavra-chave', 'Legenda', at(3, 9, 30), 60, ''),
      mk('victor', 'Exemplo · Master −14 LUFS no join', 'Render/Master', at(4, 16), 120, '', 'arthur'),
    ] });
  }

  // ---------------------------------------------------------------- state
  const S = {
    user: null,
    data: EMPTY(),
    view: 'week',
    anchor: startOfDay(new Date()),
    who: { arthur: true, victor: true },
    status: 'all',
    openId: null,
    saving: 0,
    lastSync: null,
    syncError: null,
    seen: null,
    scrolledOnce: false,
    slide: null,
  };

  const other = (u) => (u === 'arthur' ? 'victor' : 'arthur');
  const noteById = (id) => S.data.notes.find((n) => n.id === id);
  const canEdit = () => Store.mode !== 'readonly';
  const isMobile = () => matchMedia('(max-width: 860px)').matches;

  function visibleNotes() {
    return S.data.notes.filter((n) => S.who[n.author] &&
      (S.status === 'all' || (S.status === 'approved' ? n.approved : !n.approved)));
  }
  function visibleDays() {
    if (S.view === 'day') return [startOfDay(S.anchor)];
    const s = startOfWeek(S.anchor); return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }

  // ---------------------------------------------------------------- login
  function showLogin() {
    $('#app').hidden = true; $('#login').hidden = false;
    setTimeout(() => $('#loginForm [name=user]').focus(), 50);
  }
  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const u = f.user.value.trim().toLowerCase();
    const p = f.pass.value.trim().toLowerCase();
    const match = Object.keys(USERS).find((k) => k === u || USERS[k].name.toLowerCase() === u);
    // Barreira simbólica: site estático não tem como guardar segredo.
    if (!match || p !== match) {
      $('#loginError').textContent = 'Usuário ou senha incorretos.';
      f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
      f.pass.select();
      return;
    }
    ls.set(KEYS.session, match);
    f.reset(); $('#loginError').textContent = '';
    start(match);
  });

  // ---------------------------------------------------------------- boot
  function boot() {
    applyTheme(ls.get(KEYS.theme));
    Store.init();
    const saved = ls.get(KEYS.session);
    if (saved && USERS[saved]) start(saved); else showLogin();
  }

  async function start(user) {
    S.user = user;
    S.view = ls.get(KEYS.view) || (isMobile() ? 'day' : 'week');
    $('#login').hidden = true; $('#app').hidden = false;
    const av = $('#avatarBtn'); av.className = `avatar u-${user}`; av.textContent = USERS[user].initials;
    av.setAttribute('aria-label', `Conta de ${USERS[user].name}`);
    renderAll();
    await refresh(true);
    if (Store.mode === 'readonly' && !ls.get(`vhd.skipToken.${user}`)) openTokenModal(true);
  }

  async function refresh(first) {
    if (S.saving) return;
    try {
      const d = await Store.load();
      if (S.saving) return;
      const prevSeen = S.seen;
      S.data = d; S.lastSync = new Date(); S.syncError = null;
      S.seen = new Set(d.notes.map((n) => n.id));
      if (!first && prevSeen) {
        const fresh = d.notes.filter((n) => !prevSeen.has(n.id) && n.author !== S.user);
        if (fresh.length === 1) toast(`${USERS[fresh[0].author].short} adicionou “${fresh[0].title}”`, { action: 'Ver', onAction: () => openNote(fresh[0].id, true) });
        else if (fresh.length > 1) toast(`${fresh.length} anotações novas de ${USERS[other(S.user)].short}`);
      }
    } catch (e) {
      S.syncError = e.message;
      if (first) toast(e.message);
      if (e.code === 'token') { Store.mode = 'readonly'; }
    }
    renderAll();
  }

  let pollTimer = null;
  function schedulePoll() {
    clearTimeout(pollTimer);
    if (Store.mode === 'local' || !S.user) return;
    pollTimer = setTimeout(async () => { if (!document.hidden) await refresh(false); schedulePoll(); }, POLL_MS[Store.mode] || 60000);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.user && Store.mode !== 'local' && (!S.lastSync || Date.now() - S.lastSync > 10000)) refresh(false);
  });

  // ---------------------------------------------------------------- mutations
  async function commit(apply, message, { undo } = {}) {
    if (!canEdit()) { openTokenModal(false); return false; }
    apply(S.data);
    S.saving++; renderAll();
    try {
      const d = await Store.mutate(apply, `[${S.user}] ${message}`);
      S.data = d; S.lastSync = new Date(); S.syncError = null;
      S.seen = new Set(d.notes.map((n) => n.id));
      return true;
    } catch (e) {
      S.syncError = e.message;
      toast(e.message, e.code === 'token' || e.code === 'perm' ? { action: 'Trocar token', onAction: () => openTokenModal(false) } : {});
      if (undo) undo(S.data);
      try { S.data = await Store.load(); } catch { /* mantém local */ }
      return false;
    } finally {
      S.saving--; renderAll(); schedulePoll();
    }
  }

  function createNote(f) {
    const now = new Date().toISOString();
    const note = { id: uid(), author: S.user, ...f, approved: false, approvedBy: null, approvedAt: null, createdAt: now, updatedAt: now, comments: [] };
    S.seen && S.seen.add(note.id);
    return commit((d) => { if (!d.notes.some((n) => n.id === note.id)) d.notes.push(note); }, `Nova anotação: ${note.title}`)
      .then((ok) => { if (ok) { flash(note.id); } return ok ? note : null; });
  }
  function updateNote(id, f) {
    const now = new Date().toISOString();
    return commit((d) => { const n = d.notes.find((x) => x.id === id); if (n) Object.assign(n, f, { updatedAt: now }); }, `Edita anotação: ${f.title || id}`);
  }
  function deleteNote(id) {
    const n = noteById(id);
    return commit((d) => { d.notes = d.notes.filter((x) => x.id !== id); }, `Remove anotação: ${n ? n.title : id}`);
  }
  function setApproved(id, value) {
    const now = new Date().toISOString();
    const sys = { id: uid(), author: S.user, type: 'system', text: value ? 'aprovou esta alteração' : 'marcou como não aprovada', at: now };
    const n = noteById(id);
    return commit((d) => {
      const x = d.notes.find((y) => y.id === id); if (!x) return;
      x.approved = value; x.approvedBy = value ? S.user : null; x.approvedAt = value ? now : null; x.updatedAt = now;
      if (!x.comments.some((c) => c.id === sys.id)) x.comments.push(sys);
    }, `${value ? 'Aprova' : 'Reprova'}: ${n ? n.title : id}`);
  }
  function addComment(id, text) {
    const c = { id: uid(), author: S.user, text, at: new Date().toISOString() };
    const n = noteById(id);
    return commit((d) => { const x = d.notes.find((y) => y.id === id); if (x && !x.comments.some((k) => k.id === c.id)) x.comments.push(c); }, `Comenta em: ${n ? n.title : id}`);
  }

  // ---------------------------------------------------------------- render
  function renderAll() {
    if (!S.user) return;
    renderTopbar();
    renderSidebar();
    renderMain();
    if (S.openId) renderDrawer();
    schedulePoll();
  }

  function renderTopbar() {
    const lbl = $('#rangeLabel');
    if (isMobile() && S.view !== 'list') {
      const d = S.view === 'day' ? S.anchor : visibleDays()[3];
      lbl.innerHTML = S.view === 'day' ? `${S.anchor.getDate()} <em>${fmt(d, { month: 'short' }).replace('.', '')}</em>` : `${cap(fmt(d, { month: 'short' }).replace('.', ''))}`;
    } else if (S.view === 'list') lbl.innerHTML = isMobile() ? 'Todas' : 'Todas as anotações';
    else if (S.view === 'day') lbl.innerHTML = `${cap(fmt(S.anchor, { weekday: 'long' }))}, <em>${fmt(S.anchor, { day: 'numeric', month: 'long' })}</em>`;
    else {
      const d = visibleDays(); const a = d[0]; const b = d[6];
      lbl.innerHTML = a.getMonth() === b.getMonth()
        ? `${cap(fmt(a, { month: 'long' }))} <em>${a.getFullYear()}</em>`
        : `${cap(fmt(a, { month: 'short' }).replace('.', ''))} – ${fmt(b, { month: 'short' }).replace('.', '')} <em>${b.getFullYear()}</em>`;
    }
    const navHidden = S.view === 'list';
    $('.nav-arrows').style.visibility = navHidden ? 'hidden' : '';
    $('#todayBtn').style.visibility = navHidden ? 'hidden' : '';

    $$('#viewSwitch button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === S.view)));
    positionPill();

    const sync = $('#sync');
    let state = 'ok'; let text = 'Sincronizado';
    if (Store.mode === 'local') { state = 'idle'; text = 'Modo local'; }
    else if (S.saving) { state = 'saving'; text = 'Salvando…'; }
    else if (S.syncError) { state = 'error'; text = 'Erro ao sincronizar'; }
    else if (Store.mode === 'readonly') { state = 'idle'; text = 'Somente leitura'; }
    else if (S.lastSync) text = `Sincronizado ${relTime(S.lastSync.toISOString())}`;
    sync.dataset.state = state; $('.sync-text', sync).textContent = text;
    sync.title = S.syncError || (Store.mode === 'github' ? `${CFG.owner}/${CFG.repo} · ${CFG.path}` : text);
  }

  function positionPill() {
    const sel = $('#viewSwitch button[aria-selected="true"]'); const pill = $('#viewSwitch .seg-pill');
    if (!sel || !sel.offsetWidth) return;
    pill.style.width = `${sel.offsetWidth}px`;
    pill.style.transform = `translateX(${sel.offsetLeft}px)`;
  }

  function renderSidebar() {
    const sb = $('#sidebar');
    const me = S.user; const them = other(me);
    const toReview = S.data.notes.filter((n) => n.author === them && !n.approved).sort((a, b) => new Date(b.start) - new Date(a.start));
    const count = (pred) => S.data.notes.filter(pred).length;
    const week = visibleDays(); const wS = startOfWeek(S.anchor); const wE = addDays(wS, 7);
    const inWeek = S.data.notes.filter((n) => { const d = new Date(n.start); return d >= wS && d < wE; });
    const approvedW = inWeek.filter((n) => n.approved).length;
    const pct = inWeek.length ? Math.round((approvedW / inWeek.length) * 100) : 0;
    void week;

    sb.innerHTML = `
      <button class="new-btn" data-act="new">${ICON.plus}<span>Nova anotação</span></button>
      ${miniCal()}
      <section class="side-section">
        <h3>Para você revisar <span class="count-badge ${toReview.length ? '' : 'zero'}">${toReview.length}</span></h3>
        <div class="review-list">
          ${toReview.length ? toReview.slice(0, 5).map((n) => `
            <button class="review-item" data-open="${n.id}" data-jump="1">
              <span class="chip-avatar u-${n.author}">${USERS[n.author].initials}</span>
              <strong>${esc(n.title)}</strong>
              <small>${esc(n.stage)} · ${relTime(n.start)}</small>
            </button>`).join('') : `<p class="empty-mini">Tudo revisado. Nada pendente do ${esc(USERS[them].short)}.</p>`}
          ${toReview.length > 5 ? `<button class="btn btn-text" data-act="see-pending">Ver todas (${toReview.length})</button>` : ''}
        </div>
      </section>
      <section class="side-section">
        <h3>Pessoas</h3>
        <div class="who-list">
          ${Object.values(USERS).map((u) => `
            <label class="check-row ${u.id}">
              <input type="checkbox" data-who="${u.id}" ${S.who[u.id] ? 'checked' : ''}>
              <span class="check-box">${ICON.check}</span>
              <span>${esc(u.name)}${u.id === me ? ' <span style="color:var(--faint)">(você)</span>' : ''}</span>
              <small>${count((n) => n.author === u.id)}</small>
            </label>`).join('')}
        </div>
      </section>
      <section class="side-section">
        <h3>Status</h3>
        <div class="status-list">
          ${[['all', 'Todas', () => true], ['pending', 'Não aprovadas', (n) => !n.approved], ['approved', 'Aprovadas', (n) => n.approved]].map(([k, l, p]) => `
            <button class="radio-row" data-status="${k}" aria-pressed="${S.status === k}"><span class="dot"></span>${l}<small>${count(p)}</small></button>`).join('')}
        </div>
      </section>
      <section class="side-section">
        <h3>Semana em foco</h3>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <div class="week-stats"><span><b>${approvedW}</b> de <b>${inWeek.length}</b> aprovadas</span><span><b>${pct}%</b></span></div>
      </section>`;
  }

  let miniMonth = null;
  function miniCal() {
    const base = miniMonth || new Date(S.anchor.getFullYear(), S.anchor.getMonth(), 1);
    const first = startOfWeek(base); const today = new Date();
    const keys = new Set(S.data.notes.map((n) => dayKey(new Date(n.start))));
    const rS = S.view === 'day' ? startOfDay(S.anchor) : startOfWeek(S.anchor);
    const rE = S.view === 'day' ? addDays(rS, 1) : addDays(rS, 7);
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = addDays(first, i);
      const cls = ['mini-day'];
      if (d.getMonth() !== base.getMonth()) cls.push('out');
      if (S.view !== 'list' && d >= rS && d < rE) cls.push('in-range');
      if (sameDay(d, today)) cls.push('today');
      if (keys.has(dayKey(d))) cls.push('has');
      cells += `<button class="${cls.join(' ')}" data-goto="${dayKey(d)}" aria-label="${fmt(d, { dateStyle: 'full' })}">${d.getDate()}</button>`;
    }
    const dows = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x) => `<span class="dow">${x}</span>`).join('');
    return `<section class="mini-cal">
      <div class="mini-head"><strong>${cap(fmt(base, { month: 'long' }))} ${base.getFullYear()}</strong>
        <span><button class="icon-btn" data-mini="-1" aria-label="Mês anterior">${ICON.left}</button><button class="icon-btn" data-mini="1" aria-label="Próximo mês">${ICON.right}</button></span></div>
      <div class="mini-grid">${dows}${cells}</div></section>`;
  }

  function banner() {
    if (Store.mode === 'readonly') return `<div class="banner"><span><strong>Modo leitura.</strong> Conecte seu token do GitHub uma vez neste navegador para criar, comentar e aprovar.</span><button class="btn btn-primary" data-act="token">Conectar</button></div>`;
    if (Store.mode === 'local') return `<div class="banner"><span><strong>Modo demonstração.</strong> As anotações ficam só neste navegador até o site estar no GitHub Pages.</span></div>`;
    return '';
  }

  function renderMain() {
    const main = $('#main');
    const prevBody = $('.cal-body', main);
    const prevScroll = prevBody ? prevBody.scrollTop : null;
    main.innerHTML = banner() + (S.view === 'list' ? listView() : calView());

    if (S.view !== 'list') {
      const body = $('.cal-body', main);
      const sbw = body.offsetWidth - body.clientWidth;
      $('.cal-head', main).style.setProperty('--sbw', `${sbw}px`);
      if (prevScroll !== null && S.scrolledOnce) body.scrollTop = prevScroll;
      else {
        const hour = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')) || 48;
        const now = new Date();
        const days = visibleDays();
        const fits = body.clientHeight / hour;
        const nowH = now.getHours() + now.getMinutes() / 60;
        let target = 7.5;
        if (days.some((d) => sameDay(d, now)) && (nowH < target || nowH > target + fits - 1.5)) target = Math.max(0, nowH - fits / 2);
        body.scrollTop = target * hour;
        S.scrolledOnce = true;
      }
      if (S.slide) {
        const cal = $('.cal', main); cal.classList.add(`slide-${S.slide}`);
        S.slide = null;
      }
    }
  }

  function calView() {
    const days = visibleDays(); const today = new Date();
    const notes = visibleNotes();
    const head = days.map((d) => `
      <div class="day-head ${sameDay(d, today) ? 'today' : ''}" data-goto="${dayKey(d)}" data-goview="day">
        <span class="dow">${fmt(d, { weekday: 'short' }).replace('.', '')}</span>
        <span class="dnum">${d.getDate()}</span>
      </div>`).join('');
    const hours = Array.from({ length: 24 }, (_, h) => (h ? `<span style="top:calc(var(--hour) * ${h})">${pad(h)}:00</span>` : '')).join('');
    const cols = days.map((d) => {
      const dn = notes.filter((n) => sameDay(new Date(n.start), d));
      const isToday = sameDay(d, today);
      const now = isToday ? `<div class="now-line" style="top:calc(var(--hour) * ${minutesOf(today) / 60})"></div>` : '';
      return `<div class="col ${isToday ? 'today' : ''}" data-date="${dayKey(d)}">${layoutDay(dn)}${now}<div class="slot-ghost"></div></div>`;
    }).join('');
    const hasAny = notes.length > 0;
    return `<div class="cal" data-view="${S.view}" data-empty="${!hasAny}">
      <div class="cal-head"><div class="gutter"></div>${head}</div>
      <div class="cal-body"><div class="cal-grid"><div class="hours">${hours}</div><div class="cols">${cols}</div></div></div>
    </div>`;
  }

  // posiciona eventos sobrepostos lado a lado, como no Google Agenda
  function layoutDay(list) {
    const items = list.map((n) => {
      const s = minutesOf(new Date(n.start));
      const e = Math.min(24 * 60, s + Math.max(15, n.duration));
      return { n, s, e, col: 0, cols: 1 };
    }).sort((a, b) => a.s - b.s || b.e - a.e);
    let cluster = []; let clusterEnd = -1;
    const flush = () => {
      const ends = [];
      cluster.forEach((it) => {
        let c = ends.findIndex((end) => end <= it.s);
        if (c === -1) { c = ends.length; ends.push(it.e); } else ends[c] = it.e;
        it.col = c;
      });
      cluster.forEach((it) => { it.cols = ends.length; });
      cluster = [];
    };
    items.forEach((it) => {
      if (cluster.length && it.s >= clusterEnd) flush();
      cluster.push(it); clusterEnd = Math.max(clusterEnd, it.e);
    });
    if (cluster.length) flush();

    return items.map(({ n, s, e, col, cols }) => {
      const dur = e - s; const short = dur < 45; const mid = !short && dur <= 75;
      const w = 100 / cols;
      const start = new Date(n.start);
      return `<button class="ev u-${n.author} ${n.approved ? 'approved' : 'pending'} ${short ? 'short' : ''} ${mid ? 'mid' : ''}" data-open="${n.id}"
          style="top:calc(var(--hour) * ${s / 60} + 1px);height:calc(var(--hour) * ${dur / 60} - 3px);left:calc(${col * w}% + 3px);width:calc(${w}% - 7px)"
          title="${esc(n.title)} · ${n.approved ? 'Aprovada' : 'Não aprovada'}">
        <span class="ev-title">${esc(n.title)}</span>
        <span class="ev-meta">${fmtTime(start)} · ${esc(n.stage)}${n.comments.filter((c) => c.type !== 'system').length ? ` · 💬 ${n.comments.filter((c) => c.type !== 'system').length}` : ''}</span>
        <span class="ev-status" aria-hidden="true">${n.approved ? ICON.check : ''}</span>
      </button>`;
    }).join('');
  }

  function listView() {
    const notes = visibleNotes().slice().sort((a, b) => new Date(b.start) - new Date(a.start));
    if (!notes.length) {
      return `<div class="empty"><div><h3>Nada por <em>aqui</em> ainda</h3><p>Registre a primeira alteração no agente de edição.</p>
        <button class="btn btn-primary" data-act="new">${ICON.plus} Nova anotação</button></div></div>`;
    }
    const groups = new Map();
    notes.forEach((n) => { const k = dayKey(new Date(n.start)); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); });
    const today = new Date();
    let html = '';
    groups.forEach((items, k) => {
      const d = new Date(`${k}T12:00:00`);
      html += `<div class="list-day">
        <div class="list-date ${sameDay(d, today) ? 'today' : ''}"><span class="dnum">${d.getDate()}</span><span class="dow">${fmt(d, { month: 'short' }).replace('.', '')} · ${fmt(d, { weekday: 'short' }).replace('.', '')}</span></div>
        <div class="list-items">${items.sort((a, b) => new Date(a.start) - new Date(b.start)).map((n) => `
          <button class="list-item" data-open="${n.id}">
            <time>${fmtTime(new Date(n.start))}</time>
            <span class="bar u-${n.author}"></span>
            <span><strong>${esc(n.title)}</strong><small>${esc(USERS[n.author].short)} · ${esc(n.stage)}${n.comments.filter((c) => c.type !== 'system').length ? ` · ${n.comments.filter((c) => c.type !== 'system').length} coment.` : ''}</small></span>
            <span class="status-pill ${n.approved ? 'ok' : ''}">${n.approved ? `${ICON.check} Aprovada` : 'Não aprovada'}</span>
          </button>`).join('')}</div>
      </div>`;
    });
    return `<div class="list"><div class="list-inner">${html}</div></div>`;
  }

  // ---------------------------------------------------------------- drawer
  function openNote(id, jump) {
    const n = noteById(id); if (!n) return;
    if (jump && S.view !== 'list') {
      const d = startOfDay(new Date(n.start));
      if (!visibleDays().some((x) => sameDay(x, d))) { S.anchor = d; S.scrolledOnce = false; }
    }
    S.openId = id; S.confirmDelete = false;
    renderAll();
    const dr = $('#drawer');
    requestAnimationFrame(() => { dr.classList.add('open'); dr.setAttribute('aria-hidden', 'false'); $('#drawerScrim').classList.add('show'); dr.focus({ preventScroll: true }); });
    if (jump) flash(id);
  }
  function closeNote() {
    S.openId = null;
    const dr = $('#drawer'); dr.classList.remove('open'); dr.setAttribute('aria-hidden', 'true');
    $('#drawerScrim').classList.remove('show');
  }

  function renderDrawer() {
    const dr = $('#drawer');
    const n = noteById(S.openId);
    if (!n) { closeNote(); return; }
    const prevInput = $('#commentInput', dr); const draft = prevInput ? prevInput.value : '';
    const hadFocus = prevInput && document.activeElement === prevInput;
    const prevScroll = $('.dr-scroll', dr) ? $('.dr-scroll', dr).scrollTop : 0;
    const start = new Date(n.start); const end = new Date(start.getTime() + n.duration * 60000);
    const mine = n.author === S.user;
    const editable = canEdit();
    const approvalSub = n.approved
      ? `Aprovado por ${esc(USERS[n.approvedBy] ? USERS[n.approvedBy].short : '—')} · ${relTime(n.approvedAt)}`
      : mine ? `Aguardando o ${esc(USERS[other(S.user)].short)} testar` : 'Testou e funcionou? Ligue o interruptor.';

    dr.innerHTML = `
      <div class="dr-top">
        <span class="tag">${esc(n.stage)}</span>
        <span class="spacer"></span>
        ${editable && mine ? `<button class="icon-btn" data-act="edit" aria-label="Editar" title="Editar">${ICON.edit}</button>
        <button class="icon-btn" data-act="ask-delete" aria-label="Excluir" title="Excluir">${ICON.trash}</button>` : ''}
        <button class="icon-btn" data-act="close" aria-label="Fechar" title="Fechar (Esc)">${ICON.close}</button>
      </div>
      ${S.confirmDelete ? `<div class="confirm-row"><span>Excluir esta anotação para os dois?</span>
        <button class="btn btn-text" data-act="cancel-delete">Cancelar</button><button class="btn btn-danger" data-act="delete">Excluir</button></div>` : ''}
      <div class="dr-scroll">
        <div class="dr-author"><span class="chip-avatar u-${n.author}">${USERS[n.author].initials}</span><span><b>${esc(USERS[n.author].name)}</b> registrou ${relTime(n.createdAt)}</span></div>
        <h2 class="dr-title">${esc(n.title)}</h2>
        <div class="dr-when">${cap(fmt(start, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${fmtTime(start)}–${fmtTime(end)}</div>

        <div class="approve-card ${n.approved ? 'on' : ''} ${editable ? '' : 'readonly'}">
          <div class="txt"><strong>${n.approved ? 'Aprovado' : 'Não aprovado'}</strong><small>${approvalSub}</small></div>
          <button class="switch" role="switch" aria-checked="${n.approved}" aria-label="Aprovado" data-act="toggle" ${editable ? '' : 'disabled'}>
            <span class="thumb">${ICON.check}</span>
          </button>
        </div>

        <div class="dr-label">O que mudou</div>
        <div class="dr-body ${n.body ? '' : 'empty-body'}">${n.body ? linkify(n.body) : 'Sem descrição.'}</div>

        <div class="dr-label">Conversa e histórico</div>
        <div class="comments">
          ${n.comments.length ? n.comments.map((c) => c.type === 'system' ? `
            <div class="comment system"><span class="sys-ico">${ICON.toggle}</span>
              <div><div class="comment-head"><b>${esc(USERS[c.author] ? USERS[c.author].short : c.author)}</b> ${esc(c.text)}<time>${relTime(c.at)}</time></div></div></div>` : `
            <div class="comment"><span class="chip-avatar u-${c.author}">${USERS[c.author] ? USERS[c.author].initials : '?'}</span>
              <div><div class="comment-head"><b>${esc(USERS[c.author] ? USERS[c.author].short : c.author)}</b><time>${relTime(c.at)}</time></div><p>${linkify(c.text)}</p></div></div>`).join('')
            : '<p class="empty-mini">Ninguém comentou ainda. Diga o que testou ou o que falta.</p>'}
        </div>
      </div>
      ${editable ? `<form class="dr-foot" id="commentForm">
        <textarea id="commentInput" rows="1" placeholder="Escreva um comentário…" aria-label="Comentário"></textarea>
        <button class="send-btn" type="submit" aria-label="Enviar" disabled>${ICON.send}</button>
      </form>` : ''}`;

    const sc = $('.dr-scroll', dr); sc.scrollTop = prevScroll;
    const input = $('#commentInput', dr);
    if (input) {
      input.value = draft; autoGrow(input); $('.send-btn', dr).disabled = !draft.trim();
      if (hadFocus) { input.focus(); input.setSelectionRange(draft.length, draft.length); }
    }
  }

  function autoGrow(t) { t.style.height = 'auto'; t.style.height = `${Math.min(140, t.scrollHeight + 2)}px`; }

  $('#drawer').addEventListener('input', (e) => {
    if (e.target.id === 'commentInput') { autoGrow(e.target); $('#drawer .send-btn').disabled = !e.target.value.trim(); }
  });
  $('#drawer').addEventListener('keydown', (e) => {
    if (e.target.id === 'commentInput' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#commentForm').requestSubmit(); }
  });
  $('#drawer').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#commentInput'); const text = input.value.trim(); if (!text || !S.openId) return;
    input.value = ''; autoGrow(input);
    const id = S.openId;
    await addComment(id, text);
    const sc = $('#drawer .dr-scroll'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
  });
  $('#drawer').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = S.openId; const n = noteById(id);
    switch (b.dataset.act) {
      case 'close': closeNote(); break;
      case 'edit': openNoteModal(n); break;
      case 'ask-delete': S.confirmDelete = true; renderDrawer(); break;
      case 'cancel-delete': S.confirmDelete = false; renderDrawer(); break;
      case 'delete': {
        closeNote();
        const ok = await deleteNote(id);
        if (ok) toast('Anotação excluída');
        break;
      }
      case 'toggle': {
        const value = !n.approved;
        if (navigator.vibrate) navigator.vibrate(8);
        await setApproved(id, value);
        break;
      }
      default:
    }
  });
  $('#drawerScrim').addEventListener('click', closeNote);

  // ---------------------------------------------------------------- modal
  function closeModal() {
    const w = $('#modalWrap'); if (w.hidden) return;
    w.classList.add('closing');
    setTimeout(() => { w.hidden = true; w.classList.remove('closing'); w.innerHTML = ''; }, 160);
  }
  function showModal(html, onReady) {
    const w = $('#modalWrap'); w.innerHTML = html; w.hidden = false; w.classList.remove('closing');
    onReady && onReady(w);
  }
  $('#modalWrap').addEventListener('mousedown', (e) => { if (e.target.id === 'modalWrap') closeModal(); });

  function openNoteModal(note, preset) {
    if (!canEdit()) { openTokenModal(false); return; }
    const editing = !!note;
    let start = note ? new Date(note.start) : preset || roundNow();
    const dur = note ? note.duration : 60;
    let stage = note ? note.stage : (ls.get('vhd.lastStage') || 'Motion');
    showModal(`
      <form class="modal" id="noteForm" novalidate>
        <h2>${editing ? 'Editar <em>anotação</em>' : 'Nova <em>anotação</em>'}</h2>
        <input class="title-input" name="title" maxlength="140" placeholder="O que você mudou no agente?" value="${esc(note ? note.title : '')}" required autocomplete="off">
        <div class="row3">
          <label class="field"><span>Data</span><input type="date" name="date" value="${dayKey(start)}" required></label>
          <label class="field"><span>Hora</span><input type="time" name="time" step="900" value="${fmtTime(start)}" required></label>
          <label class="field"><span>Duração</span><select name="duration">${DURATIONS.map((m) => `<option value="${m}" ${m === dur ? 'selected' : ''}>${fmtDur(m)}</option>`).join('')}</select></label>
        </div>
        <div class="field"><span>Etapa</span><div class="chips" id="stageChips">${STAGES.map((s) => `<button type="button" class="chip" data-stage="${esc(s)}" aria-pressed="${s === stage}">${esc(s)}</button>`).join('')}</div></div>
        <label class="field"><span>Descrição</span>
          <textarea name="body" placeholder="O que mudou e por quê&#10;Como testar (comando, vídeo, trecho)&#10;O que observar no resultado">${esc(note ? note.body : '')}</textarea></label>
        <div class="modal-foot">
          <button type="button" class="btn btn-text" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Salvar' : 'Registrar'}</button>
        </div>
      </form>`, (w) => {
      const f = $('#noteForm', w);
      setTimeout(() => f.title.focus(), 30);
      $('#stageChips', w).addEventListener('click', (e) => {
        const c = e.target.closest('.chip'); if (!c) return;
        stage = c.dataset.stage; $$('.chip', w).forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      });
      $('[data-close]', w).addEventListener('click', closeModal);
      f.body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) f.requestSubmit(); });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = f.title.value.trim();
        if (!title) { f.title.focus(); f.title.classList.remove('shake'); void f.title.offsetWidth; f.title.style.borderColor = 'var(--blue)'; return; }
        const [y, mo, d] = f.date.value.split('-').map(Number); const [h, mi] = (f.time.value || '09:00').split(':').map(Number);
        start = new Date(y, mo - 1, d, h, mi);
        if (Number.isNaN(start.getTime())) { f.date.focus(); return; }
        const fields = { title, body: f.body.value.trim(), stage, start: start.toISOString(), duration: Number(f.duration.value) };
        ls.set('vhd.lastStage', stage);
        closeModal();
        if (editing) { await updateNote(note.id, fields); }
        else {
          if (S.view !== 'list' && !visibleDays().some((x) => sameDay(x, start))) { S.anchor = startOfDay(start); S.scrolledOnce = false; }
          const created = await createNote(fields);
          if (created) toast('Anotação registrada', { action: 'Abrir', onAction: () => openNote(created.id) });
        }
      });
    });
  }

  function roundNow() { const d = new Date(); d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0); return d; }

  function openTokenModal(firstTime) {
    if (Store.mode === 'local') { toast('Disponível quando o site estiver no GitHub Pages.'); return; }
    const repo = `${CFG.owner}/${CFG.repo}`;
    showModal(`
      <form class="modal" id="tokenForm" novalidate>
        <h2>Conectar ao <em>GitHub</em></h2>
        <p class="lead">As anotações ficam salvas no repositório <b>${esc(repo)}</b>. Para gravar, cada um cola seu próprio token uma vez por navegador. Ele fica só neste aparelho.</p>
        <ol class="steps">
          <li>Abra <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=Editor%20VH%20dashboard" target="_blank" rel="noopener"><b>GitHub → novo token (classic)</b></a>.</li>
          <li>Deixe marcado só <code>public_repo</code>, escolha a validade e clique em <b>Generate token</b>.</li>
          <li>Copie o token (começa com <code>ghp_</code>) e cole abaixo.</li>
        </ol>
        <label class="field"><span>Token</span><input name="token" type="password" placeholder="ghp_…" autocomplete="off" spellcheck="false" required></label>
        <p class="login-error" id="tokenError" role="alert"></p>
        <div class="modal-foot">
          <button type="button" class="btn btn-text" data-skip>${firstTime ? 'Agora não (só leitura)' : 'Cancelar'}</button>
          <button type="submit" class="btn btn-primary">Conectar</button>
        </div>
      </form>`, (w) => {
      const f = $('#tokenForm', w);
      setTimeout(() => f.token.focus(), 30);
      $('[data-skip]', w).addEventListener('click', () => { if (firstTime) ls.set(`vhd.skipToken.${S.user}`, '1'); closeModal(); });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const t = f.token.value.trim(); const err = $('#tokenError', w);
        if (!t) return;
        const btn = $('[type=submit]', f); btn.disabled = true; btn.textContent = 'Verificando…';
        try {
          const r = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${t}` }, cache: 'no-store' });
          if (r.status === 401) throw new Error('Token inválido.');
          if (!r.ok) throw new Error(`Não encontrei o repositório (${r.status}).`);
          const j = await r.json();
          if (j.permissions && !j.permissions.push) throw new Error('Esse token não tem permissão de escrita. Peça para ser colaborador do repositório.');
          ls.set(KEYS.token, t); Store.mode = 'github';
          closeModal(); toast('GitHub conectado. Agora você pode editar.');
          await refresh(true);
        } catch (ex) {
          err.textContent = ex.message; btn.disabled = false; btn.textContent = 'Conectar';
        }
      });
    });
  }

  function openShortcuts() {
    showModal(`<div class="modal"><h2>Atalhos de <em>teclado</em></h2>
      <ol class="steps" style="list-style:none;padding:0">
        <li><kbd>N</kbd> nova anotação</li><li><kbd>T</kbd> ir para hoje</li>
        <li><kbd>←</kbd> <kbd>→</kbd> período anterior / próximo</li>
        <li><kbd>D</kbd> dia · <kbd>S</kbd> semana · <kbd>L</kbd> lista</li>
        <li><kbd>Esc</kbd> fechar painel</li><li><kbd>Enter</kbd> envia comentário · <kbd>Shift</kbd>+<kbd>Enter</kbd> quebra linha</li>
      </ol><div class="modal-foot"><button class="btn btn-primary" data-close>Fechar</button></div></div>`,
    (w) => $('[data-close]', w).addEventListener('click', closeModal));
  }

  // ---------------------------------------------------------------- toast
  function toast(msg, { action, onAction, ms = 4200 } = {}) {
    const box = $('#toasts');
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
    const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
    if (action) $('button', el).addEventListener('click', () => { kill(); onAction && onAction(); });
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(kill, ms);
  }

  function flash(id) {
    requestAnimationFrame(() => {
      const el = $(`#main [data-open="${CSS.escape(id)}"]`); if (!el) return;
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      const body = $('.cal-body'); if (body && el.classList.contains('ev')) {
        const top = el.offsetTop - body.clientHeight / 3;
        if (el.offsetTop < body.scrollTop || el.offsetTop > body.scrollTop + body.clientHeight - 40) body.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // ---------------------------------------------------------------- theme & menu
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  function cycleTheme() {
    const cur = document.documentElement.dataset.theme;
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = cur ? cur === 'dark' : sysDark;
    const next = isDark ? 'light' : 'dark';
    ls.set(KEYS.theme, next); applyTheme(next);
  }

  function toggleMenu(force) {
    const m = $('#userMenu'); const open = force ?? m.hidden;
    if (!open) { m.hidden = true; $('#avatarBtn').setAttribute('aria-expanded', 'false'); return; }
    const u = USERS[S.user];
    const repoTxt = Store.mode === 'local' ? 'Modo local (este navegador)' : `${CFG.owner}/${CFG.repo}`;
    m.innerHTML = `
      <div class="menu-head"><strong>${esc(u.name)}</strong><small>${esc(repoTxt)}</small></div>
      ${Store.mode !== 'local' ? `<button data-menu="token">${ICON.key}${Store.mode === 'github' ? 'Trocar token do GitHub' : 'Conectar ao GitHub'}</button>` : ''}
      ${Store.mode === 'github' ? `<button data-menu="untoken">${ICON.unlink}Desconectar token</button>` : ''}
      <button data-menu="theme">${ICON.moon}Alternar tema claro/escuro</button>
      <button data-menu="keys">${ICON.keyboard}Atalhos de teclado</button>
      <button data-menu="logout">${ICON.out}Sair</button>`;
    m.hidden = false; $('#avatarBtn').setAttribute('aria-expanded', 'true');
  }
  $('#avatarBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
  $('#userMenu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-menu]'); if (!b) return;
    toggleMenu(false);
    switch (b.dataset.menu) {
      case 'token': openTokenModal(false); break;
      case 'untoken': ls.del(KEYS.token); Store.mode = 'readonly'; toast('Token removido deste navegador.'); renderAll(); break;
      case 'theme': cycleTheme(); break;
      case 'keys': openShortcuts(); break;
      case 'logout': ls.del(KEYS.session); closeNote(); S.user = null; clearTimeout(pollTimer); showLogin(); break;
      default:
    }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu-wrap')) toggleMenu(false); });

  // ---------------------------------------------------------------- navigation
  function go(dir) {
    if (S.view === 'list') return;
    S.anchor = addDays(S.anchor, (S.view === 'day' ? 1 : 7) * dir);
    S.slide = dir > 0 ? 'next' : 'prev'; miniMonth = null;
    renderAll();
  }
  function goToday() { S.anchor = startOfDay(new Date()); S.scrolledOnce = false; miniMonth = null; renderAll(); }
  function setView(v) {
    if (v === S.view) return;
    S.view = v; ls.set(KEYS.view, v); S.scrolledOnce = false; renderAll();
  }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarScrim').classList.remove('show'); }

  $('#prevBtn').addEventListener('click', () => go(-1));
  $('#nextBtn').addEventListener('click', () => go(1));
  $('#todayBtn').addEventListener('click', goToday);
  $('#viewSwitch').addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) setView(b.dataset.view); });
  $('#fab').addEventListener('click', () => openNoteModal());
  $('#menuBtn').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#sidebarScrim').classList.add('show'); });
  $('#sidebarScrim').addEventListener('click', closeSidebar);

  $('#sidebar').addEventListener('change', (e) => {
    const w = e.target.dataset.who; if (!w) return;
    S.who[w] = e.target.checked; renderAll();
  });
  $('#sidebar').addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-open],[data-goto],[data-status],[data-mini]'); if (!t) return;
    if (t.dataset.act === 'new') { closeSidebar(); openNoteModal(); }
    else if (t.dataset.act === 'see-pending') { S.status = 'pending'; S.who = { arthur: S.user !== 'arthur', victor: S.user !== 'victor' }; setView('list'); renderAll(); closeSidebar(); }
    else if (t.dataset.open) { closeSidebar(); openNote(t.dataset.open, true); }
    else if (t.dataset.status) { S.status = t.dataset.status; renderAll(); }
    else if (t.dataset.mini) {
      const base = miniMonth || new Date(S.anchor.getFullYear(), S.anchor.getMonth(), 1);
      miniMonth = new Date(base.getFullYear(), base.getMonth() + Number(t.dataset.mini), 1); renderSidebar();
    } else if (t.dataset.goto) {
      S.anchor = new Date(`${t.dataset.goto}T00:00:00`); miniMonth = null;
      if (S.view === 'list') S.view = isMobile() ? 'day' : 'week';
      S.scrolledOnce = false; renderAll(); closeSidebar();
    }
  });

  $('#main').addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act) { if (act.dataset.act === 'new') openNoteModal(); if (act.dataset.act === 'token') openTokenModal(false); return; }
    const open = e.target.closest('[data-open]'); if (open) { openNote(open.dataset.open); return; }
    const head = e.target.closest('.day-head');
    if (head) { S.anchor = new Date(`${head.dataset.goto}T00:00:00`); setView('day'); renderAll(); return; }
    const col = e.target.closest('.col');
    if (col && e.target === col || (col && e.target.classList.contains('slot-ghost'))) {
      const m = slotMinutes(col, e.clientY);
      const d = new Date(`${col.dataset.date}T00:00:00`); d.setMinutes(m);
      openNoteModal(null, d);
    }
  });
  function slotMinutes(col, clientY) {
    const r = col.getBoundingClientRect();
    const hour = r.height / 24;
    return Math.max(0, Math.min(23 * 60 + 30, Math.floor(((clientY - r.top) / hour) * 2) * 30));
  }
  $('#main').addEventListener('mousemove', (e) => {
    const col = e.target.classList && e.target.classList.contains('col') ? e.target : null;
    $$('#main .slot-ghost.show').forEach((g) => { if (!col || g.parentElement !== col) g.classList.remove('show'); });
    if (!col || !canEdit()) return;
    const m = slotMinutes(col, e.clientY); const g = $('.slot-ghost', col);
    g.style.top = `calc(var(--hour) * ${m / 60})`; g.textContent = `+ ${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    g.classList.add('show');
  });

  document.addEventListener('keydown', (e) => {
    if (!S.user) return;
    if (e.key === 'Escape') {
      if (!$('#modalWrap').hidden) closeModal();
      else if (!$('#userMenu').hidden) toggleMenu(false);
      else if (S.openId) closeNote();
      else closeSidebar();
      return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey || !$('#modalWrap').hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'n') { e.preventDefault(); openNoteModal(); }
    else if (k === 't') goToday();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else if (k === 'd') setView('day');
    else if (k === 's' || k === 'w') setView('week');
    else if (k === 'l') setView('list');
    else if (k === '?') openShortcuts();
  });

  // linha do "agora" e textos relativos
  setInterval(() => { if (S.user && !S.saving) { renderTopbar(); const nl = $('#main .now-line'); if (nl) nl.style.top = `calc(var(--hour) * ${minutesOf(new Date()) / 60})`; } }, 60000);
  window.addEventListener('resize', () => { if (S.user) renderTopbar(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionPill);

  boot();
})();

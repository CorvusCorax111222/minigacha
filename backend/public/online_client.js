(() => {
    const API_BASE = (() => {
    if (location && (location.protocol === "http:" || location.protocol === "https:")) return "";
    return ""; // resolved lazily by apiFetchBase() below
  })();
  const TOKEN_KEY = "MG_ONLINE_TOKEN";
  const LEGACY_TOKEN_KEYS = ["ONLINE_TOKEN_V2","ONLINE_TOKEN"];

  function persistToken(t) {
    if (!t) return;
    try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { }
    for (const k of LEGACY_TOKEN_KEYS) {
      try { localStorage.setItem(k, t); } catch (e) { }
    }
    try { sessionStorage.setItem(TOKEN_KEY, t); } catch (e) { }
    try { document.cookie = `${TOKEN_KEY}=${encodeURIComponent(t)}; Path=/; SameSite=Lax`; } catch (e) { }
  }

  function readCookieToken() {
    try {
      const esc = TOKEN_KEY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const m = document.cookie.match(new RegExp('(?:^|; )' + esc + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : "";
    } catch (e) {
      return "";
    }
  }

  let resolvedBase = null;
  async function apiFetchBase() {
    if (resolvedBase !== null) return resolvedBase;
    if (location && (location.protocol === "http:" || location.protocol === "https:")) {
      resolvedBase = "";
      return resolvedBase;
    }
    const candidates = [];
    try {
      const last = localStorage.getItem("MG_LAST_API_BASE") || "";
      if (last.trim()) candidates.push(last.trim().replace(/\/$/, ""));
    } catch (e) { }
    candidates.push("http://localhost:8787", "http://127.0.0.1:8787");

    for (const base of candidates) {
      try {
        const r = await fetch(base + "/api/ping", { method: "GET" });
        if (r.ok) {
          resolvedBase = base;
          try { localStorage.setItem("MG_LAST_API_BASE", base); } catch (e) { }
          return resolvedBase;
        }
      } catch (e) { }
    }
    resolvedBase = candidates[0] || "http://localhost:8787";
    return resolvedBase;
  }

  let token = (()=>{
    try {
      const v = localStorage.getItem(TOKEN_KEY);
      if (v) return v;
      for (const k of LEGACY_TOKEN_KEYS) {
        const lv = localStorage.getItem(k);
        if (lv) {
          persistToken(lv);
          return lv;
        }
      }
    } catch (e) { }
    try {
      const sv = sessionStorage.getItem(TOKEN_KEY);
      if (sv) {
        persistToken(sv);
        return sv;
      }
    } catch (e) { }
    const cv = readCookieToken();
    if (cv) {
      persistToken(cv);
      return cv;
    }
    return "";
  })();
  let saveTimer = null;
  let lastPush = 0;
  let lastSaveHash = "";
  
  function fastHash32(str) {
    let h1 = 0x811c9dc5; // FNV-1a
    for (let i = 0; i < str.length; i++) {
      h1 ^= str.charCodeAt(i);
      h1 = (h1 + ((h1 << 1) + (h1 << 4) + (h1 << 7) + (h1 << 8) + (h1 << 24))) >>> 0;
    }
    return ("00000000" + h1.toString(16)).slice(-8);
  }

let periodicSyncTimer = null;

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "style") Object.assign(e.style, v);
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (k === "class") e.className = v;
      else e.setAttribute(k, v);
    });
    for (const c of children) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    return e;
  }


  function avatarTinyNode(avatar) {
    const wrap = el("div", { style: { width: "34px", height: "34px", borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" } });
    if (avatar && typeof avatar.image === "string" && avatar.image.startsWith("data:image/")) {
      const img = el("img", { src: avatar.image, style: { width: "100%", height: "100%", objectFit: "cover" } });
      wrap.appendChild(img);
      return wrap;
    }
    const ico = (avatar && typeof avatar.icon === "string" && avatar.icon.trim()) ? avatar.icon.trim() : "👤";
    const col = (avatar && typeof avatar.color === "string" && avatar.color.trim()) ? avatar.color.trim() : "#8fb3ff";
    wrap.appendChild(el("span", { style: { fontSize: "18px", lineHeight: "1", color: col } }, [ico]));
    return wrap;
  }

  async function api(path, { method = "GET", body = null } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const base = await apiFetchBase();
    const res = await fetch(base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const txt = await res.text();
    let data = null;
    try {
      data = txt ? JSON.parse(txt) : null;
    } catch (e) { 
      data = { raw: txt };
    }
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function setStatus(s, isError = false) {
    statusEl.textContent = s;
    statusEl.style.opacity = "1";
    statusEl.style.color = isError ? "#ff6b6b" : "#c7ffd1";
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => {
      statusEl.style.opacity = "0.75";
    }, 2500);
  }

  function lockGame(locked) {
    if (locked) {
      overlay.style.display = "flex";
      topPanel.style.display = "none";
    } else {
      overlay.style.display = "none";
      topPanel.style.display = "block";
    }
  }

  async function pullCloudSaveAndApply() {
    const payload = await api("/api/save");
    if (payload && payload.save) {
      try {
        if (typeof window.__MG_SET_STATE === "function") {
          window.__MG_SET_STATE(payload.save);
        } else {
          window.S = payload.save;
        }
        if (typeof save === "function") save();
        if (typeof renderAll === "function") renderAll();
        setStatus("Wczytano zapis z chmury ");
      } catch (err) {
        console.warn("Apply cloud save failed", err);
        setStatus("Nie udało się zastosować zapisu z chmury", true);
      }
    } else {
      setStatus("Brak zapisu w chmurze (nowe konto) ");
      schedulePush();
    }
  }

  function schedulePush() {
    if (!token) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(pushCloudSave, 900);
  }

  function startPeriodicSync() {
    if (periodicSyncTimer) clearInterval(periodicSyncTimer);
    periodicSyncTimer = setInterval(() => {
      try { pushCloudSave(); } catch (e) { }
    }, 10000);
  }

  function stopPeriodicSync() {
    if (periodicSyncTimer) clearInterval(periodicSyncTimer);
    periodicSyncTimer = null;
  }

  const __origSave = (typeof window.save === "function") ? window.save : null;
  if (__origSave) {
    window.save = (...args) => {
      const r = __origSave(...args);
      try { schedulePush(); } catch (e) { }
      return r;
    };
  }

  async function pushCloudSave() {
    if (!token) return;
    const now = Date.now();
    if (now - lastPush < 1200) {
      schedulePush();
      return;
    }
    lastPush = now;
    try {
      persistToken(token);
      const state = (typeof window.__MG_GET_STATE === "function") ? window.__MG_GET_STATE() : window.S;
      if (!state) {
        console.warn("[MG] pushCloudSave: missing game state (window.__MG_GET_STATE/window.S)");
        return;
      }
      await api("/api/save", { method: "PUT", body: { save: state } });
      setStatus("Zapisano w chmurze ");
    } catch (e) {
      console.warn("Cloud save failed", e);
      setStatus("Błąd zapisu w chmurze: " + e.message, true);
    }
  }

  async function refreshMe() {
    if (!token) {
      whoEl.textContent = "offline";
      return null;
    }
    try {
      const me = await api("/api/me");
      window.__MG_ONLINE_ME = me;
      whoEl.textContent = `${me.nick} (@${me.login})`;
      return me;
    } catch (e) {
      whoEl.textContent = "offline";
      setStatus("Brak połączenia z serwerem kont: " + (e && e.message ? e.message : "error"), true);
      return null;
    }
  }

  async function doRegister() {
    const email = regEmail.value.trim();
    const login = regLogin.value.trim();
    const nick = regNick.value.trim();
    const password = regPass.value;
    if (!email || !login || !nick || !password) {
      setStatus("Podaj email, login, nick i hasło", true);
      return;
    }
    try {
      const data = await api("/api/register", {
        method: "POST",
        body: { email, login, nick, password },
      });
      token = data.token;
      persistToken(token);
      await afterAuth();
    } catch (e) {
      setStatus(e.message, true);
    }
  }

  async function doLogin() {
    const email = logEmail.value.trim();
    const login = logLogin.value.trim();
    const password = logPass.value;
    if (!email || !login || !password) {
      setStatus("Podaj email, login i hasło", true);
      return;
    }
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: { email, login, password },
      });
      token = data.token;
      persistToken(token);
      await afterAuth();
    } catch (e) {
      setStatus(e.message, true);
    }
  }

  async function afterAuth() {
    const me = await refreshMe();
    if (!me) {
      lockGame(true);
      stopPeriodicSync();
      return;
    }
    lockGame(false);
    await pullCloudSaveAndApply();
    await refreshFriendsUI();
    startPeriodicSync();
  }

  function doLogout() {
    token = "";
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) { }
    for (const k of LEGACY_TOKEN_KEYS) { try { localStorage.removeItem(k); } catch (e) { } }
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { }
    try { document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`; } catch (e) { }
    whoEl.textContent = "offline";
    setStatus("Wylogowano");
    stopPeriodicSync();
    lockGame(true);
  }

  async function flushSaveBestEffort() {
    try {
      await pushCloudSave();
    } catch (e) { }
    try {
      if (!token || typeof window.S === "undefined") return;
      const base = await apiFetchBase();
      fetch(base + "/api/save", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ save: window.S }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { }
  }

  window.addEventListener("beforeunload", () => { flushSaveBestEffort(); });
  window.addEventListener("pagehide", () => { flushSaveBestEffort(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSaveBestEffort();
  });

  async function refreshFriendsUI() {
    if (!token) return;
    try {
      const [list, req] = await Promise.all([
        api("/api/friends/list"),
        api("/api/friends/requests"),
      ]);

      friendsList.innerHTML = "";
      (list.friends || []).forEach(f => {
        friendsList.appendChild(el("div", { style: Object.assign({}, itemStyle, { gap: "10px" }) }, [
          avatarTinyNode(f.avatar),
          el("div", { style: { flex: "1" } }, [`${f.nick} (@${f.login})`]),
          el("button", { style: miniBtn, onclick: async () => {
            if(!confirm(`Usunąć ${f.nick} (@${f.login}) ze znajomych?`)) return;
            try { await api(`/api/friends/remove/${encodeURIComponent(f.login)}`, { method: "DELETE" }); setStatus("Usunięto znajomego "); await refreshFriendsUI(); }
            catch(e) { setStatus(e.message, true); }
          } }, ["Usuń"]),
        ]));
      });
      if (!(list.friends || []).length) friendsList.appendChild(el("div", { style: emptyStyle }, ["Brak znajomych"]));

      incomingList.innerHTML = "";
      (req.incoming || []).forEach(r => {
        incomingList.appendChild(el("div", { style: Object.assign({}, itemStyle, { gap: "10px" }) }, [
          avatarTinyNode(r.from_avatar),
          el("div", { style: { flex: "1" } }, [`${r.from_nick} (@${r.from_login})`]),
          el("button", { style: miniBtn, onclick: async () => {
            try { await api(`/api/friends/requests/${r.id}/accept`, { method: "POST" }); setStatus("Dodano znajomego "); await refreshFriendsUI(); }
            catch(e) { setStatus(e.message, true); }
          }}, ["Akceptuj"]),
          el("button", { style: miniBtn, onclick: async () => {
            try { await api(`/api/friends/requests/${r.id}/decline`, { method: "POST" }); setStatus("Odrzucono"); await refreshFriendsUI(); }
            catch(e) { setStatus(e.message, true); }
          }}, ["Odrzuć"]),
        ]));
      });
      if (!(req.incoming || []).length) incomingList.appendChild(el("div", { style: emptyStyle }, ["Brak zaproszeń"]));

      outgoingList.innerHTML = "";
      (req.outgoing || []).forEach(r => {
        outgoingList.appendChild(el("div", { style: Object.assign({}, itemStyle, { gap: "10px" }) }, [
          avatarTinyNode(r.to_avatar),
          el("div", { style: { flex: "1" } }, [`Do: ${r.to_nick} (@${r.to_login}) — oczekuje`])
        ]));
      });
      if (!(req.outgoing || []).length) outgoingList.appendChild(el("div", { style: emptyStyle }, ["Brak wysłanych zaproszeń"]));
    } catch (e) {
      console.warn(e);
      setStatus("Nie udało się wczytać znajomych: " + e.message, true);
    }
  }

  
  function unitIndex(){
    if(window.__MG_UNIT_INDEX) return window.__MG_UNIT_INDEX;
    const idx = {};
    const arr = Array.isArray(window.UNITS) ? window.UNITS : [];
    for(const u of arr){ if(u && u.id) idx[u.id] = u; }
    window.__MG_UNIT_INDEX = idx;
    return idx;
  }
  function unitLabel(id){
    const u = unitIndex()[id];
    if(!u) return String(id||"");
    const stars = (u.stars!=null? u.stars : (u.rarity==='UR'?6:(u.rarity==='SSR'?5:(u.rarity==='SR'?4:3))));
    const starTxt = stars ? ` • ${stars}★` : '';
    const el = u.element ? ` • ${u.element}` : "";
    return `${u.name||u.id}${starTxt}${el}`;
  }
  function ownedCountOf(id){
    try{ return (window.S?.seen?.[id]?.ownedCount ?? 0) | 0; }catch (e) {  return 0; }
  }

  let statusEl, whoEl;
  let overlay, topPanel;
  let regEmail, regLogin, regNick, regPass;
  let logEmail, logLogin, logPass;
  let friendLogin, searchInput, searchResults, friendsList, incomingList, outgoingList;

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
  };

  const btn = {
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  };

  const miniBtn = {
    padding: "6px 10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    whiteSpace: "nowrap",
  };

  const itemStyle = {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    marginBottom: "6px",
  };

  const emptyStyle = { opacity: "0.75", padding: "6px 2px" };

  function buildOverlay() {
    overlay = el("div", {
      style: {
        position: "fixed",
        inset: "0",
        zIndex: "999999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.70)",
        backdropFilter: "blur(6px)",
      }
    });

    const card = el("div", {
      style: {
        width: "min(900px, 94vw)",
        minHeight: "520px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,10,14,0.96)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.50)",
        color: "#eee",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
        padding: "18px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
      }
    });

    const left = el("div", {}, [
      el("div", { style: { fontSize: "22px", fontWeight: "900", marginBottom: "6px" } }, ["MG Online — wymagane logowanie"]),
      el("div", { style: { opacity: "0.85", marginBottom: "14px", lineHeight: "1.35" } }, [
        "Aby grać, musisz mieć konto online. Zapis jest w chmurze i jest powiązany z tym kontem."
      ]),


      el("div", { style: { fontWeight: "800", marginBottom: "6px" } }, ["Logowanie"]),
      (logEmail = el("input", { type: "email", placeholder: "Email", style: inputStyle })),
      el("div", { style: { height: "8px" } }),
      (logLogin = el("input", { type: "text", placeholder: "Login (np. Gracz123)", style: inputStyle })),
      el("div", { style: { height: "8px" } }),
      (logPass = el("input", { type: "password", placeholder: "Hasło", style: inputStyle })),
      el("div", { style: { height: "10px" } }),
      el("button", { style: { ...btn, width: "100%" }, onclick: doLogin }, ["Zaloguj"]),

      el("div", { style: { height: "10px" } }),
      (statusEl = el("div", { style: { fontSize: "12px", opacity: "0.85" } }, ["—"]))
    ]);

    const right = el("div", {}, [
      el("div", { style: { fontWeight: "800", marginBottom: "6px" } }, ["Rejestracja"]),
      (regEmail = el("input", { type: "email", placeholder: "Email", style: inputStyle })),
      el("div", { style: { height: "8px" } }),
      (regLogin = el("input", { type: "text", placeholder: "Login (unikalny)", style: inputStyle })),
      el("div", { style: { height: "8px" } }),
      (regNick = el("input", { type: "text", placeholder: "Nick (wyświetlany)", style: inputStyle })),
      el("div", { style: { height: "8px" } }),
      (regPass = el("input", { type: "password", placeholder: "Hasło (min. 6)", style: inputStyle })),
      el("div", { style: { height: "10px" } }),
      el("button", { style: { ...btn, width: "100%" }, onclick: doRegister }, ["Załóż konto"]),

      el("div", { style: { marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.10)" } }, [
        el("div", { style: { fontWeight: "800", marginBottom: "6px" } }, ["Co dostajesz?"]),
        el("div", { style: { opacity: "0.85", lineHeight: "1.35", fontSize: "13px" } }, [
          "• Jeden zapis na konto (chmura)\n",
          "• Dostęp z przeglądarki i z aplikacji okienkowej\n",
          "• Znajomi + zaproszenia"
        ])
      ])
    ]);

    card.appendChild(left);
    card.appendChild(right);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function buildTopPanel() {
    topPanel = el("div", {
      style: {
        position: "fixed",
        right: "10px",
        top: "10px",
        zIndex: "99999",
        width: "360px",
        padding: "10px",
        borderRadius: "14px",
        background: "rgba(10,10,14,0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
        color: "#eee",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        display: "none",
      },
    });

    const header = el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" } }, [
      el("div", { style: { fontWeight: "900", display: "flex", alignItems: "center", gap: "8px" } }, [
        "Online",
        el("button", { style: { ...miniBtn, padding: "4px 8px" }, onclick: () => hideTopPanel(true) }, ["Ukryj"])
      ]),
      el("div", { style: { fontSize: "12px", opacity: "0.85", textAlign: "right" } }, ["konto: ", (whoEl = el("span", {}, ["..."]))])
    ]);

    const row = el("div", { style: { display: "flex", gap: "8px", marginTop: "8px" } }, [
      el("button", { style: { ...btn, flex: "1" }, onclick: () => {
        friendsModal.style.display = (friendsModal.style.display === "none" ? "flex" : "none");
        if (friendsModal.style.display !== "none") refreshFriendsUI();
      } }, ["Znajomi"]),
      el("button", { style: { ...btn, flex: "1" }, onclick: doLogout }, ["Wyloguj"]),
    ]);

    const smallStatus = el("div", { style: { marginTop: "8px", fontSize: "12px", opacity: "0.8" } }, ["—"]);
    const _oldSetStatus = setStatus;
    setStatus = (s, isError=false) => {
      _oldSetStatus(s, isError);
      smallStatus.textContent = s;
      smallStatus.style.color = isError ? "#ff6b6b" : "#c7ffd1";
    };

    topPanel.appendChild(header);
    topPanel.appendChild(row);
    topPanel.appendChild(smallStatus);
    document.body.appendChild(topPanel);
  }

  let topPanelRestoreBtn;
  function hideTopPanel(hidden) {
    try { localStorage.setItem("MG_ONLINE_PANEL_HIDDEN", hidden ? "1" : "0"); } catch (e) { }
    if(hidden) {
      topPanel.style.display = "none";
      topPanelRestoreBtn.style.display = "block";
    } else {
      topPanel.style.display = "block";
      topPanelRestoreBtn.style.display = "none";
    }
  }

  function buildTopPanelRestoreBtn() {
    topPanelRestoreBtn = el("button", {
      style: {
        position: "fixed",
        right: "10px",
        top: "10px",
        zIndex: "99999",
        display: "none",
        padding: "8px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,10,14,0.92)",
        color: "#eee",
        cursor: "pointer",
        fontWeight: "800",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
      },
      onclick: () => hideTopPanel(false)
    }, ["Online ⏷"]);
    document.body.appendChild(topPanelRestoreBtn);
  }

  let friendsModal;
  function buildFriendsModal() {
    friendsModal = el("div", {
      style: {
        position: "fixed",
        inset: "0",
        zIndex: "999998",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }
    });

    const card = el("div", {
      style: {
        width: "min(900px, 94vw)",
        maxHeight: "86vh",
        overflow: "auto",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,10,14,0.97)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.50)",
        color: "#eee",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
        padding: "18px",
      }
    });

    const head = el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "10px" } }, [
      el("div", { style: { fontSize: "18px", fontWeight: "900" } }, ["Znajomi"]),
      el("button", { style: miniBtn, onclick: () => (friendsModal.style.display = "none") }, ["Zamknij"])
    ]);

    const cols = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } }, [
      el("div", {}, [
        el("div", { style: { fontWeight: "900", marginBottom: "8px" } }, ["Dodaj znajomego"]),
        el("div", { style: { display: "flex", gap: "8px", marginBottom: "10px" } }, [
          (friendLogin = el("input", { placeholder: "Login", style: { ...inputStyle, flex: "1" } })),
          el("button", { style: miniBtn, onclick: sendFriendRequest }, ["Wyślij"]),
        ]),
        el("div", { style: { fontWeight: "800", marginBottom: "6px" } }, ["Szukaj kont"]),
        (searchInput = el("input", { placeholder: "Wpisz login albo nick (min. 2 znaki)", style: inputStyle })),
        el("div", { style: { height: "8px" } }),
        (searchResults = el("div", {})),
      ]),
      el("div", {}, [
        el("div", { style: { fontWeight: "900", marginBottom: "8px" } }, ["Twoi znajomi"]),
        (friendsList = el("div", {})),
        el("div", { style: { height: "12px" } }),
        el("div", { style: { fontWeight: "900", marginBottom: "8px" } }, ["Zaproszenia"]),
        el("div", { style: { fontWeight: "800", marginBottom: "6px" } }, ["Przychodzące"]),
        (incomingList = el("div", {})),
        el("div", { style: { height: "8px" } }),
        el("div", { style: { fontWeight: "800", marginBottom: "6px" } }, ["Wysłane"]),
        (outgoingList = el("div", {})),
      ])
    ]);

    searchInput?.addEventListener?.("input", () => {
      clearTimeout(searchInput._t);
      searchInput._t = setTimeout(searchUsers, 250);
    });

    card.appendChild(head);
    card.appendChild(cols);
    friendsModal.appendChild(card);
    document.body.appendChild(friendsModal);
  }

  async function refreshFriendsUI() {
    if (!token) return;
    try {
      const [fl, fr] = await Promise.all([
        api("/api/friends/list"),
        api("/api/friends/requests"),
      ]);

      if (friendsList) {
        const friends = (fl && fl.friends) ? fl.friends : [];
        friendsList.innerHTML = "";
        if (!friends.length) {
          friendsList.appendChild(el("div", { style: { opacity: 0.8, fontSize: "13px" } }, ["Brak znajomych."]));
        } else {
          for (const f of friends) {
            const row = el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" } }, [
              el("div", {}, [
                el("div", { style: { fontWeight: "800" } }, [`${f.nick} (@${f.login})`]),
              ]),
              el("button", { style: miniBtn, onclick: async () => {
                try {
                  await api(`/api/friends/remove/${encodeURIComponent(f.login)}`, { method: "DELETE" });
                  setStatus("Usunięto znajomego ");
                  refreshFriendsUI();
                } catch (e) {
                  setStatus(e.message, true);
                }
              } }, ["Usuń"]),
            ]);
            friendsList.appendChild(row);
          }
        }
      }

      const incoming = (fr && fr.incoming) ? fr.incoming : [];
      const outgoing = (fr && fr.outgoing) ? fr.outgoing : [];

      if (incomingList) {
        incomingList.innerHTML = "";
        if (!incoming.length) incomingList.appendChild(el("div", { style: { opacity: 0.8, fontSize: "13px" } }, ["Brak zaproszeń."]));
        for (const r of incoming) {
          incomingList.appendChild(el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" } }, [
            el("div", { style: { fontWeight: "800" } }, [`${r.from_nick} (@${r.from_login})`]),
            el("div", { style: { display: "flex", gap: "6px" } }, [
              el("button", { style: miniBtn, onclick: async () => {
                try {
                  await api(`/api/friends/requests/${r.id}/accept`, { method: "POST" });
                  setStatus("Dodano znajomego ");
                  refreshFriendsUI();
                } catch (e) { setStatus(e.message, true); }
              } }, ["Akceptuj"]),
              el("button", { style: miniBtn, onclick: async () => {
                try {
                  await api(`/api/friends/requests/${r.id}/decline`, { method: "POST" });
                  setStatus("Odrzucono ");
                  refreshFriendsUI();
                } catch (e) { setStatus(e.message, true); }
              } }, ["Odrzuć"]),
            ])
          ]));
        }
      }

      if (outgoingList) {
        outgoingList.innerHTML = "";
        if (!outgoing.length) outgoingList.appendChild(el("div", { style: { opacity: 0.8, fontSize: "13px" } }, ["Brak wysłanych zaproszeń."]));
        for (const r of outgoing) {
          outgoingList.appendChild(el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" } }, [
            el("div", { style: { fontWeight: "800" } }, [`${r.to_nick} (@${r.to_login})`]),
            el("div", { style: { opacity: 0.8, fontSize: "12px" } }, ["oczekuje…"]),
          ]));
        }
      }
    } catch (e) {
      console.warn("refreshFriendsUI failed", e);
      setStatus("Nie udało się wczytać znajomych: " + e.message, true);
    }
  }

  async function sendFriendRequest() {
    const to = String(friendLogin?.value || "").trim();
    if (to.length < 3) {
      setStatus("Podaj login (min. 3 znaki)", true);
      return;
    }
    try {
      await api("/api/friends/request", { method: "POST", body: { to_login: to } });
      setStatus("Zaproszenie wysłane ");
      try { friendLogin.value = ""; } catch (e) {}
      refreshFriendsUI();
    } catch (e) {
      setStatus(e.message, true);
    }
  }

  async function searchUsers() {
    const q = String(searchInput?.value || "").trim();
    if (!searchResults) return;
    if (q.length < 2) {
      searchResults.innerHTML = "";
      return;
    }
    try {
      const r = await api(`/api/users/search?q=${encodeURIComponent(q)}`);
      const users = (r && r.users) ? r.users : [];
      searchResults.innerHTML = "";
      if (!users.length) {
        searchResults.appendChild(el("div", { style: { opacity: 0.8, fontSize: "13px" } }, ["Brak wyników."]));
        return;
      }
      for (const u of users) {
        searchResults.appendChild(el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" } }, [
          el("div", { style: { fontWeight: "800" } }, [`${u.nick} (@${u.login})`]),
          el("button", { style: miniBtn, onclick: async () => {
            try {
              await api("/api/friends/request", { method: "POST", body: { to_login: u.login } });
              setStatus("Zaproszenie wysłane ");
              refreshFriendsUI();
            } catch (e) { setStatus(e.message, true); }
          } }, ["Zaproś"]),
        ]));
      }
    } catch (e) {
      setStatus("Błąd wyszukiwania: " + e.message, true);
    }
  }

  

  function hookSave() {
    const originalSave = window.save;
    if (typeof originalSave === "function") {
      window.save = function () {
        try {
          originalSave();
        } finally {
          schedulePush();
        }
      };
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    buildOverlay();
    buildTopPanel();
    buildTopPanelRestoreBtn();
    buildFriendsModal();
    
    hookSave();

    lockGame(true);
    const me = await refreshMe();
    if (me) {
      await afterAuth();
    } else {
      setStatus("Zaloguj się, aby grać", false);
    }

    try {
      const hidden = localStorage.getItem("MG_ONLINE_PANEL_HIDDEN") === "1";
      if(hidden) hideTopPanel(true);
    } catch (e) { }
  });
})();

// Registro de acessos do site. Não faz nada enquanto analytics-config.js estiver vazio.
(() => {
  const cfg = window.RR_ANALYTICS || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  const store = (area, key, make) => {
    try {
      let v = area.getItem(key);
      if (!v) { v = make(); area.setItem(key, v); }
      return v;
    } catch { return make(); }
  };
  const visitor = store(localStorage, "rr_vid", () =>
    (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)));

  const device = innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop";

  const referrer = (() => {
    const r = document.referrer;
    if (!r || new URL(r).host === location.host) return "direto";
    if (/instagram|ig\.me/.test(r)) return "instagram";
    if (/google\./.test(r)) return "google";
    if (/whatsapp|wa\.me|l\.wl\.co/.test(r)) return "whatsapp";
    if (/linkedin|lnkd\.in/.test(r)) return "linkedin";
    if (/facebook|fb\.|l\.messenger/.test(r)) return "facebook";
    return "outros";
  })();

  // Localização aproximada (cidade), consultada uma vez por sessão. O IP não é guardado.
  const geo = (async () => {
    try {
      const cached = sessionStorage.getItem("rr_geo");
      if (cached) return JSON.parse(cached);
    } catch {}
    try {
      const res = await fetch("https://ipwho.is/?fields=city,region,country,country_code,latitude,longitude");
      const g = await res.json();
      const data = { city: g.city, region: g.region, country: g.country, country_code: g.country_code, lat: g.latitude, lon: g.longitude };
      try { sessionStorage.setItem("rr_geo", JSON.stringify(data)); } catch {}
      return data;
    } catch { return {}; }
  })();

  const send = async (event, section = null) => {
    const g = await geo;
    fetch(`${cfg.supabaseUrl}/rest/v1/visits`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ visitor, event, section, referrer, device, ...g })
    }).catch(() => {});
  };

  send("pageview", "inicio");

  // Seções vistas (uma vez cada por visita)
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const id = e.target.id;
      if (e.isIntersecting && !seen.has(id)) { seen.add(id); if (id !== "inicio") send("section", id); }
    });
  }, { threshold: 0.35 });
  ["inicio", "sobre", "psicoterapia", "como-funciona", "conteudos", "faq", "contato"]
    .forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });

  // Cliques em "Agendar uma conversa" e envios do formulário
  document.querySelectorAll('a.btn--primary[href="#contato"]').forEach((a) =>
    a.addEventListener("click", () => send("cta", "contato")));
  const form = document.getElementById("contact-form");
  if (form) form.addEventListener("submit", () => { if (form.checkValidity()) send("form", "contato"); });
})();

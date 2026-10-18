// Fast Berührt – Bewegung und Film. Keine Abhängigkeiten.
(() => {
  const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1) Einblenden: einmalig, sobald ein Element ins Bild kommt.
  const reveal = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("ist-sichtbar");
      reveal.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -12% 0px" });
  // Alle Bilder außerhalb der Szene blenden mit leichter Drehung ein (die Szene steuert ihre Medien selbst).
  document.querySelectorAll(".bild").forEach((b) => { if (!b.closest("[data-szene]")) b.classList.add("bild--reveal"); });
  document.querySelectorAll("[data-reveal], .bild--reveal").forEach((el) => reveal.observe(el));

  // 2) Szene: Die Bühne bleibt stehen (sticky), die Scrollposition steuert alles darin.
  //    p läuft von 0 bis n (Anzahl Sätze); u = p - k ist die Lage von Satz k:
  //    u < 0 noch unten · 0–1 „sein“ Abschnitt · u > 1 schon oben.
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const weich = (x) => 1 - Math.pow(1 - clamp(x), 3); // ease-out
  // Ein- und Ausstieg (in Satz-Einheiten), leicht überlappend
  const SATZ = { einVon: -0.04, einBis: 0.3, ausVon: 0.7, ausBis: 1.04, weg: 90, unschaerfe: 14 };
  // Medium: von  = Startgröße · drift = Wanderung zum Text (x) und nach oben (y) in % der eigenen Größe
  //         fenster = Beschnitt beim Einstieg in % · innen = Startzoom des Bildes im Rahmen (zoomt auf 1 zurück)
  const MEDIUM = { einVon: -0.15, einBis: 0.3, ausVon: 0.82, ausBis: 1.18, von: 0.55, driftX: -14, driftY: -8, fenster: 22, innen: 1.35 };
  // Endgröße je Format: kleinere Formate wachsen stärker, damit alle weit unter den Text reichen.
  const ENDGROESSE = { quer: 1.8, klein: 2.2, hoch: 1.85 };

  const satzZustand = (u) => {
    if (u <= SATZ.einVon || u >= SATZ.ausBis) return { o: 0, y: u <= SATZ.einVon ? SATZ.weg : -SATZ.weg, b: SATZ.unschaerfe };
    if (u < SATZ.einBis) { const e = weich((u - SATZ.einVon) / (SATZ.einBis - SATZ.einVon)); return { o: e, y: SATZ.weg * (1 - e), b: SATZ.unschaerfe * (1 - e) }; }
    if (u > SATZ.ausVon) { const x = weich((u - SATZ.ausVon) / (SATZ.ausBis - SATZ.ausVon)); return { o: 1 - x, y: -SATZ.weg * x, b: SATZ.unschaerfe * 0.8 * x }; }
    return { o: 1, y: 0, b: 0 };
  };
  const mediumZustand = (u, bis) => {
    const ein = weich((u - MEDIUM.einVon) / (MEDIUM.einBis - MEDIUM.einVon));
    const aus = weich((u - MEDIUM.ausVon) / (MEDIUM.ausBis - MEDIUM.ausVon));
    const lauf = weich(clamp((u - MEDIUM.einVon) / (MEDIUM.ausBis - MEDIUM.einVon))); // 0 → 1 über die ganze Lebenszeit
    return {
      o: Math.min(ein, 1 - aus),
      s: MEDIUM.von + (bis - MEDIUM.von) * lauf,
      x: MEDIUM.driftX * lauf,
      y: MEDIUM.driftY * lauf,
      f: MEDIUM.fenster * (1 - ein),
      i: MEDIUM.innen - (MEDIUM.innen - 1) * lauf,
    };
  };

  document.querySelectorAll("[data-szene]").forEach((szene) => {
    const saetze = [...szene.querySelectorAll(".szene__satz")];
    const medien = [...szene.querySelectorAll(".szene__medium")];
    const zaehler = szene.querySelector("[data-zaehler]");
    const n = saetze.length;
    let aktiv = -1, geplant = false;

    const setzeAktiv = (i) => {
      aktiv = i;
      saetze.forEach((s, k) => s.classList.toggle("ist-aktiv", k === i));
      medien.forEach((m) => {
        const k = +m.dataset.schritt;
        const an = k === i;
        m.classList.toggle("ist-aktiv", an);
        const v = m.querySelector("video");
        if (!v) return;
        // aktueller und nächster Clip laden vor, damit der Wechsel ohne Ruckeln gelingt
        if ((k === i || k === i + 1) && v.preload !== "auto") { v.preload = "auto"; v.load(); }
        if (!an) v.pause();
      });
      if (zaehler) zaehler.textContent = String(i + 1).padStart(2, "0");
    };

    const aktualisieren = () => {
      geplant = false;
      const rect = szene.getBoundingClientRect();
      const strecke = szene.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / strecke, 0, 0.9999) * n;
      const i = Math.floor(p);
      if (i !== aktiv) setzeAktiv(i);
      // Abspielen nur, solange die Szene sichtbar ist (Browser pausieren stumme Videos außerhalb des Bildes)
      const sichtbar = rect.top < window.innerHeight && rect.bottom > 0;
      const clip = medien.find((el) => +el.dataset.schritt === i)?.querySelector("video");
      if (clip) sichtbar && !ruhig ? clip.paused && clip.play().catch(() => {}) : clip.pause();
      saetze.forEach((el, k) => {
        // Erster und letzter Satz stehen am Rand der Szene schon bzw. noch voll da.
        const u = k === 0 ? Math.max(p, SATZ.einBis) : k === n - 1 ? Math.min(p - k, SATZ.ausVon) : p - k;
        const z = satzZustand(u);
        el.style.opacity = z.o.toFixed(3);
        el.style.transform = ruhig ? "none" : `translate3d(0, ${z.y.toFixed(1)}px, 0)`;
        el.style.filter = ruhig || z.b < 0.1 ? "none" : `blur(${z.b.toFixed(1)}px)`;
      });
      medien.forEach((el) => {
        const k = +el.dataset.schritt;
        const u = k === 0 ? Math.max(p, MEDIUM.einBis) : p - k;
        const z = mediumZustand(u, ENDGROESSE[el.dataset.format] || ENDGROESSE.quer);
        el.style.opacity = z.o.toFixed(3);
        if (ruhig) return;
        el.style.transform = `translate3d(${z.x.toFixed(2)}%, ${z.y.toFixed(2)}%, 0) scale(${z.s.toFixed(3)})`;
        el.style.clipPath = z.f > 0.1 ? `inset(${z.f.toFixed(1)}%)` : "none";
        const innen = el.firstElementChild;
        if (innen) innen.style.transform = `scale(${z.i.toFixed(3)})`;
      });
    };
    const planen = () => { if (!geplant) { geplant = true; requestAnimationFrame(aktualisieren); } };
    window.addEventListener("scroll", planen, { passive: true });
    window.addEventListener("resize", planen);
    // Sobald ein Clip abspielbereit ist, erneut prüfen (sonst startet er erst beim nächsten Scrollen)
    medien.forEach((m) => m.querySelector("video")?.addEventListener("canplay", planen));
    aktualisieren();
  });

  // 3) Video-Loops: nur abspielen, wenn sichtbar.
  const loops = new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      const v = e.target;
      if (e.isIntersecting && !ruhig) v.play().catch(() => {});
      else v.pause();
    }
  }, { threshold: 0.25 });
  // Videos in der Szene steuert die Szene selbst.
  document.querySelectorAll("video[data-loop]").forEach((v) => {
    if (v.closest("[data-szene]")) return;
    if (ruhig) v.removeAttribute("autoplay");
    loops.observe(v);
  });

  // 4) Parallaxe (nur große Bildschirme) und Mini-Zoom der Bilder beim Scrollen.
  //    data-parallax = Verschiebung relativ zur Bildschirmmitte (z. B. 0.16 = 16 %).
  //    ZOOM: Bilder starten leicht vergrößert und zoomen beim Durchscrollen auf 1 zurück.
  const ZOOM = 0.08;
  const parallaxe = [...document.querySelectorAll("[data-parallax]")];
  const zoomBilder = [...document.querySelectorAll(".bild img")];
  const gross = window.matchMedia("(min-width: 1100px)");
  let geplant = false;
  const aktualisieren = () => {
    geplant = false;
    const h = window.innerHeight, mitte = h / 2;
    for (const el of parallaxe) {
      if (!gross.matches || ruhig) { el.style.removeProperty("--py"); continue; }
      const r = el.getBoundingClientRect();
      const abstand = Math.max(-h, Math.min(h, r.top + r.height / 2 - mitte));
      el.style.setProperty("--py", `${(abstand * -parseFloat(el.dataset.parallax)).toFixed(1)}px`);
    }
    if (ruhig) return;
    for (const img of zoomBilder) {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) continue;
      // 0 = Bild taucht unten auf · 1 = Bild verlässt oben den Bildschirm
      const lauf = Math.min(1, Math.max(0, (h - r.top) / (h + r.height)));
      img.style.transform = `scale(${(1 + ZOOM * (1 - lauf)).toFixed(4)})`;
    }
  };
  const planen = () => { if (!geplant) { geplant = true; requestAnimationFrame(aktualisieren); } };
  if (parallaxe.length || zoomBilder.length) {
    window.addEventListener("scroll", planen, { passive: true });
    window.addEventListener("resize", planen);
    aktualisieren();
  }

  // 5) Film: YouTube erst nach Klick laden (youtube-nocookie).
  document.querySelectorAll("[data-youtube]").forEach((player) => {
    const start = player.querySelector(".film__start");
    if (!start) return;
    start.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${player.dataset.youtube}?autoplay=1&rel=0`;
      iframe.title = "Film: Fast Berührt";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      player.replaceChildren(iframe);
      iframe.focus();
    });
  });
})();

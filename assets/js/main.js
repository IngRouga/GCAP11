/* GCAP11 — interactions (vanilla JS, aucune dépendance) */
(function () {
  "use strict";
  var C = window.GCAP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
  var pad = function (n, l) { n = String(n); while (n.length < (l || 2)) n = "0" + n; return n; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------- Spirale : rayons générés une fois ---------- */
  var spokes = document.getElementById("spokes");
  if (spokes) {
    var g = "";
    for (var a = 0; a < 360; a += 7.5) {
      var r = a * Math.PI / 180;
      g += '<line x1="' + (200 + Math.cos(r) * 112).toFixed(1) + '" y1="' + (200 + Math.sin(r) * 112).toFixed(1) +
           '" x2="' + (200 + Math.cos(r) * 190).toFixed(1) + '" y2="' + (200 + Math.sin(r) * 190).toFixed(1) + '"/>';
    }
    spokes.innerHTML = g;
  }

  /* ---------- Contenu piloté par la config ---------- */
  var passes = C.passes || {};
  $$("[data-price]").forEach(function (el) { var p = passes[el.dataset.price]; if (p) el.textContent = fmt(p.price); });
  $$("[data-price-inline]").forEach(function (el) { var p = passes[el.dataset.priceInline]; if (p) el.textContent = fmt(p.price) + " FCFA"; });

  var vipList = (passes.VIP && passes.VIP.benefits) || [];
  $$("[data-benefits]").forEach(function (ul) {
    var key = ul.dataset.benefits, p = passes[key]; if (!p) return;
    var list = p.benefits || [];
    if (!list.length) {
      ul.innerHTML = '<li class="ph-note">Le détail des avantages du ' + esc(p.label) + " vous est communiqué par l'équipe GCAP11 lors de votre réservation</li>";
      return;
    }
    var base = key === "VVIP" ? list.filter(function (b) { return vipList.indexOf(b) !== -1; }) : list;
    var extra = key === "VVIP" ? list.filter(function (b) { return vipList.indexOf(b) === -1; }) : [];
    var h = base.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");
    if (extra.length) {
      h += '<li class="sep-plus"><span>Et en plus, avec le VVIP</span></li>';
      h += extra.map(function (b) { return '<li class="is-plus">' + esc(b) + "</li>"; }).join("");
    }
    ul.innerHTML = h;
  });

  /* ---------- Tableau comparatif VIP / VVIP ---------- */
  var cmp = $("[data-compare]");
  if (cmp && C.compare && C.compare.length) {
    var has = function (k, b) { return passes[k] && (passes[k].benefits || []).indexOf(b) !== -1; };
    var mark = function (ok) {
      return ok ? '<span class="yes" role="img" aria-label="Inclus"></span>' : '<span class="no" role="img" aria-label="Non inclus">—</span>';
    };
    cmp.innerHTML = C.compare.map(function (b) {
      var v = has("VIP", b), vv = has("VVIP", b);
      return '<tr class="' + (vv && !v ? "is-plus" : "") + '"><th scope="row">' + esc(b) + "</th><td>" + mark(v) + '</td><td class="is-vvip">' + mark(vv) + "</td></tr>";
    }).join("") +
    '<tr class="compare__cta"><th scope="row"><span class="sr-only">Réserver</span></th>' +
    '<td><button class="btn btn--outline-gold btn--sm" data-book="VIP">Choisir VIP</button></td>' +
    '<td class="is-vvip"><button class="btn btn--gold btn--sm" data-book="VVIP">Choisir VVIP</button></td></tr>';
  }

  var phones = C.phones || [];
  var contacts = $("[data-contacts]");
  if (contacts) {
    contacts.innerHTML = phones.map(function (p) {
      var d = p.replace(/[^\d]/g, "");
      return '<li><a href="tel:+' + d + '">' + esc(p) + '</a> <small><a href="https://wa.me/' + d + '" target="_blank" rel="noopener">WhatsApp</a></small></li>';
    }).join("");
  }

  /* ---------- Vidéo Hero optionnelle ---------- */
  var vid = $(".hero__video");
  var saveData = navigator.connection && navigator.connection.saveData;
  if (vid && C.heroVideo && !reduce && !saveData) {
    /* iOS / Android : lecture auto autorisée seulement si muette + inline,
       et il faut appeler play() directement (iOS ne déclenche pas toujours
       "canplay" quand preload="none"). Sinon l'image fixe reste affichée. */
    vid.muted = true; vid.defaultMuted = true;
    vid.setAttribute("muted", ""); vid.setAttribute("playsinline", ""); vid.setAttribute("webkit-playsinline", "");
    vid.autoplay = true; vid.preload = "auto";
    vid.src = C.heroVideo;
    vid.addEventListener("playing", function () { vid.classList.add("is-on"); });
    var tryPlay = function () { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); };
    tryPlay();
    /* certains navigateurs mobiles bloquent l'autoplay jusqu'au premier contact */
    ["touchstart", "scroll", "click"].forEach(function (ev) {
      window.addEventListener(ev, function once() { if (vid.paused) tryPlay(); window.removeEventListener(ev, once); }, { passive: true });
    });
    /* pause quand le Hero n'est plus visible (batterie / data mobile) */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        if (!vid.classList.contains("is-on")) return;
        if (en[0].isIntersecting) vid.play().catch(function () {}); else vid.pause();
      }).observe(vid);
    }
  }

  /* ---------- Film officiel (avec le son, chargé au clic) ---------- */
  var filmBox = $("[data-film]"), filmBtn = $("[data-film-open]"), filmVid = filmBox && $("video", filmBox), filmLast = null;
  if (filmBtn && (!C.filmVideo || !filmBox)) filmBtn.hidden = true;
  function closeFilm() {
    if (!filmBox || filmBox.hidden) return;
    filmVid.pause(); filmBox.hidden = true; document.body.style.overflow = "";
    if (filmLast) filmLast.focus();
  }
  if (filmBtn && filmBox && C.filmVideo) {
    filmBtn.addEventListener("click", function () {
      filmLast = document.activeElement;
      if (!filmVid.getAttribute("src")) filmVid.src = C.filmVideo;
      filmBox.hidden = false; document.body.style.overflow = "hidden";
      if (vid) vid.pause();
      filmVid.play().catch(function () {});
      $("[data-film-close].modal__close", filmBox).focus();
    });
    $$("[data-film-close]", filmBox).forEach(function (b) { b.addEventListener("click", closeFilm); });
  }

  /* ---------- Vidéo explicative des deux Pass ----------
     Lecture AUTOMATIQUE dès que le lecteur approche de l'écran, sans toucher
     de bouton. Avec le son si le navigateur l'autorise (le visiteur a déjà
     touché la page), sinon muette — c'est la règle de tous les navigateurs
     mobiles — avec un bouton « Activer le son ». Le bouton Play n'apparaît
     que si le téléphone bloque toute lecture automatique (mode économie). */
  var ex = $("[data-explain]");
  if (ex) {
    var exWrap = ex.closest(".explain"), exVid = $("video", ex), exBtn = $("[data-explain-play]", ex), exSound = $("[data-explain-sound]", ex);
    var exUser = false, exStarted = false, exInView = false, exLoading = false;
    exVid.muted = true; exVid.defaultMuted = true;
    exWrap.classList.add("is-auto");               /* pas de bouton Play par défaut */
    function exShowSound() { exSound.hidden = !exVid.muted; }
    function exFail() { exWrap.classList.remove("is-auto"); exWrap.classList.add("is-blocked"); }
    function exPlay() {
      if (exUser || !exInView) return;
      if (!exLoading) { exLoading = true; exVid.preload = "auto"; exWrap.classList.add("is-loading"); }
      var canSound = navigator.userActivation && navigator.userActivation.hasBeenActive;
      if (canSound && !exStarted) exVid.muted = false;
      var pr = exVid.play();
      if (!pr || !pr.then) return;
      pr.then(function () {
        exStarted = true; exWrap.classList.add("is-playing"); exWrap.classList.remove("is-loading"); exShowSound();
      }).catch(function (err) {
        if (!exVid.muted) { exVid.muted = true; exPlay(); return; }   /* son refusé : on relance muette */
        if (err && err.name === "NotAllowedError") exFail();
      });
    }
    function exWithSound() {
      exUser = true;
      exVid.muted = false; exVid.controls = true;
      exWrap.classList.remove("is-blocked", "is-loading"); exWrap.classList.add("is-playing", "is-auto"); exSound.hidden = true;
      if (filmVid && !filmVid.paused) filmVid.pause();
      if (exStarted) { try { exVid.currentTime = 0; } catch (e) {} }
      var pr = exVid.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    exBtn.addEventListener("click", exWithSound);
    exSound.addEventListener("click", exWithSound);
    exVid.addEventListener("click", function () { if (exVid.muted) exWithSound(); });
    exVid.addEventListener("playing", function () { exWrap.classList.add("is-playing"); exWrap.classList.remove("is-loading"); exShowSound(); });
    exVid.addEventListener("volumechange", exShowSound);
    exVid.addEventListener("ended", function () { exVid.controls = false; exSound.hidden = true; exUser = true; });
    exVid.addEventListener("play", function () { if (filmVid && !filmVid.paused) filmVid.pause(); });
    /* précharge les premières secondes quand on approche de la section */
    function exCheck() {
      var r = exVid.getBoundingClientRect(), vh = innerHeight || document.documentElement.clientHeight;
      var near = r.top < vh * 1.8 && r.bottom > -vh;
      if (near && exVid.preload === "none") exVid.preload = "metadata";
      var visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      var was = exInView; exInView = visible > Math.min(r.height, vh) * 0.3;
      if (exInView && !was) exPlay();
      else if (!exInView && was && !exVid.paused) exVid.pause();
      else if (exInView && exVid.paused && exStarted && !exUser && !exVid.ended) exVid.play().catch(function () {});
    }
    /* IntersectionObserver + défilement (certains navigateurs intégrés n'envoient pas l'un ou l'autre) */
    if ("IntersectionObserver" in window) new IntersectionObserver(exCheck, { threshold: [0, .15, .3, .5] }).observe(exVid);
    window.addEventListener("scroll", function () { requestAnimationFrame(exCheck); }, { passive: true });
    window.addEventListener("resize", exCheck);
    document.addEventListener("visibilitychange", function () { if (document.hidden) exVid.pause(); else exCheck(); });
    exCheck();
  }

  /* ---------- Escalier GCAP1 → GCAP11 ---------- */
  var stairs = $("[data-stairs]");
  if (stairs) {
    var h = "";
    for (var e = 1; e <= 11; e++) {
      var height = e === 11 ? 100 : 16 + (e - 1) * 6.2;
      h += '<li class="step' + (e === 11 ? " step--last" : "") + '" style="--i:' + (e - 1) + ";--h:" + height.toFixed(1) + '" tabindex="0" aria-label="GCAP' + e + (e === 11 ? ", édition 2026, du 19 au 22 novembre" : "") + '">' +
        '<div class="step__lbl"><small>GCAP</small><b>' + (e === 11 ? "GCAP11" : e) + "</b></div>" +
        '<div class="step__bar">' + (e === 11 ? '<span class="step__now">2026</span>' : "") + "</div></li>";
    }
    stairs.innerHTML = h;
  }

  /* ---------- Comptes à rebours (date cible unique : C.eventStart) ----------
     Chaque [data-countdown] est construit ici. Le temps restant est TOUJOURS
     recalculé depuis l'heure actuelle de l'appareil : jamais de valeur saisie
     à la main, jamais de valeur négative. */
  var start = new Date(C.eventStart || "2026-11-19T08:00:00Z").getTime();
  var end = new Date(C.eventEnd || "2026-11-22T23:00:00Z").getTime();
  var UNITS = [["days", "Jours"], ["hours", "Heures"], ["minutes", "Minutes"], ["seconds", "Secondes"]];
  var clocks = $$("[data-countdown]").map(function (box) {
    var h = '<div class="cd__clock" role="timer" aria-live="off">';
    UNITS.forEach(function (u, k) {
      if (k) h += '<span class="cd__sep" aria-hidden="true">:</span>';
      h += '<div class="cd__unit" data-u="' + u[0] + '"><span class="cd__num" aria-hidden="true"></span><span class="cd__lbl">' + u[1] + "</span></div>";
    });
    h += '</div><p class="cd__done" hidden></p><p class="sr-only cd__sr"></p>';
    box.innerHTML = h;
    var nums = {};
    UNITS.forEach(function (u) { nums[u[0]] = $('[data-u="' + u[0] + '"] .cd__num', box); });
    return { box: box, nums: nums, clock: $(".cd__clock", box), done: $(".cd__done", box), sr: $(".cd__sr", box), last: {} };
  });
  /* chiffres : un "volet" par chiffre, animé seulement quand il change */
  function setNum(el, str, animate) {
    var digits = el.children;
    if (digits.length !== str.length) {
      el.innerHTML = str.split("").map(function (c) { return '<span class="cd__d"><i>' + c + "</i></span>"; }).join("");
      return;
    }
    for (var i = 0; i < str.length; i++) {
      var d = digits[i], inner = d.firstChild;
      if (inner.textContent === str[i]) continue;
      inner.textContent = str[i];
      if (animate) { d.classList.remove("flip"); void d.offsetWidth; d.classList.add("flip"); }
    }
  }
  var lastMinute = -1;
  function tickCd() {
    var now = Date.now(), diff = Math.max(0, start - now);
    var v = {
      days: Math.floor(diff / 864e5),
      hours: Math.floor(diff / 36e5) % 24,
      minutes: Math.floor(diff / 6e4) % 60,
      seconds: Math.floor(diff / 1e3) % 60
    };
    var over = diff <= 0;
    var srTxt = over ? "" : "GCAP11 commence dans " + v.days + " jours, " + v.hours + " heures et " + v.minutes + " minutes";
    var minuteChanged = v.minutes !== lastMinute; lastMinute = v.minutes;
    clocks.forEach(function (c) {
      if (over) {
        c.clock.hidden = true; c.done.hidden = false; c.box.classList.add("is-over");
        c.done.innerHTML = now < end
          ? "<b>GCAP11 a commencé</b><span>Ouagadougou · jusqu'au 22 novembre</span>"
          : "<b>Merci d'avoir vécu GCAP11</b><span>Ouagadougou · 19 — 22 novembre 2026</span>";
        return;
      }
      UNITS.forEach(function (u) {
        var k = u[0], str = pad(v[k], 2);
        if (c.last[k] === str) return;
        setNum(c.nums[k], str, !reduce && c.last[k] !== undefined);
        c.last[k] = str;
      });
      if (minuteChanged) c.sr.textContent = srTxt;
    });
    return over;
  }
  /* synchronisé sur la seconde réelle, recalé quand l'onglet redevient visible */
  var cdTimer = null;
  function loopCd() {
    clearTimeout(cdTimer);
    var over = tickCd();
    if (over && Date.now() >= end) return;
    cdTimer = setTimeout(loopCd, over ? 60000 : 1000 - (Date.now() % 1000) + 10);
  }
  if (clocks.length) {
    loopCd();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) loopCd(); });
  }

  /* ---------- Compteurs animés ---------- */
  /* chiffres affichés tels quels (96, 04, 11), sans animation de comptage */
  function countUp(el) {
    var to = +el.dataset.countup, p = +(el.dataset.pad || 0);
    el.textContent = p ? pad(to, p) : to;
  }

  /* ---------- Révélations au scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("is-in");
        $$("[data-countup]", el).forEach(countUp);
        if (el.hasAttribute("data-countup")) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal, .reveal-img, .fact, [data-stairs], .gallery, .tl__day").forEach(function (el) { io.observe(el); });
  } else {
    document.documentElement.classList.add("no-js");
    $$(".reveal, .reveal-img, [data-stairs], .gallery, .tl__day").forEach(function (el) { el.classList.add("is-in"); });
  }
  $$(".shot").forEach(function (s, i) { s.style.setProperty("--i", i); });

  /* ---------- Nav solide + CTA sticky + parallax ---------- */
  var nav = $("#nav"), sticky = $("[data-sticky]");
  var hero = $(".hero"), passSec = $("#pass"), finale = $("#reserver"), footer = $(".footer");
  var tl = $("[data-timeline]"), tlFill = tl && $(".tl__fill", tl);
  var par = $$("[data-parallax]"), parIn = $$("[data-parallax-inner]");
  var hideZones = [passSec, finale, footer].filter(Boolean);
  var inZone = {};
  if ("IntersectionObserver" in window && sticky) {
    var zo = new IntersectionObserver(function (en) {
      en.forEach(function (x) { inZone[x.target.id || x.target.className] = x.isIntersecting; });
      updSticky();
    }, { threshold: 0.12 });
    hideZones.forEach(function (z) { zo.observe(z); });
  }
  var modalOpen = false;
  function updSticky() {
    if (!sticky) return;
    var pastHero = window.scrollY > 280;
    var blocked = Object.keys(inZone).some(function (k) { return inZone[k]; });
    sticky.classList.toggle("is-on", pastHero && !blocked && !modalOpen);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      nav.classList.toggle("is-solid", y > 30);
      if (tl && tlFill) {
        var tr = tl.getBoundingClientRect(), vh = innerHeight;
        var k = Math.max(0, Math.min(1, (vh * 0.75 - tr.top) / (tr.height || 1)));
        tlFill.style.setProperty("--p", reduce ? 1 : k.toFixed(3));
      }
      updSticky();
      if (!reduce) {
        par.forEach(function (el) { el.style.transform = "translate3d(0," + (y * +el.dataset.parallax).toFixed(1) + "px,0)"; });
        parIn.forEach(function (el) {
          var r = el.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          var c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          el.style.transform = "translate3d(0," + (c * -100 * +el.dataset.parallaxInner).toFixed(1) + "%,0)";
        });
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Galerie : drag + boutons + lightbox ---------- */
  var track = $("[data-gallery]");
  if (track) {
    var down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; track.classList.add("is-drag");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); track.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () { down = false; track.classList.remove("is-drag"); });
    $$("[data-gal]").forEach(function (b) {
      b.addEventListener("click", function () {
        var w = track.querySelector(".shot").offsetWidth + 20;
        track.scrollBy({ left: +b.dataset.gal * w * 2, behavior: reduce ? "auto" : "smooth" });
      });
    });
    var lb = $("[data-lightbox]"), lbImg = lb && $("img", lb);
    track.addEventListener("click", function (e) {
      var img = e.target.closest(".shot img"); if (!img || moved > 6 || !lb) return;
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lb.hidden = false; document.body.style.overflow = "hidden";
      $("[data-lb-close]", lb).focus();
    });
    if (lb) lb.addEventListener("click", function (e) {
      if (e.target === lbImg) return; lb.hidden = true; document.body.style.overflow = "";
    });
  }

  /* ---------- Galerie : défilement automatique en boucle ---------- */
  if (track) {
    var originals = $$(".shot", track);
    originals.forEach(function (s) {
      var c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("shot--clone");
      $$("img", c).forEach(function (im) { im.loading = "lazy"; });
      track.appendChild(c);
    });
    track.classList.add("is-auto");
    var loopW = 0, pos = 0, paused = false, resumeT = null, lastT = 0;
    var SPEED = 38; // pixels par seconde
    function measure() {
      var first = originals[0], firstClone = track.querySelector(".shot--clone");
      loopW = firstClone.offsetLeft - first.offsetLeft;
    }
    function pause(ms) {
      paused = true; clearTimeout(resumeT);
      if (ms !== undefined) resumeT = setTimeout(function () { pos = track.scrollLeft; paused = false; }, ms);
    }
    function loop(t) {
      var dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
      if (!paused && loopW > 0 && !document.hidden) {
        pos += SPEED * dt / 1000;
        if (pos >= loopW) pos -= loopW;
        track.scrollLeft = pos;
      } else if (loopW > 0) {
        if (track.scrollLeft >= loopW) track.scrollLeft -= loopW;
        pos = track.scrollLeft;
      }
      requestAnimationFrame(loop);
    }
    window.addEventListener("load", measure); window.addEventListener("resize", measure); measure();
    track.addEventListener("mouseenter", function () { pause(); });
    track.addEventListener("mouseleave", function () { pause(800); });
    track.addEventListener("touchstart", function () { pause(); }, { passive: true });
    track.addEventListener("touchend", function () { pause(2500); }, { passive: true });
    track.addEventListener("pointerdown", function () { pause(); });
    track.addEventListener("focusin", function () { pause(); });
    track.addEventListener("focusout", function () { pause(1500); });
    $$("[data-gal]").forEach(function (b) { b.addEventListener("click", function () { pause(1800); }); });
    if (!reduce) requestAnimationFrame(loop);
  }

  /* ---------- Modal de réservation ---------- */
  var modal = $("#booking"), form = $("#booking-form"), lastFocus = null;
  var qtyIn = $("#f-places"), totalEl = $("[data-total]"), errEl = $("[data-error]"), passTitle = $("[data-pass-title]");

  function selPass() { var r = $('input[name="pass"]:checked', form); return r ? r.value : ""; }
  function updTotal() {
    var p = passes[selPass()], q = Math.max(1, Math.min(50, parseInt(qtyIn.value, 10) || 1));
    totalEl.textContent = p ? fmt(p.price * q) + " FCFA" : "—";
    passTitle.textContent = p ? p.label : "Pass";
  }
  function openModal(pass) {
    lastFocus = document.activeElement;
    $$('input[name="pass"]', form).forEach(function (r) { r.checked = r.value === pass; });
    errEl.hidden = true;
    updTotal();
    modal.hidden = false; modalOpen = true; updSticky();
    document.body.style.overflow = "hidden";
    setTimeout(function () { (pass ? $("#f-nom") : $('input[name="pass"]', form)).focus(); }, 60);
  }
  function closeModal() {
    modal.hidden = true; modalOpen = false; updSticky();
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]");
    if (b) { e.preventDefault(); openModal(b.dataset.book || ""); }
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    var lb = $("[data-lightbox]");
    if (e.key === "Escape") {
      if (filmBox && !filmBox.hidden) { closeFilm(); return; }
      if (lb && !lb.hidden) { lb.hidden = true; document.body.style.overflow = ""; return; }
      if (!modal.hidden) closeModal();
    }
    if (e.key === "Tab" && !modal.hidden) {
      var f = $$('button, input, [href], [tabindex]:not([tabindex="-1"])', modal).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  });
  form.addEventListener("change", updTotal);
  qtyIn.addEventListener("input", updTotal);
  $$("[data-qty]", form).forEach(function (b) {
    b.addEventListener("click", function () {
      qtyIn.value = Math.max(1, Math.min(50, (parseInt(qtyIn.value, 10) || 1) + +b.dataset.qty)); updTotal();
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = {
      pass: selPass(),
      nom: form.nom.value.trim(), prenom: form.prenom.value.trim(),
      tel: form.tel.value.trim(), email: form.email.value.trim(),
      ville: form.ville.value.trim(),
      places: Math.max(1, Math.min(50, parseInt(qtyIn.value, 10) || 1))
    };
    $$(".is-bad", form).forEach(function (x) { x.classList.remove("is-bad"); });
    var bad = [];
    if (!d.nom) bad.push(form.nom);
    if (!d.prenom) bad.push(form.prenom);
    if (d.tel.replace(/[^\d]/g, "").length < 8) bad.push(form.tel);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) bad.push(form.email);
    if (!d.ville) bad.push(form.ville);
    if (!d.pass || bad.length) {
      bad.forEach(function (x) { x.classList.add("is-bad"); });
      errEl.textContent = !d.pass ? "Choisissez votre Pass, VIP ou VVIP" : "Merci de compléter correctement les champs en rouge";
      errEl.hidden = false;
      (bad[0] || $('input[name="pass"]', form)).focus();
      return;
    }
    errEl.hidden = true;
    var p = passes[d.pass];
    var msg =
      "Bonjour, je souhaite réserver mon " + p.label + " pour GCAP11\n\n" +
      "Nom : " + d.nom + "\n" +
      "Prénom : " + d.prenom + "\n" +
      "Téléphone : " + d.tel + "\n" +
      "Email : " + d.email + "\n" +
      "Ville / Pays : " + d.ville + "\n" +
      "Pass : " + p.label + " (" + fmt(p.price) + " FCFA)\n" +
      "Nombre de places : " + d.places + "\n" +
      "Montant indicatif : " + fmt(p.price * d.places) + " FCFA\n\n" +
      "Je souhaite recevoir les informations nécessaires pour finaliser ma réservation";
    var url = "https://wa.me/" + String(C.whatsappNumber || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(msg);
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
  });
})();

/* ============================================================
   THE'Y STUDIO DESIGN — Phase 1 behaviors
   Zero dependencies. Every effect degrades gracefully and
   respects prefers-reduced-motion (Blueprint §9.5).
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Analytics seam (§2.3 / §8.2) ----------
     Micro-conversion events are emitted here. Wire a
     privacy-friendly provider (Plausible/Fathom) by defining
     window.THEY_ANALYTICS = function(event, props) {...} */
  function track(event, props) {
    try {
      if (typeof window.THEY_ANALYTICS === "function") window.THEY_ANALYTICS(event, props || {});
    } catch (e) { /* analytics must never break the site */ }
  }
  window.__track = track;

  /* ---------- Service worker cleanup ----------
     Phase 1 is stateless (§8.2.5). Kill any SW left over from
     the previous placeholder/app so no cache zombie survives. */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    }).catch(function () {});
  }

  /* ---------- Header: hide on scroll-down, reveal on scroll-up ---------- */
  var header = $(".site-header");
  if (header) {
    var lastY = window.scrollY, ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      if (!document.body.classList.contains("menu-open")) {
        if (y > lastY && y > 220) header.classList.add("is-hidden");
        else header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) header.classList.remove("is-hidden");
    });
    $$(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Theme toggle (dark default / light) ---------- */
  $$("[data-theme-toggle]").forEach(function (btn) {
    var themeMeta = $('meta[name="theme-color"]');
    var apply = function (t, animate) {
      if (animate && !reduced) {
        document.documentElement.classList.add("theming");
        setTimeout(function () { document.documentElement.classList.remove("theming"); }, 380);
      }
      if (t === "light") document.documentElement.setAttribute("data-theme", "light");
      else document.documentElement.removeAttribute("data-theme");
      if (themeMeta && !document.body.classList.contains("surface-paper")) {
        themeMeta.setAttribute("content", t === "light" ? "#F8F8F6" : "#0F0F0E");
      }
    };
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      try { localStorage.setItem("they_theme", next); } catch (e) {}
      apply(next, true);
      track("theme_toggle", { theme: next });
    });
    /* follow OS changes only while the user hasn't chosen explicitly */
    try {
      if (!localStorage.getItem("they_theme")) {
        window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
          apply(e.matches ? "light" : "dark", true);
        });
      }
    } catch (e) {}
  });

  /* ---------- Local time, Casablanca (§1.4) ---------- */
  var clocks = $$("[data-local-time]");
  if (clocks.length) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca"
    });
    var tick = function () {
      var t = fmt.format(new Date());
      clocks.forEach(function (el) { el.textContent = t + " GMT+1"; });
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Copy email on click (§1.4) ---------- */
  $$(".copy-email").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var email = btn.getAttribute("data-email");
      var done = function () {
        var prev = btn.textContent;
        btn.textContent = "Copied to clipboard";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = prev; btn.classList.remove("copied"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(function () {
          window.location.href = "mailto:" + email;
        });
      } else {
        window.location.href = "mailto:" + email;
      }
    });
  });

  /* ---------- Reveal on enter (masked stagger, clip wipes, lines) ---------- */
  var revealables = $$(".reveal, .reveal-media, .draw-line, .footer-watermark, [data-words]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          if (en.target.hasAttribute("data-words")) en.target.classList.add("words-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in", "words-in"); });
  }

  /* ---------- Hero word split (masked stagger, 80ms/word §3.1) ----------
     Authored <br> elements are preserved so every locale can compose the
     same deliberate line structure (identical hero anatomy EN/FR/AR). */
  $$("[data-split]").forEach(function (el) {
    var lines = [[]];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === "BR") lines.push([]);
      else if (n.textContent) n.textContent.trim().split(/\s+/).forEach(function (w) {
        if (w) lines[lines.length - 1].push(w);
      });
    });
    el.textContent = "";
    el.setAttribute("data-words", "");
    var i = 0;
    lines.forEach(function (words, li) {
      words.forEach(function (w) {
        var line = document.createElement("span");
        line.className = "reveal-line";
        line.style.display = "inline-block";
        var word = document.createElement("span");
        word.className = "reveal-word";
        word.style.transitionDelay = (i * 80) + "ms";
        word.textContent = w;
        line.appendChild(word);
        el.appendChild(line);
        el.appendChild(document.createTextNode(" "));
        i++;
      });
      if (li < lines.length - 1) el.appendChild(document.createElement("br"));
    });
    if (reduced) el.classList.add("words-in");
    else requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("words-in"); });
    });
  });

  /* ---------- Scroll-linked ink reveal (manifesto §3.4) ---------- */
  $$(".ink-reveal").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (w) {
      var s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(" "));
    });
    var spans = $$(".w", el);
    if (reduced) { spans.forEach(function (s) { s.classList.add("lit"); }); return; }
    var update = function () {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.82 - r.top) / (r.height + vh * 0.35);
      progress = Math.max(0, Math.min(1, progress));
      var lit = Math.round(progress * spans.length);
      spans.forEach(function (s, i) { s.classList.toggle("lit", i < lit); });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  });

  /* ---------- Parallax ≤6% (§9.5) ---------- */
  var pxEls = $$("[data-parallax]");
  if (pxEls.length && !reduced) {
    var pxTick = function () {
      var vh = window.innerHeight;
      pxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var center = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5-ish
        var shift = Math.max(-6, Math.min(6, center * -8));
        el.style.transform = "translateY(" + shift.toFixed(2) + "%) scale(1.08)";
      });
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(pxTick); }, { passive: true });
    pxTick();
  }

  /* ---------- Magnetic buttons ≤8px (§9.5) ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    $$("[data-magnetic], .header-cta").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = "translate(" + (x * 6).toFixed(1) + "px," + (y * 5).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Cursor chip on project media (§3.2) ---------- */
  var chipTargets = $$("[data-cursor-chip]");
  if (chipTargets.length && !reduced && window.matchMedia("(pointer: fine)").matches) {
    var chip = document.createElement("div");
    chip.className = "cursor-chip";
    chip.setAttribute("aria-hidden", "true");
    document.body.appendChild(chip);
    var cx = 0, cy = 0, shown = false;
    document.addEventListener("mousemove", function (e) {
      cx = e.clientX; cy = e.clientY;
      if (shown) chip.style.transform = "translate(" + (cx - chip.offsetWidth / 2) + "px," + (cy - chip.offsetHeight / 2) + "px) scale(1)";
    }, { passive: true });
    chipTargets.forEach(function (t) {
      t.addEventListener("mouseenter", function () {
        chip.textContent = t.getAttribute("data-cursor-chip") || "View →";
        shown = true;
        chip.style.transform = "translate(" + (cx - 40) + "px," + (cy - 20) + "px) scale(1)";
        chip.classList.add("on");
      });
      t.addEventListener("mouseleave", function () {
        shown = false;
        chip.classList.remove("on");
        chip.style.transform = "translate(" + cx + "px," + cy + "px) scale(0)";
      });
    });
  }

  /* ---------- Count-up, once, 600ms (§3.6) ---------- */
  var counters = $$("[data-count]");
  if (counters.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced) { el.textContent = target + suffix; return; }
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / 600);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { cio.observe(c); });
    } else {
      counters.forEach(runCount);
    }
  }

  /* ---------- Testimonial rotator — one voice at a time (§3.6) ---------- */
  var quoteWrap = $("[data-quotes]");
  if (quoteWrap) {
    var slides = $$(".quote-slide", quoteWrap);
    var idx = 0, timer = null;
    var show = function (i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) { s.classList.toggle("active", j === idx); });
    };
    var arm = function () {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(function () { show(idx + 1); }, 9000);
    };
    var prev = $("[data-quote-prev]"), next = $("[data-quote-next]");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); arm(); });
    if (next) next.addEventListener("click", function () { show(idx + 1); arm(); });
    show(0); arm();
  }

  /* ---------- Work index filters — FLIP reorder (§4.1) ---------- */
  var filterRow = $("[data-filters]");
  if (filterRow) {
    var entries = $$("[data-disciplines]");
    var buttons = $$(".filter-btn", filterRow);
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        var f = btn.getAttribute("data-filter");
        // FLIP: First
        var first = {};
        entries.forEach(function (el) {
          if (!el.classList.contains("filtered-out")) first[el.id] = el.getBoundingClientRect().top;
        });
        // Apply
        entries.forEach(function (el) {
          var match = f === "all" || (el.getAttribute("data-disciplines") || "").split(" ").indexOf(f) !== -1;
          el.classList.toggle("filtered-out", !match);
        });
        // Last + Invert + Play
        if (!reduced) {
          entries.forEach(function (el) {
            if (el.classList.contains("filtered-out") || !(el.id in first)) {
              if (!el.classList.contains("filtered-out")) {
                el.style.opacity = "0";
                requestAnimationFrame(function () {
                  el.style.transition = "opacity 400ms cubic-bezier(.22,1,.36,1)";
                  el.style.opacity = "1";
                  setTimeout(function () { el.style.transition = el.style.opacity = ""; }, 450);
                });
              }
              return;
            }
            var delta = first[el.id] - el.getBoundingClientRect().top;
            if (Math.abs(delta) < 2) return;
            el.style.transform = "translateY(" + delta + "px)";
            el.style.transition = "none";
            requestAnimationFrame(function () {
              el.style.transition = "transform 500ms cubic-bezier(.65,0,.35,1)";
              el.style.transform = "";
              setTimeout(function () { el.style.transition = ""; }, 550);
            });
          });
        }
        track("work_filter", { filter: f });
      });
    });
  }

  /* ---------- Case-study reading progress (§4.2.2) ---------- */
  var progress = $(".cs-progress");
  if (progress) {
    var pTick = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
      progress.style.width = (p * 100).toFixed(2) + "%";
      if (p > 0.72 && !progress.__resultsReached) {
        progress.__resultsReached = true;
        track("case_study_read_depth", { page: location.pathname, depth: "results" });
      }
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(pTick); }, { passive: true });
    pTick();
  }

  /* ---------- Before/After slider (§4.2.8) ---------- */
  $$(".ba-slider").forEach(function (slider) {
    var after = $(".ba-after", slider);
    var handle = $(".ba-handle", slider);
    var set = function (pct) {
      pct = Math.max(2, Math.min(98, pct));
      after.style.clipPath = "inset(0 0 0 " + pct + "%)";
      handle.style.left = pct + "%";
    };
    var fromEvent = function (e) {
      var r = slider.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    var dragging = false;
    slider.addEventListener("pointerdown", function (e) { dragging = true; slider.setPointerCapture(e.pointerId); fromEvent(e); });
    slider.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    slider.addEventListener("pointerup", function () { dragging = false; });
    slider.addEventListener("pointercancel", function () { dragging = false; });
    // keyboard access
    slider.setAttribute("tabindex", "0");
    slider.setAttribute("role", "slider");
    slider.setAttribute("aria-label", "Before / after comparison");
    slider.setAttribute("aria-valuemin", "0");
    slider.setAttribute("aria-valuemax", "100");
    slider.setAttribute("aria-valuenow", "50");
    var kb = 50;
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { kb = Math.max(0, kb - 5); set(kb); slider.setAttribute("aria-valuenow", kb); e.preventDefault(); }
      if (e.key === "ArrowRight") { kb = Math.min(100, kb + 5); set(kb); slider.setAttribute("aria-valuenow", kb); e.preventDefault(); }
    });
  });

  /* ---------- Inquiry form — 3 conversational steps (§7.2) ---------- */
  var form = $("#inquiry-form");
  if (form) {
    var steps = $$(".form-step", form);
    var stepLabel = $("[data-step-label]", form);
    var current = 0;
    var openedAt = Date.now(); // time-trap
    var started = false;

    var goTo = function (i) {
      current = i;
      steps.forEach(function (s, j) { s.classList.toggle("active", j === i); });
      if (stepLabel) stepLabel.textContent = "0" + (i + 1) + " / 0" + steps.length;
      var firstInput = $("input:not([type=hidden]), textarea, .chip", steps[i]);
      if (firstInput && window.matchMedia("(pointer: fine)").matches) firstInput.focus({ preventScroll: true });
    };

    // chips (multi-select for services, single for budget/timeline)
    $$(".chips", form).forEach(function (group) {
      var multi = group.getAttribute("data-multi") === "true";
      $$(".chip", group).forEach(function (chip) {
        chip.addEventListener("click", function () {
          if (!started) { started = true; track("form_started"); }
          if (multi) {
            chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
          } else {
            $$(".chip", group).forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
          }
        });
      });
    });

    form.addEventListener("input", function () {
      if (!started) { started = true; track("form_started"); }
    });

    var chipValues = function (name) {
      var group = $('[data-chip-group="' + name + '"]', form);
      if (!group) return [];
      return $$('.chip[aria-pressed="true"]', group).map(function (c) { return c.textContent.trim(); });
    };

    /* Prefill from /contact/?service=… (Services page "Discuss this →").
       Chips are matched by data-svc slug, so it works in every locale. */
    var svcParam = new URLSearchParams(location.search).get("service");
    if (svcParam && /^[a-z]+$/.test(svcParam)) {
      var svcChip = $('[data-chip-group="services"] .chip[data-svc="' + svcParam + '"]', form);
      if (svcChip) svcChip.setAttribute("aria-pressed", "true");
    }

    /* Pack fast-track: /contact/?pack=… (Services page "Start this pack →").
       Packs are fixed scope, fixed price — no scoping or budget questions,
       jump straight to the contact step. */
    var packParam = new URLSearchParams(location.search).get("pack");
    if (packParam && /^[a-z]+$/.test(packParam)) {
      var packNote = $("[data-pack-note]", form);
      var packName = packNote && $('[data-pack-name="' + packParam + '"]', packNote);
      if (packName) {
        packName.hidden = false;
        packNote.hidden = false;
        var packDesc = $("#f-desc", form);
        if (packDesc && !packDesc.value) packDesc.value = "Pack: " + packName.textContent.trim();
        goTo(steps.length - 1);
      }
    }

    var validateStep = function (i) {
      var ok = true;
      $$("[data-required]", steps[i]).forEach(function (field) {
        var input = $("input, textarea", field);
        var valid = input && input.value.trim().length > 0;
        if (input && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      return ok;
    };

    $$("[data-next]", form).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!validateStep(current)) return;
        track("form_step_completed", { step: current + 1 });
        goTo(current + 1);
      });
    });
    $$("[data-back]", form).forEach(function (btn) {
      btn.addEventListener("click", function () { goTo(current - 1); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;

      // Anti-spam (§7.2): honeypot + time-trap. Never CAPTCHA.
      var hp = $('[name="website_url"]', form);
      if ((hp && hp.value) || Date.now() - openedAt < 3000) {
        // silently accept — bots get the success screen, humans are unaffected
        showSuccess(""); return;
      }

      var data = {
        services: chipValues("services").join(", ") || "—",
        description: ($("#f-desc", form) || {}).value || "—",
        budget: chipValues("budget").join(", ") || "—",
        timeline: chipValues("timeline").join(", ") || "—",
        name: ($("#f-name", form) || {}).value || "",
        email: ($("#f-email", form) || {}).value || "",
        company: ($("#f-company", form) || {}).value || "—",
        link: ($("#f-link", form) || {}).value || "—"
      };

      /* Submission seam: set data-endpoint on the form to a
         Formspree/Basin URL to POST silently. Until then, the
         inquiry opens the visitor's mail client fully composed. */
      var endpoint = form.getAttribute("data-endpoint");
      var finish = function () {
        track("form_completed", { services: data.services, budget: data.budget });
        showSuccess(data.email);
      };
      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        }).then(finish).catch(finish);
      } else {
        var body = [
          "Project inquiry — " + data.name,
          "",
          "Services: " + data.services,
          "In a sentence: " + data.description,
          "Budget: " + data.budget,
          "Timeline: " + data.timeline,
          "",
          "Name: " + data.name,
          "Email: " + data.email,
          "Company: " + data.company,
          "Current site/brand: " + data.link
        ].join("\n");
        window.location.href = "mailto:contact@theystudiodesign.com"
          + "?subject=" + encodeURIComponent("Project inquiry — " + (data.name || "New project"))
          + "&body=" + encodeURIComponent(body);
        finish();
      }
    });

    var showSuccess = function () {
      form.style.display = "none";
      var s = $(".form-success");
      if (s) { s.classList.add("active"); s.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }); }
    };

    goTo(current); // fast-track may have advanced past step 1
  }

  /* ---------- Booking CTA (§7.3) ----------
     Set data-calendly on any [data-book] element (or define
     window.THEY_CALENDLY_URL) once the Calendly account exists.
     Until then the button falls back to the inquiry email. */
  $$("[data-book]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var url = btn.getAttribute("data-calendly") || window.THEY_CALENDLY_URL;
      track("calendly_opened", { configured: !!url });
      if (url) {
        e.preventDefault();
        window.open(url, "_blank", "noopener");
      }
      // no URL: the element's own href (mailto/contact) applies
    });
  });

  /* ---------- Page transitions (§9.5) ----------
     Internal navigations fade <main> out (230ms) before leaving; the CSS
     page-enter animation fades it back in on arrival. bfcache-safe. */
  if (!reduced) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-book")) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (url.pathname === location.pathname && url.hash) return; /* in-page anchors */
      e.preventDefault();
      document.documentElement.classList.add("page-leave");
      setTimeout(function () { location.href = url.href; }, 230);
    });
    /* restore instantly when returning via back/forward cache */
    window.addEventListener("pageshow", function () {
      document.documentElement.classList.remove("page-leave");
    });
  }

  /* ---------- Auto section reveal (§9.5) ----------
     Below-the-fold sections get a soft fade/slide as they enter. Applied
     by JS only, so no-JS and reduced-motion users see everything at once;
     sections already on screen at load are never touched (zero flicker). */
  if ("IntersectionObserver" in window && !reduced) {
    var vh0 = window.innerHeight;
    var below = $$("main > section").filter(function (s) {
      return !s.classList.contains("hero") && s.getBoundingClientRect().top > vh0 * 0.9;
    });
    below.forEach(function (s) { s.classList.add("sec-pre"); });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("sec-in"); sio.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    below.forEach(function (s) { sio.observe(s); });
  }
})();

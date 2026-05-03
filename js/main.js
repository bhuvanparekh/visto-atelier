/* ─────────────────────────────────────────────
   VISTO ATELIER — interaction & motion
   - Lenis smooth scroll
   - GSAP scroll triggers
   - Loader, custom cursor, marquee
   - Capability hover preview
   - Line-by-line reveal
   ───────────────────────────────────────────── */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ───── Loader — shutter reveal sequence ───── */
  function runLoader() {
    return new Promise((resolve) => {
      const el = $("#loader");
      if (!el) return resolve();

      const fill = $("#loaderFill");
      const count = $("#loaderCount");
      const words = $$(".loader__words span");

      document.body.style.overflow = "hidden";
      // kick off entrance animations (CSS transitions)
      requestAnimationFrame(() => el.classList.add("is-active"));

      // word ticker — cycles through atelier vocabulary
      let wi = 0;
      const cycle = setInterval(() => {
        if (!words.length) return;
        words.forEach((w) => w.classList.remove("is-active", "is-out"));
        words[wi].classList.add("is-out");
        wi = (wi + 1) % words.length;
        words[wi].classList.add("is-active");
      }, 360);

      // counter
      const start = performance.now();
      const dur = 1300;
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const n = Math.floor(eased * 100);
        if (count) count.textContent = String(n).padStart(3, "0");
        if (fill) fill.style.width = (eased * 100) + "%";
        if (p > 0.7) el.classList.add("is-glow");
        if (p < 1) requestAnimationFrame(tick);
        else {
          clearInterval(cycle);
          setTimeout(() => {
            // hero title reveal starts AS shutters begin lifting
            $(".hero")?.classList.add("is-ready");
            el.classList.add("is-done");
            document.body.style.overflow = "";
            // resolve once final shutter clears (~4*80ms stagger + 1.1s)
            setTimeout(() => {
              el.style.pointerEvents = "none";
              resolve();
            }, 1200);
          }, 200);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ───── Project name — letter split for hover stagger ───── */
  function initProjectLetters() {
    $$(".project__name").forEach((name) => {
      const text = name.textContent.trim();
      name.textContent = "";
      let idx = 0;
      [...text].forEach((ch) => {
        const span = document.createElement("span");
        span.className = "l";
        const visible = ch === " " ? " " : ch;
        span.dataset.l = visible;
        span.textContent = visible;
        span.style.setProperty("--i", idx++);
        name.appendChild(span);
      });
    });
  }

  /* ───── Hero title — cursor-tracked parallax ───── */
  function initHeroTitleParallax() {
    if (!isFinePointer || !window.gsap) return;
    const hero = $("#hero");
    const title = $(".hero__title");
    if (!hero || !title) return;
    const xTo = gsap.quickTo(title, "x", { duration: 0.9, ease: "power3.out" });
    const yTo = gsap.quickTo(title, "y", { duration: 0.9, ease: "power3.out" });
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      xTo(px * 14);
      yTo(py * 10);
    });
    hero.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
  }

  /* ───── Section heads — dot scale + ember underline draws in ───── */
  function initSectionHeads() {
    if (!window.ScrollTrigger) return;
    $$(".section-head").forEach((sh) => {
      ScrollTrigger.create({
        trigger: sh,
        start: "top 88%",
        once: true,
        onEnter: () => sh.classList.add("is-in"),
      });
    });
  }

  /* ───── Project number ticker — counts up on entry ───── */
  function initProjectNumTicker() {
    if (!window.gsap || !window.ScrollTrigger) return;
    $$(".project__num").forEach((el) => {
      const target = parseInt(el.textContent, 10);
      if (isNaN(target)) return;
      const padLen = el.textContent.length;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: target,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = String(Math.floor(obj.v)).padStart(padLen, "0");
            },
          });
        },
      });
    });
  }

  /* ───── Custom cursor ───── */
  function initCursor() {
    if (!isFinePointer) return;
    const cur = $("#cursor");
    const label = $("#cursorLabel");
    if (!cur) return;

    let mx = innerWidth / 2, my = innerHeight / 2;
    let cx = mx, cy = my;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    const lerp = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(lerp);
    };
    lerp();

    const labelMap = {
      view: "View",
      link: "Open",
      email: "Write",
      logo: "Home",
      scroll: "Scroll",
    };

    $$("a, button, [data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cur.classList.add("is-hover");
        const k = el.dataset.cursor;
        if (label) label.textContent = labelMap[k] || "";
      });
      el.addEventListener("mouseleave", () => {
        cur.classList.remove("is-hover");
        if (label) label.textContent = "";
      });
    });

    addEventListener("mouseleave", () => cur.style.opacity = "0");
    addEventListener("mouseenter", () => cur.style.opacity = "1");

    addEventListener("mousedown", () => cur.classList.add("is-down"));
    addEventListener("mouseup", () => cur.classList.remove("is-down"));
  }

  /* ───── Hero mouse spotlight ───── */
  function initHeroSpot() {
    if (!isFinePointer) return;
    const hero = $("#hero");
    const spot = $("#heroSpot");
    if (!hero || !spot) return;
    let tx = 50, ty = 50, cx = 50, cy = 50;
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
    });
    hero.addEventListener("mouseleave", () => { tx = 50; ty = 50; });
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      spot.style.setProperty("--mx", cx + "%");
      spot.style.setProperty("--my", cy + "%");
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ───── Scroll progress bar ───── */
  function initProgress() {
    const bar = $("#progressBar");
    const pct = $("#progressPct");
    const wrap = $("#progress");
    if (!bar) return;
    const update = () => {
      const max = (document.documentElement.scrollHeight - innerHeight) || 1;
      const p = Math.max(0, Math.min(1, scrollY / max));
      bar.style.width = (p * 100).toFixed(2) + "%";
      if (pct) pct.textContent = String(Math.round(p * 100)).padStart(2, "0");
      wrap?.classList.toggle("is-active", p > 0.01);
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ───── Side rail — section indicator ───── */
  function initRail() {
    const rail = $("#rail");
    const fill = $("#railFill");
    const label = $("#railLabel");
    const num = $("#railNum");
    if (!rail) return;

    const sections = $$("[data-rail-num]");
    if (!sections.length) return;

    const update = () => {
      const y = scrollY + innerHeight * 0.4;
      let active = sections[0];
      for (const s of sections) {
        if (s.offsetTop <= y) active = s;
      }
      const r = active.getBoundingClientRect();
      const start = active.offsetTop;
      const end = start + active.offsetHeight;
      const p = Math.max(0, Math.min(1, (scrollY + innerHeight * 0.4 - start) / (end - start || 1)));
      if (fill) fill.style.transform = `scaleY(${p.toFixed(3)})`;
      if (label) label.textContent = active.dataset.railLabel || "";
      if (num) num.textContent = active.dataset.railNum || "";

      const dark = active.matches(".hero, .works, .contact, .footer");
      rail.classList.toggle("on-dark", dark);
      rail.classList.add("is-active");
    };

    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ───── Project 3D tilt on hover ───── */
  function initProjectTilt() {
    if (!isFinePointer) return;
    const max = 6; // degrees
    $$(".project").forEach((p) => {
      const fig = p.querySelector(".project__figure");
      if (!fig) return;
      let rx = 0, ry = 0, tx = 0, ty = 0;
      let active = false;

      p.addEventListener("mouseenter", () => { active = true; });
      p.addEventListener("mouseleave", () => {
        active = false;
        fig.style.transform = "";
      });
      p.addEventListener("mousemove", (e) => {
        const r = p.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry = px * max;
        rx = -py * max;
        tx = px * 12;
        ty = py * 12;
      });
      const tick = () => {
        if (active) {
          fig.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  /* ───── Smooth scroll (Lenis) ───── */
  function initSmoothScroll() {
    if (prefersReduced || typeof Lenis === "undefined") return null;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // hash-link → smooth
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -40 });
      $("#menu")?.classList.remove("is-open");
      $("#burger")?.classList.remove("is-open");
    });

    return lenis;
  }

  /* ───── Hero reveal — triggered by loader completion ───── */
  function initHero() {
    // image preload happens naturally via <img>; the .is-ready class
    // is added by runLoader when shutters begin lifting, so the title
    // reveal and shutter exit play together as one coordinated motion.
  }

  /* ───── Nav state on scroll & dark sections ───── */
  function initNav() {
    const nav = $("#nav");
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle("is-scrolled", scrollY > 12);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (window.gsap && window.ScrollTrigger) {
      $$(".hero, .marquee, .works, .contact, .footer").forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 60px",
          end: "bottom 60px",
          onEnter: () => nav.classList.add("on-dark"),
          onEnterBack: () => nav.classList.add("on-dark"),
          onLeave: () => nav.classList.remove("on-dark"),
          onLeaveBack: () => nav.classList.remove("on-dark"),
        });
      });
    }

    // burger
    const burger = $("#burger");
    const menu = $("#menu");
    burger?.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    });
  }

  /* ───── Marquee continuous loop, reactive to scroll velocity ───── */
  function initMarquee() {
    const track = $("#marquee");
    if (!track || prefersReduced) return;
    if (!window.gsap) return;
    // duplicate content for seamless loop
    const content = track.innerHTML;
    track.innerHTML = content + content;

    const total = track.scrollWidth / 2;
    const baseDur = innerWidth < 768 ? 24 : 38;
    const tween = gsap.to(track, {
      x: -total,
      duration: baseDur,
      ease: "none",
      repeat: -1,
    });

    // scroll velocity → speed up + flip direction
    let lastY = scrollY;
    let velo = 0;
    const onScroll = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      velo = dy;
    };
    addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      const speed = 1 + Math.min(Math.abs(velo) / 20, 4);
      const dir = velo >= 0 ? 1 : -1;
      tween.timeScale(speed * dir);
      velo *= 0.9; // decay
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ───── Image fallback — graceful swap for any broken images ───── */
  function initImageFallback() {
    const fallbacks = [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
    ];
    let i = 0;
    $$("img").forEach((img) => {
      img.addEventListener("error", () => {
        if (img.dataset.fallback === "1") return;
        img.dataset.fallback = "1";
        img.src = fallbacks[i++ % fallbacks.length];
      }, { once: true });
    });
  }

  /* ───── Line reveals & parallax (GSAP ScrollTrigger) ───── */
  function splitToLines(el) {
    // simple line-splitter: wraps each visual line in a mask span
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.textContent = "";
    const probe = document.createElement("span");
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    el.appendChild(probe);

    const lines = [];
    let current = [];
    let lastTop = null;

    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.textContent = w + (i < words.length - 1 ? " " : "");
      el.appendChild(span);
      const top = span.offsetTop;
      if (lastTop !== null && top !== lastTop) {
        lines.push(current);
        current = [];
      }
      current.push(span);
      lastTop = top;
    });
    if (current.length) lines.push(current);

    el.textContent = "";
    lines.forEach((arr) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      const inner = document.createElement("span");
      arr.forEach((s) => inner.appendChild(s));
      mask.appendChild(inner);
      el.appendChild(mask);
    });
  }

  function initReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Manifesto lead — soft slide reveal (preserves inline <em>)
    const lead = $(".manifesto__lead");
    if (lead && !prefersReduced) {
      gsap.fromTo(lead,
        { y: 40, opacity: 0, filter: "blur(6px)" },
        {
          y: 0, opacity: 1, filter: "blur(0px)",
          duration: 1.4, ease: "expo.out",
          scrollTrigger: { trigger: lead, start: "top 82%", once: true },
        }
      );
    }

    // Generic fade-ups
    $$(".value, .cap, .step, .project, .press, .contact__cols > div, .footer__row > span")
      .forEach((el) => el.classList.add("fade-up"));

    $$(".fade-up").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      });
    });

    // Parallax for [data-parallax]
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.15;
      gsap.fromTo(
        el.tagName === "FIGURE" ? el.querySelector("img") || el : el,
        { yPercent: -amt * 50 },
        {
          yPercent: amt * 50,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    // Hero title parallax on scroll
    const heroTitle = $(".hero__title");
    if (heroTitle) {
      gsap.to(heroTitle, {
        yPercent: -18,
        opacity: .35,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // Capabilities title — stagger reveal
    const capTitle = $(".capabilities__title");
    if (capTitle && !prefersReduced) {
      const html = capTitle.innerHTML;
      // wrap each word for stagger
      const wrapped = html.replace(/(<[^>]+>|[^<\s]+)/g, (m) =>
        m.startsWith("<") ? m : `<span class="w"><i>${m}</i></span>`
      );
      capTitle.innerHTML = wrapped;
      capTitle.querySelectorAll(".w").forEach((s) => {
        s.style.display = "inline-block";
        s.style.overflow = "hidden";
        s.style.verticalAlign = "top";
      });
      capTitle.querySelectorAll(".w i").forEach((s) => {
        s.style.display = "inline-block";
        s.style.transform = "translateY(110%)";
        s.style.fontStyle = s.parentElement.parentElement.tagName === "EM" ? "italic" : "";
      });
      ScrollTrigger.create({
        trigger: capTitle,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to(capTitle.querySelectorAll(".w i"), {
            y: 0,
            yPercent: 0,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.04,
          });
        },
      });
    }

    // Works title reveal
    const worksTitle = $(".works__title");
    if (worksTitle && !prefersReduced) {
      gsap.from(worksTitle, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: worksTitle, start: "top 80%" },
      });
    }

    // Project image clip-reveal
    $$(".project__figure").forEach((fig) => {
      gsap.fromTo(fig,
        { clipPath: "inset(20% 10% 20% 10%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "expo.out",
          duration: 1.4,
          scrollTrigger: { trigger: fig, start: "top 85%", once: true },
        }
      );
    });

    // Quote split reveal
    const quote = $(".quote__body");
    if (quote && !prefersReduced) {
      gsap.from(quote, {
        opacity: 0,
        y: 30,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: quote, start: "top 80%" },
      });
    }

    // Footer giant text — perspective slide
    const giant = $("#footerGiant");
    if (giant && !prefersReduced) {
      gsap.fromTo(giant,
        { yPercent: 30, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          ease: "expo.out",
          duration: 1.6,
          scrollTrigger: { trigger: giant, start: "top 90%" },
        }
      );
    }
  }

  /* ───── Capability hover preview ───── */
  function initCapPreview() {
    if (!isFinePointer) return;
    const preview = $("#capPreview");
    const img = $("#capPreviewImg");
    if (!preview || !img) return;

    let mx = 0, my = 0, px = 0, py = 0;
    let active = false;

    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

    const tick = () => {
      px += (mx - px) * 0.12;
      py += (my - py) * 0.12;
      if (active) preview.style.left = px + "px", preview.style.top = py + "px";
      requestAnimationFrame(tick);
    };
    tick();

    $$(".cap").forEach((cap) => {
      cap.addEventListener("mouseenter", () => {
        const src = cap.dataset.img;
        if (!src) return;
        img.src = src;
        active = true;
        preview.classList.add("is-visible");
      });
      cap.addEventListener("mouseleave", () => {
        active = false;
        preview.classList.remove("is-visible");
      });
    });
  }

  /* ───── Year stamp ───── */
  function initYear() {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ───── Magnetic hover for CTA & email ───── */
  function initMagnetic() {
    if (!isFinePointer) return;
    $$(".nav__cta, .contact__email, .works__cta").forEach((el) => {
      const strength = 18;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(x / r.width) * strength}px, ${(y / r.height) * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ───── Boot ───── */
  document.addEventListener("DOMContentLoaded", async () => {
    initYear();
    initImageFallback();
    initProjectLetters();
    initHero();
    initHeroSpot();
    initNav();
    initCursor();
    initMagnetic();
    initCapPreview();
    initProjectTilt();
    initProgress();
    initRail();

    // wait a tick so GSAP / Lenis CDN scripts have loaded
    const ready = () => {
      initSmoothScroll();
      initMarquee();
      initReveals();
      initSectionHeads();
      initProjectNumTicker();
      initHeroTitleParallax();
      // refresh after fonts/images settle
      setTimeout(() => window.ScrollTrigger?.refresh(), 600);
      window.addEventListener("load", () => window.ScrollTrigger?.refresh());
    };
    if (window.gsap && window.Lenis) ready();
    else window.addEventListener("load", ready, { once: true });

    await runLoader();
  });
})();

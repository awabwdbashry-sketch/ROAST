/* ==========================================================================
   ROAST — Main
   Real asset preloading with an honest progress bar, nav solidify-on-scroll,
   subtle custom cursor, and the mobile menu toggle.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     LOADER — preloads every sequence frame (the assets the core experience
     depends on) and reports real progress, not a simulated one.
     --------------------------------------------------------------------- */
  const loader = document.getElementById("loader");
  const barFill = document.getElementById("loaderBarFill");
  const percentEl = document.getElementById("loaderPercent");

  const SEQUENCE_FRAMES = Array.from(
    { length: 10 },
    (_, i) => `assets/images/sequence/seq-${String(i + 1).padStart(2, "0")}.jpg`
  );
  const HERO_ASSET = "assets/images/gallery/gal-08-moment.jpg";
  const ASSETS = [HERO_ASSET, ...SEQUENCE_FRAMES];

  let loaded = 0;
  const total = ASSETS.length;

  function bump() {
    loaded += 1;
    const pct = Math.round((loaded / total) * 100);
    if (barFill) barFill.style.width = pct + "%";
    if (percentEl) percentEl.textContent = String(pct).padStart(2, "0") + "%";
    if (loaded >= total) finish();
  }

  function finish() {
    window.setTimeout(() => {
      if (loader) loader.classList.add("is-hidden");
      document.body.classList.add("is-loaded");
    }, 260);
  }

  function preload() {
    if (!ASSETS.length) return finish();
    ASSETS.forEach((src) => {
      const img = new Image();
      img.onload = bump;
      img.onerror = bump; /* never block the experience on one bad asset */
      img.src = src;
    });
  }

  preload();
  /* Safety net: never let a stalled asset trap the visitor forever. */
  window.setTimeout(finish, 6000);

  /* ---------------------------------------------------------------------
     NAV — solidify on scroll, mobile toggle
     --------------------------------------------------------------------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");

  function onNavScroll() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  window.addEventListener("scroll", onNavScroll, { passive: true });
  onNavScroll();

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const links = document.querySelector(".nav-links");
      if (!links) return;
      const open = links.style.display === "flex";
      links.style.cssText = open
        ? ""
        : "display:flex;position:fixed;inset:88px 0 auto 0;flex-direction:column;gap:0;background:var(--espresso);padding:1rem 1.5rem 2rem;border-bottom:1px solid var(--line);";
    });
  }

  /* ---------------------------------------------------------------------
     CURSOR — subtle dot, expands with a label over interactive elements
     --------------------------------------------------------------------- */
  const cursor = document.getElementById("cursor");
  const cursorLabel = document.getElementById("cursorLabel");
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (cursor && !isTouch) {
    let cx = 0,
      cy = 0,
      tx = 0,
      ty = 0;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add("is-active");
    });

    function raf() {
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("is-hover");
        if (cursorLabel) cursorLabel.textContent = el.dataset.cursor || "";
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-hover");
        if (cursorLabel) cursorLabel.textContent = "";
      });
    });
  }
})();

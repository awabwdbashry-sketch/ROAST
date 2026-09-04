/* ==========================================================================
   ROAST — Reveal Animations
   A single, quiet entrance treatment for editorial content outside the
   sequence: gallery, statement, ritual, details, final.
   ========================================================================== */

(function () {
  "use strict";

  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Number(el.dataset.revealDelay || 0);
          window.setTimeout(() => el.classList.add("is-visible"), delay);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  /* Stagger siblings that share a parent row so groups feel choreographed,
     without adding per-card scroll listeners. */
  const groups = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((group) => {
    group.forEach((el, i) => {
      if (group.length > 1) el.dataset.revealDelay = String(i * 90);
    });
  });

  items.forEach((el) => observer.observe(el));
})();

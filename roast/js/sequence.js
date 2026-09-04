/* ==========================================================================
   ROAST — Sequence Controller
   Drives the 10-frame scroll sequence: frame interpolation, crossfade,
   subtle orbital motion, and synced editorial text.
   ========================================================================== */

(function () {
  "use strict";

  const STAGE_COUNT = 10;
  const VH_PER_STAGE = 105; /* runway height per stage, in vh units */

  const STAGES = [
    { stage: "01", title: "البداية",   line: "كل شيء يبدأ من الحبة." },
    { stage: "02", title: "الطحن",     line: "التفاصيل تصنع الفرق." },
    { stage: "03", title: "التحضير",   line: "لحظة قبل الاكتمال." },
    { stage: "04", title: "الاستخلاص", line: "حين يبدأ العطر بالظهور." },
    { stage: "05", title: "التحول",    line: "الماء يلتقي بالقهوة." },
    { stage: "06", title: "التدفق",    line: "اللحظة تتحرك." },
    { stage: "07", title: "الامتلاء",  line: "الطعم يأخذ شكله." },
    { stage: "08", title: "الطبقة",    line: "تفصيل صغير. فرق كبير." },
    { stage: "09", title: "اللحظة",    line: "كل شيء يقود إلى هنا." },
    { stage: "10", title: "ROAST",     line: "من الحبة إلى اللحظة." },
  ];

  const framePath = (i) =>
    `assets/images/sequence/seq-${String(i + 1).padStart(2, "0")}.jpg`;

  const section = document.getElementById("sequence");
  const sticky = section ? section.querySelector(".sequence-sticky") : null;
  const layerA = document.getElementById("seqLayerA");
  const layerB = document.getElementById("seqLayerB");
  const orbitDot = document.getElementById("orbitDot");
  const orbitProgress = document.getElementById("orbitProgress");
  const stageIndexEl = document.getElementById("stageIndex");
  const stageTitleEl = document.getElementById("stageTitle");
  const stageLineEl = document.getElementById("stageLine");
  const progressCurrentEl = document.getElementById("progressCurrent");
  const orbitRing = document.getElementById("orbitRing");

  if (!section || !layerA || !layerB) return;

  /* Size the scroll runway precisely so the last frame settles with room
     to read, rather than an arbitrary fixed vh guess. */
  function sizeRunway() {
    section.style.height = STAGE_COUNT * VH_PER_STAGE + "vh";
  }
  sizeRunway();

  const CIRC = 2 * Math.PI * 46; /* matches svg r=46 */
  if (orbitProgress) {
    orbitProgress.style.strokeDasharray = String(CIRC);
    orbitProgress.style.strokeDashoffset = String(CIRC);
  }

  let currentStage = -1;
  let ticking = false;
  let lastProgress = -1;

  layerA.src = framePath(0);
  layerB.src = framePath(0);

  function updateText(stageIdx) {
    if (stageIdx === currentStage) return;
    currentStage = stageIdx;
    const s = STAGES[stageIdx];
    if (!s) return;

    [stageIndexEl, stageTitleEl, stageLineEl].forEach((el) => {
      if (el) el.style.opacity = "0";
    });

    window.setTimeout(() => {
      if (stageIndexEl) stageIndexEl.textContent = s.stage;
      if (stageTitleEl) stageTitleEl.textContent = s.title;
      if (stageLineEl) stageLineEl.textContent = s.line;
      if (progressCurrentEl) progressCurrentEl.textContent = s.stage;
      [stageIndexEl, stageTitleEl, stageLineEl].forEach((el) => {
        if (el) el.style.opacity = "1";
      });
    }, 180);
  }

  /* Crossfade model:
     We keep layerA always = floor frame, layerB always = ceil frame,
     and blend opacity by t. This guarantees correctness regardless of
     scroll direction and avoids state-machine edge cases. */
  function render(progress) {
    const total = STAGE_COUNT - 1;
    const raw = progress * total; /* 0..9 */
    const floor = Math.max(0, Math.min(total, Math.floor(raw)));
    const ceil = Math.max(0, Math.min(total, Math.ceil(raw)));
    const t = raw - floor;

    const floorPath = framePath(floor);
    const ceilPath = framePath(ceil);

    if (layerA.dataset.frame !== String(floor)) {
      layerA.src = floorPath;
      layerA.dataset.frame = String(floor);
    }
    if (layerB.dataset.frame !== String(ceil)) {
      layerB.src = ceilPath;
      layerB.dataset.frame = String(ceil);
    }

    layerA.style.opacity = String(1 - t);
    layerB.style.opacity = String(t);

    /* Cinematic easing on scale/position — a whisper of orbital drift,
       not a literal rotation of the photograph. */
    const wobble = Math.sin(progress * Math.PI * 2) * 0.012;
    const scaleA = 1.05 - t * 0.015 + wobble;
    const scaleB = 1.035 + t * 0.015 + wobble;
    const shiftX = Math.sin(progress * Math.PI) * 1.1;
    layerA.style.transform = `scale(${scaleA}) translateX(${shiftX}%)`;
    layerB.style.transform = `scale(${scaleB}) translateX(${-shiftX}%)`;

    /* Orbit ring: dot travels the full circle across the whole sequence,
       progress ring fills in step. */
    if (orbitDot) {
      const angle = progress * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const r = 48; /* percent of ring box */
      const x = 50 + r * Math.cos(rad);
      const y = 50 + r * Math.sin(rad);
      orbitDot.style.left = x + "%";
      orbitDot.style.top = y + "%";
    }
    if (orbitProgress) {
      orbitProgress.style.strokeDashoffset = String(CIRC * (1 - progress));
    }
    if (orbitRing) {
      orbitRing.style.transform = `translate(-50%,-50%) scale(${1 + wobble * 2})`;
    }

    const stageIdx = Math.round(raw);
    updateText(stageIdx);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      let progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
      progress = Math.max(0, Math.min(1, progress));

      if (Math.abs(progress - lastProgress) > 0.0008) {
        render(progress);
        lastProgress = progress;
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    sizeRunway();
    onScroll();
  });

  /* Initial paint */
  render(0);

  /* Recompute after images are ready, in case layout shifted. */
  window.addEventListener("load", onScroll);
})();

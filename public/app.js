(async function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // Builds elements with textContent only, so content can never inject markup.
  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    });
    kids.flat().filter(Boolean).forEach((kid) => node.append(kid));
    return node;
  }

  const webUrl = (url) => (/^https?:\/\//i.test(url || "") ? url : "");
  const imageUrl = (url) => (/^(https?:\/\/|[\w .\/-]+\.(png|jpe?g|webp|gif)$)/i.test(url || "") ? url : "");

  let content;
  try {
    content = window.__CONTENT || (await (await fetch("content.json", { cache: "no-cache" })).json());
  } catch (error) {
    document.querySelector("main").prepend(el("p", { class: "noscript", text: "The portfolio content could not load. Check that content.json is valid JSON." }));
    return;
  }

  /* ---------- Page content ---------- */
  $("sample-strip").hidden = !content.sample;
  $("brand-name").textContent = content.name;
  $("hero-role").textContent = content.role;
  content.name.split(" ").forEach((word) => $("hero-name").append(el("span", { text: word }), " "));
  $("hero-tagline").textContent = content.tagline;
  $("hero-intro").textContent = content.intro;
  $("about-text").textContent = content.about;
  $("foot-name").textContent = `© ${new Date().getFullYear()} ${content.fullName}`;
  document.title = `${content.name} Portfolio`;

  const fillRun = (target, words, copies) => {
    for (let i = 0; i < copies; i++) {
      words.forEach((word) => target.append(el("span", { text: word, "aria-hidden": i ? "true" : "false" })));
    }
  };
  fillRun($("ticker-track"), content.marquee, 4);

  content.stats.forEach((stat) => {
    $("stats").append(el("div", null, el("dt", { text: stat.label }), el("dd", { text: stat.value })));
  });

  content.projects.forEach((project) => {
    const links = [];
    if (webUrl(project.url)) links.push(el("a", { href: project.url, target: "_blank", rel: "noopener", text: "Visit project" }));
    if (webUrl(project.repo)) links.push(el("a", { href: project.repo, target: "_blank", rel: "noopener", text: "View code" }));
    const picture = imageUrl(project.image) ? el("img", { src: project.image, alt: `${project.title} screenshot`, loading: "lazy" }) : null;
    $("project-list").append(
      el("details", { class: "project" },
        el("summary", null,
          el("span", { class: "p-year", text: project.year || "" }),
          el("div", null, el("h3", { class: "p-title", text: project.title }), el("p", { class: "p-summary", text: project.summary })),
          el("span", { class: "p-tags", text: (project.tags || []).join(", ") })
        ),
        el("div", { class: "p-body" },
          el("div", null, el("p", { class: "p-details", text: project.details }), links.length ? el("div", { class: "p-links" }, links) : null),
          picture
        )
      )
    );
  });

  /* ---------- Course portfolio: one expandable row per module ---------- */
  const course = content.course;
  if (course && Array.isArray(course.modules) && course.modules.length) {
    $("course-code").textContent = `${course.code} course portfolio`;
    $("course-title").textContent = course.title;
    $("course-intro").textContent = course.intro || "";
    if (webUrl(course.canva)) { $("course-canva").href = course.canva; $("course-canva").hidden = false; }

    const linkRow = (links) => {
      const good = (links || []).filter((link) => webUrl(link.url));
      return good.length ? el("div", { class: "m-links" }, good.map((link) => el("a", { href: link.url, target: "_blank", rel: "noopener", text: link.label }))) : null;
    };
    const block = (label, ...kids) => el("div", { class: "m-block" }, el("h4", { class: "m-label", text: label }), kids);

    course.modules.forEach((mod, index) => {
      const number = String(index + 1).padStart(2, "0");
      const parts = [];

      if (mod.learned && mod.learned.length) {
        parts.push(block("Key learnings", el("ul", { class: "m-learned" }, mod.learned.map((item) => el("li", { text: item })))));
      }

      if (mod.activities && mod.activities.length) {
        parts.push(block("Activities", el("div", { class: "m-acts" }, mod.activities.map((act) =>
          el("article", { class: "m-act" },
            el("p", { class: "m-kind", text: act.kind }),
            el("h5", { text: act.title }),
            el("p", { class: "m-text", text: act.text }),
            imageUrl(act.image) ? el("img", { src: act.image, alt: `${act.title} screenshot`, loading: "lazy" }) : null,
            linkRow(act.links)
          )
        ))));
      }

      const pr = mod.prompt;
      if (pr) {
        const side = (cls, label, text, result) => el("div", { class: `m-prompt ${cls}` },
          el("p", { class: "m-kind", text: label }),
          el("blockquote", { text }),
          result ? el("p", { class: "m-result", text: result }) : null
        );
        const changes = (pr.changes || []).length
          ? el("dl", { class: "m-changes" }, pr.changes.map((c) => el("div", null, el("dt", { text: c.label }), el("dd", { text: c.text }))))
          : null;
        parts.push(block("Old vs new prompt",
          pr.source ? el("p", { class: "m-source", text: pr.source }) : null,
          el("div", { class: "m-compare" },
            side("is-old", pr.oldLabel || "Old prompt", pr.old, pr.oldResult),
            side("is-new", pr.newLabel || "New prompt", pr.new, pr.newResult)
          ),
          changes,
          pr.why ? el("p", { class: "m-why", text: pr.why }) : null
        ));
      }

      if (mod.reflection) parts.push(block("Reflection", el("p", { class: "m-reflect", text: mod.reflection })));

      const count = (mod.activities || []).length;
      $("module-list").append(
        el("details", { class: "module" },
          el("summary", null,
            el("span", { class: "m-num", text: number }),
            el("h3", { class: "m-title", text: mod.title }),
            el("span", { class: "m-count", text: `${count} ${count === 1 ? "activity" : "activities"}${pr ? " · prompt" : ""}` })
          ),
          el("div", { class: "m-body" }, parts)
        )
      );
    });
  } else {
    $("course").hidden = true;
  }

  content.journey.forEach((step) => {
    $("journey").append(
      el("li", null,
        el("div", { class: "j-year", text: step.year }),
        el("div", { class: "j-text" }, el("h3", { text: step.title }), el("p", { class: "j-place", text: step.place }), el("p", { text: step.text }))
      )
    );
  });

  content.skills.forEach((skill) => {
    $("skill-list").append(el("div", { class: "skill" }, el("h3", { text: skill.title }), el("p", { text: skill.text })));
  });

  const contact = content.contact;
  $("contact-heading").textContent = contact.heading;
  $("contact-text").textContent = contact.text;
  if (/^[\w .-]+\.pdf$/i.test(contact.cv || "")) $("contact-actions").append(el("a", { class: "pill pill-dark", href: encodeURI(contact.cv), download: "", text: "Download CV" }));
  if (contact.email) $("contact-actions").append(el("a", { class: "pill pill-line", href: `mailto:${contact.email}`, text: contact.email }));
  if (webUrl(contact.github)) $("contact-actions").append(el("a", { class: "pill pill-line", href: contact.github, target: "_blank", rel: "noopener", text: "GitHub" }));
  if (webUrl(contact.linkedin)) $("contact-actions").append(el("a", { class: "pill pill-line", href: contact.linkedin, target: "_blank", rel: "noopener", text: "LinkedIn" }));

  $("menu-btn").addEventListener("click", () => {
    const open = $("site-nav").classList.toggle("open");
    $("menu-btn").setAttribute("aria-expanded", String(open));
  });
  $("site-nav").addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      $("site-nav").classList.remove("open");
      $("menu-btn").setAttribute("aria-expanded", "false");
    }
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Bit, the mascot: wanders the page, stops now and then, says hi ---------- */
  (function roamer() {
    const say = el("span", { class: "roamer-say" });
    const body = el("span", { class: "bit roamer-body", "data-bit": "" });
    const bit = el("div", { class: "roamer", title: "Bit" }, say, body);
    document.body.append(bit);

    const lines = [
      "Hi, I'm Bit!",
      "Daniel built Athena AI. It's under Projects.",
      "All 8 PDC60 modules are in the course section.",
      "Daniel's CV is down in Contact.",
      "Just stretching my legs.",
      "Looking for a front-end or QA intern?",
    ];
    const SIZE = 56;
    let x = 24, y = window.innerHeight - SIZE - 24;
    let tx = x, ty = y, pauseUntil = performance.now() + 1200, last = performance.now(), sayTimer;

    function speak(text, ms = 2600) {
      say.textContent = text;
      bit.classList.add("talking");
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => bit.classList.remove("talking"), ms);
    }
    function bounds() {
      return { minX: 8, maxX: window.innerWidth - SIZE - 8, minY: 84, maxY: window.innerHeight - SIZE - 12 };
    }
    function pickTarget() {
      const b = bounds();
      tx = b.minX + Math.random() * Math.max(0, b.maxX - b.minX);
      ty = b.minY + Math.random() * Math.max(0, b.maxY - b.minY);
    }
    function place() {
      bit.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      bit.classList.toggle("say-left", x > window.innerWidth - 240);
    }

    body.addEventListener("click", () => {
      bit.classList.remove("hop");
      void bit.offsetWidth;
      bit.classList.add("hop");
      speak(Math.random() < 0.4 ? "Boop!" : lines[Math.floor(Math.random() * lines.length)]);
    });
    window.addEventListener("resize", () => {
      const b = bounds();
      x = Math.min(Math.max(x, b.minX), b.maxX);
      y = Math.min(Math.max(y, b.minY), b.maxY);
      place();
    });

    place();
    setTimeout(() => speak(lines[0]), 900);
    if (reduceMotion) return;

    function step(now) {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      if (now >= pauseUntil) {
        const dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy);
        if (dist < 2) {
          bit.classList.remove("walking");
          pauseUntil = now + 1500 + Math.random() * 3500;
          pickTarget();
          if (Math.random() < 0.35) speak(lines[1 + Math.floor(Math.random() * (lines.length - 1))]);
        } else {
          const move = Math.min(dist, 95 * dt);
          x += (dx / dist) * move;
          y += (dy / dist) * move;
          bit.classList.add("walking");
          bit.classList.toggle("face-left", dx < 0);
          place();
        }
      }
      requestAnimationFrame(step);
    }
    pickTarget();
    requestAnimationFrame(step);
  })();

  /* ---------- Bit, the mascot: a small block whose eyes watch the pointer ---------- */
  const BIT_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true">
    <rect x="12" y="35" width="5" height="5" fill="#ff00df"/><rect x="23" y="35" width="5" height="5" fill="#ff00df"/>
    <rect class="bit-fill" x="2" y="4" width="36" height="31" fill="#ff00df"/>
    <rect x="9" y="11" width="10" height="11" fill="#fff"/><rect x="22" y="11" width="10" height="11" fill="#fff"/>
    <rect class="pupil" x="12" y="14" width="5" height="5" fill="#06070d"/><rect class="pupil" x="25" y="14" width="5" height="5" fill="#06070d"/>
    <rect class="lid" x="9" y="11" width="10" height="11" fill="#ff00df"/><rect class="lid" x="22" y="11" width="10" height="11" fill="#ff00df"/>
    <rect x="16" y="27" width="9" height="2" fill="#06070d"/>
  </svg>`;
  document.querySelectorAll("[data-bit]").forEach((bit) => { bit.innerHTML = BIT_SVG; });

  if (!reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      document.querySelectorAll("[data-bit]").forEach((bit) => {
        const box = bit.getBoundingClientRect();
        if (!box.width) return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const reach = Math.hypot(dx, dy) || 1;
        const move = `translate(${(dx / reach * 2.4).toFixed(2)}px, ${(dy / reach * 2.4).toFixed(2)}px)`;
        bit.querySelectorAll(".pupil").forEach((pupil) => { pupil.style.transform = move; });
      });
    }, { passive: true });
  }

  /* ---------- Hero grid: cells light up behind the pointer and fade ---------- */
  (function heroGrid() {
    const canvas = $("hero-grid");
    const hero = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const CELL = 76;
    // Fixed starting pattern, so the grid has character before anyone touches it.
    const RESTING = [[2, 1], [3, 1], [13, 0], [17, 3], [18, 3], [18, 4], [1, 6], [10, 7], [21, 1]];
    const lit = new Map();
    let width = 0, height = 0, running = false;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,.075)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += CELL) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, height); }
      for (let y = 0; y <= height; y += CELL) { ctx.moveTo(0, y + .5); ctx.lineTo(width, y + .5); }
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.05)";
      RESTING.forEach(([col, row]) => ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1));
      lit.forEach((alpha, key) => {
        const [col, row] = key.split(",").map(Number);
        ctx.fillStyle = `rgba(255,0,223,${alpha.toFixed(3)})`;
        ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
      });
    }

    function tick() {
      lit.forEach((alpha, key) => {
        const next = alpha - 0.018;
        if (next <= 0) lit.delete(key); else lit.set(key, next);
      });
      draw();
      if (lit.size) requestAnimationFrame(tick); else running = false;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    new ResizeObserver(resize).observe(hero);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

    if (!reduceMotion) {
      hero.addEventListener("pointermove", (event) => {
        const box = canvas.getBoundingClientRect();
        lit.set(`${Math.floor((event.clientX - box.left) / CELL)},${Math.floor((event.clientY - box.top) / CELL)}`, 0.85);
        if (!running) { running = true; requestAnimationFrame(tick); }
      }, { passive: true });
    }
  })();
})();

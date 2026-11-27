/** Site behaviour: menu, nav state, reveals, LED strip controls. */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Automated browsers (screenshots, audits) get the settled page: no scroll-gated states, no lazy gaps.
const settled = navigator.webdriver === true;
if (settled) document.documentElement.classList.add('settled');
if (settled) document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));

// Mobile menu: a root panel plus one drill-down panel per section with sub-pages. Panels animate their items in and out
// (data-anim, see global.css); the menu itself also animates out before it is hidden.
const toggle = document.querySelector<HTMLButtonElement>('.nav__toggle');
const menu = document.getElementById('mobile-menu');
if (toggle && menu) {
  const navEl = document.querySelector('[data-nav]');
  const panels = [...menu.querySelectorAll<HTMLElement>('[data-panel]')];
  const root = panels.find((p) => p.dataset.panel === 'root')!;
  const OUT_MS = reduce ? 0 : 260;
  let current = root;
  let timer = 0;

  const show = (panel: HTMLElement, anim: string) => { panel.hidden = false; panel.dataset.anim = anim; };
  // Animate `from` out and `to` in. The leaving panel is hidden once its items have left.
  const go = (to: HTMLElement, dir: 'fwd' | 'back') => {
    if (to === current) return;
    const from = current;
    current = to;
    from.dataset.anim = `out-${dir}`;
    from.inert = true;
    to.inert = false;
    show(to, dir);
    window.setTimeout(() => { if (current !== from) { from.hidden = true; from.removeAttribute('data-anim'); } }, OUT_MS);
  };
  const reset = () => {
    panels.forEach((p) => { p.hidden = p !== root; p.inert = false; p.removeAttribute('data-anim'); });
    menu.querySelectorAll('[data-open-panel]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    current = root;
  };

  const set = (open: boolean) => {
    window.clearTimeout(timer);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', (open ? toggle.dataset.close : toggle.dataset.open) ?? '');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      reset();
      menu.removeAttribute('data-closing');
      menu.hidden = false;
      show(root, 'open');
      navEl?.toggleAttribute('data-menu', true);
    } else if (!menu.hidden) {
      menu.setAttribute('data-closing', '');
      timer = window.setTimeout(() => {
        menu.hidden = true;
        menu.removeAttribute('data-closing');
        navEl?.toggleAttribute('data-menu', false);
        reset();
      }, OUT_MS);
    }
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || menu.hidden) return;
    if (current !== root) { current.querySelector<HTMLElement>('[data-back]')?.click(); return; }
    set(false); toggle.focus();
  });
  menu.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const opener = el.closest<HTMLButtonElement>('[data-open-panel]');
    if (opener) {
      const panel = panels.find((p) => p.dataset.panel === opener.dataset.openPanel)!;
      opener.setAttribute('aria-expanded', 'true');
      go(panel, 'fwd');
      panel.querySelector<HTMLElement>('[data-back]')?.focus({ preventScroll: true });
      menu.scrollTop = 0;
      return;
    }
    if (el.closest('[data-back]')) {
      const id = current.dataset.panel;
      go(root, 'back');
      const back = menu.querySelector<HTMLElement>(`[data-open-panel="${id}"]`);
      back?.setAttribute('aria-expanded', 'false');
      back?.focus({ preventScroll: true });
      return;
    }
    if (el.closest('a')) set(false);
  });
  window.matchMedia('(min-width: 1181px)').addEventListener('change', (m) => m.matches && set(false));
}

// Nav border once the page scrolls
const nav = document.querySelector<HTMLElement>('[data-nav]');

let ticking = false;
const onScroll = () => {
  nav?.toggleAttribute('data-scrolled', window.scrollY > 8);
  ticking = false;
};
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// Heading reveals
const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window && !reduce && !settled) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

// Marquees (LED strips, sponsor board): one shared rAF loop, only for those in view.
// Constant auto-scroll + nudged by page scroll + draggable (mouse and touch). Reduced motion: calmer, no scroll coupling.
{
  type M = { el: HTMLElement; run: HTMLElement; unit: number; off: number; speed: number; vel: number; drag: boolean; hover: boolean; seen: boolean };
  const AUTO = reduce ? 18 : 42;   // px per second
  const all: M[] = [];
  const live = new Set<M>();
  let raf = 0, last = 0, lastY = window.scrollY, pending = 0;

  const measure = (m: M) => {
    const first = m.run.firstElementChild as HTMLElement | null;
    if (!first) return;
    m.unit = first.getBoundingClientRect().width;
    if (!m.unit) return;
    const need = m.el.clientWidth + m.unit;
    while (m.run.scrollWidth < need + m.unit && m.run.children.length < 24) {   // keep the loop seamless on wide screens
      const c = first.cloneNode(true) as HTMLElement;
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
      m.run.append(c);
    }
  };
  const paint = (m: M) => {
    if (m.unit) m.run.style.transform = `translate3d(${-(((m.off % m.unit) + m.unit) % m.unit)}px,0,0)`;
  };
  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    const nudge = reduce ? 0 : pending * 0.2; pending -= nudge;
    live.forEach((m) => {
      if (m.drag) return;
      m.off += (m.hover ? 0 : AUTO * dt) + nudge + m.vel * dt;
      m.vel *= Math.exp(-dt * 3.5);
      if (Math.abs(m.vel) < 4) m.vel = 0;
      paint(m);
    });
    raf = live.size ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => { if (!raf && live.size) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((el) => {
    const run = el.querySelector<HTMLElement>('[data-marquee-run]');
    if (!run) return;
    const m: M = { el, run, unit: 0, off: 0, vel: 0, drag: false, hover: false, seen: false };
    all.push(m);
    measure(m);

    // drag: capture the pointer only once it really moves, so plain clicks on links still work
    let id = -1, x0 = 0, lx = 0, lt = 0, moved = false, v = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; x0 = lx = e.clientX; lt = e.timeStamp; moved = false; v = 0; m.vel = 0;
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      if (!moved) {
        if (Math.abs(e.clientX - x0) < 6) return;
        moved = true; m.drag = true; el.classList.add('is-dragging');
        try { el.setPointerCapture(id); } catch { /* ignore */ }
      }
      const dx = e.clientX - lx, dts = Math.max(1, e.timeStamp - lt) / 1000;
      m.off -= dx; v = v * 0.6 + (-dx / dts) * 0.4; lx = e.clientX; lt = e.timeStamp;
      paint(m);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      if (moved) {
        m.drag = false; el.classList.remove('is-dragging');
        m.vel = Math.abs(v) > 60 ? Math.max(-2500, Math.min(2500, v)) : 0;
        // the click that follows a drag must not activate a link
        const stop = (c: Event) => { c.preventDefault(); c.stopPropagation(); };
        el.addEventListener('click', stop, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', stop, { capture: true }), 80);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('dragstart', (e) => e.preventDefault());
    // hold still while a mouse rests on it or a link inside has keyboard focus, so logos can be clicked
    if (el.querySelector('a')) {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') m.hover = true; });
      el.addEventListener('pointerleave', () => { m.hover = false; });
      el.addEventListener('focusin', () => { m.hover = true; });
      el.addEventListener('focusout', () => { m.hover = false; });
    }
  });

  if (all.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const m = all.find((a) => a.el === en.target)!;
        if (en.isIntersecting) { if (!m.seen) { m.seen = true; measure(m); } live.add(m); } else live.delete(m);
      });
      wake();
    }, { rootMargin: '80px' });
    all.forEach((m) => io.observe(m.el));
    const ro = new ResizeObserver(() => all.forEach(measure));
    all.forEach((m) => { ro.observe(m.el); if (m.run.firstElementChild) ro.observe(m.run.firstElementChild); });
    window.addEventListener('load', () => all.forEach(measure));
    window.addEventListener('scroll', () => {
      pending += Math.max(-120, Math.min(120, window.scrollY - lastY)) * 1.1; lastY = window.scrollY;
    }, { passive: true });
  }
}

// Filter chips: [data-filter-scope] holds chips [data-filter] and items [data-item]
document.querySelectorAll<HTMLElement>('[data-filter-scope]').forEach((scope) => {
  const chips = scope.querySelectorAll<HTMLButtonElement>('[data-filter]');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const v = chip.dataset.filter ?? '';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    scope.querySelectorAll<HTMLElement>('[data-item]').forEach((it) => { it.hidden = !!v && it.dataset.item !== v; });
  }));
});

// BrickLog filters: AND across facets, OR within topic/project, one season; state lives in ?season=&topic=a,b&project=x
document.querySelectorAll<HTMLElement>('[data-blogfilter]').forEach((root) => {
  const bar = root.querySelector<HTMLElement>('[data-bfilter]');
  if (!bar) return;
  bar.hidden = false;
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-facet]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')];
  const panel = root.querySelector<HTMLElement>('[data-bf-panel]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-bf-toggle]')!;
  const badge = root.querySelector<HTMLElement>('[data-bf-badge]')!;
  const count = root.querySelector<HTMLElement>('[data-bf-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-bf-empty]')!;
  const clears = root.querySelectorAll<HTMLElement>('[data-bf-clear]');
  const facets = ['season', 'topic', 'project'];
  const sel: Record<string, Set<string>> = { season: new Set(), topic: new Set(), project: new Set() };
  const valid = (f: string) => new Set(chips.filter((c) => c.dataset.facet === f).map((c) => c.dataset.value!));
  const q = new URLSearchParams(location.search);
  facets.forEach((f) => {
    const ok = valid(f);
    (q.get(f) ?? '').split(',').filter((v) => ok.has(v)).slice(0, f === 'season' ? 1 : 99).forEach((v) => sel[f].add(v));
  });
  const attr: Record<string, string> = { season: 'season', topic: 'topics', project: 'projects' };
  const mql = matchMedia('(max-width: 720px)');
  const setOpen = (open: boolean) => { toggle.setAttribute('aria-expanded', String(open)); if (open) panel.removeAttribute('data-collapsed'); else panel.setAttribute('data-collapsed', ''); };
  const apply = () => {
    let n = 0;
    items.forEach((it) => {
      const show = facets.every((f) => !sel[f].size || (it.dataset[attr[f]] ?? '').split(' ').some((v) => sel[f].has(v)));
      it.hidden = !show; if (show) n++;
    });
    chips.forEach((c) => c.setAttribute('aria-pressed', String(sel[c.dataset.facet!].has(c.dataset.value!))));
    const active = facets.reduce((a, f) => a + sel[f].size, 0);
    badge.textContent = String(active); badge.hidden = !active;
    bar.querySelector<HTMLElement>('[data-bf-clear]')!.hidden = !active;
    count.textContent = n === 0 ? root.dataset.none! : n === 1 ? root.dataset.one! : root.dataset.many!.replace('{n}', String(n));
    empty.hidden = n !== 0;
    const next = new URLSearchParams();
    facets.forEach((f) => { if (sel[f].size) next.set(f, [...sel[f]].join(',')); });
    const qs = next.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.facet!, v = c.dataset.value!;
    if (sel[f].has(v)) sel[f].delete(v);
    else { if (c.dataset.multi !== '1') sel[f].clear(); sel[f].add(v); }
    apply();
  }));
  clears.forEach((b) => b.addEventListener('click', () => { facets.forEach((f) => sel[f].clear()); apply(); }));
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  setOpen(!mql.matches || facets.some((f) => sel[f].size > 0));
  mql.addEventListener('change', () => setOpen(!mql.matches));
  apply();
});

// Copy buttons (IBAN, press descriptions)
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy ?? ''); } catch { return; }
    btn.textContent = btn.dataset.copied ?? label;
    const status = btn.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
    if (status) status.textContent = btn.dataset.copied ?? '';
    setTimeout(() => { btn.textContent = label; if (status) status.textContent = ''; }, 2200);
  });
});

// Lightbox: any <button data-lightbox> wrapping an <img> opens it full and uncropped.
// Triggers inside the same [data-lightbox-group] are stepped through with the arrows; others stand alone.
const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
if (dialog) {
  const media = dialog.querySelector<HTMLElement>('[data-lightbox-media]')!;
  const cap = dialog.querySelector<HTMLElement>('[data-lightbox-cap]')!;
  const steps = dialog.querySelectorAll<HTMLButtonElement>('[data-lightbox-step]');
  // images inside post bodies (rendered from rich text) get the same button
  document.querySelectorAll<HTMLImageElement>('.prose img').forEach((img) => {
    if (img.closest('a, button')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'zoom zoom--inline'; b.dataset.lightbox = '';
    b.setAttribute('aria-label', `${document.documentElement.lang === 'ro' ? 'Mărește fotografia' : 'Enlarge photo'}${img.alt ? `: ${img.alt}` : ''}`);
    img.replaceWith(b); b.append(img);
  });
  let list: HTMLButtonElement[] = [];
  let at = 0;
  let opener: HTMLElement | null = null;
  // How the lightbox was last driven: focus goes back to the photo on close, but only shows its ring for keyboard users.
  let byKeyboard = false;
  dialog.addEventListener('keydown', () => { byKeyboard = true; });
  dialog.addEventListener('pointerdown', () => { byKeyboard = false; });
  const groupOf = (b: HTMLButtonElement) => {
    const g = b.closest('[data-lightbox-group]');
    return g ? [...g.querySelectorAll<HTMLButtonElement>('[data-lightbox]')].filter((x) => !x.closest('[hidden]')) : [b];
  };
  const show = (i: number) => {
    at = (i + list.length) % list.length;
    const trigger = list[at];
    const src = trigger.querySelector('img')!;
    const img = document.createElement('img');
    img.src = src.dataset.full || src.currentSrc || src.src; img.alt = src.alt;
    media.replaceChildren(img);
    cap.textContent = trigger.closest('figure')?.querySelector('figcaption')?.textContent ?? '';
    steps.forEach((s) => (s.hidden = list.length < 2));
  };
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-lightbox]');
    if (!b || !b.querySelector('img')) return;
    opener = b; list = groupOf(b); show(list.indexOf(b));
    byKeyboard = e.detail === 0; // a click with no pointer behind it came from Enter or Space
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  });
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  steps.forEach((b) => b.addEventListener('click', () => show(at + Number(b.dataset.lightboxStep))));
  dialog.addEventListener('keydown', (e) => {
    if (list.length < 2) return;
    if (e.key === 'ArrowRight') show(at + 1);
    if (e.key === 'ArrowLeft') show(at - 1);
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    media.replaceChildren();
    const back = list[at] ?? opener;
    if (!back) return;
    // After a pointer close, return focus without the keyboard ring. `focusVisible` covers current browsers;
    // data-quiet hides the ring where the option is ignored, until the next key press.
    if (!byKeyboard) back.setAttribute('data-quiet', '');
    back.focus({ preventScroll: false, focusVisible: byKeyboard } as FocusOptions);
  });
  document.addEventListener('keydown', () => document.querySelectorAll('[data-quiet]').forEach((el) => el.removeAttribute('data-quiet')));
  document.addEventListener('focusout', (e) => (e.target as HTMLElement).removeAttribute?.('data-quiet'));
}

// Countdown to the next event (days), refreshed on the client so a cached build stays right
document.querySelectorAll<HTMLElement>('[data-countdown]').forEach((el) => {
  const days = Math.max(0, Math.round((new Date(el.dataset.countdown + 'T00:00:00').getTime() - Date.now()) / 86400000));
  const ro = el.dataset.locale === 'ro';
  el.textContent = days === 0 ? (ro ? 'azi' : 'today') : days === 1 ? (ro ? 'mâine' : 'tomorrow') : ro ? `peste ${days} zile` : `in ${days} days`;
});

// Contact form: preselect ?dept=, validate, send to the Edge Function (nothing is stored, CLAUDE.md §3.9)
const form = document.querySelector<HTMLFormElement>('[data-contact]');
if (form) {
  const dept = new URLSearchParams(location.search).get('dept');
  const select = form.querySelector<HTMLSelectElement>('[data-dept]');
  if (dept && select && [...select.options].some((o) => o.value === dept)) select.value = dept;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const d = form.dataset;
  const mail = `<a href="mailto:${d.email}">${d.email}</a>`;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { status.textContent = d.msgInvalid ?? ''; status.dataset.state = 'error'; form.reportValidity(); return; }
    if (!d.endpoint) { status.innerHTML = `${d.msgOff} ${mail}.`; status.dataset.state = 'error'; return; }
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const label = btn.innerHTML; btn.disabled = true; btn.textContent = d.msgSending ?? '';
    status.textContent = ''; delete status.dataset.state;
    try {
      const res = await fetch(d.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, token: data['cf-turnstile-response'] }) });
      if (!res.ok) throw new Error(String(res.status));
      form.reset(); status.textContent = d.msgOk ?? ''; status.dataset.state = 'ok';
    } catch {
      status.innerHTML = `${d.msgErr} ${mail}.`; status.dataset.state = 'error';
    } finally {
      btn.disabled = false; btn.innerHTML = label;
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
    }
  });
}

// Motion is optional and can be reduced independently of the operating system.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.querySelector('.motion-toggle');
const ownedAnimations = new Set();
let reduceMotion = motionPreference.matches;
let manualReduction = false;
try { manualReduction = sessionStorage.getItem('parlour-reduce-motion') === 'true'; } catch { /* Storage is optional. */ }
const motionSubscribers = new Set();
const updateMotionPreference = () => {
  reduceMotion = motionPreference.matches || manualReduction;
  document.documentElement.classList.toggle('motion-reduced', reduceMotion);
  if (motionToggle) {
    motionToggle.hidden = false;
    motionToggle.disabled = motionPreference.matches;
    motionToggle.setAttribute('aria-pressed', String(reduceMotion));
    motionToggle.textContent = motionPreference.matches ? 'Reduced motion (system)' : 'Reduce motion';
  }
  if (reduceMotion) ownedAnimations.forEach((animation) => animation.finish());
  motionSubscribers.forEach((callback) => callback());
};
const animateElement = (element, frames, options) => {
  if (reduceMotion || !element?.animate) return null;
  const animation = element.animate(frames, options);
  ownedAnimations.add(animation);
  animation.finished.then(() => ownedAnimations.delete(animation), () => ownedAnimations.delete(animation));
  return animation;
};
motionToggle?.addEventListener('click', () => {
  manualReduction = !manualReduction;
  try { sessionStorage.setItem('parlour-reduce-motion', String(manualReduction)); } catch { /* No persistence required. */ }
  updateMotionPreference();
});
motionPreference.addEventListener('change', updateMotionPreference);
updateMotionPreference();

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
const navLinks = [...document.querySelectorAll('.primary-nav a')];
const mobileNavigation = window.matchMedia('(max-width: 900px)');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
};

const setMenu = (open) => {
  if (!menuButton || !navigation) return;

  const shouldOpen = mobileNavigation.matches && open;
  menuButton.setAttribute('aria-expanded', String(shouldOpen));
  navigation.classList.toggle('is-open', shouldOpen);

  if (mobileNavigation.matches && !shouldOpen) {
    navigation.setAttribute('inert', '');
  } else {
    navigation.removeAttribute('inert');
  }
};

updateHeader();
setMenu(false);

window.addEventListener('scroll', updateHeader, { passive: true });
mobileNavigation.addEventListener('change', () => setMenu(false));

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !navigation?.classList.contains('is-open')) return;
  setMenu(false);
  menuButton?.focus();
});

document.documentElement.classList.add('js');
requestAnimationFrame(() => {
  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
});

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (typeof IntersectionObserver === 'function') {
  const visibleSections = new Map();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.set(entry.target, entry);
      else visibleSections.delete(entry.target);
    });
    const current = [...visibleSections.values()].sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${current?.target.id}`;
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {
    rootMargin: '-20% 0px -65% 0px',
    threshold: [0, .2, .5]
  });

  sections.forEach((section) => sectionObserver.observe(section));
  const heroSection = document.querySelector('.hero');
  if (heroSection) sectionObserver.observe(heroSection);
}

const workItems = [...document.querySelectorAll('.work-item')];

// Keep <details> as the source of truth; enhance its native summary activation.
const workTransitions = new Map();
const motionTokens = getComputedStyle(document.documentElement);
const motionTiming = {
  state: parseFloat(motionTokens.getPropertyValue('--duration-state')) || 240,
  reveal: parseFloat(motionTokens.getPropertyValue('--duration-reveal')) || 480,
  ease: motionTokens.getPropertyValue('--ease').trim() || 'ease-out'
};
const setWorkOpen = (item, open, animate = true) => {
  const previous = workTransitions.get(item);
  const from = item.getBoundingClientRect().height;
  if (previous) {
    previous.animation.onfinish = null;
    previous.animation.cancel();
    workTransitions.delete(item);
  }
  item.style.height = '';
  item.style.overflow = '';
  if (reduceMotion || !item.animate || !animate) {
    item.open = open;
    return;
  }
  if (!item.open && !open) return;
  item.open = true;
  const to = open ? item.getBoundingClientRect().height : item.querySelector('summary').getBoundingClientRect().height + 1;
  item.style.overflow = 'clip';
  const animation = animateElement(item, [{ height: `${from}px` }, { height: `${to}px` }], {
    duration: motionTiming.state, easing: motionTiming.ease
  });
  workTransitions.set(item, { animation, open });
  animation.onfinish = () => {
    item.open = open;
    item.style.height = '';
    item.style.overflow = '';
    workTransitions.delete(item);
  };
  if (open) item.querySelectorAll('.work-details > div').forEach((step, index) => {
    animateElement(step, [{ opacity: .65, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: motionTiming.state, delay: index * 45, easing: motionTiming.ease
    });
  });
};
workItems.forEach((item) => {
  item.querySelector('summary').addEventListener('click', (event) => {
    if (reduceMotion || !item.animate) return; // Native keyboard and click fallback.
    event.preventDefault();
    const open = !(workTransitions.get(item)?.open ?? item.open);
    if (open) workItems.forEach((other) => { if (other !== item && other.open) setWorkOpen(other, false); });
    setWorkOpen(item, open);
  });
  item.addEventListener('toggle', () => {
    if (!item.open || workTransitions.get(item)?.open === false) return;
    workItems.forEach((other) => {
      if (other !== item && other.open && workTransitions.get(other)?.open !== false) setWorkOpen(other, false);
    });
  });
});
// Evidence links also work as deep links from another page or a shared URL.
const openLinkedWork = () => {
  const item = workItems.find((entry) => `#${entry.id}` === location.hash);
  if (!item) return;
  workItems.forEach((other) => setWorkOpen(other, other === item, false));
};
document.querySelectorAll('a[href^="#work-"]').forEach((link) => {
  link.addEventListener('click', () => {
    const item = document.getElementById(link.hash.slice(1));
    if (item) workItems.forEach((other) => setWorkOpen(other, other === item, false));
  });
});
window.addEventListener('hashchange', openLinkedWork);
openLinkedWork();

const contentLists = [
  { url: 'assets/data/skills.json', key: 'groups', target: '#skills-list', grouped: true },
  { url: 'assets/data/interests.json', key: 'interests', target: '#interests-list' }
];

const loadContentList = async ({ url, key, target, grouped = false }) => {
  const list = document.querySelector(target);
  if (!list) return;

  const status = document.createElement(grouped ? 'p' : 'li');
  status.className = 'loading-item';
  status.textContent = 'Loading…';
  list.replaceChildren(status);
  list.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);

    const data = await response.json();
    if (grouped) {
      const groups = Array.isArray(data[key])
        ? data[key].map((group) => ({
          title: typeof group?.title === 'string' ? group.title.trim() : '',
          skills: Array.isArray(group?.skills)
            ? [...new Set(group.skills.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
            : []
        })).filter((group) => group.title && group.skills.length)
        : [];

      if (!groups.length) throw new Error(`${url}: no ${key} found`);

      const fragment = document.createDocumentFragment();
      groups.forEach(({ title, skills }) => {
        const group = document.createElement('section');
        group.className = 'skill-group';

        const heading = document.createElement('h3');
        heading.textContent = title;

        const skillList = document.createElement('ul');
        skillList.className = 'inline-list skills-list';
        skills.forEach((value) => {
          const item = document.createElement('li');
          item.textContent = value;
          skillList.append(item);
        });

        group.append(heading, skillList);
        fragment.append(group);
      });

      list.replaceChildren(fragment);
      return;
    }

    const values = Array.isArray(data[key])
      ? [...new Set(data[key].filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
      : [];

    if (!values.length) throw new Error(`${url}: no ${key} found`);

    const fragment = document.createDocumentFragment();
    values.forEach((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      fragment.append(item);
    });

    list.replaceChildren(fragment);
  } catch (error) {
    console.error(`Unable to load ${url}`, error);
    const item = document.createElement(grouped ? 'p' : 'li');
    item.className = 'loading-item';
    item.textContent = 'Content unavailable. Please try refreshing the page.';
    list.replaceChildren(item);
  } finally {
    list.removeAttribute('aria-busy');
  }
};

Promise.all(contentLists.map(loadContentList));

const contactForm = document.querySelector('#contactForm');
const formStatus = document.querySelector('#formStatus');
const contactSubmit = contactForm?.querySelector('[type="submit"]');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  if (formData.get('company')) return;

  formStatus.textContent = 'Sending...';
  formStatus.className = 'form-status';
  contactForm.classList.add('is-sending');
  contactForm.setAttribute('aria-busy', 'true');
  if (contactSubmit) contactSubmit.disabled = true;

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData
    });

    if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);

    contactForm.reset();
    formStatus.textContent = 'Thanks, your message has been sent.';
    formStatus.classList.add('success');
  } catch (error) {
    console.error('Unable to send contact form', error);
    formStatus.textContent = 'Something went wrong. Email davis@parlour.cv instead.';
    formStatus.classList.add('error');
  } finally {
    contactForm.classList.remove('is-sending');
    contactForm.removeAttribute('aria-busy');
    if (contactSubmit) contactSubmit.disabled = false;
  }
});

const profileTabs = [...document.querySelectorAll('[data-profile-tab]')];
const profilePanels = [...document.querySelectorAll('[data-profile-panel]')];

const selectProfileTab = (tab, moveFocus = false) => {
  if (!tab) return;

  const selected = tab.dataset.profileTab;

  profileTabs.forEach((button) => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });

  profilePanels.forEach((panel) => {
    panel.hidden = panel.dataset.profilePanel !== selected;
  });

  if (moveFocus) tab.focus();
};

profileTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectProfileTab(tab));

  tab.addEventListener('keydown', (event) => {
    let nextIndex;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % profileTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + profileTabs.length) % profileTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = profileTabs.length - 1;
    else return;

    event.preventDefault();
    selectProfileTab(profileTabs[nextIndex], true);
  });
});

selectProfileTab(profileTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || profileTabs[0]);

const dialog = document.querySelector('[data-site-dialog]');
const dialogContent = document.querySelector('[data-dialog-content]');
const dialogClose = document.querySelector('[data-dialog-close]');
let dialogOpener = null;
let releaseNotesPromise = null;
const releaseNotesUrl = 'assets/data/release-notes.json?v=20260915-1';

const getReleaseNotes = () => {
  if (releaseNotesPromise) return releaseNotesPromise;

  releaseNotesPromise = fetch(releaseNotesUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`${releaseNotesUrl}: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const releases = Array.isArray(data.releases)
        ? data.releases.map((release) => ({
          version: typeof release?.version === 'string' ? release.version.trim() : '',
          changes: Array.isArray(release?.changes)
            ? release.changes.filter((change) => typeof change === 'string').map((change) => change.trim()).filter(Boolean)
            : []
        })).filter((release) => release.version && release.changes.length)
        : [];

      if (!releases.length) throw new Error(`${releaseNotesUrl}: no releases found`);
      return releases;
    })
    .catch((error) => {
      releaseNotesPromise = null;
      throw error;
    });

  return releaseNotesPromise;
};

const renderReleaseNotes = async (container) => {
  try {
    const releases = await getReleaseNotes();
    if (!container.isConnected) return;

    const fragment = document.createDocumentFragment();
    releases.forEach(({ version, changes }) => {
      const entry = document.createElement('article');
      entry.className = 'release-entry';

      const heading = document.createElement('h3');
      heading.textContent = version;

      const list = document.createElement('ul');
      changes.forEach((change) => {
        const item = document.createElement('li');
        item.textContent = change;
        list.append(item);
      });

      entry.append(heading, list);
      fragment.append(entry);
    });

    container.replaceChildren(fragment);
  } catch (error) {
    console.error(`Unable to load ${releaseNotesUrl}`, error);
    if (!container.isConnected) return;

    const status = document.createElement('p');
    status.className = 'release-status';
    status.textContent = 'Release notes unavailable.';
    container.replaceChildren(status);
  }
};

const openDialog = (name, opener) => {
  const template = document.querySelector(`#dialog-${name}`);
  if (!dialog || !dialogContent || !template) return;

  dialogOpener = opener;
  dialogContent.replaceChildren(template.content.cloneNode(true));
  dialog.classList.toggle('assistant-dialog', name === 'ai-assistant');
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialogClose?.focus({ preventScroll: true });

  if (name === 'releases') {
    const releaseList = dialogContent.querySelector('[data-release-list]');
    if (releaseList) renderReleaseNotes(releaseList);
  }
};

const closeDialog = () => dialog?.close();

document.querySelectorAll('[data-dialog]').forEach((button) => {
  button.addEventListener('click', () => openDialog(button.dataset.dialog, button));
});

dialogClose?.addEventListener('click', closeDialog);

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});

dialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  dialog.removeAttribute('aria-labelledby');
  dialog.classList.remove('assistant-dialog');
  dialogContent?.replaceChildren();
  dialogOpener?.focus({ preventScroll: true });
  dialogOpener = null;
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// Signature motion: one geometry pass on resize, one batched paint per scroll frame.
// No scroll interception, perpetual animation loop, third-party library or hidden content.
const initSignalMotion = () => {
  const main = document.querySelector('main');
  const trace = document.querySelector('.story-trace');
  const traceBase = trace?.querySelector('.story-trace-base');
  const traceLive = trace?.querySelector('.story-trace-live');
  const traceClip = trace?.querySelector('.story-trace-clip');
  const bridge = document.querySelector('.bridge-figure');
  const bridgeArt = document.querySelector('.bridge-art');
  const scrollCue = document.querySelector('.scroll-cue');
  const plot = document.querySelector('.investigation-plot');
  const plotLines = [...document.querySelectorAll('.plot-line')];
  const plotLine = plotLines[0];
  const plotCursor = document.querySelector('.plot-cursor');
  const headings = [...document.querySelectorAll('.section-heading')];
  if (!main || !trace || !bridge) return;

  let geometry = null;
  let frame = 0;
  let resizeFrame = 0;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const measure = () => {
    const mainRect = main.getBoundingClientRect();
    const bridgeRect = bridge.getBoundingClientRect();
    const signalRect = bridge.querySelector('.bridge-signal').getBoundingClientRect();
    const cueRect = scrollCue?.getBoundingClientRect();
    const heroRect = document.querySelector('.hero').getBoundingClientRect();
    const markers = headings.map((heading) => {
      const rect = heading.firstElementChild.getBoundingClientRect();
      return { heading, x: rect.left + rect.width / 2, y: rect.top - mainRect.top + rect.height / 2 };
    });
    const plotRect = plot?.getBoundingClientRect();
    geometry = {
      top: mainRect.top + window.scrollY,
      height: mainRect.height,
      viewport: window.innerHeight,
      bridgeTop: bridgeRect.top + window.scrollY,
      bridgeHeight: bridgeRect.height,
      plotTop: plotRect ? plotRect.top + window.scrollY : 0,
      plotHeight: plotRect?.height || 1,
      markers
    };
    if (!markers.length) return;
    const x = markers[0].x;
    const startX = cueRect ? cueRect.right - mainRect.left : signalRect.right - mainRect.left;
    const startY = cueRect
      ? cueRect.top - mainRect.top + cueRect.height / 2 - 16
      : signalRect.top - mainRect.top + signalRect.height * (218 / 280);
    const elbowY = heroRect.bottom - mainRect.top - 10;
    let d = `M${startX} ${startY} V${elbowY - 12} L${startX - 12} ${elbowY} H${x + 12} L${x} ${elbowY + 12}`;
    markers.forEach((marker) => { d += ` V${marker.y - 30} L${marker.x} ${marker.y - 18} V${marker.y}`; });
    d += ' v80';
    trace.setAttribute('viewBox', `0 0 ${mainRect.width} ${mainRect.height}`);
    traceBase.setAttribute('d', d);
    traceLive.setAttribute('d', d);
    paint();
  };
  const paint = () => {
    frame = 0;
    if (!geometry) return;
    const { top, height, viewport, markers, bridgeTop, bridgeHeight, plotTop, plotHeight } = geometry;
    const readingY = window.scrollY + viewport * .68 - top;
    traceClip.setAttribute('height', String(reduceMotion ? height : Math.max(0, Math.min(height, readingY))));
    markers.forEach(({ heading, y }) => heading.classList.toggle('is-reached', reduceMotion || readingY >= y));
    if (reduceMotion) {
      bridgeArt.style.transform = '';
      plotLines.forEach((line) => {
        const length = line.getTotalLength();
        line.style.strokeDasharray = `${length} 0`;
        line.style.strokeDashoffset = '0';
      });
      if (plotCursor && plotLine) {
        const endPoint = plotLine.getPointAtLength(plotLine.getTotalLength());
        plotCursor.setAttribute('d', `M${endPoint.x} 0V120`);
      }
      return;
    }
    // Illustration alone moves by at most 16px; reading copy never drifts.
    const bridgeProgress = clamp((window.scrollY + viewport - bridgeTop) / (viewport + bridgeHeight));
    bridgeArt.style.transform = `translateY(${(bridgeProgress - .5) * -16}px)`;
    const plotProgress = clamp((readingY - (plotTop - top)) / (plotHeight * 1.5));
    const traceProgress = .05 + (.95 * plotProgress);
    plotLines.forEach((line) => {
      const length = line.getTotalLength();
      line.style.strokeDasharray = `${length * traceProgress} ${length}`;
      line.style.strokeDashoffset = '0';
    });
    if (plotCursor && plotLine) {
      const point = plotLine.getPointAtLength(plotLine.getTotalLength() * traceProgress);
      plotCursor.setAttribute('d', `M${point.x} 0V120`);
    }
  };
  const schedulePaint = () => { if (!frame) frame = requestAnimationFrame(paint); };
  const scheduleMeasure = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; measure(); });
  };
  plotLines.forEach((plotLine) => { plotLine.style.strokeDasharray = 'none'; });
  window.addEventListener('scroll', schedulePaint, { passive: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleMeasure).observe(main);
  else document.addEventListener('toggle', scheduleMeasure, true);
  document.fonts?.ready.then(scheduleMeasure);
  bridge.querySelector('img')?.addEventListener('load', scheduleMeasure);
  motionSubscribers.add(schedulePaint);
  measure();

  // Entrances begin from readable states and do not delay navigation or content.
  document.querySelectorAll('.hero-kicker, .hero h1 > span, .hero-lede, .hero-note, .hero-actions').forEach((element, index) => {
    animateElement(element, [{ opacity: .8, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
      duration: motionTiming.reveal, delay: index * 45, easing: motionTiming.ease
    });
  });
  animateElement(bridgeArt, [{ clipPath: 'inset(0 12% 0 0)', opacity: .6 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }], {
    duration: 700, easing: motionTiming.ease
  });
  const heroSignal = document.querySelector('.signal-draw');
  if (heroSignal) {
    heroSignal.style.strokeDasharray = '1';
    animateElement(heroSignal, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, easing: motionTiming.ease });
  }
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        animateElement(entry.target, [{ opacity: .78, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
          duration: motionTiming.reveal, delay: index * 45, easing: motionTiming.ease
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: .1 });
    document.querySelectorAll('.section-heading h2, .work-item, .about-principles article').forEach((element) => observer.observe(element));
  }
};
initSignalMotion();

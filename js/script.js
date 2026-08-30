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

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const current = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!current) return;

    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${current.target.id}`;
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {
    rootMargin: '-20% 0px -65% 0px',
    threshold: [0, .2, .5]
  });

  sections.forEach((section) => sectionObserver.observe(section));
}

const workItems = [...document.querySelectorAll('.work-item')];

workItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    workItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const contentLists = [
  { url: 'assets/data/skills.json?v=20260830-2', key: 'groups', target: '#skills-list', grouped: true },
  { url: 'assets/data/interests.json', key: 'interests', target: '#interests-list' }
];

const loadContentList = async ({ url, key, target, grouped = false }) => {
  const list = document.querySelector(target);
  if (!list) return;

  try {
    const response = await fetch(url);
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
    item.textContent = 'Content unavailable.';
    list.replaceChildren(item);
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
const releaseNotesUrl = 'assets/data/release-notes.json';

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
  document.body.classList.add('dialog-open');
  dialog.showModal();
  dialogClose?.focus();

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
  dialogOpener?.focus();
  dialogOpener = null;
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

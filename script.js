const body = document.body;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const setMenu = (open) => {
  menuToggle?.setAttribute('aria-expanded', String(open));
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  mobileMenu?.classList.toggle('is-open', open);
  body.classList.toggle('menu-open', open);
};

menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -7% 0px' });

document.querySelectorAll('.reveal').forEach((element) => {
  if (reducedMotion.matches) element.classList.add('is-visible');
  else revealObserver.observe(element);
});

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const portfolioGrid = document.querySelector('[data-portfolio-grid]');
const projectCards = [...document.querySelectorAll('.project-card')];

const applyFilter = (filter) => {
  const update = () => {
    projectCards.forEach((card) => {
      const isPlaceholder = card.dataset.placeholder === 'true';
      const categoryMatches = filter === 'all' || card.dataset.category === filter;
      const show = categoryMatches && !(filter === 'all' && isPlaceholder);
      card.hidden = !show;
    });

    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    portfolioGrid?.classList.remove('is-filtering');
  };

  if (reducedMotion.matches || !portfolioGrid) {
    update();
    return;
  }

  portfolioGrid.classList.add('is-filtering');
  window.setTimeout(update, 170);
};

filterButtons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.filter || 'all')));

const lightbox = document.querySelector('[data-lightbox-modal]');
const lightboxImage = document.querySelector('[data-lightbox-image]');
const lightboxCaption = document.querySelector('[data-lightbox-caption]');
const lightboxClose = document.querySelector('[data-lightbox-close]');
let lastLightboxTrigger = null;

const closeLightbox = () => {
  lightbox?.classList.remove('is-open');
  lightbox?.setAttribute('aria-hidden', 'true');
  body.classList.remove('modal-open');
  if (lightboxImage) lightboxImage.src = '';
  lastLightboxTrigger?.focus();
};

document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    lastLightboxTrigger = trigger;
    lightboxImage.src = trigger.dataset.lightbox || '';
    lightboxImage.alt = trigger.querySelector('img')?.alt || 'Realizacja Wnętrza BBM';
    if (lightboxCaption) lightboxCaption.textContent = trigger.dataset.caption || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    lightboxClose?.focus();
  });
});

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (lightbox?.classList.contains('is-open')) closeLightbox();
    else if (menuToggle?.getAttribute('aria-expanded') === 'true') setMenu(false);
  }

  if (event.key === 'Tab' && lightbox?.classList.contains('is-open')) {
    event.preventDefault();
    lightboxClose?.focus();
  }
});

const form = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');

const setFormStatus = (message, type = '') => {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle('is-error', type === 'error');
  formStatus.classList.toggle('is-success', type === 'success');
};

const openMailFallback = (data) => {
  const to = form?.dataset.mailto || 'projektowanie@wnetrzabbm.pl';
  const subject = encodeURIComponent('Zapytanie ze strony — Wnętrza BBM');
  const content = encodeURIComponent(
    `Imię i nazwisko: ${data.get('name') || ''}\n` +
    `E-mail: ${data.get('email') || ''}\n` +
    `Telefon: ${data.get('phone') || ''}\n\n` +
    `${data.get('message') || ''}`
  );
  window.location.href = `mailto:${to}?subject=${subject}&body=${content}`;
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  form.classList.add('was-validated');

  if (!form.checkValidity()) {
    setFormStatus('Uzupełnij wymagane pola i sprawdź adres e-mail.', 'error');
    form.reportValidity();
    return;
  }

  const data = new FormData(form);
  if (data.get('_gotcha')) {
    setFormStatus('Dziękuję. Wiadomość została przyjęta.', 'success');
    form.reset();
    return;
  }

  const endpoint = form.getAttribute('action') || '';
  const hasFormspree = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint) && !endpoint.includes('XXXXXXXX');
  const button = form.querySelector('button[type="submit"]');
  button?.setAttribute('disabled', '');

  if (!hasFormspree) {
    setFormStatus('Otwieram wiadomość e-mail…');
    openMailFallback(data);
    button?.removeAttribute('disabled');
    return;
  }

  try {
    setFormStatus('Wysyłam wiadomość…');
    const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Formspree error');
    form.reset();
    form.classList.remove('was-validated');
    setFormStatus('Dziękuję. Wiadomość została wysłana.', 'success');
  } catch (error) {
    setFormStatus('Nie udało się wysłać formularza. Otwieram e-mail jako opcję zapasową.', 'error');
    openMailFallback(data);
  } finally {
    button?.removeAttribute('disabled');
  }
});

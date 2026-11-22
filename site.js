'use strict';

// Text from the editor is escaped before insertion into HTML.
const escapeText = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const { categories, shoots, conditions, allOrder } = JSON.parse(
  JSON.stringify(portfolioContent), (_, value) => typeof value === 'string' ? escapeText(value) : value
);
const allWorks = allOrder.map(id => shoots.find(item => item.id === id)).filter(Boolean);

const servicePreviews = {
  personal: ['kristina-2-hd.jpg', 'personal-2-hd.jpg', 'kristina-3-hd.jpg', 'kristina-cover-hd.jpg'],
  catalog: ['catalog-1-hd.jpg', 'catalog-2-hd.jpg', 'catalog-3-hd.jpg', 'catalog-4-hd.jpg'],
  editorial: ['editorial-1-hd.jpg', 'editorial-2-hd.jpg', 'editorial-3-hd.jpg', 'editorial-4-hd.jpg'],
  food: ['food-1-hd.jpg', 'food-2-hd.jpg', 'food-3-hd.jpg', 'food-4-hd.jpg'],
};

const selection = [
  ['personal', 'Заказать съёмку для себя / своего блога', 'Персональная съёмка'],
  ['catalog', 'Заполнить карточки товаров на сайте', 'Каталог товаров / МП'],
  ['editorial', 'Представить коллекцию или запустить рекламу', 'Имиджевая съёмка'],
  ['food', 'Обновить меню или снять рекламу ресторана', 'Фуд-фотография'],
];

const mainPages = [
  ['about', 'обо мне'],
  ['portfolio', 'портфолио'],
  ['terms', 'условия'],
];

const site = document.querySelector('#site');
const path = (...segments) => '#/' + segments.filter(Boolean).join('/');
const current = (active) => active ? ' aria-current="page"' : '';
const list = (label, className, body) => `<nav class="${className}" aria-label="${label}">${body}</nav>`;
const link = (href, label, active = false) => `<a href="${href}"${current(active)}>${label}</a>`;
const lines = (items) => items.map(line => `<span>${line}</span>`).join(' ');
const photo = (file, alt = '', lazy = false) =>
  `<img class="photo" src="./assets/${file}" alt="${alt}"${lazy ? ' loading="lazy"' : ''}>`;

const contactLinks = `<span class="contact-links">
  <a href="https://t.me/renatspaceprince" target="_blank" rel="noopener noreferrer">telegram</a>
  <a href="https://instagram.com/spaceprince__" target="_blank" rel="noopener noreferrer">Instagram</a>
  <a href="mailto:renatspaceprince@gmail.com">e-mail</a>
  </span>`;

const contacts = `<address class="upper contacts">
  ${link(path(), 'Егоров Ренат')}
  ${contactLinks}
</address>`;

function readRoute() {
  const [page, section, shootId, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  if (rest.length || !['about', 'portfolio', 'terms'].includes(page)) return { page: 'home' };
  if (page === 'about') return { page };

  const validSection = page === 'terms' ? Object.hasOwn(conditions, section) : Object.hasOwn(categories, section);
  const category = validSection ? section : '';
  const shoot = page === 'portfolio' && shoots.find(item => item.id === shootId && item.category === category);
  return { page, category, shoot };
}

function mainNav(page) {
  return list('Главное меню', 'primary', mainPages.map(([id, label]) =>
    link(path(id), label, id === page)).join(''));
}

function categoryNav(page, category) {
  const terms = page === 'terms';
  const entries = Object.entries(categories).filter(([id]) => !terms || Object.hasOwn(conditions, id));
  if (terms) entries.unshift(['creative', 'креатив / организация']);
  return list('Разделы', 'upper categories', entries.map(([id, label]) =>
    link(path(page, id), label, id === category)).join(''));
}

function shootNav(category, shoot, works) {
  const links = [['', 'все'], ...works.map(({ id, name }) => [id, name])];
  const active = shoot ? shoot.id : '';
  return list('Съёмки в разделе', 'shoot-links', links.map(([id, name]) =>
    link(path('portfolio', category, id), name, id === active)).join(''));
}

function previewStrip(category) {
  return `<div class="more">
    <div class="strip" aria-hidden="true">${servicePreviews[category].map(file => photo(file)).join('')}</div>
    ${link(path('portfolio', category), 'см. больше')}
  </div>`;
}

function photos(category, shoot, works) {
  if (shoot) return `<h1 class="visually-hidden">${shoot.name}</h1>
    <div class="photos shoot-grid" data-shoot="${shoot.id}">
      ${(shoot.frames || [shoot.cover]).map((file, index) => photo(file, `${shoot.name}, кадр ${index + 1}`, index > 1)).join('')}
    </div>`;

  return `<h1 class="visually-hidden">${category ? categories[category] : 'все работы'}</h1>
    <div class="photos ${category ? 'category-grid' : 'all-grid'}">
      ${works.map((item, index) => `<a class="cover" href="${path('portfolio', item.category, item.id)}"
        aria-label="${categories[item.category]} · ${item.name}">${photo(item.cover, '', index > 1)}<span class="cover-name">${item.name}</span></a>`).join('')}
    </div>`;
}

function termsOverview() {
  return `<div class="terms-overview">
    <h1 class="serif">${lines(['Какую съёмку', 'выбрать?'])}</h1>
    <div class="term-options">
      ${selection.map(([id, title, type], index) => `<a href="${path('terms', id)}">
        <img class="arrow" src="./assets/terms-arrow-${index + 1}.svg" alt="">
        <span>${title}<small>${type}</small></span>
      </a>`).join('')}
    </div>
    <aside class="terms-contact">
      <h2>Не нашли подходящий формат?</h2>
      <p>${lines(['Свяжитесь со мной, я предложу формат под вашу задачу', 'и индивидуально рассчитаю стоимость.'])}</p>
    </aside>
  </div>`;
}

function termsDetail(category) {
  const service = conditions[category];
  return `<article class="terms-detail" data-category="${category}">
    <header><a class="terms-back" href="${path('terms')}">назад к условиям</a><h1 class="serif">${lines(service.title)}</h1><p>${service.intro}</p></header>
    <div class="service-sections">
      ${service.sections.map(([title, description]) => `<section>
        <h2>${title}</h2><p>${description}</p>
      </section>`).join('')}
    </div>
    <footer>${service.footerTitle ? `<h2>${service.footerTitle}</h2>` : ''}${service.footer.map(text => `<p>${text}</p>`).join('')}</footer>
  </article>`;
}

const bookingButton = '<button class="booking-button" type="button" aria-haspopup="dialog" aria-controls="booking">заказать съемку</button>';

function about() {
  return `<div class="about-portrait">${photo('portrait-about.jpg', 'Портрет Рената Егорова')}</div>
    <div class="about-services">
      <p>${lines(['разработка креативов', 'продюсирование', 'и проведение'])}</p>
      <p class="muted">${lines(['имиджевых', 'каталожных', 'персональных'])}<span>контент <b>— съемок</b></span></p>
    </div>
    <h1 class="about-name">Ренат <em>Егоров</em></h1>
    <div class="about-bottom"><div class="about-clients">
      <p>${lines(['За 5+ лет опыта поработал', 'с такими проектами, как:'])}</p>
      <p class="muted">MIXIT, Буквоед, Улыбка радуги, Пассворк, РЖД, Шоколадница, VOSQ, Доска треска, Alena Malygina, Правда севера, почтовая контора, roomi</p>
    </div>${bookingButton}</div>`;
}

let previousRoute;
let previousPage;
let previousCategory;
let transitionId = 0;

function animateMenu(node, opening) {
  const below = node.matches('.shoot-links, .contact-links');
  const folded = {
    opacity: 0,
    transform: below ? 'translateY(-1.4rem)' : 'translateY(1.4rem)',
    clipPath: below ? 'inset(0 0 100%)' : 'inset(100% 0 0)'
  };
  const style = getComputedStyle(node);
  const current = { opacity: style.opacity, transform: style.transform, clipPath: style.clipPath };
  node.getAnimations().forEach(animation => animation.cancel());
  const expanded = { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' };
  return node.animate(opening ? [folded, expanded] : [current, folded], {
    duration: opening ? 320 : 180, easing: opening ? 'ease-out' : 'ease-in', fill: 'forwards'
  }).finished.catch(() => {});
}
let galleryColumns;
const geometry = new ResizeObserver(adjustLayout);
function adjustLayout() {
  const sidebar = site.querySelector('.sidebar');
  const active = sidebar?.querySelector('.primary [aria-current]');
  if (active) sidebar.style.setProperty('--menu-right',
    (sidebar.getBoundingClientRect().right - active.getBoundingClientRect().right) + 'px');
  for (const label of site.querySelectorAll('.cover-name')) {
    label.classList.remove('smaller', 'wrapped');
    if (label.scrollWidth > label.clientWidth) label.classList.add('smaller');
    if (label.scrollWidth > label.clientWidth) label.classList.add('wrapped');
  }
}
function galleryTools(category, shoot) {
  const fallback = shoot ? path('portfolio', category) : category ? path('portfolio') : path();
  return '<div class="gallery-tools"><a class="back" href="'+fallback+'">назад</a><button type="button" class="view">вид</button></div>';
}
function applyColumns(grid, columns) {
  grid.dataset.columns = columns;
  const button = site.querySelector('.view');
  button.title = button.ariaLabel = columns === 1 ? 'Показать в две колонки' : 'Показать в одну колонку';
}
site.addEventListener('click', event => {
  if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (event.target.closest('.view')) {
    const grid = site.querySelector('.photos');
    galleryColumns = Number(grid.dataset.columns) === 1 ? 2 : 1;
    applyColumns(grid, galleryColumns);
    return;
  }
  const anchor = event.target.closest('a[href^="#/"]');
  if (!anchor) return;
  event.preventDefault();
  if (anchor.matches('.back') && history.state?.portfolioStep) { history.back(); return; }
  if (anchor.hash !== location.hash) {
    history.pushState({portfolioStep:true}, '', anchor.hash);
    render();
  }
});
async function render() {
  const state = readRoute();
  const { page, category, shoot } = state;
  const id = ++transitionId;
  const menus = [];
  if (page !== previousPage) menus.push('.categories');
  if (page !== previousPage || category !== previousCategory) menus.push('.shoot-links');
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const oldList = site.querySelector('.shoot-links');
  const scrollTop = oldList?.scrollTop || 0;
  if (motion) {
    const closing = menus.map(selector => site.querySelector(selector)).filter(Boolean);
    const exits = closing.map(node => animateMenu(node, false));
    if (previousPage === 'terms' && page !== 'terms') {
      const photos = Array.from(site.querySelectorAll('.strip > *')).reverse();
      photos.forEach((photo, index) => {
        const style = getComputedStyle(photo);
        const current = { opacity: style.opacity, transform: style.transform };
        photo.getAnimations().forEach(animation => animation.cancel());
        exits.push(photo.animate([
          current, { opacity: 0, transform: 'translateX(calc(-100% - .6875rem))' }
        ], { duration: 180, delay: index * 35, easing: 'ease-in', fill: 'both' }).finished.catch(() => {}));
      });
      const more = site.querySelector('.more a');
      if (more) exits.push(more.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 150, fill: 'forwards'
      }).finished.catch(() => {}));
    }
    if (exits.length) await Promise.all(exits);
    if (id !== transitionId) return;
  }
  const works = category ? shoots.filter(item => item.category === category) : allWorks;
  const keyboardFocus = document.activeElement?.matches('a:focus-visible');
  let upper = contacts;
  let lower = '';
  let body = '';

  if (page === 'home') body = `<div class="hero">${photo('hero-hd.jpg')}<h1>spaceprince</h1></div>`;
  if (page === 'about') body = about();
  if (page === 'portfolio') {
    upper = categoryNav(page, category);
    if (category) lower = shootNav(category, shoot, works);
    body = galleryTools(category, shoot) + photos(category, shoot, works);
  }
  if (page === 'terms') {
    upper = categoryNav(page, category);
    if (category && category !== 'creative') lower = previewStrip(category);
    body = category ? termsDetail(category) : termsOverview();
  }


  site.innerHTML = `<div class="layout page-${page}">
    <aside class="sidebar">${mainNav(page)}${upper}${lower}${page === 'terms' || page === 'home' ? bookingButton : ''}</aside>
    <main id="content" class="content" tabindex="-1">${body}</main>
  </div>`;

  geometry.disconnect();
  geometry.observe(site.querySelector('.primary'));
  const grid = site.querySelector('.photos');
  if (grid) {
    applyColumns(grid, galleryColumns ?? (category && !shoot ? 1 : 2));
    geometry.observe(grid);
  }
  adjustLayout();
  document.fonts.ready.then(adjustLayout);
  if (!menus.includes('.shoot-links') && oldList) site.querySelector('.shoot-links').scrollTop = scrollTop;
  if (motion) {
    for (const selector of menus) {
      const node = site.querySelector(selector);
      if (node) animateMenu(node, true);
    }
  }
  if (motion && page === 'about' && previousPage !== page) {
    animateMenu(site.querySelector('.contact-links'), true);
  }
  previousCategory = category;
  previousPage = page;
  const heading = site.querySelector('h1').textContent;
  document.title = page === 'home' ? 'spaceprince — Егоров Ренат' : `${heading} · spaceprince`;
  if (previousRoute !== undefined && previousRoute !== location.hash) {
    window.scrollTo(0, 0);
    const destination = [...site.querySelectorAll('a[aria-current]')]
      .find(anchor => anchor.hash === location.hash);
    if (keyboardFocus) (destination || site.querySelector('main')).focus({ preventScroll: true });
  }
  previousRoute = location.hash;
}

window.addEventListener('hashchange', render);
render();

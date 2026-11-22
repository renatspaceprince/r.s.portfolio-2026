'use strict';

const categories = {
  personal: 'персональные / контент',
  catalog: 'каталог товаров',
  editorial: 'имиджевые',
  food: 'фуд-фото',
};

// Only the first personal shoot has a complete gallery in Figma.
const shoots = [
  {
    id: 'kristina-demidova', category: 'personal', name: 'Кристина Демидова',
    cover: 'kristina-cover-hd.jpg',
    frames: ['kristina-cover-hd.jpg', 'kristina-2-hd.jpg', 'kristina-3-hd.jpg', 'kristina-4-hd.jpg', 'kristina-5-hd.jpg', 'kristina-cover-hd.jpg'],
  },
  { id: 'nastya-venya', category: 'personal', name: 'Настя Веня', cover: 'nastya-cover-hd.jpg' },
  { id: 'catalog-01', category: 'catalog', name: 'съёмка 01', cover: 'all-4-hd.jpg' },
  { id: 'catalog-02', category: 'catalog', name: 'съёмка 02', cover: 'catalog-1-hd.jpg' },
  { id: 'editorial-01', category: 'editorial', name: 'съёмка 01', cover: 'all-2-hd.jpg' },
  { id: 'food-01', category: 'food', name: 'съёмка 01', cover: 'food-1-hd.jpg' },
];

// Keep the image order and the two repeated covers in the All Works frame.
const allWorks = [shoots[0], shoots[4], shoots[1], shoots[2], shoots[4], shoots[0]];

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

const contacts = `<address class="upper contacts">
  ${link(path(), 'Егоров Ренат')}
  <a href="https://t.me/renatspaceprince" target="_blank" rel="noopener noreferrer">telegram</a>
  <a href="https://instagram.com/spaceprince__" target="_blank" rel="noopener noreferrer">Instagram</a>
  <a href="mailto:renatspaceprince@gmail.com">e-mail</a>
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
  const entries = [['', terms ? 'все' : 'все работы'], ...Object.entries(categories)];
  if (terms) entries.push(['creative', 'креатив / организация']);
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
        aria-label="${categories[item.category]} · ${item.name}">${photo(item.cover, '', index > 1)}</a>`).join('')}
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
    <header><h1 class="serif">${lines(service.title)}</h1><p>${service.intro}</p></header>
    <div class="service-sections">
      ${service.sections.map(([title, description]) => `<section>
        <h2>${title}</h2><p>${description}</p>
      </section>`).join('')}
    </div>
    <footer>${service.footerTitle ? `<h2>${service.footerTitle}</h2>` : ''}${service.footer.map(text => `<p>${text}</p>`).join('')}</footer>
  </article>`;
}

function about() {
  return `<div class="about-portrait">${photo('portrait-hd.jpg', 'Портрет Рената Егорова')}</div>
    <div class="about-services">
      <p>${lines(['разработка креативов', 'продюсирование', 'и проведение'])}</p>
      <p class="muted">${lines(['имиджевых', 'каталожных', 'персональных'])}<span>контент <b>— съемок</b></span></p>
    </div>
    <h1 class="about-name">Ренат <em>Егоров</em></h1>
    <div class="about-clients">
      <p>${lines(['За 5+ лет опыта поработал', 'с такими проектами, как:'])}</p>
      <p class="muted">MIXIT, Буквоед, Улыбка радуги, Пассворк, РЖД, Шоколадница, VOSQ, Доска треска, Alena Malygina, Правда севера, почтовая контора, roomi</p>
    </div>`;
}

let previousRoute;
function render() {
  const state = readRoute();
  const { page, category, shoot } = state;
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
    body = photos(category, shoot, works);
  }
  if (page === 'terms') {
    upper = categoryNav(page, category);
    if (category && category !== 'creative') lower = previewStrip(category);
    body = category ? termsDetail(category) : termsOverview();
  }

  site.innerHTML = `<div class="layout page-${page}">
    <aside class="sidebar">${mainNav(page)}${upper}${lower}</aside>
    <main id="content" class="content" tabindex="-1">${body}</main>
  </div>`;

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

'use strict';

const mobileViewport = matchMedia('(max-width: 840px)');
const mobileNames = {home:'Главная',portfolio:'Портфолио',terms:'Условия съёмки',about:'Обо мне'};
const mobileAction = (href, label) => '<a class="m-action" href="'+href+'">'+label+'</a>';
const mobileOrder = '<button class="booking-button m-action" type="button" aria-haspopup="dialog">Заказать съёмку</button>';

function mobileAbout() {
  return `<div class="m-bio">${photo('portrait-about.jpg','Ренат Егоров')}<div>
    <h1>Ренат Егоров</h1>${servicesCopy}</div></div>
    <div class="m-clients">За 5+ лет опыта поработал<br>с такими проектами, как:
    <p>MIXIT, Буквоед, Улыбка радуги, Пассворк, РЖД, Шоколадница, VOSQ, Доска треска, Alena Malygina, Правда севера, почтовая контора, roomi</p></div>
    <div class="m-contact">Контакты для связи:${contactLinks}</div>
    <div class="m-about-actions">${mobileAction(path('portfolio'),'<span class="action-label">смотреть <span>портфолио</span></span>')}${mobileAction(path('terms'),'<span class="action-label">перейти <span>к&nbsp;условиям</span></span>')}</div>`;
}

const mobileServiceNames = { personal: 'персональная/контент', editorial: 'имидж / реклама' };

function mobileTerms(category) {
  if (!category) {
    const options = [...selection,['creative','Не входит в указанную стоимость съёмки','Креатив и организация']];
    return `<h1>Какую съёмку выбрать?</h1>${options.map(([id,description,title]) =>
      `<a class="m-option" href="${path('terms',id)}"><strong>${mobileServiceNames[id] || title}</strong><span>${description}</span></a>`).join('')}
      <section><h2>Не нашли подходящий формат?</h2><p>Свяжитесь со мной, я предложу формат под вашу задачу и индивидуально рассчитаю стоимость.</p></section>${mobileOrder}`;
  }
  const service = conditions[category];
  const sections = service.sections.map(([title,description]) => {
    if (category !== 'food') return `<section><h2>${title}</h2><p>${description}</p></section>`;
    const [name, price] = title.split(/\s+\/\s+/);
    return `<details><summary><strong>${name}</strong>${price || ''}</summary><p>${description}</p></details>`;
  }).join('');
  return `<h1>${mobileServiceNames[category] || service.title.join(' ')}</h1><p>${service.intro}</p>${sections}<section>${service.footerTitle ? '<h2>'+service.footerTitle+'</h2>' : ''}${service.footer.map(t=>'<p>'+t+'</p>').join('')}</section>
    ${servicePreviews[category] ? '<a class="strip" aria-label="Посмотреть съёмки" href="'+path('portfolio',category)+'">'+servicePreviews[category].map(f=>photo(f)).join('')+'</a>' : ''}${mobileOrder}`;
}

function mobileMenu(group) {
  const menu = site.querySelector('.m-menu');
  const route = (href,label) => '<a href="'+href+'">'+label+'</a>';
  const sub = (id,label) => '<button type="button" data-group="'+id+'">'+label+'</button>';
  const items = group ? route(path(group),group==='terms'?'Все форматы':'Все работы') +
    Object.entries(group==='terms'?conditions:categories).map(([id,value])=>route(path(group,id),group==='terms'?(mobileServiceNames[id] || value.title.join(' ')):value)).join('')
    : route(path(),'Главная')+route(path('about'),'Обо мне')+sub('portfolio','Портфолио')+sub('terms','Условия съёмки');
  menu.innerHTML = `<header><strong>${group ? mobileNames[group] : 'Меню'}</strong><button type="button" aria-label="${group?'Назад':'Закрыть меню'}" ${group?'data-group=""':'data-dismiss'}>${group?'←':'×'}</button></header>
    <nav aria-label="Разделы сайта">${items}</nav><footer>${mobileOrder}${contactLinks}</footer>`;
  if (!menu.open) menu.showModal();
  menu.querySelector('header button').focus();
}

function renderMobile({page,category,shoot,fromAll}) {
  let body;
  if (page==='home') body = `${photo('hero-hd.jpg','')}<h1>Ренат<br>Егоров</h1>${mobileAction(path('portfolio'),'Смотреть портфолио')}`;
  if (page==='about') body = mobileAbout();
  if (page==='terms') body = mobileTerms(category);
  if (page==='portfolio') {
    const works = category ? shoots.filter(s=>s.category===category) : allWorks;
    body = photos(category,shoot,works,fromAll);
    if (!category) body = body.replace('все работы','Портфолио');
  }
  site.innerHTML = `<div class="mobile-page m-${page}"><header class="m-bar"><a href="${path()}">spaceprince</a><button type="button" aria-label="Открыть меню" aria-haspopup="dialog" data-menu><i></i><i></i></button></header>
    <main id="content">${body}</main><dialog class="m-menu" aria-label="Навигация"></dialog></div>`;
  aboutButtonsObserver.disconnect();
  const actions = site.querySelector('.m-about-actions');
  if (actions) {
    aboutButtonsObserver.observe(actions);
    document.fonts.ready.then(() => fitAboutButtons(actions));
  }
  const menu = site.querySelector('.m-menu');
  site.querySelector('[data-menu]').onclick = () => mobileMenu(page === 'portfolio' || page === 'terms' ? page : '');
  menu.onclick = event => {
    const group = event.target.closest('[data-group]');
    if (group) mobileMenu(group.dataset.group);
    else if (event.target.closest('[data-dismiss],a,.booking-button')) menu.close();
  };
  document.title = site.querySelector('h1').innerText.replace(/\n/g,' ')+' · spaceprince';
  window.scrollTo(0,0);
}

function fitAboutButtons(actions) {
  if (!actions.isConnected) return;
  actions.classList.remove('two-lines');
  const wrap = Array.from(actions.querySelectorAll('.action-label')).some(label => label.scrollWidth > label.clientWidth);
  actions.classList.toggle('two-lines', wrap);
}
const aboutButtonsObserver = new ResizeObserver(entries => fitAboutButtons(entries[0].target));

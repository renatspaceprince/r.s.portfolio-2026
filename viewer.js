'use strict';

document.addEventListener('click', event => {
  const opener = event.target.closest('.frame-open');
  if (!opener) return;
  const images = Array.from(opener.parentElement.querySelectorAll('.frame-open img'));
  let current = images.indexOf(opener.querySelector('img'));
  const dialog = document.createElement('dialog');
  dialog.className = 'frame-viewer';
  dialog.setAttribute('aria-label', 'просмотр фотографий');
  dialog.innerHTML = '<button class="viewer-close" aria-label="закрыть">×</button><div class="viewer-slides"></div><button class="viewer-prev" aria-label="предыдущий кадр">‹</button><button class="viewer-next" aria-label="следующий кадр">›</button><div class="viewer-thumbs"></div>';
  const slides = dialog.querySelector('.viewer-slides');
  const thumbs = dialog.querySelector('.viewer-thumbs');
  const prev = dialog.querySelector('.viewer-prev');
  const next = dialog.querySelector('.viewer-next');
  function go(index) {
    slides.scrollLeft = Math.max(0, Math.min(images.length - 1, index)) * slides.clientWidth;
    sync();
  }
  function sync() {
    current = Math.round(slides.scrollLeft / slides.clientWidth);
    Array.from(thumbs.children).forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
    thumbs.children[current]?.scrollIntoView({block:'nearest', inline:'nearest'});
    prev.disabled = current <= 0;
    next.disabled = current >= images.length - 1;
  }
  images.forEach((image, i) => {
    const slide = image.cloneNode();
    slide.className = '';
    slide.loading = i === current ? 'eager' : 'lazy';
    slides.append(slide);
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'кадр ' + (i + 1));
    const thumbnail = image.cloneNode();
    thumbnail.alt = '';
    button.append(thumbnail);
    button.onclick = () => go(i);
    thumbs.append(button);
  });
  prev.onclick = () => go(current - 1);
  next.onclick = () => go(current + 1);
  dialog.querySelector('.viewer-close').onclick = () => dialog.close();
  dialog.onkeydown = event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    go(current + (event.key === 'ArrowRight' ? 1 : -1));
  };
  const closeOnNavigation = () => dialog.close();
  dialog.onclose = () => {
    window.removeEventListener('hashchange', closeOnNavigation);
    dialog.remove();
    if (opener.isConnected) opener.focus({preventScroll:true});
  };
  window.addEventListener('hashchange', closeOnNavigation);
  document.body.append(dialog);
  dialog.showModal();
  go(current);
  slides.onscroll = sync;
});

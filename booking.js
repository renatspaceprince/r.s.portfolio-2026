'use strict';

const booking = document.querySelector('#booking');
const bookingForm = booking.querySelector('form');
const fields = bookingForm.elements;
const bookingResult = booking.querySelector('.booking-result');
const thumbnails = booking.querySelector('.booking-thumbs');
let thumbnailUrls = [];

for (const [id, service] of Object.entries(portfolioContent.conditions)) {
  fields.format.add(new Option(service.title.join(' '), id));
}

site.addEventListener('click', event => {
  if (!event.target.closest('.booking-button')) return;
  const { category } = readRoute();
  if (category && !fields.format.value) fields.format.value = category;
  booking.showModal();
});

booking.querySelector('.booking-close').onclick = () => booking.close();
booking.addEventListener('click', event => {
  if (event.target !== booking) return;
  const rect = booking.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) booking.close();
});

bookingForm.addEventListener('change', event => {
  if (event.target.name === 'channel') {
    const email = fields.channel.value === 'email';
    fields.contact.type = email ? 'email' : 'text';
    fields.contact.placeholder = email ? 'name@example.com' : '@username или +7…';
    document.querySelector('#booking-contact-label').textContent = email ? 'Адрес электронной почты' : 'Ник или номер телефона';
  }
  if (event.target === fields.photos) {
    thumbnails.replaceChildren();
    thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
    thumbnailUrls = Array.from(fields.photos.files).filter(file => file.type.startsWith('image/')).map(file => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      image.alt = file.name;
      thumbnails.append(image);
      return url;
    });
  }
});

function showBookingResult(show) {
  bookingForm.hidden = show;
  bookingResult.hidden = !show;
  (show ? booking.querySelector('.booking-edit') : fields.namedItem('name')).focus();
}
const bookingStatus = booking.querySelector('.booking-status');
bookingForm.onsubmit = async event => {
  event.preventDefault();
  const submit = bookingForm.querySelector('[type=submit]');
  if (submit.disabled) return;
  const files = Array.from(fields.photos.files);
  if (files.length > 10 || files.reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024) {
    bookingStatus.textContent = 'Прикрепите до 10 фотографий общим размером до 20 МБ.';
    return;
  }
  submit.disabled = true;
  bookingStatus.textContent = 'Отправляем заявку…';
  try {
    const form = new FormData(bookingForm);
    form.set('format', fields.format.selectedOptions[0].text);
    const local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    let endpoint = 'https://renatspaceprince-booking.glendorapintor.chatgpt.site/api/booking';
    let options = { method: 'POST', body: form };
    if (local) {
      const data = Object.fromEntries(form);
      data.photos = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ type: file.type, data: reader.result.split(',')[1] });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })));
      endpoint = 'http://127.0.0.1:4174/api/booking';
      options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }
    const response = await fetch(endpoint, options);
    if (response.status !== 204) {
      throw new Error(response.status === 503 ? 'Приём заявок ещё не настроен.' : 'Подтверждение доставки не получено.');
    }
    bookingStatus.textContent = '';
    bookingForm.reset();
    fields.channel[0].dispatchEvent(new Event('change', { bubbles: true }));
    fields.photos.dispatchEvent(new Event('change', { bubbles: true }));
    showBookingResult(true);
  } catch (error) {
    bookingStatus.textContent = error.message + ' Данные формы сохранены в этом окне.';
  } finally {
    submit.disabled = false;
  }
};
booking.querySelector('.booking-edit').onclick = () => booking.close();
booking.addEventListener('close', () => {
  bookingForm.hidden = false;
  bookingResult.hidden = true;
});

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initCalendar();
  initAppointmentForm();
  renderBlockedDatesList();
});

function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 16);
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

/* ===== Calendar ===== */
let calYear, calMonth, selectedDate = '';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

function initCalendar() {
  const container = document.getElementById('calendar');
  if (!container) return;

  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar(container);
}

function renderCalendar(container) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;

  let html = `
    <div class="cal-header">
      <button type="button" id="calPrev" aria-label="Önceki ay">‹</button>
      <span class="cal-month">${MONTHS_TR[calMonth]} ${calYear}</span>
      <button type="button" id="calNext" aria-label="Sonraki ay">›</button>
    </div>
    <div class="cal-weekdays">
      <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
    </div>
    <div class="cal-days">
  `;

  for (let i = 0; i < startPad; i++) {
    html += `<span class="cal-day empty"></span>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(calYear, calMonth, d);
    const blocked = isDateBlocked(dateStr);
    const isPast = dateObj < today;
    const isFuture = dateObj > maxDate;
    const isSelected = dateStr === selectedDate;

    let cls = 'cal-day';
    if (blocked) cls += ' blocked';
    else if (isPast || isFuture) cls += ' disabled';
    if (isSelected) cls += ' selected';

    html += `<button type="button" class="${cls}" data-date="${dateStr}" ${blocked || isPast || isFuture ? 'disabled' : ''}>${d}</button>`;
  }

  html += `</div>
    <div class="cal-legend">
      <span class="legend-open">Müsait</span>
      <span class="legend-blocked">Dolu</span>
      <span class="legend-selected">Seçili</span>
    </div>`;

  container.innerHTML = html;

  container.querySelector('#calPrev')?.addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar(container);
  });

  container.querySelector('#calNext')?.addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar(container);
  });

  container.querySelectorAll('.cal-day:not(.empty):not(.disabled):not(.blocked)').forEach(btn => {
    btn.addEventListener('click', () => selectDate(btn.dataset.date, container));
  });
}

function selectDate(dateStr, container) {
  selectedDate = dateStr;
  document.getElementById('date').value = dateStr;

  const dateSelected = document.getElementById('dateSelected');
  const dateError = document.getElementById('dateError');

  if (dateSelected) {
    dateSelected.textContent = `Seçilen: ${formatDateTR(dateStr)}`;
    dateSelected.classList.remove('hidden');
  }
  if (dateError) dateError.classList.add('hidden');

  renderCalendar(container);
}

function renderBlockedDatesList() {
  const list = document.getElementById('blockedDatesList');
  const ul = document.getElementById('blockedDatesUl');
  if (!list || !ul) return;

  const blocked = getBlockedDates();
  if (blocked.length === 0) {
    list.classList.add('hidden');
    return;
  }

  list.classList.remove('hidden');
  ul.innerHTML = blocked
    .sort()
    .map(d => `<li>${formatDateTR(d)}</li>`)
    .join('');
}

/* ===== Appointment Form ===== */
function initAppointmentForm() {
  const form = document.getElementById('appointmentForm');
  const modal = document.getElementById('successModal');
  const successMessage = document.getElementById('successMessage');
  const newAppointmentBtn = document.getElementById('newAppointment');

  if (!form) return;

  const serviceLabels = {
    'sac-kesimi': 'Saç Kesimi',
    'sakal-tiras': 'Sakal & Tıraş',
    'paket': 'Saç + Sakal',
    'boyama': 'Saç Boyama',
    'bakim': 'Saç Bakımı',
    'cocuk': 'Çocuk Kesimi'
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const phone = formData.get('phone').trim();
    const service = formData.get('service');
    const date = formData.get('date');
    const time = formData.get('time');
    const barber = formData.get('barber');
    const notes = formData.get('notes');
    const email = formData.get('email');

    const dateError = document.getElementById('dateError');

    if (!date) {
      alert('Lütfen takvimden bir tarih seç.');
      return;
    }

    if (isDateBlocked(date)) {
      if (dateError) dateError.classList.remove('hidden');
      return;
    }

    addBooking({ name, phone, email, service, date, time, barber, notes });

    if (successMessage) {
      successMessage.textContent =
        `${name}, ${formatDateTR(date)} günü saat ${time}'de randevun kaydedildi. O gün artık dolu — başkası alamaz. Kısa sürede arayıp teyit ederiz.`;
    }

    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    renderBlockedDatesList();
    const cal = document.getElementById('calendar');
    if (cal) renderCalendar(cal);
  });

  if (newAppointmentBtn) {
    newAppointmentBtn.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
      document.body.style.overflow = '';
      form.reset();
      selectedDate = '';
      document.getElementById('dateSelected')?.classList.add('hidden');
      const cal = document.getElementById('calendar');
      if (cal) renderCalendar(cal);
    });
  }

  if (modal) {
    modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
}

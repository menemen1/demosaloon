const STORAGE_KEY = 'bladeStyleBookings';

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function getBlockedDates() {
  const dates = new Set();
  getBookings().forEach(b => {
    if (b.date) dates.add(b.date);
  });
  return [...dates];
}

function isDateBlocked(dateStr) {
  return getBlockedDates().includes(dateStr);
}

function addBooking(booking) {
  const bookings = getBookings();
  bookings.push({
    ...booking,
    id: Date.now(),
    createdAt: new Date().toISOString()
  });
  saveBookings(bookings);
}

function removeBookingByDate(dateStr) {
  saveBookings(getBookings().filter(b => b.date !== dateStr));
}

function formatDateTR(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

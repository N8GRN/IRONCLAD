// ===============================================
// IRONCLAD CRM PWA - Main Application Logic
// ===============================================

window.onload = function () {
    drawUser();
};

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registered:', reg.scope);
        maybeRedirectToLogin();  // ← Only redirect from landing page
      })
      .catch(err => {
        console.error('SW registration failed:', err);
        maybeRedirectToLogin();
      });
  });
} else {
  maybeRedirectToLogin();
}

// Only redirect to login if currently on the root landing page (index.html or /IRONCLAD/)
function maybeRedirectToLogin() {
  const path = window.location.pathname.toLowerCase();

  // These are the landing page URLs on your GitHub Pages site
  const isOnLandingPage =
    path === '/' ||
    path === '/ironclad/' ||
    path === '/ironclad/index.html' ||
    path.endsWith('/index.html');

  if (isOnLandingPage) {
    setTimeout(() => {
      window.location.href = '/pages/login.html';
    }, 600);
  }
}

// ===============================================
// UI & Interaction Logic
// ===============================================

const isTableEl = el => !!el.closest("table");

document.body.addEventListener('click', function (event) {
  const inputElements = ['input', 'textarea', 'select', 'button'];
  const el = event.target;
  const tag = el.tagName.toLowerCase();

  if (document.activeElement && inputElements.indexOf(tag) === -1) {
    document.activeElement.blur();
  }

  document.querySelectorAll('tr.active-row').forEach(row => {
    row.classList.remove('active-row');
  });

  if (isTableEl(el)) {
    el.closest('tr')?.classList.add('active-row');
  }
});

// Scroll shadow on <main>
const main = document.querySelector("main");
if (main) {
  main.addEventListener('scroll', () => {
    main.classList.toggle('scrolled', main.scrollTop > 0);
  });
}

// ===============================================
// User Display
// ===============================================

function drawUser() {
  const div = document.createElement("div");
  const a = document.createElement("a");

  a.id = "username";
  a.href = "pages/login.html";
  a.textContent = getActiveUser();

  div.classList.add("active-user");
  div.appendChild(a);
  document.body.appendChild(div);
}

function getActiveUser() {
  return localStorage.getItem('userName') || "Guest";
}

// ===============================================
// Offline/Online Indicators (optional)
// ===============================================

window.addEventListener('online', () => {
  console.log('Back online');
  document.body.classList.remove('offline-mode');
});

window.addEventListener('offline', () => {
  console.log('Working offline');
  document.body.classList.add('offline-mode');
});

// ===============================================
// Dev-only file read/write (blocked in production)
// ===============================================

const isDev = ['localhost', '127.0.0.1', '192.168.0.18'].includes(location.hostname);

const read = (file = 'story.txt') => {
  if (!isDev) return console.warn('read() blocked outside dev');
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`, true);
  xhr.onload = () => console.log(xhr.status === 200 ? 'Read success' : 'Read failed:', xhr.status);
  xhr.onerror = () => console.error('Network error reading', file);
  xhr.send();
};

const write = (file = 'story.txt', text = '') => {
  if (!isDev) return console.warn('write() blocked outside dev');
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`, true);
  xhr.onload = () => console.log(xhr.status === 200 ? 'Write success' : 'Write failed:', xhr.status);
  xhr.onerror = () => console.error('Network error writing', file);
  xhr.send(text);
};
// ===============================================
// IRONCLAD CRM PWA - Main Application Logic
// ===============================================

window.onload = function () {
    drawUser();
};

// Service Worker Registration (PWA core)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully:', reg.scope);
        goToLogin(); // Proceed after registration
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
        goToLogin(); // Still redirect even if SW fails
      });
  });
} else {
  goToLogin();
}

// Reliable login redirect (works when launched from home screen)
function goToLogin() {
  const currentPath = window.location.pathname.toLowerCase();
  const isLoginPage = currentPath.includes('login.html') || currentPath.endsWith('login.html');

  if (!isLoginPage) {
    setTimeout(() => {
      window.location.href = './pages/login.html'; // Absolute path = reliable on iOS/Android
    }, 600);
  }
}

// ===============================================
// UI & Interaction Logic
// ===============================================

const isTableEl = function (el) {
  return !!el.closest("table");
};

// Remove focus + row highlighting on body click
document.body.addEventListener('click', function (event) {
  const inputElements = ['input', 'textarea', 'select', 'button'];
  const el = event.target;
  const tag = el.tagName.toLowerCase();

  // Blur active input if clicking outside form controls
  if (document.activeElement && inputElements.indexOf(tag) === -1) {
    document.activeElement.blur();
  }

  // Clear all active rows
  document.querySelectorAll('tr.active-row').forEach(row => {
    row.classList.remove('active-row');
  });

  // Highlight clicked row if inside a table
  if (isTableEl(el)) {
    el.closest('tr')?.classList.add('active-row');
  }
});

// Scroll shadow effect on <main>
const main = document.querySelector("main");
if (main) {
  main.addEventListener('scroll', function () {
    main.classList.toggle('scrolled', main.scrollTop > 0);
  });
}

// ===============================================
// User Display
// ===============================================

function drawUser() {
  let div = document.createElement("div");
  let a = document.createElement("a");

  a.id = "username";
  a.href = "pages/login.html"; // Relative but consistent
  a.textContent = getActiveUser();

  div.classList.add("active-user");
  div.appendChild(a);
  document.body.appendChild(div);
}

function getActiveUser() {
  return localStorage.getItem('userName') || "Guest";
}

// ===============================================
// Offline/Online Status (Optional UX Enhancement)
// ===============================================

window.addEventListener('online', () => {
  console.log('Back online');
  document.body.classList.remove('offline-mode');
});

window.addEventListener('offline', () => {
  console.log('Working offline');
  document.body.classList.add('offline-mode');
  // Optional: show toast/banner
});

// ===============================================
// Local Development Server I/O (keep for dev, remove or guard in production)
// ===============================================

// Only enable read/write when running on localhost or your dev IP
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '192.168.0.18';

const read = (file = 'story.txt') => {
  if (!isDev) return console.warn('read() blocked in production');
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`, true);
  xhr.onload = () => {
    if (xhr.status === 200) console.log('Read:', file, '→', xhr.responseText);
    else console.error('Read failed:', xhr.status);
  };
  xhr.onerror = () => console.error('Network error reading', file);
  xhr.send();
};

const write = (file = 'story.txt', text = '') => {
  if (!isDev) return console.warn('write() blocked in production');
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`, true);
  xhr.onload = () => {
    if (xhr.status === 200) console.log('Saved to', file);
    else console.error('Write failed:', xhr.status);
  };
  xhr.onerror = () => console.error('Network error writing', file);
  xhr.send(text);
};
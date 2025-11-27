// ===============================================
// IRONCLAD CRM PWA - Main Application Logic
// ===============================================
//const REPO = "/IRONCLAD/"; // ← Declared in sw.js
const REPO_ = "/IRONCLAD";
const PAGES_ = "/"; // "/pages";

window.onload = function () {
    drawUser();
};

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(REPO_ + '/sw.js')
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
    path === REPO_ ||
    path === REPO_ + '/index.html' ||
    path.endsWith('/index.html');

  if (isOnLandingPage) {
    setTimeout(() => {
      window.location.href = REPO_ + '/login.html';
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

function goToPage(pageName) {
  if(!pageName.endsWith(".html")){pageName = pageName + ".html"};
  location.href = REPO_ + PAGES_ + pageName;
}

// ===============================================
// User Display
// ===============================================

function drawUser() {
  const div = document.createElement("div");
  const a = document.createElement("a");

  a.id = "username";
  a.href = REPO_ + PAGES_ + "login.html";
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

function userMessage(title, message, callback){
  var div = document.createElement("div");
  var titleEl = document.createElement("h3")
  var content = document.createElement("div");
  var btn = document.createElement("button");

  div.id ="user-message";

  content.innerText = message//.replace(/\n/g, "<br>");
  content.innerHTML = message.replace(/\n/g, "<br>")
  titleEl.innerText = title;
  btn.innerText = "Ok";


  div.appendChild(titleEl);
  div.appendChild(content);
  div.appendChild(btn);
  document.body.appendChild(div);

  btn.onclick = function(){callback()}

  // Style
  div.style.cssText="display:block;position:absolute;background:rgba(0, 0, 0, 0.7);top:25%;left:20%;width:60%;color:white;padding:1rem;border-radius:1.5rem;"
  btn.style.cssText="background:gray;border:white;width:auto;float:right;padding:0.5rem;min-width:120px;font-size:1.2rem;";
}

function closeUserMessage(){
  var div = document.getElementById("user-message");
  if (div) {div.parentNode.removeChild(div)};
}

function notifyOffline() {
  userMessage("Offline Mode", "You’re currently offline. Most features will work, but you’ll need an internet connection to sync changes.\n\nReconnect when possible.", closeUserMessage)
}

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
// js/app.js - IRONCLAD CRM PWA - Main Application Logic
// Expects: modules.js loaded first (provides window.FireDB, window.AuthAPI, window.requestNotificationPermission)
// ===============================================

const REPO_ = "/IRONCLAD";
const PAGES_ = "/pages";

const db = (() => {
  if (localStorage.getItem("TestMode") === "true") {
    console.log("Test Mode active");
    return window.GrokDB; // Your mock/local DB
  } else {
    console.log("Live Mode active");
    return window.FireDB; // Real Firestore from modules.js
  }
})();

// ===============================================
// Initialization & Redirect
// ===============================================
window.onload = function () {
  //drawUser();
  maybeRedirectToLogin();

  // Delay SW registration until after potential redirect (give page time to settle)
  setTimeout(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/IRONCLAD/sw.js', { scope: '/IRONCLAD/' })
        .then(reg => console.log('SW registered late:', reg.scope))
        .catch(err => console.error('Late SW reg failed:', err));

      // Also delay notification button listener
      const enableBtn = document.getElementById('enableNotificationsButton');
      if (enableBtn && window.requestNotificationPermission) {
        enableBtn.addEventListener('click', window.requestNotificationPermission);
      }
    }
  }, 1500); // 1.5s delay – adjust if needed

  // Optional: If on a settings/notifications page with enable button
  const enableBtn = document.getElementById('enableNotificationsButton');
  if (enableBtn && window.requestNotificationPermission) {
    enableBtn.addEventListener('click', function(){
      window.requestNotificationPermission;
  });
  }

  // Auth state listener - protect pages & update UI
  if (window.AuthAPI) {
    window.AuthAPI.onAuthChange((user) => {
      if (!user) {
        // Not logged in → redirect to login (except on login page itself)
        if (!window.location.pathname.includes('/login.html')) {
          console.log('No authenticated user - redirecting to login');
          window.location.replace(REPO_ + PAGES_ + '/login.html');
        }
      } else {
        console.log('Logged in as:', user.email);
        // Fetch and store username if not already in localStorage
        window.AuthAPI.getUserProfile(user.uid).then(profile => {
          if (profile && profile.username) {
            localStorage.setItem('activeUsername', profile.username);
            drawUser(); // Refresh UI with username
          }
        });
      }
    });
  }
};

function maybeRedirectToLogin() {
  const path = window.location.pathname.toLowerCase();

  const isLandingPage =
    path === '/' ||
    path === REPO_ ||
    path === REPO_ + '/' ||
    path === REPO_ + '/index.html' ||
    path.endsWith('/index.html');

  if (isLandingPage) {
    // Small delay to allow PWA install prompt / analytics if needed
    setTimeout(() => {
      window.location.replace(REPO_ + PAGES_ + '/login.html'); // replace to avoid history clutter
    }, 800);
  }
}

// ===============================================
// Roof Sections - Applications Page
// ===============================================
const roofForm = document.querySelector('#roof-form') || null;

function renderRoof(doc) {
  const li = document.createElement('li');
  const structureSpan = document.createElement('span');
  const sectionSpan = document.createElement('span');
  const cross = document.createElement('div');

  li.setAttribute('data-id', doc.id);
  structureSpan.textContent = doc.data().structure || 'House';
  sectionSpan.textContent = doc.data().section || 'Unnamed Section';
  cross.textContent = '×';
  cross.className = "close";

  li.append(structureSpan, sectionSpan, cross);
  roofForm?.appendChild(li);

  cross.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = e.target.parentElement.getAttribute('data-id');
    db.collection('roof_sections').doc(id).delete().catch(err => {
      console.error('Delete failed:', err);
      alert('Failed to delete section. Check connection.');
    });
  });
}

if (roofForm) {
  roofForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const structure = roofForm.structure.value.trim() || "House";
      const section = roofForm.section.value.trim() || `Section #${roofForm.querySelectorAll('li').length + 1}`;

      await db.collection('roof_sections').add({
        structure,
        section,
        createdAt: new Date()
      });

      roofForm.reset();
    } catch (err) {
      console.error('Error adding roof section:', err);
      alert('Could not save section — are you online?');
    }
  });

  // Real-time listener with error handling
  db.collection('roof_sections').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        renderRoof(change.doc);
      } else if (change.type === 'removed') {
        const li = roofForm.querySelector(`[data-id="${change.doc.id}"]`);
        if (li) roofForm.removeChild(li);
      }
      // You can handle 'modified' if needed later
    });
  }, err => {
    console.error('Roof sections snapshot error:', err);
  });
}

// ===============================================
// Section Details - Structure Page
// ===============================================
const sectionForm = document.querySelector('#section-form') || null;

function renderStructure() {
  if (!sectionForm) return;

  const structureEl = sectionForm.querySelector("#structure");
  const sectionEl = sectionForm.querySelector("#section");
  const typeEl = sectionForm.querySelector("[name='type']");     // assuming <select name="type">
  const pitchEl = sectionForm.querySelector("[name='pitch']");
  const layersEl = sectionForm.querySelector("[name='layers']");
  const sheathingEl = sectionForm.querySelector("[name='sheathing']");

  let progress = JSON.parse(localStorage.getItem("progress") || '{"x":0,"y":0}');
  let currentIndex = progress.x;

  db.collection('roof_sections').onSnapshot(snapshot => {
    try {
      const docs = snapshot.docs;
      const total = docs.length;
      if (total === 0) return;

      // Cycle through sections
      currentIndex = (currentIndex + 1) % total;
      const currentDoc = docs[currentIndex];
      const data = currentDoc.data();

      structureEl.textContent = data.structure || 'Unknown';
      sectionEl.textContent = data.section || 'Unnamed';

      // Pre-fill form with existing values if any
      typeEl.value = data.type || '';
      pitchEl.value = data.pitch || '';
      layersEl.value = data.layers || '';
      sheathingEl.value = data.sheathing || '';

      localStorage.setItem("progress", JSON.stringify({ x: currentIndex, y: total }));
    } catch (err) {
      console.error('Error in renderStructure snapshot:', err);
    }
  }, err => console.error('Structure snapshot failed:', err));
}

if (sectionForm) {
  renderStructure();

  sectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.submitter;
    if (!submitBtn) return;

    submitBtn.disabled = true;
    setTimeout(() => { submitBtn.disabled = false; }, 3000); // rate limit

    try {
      // Assuming you store the current section ID somewhere, e.g. data-current-id on form
      const currentId = sectionForm.dataset.currentId || null; // Add logic to set this if needed
      if (!currentId) {
        console.warn('No current section ID set');
        return;
      }

      await db.collection('roof_sections').doc(currentId).update({
        type: sectionForm.type?.value || '',
        pitch: sectionForm.pitch?.value || '',
        layers: sectionForm.layers?.value || '',
        sheathing: sectionForm.sheathing?.value || '',
        updatedAt: new Date()
      });

      console.log('Section updated successfully');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to save section details.');
    }
  });
}

// ===============================================
// Global UI Interactions
// ===============================================
const isTableRow = el => !!el.closest("table tr");

document.body.addEventListener('click', (event) => {
  const el = event.target;
  const tag = el.tagName.toLowerCase();
  const inputTags = ['input', 'textarea', 'select', 'button'];

  // Blur active inputs if clicking elsewhere
  if (!inputTags.includes(tag) && document.activeElement) {
    document.activeElement.blur();
  }

  // Highlight clicked table row
  document.querySelectorAll('tr.active-row').forEach(row => row.classList.remove('active-row'));
  if (isTableRow(el)) {
    el.closest('tr').classList.add('active-row');
  }
});

// Scroll shadow on main content
const main = document.querySelector("main");
if (main) {
  main.addEventListener('scroll', () => {
    main.classList.toggle('scrolled', main.scrollTop > 0);
  }, { passive: true });
}

// Navigation helper
window.goToPage = function(pageName) {
  if (!pageName.endsWith(".html")) pageName += ".html";

  let url = pageName.startsWith("/") ? REPO_ + PAGES_ + pageName : REPO_ + "/" + pageName;
  window.location.href = url;
};

// ===============================================
// User Display & Auth
// ===============================================
function drawUser() {
  const container = document.createElement("div");
  container.classList.add("active-user");

  const username = getActiveUser();

  const link = document.createElement("a");
  link.id = "username";
  link.href = "#";  // No real navigation – we'll handle click below
  link.textContent = username;
  link.style.cursor = "pointer";  // Make it look clickable
  link.title = "Click to logout";

  // Add click handler for logout confirmation
  link.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default link behavior

    if (confirm(`Are you sure you want to log out, ${username}?`)) {
      window.AuthAPI.logout()
        .then(() => {
          console.log("Logout successful");
          window.location.replace(REPO_ + '/pages/login.html');
        })
        .catch(() => {
          alert("Logout failed. Please try again.");
        });
    }
  });

  container.appendChild(link);
  document.body.appendChild(container);
}

function getActiveUser() {
  return localStorage.getItem('activeUsername') || "Guest";
}

// ===============================================
// Offline/Online Handling
// ===============================================
window.addEventListener('online', () => {
  console.log('Back online');
  document.body.classList.remove('offline-mode');
  // Optional: trigger sync if you have queued items
});

window.addEventListener('offline', () => {
  console.log('Offline mode');
  document.body.classList.add('offline-mode');
  notifyOffline();
});

function notifyOffline() {
  // Simple non-blocking toast (you can style better with CSS)
  const toast = document.createElement('div');
  toast.textContent = "Offline Mode – Changes will sync when reconnected.";
  toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

// ===============================================
// Dev Helpers (local only)
// ===============================================
const isDev = ['localhost', '127.0.0.1', '192.168.0.18'].includes(location.hostname);

if (isDev) {
  window.readLocal = (file = 'story.txt') => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`);
    xhr.onload = () => console.log(xhr.status === 200 ? xhr.responseText : 'Read failed');
    xhr.onerror = () => console.error('Read error');
    xhr.send();
  };

  window.writeLocal = (file = 'story.txt', text = '') => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`);
    xhr.onload = () => console.log(xhr.status === 200 ? 'Write OK' : 'Write failed');
    xhr.onerror = () => console.error('Write error');
    xhr.send(text);
  };
}
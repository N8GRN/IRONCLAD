// js/app.js - IRONCLAD CRM PWA - Main Application Logic
// Expects: modules.js loaded first (provides window.FireDB, window.requestNotificationPermissionAndGetFCMToken)
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
  drawUser();
  maybeRedirectToLogin();

  // Optional: If on a settings/notifications page with enable button
  const enableBtn = document.getElementById('enableNotificationsButton');
  if (enableBtn && window.requestNotificationPermission) {
    enableBtn.addEventListener('click', window.requestNotificationPermission);
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
      window.location.replace(REPO_ + '/login.html'); // replace to avoid history clutter
    }, 800);
  }
}

// ===============================================
// Roof Facets - Applications Page
// ===============================================
const roofForm = document.querySelector('#roof-form') || null;

function renderRoof(doc) {
  const li = document.createElement('li');
  const structureSpan = document.createElement('span');
  const facetSpan = document.createElement('span');
  const cross = document.createElement('div');

  li.setAttribute('data-id', doc.id);
  structureSpan.textContent = doc.data().structure || 'House';
  facetSpan.textContent = doc.data().facet || 'Unnamed Facet';
  cross.textContent = '×';
  cross.className = "close";

  li.append(structureSpan, facetSpan, cross);
  roofForm?.appendChild(li);

  cross.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = e.target.parentElement.getAttribute('data-id');
    db.collection('roof_facets').doc(id).delete().catch(err => {
      console.error('Delete failed:', err);
      alert('Failed to delete facet. Check connection.');
    });
  });
}

if (roofForm) {
  roofForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const structure = roofForm.structure.value.trim() || "House";
      const facet = roofForm.facet.value.trim() || `Facet #${roofForm.querySelectorAll('li').length + 1}`;

      await db.collection('roof_facets').add({
        structure,
        facet,
        createdAt: new Date()
      });

      roofForm.reset();
    } catch (err) {
      console.error('Error adding roof facet:', err);
      alert('Could not save facet — are you online?');
    }
  });

  // Real-time listener with error handling
  db.collection('roof_facets').onSnapshot(snapshot => {
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
    console.error('Roof facets snapshot error:', err);
  });
}

// ===============================================
// Facet Details - Structure Page
// ===============================================
const facetForm = document.querySelector('#facet-form') || null;

function renderStructure() {
  if (!facetForm) return;

  const structureEl = facetForm.querySelector("#structure");
  const facetEl = facetForm.querySelector("#facet");
  const typeEl = facetForm.querySelector("[name='type']");     // assuming <select name="type">
  const pitchEl = facetForm.querySelector("[name='pitch']");
  const layersEl = facetForm.querySelector("[name='layers']");
  const sheathingEl = facetForm.querySelector("[name='sheathing']");

  let progress = JSON.parse(localStorage.getItem("progress") || '{"x":0,"y":0}');
  let currentIndex = progress.x;

  db.collection('roof_facets').onSnapshot(snapshot => {
    try {
      const docs = snapshot.docs;
      const total = docs.length;
      if (total === 0) return;

      // Cycle through facets
      currentIndex = (currentIndex + 1) % total;
      const currentDoc = docs[currentIndex];
      const data = currentDoc.data();

      structureEl.textContent = data.structure || 'Unknown';
      facetEl.textContent = data.facet || 'Unnamed';

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

if (facetForm) {
  renderStructure();

  facetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.submitter;
    if (!submitBtn) return;

    submitBtn.disabled = true;
    setTimeout(() => { submitBtn.disabled = false; }, 3000); // rate limit

    try {
      // Assuming you store the current facet ID somewhere, e.g. data-current-id on form
      const currentId = facetForm.dataset.currentId || null; // Add logic to set this if needed
      if (!currentId) {
        console.warn('No current facet ID set');
        return;
      }

      await db.collection('roof_facets').doc(currentId).update({
        type: facetForm.type?.value || '',
        pitch: facetForm.pitch?.value || '',
        layers: facetForm.layers?.value || '',
        sheathing: facetForm.sheathing?.value || '',
        updatedAt: new Date()
      });

      console.log('Facet updated successfully');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to save facet details.');
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

  const link = document.createElement("a");
  link.id = "username";
  link.href = REPO_ + PAGES_ + "/login.html";
  link.textContent = getActiveUser();

  container.appendChild(link);
  document.body.appendChild(container);
}

function getActiveUser() {
  return localStorage.getItem('userName') || "Guest";
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
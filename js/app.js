// js/app.js - Main App Logic for IRONCLAD CRM
// Global functions for navigation, test mode, PDF print

console.log('[app.js] app.js loaded');

// ───────────────────────────────────────────────
// Global Navigation Helpers (for onclicks in HTML)
 // ───────────────────────────────────────────────

window.goToPage = function(page) {
  window.navigate(page.replace('.html', ''));
};

// ───────────────────────────────────────────────
// Test Mode Toggle (called from home page)
 // ───────────────────────────────────────────────

window.initToggleSwitch = function() {
  console.log('[app.js] initToggleSwitch called');

  const toggle = document.getElementById('featureToggle');
  const status = document.getElementById('status');
  const message = document.getElementById('featureMessage');
  const printIco = document.getElementById('print-icon');

  if (!toggle) return;

  if (localStorage.getItem('TestMode') === 'true') {
    toggle.checked = true;
    status.textContent = 'On';
    message.innerHTML = 'The experimental feature is currently <strong style="color:green">enabled</strong>.';
    document.body.classList.add("tron-mode");
    printIco.style.display = "block";
  }

  toggle.addEventListener('change', function () {
    if (this.checked) {
      localStorage.setItem('TestMode', 'true');
      status.textContent = 'On';
      message.innerHTML = 'The experimental feature is currently <strong style="color:green">enabled</strong>.';
      document.body.classList.add("tron-mode");
      printIco.style.display = "block";
    } else {
      localStorage.setItem('TestMode', 'false');
      status.textContent = 'Off';
      message.innerHTML = 'The experimental feature is currently <strong>disabled</strong>.';
      document.body.classList.remove("tron-mode");
      printIco.style.display = "none";
    }
  });
};

// ───────────────────────────────────────────────
 // PDF Print Function (called from print icon)
 // ───────────────────────────────────────────────

window.savePageAsPDF = async function() {
  console.log('[app.js] savePageAsPDF called');

  const element = document.body;
  const fileName = window.prompt("Save file as:") || 'document.pdf';

  const opt = {
    margin: 0.5,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(element).save();
    console.log('PDF saved');
  } catch (err) {
    console.error('PDF failed:', err);
  }
};

window.initPrintIcon = function() {
  const printIcon = document.getElementById('print-icon');
  if (printIcon) {
    printIcon.addEventListener('click', window.savePageAsPDF);
  }
};

// ───────────────────────────────────────────────
// Auth State Listener (save FCM token on login)
// ───────────────────────────────────────────────
function initAuthListeners() {
  if (window.AuthAPI && window.AuthAPI.onAuthStateChanged) {
    window.AuthAPI.onAuthStateChanged((user) => {
      console.log('[app.js] Auth state changed:', user ? 'Logged in' : 'Logged out');
      if (user) {
        window.saveMessagingDeviceToken();
      } else {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          console.log('[app.js] User logged out - redirecting to login');
          window.navigate('/login');
        }
      }
    });
  } else {
    console.warn('[app.js] AuthAPI not ready yet - retrying in 500ms');
    setTimeout(initAuthListeners, 500);
  }
}
initAuthListeners();  // Call it
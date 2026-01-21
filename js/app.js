// js/app.js - Main app logic for IRONCLAD CRM

console.log('[app.js] app.js loaded');

// ───────────────────────────────────────────────
// Auth State Listener (wait for AuthAPI)
// ───────────────────────────────────────────────

function initAuthListener() {
  if (window.AuthAPI && typeof window.AuthAPI.onAuthStateChanged === 'function') {
    console.log('[app.js] AuthAPI ready - attaching onAuthStateChanged');
    window.AuthAPI.onAuthStateChanged((user) => {
      console.log('[app.js] Auth state changed:', user ? user.email : 'Logged out');
      if (user) {
        window.saveMessagingDeviceToken();
      }
      // Optional: redirect logic here if needed
    });
  } else {
    console.log('[app.js] Waiting for AuthAPI...');
    setTimeout(initAuthListener, 100);
  }
}

initAuthListener();

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
// Save as PDF
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

// ───────────────────────────────────────────────
// Print Icon
// ───────────────────────────────────────────────

window.initPrintIcon = function() {
  const printIcon = document.getElementById('print-icon');
  if (printIcon) {
    printIcon.addEventListener('click', savePageAsPDF);
  }
};
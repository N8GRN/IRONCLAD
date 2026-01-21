// js/router.js - Client-side router for IRONCLAD CRM

// Routes config
const routes = {
  '/': renderHome,
  '/home': renderHome,
  '/login': renderLogin,
  '/projects': renderProjects,
  '/application': renderApplication,
  '/newProject': renderNewProject,
  '/roofDefinitions': renderRoofDefinitions,
  '/calculator': renderCalculator,
  '*': renderNotFound
};

// Main router function
function navigate(path) {
  path = path.replace(/\/$/, '') || '/';
  history.pushState({}, '', path);
  const renderFn = routes[path] || routes['*'];
  renderFn();
}

// Handle back/forward
window.addEventListener('popstate', () => navigate(window.location.pathname));

// Initial load
document.addEventListener('DOMContentLoaded', () => navigate(window.location.pathname || '/'));

// Export for onclicks
window.navigate = navigate;

// ───────────────────────────────────────────────
// Render Functions (extracted from each HTML body)
// ───────────────────────────────────────────────

// Render Home
function renderHome() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <header>
      <a href="#" class="settings" onclick="navigate('/settings'); return false;"></a>
      <img src="/img/icons/logo.png">
      <h2>Project Manager</h2>
    </header>

    <main>
      <div class="button-space">
        <button class="wide-button" onclick="navigate('/projects')">My Projects</button>
        <button class="wide-button" onclick="navigate('/newProject')">New Project</button>
      </div>

      <img src="/img/background.png" alt="Background" style="margin:auto;">

      <p style="color: rgb(100, 100, 100);">
        Software <span id="sw-version">Version 4.1 • Updated January 2026</span><br>
        Written by Nathan Green
      </p>

      <img src="/img/icons/print.png" id="print-icon" onclick="savePageAsPDF()" style="
        height: 50px;
        width: 50px;
        right: 50px;
        display: block;
        position: absolute;
        bottom: 0;
        display: none;
      ">
    </main>

    <footer>
      <div class="toggle-container">
        <label class="switch">
          <input type="checkbox" id="featureToggle">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">Test Mode</span>
        <span class="status" id="status">Off</span>
      </div>

      <p id="featureMessage" style="margin-top: 2rem; font-size: 1.1rem; color: #555;">
        The experimental feature is currently <strong>disabled</strong>.
      </p>
    </footer>
  `;

  initToggleSwitch();
  initPrintIcon();
  updateSWVersion();
}

// Render Login
function renderLogin() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="login-container">
      <img src="/img/icons/icon-192x192.png" alt="IRONCLAD Logo" class="logo">
      <h1>IRONCLAD CRM</h1>

      <!-- Register Section -->
      <div id="register-section" style="display: none ">
        <h3>Create Your Account</h3>
        <input type="text" id="registerUsername" placeholder="Username (e.g., Nathan)" required />
        <input type="email" id="registerEmail" placeholder="Email Address" required />
        <input type="password" id="registerPassword" placeholder="Password (6+ characters)" required />
        <button id="registerBtn">Register</button>
        <div class="small-link" id="switchToLogin">I already have an account</div>
      </div>

      <!-- Login Section -->
      <div id="login-section" style="margin-top: 2rem;">
        <h3>Sign In</h3>
        <input type="email" id="loginEmail" placeholder="Email Address" required />
        <input type="password" id="loginPassword" placeholder="Password" required />
        <div class="button-group">
          <button id="loginBtn">Sign In</button>
          <button id="forgotPasswordBtn">Forgot?</button>
        </div>
        <div class="small-link" id="switchToRegister">New here? Create an account</div>
      </div>

      <p id="authMessage"></p>
    </div>
  `;

  initLoginPage();
}

// Init login page (auth handlers)
function initLoginPage() {
  const registerUsername = document.getElementById('registerUsername');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const registerBtn = document.getElementById('registerBtn');

  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const forgotBtn = document.getElementById('forgotPasswordBtn');

  const messageEl = document.getElementById('authMessage');
  const registerSection = document.getElementById('register-section');
  const loginSection = document.getElementById('login-section');
  const switchLink = document.getElementById('switchToRegister');
  const switchLink2 = document.getElementById('switchToLogin');

  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#ff4444' : '#44ff44';
    messageEl.style.fontWeight = 'bold';
  }

  // Register handler
  registerBtn.addEventListener('click', async () => {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!username || !email || !password) {
      showMessage('Please fill in username, email, and password.', true);
      return;
    }

    registerBtn.disabled = true;
    showMessage('Creating your account...');

    const result = await window.AuthAPI.register(email, password, username);

    registerBtn.disabled = false;

    if (result.success) {
      showMessage(`Welcome, ${username}! Redirecting...`, false);
      setTimeout(() => {
        window.location.href = '/pages/projects.html';
      }, 1500);
    } else {
      showMessage(result.message || 'Registration failed.', true);
    }
  });

  // Login handler
  loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showMessage('Please enter email and password.', true);
      return;
    }

    loginBtn.disabled = true;
    showMessage('Signing in...');

    const result = await window.AuthAPI.login(email, password);

    loginBtn.disabled = false;

    if (result.success) {
      showMessage('Welcome back! Redirecting...', false);
      setTimeout(() => {
        window.location.href = '/pages/home.html';
      }, 1500);
    } else {
      showMessage(result.message || 'Login failed.', true);
    }
  });

  // Forgot password
  forgotBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim() || prompt('Enter your email:');
    if (!email) return;

    showMessage('Sending reset link...');
    const result = await window.AuthAPI.resetPassword(email);
    //showMessage('Reset email sent! Check your inbox (including spam/junk folder).', false);
    showMessage(result.message || 'Check your email.', !result.success);
  });

  // Simple toggle between login/register (optional UX)
  switchLink.addEventListener('click', () => {
    registerSection.style.display = registerSection.style.display === 'none' ? 'block' : 'none';
    loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
  });

  switchLink2.addEventListener('click', () => {
    registerSection.style.display = registerSection.style.display === 'none' ? 'block' : 'none';
    loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
  });

  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) reg.update(); // Force check for new SW
  });
}

// Render Projects View (full content from your projects.html)
function renderProjects() {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  root.innerHTML = `
    <header>
      <img src="/img/icons/logo.png">
      <h2>My Projects</h2>
    </header>

    <main>
      <button id="openProjectModal" onclick="showProjectFormWithNextProject()" class="wide-button">New Project</button>
      <br>
      <div id="projects-list" class="pseudo-table">
        <div class="row header">
          <span>Project #</span>
          <span>Customer Name</span>
          <span>Application</span>
          <span>Owner</span>
          <span>Lead</span>
          <span>Status</span>
          <span>Price</span>
          <span class="icon-column"></span>
          <span class="icon-column"></span>
        </div>
        <span id="loading-message" style="padding: 10px;">Loading projects...</span>
      </div>


    </main>

    <footer>
      <div class="button-space">
        <button onclick="navigate('/home')" class="wide-button">Home</button>
      </div>
    </footer>

    <!-- Modal Dialog  -->
    <div id="projectModal" class="project-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1" style="display: none;">
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div id="projectForms" class="navigation-ribbon">
          <span class="active" onclick="showForm(this, 'projectForm')">General</span><span onclick="showForm(this, 'contactForm')">Contact</span><span onclick="showForm(this, 'calculatorForm')">Calculator</span><span onclick="toggleRibbonView(this)">↕</span>
        </div>

        <!-- Project General -->
        <form id="projectForm" style="display:flex">
          <button class="close-btn" type="button" aria-label="Close">✕</button>
          <h2>Add New Project</h2>
          <input type="text" id="projectNumber" placeholder="Project Number" required>
          <input type="text" id="customerName" placeholder="Customer Name" required>
          <input type="text" id="application" placeholder="Application">
          <input type="text" id="owner" placeholder="Owner">
          <input type="text" id="lead" placeholder="Lead">
          <input type="text" id="status" placeholder="Status">
          <input type="text" id="price" placeholder="$ Price">
          <div class="button-space">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>

        <!-- Customer Information -->
        <form id="contactForm" style="display:none">
          <button class="close-btn" type="button" aria-label="Close">✕</button>
          <h2>Customer Information</h2>
          <input type="text" id="projectNumber" placeholder="Project Number" required>
          <input type="text" id="customerName" placeholder="Customer Name" required>
          <input type="text" id="application" placeholder="Application">

          <div class="button-space">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>

        <!-- Calculator -->
        <form id="calculatorForm" style="display:none">
          <button class="close-btn" type="button" aria-label="Close">✕</button>
          <h2>Calculator</h2>
          <input type="text" id="projectNumber" placeholder="Project Number" required>
          <input type="text" id="customerName" placeholder="Customer Name" required>
          <input type="text" id="application" placeholder="Application">

          <div class="button-space">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  initProjectsPage();
}

// Re-attach projects page logic (modal, form submit, displayProjects)
function initProjectsPage() {
  console.log('[router.js] initProjectsPage - DOM ready, calling displayProjects');

  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const closeButton = modal.querySelector('.close-btn');
  const cancelButton = modal.querySelector('.cancel-btn');

  const closeModal = () => modal.style.display = 'none';

  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
  });

  const form = document.getElementById('projectForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    let btnSubmit = e.submitter;

    if (btnSubmit.innerText === "Save") {
      window.addNewProject();
    } else {
      let id = btnSubmit.getAttribute('data-id');
      window.editProject(id);
    }

    const projectData = Object.fromEntries(new FormData(form));
    console.log('Saving project:', projectData);

    btnSubmit.innerText = "Save";
    btnSubmit.setAttribute("data-id", "");
    closeModal();
  });

  // Call displayProjects now that DOM is rendered
  if (window.displayProjects) {
    window.displayProjects();
  } else {
    console.error('[router.js] displayProjects not found');
  }
}

// Render Application View (full content from your application.html)
function renderApplication() {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  root.innerHTML = `
    <header>
      <img src="/img/icons/logo.png" alt="IRONCLAD CRM Logo">
      <h2>Applications</h2>
    </header>

    <main>
      <!-- Toggle Switch - Roof -->
      <div class="toggle-container full">
        <label class="switch">
          <input type="checkbox" id="roofInclude" data-target="roof-form">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">Roof</span>
        <span class="status">Not Included</span>
      </div>

      <div class="application-content" id="roof-form" style="visibility:hidden;height:0;">
        <form>
          <input type="text" name="structure" placeholder="Structure Name">
          <input type="text" name="section" placeholder="Section">
          <button>Add Section</button>
        </form>
      </div>

      <!-- Toggle Switch - Siding -->
      <div class="toggle-container full">
        <label class="switch">
          <input type="checkbox" id="sidingInclude">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">Siding</span>
        <span class="status">Not Included</span>
      </div>

      <!-- Toggle Switch - Gutters -->
      <div class="toggle-container full">
        <label class="switch">
          <input type="checkbox" id="gutterInclude">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">Gutters</span>
        <span class="status">Not Included</span>
      </div>

      <p style="color: rgb(100, 100, 100);">
        Version 1.0 • Updated November 2025<br>
        Written by Nathan Green
      </p>
    </main>

    <footer>
      <div class="bottom-nav">
        <button onclick="navigate('/newProject')" class="wide-button">◄ Back</button>
        <button onclick="navigate('/calculator')" class="wide-button">Next ►</button>
      </div>
    </footer>
  `;

  initApplicationToggles();
}

// Re-attach toggle switch logic for application page
function initApplicationToggles() {
  const switches = document.querySelectorAll('.switch');
  switches.forEach(lbl => {
    let cb = lbl.firstElementChild;
    let status = lbl.parentNode.querySelector(".status");

    showHideContent(cb.getAttribute("data-target"));

    cb.addEventListener('change', function (evt) {
      let $this = evt.target;
      if ($this.checked) {
        localStorage.setItem($this.id, 'true');
        status.textContent = 'Included';
        showHideContent($this.getAttribute('data-target'), true);
      } else {
        localStorage.setItem($this.id, 'false');
        status.textContent = 'Not Included';
        showHideContent($this.getAttribute('data-target'), false);
      }
    });
  });
}

// Render New Project View (full content from your newProject.html)
function renderNewProject() {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  root.innerHTML = `
    <header>
      <img src="/img/icons/logo.png" alt="IRONCLAD CRM Logo">
      <h2>New Project</h2>
    </header>

    <main>
      <table class="col25">
        <tbody>
          <tr>
            <th colspan="2">Contact Information</th>
          </tr>
          <tr>
            <td>Customer Name</td>
            <td><input></td>
          </tr>
          <tr>
            <td>Street</td>
            <td><input></td>
          </tr>
          <tr>
            <td>City</td>
            <td><input></td>
          </tr>
          <tr>
            <td>Phone Number</td>
            <td><input></td>
          </tr>
          <tr>
            <td>Email</td>
            <td><input></td>
          </tr>
        </tbody>
      </table>
      <br>
      <br>
      <table class="col25">
        <tbody>
          <tr>
            <th colspan="2">Project Summary</th>
          </tr>
          <tr>
            <td>Structures</td>
            <td><input></td>
          </tr>
          <tr>
            <td>Stories</td>
            <td><input></td>
          </tr>
        </tbody>
      </table>
      <br>
      <br>
      <table id="special-notes">
        <tr>
          <th>Notes</th>
        </tr>
        <tr>
          <td><textarea></textarea></td>
        </tr>
      </table>

      <p>This is a lightweight Progressive Web App built specifically for iPad. It works offline, can be added to your home screen, and feels just like a native app.</p>
      <p>Version 3.3 • Updated January 2026</p>
    </main>

    <footer>
      <div class="bottom-nav">
        <button onclick="navigate('/home')" class="wide-button">◄ Back</button>
        <button onclick="navigate('/application')">Next ►</button>
      </div>
    </footer>
  `;
}

// Render Roof Definitions View (full content from your roofDefinitions.html)
function renderRoofDefinitions() {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  root.innerHTML = `
    <header>
      <img src="/img/icons/logo.png" alt="IRONCLAD CRM Logo">
      <h2>Structure</h2>
    </header>

    <main>
      <div class="application-content">
        <form id="template">
          <table>
            <tbody>
              <tr>
                <th><span id="structure">Structure</span></th>
                <th><span id="section">Section</span></th>
              </tr>
              <tr>
                <td><span>Type</span></td>
                <td><select name="type">
                    <option>Shingle</option>
                    <option>Metal</option>
                    <option>Flat</option>
                </select></td>
              </tr>
              <tr>
                <td><span>Level</span></td>
                <td><select name="level">
                    <option>1-Story</option>
                    <option>2-Story</option>
                    <option>3-Story</option>
                </select></td>
              </tr>
              <tr>
                <td><span>Size (sq.)</span></td>
                <td><input name="size" placeholder="0" type="number"></td>
              </tr>
              <tr>
                <td><span>Pitch</span></td>
                <td><select name="pitch">
                    <option>0 - 2/12</option>
                    <option>2/12 - 3/12</option>
                    <option>4/12 - 7/12</option>
                    <option>8/12 - 9/12</option>
                    <option>10/12 - 11/12</option>
                    <option>12/12 - 13/12</option>
                </select></td>
              </tr>
              <tr>
                <td><span>Tearoff</span></td>
                <td><select name="layers">
                    <option>None</option>
                    <option>1-Layer</option>
                    <option>2-Layer</option>
                    <option>3-Layer</option>
                    <option>4-Layer</option>
                    <option>5-Layer</option>
                </select></td>
              </tr>
              <tr>
                <td><span>Sheathing</span></td>
                <td><select name="sheathing">
                    <option>Wood Board</option>
                    <option>OSB / Plywood</option>
                </select></td>
              </tr>
            </tbody>
          </table>
        </form>
        <br><br>
      </div>

      <p style="color: rgb(100, 100, 100);">Use the form(s) below to configure each of the structures/sections defined in the previous screen</p>
    </main>

    <footer>
      <div class="bottom-nav">
        <button onclick="navigate('/calculator')">◄ Back</button>
        <button onclick="navigate('/home')">Next ►</button>
      </div>
    </footer>
  `;

  initRoofDefinitionsPage();
}

// Re-attach roofDefinitions page logic (dynamic form cloning from roof_sections)
function initRoofDefinitionsPage() {
  const mainDiv = document.querySelector('main');
  if (!mainDiv) return;

  const originalForm = document.querySelector('#template')?.parentElement;
  if (!originalForm) return;

  window.FireDB.onSnapshot("roof_sections", (snapshot) => {
    const changes = snapshot.docChanges();
    changes.forEach(change => {
      cloneForm(change.doc.id, change.doc.data().structure, change.doc.data().section);
    });

    originalForm.parentNode.removeChild(originalForm);
  });
}

// Clone form helper (from roofDefinitions.html)
function cloneForm(name, structure, section) {
  const originalForm = document.querySelector('#template')?.parentElement;
  if (!originalForm) return;

  const clonedForm = originalForm.cloneNode(true);
  clonedForm.id = name;

  const headers = clonedForm.querySelectorAll('th');
  if (headers[0]) headers[0].innerText = structure;
  if (headers[1]) headers[1].innerText = section;

  document.querySelector('main').appendChild(clonedForm);
}

// Update SW version display when broadcast received from service worker
function updateSWVersion() {
  const swVersionEl = document.getElementById('sw-version');
  if (!swVersionEl) {
    console.log('[router.js] #sw-version element not found - skipping version listener');
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_VERSION_UPDATE') {
      swVersionEl.textContent = event.data.version;
      console.log('[router.js] SW version updated to:', event.data.version);
    }
  });

  console.log('[router.js] updateSWVersion listener attached');
}

// Render Calculator View (full content from your calculator.html)
function renderCalculator() {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  root.innerHTML = `
    <header>
      <img src="/img/icons/logo.png" alt="IRONCLAD CRM Logo">
      <h2>Project Information</h2>
    </header>

    <main>
      <form id="project-form">
        <table>
          <tbody>
            <tr><th><span>Item</span></th><th><span>Color / Style</span></th></tr>
            <tr><td><span>Shingle</span></td><td><select name="shingle"></select></td></tr>
            <tr><td><span>Starter</span></td><td><select name="starter"></select></td></tr>
            <tr><td><span>Drip Edge</span></td><td><select name="drip_edge"></select></td></tr>
            <tr><td><span>Gutter Apron</span></td><td><select name="gutter_apron"></select></td></tr>
            <tr><td><span>Flashing</span></td><td><select name="flashing"></select></td></tr>
            <tr><td><span>Pipe Boots</span></td><td><select name="pipe_boots"></select></td></tr>
            <tr><td><span>Broan Vents</span></td><td><select name="broan_vents"></select></td></tr>
            <tr><td><span>Chimney</span></td><td><select name="chimney"></select></td></tr>
            <tr><td><span>Wall Flashing</span></td><td><select name="wall_flashing"></select></td></tr>
          </tbody>
        </table>
      </form>

      <!-- Toggle Partial Roof -->
      <div class="toggle-container full">
        <label class="switch">
          <input type="checkbox" id="roofPartial" data-target="roof-partial">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">Partial Roof</span>
        <span class="status">Not Included</span>
      </div>

      <!-- Toggle Repair Roof -->
      <div class="toggle-container full">
        <label class="switch">
          <input type="checkbox" id="roofRepair" data-target="roof-repair">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">Repair</span>
        <span class="status">Not Included</span>
      </div>

      <p style="color: rgb(100, 100, 100);">
        Version 1.0 • Updated November 2025<br>
        Written by Nathan Green
      </p>
    </main>

    <footer>
      <div class="bottom-nav">
        <button onclick="navigate('/application')">◄ Back</button>
        <button onclick="navigate('/roofDefinitions')">Next ►</button>
      </div>
    </footer>
  `;

  initCalculatorPage();
}

// Re-attach calculator page logic (populate selects, toggle switches)
function initCalculatorPage() {
  const form = document.getElementById('project-form');
  if (!form) return;

  // Populate selects from material.json
  fetch('/data/material.json')
    .then(response => response.json())
    .then(data => {
      // Shingles
      data.Shingles.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.shingle.appendChild(option);
      });
      // Starter
      data.Starter.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.starter.appendChild(option);
      });
      // Drip Edge
      data.DripEdge.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.drip_edge.appendChild(option);
      });
      // Gutter Apron
      data.GutterApron.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.gutter_apron.appendChild(option);
      });
      // Flashing
      data.Flashing.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.flashing.appendChild(option);
      });
      // Pipe Boots
      data.PipeBoots.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.pipe_boots.appendChild(option);
      });
      // Broan Vents
      data.BroanVents.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.broan_vents.appendChild(option);
      });
      // Chimney
      data.Chimney.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.chimney.appendChild(option);
      });
      // Wall Flashing
      data.WallFlashing.forEach(item => {
        let option = document.createElement("option");
        option.text = item.name;
        form.wall_flashing.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching material.json:', error));

  // Re-attach toggle switches
  const switches = document.querySelectorAll('.switch');
  switches.forEach(lbl => {
    let cb = lbl.firstElementChild;
    let status = lbl.parentNode.querySelector(".status");

    showHideContent(cb.getAttribute("data-target"));

    cb.addEventListener('change', function (evt) {
      let $this = evt.target;
      if ($this.checked) {
        localStorage.setItem($this.id, 'true');
        status.textContent = 'Included';
        showHideContent($this.getAttribute('data-target'), true);
      } else {
        localStorage.setItem($this.id, 'false');
        status.textContent = 'Not Included';
        showHideContent($this.getAttribute('data-target'), false);
      }
    });
  });
}

// Render Not Found
function renderNotFound() {
  const root = document.getElementById('app-root');
  root.innerHTML = `<h1>404 - Page Not Found</h1>`;
}
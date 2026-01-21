// js/projects.js - Project Management Page Logic
// Called by router.js when /projects is rendered
// Uses window.FirestoreAPI from modules.js (corrected from FireDB)

console.log('[projects.js] projects.js loaded');

// ───────────────────────────────────────────────
// Global Functions (exposed on window for router.js and HTML onclick)
// ───────────────────────────────────────────────

window.addNewProject = async function() {
  console.log('[projects.js] addNewProject called');

  const projectNumberEl = document.getElementById('projectNumber');
  const customerEl      = document.getElementById('customerName');
  const applicationEl   = document.getElementById('application');
  const ownerEl         = document.getElementById('owner');
  const leadEl          = document.getElementById('lead');
  const statusEl        = document.getElementById('status');
  const priceEl         = document.getElementById('price');

  if (!projectNumberEl) {
    console.error('Project form fields not found');
    alert('Form not loaded properly. Please refresh.');
    return;
  }

  const projectNum = projectNumberEl.value.trim();

  if (!projectNum) {
    alert("Project Number cannot be empty!");
    return;
  }

  try {
    await window.FirestoreAPI.addDoc(collection(window.FirestoreAPI.db, "projects"), {
      project: projectNum,
      application: applicationEl?.value.trim() || '',
      customer: customerEl?.value.trim() || '',
      owner: ownerEl?.value.trim() || '',
      lead: leadEl?.value.trim() || '',
      status: statusEl?.value.trim() || '',
      price: priceEl?.value.trim() || '',
      createdAt: new Date()
    });

    console.log('Project added successfully');
  } catch (e) {
    console.error("Error adding project:", e);
    alert("Error adding project: " + e.message);
  }
};

window.editProject = async function(id) {
  if (!id) return;

  console.log('[projects.js] editProject called for ID:', id);

  try {
    await window.FirestoreAPI.updateDoc(doc(window.FirestoreAPI.db, "projects", id), {
      project: document.getElementById('projectNumber')?.value.trim() || '',
      application: document.getElementById('application')?.value.trim() || '',
      customer: document.getElementById('customerName')?.value.trim() || '',
      owner: document.getElementById('owner')?.value.trim() || '',
      lead: document.getElementById('lead')?.value.trim() || '',
      status: document.getElementById('status')?.value.trim() || '',
      price: document.getElementById('price')?.value.trim() || '',
      updatedAt: new Date()
    });

    console.log('Project updated successfully');
  } catch (e) {
    console.error("Error updating project:", e);
    alert("Error updating project: " + e.message);
  }
};

window.deleteProject = async function(id) {
  if (!confirm("Are you sure you want to delete this project?")) return;

  console.log('[projects.js] deleteProject called for ID:', id);

  try {
    await window.FirestoreAPI.deleteDoc(doc(window.FirestoreAPI.db, "projects", id));
    console.log('Project deleted');
  } catch (e) {
    console.error("Error deleting project:", e);
    alert("Error deleting project: " + e.message);
  }
};

window.loadThisProject = async function(projectId) {
  console.log('[projects.js] loadThisProject called for ID:', projectId);

  try {
    const projectSnap = await window.FirestoreAPI.getDoc(doc(window.FirestoreAPI.db, "projects", projectId));
    if (projectSnap.exists()) {
      const project = { id: projectSnap.id, ...projectSnap.data() };
      window.showProjectForm();
      window.populateProjectForm(project);
    } else {
      console.log(`Project with ID ${projectId} not found`);
    }
  } catch (e) {
    console.error("Error fetching project details:", e);
  }
};

window.populateProjectForm = function(project = {}) {
  console.log('[projects.js] populateProjectForm called');

  const form = document.getElementById('projectForm');
  if (!form) return;

  const projectNumberEl   = document.getElementById('projectNumber');
  const customerNameEl    = document.getElementById('customerName');
  const applicationEl     = document.getElementById('application');
  const ownerEl           = document.getElementById('owner');
  const leadEl            = document.getElementById('lead');
  const statusEl          = document.getElementById('status');
  const priceEl           = document.getElementById('price');

  if (projectNumberEl)   projectNumberEl.value   = project.project   || getNextProjectNumber().toString();
  if (customerNameEl)    customerNameEl.value    = project.customer  || "";
  if (applicationEl)     applicationEl.value     = project.application || "";
  if (ownerEl)           ownerEl.value           = project.owner     || "";
  if (leadEl)            leadEl.value            = project.lead      || "";
  if (statusEl)          statusEl.value          = project.status    || "";
  if (priceEl)           priceEl.value           = project.price     || "";
};

window.showProjectForm = function() {
  const modal = document.getElementById('projectModal');
  if (modal) modal.style.display = 'flex';
};

window.showProjectFormWithNextProject = function() {
  window.showProjectForm();
  window.populateProjectForm({ project: getNextProjectNumber().toString() });
};

window.showFormAndPopulateProject = function(id) {
  window.showProjectForm();
  window.loadThisProject(id);
  const submitBtn = document.querySelector("#projectForm [type=submit]");
  if (submitBtn) {
    submitBtn.innerText = "Update";
    submitBtn.setAttribute("data-id", id);
  }
};

// ───────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────

function clearProjectList() {
  const projectList = document.getElementById("projects-list");
  if (!projectList) return;
  const rows = projectList.querySelectorAll(".row:not(.header)");
  rows.forEach(row => row.remove());
}

function getNextProjectNumber() {
  const projects = document.querySelectorAll(".project-number");
  let highestExisting = 10000;

  projects.forEach((project) => {
    let thisNumber = parseInt(project.innerText);
    if (thisNumber > highestExisting) highestExisting = thisNumber;
  });

  return highestExisting + 1;
}

// Sorting Algorithm
let lastSortColumn = -1;
let lastSortDirection = 1;

window.sortByField = function(columnIndex) {
  const projectList = document.getElementById("projects-list");
  if (!projectList) return;

  const rows = Array.from(projectList.querySelectorAll(".row"));

  const header = rows[0];
  const dataRows = rows.slice(1);

  document.body.setAttribute("data-sortIndex", columnIndex);

  let direction = 1;
  if (lastSortColumn === columnIndex) {
    direction = lastSortDirection * -1;
  }
  lastSortColumn = columnIndex;
  lastSortDirection = direction;

  dataRows.sort((a, b) => {
    const cellA = a.children[columnIndex];
    const cellB = b.children[columnIndex];

    let valueA = cellA ? cellA.textContent.trim() : "";
    let valueB = cellB ? cellB.textContent.trim() : "";

    if (columnIndex === 0) { // Project #
      valueA = parseInt(valueA) || 0;
      valueB = parseInt(valueB) || 0;
    } else if (columnIndex === 6) { // Price
      valueA = parseFloat(valueA.replace(/[$,]/g, '')) || 0;
      valueB = parseFloat(valueB.replace(/[$,]/g, '')) || 0;
    }

    let comparison = 0;
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      comparison = valueA - valueB;
    } else {
      comparison = valueA.localeCompare(valueB);
    }

    return comparison * direction;
  });

  projectList.innerHTML = '';
  projectList.appendChild(header);
  dataRows.forEach(row => projectList.appendChild(row));

  const headerSpans = header.querySelectorAll("span");
  headerSpans.forEach((span, i) => {
    span.classList.remove("sorted-asc", "sorted-desc");
    if (i === columnIndex) {
      span.classList.add(direction === 1 ? "sorted-asc" : "sorted-desc");
    }
  });
};

window.addSortListeners = function() {
  const headerRow = document.querySelector("#projects-list .row.header");
  if (!headerRow) return;

  const headerColumns = headerRow.querySelectorAll("span:not(.icon-column)");

  headerColumns.forEach((span, index) => {
    if (span._sortHandler) {
      span.removeEventListener("click", span._sortHandler);
    }

    const handler = () => window.sortByField(index);
    span._sortHandler = handler;

    span.addEventListener("click", handler);
    span.style.cursor = "pointer";
    span.title = `Click to sort by ${span.innerText.trim()}`;
  });
};

// ───────────────────────────────────────────────
// Main Display Function (called by router.js)
// ─────────────────────────────────────────────--

window.displayProjects = function() {
  console.log('[projects.js] displayProjects() started');

  const projectsListDiv = document.getElementById('projects-list');
  if (!projectsListDiv) {
    console.error('[projects.js] #projects-list element not found in DOM');
    return;
  }

  clearProjectList();

  projectsListDiv.innerHTML = `
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
  `;

  setTimeout(() => {
    function waitForFirestoreAPI(callback, attempts = 200, delay = 100) {
      if (window.FirestoreAPI && typeof window.FirestoreAPI.onSnapshot === 'function') {
        console.log('[projects.js] FirestoreAPI ready - attaching listener');
        callback();
      } else if (attempts > 0) {
        console.log('[projects.js] Waiting for FirestoreAPI... attempts left:', attempts);
        setTimeout(() => waitForFirestoreAPI(callback, attempts - 1, delay), delay);
      } else {
        console.error('[projects.js] TIMEOUT: FirestoreAPI never loaded after 20 seconds');
        projectsListDiv.insertAdjacentHTML('beforeend', '<p style="color: red;">Error: Firestore not available.</p>');
      }
    }

    waitForFirestoreAPI(() => {
      window.FirestoreAPI.onSnapshot(collection(window.FirestoreAPI.db, "projects"), (querySnapshot) => {
        try {
          console.log('[projects.js] onSnapshot fired:', {
            docsCount: querySnapshot.docs.length
          });

          const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          clearProjectList();

          document.getElementById("loading-message")?.remove();

          if (projects.length === 0) {
            projectsListDiv.insertAdjacentHTML('beforeend', '<p>No projects found. Add one above!</p>');
            return;
          }

          let projectsHtml = '';

          projects.forEach(project => {
            projectsHtml += `
              <div class="row" data-id="${project.id}" onclick="loadThisProject('${project.id}')">
                <span class="project-number">${project.project || '—'}</span>
                <span>${project.customer || '—'}</span>
                <span>${project.application || '—'}</span>
                <span>${project.owner || '—'}</span>
                <span>${project.lead || '—'}</span>
                <span>${project.status || '—'}</span>
                <span>${project.price || '—'}</span>
                <div class="icon-edit" title="Edit this project" onclick="showFormAndPopulateProject('${project.id}'); event.stopPropagation();"></div>
                <div class="icon-delete" title="Delete this project" onclick="deleteProject('${project.id}'); event.stopPropagation();"></div>
              </div>
            `;
          });

          projectsListDiv.insertAdjacentHTML('beforeend', projectsHtml);

          addSortListeners();

          const sortIndex = parseInt(document.body.getAttribute("data-sortIndex")) || 0;
          sortByField(sortIndex);

        } catch (e) {
          console.error("Snapshot processing error:", e);
          projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Error loading projects: ${e.message}</p>`);
        }
      }, (error) => {
        console.error("Snapshot listener error:", error);
        projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Real-time updates failed: ${error.message}</p>`);
      });
    });
  }, 150);
}
// js/projects.js - Project Management Page Logic
// Uses centralized FireDB from modules.js + direct Firestore imports

import {
  collection,
  onSnapshot,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

const db = window.FireDB; // ← Critical: comes from modules.js

const addProjectButton = document.getElementById('addProjectButton');
const projectsListDiv = document.getElementById('projects-list');
let initialLoad = true;

// Add a new project
async function addNewProject() {
  const projectNumberEl = document.getElementById('projectNumber');
  const customerEl     = document.getElementById('customerName');
  const applicationEl  = document.getElementById('application');
  const ownerEl        = document.getElementById('owner');
  const leadEl         = document.getElementById('lead');
  const statusEl       = document.getElementById('status');
  const priceEl        = document.getElementById('price');

  const projectNum = projectNumberEl.value.trim();

  if (!projectNum) {
    alert("Project Number cannot be empty!");
    return;
  }

  try {
    await addDoc(collection(db, "projects"), {
      project: projectNum,
      application: applicationEl.value.trim(),
      customer: customerEl.value.trim(),
      owner: ownerEl.value.trim(),
      lead: leadEl.value.trim(),
      status: statusEl.value.trim(),
      price: priceEl.value.trim(),
      createdAt: new Date()
    });

    // Optional: clear form fields after add
    // projectNumberEl.value = "";
    // customerEl.value = "";
    // etc.

    // No need to refresh manually - onSnapshot will handle
  } catch (e) {
    console.error("Error adding project:", e);
    alert("Error adding project: " + e.message);
  }
}

function clearProjectList() {
  const projectList = document.getElementById("projects-list");
  const rows = projectList.querySelectorAll(".row:not(.header)"); // Skip header
  rows.forEach(row => row.remove());
}

// Display all projects with real-time updates using onSnapshot
// [01.15.2026] Fails on iPad because...
// See rewrite below with 'setTimeout()'

/*function displayProjects() {
  // Clear initial list
  clearProjectList();
  projectsListDiv.innerHTML = projectsListDiv.innerHTML || '<div class="row header">...</div>'; // Preserve header if needed

  // Set up real-time listener
  onSnapshot(collection(db, "projects"), (querySnapshot) => {
    try {
      const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      clearProjectList(); // Clear before rebuild

      if (projects.length === 0) {
        projectsListDiv.insertAdjacentHTML('beforeend', '<p>No projects found. Add one above!</p>');
        return;
      }

      // Remove any stale loading message
      document.getElementById("loading-message")?.remove();

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

      projectsListDiv.insertAdjacentHTML('beforeend', projectsHtml + '<span id="loading-message"></span>');

      // Attach sort listeners after render
      addSortListeners();

      if (initialLoad) {
        sortByField(0);
        initialLoad = false;
      } else {
        const sortIndex = parseInt(document.body.getAttribute("data-sortIndex")) || 0;
        sortByField(sortIndex);
        sortByField(sortIndex); // Toggle twice to preserve direction
      }

    } catch (e) {
      console.error("Error in real-time projects update:", e);
      projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Error loading projects: ${e.message}</p>`);
    }
  }, (error) => {
    console.error("Snapshot listener error:", error);
    projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Real-time updates failed: ${error.message}</p>`);
  });
}*/

function displayProjects() {
  // Clear initial list
  clearProjectList();
  projectsListDiv.innerHTML = projectsListDiv.innerHTML || '<div class="row header">...</div>'; // Preserve header if needed

  // Set up real-time listener
  onSnapshot(collection(db, "projects"), (querySnapshot) => {
    try {
      const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      clearProjectList(); // Clear before rebuild

      if (projects.length === 0) {
        projectsListDiv.insertAdjacentHTML('beforeend', '<p>No projects found. Add one above!</p>');
        return;
      }

      // Remove any stale loading message
      document.getElementById("loading-message")?.remove();

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

      projectsListDiv.insertAdjacentHTML('beforeend', projectsHtml + '<span id="loading-message"></span>');

      // Attach sort listeners after render
      addSortListeners();

      if (initialLoad) {
        sortByField(0);
        initialLoad = false;
      } else {
        const sortIndex = parseInt(document.body.getAttribute("data-sortIndex")) || 0;
        sortByField(sortIndex);
        sortByField(sortIndex); // Toggle twice to preserve direction
      }

    } catch (e) {
      console.error("Error in real-time projects update:", e);
      projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Error loading projects: ${e.message}</p>`);
    }
  }, (error) => {
    console.error("Snapshot listener error:", error);
    projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Real-time updates failed: ${error.message}</p>`);
  });
}



// Update existing project
window.editProject = async (id) => {
  if (!id) return;

  try {
    const projectRef = doc(db, "projects", id);
    await updateDoc(projectRef, {
      project: document.getElementById('projectNumber')?.value.trim() || '',
      application: document.getElementById('application')?.value.trim() || '',
      customer: document.getElementById('customerName')?.value.trim() || '',
      owner: document.getElementById('owner')?.value.trim() || '',
      lead: document.getElementById('lead')?.value.trim() || '',
      status: document.getElementById('status')?.value.trim() || '',
      price: document.getElementById('price')?.value.trim() || '',
      updatedAt: new Date()
    });

    // No need to refresh - onSnapshot will handle
  } catch (e) {
    console.error("Error updating project:", e);
    alert("Error updating project: " + e.message);
  }
};

// Delete project
window.deleteProject = async (id) => {
  if (!confirm("Are you sure you want to delete this project?")) return;

  try {
    await deleteDoc(doc(db, "projects", id));
    // onSnapshot will auto-refresh
  } catch (e) {
    console.error("Error deleting project:", e);
    alert("Error deleting project: " + e.message);
  }
};

// Load single project for editing/view
window.loadThisProject = async (projectId) => {
  try {
    const projectSnap = await getDoc(doc(db, "projects", projectId));
    if (projectSnap.exists()) {
      const project = { id: projectSnap.id, ...projectSnap.data() };
      showProjectForm();
      populateProjectForm(project);
    } else {
      console.log(`Project with ID ${projectId} not found`);
    }
  } catch (e) {
    console.error("Error fetching project details:", e);
  }
};

// Form population (made safer)
window.populateProjectForm = function (project = {}) {
  const form = document.getElementById('projectForm');
  if (!form) return;

  form.projectNumber.value   = project.project   || getNextProjectNumber().toString();
  form.customerName.value    = project.customer  || "";
  form.application.value     = project.application || "";
  form.owner.value           = project.owner     || "";
  form.lead.value            = project.lead      || "";
  form.status.value          = project.status    || "";
  form.price.value           = project.price     || "";
};

// Modal Form
const modal = document.getElementById('projectModal');
const closeButton = modal.querySelector('.close-btn');
const cancelButton = modal.querySelector('.cancel-btn');
const form = document.getElementById('projectForm');

window.showProjectForm = function (id) {
  modal.style.display = 'flex'; // Or 'block'
  form.reset();
  modal.focus(); // For accessibility
};

window.showProjectFormWithNextProject = function () {
  showProjectForm();
  populateProjectForm({ project: getNextProjectNumber().toString() });
};

window.showFormAndPopulateProject = function(id) {
  showProjectForm();
  loadThisProject(id); // Fetch and populate
  // Change Button Function
  let submitBtn = form.querySelector("[type=submit]");
  submitBtn.innerText = "Update";
  submitBtn.setAttribute("data-id", id);
};

const closeModal = () => {
  modal.style.display = 'none';
};

closeButton.addEventListener('click', closeModal);
cancelButton.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop')?.addEventListener('click', closeModal); // Close on backdrop click

// Escape key close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let btnSubmit = e.submitter;
  
  if (btnSubmit.innerText === "Save") {
    addNewProject(); // <-- Save New Document
  } else {
    let id = btnSubmit.getAttribute('data-id');
    editProject(id); // <-- Update existing Document
  }
  
  const projectData = Object.fromEntries(new FormData(form));
  console.log('Saving project:', projectData);

  btnSubmit.innerText = "Save";
  btnSubmit.setAttribute("data-id", "");
  closeModal();
});

// Next Project Number
const getNextProjectNumber = function () {
  const projects = document.querySelectorAll(".project-number");
  let highestExisting = 10000; // lowest possible

  projects.forEach((project) => {
    let thisNumber = parseInt(project.innerText);
    if (thisNumber > highestExisting) {
      highestExisting = thisNumber;
    }
  });
  
  return highestExisting + 1;
};

// Sorting Algorithm
let lastSortColumn = -1;
let lastSortDirection = 1; // 1 = ascending, -1 = descending

window.sortByField = function(columnIndex) {
  const projectList = document.getElementById("projects-list");
  const rows = Array.from(projectList.querySelectorAll(".row")); // Convert to array

  // Separate header (first row) and data rows
  const header = rows[0];
  const dataRows = rows.slice(1);

  // Add columnIndex to body to auto-sort when documents are added/removed/changed
  document.body.setAttribute("data-sortIndex", columnIndex);

  // Determine sort direction: toggle if same column, otherwise default to ascending
  let direction = 1;
  if (lastSortColumn === columnIndex) {
    direction = lastSortDirection * -1; // toggle
  }
  lastSortColumn = columnIndex;
  lastSortDirection = direction;

  // Sort the data rows
  dataRows.sort((a, b) => {
    // Get the cell elements at the specified column index
    const cellA = a.children[columnIndex];
    const cellB = b.children[columnIndex];

    let valueA = cellA ? cellA.textContent.trim() : "";
    let valueB = cellB ? cellB.textContent.trim() : "";

    // Special handling for numeric columns
    if (columnIndex === 0) { // Project # (class="project-number")
      valueA = parseInt(valueA) || 0;
      valueB = parseInt(valueB) || 0;
    } else if (columnIndex === 6) { // Price column
      // Remove $ and commas, then parse as float
      valueA = parseFloat(valueA.replace(/[$,]/g, '')) || 0;
      valueB = parseFloat(valueB.replace(/[$,]/g, '')) || 0;
    }
    // For other columns (strings), use localeCompare for proper alphabetical sorting

    let comparison = 0;
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      comparison = valueA - valueB;
    } else {
      comparison = valueA.localeCompare(valueB);
    }

    return comparison * direction;
  });

  // Re-append in sorted order: header first, then sorted data rows
  projectList.innerHTML = ''; // Clear
  projectList.appendChild(header);
  dataRows.forEach(row => projectList.appendChild(row));

  // Optional: Visual feedback — add a class to the header to show sort direction
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
    // Clean up old listener if exists
    if (span._sortHandler) {
      span.removeEventListener("click", span._sortHandler);
    }

    const handler = () => sortByField(index);
    span._sortHandler = handler;

    span.addEventListener("click", handler);
    span.style.cursor = "pointer";
    span.title = `Click to sort by ${span.innerText.trim()}`;
  });
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  if (addProjectButton) {
    addProjectButton.addEventListener('click', addNewProject);
  }
  displayProjects(); // Initial load and setup real-time listener
});





// [01.14.2026] Toggle between forms
// ------------------------------------------------------------------------------
/*const modalContent = document.querySelector('.modal-content');*/
window.showForm = function (el, formId) {
    const modalContent = document.querySelector('.modal-content');
    var forms = modalContent.querySelectorAll('form');

    showActiveElement(el);
    forms.forEach(form => {
        if (form.id !== formId) {
            form.style.display = 'none';
        } else {
            form.style.display = 'flex';
            form.style.justifyContent = 'center';
        }
    });

}

// make calling element active
var showActiveElement = function(el){
    if (el) {
        const siblings = Array.from(el.parentElement.children);

        siblings.forEach(sibling => {
            sibling.classList.toggle("active", false);
        });

        el.classList.toggle("active", true);
    }
}

window.toggleRibbonView = function (el) {
    showActiveElement(el);
    
    el.parentElement.classList.toggle("alt")
}

// ------------------------------------------------------------------------------
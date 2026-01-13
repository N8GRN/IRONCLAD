// js/projects.js - Project Management Page Logic
// Uses centralized FireDB from modules.js + direct Firestore imports

import {
  collection,
  getDocs,
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

    // Optional: clear form fields
    // projectNumberEl.value = "";
    // customerEl.value = ""; etc.

    displayProjects(); // Refresh list
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

// Display all projects
async function displayProjects() {
  clearProjectList();
  projectsListDiv.innerHTML = projectsListDiv.innerHTML || '<div class="row header">...</div>'; // Preserve header if needed

  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    console.error("Error loading projects:", e);
    projectsListDiv.insertAdjacentHTML('beforeend', `<p style="color: red;">Error loading projects: ${e.message}</p>`);
  }
}

// Update existing project
window.editProject = async (id) => {
  const projectNumberEl = document.getElementById('projectNumber');
  // ... get other elements the same way

  if (!id) return;

  try {
    const projectRef = doc(db, "projects", id);
    await updateDoc(projectRef, {
      project: projectNumberEl.value.trim(),
      application: document.getElementById('application').value.trim(),
      customer: document.getElementById('customerName').value.trim(),
      owner: document.getElementById('owner').value.trim(),
      lead: document.getElementById('lead').value.trim(),
      status: document.getElementById('status').value.trim(),
      price: document.getElementById('price').value.trim(),
      updatedAt: new Date()
    });

    displayProjects();
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
    displayProjects();
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

// ... (keep the rest of your modal, sorting, getNextProjectNumber, event listeners, etc. unchanged)
// Just make sure to remove any remaining references to getDocumentById, addDocument, etc.

document.addEventListener('DOMContentLoaded', () => {
  if (addProjectButton) {
    addProjectButton.addEventListener('click', addNewProject);
  }
  displayProjects(); // Initial load
});
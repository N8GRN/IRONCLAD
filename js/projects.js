// /js/app.js - For the page that manages 'projects'

// Import specific functions from your firebase-service
import { addDocument, getCollectionData, updateDocument, deleteDocument, getDocumentById } from './firebase-service.js';



const addProjectButton = document.getElementById('addProjectButton');
const projectsListDiv = document.getElementById('projects-list');

// Function to add a new project
async function addNewProject() {

    const projectNumber = document.getElementById('projectNumber');
    const customer = document.getElementById('customerName');
    const application = document.getElementById('application');
    const owner = document.getElementById('owner');
    const lead = document.getElementById('lead');
    const status = document.getElementById('status');
    const price = document.getElementById('price');
    const project = projectNumber.value.trim();

    if (project === "") {
        alert("Project Number cannot be empty!");
        return;
    }

    try {
        // Use the generic addDocument function, specifying 'projects' collection
        await addDocument("projects", {
            project: projectNumber.value.trim(),
            application: application.value.trim(),
            customer: customer.value.trim(),
            owner: owner.value.trim(),
            lead: lead.value.trim(),
            status: status.value.trim(),
            price: price.value.trim()
        });
        //project.value = ""; // Clear input field  // <-- come back to this
        displayProjects(); // Refresh the list
    } catch (e) {
        alert("Error adding project: " + e.message);

    }
}

function clearProjectList() {
    var projectList = document.getElementById("projects-list");
    var projects = projectList.querySelectorAll(".row");
    for (let i = 1; i < projects.length; i++) {
        projects[i].parentNode.removeChild(projects[i]);
    }
}

// Function to display existing projects
async function displayProjects() {
    clearProjectList();
    try {
        const projects = await getCollectionData("projects");

        if (projects.length === 0) {
            projectsListDiv.innerHTML = '<p>No projects found. Add one above!</p>';
            return;
        }
        
        let loadingMessage = document.getElementById("loading-message");
        loadingMessage.parentElement.removeChild(loadingMessage);
        let projectsHtml = projectsListDiv.innerHTML; // Keeps the header row

        projects.forEach((project) => {
            projectsHtml += `
                <div class="row" data-id="${project.id}" onclick="loadThisProject('${project.id}')">
                    <span class="project-number">${project.project}</span>
                    <span>${project.customer}</span>
                    <span>${project.application}</span>
                    <span>${project.owner}</span>
                    <span>${project.lead}</span>
                    <span>${project.status}</span>
                    <span>${project.price}</span>
                    <div class="icon-edit" title="Edit this project" onclick="showFormAndPopulateProject('${project.id}')"></div>
                    <div class="icon-delete" title="Delete this project" onclick="deleteProject('${project.id}')"></div>
                </div>
            `;
        });

        projectsHtml += '<span id="loading-message"></span>';
        projectsListDiv.innerHTML = projectsHtml;

        // CRITICAL: Attach sort listeners ONLY AFTER the table is fully rendered
        addSortListeners();

    } catch (e) {
        projectsListDiv.innerHTML = '<p style="color: red;">Error loading projects: ' + e.message + '</p>';
    }
}

// Example edit and delete functions
window.editProject = async (id) => {
    const projectNumber = document.getElementById('projectNumber');
    const customer = document.getElementById('customerName');
    const application = document.getElementById('application');
    const owner = document.getElementById('owner');
    const lead = document.getElementById('lead');
    const status = document.getElementById('status');
    const price = document.getElementById('price');

    if (id) { // An existing document ID was passes, try updating before creating a new document
        console.log("Hey " + id + "!");
        try {
            // Use the generic addDocument function, specifying 'projects' collection
            // HERE
            await updateDocument("projects", id, {
                project: projectNumber.value.trim(),
                application: application.value.trim(),
                customer: customer.value.trim(),
                owner: owner.value.trim(),
                lead: lead.value.trim(),
                status: status.value.trim(),
                price: price.value.trim()
            });
            displayProjects();
            return;
        } catch (e) {
            alert("Error updating project: " + e.message);
        }
    }

};

window.deleteProject = async (id) => {
    if (confirm("Are you sure you want to delete this project?")) {
        try {
            await deleteDocument("projects", id);
            displayProjects(); // Refresh list
        } catch (e) {
            alert("Error deleting project: " + e.message);
        }
    }
};


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (addProjectButton) {
        addProjectButton.addEventListener('click', addNewProject);
    }

    displayProjects(); // Initial load

    // Need to add listener for complete or use this as a callback funcion when displayProjects() is complete
    setTimeout(function(){sortByField(0)}, 2000); // Initial sort
});

// Next Project Number
const getNextProjectNumber = function () {
    var projects = document.querySelectorAll(".project-number");
    var highestExisting = 10000; //lowest possible

    projects.forEach((project) => {
        let thisNumber = parseInt(project.innerText);
        if (thisNumber > highestExisting) {
            highestExisting = thisNumber;
        }
    })
    console.log("Next project found!")
    return highestExisting + 1;
}

window.loadThisProject = async function (projectId) {
    //const doc1 = await getCollectionData("projects").getDoc("SJZub3KroSz6OLnsNonB")
    try {
        let project = await getDocumentById("projects", projectId); // Use the generic function!
        let obj = {};

        if (project) {
            showProjectForm();
            populateProjectForm(project);
        } else {
            console.log(">Project with ID ${projectId} not found");
        }
    } catch (e) {
        console.error("Error fetching project details: ${e.message}");
    }
}

//loadThisProject(); // Removed 2025.12.11


// Modal Form
const modal = document.getElementById('projectModal');
//const openButton = document.getElementById('openProjectModal');
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
    populateProjectForm({ project: getNextProjectNumber().toString() })
}

window.showFormAndPopulateProject = function(id){
    showProjectForm();
    populateProjectForm();
    // Change Button Function
    let submitBtn = form.querySelector("[type=submit]");
    submitBtn.innerText = "Update"
    submitBtn.setAttribute("data-id", id)
}

window.populateProjectForm = function (args) {
    try {
        console.log("project:", args.project);
    } catch {
        console.log("No project found");
    }
    try {
        form.projectNumber.value = args.project;
    } catch {
        form.projectNumber.value = getNextProjectNumber().toString();
    }
    try {
        form.customerName.value = args.customer || "";
    } catch {
        // do nothing
    }
    try {
        form.application.value = args.application || "";
    } catch {
        // do nothing
    }
    try {
        form.owner.value = args.owner || "";
    } catch {
        // do nothing
    }
    try {
        form.lead.value = args.lead || "";
    } catch {
        // do nothing
    }
    try {
        form.status.value = args.status || "";
    } catch {
        // do nothing
    }
    try {
        form.price.value = args.price || "";
    } catch {
        // do nothing
    }
}

//openButton.addEventListener('click', showProjectForm);

const closeModal = () => {
    modal.style.display = 'none';
};

closeButton.addEventListener('click', closeModal);
cancelButton.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal); // Close on backdrop click

// Escape key close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    let btnSubmit = e.submitter;
    console.log(btnSubmit.innerText);
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


// Sorting Algorithm
let lastSortColumn = -1;
let lastSortDirection = 1; // 1 = ascending, -1 = descending

window.sortByField = function(columnIndex) {
    const projectList = document.getElementById("projects-list");
    const rows = Array.from(projectList.querySelectorAll(".row")); // Convert to array

    // Separate header (first row) and data rows
    const header = rows[0];
    const dataRows = rows.slice(1);

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
}

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
}
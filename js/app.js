//
// This script expects modules.js to be loaded before it,
// making window.requestNotificationPermissionAndGetFCMToken available.
// ===============================================
// FIREBASE - Notifications
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
    const enableNotificationsButton = document.getElementById('enableNotificationsButton');
    const logDiv = document.getElementById('log');
    const messagesDiv = document.getElementById('messages');

    function appendLog(message) {
        if (logDiv) {
            const p = document.createElement('p');
            p.textContent = message;
            logDiv.appendChild(p);
            logDiv.scrollTop = logDiv.scrollHeight;
        } else {
            console.log(message);
        }
    }

    function displayForegroundMessage(payload) {
        if (messagesDiv) {
            const messageBox = document.createElement('div');
            messageBox.className = 'message-box';
            const title = document.createElement('div');
            title.className = 'message-title';
            title.textContent = `Title: ${payload.notification?.title || 'N/A'}`;
            const body = document.createElement('div');
            body.className = 'message-body';
            body.textContent = `Body: ${payload.notification?.body || 'N/A'}`;
            messageBox.appendChild(title);
            messageBox.appendChild(body);
            messagesDiv.appendChild(messageBox);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } else {
            console.log('Foreground Message (no display div):', payload);
        }
    }

    // --- Setup foreground message listener AFTER DOM is ready ---
    // Now using the globally exposed messaging and onMessage from modules.js
    if (window.messaging && window.onMessage) {
        window.onMessage(window.messaging, (payload) => {
            appendLog('Message received in foreground:');
            appendLog(JSON.stringify(payload));
            displayForegroundMessage(payload);

            // Display a browser notification for foreground messages (optional, but good for UX)
            new Notification(payload.notification?.title || 'New Message', {
                body: payload.notification?.body || 'You have a new notification.',
                icon: payload.notification?.icon || '/img/icons/icon-192x192.png' // Ensure this icon path is correct
            });
        });
        appendLog("Foreground FCM message listener set up.");
    } else {
        appendLog("WARNING: Firebase Messaging not fully exposed by modules.js. Cannot set up foreground listener.");
    }


    if (enableNotificationsButton) {
        enableNotificationsButton.addEventListener('click', async () => {
            appendLog('Attempting to enable notifications...');
            // Call the function exposed from modules.js
            window.requestNotificationPermissionAndGetFCMToken(
                (token) => {
                    appendLog(`Notifications enabled. Token: ${token}`);
                    alert('Notifications enabled successfully! Check console for token.');
                    // In a real app, send this token to your backend server
                    // so you can send targeted notifications to this user.
                    // For example: yourBackendApi.saveFCMToken(token);
                },
                (error) => {
                    appendLog(`Failed to enable notifications: ${error.message}`);
                    alert(`Failed to enable notifications: ${error.message}. Check console.`);
                }
            );
        });
        appendLog("Enable Notifications button found and listener attached.");
    } else {
        appendLog("Enable Notifications button not found. Please add <button id='enableNotificationsButton'>Enable Notifications</button> to your HTML.");
    }

    // Example of using other functions from modules.js
    // if (window.loadData) {
    //   window.loadData('projects').then(data => {
    //       appendLog('Loaded projects from Firestore: ' + JSON.stringify(data));
    //   }).catch(error => console.error('Error loading data:', error));
    // }
});

// ===============================================
// FIREBASE - Import library
// ===============================================
// // Import the functions you need from the SDKs you need

// This is done at the page level


// ===============================================
// IRONCLAD CRM PWA - Main Application Logic
// ===============================================

//const REPO = "/IRONCLAD/"; // ← Declared in sw.js
const REPO_ = "/IRONCLAD";
const PAGES_ = "/pages"; // "/pages";
const db = (() => {
  if (localStorage.getItem("TestMode") == "true") {
    // Test Mode
    console.log("Test Mode")
    return window.GrokDB;
  } else {
    // Live Mode
    console.log("Live Mode");
    return window.FireDB;
    //return window.dbFirestore;
  }
})()



window.onload = function () {
  drawUser();
};


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
// Userforms
// ===============================================
// saving data
const roofForm = document.querySelector('#roof-form') || null;
const facetForm = document.querySelector('#facet-form') || null;

function renderRoof(doc) {
  let li = document.createElement('li');
  let structure = document.createElement('span');
  let facet = document.createElement('span');
  let cross = document.createElement('div');

  li.setAttribute('data-id', doc.id);
  structure.textContent = doc.data().structure;
  facet.textContent = doc.data().facet;
  cross.textContent = '-';
  cross.className = "close";

  li.appendChild(structure);
  li.appendChild(facet);
  li.appendChild(cross);

  roofForm.appendChild(li);

  // deleting data
  cross.addEventListener('click', (e) => {
    e.stopPropagation();
    let id = e.target.parentElement.getAttribute('data-id');
    db.collection('roof_facets').doc(id).delete();
  });
}

// getting data
// db.collection('roof_facets').orderBy('facet').get().then(snapshot => {
//     snapshot.docs.forEach(doc => {
//         renderRoof(doc);
//     });
// });

// saving data
if (roofForm !== null) {
  roofForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let structure = roofForm.structure.value || "House";
    let facet = roofForm.facet.value || "facet #" + parseInt(roofForm.querySelectorAll('li').length + 1);

    db.collection('roof_facets').add({
      structure: structure,
      facet: facet
    });
    roofForm.structure.value = '';
    roofForm.facet.value = '';
  });
}


// STRUCTURE RENDER
function renderStructure(doc) {

  let structure = facetForm.querySelector("#structure");
  let facet = facetForm.querySelector("#facet");

  let type = facetForm.category;
  let pitch = facetForm.pitch;
  let layers = facetForm.layers;
  let underlay = facetForm.underlay;

  db.collection('roof_facets').onSnapshot(snapshot => {
    let changes = snapshot.docChanges();
    let y = changes.length;
    let data = localStorage.getItem("progress") || null;
    let x = 0;

    if (data) {
      x = JSON.parse(localStorage.getItem("progress")).x;
    }

    console.log(x + 1, "of", y);

    if (x === y - 1) {
      x = 0;
    } else {
      x++;
    }

    // Update Form
    structure.textContent = changes[x].doc.data().structure;
    facet.textContent = changes[x].doc.data().facet;

    // Capture ID
    let id = changes[x].doc.id;
    console.log(id);


    let str = JSON.stringify({ "x": x, "y": y })
    localStorage.setItem("progress", str)

    console.log("Before", changes[x].doc.data());
    db.collection('roof_facets').doc(id).update({
      type: type.value,
      pitch: pitch.value,
      layers: layers.value,
      underlay: underlay.value
    });

    console.log("After", changes[x].doc.data());


  });
}


// STRUCTURE PAGE
if (facetForm !== null) {
  renderStructure();
  facetForm.addEventListener('submit', (e) => {

    let btn = e.submitter;
    console.log(btn)
    e.preventDefault();

    // add delay to prevent user from going too fast
    btn.setAttribute("disabled", "disabled");
    setTimeout(function () { btn.removeAttribute("disabled") }, 3000);

    renderStructure();

  });
}

// APPLICATIONS PAGE
if (roofForm !== null) {
  //db.collection('roof_facets').orderBy('facet').onSnapshot(snapshot => {
  db.collection('roof_facets').onSnapshot(snapshot => {
    //var facetList = roofForm.querySelectorAll("li");

    //console.log(snapshot);
    let changes = snapshot.docChanges();

    changes.forEach(change => {
      if (change.type == 'added') {
        renderRoof(change.doc);
      } else if (change.type == 'removed') {
        let li = roofForm.querySelector('[data-id=' + change.doc.id + ']');
        roofForm.removeChild(li);
      }
    });
  });
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
  if (!pageName.endsWith(".html")) { pageName = pageName + ".html" }; // add '.html' if missing
  // if(!pageName.startsWith("/")){pageName = "/" + pageName}; // add '/' page name if missing

  if (pageName.startsWith("/")) {
    location.href = REPO_ + PAGES_ + pageName;  // pages
  } else {
    location.href = REPO_ + "/" + pageName;  // root
  }

}

// ===============================================
// User Display
// ===============================================

function drawUser() {
  const div = document.createElement("div");
  const a = document.createElement("a");

  a.id = "username";
  a.href = REPO_ + PAGES_ + "/login.html";
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

function userMessage(title, message, callback) {
  var div = document.createElement("div");
  var titleEl = document.createElement("h3")
  var content = document.createElement("div");
  var btn = document.createElement("button");

  div.id = "user-message";

  content.innerText = message//.replace(/\n/g, "<br>");
  content.innerHTML = message.replace(/\n/g, "<br>")
  titleEl.innerText = title;
  btn.innerText = "Ok";


  div.appendChild(titleEl);
  div.appendChild(content);
  div.appendChild(btn);
  document.body.appendChild(div);

  btn.onclick = function () { callback() }

  // Style
  div.style.cssText = "display:block;position:absolute;background:rgba(0, 0, 0, 0.7);top:25%;left:20%;width:60%;color:white;padding:1rem;border-radius:1.5rem;"
  btn.style.cssText = "background:gray;border:white;width:auto;float:right;padding:0.5rem;min-width:120px;font-size:1.2rem;";
}

function closeUserMessage() {
  var div = document.getElementById("user-message");
  if (div) { div.parentNode.removeChild(div) };
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



// ===============================================
// Push Notifications and Messaging
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
    const enableNotificationsButton = document.getElementById('enableNotificationsButton');

    if (enableNotificationsButton) {
        enableNotificationsButton.addEventListener('click', async () => {
            // First, check if Notification API is available in the browser
            if (!('Notification' in window)) {
                console.error('This browser does not support notifications.');
                alert('Push notifications are not supported by your browser.');
                return;
            }

            // Check current permission status
            let permission = Notification.permission;
            console.log('Current notification permission status:', permission);

            if (permission === 'granted') {
                console.log('Notification permission already granted.');
                alert('You have already enabled notifications!');
                // You might want to subscribe the user to push here if not already done
                // await subscribeUserToPush();
            } else if (permission === 'denied') {
                console.warn('Notification permission denied by the user.');
                alert('You have previously blocked notifications. Please enable them in your browser settings.');
            } else { // permission === 'default' (or 'prompt')
                console.log('Requesting notification permission...');
                try {
                    permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                        alert('Notifications enabled successfully!');
                        // Now you can subscribe the user to push notifications
                        // This involves registering a service worker and subscribing to a push service.
                        // await subscribeUserToPush();
                    } else {
                        console.warn('Notification permission denied.');
                        alert('You denied notification permission.');
                    }
                } catch (error) {
                    console.error('Error requesting notification permission:', error);
                    alert('An error occurred while requesting notification permission.');
                }
            }
        });
    }
});


// A placeholder for what you would do after permission is granted
// This function would typically register a service worker and then subscribe the user to push
async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true, // Required for all push subscriptions
            applicationServerKey: 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4' // my VAPID public key
        });
        console.log('User is subscribed to push:', subscription);
        // Send this subscription object to your backend (e.g., Firebase Cloud Functions)
        // so you can send push notifications to this user.
    } catch (error) {
        console.error('Failed to subscribe the user:', error);
    }
}

window.onload = function () {
    drawUser();
}

const isTableEl = function (el) {
    if (el.closest("table")) {
        return true;
    } else {
        return false;
    }
}

// Remove focus from active element if a non-input was clicked
document.body.addEventListener('click', function (event) {
    const inputElements = ['input', 'textarea', 'select', 'button'];
    var el = event.target;

    // Check if there is an active element and blur it
    if (document.activeElement && inputElements.indexOf(el.tagName.toLowerCase()) === -1) {
        document.activeElement.blur();
    }

    //remove any other highlighted rows
    var rows = document.querySelectorAll('tr');
    rows.forEach(row => {
        row.classList.remove("active-row");
    })

    if (isTableEl(el)) {
        // If inside table, activate row
        el.closest('tr').classList.add("active-row");
    }

});

var main = document.querySelector("main");
main.addEventListener('scroll', function() {
    
    main.classList.add("hi")
    // Use a logical OR for cross-browser compatibility
    if (main.scrollTop > 0) {
        main.classList.toggle('scrolled', true);
    } else {
        main.classList.toggle('scrolled', false);
    }
});

function drawUser() {

    // <a href="page1.html">About</a>
    var div = this.document.createElement("div");
    var a = this.document.createElement("a");

    a.id = "username";
    div.classList.add("active-user");
    div.appendChild(a);

    this.document.body.appendChild(div);
    a.setAttribute("href", "login.html")
    a.innerText = getActiveUser();
}

function getActiveUser() {
    var activeUser;
    activeUser = localStorage.getItem('userName') || "None";
    return activeUser;
}





// Get/Send values to document on server

const read = (file = 'story.txt') => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`, true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('Content of', file, '→', xhr.responseText);
        } else {
            console.error('Read failed:', xhr.status, xhr.statusText);
        }
    };

    xhr.onerror = () => console.error('Network error');
    xhr.send();
};

const write = (file = 'story.txt', text = '') => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://192.168.0.18:8000/data/${encodeURIComponent(file)}`, true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('Saved to', file, '→', xhr.responseText);
        } else {
            console.error('Write failed:', xhr.status);
        }
    };

    xhr.onerror = () => console.error('Network error');
    xhr.send(text);
};

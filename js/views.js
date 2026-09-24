window.IC = window.IC || {};

(function (IC) {
  function session() { return IC.state.session; }
  function mineJobs() {
    var s = session();
    var jobs = IC.state.jobs;
    if (!s || !IC.isApproved(s)) return [];
    if (s.role === "admin" || s.role === "manager") return jobs;
    return jobs.filter(function (j) { return j.ownerId === s.memberId; });
  }

  IC.viewLogin = function () {
    var panel = IC.ui.authPanel || "signin";
    var cached = IC.state.session;
    var canOffline = cached && IC.isApproved(cached);
    var tabs = [["signin", "Sign in"], ["signup", "Create account"]].map(function (t) {
      return '<button type="button" class="' + (panel === t[0] ? "on" : "") + '" data-act="auth-panel" data-panel="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    var body = "";
    if (panel === "signup") {
      body = '<form class="login-card" data-act="auth-signup">' +
        "<h2>Create account</h2>" +
        '<p class="sub" style="text-align:left;margin:0 0 12px">Anyone can create an account. Nate or Matt have to turn on Sales, Manager, or Admin before you can see jobs.</p>' +
        IC.field("Your name", IC.input({ name: "displayName", autocomplete: "name", value: IC.ui.loginName, placeholder: "First name" })) +
        IC.field("Email", IC.input({ type: "email", name: "email", autocomplete: "username", value: IC.ui.loginEmail })) +
        IC.field("Password", IC.input({ type: "password", name: "password", autocomplete: "new-password", value: IC.ui.loginPassword, placeholder: "At least 6 characters" })) +
        IC.field("Confirm password", IC.input({ type: "password", name: "password2", autocomplete: "new-password", value: IC.ui.loginPassword2 })) +
        (IC.ui.loginError ? '<p class="err">' + IC.esc(IC.ui.loginError) + "</p>" : "") +
        (IC.ui.loginInfo ? '<p class="muted">' + IC.esc(IC.ui.loginInfo) + "</p>" : "") +
        IC.btn(IC.ui.loginBusy ? "Creating…" : "Create account", { type: "submit", class: "btn-block", disabled: IC.ui.loginBusy }) +
        "</form>";
    } else if (panel === "forgot") {
      body = '<form class="login-card" data-act="auth-forgot">' +
        "<h2>Reset password</h2>" +
        '<p class="sub" style="text-align:left;margin:0 0 12px">We’ll email a reset link. Same address you sign in with.</p>' +
        IC.field("Email", IC.input({ type: "email", name: "email", autocomplete: "username", value: IC.ui.loginEmail })) +
        (IC.ui.loginError ? '<p class="err">' + IC.esc(IC.ui.loginError) + "</p>" : "") +
        (IC.ui.loginInfo ? '<p class="muted">' + IC.esc(IC.ui.loginInfo) + "</p>" : "") +
        IC.btn(IC.ui.loginBusy ? "Sending…" : "Send reset link", { type: "submit", class: "btn-block", disabled: IC.ui.loginBusy }) +
        '<button type="button" class="text-link" data-act="auth-panel" data-panel="signin">Back to sign in</button>' +
        "</form>";
    } else {
      body = '<form class="login-card" data-act="auth-signin">' +
        "<h2>Sign in</h2>" +
        IC.field("Email", IC.input({ type: "email", name: "email", autocomplete: "username", value: IC.ui.loginEmail })) +
        IC.field("Password", IC.input({ type: "password", name: "password", autocomplete: "current-password", value: IC.ui.loginPassword })) +
        '<label class="check" style="margin:4px 0 12px"><input type="checkbox" data-act="keep-signed-in"' + (IC.ui.keepSignedIn !== false ? " checked" : "") + ' /> Keep me signed in on this iPad</label>' +
        (IC.ui.loginError ? '<p class="err">' + IC.esc(IC.ui.loginError) + "</p>" : "") +
        (IC.ui.loginInfo ? '<p class="muted">' + IC.esc(IC.ui.loginInfo) + "</p>" : "") +
        IC.btn(IC.ui.loginBusy ? "Signing in…" : "Sign in", { type: "submit", class: "btn-block", disabled: IC.ui.loginBusy }) +
        '<button type="button" class="text-link" data-act="auth-panel" data-panel="forgot">Forgot password?</button>' +
        "</form>";
    }
    return '<div class="login"><div class="login-blob"><span></span><span></span></div><div class="login-inner">' +
      '<img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" />' +
      '<p class="tag" style="margin-top:12px">UNBREAKABLE QUALITY</p>' +
      "<h1>IRONCLAD CRM</h1>" +
      '<p class="sub">Jobs, estimates, and agreements — built for the iPad in the truck.</p>' +
      '<div class="auth-tabs">' + tabs + "</div>" +
      body +
      (canOffline
        ? '<div class="login-local"><p class="sub" style="text-align:left;margin:0 0 12px">Signed in before as <strong>' + IC.esc(cached.name) + "</strong>. No signal? Keep working with the jobs already on this iPad. They’ll sync when you’re back.</p>" +
          IC.btn("Continue offline", { variant: "outline", class: "btn-block", data: 'data-act="offline-login"' }) + "</div>"
        : '<p class="tiny" style="margin-top:18px;max-width:22rem">First sign-in needs a connection. After that this iPad can work offline and will sync the shared company jobs when you’re back on the network.</p>') +
      "</div></div>";
  };

  IC.viewWaiting = function () {
    var s = session() || {};
    var off = s.status === "disabled";
    return '<div class="login"><div class="login-blob"><span></span><span></span></div><div class="login-inner">' +
      '<img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" />' +
      '<p class="tag" style="margin-top:12px">UNBREAKABLE QUALITY</p>' +
      "<h1>" + (off ? "Access off" : "Waiting on access") + "</h1>" +
      '<div class="login-card">' +
      "<p>Hi " + IC.esc(s.name || "there") + ".</p>" +
      '<p class="muted" style="margin-top:8px">' +
      (off
        ? "This login was turned off. Ask Nate or Matt if you still need into IRONCLAD."
        : "Your account is in. Nate or Matt still need to give you Sales, Manager, or Admin rights before you can see jobs.") +
      "</p>" +
      '<p class="tiny" style="margin-top:12px">' + IC.esc(s.email || "") + "</p>" +
      '<div style="margin-top:16px">' +
      IC.btn("Check access again", { class: "btn-block", data: 'data-act="refresh-access"' }) +
      '<div style="height:8px"></div>' +
      IC.btn("Sign out", { variant: "outline", class: "btn-block", data: 'data-act="sign-out"' }) +
      "</div>" +
      "</div></div></div>";
  };

  IC.viewShell = function (inner, route) {
    var s = session();
    var unread = IC.state.notifications.filter(function (n) { return IC.noteIsForSession(n, s) && !n.read; }).length;
    var nav = [
      { to: "#/", id: "home", label: "Home", icon: "home" },
      { to: "#/jobs", id: "jobs", label: "Jobs", icon: "briefcase" },
      { to: "#/schedule", id: "schedule", label: "Schedule", icon: "calendar" },
      { to: "#/customers", id: "customers", label: "Customers", icon: "users" },
    ];
    var isActive = function (id) {
      if (id === "home") return route.name === "home";
      return route.name === id || (id === "jobs" && (route.name === "job" || route.name === "customer-quote" || route.name === "job-sheet" || route.name === "job-cost")) || (id === "customers" && route.name === "customer");
    };
    var sideLinks = nav.map(function (item) {
      return '<a href="' + item.to + '" class="' + (isActive(item.id) ? "active" : "") + '">' + IC.icon(item.icon) + "<span>" + item.label + "</span></a>";
    }).join("");
    var settingsOn = route.name === "settings";
    var laborOn = route.name === "labor";
    var materialsOn = route.name === "materials";
    var financeOn = route.name === "financing";
    return '<div class="shell"><aside class="sidebar"><a class="brand" href="#/"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing" /><div class="brand-copy"><div class="brand-name">IRONCLAD</div><div class="brand-sub">CRM</div></div></a>' +
      '<nav class="nav-side">' + sideLinks + "</nav>" +
      '<div class="nav-foot"><a href="#/notifications" class="' + (route.name === "notifications" ? "active" : "") + '">' + IC.icon("bell") + "<span>Alerts</span>" +
      (unread ? '<span class="nav-count">' + unread + "</span>" : "") + "</a>" +
      (IC.can(s, "labor", "read") ? '<a href="#/labor" class="' + (laborOn ? "active" : "") + '">' + IC.icon("hammer") + "<span>Labor</span></a>" : "") +
      (IC.can(s, "materials", "read") ? '<a href="#/materials" class="' + (materialsOn ? "active" : "") + '">' + IC.icon("box") + "<span>Materials</span></a>" : "") +
      '<a href="#/financing" class="' + (financeOn ? "active" : "") + '">' + IC.icon("finance") + "<span>Financing</span></a>" +
      '<a href="#/settings" class="' + (settingsOn ? "active" : "") + '">' + IC.icon("settings") + "<span>Settings</span></a>" +
      '<div class="who"><strong>' + IC.esc(s.name) + "</strong><span>" + IC.esc(IC.roleLabel(s)) + (s.mode === "offline" || !IC.ui.online ? " · offline" : "") + "</span></div></div></aside>" +
      '<div class="main-wrap"><header class="topbar"><a class="brand" href="#/"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing" /></a>' +
      '<div class="top-actions"><a href="#/notifications">' + IC.icon("bell") + (unread ? '<span class="dot"></span>' : "") + '</a><a href="#/settings">' + IC.icon("settings") + "</a></div></header>" +
      '<main class="content">' +
      (!IC.ui.online ? '<div class="offline-banner">You’re offline. Changes save on this iPad and sync when you’re back.</div>' : "") +
      inner + "</main>" +
      '<nav class="tabbar">' + nav.map(function (item) {
        return '<a href="' + item.to + '" class="' + (isActive(item.id) ? "active" : "") + '">' + IC.icon(item.icon) + item.label + "</a>";
      }).join("") + "</nav></div></div>" +
      (IC.ui.toast ? '<div class="toast">' + IC.esc(IC.ui.toast) + "</div>" : "");
  };

  IC.viewHome = function () {
    var s = session();
    var jobs = mineJobs();
    var unread = IC.state.notifications.filter(function (n) { return IC.noteIsForSession(n, s) && !n.read; });
    var today = new Date().toISOString().slice(0, 10);
    var upcoming = jobs.filter(function (j) { return j.scheduledDate; })
      .sort(function (a, b) { return (a.scheduledDate || "").localeCompare(b.scheduledDate || ""); }).slice(0, 5);
    var unsigned = jobs.filter(function (j) { return j.status === "Sold" && (!j.contract || j.contract.status !== "signed"); });
    var unassigned = (s.role === "admin" || s.role === "manager") ? IC.state.jobs.filter(function (j) { return !j.ownerId; }) : [];
    var stats = IC.JOB_STATUSES.filter(function (st) { return st !== "Did NOT Sell"; }).map(function (st) {
      var n = jobs.filter(function (j) { return j.status === st; }).length;
      return '<div class="card stat"><p>' + IC.esc(st) + '</p><p class="num">' + n + "</p></div>";
    }).join("");
    var row = function (j, meta) {
      return '<a class="job-row" href="#/jobs/' + j.id + '"><div><p><span class="tabular muted">#' + j.number + "</span> " + IC.esc(j.customerName) + '</p><p class="tiny">' + IC.esc(meta) + "</p></div>" + IC.badge(j.status) + "</a>";
    };
    var greet = String((s && s.salesName) || "").trim().split(/\s+/)[0];
    if (!greet) greet = String((s && s.name) || "").trim().split(/\s+/)[0];
    var stack = function (items, empty) {
      return items && items.length ? '<div class="job-stack">' + items.join("") + "</div>" : empty;
    };
    return '<div class="page"><header class="page-head"><div><p class="kicker">Ironclad Roofing</p><h1 class="hero">Let’s go to work, ' + IC.esc(greet) + '.</h1></div><a href="#/jobs">' + IC.btn("New job " + IC.icon("arrow")) + "</a></header>" +
      '<div class="grid-stats">' + stats + "</div>" +
      (unread[0] ? '<div class="card is-unread" style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><p class="kicker">Needs you</p><p style="font-weight:600">' + IC.esc(unread[0].title) + '</p><p class="muted">' + IC.esc(unread[0].body) + '</p></div><a href="#/notifications">' + IC.btn("Alerts", { variant: "outline", size: "sm" }) + "</a></div>" : "") +
      '<div class="grid-2"><div class="card"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">' + IC.icon("userplus") + "<h2>Unassigned</h2></div>" +
      stack(unassigned.map(function (j) { return row(j, "Needs a salesperson"); }), '<p class="muted">Every job has a project owner.</p>') +
      '</div><div class="card"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">' + IC.icon("pen") + "<h2>Waiting on signature</h2></div>" +
      stack(unsigned.map(function (j) { return row(j, IC.money(j.price)); }), '<p class="muted">No sold jobs waiting on a contract.</p>') +
      "</div></div>" +
      '<div class="card"><h2 style="margin-bottom:12px">Upcoming production</h2>' +
      stack(upcoming.map(function (j) {
        return row(j, (j.crewName || "Crew TBD") + " · " + (j.scheduledDate === today ? "Today" : IC.formatDate(j.scheduledDate)));
      }), '<p class="muted">Nothing on the calendar yet. Assign a crew from a sold job.</p>') +
      "</div></div>";
  };

  IC.viewJobs = function () {
    var q = (IC.ui.jobSearch || "").trim().toLowerCase();
    var status = IC.ui.jobStatus;
    var list = mineJobs().filter(function (j) {
      if (status && j.status !== status) return false;
      var hay = (j.number + " " + j.customerName + " " + (j.ownerName || "") + " " + j.status).toLowerCase();
      return hay.indexOf(q) >= 0;
    }).sort(function (a, b) { return b.number - a.number; });
    var statusOpts = [{ value: "", label: "All statuses" }].concat(IC.JOB_STATUSES.map(function (s) { return { value: s, label: s }; }));
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Pipeline</p><h1 class="title">Jobs</h1></div>' +
      IC.btn(IC.icon("plus") + " New job", { data: 'data-act="open-new-job"' }) + "</header>" +
      '<div class="filters"><div class="search-wrap">' + IC.icon("search") + IC.input({ placeholder: "Search name, #, owner", value: IC.ui.jobSearch, "data-act": "job-search" }) + "</div>" +
      IC.select({ "data-act": "job-filter", value: status }, statusOpts) + "</div>" +
      '<div class="list-card"><div class="list-head"><span>#</span><span>Customer</span><span>Owner</span><span>Status</span><span>Schedule</span><span style="text-align:right">Price</span></div>' +
      (list.length ? list.map(function (j) {
        return '<a class="list-row job" href="#/jobs/' + j.id + '"><span class="tabular muted">#' + j.number + "</span><span style='font-weight:600'>" + IC.esc(j.customerName) + "</span><span class='muted'>" + IC.esc(j.ownerName || "Unassigned") + "</span><span>" + IC.badge(j.status) + "</span><span class='muted'>" + (j.scheduledDate ? IC.formatDate(j.scheduledDate) : "—") + '</span><span class="tabular" style="text-align:right">' + (j.price ? IC.money(j.price) : "—") + "</span></a>";
      }).join("") : '<p class="empty">No jobs match.</p>') + "</div>" +
      (IC.ui.newJobOpen ? IC.viewNewJobModal() : "") + "</div>";
  };

  IC.viewNewJobModal = function () {
    var customers = IC.state.customers;
    var mode = IC.ui.newJobMode;
    var d = IC.ui.newJobDraft || IC.newCustomerDraft();
    IC.ui.newJobDraft = d;
    var body;
    if (mode === "existing") {
      body = IC.field("Customer", IC.select({ "data-act": "new-job-customer", value: IC.ui.newJobCustomerId || (customers[0] && customers[0].id) || "" },
        customers.map(function (c) { return { value: c.id, label: c.firstName + " " + c.lastName + " · " + c.city }; })));
    } else {
      body = '<div class="form-grid two">' +
        IC.field("First name", IC.input({ value: d.firstName, "data-draft": "firstName" })) +
        IC.field("Last name", IC.input({ value: d.lastName, "data-draft": "lastName" })) +
        IC.field("Phone", IC.input({ value: d.phone, "data-draft": "phone" })) +
        IC.field("Email", IC.input({ value: d.email, "data-draft": "email" })) +
        IC.field("Street", IC.input({ value: d.street, "data-draft": "street" }), "span-2") +
        IC.field("City", IC.input({ value: d.city, "data-draft": "city" })) +
        IC.field("ZIP", IC.input({ value: d.zip, "data-draft": "zip" })) +
        IC.field("Notes", IC.textarea({ value: d.notes, "data-draft": "notes" }), "span-2") + "</div>";
    }
    return '<div class="modal-bg" data-act="close-modal"><div class="modal" data-stop="1"><h2>New job</h2>' +
      '<div style="display:flex;gap:8px;margin:12px 0">' +
      IC.btn("Existing customer", { size: "sm", variant: mode === "existing" ? "" : "outline", data: 'data-act="new-job-mode" data-mode="existing"' }) +
      IC.btn("New customer", { size: "sm", variant: mode === "new" ? "" : "outline", data: 'data-act="new-job-mode" data-mode="new"' }) +
      "</div>" + body +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:1.25rem">' +
      IC.btn("Cancel", { variant: "ghost", data: 'data-act="close-modal"' }) +
      IC.btn("Create job", { data: 'data-act="create-job"' }) + "</div>" +
      '<p class="tiny" style="margin-top:8px">Owners: ' + (IC.salespeople().map(function (t) { return t.salesName; }).join(", ") || "assign from the job screen") + ". Admins assign from the job screen.</p></div></div>";
  };

  IC.viewJob = function (jobId) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return '<div class="page"><p>Job not found.</p><a href="#/jobs" style="color:var(--navy);text-decoration:underline">Back to jobs</a></div>';
    var customer = IC.state.customers.find(function (c) { return c.id === job.customerId; });
    var settings = IC.state.settings;
    var tab = IC.ui.jobTab || "Overview";
    if (tab === "Estimate") tab = "Assessment";
    if (tab === "Quote") tab = "Summary";
    var tabs = ["Overview", "Assessment", "Summary", "Contract"].map(function (t) {
      return '<button type="button" class="' + (tab === t ? "on" : "") + '" data-act="job-tab" data-tab="' + t + '">' + t + "</button>";
    }).join("");
    var body = "";
    if (tab === "Overview") body = IC.viewJobOverview(job, customer);
    else if (tab === "Assessment") body = IC.viewEstimator(job);
    else if (tab === "Summary") body = IC.viewJobSummary(job);
    else body = IC.viewJobContract(job, customer, settings);
    return '<div class="page"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">' +
      '<a class="back" href="#/jobs">' + IC.icon("back") + "</a>" +
      '<div style="min-width:0;flex:1"><p class="kicker muted">Job #' + job.number + '</p><h1 class="title" style="font-size:1.6rem">' + IC.esc(job.customerName) + "</h1></div>" +
      IC.badge(job.status) + "</div>" +
      '<div class="tabs no-print">' + tabs + "</div>" + body + "</div>";
  };

  IC.viewJobOverview = function (job, customer) {
    var s = session();
    var sales = IC.state.team.filter(function (t) {
      return t.salesName && t.status !== "pending" && t.role !== "pending" && t.status !== "disabled";
    });
    var crews = IC.state.crews.filter(function (c) { return c.active; });
    return '<div class="lg-split"><div class="card"><h2 style="margin-bottom:12px">Job</h2><div class="form-grid two">' +
      IC.field("Status", IC.select({ "data-act": "job-status", "data-id": job.id, value: job.status }, IC.JOB_STATUSES.map(function (x) { return { value: x, label: x }; }))) +
      IC.field("Project owner", IC.select({ "data-act": "job-owner", "data-id": job.id, value: job.ownerId || "", disabled: !IC.canAssignSales(s) },
        [{ value: "", label: "Unassigned" }].concat(sales.map(function (x) { return { value: x.id, label: x.salesName }; })))) +
      IC.field("Crew", IC.select({ "data-act": "job-crew", "data-id": job.id, value: job.crewId || "", disabled: !IC.canAssignCrew(s, job) },
        [{ value: "", label: "Unassigned" }].concat(crews.map(function (c) { return { value: c.id, label: c.name + (c.foreman ? " · " + c.foreman : "") }; })))) +
      '<div class="field"><span class="field-label">Production date</span>' +
        (function () {
          var can = IC.canAssignCrew(s, job);
          var valid = IC.validIsoDate(job.scheduledDate);
          if (valid) {
            return '<div class="date-row">' +
              IC.input({ type: "date", value: valid, "data-act": "job-date", "data-id": job.id, disabled: !can }) +
              (can ? IC.btn("Reset", { variant: "outline", size: "sm", class: "date-reset", data: 'data-act="clear-date" data-id="' + job.id + '"' }) : "") +
              "</div>";
          }
          return '<div class="date-row">' +
            '<span class="muted date-empty">Not scheduled</span>' +
            (can
              ? '<span class="btn btn-outline btn-sm date-set-btn">Set date' +
                IC.input({ type: "date", value: "", "data-act": "job-date", "data-id": job.id, class: "date-overlay", "aria-label": "Set production date" }) +
                "</span>"
              : "") +
            "</div>";
        })() +
      "</div>" +
      '<label class="check"><input type="checkbox" data-act="job-flag" data-flag="includeRoof" data-id="' + job.id + '"' + (job.includeRoof ? " checked" : "") + " /> Roof</label>" +
      '<label class="check"><input type="checkbox" data-act="job-flag" data-flag="includeGutters" data-id="' + job.id + '"' + (job.includeGutters ? " checked" : "") + " /> Gutters</label>" +
      '<label class="check"><input type="checkbox" data-act="job-flag" data-flag="includeSiding" data-id="' + job.id + '"' + (job.includeSiding ? " checked" : "") + " /> Siding</label>" +
      IC.field("Notes", IC.textarea({ value: job.notes, "data-act": "job-notes", "data-id": job.id }), "span-2") +
      "</div></div><div style='display:grid;gap:1rem'><div class='card'><div class='card-head'><h2>Customer</h2>" +
      (customer
        ? '<div class="icon-row">' +
          '<button type="button" class="btn btn-outline btn-icon" data-act="job-calendar" data-id="' + job.id + '" aria-label="Add to calendar" title="Add to calendar">' + IC.icon("calendar") + "</button>" +
          (IC.mapsUrl(customer)
            ? '<a class="btn btn-outline btn-icon" href="' + IC.esc(IC.mapsUrl(customer)) + '" target="_blank" rel="noopener" aria-label="Navigate" title="Navigate">' + IC.icon("nav") + "</a>"
            : '<button type="button" class="btn btn-outline btn-icon" data-act="job-navigate" data-id="' + job.id + '" aria-label="Navigate" title="Navigate">' + IC.icon("nav") + "</button>") +
          "</div>"
        : "") +
      "</div>" +
      (customer
        ? '<a href="#/customers/' + customer.id + '"><p style="font-weight:600">' + IC.esc(customer.firstName + " " + customer.lastName) + '</p><p class="muted">' + IC.esc(customer.street) + '</p><p class="muted">' + IC.esc(customer.city + ", " + customer.state + " " + customer.zip) + '</p><p style="margin-top:8px">' + (customer.phone ? IC.esc(IC.formatPhone(customer.phone)) : '<span style="color: var(--warn)">MISSING PHONE</span>') + "</p><p>" + (customer.email ? IC.esc(customer.email) : '<span style="color: var(--warn)">MISSING EMAIL</span>') + "</p></a>"
        : '<p class="muted">Customer record missing.</p>') +
      "</div><div class='card'><p class='field-label'>Price</p><p class='price-xl'>" + (job.price ? IC.money(job.price) : "—") + '</p><p class="tiny">Updated ' + IC.formatDate(job.updatedAt) + "</p></div>" +
      IC.btn(IC.icon("trash") + " Delete job", { variant: "danger", data: 'data-act="delete-job" data-id="' + job.id + '"' }) +
      "</div></div>";
  };

  IC.viewEstimator = function (job) {
    var settings = IC.state.settings;
    var value = IC.withComputed(job.estimate || IC.defaultEstimate(settings), settings, job);
    var c = value.computed;
    var gutters = IC.normalizeAddon("gutters", value.gutters);
    var siding = IC.normalizeAddon("siding", value.siding);
    var financing = IC.normalizeFinancing(value.financing);
    var financePlans = IC.activeFinancingPlans();
    function deckOptions(cat) {
      var items = IC.catalogActiveItems(cat);
      if (!items.length) items = (IC.catalogCategory(cat) || { items: [] }).items || [];
      return items.map(function (it) {
        var sku = it.sku ? " · " + it.sku : "";
        return { value: it.name, label: it.name + sku + " · " + IC.money(it.price) };
      });
    }
    function deckBlock(st, kind, title, hint, unit) {
      var cat = kind === "wood" ? "woodBoard" : "sheathing";
      var rows = kind === "wood" ? (st.woodRows || []) : (st.sheathingRows || []);
      var options = deckOptions(cat);
      var body = rows.map(function (r) {
        var opts = options.slice();
        if (r.itemName && !opts.some(function (o) { return o.value === r.itemName; })) opts.unshift({ value: r.itemName, label: r.itemName });
        return '<div class="deck-row">' +
          IC.select({ "data-est": "deck-item", "data-sid": st.id, "data-kind": kind, "data-rid": r.id, value: r.itemName, "aria-label": title }, opts) +
          IC.input({ type: "number", min: "0", step: "1", inputmode: "numeric", value: r.qty || "", placeholder: "0", "data-est": "deck-qty", "data-sid": st.id, "data-kind": kind, "data-rid": r.id, "aria-label": unit }) +
          IC.btn(IC.icon("trash"), { variant: "ghost", size: "sm", class: "btn-icon", data: 'data-act="est-del-deck" data-sid="' + st.id + '" data-kind="' + kind + '" data-rid="' + r.id + '"' }) +
          "</div>";
      }).join("");
      return '<div class="deck-block"><p class="field-label">' + title + '</p><p class="tiny muted">' + hint + "</p>" +
        (body || '<p class="tiny muted" style="margin-top:6px">None yet.</p>') +
        '<div style="margin-top:8px">' + IC.btn(IC.icon("plus") + " Add " + unit, { variant: "outline", size: "sm", data: 'data-act="est-add-deck" data-sid="' + st.id + '" data-kind="' + kind + '"' }) + "</div></div>";
    }
    var structures = value.structures.map(function (st, i) {
      var facets = IC.structureFacets(st);
      var facetRows = facets.map(function (f, fi) {
        return '<div class="facet-row"><div class="facet-head"><p class="field-label">Facet ' + (fi + 1) + "</p>" +
          (facets.length > 1 ? IC.btn(IC.icon("trash"), { variant: "ghost", size: "sm", data: 'data-act="est-del-facet" data-sid="' + st.id + '" data-fid="' + f.id + '"' }) : "") +
          "</div><div class=\"form-grid two\">" +
          IC.field("Squares", IC.input({ type: "number", min: "0", step: "0.1", value: f.squares, "data-est": "facet", "data-sid": st.id, "data-fid": f.id, "data-key": "squares", "data-num": "1" })) +
          IC.field("Stories", IC.select({ "data-est": "facet", "data-sid": st.id, "data-fid": f.id, "data-key": "level", value: f.level }, IC.STORIES.map(function (x) { return { value: x, label: x }; }))) +
          IC.field("Pitch", IC.select({ "data-est": "facet", "data-sid": st.id, "data-fid": f.id, "data-key": "pitch", value: f.pitch }, IC.PITCHES.map(function (x) { return { value: x, label: x }; }))) +
          IC.field("Tear-off", IC.select({ "data-est": "facet", "data-sid": st.id, "data-fid": f.id, "data-key": "tearoff", value: f.tearoff }, IC.TEAROFF.map(function (x) { return { value: x, label: x }; }))) +
          "</div></div>";
      }).join("");
      return '<section class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3>Structure ' + (i + 1) + "</h3>" +
        (value.structures.length > 1 ? IC.btn(IC.icon("trash"), { variant: "ghost", data: 'data-act="est-del-struct" data-sid="' + st.id + '"' }) : "") + "</div>" +
        '<div class="form-grid two">' +
        IC.field("Name", IC.input({ value: st.name, "data-est": "struct", "data-sid": st.id, "data-key": "name" })) +
        IC.field("Type", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "type", value: st.type }, IC.ROOF_TYPES.map(function (x) { return { value: x, label: x }; }))) +
        IC.field("Vent", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "ventType", value: st.ventType === "box" ? "box" : "ridge" }, [
          { value: "ridge", label: "Ridge vents" },
          { value: "box", label: "Box vents" },
        ])) +
        (st.ventType === "box"
          ? IC.field("Box vent qty", IC.input({ type: "number", min: "0", step: "1", value: st.boxVentQty || 0, "data-est": "struct", "data-sid": st.id, "data-key": "boxVentQty", "data-num": "1" })) +
            IC.field("Box vent color", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "boxVentColor", value: st.boxVentColor || "Black" },
              (IC.catalogActiveItems("boxVent") || []).map(function (it) { return { value: it.name, label: it.name }; })))
          : "") +
        "</div>" +
        deckBlock(st, "sheathing", "Sheathing", "OSB or plywood. Add a row for each size. Yard price comes from Materials.", "sheet") +
        deckBlock(st, "wood", "Wood boards", "Add a row for each size, such as 1×6 and 1×8.", "board") +
        '<div class="facet-block"><p class="field-label" style="margin-bottom:8px">Facets</p>' +
        '<p class="tiny muted" style="margin-bottom:10px">4/12+ : felt + ice on eaves/valleys/½ wall flashing. 2/12–3.9/12 : Ice & Water at ½ roll/sq, no felt. Flat Roof : Base sheet + MuleHide cap + custom edge metal (no shingles, felt, ice, starter, drip, or hip).</p>' +
        facetRows +
        '<div style="margin-top:8px">' + IC.btn(IC.icon("plus") + " Add facet", { variant: "outline", size: "sm", data: 'data-act="est-add-facet" data-sid="' + st.id + '"' }) + "</div></div>" +
        '<div class="facet-block"><p class="field-label" style="margin-bottom:8px">Linears for this structure</p>' +
        '<p class="tiny muted" style="margin-bottom:10px">Leave blank to auto from this structure’s squares. Drip edge = rakes, then 10% + 1 stick. Gutter apron = eaves, then 10%.</p>' +
        '<div class="form-grid two">' +
        [["eaveLf", "Eaves (lf)"], ["rakeLf", "Rakes (lf)"], ["ridgeLf", "Ridge (lf)"], ["hipLf", "Hips (lf)"], ["valleyLf", "Valleys (lf)"]].map(function (pair) {
          return IC.field(pair[1], IC.input({ type: "number", min: "0", placeholder: "auto", value: st[pair[0]] == null || st[pair[0]] === "" ? "" : st[pair[0]], "data-est": "struct", "data-sid": st.id, "data-key": pair[0], "data-num": "1", "data-null": "1" }));
        }).join("") +
        "</div></div></section>";
    }).join("");
    var materials = IC.liveCatalog().filter(function (cat) {
      return cat.id !== "broan" && cat.id !== "boxVent" && cat.id !== "lomance" && cat.id !== "chimney" && cat.id !== "sheathing" && cat.id !== "woodBoard";
    }).map(function (cat) {
      var pick = value.materials.find(function (m) { return m.categoryId === cat.id; });
      var active = cat.items.filter(function (item) { return item.active !== false; });
      var current = pick && pick.itemName;
      var options = active.slice();
      if (current && !options.some(function (i) { return i.name === current; })) {
        var stale = cat.items.find(function (i) { return i.name === current; });
        if (stale) options = [stale].concat(options);
      }
      if (!options.length) options = cat.items.slice();
      return IC.field(cat.label, IC.select({ "data-est": "mat", "data-cat": cat.id, value: current || (options[0] && options[0].name) || "" },
        options.map(function (item) {
          var disc = item.active === false ? " (discontinued)" : "";
          return { value: item.name, label: item.name + disc + " · $" + Number(item.price).toFixed(2) + "/" + cat.soldAs };
        })));
    }).join("");
    var extras = (value.extras || []).map(function (ex) {
      return '<div style="display:grid;grid-template-columns:1fr 120px 44px;gap:8px;margin-top:8px">' +
        IC.input({ placeholder: "Label", value: ex.label, "data-est": "extra-label", "data-eid": ex.id }) +
        IC.input({ type: "number", value: ex.amount, "data-est": "extra-amt", "data-eid": ex.id, "data-num": "1" }) +
        IC.btn(IC.icon("trash"), { variant: "ghost", data: 'data-act="est-del-extra" data-eid="' + ex.id + '"' }) + "</div>";
    }).join("");
    return '<div class="page" data-job="' + job.id + '"><div class="no-print" style="display:flex;justify-content:flex-end">' +
      IC.btn("Save estimate", { variant: "outline", data: 'data-act="save-est"' }) + "</div>" + structures +
      IC.btn(IC.icon("plus") + " Add structure", { variant: "outline", data: 'data-act="est-add-struct"' }) +
      '<section class="card"><h3 style="margin-bottom:8px">Counts</h3><p class="muted" style="margin-bottom:12px">Job-wide pieces. Eaves, rakes, ridge, hips, and valleys live on each structure.</p>' +
      '<div class="form-grid two">' +
      IC.field("Pipe boots", IC.input({ type: "number", min: "0", value: value.pipeBoots, "data-est": "num", "data-key": "pipeBoots" })) +
      IC.field("Broan 4\" (bath)", IC.input({ type: "number", min: "0", value: value.broanBath != null ? value.broanBath : value.broanVents || 0, "data-est": "num", "data-key": "broanBath" })) +
      IC.field("Broan 8\" (kitchen)", IC.input({ type: "number", min: "0", value: value.broanKitchen || 0, "data-est": "num", "data-key": "broanKitchen" })) +
      IC.field("Chimneys", IC.input({ type: "number", min: "0", step: "1", value: value.chimneyCount || 0, "data-est": "num", "data-key": "chimneyCount" })) +
      IC.field("Wall flashing lf", IC.input({ type: "number", min: "0", value: value.wallFlashingLf, "data-est": "num", "data-key": "wallFlashingLf" })) +
      "</div><p class=\"tiny muted\" style=\"margin-top:8px\">Chimneys are $" + Number((IC.state.settings && IC.state.settings.chimneyEachPrice) || 500).toFixed(0) + " each. Step flashing bundles = ceil((wall lf + chimneys × 10) / 50).</p></section>" +
      '<section class="card"><h3 style="margin-bottom:12px">Materials</h3><div class="form-grid two">' + materials + "</div></section>" +
      '<section class="card"><h3 style="margin-bottom:12px">Add-ons & job costs</h3><div class="form-grid two">' +
      IC.field("Equipment rental", IC.input({ type: "number", min: "0", step: "0.01", value: value.equipmentRental || 0, "data-est": "num", "data-key": "equipmentRental" })) +
      IC.field("Waste %", IC.input({ type: "number", value: value.wastePercent, "data-est": "num", "data-key": "wastePercent" })) +
      IC.field("Material margin %", IC.input({ type: "number", value: value.markupPercent, "data-est": "num", "data-key": "markupPercent" })) +
      IC.field("Tear-off $/sq / layer", IC.input({ type: "number", min: "0", step: "0.01", value: value.tearoffRatePerSquare, "data-est": "num", "data-key": "tearoffRatePerSquare" })) +
      IC.field("Dumpster", IC.input({ type: "number", value: value.dumpster, "data-est": "num", "data-key": "dumpster" })) +
      IC.field("Permit", IC.input({ type: "number", value: value.permit, "data-est": "num", "data-key": "permit" })) +
      IC.field("Delivery fee", IC.input({ type: "number", min: "0", step: "0.01", value: value.deliveryFee != null ? value.deliveryFee : 65, "data-est": "num", "data-key": "deliveryFee" })) +
      IC.field("Sales tax %", IC.input({ type: "number", min: "0", step: "0.1", value: value.salesTaxPercent != null ? value.salesTaxPercent : 7, "data-est": "num", "data-key": "salesTaxPercent" })) +
      "</div>" +
      '<p class="tiny muted" style="margin-top:8px">Labor price comes from Settings → Estimate calculations → Labor rates: one rate per measured square, plus hip & ridge and starter at the base rate. Tear-off $/sq / layer is landfill dump cost: measured squares × tear-off layers × this rate. Equipment rental is one lump sum and is not taxed. Delivery fee is not taxed. Sales tax is on material cost only.</p>' +
      '<div class="addon-block"><label class="check"><input type="checkbox" data-est="gutter-on"' + (gutters.included ? " checked" : "") + ' /><span style="font-weight:600">Include gutters (lump sum)</span></label>' +
      (gutters.included
        ? '<div class="addon-fields">' +
            IC.field("Description", IC.textarea({ value: gutters.description, placeholder: IC.ADDON_DEFAULTS.gutters.description, rows: "2", "data-est": "gutter-desc" })) +
            IC.field("Price ($)", IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: gutters.price, "data-est": "gutter-price" }), "addon-price") +
          "</div>"
        : "") +
      "</div>" +
      '<div class="addon-block"><label class="check"><input type="checkbox" data-est="siding-on"' + (siding.included ? " checked" : "") + ' /><span style="font-weight:600">Include siding (lump sum)</span></label>' +
      (siding.included
        ? '<div class="addon-fields">' +
            IC.field("Description", IC.textarea({ value: siding.description, placeholder: IC.ADDON_DEFAULTS.siding.description, rows: "2", "data-est": "siding-desc" })) +
            IC.field("Price ($)", IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: siding.price, "data-est": "siding-price" }), "addon-price") +
          "</div>"
        : "") +
      "</div>" +
      '<div class="addon-block"><label class="check"><input type="checkbox" data-est="finance-on"' + (financing.included ? " checked" : "") + ' /><span style="font-weight:600">Include financing</span></label>' +
      (financing.included
        ? (financePlans.length
          ? '<div class="addon-fields">' + IC.field("Plan", IC.select({ "data-est": "finance-plan", value: financing.planId || financePlans[0].id }, financePlans.map(function (p) {
              return { value: p.id, label: p.name + " · " + p.feePercent + "%" };
            }))) + "</div>"
          : '<p class="tiny muted">No plans yet. Add them under Financing.</p>')
        : "") +
      "</div>" +
      '<div style="margin-top:12px">' + IC.field("Estimate notes", IC.textarea({ value: value.notes, "data-est": "notes" })) + "</div>" +
      '<div style="margin-top:12px">' + IC.btn(IC.icon("plus") + " Extra line", { variant: "ghost", data: 'data-act="est-add-extra"' }) + extras + "</div></section>" +
      '<section class="card"><h3 style="margin-bottom:8px">Warranty</h3>' +
      '<p class="muted" style="margin-bottom:12px">Checked warranties print on the estimate, on the page after the price. The wording is edited under Settings → Company profile.</p>' +
      '<label class="check"><input type="checkbox" data-est="warranty-ours"' + (IC.warrantyIncluded(value, "includeOurWarranty") ? " checked" : "") + ' /><span style="font-weight:600">Includes Our Warranty</span></label>' +
      '<label class="check"><input type="checkbox" data-est="warranty-mfg"' + (IC.warrantyIncluded(value, "includeMfgWarranty") ? " checked" : "") + ' /><span style="font-weight:600">Includes Manufacturer’s Warranty</span></label>' +
      "</section>" +
      '<section class="card"><h3 style="margin-bottom:8px">Quoted price</h3>' +
      '<p class="muted" style="margin-bottom:12px">This is the price the customer pays. Leave it matching the calculated price to follow it. Financing is an Ironclad cost and is not added to this number. Insurance is included in the price and hidden on the customer Estimate.</p>' +
      '<div class="form-grid two">' +
      IC.field("Quoted price ($)", IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: value.quotedTotal == null || value.quotedTotal === "" ? (c && c.preFinance != null ? c.preFinance : "") : value.quotedTotal, placeholder: c && c.preFinance != null ? String(c.preFinance) : "", "data-est": "num", "data-key": "quotedTotal", "data-null": "1" })) +
      "</div>" +
      (c && c.discountPercent > 0
        ? '<p class="tiny" style="margin-top:8px;color:var(--success)">' + c.discountPercent.toFixed(1) + "% discount · list " + IC.money(c.listTotal) + "</p>"
        : (c && c.listTotal != null && c.total > c.listTotal + 0.005
          ? '<p class="tiny" style="margin-top:8px">Raised from list ' + IC.money(c.listTotal) + " — increase is not shown on the customer Estimate.</p>"
          : "")) +
      "</section>" +
      IC.navySumHtml(c, { heading: "Proposal total", actual: true, itemizeSellLabor: true }) + "</div>";
  };

  IC.viewJobSummary = function (job) {
    return '<div class="page" style="display:grid;gap:12px">' +
      '<a class="card materials-entry" href="#/jobs/' + job.id + '/customer-quote"><div><h2 style="margin-bottom:4px">Customer quote</h2><p class="muted">What the homeowner sees. Price per structure and a total — no labor or material breakdown.</p></div>' + IC.icon("arrow") + "</a>" +
      '<a class="card materials-entry" href="#/jobs/' + job.id + '/job-sheet"><div><h2 style="margin-bottom:4px">Job Sheet</h2><p class="muted">Materials only, with qty and amount. For the lumber yard order.</p></div>' + IC.icon("arrow") + "</a>" +
      '<a class="card materials-entry" href="#/jobs/' + job.id + '/job-cost"><div><h2 style="margin-bottom:4px">Job cost</h2><p class="muted">Internal record: sell price, job cost, labor, materials, and profit.</p></div>' + IC.icon("arrow") + "</a>" +
      "</div>";
  };

  IC.viewDocPage = function (job, kind) {
    var settings = IC.state.settings;
    var customer = IC.state.customers.find(function (c) { return c.id === job.customerId; });
    var live = Object.assign({}, job, { estimate: IC.withComputed(job.estimate || IC.defaultEstimate(settings), settings, job) });
    var titles = { "customer-quote": "Customer quote", "job-sheet": "Job Sheet", "job-cost": "Job cost" };
    var shareActs = { "customer-quote": "share-customer-quote", "job-sheet": "share-job-sheet", "job-cost": "share-job-cost" };
    var body = kind === "customer-quote"
      ? IC.customerQuoteHtml(live, customer, settings)
      : kind === "job-sheet"
        ? IC.jobSheetHtml(live, settings.legalName)
        : IC.jobCostHtml(live);
    return '<div class="page"><div class="' + (kind === "job-cost" ? "no-print " : "") + '" style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">' +
      '<a class="back" href="#/jobs/' + job.id + '">' + IC.icon("back") + "</a>" +
      '<div style="min-width:0;flex:1"><p class="kicker muted">Job #' + job.number + '</p><h1 class="title" style="font-size:1.6rem">' + IC.esc(titles[kind] || "Document") + "</h1></div></div>" +
      '<div class="no-print" style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">' +
      IC.btn(IC.icon("share") + " Share", { data: 'data-act="' + shareActs[kind] + '"' }) +
      IC.btn("Print", { variant: "outline", data: 'data-act="print"' }) + "</div>" +
      body + "</div>";
  };

  IC.viewQuote = function (job, settings) {
    return IC.viewDocPage(job, "job-sheet");
  };

  IC.viewJobContract = function (job, customer, settings) {
    var url = job.contract ? (location.href.split("#")[0] + "#/sign/" + job.contract.signingToken) : "";
    return '<div class="page"><div class="no-print" style="display:flex;flex-wrap:wrap;gap:8px">' +
      IC.btn("Generate agreement", { data: 'data-act="gen-contract"' }) +
      (job.contract ? IC.btn(IC.icon("share") + " Share contract", { variant: "outline", data: 'data-act="share-contract"' }) +
        IC.btn("Share signing link", { variant: "outline", data: 'data-act="share-sign-link"' }) : "") +
      "</div>" +
      (job.contract
        ? '<p class="muted no-print">Remote link: <span style="color:var(--navy);word-break:break-all">' + IC.esc(url) + "</span></p>" +
          IC.contractHtml(job, customer, settings) +
          '<div class="card no-print"><h2 style="margin-bottom:12px">Sign on this device</h2>' +
          IC.field("Printed name", IC.input({ value: IC.ui.printedName || (session() && session().name) || "", "data-act": "printed-name" })) +
          '<canvas class="sig-pad" id="sig-pad"></canvas>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:8px">' + IC.btn("Clear", { variant: "ghost", size: "sm", data: 'data-act="clear-sig"' }) + "</div>" +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
          IC.btn("Save customer signature", { data: 'data-act="sign-customer"', disabled: !IC.ui.sigUrl }) +
          IC.btn("Save company signature", { variant: "outline", data: 'data-act="sign-company"', disabled: !IC.ui.sigUrl }) +
          "</div></div>"
        : '<p class="muted">Generate an agreement after the estimate is ready.</p>') +
      "</div>";
  };

  IC.viewCustomers = function () {
    var q = (IC.ui.customerSearch || "").trim().toLowerCase();
    var list = IC.state.customers.filter(function (c) {
      return (c.firstName + " " + c.lastName + " " + c.phone + " " + c.email + " " + c.city + " " + c.street).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return a.lastName.localeCompare(b.lastName); });
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">People</p><h1 class="title">Customers</h1></div>' +
      IC.btn(IC.icon("plus") + " Add", { data: 'data-act="open-new-customer"' }) + "</header>" +
      '<div class="search-wrap">' + IC.icon("search") + IC.input({ placeholder: "Search customers", value: IC.ui.customerSearch, "data-act": "customer-search" }) + "</div>" +
      '<div class="list-card">' + (list.length ? list.map(function (c) {
        var n = IC.state.jobs.filter(function (j) { return j.customerId === c.id; }).length;
        return '<a class="list-row" href="#/customers/' + c.id + '" style="display:flex;justify-content:space-between;align-items:center"><div><p style="font-weight:600">' + IC.esc(c.lastName) + ", " + IC.esc(c.firstName) + '</p><p class="muted">' + IC.esc(c.city ? c.city + ", " + c.state : (c.street || "No address")) + '</p></div><div class="muted" style="text-align:right"><div>' + /*IC.esc*/(c.phone ? IC.esc(IC.formatPhone(c.phone)) : '<span style="color: var(--warn);">MISSING PHONE</span>') + "</div><div>" + n + " job" + (n === 1 ? "" : "s") + "</div></div></a>";
      }).join("") : '<p class="empty">No customers yet.</p>') + "</div>" +
      (IC.ui.newCustomerOpen ? IC.viewCustomerModal() : "") + "</div>";
  };

  IC.viewCustomerModal = function () {
    var d = IC.ui.newCustomerDraft || IC.newCustomerDraft();
    IC.ui.newCustomerDraft = d;
    return '<div class="modal-bg" data-act="close-modal"><div class="modal" data-stop="1"><h2>New customer</h2><div class="form-grid two" style="margin-top:12px">' +
      IC.field("First", IC.input({ value: d.firstName, "data-cdraft": "firstName" })) +
      IC.field("Last", IC.input({ value: d.lastName, "data-cdraft": "lastName" })) +
      IC.field("Phone", IC.input({ value: d.phone, "data-cdraft": "phone" })) +
      IC.field("Email", IC.input({ value: d.email, "data-cdraft": "email" })) +
      IC.field("Street", IC.input({ value: d.street, "data-cdraft": "street" }), "span-2") +
      IC.field("City", IC.input({ value: d.city, "data-cdraft": "city" })) +
      IC.field("State", IC.input({ value: d.state, "data-cdraft": "state" })) +
      IC.field("ZIP", IC.input({ value: d.zip, "data-cdraft": "zip" })) +
      IC.field("Notes", IC.textarea({ value: d.notes, "data-cdraft": "notes" }), "span-2") +
      '</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:1.25rem">' +
      IC.btn("Cancel", { variant: "ghost", data: 'data-act="close-modal"' }) +
      IC.btn("Save customer", { data: 'data-act="create-customer"' }) + "</div></div></div>";
  };

  IC.viewCustomer = function (id) {
    var customer = IC.state.customers.find(function (c) { return c.id === id; });
    if (!customer) return "<p>Customer not found.</p>";
    var theirs = IC.state.jobs.filter(function (j) { return j.customerId === id; });
    return '<div class="page"><div style="display:flex;align-items:center;gap:12px"><a class="back" href="#/customers">' + IC.icon("back") + '</a><h1 class="title">' + IC.esc(customer.firstName + " " + customer.lastName) + "</h1></div>" +
      '<div class="card"><div class="form-grid two">' +
      IC.field("First", IC.input({ value: customer.firstName, "data-cust": "firstName", "data-id": id })) +
      IC.field("Last", IC.input({ value: customer.lastName, "data-cust": "lastName", "data-id": id })) +
      IC.field("Phone", IC.input({ value: customer.phone, "data-cust": "phone", "data-id": id })) +
      IC.field("Email", IC.input({ value: customer.email, "data-cust": "email", "data-id": id })) +
      IC.field("Street", IC.input({ value: customer.street, "data-cust": "street", "data-id": id }), "span-2") +
      IC.field("City", IC.input({ value: customer.city, "data-cust": "city", "data-id": id })) +
      IC.field("State", IC.input({ value: customer.state, "data-cust": "state", "data-id": id })) +
      IC.field("ZIP", IC.input({ value: customer.zip, "data-cust": "zip", "data-id": id })) +
      IC.field("Notes", IC.textarea({ value: customer.notes, "data-cust": "notes", "data-id": id }), "span-2") +
      '</div><div style="display:flex;justify-content:flex-end;margin-top:1rem">' +
      IC.btn("New job for this customer", { data: 'data-act="job-for-customer" data-id="' + id + '"' }) + "</div></div>" +
      '<div class="card"><h2 style="margin-bottom:12px">Jobs</h2>' +
      (theirs.length ? '<div class="job-stack">' + theirs.map(function (j) {
        return '<a class="job-row" href="#/jobs/' + j.id + '"><span>#' + j.number + " · " + IC.esc(j.ownerName || "Unassigned") + '</span><span style="display:flex;gap:8px;align-items:center"><span class="tabular muted">' + (j.price ? IC.money(j.price) : "") + "</span>" + IC.badge(j.status) + "</span></a>";
      }).join("") + "</div>" : '<p class="muted">No jobs yet.</p>') + "</div></div>";
  };

  IC.viewSchedule = function () {
    var jobs = mineJobs().filter(function (j) { return j.scheduledDate; })
      .sort(function (a, b) { return (a.scheduledDate || "").localeCompare(b.scheduledDate || ""); });
    var groups = [];
    jobs.forEach(function (j) {
      var last = groups[groups.length - 1];
      if (!last || last.date !== j.scheduledDate) groups.push({ date: j.scheduledDate, list: [j] });
      else last.list.push(j);
    });
    return '<div class="page"><header><p class="kicker muted">Production</p><h1 class="title">Schedule</h1><p class="muted" style="margin-top:4px">Crew and date live on each job. Admins see the whole board.</p></header>' +
      (groups.length ? groups.map(function (g) {
        return "<section><h2 style='color:var(--navy);margin-bottom:8px'>" + IC.formatDateLong(g.date) + '</h2><div style="display:grid;gap:8px">' +
          g.list.map(function (j) {
            return '<a href="#/jobs/' + j.id + '"><div class="card" style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><p style="font-weight:600">#' + j.number + " " + IC.esc(j.customerName) + '</p><p class="muted">' + IC.esc(j.crewName || "Crew TBD") + " · " + IC.esc(j.ownerName || "No owner") + "</p></div>" + IC.badge(j.status) + "</div></a>";
          }).join("") + "</div></section>";
      }).join("") : '<div class="card"><p class="muted">No jobs on the calendar. Open a sold job and pick a crew + date.</p></div>') +
      "</div>";
  };

  IC.viewNotifications = function () {
    var s = session();
    var mine = IC.state.notifications.filter(function (n) { return IC.noteIsForSession(n, s); })
      .sort(function (a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });
    var me = IC.state.team.find(function (t) { return t.id === s.memberId || (s.firebaseUid && t.firebaseUid === s.firebaseUid); }) || s;
    var prefs = IC.normalizeNotifyPrefs(me.notifyPrefs, me);
    var options = [
      { key: "jobCreated", label: "A new job is created" },
      { key: "jobAssigned", label: "I have been assigned a new job" },
      { key: "statusChanged", label: "The status of my project changed" },
      { key: "jobScheduled", label: "My project has been scheduled" },
      { key: "jobComplete", label: "My project is complete" },
    ];
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Inbox</p><h1 class="title">Alerts</h1></div><div style="display:flex;flex-wrap:wrap;gap:8px">' +
      IC.btn("Mark all read", { variant: "outline", size: "sm", data: 'data-act="mark-all"' }) +
      (mine.length ? IC.btn("Clear inbox", { variant: "outline", size: "sm", data: 'data-act="clear-inbox"' }) : "") +
      IC.btn("Enable push", { variant: "outline", size: "sm", data: 'data-act="enable-push"' }) +
      "</div></header>" +
      '<section class="card notify-prefs"><h2 style="margin-bottom:6px">Notifications</h2>' +
      '<p class="muted" style="margin-bottom:12px">Choose which push notifications you want to receive. This iPad must Allow Notifications (and be added to the Home Screen on iPhone/iPad).</p>' +
      options.map(function (opt) {
        return '<label class="check"><input type="checkbox" data-act="notify-pref" data-pref="' + opt.key + '"' + (prefs[opt.key] ? " checked" : "") + " /><span>" + opt.label + "</span></label>";
      }).join("") +
      "</section>" +
      '<h2 style="margin:1.25rem 0 8px">Inbox</h2>' +
      (mine.length ? '<ul class="alert-list">' + mine.map(function (n) {
        var inner = '<p style="font-weight:600">' + IC.esc(n.title) + '</p><p class="muted">' + IC.esc(n.body) + '</p><p class="tiny">' + IC.formatDate(n.createdAt) + "</p>";
        var body = n.jobId
          ? '<a class="alert-body" href="#/jobs/' + n.jobId + '" data-act="read-note" data-id="' + n.id + '">' + inner + "</a>"
          : '<div class="alert-body" data-act="read-note" data-id="' + n.id + '">' + inner + "</div>";
        return '<li><div class="card alert-row' + (n.read ? " is-read" : " is-unread") + '">' +
          body +
          IC.btn(IC.icon("trash"), { variant: "ghost", class: "btn-icon", data: 'data-act="delete-note" data-id="' + n.id + '" aria-label="Delete alert"' }) +
          "</div></li>";
      }).join("") + "</ul>" : '<div class="card"><p class="muted">No alerts yet.</p></div>') + "</div>";
  };

  IC.settingsCard = function (href, title, blurb) {
    return '<a class="card materials-entry" href="' + href + '"><div><h2 style="margin-bottom:4px">' + title + '</h2><p class="muted">' + blurb + "</p></div>" + IC.icon("arrow") + "</a>";
  };

  IC.settingsPage = function (title, body, extraHead) {
    return '<div class="page"><header class="page-head"><a class="back" href="#/settings" aria-label="Back to Settings">' + IC.icon("back") + '</a><div><p class="kicker muted">Settings</p><h1 class="title">' + title + "</h1></div>" + (extraHead || "") + "</header>" + body + "</div>";
  };

  IC.viewAddUserModal = function () {
    var d = IC.ui.addUserDraft || { name: "", role: "sales", title: "Sales", salesName: "", email: "" };
    IC.ui.addUserDraft = d;
    return '<div class="modal-bg" data-act="close-modal"><div class="modal" data-stop="1"><h2>Add a teammate</h2>' +
      '<p class="muted" style="margin:8px 0 12px">For someone who doesn’t have a login yet — so you can still assign jobs to them. When they create an account, grant access and link them to this seat.</p>' +
      '<div class="form-grid two">' +
      IC.field("Name", IC.input({ value: d.name, "data-udraft": "name", placeholder: "First name", autocomplete: "off" })) +
      IC.field("Role", IC.select({ "data-udraft": "role", value: d.role }, IC.roleOptions())) +
      IC.field("Shown as", IC.input({ value: d.title, "data-udraft": "title", placeholder: "Admin, Owner, Manager, Sales…" })) +
      IC.field("Owns jobs as", IC.input({ value: d.salesName, "data-udraft": "salesName", placeholder: "Blank if they don’t own jobs" })) +
      IC.field("Commission %", IC.input({ type: "number", min: "0", step: "0.1", value: d.commissionPercent != null ? d.commissionPercent : 0, "data-udraft": "commissionPercent", placeholder: "e.g. 6" })) +
      '</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:1.25rem">' +
      IC.btn("Cancel", { variant: "ghost", data: 'data-act="close-modal"' }) +
      IC.btn("Add seat", { data: 'data-act="save-teammate"' }) + "</div></div></div>";
  };

  IC.viewSettings = function (page) {
    if (page === "company") return IC.viewSettingsCompany();
    if (page === "defaults") return IC.viewSettingsDefaults();
    if (page === "calculations") return IC.viewSettingsCalculations();
    if (page === "team") return IC.viewSettingsTeam();
    if (page === "crews") return IC.viewSettingsCrews();
    if (page === "permissions") return IC.viewSettingsPermissions();
    var s = session();
    var admin = IC.isAdmin(s);
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Company</p><h1 class="title">Settings</h1></div>' +
      IC.btn("Sign out", { variant: "outline", data: 'data-act="sign-out"' }) + "</header>" +
      '<div class="card"><h2 style="margin-bottom:8px">Appearance</h2><p class="muted" style="margin-bottom:12px">This iPad only. Light, dark, or match the system setting.</p>' +
      '<div class="theme-pills" role="group" aria-label="Theme">' +
      [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "System" }].map(function (opt) {
        var on = IC.getThemePref() === opt.id;
        return '<button type="button" class="' + (on ? "on" : "") + '" data-act="set-theme" data-theme="' + opt.id + '">' + opt.label + "</button>";
      }).join("") +
      "</div></div>" +
      '<div class="card"><h2 style="margin-bottom:8px">Invite a teammate</h2>' +
      '<p class="muted" style="margin-bottom:12px">Send the IRONCLAD link in a text or email. They install the app and create an account. You still grant Sales, Manager, or Admin before they can see jobs.</p>' +
      (function () {
        var join = IC.appJoinUrl();
        if (/localhost|127\.0\.0\.1/.test(join)) return "";
        return '<p class="tiny" style="margin-bottom:12px;word-break:break-all">' + IC.esc(join) + "</p>";
      })() +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
      IC.btn(IC.icon("share") + " Invite", { data: 'data-act="invite-app"' }) +
      IC.btn("Copy link", { variant: "outline", data: 'data-act="copy-invite"' }) +
      "</div></div>" +
      IC.settingsCard("#/settings/company", "Company profile", "Legal name, address, phone, warranty, insurance, and contract language.") +
      IC.settingsCard("#/settings/defaults", "Estimate defaults", "Waste, tax rate, chimney price, dumpster, permit, and delivery.") +
      (admin ? IC.settingsCard("#/settings/calculations", "Estimate calculations", "Labor rates, coverage, edge-metal waste, and sell prices the takeoff uses on every job.") : "") +
      (IC.can(s, "team", "read") || admin ? IC.settingsCard("#/settings/team", "Team", "Who can sign in, roles, and commission. Only admins can change this.") : "") +
      (admin ? IC.settingsCard("#/settings/crews", "Crews", "Crew names, foremen, and phones. Pay rates live in Labor catalog.") : "") +
      (IC.can(s, "labor", "read") ? IC.settingsCard("#/labor", "Labor catalog", "Crew pay: one rate per measured square, plus hip & ridge and starter at the base rate. Not the customer price.") : "") +
      (IC.can(s, "materials", "read") ? IC.settingsCard("#/materials", "Materials catalog", "Add colors, retire SKUs, and update prices. Changes apply the next time an estimate is saved.") : "") +
      (admin ? IC.settingsCard("#/settings/permissions", "Manage permissions", "Control what Managers and Sales can see and edit.") : "") +
      (admin
        ? '<div class="card"><h2 style="margin-bottom:8px">Sync</h2><p class="muted">Everyone who is signed in shares the same company jobs, customers, catalog, and team list from Firestore. Removing samples is permanent for the whole company — they will not come back from other iPads.</p></div>' +
          IC.btn("Remove sample jobs & customers", { variant: "outline", data: 'data-act="clear-seed"' })
        : "") +
      "</div>";
  };

  IC.viewSettingsCompany = function () {
    var s = session();
    var admin = IC.isAdmin(s);
    var settings = IC.state.settings;
    var body = '<div class="card"><h2 style="margin-bottom:12px">On the paperwork</h2><div class="form-grid two">' +
      IC.field("Legal name", IC.input({ value: settings.legalName, "data-set": "legalName", disabled: !admin })) +
      IC.field("License #", IC.input({ value: settings.licenseNumber, "data-set": "licenseNumber", disabled: !admin })) +
      IC.field("Phone", IC.input({ value: settings.phone, "data-set": "phone", disabled: !admin })) +
      IC.field("Email", IC.input({ value: settings.email, "data-set": "email", disabled: !admin })) +
      IC.field("Street", IC.input({ value: settings.street, "data-set": "street", disabled: !admin }), "span-2") +
      IC.field("City", IC.input({ value: settings.city, "data-set": "city", disabled: !admin })) +
      IC.field("State", IC.input({ value: settings.state, "data-set": "state", disabled: !admin })) +
      IC.field("ZIP", IC.input({ value: settings.zip, "data-set": "zip", disabled: !admin })) +
      IC.field("Website", IC.input({ value: settings.website, "data-set": "website", disabled: !admin, placeholder: "https://ironcladroofing.com" })) +
      IC.field("Workmanship warranty (years)", IC.input({ type: "number", value: settings.warrantyWorkmanshipYears, "data-set": "warrantyWorkmanshipYears", "data-num": "1", disabled: !admin })) +
      IC.field("Insurance %", IC.input({ type: "number", min: "0", step: "0.01", value: settings.insurancePercent != null && settings.insurancePercent !== "" ? settings.insurancePercent : 1, "data-set": "insurancePercent", "data-num": "1", disabled: !admin })) +
      IC.field("Mfr. warranty flat fee", IC.input({ type: "number", min: "0", step: "0.01", value: settings.mfgWarrantyFlat != null && settings.mfgWarrantyFlat !== "" ? settings.mfgWarrantyFlat : 75, "data-set": "mfgWarrantyFlat", "data-num": "1", disabled: !admin })) +
      IC.field("Mfr. warranty from (sq)", IC.input({ type: "number", min: "0", step: "0.1", value: settings.mfgWarrantyMinSq != null && settings.mfgWarrantyMinSq !== "" ? settings.mfgWarrantyMinSq : 25, "data-set": "mfgWarrantyMinSq", "data-num": "1", disabled: !admin })) +
      IC.field("Mfr. warranty through (sq)", IC.input({ type: "number", min: "0", step: "0.1", value: settings.mfgWarrantyMaxSq != null && settings.mfgWarrantyMaxSq !== "" ? settings.mfgWarrantyMaxSq : 100, "data-set": "mfgWarrantyMaxSq", "data-num": "1", disabled: !admin })) +
      IC.field("Mfr. warranty $/sq outside", IC.input({ type: "number", min: "0", step: "0.01", value: settings.mfgWarrantyPerSq != null && settings.mfgWarrantyPerSq !== "" ? settings.mfgWarrantyPerSq : 3, "data-set": "mfgWarrantyPerSq", "data-num": "1", disabled: !admin })) +
      IC.field("Payment terms", IC.textarea({ value: settings.paymentTerms, "data-set": "paymentTerms", disabled: !admin }), "span-2") +
      IC.field("Contract introduction", IC.textarea({ value: settings.contractIntro, "data-set": "contractIntro", disabled: !admin }), "span-2") +
      IC.field("Our warranty", IC.textarea({ value: settings.estimateWarranty != null ? settings.estimateWarranty : IC.SETTINGS.estimateWarranty, "data-set": "estimateWarranty", disabled: !admin, rows: "10" }), "span-2") +
      IC.field("Manufacturer's warranty", IC.textarea({ value: settings.mfgWarrantyText != null ? settings.mfgWarrantyText : IC.SETTINGS.mfgWarrantyText, "data-set": "mfgWarrantyText", disabled: !admin, rows: "12" }), "span-2") +
      IC.field("Scope of work", IC.textarea({ value: settings.estimateScope != null ? settings.estimateScope : IC.SETTINGS.estimateScope, "data-set": "estimateScope", disabled: !admin, rows: "6" }), "span-2") +
      "</div>" +
      '<p class="tiny muted" style="margin-top:8px">Our warranty, Manufacturer’s warranty, and Scope of work print on the customer Estimate when that job’s Warranty card includes them. Lines that start with a hyphen become a list. Scope of work can use {shingle}, {years}, and {courtesy}. The warranty text can use {years} and {shingle}. Insurance % is added to the proposed price. The manufacturer warranty fee is paid by Ironclad and comes out of profit only.</p></div>';
    return IC.settingsPage("Company profile", body);
  };

  IC.viewSettingsDefaults = function () {
    var admin = IC.isAdmin(session());
    var settings = IC.state.settings;
    var rates = [
      ["wastePercent", "Waste %"],
      ["markupPercent", "Material margin %"],
      ["tearoffRatePerSquare", "Tear-off $ / sq / layer (dump)"],
      ["dumpsterDefault", "Dumpster default"],
      ["permitDefault", "Permit default"],
      ["deliveryFeeDefault", "Delivery fee default"],
      ["salesTaxPercent", "Sales tax % (on material cost)"],
      ["chimneyEachPrice", "Chimney $ / each"],
    ];
    var body = '<div class="card"><h2 style="margin-bottom:8px">Default estimate rates</h2><p class="muted" style="margin-bottom:12px">Used when a new estimate is created. Customer install and tear-off prices live under Estimate calculations. Each job can override tax, dump, and delivery on Assessment.</p><div class="form-grid two">' +
      rates.map(function (r) { return IC.field(r[1], IC.input({ type: "number", value: settings[r[0]], "data-set": r[0], "data-num": "1", disabled: !admin })); }).join("") +
      "</div></div>";
    return IC.settingsPage("Estimate defaults", body);
  };

  IC.viewSettingsCalculations = function () {
    var admin = IC.isAdmin(session());
    if (!admin) {
      return IC.settingsPage("Estimate calculations", '<div class="card"><p class="muted">Only an admin can change how the takeoff is counted.</p></div>');
    }
    var settings = IC.state.settings || IC.SETTINGS;
    function num(key, fallback) {
      var n = Number(settings[key]);
      return Number.isFinite(n) ? n : fallback;
    }
    function field(key, label, hint, step) {
      var val = settings[key];
      if (val == null || val === "") val = IC.SETTINGS[key];
      return '<label class="field"><span class="field-label">' + IC.esc(label) + "</span>" +
        IC.input({ type: "number", min: "0", step: step || "1", value: val, "data-set": key, "data-num": "1" }) +
        '<span class="tiny calc-hint">' + hint + "</span></label>";
    }
    function group(title, blurb, fields) {
      return '<section class="card"><h2 style="margin-bottom:6px">' + title + '</h2><p class="muted" style="margin-bottom:12px">' + blurb + '</p><div class="form-grid two">' + fields + "</div></section>";
    }
    var waste = num("wastePercent", 12);
    var perSq = num("shingleBundlesPerSquare", 3);
    var bundles = Math.max(0, Math.ceil(20 * (1 + waste / 100) * perSq - 1e-9));
    var laborRates = IC.normalizeLaborRates(settings.laborRates);
    function sellControl(part, name) {
      var attrs = {
        type: "number",
        step: "1",
        inputmode: "decimal",
        "data-labor-rate": "sell",
        "data-rate-part": part,
        "data-rate-name": name || "",
        "aria-label": part + (name ? " " + name : ""),
        value: part === "base" || part === "flatRate" ? laborRates[part] : laborRates[part][name],
      };
      if (part === "base") attrs.class = "pay-hero-input";
      return IC.input(attrs);
    }
    var body =
      '<div class="card"><h2 style="margin-bottom:6px">Shop standard</h2>' +
      '<p class="muted">These numbers apply the next time any job is opened — including jobs already written. Pitch rules stay fixed: felt on 4/12 and steeper, ice on 2/12–3.9/12 and on eaves and valleys, drip edge on rakes only.</p>' +
      '<p style="margin-top:12px;font-weight:600">20 squares at ' + waste + "% waste orders " + bundles + " shingle bundles (" + perSq + " per square).</p></div>" +
      '<section class="card"><h2 style="margin-bottom:6px">Labor rates</h2>' +
      '<p class="muted" style="margin-bottom:12px">Customer price. Same schedule as crew pay, with its own base rate. A typed Quoted price on a job stays until that box is cleared.</p>' +
      payScheduleHtml(laborRates, sellControl, function (pitch, level, tear) {
        return IC.customerSquareParts(pitch, level, tear, laborRates);
      }) +
      "</section>" +
      group("Sheathing", "Customer labor on the assessment. The first courtesy pieces are installed free. Each piece after that is charged at the rate. This is not the yard price and not what the crew is paid.",
        field("sheathingLaborPerSheet", "OSB / Plywood $ / sheet", "Charged for each sheet past the courtesy count.", "0.01") +
        field("sheathingLaborCourtesy", "OSB / Plywood courtesy", "This many sheets are free on every job. Default 3.", "1") +
        field("woodLaborPerBoard", "Wood boards $ / board", "Charged for each board past the courtesy count.", "0.01") +
        field("woodLaborCourtesy", "Wood boards courtesy", "This many boards are free on every job. Default 3.", "1")) +
      group("Shingles", "Uses the waste % on that job, not a second waste number.",
        field("shingleBundlesPerSquare", "Shingle bundles / square", "Bundles ordered per roofing square, after that job’s waste %.", "0.1") +
        field("hipRidgeLfPerBundle", "Hip & ridge lf / bundle", "Feet of hip plus ridge one bundle covers, after that job’s waste %.", "1") +
        field("starterLfPerBundle", "Starter lf / bundle", "Feet of eaves plus rakes one starter bundle covers, after that job’s waste %.", "1")) +
      group("Edge metal", "Drip and gutter apron do not use the job waste %. They use the percent below.",
        field("edgeStickFeet", "Stick length (ft)", "Length of one drip-edge or gutter-apron stick.", "1") +
        field("edgeWastePercent", "Edge waste %", "Extra length on rakes (drip) and eaves (apron).", "1") +
        field("dripExtraSticks", "Extra drip sticks", "Added once on every structure that has rakes. Apron does not get this extra.", "1")) +
      group("Underlayment", "Felt is steep slope only, with no waste. Ice on low slope is rolls per square. Ice on eaves and valleys uses the job waste %.",
        field("feltSquaresPerRoll", "Felt squares / roll", "Steep squares one felt roll covers. No waste is added.", "0.1") +
        field("iceLfPerRoll", "Ice lf / roll", "Eave and valley feet one ice roll covers on 4/12 and steeper, plus half the wall flashing.", "1") +
        field("iceRollsPerLowSquare", "Ice rolls / low-slope sq", "Rolls per square on 2/12–3.9/12. That pitch gets ice instead of felt.", "0.1")) +
      group("Ventilation", "Ridge vent is ridge feet only. Box vents stay a count on the job.",
        field("ridgeVentLfPerRoll", "Ridge vent lf / roll", "Ridge feet one roll covers. No waste is added.", "1")) +
      group("Flashing", "Step flashing is wall footage plus a set length per chimney. Chimney flashing is a sell price, not a catalog SKU.",
        field("stepLfPerBundle", "Step flashing lf / bundle", "Feet in one bundle of step flashing.", "1") +
        field("stepLfPerChimney", "Step flashing lf / chimney", "Added for each chimney, on top of the wall flashing footage.", "1") +
        field("chimneyEachPrice", "Chimney flashing $ / each", "Customer price per chimney. Same number as Estimate defaults.", "1")) +
      group("Flat roof", "Base and cap use the job waste %. Custom edge metal stays a price in the materials catalog.",
        field("baseSheetSquaresPerRoll", "Base sheet squares / roll", "Squares one base-sheet roll covers, after that job’s waste %.", "0.1") +
        field("capSheetSquaresPerRoll", "Cap sheet squares / roll", "Squares one cap-sheet roll covers, after that job’s waste %.", "0.1")) +
      group("Decking", "Only used when a structure has a replace % instead of a sheet count.",
        field("sheathingSqftPerSheet", "Sheathing sq ft / sheet", "Square feet per OSB or plywood sheet.", "1"));
    return IC.settingsPage("Estimate calculations", body);
  };

  IC.viewSettingsTeam = function () {
    var s = session();
    var canRead = IC.can(s, "team", "read") || IC.isAdmin(s);
    var canWrite = IC.can(s, "team", "write");
    if (!canRead) {
      return IC.settingsPage("Team", '<div class="card"><p class="muted">You don’t have access to Team. Ask an admin to turn it on under Manage permissions.</p></div>');
    }
    var body = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap"><h2>Team</h2>' +
      (canWrite ? IC.btn("Add seat", { size: "sm", variant: "outline", data: 'data-act="add-teammate"' }) : "") +
      '</div><p class="muted" style="margin-bottom:12px">' +
      (canWrite
        ? "People create their own account on the sign-in screen. You grant Sales, Manager, or Admin here. Until then they see a waiting page — no jobs. Only people in Firestore show up here."
        : "View only. Commission and roles can be changed by an Admin.") +
      "</p>" +
      (function () {
        var pending = IC.state.team.filter(function (m) { return m.status === "pending" || m.role === "pending"; });
        var seats = IC.state.team.filter(function (m) { return m.status !== "pending" && m.role !== "pending"; });
        var seatOpts = seats.filter(function (m) { return m.placeholder || !m.email; }).map(function (m) {
          return { value: m.id, label: m.name + " · " + IC.roleLabel(m) };
        });
        var pendingHtml = pending.length ? pending.map(function (m) {
          return '<div class="team-card pending-card"><p style="font-weight:600">' + IC.esc(m.name) + '</p><p class="muted">' + IC.esc(m.email || "No email") + "</p>" +
            (canWrite
              ? '<div class="grant-row">' +
                IC.btn("Grant sales", { size: "sm", data: 'data-act="grant-user" data-id="' + m.id + '" data-role="sales"' }) +
                IC.btn("Grant manager", { size: "sm", variant: "outline", data: 'data-act="grant-user" data-id="' + m.id + '" data-role="manager"' }) +
                IC.btn("Grant admin", { size: "sm", variant: "outline", data: 'data-act="grant-user" data-id="' + m.id + '" data-role="admin"' }) +
                (seatOpts.length ? IC.select({ "data-act": "link-seat", "data-id": m.id }, [{ value: "", label: "Link to existing seat…" }].concat(seatOpts)) : "") +
                IC.btn("Deny", { size: "sm", variant: "ghost", data: 'data-act="deny-user" data-id="' + m.id + '"' }) +
                "</div>"
              : '<p class="tiny" style="margin-top:8px">Waiting on an admin.</p>') +
            "</div>";
        }).join("") : "";
        var seatsHtml = seats.map(function (m) {
          var roleVal = m.role === "admin" || m.role === "manager" || m.role === "sales" ? m.role : "sales";
          return '<div class="team-card"><div class="form-grid two">' +
            IC.field("Name", IC.input({ value: m.name, "data-team": "name", "data-id": m.id, disabled: !canWrite })) +
            IC.field("Role", IC.select({ "data-team": "role", "data-id": m.id, value: roleVal, disabled: !canWrite }, IC.roleOptions())) +
            IC.field("Shown as", IC.input({ value: IC.roleLabel(m), "data-team": "title", "data-id": m.id, placeholder: "Admin, Owner, Manager, Sales…", disabled: !canWrite })) +
            IC.field("Owns jobs as", IC.input({ value: m.salesName || "", "data-team": "salesName", "data-id": m.id, placeholder: "Name on jobs, or blank", disabled: !canWrite })) +
            IC.field("Commission %", IC.input({ type: "number", min: "0", step: "0.1", value: m.commissionPercent != null ? m.commissionPercent : 0, "data-team": "commissionPercent", "data-id": m.id, disabled: !canWrite, placeholder: "e.g. 6" })) +
            IC.field("Email", IC.input({ value: m.email, type: "email", "data-team": "email", "data-id": m.id, disabled: !canWrite, placeholder: m.placeholder ? "Creates an account, then you grant access" : "" })) +
            IC.field("Phone", IC.input({ value: m.phone || "", type: "tel", "data-team": "phone", "data-id": m.id, disabled: !canWrite, placeholder: "(765) 555-0100" })) +
            "</div>" +
            (m.placeholder && !m.email ? '<p class="tiny" style="margin-top:8px">No login yet — they create an account, then you grant access and can link it to this seat.</p>' : "") +
            (canWrite
              ? (m.id === s.memberId
                ? '<p class="tiny" style="margin-top:8px">That’s you — you can’t remove your own login.</p>'
                : '<div style="display:flex;justify-content:flex-end;margin-top:8px">' + IC.btn("Remove", { variant: "danger", size: "sm", data: 'data-act="remove-teammate" data-id="' + m.id + '"' }) + "</div>")
              : "") +
            "</div>";
        }).join("");
        return (pendingHtml ? "<h3 style=\"margin:4px 0 8px\">Waiting on you</h3>" + pendingHtml : "") + (seatsHtml || '<p class="muted">No teammates in Firestore yet.</p>');
      })() + "</div>" +
      (IC.ui.addUserOpen ? IC.viewAddUserModal() : "");
    return IC.settingsPage("Team", body);
  };

  IC.viewSettingsCrews = function () {
    var admin = IC.isAdmin(session());
    if (!admin) {
      return IC.settingsPage("Crews", '<div class="card"><p class="muted">Only admins can edit the crew roster. Labor rates are in Labor catalog.</p></div>');
    }
    var body = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>Crew roster</h2>' +
      IC.btn("Add crew", { size: "sm", variant: "outline", data: 'data-act="add-crew"' }) + "</div>" +
      IC.state.crews.map(function (c) {
        return '<div class="form-grid two" style="background:var(--paper);border-radius:16px;padding:12px;margin-bottom:8px">' +
          IC.field("Crew name", IC.input({ value: c.name, "data-crew": "name", "data-id": c.id })) +
          IC.field("Foreman", IC.input({ value: c.foreman, "data-crew": "foreman", "data-id": c.id })) +
          IC.field("Phone", IC.input({ value: c.phone, "data-crew": "phone", "data-id": c.id })) +
          IC.field("Notes", IC.input({ value: c.notes, "data-crew": "notes", "data-id": c.id })) + "</div>";
      }).join("") + "</div>";
    return IC.settingsPage("Crews", body, IC.btn("Add crew", { variant: "outline", data: 'data-act="add-crew"' }));
  };

  IC.viewSettingsPermissions = function () {
    if (!IC.isAdmin(session())) {
      return IC.settingsPage("Permissions", '<div class="card"><p class="muted">Only admins can manage permissions.</p></div>');
    }
    var perms = IC.livePermissions();
    var roles = [
      { id: "manager", label: "Manager" },
      { id: "sales", label: "Sales" },
    ];
    var head = "<thead><tr><th>Area</th>" + roles.map(function (r) {
      return "<th>" + r.label + " read</th><th>" + r.label + " edit</th>";
    }).join("") + "</tr></thead>";
    var rows = (IC.PERM_RESOURCES || []).map(function (res) {
      return "<tr><td>" + IC.esc(res.label) + "</td>" + roles.map(function (r) {
        var cell = (perms[r.id] && perms[r.id][res.id]) || { read: false, write: false };
        return "<td>" + '<label class="check"><input type="checkbox" data-act="perm" data-role="' + r.id + '" data-resource="' + res.id + '" data-perm="read"' + (cell.read ? " checked" : "") + " /></label></td>" +
          "<td>" + '<label class="check"><input type="checkbox" data-act="perm" data-role="' + r.id + '" data-resource="' + res.id + '" data-perm="write"' + (cell.write ? " checked" : "") + " /></label></td>";
      }).join("") + "</tr>";
    }).join("");
    var body = '<div class="card"><h2 style="margin-bottom:8px">What each role can see</h2>' +
      '<p class="muted" style="margin-bottom:12px">Admins always have full access. Managers start with view-only Materials, Labor, and Team. Sales starts with none of these. Uncheck Read to hide a page entirely.</p>' +
      '<div class="perm-wrap"><table class="perm-table">' + head + "<tbody>" + rows + "</tbody></table></div></div>";
    return IC.settingsPage("Manage permissions", body);
  };

  function payScheduleHtml(rates, control, partsOf) {
    function rateCell(amount, controlHtml, note) {
      return '<td><div class="pay-rate tabular">' + IC.money(amount) + "</div>" +
        (controlHtml ? '<div class="pay-add">' + controlHtml + "</div>" : "") +
        (note ? '<div class="pay-note">' + note + "</div>" : "") +
        "</td>";
    }
    var storyHeads = (IC.STORIES || []).map(function (s) {
      var label = s.replace("-Story", "-story");
      if (s === "1-Story") return "<th>" + label + "</th>";
      return "<th><div>" + label + "</div>" +
        control("storyAdd", s) +
        '<div class="pay-note">added to every pitch</div></th>';
    }).join("");
    var pitchRows = (IC.PITCHES || []).map(function (p) {
      var cells = (IC.STORIES || []).map(function (s) {
        var amount = partsOf(p, s, "None").rate;
        if (s !== "1-Story") {
          var story = Number(rates.storyAdd[s]) || 0;
          return rateCell(amount, "", story ? "+" + IC.money(story) + " story" : "no story adder");
        }
        if (p === "Flat Roof") return rateCell(amount, control("flatRate"), "flat rate, replaces base");
        var add = Number(rates.pitchAdd[p]) || 0;
        return rateCell(amount, control("pitchAdd", p), add ? "+" + IC.money(add) + " pitch" : "base");
      }).join("");
      return "<tr><th scope=\"row\">" + IC.esc(p) + "</th>" + cells + "</tr>";
    }).join("");
    var layerCells = ["1", "2", "3", "4", "5"].map(function (n) {
      if (n === "1") return '<td><div class="pay-rate">Included</div><div class="pay-note">no extra on a 1-layer</div></td>';
      return rateCell(Number(rates.layerAdd[n]) || 0, control("layerAdd", n), "added once");
    }).join("");
    var samples = [
      ["1-layer · 4/12 · 1-story", "4/12 - 7/12", "1-Story", "1-Layer"],
      ["2-layer · 8/12 · 1-story", "8/12 - 9/12", "1-Story", "2-Layer"],
      ["3-layer · 8/12 · 2-story", "8/12 - 9/12", "2-Story", "3-Layer"],
    ].map(function (ex) {
      var parts = partsOf(ex[1], ex[2], ex[3]);
      var bits = [IC.money(parts.base)];
      if (parts.pitchAdd) bits.push(IC.money(parts.pitchAdd) + " pitch");
      if (parts.storyAdd) bits.push(IC.money(parts.storyAdd) + " story");
      if (parts.layerAdd) bits.push(IC.money(parts.layerAdd) + " layer");
      return "<li><span>" + IC.esc(ex[0]) + "</span><strong class=\"tabular\">" + IC.money(parts.rate) + "/sq</strong><em>" + bits.join(" + ") + "</em></li>";
    }).join("");
    return '<div class="pay-hero"><div><p class="field-label">Base rate</p><div class="pay-hero-row">' +
      control("base") +
      '<span>/ sq</span></div><p class="tiny muted">4/12 on a 1-story, 1-layer roof. Flat roof uses its own rate.</p></div></div>' +
      '<h3 style="margin:18px 0 8px">Install & tear-off</h3>' +
      '<p class="tiny muted" style="margin-bottom:10px">Each cell is one measured square before the layer adder. The 2-story and 3-story amounts add the column adder on top.</p>' +
      '<div class="pay-wrap"><table class="pay-table"><thead><tr><th>Pitch</th>' + storyHeads + "</tr></thead><tbody>" + pitchRows + "</tbody></table></div>" +
      '<h3 style="margin:18px 0 8px">Extra layers</h3>' +
      '<p class="tiny muted" style="margin-bottom:10px">Added once per square. A 3-layer tear-off is +$20, not three times the 1-layer price. Dump fees still multiply by layers.</p>' +
      '<div class="pay-wrap"><table class="pay-table"><thead><tr>' +
      ["1-layer", "2-layer", "3-layer", "4-layer", "5-layer"].map(function (label) { return "<th>" + label + "</th>"; }).join("") +
      "</tr></thead><tbody><tr>" + layerCells + "</tr></tbody></table></div>" +
      '<ul class="pay-samples">' + samples + "</ul>" +
      '<h3 style="margin:18px 0 8px">Hip & ridge and starter</h3>' +
      '<p class="tiny muted">Paid at the base rate. Squares = (hip & ridge bundles + starter bundles) ÷ 3, rounded up to the next whole square. A partial shingle bundle is paid as a whole bundle. Shingle squares are not counted again.</p>';
  }

  IC.viewLabor = function () {
    var s = session();
    var canRead = IC.can(s, "labor", "read");
    var canWrite = IC.can(s, "labor", "write");
    if (!canRead) {
      return '<div class="page"><header class="page-head"><div><p class="kicker muted">Catalog</p><h1 class="title">Labor</h1></div></header><div class="card"><p class="muted">You don’t have access to the Labor catalog. Ask an admin to turn it on under Settings → Manage permissions.</p></div></div>';
    }
    var crews = (IC.state.crews || []).map(IC.normalizeCrew);
    if (!crews.length) {
      return '<div class="page"><header class="page-head"><div><p class="kicker muted">Catalog</p><h1 class="title">Labor</h1></div>' +
        (canWrite ? IC.btn(IC.icon("plus") + " Add crew", { variant: "outline", data: 'data-act="add-crew"' }) : "") +
        "</header><div class=\"card\"><p class=\"muted\">No crews yet. Add Crew 1 from here — it syncs with the job’s crew picker.</p></div></div>";
    }
    var crewId = IC.ui.laborCrew || (crews[0] && crews[0].id);
    var crew = crews.find(function (c) { return c.id === crewId; }) || crews[0];
    IC.ui.laborCrew = crew.id;
    var labor = crew.labor;
    var pills = crews.map(function (c) {
      var on = c.id === crew.id;
      return '<button type="button" class="' + (on ? "on" : "") + '" data-act="labor-crew" data-id="' + c.id + '">' + IC.esc(IC.crewLabel(c)) + "</button>";
    }).join("");
    function moneyInput(part, name) {
      var attrs = { type: "number", step: "1", inputmode: "decimal", "data-labor": part, "data-id": crew.id, "aria-label": part + (name ? " " + name : "") };
      if (part === "base") attrs.class = "pay-hero-input";
      if (part === "pitchAdd") attrs["data-pitch"] = name;
      if (part === "storyAdd") attrs["data-story"] = name;
      if (part === "layerAdd") attrs["data-layer"] = name;
      attrs.value = part === "base" || part === "flatRate" ? labor[part] : labor[part][name];
      if (!canWrite) attrs.disabled = true;
      return IC.input(attrs);
    }
    var schedule = payScheduleHtml(labor, moneyInput, function (pitch, level, tear) {
      return IC.crewSquareParts(labor, pitch, level, tear);
    });
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Catalog</p><h1 class="title">Labor</h1><p class="muted" style="margin-top:4px">What we pay the crew. Install and tear-off are one rate per measured square. Customer price is still Settings → Estimate calculations.</p></div>' +
      (canWrite ? IC.btn(IC.icon("plus") + " Add crew", { variant: "outline", data: 'data-act="add-crew"' }) : "") +
      "</header>" +
      '<div class="card"><div class="cat-pills" role="tablist" aria-label="Crew">' + pills + "</div>" +
      '<div class="mat-toolbar"><div><h2 style="margin:0">' + IC.esc(IC.crewLabel(crew)) + '</h2><p class="tiny">' + (canWrite ? "Edit a number and the table updates." : "View only.") + "</p></div></div>" +
      '<div class="form-grid two" style="margin-bottom:16px">' +
      IC.field("Crew name", IC.input({ value: crew.name, "data-crew": "name", "data-id": crew.id, disabled: !canWrite })) +
      IC.field("Foreman", IC.input({ value: crew.foreman, "data-crew": "foreman", "data-id": crew.id, placeholder: "Alejandro", disabled: !canWrite })) +
      "</div>" +
      schedule +
      '<h3 style="margin:18px 0 8px">Decking</h3>' +
      '<div class="form-grid two">' +
      IC.field("OSB replacement $/sheet", IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: labor.osbPerSheet, "data-labor": "osbPerSheet", "data-id": crew.id, disabled: !canWrite, "aria-label": "OSB per sheet" })) +
      IC.field("Wood $/board", IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: labor.woodPerBoard, "data-labor": "woodPerBoard", "data-id": crew.id, disabled: !canWrite, "aria-label": "Wood per board" })) +
      "</div></div></div>";
  };

  IC.viewMaterials = function () {
    var s = session();
    var canRead = IC.can(s, "materials", "read");
    var canWrite = IC.can(s, "materials", "write");
    if (!canRead) {
      return '<div class="page"><header class="page-head"><div><p class="kicker muted">Catalog</p><h1 class="title">Materials</h1></div></header><div class="card"><p class="muted">You don’t have access to the Materials catalog. Ask an admin to turn it on under Settings → Manage permissions.</p></div></div>';
    }
    var catalog = IC.liveCatalog();
    var catId = IC.ui.catalogCat || "shingle";
    var cat = catalog.find(function (c) { return c.id === catId; }) || catalog[0];
    catId = cat.id;
    IC.ui.catalogCat = catId;
    var showOff = Boolean(IC.ui.catalogShowOff);
    var rows = cat.items.filter(function (it) { return showOff || it.active !== false; });
    var pills = catalog.map(function (c) {
      var n = c.items.filter(function (it) { return it.active !== false; }).length;
      var on = c.id === catId;
      return '<button type="button" class="' + (on ? "on" : "") + '" data-act="catalog-cat" data-id="' + c.id + '">' +
        IC.esc(c.label) + ' <span class="tiny" style="opacity:.8">' + n + "</span></button>";
    }).join("");
    var itemRows = rows.length ? rows.map(function (it) {
      var off = it.active === false;
      return '<div class="mat-row' + (off ? " is-off" : "") + '">' +
        IC.input({ value: it.name, "data-mat": "name", "data-cat": catId, "data-iid": it.id, "aria-label": "Name", disabled: !canWrite }) +
        IC.input({ value: it.sku, placeholder: "SKU", "data-mat": "sku", "data-cat": catId, "data-iid": it.id, "aria-label": "SKU", disabled: !canWrite }) +
        IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: it.price, "data-mat": "price", "data-cat": catId, "data-iid": it.id, "aria-label": "Price", disabled: !canWrite }) +
        '<div class="mat-row-actions">' +
        (canWrite
          ? (off
            ? IC.btn("Restore", { size: "sm", variant: "outline", data: 'data-act="catalog-restore" data-cat="' + catId + '" data-iid="' + it.id + '"' })
            : IC.btn("Retire", { size: "sm", variant: "ghost", data: 'data-act="catalog-retire" data-cat="' + catId + '" data-iid="' + it.id + '"' })) +
            IC.btn(IC.icon("trash"), { variant: "danger", size: "sm", class: "btn-icon", data: 'data-act="catalog-remove" data-cat="' + catId + '" data-iid="' + it.id + '"' })
          : "") +
        "</div></div>";
    }).join("") : '<p class="muted">No items in this list' + (showOff ? "." : ". Turn on discontinued to see retired SKUs.") + "</p>";
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Catalog</p><h1 class="title">Materials</h1><p class="muted" style="margin-top:4px">' + (canWrite ? "What the estimator can pick. Price changes apply the next time a job estimate is saved — sold and signed jobs keep their quoted total until you re-save." : "View only. Ask an admin if a price needs to change.") + "</p></div></header>" +
      '<div class="card"><div class="cat-pills" role="tablist" aria-label="Material category">' + pills + "</div>" +
      '<div class="mat-toolbar"><div><h2 style="margin:0">' + IC.esc(cat.label) + '</h2><p class="tiny">Sold as ' + IC.esc(cat.soldAs) + (cat.coverageUnit && cat.coverageUnit !== "each" ? " · covers " + cat.coverageAmount + " " + cat.coverageUnit : "") + "</p>" +
      (cat.id === "sheathing" ? '<p class="tiny muted">Size is part of the name. Add another item for a new size, such as OSB 1/2 × 4 × 8.</p>' : "") +
      (cat.id === "woodBoard" ? '<p class="tiny muted">Each width has its own price. The job can use more than one.</p>' : "") +
      "</div>" +
      '<label class="check"><input type="checkbox" data-act="catalog-show-off"' + (showOff ? " checked" : "") + ' /><span>Show discontinued</span></label></div>' +
      '<div class="mat-head"><span>Name / color</span><span>SKU</span><span>Price ($)</span><span></span></div>' +
      itemRows +
      (canWrite
        ? '<div class="mat-add"><h3 style="margin-bottom:8px">Add to ' + IC.esc(cat.label) + '</h3><div class="mat-row is-add">' +
          IC.input({ value: IC.ui.catalogAddName, placeholder: cat.id === "shingle" ? "New color, e.g. Storm Cloud" : "Name", "data-ui": "catalogAddName" }) +
          IC.input({ value: IC.ui.catalogAddSku, placeholder: "SKU (optional)", "data-ui": "catalogAddSku" }) +
          IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: IC.ui.catalogAddPrice, placeholder: "Price", "data-ui": "catalogAddPrice" }) +
          IC.btn(IC.icon("plus") + " Add", { data: 'data-act="catalog-add"' }) +
          "</div>" +
          (catId === "shingle"
            ? '<label class="check" style="margin-top:8px"><input type="checkbox" data-act="catalog-add-hip"' + (IC.ui.catalogAddHip !== false ? " checked" : "") + ' /><span>Also add matching Hip & Ridge (uses current hip price)</span></label>'
            : "") +
          "</div>" +
          '<div class="mat-bump"><h3 style="margin-bottom:8px">Adjust prices in this category</h3><p class="muted" style="margin-bottom:8px">Distributor increase? Enter 5 for +5%. A drop is negative, like -3.</p><div class="date-row">' +
          IC.input({ type: "number", step: "0.1", value: IC.ui.catalogBump, placeholder: "%", "data-ui": "catalogBump", "aria-label": "Percent change" }) +
          IC.btn("Apply to active items", { variant: "outline", data: 'data-act="catalog-bump"' }) +
          "</div></div>"
        : "") +
      "</div></div>";
  };

  IC.viewFinancing = function () {
    var admin = IC.isAdmin(session());
    var plans = IC.financingPlans();
    var rows = plans.map(function (p) {
      return '<div class="deck-row finance-row">' +
        IC.input({ value: p.name, "data-fin": "name", "data-id": p.id, "aria-label": "Plan name", disabled: !admin }) +
        IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: p.feePercent, "data-fin": "fee", "data-id": p.id, "aria-label": "Fee percent", disabled: !admin }) +
        (admin ? IC.btn(IC.icon("trash"), { variant: "ghost", size: "sm", class: "btn-icon", data: 'data-act="finance-remove" data-id="' + p.id + '"' }) : "<span></span>") +
        "</div>";
    }).join("");
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Catalog</p><h1 class="title">Financing</h1><p class="muted" style="margin-top:4px">Plans a salesman can put on a job. The fee is a percent of the customer price. Ironclad pays it, so it reduces profit and is not added to the customer Estimate.</p></div></header>' +
      '<div class="card"><div class="finance-head"><span>Plan</span><span>Fee %</span><span></span></div>' +
      (rows || '<p class="muted">No plans yet. Add one, for example “12 months” at 3.25.</p>') +
      (admin
        ? '<div class="mat-add"><h3 style="margin-bottom:8px">Add a plan</h3><div class="deck-row finance-row">' +
          IC.input({ value: IC.ui.financeAddName || "", placeholder: "12 months", "data-ui": "financeAddName", "aria-label": "New plan name" }) +
          IC.input({ type: "number", min: "0", step: "0.01", inputmode: "decimal", value: IC.ui.financeAddPct || "", placeholder: "3.25", "data-ui": "financeAddPct", "aria-label": "New plan fee percent" }) +
          IC.btn(IC.icon("plus") + " Add", { data: 'data-act="finance-add"' }) +
          "</div></div>"
        : '<p class="tiny muted" style="margin-top:12px">Only an admin can change plans.</p>') +
      "</div></div>";
  };

  IC.viewSign = function (token) {
    var localJob = IC.state.jobs.find(function (j) { return j.contract && j.contract.signingToken === token; });
    var remote = IC.ui.signRemote;
    var job = localJob || (remote && remote.job);
    var customer = localJob
      ? IC.state.customers.find(function (c) { return c.id === localJob.customerId; })
      : (remote && remote.customer);
    var settings = localJob ? IC.state.settings : ((remote && remote.settings) || IC.state.settings);
    if (!job && !IC.ui.signTried) {
      return '<div style="min-height:100dvh;display:grid;place-items:center;text-align:center;padding:24px"><div><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" style="height:64px;margin:0 auto" /><p style="font-family:var(--font-display);font-size:1.5rem;color:var(--navy);margin-top:16px">IRONCLAD</p><p class="muted">Opening your service agreement…</p></div></div>';
    }
    if (!job || !job.contract) {
      return '<div style="min-height:100dvh;max-width:28rem;margin:0 auto;display:grid;align-content:center;padding:20px;text-align:center"><img src="' + IC.asset("brand/logo.png") + '" alt="" style="height:64px;margin:0 auto" /><h1 class="title" style="margin-top:16px">Agreement not found</h1><p class="muted" style="margin-top:8px">This signing link is invalid, expired, or was opened before the job was synced. Ask your Ironclad project owner to share the link again from the job.</p></div>';
    }
    var already = Boolean(job.contract.customerSignature) || IC.ui.signDone;
    return '<div style="min-height:100dvh;background:var(--paper);padding-bottom:4rem"><header style="border-bottom:1px solid var(--line);background:var(--cream);padding:12px 16px"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" style="height:48px;margin:0 auto" /></header>' +
      '<div style="max-width:48rem;margin:0 auto;padding:16px 12px">' + IC.contractHtml(job, customer, settings) +
      '<div class="card" style="margin-top:1.25rem">' +
      (already
        ? '<h2 style="color:var(--navy)">Thank you</h2><p class="muted" style="margin-top:4px">Your signature is on file for project #' + job.number + ". Ironclad will follow up with a copy of the signed agreement.</p>"
        : "<h2>Sign this agreement</h2>" + IC.field("Full legal name", IC.input({ value: IC.ui.printedName, "data-act": "printed-name" })) +
          '<canvas class="sig-pad" id="sig-pad" style="margin-top:12px"></canvas>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:8px">' + IC.btn("Clear", { variant: "ghost", size: "sm", data: 'data-act="clear-sig"' }) + "</div>" +
          '<div style="margin-top:12px">' + IC.btn(IC.ui.signBusy ? "Saving…" : "I agree — sign", { class: "btn-block", data: 'data-act="remote-sign"', disabled: !IC.ui.sigUrl || IC.ui.signBusy }) + "</div>") +
      "</div></div></div>";
  };
})(window.IC);

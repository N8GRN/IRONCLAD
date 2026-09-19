window.IC = window.IC || {};

(function (IC) {
  function session() { return IC.state.session; }
  function mineJobs() {
    var s = session();
    var jobs = IC.state.jobs;
    if (!s || s.role === "admin") return jobs;
    return jobs.filter(function (j) { return j.ownerId === s.memberId; });
  }

  IC.viewLogin = function () {
    var team = IC.state.team.filter(function (t) { return t.active; });
    var memberOpts = team.map(function (t) {
      return { value: t.id, label: t.name + " · " + IC.roleLabel(t) };
    });
    return '<div class="login"><div class="login-blob"><span></span><span></span></div><div class="login-inner">' +
      '<img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" />' +
      '<p class="tag" style="margin-top:12px">UNBREAKABLE QUALITY</p>' +
      "<h1>IRONCLAD CRM</h1>" +
      '<p class="sub">Jobs, estimates, and agreements — built for the iPad in the truck.</p>' +
      '<form class="login-card" data-act="firebase-login">' +
      "<h2>Sign in</h2>" +
      IC.field("Email", IC.input({ type: "email", name: "email", autocomplete: "username", value: IC.ui.loginEmail })) +
      IC.field("Password", IC.input({ type: "password", name: "password", autocomplete: "current-password", value: IC.ui.loginPassword })) +
      (IC.ui.loginError ? '<p class="err">' + IC.esc(IC.ui.loginError) + "</p>" : "") +
      (IC.ui.loginLocalMsg ? '<p class="muted">' + IC.esc(IC.ui.loginLocalMsg) + "</p>" : "") +
      IC.btn(IC.ui.loginBusy ? "Signing in…" : "Sign in with Firebase", { type: "submit", class: "btn-block", disabled: IC.ui.loginBusy }) +
      "</form>" +
      '<div class="login-local"><h2>Work on this device</h2>' +
      '<p class="sub" style="text-align:left;margin-top:4px">For the iPad in the truck, or until this URL is added to Firebase. Same CRM — data stays on the device unless you later sign in.</p>' +
      IC.field("Who are you?", IC.select({ "data-act": "login-member", value: IC.ui.loginMemberId }, memberOpts)) +
      '<div style="margin-top:12px">' + IC.btn("Continue", { variant: "outline", class: "btn-block", data: 'data-act="local-login"' }) + "</div></div>" +
      '<a class="dl" href="ironclad-crm-files.zip" download="IRONCLAD-CRM.zip">Download the CRM files (HTML, JS, CSS)</a>' +
      "</div></div>";
  };

  IC.viewShell = function (inner, route) {
    var s = session();
    var unread = IC.state.notifications.filter(function (n) { return n.userId === s.memberId && !n.read; }).length;
    var nav = [
      { to: "#/", id: "home", label: "Home", icon: "home" },
      { to: "#/jobs", id: "jobs", label: "Jobs", icon: "briefcase" },
      { to: "#/schedule", id: "schedule", label: "Schedule", icon: "calendar" },
      { to: "#/customers", id: "customers", label: "Customers", icon: "users" },
    ];
    var isActive = function (id) {
      if (id === "home") return route.name === "home";
      return route.name === id || (id === "jobs" && route.name === "job") || (id === "customers" && route.name === "customer");
    };
    var sideLinks = nav.map(function (item) {
      return '<a href="' + item.to + '" class="' + (isActive(item.id) ? "active" : "") + '">' + IC.icon(item.icon) + "<span>" + item.label + "</span></a>";
    }).join("");
    return '<div class="shell"><aside class="sidebar"><a class="brand" href="#/"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing" /><div class="brand-copy"><div class="brand-name">IRONCLAD</div><div class="brand-sub">CRM</div></div></a>' +
      '<nav class="nav-side">' + sideLinks + "</nav>" +
      '<div class="nav-foot"><a href="#/notifications" class="' + (route.name === "notifications" ? "active" : "") + '">' + IC.icon("bell") + "<span>Alerts</span>" +
      (unread ? '<span class="nav-count">' + unread + "</span>" : "") + "</a>" +
      '<a href="#/settings" class="' + (route.name === "settings" ? "active" : "") + '">' + IC.icon("settings") + "<span>Settings</span></a>" +
      '<div class="who"><strong>' + IC.esc(s.name) + "</strong><span>" + IC.esc(IC.roleLabel(s)) + (s.mode === "local" ? " · this device" : " · Firebase") + "</span></div></div></aside>" +
      '<div class="main-wrap"><header class="topbar"><a class="brand" href="#/"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing" /></a>' +
      '<div class="top-actions"><a href="#/notifications">' + IC.icon("bell") + (unread ? '<span class="dot"></span>' : "") + '</a><a href="#/settings">' + IC.icon("settings") + "</a></div></header>" +
      '<main class="content">' + inner + "</main>" +
      '<nav class="tabbar">' + nav.map(function (item) {
        return '<a href="' + item.to + '" class="' + (isActive(item.id) ? "active" : "") + '">' + IC.icon(item.icon) + item.label + "</a>";
      }).join("") + "</nav></div></div>" +
      (IC.ui.toast ? '<div class="toast">' + IC.esc(IC.ui.toast) + "</div>" : "");
  };

  IC.viewHome = function () {
    var s = session();
    var jobs = mineJobs();
    var unread = IC.state.notifications.filter(function (n) { return n.userId === s.memberId && !n.read; });
    var today = new Date().toISOString().slice(0, 10);
    var upcoming = jobs.filter(function (j) { return j.scheduledDate; })
      .sort(function (a, b) { return (a.scheduledDate || "").localeCompare(b.scheduledDate || ""); }).slice(0, 5);
    var unsigned = jobs.filter(function (j) { return j.status === "Sold" && (!j.contract || j.contract.status !== "signed"); });
    var unassigned = s.role === "admin" ? IC.state.jobs.filter(function (j) { return !j.ownerId; }) : [];
    var stats = IC.JOB_STATUSES.filter(function (st) { return st !== "Did NOT Sell" && st !== "Complete"; }).map(function (st) {
      var n = jobs.filter(function (j) { return j.status === st; }).length;
      return '<div class="card stat"><p>' + IC.esc(st) + '</p><p class="num">' + n + "</p></div>";
    }).join("");
    var row = function (j, meta) {
      return '<a class="job-row" href="#/jobs/' + j.id + '"><div><p><span class="tabular muted">#' + j.number + "</span> " + IC.esc(j.customerName) + '</p><p class="tiny">' + IC.esc(meta) + "</p></div>" + IC.badge(j.status) + "</a>";
    };
    return '<div class="page"><header class="page-head"><div><p class="kicker">Ironclad Roofing</p><h1 class="hero">Let’s go to work, ' + IC.esc(s.name) + '.</h1></div><a href="#/jobs">' + IC.btn("New job " + IC.icon("arrow")) + "</a></header>" +
      '<div class="grid-stats">' + stats + "</div>" +
      (unread[0] ? '<div class="card" style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><p class="kicker">Needs you</p><p style="font-weight:600">' + IC.esc(unread[0].title) + '</p><p class="muted">' + IC.esc(unread[0].body) + '</p></div><a href="#/notifications">' + IC.btn("Alerts", { variant: "outline", size: "sm" }) + "</a></div>" : "") +
      '<div class="grid-2"><div class="card"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">' + IC.icon("userplus") + "<h2>Unassigned</h2></div>" +
      (unassigned.length ? unassigned.map(function (j) { return row(j, "Needs a salesperson"); }).join("") : '<p class="muted">Every job has a project owner.</p>') +
      '</div><div class="card"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">' + IC.icon("pen") + "<h2>Waiting on signature</h2></div>" +
      (unsigned.length ? unsigned.map(function (j) { return row(j, IC.money(j.price)); }).join("") : '<p class="muted">No sold jobs waiting on a contract.</p>') +
      "</div></div>" +
      '<div class="card"><h2 style="margin-bottom:12px">Upcoming production</h2>' +
      (upcoming.length ? upcoming.map(function (j) {
        return row(j, (j.crewName || "Crew TBD") + " · " + (j.scheduledDate === today ? "Today" : IC.formatDate(j.scheduledDate)));
      }).join("") : '<p class="muted">Nothing on the calendar yet. Assign a crew from a sold job.</p>') +
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
      '<p class="tiny" style="margin-top:8px">Owners: ' + IC.SALES_NAMES.join(", ") + ". Admins assign from the job screen.</p></div></div>";
  };

  IC.viewJob = function (jobId) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return '<div class="page"><p>Job not found.</p><a href="#/jobs" style="color:var(--navy);text-decoration:underline">Back to jobs</a></div>';
    var customer = IC.state.customers.find(function (c) { return c.id === job.customerId; });
    var settings = IC.state.settings;
    var tab = IC.ui.jobTab || "Overview";
    var tabs = ["Overview", "Estimate", "Quote", "Contract"].map(function (t) {
      return '<button type="button" class="' + (tab === t ? "on" : "") + '" data-act="job-tab" data-tab="' + t + '">' + t + "</button>";
    }).join("");
    var body = "";
    if (tab === "Overview") body = IC.viewJobOverview(job, customer);
    else if (tab === "Estimate") body = IC.viewEstimator(job);
    else if (tab === "Quote") body = IC.viewQuote(job, settings);
    else body = IC.viewJobContract(job, customer, settings);
    return '<div class="page"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">' +
      '<a class="back" href="#/jobs">' + IC.icon("back") + "</a>" +
      '<div style="min-width:0;flex:1"><p class="kicker muted">Job #' + job.number + '</p><h1 class="title" style="font-size:1.6rem">' + IC.esc(job.customerName) + "</h1></div>" +
      IC.badge(job.status) + "</div>" +
      '<div class="tabs no-print">' + tabs + "</div>" + body + "</div>";
  };

  IC.viewJobOverview = function (job, customer) {
    var s = session();
    var sales = IC.state.team.filter(function (t) { return t.salesName && t.active; });
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
      "</div></div><div style='display:grid;gap:1rem'><div class='card'><h2 style='margin-bottom:8px'>Customer</h2>" +
      (customer
        ? '<a href="#/customers/' + customer.id + '"><p style="font-weight:600">' + IC.esc(customer.firstName + " " + customer.lastName) + '</p><p class="muted">' + IC.esc(customer.street) + '</p><p class="muted">' + IC.esc(customer.city + ", " + customer.state + " " + customer.zip) + '</p><p style="margin-top:8px">' + IC.esc(IC.formatPhone(customer.phone)) + "</p><p>" + IC.esc(customer.email) + "</p></a>"
        : '<p class="muted">Customer record missing.</p>') +
      "</div><div class='card'><p class='field-label'>Price</p><p class='price-xl'>" + (job.price ? IC.money(job.price) : "—") + '</p><p class="tiny">Updated ' + IC.formatDate(job.updatedAt) + "</p></div>" +
      IC.btn(IC.icon("trash") + " Delete job", { variant: "danger", data: 'data-act="delete-job" data-id="' + job.id + '"' }) +
      "</div></div>";
  };

  IC.viewEstimator = function (job) {
    var settings = IC.state.settings;
    var value = job.estimate || IC.withComputed(IC.defaultEstimate(settings), settings);
    var c = value.computed;
    var gutters = IC.normalizeAddon("gutters", value.gutters);
    var siding = IC.normalizeAddon("siding", value.siding);
    var structures = value.structures.map(function (st, i) {
      return '<section class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3>Structure ' + (i + 1) + "</h3>" +
        (value.structures.length > 1 ? IC.btn(IC.icon("trash"), { variant: "ghost", data: 'data-act="est-del-struct" data-sid="' + st.id + '"' }) : "") + "</div>" +
        '<div class="form-grid two">' +
        IC.field("Name", IC.input({ value: st.name, "data-est": "struct", "data-sid": st.id, "data-key": "name" })) +
        IC.field("Squares", IC.input({ type: "number", min: "0", step: "0.1", value: st.squares, "data-est": "struct", "data-sid": st.id, "data-key": "squares", "data-num": "1" })) +
        IC.field("Type", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "type", value: st.type }, IC.ROOF_TYPES.map(function (x) { return { value: x, label: x }; }))) +
        IC.field("Stories", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "level", value: st.level }, IC.STORIES.map(function (x) { return { value: x, label: x }; }))) +
        IC.field("Pitch", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "pitch", value: st.pitch }, IC.PITCHES.map(function (x) { return { value: x, label: x }; }))) +
        IC.field("Tear-off", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "tearoff", value: st.tearoff }, IC.TEAROFF.map(function (x) { return { value: x, label: x }; }))) +
        IC.field("Sheathing", IC.select({ "data-est": "struct", "data-sid": st.id, "data-key": "sheathing", value: st.sheathing }, IC.SHEATHING.map(function (x) { return { value: x, label: x }; }))) +
        IC.field("Replace sheathing %", IC.input({ type: "number", min: "0", max: "100", value: st.sheathingReplacePct, "data-est": "struct", "data-sid": st.id, "data-key": "sheathingReplacePct", "data-num": "1" })) +
        "</div></section>";
    }).join("");
    var linears = [["eaveLf", "Eaves (lf)"], ["rakeLf", "Rakes (lf)"], ["ridgeLf", "Ridge (lf)"], ["hipLf", "Hips (lf)"], ["valleyLf", "Valleys (lf)"], ["ridgeVentLf", "Ridge vent (lf)"]];
    var materials = IC.CATALOG.map(function (cat) {
      var pick = value.materials.find(function (m) { return m.categoryId === cat.id; });
      return IC.field(cat.label, IC.select({ "data-est": "mat", "data-cat": cat.id, value: (pick && pick.itemName) || cat.items[0].name },
        cat.items.map(function (item) { return { value: item.name, label: item.name + " · $" + item.price.toFixed(2) + "/" + cat.soldAs }; })));
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
      '<section class="card"><h3 style="margin-bottom:8px">Linear measurements</h3><p class="muted" style="margin-bottom:12px">Leave blank to auto-estimate from squares. Enter real numbers from the measure.</p>' +
      '<div class="form-grid two">' + linears.map(function (pair) {
        return IC.field(pair[1], IC.input({ type: "number", min: "0", placeholder: "auto", value: value[pair[0]] == null ? "" : value[pair[0]], "data-est": "num", "data-key": pair[0], "data-null": "1" }));
      }).join("") +
      IC.field("Pipe boots", IC.input({ type: "number", min: "0", value: value.pipeBoots, "data-est": "num", "data-key": "pipeBoots" })) +
      IC.field("Broan vents", IC.input({ type: "number", min: "0", value: value.broanVents, "data-est": "num", "data-key": "broanVents" })) +
      IC.field("Chimney flashing lf", IC.input({ type: "number", min: "0", value: value.chimneyLf, "data-est": "num", "data-key": "chimneyLf" })) +
      IC.field("Wall flashing lf", IC.input({ type: "number", min: "0", value: value.wallFlashingLf, "data-est": "num", "data-key": "wallFlashingLf" })) +
      "</div></section>" +
      '<section class="card"><h3 style="margin-bottom:12px">Materials</h3><div class="form-grid two">' + materials + "</div></section>" +
      '<section class="card"><h3 style="margin-bottom:12px">Add-ons & job costs</h3><div class="form-grid two">' +
      IC.field("Labor $/square", IC.input({ type: "number", value: value.laborRatePerSquare, "data-est": "num", "data-key": "laborRatePerSquare" })) +
      IC.field("Waste %", IC.input({ type: "number", value: value.wastePercent, "data-est": "num", "data-key": "wastePercent" })) +
      IC.field("Material margin %", IC.input({ type: "number", value: value.markupPercent, "data-est": "num", "data-key": "markupPercent" })) +
      IC.field("Tear-off $/sq / layer", IC.input({ type: "number", value: value.tearoffRatePerSquare, "data-est": "num", "data-key": "tearoffRatePerSquare" })) +
      IC.field("Dumpster", IC.input({ type: "number", value: value.dumpster, "data-est": "num", "data-key": "dumpster" })) +
      IC.field("Permit", IC.input({ type: "number", value: value.permit, "data-est": "num", "data-key": "permit" })) +
      "</div>" +
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
      '<div style="margin-top:12px">' + IC.field("Estimate notes", IC.textarea({ value: value.notes, "data-est": "notes" })) + "</div>" +
      '<div style="margin-top:12px">' + IC.btn(IC.icon("plus") + " Extra line", { variant: "ghost", data: 'data-act="est-add-extra"' }) + extras + "</div></section>" +
      '<section class="navy-sum"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px"><div><p class="field-label" style="color:rgba(251,248,241,.7)">Proposal total</p><p class="big">' + IC.money(c.total) + "</p></div><p class='tiny' style='color:rgba(251,248,241,.8)'>" + c.measuredSquares.toFixed(1) + " sq measured<br>" + c.billableSquares.toFixed(1) + " sq billed</p></div>" +
      '<dl style="margin-top:1rem;font-size:.9rem"><div style="display:flex;justify-content:space-between"><dt style="opacity:.8">Materials</dt><dd class="tabular">' + IC.money(c.materialsSubtotal) + "</dd></div>" +
      '<div style="display:flex;justify-content:space-between"><dt style="opacity:.8">Labor & tear-off</dt><dd class="tabular">' + IC.money(c.laborSubtotal) + "</dd></div>" +
      '<div style="display:flex;justify-content:space-between"><dt style="opacity:.8">Other</dt><dd class="tabular">' + IC.money(c.otherSubtotal) + "</dd></div>" +
      '<div style="display:flex;justify-content:space-between"><dt style="opacity:.8">Gutters / siding</dt><dd class="tabular">' + IC.money(c.addonsSubtotal) + "</dd></div></dl>" +
      "<ul>" + c.lines.map(function (l) {
        return "<li><span>" + IC.esc(l.label) + (l.detail ? " — " + IC.esc(l.detail) : "") + " (" + l.qty + " " + IC.esc(l.unit) + ')</span><span class="tabular">' + IC.money(l.amount) + "</span></li>";
      }).join("") + "</ul></section></div>";
  };

  IC.viewQuote = function (job, settings) {
    return '<div class="page"><div class="no-print" style="display:flex;flex-wrap:wrap;gap:8px">' +
      IC.btn(IC.icon("share") + " Share quote", { data: 'data-act="share-quote"' }) +
      IC.btn("Print", { variant: "outline", data: 'data-act="print"' }) + "</div>" +
      IC.quoteHtml(job, settings.legalName) + "</div>";
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
        return '<a class="list-row" href="#/customers/' + c.id + '" style="display:flex;justify-content:space-between;align-items:center"><div><p style="font-weight:600">' + IC.esc(c.lastName) + ", " + IC.esc(c.firstName) + '</p><p class="muted">' + IC.esc(c.city ? c.city + ", " + c.state : (c.street || "No address")) + '</p></div><div class="muted" style="text-align:right"><div>' + IC.esc(c.phone ? IC.formatPhone(c.phone) : "—") + "</div><div>" + n + " job" + (n === 1 ? "" : "s") + "</div></div></a>";
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
      (theirs.length ? theirs.map(function (j) {
        return '<a class="job-row" href="#/jobs/' + j.id + '"><span>#' + j.number + " · " + IC.esc(j.ownerName || "Unassigned") + '</span><span style="display:flex;gap:8px;align-items:center"><span class="tabular muted">' + (j.price ? IC.money(j.price) : "") + "</span>" + IC.badge(j.status) + "</span></a>";
      }).join("") : '<p class="muted">No jobs yet.</p>') + "</div></div>";
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
    var mine = IC.state.notifications.filter(function (n) { return n.userId === s.memberId; });
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Inbox</p><h1 class="title">Alerts</h1></div><div style="display:flex;gap:8px">' +
      IC.btn("Mark all read", { variant: "outline", size: "sm", data: 'data-act="mark-all"' }) +
      IC.btn("Enable push", { variant: "outline", size: "sm", data: 'data-act="enable-push"' }) +
      "</div></header><p class='muted'>Job assigned, crew scheduled, and contract signed. iPhone push only works after Add to Home Screen (iOS 16.4+). Tokens save to Firestore when Firebase sign-in is active.</p>" +
      (mine.length ? '<ul style="display:grid;gap:8px;list-style:none;padding:0;margin:0">' + mine.map(function (n) {
        var inner = '<p style="font-weight:600">' + IC.esc(n.title) + '</p><p class="muted">' + IC.esc(n.body) + '</p><p class="tiny">' + IC.formatDate(n.createdAt) + "</p>";
        return '<li><div class="card"' + (n.read ? ' style="opacity:.7"' : "") + ">" +
          (n.jobId ? '<a href="#/jobs/' + n.jobId + '" data-act="read-note" data-id="' + n.id + '">' + inner + "</a>" : inner) + "</div></li>";
      }).join("") + "</ul>" : '<div class="card"><p class="muted">No alerts yet.</p></div>') + "</div>";
  };

  IC.viewAddUserModal = function () {
    var d = IC.ui.addUserDraft || { name: "", role: "sales", title: "Sales", salesName: "", email: "" };
    IC.ui.addUserDraft = d;
    return '<div class="modal-bg" data-act="close-modal"><div class="modal" data-stop="1"><h2>Add user</h2>' +
      '<p class="muted" style="margin:8px 0 12px">They’ll appear in the login list on this device. Map their Firebase email so they can sign in from any iPad.</p>' +
      '<div class="form-grid two">' +
      IC.field("Name", IC.input({ value: d.name, "data-udraft": "name", placeholder: "First name", autocomplete: "off" })) +
      IC.field("Role", IC.select({ "data-udraft": "role", value: d.role }, [
        { value: "sales", label: "Sales" },
        { value: "admin", label: "Admin (full access)" },
      ])) +
      IC.field("Shown as", IC.input({ value: d.title, "data-udraft": "title", placeholder: "Admin, Owner, Sales…" })) +
      IC.field("Owns jobs as", IC.input({ value: d.salesName, "data-udraft": "salesName", placeholder: "Blank if they don’t own jobs" })) +
      IC.field("Firebase email", IC.input({ value: d.email, type: "email", "data-udraft": "email", placeholder: "optional" }), "span-2") +
      '</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:1.25rem">' +
      IC.btn("Cancel", { variant: "ghost", data: 'data-act="close-modal"' }) +
      IC.btn("Add user", { data: 'data-act="save-teammate"' }) + "</div></div></div>";
  };

  IC.viewSettings = function () {
    var s = session();
    var settings = IC.state.settings;
    var admin = s.role === "admin";
    var dis = admin ? "" : " disabled";
    var rates = [
      ["laborRatePerSquare", "Labor $ / square"],
      ["wastePercent", "Waste %"],
      ["markupPercent", "Material margin %"],
      ["tearoffRatePerSquare", "Tear-off $ / sq / layer"],
      ["dumpsterDefault", "Dumpster default"],
      ["permitDefault", "Permit default"],
      ["sheathingSheetPrice", "Sheathing $ / sheet"],
    ];
    return '<div class="page"><header class="page-head"><div><p class="kicker muted">Company</p><h1 class="title">Settings</h1></div>' +
      IC.btn("Sign out", { variant: "outline", data: 'data-act="sign-out"' }) + "</header>" +
      '<div class="card"><h2 style="margin-bottom:8px">Appearance</h2><p class="muted" style="margin-bottom:12px">This iPad only. Light, dark, or match the system setting.</p>' +
      '<div class="theme-pills" role="group" aria-label="Theme">' +
      [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "System" }].map(function (opt) {
        var on = IC.getThemePref() === opt.id;
        return '<button type="button" class="' + (on ? "on" : "") + '" data-act="set-theme" data-theme="' + opt.id + '">' + opt.label + "</button>";
      }).join("") +
      "</div></div>" +
      '<div class="card"><h2 style="margin-bottom:12px">On the paperwork</h2><div class="form-grid two">' +
      IC.field("Legal name", IC.input({ value: settings.legalName, "data-set": "legalName", disabled: !admin })) +
      IC.field("License #", IC.input({ value: settings.licenseNumber, "data-set": "licenseNumber", disabled: !admin })) +
      IC.field("Phone", IC.input({ value: settings.phone, "data-set": "phone", disabled: !admin })) +
      IC.field("Email", IC.input({ value: settings.email, "data-set": "email", disabled: !admin })) +
      IC.field("Street", IC.input({ value: settings.street, "data-set": "street", disabled: !admin }), "span-2") +
      IC.field("City", IC.input({ value: settings.city, "data-set": "city", disabled: !admin })) +
      IC.field("State", IC.input({ value: settings.state, "data-set": "state", disabled: !admin })) +
      IC.field("ZIP", IC.input({ value: settings.zip, "data-set": "zip", disabled: !admin })) +
      IC.field("Workmanship warranty (years)", IC.input({ type: "number", value: settings.warrantyWorkmanshipYears, "data-set": "warrantyWorkmanshipYears", "data-num": "1", disabled: !admin })) +
      IC.field("Payment terms", IC.textarea({ value: settings.paymentTerms, "data-set": "paymentTerms", disabled: !admin }), "span-2") +
      IC.field("Contract introduction", IC.textarea({ value: settings.contractIntro, "data-set": "contractIntro", disabled: !admin }), "span-2") +
      "</div></div>" +
      '<div class="card"><h2 style="margin-bottom:8px">Default estimate rates</h2><p class="muted" style="margin-bottom:12px">Used when a new estimate is created. Each job can override.</p><div class="form-grid two">' +
      rates.map(function (r) { return IC.field(r[1], IC.input({ type: "number", value: settings[r[0]], "data-set": r[0], "data-num": "1", disabled: !admin })); }).join("") +
      "</div></div>" +
      '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap"><h2>Team</h2>' +
      (admin ? IC.btn("Add user", { size: "sm", variant: "outline", data: 'data-act="add-teammate"' }) : "") +
      '</div><p class="muted" style="margin-bottom:12px">' +
      (admin
        ? "Admins (Nate and Matt) can add or remove people and change names, roles, and titles. Role is the privilege — Admin sees every job and can edit Settings; Sales only sees their own jobs. Shown as is the login label. Matt is the company owner, so his label is Owner. Both of you have equal Admin privileges."
        : "Ask an admin (Nate or Matt) to add people or change roles.") +
      "</p>" +
      IC.state.team.map(function (m) {
        return '<div class="team-card"><div class="form-grid two">' +
          IC.field("Name", IC.input({ value: m.name, "data-team": "name", "data-id": m.id, disabled: !admin })) +
          IC.field("Role", IC.select({ "data-team": "role", "data-id": m.id, value: m.role, disabled: !admin }, [{ value: "admin", label: "Admin (full access)" }, { value: "sales", label: "Sales" }])) +
          IC.field("Shown as", IC.input({ value: IC.roleLabel(m), "data-team": "title", "data-id": m.id, placeholder: "Admin, Owner, Sales…", disabled: !admin })) +
          IC.field("Owns jobs as", IC.input({ value: m.salesName || "", "data-team": "salesName", "data-id": m.id, placeholder: "Name on jobs, or blank", disabled: !admin })) +
          IC.field("Firebase email", IC.input({ value: m.email, type: "email", "data-team": "email", "data-id": m.id, disabled: !admin }), "span-2") +
          "</div>" +
          (admin
            ? (m.id === s.memberId
              ? '<p class="tiny" style="margin-top:8px">That’s you — you can’t remove your own login.</p>'
              : '<div style="display:flex;justify-content:flex-end;margin-top:8px">' + IC.btn("Remove", { variant: "danger", size: "sm", data: 'data-act="remove-teammate" data-id="' + m.id + '"' }) + "</div>")
            : "") +
          "</div>";
      }).join("") + "</div>" +
      (IC.ui.addUserOpen ? IC.viewAddUserModal() : "") +
      '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>Crew roster</h2>' +
      (admin ? IC.btn("Add crew", { size: "sm", variant: "outline", data: 'data-act="add-crew"' }) : "") + "</div>" +
      IC.state.crews.map(function (c) {
        return '<div class="form-grid two" style="background:var(--paper);border-radius:16px;padding:12px;margin-bottom:8px">' +
          IC.field("Crew name", IC.input({ value: c.name, "data-crew": "name", "data-id": c.id, disabled: !admin })) +
          IC.field("Foreman", IC.input({ value: c.foreman, "data-crew": "foreman", "data-id": c.id, disabled: !admin })) +
          IC.field("Phone", IC.input({ value: c.phone, "data-crew": "phone", "data-id": c.id, disabled: !admin })) +
          IC.field("Notes", IC.input({ value: c.notes, "data-crew": "notes", "data-id": c.id, disabled: !admin })) + "</div>";
      }).join("") + "</div>" +
      '<div class="card"><h2 style="margin-bottom:8px">Firebase</h2><p class="muted">Project <strong style="color:var(--ink)">ironclad-127a5</strong>. Add this app’s domain under Authentication → Settings → Authorized domains. Firestore collections: <code>jobs</code>, <code>customers</code>, <code>crews</code>, <code>notifications</code>, <code>meta</code>, <code>fcmTokens</code>, <code>signLinks</code>.</p>' +
      "<p class='muted' style='margin-top:8px'><strong>Does this write to your existing Firestore?</strong> Yes — when someone signs in with Firebase email/password. “Work on this device” stays in this browser until that sign-in, then the first empty cloud workspace is seeded from local data.</p>" +
      "<pre style='margin-top:12px;overflow:auto;border-radius:12px;background:var(--navy-deep);color:var(--cream);padding:12px;font-size:12px;line-height:1.45'>rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /signLinks/{token} {\n      allow read, write: if true;\n    }\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}</pre>" +
      '<p class="muted" style="margin-top:8px"><code>signLinks</code> is public so a customer can open the signing URL on their own phone without an Ironclad login. Sending actual iOS pushes still needs a small Cloud Function.</p></div>' +
      '<div class="card"><h2 style="margin-bottom:8px">Source files</h2><p class="muted" style="margin-bottom:12px">The CRM is plain HTML, JavaScript, and CSS. Unzip and open <code>index.html</code> — that is the app. Push the folder to GitHub Pages or Firebase Hosting (see README inside the zip).</p>' +
      '<a class="btn" href="ironclad-crm-files.zip" download="IRONCLAD-CRM.zip">' + IC.icon("arrow") + " Download IRONCLAD-CRM.zip</a></div>" +
      (admin ? IC.btn("Remove sample jobs & customers", { variant: "outline", data: 'data-act="clear-seed"' }) : "") +
      "</div>";
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

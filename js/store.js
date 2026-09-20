/* ============================================================
   IRONCLAD CRM — localStorage + Firestore
   Shared company data lives in ironclad-127a5. Cloud writes happen
   whenever someone is signed in (Auth currentUser). Collections:
   jobs, customers, crews, notifications, users, meta, signLinks, fcmTokens.
   ============================================================ */
window.IC = window.IC || {};

(function (IC) {
  var listeners = [];
  var persistTimer = null;

  function emptyState() {
    return {
      hydrated: false,
      initialized: false,
      firebaseReady: false,
      settings: IC.clone(IC.SETTINGS),
      team: IC.clone(IC.TEAM),
      crews: IC.clone(IC.CREWS),
      catalog: IC.ensureCatalog(null),
      customers: [],
      jobs: [],
      notifications: [],
      session: null,
    };
  }

  IC.state = emptyState();
  IC.ui = {
    jobTab: "Overview",
    jobSearch: "",
    jobStatus: "",
    customerSearch: "",
    newJobOpen: false,
    newJobMode: "existing",
    newCustomerOpen: false,
    loginEmail: "",
    loginPassword: "",
    loginPassword2: "",
    loginName: "",
    loginBusy: false,
    loginError: "",
    loginInfo: "",
    authPanel: "signin",
    keepSignedIn: true,
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    printedName: "",
    sigUrl: "",
    signBusy: false,
    signDone: false,
    signRemote: null,
    signTried: false,
    toast: "",
    addUserOpen: false,
    addUserDraft: null,
    catalogCat: "shingle",
    catalogShowOff: false,
    catalogAddName: "",
    catalogAddSku: "",
    catalogAddPrice: "",
    catalogAddHip: true,
    catalogBump: "",
  };

  IC.subscribe = function (fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (x) { return x !== fn; });
    };
  };

  function persist() {
    try {
      var s = IC.state;
      localStorage.setItem(IC.STORE_KEY, JSON.stringify({
        initialized: s.initialized,
        settings: s.settings,
        team: s.team,
        crews: s.crews,
        catalog: s.catalog,
        customers: s.customers,
        jobs: s.jobs,
        notifications: s.notifications,
      }));
      if (s.session) localStorage.setItem(IC.SESSION_KEY, JSON.stringify(s.session));
      else localStorage.removeItem(IC.SESSION_KEY);
    } catch (err) {
      console.warn("[ironclad] persist failed", err);
    }
  }

  IC.emit = function () {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persist, 40);
    listeners.forEach(function (fn) {
      try { fn(); } catch (err) { console.warn(err); }
    });
  };

  IC.loadLocal = function () {
    try {
      var raw = localStorage.getItem(IC.STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.assign(IC.state, {
          initialized: Boolean(parsed.initialized),
          settings: parsed.settings || IC.clone(IC.SETTINGS),
          team: IC.fillTeamTitles(parsed.team && parsed.team.length ? parsed.team : IC.clone(IC.TEAM)),
          crews: parsed.crews && parsed.crews.length ? parsed.crews : IC.clone(IC.CREWS),
          catalog: IC.ensureCatalog(parsed.catalog),
          customers: parsed.customers || [],
          jobs: parsed.jobs || [],
          notifications: parsed.notifications || [],
        });
      }
      var ses = localStorage.getItem(IC.SESSION_KEY);
      if (ses) {
        var parsedSes = JSON.parse(ses);
        if (parsedSes && parsedSes.mode === "local") IC.state.session = null;
        else IC.state.session = parsedSes;
      }
    } catch (err) {
      console.warn("[ironclad] load failed", err);
    }
    IC.initIfEmpty();
    if (IC.state.session && IC.state.session.mode === "local") IC.state.session = null;
    if (IC.state.session) {
      var mem = IC.state.team.find(function (t) {
        return t.id === IC.state.session.memberId ||
          (IC.state.session.email && t.email && t.email.toLowerCase() === IC.state.session.email.toLowerCase());
      });
      if (mem) {
        IC.state.session = Object.assign({}, IC.state.session, {
          name: mem.name,
          role: mem.role,
          title: IC.roleLabel(mem),
          salesName: mem.salesName,
          status: mem.status || (IC.isApproved(mem) ? "active" : mem.role),
          email: mem.email || IC.state.session.email,
        });
      }
    }
    IC.state.hydrated = true;
    persist();
  };

  IC.initIfEmpty = function () {
    if (IC.state.initialized) return;
    var customers = IC.seedCustomers();
    var jobs = IC.seedJobs(customers);
    IC.state.initialized = true;
    IC.state.customers = customers;
    IC.state.jobs = jobs;
    if (!IC.state.settings || !IC.state.settings.legalName) IC.state.settings = IC.clone(IC.SETTINGS);
    if (!IC.state.team.length) IC.state.team = IC.clone(IC.TEAM);
    if (!IC.state.crews.length) IC.state.crews = IC.clone(IC.CREWS);
    IC.state.catalog = IC.ensureCatalog(IC.state.catalog);
  };

  function nextNumber(jobs) {
    return jobs.reduce(function (m, j) { return Math.max(m, j.number || 0); }, 10000) + 1;
  }

  IC.nextJobNumber = function () {
    return nextNumber(IC.state.jobs);
  };

  IC.replaceCloud = function (data) {
    if (data.team) data.team = IC.fillTeamTitles(data.team);
    if (data.catalog) data.catalog = IC.ensureCatalog(data.catalog);
    Object.assign(IC.state, data, { initialized: true });
    IC.state.catalog = IC.ensureCatalog(IC.state.catalog);
    IC.emit();
  };

  IC.fillTeamTitles = function (team) {
    var defaults = {};
    IC.TEAM.forEach(function (t) { defaults[t.id] = t; });
    return (team || []).map(function (m) {
      var d = defaults[m.id];
      var status = m.status || (m.role === "pending" ? "pending" : "active");
      var next = Object.assign({}, m, { status: status });
      if (!next.title) {
        if (status === "pending") next.title = "Waiting";
        else if (d && d.title) next.title = d.title;
        else next.title = next.role === "admin" ? "Admin" : (next.role === "sales" ? "Sales" : "Waiting");
      }
      return next;
    });
  };

  function upsertList(list, item) {
    var i = list.findIndex(function (x) { return x.id === item.id; });
    if (i >= 0) {
      var next = list.slice();
      next[i] = item;
      return next;
    }
    return [item].concat(list);
  }

  IC.upsertCustomer = function (c) {
    IC.state.customers = upsertList(IC.state.customers, c);
    IC.emit();
    IC.cloudUpsert("customers", c.id, c);
  };

  IC.deleteCustomer = function (id) {
    IC.state.customers = IC.state.customers.filter(function (c) { return c.id !== id; });
    IC.emit();
    IC.cloudDelete("customers", id);
  };

  IC.upsertJob = function (j) {
    IC.state.jobs = upsertList(IC.state.jobs, j);
    IC.emit();
    IC.cloudUpsert("jobs", j.id, j);
  };

  IC.deleteJob = function (id) {
    IC.state.jobs = IC.state.jobs.filter(function (j) { return j.id !== id; });
    IC.emit();
    IC.cloudDelete("jobs", id);
  };

  IC.assignOwner = function (jobId, ownerId) {
    if (!IC.canAssignSales(IC.state.session)) return;
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    var member = IC.state.team.find(function (t) { return t.id === ownerId; }) || null;
    var next = Object.assign({}, job, {
      ownerId: member ? member.id : null,
      ownerName: member ? member.salesName : null,
      updatedAt: IC.nowIso(),
    });
    IC.upsertJob(next);
    if (member && IC.state.session && member.id !== IC.state.session.memberId) {
      IC.notify({
        userId: member.id,
        title: "Job assigned to you",
        body: "#" + next.number + " " + next.customerName + " is now yours.",
        type: "job_assigned",
        jobId: next.id,
      });
    }
  };

  IC.assignCrew = function (jobId, crewId, scheduledDate) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job || !IC.canAssignCrew(IC.state.session, job)) return;
    var crew = crewId ? (IC.state.crews.find(function (c) { return c.id === crewId; }) || null) : null;
    var date = IC.validIsoDate(scheduledDate);
    var next = Object.assign({}, job, {
      crewId: crew ? crew.id : null,
      crewName: crew ? crew.name : null,
      scheduledDate: date,
      status: date ? "Job Scheduled" : job.status,
      updatedAt: IC.nowIso(),
    });
    IC.upsertJob(next);
    var recipients = {};
    if (job.ownerId) recipients[job.ownerId] = true;
    IC.state.team.filter(function (t) { return t.role === "admin" && IC.isApproved(t); }).forEach(function (a) {
      recipients[a.id] = true;
    });
    var me = IC.state.session && IC.state.session.memberId;
    Object.keys(recipients).forEach(function (userId) {
      if (userId === me) return;
      IC.notify({
        userId: userId,
        title: next.scheduledDate ? "Crew scheduled" : "Crew assignment updated",
        body: "#" + next.number + " " + next.customerName + (crew ? " · " + crew.name : "") + (next.scheduledDate ? " · " + next.scheduledDate : ""),
        type: "crew_scheduled",
        jobId: next.id,
      });
    });
  };

  IC.setProductionDate = function (jobId, iso) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job || !IC.canAssignCrew(IC.state.session, job)) return;
    var date = IC.validIsoDate(iso);
    if ((job.scheduledDate || null) === date) return;
    IC.upsertJob(Object.assign({}, job, {
      scheduledDate: date,
      updatedAt: IC.nowIso(),
    }));
  };

  IC.setStatus = function (jobId, status) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    IC.upsertJob(Object.assign({}, job, { status: status, updatedAt: IC.nowIso() }));
  };

  IC.saveEstimate = function (jobId, estimate) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    var computed = IC.withComputed(estimate, IC.state.settings);
    IC.upsertJob(Object.assign({}, job, {
      estimate: computed,
      price: computed.computed.total,
      includeGutters: computed.gutters.included,
      includeSiding: computed.siding.included,
      updatedAt: IC.nowIso(),
    }));
  };

  IC.saveContract = function (jobId, contract) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    var next = Object.assign({}, job, { contract: contract, updatedAt: IC.nowIso() });
    IC.upsertJob(next);
    IC.publishSignLink(next);
  };

  function applySignature(job, which, signature) {
    if (!job.contract) return;
    var block = Object.assign({}, signature, { signedAt: IC.nowIso() });
    var contract = Object.assign({}, job.contract, {
      customerSignature: which === "customer" ? block : job.contract.customerSignature,
      companySignature: which === "company" ? block : job.contract.companySignature,
    });
    var both = Boolean(contract.customerSignature && contract.companySignature);
    if (both) {
      contract.status = "signed";
      contract.signedAt = IC.nowIso();
    } else if (contract.status === "draft") {
      contract.status = "sent";
    }
    IC.upsertJob(Object.assign({}, job, { contract: contract, updatedAt: IC.nowIso() }));
    var published = IC.state.jobs.find(function (j) { return j.id === job.id; });
    if (published) IC.publishSignLink(published);
    if (which === "customer") {
      var actor = IC.state.session && IC.state.session.memberId;
      IC.state.team.filter(function (t) {
        return (t.role === "admin" && IC.isApproved(t)) || t.id === job.ownerId;
      }).forEach(function (r) {
        if (r.id === actor) return;
        IC.notify({
          userId: r.id,
          title: "Contract signed",
          body: job.customerName + " signed job #" + job.number + ".",
          type: "contract_signed",
          jobId: job.id,
        });
      });
    }
  }

  IC.signContract = function (jobId, which, signature) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    applySignature(job, which, signature);
  };

  IC.signByToken = function (token, which, signature) {
    var job = IC.state.jobs.find(function (j) {
      return j.contract && j.contract.signingToken === token;
    });
    if (!job) return null;
    applySignature(job, which, signature);
    return IC.state.jobs.find(function (j) { return j.id === job.id; }) || null;
  };

  IC.upsertCrew = function (c) {
    var list = IC.state.crews;
    var i = list.findIndex(function (x) { return x.id === c.id; });
    IC.state.crews = i >= 0 ? list.map(function (x) { return x.id === c.id ? c : x; }) : list.concat([c]);
    IC.emit();
    IC.cloudUpsert("crews", c.id, c);
  };

  IC.deleteCrew = function (id) {
    IC.state.crews = IC.state.crews.filter(function (c) { return c.id !== id; });
    IC.emit();
    IC.cloudDelete("crews", id);
  };

  IC.updateSettings = function (patch) {
    IC.state.settings = Object.assign({}, IC.state.settings, patch);
    IC.emit();
    IC.cloudUpsert("meta", "settings", IC.state.settings);
  };

  IC.saveCatalog = function (catalog) {
    IC.state.catalog = IC.ensureCatalog(catalog);
    IC.emit();
    IC.cloudUpsert("meta", "catalog", { catalog: IC.state.catalog, updatedAt: IC.nowIso() });
  };

  IC.updateCatalogItem = function (catId, itemId, patch) {
    if (!IC.canManageTeam(IC.state.session)) return;
    var oldName = null;
    var nextName = null;
    var catalog = IC.liveCatalog().map(function (cat) {
      if (cat.id !== catId) return cat;
      return Object.assign({}, cat, {
        items: cat.items.map(function (it) {
          if (it.id !== itemId) return it;
          oldName = it.name;
          var n = Object.assign({}, it, patch);
          if (patch.name != null) n.name = String(patch.name).trim() || it.name;
          if (patch.sku != null) n.sku = String(patch.sku).trim();
          if (patch.price != null) {
            var p = Number(patch.price);
            n.price = Number.isFinite(p) ? p : it.price;
          }
          if (patch.active != null) n.active = Boolean(patch.active);
          nextName = n.name;
          return n;
        }),
      });
    });
    if (oldName && nextName && oldName !== nextName) {
      var touched = [];
      IC.state.jobs = IC.state.jobs.map(function (job) {
        if (!job.estimate || !job.estimate.materials) return job;
        var changed = false;
        var materials = job.estimate.materials.map(function (m) {
          if (m.categoryId === catId && m.itemName === oldName) {
            changed = true;
            return Object.assign({}, m, { itemName: nextName });
          }
          return m;
        });
        if (!changed) return job;
        var next = Object.assign({}, job, {
          estimate: Object.assign({}, job.estimate, { materials: materials }),
          updatedAt: IC.nowIso(),
        });
        touched.push(next);
        return next;
      });
      touched.forEach(function (j) { IC.cloudUpsert("jobs", j.id, j); });
    }
    IC.saveCatalog(catalog);
  };

  IC.addCatalogItem = function (catId, draft) {
    if (!IC.canManageTeam(IC.state.session)) return null;
    draft = draft || {};
    var name = String(draft.name || "").trim();
    if (!name) {
      IC.toast("Enter a name");
      return null;
    }
    var cat = IC.catalogCategory(catId);
    if (!cat) return null;
    var exists = cat.items.some(function (it) { return it.name.toLowerCase() === name.toLowerCase(); });
    if (exists) {
      IC.toast("That name is already in " + cat.label);
      return null;
    }
    var item = IC.normalizeItem(catId, {
      name: name,
      sku: draft.sku,
      price: draft.price === "" || draft.price == null ? 0 : Number(draft.price),
      active: true,
    });
    var catalog = IC.liveCatalog().map(function (c) {
      if (c.id !== catId) return c;
      return Object.assign({}, c, { items: c.items.concat([item]) });
    });
    if (draft.alsoHip && catId === "shingle") {
      var hip = IC.catalogCategory("hipRidge");
      var hipExists = hip && hip.items.some(function (it) { return it.name.toLowerCase() === name.toLowerCase(); });
      if (!hipExists) {
        var sample = hip && hip.items.filter(function (it) { return it.active !== false; })[0];
        var hipPrice = draft.hipPrice != null && draft.hipPrice !== "" ? Number(draft.hipPrice) : (sample ? sample.price : 0);
        var hipItem = IC.normalizeItem("hipRidge", { name: name, sku: draft.sku, price: hipPrice, active: true });
        catalog = catalog.map(function (c) {
          if (c.id !== "hipRidge") return c;
          return Object.assign({}, c, { items: c.items.concat([hipItem]) });
        });
      }
    }
    IC.saveCatalog(catalog);
    return item;
  };

  IC.setCatalogItemActive = function (catId, itemId, active) {
    if (!IC.canManageTeam(IC.state.session)) return;
    var cat = IC.catalogCategory(catId);
    if (!cat) return;
    if (!active) {
      var remaining = cat.items.filter(function (it) { return it.id !== itemId && it.active !== false; });
      if (!remaining.length) {
        IC.toast("Keep at least one active item in " + cat.label);
        return;
      }
    }
    IC.updateCatalogItem(catId, itemId, { active: active });
  };

  IC.removeCatalogItem = function (catId, itemId) {
    if (!IC.canManageTeam(IC.state.session)) return;
    var cat = IC.catalogCategory(catId);
    if (!cat) return;
    var remaining = cat.items.filter(function (it) { return it.id !== itemId; });
    var remainingActive = remaining.filter(function (it) { return it.active !== false; });
    if (!remainingActive.length) {
      IC.toast("Keep at least one active item in " + cat.label);
      return;
    }
    var catalog = IC.liveCatalog().map(function (c) {
      if (c.id !== catId) return c;
      return Object.assign({}, c, { items: remaining });
    });
    IC.saveCatalog(catalog);
  };

  IC.bumpCatalogPrices = function (catId, percent) {
    if (!IC.canManageTeam(IC.state.session)) return;
    var pct = Number(percent);
    if (!Number.isFinite(pct) || pct === 0) {
      IC.toast("Enter a percent, like 5 or -3");
      return;
    }
    var factor = 1 + pct / 100;
    var catalog = IC.liveCatalog().map(function (cat) {
      if (cat.id !== catId) return cat;
      return Object.assign({}, cat, {
        items: cat.items.map(function (it) {
          if (it.active === false) return it;
          return Object.assign({}, it, { price: Math.round(it.price * factor * 100) / 100 });
        }),
      });
    });
    IC.saveCatalog(catalog);
    IC.toast((pct > 0 ? "+" : "") + pct + "% on " + (IC.catalogCategory(catId) || {}).label);
  };

  IC.updateTeam = function (team) {
    IC.state.team = team;
    var s = IC.state.session;
    if (s) {
      var me = team.find(function (t) { return t.id === s.memberId || (s.firebaseUid && t.firebaseUid === s.firebaseUid); });
      if (me) {
        IC.state.session = Object.assign({}, s, {
          memberId: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          title: IC.roleLabel(me),
          salesName: me.salesName,
          status: me.status || "active",
        });
      }
    }
    IC.emit();
    IC.cloudUpsert("meta", "team", { team: team });
    team.forEach(function (u) { IC.cloudUpsert("users", u.id, u); });
  };

  IC.saveUser = function (user) {
    if (!user || !user.id) return;
    var list = IC.state.team;
    var i = list.findIndex(function (x) { return x.id === user.id; });
    IC.state.team = i >= 0 ? list.map(function (x) { return x.id === user.id ? user : x; }) : list.concat([user]);
    var s = IC.state.session;
    if (s && (s.memberId === user.id || (s.firebaseUid && user.firebaseUid === s.firebaseUid))) {
      IC.state.session = IC.memberToSession(user, s.mode, s.firebaseUid || user.firebaseUid);
    }
    IC.emit();
    IC.cloudUpsert("users", user.id, user);
  };

  IC.remapIdentity = function (fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    IC.state.jobs = IC.state.jobs.map(function (j) {
      if (j.ownerId !== fromId && j.createdBy !== fromId) return j;
      var n = Object.assign({}, j, { updatedAt: IC.nowIso() });
      if (j.ownerId === fromId) n.ownerId = toId;
      if (j.createdBy === fromId) n.createdBy = toId;
      IC.cloudUpsert("jobs", n.id, n);
      return n;
    });
    IC.state.notifications = IC.state.notifications.map(function (n) {
      if (n.userId !== fromId) return n;
      var next = Object.assign({}, n, { userId: toId });
      IC.cloudUpsert("notifications", next.id, next);
      return next;
    });
  };

  IC.grantUser = function (id, patch) {
    if (!IC.canManageTeam(IC.state.session)) return;
    var user = IC.state.team.find(function (t) { return t.id === id; });
    if (!user) return;
    var next = Object.assign({}, user, patch || {});
    if (patch && patch.role === "admin") {
      next.role = "admin";
      next.status = "active";
      next.active = true;
      if (!next.title || next.title === "Waiting" || next.title === "Sales") next.title = "Admin";
    } else if (patch && patch.role === "sales") {
      next.role = "sales";
      next.status = "active";
      next.active = true;
      if (!next.title || next.title === "Waiting") next.title = "Sales";
      if (!next.salesName) next.salesName = next.name;
    } else if (patch && (patch.status === "disabled" || patch.role === "pending")) {
      next.role = "pending";
      next.status = patch.status || "pending";
      next.active = false;
    }
    if (patch && patch.linkTo) {
      var seat = IC.state.team.find(function (t) { return t.id === patch.linkTo; });
      if (seat && seat.id !== user.id) {
        var merged = Object.assign({}, seat, {
          email: user.email || seat.email,
          firebaseUid: user.firebaseUid || seat.firebaseUid,
          name: user.name || seat.name,
          status: "active",
          active: true,
          role: next.role === "admin" ? "admin" : (seat.role === "admin" ? "admin" : "sales"),
          title: next.title || seat.title,
          salesName: next.salesName || seat.salesName,
          placeholder: false,
        });
        IC.remapIdentity(user.id, merged.id);
        IC.state.team = IC.state.team.filter(function (t) { return t.id !== user.id; }).map(function (t) {
          return t.id === merged.id ? merged : t;
        });
        IC.updateTeam(IC.state.team);
        IC.cloudDelete("users", user.id);
        IC.toast("Linked " + (user.name || "account") + " to " + merged.name);
        return;
      }
    }
    IC.saveUser(next);
    IC.toast(next.name + " is now " + IC.roleLabel(next));
  };

  IC.addTeammate = function (draft) {
    if (!IC.canManageTeam(IC.state.session)) return null;
    draft = draft || {};
    var name = String(draft.name || "").trim() || "New teammate";
    var role = draft.role === "admin" ? "admin" : "sales";
    var title = String(draft.title || "").trim() || (role === "admin" ? "Admin" : "Sales");
    var salesName = String(draft.salesName || "").trim();
    if (!salesName && role === "sales") salesName = name;
    var member = {
      id: IC.uid(),
      name: name,
      email: String(draft.email || "").trim(),
      role: role,
      title: title,
      salesName: salesName || null,
      active: true,
      status: "active",
      placeholder: true,
    };
    IC.updateTeam(IC.state.team.concat([member]));
    return member;
  };

  IC.removeTeammate = function (id) {
    var s = IC.state.session;
    if (!IC.canManageTeam(s)) return;
    if (s.memberId === id) {
      IC.toast("You can’t remove yourself");
      return;
    }
    var member = IC.state.team.find(function (t) { return t.id === id; });
    if (!member) return;
    var remainingAdmins = IC.state.team.filter(function (t) {
      return t.id !== id && t.role === "admin";
    });
    if (member.role === "admin" && !remainingAdmins.length) {
      IC.toast("Keep at least one admin");
      return;
    }
    IC.updateTeam(IC.state.team.filter(function (t) { return t.id !== id; }));
  };

  IC.markNotificationRead = function (id) {
    IC.state.notifications = IC.state.notifications.map(function (n) {
      return n.id === id ? Object.assign({}, n, { read: true }) : n;
    });
    IC.emit();
  };

  IC.markAllRead = function (userId) {
    IC.state.notifications = IC.state.notifications.map(function (n) {
      return n.userId === userId ? Object.assign({}, n, { read: true }) : n;
    });
    IC.emit();
  };

  IC.clearSeedData = function () {
    IC.state.customers = IC.state.customers.filter(function (c) { return !c.seeded; });
    IC.state.jobs = IC.state.jobs.filter(function (j) { return !j.seeded; });
    IC.emit();
  };

  IC.notify = function (n) {
    if (!n || !n.userId) return;
    var me = IC.state.session && IC.state.session.memberId;
    if (me && n.userId === me) return;
    var row = Object.assign({}, n, { id: IC.uid(), createdAt: IC.nowIso(), read: false });
    IC.state.notifications = [row].concat(IC.state.notifications).slice(0, 200);
    IC.emit();
    IC.cloudUpsert("notifications", row.id, row);
  };

  IC.newCustomerDraft = function () {
    var t = IC.nowIso();
    return {
      id: IC.uid(), firstName: "", lastName: "", phone: "", email: "",
      street: "", city: "", state: "IN", zip: "", notes: "",
      createdAt: t, updatedAt: t,
    };
  };

  IC.newJobFor = function (customer, session) {
    var t = IC.nowIso();
    var estimate = IC.withComputed(IC.defaultEstimate(IC.state.settings), IC.state.settings);
    var ownerIsSales = Boolean(session && session.salesName);
    return {
      id: IC.uid(),
      number: IC.nextJobNumber(),
      customerId: customer.id,
      customerName: IC.fullName(customer.firstName, customer.lastName),
      status: "Lead",
      ownerId: ownerIsSales ? session.memberId : null,
      ownerName: ownerIsSales ? session.salesName : null,
      crewId: null,
      crewName: null,
      scheduledDate: null,
      includeRoof: true,
      includeGutters: false,
      includeSiding: false,
      price: 0,
      notes: "",
      estimate: estimate,
      contract: null,
      createdAt: t,
      updatedAt: t,
      createdBy: session ? session.memberId : "unknown",
    };
  };

  IC.setSession = function (s) {
    IC.state.session = s;
    IC.emit();
  };

  IC.memberToSession = function (member, mode, firebaseUid) {
    return {
      memberId: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      title: IC.roleLabel(member),
      salesName: member.salesName,
      status: member.status || (IC.isApproved(member) ? "active" : "pending"),
      firebaseUid: firebaseUid || member.firebaseUid || null,
      mode: mode || "online",
    };
  };

  IC.enterLocal = function (member) {
    IC.initIfEmpty();
    IC.setSession(IC.memberToSession(member, "offline", null));
  };

  IC.toast = function (msg) {
    IC.ui.toast = msg;
    IC.emit();
    setTimeout(function () {
      if (IC.ui.toast === msg) {
        IC.ui.toast = "";
        IC.emit();
      }
    }, 2800);
  };
})(window.IC);

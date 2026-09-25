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
      team: [],
      crews: IC.clone(IC.CREWS),
      catalog: IC.ensureCatalog(null),
      customers: [],
      jobs: [],
      notifications: [],
      dismissedNoteIds: {},
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
    toastMode: "",
    addUserOpen: false,
    addUserDraft: null,
    catalogCat: "shingle",
    catalogShowOff: false,
    catalogAddName: "",
    catalogAddSku: "",
    catalogAddPrice: "",
    catalogAddHip: true,
    catalogBump: "",
    laborCrew: "",
  };

  IC.defaultNotifyPrefs = function (member) {
    var lead = member && (member.role === "admin" || member.role === "manager");
    return {
      jobCreated: Boolean(lead),
      jobAssigned: true,
      statusChanged: true,
      jobScheduled: false,
      jobComplete: false,
    };
  };

  IC.normalizeNotifyPrefs = function (raw, member) {
    return Object.assign({}, IC.defaultNotifyPrefs(member), raw || {});
  };

  IC.personIds = function (person) {
    if (!person) return [];
    var ids = [person.id, person.memberId, person.firebaseUid];
    return ids.filter(function (x, i) { return x && ids.indexOf(x) === i; });
  };

  IC.isSamePerson = function (a, b) {
    if (!a || !b) return false;
    var aIds = IC.personIds(a);
    var bIds = IC.personIds(b);
    if (aIds.some(function (id) { return bIds.indexOf(id) >= 0; })) return true;
    var ae = (a.email || "").toLowerCase();
    var be = (b.email || "").toLowerCase();
    return Boolean(ae && be && ae === be);
  };

  IC.noteIsForSession = function (n, session) {
    if (!n || !session) return false;
    var ids = IC.personIds(session);
    if (n.userId && ids.indexOf(n.userId) >= 0) return true;
    return (n.userIds || []).some(function (id) { return ids.indexOf(id) >= 0; });
  };

  IC.wantsNotify = function (member, key) {
    if (!member || !IC.isApproved(member)) return false;
    return Boolean(IC.normalizeNotifyPrefs(member.notifyPrefs, member)[key]);
  };

  IC.memberById = function (id) {
    if (!id) return null;
    return (IC.state.team || []).find(function (t) {
      return t.id === id || t.firebaseUid === id;
    }) || null;
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
        dismissedNoteIds: s.dismissedNoteIds || {},
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

  IC.mergeSettings = function (incoming) {
    var prev = IC.state.settings || {};
    var next = Object.assign({}, IC.clone(IC.SETTINGS), prev, incoming || {});
    if (prev.seedCleared || next.seedCleared) next.seedCleared = true;
    if (next.permissions) next.permissions = IC.normalizePermissions(next.permissions);
    if (IC.normalizeLaborRates) next.laborRates = IC.normalizeLaborRates(next.laborRates);
    return next;
  };

  IC.seedCleared = function () {
    return Boolean(IC.state.settings && IC.state.settings.seedCleared);
  };

  IC.dropSampleRecords = function (fromCloud) {
    var dropCust = {};
    (IC.state.customers || []).forEach(function (c) {
      if (IC.isSampleCustomer(c)) dropCust[c.id] = true;
    });
    var dropJobs = (IC.state.jobs || []).filter(function (j) {
      return IC.isSampleJob(j) || dropCust[j.customerId];
    });
    var dropJobIds = {};
    dropJobs.forEach(function (j) { dropJobIds[j.id] = true; });
    IC.state.customers = (IC.state.customers || []).filter(function (c) { return !dropCust[c.id]; });
    IC.state.jobs = (IC.state.jobs || []).filter(function (j) { return !dropJobIds[j.id]; });
    var dropNotes = (IC.state.notifications || []).filter(function (n) {
      return n.jobId && dropJobIds[n.jobId];
    });
    IC.state.notifications = (IC.state.notifications || []).filter(function (n) { return !n.jobId || !dropJobIds[n.jobId]; });
    if (fromCloud) {
      Object.keys(dropCust).forEach(function (id) { IC.cloudDelete("customers", id); });
      dropJobs.forEach(function (j) { IC.cloudDelete("jobs", j.id); });
      dropNotes.forEach(function (n) { if (n.id) IC.cloudDelete("notifications", n.id); });
    }
    return { customers: Object.keys(dropCust).length, jobs: dropJobs.length };
  };

  IC.loadLocal = function () {
    try {
      var raw = localStorage.getItem(IC.STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.assign(IC.state, {
          initialized: Boolean(parsed.initialized),
          settings: IC.mergeSettings(parsed.settings || {}),
          team: IC.mergeRoster(parsed.team || []),
          crews: (parsed.crews && parsed.crews.length ? parsed.crews : IC.clone(IC.CREWS)).map(IC.normalizeCrew),
          catalog: IC.ensureCatalog(parsed.catalog),
          customers: parsed.customers || [],
          jobs: parsed.jobs || [],
          notifications: parsed.notifications || [],
          dismissedNoteIds: parsed.dismissedNoteIds || {},
        });
        IC.state.notifications = IC.ingestNotifications(IC.state.notifications);
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
          permission: mem.permission || IC.state.session.permission,
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
    if (IC.state.settings && IC.state.settings.seedCleared) {
      IC.state.customers = [];
      IC.state.jobs = [];
    } else {
      IC.state.customers = customers;
      IC.state.jobs = jobs;
    }
    if (!IC.state.settings || !IC.state.settings.legalName) IC.state.settings = IC.clone(IC.SETTINGS);
    else IC.state.settings = IC.mergeSettings(IC.state.settings);
    if (IC.state.settings.seedCleared) {
      IC.state.customers = (IC.state.customers || []).filter(function (c) { return !IC.isSampleCustomer(c); });
      IC.state.jobs = (IC.state.jobs || []).filter(function (j) { return !IC.isSampleJob(j); });
    }
    if (IC.state.settings.permissions) IC.state.settings.permissions = IC.normalizePermissions(IC.state.settings.permissions);
    if (!IC.state.team) IC.state.team = [];
    IC.state.team = IC.mergeRoster(IC.state.team);
    if (!IC.state.crews.length) IC.state.crews = IC.clone(IC.CREWS);
    IC.state.crews = (IC.state.crews || []).map(IC.normalizeCrew);
    IC.state.catalog = IC.ensureCatalog(IC.state.catalog);
  };

  function nextNumber(jobs) {
    return jobs.reduce(function (m, j) { return Math.max(m, j.number || 0); }, 10000) + 1;
  }

  IC.nextJobNumber = function () {
    return nextNumber(IC.state.jobs);
  };

  IC.replaceCloud = function (data) {
    if (data.team) data.team = IC.mergeRoster(data.team);
    if (data.settings) {
      data.settings = IC.mergeSettings(data.settings);
    }
    if (data.catalog) data.catalog = IC.ensureCatalog(data.catalog);
    Object.assign(IC.state, data, { initialized: true });
    IC.state.catalog = IC.ensureCatalog(IC.state.catalog);
    if (IC.seedCleared()) IC.dropSampleRecords(true);
    IC.state.notifications = IC.ingestNotifications(IC.state.notifications || [], true);
    IC.emit();
  };

  IC.fillTeamTitles = function (team) {
    return (team || []).map(function (m) {
      var status = m.status || (m.role === "pending" ? "pending" : "active");
      var next = Object.assign({}, m, { status: status });
      if (!next.title) {
        if (status === "pending") next.title = "Waiting";
        else if (next.role === "admin") next.title = "Admin";
        else if (next.role === "user") next.title = "User";
        else if (next.role === "manager") next.title = "Manager";
        else if (next.role === "sales") next.title = "Sales";
        else next.title = "Waiting";
      }
      if (next.commissionPercent == null || next.commissionPercent === "") {
        next.commissionPercent = 0;
      } else {
        next.commissionPercent = Number(next.commissionPercent) || 0;
      }
      if (next.phone == null) next.phone = "";
      next.notifyPrefs = IC.normalizeNotifyPrefs(next.notifyPrefs, next);
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

  IC.syncJobCustomerNames = function () {
    if (IC._syncingNames) return;
    var customers = IC.state.customers || [];
    var jobs = IC.state.jobs || [];
    if (!customers.length || !jobs.length) return;
    var byId = {};
    customers.forEach(function (c) { if (c && c.id) byId[c.id] = c; });
    var pushed = IC._custNamePushed || (IC._custNamePushed = {});
    var localChanged = false;
    var toCloud = [];
    var nextJobs = jobs.map(function (j) {
      if (!j || !j.customerId || !byId[j.customerId]) return j;
      var name = IC.fullName(byId[j.customerId].firstName, byId[j.customerId].lastName);
      if ((j.customerName || "") === name) {
        if (pushed[j.id] === name) delete pushed[j.id];
        return j;
      }
      localChanged = true;
      var updated = Object.assign({}, j, { customerName: name, updatedAt: IC.nowIso() });
      if (pushed[j.id] !== name) {
        pushed[j.id] = name;
        toCloud.push(updated);
      }
      return updated;
    });
    if (!localChanged) return;
    IC._syncingNames = true;
    try {
      IC.state.jobs = nextJobs;
      IC.emit();
      toCloud.forEach(function (j) {
        IC.cloudUpsert("jobs", j.id, j);
        if (j.contract && j.contract.signingToken && IC.publishSignLink) IC.publishSignLink(j);
      });
    } finally {
      IC._syncingNames = false;
    }
  };

  IC.upsertCustomer = function (c) {
    if (IC.seedCleared() && IC.isSampleCustomer(c)) {
      IC.cloudDelete("customers", c.id);
      return;
    }
    IC.state.customers = upsertList(IC.state.customers, c);
    IC.emit();
    IC.cloudUpsert("customers", c.id, c);
    IC.syncJobCustomerNames();
  };

  IC.deleteCustomer = function (id) {
    IC.state.customers = IC.state.customers.filter(function (c) { return c.id !== id; });
    IC.emit();
    IC.cloudDelete("customers", id);
  };

  IC.upsertJob = function (j) {
    if (IC.seedCleared() && (IC.isSampleJob(j) || IC.isSampleCustomer(IC.state.customers.find(function (c) { return c.id === j.customerId; })))) {
      IC.cloudDelete("jobs", j.id);
      return;
    }
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
    IC.notifyAssigned(next, job.ownerId, member);
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
    if (date) IC.notifyOwnerEvent(next, "jobScheduled", {
      title: "Job scheduled",
      body: "#" + next.number + " " + next.customerName + (crew ? " · " + crew.name : "") + " · " + date,
    });
  };

  IC.setProductionDate = function (jobId, iso) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job || !IC.canAssignCrew(IC.state.session, job)) return;
    var date = IC.validIsoDate(iso);
    if ((job.scheduledDate || null) === date) return;
    var next = Object.assign({}, job, { scheduledDate: date, updatedAt: IC.nowIso() });
    if (date && job.status !== "Complete" && job.status !== "Did NOT Sell") next.status = "Job Scheduled";
    IC.upsertJob(next);
    if (date) {
      IC.notifyOwnerEvent(next, "jobScheduled", {
        title: "Job scheduled",
        body: "#" + next.number + " " + next.customerName + " · " + date,
      });
    }
  };

  IC.setStatus = function (jobId, status) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    if (job.status === status) return;
    var next = Object.assign({}, job, { status: status, updatedAt: IC.nowIso() });
    IC.upsertJob(next);
    if (status === "Complete") {
      IC.notifyOwnerEvent(next, "jobComplete", {
        title: "Job complete",
        body: "#" + next.number + " " + next.customerName + " is complete.",
      });
    } else if (status === "Job Scheduled") {
      IC.notifyOwnerEvent(next, "jobScheduled", {
        title: "Job scheduled",
        body: "#" + next.number + " " + next.customerName + " is now scheduled.",
      });
    } else {
      IC.notifyOwnerEvent(next, "statusChanged", {
        title: "Status updated",
        body: "#" + next.number + " " + next.customerName + " is now " + status + ".",
      });
    }
  };

  IC.saveEstimate = function (jobId, estimate) {
    var job = IC.state.jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    var computed = IC.withComputed(estimate, IC.state.settings, job);
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
        return ((t.role === "admin" || t.role === "manager") && IC.isApproved(t)) || t.id === job.ownerId;
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
    var next = IC.normalizeCrew(c);
    if (!next.id) next.id = IC.uid();
    var list = IC.state.crews;
    var i = list.findIndex(function (x) { return x.id === next.id; });
    IC.state.crews = i >= 0 ? list.map(function (x) { return x.id === next.id ? next : x; }) : list.concat([next]);
    IC.emit();
    IC.cloudUpsert("crews", next.id, next);
  };

  IC.deleteCrew = function (id) {
    IC.state.crews = IC.state.crews.filter(function (c) { return c.id !== id; });
    IC.emit();
    IC.cloudDelete("crews", id);
  };

  IC.updateSettings = function (patch) {
    IC.state.settings = IC.mergeSettings(patch);
    IC.emit();
    IC.cloudUpsert("meta", "settings", IC.state.settings);
    if (IC.state.settings.seedCleared) IC.cloudUpsert("meta", "seedCleared", { cleared: true, at: IC.nowIso() });
  };

  IC.saveCatalog = function (catalog) {
    IC.state.catalog = IC.ensureCatalog(catalog);
    IC.emit();
    IC.cloudUpsert("meta", "catalog", { catalog: IC.state.catalog, updatedAt: IC.nowIso() });
  };

  IC.updateCatalogItem = function (catId, itemId, patch) {
    if (!IC.can(IC.state.session, "materials", "write")) return;
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
    if (!IC.can(IC.state.session, "materials", "write")) return null;
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
    if (!IC.can(IC.state.session, "materials", "write")) return;
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
    if (!IC.can(IC.state.session, "materials", "write")) return;
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
    if (!IC.can(IC.state.session, "materials", "write")) return;
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
      if (!next.title || next.title === "Waiting" || next.title === "Sales" || next.title === "Manager") next.title = "Admin";
    } else if (patch && (patch.role === "user" || patch.role === "manager" || patch.role === "sales")) {
      next.role = "user";
      next.status = "active";
      next.active = true;
      if (!next.title || next.title === "Waiting" || next.title === "Sales" || next.title === "Manager") next.title = "User";
      if (!next.salesName) next.salesName = next.name;
      next.permission = IC.normalizePermissionMap(next.permission);
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
          role: next.role === "admin" ? "admin" : (seat.role === "admin" ? "admin" : "user"),
          permission: IC.normalizePermissionMap(seat.permission || next.permission),
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
    var role = draft.role === "admin" ? "admin" : "user";
    var title = String(draft.title || "").trim() || (role === "admin" ? "Admin" : "User");
    var salesName = String(draft.salesName || "").trim();
    if (!salesName && role === "user") salesName = name;
    var member = {
      id: IC.uid(),
      name: name,
      email: String(draft.email || "").trim(),
      phone: String(draft.phone || "").trim(),
      role: role,
      title: title,
      salesName: salesName || null,
      permission: IC.normalizePermissionMap(draft.permission),
      commissionPercent: Number(draft.commissionPercent) || 0,
      notifyPrefs: IC.normalizeNotifyPrefs(null, { role: role }),
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
    IC.cloudDelete("users", id);
  };

  IC.markNotificationRead = function (id) {
    IC.state.notifications = IC.state.notifications.map(function (n) {
      if (n.id !== id) return n;
      var next = Object.assign({}, n, { read: true });
      IC.cloudUpsert("notifications", next.id, next);
      return next;
    });
    IC.emit();
  };

  IC.markAllRead = function (session) {
    var s = session || IC.state.session;
    IC.state.notifications = IC.state.notifications.map(function (n) {
      if (!IC.noteIsForSession(n, s) || n.read) return n;
      var next = Object.assign({}, n, { read: true });
      IC.cloudUpsert("notifications", next.id, next);
      return next;
    });
    IC.emit();
  };

  IC.dismissNoteId = function (id) {
    if (!id) return;
    IC.state.dismissedNoteIds = IC.state.dismissedNoteIds || {};
    IC.state.dismissedNoteIds[id] = true;
  };

  IC.isDismissedNote = function (id) {
    return Boolean(id && IC.state.dismissedNoteIds && IC.state.dismissedNoteIds[id]);
  };

  IC.ingestNotifications = function (list, fromCloud) {
    var incoming = list || [];
    var keep = [];
    incoming.forEach(function (n) {
      if (!n || !n.id) return;
      if (IC.isDismissedNote(n.id)) {
        if (fromCloud) IC.cloudDelete("notifications", n.id);
        return;
      }
      keep.push(n);
    });
    return keep;
  };

  IC.deleteNotification = function (id) {
    if (!id) return;
    var row = (IC.state.notifications || []).find(function (n) { return n.id === id; });
    if (row && IC.state.session && !IC.noteIsForSession(row, IC.state.session)) return;
    IC.dismissNoteId(id);
    IC.state.notifications = (IC.state.notifications || []).filter(function (n) { return n.id !== id; });
    IC.emit();
    IC.cloudDelete("notifications", id);
  };

  IC.clearMyNotifications = function (session) {
    var s = session || IC.state.session;
    if (!s) return 0;
    var drop = (IC.state.notifications || []).filter(function (n) { return IC.noteIsForSession(n, s); });
    drop.forEach(function (n) { if (n && n.id) IC.dismissNoteId(n.id); });
    var dropIds = {};
    drop.forEach(function (n) { if (n && n.id) dropIds[n.id] = true; });
    IC.state.notifications = (IC.state.notifications || []).filter(function (n) { return !dropIds[n.id]; });
    IC.emit();
    var db = IC.getDb && IC.getDb();
    var authed = IC.getAuth && IC.getAuth() && IC.getAuth().currentUser;
    if (db && authed && drop.length) {
      try {
        var batch = db.batch();
        drop.forEach(function (n) {
          if (n.id) batch.delete(db.collection("notifications").doc(n.id));
        });
        batch.commit().catch(function (err) {
          console.warn("[ironclad] clear inbox batch failed", err);
          drop.forEach(function (n) { if (n.id) IC.cloudDelete("notifications", n.id); });
        });
      } catch (err) {
        drop.forEach(function (n) { if (n.id) IC.cloudDelete("notifications", n.id); });
      }
    } else {
      drop.forEach(function (n) { if (n.id) IC.cloudDelete("notifications", n.id); });
    }
    return drop.length;
  };

  IC.notify = function (n) {
    if (!n || !n.userId) return;
    var me = IC.state.session;
    var target = IC.memberById(n.userId) || { id: n.userId, firebaseUid: n.userId };
    if (IC.isSamePerson(target, me)) return;
    var ids = IC.personIds(target);
    if (n.userIds) {
      n.userIds.forEach(function (id) { if (id && ids.indexOf(id) < 0) ids.push(id); });
    }
    var row = Object.assign({}, n, {
      id: IC.uid(),
      createdAt: IC.nowIso(),
      read: false,
      userId: ids[0] || n.userId,
      userIds: ids,
    });
    IC.state.notifications = [row].concat(IC.state.notifications).slice(0, 200);
    IC.emit();
    IC.cloudUpsert("notifications", row.id, row);
  };

  IC.notifyMember = function (member, payload) {
    if (!member) return;
    IC.notify(Object.assign({}, payload, {
      userId: member.firebaseUid || member.id,
      userIds: IC.personIds(member),
    }));
  };

  IC.notifyAssigned = function (job, prevOwnerId, member) {
    if (!job || !member) return;
    if (prevOwnerId && (prevOwnerId === member.id || prevOwnerId === member.firebaseUid)) return;
    if (!IC.wantsNotify(member, "jobAssigned")) return;
    IC.notifyMember(member, {
      title: "Job assigned to you",
      body: "#" + job.number + " " + job.customerName + " is now yours.",
      type: "jobAssigned",
      jobId: job.id,
    });
  };

  IC.notifyOwnerEvent = function (job, prefKey, payload) {
    if (!job || !job.ownerId) return;
    var owner = IC.memberById(job.ownerId);
    if (!owner || !IC.wantsNotify(owner, prefKey)) return;
    IC.notifyMember(owner, Object.assign({ type: prefKey, jobId: job.id }, payload));
  };

  IC.notifyNewJob = function (job) {
    if (!job) return;
    (IC.state.team || []).forEach(function (m) {
      if (m.role !== "admin" && m.role !== "manager") return;
      if (!IC.wantsNotify(m, "jobCreated")) return;
      IC.notifyMember(m, {
        title: "New job entered",
        body: "#" + job.number + " " + job.customerName + (job.ownerName ? " · " + job.ownerName : " · unassigned"),
        type: "jobCreated",
        jobId: job.id,
      });
    });
  };

  IC.setNotifyPref = function (key, on) {
    var s = IC.state.session;
    if (!s) return;
    var me = IC.state.team.find(function (t) {
      return t.id === s.memberId || (s.firebaseUid && t.firebaseUid === s.firebaseUid);
    });
    if (!me) return;
    var prefs = IC.normalizeNotifyPrefs(me.notifyPrefs, me);
    prefs[key] = Boolean(on);
    IC.saveUser(Object.assign({}, me, { notifyPrefs: prefs }));
  };

  IC.clearSeedData = function () {
    IC.state.settings = IC.mergeSettings({ seedCleared: true });
    IC.dropSampleRecords(true);
    IC.emit();
    IC.cloudUpsert("meta", "settings", IC.state.settings);
    IC.cloudUpsert("meta", "seedCleared", { cleared: true, at: IC.nowIso() });
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
    var ownerIsSales = Boolean(session && session.salesName);
    var stub = {
      ownerId: ownerIsSales ? session.memberId : null,
      ownerName: ownerIsSales ? session.salesName : null,
    };
    var estimate = IC.withComputed(IC.defaultEstimate(IC.state.settings), IC.state.settings, stub);
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
      permission: member.permission || {},
      firebaseUid: firebaseUid || member.firebaseUid || null,
      mode: mode || "online",
    };
  };

  IC.enterLocal = function (member) {
    IC.initIfEmpty();
    IC.setSession(IC.memberToSession(member, "offline", null));
  };

  IC.updatePermissions = function () { /* replaced by per-user page radios */ };

  IC.setUserPagePermission = function (userId, pageId, level) {
    if (!IC.isAdmin(IC.state.session)) return;
    var user = IC.state.team.find(function (t) { return t.id === userId; });
    if (!user) return;
    if (user.role === "admin") {
      IC.toast("Admin always has full access");
      return;
    }
    var nextLevel = IC.normalizePageLevel(level);
    if (!nextLevel) return;
    var map = IC.normalizePermissionMap(user.permission);
    map[pageId] = nextLevel;
    IC.saveUser(Object.assign({}, user, { permission: map }));
    IC.toast("Saved for " + (user.name || "that user"));
  };

  IC.toast = function (msg, opts) {
    opts = opts || {};
    IC.ui.toast = msg;
    IC.ui.toastMode = opts.mode || "";
    IC.emit();
    setTimeout(function () {
      if (IC.ui.toast === msg) {
        IC.ui.toast = "";
        IC.ui.toastMode = "";
        IC.emit();
      }
    }, 2800);
  };
})(window.IC);

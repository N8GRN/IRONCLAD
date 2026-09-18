/* ============================================================
   IRONCLAD CRM — hash router + click/input handlers
   Routes live in the URL after #:  #/jobs  #/jobs/ID  #/sign/TOKEN
   Edit views.js for screens, css/app.css for look, config.js for team.
   ============================================================ */
window.IC = window.IC || {};

(function (IC) {
  var root;
  var rendering = false;

  IC.parseRoute = function () {
    var hash = (location.hash || "#/").replace(/^#/, "");
    if (!hash.startsWith("/")) hash = "/" + hash;
    var q = hash.indexOf("?");
    if (q >= 0) hash = hash.slice(0, q);
    var parts = hash.split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "login") return { name: "login" };
    if (parts[0] === "jobs" && parts[1]) return { name: "job", id: parts[1] };
    if (parts[0] === "jobs") return { name: "jobs" };
    if (parts[0] === "customers" && parts[1]) return { name: "customer", id: parts[1] };
    if (parts[0] === "customers") return { name: "customers" };
    if (parts[0] === "schedule") return { name: "schedule" };
    if (parts[0] === "settings") return { name: "settings" };
    if (parts[0] === "notifications") return { name: "notifications" };
    if (parts[0] === "sign" && parts[1]) return { name: "sign", token: parts[1] };
    return { name: "home" };
  };

  IC.go = function (path) {
    if (path.charAt(0) !== "#") path = "#" + (path.charAt(0) === "/" ? path : "/" + path);
    if (location.hash === path) IC.render();
    else location.hash = path;
  };

  function currentJob() {
    var r = IC.parseRoute();
    return r.name === "job" ? IC.state.jobs.find(function (j) { return j.id === r.id; }) : null;
  }

  function currentEstimate(job) {
    var settings = IC.state.settings;
    return job.estimate || IC.withComputed(IC.defaultEstimate(settings), settings);
  }

  function patchEstimate(job, patch) {
    IC.saveEstimate(job.id, Object.assign({}, currentEstimate(job), patch));
  }

  IC.render = function () {
    if (!root) root = document.getElementById("app");
    if (!root) return;
    rendering = true;
    var active = document.activeElement;
    var restore = null;
    if (active && root.contains(active) && active.getAttribute) {
      restore = {
        act: active.getAttribute("data-act"),
        est: active.getAttribute("data-est"),
        key: active.getAttribute("data-key"),
        sid: active.getAttribute("data-sid"),
        cat: active.getAttribute("data-cat"),
        eid: active.getAttribute("data-eid"),
        set: active.getAttribute("data-set"),
        team: active.getAttribute("data-team"),
        crew: active.getAttribute("data-crew"),
        cust: active.getAttribute("data-cust"),
        draft: active.getAttribute("data-draft"),
        cdraft: active.getAttribute("data-cdraft"),
        name: active.getAttribute("name"),
        idAttr: active.getAttribute("data-id"),
        tag: active.tagName,
        start: active.selectionStart,
        end: active.selectionEnd,
      };
    }
    var scrollY = window.scrollY;
    var route = IC.parseRoute();
    var html;
    if (route.name === "sign") {
      html = IC.viewSign(route.token);
      if (!IC.ui.signTried && !IC.state.jobs.some(function (j) { return j.contract && j.contract.signingToken === route.token; })) {
        IC.loadSignLink(route.token).then(function (data) {
          IC.ui.signRemote = data;
          IC.ui.signTried = true;
          if (data && data.customer && !IC.ui.printedName) {
            IC.ui.printedName = IC.fullName(data.customer.firstName, data.customer.lastName);
          }
          IC.render();
        });
      }
    } else if (!IC.state.session || route.name === "login") {
      html = IC.viewLogin();
    } else {
      var inner = "";
      if (route.name === "jobs") inner = IC.viewJobs();
      else if (route.name === "job") inner = IC.viewJob(route.id);
      else if (route.name === "customers") inner = IC.viewCustomers();
      else if (route.name === "customer") inner = IC.viewCustomer(route.id);
      else if (route.name === "schedule") inner = IC.viewSchedule();
      else if (route.name === "settings") inner = IC.viewSettings();
      else if (route.name === "notifications") inner = IC.viewNotifications();
      else inner = IC.viewHome();
      html = IC.viewShell(inner, route);
    }
    root.innerHTML = html;
    if (restore) {
      var nodes = root.querySelectorAll(restore.tag);
      var match = null;
      nodes.forEach(function (n) {
        if (match) return;
        function same(attr, val) {
          if (!val) return true;
          return n.getAttribute(attr) === val;
        }
        var ok = same("data-act", restore.act) && same("data-est", restore.est) &&
          same("data-key", restore.key) && same("data-sid", restore.sid) &&
          same("data-cat", restore.cat) && same("data-eid", restore.eid) &&
          same("data-set", restore.set) && same("data-team", restore.team) &&
          same("data-crew", restore.crew) && same("data-cust", restore.cust) &&
          same("data-draft", restore.draft) && same("data-cdraft", restore.cdraft) &&
          same("name", restore.name) && same("data-id", restore.idAttr);
        if (ok) match = n;
      });
      if (match) {
        match.focus();
        try {
          if (typeof restore.start === "number") match.setSelectionRange(restore.start, restore.end);
        } catch (err) { /* not a text field */ }
      }
    }
    window.scrollTo(0, scrollY);
    var pad = document.getElementById("sig-pad");
    if (pad) {
      IC.mountSigPad(pad, function (url) {
        IC.ui.sigUrl = url;
        var btns = root.querySelectorAll('[data-act="sign-customer"],[data-act="sign-company"],[data-act="remote-sign"]');
        btns.forEach(function (b) { b.disabled = !url || IC.ui.signBusy; });
      });
    }
    rendering = false;
  };

  function jobFromEl(el) {
    var id = el.getAttribute("data-id");
    return IC.state.jobs.find(function (j) { return j.id === id; }) || currentJob();
  }

  function onClick(e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    if (t.getAttribute("data-act") === "close-modal" && e.target.closest("[data-stop]") && e.target !== t) return;
    var act = t.getAttribute("data-act");
    var s = IC.state.session;

    if (act === "local-login") {
      var member = IC.state.team.find(function (m) { return m.id === IC.ui.loginMemberId; });
      if (member) {
        IC.enterLocal(member);
        IC.go("#/");
      }
      return;
    }
    if (act === "open-new-job") {
      IC.ui.newJobOpen = true;
      IC.ui.newJobDraft = IC.newCustomerDraft();
      IC.ui.newJobCustomerId = IC.state.customers[0] ? IC.state.customers[0].id : "";
      IC.render();
      return;
    }
    if (act === "open-new-customer") {
      IC.ui.newCustomerOpen = true;
      IC.ui.newCustomerDraft = IC.newCustomerDraft();
      IC.render();
      return;
    }
    if (act === "close-modal") {
      IC.ui.newJobOpen = false;
      IC.ui.newCustomerOpen = false;
      IC.render();
      return;
    }
    if (act === "new-job-mode") {
      IC.ui.newJobMode = t.getAttribute("data-mode");
      IC.render();
      return;
    }
    if (act === "create-job") {
      var customer;
      if (IC.ui.newJobMode === "new") {
        var d = IC.ui.newJobDraft;
        d.firstName = (d.firstName || "").trim();
        d.lastName = (d.lastName || "").trim();
        IC.upsertCustomer(d);
        customer = d;
      } else {
        customer = IC.state.customers.find(function (c) { return c.id === IC.ui.newJobCustomerId; });
      }
      if (!customer) return;
      var job = IC.newJobFor(customer, s);
      if (s.role === "admin" && !job.ownerId && s.salesName) {
        job.ownerId = s.memberId;
        job.ownerName = s.salesName;
      }
      IC.upsertJob(job);
      IC.ui.newJobOpen = false;
      IC.go("#/jobs/" + job.id);
      return;
    }
    if (act === "create-customer") {
      var cd = IC.ui.newCustomerDraft;
      cd.firstName = (cd.firstName || "").trim();
      cd.lastName = (cd.lastName || "").trim();
      IC.upsertCustomer(cd);
      IC.ui.newCustomerOpen = false;
      IC.go("#/customers/" + cd.id);
      return;
    }
    if (act === "job-tab") {
      IC.ui.jobTab = t.getAttribute("data-tab");
      IC.ui.sigUrl = "";
      IC.render();
      return;
    }
    if (act === "delete-job") {
      if (confirm("Delete this job?")) {
        IC.deleteJob(t.getAttribute("data-id"));
        IC.go("#/jobs");
      }
      return;
    }
    if (act === "save-est") {
      var j = currentJob();
      if (j) IC.saveEstimate(j.id, currentEstimate(j));
      IC.toast("Estimate saved");
      return;
    }
    if (act === "est-add-struct") {
      var j2 = currentJob();
      if (!j2) return;
      var est = currentEstimate(j2);
      patchEstimate(j2, { structures: est.structures.concat([IC.emptyStructure("Section " + (est.structures.length + 1))]) });
      return;
    }
    if (act === "est-del-struct") {
      var j3 = currentJob();
      if (!j3) return;
      var est3 = currentEstimate(j3);
      patchEstimate(j3, { structures: est3.structures.filter(function (x) { return x.id !== t.getAttribute("data-sid"); }) });
      return;
    }
    if (act === "est-add-extra") {
      var j4 = currentJob();
      if (!j4) return;
      var est4 = currentEstimate(j4);
      patchEstimate(j4, { extras: (est4.extras || []).concat([{ id: IC.uid(), label: "", amount: 0 }]) });
      return;
    }
    if (act === "est-del-extra") {
      var j5 = currentJob();
      if (!j5) return;
      var est5 = currentEstimate(j5);
      patchEstimate(j5, { extras: (est5.extras || []).filter(function (x) { return x.id !== t.getAttribute("data-eid"); }) });
      return;
    }
    if (act === "gen-contract") {
      var j6 = currentJob();
      if (!j6) return;
      var contract = j6.contract || {
        id: IC.uid(),
        status: "sent",
        signingToken: IC.uid().replace(/-/g, ""),
        generatedAt: new Date().toISOString(),
        paymentTerms: IC.state.settings.paymentTerms,
        warrantyWorkmanshipYears: IC.state.settings.warrantyWorkmanshipYears,
        bodyNotes: "",
        customerSignature: null,
        companySignature: null,
        signedAt: null,
      };
      if (contract.status === "draft") contract.status = "sent";
      IC.saveContract(j6.id, contract);
      IC.toast("Agreement generated");
      return;
    }
    if (act === "share-quote") {
      var sheet = document.getElementById("quote-sheet");
      var j7 = currentJob();
      if (!sheet || !j7) return;
      IC.htmlToPdf(sheet, "Ironclad-Quote-" + j7.number + ".pdf").then(function (out) {
        return IC.shareOrDownload({ filename: out.filename, title: "Ironclad quote #" + j7.number, text: "Quote for " + j7.customerName, blob: out.blob });
      });
      return;
    }
    if (act === "share-contract") {
      var sheet2 = document.getElementById("contract-sheet");
      var j8 = currentJob();
      if (!sheet2 || !j8) return;
      var signUrl = location.href.split("#")[0] + "#/sign/" + j8.contract.signingToken;
      IC.htmlToPdf(sheet2, "Ironclad-Agreement-" + j8.number + ".pdf").then(function (out) {
        return IC.shareOrDownload({ filename: out.filename, title: "Ironclad agreement #" + j8.number, text: "Service agreement for " + j8.customerName, url: signUrl, blob: out.blob });
      });
      return;
    }
    if (act === "share-sign-link") {
      var j9 = currentJob();
      if (!j9 || !j9.contract) return;
      var u = location.href.split("#")[0] + "#/sign/" + j9.contract.signingToken;
      IC.shareOrDownload({ filename: "sign.txt", title: "Sign your Ironclad agreement", text: j9.customerName + ", review and sign your roofing agreement:", url: u });
      return;
    }
    if (act === "print") { window.print(); return; }
    if (act === "clear-sig") {
      var pad = document.getElementById("sig-pad");
      if (pad && pad._clearPad) pad._clearPad();
      return;
    }
    if (act === "sign-customer" || act === "sign-company") {
      var j10 = currentJob();
      if (!j10 || !IC.ui.sigUrl) return;
      var printed = (IC.ui.printedName || (s && s.name) || "").trim();
      if (!printed) return;
      IC.signContract(j10.id, act === "sign-customer" ? "customer" : "company", {
        printedName: printed,
        title: act === "sign-company" ? (s.role === "admin" ? "Authorized agent" : "Project owner") : undefined,
        dataUrl: IC.ui.sigUrl,
      });
      IC.ui.sigUrl = "";
      IC.toast("Signature saved");
      return;
    }
    if (act === "remote-sign") {
      var route = IC.parseRoute();
      var printed2 = (IC.ui.printedName || "").trim();
      if (!printed2 || !IC.ui.sigUrl) return;
      IC.ui.signBusy = true;
      IC.render();
      IC.applyRemoteSignature(route.token, { printedName: printed2, dataUrl: IC.ui.sigUrl }).then(function (next) {
        IC.ui.signBusy = false;
        IC.ui.signDone = Boolean(next);
        IC.render();
      });
      return;
    }
    if (act === "job-for-customer") {
      var cust = IC.state.customers.find(function (c) { return c.id === t.getAttribute("data-id"); });
      if (!cust) return;
      var nj = IC.newJobFor(cust, s);
      IC.upsertJob(nj);
      IC.go("#/jobs/" + nj.id);
      return;
    }
    if (act === "mark-all") {
      if (s) IC.markAllRead(s.memberId);
      return;
    }
    if (act === "enable-push") {
      if (s) IC.registerPush(s.firebaseUid || s.memberId);
      IC.toast("Push requested");
      return;
    }
    if (act === "read-note") {
      IC.markNotificationRead(t.getAttribute("data-id"));
      return;
    }
    if (act === "sign-out") {
      IC.signOut().then(function () { IC.go("#/"); });
      return;
    }
    if (act === "add-crew") {
      IC.upsertCrew({ id: IC.uid(), name: "Crew " + (IC.state.crews.length + 1), foreman: "", phone: "", notes: "", active: true });
      return;
    }
    if (act === "clear-seed") {
      IC.clearSeedData();
      IC.toast("Sample records removed");
      return;
    }
  }

  function onChange(e) {
    var el = e.target;
    var act = el.getAttribute("data-act");
    if (act === "login-member") { IC.ui.loginMemberId = el.value; return; }
    if (act === "job-search") { IC.ui.jobSearch = el.value; IC.render(); return; }
    if (act === "job-filter") { IC.ui.jobStatus = el.value; IC.render(); return; }
    if (act === "customer-search") { IC.ui.customerSearch = el.value; IC.render(); return; }
    if (act === "new-job-customer") { IC.ui.newJobCustomerId = el.value; return; }
    if (act === "printed-name") { IC.ui.printedName = el.value; return; }
    if (act === "job-status") { IC.setStatus(el.getAttribute("data-id"), el.value); return; }
    if (act === "job-owner") { IC.assignOwner(el.getAttribute("data-id"), el.value || null); return; }
    if (act === "job-crew") {
      var job = jobFromEl(el);
      IC.assignCrew(el.getAttribute("data-id"), el.value || null, job ? job.scheduledDate : null);
      return;
    }
    if (act === "job-date") {
      var jobd = jobFromEl(el);
      IC.assignCrew(el.getAttribute("data-id"), jobd ? jobd.crewId : null, el.value || null);
      return;
    }
    if (act === "job-flag") {
      var jf = IC.state.jobs.find(function (j) { return j.id === el.getAttribute("data-id"); });
      if (!jf) return;
      var patch = {};
      patch[el.getAttribute("data-flag")] = el.checked;
      IC.upsertJob(Object.assign({}, jf, patch, { updatedAt: IC.nowIso() }));
      return;
    }
    if (act === "job-notes") {
      var jn = IC.state.jobs.find(function (j) { return j.id === el.getAttribute("data-id"); });
      if (!jn) return;
      IC.upsertJob(Object.assign({}, jn, { notes: el.value, updatedAt: IC.nowIso() }));
      return;
    }

    if (el.hasAttribute("data-draft")) {
      IC.ui.newJobDraft[el.getAttribute("data-draft")] = el.value;
      return;
    }
    if (el.hasAttribute("data-cdraft")) {
      IC.ui.newCustomerDraft[el.getAttribute("data-cdraft")] = el.value;
      return;
    }
    if (el.hasAttribute("data-cust")) {
      var c = IC.state.customers.find(function (x) { return x.id === el.getAttribute("data-id"); });
      if (!c) return;
      var nextC = Object.assign({}, c);
      nextC[el.getAttribute("data-cust")] = el.value;
      nextC.updatedAt = IC.nowIso();
      IC.upsertCustomer(nextC);
      return;
    }
    if (el.hasAttribute("data-set")) {
      var key = el.getAttribute("data-set");
      var val = el.getAttribute("data-num") ? Number(el.value) : el.value;
      var p = {};
      p[key] = val;
      IC.updateSettings(p);
      return;
    }
    if (el.hasAttribute("data-team")) {
      var field = el.getAttribute("data-team");
      var id = el.getAttribute("data-id");
      IC.updateTeam(IC.state.team.map(function (m) {
        if (m.id !== id) return m;
        var n = Object.assign({}, m);
        n[field] = field === "salesName" ? (el.value || null) : el.value;
        return n;
      }));
      return;
    }
    if (el.hasAttribute("data-crew")) {
      var crew = IC.state.crews.find(function (c) { return c.id === el.getAttribute("data-id"); });
      if (!crew) return;
      var nc = Object.assign({}, crew);
      nc[el.getAttribute("data-crew")] = el.value;
      IC.upsertCrew(nc);
      return;
    }

    var jobE = currentJob();
    if (!jobE || !el.hasAttribute("data-est")) return;
    var est = currentEstimate(jobE);
    var kind = el.getAttribute("data-est");
    if (kind === "struct") {
      var sid = el.getAttribute("data-sid");
      var k = el.getAttribute("data-key");
      var v = el.getAttribute("data-num") ? Number(el.value) : el.value;
      patchEstimate(jobE, {
        structures: est.structures.map(function (st) {
          if (st.id !== sid) return st;
          var n = Object.assign({}, st);
          n[k] = v;
          return n;
        }),
      });
    } else if (kind === "mat") {
      var cat = el.getAttribute("data-cat");
      var materials = est.materials.some(function (m) { return m.categoryId === cat; })
        ? est.materials.map(function (m) { return m.categoryId === cat ? Object.assign({}, m, { itemName: el.value }) : m; })
        : est.materials.concat([{ categoryId: cat, itemName: el.value }]);
      patchEstimate(jobE, { materials: materials });
    } else if (kind === "num") {
      var nk = el.getAttribute("data-key");
      var nv = el.value === "" && el.getAttribute("data-null") ? null : Number(el.value);
      var np = {};
      np[nk] = nv;
      patchEstimate(jobE, np);
    } else if (kind === "gutter-on") {
      patchEstimate(jobE, { gutters: Object.assign({}, est.gutters, { included: el.checked }) });
    } else if (kind === "gutter-desc") {
      patchEstimate(jobE, { gutters: Object.assign({}, est.gutters, { description: el.value }) });
    } else if (kind === "gutter-price") {
      patchEstimate(jobE, { gutters: Object.assign({}, est.gutters, { price: Number(el.value) }) });
    } else if (kind === "siding-on") {
      patchEstimate(jobE, { siding: Object.assign({}, est.siding, { included: el.checked }) });
    } else if (kind === "siding-desc") {
      patchEstimate(jobE, { siding: Object.assign({}, est.siding, { description: el.value }) });
    } else if (kind === "siding-price") {
      patchEstimate(jobE, { siding: Object.assign({}, est.siding, { price: Number(el.value) }) });
    } else if (kind === "notes") {
      patchEstimate(jobE, { notes: el.value });
    } else if (kind === "extra-label") {
      patchEstimate(jobE, { extras: est.extras.map(function (x) { return x.id === el.getAttribute("data-eid") ? Object.assign({}, x, { label: el.value }) : x; }) });
    } else if (kind === "extra-amt") {
      patchEstimate(jobE, { extras: est.extras.map(function (x) { return x.id === el.getAttribute("data-eid") ? Object.assign({}, x, { amount: Number(el.value) }) : x; }) });
    }
  }

  function onInput(e) {
    var el = e.target;
    if (el.name === "email") IC.ui.loginEmail = el.value;
    if (el.name === "password") IC.ui.loginPassword = el.value;
    var actIn = el.getAttribute("data-act");
    if (actIn === "job-search") { IC.ui.jobSearch = el.value; IC.render(); }
    if (actIn === "customer-search") { IC.ui.customerSearch = el.value; IC.render(); }
    if (actIn === "printed-name") IC.ui.printedName = el.value;
  }

  function onSubmit(e) {
    var form = e.target.closest("form");
    if (!form || form.getAttribute("data-act") !== "firebase-login") return;
    e.preventDefault();
    IC.ui.loginBusy = true;
    IC.ui.loginError = "";
    IC.ui.loginLocalMsg = "";
    IC.render();
    var email = form.email.value;
    var password = form.password.value;
    IC.signInFirebase(email, password).then(function () {
      IC.ui.loginBusy = false;
      IC.go("#/");
    }).catch(function (err) {
      var msg = err && err.message ? err.message : "Sign-in failed";
      IC.ui.loginBusy = false;
      IC.ui.loginError = msg;
      if (/unauthorized-domain|auth\/invalid|operation-not-allowed|network/i.test(msg)) {
        IC.ui.loginLocalMsg = "Firebase did not accept this domain yet. Add it under Authentication → Settings → Authorized domains, or work on this device below.";
      }
      IC.render();
    });
  }

  function liftPathToHash() {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    var m = path.match(/\/(jobs|customers|schedule|settings|notifications|login|sign)(\/[^/]+)?$/);
    if (m && !location.hash) {
      var keep = path.slice(0, path.length - m[0].length) || "/";
      if (keep.charAt(keep.length - 1) !== "/") keep += "/";
      location.replace(keep + "#/" + m[1] + (m[2] || ""));
    }
  }

  IC.start = function () {
    var script = document.querySelector('script[src*="js/app.js"]');
    if (script) {
      var src = script.getAttribute("src") || "";
      IC.baseUrl = src.replace(/js\/app\.js.*$/, "");
    } else {
      IC.baseUrl = "";
    }
    liftPathToHash();
    IC.loadLocal();
    IC.listenAuth();
    root = document.getElementById("app");
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("hashchange", function () {
      IC.ui.jobTab = "Overview";
      IC.ui.sigUrl = "";
      IC.ui.signDone = false;
      IC.ui.signRemote = null;
      IC.ui.signTried = false;
      if (IC.parseRoute().name === "job" && sessionStorage) {
        /* keep tab if same job? reset is simpler */
      }
      IC.render();
    });
    IC.subscribe(function () {
      if (!rendering) IC.render();
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
    IC.render();
  };

  document.addEventListener("DOMContentLoaded", IC.start);
})(window.IC);

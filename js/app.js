/* ============================================================
   IRONCLAD CRM — hash router + click/input handlers
   Routes live in the URL after #:  #/jobs  #/jobs/ID  #/sign/TOKEN
   Edit views.js for screens, css/app.css for look, config.js for team.
   ============================================================ */
window.IC = window.IC || {};

(function (IC) {
  var root;
  var rendering = false;
  var ignoreClicksUntil = 0;

  IC.parseRoute = function () {
    var hash = (location.hash || "#/").replace(/^#/, "");
    if (!hash.startsWith("/")) hash = "/" + hash;
    var q = hash.indexOf("?");
    if (q >= 0) hash = hash.slice(0, q);
    var parts = hash.split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "login") return { name: "login" };
    if (parts[0] === "jobs" && parts[1] && parts[2] === "customer-quote") return { name: "customer-quote", id: parts[1] };
    if (parts[0] === "jobs" && parts[1] && parts[2] === "job-sheet") return { name: "job-sheet", id: parts[1] };
    if (parts[0] === "jobs" && parts[1] && parts[2] === "job-cost") return { name: "job-cost", id: parts[1] };
    if (parts[0] === "jobs" && parts[1]) return { name: "job", id: parts[1] };
    if (parts[0] === "jobs") return { name: "jobs" };
    if (parts[0] === "customers" && parts[1]) return { name: "customer", id: parts[1] };
    if (parts[0] === "customers") return { name: "customers" };
    if (parts[0] === "schedule") return { name: "schedule" };
    if (parts[0] === "settings" && parts[1]) return { name: "settings", page: parts[1] };
    if (parts[0] === "settings") return { name: "settings" };
    if (parts[0] === "labor") return { name: "labor" };
    if (parts[0] === "materials") return { name: "materials" };
    if (parts[0] === "financing") return { name: "financing" };
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
    if (r.name === "job" || r.name === "customer-quote" || r.name === "job-sheet" || r.name === "job-cost") {
      return IC.state.jobs.find(function (j) { return j.id === r.id; }) || null;
    }
    return null;
  }

  function currentEstimate(job) {
    var settings = IC.state.settings;
    return IC.withComputed(job.estimate || IC.defaultEstimate(settings), settings, job);
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
        udraft: active.getAttribute("data-udraft"),
        mat: active.getAttribute("data-mat"),
        iid: active.getAttribute("data-iid"),
        fid: active.getAttribute("data-fid"),
        labor: active.getAttribute("data-labor"),
        pitch: active.getAttribute("data-pitch"),
        story: active.getAttribute("data-story"),
        layer: active.getAttribute("data-layer"),
        rateKind: active.getAttribute("data-labor-rate"),
        ratePart: active.getAttribute("data-rate-part"),
        rateName: active.getAttribute("data-rate-name"),
        ui: active.getAttribute("data-ui"),
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
      if (!IC.isApproved(IC.state.session) && IC.isBootstrapAdmin(IC.state.session.email)) {
        IC.saveUser(IC.promoteIfBootstrap({
          id: IC.state.session.memberId,
          name: IC.state.session.name,
          email: IC.state.session.email,
          role: IC.state.session.role,
          title: IC.state.session.title,
          salesName: IC.state.session.salesName,
          status: IC.state.session.status,
          firebaseUid: IC.state.session.firebaseUid,
        }));
      }
      if (!IC.isApproved(IC.state.session)) {
        html = IC.viewWaiting();
      } else {
      var inner = "";
      if (route.name === "jobs") inner = IC.viewJobs();
      else if (route.name === "job") inner = IC.viewJob(route.id);
      else if (route.name === "customer-quote" || route.name === "job-sheet" || route.name === "job-cost") {
        var docJob = IC.state.jobs.find(function (j) { return j.id === route.id; });
        inner = docJob ? IC.viewDocPage(docJob, route.name) : '<div class="page"><p>Job not found.</p></div>';
      }
      else if (route.name === "customers") inner = IC.viewCustomers();
      else if (route.name === "customer") inner = IC.viewCustomer(route.id);
      else if (route.name === "schedule") inner = IC.viewSchedule();
      else if (route.name === "settings") inner = IC.viewSettings(route.page);
      else if (route.name === "labor") inner = IC.viewLabor();
      else if (route.name === "materials") inner = IC.viewMaterials();
      else if (route.name === "financing") inner = IC.viewFinancing();
      else if (route.name === "notifications") inner = IC.viewNotifications();
      else inner = IC.viewHome();
      html = IC.viewShell(inner, route);
      }
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
          same("data-udraft", restore.udraft) && same("data-mat", restore.mat) &&
          same("data-iid", restore.iid) && same("data-fid", restore.fid) && same("data-ui", restore.ui) &&
          same("data-labor", restore.labor) && same("data-pitch", restore.pitch) &&
          same("data-story", restore.story) && same("data-layer", restore.layer) &&
          same("data-labor-rate", restore.rateKind) && same("data-rate-part", restore.ratePart) &&
          same("data-rate-name", restore.rateName) &&
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
    if (Date.now() < ignoreClicksUntil) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var t = e.target.closest("[data-act]");
    if (!t) return;
    if (t.getAttribute("data-act") === "close-modal" && e.target.closest("[data-stop]") && e.target !== t) return;
    var act = t.getAttribute("data-act");
    var s = IC.state.session;

    if (act === "offline-login") {
      if (IC.continueOffline()) IC.go("#/");
      else IC.toast("Sign in once on this iPad while online first");
      return;
    }
    if (act === "auth-panel") {
      IC.ui.authPanel = t.getAttribute("data-panel") || "signin";
      IC.ui.loginError = "";
      IC.ui.loginInfo = "";
      IC.render();
      return;
    }
    if (act === "grant-user") {
      IC.grantUser(t.getAttribute("data-id"), { role: t.getAttribute("data-role") });
      return;
    }
    if (act === "deny-user") {
      IC.grantUser(t.getAttribute("data-id"), { status: "disabled", role: "pending" });
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
      IC.ui.addUserOpen = false;
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
      IC.notifyNewJob(job);
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
      var nextTab = t.getAttribute("data-tab");
      if (nextTab === "Estimate") nextTab = "Assessment";
      if (nextTab === "Quote") nextTab = "Summary";
      IC.ui.jobTab = nextTab;
      IC.ui.sigUrl = "";
      IC.render();
      return;
    }
    if (act === "job-calendar") {
      var calJob = IC.state.jobs.find(function (j) { return j.id === t.getAttribute("data-id"); }) || currentJob();
      if (!calJob) return;
      var calCust = IC.state.customers.find(function (c) { return c.id === calJob.customerId; });
      IC.addJobToCalendar(calJob, calCust);
      return;
    }
    if (act === "job-navigate") {
      var navJob = IC.state.jobs.find(function (j) { return j.id === t.getAttribute("data-id"); }) || currentJob();
      var navCust = navJob && IC.state.customers.find(function (c) { return c.id === navJob.customerId; });
      var maps = IC.mapsUrl(navCust);
      if (!maps) { IC.toast("Add a street address on the customer first"); return; }
      window.open(maps, "_blank", "noopener");
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
    if (act === "est-add-facet") {
      var jf = currentJob();
      if (!jf) return;
      var estF = currentEstimate(jf);
      var sidF = t.getAttribute("data-sid");
      patchEstimate(jf, {
        structures: estF.structures.map(function (st) {
          if (st.id !== sidF) return st;
          var facets = IC.structureFacets(st);
          var last = facets[facets.length - 1] || {};
          return Object.assign({}, st, { facets: facets.concat([IC.emptyFacet("Facet " + (facets.length + 1), { squares: 0, pitch: last.pitch || st.pitch, tearoff: last.tearoff || st.tearoff, level: last.level || st.level })]) });
        }),
      });
      return;
    }
    if (act === "est-add-deck") {
      var jDeck = currentJob();
      if (!jDeck) return;
      var estDeck = currentEstimate(jDeck);
      var deckSid = t.getAttribute("data-sid");
      var deckKind = t.getAttribute("data-kind") === "wood" ? "wood" : "sheathing";
      var deckKey = deckKind === "wood" ? "woodRows" : "sheathingRows";
      var deckCat = deckKind === "wood" ? "woodBoard" : "sheathing";
      var deckItems = IC.catalogActiveItems(deckCat);
      var deckName = deckItems.length ? deckItems[0].name : "";
      patchEstimate(jDeck, {
        structures: estDeck.structures.map(function (st) {
          if (st.id !== deckSid) return st;
          var rows = (st[deckKey] || []).concat([{ id: IC.uid(), itemName: deckName, qty: 0 }]);
          var n = Object.assign({}, st);
          n[deckKey] = rows;
          return n;
        }),
      });
      return;
    }
    if (act === "est-del-deck") {
      var jDrop = currentJob();
      if (!jDrop) return;
      var estDrop = currentEstimate(jDrop);
      var dropSid = t.getAttribute("data-sid");
      var dropKind = t.getAttribute("data-kind") === "wood" ? "wood" : "sheathing";
      var dropKey = dropKind === "wood" ? "woodRows" : "sheathingRows";
      var dropId = t.getAttribute("data-rid");
      patchEstimate(jDrop, {
        structures: estDrop.structures.map(function (st) {
          if (st.id !== dropSid) return st;
          var n = Object.assign({}, st);
          n[dropKey] = (st[dropKey] || []).filter(function (r) { return r.id !== dropId; });
          return n;
        }),
      });
      return;
    }
    if (act === "finance-add") {
      if (!IC.isAdmin(IC.state.session)) return;
      var fname = String(IC.ui.financeAddName || "").trim();
      var fpct = Number(IC.ui.financeAddPct);
      if (!fname) { IC.toast("Name the plan"); return; }
      if (!Number.isFinite(fpct) || fpct < 0) { IC.toast("Enter the fee percent"); return; }
      var nextPlans = IC.financingPlans().concat([{ id: IC.uid(), name: fname, feePercent: fpct, active: true }]);
      IC.ui.financeAddName = "";
      IC.ui.financeAddPct = "";
      IC.updateSettings({ financingPlans: nextPlans });
      IC.toast("Plan added");
      return;
    }
    if (act === "finance-remove") {
      if (!IC.isAdmin(IC.state.session)) return;
      var dropPlan = t.getAttribute("data-id");
      IC.updateSettings({ financingPlans: IC.financingPlans().filter(function (p) { return p.id !== dropPlan; }) });
      return;
    }
    if (act === "est-del-facet") {
      var jd = currentJob();
      if (!jd) return;
      var estD = currentEstimate(jd);
      var sidD = t.getAttribute("data-sid");
      var fidD = t.getAttribute("data-fid");
      patchEstimate(jd, {
        structures: estD.structures.map(function (st) {
          if (st.id !== sidD) return st;
          var facets = IC.structureFacets(st).filter(function (f) { return f.id !== fidD; });
          if (!facets.length) return st;
          return Object.assign({}, st, { facets: facets });
        }),
      });
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
    if (act === "share-quote" || act === "share-customer-quote" || act === "share-job-sheet" || act === "share-job-cost") {
      var shareMap = {
        "share-quote": { id: "quote-sheet", prefix: "Ironclad-Quote-", title: "Ironclad quote #" },
        "share-customer-quote": { id: "customer-quote-sheet", prefix: "Ironclad-Customer-Quote-", title: "Customer quote #" },
        "share-job-sheet": { id: "job-sheet-sheet", prefix: "Ironclad-Job-Sheet-", title: "Job sheet #" },
        "share-job-cost": { id: "job-cost-sheet", prefix: "Ironclad-Job-Cost-", title: "Job cost #" },
      };
      var spec = shareMap[act];
      var sheet = document.getElementById(spec.id);
      var jShare = currentJob();
      if (!sheet || !jShare) return;
      IC.htmlToPdf(sheet, spec.prefix + jShare.number + ".pdf").then(function (out) {
        return IC.shareOrDownload({ filename: out.filename, title: spec.title + jShare.number, text: jShare.customerName, blob: out.blob });
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
      if (s) IC.markAllRead(s);
      return;
    }
    if (act === "delete-note") {
      IC.deleteNotification(t.getAttribute("data-id"));
      IC.toast("Alert removed");
      return;
    }
    if (act === "clear-inbox") {
      e.preventDefault();
      e.stopPropagation();
      if (!s) return;
      if (!confirm("Remove all alerts from your inbox?")) return;
      var n = IC.clearMyNotifications(s);
      IC.toast(n ? "Inbox cleared" : "Inbox is already empty");
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
    if (act === "invite-app") {
      var inviteUrl = IC.appJoinUrl();
      var inviteText = "Join Ironclad Roofing on IRONCLAD. Install the app and create an account — Nate or Matt will turn on your access.";
      if (navigator.share) {
        navigator.share({ title: "IRONCLAD", text: inviteText, url: inviteUrl }).catch(function (err) {
          if (err && err.name === "AbortError") return;
          IC.copyText(inviteUrl).then(function (ok) {
            IC.toast(ok ? "Link copied" : "Couldn’t open the share sheet");
          });
        });
        return;
      }
      IC.copyText(inviteUrl).then(function (ok) {
        IC.toast(ok ? "Link copied — paste it in a text" : "Couldn’t copy the link");
      });
      return;
    }
    if (act === "copy-invite") {
      IC.copyText(IC.appJoinUrl()).then(function (ok) {
        IC.toast(ok ? "Invite link copied" : "Couldn’t copy the link");
      });
      return;
    }
    if (act === "sign-out") {
      IC.signOut().then(function () { IC.go("#/"); });
      return;
    }
    if (act === "refresh-access") {
      var user = IC.getAuth() && IC.getAuth().currentUser;
      if (!user) {
        IC.toast("Sign in again");
        IC.go("#/login");
        return;
      }
      IC.applyAuthUser(user).then(function (member) {
        if (IC.isApproved(member)) {
          IC.toast("You’re in");
          IC.go("#/");
        } else {
          IC.toast("Still waiting on Nate or Matt");
          IC.render();
        }
      }).catch(function () {
        IC.toast("Couldn’t check access. Try again in a moment.");
      });
      return;
    }
    if (act === "add-crew") {
      if (!IC.isAdmin(s) && !IC.can(s, "labor", "write")) return;
      var crew = IC.normalizeCrew({ id: IC.uid(), name: "Crew " + (IC.state.crews.length + 1), foreman: "", phone: "", notes: "", active: true });
      IC.upsertCrew(crew);
      IC.ui.laborCrew = crew.id;
      return;
    }
    if (act === "labor-crew") {
      IC.ui.laborCrew = t.getAttribute("data-id");
      IC.render();
      return;
    }
    if (act === "add-teammate") {
      IC.ui.addUserOpen = true;
      IC.ui.addUserDraft = { name: "", role: "sales", title: "Sales", salesName: "", email: "", commissionPercent: 0 };
      IC.render();
      return;
    }
    if (act === "save-teammate") {
      var draft = IC.ui.addUserDraft || {};
      if (!String(draft.name || "").trim()) {
        IC.toast("Enter a name");
        return;
      }
      IC.addTeammate(draft);
      IC.ui.addUserOpen = false;
      IC.ui.addUserDraft = null;
      IC.toast("User added");
      return;
    }
    if (act === "remove-teammate") {
      var rid = t.getAttribute("data-id");
      var who = IC.state.team.find(function (m) { return m.id === rid; });
      if (who && confirm("Remove " + who.name + " from the team?")) {
        IC.removeTeammate(rid);
      }
      return;
    }
    if (act === "set-theme") {
      IC.applyTheme(t.getAttribute("data-theme"));
      IC.render();
      return;
    }
    if (act === "clear-date") {
      e.preventDefault();
      var jd = IC.state.jobs.find(function (j) { return j.id === t.getAttribute("data-id"); });
      if (jd) IC.setProductionDate(jd.id, null);
      return;
    }
    if (act === "open-date") {
      var wrap = t.closest(".date-row");
      var inp = wrap && wrap.querySelector('input[type="date"]');
      if (inp) {
        try {
          if (typeof inp.showPicker === "function") inp.showPicker();
          else inp.focus();
        } catch (err) {
          inp.focus();
        }
      }
      return;
    }
    if (act === "clear-seed") {
      IC.clearSeedData();
      IC.toast("Sample records removed for the company");
      return;
    }
    if (act === "catalog-cat") {
      IC.ui.catalogCat = t.getAttribute("data-id");
      IC.ui.catalogAddName = "";
      IC.ui.catalogAddSku = "";
      IC.ui.catalogAddPrice = "";
      IC.ui.catalogBump = "";
      IC.render();
      return;
    }
    if (act === "catalog-add") {
      var addWrap = t.closest(".mat-add");
      if (addWrap) {
        var n = addWrap.querySelector('[data-ui="catalogAddName"]');
        var sku = addWrap.querySelector('[data-ui="catalogAddSku"]');
        var pr = addWrap.querySelector('[data-ui="catalogAddPrice"]');
        if (n) IC.ui.catalogAddName = n.value;
        if (sku) IC.ui.catalogAddSku = sku.value;
        if (pr) IC.ui.catalogAddPrice = pr.value;
      }
      var added = IC.addCatalogItem(IC.ui.catalogCat || "shingle", {
        name: IC.ui.catalogAddName,
        sku: IC.ui.catalogAddSku,
        price: IC.ui.catalogAddPrice,
        alsoHip: IC.ui.catalogAddHip !== false,
      });
      if (added) {
        IC.ui.catalogAddName = "";
        IC.ui.catalogAddSku = "";
        IC.ui.catalogAddPrice = "";
        IC.toast("Added " + added.name);
      }
      return;
    }
    if (act === "catalog-retire") {
      var rname = (function () {
        var c = IC.catalogCategory(t.getAttribute("data-cat"));
        var it = c && c.items.find(function (x) { return x.id === t.getAttribute("data-iid"); });
        return it ? it.name : "this item";
      })();
      if (confirm("Retire " + rname + "? It won’t show on new estimates. Existing jobs keep it.")) {
        IC.setCatalogItemActive(t.getAttribute("data-cat"), t.getAttribute("data-iid"), false);
      }
      return;
    }
    if (act === "catalog-restore") {
      IC.setCatalogItemActive(t.getAttribute("data-cat"), t.getAttribute("data-iid"), true);
      IC.toast("Restored");
      return;
    }
    if (act === "catalog-remove") {
      var dname = (function () {
        var c = IC.catalogCategory(t.getAttribute("data-cat"));
        var it = c && c.items.find(function (x) { return x.id === t.getAttribute("data-iid"); });
        return it ? it.name : "this item";
      })();
      if (confirm("Permanently remove " + dname + " from the catalog?")) {
        IC.removeCatalogItem(t.getAttribute("data-cat"), t.getAttribute("data-iid"));
      }
      return;
    }
    if (act === "catalog-bump") {
      var wrap = t.closest(".mat-bump");
      var inp = wrap && wrap.querySelector('[data-ui="catalogBump"]');
      var pct = inp && inp.value !== "" ? inp.value : IC.ui.catalogBump;
      IC.bumpCatalogPrices(IC.ui.catalogCat || "shingle", pct);
      return;
    }
  }

  function onChange(e) {
    var el = e.target;
    if (!el || !document.body.contains(el)) return;
    var act = el.getAttribute("data-act");
    if (act === "login-member") { IC.ui.loginMemberId = el.value; return; }
    if (act === "job-search") { IC.ui.jobSearch = el.value; IC.render(); return; }
    if (act === "job-filter") { IC.ui.jobStatus = el.value; IC.render(); return; }
    if (act === "customer-search") { IC.ui.customerSearch = el.value; IC.render(); return; }
    if (act === "new-job-customer") { IC.ui.newJobCustomerId = el.value; return; }
    if (act === "printed-name") { IC.ui.printedName = el.value; return; }
    if (act === "keep-signed-in") { IC.ui.keepSignedIn = el.checked; return; }
    if (act === "notify-pref") {
      IC.setNotifyPref(el.getAttribute("data-pref"), el.checked);
      return;
    }
    if (act === "link-seat") {
      var to = el.value;
      if (to) IC.grantUser(el.getAttribute("data-id"), { role: "sales", linkTo: to });
      return;
    }
    if (act === "perm") {
      IC.updatePermissions(el.getAttribute("data-role"), el.getAttribute("data-resource"), el.getAttribute("data-perm"), el.checked);
      return;
    }
    if (act === "catalog-show-off") { IC.ui.catalogShowOff = el.checked; IC.render(); return; }
    if (el.hasAttribute("data-labor")) {
      if (!IC.can(IC.state.session, "labor", "write")) return;
      var laborCrew = IC.state.crews.find(function (c) { return c.id === el.getAttribute("data-id"); });
      if (!laborCrew) return;
      var rates = Object.assign({}, IC.normalizeCrew(laborCrew).labor);
      var laborKey = el.getAttribute("data-labor");
      var rateNum = el.value === "" ? 0 : Number(el.value);
      if (!Number.isFinite(rateNum)) rateNum = 0;
      if (laborKey === "pitchAdd" || laborKey === "storyAdd" || laborKey === "layerAdd") {
        var mapName = laborKey === "pitchAdd" ? el.getAttribute("data-pitch") : laborKey === "storyAdd" ? el.getAttribute("data-story") : el.getAttribute("data-layer");
        rates[laborKey] = Object.assign({}, rates[laborKey] || {});
        rates[laborKey][mapName] = rateNum;
      } else {
        rates[laborKey] = rateNum;
      }
      IC.upsertCrew(Object.assign({}, IC.normalizeCrew(laborCrew), { labor: rates }));
      return;
    }
    if (act === "catalog-add-hip") { IC.ui.catalogAddHip = el.checked; return; }
    if (act === "job-status") { IC.setStatus(el.getAttribute("data-id"), el.value); return; }
    if (act === "job-owner") { IC.assignOwner(el.getAttribute("data-id"), el.value || null); return; }
    if (act === "job-crew") {
      var job = jobFromEl(el);
      IC.assignCrew(el.getAttribute("data-id"), el.value || null, job ? job.scheduledDate : null);
      return;
    }
    if (act === "job-date") {
      var jobd = jobFromEl(el);
      if (!jobd) return;
      var date = IC.validIsoDate(el.value);
      if (date) IC.assignCrew(jobd.id, jobd.crewId || null, date);
      else IC.setProductionDate(jobd.id, null);
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
    if (el.hasAttribute("data-ui")) {
      IC.ui[el.getAttribute("data-ui")] = el.value;
      return;
    }
    if (el.hasAttribute("data-mat")) {
      var mf = el.getAttribute("data-mat");
      var mp = {};
      mp[mf] = el.value;
      IC.updateCatalogItem(el.getAttribute("data-cat"), el.getAttribute("data-iid"), mp);
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
      if (!IC.isAdmin(IC.state.session)) return;
      var key = el.getAttribute("data-set");
      var val = el.getAttribute("data-num") ? Number(el.value) : el.value;
      var p = {};
      p[key] = val;
      IC.updateSettings(p);
      return;
    }
    if (el.hasAttribute("data-labor-rate")) {
      if (!IC.isAdmin(IC.state.session)) return;
      var ratePart = el.getAttribute("data-rate-part");
      var rateName = el.getAttribute("data-rate-name");
      var rateTable = IC.normalizeLaborRates(IC.state.settings && IC.state.settings.laborRates);
      var rateNum = el.value === "" ? 0 : Number(el.value);
      if (!Number.isFinite(rateNum)) rateNum = 0;
      if (ratePart === "base" || ratePart === "flatRate") rateTable[ratePart] = rateNum;
      else if (rateTable[ratePart]) {
        rateTable[ratePart] = Object.assign({}, rateTable[ratePart]);
        rateTable[ratePart][rateName] = rateNum;
      }
      IC.updateSettings({ laborRates: rateTable });
      return;
    }
    if (el.hasAttribute("data-team")) {
      if (!IC.canManageTeam(IC.state.session)) return;
      var field = el.getAttribute("data-team");
      var id = el.getAttribute("data-id");
      if (field === "role" && el.value !== "admin") {
        var otherAdmins = IC.state.team.filter(function (m) { return m.id !== id && m.role === "admin"; });
        if (!otherAdmins.length) {
          IC.toast("Keep at least one admin");
          IC.render();
          return;
        }
      }
      IC.updateTeam(IC.state.team.map(function (m) {
        if (m.id !== id) return m;
        var n = Object.assign({}, m);
        if (field === "salesName") n.salesName = el.value.trim() || null;
        else if (field === "commissionPercent") n.commissionPercent = el.value === "" ? 0 : Number(el.value);
        else n[field] = el.value;
        if (field === "name" && n.role === "sales" && (!m.salesName || m.salesName === m.name)) {
          n.salesName = el.value.trim() || null;
        }
        if (field === "role" && el.value === "sales" && !n.salesName) {
          n.salesName = n.name || null;
        }
        if (field === "role" && el.value === "admin" && (!n.title || n.title === "Sales" || n.title === "Manager")) {
          n.title = n.title && n.title !== "Sales" && n.title !== "Manager" ? n.title : "Admin";
        }
        if (field === "role" && el.value === "manager" && (!n.title || n.title === "Sales" || n.title === "Admin")) {
          n.title = "Manager";
        }
        if (field === "role" && el.value === "sales" && (!n.title || n.title === "Admin" || n.title === "Manager")) {
          n.title = "Sales";
        }
        if (field === "role" && (el.value === "admin" || el.value === "manager" || el.value === "sales")) {
          n.status = "active";
          n.active = true;
          n.role = el.value;
        }
        return n;
      }));
      return;
    }
    if (el.hasAttribute("data-udraft")) {
      var uk = el.getAttribute("data-udraft");
      IC.ui.addUserDraft = IC.ui.addUserDraft || { name: "", role: "sales", title: "Sales", salesName: "", email: "" };
      IC.ui.addUserDraft[uk] = el.value;
      if (uk === "role") {
        var title = IC.ui.addUserDraft.title;
        if (el.value === "admin" && (!title || title === "Sales" || title === "Manager")) IC.ui.addUserDraft.title = "Admin";
        if (el.value === "manager" && (!title || title === "Sales" || title === "Admin")) IC.ui.addUserDraft.title = "Manager";
        if (el.value === "sales" && (!title || title === "Admin" || title === "Manager")) IC.ui.addUserDraft.title = "Sales";
        IC.render();
      }
      if (uk === "name" && IC.ui.addUserDraft.role === "sales" && !IC.ui.addUserDraft.salesName) {
        IC.ui.addUserDraft.salesName = el.value;
      }
      return;
    }
    if (el.hasAttribute("data-crew")) {
      var crew = IC.state.crews.find(function (c) { return c.id === el.getAttribute("data-id"); });
      if (!crew) return;
      if (!IC.isAdmin(IC.state.session) && !IC.can(IC.state.session, "labor", "write")) return;
      var nc = Object.assign({}, crew);
      nc[el.getAttribute("data-crew")] = el.value;
      IC.upsertCrew(nc);
      return;
    }

    if (el.hasAttribute("data-fin")) {
      if (!IC.isAdmin(IC.state.session)) return;
      var finId = el.getAttribute("data-id");
      var finField = el.getAttribute("data-fin");
      var finPlans = IC.financingPlans().map(function (p) {
        if (p.id !== finId) return p;
        var np = Object.assign({}, p);
        if (finField === "name") np.name = el.value;
        else np.feePercent = Number(el.value) || 0;
        return np;
      });
      IC.updateSettings({ financingPlans: finPlans });
      return;
    }
    var jobE = currentJob();
    if (!jobE || !el.hasAttribute("data-est")) return;
    var est = currentEstimate(jobE);
    var kind = el.getAttribute("data-est");
    if (kind === "struct") {
      var sid = el.getAttribute("data-sid");
      var k = el.getAttribute("data-key");
      var v;
      if (el.getAttribute("data-null") && el.value === "") v = null;
      else if (el.getAttribute("data-num")) v = Number(el.value);
      else v = el.value;
      patchEstimate(jobE, {
        structures: est.structures.map(function (st) {
          if (st.id !== sid) return st;
          var n = Object.assign({}, st);
          n[k] = v;
          return n;
        }),
      });
    } else if (kind === "facet") {
      var fsid = el.getAttribute("data-sid");
      var fid = el.getAttribute("data-fid");
      var fk = el.getAttribute("data-key");
      var fv = el.getAttribute("data-num") ? Number(el.value) : el.value;
      patchEstimate(jobE, {
        structures: est.structures.map(function (st) {
          if (st.id !== fsid) return st;
          var facets = IC.structureFacets(st).map(function (f) {
            if (f.id !== fid) return f;
            var nf = Object.assign({}, f);
            nf[fk] = fv;
            return nf;
          });
          return Object.assign({}, st, { facets: facets });
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
      if (nk === "quotedTotal" && nv != null && est.computed && est.computed.preFinance != null) {
        if (Math.abs(nv - est.computed.preFinance) < 0.005) nv = null;
      }
      var np = {};
      np[nk] = nv;
      patchEstimate(jobE, np);
    } else if (kind === "gutter-on") {
      var gOn = IC.normalizeAddon("gutters", est.gutters);
      gOn.included = el.checked;
      patchEstimate(jobE, { gutters: gOn });
    } else if (kind === "gutter-desc") {
      patchEstimate(jobE, { gutters: Object.assign({}, IC.normalizeAddon("gutters", est.gutters), { description: el.value, included: true }) });
    } else if (kind === "gutter-price") {
      patchEstimate(jobE, { gutters: Object.assign({}, IC.normalizeAddon("gutters", est.gutters), { price: Number(el.value), included: true }) });
    } else if (kind === "siding-on") {
      var sOn = IC.normalizeAddon("siding", est.siding);
      sOn.included = el.checked;
      patchEstimate(jobE, { siding: sOn });
    } else if (kind === "siding-desc") {
      patchEstimate(jobE, { siding: Object.assign({}, IC.normalizeAddon("siding", est.siding), { description: el.value, included: true }) });
    } else if (kind === "siding-price") {
      patchEstimate(jobE, { siding: Object.assign({}, IC.normalizeAddon("siding", est.siding), { price: Number(el.value), included: true }) });
    } else if (kind === "warranty-ours") {
      patchEstimate(jobE, { includeOurWarranty: el.checked });
    } else if (kind === "warranty-mfg") {
      patchEstimate(jobE, { includeMfgWarranty: el.checked });
    } else if (kind === "finance-on") {
      var finOn = IC.normalizeFinancing(est.financing);
      finOn.included = el.checked;
      if (finOn.included && !finOn.planId) {
        var firstPlan = IC.activeFinancingPlans()[0];
        if (firstPlan) finOn.planId = firstPlan.id;
      }
      patchEstimate(jobE, { financing: finOn });
    } else if (kind === "finance-plan") {
      var finPick = IC.normalizeFinancing(est.financing);
      finPick.included = true;
      finPick.planId = el.value;
      patchEstimate(jobE, { financing: finPick });
    } else if (kind === "deck-item" || kind === "deck-qty") {
      var deckSid = el.getAttribute("data-sid");
      var deckKind = el.getAttribute("data-kind") === "wood" ? "wood" : "sheathing";
      var deckKey = deckKind === "wood" ? "woodRows" : "sheathingRows";
      var deckRid = el.getAttribute("data-rid");
      patchEstimate(jobE, {
        structures: est.structures.map(function (st) {
          if (st.id !== deckSid) return st;
          var rows = (st[deckKey] || []).map(function (r) {
            if (r.id !== deckRid) return r;
            var nr = Object.assign({}, r);
            if (kind === "deck-item") nr.itemName = el.value;
            else nr.qty = Number(el.value) || 0;
            return nr;
          });
          var ns = Object.assign({}, st);
          ns[deckKey] = rows;
          return ns;
        }),
      });
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
    if (el.name === "password2") IC.ui.loginPassword2 = el.value;
    if (el.name === "displayName") IC.ui.loginName = el.value;
    var actIn = el.getAttribute("data-act");
    if (actIn === "job-search") { IC.ui.jobSearch = el.value; IC.render(); }
    if (actIn === "customer-search") { IC.ui.customerSearch = el.value; IC.render(); }
    if (actIn === "printed-name") IC.ui.printedName = el.value;
    if (el.hasAttribute("data-ui")) {
      IC.ui[el.getAttribute("data-ui")] = el.value;
    }
    if (el.hasAttribute("data-udraft")) {
      IC.ui.addUserDraft = IC.ui.addUserDraft || { name: "", role: "sales", title: "Sales", salesName: "", email: "" };
      IC.ui.addUserDraft[el.getAttribute("data-udraft")] = el.value;
    }
  }

  function finishAuthOk() {
    IC.ui.loginBusy = false;
    IC.ui.loginError = "";
    IC.go("#/");
  }

  function finishAuthErr(err) {
    IC.ui.loginBusy = false;
    IC.ui.loginError = IC.authFriendly(err);
    var blob = String((err && err.code) || "") + " " + String((err && err.message) || "");
    if (/unauthorized-domain/i.test(blob)) {
      var member = IC.matchMember(IC.ui.loginEmail);
      if (member && IC.isApproved(member)) {
        IC.ui.loginInfo = "";
        IC.enterLocal(Object.assign({}, member, { email: IC.ui.loginEmail }));
        IC.toast("This site isn’t on the allow-list yet. Working as " + member.name + " on this iPad.");
        IC.go("#/");
        return;
      }
    }
    IC.render();
  }

  function onSubmit(e) {
    var form = e.target.closest("form");
    if (!form) return;
    var act = form.getAttribute("data-act");
    if (act !== "auth-signin" && act !== "auth-signup" && act !== "auth-forgot" && act !== "firebase-login") return;
    e.preventDefault();
    IC.ui.loginBusy = true;
    IC.ui.loginError = "";
    IC.ui.loginInfo = "";
    IC.render();
    var email = (form.email && form.email.value || IC.ui.loginEmail || "").trim();
    var password = form.password ? form.password.value : IC.ui.loginPassword;
    if (act === "auth-forgot") {
      IC.sendPasswordReset(email).then(function () {
        IC.ui.loginBusy = false;
        IC.ui.loginInfo = "Check your email for a reset link.";
        IC.render();
      }).catch(finishAuthErr);
      return;
    }
    if (act === "auth-signup") {
      var name = (form.displayName && form.displayName.value || IC.ui.loginName || "").trim();
      var p2 = form.password2 ? form.password2.value : IC.ui.loginPassword2;
      if (password !== p2) {
        IC.ui.loginBusy = false;
        IC.ui.loginError = "Passwords don’t match.";
        IC.render();
        return;
      }
      if (!name) {
        IC.ui.loginBusy = false;
        IC.ui.loginError = "Add your name so Nate and Matt know who you are.";
        IC.render();
        return;
      }
      IC.createAccount(name, email, password).then(function () {
        IC.ui.loginBusy = false;
        finishAuthOk();
      }).catch(finishAuthErr);
      return;
    }
    IC.signInFirebase(email, password).then(function () {
      IC.ui.loginBusy = false;
      finishAuthOk();
    }).catch(finishAuthErr);
  }

  function liftPathToHash() {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    var m = path.match(/\/(jobs|customers|schedule|settings|labor|materials|financing|notifications|login|sign)(\/[^/]+)?$/);
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
    if (window.__IRONCLAD_PREVIEW__ && (!IC.state.session || IC.state.session.mode === "preview")) {
      IC.state.session = {
        memberId: "preview",
        name: "Preview",
        email: "preview@ironclad.local",
        role: "admin",
        title: "Admin",
        status: "active",
        mode: "preview",
      };
      if (!location.hash || location.hash === "#" || location.hash === "#/") location.hash = "#/labor";
    }
    IC.applyTheme(IC.getThemePref());
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onScheme = function () {
        if (IC.getThemePref() === "system") IC.applyTheme("system");
      };
      if (mq.addEventListener) mq.addEventListener("change", onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    }
    IC.listenAuth();
    IC.ui.online = typeof navigator === "undefined" ? true : navigator.onLine;
    window.addEventListener("online", function () {
      IC.ui.online = true;
      if (IC.state.session) IC.state.session = Object.assign({}, IC.state.session, { mode: "online" });
      var user = IC.getAuth() && IC.getAuth().currentUser;
      if (user && IC.isApproved(IC.state.session)) {
        IC.pullCloud().then(function () { IC.subscribeCloud(); });
      }
      IC.render();
    });
    window.addEventListener("offline", function () {
      IC.ui.online = false;
      if (IC.state.session) IC.state.session = Object.assign({}, IC.state.session, { mode: "offline" });
      IC.render();
    });
    root = document.getElementById("app");
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);
    document.addEventListener("submit", onSubmit);
    document.addEventListener("pointerdown", function (e) {
      var t = e.target.closest('[data-act="clear-date"]');
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      ignoreClicksUntil = Date.now() + 500;
      var jd = IC.state.jobs.find(function (j) { return j.id === t.getAttribute("data-id"); });
      if (jd) IC.setProductionDate(jd.id, null);
    }, true);
    window.addEventListener("hashchange", function () {
      var route = IC.parseRoute();
      var prev = IC.ui.lastRoute || {};
      var sameJob = prev.id && route.id && prev.id === route.id;
      var jobish = { job: 1, "customer-quote": 1, "job-sheet": 1, "job-cost": 1 };
      if (!(sameJob && jobish[prev.name] && jobish[route.name])) {
        IC.ui.jobTab = "Overview";
      } else if (route.name === "job" && prev.name !== "job") {
        IC.ui.jobTab = "Summary";
      }
      IC.ui.lastRoute = { name: route.name, id: route.id };
      IC.ui.sigUrl = "";
      IC.ui.signDone = false;
      IC.ui.signRemote = null;
      IC.ui.signTried = false;
      IC.render();
    });
    IC.subscribe(function () {
      if (!rendering) IC.render();
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
      navigator.serviceWorker.addEventListener("message", function (e) {
        var data = e.data || {};
        if (data.type === "ironclad-open" && data.url) {
          var hash = String(data.url).replace(/^.*#/, "#");
          if (hash.charAt(0) === "#") IC.go(hash);
        }
      });
    }
    IC.render();
    IC.hideSplash();
  };

  var splashShownAt = window.__icSplashAt || Date.now();
  function splashPinned() {
    return location.hash === "#/splash" || /(?:^|[?&])splash=1(?:&|$)/.test(location.search);
  }
  IC.hideSplash = function (force) {
    var el = document.getElementById("ic-splash");
    if (!el || el.getAttribute("data-done") === "1") return;
    if (!force && splashPinned()) return;
    var run = function () {
      if (el.getAttribute("data-done") === "1") return;
      el.setAttribute("data-done", "1");
      el.classList.add("is-leaving");
      el.setAttribute("aria-hidden", "true");
      setTimeout(function () {
        el.classList.add("is-done");
        IC.applyTheme(IC.getThemePref());
      }, 400);
    };
    var wait = force ? 0 : Math.max(0, 1800 - (Date.now() - splashShownAt));
    setTimeout(run, wait);
  };
  setTimeout(function () { if (!splashPinned()) IC.hideSplash(true); }, 4500);
  document.addEventListener("click", function (e) {
    var el = document.getElementById("ic-splash");
    if (!el || el.getAttribute("data-done") === "1") return;
    if (el.contains(e.target) || e.target === el) IC.hideSplash(true);
  }, true);

  document.addEventListener("DOMContentLoaded", IC.start);
})(window.IC);

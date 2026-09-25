/* Project visibility + admin-only Role on Team cards.
   Lives outside views.js so these controls can ship without rewriting that file. */
(function (IC) {
  function session() {
    return IC.state && IC.state.session;
  }

  function isAdminSession() {
    return Boolean(IC.isAdmin && IC.isAdmin(session()));
  }

  function memberById(id) {
    return ((IC.state && IC.state.team) || []).find(function (t) { return t.id === id; }) || null;
  }

  function wrapNormalize() {
    var orig = IC.normalizeUser;
    if (!orig || orig._icVis) return;
    var wrapped = function (raw, id) {
      var user = orig(raw, id);
      if (!user) return user;
      var vis = IC.normalizeProjectVisibility
        ? IC.normalizeProjectVisibility(raw && raw.projectVisibility)
        : (raw && raw.projectVisibility);
      user.projectVisibility = vis || user.projectVisibility || IC.DEFAULT_PROJECT_VISIBILITY || "mine";
      if (user.role === "admin") user.projectVisibility = "all";
      return user;
    };
    wrapped._icVis = true;
    IC.normalizeUser = wrapped;
  }

  function wrapMemberToSession() {
    var orig = IC.memberToSession;
    if (!orig || orig._icVis) return;
    var wrapped = function (member, mode, firebaseUid) {
      var s = orig(member, mode, firebaseUid);
      if (!s) return s;
      var vis = IC.normalizeProjectVisibility
        ? IC.normalizeProjectVisibility(member && member.projectVisibility)
        : (member && member.projectVisibility);
      s.projectVisibility = vis || s.projectVisibility || IC.DEFAULT_PROJECT_VISIBILITY || "mine";
      return s;
    };
    wrapped._icVis = true;
    IC.memberToSession = wrapped;
  }

  function stripUnauthorizedRoleChange(next, prev) {
    if (isAdminSession()) return next;
    if (!next) return next;
    if (!prev) {
      if (next.role === "admin") {
        return Object.assign({}, next, {
          role: "user",
          title: next.title === "Admin" ? "User" : (next.title || "User"),
        });
      }
      return next;
    }
    if (prev.role === "admin" && next.role !== "admin") {
      return Object.assign({}, next, { role: prev.role, title: prev.title, status: prev.status, active: prev.active });
    }
    if (prev.role !== "admin" && next.role === "admin") {
      return Object.assign({}, next, { role: prev.role, title: prev.title });
    }
    return next;
  }

  function wrapUpdateTeam() {
    var orig = IC.updateTeam;
    if (!orig || orig._icVis) return;
    var wrapped = function (team) {
      var prev = (IC.state && IC.state.team) || [];
      if (team && !isAdminSession()) {
        team = team.map(function (n) {
          var old = prev.find(function (t) { return t.id === n.id; }) || null;
          return stripUnauthorizedRoleChange(n, old);
        });
      }
      orig(team);
      var s = IC.state && IC.state.session;
      if (!s || !team) return;
      var me = team.find(function (t) {
        return t.id === s.memberId || (s.firebaseUid && t.firebaseUid === s.firebaseUid);
      });
      if (me && me.projectVisibility) {
        IC.state.session = Object.assign({}, IC.state.session, { projectVisibility: me.projectVisibility });
      }
    };
    wrapped._icVis = true;
    IC.updateTeam = wrapped;
  }

  function wrapSaveUser() {
    var orig = IC.saveUser;
    if (!orig || orig._icVis) return;
    var wrapped = function (user) {
      if (user && user.id) {
        user = stripUnauthorizedRoleChange(user, memberById(user.id));
      }
      return orig(user);
    };
    wrapped._icVis = true;
    IC.saveUser = wrapped;
  }

  function wrapGrantUser() {
    var orig = IC.grantUser;
    if (!orig || orig._icVis) return;
    var wrapped = function (id, patch) {
      patch = patch || {};
      var user = memberById(id);
      if (!isAdminSession()) {
        if (patch.role === "admin") {
          IC.toast("Only an admin can grant Admin");
          return;
        }
        if (user && user.role === "admin") {
          IC.toast("Only an admin can change an admin");
          return;
        }
      }
      return orig(id, patch);
    };
    wrapped._icVis = true;
    IC.grantUser = wrapped;
  }

  function wrapAddTeammate() {
    var orig = IC.addTeammate;
    if (!orig || orig._icVis) return;
    var wrapped = function (draft) {
      draft = Object.assign({}, draft || {});
      if (!isAdminSession() && draft.role === "admin") {
        draft.role = "user";
        if (!draft.title || draft.title === "Admin") draft.title = "User";
      }
      return orig(draft);
    };
    wrapped._icVis = true;
    IC.addTeammate = wrapped;
  }

  function wrapRemoveTeammate() {
    var orig = IC.removeTeammate;
    if (!orig || orig._icVis) return;
    var wrapped = function (id) {
      var who = memberById(id);
      if (who && who.role === "admin" && !isAdminSession()) {
        IC.toast("Only an admin can remove an admin");
        return;
      }
      return orig(id);
    };
    wrapped._icVis = true;
    IC.removeTeammate = wrapped;
  }

  function wrapCanAssignSales() {
    var orig = IC.canAssignSales;
    if (orig && orig._icVis) return;
    var wrapped = function (sess) {
      sess = sess || session();
      if (orig && orig(sess)) return true;
      return IC.projectVisibility(sess) === "all";
    };
    wrapped._icVis = true;
    IC.canAssignSales = wrapped;
  }

  function wrapSalespeople() {
    var orig = IC.salespeople;
    if (orig && orig._icVis) return;
    var wrapped = function () {
      var list = orig ? orig() : [];
      if (IC.projectVisibility(session()) !== "all" && !isAdminSession()) return list;
      var seen = {};
      list.forEach(function (t) { if (t && t.id) seen[t.id] = true; });
      ((IC.state && IC.state.team) || []).forEach(function (t) {
        if (!t || !t.id || seen[t.id]) return;
        if (t.status === "pending" || t.role === "pending" || t.status === "disabled") return;
        seen[t.id] = true;
        list.push(Object.assign({}, t, { salesName: t.salesName || t.name }));
      });
      return list;
    };
    wrapped._icVis = true;
    IC.salespeople = wrapped;
  }

  function wrapAssignOwner() {
    var orig = IC.assignOwner;
    if (!orig || orig._icVis) return;
    var wrapped = function (jobId, ownerId) {
      orig(jobId, ownerId);
      var job = (IC.state.jobs || []).find(function (j) { return j.id === jobId; });
      var member = memberById(ownerId);
      if (!job || !member || job.ownerId !== member.id) return;
      if (job.ownerName) return;
      IC.upsertJob(Object.assign({}, job, { ownerName: member.salesName || member.name || null }));
    };
    wrapped._icVis = true;
    IC.assignOwner = wrapped;
  }

  /* views.js mineJobs() only returns every job for admin/manager. For "all"
     we flip the session role to manager just while that view renders. */
  function withVisibleJobs(fn) {
    if (!fn || fn._icVis) return fn;
    var wrapped = function () {
      var state = IC.state;
      if (!state) return fn.apply(this, arguments);
      var s = session();
      var vis = IC.projectVisibility ? IC.projectVisibility(s) : "all";
      var savedJobs = state.jobs;
      var savedSession = state.session;
      try {
        if (vis === "none") {
          state.jobs = [];
        } else if (vis === "mine") {
          state.jobs = IC.visibleJobs ? IC.visibleJobs(s) : savedJobs;
        } else if (vis === "all" && s && s.role !== "admin") {
          state.session = Object.assign({}, s, { role: "manager", projectVisibility: "all" });
        }
        return fn.apply(this, arguments);
      } finally {
        state.jobs = savedJobs;
        state.session = savedSession;
      }
    };
    wrapped._icVis = true;
    return wrapped;
  }

  function wrapViews() {
    ["viewHome", "viewJobs", "viewSchedule", "viewCustomer", "viewJob"].forEach(function (name) {
      if (typeof IC[name] === "function") IC[name] = withVisibleJobs(IC[name]);
    });
  }

  function radioRow(member, canWrite) {
    var isAdm = member.role === "admin";
    var vis = isAdm ? "all" : (IC.normalizeProjectVisibility(member.projectVisibility) || "mine");
    var opts = IC.PROJECT_VISIBILITY || [
      { id: "all", label: "All projects" },
      { id: "mine", label: "My projects" },
      { id: "none", label: "None" },
    ];
    var radios = opts.map(function (opt) {
      var locked = !canWrite || isAdm;
      return '<label class="perm-radio"><input type="radio" name="projvis-' + member.id + '" data-team="projectVisibility" data-id="' + member.id + '" value="' + opt.id + '"' +
        (vis === opt.id ? " checked" : "") + (locked ? " disabled" : "") + " /><span>" + opt.label + "</span></label>";
    }).join("");
    return '<div class="perm-group ic-projvis" style="margin-top:12px"><h3>Project visibility</h3>' +
      '<div class="perm-page-row"><div class="perm-page-name">Which jobs they can open</div><div class="perm-radios">' + radios + "</div></div>" +
      (isAdm
        ? '<p class="tiny muted">Admin always sees every project.</p>'
        : '<p class="tiny muted">My projects = jobs assigned to them. None hides the pipeline.</p>') +
      "</div>";
  }

  function paintTeamRadios() {
    var s = session();
    if (!s) return;
    var canWrite = IC.can && IC.can(s, "team", "write");
    var cards = document.querySelectorAll(".team-card");
    cards.forEach(function (card) {
      if (card.classList.contains("pending-card")) return;
      if (card.querySelector(".ic-projvis")) return;
      var idEl = card.querySelector("[data-team][data-id]");
      if (!idEl) return;
      var id = idEl.getAttribute("data-id");
      var member = memberById(id);
      if (!member) return;
      var grid = card.querySelector(".form-grid");
      var html = radioRow(member, canWrite);
      if (grid && grid.insertAdjacentHTML) grid.insertAdjacentHTML("afterend", html);
      else card.insertAdjacentHTML("beforeend", html);
    });
  }

  function paintNoneState() {
    var s = session();
    var vis = IC.projectVisibility ? IC.projectVisibility(s) : "all";
    document.body.setAttribute("data-projvis", vis);
    if (vis !== "none") return;
    document.querySelectorAll('[data-act="open-new-job"], [data-act="job-for-customer"]').forEach(function (el) {
      el.style.display = "none";
    });
    document.querySelectorAll('.page-head a[href="#/jobs"]').forEach(function (el) {
      if (/New job/i.test(el.textContent || "")) el.style.display = "none";
    });
  }

  function lockRoleField() {
    var admin = isAdminSession();
    document.querySelectorAll('[data-team="role"], [data-udraft="role"]').forEach(function (el) {
      el.disabled = !admin;
      if (!admin) el.title = "Only an admin can change Role";
    });
    document.querySelectorAll('[data-act="grant-user"][data-role="admin"]').forEach(function (el) {
      el.style.display = admin ? "" : "none";
    });
    if (admin) return;
    document.querySelectorAll('[data-act="remove-teammate"]').forEach(function (el) {
      var who = memberById(el.getAttribute("data-id"));
      if (who && who.role === "admin") el.style.display = "none";
    });
  }

  function wrapRender() {
    var orig = IC.render;
    if (!orig || orig._icVis) return;
    var wrapped = function () {
      orig.apply(this, arguments);
      try {
        paintTeamRadios();
        paintNoneState();
        lockRoleField();
      } catch (err) {
        console.warn("[ironclad] team paint failed", err);
      }
    };
    wrapped._icVis = true;
    IC.render = wrapped;
  }

  function guardEvents() {
    if (document._icRoleGuard) return;
    document._icRoleGuard = true;
    document.addEventListener("change", function (e) {
      var el = e.target;
      if (!el || !el.getAttribute) return;
      var teamField = el.getAttribute("data-team");
      var draftField = el.getAttribute("data-udraft");
      if ((teamField === "role" || draftField === "role") && !isAdminSession()) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (teamField === "role") {
          var who = memberById(el.getAttribute("data-id"));
          if (who) el.value = who.role === "admin" || who.role === "user" || who.role === "manager" || who.role === "sales" ? who.role : "user";
        }
        IC.toast("Only an admin can change Role");
        if (IC.render) IC.render();
      }
    }, true);
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("[data-act]");
      if (!t) return;
      var act = t.getAttribute("data-act");
      if (act === "grant-user" && t.getAttribute("data-role") === "admin" && !isAdminSession()) {
        e.stopImmediatePropagation();
        e.preventDefault();
        IC.toast("Only an admin can grant Admin");
      }
      if (act === "remove-teammate" && !isAdminSession()) {
        var who = memberById(t.getAttribute("data-id"));
        if (who && who.role === "admin") {
          e.stopImmediatePropagation();
          e.preventDefault();
          IC.toast("Only an admin can remove an admin");
        }
      }
      if (act === "save-teammate" && !isAdminSession() && IC.ui && IC.ui.addUserDraft && IC.ui.addUserDraft.role === "admin") {
        IC.ui.addUserDraft.role = "user";
        if (!IC.ui.addUserDraft.title || IC.ui.addUserDraft.title === "Admin") IC.ui.addUserDraft.title = "User";
      }
    }, true);
  }

  function install() {
    wrapNormalize();
    wrapMemberToSession();
    wrapUpdateTeam();
    wrapSaveUser();
    wrapGrantUser();
    wrapAddTeammate();
    wrapRemoveTeammate();
    wrapCanAssignSales();
    wrapSalespeople();
    wrapAssignOwner();
    wrapViews();
    wrapRender();
    guardEvents();
  }

  install();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  }
})(window.IC || (window.IC = {}));

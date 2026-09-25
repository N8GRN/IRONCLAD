/* Project visibility — Team card radios + job list filter.
   Lives outside views.js so the control can ship without rewriting that file. */
(function (IC) {
  function session() {
    return IC.state && IC.state.session;
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

  function wrapUpdateTeam() {
    var orig = IC.updateTeam;
    if (!orig || orig._icVis) return;
    var wrapped = function (team) {
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

  function withVisibleJobs(fn) {
    if (!fn || fn._icVis) return fn;
    var wrapped = function () {
      var state = IC.state;
      if (!state || !IC.visibleJobs) return fn.apply(this, arguments);
      var all = state.jobs;
      state.jobs = IC.visibleJobs(session());
      try {
        return fn.apply(this, arguments);
      } finally {
        state.jobs = all;
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
      var member = (IC.state.team || []).find(function (t) { return t.id === id; });
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

  function wrapRender() {
    var orig = IC.render;
    if (!orig || orig._icVis) return;
    var wrapped = function () {
      orig.apply(this, arguments);
      try {
        paintTeamRadios();
        paintNoneState();
      } catch (err) {
        console.warn("[ironclad] project visibility paint failed", err);
      }
    };
    wrapped._icVis = true;
    IC.render = wrapped;
  }

  function install() {
    wrapNormalize();
    wrapMemberToSession();
    wrapUpdateTeam();
    wrapViews();
    wrapRender();
  }

  install();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  }
})(window.IC || (window.IC = {}));

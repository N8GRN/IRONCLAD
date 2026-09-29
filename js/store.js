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

  IC.deleteCrew = function (id) {
    if (!IC.can(IC.state.session, "crews", "write") && !IC.can(IC.state.session, "labor", "write")) return;
    if (!(IC.state.crews || []).some(function (c) { return c.id === id; })) return;
    IC.state.crews = IC.state.crews.filter(function (c) { return c.id !== id; });
    (IC.state.jobs || []).forEach(function (job) {
      if (job.crewId !== id) return;
      IC.upsertJob(Object.assign({}, job, { crewId: null, crewName: null, updatedAt: IC.nowIso() }));
    });
    if (IC.ui && IC.ui.laborCrew === id) IC.ui.laborCrew = "";
    IC.emit();
    IC.cloudDelete("crews", id);
  };

  IC.setUserPagePermission = function (userId, pageId, level) {
    var session = IC.state.session;
    if (!IC.isAdmin(session) && !IC.can(session, "permissions", "write")) return;
    var user = IC.state.team.find(function (t) { return t.id === userId; });
    if (!user) return;
    if (user.role === "admin") {
      IC.toast("Admin always has full access");
      return;
    }
    var nextLevel = IC.normalizePageLevel(level);
    if (!nextLevel) return;
    var self = session && (
      user.id === session.memberId || user.id === session.id ||
      (session.firebaseUid && user.firebaseUid && user.firebaseUid === session.firebaseUid)
    );
    if (!IC.isAdmin(session) && self && pageId === "permissions" && nextLevel !== "read-write") {
      IC.toast("You can't remove your own Manage permissions access");
      return;
    }
    var map = IC.normalizePermissionMap(user.permission);
    map[pageId] = nextLevel;
    IC.saveUser(Object.assign({}, user, { permission: map }));
    IC.toast("Saved for " + (user.name || "that user"));
  };
})(window.IC);

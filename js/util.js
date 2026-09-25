/* ============================================================
   IRONCLAD CRM — helpers
   Edit money/date formatting here.
   ============================================================ */
window.IC = window.IC || {};

(function (IC) {
  IC.uid = function () {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  IC.nowIso = function () {
    return new Date().toISOString();
  };

  IC.money = function (n) {
    var v = Number.isFinite(n) ? n : 0;
    return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  IC.formatDate = function (iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  IC.formatDateLong = function (iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      weekday: "short", month: "long", day: "numeric", year: "numeric",
    });
  };

  IC.formatPhone = function (raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.length === 10) return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    if (d.length === 11 && d.startsWith("1"))
      return "(" + d.slice(1, 4) + ") " + d.slice(4, 7) + "-" + d.slice(7);
    return raw || "";
  };

  IC.fullName = function (first, last) {
    return ((first || "") + " " + (last || "")).trim();
  };

  IC.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  };

  IC.customerAddress = function (c) {
    if (!c) return "";
    var cityLine = [c.city, c.state].filter(Boolean).join(", ");
    return [c.street, [cityLine, c.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  };

  IC.jobSalesperson = function (job) {
    var team = (IC.state && IC.state.team) || [];
    if (!job) return null;
    return team.find(function (t) { return t.id === job.ownerId; }) ||
      team.find(function (t) { return t.salesName && job.ownerName && t.salesName === job.ownerName; }) ||
      null;
  };

  IC.commissionRate = function (person) {
    var n = person ? Number(person.commissionPercent) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  IC.mapsUrl = function (customer) {
    var addr = IC.customerAddress(customer);
    if (!addr) return "";
    return "https://maps.apple.com/?daddr=" + encodeURIComponent(addr);
  };

  IC.buildAllDayIcs = function (opts) {
    opts = opts || {};
    var date = String(opts.date || "").replace(/-/g, "");
    var y = Number(date.slice(0, 4));
    var m = Number(date.slice(4, 6));
    var d = Number(date.slice(6, 8));
    var end = new Date(y, m - 1, d + 1);
    var endStr = String(end.getFullYear()) +
      ("0" + (end.getMonth() + 1)).slice(-2) +
      ("0" + end.getDate()).slice(-2);
    function fold(s) {
      return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    }
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//IRONCLAD//CRM//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + fold(opts.uid || ("ironclad-" + date + "@crm")),
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + date,
      "DTEND;VALUE=DATE:" + endStr,
      "SUMMARY:" + fold(opts.summary),
      "LOCATION:" + fold(opts.location || ""),
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
  };

  IC.googleCalendarUrl = function (opts) {
    opts = opts || {};
    var date = String(opts.date || "").replace(/-/g, "");
    if (!/^\d{8}$/.test(date)) return "";
    var y = date.slice(0, 4), m = date.slice(4, 6), d = date.slice(6, 8);
    var end = new Date(Number(y), Number(m) - 1, Number(d) + 1);
    var endStr = String(end.getFullYear()) +
      ("0" + (end.getMonth() + 1)).slice(-2) +
      ("0" + end.getDate()).slice(-2);
    var params = new URLSearchParams();
    params.set("action", "TEMPLATE");
    params.set("text", opts.summary || "IRONCLAD job");
    params.set("dates", date + "/" + endStr);
    if (opts.location) params.set("location", opts.location);
    if (opts.details) params.set("details", opts.details);
    return "https://calendar.google.com/calendar/render?" + params.toString();
  };

  IC.addJobToCalendar = function (job, customer) {
    var date = IC.validIsoDate(job && job.scheduledDate);
    if (!date) {
      IC.toast("Set a production date first");
      return;
    }
    var summary = "Job #" + job.number + " | " + (job.customerName || "");
    var location = IC.customerAddress(customer);
    var details = "IRONCLAD roofing job #" + job.number + (job.customerName ? " — " + job.customerName : "");
    var gUrl = IC.googleCalendarUrl({
      summary: summary,
      location: location,
      details: details,
      date: date,
    });
    if (gUrl) {
      try {
        var link = document.createElement("a");
        link.href = gUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      } catch (err) { /* share the ics file instead */ }
    }
    var ics = IC.buildAllDayIcs({
      summary: summary,
      location: location,
      date: date,
      uid: "ironclad-job-" + job.id + "-" + date + "@ironclad",
    });
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    IC.shareOrDownload({
      blob: blob,
      filename: "Job-" + job.number + ".ics",
      title: summary,
      text: location || summary,
    });
  };

  IC.roleLabel = function (person) {
    if (!person) return "";
    if (person.status === "pending" || person.role === "pending") return "Waiting";
    if (person.status === "disabled") return "Off";
    if (person.title) return person.title;
    if (person.role === "admin") return "Admin";
    if (person.role === "user") return "User";
    if (person.role === "manager") return "Manager";
    if (person.role === "sales") return "Sales";
    return "Waiting";
  };

  IC.isApproved = function (person) {
    if (!person) return false;
    if (person.status === "pending" || person.status === "disabled") return false;
    return person.role === "admin" || person.role === "user" || person.role === "manager" || person.role === "sales";
  };

  IC.isAdmin = function (person) {
    return Boolean(person && person.role === "admin" && IC.isApproved(person));
  };

  IC.normalizePageLevel = function (raw) {
    var v = String(raw || "").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
    if (v === "read/write" || v === "readwrite" || v === "write") v = "read-write";
    if (v === "readonly" || v === "read") v = "read-only";
    if (v === "restrict" || v === "none" || v === "off" || v === "hidden") v = "restricted";
    if (v === "read-write" || v === "read-only" || v === "restricted") return v;
    return "";
  };

  IC.defaultPageLevel = function (pageId) {
    var map = IC.DEFAULT_USER_PERMISSION || {};
    return IC.normalizePageLevel(map[pageId]) || "restricted";
  };

  IC.storedPermissionMap = function (raw) {
    var src = raw && typeof raw === "object" ? raw : {};
    var out = {};
    Object.keys(src).forEach(function (key) {
      var set = IC.normalizePageLevel(src[key]);
      if (set) out[key] = set;
    });
    return out;
  };

  IC.normalizePermissionMap = function (raw) {
    var src = raw && typeof raw === "object" ? raw : {};
    var out = {};
    (IC.PAGES || []).forEach(function (page) {
      var set = IC.normalizePageLevel(src[page.id]);
      out[page.id] = set || IC.defaultPageLevel(page.id);
    });
    Object.keys(src).forEach(function (key) {
      if (out[key]) return;
      var set = IC.normalizePageLevel(src[key]);
      if (set) out[key] = set;
    });
    return out;
  };

  IC.pageLevel = function (session, pageId) {
    if (!session || !IC.isApproved(session)) return "restricted";
    if (session.role === "admin") return "read-write";
    var map = IC.normalizePermissionMap(session.permission);
    return map[pageId] || IC.defaultPageLevel(pageId);
  };

  IC.pageIdForRoute = function (route) {
    route = route || {};
    if (route.name === "settings") return route.page || "settings";
    if (route.name === "job") {
      var tab = IC.ui && IC.ui.jobTab;
      if (tab === "Estimate") tab = "Assessment";
      if (tab === "Quote") tab = "Summary";
      if (tab === "Assessment") return "assessment";
      if (tab === "Summary") return "summary";
      if (tab === "Contract") return "contract";
      return "jobs";
    }
    if (route.name === "customer") return "customers";
    if (route.name === "login" || route.name === "sign") return "";
    return route.name || "home";
  };

  IC.can = function (session, resource, action) {
    var level = IC.pageLevel(session, resource);
    if (action === "write") return level === "read-write";
    if (action === "read") return level === "read-write" || level === "read-only";
    return false;
  };

  IC.normalizeProjectVisibility = function (raw) {
    if (raw === "all" || raw === "mine" || raw === "none") return raw;
    return "";
  };

  IC.projectVisibility = function (session) {
    if (!session || !IC.isApproved(session)) return "none";
    if (session.role === "admin") return "all";
    var member = null;
    var lookId = session.memberId || session.id;
    if (IC.state && IC.state.team && lookId) {
      member = IC.state.team.find(function (t) {
        return t.id === lookId || (session.firebaseUid && t.firebaseUid === session.firebaseUid);
      });
    }
    var raw = (member && member.projectVisibility) || session.projectVisibility;
    return IC.normalizeProjectVisibility(raw) || IC.DEFAULT_PROJECT_VISIBILITY || "mine";
  };

  IC.jobIsMine = function (job, session) {
    if (!job || !session) return false;
    var ids = IC.personIds ? IC.personIds(session) : [session.memberId, session.firebaseUid].filter(Boolean);
    if (job.ownerId && ids.indexOf(job.ownerId) >= 0) return true;
    return false;
  };

  IC.canSeeJob = function (job, session) {
    session = session || (IC.state && IC.state.session);
    var vis = IC.projectVisibility(session);
    if (vis === "all") return true;
    if (vis === "none") return false;
    return IC.jobIsMine(job, session);
  };

  IC.visibleJobs = function (session) {
    session = session || (IC.state && IC.state.session);
    var jobs = (IC.state && IC.state.jobs) || [];
    var vis = IC.projectVisibility(session);
    if (vis === "all") return jobs.slice();
    if (vis === "none") return [];
    return jobs.filter(function (j) { return IC.jobIsMine(j, session); });
  };

  IC.normalizePermissions = function (raw) {
    return raw && typeof raw === "object" ? raw : {};
  };

  IC.livePermissions = function () {
    return IC.normalizePermissions(IC.state && IC.state.settings && IC.state.settings.permissions);
  };

  IC.canAssignSales = function (session) {
    return IC.isAdmin(session);
  };

  IC.canAssignCrew = function (session, job) {
    if (!session || !IC.isApproved(session)) return false;
    if (IC.isAdmin(session) || IC.can(session, "jobs", "write")) return true;
    return Boolean(session.salesName && job && job.ownerId === session.memberId);
  };

  IC.canManageTeam = function (session) {
    return IC.can(session, "team", "write");
  };

  IC.salespeople = function () {
    return ((IC.state && IC.state.team) || []).filter(function (t) {
      return t.salesName && t.status !== "pending" && t.role !== "pending" && t.status !== "disabled";
    });
  };

  IC.roleOptions = function (current) {
    var opts = [
      { value: "admin", label: "Admin (full access)" },
      { value: "user", label: "User" },
    ];
    if (current === "manager") opts.push({ value: "manager", label: "Manager (legacy)" });
    if (current === "sales") opts.push({ value: "sales", label: "Sales (legacy)" });
    return opts;
  };

  IC.authFriendly = function (err) {
    var c = String((err && err.code) || "");
    var m = String((err && err.message) || "");
    var blob = c + " " + m;
    if (/user-not-found|invalid-email/i.test(blob) && /invalid-email/i.test(c)) return "Check the email address.";
    if (/user-not-found/i.test(blob)) return "No account with that email. Create one, then Nate or Matt will turn on access.";
    if (/wrong-password|invalid-credential/i.test(blob)) return "That password doesn’t match.";
    if (/email-already-in-use/i.test(blob)) return "That email already has an account. Sign in, or reset the password.";
    if (/weak-password/i.test(blob)) return "Use at least 6 characters.";
    if (/too-many-requests/i.test(blob)) return "Too many tries. Wait a minute and try again.";
    if (/unauthorized-domain/i.test(blob)) return "This website isn’t on the company allow-list yet. Ask Nate or Matt to add it under Authentication → Authorized domains.";
    if (/network|offline/i.test(blob)) return "Can’t reach the network. If you signed in on this iPad before, use Continue offline.";
    if (/operation-not-allowed/i.test(blob)) return "Email/password sign-in isn’t enabled yet on the project.";
    return m.replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\s*$/, "") || "Something went wrong.";
  };

  IC.validIsoDate = function (v) {
    if (v == null) return null;
    var s = String(v).trim();
    if (!s) return null;
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return m[1] + "-" + m[2] + "-" + m[3];
  };

  IC.getThemePref = function () {
    try {
      var p = localStorage.getItem(IC.THEME_KEY);
      if (p === "light" || p === "dark" || p === "system") return p;
    } catch (err) { /* private mode */ }
    return "system";
  };

  IC.systemIsDark = function () {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  };

  IC.resolvedTheme = function (pref) {
    pref = pref || IC.getThemePref();
    if (pref === "light" || pref === "dark") return pref;
    return IC.systemIsDark() ? "dark" : "light";
  };

  IC.applyTheme = function (pref) {
    if (pref === "light" || pref === "dark" || pref === "system") {
      try { localStorage.setItem(IC.THEME_KEY, pref); } catch (err) { /* ignore */ }
    } else {
      pref = IC.getThemePref();
    }
    var resolved = IC.resolvedTheme(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", pref);
    var splash = document.getElementById("ic-splash");
    var splashUp = splash && !splash.classList.contains("is-done") && !splash.classList.contains("is-leaving");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && !splashUp) meta.setAttribute("content", resolved === "dark" ? "#101820" : "#0d3b6e");
  };

  IC.statusTone = function (status) {
    switch (status) {
      case "Lead": return "lead";
      case "Follow-up": return "follow";
      case "Appointment": return "appt";
      case "Sold": return "sold";
      case "Did NOT Sell": return "lost";
      case "Job Scheduled": return "scheduled";
      case "Complete": return "done";
      case "draft": return "draft";
      case "sent": return "sent";
      case "signed": return "signed";
      default: return "lead";
    }
  };

  IC.clone = function (v) {
    return JSON.parse(JSON.stringify(v));
  };

  IC.asset = function (path) {
    var base = IC.baseUrl || "";
    return base + path.replace(/^\//, "");
  };

  IC.appJoinUrl = function () {
    var path = location.pathname.replace(/index\.html$/i, "");
    if (path.slice(-1) !== "/") path += "/";
    return location.origin + path;
  };

  IC.copyText = function (text) {
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (err) {
        return false;
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  };
})(window.IC);

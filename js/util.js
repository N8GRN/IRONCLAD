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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  IC.customerAddress = function (c) {
    if (!c) return "";
    var cityLine = [c.city, c.state].filter(Boolean).join(", ");
    return [c.street, [cityLine, c.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  };

  IC.jobSalesperson = function (job) {
    var team = (IC.state && IC.state.team) || IC.TEAM || [];
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
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + fold(opts.uid || ("ironclad-" + date + "@crm")),
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + date,
      "DTEND;VALUE=DATE:" + endStr,
      "SUMMARY:" + fold(opts.summary),
      "LOCATION:" + fold(opts.location || ""),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  };

  IC.addJobToCalendar = function (job, customer) {
    var date = IC.validIsoDate(job && job.scheduledDate);
    if (!date) {
      IC.toast("Set a production date first");
      return;
    }
    var summary = "Job #" + job.number + " | " + (job.customerName || "");
    var location = IC.customerAddress(customer);
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
    if (person.role === "sales") return "Sales";
    return "Waiting";
  };

  IC.isApproved = function (person) {
    if (!person) return false;
    if (person.status === "pending" || person.status === "disabled") return false;
    return person.role === "admin" || person.role === "sales";
  };

  IC.canAssignSales = function (session) {
    return session && session.role === "admin" && IC.isApproved(session);
  };

  IC.canAssignCrew = function (session, job) {
    if (!session || !IC.isApproved(session)) return false;
    if (session.role === "admin") return true;
    return Boolean(session.salesName && job && job.ownerId === session.memberId);
  };

  IC.canManageTeam = function (session) {
    return Boolean(session && session.role === "admin" && IC.isApproved(session));
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
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#101820" : "#0d3b6e");
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
})(window.IC);

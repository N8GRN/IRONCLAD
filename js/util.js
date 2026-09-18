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

  IC.roleLabel = function (person) {
    if (!person) return "";
    if (person.title) return person.title;
    if (person.role === "admin") return "Admin";
    return "Sales";
  };

  IC.canAssignSales = function (session) {
    return session && session.role === "admin";
  };

  IC.canAssignCrew = function (session, job) {
    if (!session) return false;
    if (session.role === "admin") return true;
    return Boolean(session.salesName && job && job.ownerId === session.memberId);
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

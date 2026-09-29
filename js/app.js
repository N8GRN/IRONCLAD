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

  document.addEventListener("DOMContentLoaded", IC.start);
})(window.IC);

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
  IC.parseRoute = function () { return { name: "home" }; };
})(window.IC);

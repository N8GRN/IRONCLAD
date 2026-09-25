/* Labor nav icon — 45° leaned ladder (option D). Overrides IC.icon("ladder"). */
(function (IC) {
  if (!IC || typeof IC.icon !== "function") return;
  var orig = IC.icon;
  IC.icon = function (name) {
    if (name === "ladder") {
      return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M3.73 16.45 16.45 3.73"/>' +
        '<path d="M7.55 20.27 20.27 7.55"/>' +
        '<path d="M5.76 14.42 9.58 18.24"/>' +
        '<path d="M8.65 11.53 12.47 15.35"/>' +
        '<path d="M11.53 8.65 15.35 12.47"/>' +
        '<path d="M14.42 5.76 18.24 9.58"/>' +
        "</svg>";
    }
    return orig.call(this, name);
  };
})(window.IC);

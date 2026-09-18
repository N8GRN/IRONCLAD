/* Guest side of the Grok preview postMessage bridge. Noops when not framed. */
(function () {
  var CHANNEL = "grok-preview-bridge";
  var VERSION = 1;
  var ROOT_STATE_KEY = "__grokPreviewBridgeRoot";

  function isGrokHost(host) {
    host = String(host || "").toLowerCase();
    return (
      host === "grok.com" ||
      host.endsWith(".grok.com") ||
      host === "x.ai" ||
      host.endsWith(".x.ai") ||
      host.endsWith(".grok.me")
    );
  }

  function parentOrigin() {
    if (window.parent === window) return null;
    var ancestor =
      typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0
        ? location.ancestorOrigins[0]
        : null;
    var ref = document.referrer;
    var origin = ancestor || (ref ? (function () { try { return new URL(ref).origin; } catch (e) { return ""; } })() : "");
    if (!origin) return null;
    try {
      if (!isGrokHost(new URL(origin).hostname)) return null;
    } catch (e) { return null; }
    return origin;
  }

  function toHashPath(path) {
    if (!path) return "#/";
    try {
      var url = new URL(path, location.origin);
      var p = url.pathname.replace(/\/+$/, "") || "/";
      var m = p.match(/\/(jobs|customers|schedule|settings|notifications|login|sign)(\/[^/]+)?$/);
      if (m) return "#/" + m[1] + (m[2] || "") + url.search + url.hash.replace(/^#/, "");
      if (url.hash) return url.hash;
      return "#/";
    } catch (e) {
      return "#/";
    }
  }

  var origin = parentOrigin();
  if (!origin) return;

  var originalPushState = history.pushState.bind(history);
  var originalReplaceState = history.replaceState.bind(history);

  function isAtRoot() {
    var state = history.state;
    return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
  }

  try {
    var current = history.state;
    var already = current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY);
    if (!already) {
      var isRoot = history.length <= 1;
      var marked = current && typeof current === "object" ? Object.assign({}, current, { __grokPreviewBridgeRoot: isRoot }) : { __grokPreviewBridgeRoot: isRoot };
      originalReplaceState(marked, "", location.href);
    }
  } catch (e) { /* ignore */ }

  function post(msg) {
    window.parent.postMessage(msg, origin);
  }

  function reportLocation() {
    post({
      channel: CHANNEL,
      version: VERSION,
      type: "location",
      path: location.pathname || "/",
      search: location.search,
      hash: location.hash,
    });
  }

  function announce() {
    reportLocation();
    post({
      channel: CHANNEL,
      version: VERSION,
      type: "routes",
      paths: ["/", "/jobs", "/customers", "/schedule", "/settings", "/notifications", "/login"],
    });
    post({ channel: CHANNEL, version: VERSION, type: "ready" });
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent || event.origin !== origin) return;
    var data = event.data;
    if (!data || data.channel !== CHANNEL || data.version !== VERSION) return;
    if (data.type === "hello") announce();
    if (data.type === "navigate" && data.path) {
      location.hash = toHashPath(data.path);
      queueMicrotask(reportLocation);
    }
    if (data.type === "history") {
      if (data.delta === -1 && isAtRoot()) return;
      history.go(data.delta);
    }
  });

  history.pushState = function (data, unused, url) {
    var next = data && typeof data === "object" ? Object.assign({}, data, { __grokPreviewBridgeRoot: false }) : data;
    originalPushState(next, unused, url);
    reportLocation();
  };
  history.replaceState = function (data, unused, url) {
    var next = isAtRoot()
      ? Object.assign({}, data && typeof data === "object" ? data : {}, { __grokPreviewBridgeRoot: true })
      : data;
    originalReplaceState(next, unused, url);
    reportLocation();
  };

  window.addEventListener("popstate", reportLocation);
  window.addEventListener("hashchange", reportLocation);
  announce();
})();

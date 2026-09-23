/* Move the job tab row into the sticky topbar once it scrolls under the header. */
(function (IC) {
  if (!IC) return;

  var style = document.createElement("style");
  style.textContent =
    ".topbar-tabs{flex:1;min-width:0;display:flex;align-items:center;justify-content:center}" +
    ".topbar-tabs:empty{display:none}" +
    ".topbar .tabs{width:100%;max-width:28rem;box-shadow:none;background:rgba(251,248,241,.55);padding:.15rem}" +
    ".topbar .tabs button{min-width:0;font-size:12px;padding:.4rem .2rem}" +
    "html[data-theme=\"dark\"] .topbar .tabs{background:rgba(251,248,241,.08)}" +
    ".job-tabs-spacer{pointer-events:none}";
  document.head.appendChild(style);

  function ensureHost(bar) {
    var host = document.getElementById("job-tabs-host");
    if (host) return host;
    host = document.createElement("div");
    host.className = "topbar-tabs";
    host.id = "job-tabs-host";
    var actions = bar.querySelector(".top-actions");
    bar.insertBefore(host, actions || null);
    return host;
  }

  function ensureSlot() {
    var tabs = document.querySelector(".page > .tabs.no-print, .page #job-tabs");
    if (!tabs) return null;
    tabs.id = "job-tabs";
    var slot = document.getElementById("job-tabs-slot");
    if (slot && slot.contains(tabs)) return slot;
    slot = document.getElementById("job-tabs-slot");
    if (!slot) {
      slot = document.createElement("div");
      slot.id = "job-tabs-slot";
      tabs.parentNode.insertBefore(slot, tabs);
    }
    if (tabs.parentNode !== slot) slot.appendChild(tabs);
    return slot;
  }

  IC.pinJobTabs = function () {
    if (IC._jobTabsIO) {
      IC._jobTabsIO.disconnect();
      IC._jobTabsIO = null;
    }
    var bar = document.querySelector("header.topbar");
    var slot = ensureSlot();
    var tabs = document.getElementById("job-tabs");
    if (!bar || !slot || !tabs) {
      if (IC._jobTabsOnScroll) {
        window.removeEventListener("scroll", IC._jobTabsOnScroll);
        IC._jobTabsOnScroll = null;
      }
      return;
    }
    var host = ensureHost(bar);
    var canPin = function () {
      return window.getComputedStyle(bar).display !== "none";
    };
    var apply = function (pin) {
      if (!canPin()) pin = false;
      var spacer = slot.querySelector(".job-tabs-spacer");
      if (pin) {
        if (tabs.parentNode !== host) {
          if (!spacer) {
            spacer = document.createElement("div");
            spacer.className = "job-tabs-spacer";
            spacer.style.height = tabs.getBoundingClientRect().height + "px";
            slot.appendChild(spacer);
          }
          host.appendChild(tabs);
        }
      } else {
        if (spacer) spacer.remove();
        if (tabs.parentNode !== slot) slot.appendChild(tabs);
      }
    };
    var measure = function () {
      if (!canPin()) { apply(false); return; }
      apply(slot.getBoundingClientRect().top < bar.getBoundingClientRect().bottom - 1);
    };
    var margin = Math.ceil(bar.getBoundingClientRect().height) + 2;
    IC._jobTabsIO = new IntersectionObserver(function () { measure(); }, {
      root: null,
      rootMargin: "-" + margin + "px 0px 0px 0px",
      threshold: [0, 0.01, 1],
    });
    IC._jobTabsIO.observe(slot);
    if (!IC._jobTabsOnScroll) {
      IC._jobTabsOnScroll = function () { IC._jobTabsMeasure && IC._jobTabsMeasure(); };
      window.addEventListener("scroll", IC._jobTabsOnScroll, { passive: true });
    }
    IC._jobTabsMeasure = measure;
    measure();
  };

  var render = IC.render;
  if (typeof render === "function") {
    IC.render = function () {
      render.apply(this, arguments);
      IC.pinJobTabs();
    };
  }
  window.addEventListener("resize", function () { IC.pinJobTabs(); });
})(window.IC);

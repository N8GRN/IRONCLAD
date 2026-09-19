window.IC = window.IC || {};

(function (IC) {
  IC.icon = function (name) {
    var paths = {
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
      users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.2"/><path d="M21 20c0-2.2-1.6-3.8-4-4.2"/>',
      bell: '<path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4 6.2 17.8"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
      share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>',
      trash: '<path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/>',
      userplus: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M19 8v6M16 11h6"/>',
      pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      box: '<path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z"/><path d="M3 8.5V16l9 4.5 9-4.5V8.5"/><path d="M12 13v7.5"/>',
    };
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || "") + "</svg>";
  };

  IC.badge = function (status) {
    var tone = IC.statusTone(status);
    return '<span class="badge tone-' + tone + '">' + IC.esc(status) + "</span>";
  };

  IC.field = function (label, controlHtml, extraClass) {
    return '<label class="field ' + (extraClass || "") + '"><span class="field-label">' + IC.esc(label) + "</span>" + controlHtml + "</label>";
  };

  IC.input = function (attrs) {
    var a = Object.assign({ type: "text" }, attrs);
    var s = "";
    Object.keys(a).forEach(function (k) {
      if (a[k] == null || a[k] === false) return;
      if (a[k] === true) { s += " " + k; return; }
      s += " " + k + '="' + IC.esc(a[k]) + '"';
    });
    return "<input" + s + " />";
  };

  IC.select = function (attrs, options) {
    var a = attrs || {};
    var s = "";
    Object.keys(a).forEach(function (k) {
      if (a[k] == null || a[k] === false) return;
      if (a[k] === true) { s += " " + k; return; }
      s += " " + k + '="' + IC.esc(a[k]) + '"';
    });
    var opts = (options || []).map(function (o) {
      var val = o.value != null ? o.value : o.label;
      var sel = String(val) === String(a.value) ? " selected" : "";
      return '<option value="' + IC.esc(val) + '"' + sel + ">" + IC.esc(o.label) + "</option>";
    }).join("");
    var rest = Object.assign({}, a);
    delete rest.value;
    var s2 = "";
    Object.keys(rest).forEach(function (k) {
      if (rest[k] == null || rest[k] === false) return;
      if (rest[k] === true) { s2 += " " + k; return; }
      s2 += " " + k + '="' + IC.esc(rest[k]) + '"';
    });
    return "<select" + s2 + ">" + opts + "</select>";
  };

  IC.textarea = function (attrs) {
    var val = attrs.value || "";
    var rest = Object.assign({}, attrs);
    delete rest.value;
    var s = "";
    Object.keys(rest).forEach(function (k) {
      if (rest[k] == null || rest[k] === false) return;
      if (rest[k] === true) { s += " " + k; return; }
      s += " " + k + '="' + IC.esc(rest[k]) + '"';
    });
    return "<textarea" + s + ">" + IC.esc(val) + "</textarea>";
  };

  IC.btn = function (label, attrs) {
    attrs = attrs || {};
    var cls = "btn " + (attrs.class || "");
    if (attrs.variant === "outline") cls += " btn-outline";
    if (attrs.variant === "ghost") cls += " btn-ghost";
    if (attrs.variant === "danger") cls += " btn-danger";
    if (attrs.size === "sm") cls += " btn-sm";
    var extra = attrs.data || "";
    var dis = attrs.disabled ? " disabled" : "";
    var type = attrs.type || "button";
    return '<button type="' + type + '" class="' + cls.trim() + '" ' + extra + dis + ">" + label + "</button>";
  };

  IC.mountSigPad = function (canvas, onChange) {
    var ctx = canvas.getContext("2d");
    var drawing = false;
    var empty = true;
    var resize = function () {
      var ratio = window.devicePixelRatio || 1;
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a2332";
      empty = true;
      onChange("");
    };
    resize();
    var pos = function (e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener("pointerdown", function (e) {
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      empty = false;
    });
    var up = function () {
      if (!drawing) return;
      drawing = false;
      if (!empty) onChange(canvas.toDataURL("image/png"));
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas._clearPad = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      empty = true;
      onChange("");
    };
  };

  IC.contractHtml = function (job, customer, settings) {
    var doc = IC.buildContract(job, customer, settings);
    var cSig = job.contract && job.contract.customerSignature;
    var coSig = job.contract && job.contract.companySignature;
    var slot = function (label, sig) {
      return '<div class="sig-slot"><p class="field-label">' + IC.esc(label) + '</p><div class="sig-line">' +
        (sig && sig.dataUrl
          ? '<img src="' + sig.dataUrl + '" alt="Signature" />'
          : '<span class="tiny" style="margin-bottom:8px">Sign here</span>') +
        "</div><p>" + IC.esc((sig && sig.printedName) || "Printed name") +
        (sig && sig.title ? ", " + IC.esc(sig.title) : "") +
        '</p><p class="tiny">' + (sig && sig.signedAt ? new Date(sig.signedAt).toLocaleString() : "Date") + "</p></div>";
    };
    return '<article class="paper-doc" id="contract-sheet">' +
      '<header class="doc-head"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" />' +
      '<div class="tiny" style="text-align:right">' + doc.company.map(function (l) { return "<div>" + IC.esc(l) + "</div>"; }).join("") + "</div></header>" +
      '<p class="tiny" style="text-align:right;margin-top:8px;letter-spacing:.16em;text-transform:uppercase">Project #' + IC.esc(doc.projectNumber) + "</p>" +
      '<h1 style="color:var(--navy);font-size:1.5rem;margin-top:.4rem">' + IC.esc(doc.title) + "</h1>" +
      "<p style='margin-top:1rem'>" + IC.esc(doc.intro) + "</p>" +
      '<section class="grid-2" style="margin-top:1.25rem">' +
      '<div style="background:rgba(243,239,230,.7);border-radius:16px;padding:1rem"><h2 class="field-label">Customer</h2><p style="font-weight:600;margin-top:4px">' + IC.esc(doc.customerName) + "</p>" +
      (doc.customerContact ? "<p>" + IC.esc(doc.customerContact) + "</p>" : "") + "</div>" +
      '<div style="background:rgba(243,239,230,.7);border-radius:16px;padding:1rem"><h2 class="field-label">Property</h2><p style="font-weight:600;margin-top:4px">' + IC.esc(doc.property || "—") + "</p></div></section>" +
      '<section class="scope" style="margin-top:1.5rem"><h2 style="color:var(--navy)">Scope of work</h2><ol>' +
      doc.scope.map(function (s) { return "<li>" + IC.esc(s) + "</li>"; }).join("") + "</ol></section>" +
      '<section style="margin-top:1.5rem;border:1px solid rgba(13,59,110,.15);background:rgba(13,59,110,.03);border-radius:16px;padding:1rem"><h2 style="color:var(--navy)">Contract price</h2><p class="price-xl">' + IC.esc(doc.price) + "</p></section>" +
      doc.articles.map(function (a) {
        return '<section style="margin-top:1.25rem"><h2 style="color:var(--navy);font-family:var(--font-sans);font-size:1rem">' + IC.esc(a.heading) + "</h2><p style='margin-top:4px'>" + IC.esc(a.body) + "</p></section>";
      }).join("") +
      '<section class="grid-2" style="margin-top:2.5rem">' + slot("Customer", cSig) + slot("Contractor — " + settings.legalName, coSig) + "</section>" +
      '<p class="tiny" style="margin-top:2rem">By signing, each party acknowledges they have read this Agreement, including the estimate attached by reference, and agree to its terms.</p></article>';
  };

  IC.quoteHtml = function (job, settingsName) {
    var est = job.estimate;
    var lines = (est && est.computed && est.computed.lines) || [];
    var body = !est
      ? '<p class="muted" style="margin-top:1.5rem">Build an estimate first.</p>'
      : '<p class="muted" style="margin-top:1rem">' + IC.esc(IC.pickName(est, "shingle")) + " shingles" +
        (est.gutters && est.gutters.included ? " · gutters included" : "") +
        (est.siding && est.siding.included ? " · siding included" : "") + "</p>" +
        '<table style="width:100%;margin-top:1rem;font-size:.9rem;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--line);text-align:left;font-size:11px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase"><th style="padding:.5rem 0">Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>' +
        lines.map(function (l) {
          return '<tr style="border-bottom:1px solid rgba(213,205,190,.6)"><td style="padding:.5rem 0"><div style="font-weight:600">' + IC.esc(l.label) + "</div>" +
            (l.detail ? '<div class="tiny">' + IC.esc(l.detail) + "</div>" : "") +
            '</td><td class="tabular">' + IC.esc(l.qty) + " " + IC.esc(l.unit) + '</td><td class="tabular" style="text-align:right">' + IC.money(l.amount) + "</td></tr>";
        }).join("") + "</tbody></table>" +
        '<p class="price-xl" style="text-align:right;margin-top:1.5rem;font-size:1.85rem">' + IC.money(est.computed.total) + "</p>";
    return '<article class="paper-doc" id="quote-sheet"><header class="doc-head"><img src="' + IC.asset("brand/logo.png") + '" alt="" />' +
      '<div style="text-align:right"><p style="font-family:var(--font-display);font-size:1.25rem;color:var(--navy)">Formal quote</p><p class="muted">#' + job.number + "</p></div></header>" +
      '<div style="margin-top:1rem;display:flex;justify-content:space-between;font-size:.9rem"><div><p class="field-label">Prepared for</p><p style="font-weight:600">' + IC.esc(job.customerName) +
      '</p></div><div style="text-align:right"><p class="field-label">From</p><p style="font-weight:600">' + IC.esc(settingsName) + "</p></div></div>" + body + "</article>";
  };
})(window.IC);

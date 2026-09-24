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
      hammer: '<path d="M15 3.5 20.5 9 18 11.5 12.5 6Z"/><path d="M13.2 8.8 5 17l2 2 8.2-8.2"/><path d="M4 20h6"/>',
      finance: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h5"/>',
      pin: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
      nav: '<path d="m4 12 16-8-8 16-1.4-6.6Z"/>',
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

  IC.customerQuoteHtml = function (job, customer, settings) {
    settings = settings || IC.state.settings || IC.SETTINGS;
    var est = job.estimate;
    var c = est && est.computed;
    var sales = IC.jobSalesperson(job);
    var cityLine = IC.companyCityLine(settings);
    var companyPhone = IC.companyPhone(settings);
    var website = IC.companyWebsite(settings);
    var tagline = IC.quoteTagline(job, est);
    var comments = IC.customerQuoteComments(job, est, settings);
    var rows = c ? IC.customerQuoteRows(job, est, settings) : [];
    var total = c ? c.total : 0;
    var listTotal = c && c.listTotal != null ? c.listTotal : total;
    var discountPct = c && c.discountPercent ? c.discountPercent : 0;
    var paid = job.amountPaid != null && job.amountPaid !== "" ? Number(job.amountPaid) : null;
    var custName = customer ? IC.fullName(customer.firstName, customer.lastName) : job.customerName;
    var custPhone = customer && customer.phone ? IC.formatPhone(customer.phone) : "";
    var custStreet = customer && customer.street ? customer.street : "";
    var custCity = customer ? [customer.city, customer.state].filter(Boolean).join(", ") + (customer.zip ? " " + customer.zip : "") : "";

    function cell(v, cls) {
      var shown = v == null || v === "" ? "" : v;
      return '<td class="' + (cls || "") + '">' + shown + "</td>";
    }
    var tableRows = rows.map(function (r) {
      var totalCell = r.total == null || r.total === "" ? "" : IC.money(r.total);
      var qtyLabel = [r.qty, r.unit].filter(function (part) { return part != null && part !== ""; }).join(" ");
      return "<tr>" + cell(IC.esc(qtyLabel), "num") + "<td>" + IC.esc(r.desc) + "</td>" + cell("", "num") + cell(totalCell, "num") + "</tr>";
    }).join("");
    var paidCell = paid != null && Number.isFinite(paid) ? IC.money(paid) : "";
    var dueCell = paid != null && Number.isFinite(paid) ? IC.money(Math.max(0, total - paid)) : "";

    var extraNotes = (comments.extras || []).map(function (p) { return "<p>" + IC.esc(p) + "</p>"; }).join("");

    var salesPhone = (sales && sales.phone) ? IC.formatPhone(sales.phone) : companyPhone;
    var salesEmail = (sales && sales.email) ? sales.email : (settings.email || "");
    var salesName = (sales && (sales.name || sales.salesName)) || settings.legalName || "IRONCLAD Roofing";

    var body = !c
      ? '<p class="muted" style="margin-top:1.5rem">Build an assessment first.</p>'
      : '<section class="est-customer"><div class="est-k">Customer</div>' +
        "<div>" + IC.esc(custName || "") + "</div>" +
        (custPhone ? "<div>" + IC.esc(custPhone) + "</div>" : "") +
        (custStreet ? "<div>" + IC.esc(custStreet) + "</div>" : "") +
        (custCity ? "<div>" + IC.esc(custCity) + "</div>" : "") +
        "</section>" +
        '<section class="est-comments"><p class="est-k">Comments or special instructions</p>' +
        IC.richTextHtml(comments.intro) + extraNotes +
        "</section>" +
        '<table class="est-table"><thead><tr><th>Quantity</th><th>Description</th><th>Unit price</th><th>Total</th></tr></thead><tbody>' +
        tableRows +
        (discountPct > 0
          ? '<tr class="est-discount"><td></td><td>' + discountPct.toFixed(1) + "% discount</td><td></td><td class=\"num\">−" + IC.money(c.discountAmount) + "</td></tr>"
          : "") +
        '<tr class="est-total"><td></td><td></td><td>Total</td><td class="num">' + IC.money(total) + "</td></tr>" +
        '<tr class="est-total"><td></td><td></td><td>Amount paid</td><td class="num">' + paidCell + "</td></tr>" +
        '<tr class="est-total"><td></td><td></td><td>Balance due</td><td class="num">' + dueCell + "</td></tr>" +
        "</tbody></table>" +
        '<p class="est-disclaimer">This is an estimate. Actual cost may increase if additional work or repairs are needed.</p>';

    var showOurs = IC.warrantyIncluded(est, "includeOurWarranty");
    var showMfg = IC.warrantyIncluded(est, "includeMfgWarranty");
    var warrantyHtml = showOurs ? IC.richTextHtml(comments.warranty) : "";
    var mfgHtml = showMfg ? IC.richTextHtml(comments.mfg) : "";
    var head = '<header class="est-head"><div class="est-co">' +
      "<h3>" + IC.esc(settings.legalName || "IRONCLAD Roofing") + "</h3>" +
      '<p class="est-tag">' + IC.esc(tagline) + "</p>" +
      "<span>" + IC.esc(cityLine) + "</span>" +
      "<span>Phone: " + IC.esc(companyPhone) + "</span>" +
      (settings.licenseNumber ? "<span>License: " + IC.esc(settings.licenseNumber) + "</span>" : "") +
      '</div><div class="est-label"><h1>Estimate</h1>' +
      '<p class="tiny">Project #' + IC.esc(String(job.number)) + "</p>" +
      '<p class="tiny">' + IC.esc(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })) + "</p></div></header>";
    var foot = '<footer class="est-foot"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" />' +
      "<div><p style=\"font-weight:700\">" + IC.esc(salesName) + "</p>" +
      (salesPhone ? "<p>Phone: " + IC.esc(salesPhone) + "</p>" : "") +
      (salesEmail ? "<p>" + IC.esc(salesEmail) + "</p>" : "") +
      "<p><a href=\"https://" + IC.esc(website) + "\">" + IC.esc(website) + "</a></p>" +
      "</div></footer>";
    var warrantySections = (warrantyHtml ? '<section class="est-comments"><p class="est-k">Our warranty</p>' + warrantyHtml + "</section>" : "") +
      (mfgHtml ? '<section class="est-comments"' + (warrantyHtml ? ' style="margin-top:1.25rem"' : "") + '><p class="est-k">Manufacturer’s warranty</p>' + mfgHtml + "</section>" : "");
    var warrantyTitle = warrantyHtml && mfgHtml ? "Warranties" : (mfgHtml ? "Manufacturer’s warranty" : "Our warranty");
    var warrantyPage = warrantySections
      ? '<div class="pdf-page pdf-page-break"><header class="est-head"><div class="est-co"><h3>' + IC.esc(settings.legalName || "IRONCLAD Roofing") + '</h3>' +
        "<span>Project #" + IC.esc(String(job.number)) + "</span></div>" +
        '<div class="est-label"><h1>' + warrantyTitle + "</h1></div></header>" +
        warrantySections + "</div>"
      : "";

    return '<article class="paper-doc est-sheet" id="customer-quote-sheet">' +
      '<div class="pdf-page">' + head + body + foot + "</div>" +
      warrantyPage + "</article>";
  };

  IC.companyCityLine = function (s) {
    s = s || (IC.state && IC.state.settings) || IC.SETTINGS;
    var city = s.city || "Albany";
    var st = s.state || "IN";
    var zip = s.zip || "47320";
    return [city, st].filter(Boolean).join(", ") + (zip ? " " + zip : "");
  };

  IC.companyPhone = function (s) {
    s = s || (IC.state && IC.state.settings) || IC.SETTINGS;
    return s.phone || "(765) 789-0558";
  };

  IC.companyWebsite = function (s) {
    s = s || (IC.state && IC.state.settings) || IC.SETTINGS;
    var w = s.website || "https://ironcladroofing.com";
    return String(w).replace(/^https?:\/\//i, "").replace(/\/$/, "") || "ironcladroofing.com";
  };

  IC.quoteTagline = function (job, est) {
    var parts = [];
    if (!job || job.includeRoof !== false) parts.push("Roof Replacement");
    var g = est && IC.normalizeAddon("gutters", est.gutters);
    var s = est && IC.normalizeAddon("siding", est.siding);
    if ((job && job.includeGutters) || (g && g.included)) parts.push("Gutters");
    if ((job && job.includeSiding) || (s && s.included)) parts.push("Siding");
    return parts.join(" · ") || "Roof Replacement";
  };

  IC.fillEstimateText = function (text, vars) {
    var out = String(text == null ? "" : text);
    vars = vars || {};
    Object.keys(vars).forEach(function (k) {
      out = out.split("{" + k + "}").join(vars[k] == null ? "" : String(vars[k]));
    });
    return out;
  };

  IC.richTextHtml = function (text) {
    var lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
    var html = "";
    var list = [];
    function flush() {
      if (!list.length) return;
      html += "<ul>" + list.map(function (item) { return "<li>" + IC.esc(item) + "</li>"; }).join("") + "</ul>";
      list = [];
    }
    lines.forEach(function (line) {
      var bullet = line.match(/^\s*[-*•]\s+(.*)$/);
      if (bullet) { list.push(bullet[1]); return; }
      flush();
      if (line.trim()) html += "<p>" + IC.esc(line.trim()) + "</p>";
    });
    flush();
    return html || "";
  };

  IC.QUOTE_WARRANTY_BULLETS = [
    "130 mph wind warranty.",
    "Level 3 hail impact resistant.",
    "50-year non-prorated manufacturer warranty.",
    "25-year streak fighter warranty.",
  ];

  IC.customerQuoteComments = function (job, est, settings) {
    settings = settings || (IC.state && IC.state.settings) || IC.SETTINGS;
    var shingle = (est && IC.pickName(est, "shingle")) || "Duration";
    var free = Number(settings.sheathingLaborCourtesy);
    if (!Number.isFinite(free) || free < 0) free = 3;
    var years = Number(settings.warrantyWorkmanshipYears);
    if (!Number.isFinite(years) || years < 0) years = 10;
    var vars = { shingle: shingle, years: String(years), courtesy: String(free) };
    var scope = settings.estimateScope || IC.SETTINGS.estimateScope;
    var warranty = settings.estimateWarranty || IC.SETTINGS.estimateWarranty;
    var mfg = settings.mfgWarrantyText || IC.SETTINGS.mfgWarrantyText;
    return {
      intro: IC.fillEstimateText(scope, vars),
      warranty: IC.fillEstimateText(warranty, vars),
      mfg: IC.fillEstimateText(mfg, vars),
      extras: [],
      years: years,
    };
  };

  IC.customerQuoteRows = function (job, est, settings) {
    var rows = [];
    var shingle = IC.pickName(est, "shingle") || "Duration";
    var prices = (est.computed && est.computed.structurePrices) || [];
    var c = est.computed;
    if (c && c.discountPercent > 0 && c.listTotal != null) {
      prices = IC.structurePrices(est.structures, c.listTotal, (c.addonsSubtotal || 0) + (Number(c.deliveryFee) || 0) + (Number(c.equipmentRental) || 0), c.measuredSquares);
    }
    if (!prices.length) {
      rows.push({ qty: "", desc: "Replace roof with " + shingle + " on whole house", unit: "", total: est.computed && est.computed.total });
    } else if (prices.length === 1) {
      rows.push({ qty: "", desc: "Replace roof with " + shingle + " on whole house", unit: "", total: prices[0].price });
    } else {
      prices.forEach(function (p) {
        rows.push({ qty: "", desc: "Replace roof with " + shingle + " on " + (p.name || "structure"), unit: "", total: p.price });
      });
    }
    var measured = c && Number(c.measuredSquares);
    if (measured > 0) rows.push({ qty: measured.toFixed(1), desc: "Measured roof area", unit: "sq", total: null });
    var tearBits = [];
    (est.structures || []).forEach(function (st) {
      IC.structureFacets(st).forEach(function (f) {
        if (f.tearoff && f.tearoff !== "None" && tearBits.indexOf(f.tearoff) < 0) tearBits.push(f.tearoff);
      });
    });
    if (tearBits.length) rows.push({ qty: "", desc: "Tear-off — " + tearBits.join(", "), unit: "", total: null });
    var hip = IC.pickName(est, "hipRidge");
    if (hip && hip !== "—") rows.push({ qty: "", desc: "Hip and ridge — " + hip, unit: "", total: null });
    var pipes = Number(est.pipeBoots) || 0;
    if (pipes > 0) rows.push({ qty: pipes, desc: "Install metal pipe boots", unit: "ea", total: null });
    rows.push({ qty: "", desc: "Inspect and replace flashing as needed", unit: "", total: null });
    rows.push({ qty: "", desc: "Replace gutter apron and drip edge", unit: "", total: null });
    rows.push({ qty: "", desc: "Ice & Water around all eaves, valleys, and where roof meets wall", unit: "", total: null });
    rows.push({ qty: "", desc: "Dispose of old materials", unit: "", total: null });
    var deliveryFee = Number(est.deliveryFee != null ? est.deliveryFee : (c && c.deliveryFee));
    if (Number.isFinite(deliveryFee) && deliveryFee > 0) {
      rows.push({ qty: "", desc: "Delivery fee", unit: "", total: deliveryFee });
    }
    var equipmentRental = Number(c && c.equipmentRental);
    if (!Number.isFinite(equipmentRental)) equipmentRental = Number(est.equipmentRental);
    if (Number.isFinite(equipmentRental) && equipmentRental > 0) {
      rows.push({ qty: "", desc: "Equipment rental", unit: "", total: equipmentRental });
    }
    var gutters = IC.normalizeAddon("gutters", est.gutters);
    if (gutters.included) rows.push({ qty: "", desc: gutters.description, unit: "", total: gutters.price });
    var siding = IC.normalizeAddon("siding", est.siding);
    if (siding.included) rows.push({ qty: "", desc: siding.description, unit: "", total: siding.price });
    return rows;
  };

  IC.jobSheetHtml = function (job, settingsName) {
    var est = job.estimate;
    var lines = IC.jobSheetLines(est);
    var sub = lines.reduce(function (s, l) { return s + (Number(l.amount) || 0); }, 0);
    var settings = (IC.state && IC.state.settings) || IC.SETTINGS;
    var body = !est
      ? '<p class="muted" style="margin-top:1.5rem">Build an assessment first.</p>'
      : '<p class="muted" style="margin-top:1rem">Materials only. For the lumber yard order.</p>' +
        '<table class="est-table"><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>' +
        (lines.length ? lines.map(function (l) {
          return "<tr><td><div style=\"font-weight:600\">" + IC.esc(l.label) + "</div>" +
            (l.detail ? '<div class="tiny">' + IC.esc(l.detail) + "</div>" : "") +
            '</td><td class="num">' + IC.esc(l.qty) + " " + IC.esc(l.unit) + '</td><td class="num">' + IC.money(l.amount) + "</td></tr>";
        }).join("") : '<tr><td colspan="3" class="muted">No material lines yet.</td></tr>') +
        '<tr class="est-total"><td></td><td>Total</td><td class="num">' + IC.money(sub) + "</td></tr>" +
        "</tbody></table>";
    return '<article class="paper-doc est-sheet" id="job-sheet-sheet">' +
      '<header class="est-head"><div class="est-co"><h3>' + IC.esc(settings.legalName || settingsName || "IRONCLAD Roofing") + '</h3>' +
      '<p class="est-tag">Material order</p><span>' + IC.esc(IC.companyCityLine(settings)) + "</span></div>" +
      '<div class="est-label"><h1>Job sheet</h1><p class="tiny">Project #' + IC.esc(String(job.number)) + "</p>" +
      '<p class="tiny">' + IC.esc(job.customerName || "") + "</p></div></header>" +
      body + "</article>";
  };

  IC.navySumHtml = function (c, opts) {
    opts = opts || {};
    var commission = c.commissionAmount || 0;
    var commLabel = c.commissionName
      ? "Sales Commission (" + c.commissionName + " " + (c.commissionPercent || 0) + "%)"
      : "Sales Commission";
    var laborValue = opts.actual !== false
      ? (c.laborCost != null ? c.laborCost : c.laborSubtotal)
      : c.laborSubtotal;
    var profit = opts.actual !== false && c.profitActual != null ? c.profitActual : c.profit;
    if (profit == null) profit = 0;
    var itemSrc = opts.actual !== false && c.costLines ? c.costLines : (c.lines || []);
    if (opts.itemizeSellLabor && c.lines) {
      var sellLabor = c.lines.filter(function (l) {
        return l.key.indexOf("labor-install") === 0 || l.key.indexOf("labor-tearoff") === 0 || l.key === "labor-sheathing" || l.key === "labor-wood";
      });
      itemSrc = sellLabor.concat(itemSrc);
    }
    var taxPct = c.salesTaxPercent != null ? c.salesTaxPercent : 7;
    var deliveryFee = Number(c.deliveryFee);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) deliveryFee = 0;
    var wasteDisposal = Number(c.wasteDisposal);
    if (!Number.isFinite(wasteDisposal) || wasteDisposal < 0) wasteDisposal = 0;
    var tearoffCrew = Number(c.laborCostTearoff);
    if (!Number.isFinite(tearoffCrew) || tearoffCrew < 0) tearoffCrew = 0;
    var accessoryPay = Number(c.laborCostAccessory);
    if (!Number.isFinite(accessoryPay) || accessoryPay < 0) accessoryPay = 0;
    var laborOnly = Number(laborValue) || 0;
    if (opts.actual !== false) {
      laborOnly = Math.round((laborOnly - tearoffCrew - accessoryPay) * 100) / 100;
      if (laborOnly < 0) laborOnly = 0;
    }
    var otherVal = Number(c.otherCost != null ? c.otherCost : c.otherSubtotal) || 0;
    var equipmentRental = Number(c.equipmentRental);
    if (!Number.isFinite(equipmentRental) || equipmentRental < 0) equipmentRental = 0;
    var otherRemainder = Math.round((otherVal - deliveryFee - wasteDisposal - equipmentRental) * 100) / 100;
    if (otherRemainder < 0) otherRemainder = 0;
    var insuranceAmount = Number(c.insuranceAmount);
    if (!Number.isFinite(insuranceAmount) || insuranceAmount < 0) insuranceAmount = 0;
    var insPct = c.insurancePercent != null ? c.insurancePercent : 1;
    var financingAmount = Number(c.financingAmount);
    if (!Number.isFinite(financingAmount) || financingAmount < 0) financingAmount = 0;
    var financePct = c.financingPercent != null ? c.financingPercent : 0;
    var financeLabel = "Financing" + (c.financingName ? " (" + c.financingName + (financePct ? " " + financePct + "%" : "") + ")" : "");
    var materialCost = (Number(c.materialsSubtotal) || 0) + (Number(c.deckingMaterialCost) || 0);
    var laborPrice = Number(c.laborSubtotal) || 0;
    var rows = [
      ["Labor Price", laborPrice],
      ["Materials", materialCost],
    ];
    if (opts.actual !== false) {
      rows.push(["Labor (crew)", laborOnly]);
      if (tearoffCrew > 0) rows.push(["Tear-off (crew)", tearoffCrew]);
      if (accessoryPay > 0) rows.push(["Hip & ridge / starter", accessoryPay]);
    }
    rows.push(
      ["Waste disposal", wasteDisposal],
      ["Delivery fee", deliveryFee]
    );
    if (equipmentRental > 0) rows.push(["Equipment rental", equipmentRental]);
    rows.push(
      [commLabel, commission],
      ["Other", otherRemainder],
      ["Gutters / siding", c.addonsSubtotal],
      ["Sales tax (" + (Number(taxPct) || 0) + "% on material cost)", c.salesTax != null ? c.salesTax : 0],
      ["Insurance (" + (Number(insPct) || 0) + "%)", insuranceAmount],
      ["Manufacturer warranty", Number(c.mfgWarrantyFee) || 0],
      [financeLabel, financingAmount]
    );
    var itemized = opts.itemized !== false
      ? "<ul>" + itemSrc.map(function (l) {
        return "<li><span>" + IC.esc(l.label) + (l.detail ? " — " + IC.esc(l.detail) : "") + " (" + l.qty + " " + IC.esc(l.unit) + ')</span><span class="tabular">' + IC.money(l.amount) + "</span></li>";
      }).join("") + "</ul>"
      : "";
    return '<section class="navy-sum" id="' + (opts.id || "") + '"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px"><div><p class="field-label" style="color:rgba(251,248,241,.7)">' +
      IC.esc(opts.heading || "Proposal total") + '</p><p class="big">' + IC.money(c.total) + "</p></div><p class='tiny' style='color:rgba(251,248,241,.8)'>" +
      (c.measuredSquares || 0).toFixed(1) + " sq measured<br>" + (c.billableSquares || 0).toFixed(1) + " sq labor</p></div>" +
      '<dl style="margin-top:1rem;font-size:.9rem">' +
      rows.map(function (r) {
        return '<div style="display:flex;justify-content:space-between"><dt style="opacity:.8">' + r[0] + '</dt><dd class="tabular">' + IC.money(r[1]) + "</dd></div>";
      }).join("") +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,248,241,.2)"><dt style="font-weight:700">Profit</dt><dd class="tabular" style="font-weight:700">' + IC.money(profit) + "</dd></div>" +
      "</dl>" +
      (opts.commissionNote ? '<p class="tiny" style="margin-top:10px;opacity:.75">' + IC.esc(opts.commissionNote) + "</p>" : "") +
      '<p class="tiny" style="margin-top:10px;opacity:.75">Labor Price is what the customer pays for the work: measured squares at the labor rate, plus hip & ridge and starter at the base rate. Labor (crew) is what the crew is paid, and it does not change Labor Price.</p>' +
      itemized + "</section>";
  };

  IC.jobCostHtml = function (job) {
    var est = job.estimate;
    var c = est && est.computed;
    if (!c) return '<article class="paper-doc" id="job-cost-sheet"><p class="muted">Build an assessment first.</p></article>';
    var settings = (IC.state && IC.state.settings) || IC.SETTINGS;
    var customer = (IC.state.customers || []).find(function (x) { return x.id === job.customerId; });
    var crew = IC.crewForJob(job);
    var sales = IC.jobSalesperson(job);
    function num(v) {
      var n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    function round2(n) { return Math.round(n * 100) / 100; }
    var sell = num(c.total);
    var materials = num(c.materialsSubtotal);
    var decking = num(c.deckingMaterialCost);
    var materialCost = round2(materials + decking);
    var laborCost = num(c.laborCost);
    var accessory = num(c.laborCostAccessory);
    var osbLabor = num(c.osbLaborCost);
    var woodLabor = num(c.woodLaborCost);
    var roofLabor = round2(laborCost - accessory - osbLabor - woodLabor);
    if (roofLabor < 0) roofLabor = 0;
    var waste = num(c.wasteDisposal);
    var delivery = num(c.deliveryFee);
    var equipment = num(c.equipmentRental);
    var otherCost = num(c.otherCost);
    var otherRemainder = round2(otherCost - delivery - waste - equipment);
    if (otherRemainder < 0) otherRemainder = 0;
    var addons = num(c.addonsSubtotal);
    var commission = num(c.commissionAmount);
    var tax = num(c.salesTax);
    var insurance = num(c.insuranceAmount);
    var financing = num(c.financingAmount);
    var mfgWarranty = num(c.mfgWarrantyFee);
    var jobCost = round2(materialCost + laborCost + otherCost + addons + commission + tax + insurance + financing + mfgWarranty);
    var profit = round2(sell - jobCost);
    var profitPct = sell > 0 ? (profit / sell) * 100 : 0;
    var taxPct = c.salesTaxPercent != null ? c.salesTaxPercent : 7;
    var insPct = c.insurancePercent != null ? c.insurancePercent : 1;
    var commPct = c.commissionPercent || 0;
    var commWho = c.commissionName || (sales && (sales.salesName || sales.name)) || "";
    var street = customer && customer.street ? customer.street : "";
    var city = customer ? [customer.city, customer.state].filter(Boolean).join(", ") + (customer.zip ? " " + customer.zip : "") : "";
    var crewName = job.crewId ? (crew && crew.name ? crew.name : "Crew") : "Unassigned";
    var foreman = job.crewId && crew && crew.foreman ? crew.foreman : "";
    var salesName = (sales && (sales.salesName || sales.name)) || "—";
    var prepared = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    function kpi(label, amount, extra, cls) {
      return '<div class="cost-kpi' + (cls ? " " + cls : "") + '"><span>' + label + "</span><strong class=\"tabular\">" + IC.money(amount) + "</strong>" +
        (extra ? "<em>" + extra + "</em>" : "") + "</div>";
    }
    function row(label, amount, note) {
      if (!amount) return "";
      return "<tr><td>" + IC.esc(label) + (note ? '<div class="cost-note">' + note + "</div>" : "") + '</td><td class="num">' + IC.money(amount) + "</td></tr>";
    }
    function detailTable(title, items) {
      if (!items.length) return "";
      return '<h2 class="cost-h">' + title + "</h2>" +
        '<table class="est-table cost-detail"><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>' +
        items.map(function (l) {
          var qty = (l.qty != null ? l.qty : "") + (l.unit ? " " + l.unit : "");
          return "<tr><td>" + IC.esc(l.label) + (l.detail ? '<div class="cost-note">' + IC.esc(l.detail) + "</div>" : "") +
            '</td><td class="num">' + IC.esc(String(qty).trim()) + '</td><td class="num">' + IC.money(l.amount) + "</td></tr>";
        }).join("") + "</tbody></table>";
    }
    var lines = c.costLines || [];
    var laborLines = lines.filter(function (l) { return l.kind === "labor"; });
    var materialLines = lines.filter(function (l) { return l.kind === "material" || l.kind === "decking"; });
    var quoteNote = "";
    if (c.listTotal != null && Math.abs(num(c.listTotal) - sell) > 0.5) {
      quoteNote = "Quoted. Calculated price was " + IC.money(c.listTotal) + ".";
    }
    var profitClass = profit < -0.005 ? "is-neg" : "is-profit";
    var measured = num(c.measuredSquares);
    var profitNote = profitPct.toFixed(1) + "% of sell price" +
      (measured > 0 ? ", approx. " + IC.money(profit / measured) + "/square" : "");

    return '<article class="paper-doc est-sheet cost-report" id="job-cost-sheet">' +
      '<header class="est-head"><div class="est-co"><h3>' + IC.esc(settings.legalName || "IRONCLAD Roofing") + '</h3>' +
      '<p class="est-tag">Internal record</p><span>' + IC.esc(IC.companyCityLine(settings)) + "</span></div>" +
      '<div class="est-label"><h1>Job cost</h1><p class="tiny">Project #' + IC.esc(String(job.number)) + "</p>" +
      '<p class="tiny">Prepared ' + IC.esc(prepared) + "</p></div></header>" +
      '<dl class="cost-meta">' +
      "<div><dt>Customer</dt><dd>" + IC.esc(job.customerName || "") +
        (street ? "<br>" + IC.esc(street) : "") + (city ? "<br>" + IC.esc(city) : "") + "</dd></div>" +
      "<div><dt>Crew</dt><dd>" + IC.esc(crewName) + (foreman ? "<br>" + IC.esc(foreman) : "") +
        (!job.crewId ? '<div class="cost-note">No crew assigned. Labor uses ' + IC.esc(c.crewName || "the default crew") + " rates.</div>" : "") + "</dd></div>" +
      "<div><dt>Sales</dt><dd>" + IC.esc(salesName) + (commPct ? "<br>" + commPct + "% commission" : "") + "</dd></div>" +
      "<div><dt>Schedule</dt><dd>" + IC.esc(job.scheduledDate ? IC.formatDate(job.scheduledDate) : "Not scheduled") + "</dd></div>" +
      "<div><dt>Status</dt><dd>" + IC.esc(job.status || "—") + "</dd></div>" +
      "<div><dt>Roof</dt><dd>" + (num(c.measuredSquares)).toFixed(1) + " sq measured</dd></div>" +
      "</dl>" +
      '<section class="cost-kpis">' +
      kpi("Sell price", sell, quoteNote) +
      kpi("Job cost", jobCost) +
      kpi("Labor cost", laborCost) +
      kpi("Material cost", materialCost) +
      kpi("Profit", profit, profitPct.toFixed(1) + "%", profitClass) +
      "</section>" +
      '<table class="est-table cost-statement"><tbody>' +
      '<tr class="cost-section"><td colspan="2">Revenue</td></tr>' +
      row("Sell price", sell, quoteNote) +
      '<tr class="cost-section"><td colspan="2">Costs</td></tr>' +
      row("Materials", materials) +
      row("Decking", decking) +
      row("Crew labor", roofLabor, "Install and tear-off, paid on measured squares") +
      row("Hip & ridge / starter", accessory, "Bundles ÷ 3, rounded up to a whole square") +
      row("OSB replacement", osbLabor) +
      row("Wood boards", woodLabor) +
      row("Waste disposal", waste) +
      row("Delivery fee", delivery) +
      row("Equipment rental", equipment) +
      row("Dumpster, permit, and extras", otherRemainder) +
      row("Gutters / siding", addons) +
      row(commWho ? "Sales commission (" + commWho + (commPct ? " " + commPct + "%" : "") + ")" : "Sales commission", commission) +
      row("Sales tax (" + (Number(taxPct) || 0) + "% on material cost)", tax) +
      row("Insurance (" + (Number(insPct) || 0) + "%)", insurance) +
      row("Manufacturer warranty", mfgWarranty, c.mfgWarrantyNote || "Paid by Ironclad, not the customer") +
      row("Financing" + (c.financingName ? " (" + c.financingName + (c.financingPercent ? " " + c.financingPercent + "%" : "") + ")" : ""), financing) +
      '<tr class="cost-total"><td>Job cost</td><td class="num">' + IC.money(jobCost) + "</td></tr>" +
      '<tr class="cost-profit ' + profitClass + '"><td>Profit<div class="cost-note">' + profitNote + "</div></td><td class=\"num\">" + IC.money(profit) + "</td></tr>" +
      "</tbody></table>" +
      detailTable("Labor detail", laborLines) +
      detailTable("Material detail", materialLines) +
      '<p class="cost-end">Internal record for the job file. Not a customer document. Profit is sell price minus the costs above.</p></article>';
  };
})(window.IC);

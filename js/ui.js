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
      return "<tr>" + cell(r.qty, "num") + "<td>" + IC.esc(r.desc) + "</td>" + cell(r.unit, "num") + cell(totalCell, "num") + "</tr>";
    }).join("");
    var paidCell = paid != null && Number.isFinite(paid) ? IC.money(paid) : "";
    var dueCell = paid != null && Number.isFinite(paid) ? IC.money(Math.max(0, total - paid)) : "";

    var bullets = (IC.QUOTE_WARRANTY_BULLETS || []).map(function (b) { return "<li>" + IC.esc(b) + "</li>"; }).join("");
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
        "<p>" + IC.esc(comments.intro) + "</p>" + extraNotes +
        "<p>We guarantee our work and back every roof replacement with a " + comments.years + "-year warranty.</p>" +
        (bullets ? "<ul>" + bullets + "</ul>" : "") +
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

    return '<article class="paper-doc est-sheet" id="customer-quote-sheet">' +
      '<header class="est-head"><div class="est-co">' +
      "<h3>IRONCLAD Roofing</h3>" +
      '<p class="est-tag">' + IC.esc(tagline) + "</p>" +
      "<span>" + IC.esc(cityLine) + "</span>" +
      "<span>Phone: " + IC.esc(companyPhone) + "</span>" +
      '</div><div class="est-label"><h1>Estimate</h1>' +
      '<p class="tiny">Project #' + IC.esc(String(job.number)) + "</p></div></header>" +
      body +
      '<footer class="est-foot"><img src="' + IC.asset("brand/logo.png") + '" alt="Ironclad Roofing LLC" />' +
      "<div><p style=\"font-weight:700\">" + IC.esc(salesName) + "</p>" +
      (salesPhone ? "<p>Phone: " + IC.esc(salesPhone) + "</p>" : "") +
      (salesEmail ? "<p>" + IC.esc(salesEmail) + "</p>" : "") +
      "<p><a href=\"https://" + IC.esc(website) + "\">" + IC.esc(website) + "</a></p>" +
      "</div></footer></article>";
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

  IC.QUOTE_WARRANTY_BULLETS = [
    "130 mph wind warranty.",
    "Level 3 hail impact resistant.",
    "50-year non-prorated manufacturer warranty.",
    "25-year streak fighter warranty.",
  ];

  IC.customerQuoteComments = function (job, est, settings) {
    var shingle = (est && IC.pickName(est, "shingle")) || "Duration";
    var sheets = (est && est.structures || []).reduce(function (sum, st) {
      return sum + (Number(st.sheathingSheets) || 0);
    }, 0);
    var allow = sheets > 0 ? sheets : 3;
    var years = (settings && settings.warrantyWorkmanshipYears) || 10;
    var intro = "Entire roof will be removed and replaced with " + shingle +
      " shingles. Additionally, all drip edge and gutter apron will be replaced. Ice & Water Shield will be installed on all eaves, valleys, and along wall transitions and flashings. Synthetic felt paper will be installed on all remaining areas of the roof. In the event of damaged sheeting, we will replace up to " +
      allow + " OSB sheet" + (allow === 1 ? "" : "s") +
      " at no additional cost. Pipe flashing will be replaced with aluminum pipe boots. Wall counter flashing will be custom made from .027 aluminum.";
    var extras = [];
    return { intro: intro, extras: extras, years: years };
  };

  IC.customerQuoteRows = function (job, est, settings) {
    var rows = [];
    var shingle = IC.pickName(est, "shingle") || "Duration";
    var prices = (est.computed && est.computed.structurePrices) || [];
    var c = est.computed;
    if (c && c.discountPercent > 0 && c.listTotal != null) {
      prices = IC.structurePrices(est.structures, c.listTotal, (c.addonsSubtotal || 0) + (Number(c.deliveryFee) || 0), c.measuredSquares);
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
    rows.push({ qty: "", desc: "Replace plastic pipe boots with painted metal ones", unit: "", total: null });
    rows.push({ qty: "", desc: "Inspect and replace flashing as needed", unit: "", total: null });
    rows.push({ qty: "", desc: "Replace gutter apron and drip edge", unit: "", total: null });
    rows.push({ qty: "", desc: "Ice & Water around all eaves, valleys, and where roof meets wall", unit: "", total: null });
    rows.push({ qty: "", desc: "Synthetic felt paper", unit: "", total: null });
    rows.push({ qty: "", desc: "Dispose of old materials", unit: "", total: null });
    var years = (settings && settings.warrantyWorkmanshipYears) || 10;
    rows.push({ qty: "", desc: years + "-year workmanship warranty", unit: "", total: null });
    var deliveryFee = Number(est.deliveryFee != null ? est.deliveryFee : (c && c.deliveryFee));
    if (Number.isFinite(deliveryFee) && deliveryFee > 0) {
      rows.push({ qty: "", desc: "Delivery fee", unit: "", total: deliveryFee });
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
    var body = !est
      ? '<p class="muted" style="margin-top:1.5rem">Build an assessment first.</p>'
      : '<p class="muted" style="margin-top:1rem">Materials only — for the lumber yard order.</p>' +
        '<table style="width:100%;margin-top:1rem;font-size:.9rem;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--line);text-align:left;font-size:11px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase"><th style="padding:.5rem 0">Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>' +
        (lines.length ? lines.map(function (l) {
          return '<tr style="border-bottom:1px solid rgba(213,205,190,.6)"><td style="padding:.5rem 0"><div style="font-weight:600">' + IC.esc(l.label) + "</div>" +
            (l.detail ? '<div class="tiny">' + IC.esc(l.detail) + "</div>" : "") +
            '</td><td class="tabular">' + IC.esc(l.qty) + " " + IC.esc(l.unit) + '</td><td class="tabular" style="text-align:right">' + IC.money(l.amount) + "</td></tr>";
        }).join("") : '<tr><td colspan="3" class="muted" style="padding:1rem 0">No material lines yet.</td></tr>') +
        "</tbody></table>" +
        '<p class="price-xl" style="text-align:right;margin-top:1.5rem;font-size:1.85rem">' + IC.money(sub) + "</p>";
    return '<article class="paper-doc" id="job-sheet-sheet"><header class="doc-head"><img src="' + IC.asset("brand/logo.png") + '" alt="" />' +
      '<div style="text-align:right"><p style="font-family:var(--font-display);font-size:1.25rem;color:var(--navy)">Job sheet</p><p class="muted">#' + job.number + "</p></div></header>" +
      '<div style="margin-top:1rem;display:flex;justify-content:space-between;font-size:.9rem"><div><p class="field-label">Job</p><p style="font-weight:600">' + IC.esc(job.customerName) +
      '</p></div><div style="text-align:right"><p class="field-label">From</p><p style="font-weight:600">' + IC.esc(settingsName) + "</p></div></div>" + body + "</article>";
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
    var taxPct = c.salesTaxPercent != null ? c.salesTaxPercent : 7;
    var rows = [
      ["Materials", c.materialsSubtotal],
      ["Labor & tear-off", laborValue],
      [commLabel, commission],
      ["Sales tax (" + (Number(taxPct) || 0) + "% on material cost)", c.salesTax != null ? c.salesTax : 0],
      ["Other", c.otherCost != null ? c.otherCost : c.otherSubtotal],
      ["Gutters / siding", c.addonsSubtotal],
    ];
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
      itemized + "</section>";
  };

  IC.jobCostHtml = function (job) {
    var est = job.estimate;
    var c = est && est.computed;
    if (!c) return '<article class="paper-doc" id="job-cost-sheet"><p class="muted">Build an assessment first.</p></article>';
    return '<article class="paper-doc job-cost-doc" id="job-cost-sheet"><header class="doc-head"><img src="' + IC.asset("brand/logo.png") + '" alt="" />' +
      '<div style="text-align:right"><p style="font-family:var(--font-display);font-size:1.25rem;color:var(--navy)">Job cost</p><p class="muted">#' + job.number + " · " + IC.esc(job.customerName) + "</p></div></header>" +
      '<div style="margin-top:1.25rem">' + IC.navySumHtml(c, { heading: "Proposed total", id: "", actual: true, commissionNote: "Labor & tear-off here is what we pay the crew (Labor catalog). Proposal total is the customer price. Profit uses actual crew cost, not the Price $/square on Assessment." }) + "</div></article>";
  };
})(window.IC);

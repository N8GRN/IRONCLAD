window.IC = window.IC || {};

(function (IC) {
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function ceilQty(n) { return Math.max(0, Math.ceil(n - 1e-9)); }
  function settingsOf(s) {
    return s || (IC.state && IC.state.settings) || IC.SETTINGS;
  }

  IC.emptyStructure = function (name) {
    return {
      id: IC.uid(),
      name: name || "House",
      type: "Shingle",
      level: "1-Story",
      squares: 20,
      pitch: "4/12 - 7/12",
      tearoff: "1-Layer",
      sheathing: "OSB / Plywood",
      sheathingReplacePct: 10,
      notes: "",
    };
  };

  function emptySnapshot() {
    return {
      lines: [], materialsSubtotal: 0, laborSubtotal: 0, otherSubtotal: 0,
      addonsSubtotal: 0, markupAmount: 0, total: 0, billableSquares: 0, measuredSquares: 0,
    };
  }

  IC.defaultEstimate = function (settings) {
    settings = settingsOf(settings);
    return {
      structures: [IC.emptyStructure("House")],
      materials: [
        { categoryId: "shingle", itemName: "Estate Gray" },
        { categoryId: "hipRidge", itemName: "Estate Gray" },
        { categoryId: "starter", itemName: "Starter Strip Plus" },
        { categoryId: "dripEdge", itemName: "Black" },
        { categoryId: "gutterApron", itemName: "Black" },
        { categoryId: "iceWater", itemName: "Rhino" },
        { categoryId: "felt", itemName: "Rhino" },
        { categoryId: "ridgeVent", itemName: "SkyRunner LTE" },
        { categoryId: "broan", itemName: "4 in" },
        { categoryId: "pipeBoots", itemName: "Black" },
        { categoryId: "flashing", itemName: "Black" },
        { categoryId: "chimney", itemName: "Black" },
        { categoryId: "wallFlashing", itemName: "Black" },
        { categoryId: "lomance", itemName: "Black" },
      ],
      eaveLf: null, rakeLf: null, ridgeLf: null, hipLf: null, valleyLf: null,
      pipeBoots: 4, broanVents: 0, chimneyLf: 0, wallFlashingLf: 0, ridgeVentLf: null,
      dumpster: settings.dumpsterDefault, permit: settings.permitDefault,
      extras: [],
      gutters: { included: false, description: "Seamless gutters and downspouts", price: 0 },
      siding: { included: false, description: "Siding as specified on site", price: 0 },
      notes: "",
      wastePercent: settings.wastePercent,
      markupPercent: settings.markupPercent,
      laborRatePerSquare: settings.laborRatePerSquare,
      tearoffRatePerSquare: settings.tearoffRatePerSquare,
      computed: emptySnapshot(),
      updatedAt: new Date().toISOString(),
    };
  };

  function autoLinear(squares) {
    var area = Math.max(squares, 0) * 100;
    var edge = Math.sqrt(Math.max(area, 1));
    return {
      eaveLf: round1(2.15 * edge),
      rakeLf: round1(1.7 * edge),
      ridgeLf: round1(0.52 * edge),
      hipLf: round1(0.35 * edge),
      valleyLf: round1(0.18 * edge),
    };
  }

  function line(key, label, detail, qty, unit, unitPrice, kind) {
    var q = round2(qty);
    return { key: key, label: label, detail: detail, qty: q, unit: unit, unitPrice: unitPrice, amount: round2(q * unitPrice), kind: kind };
  }

  IC.computeEstimate = function (est, settings) {
    settings = settingsOf(settings);
    var lines = [];
    var measuredSquares = est.structures.reduce(function (s, x) { return s + (Number(x.squares) || 0); }, 0);
    var auto = autoLinear(measuredSquares);
    var eaveLf = est.eaveLf != null ? est.eaveLf : auto.eaveLf;
    var rakeLf = est.rakeLf != null ? est.rakeLf : auto.rakeLf;
    var ridgeLf = est.ridgeLf != null ? est.ridgeLf : auto.ridgeLf;
    var hipLf = est.hipLf != null ? est.hipLf : auto.hipLf;
    var valleyLf = est.valleyLf != null ? est.valleyLf : auto.valleyLf;
    var starterLf = eaveLf + rakeLf;
    var iceSquares = Math.max(eaveLf * 3 + valleyLf * 3, 0) / 100;
    var ridgeVentLf = est.ridgeVentLf != null ? est.ridgeVentLf : ridgeLf;
    var billableSquares = 0, labor = 0, tearoff = 0, sheathingSheets = 0;

    est.structures.forEach(function (st) {
      var sq = Number(st.squares) || 0;
      var pitch = IC.PITCH_FACTOR[st.pitch] || 1.14;
      var waste = 1 + (Number(est.wastePercent) || 0) / 100;
      var billed = sq * pitch * waste;
      billableSquares += billed;
      labor += billed * (Number(est.laborRatePerSquare) || 0) * (IC.STORY_LABOR[st.level] || 1);
      tearoff += sq * (IC.TEAROFF_LAYERS[st.tearoff] || 0) * (Number(est.tearoffRatePerSquare) || 0);
      var sqft = sq * 100 * ((Number(st.sheathingReplacePct) || 0) / 100);
      sheathingSheets += sqft / Math.max(settings.sheathingSqftPerSheet, 1);
    });
    billableSquares = round2(billableSquares);

    var materialQty = {
      shingle: { qty: ceilQty(billableSquares / (1 / 3)), unit: "bundle", need: billableSquares },
      hipRidge: { qty: ceilQty((hipLf + ridgeLf) / 20), unit: "bundle", need: hipLf + ridgeLf },
      starter: { qty: ceilQty(starterLf / 105), unit: "bundle", need: starterLf },
      dripEdge: { qty: ceilQty(eaveLf / 10), unit: "stick", need: eaveLf },
      gutterApron: { qty: ceilQty(eaveLf / 10), unit: "stick", need: eaveLf },
      iceWater: { qty: ceilQty(iceSquares / 2), unit: "roll", need: iceSquares },
      felt: { qty: ceilQty(billableSquares / 4), unit: "roll", need: billableSquares },
      ridgeVent: { qty: ceilQty(ridgeVentLf / 4), unit: "pc", need: ridgeVentLf },
      broan: { qty: est.broanVents, unit: "ea", need: est.broanVents },
      pipeBoots: { qty: est.pipeBoots, unit: "ea", need: est.pipeBoots },
      flashing: { qty: est.structures.length, unit: "box", need: est.structures.length },
      chimney: { qty: ceilQty(est.chimneyLf), unit: "lf", need: est.chimneyLf },
      wallFlashing: { qty: ceilQty(est.wallFlashingLf), unit: "lf", need: est.wallFlashingLf },
      lomance: { qty: 0, unit: "ea", need: 0 },
    };

    ["shingle", "hipRidge", "starter", "dripEdge", "gutterApron", "iceWater", "felt", "ridgeVent", "broan", "pipeBoots", "flashing", "chimney", "wallFlashing", "lomance"].forEach(function (cat) {
      var p = est.materials.find(function (m) { return m.categoryId === cat; });
      var spec = materialQty[cat];
      var category = IC.catalogCategory(cat);
      if (!p || !spec || !category) return;
      var qty = p.qtyOverride != null ? p.qtyOverride : spec.qty;
      if (qty <= 0) return;
      var item = IC.catalogItem(cat, p.itemName);
      if (!item) return;
      var detail = spec.need && category.coverageUnit !== "each"
        ? p.itemName + " · covers " + round1(spec.need) + " " + category.coverageUnit
        : p.itemName;
      lines.push(line("mat-" + cat, category.label, detail, qty, spec.unit, item.price, "material"));
    });

    if (labor > 0) {
      lines.push(line("labor", "Install labor", billableSquares.toFixed(1) + " billable sq after pitch & waste", round2(billableSquares), "sq", round2(labor / Math.max(billableSquares, 0.01)), "labor"));
    }
    if (tearoff > 0) {
      lines.push(line("tearoff", "Tear-off & haul", est.structures.map(function (s) { return s.name + ": " + s.tearoff; }).join("; "), 1, "ls", round2(tearoff), "labor"));
    }
    var sheets = ceilQty(sheathingSheets);
    if (sheets > 0) {
      lines.push(line("sheathing", "Sheathing replacement", sheets + " sheets OSB/plywood", sheets, "sheet", settings.sheathingSheetPrice, "other"));
    }
    if (est.dumpster > 0) lines.push(line("dumpster", "Dumpster", "Debris container", 1, "ea", est.dumpster, "other"));
    if (est.permit > 0) lines.push(line("permit", "Permit", "Building permit allowance", 1, "ea", est.permit, "other"));
    (est.extras || []).forEach(function (extra) {
      if (!extra.label && !extra.amount) return;
      lines.push(line("extra-" + extra.id, extra.label || "Extra", "", 1, "ls", extra.amount, "other"));
    });
    if (est.gutters && est.gutters.included && est.gutters.price) {
      lines.push(line("gutters", "Gutters", est.gutters.description || "Gutters & downspouts", 1, "ls", est.gutters.price, "addon"));
    }
    if (est.siding && est.siding.included && est.siding.price) {
      lines.push(line("siding", "Siding", est.siding.description || "Siding", 1, "ls", est.siding.price, "addon"));
    }

    var materialsSubtotal = round2(lines.filter(function (l) { return l.kind === "material"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var laborSubtotal = round2(lines.filter(function (l) { return l.kind === "labor"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var otherSubtotal = round2(lines.filter(function (l) { return l.kind === "other"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var addonsSubtotal = round2(lines.filter(function (l) { return l.kind === "addon"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var markupAmount = round2(materialsSubtotal * ((Number(est.markupPercent) || 0) / 100));
    if (markupAmount > 0) {
      lines.push(line("markup", "Material margin", est.markupPercent + "% on materials", 1, "ls", markupAmount, "other"));
      otherSubtotal = round2(otherSubtotal + markupAmount);
    }
    var total = round2(materialsSubtotal + laborSubtotal + otherSubtotal + addonsSubtotal);
    return {
      lines: lines, materialsSubtotal: materialsSubtotal, laborSubtotal: laborSubtotal,
      otherSubtotal: otherSubtotal, addonsSubtotal: addonsSubtotal, markupAmount: markupAmount,
      total: total, billableSquares: billableSquares, measuredSquares: measuredSquares,
    };
  };

  IC.withComputed = function (est, settings) {
    var next = Object.assign({}, est);
    next.computed = IC.computeEstimate(est, settings);
    next.updatedAt = new Date().toISOString();
    return next;
  };

  IC.pickName = function (est, categoryId) {
    var p = (est.materials || []).find(function (m) { return m.categoryId === categoryId; });
    return p ? p.itemName : "—";
  };
})(window.IC);

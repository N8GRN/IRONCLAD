window.IC = window.IC || {};

(function (IC) {
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function ceilQty(n) { return Math.max(0, Math.ceil(n - 1e-9)); }
  function settingsOf(s) {
    return s || (IC.state && IC.state.settings) || IC.SETTINGS;
  }

  IC.ADDON_DEFAULTS = {
    gutters: { included: false, description: "Seamless gutters and downspouts", price: 0 },
    siding: { included: false, description: "Siding as specified on site", price: 0 },
  };

  IC.normalizeAddon = function (kind, raw) {
    var d = IC.ADDON_DEFAULTS[kind] || IC.ADDON_DEFAULTS.gutters;
    var o = Object.assign({}, d, raw || {});
    o.included = Boolean(o.included);
    var desc = String(o.description == null ? "" : o.description).trim();
    o.description = desc || d.description;
    var price = Number(o.price);
    o.price = Number.isFinite(price) ? price : 0;
    return o;
  };

  IC.normalizePitch = function (pitch) {
    if (pitch === "2/12 - 3/12") return "2/12 - 3.9/12";
    if (pitch === "0 - 2/12" || pitch === "0/12 - 1.9/12") return "Flat Roof";
    return pitch || "4/12 - 7/12";
  };

  IC.isLowSlopePitch = function (pitch) {
    return IC.normalizePitch(pitch) === "2/12 - 3.9/12";
  };

  IC.isDeadFlatPitch = function (pitch) {
    return IC.normalizePitch(pitch) === "Flat Roof";
  };

  function numRate(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  IC.normalizeLaborRates = function (raw) {
    raw = raw || {};
    var d = IC.DEFAULT_LABOR_RATES;
    var fresh = raw.pitchAdd || raw.layerAdd || raw.storyAdd || raw.flatRate != null;
    var src = fresh ? raw : {};
    var pitchAdd = {};
    var storyAdd = {};
    var layerAdd = {};
    (IC.PITCHES || []).forEach(function (name) {
      pitchAdd[name] = numRate(src.pitchAdd && src.pitchAdd[name], d.pitchAdd[name]);
    });
    (IC.STORIES || ["1-Story", "2-Story", "3-Story"]).forEach(function (name) {
      storyAdd[name] = numRate(src.storyAdd && src.storyAdd[name], d.storyAdd[name]);
    });
    ["1", "2", "3", "4", "5"].forEach(function (n) {
      layerAdd[n] = numRate(src.layerAdd && src.layerAdd[n], d.layerAdd[n]);
    });
    return {
      base: src.base == null || src.base === "" ? d.base : numRate(src.base, d.base),
      flatRate: src.flatRate == null || src.flatRate === "" ? d.flatRate : numRate(src.flatRate, d.flatRate),
      pitchAdd: pitchAdd,
      storyAdd: storyAdd,
      layerAdd: layerAdd,
    };
  };

  IC.normalizeStory = function (level) {
    var stories = IC.STORIES || ["1-Story", "2-Story", "3-Story"];
    return stories.indexOf(level) >= 0 ? level : "1-Story";
  };

  IC.squareRateParts = function (table, pitch, level, tearoff) {
    table = table || {};
    var label = IC.normalizePitch(pitch);
    var storyName = IC.normalizeStory(level);
    var story = Number(table.storyAdd && table.storyAdd[storyName]);
    if (!Number.isFinite(story)) story = 0;
    var flat = IC.isDeadFlatPitch(label);
    var pitchAdd = flat ? 0 : Number(table.pitchAdd && table.pitchAdd[label]);
    if (!Number.isFinite(pitchAdd)) pitchAdd = 0;
    var base = flat ? Number(table.flatRate) : Number(table.base);
    if (!Number.isFinite(base)) base = 0;
    var layers = typeof tearoff === "number" ? tearoff : (IC.TEAROFF_LAYERS[tearoff] || 0);
    var layerAdd = layers > 0 ? Number(table.layerAdd && table.layerAdd[String(layers)]) : 0;
    if (!Number.isFinite(layerAdd)) layerAdd = 0;
    return {
      base: base,
      pitchAdd: pitchAdd,
      storyAdd: story,
      layerAdd: layerAdd,
      flat: flat,
      layers: layers,
      rate: base + pitchAdd + story + layerAdd,
    };
  };

  IC.crewSquareParts = function (labor, pitch, level, tearoff) {
    return IC.squareRateParts(IC.normalizeCrew({ labor: labor || {} }).labor, pitch, level, tearoff);
  };

  IC.crewSquareRate = function (labor, pitch, level, tearoff) {
    return IC.crewSquareParts(labor, pitch, level, tearoff).rate;
  };

  IC.customerSquareParts = function (pitch, level, tearoff, rates) {
    return IC.squareRateParts(IC.normalizeLaborRates(rates), pitch, level, tearoff);
  };

  IC.structureIsAllFlat = function (st) {
    var facets = IC.structureFacets(st);
    return facets.length > 0 && facets.every(function (f) { return IC.isDeadFlatPitch(f.pitch); });
  };

  IC.emptyFacet = function (name, from) {
    from = from || {};
    return {
      id: IC.uid(),
      name: name || "Facet 1",
      squares: Number(from.squares) || 0,
      pitch: IC.normalizePitch(from.pitch || "4/12 - 7/12"),
      tearoff: from.tearoff || "1-Layer",
      level: from.level ? IC.normalizeStory(from.level) : "",
    };
  };

  IC.structureFacets = function (st) {
    st = st || {};
    if (Array.isArray(st.facets) && st.facets.length) {
      return st.facets.map(function (f, i) {
        return {
          id: f.id || ("facet-" + i),
          name: f.name || ("Facet " + (i + 1)),
          squares: Number(f.squares) || 0,
          pitch: IC.normalizePitch(f.pitch || st.pitch || "4/12 - 7/12"),
          tearoff: f.tearoff || st.tearoff || "1-Layer",
          level: IC.normalizeStory(f.level || st.level || "1-Story"),
        };
      });
    }
    return [IC.emptyFacet("Facet 1", st)];
  };

  IC.emptyStructure = function (name) {
    var facet = IC.emptyFacet("Facet 1", { squares: 20, pitch: "4/12 - 7/12", tearoff: "1-Layer" });
    return {
      id: IC.uid(),
      name: name || "House",
      type: "Shingle",
      level: "1-Story",
      squares: 20,
      pitch: "4/12 - 7/12",
      tearoff: "1-Layer",
      sheathing: "OSB / Plywood",
      sheathingSheets: 0,
      woodBoards: 0,
      notes: "",
      facets: [facet],
      eaveLf: null,
      rakeLf: null,
      ridgeLf: null,
      hipLf: null,
      valleyLf: null,
      ridgeVentLf: null,
      ventType: "ridge",
      boxVentQty: 0,
      boxVentColor: "Black",
      sheathingRows: [],
      woodRows: [],
    };
  };

  function deckRow(row, fallbackName) {
    row = row || {};
    var qty = Number(row.qty);
    return {
      id: row.id || IC.uid(),
      itemName: String(row.itemName || fallbackName || "").trim(),
      qty: Number.isFinite(qty) && qty > 0 ? qty : 0,
    };
  }

  IC.deckingRows = function (st, kind) {
    st = st || {};
    var wood = kind === "wood";
    var key = wood ? "woodRows" : "sheathingRows";
    var cat = wood ? "woodBoard" : "sheathing";
    var fallback = wood ? "1 × 6" : "OSB 7/16 × 4 × 8";
    if (Array.isArray(st[key])) {
      return st[key].map(function (row) { return deckRow(row, fallback); });
    }
    var qty = 0;
    var name = fallback;
    if (wood) {
      qty = Number(st.woodBoards) || 0;
    } else if (st.sheathingSheets != null && st.sheathingSheets !== "") {
      qty = Number(st.sheathingSheets) || 0;
      if (/plywood/i.test(st.sheathing || "")) name = "Plywood 7/16 × 4 × 8";
    } else {
      var pct = Number(st.sheathingReplacePct) || 0;
      if (pct > 0) {
        var sq = IC.structureFacets(st).reduce(function (s, f) { return s + (Number(f.squares) || 0); }, 0);
        qty = Math.max(0, Math.ceil((sq * pct) / 32 - 1e-9));
      }
    }
    if (!(qty > 0)) return [];
    var items = IC.catalogActiveItems ? IC.catalogActiveItems(cat) : [];
    var known = items.some(function (it) { return it.name === name; });
    if (!known && items.length) name = items[0].name;
    return [deckRow({ id: (wood ? "wood-" : "sheath-") + (st.id || "legacy"), itemName: name, qty: qty }, fallback)];
  };

  IC.financingPlans = function () {
    var raw = (IC.state && IC.state.settings && IC.state.settings.financingPlans) || IC.SETTINGS.financingPlans || [];
    return (raw || []).map(function (p, i) {
      var pct = Number(p && p.feePercent);
      return {
        id: (p && p.id) || ("plan-" + i),
        name: String((p && p.name) || "Plan").trim() || "Plan",
        feePercent: Number.isFinite(pct) && pct >= 0 ? pct : 0,
        active: !p || p.active !== false,
      };
    });
  };

  IC.activeFinancingPlans = function () {
    return IC.financingPlans().filter(function (p) { return p.active; });
  };

  IC.normalizeFinancing = function (raw) {
    raw = raw || {};
    return {
      included: Boolean(raw.included),
      planId: raw.planId || "",
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
        { categoryId: "shingle", itemName: IC.catalogDefaultName("shingle", "Estate Gray") },
        { categoryId: "hipRidge", itemName: IC.catalogDefaultName("hipRidge", "Estate Gray") },
        { categoryId: "starter", itemName: IC.catalogDefaultName("starter", "Starter Strip Plus") },
        { categoryId: "dripEdge", itemName: IC.catalogDefaultName("dripEdge", "Black") },
        { categoryId: "gutterApron", itemName: IC.catalogDefaultName("gutterApron", "Black") },
        { categoryId: "iceWater", itemName: IC.catalogDefaultName("iceWater", "Rhino") },
        { categoryId: "felt", itemName: IC.catalogDefaultName("felt", "Rhino") },
        { categoryId: "ridgeVent", itemName: IC.catalogDefaultName("ridgeVent", "SkyRunner LTE") },
        { categoryId: "boxVent", itemName: IC.catalogDefaultName("boxVent", "Black") },
        { categoryId: "broan", itemName: IC.catalogDefaultName("broan", "4 in") },
        { categoryId: "pipeBoots", itemName: IC.catalogDefaultName("pipeBoots", "Black") },
        { categoryId: "flashing", itemName: IC.catalogDefaultName("flashing", "Black") },
        { categoryId: "chimney", itemName: IC.catalogDefaultName("chimney", "Black") },
        { categoryId: "wallFlashing", itemName: IC.catalogDefaultName("wallFlashing", "Black") },
        { categoryId: "baseSheet", itemName: IC.catalogDefaultName("baseSheet", "Base Sheet") },
        { categoryId: "capSheet", itemName: IC.catalogDefaultName("capSheet", "MuleHide") },
        { categoryId: "customEdge", itemName: IC.catalogDefaultName("customEdge", "Custom edge metal") },
        { categoryId: "lomance", itemName: IC.catalogDefaultName("lomance", "Black") },
      ],
      eaveLf: null, rakeLf: null, ridgeLf: null, hipLf: null, valleyLf: null,
      pipeBoots: 4, broanBath: 0, broanKitchen: 0, broanVents: 0, chimneyCount: 0, chimneyLf: 0, wallFlashingLf: 0, ridgeVentLf: null,
      dumpster: settings.dumpsterDefault, permit: settings.permitDefault,
      deliveryFee: settings.deliveryFeeDefault != null ? settings.deliveryFeeDefault : 65,
      extras: [],
      gutters: IC.normalizeAddon("gutters", { included: false }),
      siding: IC.normalizeAddon("siding", { included: false }),
      financing: IC.normalizeFinancing(null),
      notes: "",
      wastePercent: settings.wastePercent,
      markupPercent: settings.markupPercent,
      laborRatePerSquare: settings.laborRatePerSquare,
      tearoffRatePerSquare: settings.tearoffRatePerSquare,
      equipmentRental: 0,
      salesTaxPercent: settings.salesTaxPercent != null ? settings.salesTaxPercent : 7,
      quotedTotal: null,
      includeOurWarranty: true,
      includeMfgWarranty: true,
      commissionAmount: 0,
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

  function numOrNull(v) {
    if (v == null || v === "") return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  IC.structureLinears = function (st) {
    var sq = IC.structureFacets(st).reduce(function (s, f) { return s + (Number(f.squares) || 0); }, 0);
    var auto = autoLinear(sq);
    var eave = numOrNull(st.eaveLf);
    var rake = numOrNull(st.rakeLf);
    var ridge = numOrNull(st.ridgeLf);
    var hip = numOrNull(st.hipLf);
    var valley = numOrNull(st.valleyLf);
    var ridgeVent = numOrNull(st.ridgeVentLf);
    if (eave == null) eave = auto.eaveLf;
    if (rake == null) rake = auto.rakeLf;
    if (ridge == null) ridge = auto.ridgeLf;
    if (hip == null) hip = auto.hipLf;
    if (valley == null) valley = auto.valleyLf;
    if (ridgeVent == null) ridgeVent = ridge;
    return { eaveLf: eave, rakeLf: rake, ridgeLf: ridge, hipLf: hip, valleyLf: valley, ridgeVentLf: ridgeVent, squares: sq };
  };

  function withWaste(need, percent) {
    return (Number(need) || 0) * (1 + (Number(percent) || 0) / 100);
  }

  function line(key, label, detail, qty, unit, unitPrice, kind) {
    var q = round2(qty);
    return { key: key, label: label, detail: detail, qty: q, unit: unit, unitPrice: unitPrice, amount: round2(q * unitPrice), kind: kind };
  }

  IC.crewForJob = function (job) {
    var crews = ((IC.state && IC.state.crews) || []).map(IC.normalizeCrew);
    var active = crews.filter(function (c) { return c.active !== false; });
    if (job && job.crewId) {
      var hit = crews.find(function (c) { return c.id === job.crewId; });
      if (hit) return hit;
    }
    return active[0] || crews[0] || IC.normalizeCrew({ id: "default", name: "Crew" });
  };

  IC.crewLaborRates = function (crew) {
    return IC.normalizeCrew(crew).labor;
  };

  IC.tearoffLayerCount = function (label) {
    return IC.TEAROFF_LAYERS[label] || 0;
  };

  IC.computeEstimate = function (est, settings, job) {
    settings = settingsOf(settings);
    var lines = [];
    var measuredSquares = 0, materialSquares = 0, laborSquares = 0;
    var steepSquares = 0, lowSquares = 0, deadFlatSquares = 0;
    var laborCostInstall = 0, laborCostTearoff = 0;
    var wasteDisposal = 0, tearoffLayerSquares = 0;
    var sellLabor = {}, crewPay = {};
    var gutters = IC.normalizeAddon("gutters", est.gutters);
    var siding = IC.normalizeAddon("siding", est.siding);
    var waste = 1 + (Number(est.wastePercent) || 0) / 100;
    var wastePct = Number(est.wastePercent) || 0;
    var tearRate = Number(est.tearoffRatePerSquare) || 0;
    var sellRates = IC.normalizeLaborRates(settings.laborRates);
    var crewRates = IC.crewLaborRates(IC.crewForJob(job));
    function calcNum(key, fallback, allowZero) {
      var n = Number(settings[key]);
      if (!Number.isFinite(n)) return fallback;
      if (allowZero) return n < 0 ? fallback : n;
      return n > 0 ? n : fallback;
    }
    var shinglePerSq = calcNum("shingleBundlesPerSquare", 3);
    var hipPerBundle = calcNum("hipRidgeLfPerBundle", 28);
    var starterPerBundle = calcNum("starterLfPerBundle", 105);
    var stickFeet = calcNum("edgeStickFeet", 10);
    var edgeWaste = 1 + calcNum("edgeWastePercent", 10, true) / 100;
    var dripExtra = calcNum("dripExtraSticks", 1, true);
    var feltPerRoll = calcNum("feltSquaresPerRoll", 10);
    var icePerRoll = calcNum("iceLfPerRoll", 60);
    var icePerLowSq = calcNum("iceRollsPerLowSquare", 0.5);
    var ridgeVentPerRoll = calcNum("ridgeVentLfPerRoll", 30);
    var stepPerBundle = calcNum("stepLfPerBundle", 50);
    var stepPerChimney = calcNum("stepLfPerChimney", 10, true);
    var basePerRoll = calcNum("baseSheetSquaresPerRoll", 1);
    var capPerRoll = calcNum("capSheetSquaresPerRoll", 2);

    var eaveLf = 0, rakeLf = 0, ridgeLf = 0, hipLf = 0, valleyLf = 0, ridgeVentLf = 0;
    var dripSticks = 0, apronSticks = 0, iceLf = 0, customEdgeLf = 0;
    var starterLf = 0, hipRidgeLf = 0;
    var boxByColor = {};

    est.structures.forEach(function (st) {
      var hasSteep = false;
      IC.structureFacets(st).forEach(function (f) {
        var sq = Number(f.squares) || 0;
        var pitchLabel = IC.normalizePitch(f.pitch);
        var level = f.level || IC.normalizeStory(st.level);
        measuredSquares += sq;
        if (IC.isDeadFlatPitch(pitchLabel)) deadFlatSquares += sq;
        else if (IC.isLowSlopePitch(pitchLabel)) lowSquares += sq;
        else { steepSquares += sq; hasSteep = true; }
        laborSquares += sq;
        var layers = IC.TEAROFF_LAYERS[f.tearoff] || 0;
        var laborSq = sq;
        if (sq > 0 && !IC.isDeadFlatPitch(pitchLabel)) laborSq = ceilQty(sq * shinglePerSq) / shinglePerSq;
        if (laborSq > 0) {
          var sell = IC.customerSquareParts(pitchLabel, level, f.tearoff, sellRates);
          var sellKey = level + "|" + pitchLabel + "|" + layers + "|" + sell.rate;
          if (!sellLabor[sellKey]) sellLabor[sellKey] = { sq: 0, rate: sell.rate, level: level, pitch: pitchLabel, layers: layers };
          sellLabor[sellKey].sq += laborSq;
        }
        tearoffLayerSquares += sq * layers;
        wasteDisposal += sq * layers * tearRate;
        if (laborSq > 0) {
          var pay = IC.crewSquareParts(crewRates, pitchLabel, level, f.tearoff);
          var payKey = level + "|" + pitchLabel + "|" + layers + "|" + pay.rate;
          if (!crewPay[payKey]) crewPay[payKey] = { sq: 0, rate: pay.rate, level: level, pitch: pitchLabel, layers: layers };
          crewPay[payKey].sq += laborSq;
          laborCostInstall += laborSq * pay.rate;
        }
      });
      var lin = IC.structureLinears(st);
      eaveLf += lin.eaveLf;
      rakeLf += lin.rakeLf;
      ridgeLf += lin.ridgeLf;
      hipLf += lin.hipLf;
      valleyLf += lin.valleyLf;
      var allFlat = IC.structureIsAllFlat(st);
      if (allFlat) {
        customEdgeLf += lin.eaveLf + lin.rakeLf;
      } else {
        if (lin.rakeLf > 0) dripSticks += ceilQty(lin.rakeLf * edgeWaste / stickFeet) + dripExtra;
        if (lin.eaveLf > 0) apronSticks += ceilQty(lin.eaveLf * edgeWaste / stickFeet);
        starterLf += lin.eaveLf + lin.rakeLf;
        hipRidgeLf += lin.hipLf + lin.ridgeLf;
      }
      if (hasSteep) iceLf += lin.eaveLf + lin.valleyLf;
      var ventType = st.ventType === "box" ? "box" : "ridge";
      if (ventType === "ridge") {
        ridgeVentLf += lin.ridgeLf;
      } else {
        var bq = Number(st.boxVentQty) || 0;
        var bcol = st.boxVentColor || "Black";
        if (bq > 0) boxByColor[bcol] = (boxByColor[bcol] || 0) + bq;
      }
    });
    var shingleSquares = (measuredSquares - deadFlatSquares) * waste;
    materialSquares = round2(shingleSquares);
    laborSquares = round2(laborSquares);
    var billableSquares = laborSquares;
    if (steepSquares > 0) iceLf += 0.5 * (Number(est.wallFlashingLf) || 0);

    var feltNeed = steepSquares;
    var flatNeed = deadFlatSquares * waste;
    var iceNeedRolls = withWaste(lowSquares, wastePct) * icePerLowSq + (iceLf > 0 ? withWaste(iceLf, wastePct) / icePerRoll : 0);
    var broanBath = Number(est.broanBath != null ? est.broanBath : est.broanVents) || 0;
    var broanKitchen = Number(est.broanKitchen) || 0;
    var chimneyCount = Number(est.chimneyCount != null ? est.chimneyCount : 0) || 0;
    var wallLf = Number(est.wallFlashingLf) || 0;
    var stepFlashingLf = wallLf + chimneyCount * stepPerChimney;
    var stepBundles = ceilQty(stepFlashingLf / stepPerBundle);
    var chimneyPrice = Number(settings.chimneyEachPrice);
    if (!Number.isFinite(chimneyPrice) || chimneyPrice < 0) chimneyPrice = 500;

    var materialQty = {
      shingle: { qty: ceilQty(materialSquares * shinglePerSq), unit: "bundle", need: materialSquares },
      hipRidge: { qty: ceilQty(withWaste(hipRidgeLf, wastePct) / hipPerBundle), unit: "bundle", need: withWaste(hipRidgeLf, wastePct) },
      starter: { qty: ceilQty(withWaste(starterLf, wastePct) / starterPerBundle), unit: "bundle", need: withWaste(starterLf, wastePct) },
      dripEdge: { qty: dripSticks, unit: "stick", need: rakeLf },
      gutterApron: { qty: apronSticks, unit: "stick", need: eaveLf },
      iceWater: { qty: ceilQty(iceNeedRolls), unit: "roll", need: iceNeedRolls },
      felt: { qty: ceilQty(feltNeed / feltPerRoll), unit: "roll", need: feltNeed },
      ridgeVent: { qty: ceilQty(ridgeVentLf / ridgeVentPerRoll), unit: "roll", need: ridgeVentLf },
      pipeBoots: { qty: est.pipeBoots, unit: "ea", need: est.pipeBoots },
      flashing: { qty: stepBundles, unit: "bundle", need: stepFlashingLf },
      chimney: { qty: chimneyCount, unit: "ea", need: chimneyCount },
      wallFlashing: { qty: ceilQty(withWaste(est.wallFlashingLf, wastePct)), unit: "lf", need: withWaste(est.wallFlashingLf, wastePct) },
      baseSheet: { qty: ceilQty(flatNeed / basePerRoll), unit: "roll", need: flatNeed },
      capSheet: { qty: ceilQty(flatNeed / capPerRoll), unit: "roll", need: flatNeed },
      customEdge: { qty: ceilQty(withWaste(customEdgeLf, wastePct)), unit: "lf", need: withWaste(customEdgeLf, wastePct) },
      lomance: { qty: 0, unit: "ea", need: 0 },
    };

    ["shingle", "hipRidge", "starter", "dripEdge", "gutterApron", "iceWater", "felt", "ridgeVent", "pipeBoots", "flashing", "chimney", "wallFlashing", "baseSheet", "capSheet", "customEdge", "lomance"].forEach(function (cat) {
      var p = est.materials.find(function (m) { return m.categoryId === cat; });
      var spec = materialQty[cat];
      var category = IC.catalogCategory(cat);
      if (!p || !spec || !category) return;
      var qty = p.qtyOverride != null ? p.qtyOverride : spec.qty;
      if (qty <= 0) return;
      var item = IC.catalogItem(cat, p.itemName);
      if (!item) return;
      var unitPrice = item.price;
      if (cat === "chimney") unitPrice = chimneyPrice;
      var detail = p.itemName;
      if (cat === "iceWater") {
        var bits = [];
        if (lowSquares > 0) bits.push(round1(lowSquares) + " sq at " + icePerLowSq + " roll/sq");
        if (iceLf > 0) bits.push(round1(iceLf) + " lf at " + icePerRoll + " lf/roll");
        if (bits.length) detail = p.itemName + " · " + bits.join(" + ");
      } else if (cat === "flashing") {
        detail = p.itemName + " · " + round1(wallLf) + " lf wall + " + chimneyCount + " chimney × " + stepPerChimney + " lf ÷ " + stepPerBundle + " lf/bundle";
      } else if (cat === "chimney") {
        detail = chimneyCount + " × " + IC.money(chimneyPrice);
      } else if (spec.need && category.coverageUnit !== "each") {
        detail = p.itemName + " · covers " + round1(spec.need) + " " + category.coverageUnit;
      }
      lines.push(line("mat-" + cat, category.label, detail, qty, spec.unit, unitPrice, "material"));
    });

    if (broanBath > 0) {
      var bathItem = IC.catalogItem("broan", "4 in");
      if (bathItem) lines.push(line("mat-broan-4", "Broan 4\" (bath)", bathItem.name, broanBath, "ea", bathItem.price, "material"));
    }
    if (broanKitchen > 0) {
      var kitItem = IC.catalogItem("broan", "8 in");
      if (kitItem) lines.push(line("mat-broan-8", "Broan 8\" (kitchen)", kitItem.name, broanKitchen, "ea", kitItem.price, "material"));
    }
    Object.keys(boxByColor).forEach(function (col) {
      var bItem = IC.catalogItem("boxVent", col);
      if (!bItem) return;
      lines.push(line("mat-boxVent-" + col, "Box vents", bItem.name, boxByColor[col], "ea", bItem.price, "material"));
    });

    function sellDetail(b) {
      var layerNote = b.layers > 0 ? b.layers + "-layer" : "no tear-off";
      return b.level + " · " + b.pitch + " · " + layerNote + " · $" + Number(b.rate).toFixed(2) + "/sq";
    }
    Object.keys(sellLabor).forEach(function (k) {
      var b = sellLabor[k];
      lines.push(line("labor-sell-" + k, "Labor", sellDetail(b), b.sq, "sq", b.rate, "labor"));
    });
    wasteDisposal = round2(wasteDisposal);
    tearoffLayerSquares = round2(tearoffLayerSquares);
    if (wasteDisposal > 0) {
      var wasteNote = est.structures.map(function (s) {
        return s.name + ": " + IC.structureFacets(s).map(function (f) { return f.tearoff; }).join(" / ");
      }).join("; ");
      var wasteLine = line("waste-disposal", "Waste disposal", wasteNote + " · " + round1(tearoffLayerSquares) + " sq-layers × $" + Number(tearRate).toFixed(2), tearoffLayerSquares, "sq-lyr", tearRate, "other");
      lines.push(wasteLine);
      wasteDisposal = wasteLine.amount;
    }
    var deckingMaterialCost = 0;
    var sheets = 0;
    var boards = 0;
    est.structures.forEach(function (st) {
      IC.deckingRows(st, "sheathing").forEach(function (r) {
        if (!(r.qty > 0)) return;
        var item = IC.catalogItem("sheathing", r.itemName);
        var price = item ? Number(item.price) || 0 : 0;
        sheets += r.qty;
        deckingMaterialCost += r.qty * price;
        lines.push(line("deck-sheath-" + r.id, item ? item.name : r.itemName, (st.name || "Structure") + (item && item.sku ? " · " + item.sku : ""), r.qty, "sheet", price, "decking"));
      });
      IC.deckingRows(st, "wood").forEach(function (r) {
        if (!(r.qty > 0)) return;
        var item = IC.catalogItem("woodBoard", r.itemName);
        var price = item ? Number(item.price) || 0 : 0;
        boards += r.qty;
        deckingMaterialCost += r.qty * price;
        lines.push(line("deck-wood-" + r.id, item ? item.name : r.itemName, (st.name || "Structure") + (item && item.sku ? " · " + item.sku : ""), r.qty, "board", price, "decking"));
      });
    });
    sheets = ceilQty(sheets);
    boards = ceilQty(boards);
    deckingMaterialCost = round2(deckingMaterialCost);
    var osbLaborCost = round2(sheets * (Number(crewRates.osbPerSheet) || 0));
    var woodLaborCost = round2(boards * (Number(crewRates.woodPerBoard) || 0));
    function settingNum(key, fallback) {
      var n = Number(settings[key]);
      return Number.isFinite(n) ? n : fallback;
    }
    var sheathRate = settingNum("sheathingLaborPerSheet", 45);
    var sheathFree = settingNum("sheathingLaborCourtesy", 3);
    var woodRate = settingNum("woodLaborPerBoard", 25);
    var woodFree = settingNum("woodLaborCourtesy", 3);
    if (sheathRate < 0) sheathRate = 0;
    if (woodRate < 0) woodRate = 0;
    if (sheathFree < 0) sheathFree = 0;
    if (woodFree < 0) woodFree = 0;
    var sheathBill = Math.max(0, sheets - sheathFree);
    var woodBill = Math.max(0, boards - woodFree);
    if (sheathBill > 0 && sheathRate > 0) {
      lines.push(line("labor-sheathing", "OSB / Plywood install", "First " + sheathFree + " free · " + sheathBill + " × $" + sheathRate.toFixed(2), sheathBill, "sheet", sheathRate, "labor"));
    }
    if (woodBill > 0 && woodRate > 0) {
      lines.push(line("labor-wood", "Wood board install", "First " + woodFree + " free · " + woodBill + " × $" + woodRate.toFixed(2), woodBill, "board", woodRate, "labor"));
    }
    if (est.dumpster > 0) lines.push(line("dumpster", "Dumpster", "Debris container", 1, "ea", est.dumpster, "other"));
    if (est.permit > 0) lines.push(line("permit", "Permit", "Building permit allowance", 1, "ea", est.permit, "other"));
    var deliveryFee = Number(est.deliveryFee);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) deliveryFee = 0;
    if (deliveryFee > 0) lines.push(line("delivery", "Delivery fee", "Material delivery", 1, "ea", deliveryFee, "other"));
    var equipmentRental = Number(est.equipmentRental);
    if (!Number.isFinite(equipmentRental) || equipmentRental < 0) equipmentRental = 0;
    equipmentRental = round2(equipmentRental);
    if (equipmentRental > 0) lines.push(line("equipment", "Equipment rental", "Lift, crane, or other rental — not taxed", 1, "ls", equipmentRental, "other"));
    (est.extras || []).forEach(function (extra) {
      if (!extra.label && !extra.amount) return;
      lines.push(line("extra-" + extra.id, extra.label || "Extra", "", 1, "ls", extra.amount, "other"));
    });
    if (gutters.included) {
      lines.push(line("gutters", "Gutters", gutters.description, 1, "ls", gutters.price, "addon"));
    }
    if (siding.included) {
      lines.push(line("siding", "Siding", siding.description, 1, "ls", siding.price, "addon"));
    }

    var hipLine = null;
    var startLine = null;
    lines.forEach(function (l) {
      if (l.key === "mat-hipRidge") hipLine = l;
      if (l.key === "mat-starter") startLine = l;
    });
    var hipBundles = hipLine ? Number(hipLine.qty) || 0 : 0;
    var starterBundles = startLine ? Number(startLine.qty) || 0 : 0;
    var accessorySquares = (hipBundles + starterBundles) > 0 ? ceilQty((hipBundles + starterBundles) / 3) : 0;
    var accessoryLine = line("crew-accessory", "Hip & ridge / starter", hipBundles + " hip & ridge bundles + " + starterBundles + " starter bundles ÷ 3, rounded up × $" + Number(crewRates.base || 0).toFixed(2), accessorySquares, "sq", Number(crewRates.base) || 0, "labor");
    var sellAccessory = line("labor-accessory", "Hip & ridge / starter", hipBundles + " hip & ridge bundles + " + starterBundles + " starter bundles ÷ 3, rounded up × $" + Number(sellRates.base || 0).toFixed(2), accessorySquares, "sq", Number(sellRates.base) || 0, "labor");
    if (sellAccessory.amount > 0) lines.push(sellAccessory);
    var laborCostAccessory = accessoryLine.amount;
    var materialsSubtotal = round2(lines.filter(function (l) { return l.kind === "material"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var laborSubtotal = round2(lines.filter(function (l) { return l.kind === "labor"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var otherSubtotal = round2(lines.filter(function (l) { return l.kind === "other"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var addonsSubtotal = round2(lines.filter(function (l) { return l.kind === "addon"; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var markupAmount = round2(materialsSubtotal * ((Number(est.markupPercent) || 0) / 100));
    if (markupAmount > 0) {
      lines.push(line("markup", "Material margin", est.markupPercent + "% on materials", 1, "ls", markupAmount, "other"));
      otherSubtotal = round2(otherSubtotal + markupAmount);
    }
    var taxPct = est.salesTaxPercent;
    if (taxPct == null || taxPct === "") taxPct = settings.salesTaxPercent;
    if (taxPct == null || taxPct === "") taxPct = 7;
    taxPct = Number(taxPct);
    if (!Number.isFinite(taxPct) || taxPct < 0) taxPct = 0;
    // Tax is on material COST (catalog prices) only — not on material margin, labor, permit, or delivery.
    var salesTax = round2(materialsSubtotal * (taxPct / 100));
    var extrasTotal = round2(lines.filter(function (l) { return l.key.indexOf("extra-") === 0; }).reduce(function (s, l) { return s + l.amount; }, 0));
    var jobSubtotal = round2(materialsSubtotal + laborSubtotal + otherSubtotal + addonsSubtotal + salesTax);
    var insPct = settings.insurancePercent;
    if (insPct == null || insPct === "") insPct = 1;
    insPct = Number(insPct);
    if (!Number.isFinite(insPct) || insPct < 0) insPct = 0;
    var insuranceBase = round2(jobSubtotal - extrasTotal);
    if (insuranceBase < 0) insuranceBase = 0;
    var insuranceAmount = round2(insuranceBase * (insPct / 100));
    var preFinance = round2(jobSubtotal + insuranceAmount);
    var finance = IC.normalizeFinancing(est.financing);
    var financePlan = null;
    if (finance.included) {
      var plans = IC.activeFinancingPlans();
      financePlan = plans.find(function (p) { return p.id === finance.planId; }) || plans[0] || null;
    }
    var financePct = financePlan ? financePlan.feePercent : 0;
    var quotedRaw = est.quotedTotal;
    var quoteBase = (quotedRaw == null || quotedRaw === "") ? preFinance : round2(Number(quotedRaw) || 0);
    if (!Number.isFinite(quoteBase) || quoteBase < 0) quoteBase = preFinance;
    var listTotal = preFinance;
    var total = quoteBase;
    var financingAmount = round2(total * (financePct / 100));
    var discountAmount = round2(listTotal - total);
    var discountPercent = listTotal > 0 && discountAmount > 0.005 ? round2((discountAmount / listTotal) * 100) : 0;
    var salePrice = total;
    var mfgWarranty = IC.manufacturerWarrantyFee(measuredSquares, settings);
    var mfgWarrantyFee = IC.warrantyIncluded(est, "includeMfgWarranty") ? mfgWarranty.amount : 0;
    var comm = IC.salespersonCommission(job, salePrice);
    var commission = comm.amount;
    var otherCost = round2(otherSubtotal - (markupAmount || 0));
    var laborCost = round2(laborCostInstall + laborCostTearoff + osbLaborCost + woodLaborCost + laborCostAccessory);
    var profitBilled = round2(total - materialsSubtotal - deckingMaterialCost - laborSubtotal - otherCost - addonsSubtotal - commission - salesTax - insuranceAmount - financingAmount - mfgWarrantyFee);
    var profitActual = round2(total - materialsSubtotal - deckingMaterialCost - laborCost - otherCost - addonsSubtotal - commission - salesTax - insuranceAmount - financingAmount - mfgWarrantyFee);
    var structurePrices = IC.structurePrices(est.structures, salePrice, addonsSubtotal + deliveryFee + equipmentRental, measuredSquares);

    var costLines = lines.filter(function (l) {
      return l.key !== "labor" && l.key.indexOf("labor-") !== 0;
    }).slice();
    var crewLines = [];
    Object.keys(crewPay).forEach(function (k) {
      var b = crewPay[k];
      var layerNote = b.layers > 0 ? b.layers + "-layer" : "no tear-off";
      crewLines.push(line("crew-pay-" + k, "Crew labor", b.level + " · " + b.pitch + " · " + layerNote + " · $" + Number(b.rate).toFixed(2) + "/sq", b.sq, "sq", b.rate, "labor"));
    });
    costLines = crewLines.concat(costLines);
    if (laborCostAccessory > 0) costLines.push(accessoryLine);
    if (osbLaborCost > 0) {
      costLines.push(line("osb-labor", "OSB replacement (crew)", sheets + " sheets", sheets, "sheet", Number(crewRates.osbPerSheet) || 0, "labor"));
    }
    if (woodLaborCost > 0) {
      costLines.push(line("wood-labor", "Wood boards (crew)", boards + " boards", boards, "board", Number(crewRates.woodPerBoard) || 0, "labor"));
    }
    if (insuranceAmount > 0) {
      costLines.push(line("insurance", "Insurance", insPct + "% of job price", 1, "ls", insuranceAmount, "other"));
    }
    if (mfgWarrantyFee > 0) {
      costLines.push(line("mfg-warranty", "Manufacturer warranty", mfgWarranty.note, 1, "ls", mfgWarrantyFee, "other"));
    }
    if (financingAmount > 0) {
      costLines.push(line("financing", "Financing", (financePlan ? financePlan.name + " · " : "") + financePct + "%", 1, "ls", financingAmount, "other"));
    }

    return {
      lines: lines, costLines: costLines,
      materialsSubtotal: materialsSubtotal, laborSubtotal: laborSubtotal, laborCost: laborCost,
      laborCostInstall: round2(laborCostInstall), laborCostTearoff: round2(laborCostTearoff),
      laborCostAccessory: laborCostAccessory,
      osbLaborCost: osbLaborCost, woodLaborCost: woodLaborCost,
      deckingMaterialCost: deckingMaterialCost,
      otherSubtotal: otherSubtotal, addonsSubtotal: addonsSubtotal, markupAmount: markupAmount,
      salesTax: salesTax, salesTaxPercent: taxPct,
      deliveryFee: deliveryFee,
      equipmentRental: equipmentRental,
      wasteDisposal: wasteDisposal,
      insuranceAmount: insuranceAmount, insurancePercent: insPct,
      mfgWarrantyFee: mfgWarrantyFee, mfgWarrantyNote: mfgWarranty.note,
      financingAmount: financingAmount, financingPercent: financePct,
      financingName: financePlan ? financePlan.name : "",
      preFinance: preFinance, quoteBase: quoteBase,
      total: total, listTotal: listTotal, quotedTotal: salePrice,
      discountPercent: discountPercent, discountAmount: discountAmount,
      billableSquares: billableSquares, measuredSquares: measuredSquares,
      materialSquares: materialSquares, laborSquares: laborSquares,
      commissionAmount: commission, commissionPercent: comm.percent, commissionName: comm.name,
      otherCost: otherCost, profit: profitBilled, profitActual: profitActual,
      structurePrices: structurePrices,
      crewId: IC.crewForJob(job).id, crewName: IC.crewLabel(IC.crewForJob(job)),
    };
  };

  IC.manufacturerWarrantyFee = function (squares, settings) {
    settings = settings || (IC.state && IC.state.settings) || IC.SETTINGS;
    var sq = Number(squares) || 0;
    if (!Number.isFinite(sq) || sq < 0) sq = 0;
    function num(key, fallback) {
      var n = Number(settings[key]);
      return Number.isFinite(n) ? n : fallback;
    }
    var minSq = num("mfgWarrantyMinSq", 25);
    var maxSq = num("mfgWarrantyMaxSq", 100);
    var flat = num("mfgWarrantyFlat", 75);
    var perSq = num("mfgWarrantyPerSq", 3);
    if (flat < 0) flat = 0;
    if (perSq < 0) perSq = 0;
    if (sq >= minSq && sq <= maxSq) {
      return { amount: round2(flat), note: "Flat fee, " + minSq + "–" + maxSq + " sq. Paid by Ironclad." };
    }
    return { amount: round2(sq * perSq), note: "$" + perSq.toFixed(2) + "/sq × " + sq.toFixed(1) + " sq measured. Paid by Ironclad." };
  };

  IC.salespersonCommission = function (job, total) {
    var person = IC.jobSalesperson(job);
    var pct = IC.commissionRate(person);
    return {
      percent: pct,
      amount: round2((Number(total) || 0) * pct / 100),
      name: person ? (person.salesName || person.name || "") : "",
      personId: person ? person.id : "",
    };
  };

  IC.structurePrices = function (structures, total, addonsSubtotal, measuredSquares) {
    var roof = round2((Number(total) || 0) - (Number(addonsSubtotal) || 0));
    var measured = Number(measuredSquares) || 0;
    return (structures || []).map(function (st) {
      var sq = IC.structureFacets(st).reduce(function (s, f) { return s + (Number(f.squares) || 0); }, 0);
      var share = measured > 0 ? round2(roof * (sq / measured)) : 0;
      return { id: st.id, name: st.name || "Structure", squares: sq, price: share };
    });
  };

  IC.ensureEstimateMaterials = function (est) {
    var mats = ((est && est.materials) || []).slice();
    var have = {};
    mats.forEach(function (m) { if (m && m.categoryId) have[m.categoryId] = true; });
    (IC.liveCatalog() || IC.CATALOG || []).forEach(function (cat) {
      if (have[cat.id]) return;
      mats.push({ categoryId: cat.id, itemName: IC.catalogDefaultName(cat.id) });
    });
    return mats;
  };

  IC.jobSheetLines = function (est) {
    var lines = (est && est.computed && est.computed.lines) || [];
    return lines.filter(function (l) {
      if (l.key === "mat-chimney") return false;
      return l.kind === "material" || l.kind === "decking" || l.key === "sheathing";
    });
  };

  IC.withComputed = function (est, settings, job) {
    var next = Object.assign({}, est);
    next.gutters = IC.normalizeAddon("gutters", est.gutters);
    next.siding = IC.normalizeAddon("siding", est.siding);
    next.financing = IC.normalizeFinancing(est.financing);
    next.structures = (est.structures || []).map(function (st, i) {
      var n = Object.assign({}, st);
      n.facets = IC.structureFacets(st);
      n.squares = n.facets.reduce(function (s, f) { return s + (Number(f.squares) || 0); }, 0);
      n.ventType = n.ventType === "box" ? "box" : "ridge";
      if (n.boxVentQty == null) n.boxVentQty = 0;
      if (!n.boxVentColor) n.boxVentColor = "Black";
      n.sheathingRows = IC.deckingRows(st, "sheathing");
      n.woodRows = IC.deckingRows(st, "wood");
      if (i === 0) {
        ["eaveLf", "rakeLf", "ridgeLf", "hipLf", "valleyLf", "ridgeVentLf"].forEach(function (k) {
          if (numOrNull(n[k]) == null && numOrNull(est[k]) != null) n[k] = est[k];
        });
      }
      return n;
    });
    next.materials = IC.ensureEstimateMaterials(next);
    if (next.broanBath == null) next.broanBath = Number(next.broanVents) || 0;
    if (next.broanKitchen == null) next.broanKitchen = 0;
    if (next.chimneyCount == null) next.chimneyCount = 0;
    if (next.salesTaxPercent == null || next.salesTaxPercent === "") {
      next.salesTaxPercent = settingsOf(settings).salesTaxPercent != null ? settingsOf(settings).salesTaxPercent : 7;
    }
    if (next.deliveryFee == null || next.deliveryFee === "") {
      var feeDef = settingsOf(settings).deliveryFeeDefault;
      next.deliveryFee = feeDef != null && feeDef !== "" ? Number(feeDef) : 65;
      if (!Number.isFinite(next.deliveryFee) || next.deliveryFee < 0) next.deliveryFee = 65;
    }
    var rental = Number(next.equipmentRental);
    if (!Number.isFinite(rental) || rental < 0) next.equipmentRental = 0;
    next.computed = IC.computeEstimate(next, settings, job);
    next.updatedAt = new Date().toISOString();
    return next;
  };

  IC.warrantyIncluded = function (est, key) {
    if (!est || est[key] == null || est[key] === "") return true;
    return est[key] !== false && est[key] !== "false";
  };

  IC.pickName = function (est, categoryId) {
    var p = (est.materials || []).find(function (m) { return m.categoryId === categoryId; });
    return p ? p.itemName : "—";
  };
})(window.IC);

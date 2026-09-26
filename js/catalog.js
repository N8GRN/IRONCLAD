window.IC = window.IC || {};

(function (IC) {
  const colors = [
    "Brownwood", "Estate Gray", "Sierra Gray", "Desert Tan", "Colonial Slate", "Teak",
    "Chateau Green", "Driftwood", "Terra Cotta", "Onyx Black", "Slatestone Gray",
    "Desert Rose", "Midnight Plum", "Peppercorn", "Sandcastle", "Williamsburg Gray", "Black Sable",
  ].map(function (name) { return { name: name, price: 38, sku: "" }; });

  const hip = colors.map(function (c) { return { name: c.name, price: 71.5, sku: "" }; });
  const metal = ["Black", "Brown", "Clay", "Cobblestone", "White"].map(function (name) {
    return { name: name, price: 8.15, sku: "" };
  });

  IC.CATALOG = [
    { id: "shingle", label: "Shingles", soldAs: "bundle", coverageAmount: 1 / 3, coverageUnit: "square", items: colors },
    { id: "hipRidge", label: "Hip & Ridge", soldAs: "bundle", coverageAmount: 28, coverageUnit: "lf", items: hip },
    { id: "starter", label: "Starter", soldAs: "bundle", coverageAmount: 105, coverageUnit: "lf", items: [{ name: "Starter Strip Plus", price: 51, sku: "" }] },
    { id: "dripEdge", label: "Drip Edge", soldAs: "10 ft stick", coverageAmount: 10, coverageUnit: "lf", items: metal },
    { id: "gutterApron", label: "Gutter Apron", soldAs: "10 ft stick", coverageAmount: 10, coverageUnit: "lf", items: metal },
    { id: "iceWater", label: "Ice & Water", soldAs: "roll", coverageAmount: 60, coverageUnit: "lf", items: [{ name: "Rhino", price: 81.37, sku: "" }] },
    { id: "felt", label: "Felt / Synthetic", soldAs: "roll", coverageAmount: 10, coverageUnit: "square", items: [{ name: "Rhino", price: 75, sku: "" }] },
    { id: "ridgeVent", label: "Ridge vent", soldAs: "roll", coverageAmount: 30, coverageUnit: "lf", items: [{ name: "SkyRunner LTE", price: 88, sku: "" }] },
    { id: "boxVent", label: "Box vents", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: metal.map(function (c) { return { name: c.name, price: 18, sku: "" }; }) },
    { id: "broan", label: "Broan vents", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "4 in", price: 23, sku: "" }, { name: "8 in", price: 40, sku: "" }] },
    { id: "pipeBoots", label: "Pipe Boots", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "Black", price: 16.69, sku: "" }, { name: "Brown", price: 16.69, sku: "" }] },
    { id: "flashing", label: "Step flashing", soldAs: "bundle", coverageAmount: 50, coverageUnit: "lf", items: [{ name: "Black", price: 75, sku: "" }, { name: "Brown", price: 75, sku: "" }, { name: "White", price: 75, sku: "" }] },
    { id: "chimney", label: "Chimneys", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "Chimney", price: 500, sku: "" }] },
    { id: "wallFlashing", label: "Wall flashing", soldAs: "lf", coverageAmount: 1, coverageUnit: "lf", items: [{ name: "Black", price: 2.05, sku: "" }, { name: "Brown", price: 2.05, sku: "" }, { name: "White", price: 2.05, sku: "" }, { name: "Other", price: 2.05, sku: "" }] },
    { id: "baseSheet", label: "Flat roof — Base sheet", soldAs: "roll", coverageAmount: 1, coverageUnit: "square", items: [{ name: "Base Sheet", price: 147.75, sku: "" }] },
    { id: "capSheet", label: "Flat roof — Cap sheet", soldAs: "roll", coverageAmount: 2, coverageUnit: "square", items: [{ name: "MuleHide", price: 165.25, sku: "" }] },
    { id: "customEdge", label: "Flat roof — Custom edge metal", soldAs: "lf", coverageAmount: 1, coverageUnit: "lf", items: [{ name: "Custom edge metal", price: 1.03, sku: "" }] },
    { id: "lomance", label: "Lomanco 750", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "Black", price: 23.8, sku: "" }, { name: "Brown", price: 23.8, sku: "" }] },
    { id: "skylight", label: "Skylights", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [
      { name: "Fixed 22 × 22", price: 450, sku: "" },
      { name: "Fixed 22 × 46", price: 625, sku: "" },
      { name: "Fixed 30 × 46", price: 900, sku: "" },
      { name: "Manual vent 22 × 46", price: 800, sku: "" },
      { name: "Solar vent 22 × 46", price: 1175, sku: "" },
    ] },
    { id: "sheathing", label: "OSB / Plywood", soldAs: "sheet", coverageAmount: 32, coverageUnit: "sq ft", items: [
      { name: "OSB 7/16 × 4 × 8", price: 68, sku: "" },
      { name: "Plywood 7/16 × 4 × 8", price: 68, sku: "" },
    ] },
    { id: "woodBoard", label: "Wood boards", soldAs: "board", coverageAmount: 1, coverageUnit: "each", items: [
      { name: "1 × 4", price: 0, sku: "" },
      { name: "1 × 6", price: 0, sku: "" },
      { name: "1 × 8", price: 0, sku: "" },
      { name: "1 × 10", price: 0, sku: "" },
      { name: "1 × 12", price: 0, sku: "" },
    ] },
  ];

  IC.PITCH_FACTOR = {
    "Flat Roof": 1.02, "0/12 - 1.9/12": 1.02, "0 - 2/12": 1.02, "2/12 - 3.9/12": 1.06, "2/12 - 3/12": 1.06, "4/12 - 7/12": 1.14,
    "8/12 - 9/12": 1.25, "10/12 - 11/12": 1.38, "12/12 - 13/12": 1.5,
  };
  IC.STORY_LABOR = { "1-Story": 1, "2-Story": 1.18, "3-Story": 1.35 };
  IC.TEAROFF_LAYERS = { None: 0, "1-Layer": 1, "2-Layer": 2, "3-Layer": 3, "4-Layer": 4, "5-Layer": 5 };

  function slug(s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  }

  IC.normalizeItem = function (catId, it, index) {
    it = it || {};
    return {
      id: it.id || catId + "::" + slug(it.name || index),
      name: String(it.name || "Untitled").trim() || "Untitled",
      price: Number.isFinite(Number(it.price)) ? Number(it.price) : 0,
      sku: String(it.sku || "").trim(),
      active: it.active !== false,
    };
  };

  IC.ensureCatalog = function (saved) {
    var incoming = saved;
    if (saved && !Array.isArray(saved) && Array.isArray(saved.catalog)) incoming = saved.catalog;
    var byId = {};
    (incoming || []).forEach(function (c) { if (c && c.id) byId[c.id] = c; });
    return IC.CATALOG.map(function (def) {
      var have = byId[def.id];
      var items = have && have.items && have.items.length ? have.items : def.items;
      if (def.id === "chimney" && items.length && items.every(function (it) { return Number(it.price) < 50; })) {
        items = def.items;
      }
      if (def.id === "skylight") {
        var onlyLegacy = items.length && items.every(function (it) {
          return String(it.name || "").trim().toLowerCase() === "skylight";
        });
        if (onlyLegacy) {
          items = def.items;
        } else {
          def.items.forEach(function (seed) {
            var exists = items.some(function (it) { return String(it.name || "").trim() === seed.name; });
            if (!exists) items = items.concat([seed]);
          });
        }
      }
      return {
        id: def.id,
        label: def.label,
        soldAs: def.soldAs,
        coverageAmount: def.coverageAmount,
        coverageUnit: def.coverageUnit,
        items: items.map(function (it, i) { return IC.normalizeItem(def.id, it, i); }),
      };
    });
  };

  IC.liveCatalog = function () {
    if (IC.state && IC.state.catalog && IC.state.catalog.length) return IC.state.catalog;
    return IC.ensureCatalog(null);
  };

  IC.catalogCategory = function (id) {
    return IC.liveCatalog().find(function (c) { return c.id === id; });
  };

  IC.catalogActiveItems = function (categoryId) {
    var cat = IC.catalogCategory(categoryId);
    if (!cat) return [];
    return cat.items.filter(function (i) { return i.active !== false; });
  };

  IC.catalogItem = function (categoryId, name) {
    var cat = IC.catalogCategory(categoryId);
    if (!cat) return null;
    var hit = cat.items.find(function (i) { return i.name === name; });
    if (hit) return hit;
    var active = cat.items.filter(function (i) { return i.active !== false; });
    return active[0] || cat.items[0] || null;
  };

  IC.catalogDefaultName = function (categoryId, fallback) {
    var items = IC.catalogActiveItems(categoryId);
    if (items.length) {
      var prefer = items.find(function (i) { return i.name === fallback; });
      return (prefer || items[0]).name;
    }
    return fallback;
  };
})(window.IC);

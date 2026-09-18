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
    { id: "hipRidge", label: "Hip & Ridge", soldAs: "bundle", coverageAmount: 20, coverageUnit: "lf", items: hip },
    { id: "starter", label: "Starter", soldAs: "bundle", coverageAmount: 105, coverageUnit: "lf", items: [{ name: "Starter Strip Plus", price: 51, sku: "" }] },
    { id: "dripEdge", label: "Drip Edge", soldAs: "10 ft stick", coverageAmount: 10, coverageUnit: "lf", items: metal },
    { id: "gutterApron", label: "Gutter Apron", soldAs: "10 ft stick", coverageAmount: 10, coverageUnit: "lf", items: metal },
    { id: "iceWater", label: "Ice & Water", soldAs: "roll", coverageAmount: 2, coverageUnit: "square", items: [{ name: "Rhino", price: 81.37, sku: "" }] },
    { id: "felt", label: "Felt / Synthetic", soldAs: "roll", coverageAmount: 4, coverageUnit: "square", items: [{ name: "Rhino", price: 75, sku: "" }] },
    { id: "ridgeVent", label: "Ridge Vent", soldAs: "4 ft piece", coverageAmount: 4, coverageUnit: "lf", items: [{ name: "SkyRunner LTE", price: 88, sku: "" }] },
    { id: "broan", label: "Broan Vents", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "4 in", price: 23, sku: "" }, { name: "8 in", price: 40, sku: "" }] },
    { id: "pipeBoots", label: "Pipe Boots", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "Black", price: 16.69, sku: "" }, { name: "Brown", price: 16.69, sku: "" }] },
    { id: "flashing", label: "Step Flashing kit", soldAs: "box", coverageAmount: 1, coverageUnit: "each", items: [{ name: "Black", price: 75, sku: "" }, { name: "Brown", price: 75, sku: "" }, { name: "White", price: 75, sku: "" }] },
    { id: "chimney", label: "Chimney flashing", soldAs: "lf", coverageAmount: 1, coverageUnit: "lf", items: [{ name: "Black", price: 2.05, sku: "" }, { name: "Brown", price: 2.05, sku: "" }, { name: "White", price: 2.05, sku: "" }, { name: "Other", price: 2.05, sku: "" }] },
    { id: "wallFlashing", label: "Wall flashing", soldAs: "lf", coverageAmount: 1, coverageUnit: "lf", items: [{ name: "Black", price: 2.05, sku: "" }, { name: "Brown", price: 2.05, sku: "" }, { name: "White", price: 2.05, sku: "" }, { name: "Other", price: 2.05, sku: "" }] },
    { id: "lomance", label: "Lomanco 750", soldAs: "each", coverageAmount: 1, coverageUnit: "each", items: [{ name: "Black", price: 23.8, sku: "" }, { name: "Brown", price: 23.8, sku: "" }] },
  ];

  IC.PITCH_FACTOR = {
    "0 - 2/12": 1.02, "2/12 - 3/12": 1.06, "4/12 - 7/12": 1.14,
    "8/12 - 9/12": 1.25, "10/12 - 11/12": 1.38, "12/12 - 13/12": 1.5,
  };
  IC.STORY_LABOR = { "1-Story": 1, "2-Story": 1.18, "3-Story": 1.35 };
  IC.TEAROFF_LAYERS = { None: 0, "1-Layer": 1, "2-Layer": 2, "3-Layer": 3, "4-Layer": 4, "5-Layer": 5 };

  IC.catalogCategory = function (id) {
    return IC.CATALOG.find(function (c) { return c.id === id; });
  };
  IC.catalogItem = function (categoryId, name) {
    var cat = IC.catalogCategory(categoryId);
    if (!cat) return null;
    return cat.items.find(function (i) { return i.name === name; }) || cat.items[0];
  };
})(window.IC);
